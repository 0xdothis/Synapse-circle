import brevo from "@getbrevo/brevo";
import crypto from "node:crypto";
import OTP from "../models/OTP.js";
import User from "../models/User.js";
import { logger } from "../utils/logger.js";
import config from "../utils/config.js";
import {
  otpEmailTemplate,
  passwordResetEmailTemplate,
  welcomeEmailTemplate,
  onboardingCompleteEmailTemplate,
  profileCompletionEmailTemplate,
  sosAlertEmailTemplate,
  sosCancelledEmailTemplate,
  sosFalseAlarmEmailTemplate,
  sosConfirmationEmailTemplate,
} from "./templates/index.js";

const SOS_STATUS = {
  ACTIVE: "active",
  CANCELLED: "cancelled",
  FALSE_ALARM: "false_alarm",
};

class EmailService {
  constructor() {
    // Initialize Brevo
    this.apiInstance = new brevo.TransactionalEmailsApi();
    this.apiKey = brevo.ApiClient.instance.authentications["api-key"];
    this.apiKey.apiKey = config.brevo.apiKey;

    this.senderName = config.brevo.fromName;
    this.fromEmail = config.brevo.fromEmail;
    this.googleMapsApiKey = config.googleMaps?.apiKey;
  }

  // Low-level transport
  /**
   * Sends a single templated email via Brevo. Every template module
   * returns {subject, html, text}; this is the only place that talks to
   * the Brevo SDK, so templates never need to know about transport.
   */
  async _send({
    to,
    subject,
    html,
    text,
    replyToName = "SafeWalk Campus Support",
  }) {
    const sendSmtpEmail = new brevo.SendSmtpEmail();
    sendSmtpEmail.subject = subject;
    sendSmtpEmail.htmlContent = html;
    sendSmtpEmail.textContent = text;
    sendSmtpEmail.sender = { name: this.senderName, email: this.fromEmail };
    sendSmtpEmail.to = Array.isArray(to) ? to : [to];
    sendSmtpEmail.replyTo = { email: this.fromEmail, name: replyToName };

    return this.apiInstance.sendTransacEmail(sendSmtpEmail);
  }

  _isEmailSendingDisabled() {
    return config.isTest && config.disableEmailSending === true;
  }

  generateOTP() {
    const otp = crypto.randomInt(100000, 999999);
    return otp.toString();
  }

  // OTP: signup / login verification
  async sendOTP(email, purpose = "signup") {
    try {
      const otpCode = this.generateOTP();
      const expiresAt = new Date(
        Date.now() + config.otpExpiryMinutes * 60 * 1000,
      );

      await OTP.create({ email, otpCode, expiresAt, purpose, isUsed: false });

      if (this._isEmailSendingDisabled()) {
        if (config.isDevelopment)
          console.log(`📧 [TEST] OTP for ${email}: ${otpCode}`);
        return {
          success: true,
          message: "OTP sent successfully to your email",
          development_otp: otpCode,
        };
      }

      const { subject, html, text } = otpEmailTemplate({
        otpCode,
        expiryMinutes: config.otpExpiryMinutes,
        purpose,
      });
      const result = await this._send({ to: { email }, subject, html, text });

      logger.info(`OTP sent to ${email}: ${result.messageId}`);

      return {
        success: true,
        message: "OTP sent successfully to your email",
        ...(config.isDevelopment && { development_otp: otpCode }),
      };
    } catch (error) {
      logger.error("OTP email send error:", error);
      throw new Error("Failed to send OTP via email. Please try again.");
    }
  }

  async verifyOTP(email, otpCode) {
    try {
      const user = await User.findOne({ email });
      if (!user) throw new Error("User not found");

      const otp = await OTP.findOne({
        email,
        otpCode,
        isUsed: false,
        expiresAt: { $gt: new Date() },
      });
      if (!otp) throw new Error("Invalid or expired OTP");

      otp.isUsed = true;
      await otp.save();

      user.isVerified = true;
      user.lastLogin = new Date();
      await user.save();

      return { success: true, user, message: "OTP verified successfully" };
    } catch (error) {
      logger.error("OTP verification error:", error);
      throw error;
    }
  }

  async resendOTP(email, purpose = "signup") {
    await OTP.updateMany({ email, isUsed: false }, { isUsed: true });
    return this.sendOTP(email, purpose);
  }

