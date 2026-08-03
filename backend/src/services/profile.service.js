import User from "../models/User.js";
import TrustedContact from "../models/TrustedContact.js";
import SOSAlert from "../models/SOSAlert.js";
import { logger } from "../utils/logger.js";
import config from "../utils/config.js";
import emailService from "./emailService.js";
import {
  uploadToCloudinary,
  deleteFromCloudinary,
  extractPublicIdFromUrl,
} from "../config/cloudinary.js";

/**
 * Build the full profile payload: user info, trusted contacts, alert stats,
 * and safety-setup completion flags.
 */
const getFullProfile = async (userId) => {
  const user = await User.findById(userId)
    .select("-__v -password")
    .lean()
    .exec();

  if (!user) {
    return null;
  }

  const trustedContacts = await TrustedContact.find({
    userId,
    isActive: true,
  })
    .select("-__v")
    .lean()
    .exec();

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

  return {
    id: user._id,
    name: user.name || "",
    email: user.email,
    profilePicture: user.profilePicture || null,
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
};

/**
 * Upload a new profile picture buffer to Cloudinary, persist the URL,
 * and best-effort clean up the previous asset.
 * Returns null if the user doesn't exist.
 */
const setProfilePicture = async (userId, fileBuffer) => {
  const existingUser = await User.findById(userId).select("profilePicture");
  if (!existingUser) {
    return null;
  }

  // uploadProfilePicture uses multer's memoryStorage, so the file only
  // exists as a buffer at this point — it has NOT been sent to Cloudinary
  // yet. We must upload the buffer ourselves.
  const uploadResult = await uploadToCloudinary(fileBuffer, {
    folder: "safewalk/profiles",
    public_id: `profile_${userId}_${Date.now()}`,
  });

  const previousPublicId = extractPublicIdFromUrl(existingUser.profilePicture);

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

  return {
    profilePicture: updatedUser.profilePicture,
    publicId: uploadResult.public_id,
  };
};

/**
 * Remove the user's profile picture from Cloudinary and clear it from the
 * user document. Returns null if the user doesn't exist.
 */
const removeProfilePicture = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    return null;
  }

  if (user.profilePicture) {
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

  return { deleted: true };
};

/**
 * Update profile fields (name, email, university, preferences).
 * Returns { emailConflict: true } | { notFound: true } | { profile }.
 */
const updateProfile = async (
  userId,
  { name, email, university, universityId, preferences },
) => {
  const currentUser = await User.findById(userId);
  if (!currentUser) {
    return { notFound: true };
  }

  if (email && email !== currentUser.email) {
    const existingUser = await User.findOne({
      email,
      _id: { $ne: userId },
    });
    if (existingUser) {
      return { emailConflict: true };
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

    Promise.resolve(emailService.sendProfileCompletionEmail(updatedUser)).catch(
      (err) => {
        logger.error("Profile completion email failed:", err);
      },
    );
  }

  return {
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
  };
};

/**
 * Update just the user's display name.
 */
const updateName = async (userId, name) => {
  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { $set: { name: name.trim() } },
    { new: true },
  ).select("name email");

  return updatedUser.name;
};

/**
 * Update just the user's email. Returns { conflict: true } | { email }.
 */
const updateEmail = async (userId, email) => {
  const existingUser = await User.findOne({
    email,
    _id: { $ne: userId },
  });
  if (existingUser) {
    return { conflict: true };
  }

  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { $set: { email: email.toLowerCase().trim() } },
    { new: true },
  ).select("email name");

  return { email: updatedUser.email };
};

const formatAlert = (alert) => ({
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
});

/**
 * Get paginated, filterable alert history plus status counts.
 */
const getAlertHistory = async (userId, { status, limit = 20, page = 1 }) => {
  const parsedLimit = Number.parseInt(limit);
  const parsedPage = Number.parseInt(page);
  const skip = (parsedPage - 1) * parsedLimit;

  const query = { userId };
  if (status && status !== "all") {
    query.status = status;
  }

  const alerts = await SOSAlert.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parsedLimit)
    .select("-__v");

  const total = await SOSAlert.countDocuments(query);

  const statusCounts = {
    all: total,
    sent: await SOSAlert.countDocuments({ userId, status: "sent" }),
    cancelled: await SOSAlert.countDocuments({ userId, status: "cancelled" }),
    resolved: await SOSAlert.countDocuments({ userId, status: "resolved" }),
    failed: await SOSAlert.countDocuments({ userId, status: "failed" }),
  };

  return {
    alerts: alerts.map(formatAlert),
    pagination: {
      total,
      page: parsedPage,
      limit: parsedLimit,
      totalPages: Math.ceil(total / parsedLimit),
    },
    statusCounts,
  };
};

/**
 * Get a single alert by ID, scoped to the requesting user.
 */
const getAlertById = async (userId, alertId) => {
  const alert = await SOSAlert.findOne({ _id: alertId, userId });

  if (!alert) {
    return null;
  }

  return formatAlert(alert);
};

export default {
  getFullProfile,
  setProfilePicture,
  removeProfilePicture,
  updateProfile,
  updateName,
  updateEmail,
  getAlertHistory,
  getAlertById,
};
