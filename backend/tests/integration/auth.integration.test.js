import { jest } from "@jest/globals";
import request from "supertest";
import config from "../../src/utils/config.js";
import User from "../../src/models/User.js";
import TrustedContact from "../../src/models/TrustedContact.js";
import SOSAlert from "../../src/models/SOSAlert.js";
import RefreshToken from "../../src/models/RefreshToken.js";

// Mock Google OAuth for testing.
const mockVerifyIdToken = jest.fn().mockImplementation(({ idToken }) => {
  if (idToken === "mock-google-token") {
    return {
      getPayload: () => ({
        sub: "1234567890",
        email: "test.google.user@gmail.com",
        name: "Test Google User",
        picture: "https://example.com/photo.jpg",
        email_verified: true,
      }),
    };
  }
  throw new Error("Invalid token");
});

jest.unstable_mockModule("google-auth-library", () => ({
  OAuth2Client: jest.fn().mockImplementation(() => ({
    verifyIdToken: mockVerifyIdToken,
  })),
}));

let app;

beforeAll(async () => {
  ({ default: app } = await import("../../server.js"));
});

describe("Authentication Integration Tests", () => {
  const testUser = {
    email: "integration@campus.edu",
    name: "Integration Test User",
    password: "TestPassword123",
  };

  // Helper to create and verify a user
  const createVerifiedUser = async (email = testUser.email) => {
    const signupRes = await request(app)
      .post("/api/auth/signup")
      .send({ ...testUser, email })
      .expect(200);

    const otpCode = signupRes.body.development_otp;

    const verifyRes = await request(app)
      .post("/api/auth/verify-otp")
      .send({
        email,
        otpCode,
      })
      .expect(200);

    return verifyRes.body;
  };

  describe("Full Authentication Flow", () => {
    it("should complete the entire signup → verify OTP → login → logout flow", async () => {
      // 1. Signup
      const signupRes = await request(app)
        .post("/api/auth/signup")
        .send(testUser)
        .expect(200);

      expect(signupRes.body).toHaveProperty("success", true);
      expect(signupRes.body).toHaveProperty("development_otp");

      const otpCode = signupRes.body.development_otp;

      // 2. Verify OTP
      const verifyRes = await request(app)
        .post("/api/auth/verify-otp")
        .send({
          email: testUser.email,
          otpCode: otpCode,
        })
        .expect(200);

      expect(verifyRes.body).toHaveProperty("success", true);
      expect(verifyRes.body).toHaveProperty("user");
      expect(verifyRes.body.user).toHaveProperty("isVerified", true);
      expect(verifyRes.body).toHaveProperty("accessToken");
      expect(verifyRes.body).toHaveProperty("refreshToken");

      const { accessToken, refreshToken } = verifyRes.body;

      // 3. Get user profile
      const meRes = await request(app)
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(200);

      expect(meRes.body).toHaveProperty("success", true);
      expect(meRes.body.user).toHaveProperty("email", testUser.email);

      // 4. Logout
      const logoutRes = await request(app)
        .post("/api/auth/logout")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ refreshToken })
        .expect(200);

      expect(logoutRes.body).toHaveProperty("success", true);
      expect(logoutRes.body).toHaveProperty(
        "message",
        "Logged out successfully",
      );

      // Refresh token should be invalid after logout
      const refreshAfterLogout = await request(app)
        .post("/api/auth/refresh-token")
        .send({ refreshToken })
        .expect(401);

      expect(refreshAfterLogout.body).toHaveProperty("success", false);
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
      await createVerifiedUser(uniqueEmail);

      // 2. Request password reset
      const forgotRes = await request(app)
        .post("/api/auth/forgot-password")
        .send({ email: uniqueEmail })
        .expect(200);

      expect(forgotRes.body).toHaveProperty("success", true);
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
      expect(loginRes.body).toHaveProperty("accessToken");
      expect(loginRes.body).toHaveProperty("refreshToken");
    });
  });

  describe("Account Deletion Integration", () => {
    let authData;
    let userEmail;

    beforeEach(async () => {
      userEmail = `delete-integration-${Date.now()}@campus.edu`;
      const userData = {
        email: userEmail,
        name: "Delete Integration User",
        password: "TestPassword123",
      };
      authData = await createVerifiedUser(userEmail);
    });

    it("should delete account and all associated data", async () => {
      const userId = authData.user.id;

      // Create a contact
      await request(app)
        .post("/api/contacts")
        .set("Authorization", `Bearer ${authData.accessToken}`)
        .send({
          name: "Integration Contact",
          email: "integration-delete@example.com",
          relationship: "friend",
        })
        .expect(201);

      // Create an SOS alert
      await request(app)
        .post("/api/sos/trigger")
        .set("Authorization", `Bearer ${authData.accessToken}`)
        .send({
          latitude: 37.7749,
          longitude: -122.4194,
        })
        .expect(200);

      // Verify data exists
      let contacts = await TrustedContact.countDocuments({ userId });
      expect(contacts).toBeGreaterThan(0);
      let alerts = await SOSAlert.countDocuments({ userId });
      expect(alerts).toBeGreaterThan(0);
      let refreshTokens = await RefreshToken.countDocuments({ userId });
      expect(refreshTokens).toBeGreaterThan(0);

      // Delete account
      const deleteRes = await request(app)
        .delete("/api/auth/account")
        .set("Authorization", `Bearer ${authData.accessToken}`)
        .send({
          password: "TestPassword123",
          reason: "user_requested",
        })
        .expect(200);

      expect(deleteRes.body).toHaveProperty("success", true);

      // Verify all data is deleted
      contacts = await TrustedContact.countDocuments({ userId });
      expect(contacts).toBe(0);
      alerts = await SOSAlert.countDocuments({ userId });
      expect(alerts).toBe(0);
      refreshTokens = await RefreshToken.countDocuments({ userId });
      expect(refreshTokens).toBe(0);

      // Verify user is soft deleted
      const user = await User.findById(userId);
      expect(user).toBeTruthy();
      expect(user.isDeleted).toBe(true);
      expect(user.isActive).toBe(false);
      expect(user.deletedAt).toBeTruthy();
      expect(user.deletionReason).toBe("user_requested");
    });

    it("should prevent access after account deletion", async () => {
      // Delete account
      await request(app)
        .delete("/api/auth/account")
        .set("Authorization", `Bearer ${authData.accessToken}`)
        .send({
          password: "TestPassword123",
          reason: "user_requested",
        })
        .expect(200);

      // Try to access protected route
      const response = await request(app)
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${authData.accessToken}`)
        .expect(400);

      expect(response.body).toHaveProperty("success", false);
      expect(response.body).toHaveProperty(
        "message",
        "Account has already been deleted.",
      );
      expect(response.body).toHaveProperty("code", "ACCOUNT_DELETED");
    });

    it("should prevent login after account deletion", async () => {
      // Delete account
      await request(app)
        .delete("/api/auth/account")
        .set("Authorization", `Bearer ${authData.accessToken}`)
        .send({
          password: "TestPassword123",
          reason: "user_requested",
        })
        .expect(200);

      // Try to login
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email: userEmail,
          password: "TestPassword123",
        })
        .expect(403);

      expect(response.body).toHaveProperty("success", false);
      expect(response.body).toHaveProperty(
        "message",
        "Account is deactivated. Please contact support.",
      );
    });
  });

  describe("Token Refresh", () => {
    it("should refresh access token using refresh token", async () => {
      const uniqueEmail = `refresh-${Date.now()}@campus.edu`;
      const verifyResult = await createVerifiedUser(uniqueEmail);

      const { refreshToken } = verifyResult;

      // Wait a moment
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Refresh token
      const refreshRes = await request(app)
        .post("/api/auth/refresh-token")
        .send({ refreshToken })
        .expect(200);

      expect(refreshRes.body).toHaveProperty("success", true);
      expect(refreshRes.body).toHaveProperty("accessToken");
      expect(refreshRes.body).toHaveProperty("refreshToken");

      // Verify new tokens work
      const meRes = await request(app)
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${refreshRes.body.accessToken}`)
        .expect(200);

      expect(meRes.body).toHaveProperty("success", true);
    });

    it("should reject reuse of a rotated refresh token", async () => {
      const uniqueEmail = `refresh-reuse-${Date.now()}@campus.edu`;
      const verifyResult = await createVerifiedUser(uniqueEmail);

      const { refreshToken: firstRefreshToken } = verifyResult;

      // Use it once — rotates to a new refresh token
      const firstRefresh = await request(app)
        .post("/api/auth/refresh-token")
        .send({ refreshToken: firstRefreshToken })
        .expect(200);

      expect(firstRefresh.body).toHaveProperty("success", true);

      // Reusing the now-rotated-away token should be rejected
      const reuseRes = await request(app)
        .post("/api/auth/refresh-token")
        .send({ refreshToken: firstRefreshToken })
        .expect(401);

      expect(reuseRes.body).toHaveProperty("success", false);
    });

    it("should require a refresh token in the request body", async () => {
      const res = await request(app)
        .post("/api/auth/refresh-token")
        .send({})
        .expect(401);

      expect(res.body).toHaveProperty("success", false);
      expect(res.body).toHaveProperty(
        "message",
        "Refresh token required. Please log in.",
      );
    });
  });

  describe("Google OAuth Integration", () => {
    it("should handle Google sign-in flow with valid token", async () => {
      const res = await request(app)
        .post("/api/auth/google")
        .send({ idToken: "mock-google-token" })
        .expect(200);

      expect(res.body).toHaveProperty("success", true);
      expect(res.body).toHaveProperty("user");
      expect(res.body.user).toHaveProperty(
        "email",
        "test.google.user@gmail.com",
      );
      expect(res.body).toHaveProperty("accessToken");
      expect(res.body).toHaveProperty("refreshToken");
    });

    it("should reject invalid Google tokens", async () => {
      const res = await request(app)
        .post("/api/auth/google")
        .send({ idToken: "invalid-token" })
        .expect(401);

      expect(res.body).toHaveProperty("success", false);
    });

    it("should reject Google tokens without email", async () => {
      mockVerifyIdToken.mockImplementationOnce(() => ({
        getPayload: () => ({
          sub: "1234567890",
          name: "Test User",
          email_verified: true,
          // No email field
        }),
      }));

      const res = await request(app)
        .post("/api/auth/google")
        .send({ idToken: "mock-google-token" })
        .expect(401);

      expect(res.body).toHaveProperty("success", false);
    });

    it("should reject unverified Google emails", async () => {
      mockVerifyIdToken.mockImplementationOnce(() => ({
        getPayload: () => ({
          sub: "1234567890",
          email: "unverified@gmail.com",
          name: "Test User",
          email_verified: false,
        }),
      }));

      const res = await request(app)
        .post("/api/auth/google")
        .send({ idToken: "mock-google-token" })
        .expect(401);

      expect(res.body).toHaveProperty("success", false);
      expect(res.body.message).toContain("verify your Google account email");
    });
  });

  describe("Rate Limiting", () => {
    it("should enforce rate limiting on auth endpoints", async () => {
      // Skip this test if rate limiting is disabled
      if (config.disableRateLimiting) {
        console.log("Skipping rate limiting test - rate limiting is disabled");
        return;
      }

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

      expect(res.body).toHaveProperty("success", false);
      expect(res.body).toHaveProperty(
        "message",
        expect.stringContaining("Too many"),
      );
    });
  });

  describe("Session Management", () => {
    it("should revoke all sessions on password change", async () => {
      const uniqueEmail = `session-${Date.now()}@campus.edu`;
      const verifyResult = await createVerifiedUser(uniqueEmail);

      const { accessToken, refreshToken } = verifyResult;

      // Change password
      const changeRes = await request(app)
        .post("/api/auth/change-password")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          currentPassword: testUser.password,
          newPassword: "NewPassword789",
          confirmPassword: "NewPassword789",
        })
        .expect(200);

      expect(changeRes.body).toHaveProperty("success", true);

      // Old access token should be invalidated
      await request(app)
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(401);

      // Old refresh token should no longer be usable
      await request(app)
        .post("/api/auth/refresh-token")
        .send({ refreshToken })
        .expect(401);

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