  // Password reset
  async sendPasswordResetOTP(email, userName) {
    try {
      const otpCode = this.generateOTP();
      const expiresAt = new Date(
        Date.now() + config.otpExpiryMinutes * 60 * 1000,
      );

      const otp = await OTP.create({
        email,
        otpCode,
        expiresAt,
        purpose: "reset_password",
        isPasswordReset: true,
        isUsed: false,
      });

      if (this._isEmailSendingDisabled()) {
        return {
          success: true,
          message: "Password reset OTP sent successfully",
          development_otp: otpCode,
        };
      }

      const { subject, html, text } = passwordResetEmailTemplate({
        otpCode,
        expiryMinutes: config.otpExpiryMinutes,
        userName,
      });
      const result = await this._send({
        to: { email, name: userName || email },
        subject,
        html,
        text,
      });

      logger.info(`Password reset OTP sent to ${email}: ${result.messageId}`);

      return {
        success: true,
        message: "Password reset OTP sent successfully",
        resetId: otp._id,
        ...(config.isDevelopment && { development_otp: otpCode }),
      };
    } catch (error) {
      logger.error("Password reset OTP send error:", error);
      throw new Error("Failed to send password reset OTP. Please try again.");
    }
  }

  async verifyPasswordResetOTP(email, otpCode) {
    try {
      const user = await User.findOne({ email });
      if (!user) throw new Error("User not found");

      const otp = await OTP.findOne({
        email,
        otpCode,
        purpose: "reset_password",
        isUsed: false,
        expiresAt: { $gt: new Date() },
      });

      if (!otp) {
        const expiredOTP = await OTP.findOne({
          email,
          otpCode,
          purpose: "reset_password",
          isUsed: false,
        });
        if (expiredOTP && expiredOTP.expiresAt <= new Date()) {
          throw new Error("OTP has expired. Please request a new one.");
        }
        throw new Error("Invalid or expired OTP");
      }

      otp.isUsed = true;
      await otp.save();

      await OTP.updateMany(
        {
          email,
          purpose: "reset_password",
          isUsed: false,
          _id: { $ne: otp._id },
        },
        { isUsed: true },
      );

      return {
        success: true,
        user,
        resetId: otp._id,
        message: "OTP verified successfully",
      };
    } catch (error) {
      logger.error("Password reset OTP verification error:", error);
      throw error;
    }
  }

  // Onboarding lifecycle emails
  async sendWelcomeEmail(user) {
    try {
      if (this._isEmailSendingDisabled()) {
        console.log(`📧 [TEST] Welcome email to ${user.email}`);
        return { success: true, message: "Welcome email sent (test mode)" };
      }

      const { subject, html, text } = welcomeEmailTemplate({
        user,
        maxTrustedContacts: config.maxTrustedContacts,
      });
      const result = await this._send({
        to: { email: user.email, name: user.name },
        subject,
        html,
        text,
      });

      logger.info(`Welcome email sent to ${user.email}: ${result.messageId}`);
      return {
        success: true,
        messageId: result.messageId,
        message: "Welcome email sent successfully",
      };
    } catch (error) {
      logger.error("Welcome email send error:", error);
      return {
        success: false,
        message: "Failed to send welcome email",
        error: error.message,
      };
    }
  }

  async sendOnboardingCompleteEmail(user) {
    try {
      if (this._isEmailSendingDisabled()) {
        console.log(`📧 [TEST] Onboarding complete email to ${user.email}`);
        return {
          success: true,
          message: "Onboarding complete email sent (test mode)",
        };
      }

      const { subject, html, text } = onboardingCompleteEmailTemplate();
      const result = await this._send({
        to: { email: user.email, name: user.name || user.phoneNumber },
        subject,
        html,
        text,
      });

      logger.info(
        `Onboarding complete email sent to ${user.email}: ${result.messageId}`,
      );
      return { success: true, messageId: result.messageId };
    } catch (error) {
      logger.error("Onboarding complete email error:", error);
      return {
        success: false,
        message: "Failed to send onboarding complete email",
      };
    }
  }

  async sendProfileCompletionEmail(user) {
    try {
      if (this._isEmailSendingDisabled()) {
        console.log(`📧 [TEST] Profile completion email to ${user.email}`);
        return {
          success: true,
          message: "Profile completion email sent (test mode)",
        };
      }

      const { subject, html, text } = profileCompletionEmailTemplate({ user });
      const result = await this._send({
        to: { email: user.email, name: user.name || user.phoneNumber },
        subject,
        html,
        text,
      });

      logger.info(
        `Profile completion email sent to ${user.email}: ${result.messageId}`,
      );
      return {
        success: true,
        messageId: result.messageId,
        message: "Profile completion email sent successfully",
      };
    } catch (error) {
      logger.error("Profile completion email send error:", error);
      return {
        success: false,
        message: "Failed to send profile completion email",
        error: error.message,
      };
    }
  }

