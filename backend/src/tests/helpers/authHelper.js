import request from "supertest";
import app from "../../../server.js";

const authCache = new Map();

export const getAuthToken = async (testUser) => {
  const cacheKey = testUser.email;

  if (authCache.has(cacheKey)) {
    return authCache.get(cacheKey);
  }

  const userWithPassword = {
    ...testUser,
    password: testUser.password || "TestPassword123",
  };

  // Sign up - phone number removed
  const signupResponse = await request(app)
    .post("/api/auth/signup")
    .send({
      email: userWithPassword.email,
      name: userWithPassword.name,
      password: userWithPassword.password,
    })
    .expect(200);

  const otpCode = signupResponse.body.development_otp;

  // Verify OTP
  const verifyResponse = await request(app)
    .post("/api/auth/verify-otp")
    .send({
      email: testUser.email,
      otpCode: otpCode,
    })
    .expect(200);

  const cookies = verifyResponse.headers["set-cookie"];
  const csrfToken = verifyResponse.body.csrfToken;

  if (!cookies || !csrfToken) {
    throw new Error("Failed to get auth cookies or CSRF token");
  }

  const result = {
    token: verifyResponse.body.token || null,
    csrfToken: csrfToken,
    cookies: cookies,
    userId: verifyResponse.body.user.id,
    user: verifyResponse.body.user,
    getHeaders: () => ({
      Cookie: cookies.join("; "),
      "x-csrf-token": csrfToken,
    }),
  };

  authCache.set(cacheKey, result);
  return result;
};

export const getAuthCookies = async (testUser) => {
  const result = await getAuthToken(testUser);
  return {
    cookies: result.cookies,
    csrfToken: result.csrfToken,
    userId: result.userId,
  };
};

export const clearAuthCache = () => {
  authCache.clear();
};

export const clearAuthCacheForUser = (email) => {
  authCache.delete(email);
};
