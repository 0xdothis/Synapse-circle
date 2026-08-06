import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { OAuth2Client } from "google-auth-library";
import User from "../models/User.js";
import TrustedContact from "../models/TrustedContact.js";
import OTP from "../models/OTP.js";
import emailService from "./emailService.js";
import config from "../utils/config.js";
import { logger } from "../utils/logger.js";
import {
  createSession,
  rotateSession,
  revokeSession,
  revokeAllSessions,
} from "./sessionService.js";
import { processOnboardingContacts } from "../utils/contactHelper.js";

const googleClient = new OAuth2Client(config.googleClientId);

const STEP_ORDER = [
  "welcome",
  "location",
  "contacts",
  "university",
  "complete",
];

const PASSWORD_PATTERN = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/;

/**
 * Create a session (access + refresh token) for a user.
 * `emailVerified` gets baked into the JWT claims so downstream
 * middleware can gate specific routes on verification status without
 * an extra DB round trip.
 */
const createUserSession = async (
  { userId, email, role = "user", emailVerified = false },
  meta = {},
) => {
  return createSession(userId, email, role, emailVerified, meta);
};

const buildUserResponse = (user) => {
  const response = {
    id: user._id,
    name: user.name,
    email: user.email,
    isVerified: user.isVerified,
    onboardingStep: user.onboardingStep,
    authProvider: user.authProvider,
    profilePicture: user.profilePicture,
  };

  if (user.selectedUniversity) {
    response.selectedUniversity = user.selectedUniversity;
  }
  if (user.universityId) {
    response.universityId = user.universityId;
  }

  return response;
};

const verifyGoogleIdToken = async (idToken) => {
  const ticket = await googleClient.verifyIdToken({
    idToken,
    audience: config.googleClientId,
  });
  return ticket.getPayload();
};

const resolveGoogleUser = async (payload) => {
  const { sub: googleId, email, name, picture, email_verified } = payload;

  if (!email_verified) {
    throw new Error(
      "Google account email is not verified. Please verify your email with Google first.",
    );
  }

  let user = await User.findOne({ googleId });
  if (user) {
    return { user, isNewUser: false };
  }

  /**
   * If the Google account's email is verified, we can link it to an existing account with the same email.
   * If the email is not verified, we cannot trust it and must create a new account.
   */
  if (email_verified) {
    user = await User.findOne({ email });
    if (user) {
      user.googleId = googleId;
      if (!user.profilePicture) user.profilePicture = picture;
      if (user.authProvider === "local" && !user.password) {
        user.authProvider = "google";
      }
      user.isVerified = true;
      await user.save();
      return { user, isNewUser: false };
    }
  }

  user = await User.create({
    googleId,
    email,
    name: name || "",
    profilePicture: picture,
    authProvider: "google",
    isVerified: !!email_verified,
  });
  return { user, isNewUser: true };
};

/**
 * Full Google sign-in flow. Returns { error: { status, message } } on
 * failure, or { user, isNewUser } on success.
 */
const googleAuth = async (idToken) => {
  let payload;
  try {
    payload = await verifyGoogleIdToken(idToken);
  } catch (error) {
    logger.error("Google ID token verification failed:", error);
    return {
      error: { status: 401, message: "Invalid or expired Google token." },
    };
  }

  if (!payload?.email) {
    return {
      error: {
        status: 401,
        message: "Google account did not return an email address.",
      },
    };
  }

  if (!payload.email_verified) {
    return {
      error: {
        status: 401,
        message: "Please verify your Google account email before signing in.",
      },
    };
  }

  const { user, isNewUser } = await resolveGoogleUser(payload);

  if (!user.isActive) {
    return {
      error: {
        status: 403,
        message: "Account is deactivated. Please contact support.",
      },
    };
  }

  if (isNewUser) {
    Promise.resolve(emailService.sendWelcomeEmail(user)).catch((err) => {
      logger.error("Welcome email sending failed:", err);
    });
  }

  user.lastLogin = new Date();
  await user.save();

  logger.info("Google sign-in successful", {
    userId: user._id,
    email: user.email,
    isNewUser,
  });

  return { user, isNewUser };
};