  // SOS alerts
  /**
   * Picks the right template for the alert's lifecycle state and builds
   * {subject, html, text}. Centralizing this means sendSOSAlert and
   * sendBulkSOSAlerts don't need to know which template module to call.
   */
  _buildSOSEmail(alertData, recipientName) {
    const status =
      alertData.status ||
      (alertData.isCancelled ? SOS_STATUS.CANCELLED : SOS_STATUS.ACTIVE);

    const shared = {
      recipientName,
      userName: alertData.userName,
      userPhone: alertData.userPhone,
      userEmail: alertData.userEmail,
      latitude: alertData.latitude,
      longitude: alertData.longitude,
      locationLink: alertData.locationLink,
      locationLabel: alertData.locationLabel,
      contacts: alertData.contacts,
      alertId: alertData.alertId,
      googleMapsApiKey: this.googleMapsApiKey,
    };

    switch (status) {
      case SOS_STATUS.CANCELLED:
        return sosCancelledEmailTemplate({
          ...shared,
          timeTriggered: alertData.timeTriggered,
          timeCancelled: alertData.timeCancelled || alertData.timestamp,
        });
      case SOS_STATUS.FALSE_ALARM:
        return sosFalseAlarmEmailTemplate({
          ...shared,
          timeTriggered: alertData.timeTriggered,
          timeMarkedFalseAlarm:
            alertData.timeMarkedFalseAlarm || alertData.timestamp,
        });
      case SOS_STATUS.ACTIVE:
      default:
        return sosAlertEmailTemplate({
          ...shared,
          timestamp: alertData.timestamp,
          message: alertData.message,
          campusSecurityPhone: alertData.campusSecurityPhone,
        });
    }
  }

  /**
   * Sends the SOS alert email to a single contact (or set of contacts
   * sharing the same recipientName, e.g. a household). Use
   * sendBulkSOSAlerts to fan out to every trusted contact individually
   * with personalized "Hi {name}," greetings.
   */
  async sendSOSAlert(alertData) {
    const { contacts = [] } = alertData;

    if (this._isEmailSendingDisabled()) {
      return {
        success: true,
        messageId: "test-message-id",
        recipients: contacts.map((c) => c.email),
      };
    }

    try {
      const recipients = contacts.map((contact) => ({
        email: contact.email,
        name: contact.name || contact.email,
      }));
      const recipientName = contacts[0]?.name;

      const { subject, html, text } = this._buildSOSEmail(
        alertData,
        recipientName,
      );
      const response = await this._send({
        to: recipients,
        subject,
        html,
        text,
      });

      logger.info(`Alert email sent successfully: ${response.messageId}`);
      return {
        success: true,
        messageId: response.messageId,
        recipients: recipients.map((r) => r.email),
      };
    } catch (error) {
      logger.error("Alert email send error:", error);
      throw new Error(`Failed to send alert email: ${error.message}`);
    }
  }

  /**
   * Sends the SOS alert to every contact individually (so each gets a
   * personalized "Hi {their name}," greeting) and reports per-contact
   * success/failure.
   */
  async sendBulkSOSAlerts(alertData) {
    try {
      const { contacts = [], ...baseData } = alertData;

      // If no contacts, return empty results array
      if (contacts.length === 0) {
        return [];
      }

      const results = await Promise.allSettled(
        contacts.map((contact) =>
          this.sendSOSAlert({ ...baseData, contacts: [contact] }),
        ),
      );

      return results.map((result, index) => ({
        contact: contacts[index],
        success: result.status === "fulfilled",
        messageId:
          result.status === "fulfilled" ? result.value.messageId : null,
        error: result.status === "rejected" ? result.reason.message : null,
      }));
    } catch (error) {
      logger.error("Bulk alert email send error:", error);
      throw error;
    }
  }

  /**
   * Confirmation sent back to the user themselves right after they
   * trigger an SOS alert.
   */
  async sendSOSConfirmationToUser(userId, alertData) {
    try {
      const user = await User.findById(userId);
      if (!user) throw new Error("User not found");

      if (this._isEmailSendingDisabled()) {
        console.log(`📧 [TEST] SOS confirmation email to ${user.email}`);
        return {
          success: true,
          message: "SOS confirmation email sent (test mode)",
        };
      }

      const { subject, html, text } = sosConfirmationEmailTemplate({
        userName: user.name || user.phoneNumber,
        userPhone: user.phoneNumber,
        latitude: alertData.latitude,
        longitude: alertData.longitude,
        locationLink: alertData.locationLink,
        alertId: alertData.alertId,
        timestamp: alertData.timestamp,
        message: alertData.message,
        googleMapsApiKey: this.googleMapsApiKey,
      });

      const result = await this._send({
        to: { email: user.email, name: user.name || user.phoneNumber },
        subject,
        html,
        text,
      });

      logger.info(
        `SOS confirmation email sent to ${user.email}: ${result.messageId}`,
      );
      return {
        success: true,
        messageId: result.messageId,
        message: "SOS confirmation email sent successfully",
      };
    } catch (error) {
      logger.error("SOS confirmation email send error:", error);
      return {
        success: false,
        message: "Failed to send SOS confirmation email",
        error: error.message,
      };
    }
  }
}

export default new EmailService();
