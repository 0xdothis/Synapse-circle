import express from "express";
import { authenticate } from "../middlewares/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { validate } from "../middlewares/validator.js";
import { body } from "express-validator";
import profileController from "../controllers/profile.controller.js";
import { uploadProfilePicture } from "../config/cloudinary.js";

const router = express.Router();

/**
 * @swagger
 * /api/profile/me:
 *   get:
 *     summary: Get user profile with contacts and stats
 *     description: Returns full user profile including profile picture URL, email, name, and all settings
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 profile:
 *                   $ref: '#/components/schemas/Profile'
 */
router.get("/me", authenticate, asyncHandler(profileController.getProfile));

/**
 * @swagger
 * /api/profile/picture:
 *   post:
 *     summary: Upload profile picture to Cloudinary
 *     description: Uploads a profile picture to Cloudinary and stores the URL
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               profilePicture:
 *                 type: string
 *                 format: binary
 *                 description: Image file (JPEG, PNG, GIF, WebP)
 */
router.post(
  "/picture",
  authenticate,
  profileController.handleUploadErrors(uploadProfilePicture),
  asyncHandler(profileController.uploadPicture),
);

/**
 * @swagger
 * /api/profile/picture:
 *   delete:
 *     summary: Delete profile picture from Cloudinary
 *     description: Removes the profile picture from Cloudinary and clears the URL from user profile
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 */
router.delete(
  "/picture",
  authenticate,
  asyncHandler(profileController.deletePicture),
);

/**
 * @swagger
 * /api/profile/me:
 *   put:
 *     summary: Update user profile (name, email, university)
 *     description: Update user profile information (excluding profile picture - use /picture endpoint)
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateProfileRequest'
 */
router.put(
  "/me",
  authenticate,
  validate([
    body("name").optional().isString().isLength({ max: 100 }),
    body("email").optional().isEmail(),
    body("university").optional().isString(),
    body("universityId").optional().isString(),
    body("preferences.autoShareLocation").optional().isBoolean(),
    body("preferences.alertSound").optional().isBoolean(),
  ]),
  asyncHandler(profileController.updateProfile),
);

/**
 * @swagger
 * /api/profile/name:
 *   put:
 *     summary: Update user name
 *     description: Update user's display name
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 */
router.put(
  "/name",
  authenticate,
  validate([
    body("name")
      .notEmpty()
      .withMessage("Name is required")
      .isLength({ max: 100 }),
  ]),
  asyncHandler(profileController.updateName),
);

/**
 * @swagger
 * /api/profile/email:
 *   put:
 *     summary: Update email address
 *     description: Update user's email address
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 */
router.put(
  "/email",
  authenticate,
  validate([body("email").isEmail().withMessage("Valid email is required")]),
  asyncHandler(profileController.updateEmail),
);

/**
 * @swagger
 * /api/profile/history:
 *   get:
 *     summary: Get alert history with filters
 *     description: Returns paginated alert history with filtering by status
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [all, sent, cancelled, resolved, failed]
 *         description: Filter by alert status
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 */
router.get(
  "/history",
  authenticate,
  asyncHandler(profileController.getHistory),
);

/**
 * @swagger
 * /api/profile/history/{alertId}:
 *   get:
 *     summary: Get a specific alert from history
 *     description: Returns detailed information about a specific alert
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  "/history/:alertId",
  authenticate,
  asyncHandler(profileController.getHistoryEntry),
);

export default router;
