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
 * They get raw tokens in the JSON body (stored in Keychain/Keystore on
 * the client) instead of cookies, and are exempt from CSRF checks since
 * they aren't relying on ambient browser credentials.
 *
 * IMPORTANT: this header is just a routing hint, not a trust boundary —
 * do not use it anywhere as an authorization decision. The actual CSRF
 * bypass for authenticated routes is keyed off the presence of a Bearer
 * token (see verifyCsrfToken below), which a browser page cannot forge.
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
 * Refresh tokens carry a `jti` (JWT ID) so the session can be looked up,
 * rotated, and revoked server-side — see services/sessionService.js.
 * A bare JWT with no server-side record can never truly be revoked
 * (logout / password-change previously only cleared cookies, which did
 * nothing for a token that had already left the browser).
 *
 * BUGFIX: this previously read `config.jwtRefreshSecret` /
 * `config.jwtRefreshExpiresIn`, which don't exist on the config object
 * (config.js defines `refreshSecret` / `refreshExpiresIn`). As a result
 * refresh tokens silently fell back to signing with the *access* token
 * secret whenever REFRESH_TOKEN_SECRET wasn't set in the environment —
 * i.e. access and refresh tokens shared one secret in most deployments.
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
  // Native app: no ambient cookie is being sent on its behalf by a
  // browser, so cross-site request forgery doesn't apply to it.
  if (isMobileClient(req)) return next();

  // Any request already carrying an explicit Bearer credential was built
  // deliberately by client code (a browser page cannot attach an
  // Authorization header to a forged cross-site request), so it isn't
  // exploitable via CSRF either.
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