const validateSignupInput = (email, password) => {
  if (!email) {
    return { status: 400, message: "Email is required for OTP verification." };
  }

  if (!password) {
    return { status: 400, message: "Password is required." };
  }

  if (!PASSWORD_PATTERN.test(password)) {
    return {
      status: 400,
      message:
        "Password must be at least 8 characters long and contain at least one letter and one number.",
    };
  }

  return null;
};

const resolveSignupAccount = async (email) => {
  const existingByEmail = await User.findOne({ email });

  if (!existingByEmail) {
    return { user: null };
  }

  if (existingByEmail.isVerified) {
    return {
      conflict: {
        status: 400,
        message: "Account already exists. Please log in.",
      },
    };
  }

  return { user: existingByEmail };
};

const upsertSignupUser = async (existingUser, { email, name, password }) => {
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  if (existingUser) {
    existingUser.name = name || existingUser.name;
    existingUser.email = email || existingUser.email;
    existingUser.password = hashedPassword;
    existingUser.lastPasswordChange = new Date();
    await existingUser.save();
    return { user: existingUser, isNewUser: false };
  }

  const user = await User.create({
    email,
    name: name || "",
    password: hashedPassword,
    isVerified: false,
  });
  return { user, isNewUser: true };
};

/**
 * Full signup flow: validate, create/refresh unverified user, send OTP.
 * Returns { error: { status, message } } or
 * { message, developmentOtp, user }.
 *
 * NOTE: `user.isVerified` will be `false` here — the controller is
 * responsible for issuing a session with `emailVerified: false` baked
 * into the token claims, since identity has not yet been proven via OTP.
 */
const signup = async ({ email, name, password }) => {
  const inputError = validateSignupInput(email, password);
  if (inputError) {
    return {
      error: { status: inputError.status, message: inputError.message },
    };
  }

  const { user: existingUnverifiedUser, conflict } =
    await resolveSignupAccount(email);

  if (conflict) {
    return { error: conflict };
  }

  const { user, isNewUser } = await upsertSignupUser(existingUnverifiedUser, {
    email,
    name,
    password,
  });

  const result = await emailService.sendOTP(email, "signup");

  if (isNewUser) {
    Promise.resolve(emailService.sendWelcomeEmail(user)).catch((err) => {
      logger.error("Welcome email sending failed:", err);
    });
  }

  return {
    message: result.message || "OTP sent successfully to your email",
    developmentOtp:
      config.isDevelopment && result.development_otp
        ? result.development_otp
        : undefined,
    user,
  };
};

/**
 * Login with email/password. Returns { error } or { user }.
 */
const login = async (email, password) => {
  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    return { error: { status: 401, message: "Invalid email or password." } };
  }

  if (!user.isActive) {
    return {
      error: {
        status: 403,
        message: "Account is deactivated. Please contact support.",
      },
    };
  }

  if (!user.password) {
    return {
      error: {
        status: 400,
        message:
          "No password set for this account yet. Please use forgot-password.",
      },
    };
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return { error: { status: 401, message: "Invalid email or password." } };
  }

  user.lastLogin = new Date();
  await user.save();

  return { user };
};

/**
 * Verify a signup/login OTP and mark the user as logged in.
 */
const verifyOtp = async (email, otpCode) => {
  const result = await emailService.verifyOTP(email, otpCode);

  result.user.lastLogin = new Date();
  await result.user.save();

  return { user: result.user };
};

/**
 * Resend a signup/login OTP.
 */
const resendOtp = async (email) => {
  const user = await User.findOne({ email });
  if (!user) {
    return {
      error: { status: 404, message: "Email not found. Please sign up first." },
    };
  }

  await OTP.updateMany({ email, isUsed: false }, { isUsed: true });

  const result = await emailService.resendOTP(email);

  return {
    message: "OTP resent successfully to your email",
    developmentOtp:
      config.isDevelopment && result.development_otp
        ? result.development_otp
        : undefined,
  };
};

/**
 * Rotate a refresh token and return the new user + tokens.
 * Returns { error: "REUSED" | "INVALID" } on failure.
 *
 * emailVerified on the new token pair is re-synced from the DB inside
 * sessionService.rotateSession, so it will reflect the user's current
 * verification status even if it changed since the old refresh token
 * was issued.
 */
