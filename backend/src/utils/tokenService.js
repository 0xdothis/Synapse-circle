import jwt from "jsonwebtoken";
import crypto from "node:crypto";
import config from "./config.js";
import { logger } from "./logger.js";

const isProd = process.env.NODE_ENV === "production";

const baseCookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: isProd ? "none" : "lax",
  path: "/",
};

/**
 * Native apps identify themselves with this header on every request.
 */
export const isMobileClient = (req) =>
  req.headers["x-client-type"] === "mobile";

export const generateAccessToken = (userId, email, role = "user") => {
  const token = jwt.sign(
    { userId, email, role, type: "access" },
    process.env.ACCESS_TOKEN_SECRET || config.jwtSecret,
    { expiresIn: config.jwtExpiresIn || "15m" },
  );

  logger.debug("Access token generated", {
    userId,
    email,
    expiresIn: config.jwtExpiresIn || "15m",
  });

  return token;
};

/**
 * Refresh tokens carry a `jti` (JWT ID) so the session can be looked up
 */
export const generateRefreshToken = (userId, email, role = "user") => {
  const jti = crypto.randomUUID();

  const token = jwt.sign(
    { userId, email, role, type: "refresh" },
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
    expiresIn: config.refreshExpiresIn || "7d",
  });

  return { token, jti, expiresAt: new Date(exp * 1000) };
};

export const setAccessTokenCookie = (res, token) => {
  return res.cookie("accessToken", token, {
    ...baseCookieOptions,
    maxAge: 15 * 60 * 1000,
  });
};

export const setRefreshTokenCookie = (res, token) => {
  return res.cookie("refreshToken", token, {
    ...baseCookieOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

export const clearTokenCookies = (res) => {
  res.clearCookie("accessToken", { ...baseCookieOptions });
  res.clearCookie("refreshToken", { ...baseCookieOptions });
  res.clearCookie("csrfToken", {
    ...baseCookieOptions,
    httpOnly: false,
  });
};

// Generate OTP (already implemented)
export const generateOtp = () => {
  return crypto.randomInt(100000, 1000000).toString();
};

// ---------- CSRF Protection ----------
export const generateCsrfToken = (res) => {
  const token = crypto.randomBytes(32).toString("hex");

  res.cookie("csrfToken", token, {
    httpOnly: false,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    maxAge: 15 * 60 * 1000,
    path: "/",
  });

  return token;
};

export const verifyCsrfToken = (req, res, next) => {
  if (isMobileClient(req)) return next();
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) return next();

  // Skip in development for easier testing
  if (!isProd) return next();

  const cookieToken = req.cookies?.csrfToken;
  const headerToken = req.headers["x-csrf-token"];

  if (!cookieToken || !headerToken) {
    logger.warn("CSRF token missing", {
      path: req.path,
      method: req.method,
      ip: req.ip,
    });

    const err = new Error("CSRF token missing");
    err.statusCode = 403;
    return next(err);
  }

  // Constant-time comparison prevents timing attacks
  const cookieBuf = Buffer.from(cookieToken);
  const headerBuf = Buffer.from(headerToken);

  if (
    cookieBuf.length !== headerBuf.length ||
    !crypto.timingSafeEqual(cookieBuf, headerBuf)
  ) {
    logger.warn("Invalid CSRF token", {
      path: req.path,
      method: req.method,
      ip: req.ip,
    });

    const err = new Error("Invalid CSRF token");
    err.statusCode = 403;
    return next(err);
  }

  next();
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

// Get token from cookie
export const getAccessTokenFromCookie = (req) => {
  return req.cookies?.accessToken || null;
};

export const getRefreshTokenFromCookie = (req) => {
  return req.cookies?.refreshToken || null;
};
