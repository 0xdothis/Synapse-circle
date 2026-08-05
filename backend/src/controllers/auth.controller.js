import authService from "../services/auth.service.js";
import { logger } from "../utils/logger.js";

const getIncomingRefreshToken = (req) => req.body?.refreshToken || null;

/**
 * Session response strategy
 * All clients (web and mobile) receive accessToken/refreshToken directly
 * in the JSON body. Clients are responsible for storing them and sending
 * `Authorization: Bearer <accessToken>` on subsequent requests.
 */
const respondWithSession = async (
  req,
  res,
  { status = 200, message, user, extra = {} },
  { userId, email, role = "user" },
) => {
  const { accessToken, refreshToken } = await authService.createUserSession(
    { userId, email, role },
    { userAgent: req.headers["user-agent"], ip: req.ip },
  );

  return res.status(status).json({
    success: true,
    message,
    ...extra,
    user,
    accessToken,
    refreshToken,
  });
};

/**
 * POST /api/auth/signup
 */
const signup = async (req, res, next) => {
  try {
    const { email, name, password } = req.body;

    const result = await authService.signup({ email, name, password });

    if (result.error) {
      return res.status(result.error.status).json({
        success: false,
        message: result.error.message,
      });
    }

    const response = {
      success: true,
      message: result.message,
    };

    if (result.developmentOtp) {
      response.development_otp = result.developmentOtp;
    }

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/login
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const result = await authService.login(email, password);

    if (result.error) {
      return res.status(result.error.status).json({
        success: false,
        message: result.error.message,
      });
    }

    const { user } = result;

    logger.info("Login successful", {
      userId: user._id,
      email: user.email,
      ip: req.ip,
    });

    await respondWithSession(
      req,
      res,
      {
        message: "Login successful",
        user: authService.buildUserResponse(user),
      },
      { userId: user._id, email: user.email, role: user.role || "user" },
    );
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/verify-otp
 */
const verifyOtp = async (req, res, next) => {
  try {
    const { email, otpCode } = req.body;

    const result = await authService.verifyOtp(email, otpCode);

    await respondWithSession(
      req,
      res,
      {
        message: "OTP verified successfully",
        user: authService.buildUserResponse(result.user),
      },
      {
        userId: result.user._id,
        email: result.user.email,
        role: result.user.role || "user",
      },
    );
  } catch (error) {
    if (error.message === "Invalid or expired OTP") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
    if (error.message === "User not found") {
      return res.status(404).json({
        success: false,
        message: "User not found. Please sign up first.",
      });
    }
    next(error);
  }
};

/**
 * POST /api/auth/google
 */
const googleAuth = async (req, res, next) => {
  try {
    const { idToken } = req.body;

    const result = await authService.googleAuth(idToken);

    if (result.error) {
      return res.status(result.error.status).json({
        success: false,
        message: result.error.message,
      });
    }

    const { user, isNewUser } = result;

    await respondWithSession(
      req,
      res,
      {
        message: isNewUser ? "Account created with Google" : "Login successful",
        extra: { isNewUser },
        user: authService.buildUserResponse(user),
      },
      { userId: user._id, email: user.email, role: user.role || "user" },
    );
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/refresh-token
 */
const refreshToken = async (req, res, next) => {
  try {
    const incomingRefreshToken = getIncomingRefreshToken(req);

    if (!incomingRefreshToken) {
      return res.status(401).json({
        success: false,
        message: "Refresh token required. Please log in.",
      });
    }

    const result = await authService.refreshTokens(incomingRefreshToken, {
      userAgent: req.headers["user-agent"],
      ip: req.ip,
    });

    if (result.error === "REUSED") {
      return res.status(401).json({
        success: false,
        message:
          "This session is no longer valid. Please log in again on all devices.",
        code: "SESSION_REUSE_DETECTED",
      });
    }

    if (result.error === "INVALID") {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired refresh token. Please log in again.",
      });
    }

    if (result.error === "USER_NOT_FOUND") {
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }

    if (result.error === "DEACTIVATED") {
      return res
        .status(403)
        .json({ success: false, message: "Account is deactivated." });
    }

    const { user } = result;

    res.status(200).json({
      success: true,
      message: "Tokens refreshed successfully",
      user: authService.buildUserResponse(user),
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/resend-otp
 */
const resendOtp = async (req, res, next) => {
  try {
    const { email } = req.body;

    const result = await authService.resendOtp(email);

    if (result.error) {
      return res.status(result.error.status).json({
        success: false,
        message: result.error.message,
      });
    }

    const response = { success: true, message: result.message };
    if (result.developmentOtp) {
      response.development_otp = result.developmentOtp;
    }

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/logout
 */
const logout = async (req, res) => {
  const incomingRefreshToken = getIncomingRefreshToken(req);

  await authService.logout(req.userId, incomingRefreshToken);

  logger.info("User logged out", {
    userId: req.userId,
    email: req.user?.email,
  });

  res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
};

/**
 * PATCH /api/auth/onboarding-step
 */
const updateOnboardingStep = async (req, res, next) => {
  try {
    const { step, data = {} } = req.body;

    const result = await authService.updateOnboardingStep(
      req.userId,
      step,
      data,
    );

    if (result.error) {
      return res.status(result.error.status).json(result.error.body);
    }

    res.status(200).json(result.body);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/auth/onboarding-status
 */
const getOnboardingStatus = async (req, res, next) => {
  try {
    const status = await authService.getOnboardingStatus(req.userId);

    if (!status) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({ success: true, ...status });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/auth/me
 */
const getMe = async (req, res, next) => {
  try {
    const user = await authService.getMe(req.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/forgot-password
 */
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    const result = await authService.forgotPassword(email);

    if (result.error) {
      return res.status(result.error.status).json({
        success: false,
        message: result.error.message,
      });
    }

    const response = {
      success: true,
      message: result.message,
      resetId: result.resetId,
    };
    if (result.developmentOtp) {
      response.development_otp = result.developmentOtp;
    }

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/verify-reset-otp
 */
const verifyResetOtp = async (req, res, next) => {
  try {
    const { email, otpCode } = req.body;

    const result = await authService.verifyResetOtp(email, otpCode);

    res.status(200).json({
      success: true,
      message: "OTP verified successfully. You can now reset your password.",
      resetToken: result.resetToken,
      resetId: result.resetId,
      user: result.user,
    });
  } catch (error) {
    if (error.message === "Invalid or expired OTP") {
      return res.status(400).json({ success: false, message: error.message });
    }
    if (error.message === "User not found") {
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }
    if (error.message === "OTP has expired") {
      return res.status(400).json({
        success: false,
        message: "OTP has expired. Please request a new one.",
      });
    }
    next(error);
  }
};

/**
 * POST /api/auth/reset-password
 */
const resetPassword = async (req, res, next) => {
  try {
    const { resetToken, newPassword } = req.body;

    const result = await authService.resetPassword(resetToken, newPassword);

    if (result.error) {
      return res.status(result.error.status).json({
        success: false,
        message: result.error.message,
      });
    }

    res.status(200).json({
      success: true,
      message:
        "Password reset successfully. You can now login with your new password.",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/change-password
 */
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const result = await authService.changePassword(
      req.userId,
      currentPassword,
      newPassword,
    );

    if (result.error) {
      return res.status(result.error.status).json({
        success: false,
        message: result.error.message,
      });
    }

    res.status(200).json({
      success: true,
      message: "Password changed successfully. Please log in again.",
    });
  } catch (error) {
    next(error);
  }
};

export default {
  signup,
  login,
  verifyOtp,
  googleAuth,
  refreshToken,
  resendOtp,
  logout,
  updateOnboardingStep,
  getOnboardingStatus,
  getMe,
  forgotPassword,
  verifyResetOtp,
  resetPassword,
  changePassword,
};
