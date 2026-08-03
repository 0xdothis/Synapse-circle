import emergencyService from "../services/emergency.service.js";

/**
 * GET /api/emergency/directory
 */
const getDirectory = async (req, res) => {
  const { type, search } = req.query;

  const result = await emergencyService.getDirectory({ type, search });

  res.status(200).json({
    success: true,
    ...result,
  });
};

/**
 * GET /api/emergency/directory/:id
 */
const getDirectoryEntry = async (req, res) => {
  const { id } = req.params;

  const contact = await emergencyService.getDirectoryEntry(id);

  if (!contact) {
    return res.status(404).json({
      success: false,
      message: "Emergency contact not found",
    });
  }

  res.status(200).json({
    success: true,
    contact,
  });
};

/**
 * GET /api/emergency/nearby
 */
const getNearbyContacts = async (req, res) => {
  const { latitude, longitude, radius = 5000, type } = req.query;

  if (!latitude || !longitude) {
    return res.status(400).json({
      success: false,
      message: "Latitude and longitude are required",
    });
  }

  const result = await emergencyService.getNearbyContacts({
    latitude,
    longitude,
    radius,
    type,
  });

  if (result.error === "INVALID_COORDS") {
    return res.status(400).json({
      success: false,
      message: "Latitude and longitude must be valid numbers",
    });
  }

  res.status(200).json({
    success: true,
    ...result,
  });
};

export default { getDirectory, getDirectoryEntry, getNearbyContacts };
