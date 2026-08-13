import express from "express";
import { body } from "express-validator";
import authController from "../controllers/auth.controller.js";
import { validate, authValidation } from "../middlewares/validator.js";
import { authenticate } from "../middlewares/auth.js";
import {
  otpLimiter,
  authLimiter,
  apiLimiter,
} from "../middlewares/rateLimiter.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { validateContact } from "../utils/contactHelper.js";
import authService from "../services/auth.service.js";

const { STEP_ORDER } = authService;

const router = express.Router();

/**
 * Ensures that when moving to the university step, at least a name OR acronym is provided
 * Only run if data is an object
 */
const universityStepValidator = body("data").custom((data, { req }) => {
  if (req.body.step !== "university") {
    return true;
  }
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return true;
  }

  const name = data.name;
  const acronym = data.acronym;

  if (!name && !acronym) {
    throw new Error(
      "University name or acronym is required when moving to the university step.",
    );
  }

  return true;
});

/**
 * Ensures a university acronym is never saved without a name to pair
 * it with — the reverse case (name only, no acronym yet) IS allowed,
 * since the university step is deferrable: a user can pick a name now
 * and have the acronym filled in later, either on a subsequent
 * onboarding call or via PUT /api/university.
 * Only run if data is an object
 */
const universityPairingValidator = body("data").custom((data, { req }) => {
  if (req.body.step !== "university") {
    return true;
  }

  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return true;
  }

  const name = data.name;
  const acronym = data.acronym;

  if (acronym && !name) {
    throw new Error(
      "A university acronym was provided without a name. Please send both together.",
    );
  }

  return true;
});

/**
 * Location validator that only validates for the "location" step
 * Accepts an object with latitude and longitude
 */
const locationValidator = body("data.location")
  .optional()
  .custom((location, { req }) => {
    if (req.body.step !== "location") {
      return true;
    }

    if (location === null || location === undefined) {
      return true;
    }
    if (typeof location !== "object" || Array.isArray(location)) {
      throw new TypeError("Location must be an object");
    }

    if (location.latitude !== undefined || location.longitude !== undefined) {
      if (location.latitude === undefined || location.longitude === undefined) {
        throw new Error("Both latitude and longitude are required together");
      }

      // Validate latitude
      if (
        typeof location.latitude !== "number" ||
        Number.isNaN(location.latitude)
      ) {
        throw new TypeError("Latitude must be a valid number");
      }
      if (location.latitude < -90 || location.latitude > 90) {
        throw new Error("Latitude must be between -90 and 90");
      }

      // Validate longitude
      if (
        typeof location.longitude !== "number" ||
        Number.isNaN(location.longitude)
      ) {
        throw new TypeError("Longitude must be a valid number");
      }
      if (location.longitude < -180 || location.longitude > 180) {
        throw new Error("Longitude must be between -180 and 180");
      }
    }

    return true;
  });

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
  validate(authValidation.signup),
  authController.signup,
);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login with email and password
 *     description: Authenticates a user with email and password. Returns accessToken and refreshToken in the response body.
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
  validate(authValidation.login),
  authController.login,
);

