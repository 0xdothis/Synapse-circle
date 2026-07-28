import mongoose from "mongoose";

const otpSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    otpCode: {
      type: String,
      required: true,
      trim: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    isUsed: {
      type: Boolean,
      default: false,
    },
    attempts: {
      type: Number,
      default: 0,
    },
    purpose: {
      type: String,
      enum: ["signup", "login", "reset", "reset_password"],
      default: "signup",
    },
  },
  {
    timestamps: true,
  },
);

// Indexes
otpSchema.index({ email: 1, otpCode: 1 });
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
otpSchema.index({ purpose: 1, isUsed: 1 });

export default mongoose.model("OTP", otpSchema);
