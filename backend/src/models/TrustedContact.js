import mongoose from "mongoose";
import { EMAIL_REGEX } from "../utils/regex.js";
import { PHONE_REGEX } from "../middlewares/validator.js";
import config from "../utils/config.js";

const trustedContactSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, "Contact name is required"],
      trim: true,
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required for alerts"],
      trim: true,
      lowercase: true,
      match: [EMAIL_REGEX, "Please enter a valid email"],
    },
    phoneNumber: {
      type: String,
      trim: true,
      default: null,
      validate: {
        validator: function (v) {
          if (!v) return true;
          return PHONE_REGEX.test(v);
        },
        message: "Please enter a valid phone number",
      },
    },
    relationship: {
      type: String,
      required: [true, "Relationship is required"],
      trim: true,
      enum: ["parent", "sibling", "friend", "roommate", "partner", "other"],
    },
    isPrimary: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

// Composite index for user and email (unique)
trustedContactSchema.index({ userId: 1, email: 1 }, { unique: true });

// Pre-save hook to enforce max contacts limit
trustedContactSchema.pre("save", async function (next) {
  const isBecomingActive = this.isNew
    ? this.isActive
    : this.isModified("isActive") && this.isActive;

  if (!isBecomingActive) {
    return next();
  }

  const count = await mongoose.model("TrustedContact").countDocuments({
    userId: this.userId,
    isActive: true,
    _id: { $ne: this._id },
  });

  if (count >= config.maxTrustedContacts) {
    const error = new Error(
      `You can only have a maximum of ${config.maxTrustedContacts} active trusted contacts.`,
    );
    error.statusCode = 400;
    return next(error);
  }
  next();
});

// Transform the document when serializing to JSON
trustedContactSchema.methods.toJSON = function () {
  const contact = this.toObject({ virtuals: true });
  delete contact.__v;
  return contact;
};

export default mongoose.model("TrustedContact", trustedContactSchema);
