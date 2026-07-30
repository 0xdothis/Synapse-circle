import mongoose from "mongoose";
import config from "../utils/config.js";

const sosAlertSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    latitude: {
      type: Number,
    },
    longitude: {
      type: Number,
    },
    locationAvailable: {
      type: Boolean,
      default: false,
    },
    locationLink: {
      type: String,
    },
    status: {
      type: String,
      enum: ["sent", "cancelled", "failed", "resolved"],
      default: "sent",
    },
    message: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    cancelledAt: {
      type: Date,
    },
    cancellationReason: {
      type: String,
      enum: ["false_alarm", "resolved", "user_error"],
    },
    // Who was notified and their delivery status now lives exclusively in
    // the AlertRecipient collection (query with { alertId: this._id }).
    // This alert previously also embedded `contactsNotified` and
    // `recipients` arrays that duplicated the same data — removed to stop
    // maintaining two sources of truth for delivery state.
    emailSubject: {
      type: String,
    },
    emailBody: {
      type: String,
    },
    emailSentAt: {
      type: Date,
    },
    emailFailureReason: {
      type: String,
    },
    deviceInfo: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
);

// Indexes
sosAlertSchema.index({ userId: 1, createdAt: -1 });
sosAlertSchema.index({ status: 1 });
sosAlertSchema.index({ createdAt: -1 });

// Method to check if cancellation is allowed
sosAlertSchema.methods.canCancel = function () {
  if (this.status !== "sent") return false;

  const now = new Date();
  const created = new Date(this.createdAt);
  const minutesPassed = (now - created) / 60000;

  return minutesPassed <= config.cancellationWindowMinutes;
};

// Method to get time remaining for cancellation
sosAlertSchema.methods.getCancellationTimeRemaining = function () {
  if (this.status !== "sent") return 0;

  const now = new Date();
  const created = new Date(this.createdAt);
  const elapsed = (now - created) / 60000;

  return Math.max(0, config.cancellationWindowMinutes - elapsed);
};

export default mongoose.model("SOSAlert", sosAlertSchema);
