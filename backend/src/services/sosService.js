import SOSAlert from "../models/SOSAlert.js";
import TrustedContact from "../models/TrustedContact.js";
import CampusSecurity from "../models/CampusSecurity.js";
import EmergencyDirectory from "../models/EmergencyDirectory.js";
import AlertRecipient from "../models/AlertRecipient.js";
import User from "../models/User.js";
import emailService from "./emailService.js";
import { logger } from "../utils/logger.js";

class SOSService {
  /**
   * Trigger an SOS alert
   */
  async triggerSOS(userId, locationData) {
    try {
      if (!userId) {
        const error = new Error("User authentication required");
        error.statusCode = 401;
        throw error;
      }

      const { latitude, longitude, locationAvailable = true } = locationData;

      // Get user details
      const user = await User.findById(userId);
      if (!user) {
        const error = new Error("User not found");
        error.statusCode = 404;
        throw error;
      }

      const FIXED_MESSAGE =
        "Help me, I am in an unsafe environment and I feel unsafe, here's my live location.";

      // Get trusted contacts
      const trustedContacts = await TrustedContact.find({
        userId,
        isActive: true,
      });

      let securityContacts = [];
      if (user.university?.acronym) {
        securityContacts = await CampusSecurity.find({
          isActive: true,
          universityAcronym: user.university.acronym,
        });
      } else {
        securityContacts = await CampusSecurity.find({
          isActive: true,
        });
      }

      // Get emergency directory contacts
      const emergencyContacts = await EmergencyDirectory.find({
        isActive: true,
        isVerified: true,
      }).limit(10);

      // Check if there are any recipients
      if (
        trustedContacts.length === 0 &&
        securityContacts.length === 0 &&
        emergencyContacts.length === 0
      ) {
        const error = new Error(
          "No contacts available. Please add trusted contacts first.",
        );
        error.statusCode = 400;
        throw error;
      }

      if (!latitude || !longitude) {
        const error = new Error(
          "Location is required to send an SOS alert. Please enable location services.",
        );
        error.statusCode = 400;
        throw error;
      }

      // Generate location link
      const locationLink =
        latitude && longitude
          ? `https://www.google.com/maps?q=${latitude},${longitude}`
          : null;

      // Create the alert record.
      const alert = await SOSAlert.create({
        userId,
        latitude: latitude || null,
        longitude: longitude || null,
        locationAvailable,
        locationLink,
        message: FIXED_MESSAGE,
        status: "sent",
      });

      // Build the recipient list for this alert. Alerts are email-only
      const recipients = [];

      trustedContacts.forEach((contact) => {
        recipients.push({
          type: "trusted_contact",
          recipientId: contact._id,
          email: contact.email,
          name: contact.name,
          relationship: contact.relationship,
        });
      });

      securityContacts.forEach((security) => {
        recipients.push({
          type: "campus_security",
          recipientId: security._id,
          email: security.email,
          name: security.name,
          relationship: "campus_security",
        });
      });

      emergencyContacts.forEach((emergency) => {
        recipients.push({
          type: "emergency_directory",
          recipientId: emergency._id,
          email: emergency.email,
          name: emergency.name,
          relationship: emergency.type,
        });
      });

      // Prepare and send emails
      const emailData = {
        userName: user.name || user.email,
        userEmail: user.email,
        latitude,
        longitude,
        locationLink,
        alertId: alert._id.toString(),
        isCancelled: false,
        timestamp: new Date().toISOString(),
        message: FIXED_MESSAGE,
        contacts: recipients.map((r) => ({
          email: r.email,
          name: r.name,
          relationship: r.relationship,
          type: r.type,
        })),
      };

      const emailResults = await emailService.sendBulkSOSAlerts(emailData);

      // Persist delivery results directly as AlertRecipient documents
      const recipientOperations = recipients.map((recipient, index) => ({
        insertOne: {
          document: {
            alertId: alert._id,
            userId,
            recipientType: recipient.type,
            recipientId: recipient.recipientId,
            name: recipient.name,
            email: recipient.email,
            emailStatus: emailResults[index].success ? "delivered" : "failed",
            emailSentAt: new Date(),
            emailError: emailResults[index].success
              ? null
              : emailResults[index].error,
            delivered: emailResults[index].success,
          },
        },
      }));

      if (recipientOperations.length > 0) {
        await AlertRecipient.bulkWrite(recipientOperations, { ordered: false });
      }

      alert.emailSentAt = new Date();
      await alert.save();

      Promise.resolve(
        emailService.sendSOSConfirmationToUser(userId, {
          alertId: alert._id,
          latitude,
          longitude,
          locationLink,
          message: FIXED_MESSAGE,
          timestamp: new Date().toISOString(),
        }),
      ).catch((err) => {
        logger.error("SOS confirmation email failed:", err);
      });

      // Build the response's notification summary
      const notifications = recipients.map((recipient, index) => ({
        type: recipient.type,
        name: recipient.name,
        email: recipient.email,
        delivered: emailResults[index].success,
      }));

      const deliveredCount = notifications.filter((n) => n.delivered).length;
      const totalCount = notifications.length;

      logger.info(
        `SOS alert ${alert._id} sent to ${deliveredCount}/${totalCount} recipients`,
      );

      return {
        success: true,
        alertId: alert._id,
        status: alert.status,
        contactsNotified: notifications,
        deliveredCount,
        totalCount,
        message: `Alert sent to ${deliveredCount} of ${totalCount} recipients`,
      };
    } catch (error) {
      logger.error("SOS trigger error:", error);
      throw error;
    }
  }

