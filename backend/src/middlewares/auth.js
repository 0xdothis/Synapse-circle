import User from "../models/User.js";
import { logger } from "../utils/logger.js";
import { verifyAccessToken } from "../utils/tokenService.js";

/**
 * Reads the access token from the Authorization header.
 */
const extractToken = (req) => {
  const authHeader = req.header("Authorization");
  return authHeader?.replace("Bearer ", "") || null;
};

/**
 * Decode a token and load its associated (active) user.
 * Returns { user, decoded } on success, or { errorStatus, errorBody } on
 * failure.
 */
const resolveUserFromToken = async (token) => {
  const decoded = verifyAccessToken(token);
  if (!decoded) {
    return {
      errorStatus: 401,
      errorBody: {
        success: false,
        message: "Invalid token. Please log in again.",
        code: "INVALID_TOKEN",
      },
    };
  }

  const user = await User.findById(decoded.userId);
  if (!user) {
    return {
      errorStatus: 404,
      errorBody: {
        success: false,
        message: "User not found. Please log in again.",
        code: "USER_NOT_FOUND",
      },
      userNotFound: true,
    };
  }

  if (user.isDeleted) {
    return {
      errorStatus: 400,
      errorBody: {
        success: false,
        message: "Account has already been deleted.",
        code: "ACCOUNT_DELETED",
      },
    };
  }

  if (!user.isActive) {
    return {
      errorStatus: 403,
      errorBody: {
        success: false,
        message: "Account is deactivated. Please contact support.",
        code: "ACCOUNT_DEACTIVATED",
      },
    };
  }

  if (
    user.passwordChangedAt &&
    decoded.iat * 1000 < user.passwordChangedAt.getTime()
  ) {
    return {
      errorStatus: 401,
      errorBody: {
        success: false,
        message: "Session invalidated. Please log in again.",
        code: "TOKEN_INVALIDATED",
      },
    };
  }

  return { user, decoded };
};

/**
 * Map a thrown error to the appropriate auth error response.
 */
const mapAuthError = (error) => {
  if (error.name === "JsonWebTokenError") {
    return {
      status: 401,
      body: {
        success: false,
        message: "Invalid json web token. Please log in again.",
        code: "INVALID_TOKEN",
      },
    };
  }

  if (error.name === "TokenExpiredError") {
    return {
      status: 401,
      body: {
        success: false,
        message: "Token expired. Please refresh or log in again.",
        code: "TOKEN_EXPIRED",
      },
    };
  }

  logger.error("Auth middleware error:", error);
  return {
    status: 500,
    body: {
      success: false,
      message: "Authentication error. Please try again.",
      code: "AUTH_ERROR",
    },
  };
};

/**
 * Authentication middleware - verify JWT access token from the
 * Authorization header and attach the user to the request.
 *
 * Also attaches the decoded token claims to req.tokenClaims (includes
 * emailVerified as of the moment the token was issued/rotated) so
 * downstream middleware like requireVerified can gate on it without an
 * extra DB read.
 */
const authenticate = async (req, res, next) => {
  try {
    const token = extractToken(req);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication required. Please log in.",
        code: "MISSING_TOKEN",
      });
    }

    const result = await resolveUserFromToken(token);

    if (!result.user) {
      req._userNotFound = !!result.userNotFound;
      return res.status(result.errorStatus).json(result.errorBody);
    }

    req.user = result.user;
    req.userId = result.user._id;
    req.tokenClaims = result.decoded;

    next();
  } catch (error) {
    const { status, body } = mapAuthError(error);
    return res.status(status).json(body);
  }
};

/**
 * Role-based authorization middleware
 * Only allow specific roles to access certain endpoints
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Insufficient permissions. Access denied.",
      });
    }

    next();
  };
};

/**
 * Check if user has a specific permission
 * For more granular authorization
 */
const hasPermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    if (!req.user.permissions?.includes(permission)) {
      return res.status(403).json({
        success: false,
        message: `Permission denied. Required: ${permission}`,
      });
    }

    next();
  };
};

/**
 * Verify that the user is accessing their own resource
 * For endpoints like /users/:id
 */
const isOwnResource = (paramName = "id") => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const resourceId = req.params[paramName];
    if (!resourceId) {
      return res.status(400).json({
        success: false,
        message: "Resource ID is required",
      });
    }

    if (resourceId !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Access denied. You can only access your own resources.",
      });
    }

    next();
  };
};

/**
 * Require the token's emailVerified claim to be true.
 */
const requireVerified = (req, res, next) => {
  if (!req.tokenClaims?.emailVerified) {
    return res.status(403).json({
      success: false,
      message: "Please verify your email to access this resource.",
      code: "EMAIL_NOT_VERIFIED",
    });
  }

  next();
};

export {
  authenticate,
  authorize,
  hasPermission,
  isOwnResource,
  requireVerified,
};
