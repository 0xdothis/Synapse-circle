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
 * Verify + rotate a refresh token. Returns one of:
 *   { accessToken, refreshToken, userId }  — success
 *   { error: "INVALID" }                   — bad signature/expired/unknown
 *   { error: "REUSED", userId }            — token was already rotated once
 *                                             before (likely stolen) — every
 *                                             session for this user has been
 *                                             revoked as a precaution.
 */
export const rotateSession = async (refreshToken, meta = {}) => {
  const decoded = verifyRefreshToken(refreshToken);
  if (!decoded?.jti) return { error: "INVALID" };

  const record = await RefreshToken.findOne({ jti: decoded.jti });
  if (!record || record.tokenHash !== hashToken(refreshToken)) {
    return { error: "INVALID" };
  }

  if (record.expiresAt < new Date()) {
    return { error: "INVALID" };
  }

  if (record.revokedAt) {
    logger.warn("Refresh token reuse detected — revoking all sessions", {
      userId: decoded.userId,
      jti: decoded.jti,
    });
    await RefreshToken.updateMany(
      { userId: decoded.userId, revokedAt: null },
      { revokedAt: new Date() },
    );
    return { error: "REUSED", userId: decoded.userId };
  }

  const { accessToken, refreshToken: newRefreshToken } = await createSession(
    decoded.userId,
    decoded.email,
    decoded.role,
    meta,
  );

  record.revokedAt = new Date();
  await record.save();

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
