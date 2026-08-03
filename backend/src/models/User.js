import mongoose from "mongoose";
import { EMAIL_REGEX } from "../utils/regex.js";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
      lowercase: true,
      match: [EMAIL_REGEX, "Please enter a valid email"],
      index: true,
    },
    password: {
      type: String,
      select: false,
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    authProvider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    profilePicture: {
      type: String,
      trim: true,
      validate: {
        validator: function (v) {
          if (!v) return true;
          try {
            return new URL(v).protocol === "https:";
          } catch {
            return false;
          }
        },
        message: "Profile picture must be a valid HTTPS URL",
      },
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
    },
    deviceInfo: {
      type: String,
    },
    universityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "University",
      index: true,
    },
    selectedUniversity: {
      type: String,
      trim: true,
    },
    onboardingStep: {
      type: String,
      enum: ["welcome", "location", "university", "contacts", "complete"],
      default: "welcome",
    },
    preferences: {
      autoShareLocation: {
        type: Boolean,
        default: true,
      },
      alertSound: {
        type: Boolean,
        default: true,
      },
      onboardingLocation: {
        type: {
          latitude: Number,
          longitude: Number,
          updatedAt: Date,
        },
        default: null,
      },
    },
    passwordResetAt: {
      type: Date,
    },
    lastPasswordChange: {
      type: Date,
    },
    passwordChangedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ createdAt: -1 });

// Method to get safe user data
userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.__v;
  delete user.password;
  return user;
};

userSchema.methods.getSecurityContacts = async function () {
  if (!this.universityId) {
    const CampusSecurity = mongoose.model("CampusSecurity");
    return await CampusSecurity.find({ isActive: true });
  }

  const University = mongoose.model("University");
  const university = await University.findById(this.universityId);
  if (!university) {
    return [];
  }

  return await university.getAllSecurityContacts();
};

userSchema.methods.canResetPassword = function () {
  if (!this.password) return true;
  if (this.lastPasswordChange) {
    const minutesSinceChange =
      (Date.now() - this.lastPasswordChange.getTime()) / 60000;
    if (minutesSinceChange < 1) {
      return false;
    }
  }
  if (!this.isActive) {
    return false;
  }
  return true;
};

export default mongoose.model("User", userSchema);
