import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import bcrypt from "bcryptjs";
import TrustedContact from "../models/TrustedContact.js";
import emailService from "../services/emailService.js";
import OTP from "../models/OTP.js";
import { validate, authValidation } from "../middlewares/validator.js";
import { authenticate } from "../middlewares/auth.js";
import {
  otpLimiter,
  authLimiter,
  apiLimiter,
} from "../middlewares/rateLimiter.js";
import { body } from "express-validator";
import { asyncHandler } from "../utils/asyncHandler.js";
import config from "../utils/config.js";
import {
  setAccessTokenCookie,
  setRefreshTokenCookie,
  clearTokenCookies,
  generateCsrfToken,
  verifyCsrfToken,
  getRefreshTokenFromCookie,
  isMobileClient,
} from "../utils/tokenService.js";
import {
  createSession,
  rotateSession,
  revokeSession,
  revokeAllSessions,
} from "../services/sessionService.js";
import { logger } from "../utils/logger.js";
import mongoose from "mongoose";
import { OAuth2Client } from "google-auth-library";

const router = express.Router();

const googleClient = new OAuth2Client(config.googleClientId);

/**
 * Session response strategy
 * Web clients (browser, no `X-Client-Type: mobile` header): tokens are
 * NEVER placed in the JSON body. They live only in httpOnly cookies.
 */
const respondWithSession = async (
  req,
  res,
  { status = 200, message, user, extra = {} },
  { userId, email, role = "user" },
) => {
  const { accessToken, refreshToken } = await createSession(
    userId,
    email,
    role,
    { userAgent: req.headers["user-agent"], ip: req.ip },
  );

  const payload = { success: true, message, ...extra, user };

  if (isMobileClient(req)) {
    payload.accessToken = accessToken;
    payload.refreshToken = refreshToken;
  } else {
    setAccessTokenCookie(res, accessToken);
    setRefreshTokenCookie(res, refreshToken);
    payload.csrfToken = generateCsrfToken(res);
  }

  return res.status(status).json(payload);
};

const getIncomingRefreshToken = (req) =>
  isMobileClient(req)
    ? req.body?.refreshToken || null
    : getRefreshTokenFromCookie(req);

// Helper: Verify a Google ID token and return its payload
const verifyGoogleIdToken = async (idToken) => {
  const ticket = await googleClient.verifyIdToken({
    idToken,
    audience: config.googleClientId,
  });
  return ticket.getPayload();
};

