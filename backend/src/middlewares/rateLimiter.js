import rateLimit from "express-rate-limit";

// General API rate limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: {
    success: false,
    message: "Too many requests, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter limiter for auth endpoints (prevent brute force)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: {
    success: false,
    message: "Too many authentication attempts, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

// SOS trigger limiter (prevent spam)
const sosLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 3,
  message: {
    success: false,
    message: "Too many SOS triggers. Please wait before sending another alert.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Contact management limiter
const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  message: {
    success: false,
    message: "Too many contact operations, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// OTP limiter
const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3,
  message: {
    success: false,
    message: "Too many OTP requests. Please wait before trying again.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export {
  apiLimiter,
  authLimiter,
  sosLimiter,
  contactLimiter,
  otpLimiter,
  globalLimiter,
};