const refreshTokens = async (refreshToken, meta) => {
  const result = await rotateSession(refreshToken, meta);

  if (result.error === "REUSED") {
    return { error: "REUSED" };
  }

  if (result.error === "INVALID") {
    return { error: "INVALID" };
  }

  const user = await User.findById(result.userId);
  if (!user) {
    return { error: "USER_NOT_FOUND" };
  }

  if (!user.isActive) {
    return { error: "DEACTIVATED" };
  }

  logger.info("Tokens refreshed", { userId: user._id, email: user.email });

  return {
    user,
    accessToken: result.accessToken,
    refreshToken: result.refreshToken,
  };
};

const logout = async (userId, refreshToken) => {
  if (refreshToken) {
    await revokeSession(refreshToken);
  }
  await User.findByIdAndUpdate(userId, { passwordChangedAt: new Date() });
};

//Password reset
const forgotPassword = async (email) => {
  const user = await User.findOne({ email });
  if (!user) {
    return {
      error: {
        status: 404,
        message: "No account found with this email address.",
      },
    };
  }

  if (user.authProvider === "google" && !user.password) {
    return {
      error: {
        status: 400,
        message:
          "This account uses Google Sign-In. Please sign in with Google.",
      },
    };
  }

  if (!user.isActive) {
    return {
      error: {
        status: 403,
        message: "This account is deactivated. Please contact support.",
      },
    };
  }

  if (!user.canResetPassword()) {
    return {
      error: {
        status: 429,
        message: "Too many password reset attempts. Please try again later.",
      },
    };
  }

  await OTP.updateMany(
    { email: user.email, purpose: "reset_password", isUsed: false },
    { isUsed: true },
  );

  const result = await emailService.sendPasswordResetOTP(user.email, user.name);

  return {
    message: "Password reset OTP sent to your email.",
    resetId: result.resetId,
    developmentOtp:
      config.isDevelopment && result.development_otp
        ? result.development_otp
        : undefined,
  };
};

const verifyResetOtp = async (email, otpCode) => {
  const result = await emailService.verifyPasswordResetOTP(email, otpCode);

  const resetToken = jwt.sign(
    {
      userId: result.user._id,
      email: result.user.email,
      purpose: "password_reset",
    },
    config.jwtSecret,
    { expiresIn: "30m" },
  );

  return {
    resetToken,
    resetId: result.resetId,
    user: {
      id: result.user._id,
      email: result.user.email,
      name: result.user.name,
    },
  };
};

const resetPassword = async (resetToken, newPassword) => {
  let decoded;
  try {
    decoded = jwt.verify(resetToken, config.jwtSecret);
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return {
        error: {
          status: 401,
          message: "Reset token has expired. Please request a new one.",
        },
      };
    }
    return { error: { status: 401, message: "Invalid reset token." } };
  }

  if (decoded.purpose !== "password_reset") {
    return { error: { status: 401, message: "Invalid reset token." } };
  }

  const user = await User.findById(decoded.userId);
  if (!user) {
    return { error: { status: 404, message: "User not found." } };
  }

  if (!user.isActive) {
    return { error: { status: 403, message: "Account is deactivated." } };
  }

  if (!user.canResetPassword()) {
    return {
      error: {
        status: 429,
        message: "Too many password reset attempts. Please try again later.",
      },
    };
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(newPassword, salt);

  user.password = hashedPassword;
  user.lastPasswordChange = new Date();
  user.passwordResetAt = new Date();
  user.passwordChangedAt = new Date();
  await user.save();

  await OTP.updateMany(
    { email: user.email, purpose: "reset_password", isUsed: false },
    { isUsed: true },
  );

  // A stolen refresh token issued before the reset must not survive it.
  await revokeAllSessions(user._id);

  logger.info(`Password reset for user: ${user.email}`);

  return { success: true };
};

