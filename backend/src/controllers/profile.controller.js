import profileService from "../services/profile.service.js";

/**
 * GET /api/profile/me
 */
const getProfile = async (req, res) => {
  const profile = await profileService.getFullProfile(req.userId);

  if (!profile) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  res.status(200).json({
    success: true,
    profile,
  });
};

/**
 * POST /api/profile/picture
 * Assumes the multer upload middleware has already run and populated req.file.
 */
const uploadPicture = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: "No file uploaded",
    });
  }

  const result = await profileService.setProfilePicture(
    req.userId,
    req.file.buffer,
  );

  if (!result) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  res.status(200).json({
    success: true,
    message: "Profile picture uploaded successfully",
    profilePicture: result.profilePicture,
    publicId: result.publicId,
  });
};

/**
 * DELETE /api/profile/picture
 */
const deletePicture = async (req, res) => {
  const result = await profileService.removeProfilePicture(req.userId);

  if (!result) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  res.status(200).json({
    success: true,
    message: "Profile picture deleted successfully",
  });
};

/**
 * PUT /api/profile/me
 */
const updateProfile = async (req, res) => {
  const { name, email, university, universityId, preferences } = req.body;

  const result = await profileService.updateProfile(req.userId, {
    name,
    email,
    university,
    universityId,
    preferences,
  });

  if (result.notFound) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  if (result.emailConflict) {
    return res.status(409).json({
      success: false,
      message: "Email already in use by another account",
    });
  }

  res.status(200).json({
    success: true,
    message: "Profile updated successfully",
    profile: result.profile,
  });
};

/**
 * PUT /api/profile/name
 */
const updateName = async (req, res) => {
  const { name } = req.body;

  const updatedName = await profileService.updateName(req.userId, name);

  res.status(200).json({
    success: true,
    message: "Name updated successfully",
    name: updatedName,
  });
};

/**
 * PUT /api/profile/email
 */
const updateEmail = async (req, res) => {
  const { email } = req.body;

  const result = await profileService.updateEmail(req.userId, email);

  if (result.conflict) {
    return res.status(409).json({
      success: false,
      message: "Email already in use by another account",
    });
  }

  res.status(200).json({
    success: true,
    message: "Email updated successfully",
    email: result.email,
  });
};

/**
 * GET /api/profile/history
 */
const getHistory = async (req, res) => {
  const { status, limit = 20, page = 1 } = req.query;

  const result = await profileService.getAlertHistory(req.userId, {
    status,
    limit,
    page,
  });

  res.status(200).json({
    success: true,
    ...result,
  });
};

/**
 * GET /api/profile/history/:alertId
 */
const getHistoryEntry = async (req, res) => {
  const { alertId } = req.params;

  const alert = await profileService.getAlertById(req.userId, alertId);

  if (!alert) {
    return res.status(404).json({
      success: false,
      message: "Alert not found",
    });
  }

  res.status(200).json({
    success: true,
    alert,
  });
};

/**
 * Multer error-handling wrapper for the picture upload middleware.
 * Kept in the controller layer since it's purely an HTTP-response concern.
 */
const handleUploadErrors = (uploadMiddleware) => (req, res, next) => {
  uploadMiddleware(req, res, (err) => {
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
};

export default {
  getProfile,
  uploadPicture,
  deletePicture,
  updateProfile,
  updateName,
  updateEmail,
  getHistory,
  getHistoryEntry,
  handleUploadErrors,
};
