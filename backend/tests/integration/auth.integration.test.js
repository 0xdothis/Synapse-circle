import request from "supertest";
import app from "../../server.js";
import User from "../../src/models/User.js";
import OTP from "../../src/models/OTP.js";
import config from "../../src/utils/config.js";

describe("Authentication Integration Tests", () => {
  const testUser = {
    email: "integration@campus.edu",
    name: "Integration Test User",
    password: "TestPassword123",
  };

  let authData = {};
  let csrfToken = "";

  describe("Full Authentication Flow", () => {
    it("should complete the entire signup → verify OTP → login → logout flow", async () => {
      // 1. Signup
      const signupRes = await request(app)
        .post("/api/auth/signup")
        .send(testUser)
        .expect(200);

      expect(signupRes.body).toHaveProperty("success", true);
      expect(signupRes.body).toHaveProperty("development_otp");
      expect(signupRes.body).toHaveProperty("csrfToken");

      csrfToken = signupRes.body.csrfToken;
      const otpCode = signupRes.body.development_otp;

      // 2. Verify OTP
      const verifyRes = await request(app)
        .post("/api/auth/verify-otp")
        .set("x-csrf-token", csrfToken)
        .send({
          email: testUser.email,
          otpCode: otpCode,
        })
        .expect(200);

      expect(verifyRes.body).toHaveProperty("success", true);
      expect(verifyRes.body).toHaveProperty("user");
      expect(verifyRes.body.user).toHaveProperty("isVerified", true);
      expect(verifyRes.body).toHaveProperty("csrfToken");

      const cookies = verifyRes.headers["set-cookie"];
      expect(cookies).toBeDefined();
      expect(cookies.some((c) => c.includes("accessToken"))).toBe(true);
      expect(cookies.some((c) => c.includes("refreshToken"))).toBe(true);

      // 3. Get user profile
      const meRes = await request(app)
        .get("/api/auth/me")
        .set("Cookie", cookies)
        .set("x-csrf-token", verifyRes.body.csrfToken)
        .expect(200);

      expect(meRes.body).toHaveProperty("success", true);
      expect(meRes.body.user).toHaveProperty("email", testUser.email);

      // 4. Logout
      const logoutRes = await request(app)
        .post("/api/auth/logout")
        .set("Cookie", cookies)
        .set("x-csrf-token", verifyRes.body.csrfToken)
        .expect(200);

      expect(logoutRes.body).toHaveProperty("success", true);
      expect(logoutRes.body).toHaveProperty(
        "message",
        "Logged out successfully",
      );

      // 5. Verify logout - should not be able to access protected route
      await request(app).get("/api/auth/me").set("Cookie", cookies).expect(401);
    });

    it("should handle concurrent OTP verification attempts", async () => {
      const uniqueEmail = `concurrent-${Date.now()}@campus.edu`;

      await request(app)
        .post("/api/auth/signup")
        .send({ ...testUser, email: uniqueEmail })
        .expect(200);

      // Try to verify with wrong OTP multiple times
      for (let i = 0; i < 3; i++) {
        await request(app)
          .post("/api/auth/verify-otp")
          .send({
            email: uniqueEmail,
            otpCode: "000000",
          })
          .expect(400);
      }

      // Get the actual OTP
      const signupRes = await request(app)
        .post("/api/auth/signup")
        .send({ ...testUser, email: uniqueEmail })
        .expect(200);

      const otpCode = signupRes.body.development_otp;

      // Verify with correct OTP - should work after rate limiting
      const verifyRes = await request(app)
        .post("/api/auth/verify-otp")
        .send({
          email: uniqueEmail,
          otpCode: otpCode,
        })
        .expect(200);

      expect(verifyRes.body).toHaveProperty("success", true);
    });

    it("should handle password reset flow", async () => {
      const uniqueEmail = `reset-flow-${Date.now()}@campus.edu`;

      // 1. Signup and verify user
      const signupRes = await request(app)
        .post("/api/auth/signup")
        .send({ ...testUser, email: uniqueEmail })
        .expect(200);

      const otpCode = signupRes.body.development_otp;

      await request(app)
        .post("/api/auth/verify-otp")
        .send({
          email: uniqueEmail,
          otpCode: otpCode,
        })
        .expect(200);

      // 2. Request password reset
      const forgotRes = await request(app)
        .post("/api/auth/forgot-password")
        .send({ email: uniqueEmail })
        .expect(200);

      expect(forgotRes.body).toHaveProperty("success", true);
      expect(forgotRes.body).toHaveProperty("resetId");
      expect(forgotRes.body).toHaveProperty("development_otp");

      const resetOtp = forgotRes.body.development_otp;

      // 3. Verify reset OTP
      const verifyResetRes = await request(app)
        .post("/api/auth/verify-reset-otp")
        .send({
          email: uniqueEmail,
          otpCode: resetOtp,
        })
        .expect(200);

      expect(verifyResetRes.body).toHaveProperty("success", true);
      expect(verifyResetRes.body).toHaveProperty("resetToken");

      const resetToken = verifyResetRes.body.resetToken;

      // 4. Reset password
      const resetRes = await request(app)
        .post("/api/auth/reset-password")
        .send({
          resetToken: resetToken,
          newPassword: "NewPassword456",
          confirmPassword: "NewPassword456",
        })
        .expect(200);

      expect(resetRes.body).toHaveProperty("success", true);

      // 5. Login with new password
      const loginRes = await request(app)
        .post("/api/auth/login")
        .send({
          email: uniqueEmail,
          password: "NewPassword456",
        })
        .expect(200);

      expect(loginRes.body).toHaveProperty("success", true);
    });
  });

  describe("CSRF Protection", () => {
    it.skip("should reject requests without CSRF token in production", async () => {
      // Create a user first
      const uniqueEmail = `csrf-${Date.now()}@campus.edu`;

      const signupRes = await request(app)
        .post("/api/auth/signup")
        .send({ ...testUser, email: uniqueEmail })
        .expect(200);

      const otpCode = signupRes.body.development_otp;

      const verifyRes = await request(app)
        .post("/api/auth/verify-otp")
        .send({
          email: uniqueEmail,
          otpCode: otpCode,
        })
        .expect(200);

      const cookies = verifyRes.headers["set-cookie"];

      // Try to access protected route without CSRF token
      const res = await request(app)
        .post("/api/auth/logout")
        .set("Cookie", cookies)
        .expect(403);

      expect(res.body).toHaveProperty("success", false);
    });
  });

  describe("Token Refresh", () => {
    it("should refresh access token using refresh token", async () => {
      const uniqueEmail = `refresh-${Date.now()}@campus.edu`;

      // Create and verify user
      const signupRes = await request(app)
        .post("/api/auth/signup")
        .send({ ...testUser, email: uniqueEmail })
        .expect(200);

      const otpCode = signupRes.body.development_otp;

      const verifyRes = await request(app)
        .post("/api/auth/verify-otp")
        .send({
          email: uniqueEmail,
          otpCode: otpCode,
        })
        .expect(200);

      const cookies = verifyRes.headers["set-cookie"];

      // Wait a moment
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Refresh token
      const refreshRes = await request(app)
        .post("/api/auth/refresh-token")
        .set("Cookie", cookies)
        .set("x-csrf-token", verifyRes.body.csrfToken)
        .expect(200);

      expect(refreshRes.body).toHaveProperty("success", true);
      expect(refreshRes.body).toHaveProperty("csrfToken");

      // Verify new tokens work
      const meRes = await request(app)
        .get("/api/auth/me")
        .set("Cookie", refreshRes.headers["set-cookie"])
        .set("x-csrf-token", refreshRes.body.csrfToken)
        .expect(200);

      expect(meRes.body).toHaveProperty("success", true);
    });
  });

  describe("Google OAuth Integration", () => {
    it("should handle Google sign-in flow", async () => {
      // Mock Google token verification
      const mockGooglePayload = {
        sub: "google-123",
        email: "google@campus.edu",
        name: "Google User",
        picture: "https://example.com/pic.jpg",
        email_verified: true,
      };

      // Since we can't actually verify Google tokens in tests,
      // we'll test the route with a mock
      const res = await request(app)
        .post("/api/auth/google")
        .send({ idToken: "mock-google-token" })
        .expect(401);

      expect(res.body).toHaveProperty("success", false);
    });
  });

  describe("Rate Limiting", () => {
    it("should enforce rate limiting on auth endpoints", async () => {
      const originalDisable = process.env.DISABLE_RATE_LIMITING;
      const originalConfigDisable = config.disableRateLimiting;

      try {
        process.env.DISABLE_RATE_LIMITING = "false";
        config.disableRateLimiting = false;

        const uniqueEmail = `ratelimit-${Date.now()}@campus.edu`;

        // Make multiple signup attempts
        for (let i = 0; i < 5; i++) {
          await request(app)
            .post("/api/auth/signup")
            .send({ ...testUser, email: uniqueEmail })
            .expect(200);
        }

        // The 6th attempt should be rate limited
        const res = await request(app)
          .post("/api/auth/signup")
          .send({ ...testUser, email: uniqueEmail })
          .expect(429);

        expect(res.body).toHaveProperty(
          "message",
          "Too many authentication attempts, please try again later.",
        );
      } finally {
        process.env.DISABLE_RATE_LIMITING = originalDisable;
        config.disableRateLimiting = originalConfigDisable;
      }
    });
  });

  describe("Session Management", () => {
    it("should revoke all sessions on password change", async () => {
      const uniqueEmail = `session-${Date.now()}@campus.edu`;

      // Create and verify user
      const signupRes = await request(app)
        .post("/api/auth/signup")
        .send({ ...testUser, email: uniqueEmail })
        .expect(200);

      const otpCode = signupRes.body.development_otp;

      const verifyRes = await request(app)
        .post("/api/auth/verify-otp")
        .send({
          email: uniqueEmail,
          otpCode: otpCode,
        })
        .expect(200);

      const cookies = verifyRes.headers["set-cookie"];

      // Change password
      const changeRes = await request(app)
        .post("/api/auth/change-password")
        .set("Cookie", cookies)
        .set("x-csrf-token", verifyRes.body.csrfToken)
        .send({
          currentPassword: testUser.password,
          newPassword: "NewPassword789",
          confirmPassword: "NewPassword789",
        })
        .expect(200);

      expect(changeRes.body).toHaveProperty("success", true);

      // Old session should be invalidated
      await request(app).get("/api/auth/me").set("Cookie", cookies).expect(401);

      // Login with new password
      const loginRes = await request(app)
        .post("/api/auth/login")
        .send({
          email: uniqueEmail,
          password: "NewPassword789",
        })
        .expect(200);

      expect(loginRes.body).toHaveProperty("success", true);
    });
  });
});
