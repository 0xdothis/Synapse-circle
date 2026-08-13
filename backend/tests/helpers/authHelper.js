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

  try {
    // Sign up
    const signupResponse = await request(app).post("/api/auth/signup").send({
      email: userWithPassword.email,
      name: userWithPassword.name,
      password: userWithPassword.password,
    });

    if (signupResponse.status !== 200) {
      console.error("Signup failed:", signupResponse.body);
      throw new Error(`Signup failed: ${signupResponse.body.message}`);
    }

    const otpCode = signupResponse.body.development_otp;
    if (!otpCode) {
      throw new Error("No OTP code received. Make sure NODE_ENV=development");
    }

    // Verify OTP
    const verifyResponse = await request(app)
      .post("/api/auth/verify-otp")
      .send({
        email: testUser.email,
        otpCode: otpCode,
      });

    if (verifyResponse.status !== 200) {
      console.error("OTP verification failed:", verifyResponse.body);
      throw new Error(
        `OTP verification failed: ${verifyResponse.body.message}`,
      );
    }

    const { accessToken, refreshToken } = verifyResponse.body;

    if (!accessToken || !refreshToken) {
      throw new Error("Failed to get auth tokens");
    }

    const result = {
      accessToken,
      refreshToken,
      userId: verifyResponse.body.user.id,
      user: verifyResponse.body.user,
      getHeaders: () => ({ Authorization: `Bearer ${accessToken}` }),
    };

    authCache.set(cacheKey, result);
    return result;
  } catch (error) {
    console.error("getAuthToken error:", error.message);
    throw error;
  }
};

export const clearAuthCache = () => {
  authCache.clear();
};

export const clearAuthCacheForUser = (email) => {
  authCache.delete(email);
};
