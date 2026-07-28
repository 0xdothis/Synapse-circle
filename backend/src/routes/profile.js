import express from "express";
import { authenticate } from "../middlewares/auth.js";
import { verifyCsrfToken } from "../utils/tokenService.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { validate } from "../middlewares/validator.js";
import { body } from "express-validator";
import User from "../models/User.js";
import TrustedContact from "../models/TrustedContact.js";
import SOSAlert from "../models/SOSAlert.js";
import { logger } from "../utils/logger.js";
import config from "../utils/config.js";
import emailService from "../services/emailService.js";
import {
  uploadProfilePicture,
  uploadToCloudinary,
  deleteFromCloudinary,
  extractPublicIdFromUrl,
} from "../config/cloudinary.js";

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
router.get(
  "/me",
  authenticate,
  asyncHandler(async (req, res) => {
    const userId = req.userId;

    // Using lean() for better performance
    const user = await User.findById(userId)
      .select("-__v -password")
      .lean()
      .exec();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Use lean()
    const trustedContacts = await TrustedContact.find({
      userId,
      isActive: true,
    })
      .select("-__v")
      .lean()
      .exec();

    // Use estimatedDocumentCount for stats (faster)
    const [totalAlerts, activeAlerts, cancelledAlerts, resolvedAlerts] =
      await Promise.all([
        SOSAlert.countDocuments({ userId }),
        SOSAlert.countDocuments({ userId, status: "sent" }),
        SOSAlert.countDocuments({ userId, status: "cancelled" }),
        SOSAlert.countDocuments({ userId, status: "resolved" }),
      ]);

    const safetySetup = {
      institutionSelected: !!user.selectedUniversity || !!user.universityId,
      trustedContactsAdded: trustedContacts.length > 0,
      locationPermissionEnabled: !!user.preferences?.onboardingLocation,
      isComplete:
        (!!user.selectedUniversity || !!user.universityId) &&
        trustedContacts.length > 0 &&
        !!user.preferences?.onboardingLocation,
    };

    const profile = {
      id: user._id,
      name: user.name || "",
      email: user.email,
      profilePicture: user.profilePicture || null, // Cloudinary URL
      university: user.selectedUniversity || "",
      universityId: user.universityId || null,
      isVerified: user.isVerified,
      isActive: user.isActive,
      preferences: user.preferences || {
        autoShareLocation: true,
        alertSound: true,
      },
      onboardingStep: user.onboardingStep,
      safetySetup,
      trustedContacts: trustedContacts.map((contact) => ({
        id: contact._id,
        name: contact.name,
        email: contact.email,
        relationship: contact.relationship,
        isPrimary: contact.isPrimary,
      })),
      stats: {
        total: totalAlerts,
        active: activeAlerts,
        cancelled: cancelledAlerts,
        resolved: resolvedAlerts,
      },
      maxContacts: config.maxTrustedContacts,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin,
    };

    res.status(200).json({
      success: true,
      profile,
    });
  }),
);

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
  verifyCsrfToken,
  (req, res, next) => {
    uploadProfilePicture(req, res, (err) => {
      if (err) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({
            success: false,
            message: "File too large. Maximum size is 5MB.",
          });
        }
        return res.status(400).json({
          success: false,
          message: err.message,
        });
      }
      next();
    });
  },
  asyncHandler(async (req, res) => {
    const userId = req.userId;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    const existingUser = await User.findById(userId).select("profilePicture");
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // uploadProfilePicture uses multer's memoryStorage, so the file only
    // exists as req.file.buffer at this point — it has NOT been sent to
    // Cloudinary yet. We must upload the buffer ourselves.
    const uploadResult = await uploadToCloudinary(req.file.buffer, {
      folder: "safewalk/profiles",
      public_id: `profile_${userId}_${Date.now()}`,
    });

    const previousPublicId = extractPublicIdFromUrl(
      existingUser.profilePicture,
    );

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: { profilePicture: uploadResult.secure_url } },
      { new: true, runValidators: true },
    ).select("profilePicture name email");

    // Best-effort cleanup of the old asset; don't fail the request over it.
    if (previousPublicId) {
      deleteFromCloudinary(previousPublicId).catch((error) => {
        logger.error(
          `Failed to delete previous profile picture (${previousPublicId}) for user ${userId}: ${error.message}`,
        );
      });
    }

    logger.info(`Profile picture uploaded for user ${userId}`, {
      cloudinaryUrl: uploadResult.secure_url,
    });

    res.status(200).json({
      success: true,
      message: "Profile picture uploaded successfully",
      profilePicture: updatedUser.profilePicture,
      publicId: uploadResult.public_id,
    });
  }),
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
  verifyCsrfToken,
  asyncHandler(async (req, res) => {
    const userId = req.userId;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.profilePicture) {
      // Reuse the shared, tested URL parser instead of a manual split —
      // the manual version broke on Cloudinary's version segment
      // (v123456) and hardcoded the "safewalk/profiles" folder, silently
      // failing to delete anything uploaded under a different public_id
      // shape.
      const publicId = extractPublicIdFromUrl(user.profilePicture);
      if (publicId) {
        try {
          await deleteFromCloudinary(publicId);
          logger.info(
            `Profile picture deleted from Cloudinary for user ${userId}`,
          );
        } catch (error) {
          logger.error(
            `Failed to delete profile picture from Cloudinary: ${error.message}`,
          );
        }
      }
    }

    user.profilePicture = null;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Profile picture deleted successfully",
    });
  }),
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
  verifyCsrfToken,
  validate([
    body("name").optional().isString().isLength({ max: 100 }),
    body("email").optional().isEmail(),
    body("university").optional().isString(),
    body("universityId").optional().isString(),
    body("preferences.autoShareLocation").optional().isBoolean(),
    body("preferences.alertSound").optional().isBoolean(),
  ]),
  asyncHandler(async (req, res) => {
    const userId = req.userId;
    const { name, email, university, universityId, preferences } = req.body;

    const currentUser = await User.findById(userId);
    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (email && email !== currentUser.email) {
      const existingUser = await User.findOne({
        email,
        _id: { $ne: userId },
      });
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: "Email already in use by another account",
        });
      }
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name.trim();
    if (email !== undefined) updateData.email = email.toLowerCase().trim();
    if (university !== undefined)
      updateData.selectedUniversity = university.trim();
    if (universityId !== undefined) updateData.universityId = universityId;

    if (preferences) {
      updateData.preferences = {
        ...currentUser.preferences?.toObject(),
        ...preferences,
      };
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, runValidators: true },
    ).select("-__v -password");

    logger.info(`Profile updated for user ${userId}`, {
      fields: Object.keys(updateData),
    });

    const isComplete =
      (updatedUser.selectedUniversity || updatedUser.universityId) &&
      (await TrustedContact.countDocuments({
        userId: updatedUser._id,
        isActive: true,
      })) > 0 &&
      updatedUser.preferences?.onboardingLocation;

    if (isComplete && updatedUser.onboardingStep !== "complete") {
      updatedUser.onboardingStep = "complete";
      await updatedUser.save();

      // Send profile completion email
      Promise.resolve(
        emailService.sendProfileCompletionEmail(updatedUser),
      ).catch((err) => {
        logger.error("Profile completion email failed:", err);
      });
    }

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      profile: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        profilePicture: updatedUser.profilePicture,
        university: updatedUser.selectedUniversity,
        universityId: updatedUser.universityId,
        isVerified: updatedUser.isVerified,
        preferences: updatedUser.preferences,
        onboardingStep: updatedUser.onboardingStep,
      },
    });
  }),
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
  verifyCsrfToken,
  validate([
    body("name")
      .notEmpty()
      .withMessage("Name is required")
      .isLength({ max: 100 }),
  ]),
  asyncHandler(async (req, res) => {
    const userId = req.userId;
    const { name } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: { name: name.trim() } },
      { new: true },
    ).select("name email");

    res.status(200).json({
      success: true,
      message: "Name updated successfully",
      name: updatedUser.name,
    });
  }),
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
  verifyCsrfToken,
  validate([body("email").isEmail().withMessage("Valid email is required")]),
  asyncHandler(async (req, res) => {
    const userId = req.userId;
    const { email } = req.body;

    const existingUser = await User.findOne({
      email,
      _id: { $ne: userId },
    });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Email already in use by another account",
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: { email: email.toLowerCase().trim() } },
      { new: true },
    ).select("email name");

    res.status(200).json({
      success: true,
      message: "Email updated successfully",
      email: updatedUser.email,
    });
  }),
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
  asyncHandler(async (req, res) => {
    const userId = req.userId;
    const { status, limit = 20, page = 1 } = req.query;

    const skip = (Number.parseInt(page) - 1) * Number.parseInt(limit);

    const query = { userId };
    if (status && status !== "all") {
      query.status = status;
    }

    const alerts = await SOSAlert.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number.parseInt(limit))
      .select("-__v");

    const total = await SOSAlert.countDocuments(query);

    const formattedAlerts = alerts.map((alert) => ({
      id: alert._id,
      status: alert.status,
      message: alert.message,
      location: alert.locationAvailable
        ? {
            latitude: alert.latitude,
            longitude: alert.longitude,
          }
        : null,
      locationLink: alert.locationLink,
      timestamp: alert.createdAt,
      cancelledAt: alert.cancelledAt,
      cancellationReason: alert.cancellationReason,
      canCancel: alert.canCancel ? alert.canCancel() : false,
      cancellationTimeRemaining: alert.getCancellationTimeRemaining
        ? alert.getCancellationTimeRemaining()
        : 0,
    }));

    const statusCounts = {
      all: total,
      sent: await SOSAlert.countDocuments({ userId, status: "sent" }),
      cancelled: await SOSAlert.countDocuments({ userId, status: "cancelled" }),
      resolved: await SOSAlert.countDocuments({ userId, status: "resolved" }),
      failed: await SOSAlert.countDocuments({ userId, status: "failed" }),
    };

    res.status(200).json({
      success: true,
      alerts: formattedAlerts,
      pagination: {
        total,
        page: Number.parseInt(page),
        limit: Number.parseInt(limit),
        totalPages: Math.ceil(total / Number.parseInt(limit)),
      },
      statusCounts,
    });
  }),
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
  asyncHandler(async (req, res) => {
    const { alertId } = req.params;
    const userId = req.userId;

    const alert = await SOSAlert.findOne({ _id: alertId, userId });

    if (!alert) {
      return res.status(404).json({
        success: false,
        message: "Alert not found",
      });
    }

    res.status(200).json({
      success: true,
      alert: {
        id: alert._id,
        status: alert.status,
        message: alert.message,
        location: alert.locationAvailable
          ? {
              latitude: alert.latitude,
              longitude: alert.longitude,
            }
          : null,
        locationLink: alert.locationLink,
        timestamp: alert.createdAt,
        cancelledAt: alert.cancelledAt,
        cancellationReason: alert.cancellationReason,
        canCancel: alert.canCancel ? alert.canCancel() : false,
        cancellationTimeRemaining: alert.getCancellationTimeRemaining
          ? alert.getCancellationTimeRemaining()
          : 0,
      },
    });
  }),
);

export default router;