const changePassword = async (userId, currentPassword, newPassword) => {
  const user = await User.findById(userId).select("+password");

  if (!user) {
    return { error: { status: 404, message: "User not found." } };
  }

  if (user.authProvider === "google" && !user.password) {
    return {
      error: {
        status: 400,
        message:
          "This account uses Google Sign-In. Please sign in with Google.",
      },
    };
  }

  if (!user.password) {
    return {
      error: {
        status: 400,
        message:
          "You don't have a password set. Please use the reset password feature.",
      },
    };
  }

  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) {
    return {
      error: { status: 400, message: "Current password is incorrect." },
    };
  }

  if (!user.canResetPassword()) {
    return {
      error: {
        status: 429,
        message: "Too many password change attempts. Please try again later.",
      },
    };
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(newPassword, salt);

  user.password = hashedPassword;
  user.lastPasswordChange = new Date();
  user.passwordChangedAt = new Date();
  await user.save();

  // Revoke every outstanding session
  await revokeAllSessions(user._id);

  logger.info(`Password changed for user: ${user.email}`);

  return { success: true };
};

/* ------------------------------------------------------------------ */
/* Onboarding step machine                                             */
/* ------------------------------------------------------------------ */

const validateStep = (step) => STEP_ORDER.includes(step);

const buildNavigationResponse = (targetIndex, isComplete) => {
  const canGoBack = targetIndex > 0;
  const canGoForward = targetIndex < STEP_ORDER.length - 1 && !isComplete;
  const previousStep = targetIndex > 0 ? STEP_ORDER[targetIndex - 1] : null;
  const nextStep =
    targetIndex < STEP_ORDER.length - 1 ? STEP_ORDER[targetIndex + 1] : null;

  return { canGoBack, canGoForward, previousStep, nextStep };
};

const processUniversityData = async (data, userId) => {
  const updateData = {};

  if (!data.universityId) {
    if (data.selectedUniversity) {
      updateData.selectedUniversity = data.selectedUniversity;
    }
    return updateData;
  }

  let University;
  if (mongoose.models.University) {
    University = mongoose.models.University;
  } else {
    if (data.universityId) {
      updateData.universityId = data.universityId;
    }
    if (data.selectedUniversity) {
      updateData.selectedUniversity = data.selectedUniversity;
    }
    return updateData;
  }

  try {
    const university = await University.findById(data.universityId);
    if (university) {
      updateData.universityId = data.universityId;
      updateData.selectedUniversity = university.name;
    } else if (data.selectedUniversity) {
      updateData.selectedUniversity = data.selectedUniversity;
    }
  } catch (error) {
    logger.error(
      `Failed to resolve university ${data.universityId} for user ${userId}:`,
      error,
    );
    if (data.selectedUniversity) {
      updateData.selectedUniversity = data.selectedUniversity;
    }
  }

  return updateData;
};

const validateCompletionPrerequisites = async (userId, targetIndex) => {
  const contactsIndex = STEP_ORDER.indexOf("contacts");

  if (targetIndex >= contactsIndex) {
    const contactCount = await TrustedContact.countDocuments({
      userId,
      isActive: true,
    });

    if (contactCount === 0) {
      return {
        isValid: false,
        message:
          "Please add at least one trusted contact before completing onboarding",
        requiredStep: "contacts",
        contactCount: 0,
      };
    }
  }

  return { isValid: true };
};

const handleOnboardingComplete = async (user) => {
  if (!user.isVerified) {
    user.isVerified = true;
    user.lastLogin = new Date();
    await user.save();

    logger.info(`User ${user._id} completed onboarding and is now verified`);

    if (emailService.sendOnboardingCompleteEmail) {
      Promise.resolve(emailService.sendOnboardingCompleteEmail(user)).catch(
        (err) => {
          logger.error("Onboarding completion email failed:", err);
        },
      );
    }
  }
};

const resolveStepNavigation = (user, step) => {
  const currentIndex = STEP_ORDER.indexOf(user.onboardingStep);
  const targetIndex = STEP_ORDER.indexOf(step);

  if (step === "complete") {
    return { ok: true, currentIndex, targetIndex };
  }

  if (targetIndex < currentIndex) {
    return { ok: true, currentIndex, targetIndex };
  }

  if (targetIndex > currentIndex + 1) {
    const nextStep = STEP_ORDER[currentIndex + 1] || "complete";
    return {
      ok: false,
      status: 400,
      body: {
        success: false,
        message: `Please complete steps in order. Next step: ${nextStep}`,
        currentStep: user.onboardingStep,
        nextStep,
      },
    };
  }

  return { ok: true, currentIndex, targetIndex };
};

