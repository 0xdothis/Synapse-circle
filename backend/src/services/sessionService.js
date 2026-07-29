import crypto from "node:crypto";
import RefreshToken from "../models/RefreshToken.js";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../utils/tokenService.js";
import { logger } from "../utils/logger.js";

const hashToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

/**
 * Issue a brand-new access + refresh token pair for a user and persist
 * the refresh token's hash so it can be looked up, rotated, and revoked.
 */
export const createSession = async (
  userId,
  email,
  role = "user",
  meta = {},
) => {
  const accessToken = generateAccessToken(userId, email, role);
  const {
    token: refreshToken,
    jti,
    expiresAt,
  } = generateRefreshToken(userId, email, role);

  await RefreshToken.create({
    jti,
    userId,
    tokenHash: hashToken(refreshToken),
    expiresAt,
    userAgent: meta.userAgent || null,
    ip: meta.ip || null,
  });

  return { accessToken, refreshToken };
};

/**
 * Verify + rotate a refresh token.
 */
export const rotateSession = async (refreshToken, meta = {}) => {
  const decoded = verifyRefreshToken(refreshToken);
  if (!decoded?.jti) return { error: "INVALID" };

  const tokenHash = hashToken(refreshToken);

  const record = await RefreshToken.findOneAndUpdate(
    {
      jti: decoded.jti,
      tokenHash,
      revokedAt: null,
      expiresAt: { $gt: new Date() },
    },
    { revokedAt: new Date() },
    { new: false },
  );

  if (!record) {
    const existing = await RefreshToken.findOne({
      jti: decoded.jti,
      tokenHash,
    });

    if (existing?.revokedAt) {
      logger.warn("Refresh token reuse detected — revoking all sessions", {
        userId: existing.userId,
        jti: decoded.jti,
      });
      await RefreshToken.updateMany(
        { userId: existing.userId, revokedAt: null },
        { revokedAt: new Date() },
      );
      return { error: "REUSED", userId: existing.userId };
    }

    return { error: "INVALID" };
  }

  const { accessToken, refreshToken: newRefreshToken } = await createSession(
    decoded.userId,
    decoded.email,
    decoded.role,
    meta,
  );

  return { accessToken, refreshToken: newRefreshToken, userId: decoded.userId };
};

/** Revoke a single session (logout on one device). */
export const revokeSession = async (refreshToken) => {
  const decoded = verifyRefreshToken(refreshToken);
  if (!decoded?.jti) return;
  await RefreshToken.updateOne({ jti: decoded.jti }, { revokedAt: new Date() });
};

/** Revoke every active session for a user (password change, "log out everywhere"). */
export const revokeAllSessions = async (userId) => {
  await RefreshToken.updateMany(
    { userId, revokedAt: null },
    { revokedAt: new Date() },
  );
};

export default {
  createSession,
  rotateSession,
  revokeSession,
  revokeAllSessions,
};
