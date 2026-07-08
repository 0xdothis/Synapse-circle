import express from "express";
import jwt from "jsonwebtoken";

import User from "../models/User.js";
import TrustedContact from "../models/TrustedContact.js";
import emailService from "../services/emailService.js";
import { validate, authValidation } from "../middlewares/validator.js";
import { authenticate } from "../middlewares/auth.js";
import { otpLimiter, authLimiter } from "../middlewares/rateLimiter.js";

const router = express.Router();

/**
 * @swagger
 * /api/auth/signup:
 *   post:
 *     summary: Send OTP for signup
 *     description: Sends a 6-digit OTP to the user's email for phone number verification
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
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: OTP sent successfully to your email
 *                 otpId:
 *                   type: string
 *                   example: 507f1f77bcf86cd799439011
 *                 development_otp:
 *                   type: string
 *                   example: 123456
 *                   description: Only available in development mode
 *       400:
 *         description: Validation error or user already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       429:
 *         description: Too many requests
 */
router.post(
  "/signup",
  authLimiter,
  validate(authValidation.signup),
  async (req, res, next) => {
    try {
      const { email, phoneNumber, name } = req.body;

      // Validate email is provided
      if (!email) {
        return res.status(400).json({
          success: false,
          message: "Email is required for OTP verification.",
        });
      }

      // Check if user already exists with this email
      const existingEmail = await User.findOne({ email });
      if (existingEmail?.isVerified) {
        return res.status(400).json({
          success: false,
          message: "Email already registered. Please use a different email.",
        });
      }

      // Check if user already exists with this phone number
      const existingPhone = await User.findOne({ phoneNumber });
      if (existingPhone?.isVerified) {
        return res.status(400).json({
          success: false,
          message: "Phone number already registered. Please log in.",
        });
      }

      // If user exists but not verified, update their info
      let user = existingPhone || existingEmail;
      if (user && !user.isVerified) {
        user.name = name || user.name;
        user.email = email || user.email;
        await user.save();
      }

      // Send OTP via email
      const result = await emailService.sendOTP(email, phoneNumber, "signup");

      res.status(200).json({
        success: true,
        message: "OTP sent successfully to your email",
        otpId: result.otpId,
        // Development only - shows OTP in console for testing
        ...(process.env.NODE_ENV === "development" && {
          development_otp: result.development_otp,
        }),
      });
    } catch (error) {
      next(error);
    }
  },
);

/**
 * @swagger
 * /api/auth/verify-otp:
 *   post:
 *     summary: Verify OTP and complete signup/login
 *     description: Verifies the OTP and returns a JWT token for authenticated access
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
 *       429:
 *         description: Too many attempts
 */
router.post(
  "/verify-otp",
  authLimiter,
  validate(authValidation.verifyOTP),
  async (req, res, next) => {
    try {
      const { phoneNumber, otpCode } = req.body;

      // Verify OTP
      const result = await emailService.verifyOTP(phoneNumber, otpCode);

      // Generate JWT token
      const token = jwt.sign(
        { userId: result.user._id, phoneNumber: result.user.phoneNumber },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE || "7d" },
      );

      // Update last login
      result.user.lastLogin = new Date();
      await result.user.save();

      res.status(200).json({
        success: true,
        message: "OTP verified successfully",
        token,
        user: {
          id: result.user._id,
          phoneNumber: result.user.phoneNumber,
          name: result.user.name,
          email: result.user.email,
          isVerified: result.user.isVerified,
        },
      });
    } catch (error) {
      next(error);
    }
  },
);

/**
 * @swagger
 * /api/auth/resend-otp:
 *   post:
 *     summary: Resend OTP
 *     description: Resends a new OTP to the user's registered email
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phoneNumber
 *             properties:
 *               phoneNumber:
 *                 type: string
 *                 example: +1234567890
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
 *                 message:
 *                   type: string
 *                 otpId:
 *                   type: string
 *       404:
 *         description: Phone number not found
 *       429:
 *         description: Too many requests
 */
router.post(
  "/resend-otp",
  otpLimiter,
  validate(authValidation.resendOTP),
  async (req, res, next) => {
    try {
      const { phoneNumber } = req.body;

      // Check if user exists
      const user = await User.findOne({ phoneNumber });
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "Phone number not found. Please sign up first.",
        });
      }

      // Check if user has email
      if (!user.email) {
        return res.status(400).json({
          success: false,
          message: "No email found for this user. Please sign up again.",
        });
      }

      const result = await emailService.resendOTP(user.email, phoneNumber);

      res.status(200).json({
        success: true,
        message: "OTP resent successfully to your email",
        otpId: result.otpId,
        // Development only
        ...(process.env.NODE_ENV === "development" && {
          development_otp: result.development_otp,
        }),
      });
    } catch (error) {
      next(error);
    }
  },
);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout user
 *     description: Logs out the user (client-side token removal)
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
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
 *                   example: Logged out successfully
 *       401:
 *         description: Unauthorized - No token provided
 */
router.post("/logout", authenticate, async (req, res) => {
  res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
});

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current user profile
 *     description: Returns the authenticated user's profile information
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
 *         description: Unauthorized - Invalid or expired token
 */
router.get("/me", authenticate, async (req, res, next) => {
  try {
    const user = await User.findById(req.userId).select("-__v");

    // Get contact count
    const contactCount = await TrustedContact.countDocuments({
      userId: req.userId,
      isActive: true,
    });

    res.status(200).json({
      success: true,
      user: {
        ...user.toJSON(),
        trustedContactsCount: contactCount,
        maxContacts: Number.parseInt(process.env.MAX_TRUSTED_CONTACTS) || 3,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