const logMissingOptionalData = (user, userId) => {
  const hasLocationData = user.preferences?.onboardingLocation;
  const hasUniversityData = user.universityId || user.selectedUniversity;

  if (!hasLocationData && user.onboardingStep !== "complete") {
    logger.info(`User ${userId} completing onboarding without location data`);
  }
  if (!hasUniversityData && user.onboardingStep !== "complete") {
    logger.info(`User ${userId} completing onboarding without university data`);
  }
};

const checkCompletionPrerequisites = async (
  user,
  userId,
  step,
  targetIndex,
) => {
  if (step !== "complete" || targetIndex <= 0) {
    return { ok: true };
  }

  const validation = await validateCompletionPrerequisites(userId, targetIndex);
  if (!validation.isValid) {
    return {
      ok: false,
      status: 400,
      body: { success: false, ...validation },
    };
  }

  logMissingOptionalData(user, userId);
  return { ok: true };
};

const buildStepUpdateData = async (step, data, user, userId) => {
  const updateData = {};

  updateData.onboardingStep = step;

  if (step === "university") {
    const universityData = await processUniversityData(data, userId);
    Object.assign(updateData, universityData);
  }

  if (
    step === "location" &&
    data.location?.latitude &&
    data.location?.longitude
  ) {
    const currentPreferences = user.preferences || {};

    updateData.preferences = {
      ...currentPreferences,
      onboardingLocation: {
        latitude: data.location.latitude,
        longitude: data.location.longitude,
        updatedAt: new Date(),
      },
    };
  }

  return updateData;
};

const getContactSummary = async (userId, targetIndex, contactsIndex) => {
  if (targetIndex < contactsIndex) {
    return null;
  }

  const count = await TrustedContact.countDocuments({
    userId,
    isActive: true,
  });

  return { count, maxContacts: config.maxTrustedContacts };
};

const processContactStep = async (userId, contacts, currentStep) => {
  const result = {
    contactsAdded: 0,
    contactsErrors: [],
    shouldUpdateStep: false,
    updateData: {},
  };

  if (!contacts || !Array.isArray(contacts) || contacts.length === 0) {
    return result;
  }

  const contactResult = await processOnboardingContacts(userId, contacts);
  result.contactsAdded = contactResult.contactsAdded;
  result.contactsErrors = contactResult.contactsErrors;

  if (contactResult.shouldUpdateStep && currentStep !== "contacts") {
    result.updateData.onboardingStep = "contacts";
    result.shouldUpdateStep = true;
  }

  return result;
};

const buildOnboardingResponse = (
  updatedUser,
  step,
  targetIndex,
  isComplete,
  contactSummary,
  contactsAdded,
  contactsErrors,
) => {
  const progress = Math.round(((targetIndex + 1) / STEP_ORDER.length) * 100);
  const navigation = buildNavigationResponse(targetIndex, isComplete);

  const response = {
    success: true,
    message: `Onboarding step updated to: ${step}`,
    step: updatedUser.onboardingStep,
    isComplete,
    progress,
    ...navigation,
    user: buildUserResponse(updatedUser),
  };

  if (contactSummary) {
    response.contacts = contactSummary;
  }

  if (contactsAdded > 0) {
    response.contactsAdded = contactsAdded;
  }

  if (contactsErrors && contactsErrors.length > 0) {
    response.contactsErrors = contactsErrors;
  }

  return response;
};

/**
 * Full onboarding-step-update orchestration.
 * Returns { error: { status, body } } or { body } (the response payload).
 */