  /**
   * Cancel an SOS alert
   */
  async cancelSOS(alertId, userId, reason = "false_alarm") {
    try {
      const alert = await SOSAlert.findOne({ _id: alertId, userId });

      if (!alert) {
        const error = new Error("Alert not found");
        error.statusCode = 404;
        throw error;
      }

      if (alert.status !== "sent") {
        const error = new Error(
          `Alert cannot be cancelled (status: ${alert.status})`,
        );
        error.statusCode = 400;
        throw error;
      }

      // Check cancellation window
      if (!alert.canCancel()) {
        const error = new Error("Cancellation window has passed (5 minutes)");
        error.statusCode = 400;
        throw error;
      }

      // Update alert
      alert.status = "cancelled";
      alert.cancelledAt = new Date();
      alert.cancellationReason = reason;
      await alert.save();

      // Send cancellation notification
      const user = await User.findById(userId);
      const recipients = await AlertRecipient.find({ alertId });

      if (recipients.length > 0) {
        const contacts = recipients.map((r) => ({
          email: r.email,
          name: r.name,
          relationship: r.recipientType,
          type: r.recipientType,
        }));

        const emailData = {
          userName: user.name || user.email,
          userEmail: user.email,
          latitude: alert.latitude,
          longitude: alert.longitude,
          locationLink: alert.locationLink,
          alertId: alert._id.toString(),
          isCancelled: true,
          timestamp: new Date().toISOString(),
          contacts,
        };

        await emailService.sendBulkSOSAlerts(emailData);

        // Update recipient records
        await AlertRecipient.updateMany(
          { alertId },
          {
            delivered: true,
            emailStatus: "delivered",
          },
        );
      }

      logger.info(`SOS alert ${alertId} cancelled by user ${userId}`);

      return {
        success: true,
        alertId: alert._id,
        status: alert.status,
        message: "Alert cancelled successfully",
      };
    } catch (error) {
      logger.error("SOS cancellation error:", error);
      throw error;
    }
  }

  /**
   * Get alert history for a user
   */
  async getAlertHistory(userId, options = {}) {
    try {
      const { limit = 20, offset = 0, status } = options;

      const query = { userId };
      if (status) {
        query.status = status;
      }

      const alerts = await SOSAlert.find(query)
        .select(
          "status createdAt latitude longitude locationAvailable locationLink cancelledAt cancellationReason",
        )
        .sort({ createdAt: -1 })
        .skip(offset)
        .limit(limit)
        .lean()
        .exec();

      const total = await SOSAlert.countDocuments(query);

      const alertIds = alerts.map((alert) => alert._id);
      const recipientStats = await AlertRecipient.aggregate([
        { $match: { alertId: { $in: alertIds } } },
        {
          $group: {
            _id: "$alertId",
            total: { $sum: 1 },
            delivered: { $sum: { $cond: ["$delivered", 1, 0] } },
          },
        },
      ]);
      const statsByAlertId = new Map(
        recipientStats.map((stat) => [stat._id.toString(), stat]),
      );

      return {
        alerts: alerts.map((alert) => {
          const stats = statsByAlertId.get(alert._id.toString()) || {
            total: 0,
            delivered: 0,
          };

          return {
            id: alert._id,
            status: alert.status,
            timestamp: alert.createdAt,
            location: alert.locationAvailable
              ? {
                  latitude: alert.latitude,
                  longitude: alert.longitude,
                  available: alert.locationAvailable,
                }
              : null,
            locationLink: alert.locationLink,
            cancelledAt: alert.cancelledAt,
            cancellationReason: alert.cancellationReason,
            recipients: stats.total,
            delivered: stats.delivered,
          };
        }),
        total,
        offset,
        limit,
      };
    } catch (error) {
      logger.error("Alert history error:", error);
      throw error;
    }
  }

  /**
   * Get a specific alert by ID
   */
  async getAlertById(alertId, userId) {
    try {
      const alert = await SOSAlert.findOne({ _id: alertId, userId });

      if (!alert) {
        const error = new Error("Alert not found");
        error.statusCode = 404;
        throw error;
      }

      const recipients = await AlertRecipient.find({ alertId }).select(
        "recipientType name email delivered emailStatus emailSentAt",
      );

      return {
        id: alert._id,
        status: alert.status,
        timestamp: alert.createdAt,
        location: {
          latitude: alert.latitude,
          longitude: alert.longitude,
          available: alert.locationAvailable,
        },
        locationLink: alert.locationLink,
        contactsNotified: recipients.map((r) => ({
          type: r.recipientType,
          name: r.name,
          email: r.email,
          delivered: r.delivered,
          emailStatus: r.emailStatus,
          emailSentAt: r.emailSentAt,
        })),
        cancelledAt: alert.cancelledAt,
        cancellationReason: alert.cancellationReason,
        canCancel: alert.canCancel(),
        cancellationTimeRemaining: alert.getCancellationTimeRemaining(),
      };
    } catch (error) {
      logger.error("Get alert error:", error);
      throw error;
    }
  }
}

export default new SOSService();
