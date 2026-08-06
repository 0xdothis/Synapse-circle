import jwt from "jsonwebtoken";
import crypto from "node:crypto";
import config from "./config.js";
import { logger } from "./logger.js";

export const generateAccessToken = (
  userId,
  email,
  role = "user",
  emailVerified = false,
) => {
  const token = jwt.sign(
    { userId, email, role, emailVerified, type: "access" },
    process.env.ACCESS_TOKEN_SECRET || config.jwtSecret,
    { expiresIn: config.jwtExpiresIn || "15m" },
  );

  logger.debug("Access token generated", {
    userId,
    email,
    emailVerified,
    expiresIn: config.jwtExpiresIn || "15m",
  });

  return token;
};

/**
 * Refresh tokens carry a `jti` (JWT ID) so the session can be looked up.
 * They also carry `emailVerified` so rotateSession has a fallback value,
 * though sessionService re-syncs this from the DB on every rotation.
 */
export const generateRefreshToken = (
  userId,
  email,
  role = "user",
  emailVerified = false,
) => {
  const jti = crypto.randomUUID();

  const token = jwt.sign(
    { userId, email, role, emailVerified, type: "refresh" },
    process.env.REFRESH_TOKEN_SECRET ||
      config.refreshSecret ||
      config.jwtSecret,
    { expiresIn: config.refreshExpiresIn || "7d", jwtid: jti },
  );

  const { exp } = jwt.decode(token);

  logger.debug("Refresh token generated", {
    userId,
    email,
    jti,
    emailVerified,
    expiresIn: config.refreshExpiresIn || "7d",
  });

  return { token, jti, expiresAt: new Date(exp * 1000) };
};

// Generate OTP
export const generateOtp = () => {
  return crypto.randomInt(100000, 1000000).toString();
};

// Token verification functions
export const verifyAccessToken = (token) => {
  try {
    const decoded = jwt.verify(
      token,
      process.env.ACCESS_TOKEN_SECRET || config.jwtSecret,
    );

    if (decoded.type !== "access") {
      return null;
    }

    return decoded;
  } catch (error) {
    logger.debug("Access token verification failed", {
      name: error.name,
      message: error.message,
    });
    return null;
  }
};

export const verifyRefreshToken = (token) => {
  try {
    const decoded = jwt.verify(
      token,
      process.env.REFRESH_TOKEN_SECRET ||
        config.refreshSecret ||
        config.jwtSecret,
    );

    if (decoded.type !== "refresh") {
      return null;
    }

    return decoded;
  } catch (error) {
    logger.debug("Refresh token verification failed", {
      name: error.name,
      message: error.message,
    });
    return null;
  }
};