const updateOnboardingStep = async (userId, step, data = {}) => {
  const user = await User.findById(userId);
  if (!user) {
    return {
      error: {
        status: 404,
        body: { success: false, message: "User not found" },
      },
    };
  }

  if (!validateStep(step)) {
    return {
      error: {
        status: 400,
        body: { success: false, message: "Invalid onboarding step" },
      },
    };
  }

  const navResult = resolveStepNavigation(user, step);
  if (!navResult.ok) {
    return { error: { status: navResult.status, body: navResult.body } };
  }
  const { targetIndex } = navResult;

  const completionCheck = await checkCompletionPrerequisites(
    user,
    userId,
    step,
    targetIndex,
  );
  if (!completionCheck.ok) {
    return {
      error: { status: completionCheck.status, body: completionCheck.body },
    };
  }

  const updateData = await buildStepUpdateData(step, data, user, userId);

  let contactsAdded = 0;
  let contactsErrors = [];

  if (step === "contacts" && data.contacts && Array.isArray(data.contacts)) {
    const contactResult = await processContactStep(
      userId,
      data.contacts,
      user.onboardingStep,
    );

    contactsAdded = contactResult.contactsAdded;
    contactsErrors = contactResult.contactsErrors;

    if (contactResult.updateData.onboardingStep) {
      updateData.onboardingStep = contactResult.updateData.onboardingStep;
    }

    const totalContacts = await TrustedContact.countDocuments({
      userId,
      isActive: true,
    });

    if (totalContacts === 0 && contactsAdded === 0) {
      return {
        error: {
          status: 400,
          body: {
            success: false,
            message: "Please add at least one trusted contact",
            contactsAdded: 0,
            contactsErrors,
          },
        },
      };
    }
  }

  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { $set: updateData },
    { new: true, runValidators: true },
  ).select("-__v");

  const isComplete = step === "complete";
  if (isComplete) {
    await handleOnboardingComplete(updatedUser);
  }

  const contactsIndex = STEP_ORDER.indexOf("contacts");
  const contactSummary = await getContactSummary(
    userId,
    targetIndex,
    contactsIndex,
  );

  logger.info(
    `Onboarding navigation for user ${userId}: ${user.onboardingStep} → ${step} (${Math.round(((targetIndex + 1) / STEP_ORDER.length) * 100)}%)`,
  );

  const body = buildOnboardingResponse(
    updatedUser,
    step,
    targetIndex,
    isComplete,
    contactSummary,
    contactsAdded,
    contactsErrors,
  );

  return { body };
};

/**
 * Build the onboarding status payload for the current user.
 */
const getOnboardingStatus = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    return null;
  }

  const currentIndex = STEP_ORDER.indexOf(user.onboardingStep);
  const isComplete = user.onboardingStep === "complete";

  const stepLabels = {
    welcome: "Welcome & Profile",
    location: "Location Settings",
    contacts: "Add Contacts",
    university: "University Selection",
    complete: "Complete",
  };

  const steps = STEP_ORDER.map((step, index) => {
    if (isComplete) {
      return {
        step,
        label: stepLabels[step] || step,
        isCompleted: true,
        isActive: false,
        isLocked: false,
      };
    }

    let status = "upcoming";
    if (index < currentIndex) status = "completed";
    if (index === currentIndex) status = "active";

    return {
      step,
      label: stepLabels[step] || step,
      isCompleted: status === "completed",
      isActive: status === "active",
      isLocked: status === "upcoming" && !isComplete,
    };
  });

  const contactCount = await TrustedContact.countDocuments({
    userId,
    isActive: true,
  });

  const progress = isComplete
    ? 100
    : Math.round(((currentIndex + 1) / STEP_ORDER.length) * 100);
  const canGoForward = !isComplete && currentIndex < STEP_ORDER.length - 1;
  const canGoBack = currentIndex > 0;

  return {
    currentStep: user.onboardingStep,
    progress,
    isComplete,
    steps,
    canGoForward,
    canGoBack,
    nextStep: canGoForward ? STEP_ORDER[currentIndex + 1] : null,
    previousStep: canGoBack ? STEP_ORDER[currentIndex - 1] : null,
    contactsCount: contactCount,
    maxContacts: config.maxTrustedContacts,
    user: buildUserResponse(user),
  };
};

/**
 * Fetch the authenticated user's profile (used by GET /me).
 */
const getMe = async (userId) => {
  const user = await User.findById(userId).select("-__v");

  if (!user) {
    return null;
  }
  const contactCount = await TrustedContact.countDocuments({
    userId,
    isActive: true,
  });

  return {
    ...user.toJSON(),
    trustedContactsCount: contactCount,
    maxContacts: config.maxTrustedContacts,
  };
};

export default {
  STEP_ORDER,
  createUserSession,
  buildUserResponse,
  googleAuth,
  signup,
  login,
  verifyOtp,
  resendOtp,
  refreshTokens,
  logout,
  forgotPassword,
  verifyResetOtp,
  resetPassword,
  changePassword,
  updateOnboardingStep,
  getOnboardingStatus,
  getMe,
};