/**
 * @swagger
 * /api/auth/verify-otp:
 *   post:
 *     summary: Verify OTP and complete authentication
 *     description: Verifies the OTP sent to the user's email. On success, creates a session and returns accessToken/refreshToken.
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
  validate(authValidation.verifyOTP),
  authController.verifyOtp,
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
  validate([
    body("idToken").notEmpty().withMessage("Google ID token is required"),
  ]),
  authController.googleAuth,
);

/**
 * @swagger
 * /api/auth/refresh-token:
 *   post:
 *     summary: Refresh access token
 *     description: Exchanges a valid refresh token for a new access/refresh token pair. Refresh tokens are rotated on every use. Reusing a revoked token triggers session revocation.
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
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
router.post("/refresh-token", apiLimiter, authController.refreshToken);

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
  validate(authValidation.resendOTP),
  authController.resendOtp,
);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout user
 *     description: Revokes the given refresh token. Clients should discard stored tokens on receiving 200.
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
 *                 description: Refresh token to revoke
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
router.post("/logout", authenticate, asyncHandler(authController.logout));

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
 *             type: object
 *             required:
 *               - step
 *             properties:
 *               step:
 *                 type: string
 *                 enum: [welcome, location, contacts, university, complete]
 *               data:
 *                 type: object
 *                 properties:
 *                   location:
 *                     type: object
 *                     properties:
 *                       latitude:
 *                         type: number
 *                       longitude:
 *                         type: number
 *                   name:
 *                     type: string
 *                     description: University name (for university step)
 *                   acronym:
 *                     type: string
 *                     description: University acronym (for university step)
 *                   contacts:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         name:
 *                           type: string
 *                         email:
 *                           type: string
 *                         relationship:
 *                           type: string
 *                           enum: [parent, sibling, friend, roommate, partner, other]
 *     responses:
 *       200:
 *         description: Onboarding step updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/OnboardingStepResponse'
 *       400:
 *         description: Invalid step, out-of-order navigation, missing prerequisites (e.g. no trusted contacts before completion), or a university acronym sent without a name
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
    body("data.name")
      .optional()
      .isString()
      .withMessage("University name must be a string")
      .isLength({ max: 100 })
      .withMessage("University name cannot exceed 100 characters")
      .trim(),
    body("data.acronym")
      .optional()
      .isString()
      .withMessage("University acronym must be a string")
      .isLength({ min: 2, max: 10 })
      .withMessage("Acronym must be between 2 and 10 characters")
      .matches(/^[A-Za-z0-9]+$/)
      .withMessage("Acronym can only contain letters and numbers")
      .trim()
      .toUpperCase(),
    locationValidator,
    body("data.contacts")
      .optional()
      .custom((contacts, { req }) => {
        if (req.body.step !== "contacts") return true;
        if (!Array.isArray(contacts))
          throw new Error("Contacts must be an array");
        if (contacts.length === 0)
          throw new Error("At least one contact is required");
        contacts.forEach((contact, index) => validateContact(contact, index));
        return true;
      }),
    universityStepValidator,
    universityPairingValidator,
  ]),
  authController.updateOnboardingStep,
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
  authController.getOnboardingStatus,
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
router.get("/me", authenticate, authController.getMe);

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
  validate([
    body("email")
      .notEmpty()
      .withMessage("Email is required")
      .isEmail()
      .withMessage("Please enter a valid email address")
      .normalizeEmail(),
  ]),
  authController.forgotPassword,
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
  authController.verifyResetOtp,
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
  authController.resetPassword,
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
  authController.changePassword,
);

/**
 * @swagger
 * /api/auth/account:
 *   delete:
 *     summary: Delete user account
 *     description: Permanently deletes the user's account and all associated data. Requires password confirmation for local auth users.
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               password:
 *                 type: string
 *                 description: Current password (required for local auth users)
 *                 example: "SecurePass123"
 *               reason:
 *                 type: string
 *                 enum: [user_requested, inactive, violation, other]
 *                 default: user_requested
 *                 description: Reason for account deletion
 *               confirm:
 *                 type: boolean
 *                 description: For Google auth users - set to true to confirm deletion
 *                 example: true
 *     responses:
 *       200:
 *         description: Account deleted successfully
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
 *                   example: "Your account has been successfully deleted. All your data has been removed."
 *       400:
 *         description: Missing password or confirmation
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Invalid password
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
router.delete(
  "/account",
  authenticate,
  validate([
    body("password")
      .optional()
      .isString()
      .withMessage("Password must be a string"),
    body("reason")
      .optional()
      .isIn(["user_requested", "inactive", "violation", "other"])
      .withMessage("Invalid deletion reason"),
    body("confirm")
      .optional()
      .isBoolean()
      .withMessage("Confirm must be a boolean"),
  ]),
  authController.deleteAccount,
);

export default router;
