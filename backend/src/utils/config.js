/**
 * Central place to read and validate environment configuration.
 */

const required = ["JWT_SECRET"];

const missing = required.filter((key) => !process.env[key]);

if (missing.length > 0) {
  throw new Error(
    `Missing required environment variable(s): ${missing.join(", ")}. The app cannot start without them.`,
  );
}

const nodeEnv = process.env.NODE_ENV || "development";

const config = {
  nodeEnv,
  isProduction: nodeEnv === "production",
  isTest: nodeEnv === "test",
  isDevelopment: nodeEnv !== "production",

  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRE || "15m",
  refreshSecret: process.env.REFRESH_SECRET,
  refreshExpiresIn: process.env.REFRESH_EXPIRE || "4d",

  // Google OAuth Configuration
  googleClientId: process.env.GOOGLE_CLIENT_ID,
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
  googleAndroidClientId: process.env.GOOGLE_ANDROID_CLIENT_ID,
  googleIOSClientId: process.env.GOOGLE_IOS_CLIENT_ID,

  disableEmailSending: process.env.DISABLE_EMAIL_SENDING === "true",
  disableRateLimiting: process.env.DISABLE_RATE_LIMITING === "true",

  maxTrustedContacts: Number.parseInt(process.env.MAX_TRUSTED_CONTACTS) || 3,
  cancellationWindowMinutes:
    Number.parseInt(process.env.CANCELLATION_WINDOW_MINUTES) || 5,
  sosTimeoutSeconds: Number.parseInt(process.env.SOS_TIMEOUT_SECONDS) || 5,
  otpExpiryMinutes: 10,

  brevo: {
    apiKey: process.env.BREVO_API_KEY,
    fromName: process.env.BREVO_FROM_NAME || "SafeWalk Campus",
    fromEmail: process.env.BREVO_FROM_EMAIL,
  },
};

// Log Google config status (but don't expose secrets)
if (config.isDevelopment) {
  console.log("🔑 Google OAuth Config:", {
    clientIdSet: !!config.googleClientId,
    clientId: config.googleClientId
      ? config.googleClientId.substring(0, 20) + "..."
      : "Not set",
  });
}

export default config;