// Helper: Find an existing user for this Google account, or create one
const resolveGoogleUser = async (payload) => {
  const { sub: googleId, email, name, picture, email_verified } = payload;

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

const STEP_ORDER = [
  "welcome",
  "location",
  "contacts",
  "university",
  "complete",
];

// Helper: Validate step existence
const validateStep = (step) => {
  if (!STEP_ORDER.includes(step)) {
    throw new Error("Invalid onboarding step");
  }
};

// Helper: Build navigation response
const buildNavigationResponse = (targetIndex, isComplete) => {
  const canGoBack = targetIndex > 0;
  const canGoForward = targetIndex < STEP_ORDER.length - 1 && !isComplete;
  const previousStep = targetIndex > 0 ? STEP_ORDER[targetIndex - 1] : null;
  const nextStep =
    targetIndex < STEP_ORDER.length - 1 ? STEP_ORDER[targetIndex + 1] : null;

  return { canGoBack, canGoForward, previousStep, nextStep };
};

// Helper Process university data
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

// Helper Validate completion prerequisites
const validateCompletionPrerequisites = async (userId, targetIndex) => {
  const contactsIndex = STEP_ORDER.indexOf("contacts");

  if (targetIndex >= contactsIndex) {
    const contactCount = await TrustedContact.countDocuments({
      userId: userId,
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

// Helper: Handle onboarding completion
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
        nextStep: nextStep,
      },
    };
  }

  return { ok: true, currentIndex, targetIndex };
};

// Helper: Log warnings for missing optional data ahead of completion
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

// Helper: Build step update data
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

// Helper: Fetch contact count/limit summary if the step requires it
const getContactSummary = async (userId, targetIndex, contactsIndex) => {
  if (targetIndex < contactsIndex) {
    return null;
  }

  const count = await TrustedContact.countDocuments({
    userId: userId,
    isActive: true,
  });

  return { count, maxContacts: config.maxTrustedContacts };
};

/**
 * @swagger
 * /api/auth/csrf-token:
 *   get:
 *     summary: Get a CSRF token
 *     description: Issues a CSRF token for web clients to use in mutating requests. The token is returned in the response body and also set as a non-httpOnly cookie.
 *     tags: [Authentication]
 *     security: []
 *     responses:
 *       200:
 *         description: CSRF token issued successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 csrfToken:
 *                   type: string
 *                   example: "a1b2c3d4e5f6..."
 *       400:
 *         description: Invalid request
 *       500:
 *         description: Server error
 */
router.get("/csrf-token", (req, res) => {
  const token = generateCsrfToken(res);
  res.json({ csrfToken: token });
});

const PASSWORD_PATTERN = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/;

const validateSignupInput = (email, password) => {
  if (!email) {
    return {
      status: 400,
      body: {
        success: false,
        message: "Email is required for OTP verification.",
      },
    };
  }

  if (!password) {
    return {
      status: 400,
      body: { success: false, message: "Password is required." },
    };
  }

  if (!PASSWORD_PATTERN.test(password)) {
    return {
      status: 400,
      body: {
        success: false,
        message:
          "Password must be at least 8 characters long and contain at least one letter and one number.",
      },
    };
  }

  return null;
};

/**
 * Look up whether this email is already in use
 */
const resolveSignupAccount = async (email) => {
  const existingByEmail = await User.findOne({ email });

  if (!existingByEmail) {
    return { user: null };
  }

  if (existingByEmail.isVerified) {
    return {
      conflict: {
        status: 400,
        body: {
          success: false,
          message: "Account already exists. Please log in.",
        },
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
 * @swagger
 * /api/auth/signup:
 *   post:
 *     summary: Register a new user
 *     description: Creates a new user account and sends an OTP to the provided email for verification. The user must verify the OTP within 10 minutes.
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SignupRequest'
 *     responses:
 *       200:
 *         description: OTP sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SignupResponse'
 *       400:
 *         description: Validation error or user already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       429:
 *         description: Too many requests
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  "/signup",
  authLimiter,
  verifyCsrfToken,
  validate(authValidation.signup),
  asyncHandler(async (req, res, next) => {
    try {
      const { email, name, password } = req.body;

      const inputError = validateSignupInput(email, password);
      if (inputError) {
        return res.status(inputError.status).json(inputError.body);
      }

      const { user: existingUnverifiedUser, conflict } =
        await resolveSignupAccount(email);

      if (conflict) {
        return res.status(conflict.status).json(conflict.body);
      }

      const { user, isNewUser } = await upsertSignupUser(
        existingUnverifiedUser,
        { email, name, password },
      );

      const result = await emailService.sendOTP(email, "signup");

      if (isNewUser) {
        Promise.resolve(emailService.sendWelcomeEmail(user)).catch((err) => {
          logger.error("Welcome email sending failed:", err);
        });
      }

      const csrfToken = generateCsrfToken(res);

      const response = {
        success: true,
        message: result.message || "OTP sent successfully to your email",
        csrfToken: csrfToken,
      };

      if (config.isDevelopment && result.development_otp) {
        response.development_otp = result.development_otp;
      }

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }),
);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login with email and password
 *     description: Authenticates a user with email and password. Web clients receive httpOnly cookies; mobile clients receive access/refresh tokens.
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: No password set on this account
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Account deactivated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       429:
 *         description: Too many attempts
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  "/login",
  authLimiter,
  verifyCsrfToken,
  validate(authValidation.login),
  asyncHandler(async (req, res, next) => {
    try {
      const { email, password } = req.body;

      const user = await User.findOne({ email }).select("+password");

      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Invalid email or password.",
        });
      }

      if (!user.isActive) {
        return res.status(403).json({
          success: false,
          message: "Account is deactivated. Please contact support.",
        });
      }

      if (!user.password) {
        return res.status(400).json({
          success: false,
          message:
            "No password set for this account yet. Please use forgot-password.",
        });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: "Invalid email or password.",
        });
      }

      user.lastLogin = new Date();
      await user.save();

      logger.info("Login successful", {
        userId: user._id,
        email: user.email,
        ip: req.ip,
      });

      await respondWithSession(
        req,
        res,
        {
          message: "Login successful",
          user: buildUserResponse(user),
        },
        { userId: user._id, email: user.email, role: user.role || "user" },
      );
    } catch (error) {
      next(error);
    }
  }),
);

