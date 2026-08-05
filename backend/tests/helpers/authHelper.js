import request from "supertest";
import app from "../../server.js";

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

  // Sign up
  const signupResponse = await request(app)
    .post("/api/auth/signup")
    .send({
      email: userWithPassword.email,
      name: userWithPassword.name,
      password: userWithPassword.password,
    })
    .expect(200);

  const otpCode = signupResponse.body.development_otp;

  // Verify OTP — returns accessToken/refreshToken directly in the body
  const verifyResponse = await request(app)
    .post("/api/auth/verify-otp")
    .send({
      email: testUser.email,
      otpCode: otpCode,
    })
    .expect(200);

  const { accessToken, refreshToken } = verifyResponse.body;

  if (!accessToken || !refreshToken) {
    throw new Error("Failed to get auth tokens");
  }

  const result = {
    accessToken,
    refreshToken,
    userId: verifyResponse.body.user.id,
    user: verifyResponse.body.user,
    // Convenience helper for tests that prefer .set(authData.getHeaders())
    getHeaders: () => ({ Authorization: `Bearer ${accessToken}` }),
  };

  authCache.set(cacheKey, result);
  return result;
};

export const clearAuthCache = () => {
  authCache.clear();
};

export const clearAuthCacheForUser = (email) => {
  authCache.delete(email);
};
