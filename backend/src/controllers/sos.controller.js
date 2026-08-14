import sosService from "../services/sosService.js";
import SOSAlert from "../models/SOSAlert.js";

/**
 * POST /api/sos/trigger
 */
const triggerSOS = async (req, res) => {
  const {
    latitude,
    longitude,
    locationAvailable = true,
    locationLabel,
  } = req.body;

  const result = await sosService.triggerSOS(req.userId, {
    latitude,
    longitude,
    locationAvailable,
    locationLabel,
  });

  res.status(200).json({
    success: true,
    ...result,
  });
};

/**
 * POST /api/sos/cancel/:alertId
 * User self-cancel, within the 5-minute window. reason: "false_alarm"
 * produces a distinct status from a generic cancel.
 */
const cancelSOS = async (req, res) => {
  const { alertId } = req.params;
  const { reason = "false_alarm" } = req.body;

  const result = await sosService.cancelSOS(alertId, req.userId, reason);

  res.status(200).json({
    success: true,
    ...result,
  });
};

/**
 * POST /api/sos/resolve/:alertId
 * A real response occurred (e.g. campus security responded). Distinct
 * from cancelSOS - not subject to the 5-minute cancellation window.
 */
const resolveSOS = async (req, res) => {
  const { alertId } = req.params;
  const { resolvedBy = "user", resolutionReason } = req.body;

  const result = await sosService.resolveSOS(alertId, req.userId, {
    resolvedBy,
    resolutionReason,
  });

  res.status(200).json({
    success: true,
    ...result,
  });
};

/**
 * GET /api/sos/history
 */
const getHistory = async (req, res) => {
  const { limit = 20, offset = 0, status } = req.query;

  const result = await sosService.getAlertHistory(req.userId, {
    limit: Number.parseInt(limit),
    offset: Number.parseInt(offset),
    status,
  });

  res.status(200).json({
    success: true,
    ...result,
  });
};

/**
 * GET /api/sos/history/:alertId
 */
const getHistoryEntry = async (req, res) => {
  const { alertId } = req.params;

  const alert = await sosService.getAlertById(alertId, req.userId);

  res.status(200).json({
    success: true,
    alert,
  });
};

/**
 * GET /api/sos/status/:alertId
 */
const getStatus = async (req, res) => {
  const { alertId } = req.params;

  const alert = await SOSAlert.findOne({
    _id: alertId,
    userId: req.userId,
  }).select("status createdAt updatedAt");

  if (!alert) {
    return res.status(404).json({
      success: false,
      message: "Alert not found",
    });
  }

  res.status(200).json({
    success: true,
    status: alert.status,
    canCancel: alert.canCancel(),
    cancellationTimeRemaining: alert.getCancellationTimeRemaining(),
    createdAt: alert.createdAt,
    updatedAt: alert.updatedAt,
  });
};

export default {
  triggerSOS,
  cancelSOS,
  resolveSOS,
  getHistory,
  getHistoryEntry,
  getStatus,
};