/**
 * @swagger
 * /api/auth/verify-otp:
 *   post:
 *     summary: Verify OTP and complete authentication
 *     description: Verifies the OTP sent to the user's email. On success, creates a session and sets authentication cookies (web) or returns tokens (mobile).
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/VerifyOTPRequest'
 *     responses:
 *       200:
 *         description: OTP verified successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Invalid or expired OTP
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       429:
 *         description: Too many attempts
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  "/verify-otp",
  authLimiter,
  verifyCsrfToken,
  validate(authValidation.verifyOTP),
  asyncHandler(async (req, res, next) => {
    try {
      const { email, otpCode } = req.body;

      const result = await emailService.verifyOTP(email, otpCode);

      result.user.lastLogin = new Date();
      await result.user.save();

      await respondWithSession(
        req,
        res,
        {
          message: "OTP verified successfully",
          user: buildUserResponse(result.user),
        },
        {
          userId: result.user._id,
          email: result.user.email,
          role: result.user.role || "user",
        },
      );
    } catch (error) {
      if (error.message === "Invalid or expired OTP") {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }
      if (error.message === "User not found") {
        return res.status(404).json({
          success: false,
          message: "User not found. Please sign up first.",
        });
      }
      next(error);
    }
  }),
);

/**
 * @swagger
 * /api/auth/google:
 *   post:
 *     summary: Sign in or sign up with Google
 *     description: Authenticates using Google OAuth. If the email is verified and exists, links the account. Otherwise, creates a new account.
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - idToken
 *             properties:
 *               idToken:
 *                 type: string
 *                 description: Google ID token from OAuth flow
 *     responses:
 *       200:
 *         description: Signed in successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Login successful"
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *                 isNewUser:
 *                   type: boolean
 *                   example: false
 *                 csrfToken:
 *                   type: string
 *                 accessToken:
 *                   type: string
 *                 refreshToken:
 *                   type: string
 *       400:
 *         description: Missing or invalid ID token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Google token verification failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Account deactivated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  "/google",
  authLimiter,
  verifyCsrfToken,
  validate([
    body("idToken").notEmpty().withMessage("Google ID token is required"),
  ]),
  asyncHandler(async (req, res, next) => {
    try {
      const { idToken } = req.body;

      let payload;
      try {
        payload = await verifyGoogleIdToken(idToken);
      } catch (error) {
        logger.error("Google ID token verification failed:", error);
        return res.status(401).json({
          success: false,
          message: "Invalid or expired Google token.",
        });
      }

      if (!payload?.email) {
        return res.status(401).json({
          success: false,
          message: "Google account did not return an email address.",
        });
      }

      const { user, isNewUser } = await resolveGoogleUser(payload);

      if (!user.isActive) {
        return res.status(403).json({
          success: false,
          message: "Account is deactivated. Please contact support.",
        });
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

      await respondWithSession(
        req,
        res,
        {
          message: isNewUser
            ? "Account created with Google"
            : "Login successful",
          extra: { isNewUser },
          user: buildUserResponse(user),
        },
        { userId: user._id, email: user.email, role: user.role || "user" },
      );
    } catch (error) {
      next(error);
    }
  }),
);

/**
 * @swagger
 * /api/auth/refresh-token:
 *   post:
 *     summary: Refresh access token
 *     description: Exchanges a valid refresh token for a new access token. Refresh tokens are rotated on every use. Reusing a revoked token triggers session revocation.
 *     tags: [Authentication]
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RefreshTokenRequest'
 *     responses:
 *       200:
 *         description: Tokens refreshed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       401:
 *         description: Invalid, expired, or reused refresh token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Account deactivated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  "/refresh-token",
  apiLimiter,
  verifyCsrfToken,
  asyncHandler(async (req, res, next) => {
    try {
      const refreshToken = getIncomingRefreshToken(req);

      if (!refreshToken) {
        return res.status(401).json({
          success: false,
          message: "Refresh token required. Please log in.",
        });
      }

      const result = await rotateSession(refreshToken, {
        userAgent: req.headers["user-agent"],
        ip: req.ip,
      });

      if (result.error === "REUSED") {
        clearTokenCookies(res);
        return res.status(401).json({
          success: false,
          message:
            "This session is no longer valid. Please log in again on all devices.",
          code: "SESSION_REUSE_DETECTED",
        });
      }

      if (result.error === "INVALID") {
        clearTokenCookies(res);
        return res.status(401).json({
          success: false,
          message: "Invalid or expired refresh token. Please log in again.",
        });
      }

      const user = await User.findById(result.userId);
      if (!user) {
        return res
          .status(404)
          .json({ success: false, message: "User not found." });
      }

      if (!user.isActive) {
        return res
          .status(403)
          .json({ success: false, message: "Account is deactivated." });
      }

      const payload = {
        success: true,
        message: "Tokens refreshed successfully",
        user: buildUserResponse(user),
      };

      if (isMobileClient(req)) {
        payload.accessToken = result.accessToken;
        payload.refreshToken = result.refreshToken;
      } else {
        setAccessTokenCookie(res, result.accessToken);
        setRefreshTokenCookie(res, result.refreshToken);
        payload.csrfToken = generateCsrfToken(res);
      }

      logger.info("Tokens refreshed", { userId: user._id, email: user.email });

      res.status(200).json(payload);
    } catch (error) {
      next(error);
    }
  }),
);

/**
 * @swagger
 * /api/auth/resend-otp:
 *   post:
 *     summary: Resend OTP to email
 *     description: Resends a new OTP to the user's email address. Previous OTPs are invalidated.
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "student@campus.edu"
 *     responses:
 *       200:
 *         description: OTP resent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "OTP resent successfully to your email"
 *                 development_otp:
 *                   type: string
 *                   example: "654321"
 *                   description: ⚠️ Development only - new OTP for testing
 *       404:
 *         description: Email not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       429:
 *         description: Too many requests
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  "/resend-otp",
  otpLimiter,
  verifyCsrfToken,
  validate(authValidation.resendOTP),
  asyncHandler(async (req, res, next) => {
    try {
      const { email } = req.body;

      const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "Email not found. Please sign up first.",
        });
      }

      await OTP.updateMany({ email, isUsed: false }, { isUsed: true });

      const result = await emailService.resendOTP(email);

      const response = {
        success: true,
        message: "OTP resent successfully to your email",
      };

      if (config.isDevelopment && result.development_otp) {
        response.development_otp = result.development_otp;
      }

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }),
);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout user
 *     description: Revokes the current refresh token and clears session cookies. Mobile clients should discard stored tokens on receiving 200.
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: Refresh token to revoke (required for mobile clients)
 *     responses:
 *       200:
 *         description: Logged out successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Logged out successfully"
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  "/logout",
  authenticate,
  verifyCsrfToken,
  asyncHandler(async (req, res) => {
    const refreshToken = getIncomingRefreshToken(req);
    if (refreshToken) {
      await revokeSession(refreshToken);
    }

    clearTokenCookies(res);

    logger.info("User logged out", {
      userId: req.userId,
      email: req.user?.email,
    });

    res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  }),
);

/**
 * @swagger
 * /api/auth/onboarding-step:
 *   patch:
 *     summary: Advance or update the onboarding step
 *     description: Moves the authenticated user's onboarding to a new step and persists any step-specific data (location, university selection, etc).
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/OnboardingStepRequest'
 *     responses:
 *       200:
 *         description: Onboarding step updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/OnboardingStepResponse'
 *       400:
 *         description: Invalid step, out-of-order navigation, or missing prerequisites (e.g. no trusted contacts before completion)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.patch(
  "/onboarding-step",
  authenticate,
  verifyCsrfToken,
  validate([
    body("step")
      .notEmpty()
      .withMessage("Step is required")
      .isIn(STEP_ORDER)
      .withMessage("Invalid onboarding step"),
    body("data")
      .optional()
      .isObject()
      .withMessage("Data must be an object if provided"),
  ]),
  asyncHandler(async (req, res, next) => {
    try {
      const { step, data = {} } = req.body;
      const userId = req.userId;

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      try {
        validateStep(step);
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }

      const navResult = resolveStepNavigation(user, step);
      if (!navResult.ok) {
        return res.status(navResult.status).json(navResult.body);
      }
      const { targetIndex } = navResult;

      const completionCheck = await checkCompletionPrerequisites(
        user,
        userId,
        step,
        targetIndex,
      );
      if (!completionCheck.ok) {
        return res.status(completionCheck.status).json(completionCheck.body);
      }

      const updateData = await buildStepUpdateData(step, data, user, userId);

      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { $set: updateData },
        { new: true, runValidators: true },
      ).select("-__v");

      const isComplete = step === "complete";
      if (isComplete) {
        await handleOnboardingComplete(updatedUser);
      }

      const progress = Math.round(
        ((targetIndex + 1) / STEP_ORDER.length) * 100,
      );
      const navigation = buildNavigationResponse(targetIndex, isComplete);

      const contactsIndex = STEP_ORDER.indexOf("contacts");
      const contactSummary = await getContactSummary(
        userId,
        targetIndex,
        contactsIndex,
      );

      logger.info(
        `Onboarding navigation for user ${userId}: ${user.onboardingStep} → ${step} (${progress}%)`,
      );

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

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }),
);

/**
 * @swagger
 * /api/auth/onboarding-status:
 *   get:
 *     summary: Get onboarding status
 *     description: Returns the current onboarding progress including step statuses, progress percentage, and navigation options.
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Onboarding status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/OnboardingStatusResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get(
  "/onboarding-status",
  authenticate,
  asyncHandler(async (req, res, next) => {
    try {
      const userId = req.userId;

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
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
        userId: userId,
        isActive: true,
      });

      const progress = isComplete
        ? 100
        : Math.round(((currentIndex + 1) / STEP_ORDER.length) * 100);
      const canGoForward = !isComplete && currentIndex < STEP_ORDER.length - 1;
      const canGoBack = currentIndex > 0;

      res.status(200).json({
        success: true,
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
      });
    } catch (error) {
      next(error);
    }
  }),
);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current user profile
 *     description: Returns the authenticated user's profile information including contacts count and settings.
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get(
  "/me",
  authenticate,
  asyncHandler(async (req, res, next) => {
    try {
      const user = await User.findById(req.userId).select("-__v");

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }
      const contactCount = await TrustedContact.countDocuments({
        userId: req.userId,
        isActive: true,
      });

      res.status(200).json({
        success: true,
        user: {
          ...user.toJSON(),
          trustedContactsCount: contactCount,
          maxContacts: config.maxTrustedContacts,
        },
      });
    } catch (error) {
      next(error);
    }
  }),
);

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Request password reset OTP
 *     description: Sends a password reset OTP to the user's email address. The OTP expires in 10 minutes.
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ForgotPasswordRequest'
 *     responses:
 *       200:
 *         description: Password reset OTP sent
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Password reset OTP sent to your email."
 *                 resetId:
 *                   type: string
 *                   example: "507f1f77bcf86cd799439011"
 *                 development_otp:
 *                   type: string
 *                   example: "123456"
 *                   description: ⚠️ Development only - OTP for testing
 *       404:
 *         description: Email not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       429:
 *         description: Too many requests
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  "/forgot-password",
  otpLimiter,
  verifyCsrfToken,
  validate([
    body("email")
      .notEmpty()
      .withMessage("Email is required")
      .isEmail()
      .withMessage("Please enter a valid email address")
      .normalizeEmail(),
  ]),
  asyncHandler(async (req, res, next) => {
    try {
      const { email } = req.body;

      const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "No account found with this email address.",
        });
      }

      if (!user.isActive) {
        return res.status(403).json({
          success: false,
          message: "This account is deactivated. Please contact support.",
        });
      }

      if (!user.canResetPassword()) {
        return res.status(429).json({
          success: false,
          message: "Too many password reset attempts. Please try again later.",
        });
      }

      await OTP.updateMany(
        {
          email: user.email,
          purpose: "reset_password",
          isUsed: false,
        },
        { isUsed: true },
      );

      const result = await emailService.sendPasswordResetOTP(
        user.email,
        user.name,
      );

      const response = {
        success: true,
        message: "Password reset OTP sent to your email.",
        resetId: result.resetId,
      };

      if (config.isDevelopment && result.development_otp) {
        response.development_otp = result.development_otp;
      }

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }),
);

/**
 * @swagger
 * /api/auth/verify-reset-otp:
 *   post:
 *     summary: Verify password reset OTP
 *     description: Verifies the password reset OTP and returns a reset token for setting a new password.
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/VerifyOTPRequest'
 *     responses:
 *       200:
 *         description: OTP verified successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "OTP verified successfully. You can now reset your password."
 *                 resetToken:
 *                   type: string
 *                   description: JWT token for password reset (expires in 30 minutes)
 *                 resetId:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Invalid or expired OTP
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       429:
 *         description: Too many attempts
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  "/verify-reset-otp",
  authLimiter,
  verifyCsrfToken,
  validate([
    body("email")
      .notEmpty()
      .withMessage("Email is required")
      .isEmail()
      .withMessage("Please enter a valid email"),
    body("otpCode")
      .notEmpty()
      .withMessage("OTP code is required")
      .isLength({ min: 6, max: 6 })
      .withMessage("OTP must be 6 digits")
      .isNumeric()
      .withMessage("OTP must be numeric"),
  ]),
  asyncHandler(async (req, res, next) => {
    try {
      const { email, otpCode } = req.body;

      const result = await emailService.verifyPasswordResetOTP(email, otpCode);

      // Distinct-purpose, short-lived token
      const resetToken = jwt.sign(
        {
          userId: result.user._id,
          email: result.user.email,
          purpose: "password_reset",
        },
        config.jwtSecret,
        { expiresIn: "30m" },
      );

      res.status(200).json({
        success: true,
        message: "OTP verified successfully. You can now reset your password.",
        resetToken,
        resetId: result.resetId,
        user: {
          id: result.user._id,
          email: result.user.email,
          name: result.user.name,
        },
      });
    } catch (error) {
      if (error.message === "Invalid or expired OTP") {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }
      if (error.message === "User not found") {
        return res.status(404).json({
          success: false,
          message: "User not found.",
        });
      }
      if (error.message === "OTP has expired") {
        return res.status(400).json({
          success: false,
          message: "OTP has expired. Please request a new one.",
        });
      }
      next(error);
    }
  }),
);

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Reset password
 *     description: Resets the user's password using a valid reset token. All existing sessions are revoked.
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ResetPasswordRequest'
 *     responses:
 *       200:
 *         description: Password reset successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Password reset successfully. You can now login with your new password."
 *       400:
 *         description: Invalid reset token or passwords don't match
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Invalid or expired reset token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       429:
 *         description: Too many attempts
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  "/reset-password",
  authLimiter,
  verifyCsrfToken,
  validate([
    body("resetToken").notEmpty().withMessage("Reset token is required"),
    body("newPassword")
      .notEmpty()
      .withMessage("New password is required")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters long")
      .matches(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/)
      .withMessage("Password must contain at least one letter and one number"),
    body("confirmPassword")
      .notEmpty()
      .withMessage("Please confirm your password")
      .custom((value, { req }) => value === req.body.newPassword)
      .withMessage("Passwords do not match"),
  ]),
  asyncHandler(async (req, res, next) => {
    try {
      const { resetToken, newPassword } = req.body;

      let decoded;
      try {
        decoded = jwt.verify(resetToken, config.jwtSecret);
      } catch (error) {
        if (error.name === "TokenExpiredError") {
          return res.status(401).json({
            success: false,
            message: "Reset token has expired. Please request a new one.",
          });
        }
        return res.status(401).json({
          success: false,
          message: "Invalid reset token.",
        });
      }

      if (decoded.purpose !== "password_reset") {
        return res.status(401).json({
          success: false,
          message: "Invalid reset token.",
        });
      }

      const user = await User.findById(decoded.userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found.",
        });
      }

      if (!user.isActive) {
        return res.status(403).json({
          success: false,
          message: "Account is deactivated.",
        });
      }

      if (!user.canResetPassword()) {
        return res.status(429).json({
          success: false,
          message: "Too many password reset attempts. Please try again later.",
        });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);

      user.password = hashedPassword;
      user.lastPasswordChange = new Date();
      user.passwordResetAt = new Date();
      await user.save();

      await OTP.updateMany(
        {
          email: user.email,
          purpose: "reset_password",
          isUsed: false,
        },
        { isUsed: true },
      );

      // A stolen refresh token issued before the reset must not survive it.
      await revokeAllSessions(user._id);

      logger.info(`Password reset for user: ${user.email}`);

      res.status(200).json({
        success: true,
        message:
          "Password reset successfully. You can now login with your new password.",
      });
    } catch (error) {
      next(error);
    }
  }),
);

/**
 * @swagger
 * /api/auth/change-password:
 *   post:
 *     summary: Change password (authenticated)
 *     description: Changes the user's password. Requires current password for verification. All existing sessions are revoked.
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ChangePasswordRequest'
 *     responses:
 *       200:
 *         description: Password changed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Password changed successfully. Please log in again."
 *       400:
 *         description: Invalid current password or validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       429:
 *         description: Too many attempts
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  "/change-password",
  authenticate,
  verifyCsrfToken,
  validate([
    body("currentPassword")
      .notEmpty()
      .withMessage("Current password is required"),
    body("newPassword")
      .notEmpty()
      .withMessage("New password is required")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters long")
      .matches(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/)
      .withMessage("Password must contain at least one letter and one number"),
    body("confirmPassword")
      .notEmpty()
      .withMessage("Please confirm your password")
      .custom((value, { req }) => value === req.body.newPassword)
      .withMessage("Passwords do not match"),
  ]),
  asyncHandler(async (req, res, next) => {
    try {
      const { currentPassword, newPassword } = req.body;

      const user = await User.findById(req.userId).select("+password");

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found.",
        });
      }

      if (!user.password) {
        return res.status(400).json({
          success: false,
          message:
            "You don't have a password set. Please use the reset password feature.",
        });
      }

      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({
          success: false,
          message: "Current password is incorrect.",
        });
      }

      if (!user.canResetPassword()) {
        return res.status(429).json({
          success: false,
          message: "Too many password change attempts. Please try again later.",
        });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);

      user.password = hashedPassword;
      user.lastPasswordChange = new Date();
      await user.save();

      // Revoke every outstanding session
      await revokeAllSessions(user._id);
      clearTokenCookies(res);

      logger.info(`Password changed for user: ${user.email}`);

      res.status(200).json({
        success: true,
        message: "Password changed successfully. Please log in again.",
      });
    } catch (error) {
      next(error);
    }
  }),
);

export default router;
