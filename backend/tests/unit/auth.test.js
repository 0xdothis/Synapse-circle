import request from "supertest";
import app from "../../server.js";
import User from "../../src/models/User.js";
import OTP from "../../src/models/OTP.js";
import TrustedContact from "../../src/models/TrustedContact.js";
import SOSAlert from "../../src/models/SOSAlert.js";
import RefreshToken from "../../src/models/RefreshToken.js";
import { getAuthToken, clearAuthCache } from "../helpers/authHelper.js";

describe("Authentication API Tests", () => {
  const testUser = {
    email: "test@campus.edu",
    name: "Test User",
    password: "TestPassword123",
  };

  beforeEach(() => {
    clearAuthCache();
  });

  describe("POST /api/auth/signup", () => {
    it("should send OTP to email for signup", async () => {
      const uniqueEmail = `test-signup-${Date.now()}@campus.edu`;
      const response = await request(app)
        .post("/api/auth/signup")
        .send({
          ...testUser,
          email: uniqueEmail,
        })
        .expect(200);

      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty(
        "message",
        "OTP sent successfully to your email",
      );
      expect(response.body).toHaveProperty("development_otp");

      const otp = await OTP.findOne({ email: uniqueEmail });
      expect(otp).toBeTruthy();
      expect(otp.email).toBe(uniqueEmail);
    });

    it("should return error for missing email", async () => {
      const response = await request(app)
        .post("/api/auth/signup")
        .send({
          password: "TestPassword123",
        })
        .expect(400);

      expect(response.body).toHaveProperty("success", false);
      expect(response.body).toHaveProperty(
        "message",
        expect.stringContaining("Email is required"),
      );
    });

    it("should return error for invalid email format", async () => {
      const response = await request(app)
        .post("/api/auth/signup")
        .send({
          email: "invalid-email",
          password: "TestPassword123",
        })
        .expect(400);

      expect(response.body).toHaveProperty("success", false);
      expect(response.body).toHaveProperty("errors");
      expect(response.body.errors[0].field).toBe("email");
    });

    it("should reuse unverified account and send new OTP for duplicate email", async () => {
      const uniqueEmail = `test-reuse-${Date.now()}@campus.edu`;
      const firstResponse = await request(app)
        .post("/api/auth/signup")
        .send({
          ...testUser,
          email: uniqueEmail,
        })
        .expect(200);

      const firstOtp = firstResponse.body.development_otp;
      expect(firstOtp).toBeTruthy();

      const secondResponse = await request(app)
        .post("/api/auth/signup")
        .send({
          email: uniqueEmail,
          name: "Another User",
          password: "TestPassword123",
        })
        .expect(200);

      expect(secondResponse.body).toHaveProperty("success", true);
      expect(secondResponse.body).toHaveProperty(
        "message",
        "OTP sent successfully to your email",
      );
      expect(secondResponse.body).toHaveProperty("development_otp");
      expect(secondResponse.body.development_otp).not.toBe(firstOtp);

      const user = await User.findOne({ email: uniqueEmail });
      expect(user).toBeTruthy();
      expect(user.isVerified).toBe(false);
    });

    it("should return error when trying to sign up with email of a verified account", async () => {
      const uniqueEmail = `test-verified-${Date.now()}@campus.edu`;
      const signupResponse = await request(app)
        .post("/api/auth/signup")
        .send({
          ...testUser,
          email: uniqueEmail,
        })
        .expect(200);

      const otpCode = signupResponse.body.development_otp;

      await request(app)
        .post("/api/auth/verify-otp")
        .send({
          email: uniqueEmail,
          otpCode: otpCode,
        })
        .expect(200);

      const response = await request(app)
        .post("/api/auth/signup")
        .send({
          email: uniqueEmail,
          name: "Another User",
          password: "TestPassword123",
        })
        .expect(400);

      expect(response.body).toHaveProperty("success", false);
      expect(response.body).toHaveProperty(
        "message",
        "Account already exists. Please log in.",
      );
    });
  });

  describe("POST /api/auth/verify-otp", () => {
    beforeEach(() => {
      clearAuthCache();
    });

    it("should verify OTP and return auth data", async () => {
      const uniqueEmail = `test-verify-${Date.now()}@campus.edu`;
      const signupResponse = await request(app)
        .post("/api/auth/signup")
        .send({
          ...testUser,
          email: uniqueEmail,
        })
        .expect(200);

      const otpCode = signupResponse.body.development_otp;

      const response = await request(app)
        .post("/api/auth/verify-otp")
        .send({
          email: uniqueEmail,
          otpCode: otpCode,
        })
        .expect(200);

      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty(
        "message",
        "OTP verified successfully",
      );
      expect(response.body).toHaveProperty("accessToken");
      expect(response.body).toHaveProperty("refreshToken");
      expect(response.body).toHaveProperty("user");
      expect(response.body.user).toHaveProperty("id");
      expect(response.body.user).toHaveProperty("email", uniqueEmail);
      expect(response.body.user).toHaveProperty("isVerified", true);

      const user = await User.findOne({ email: uniqueEmail });
      expect(user).toBeTruthy();
      expect(user.isVerified).toBe(true);
    });

    it("should return error for invalid OTP", async () => {
      const uniqueEmail = `test-invalid-${Date.now()}@campus.edu`;
      const signupResponse = await request(app)
        .post("/api/auth/signup")
        .send({
          ...testUser,
          email: uniqueEmail,
        })
        .expect(200);

      const actualOtp = signupResponse.body.development_otp;
      expect(actualOtp).toBeTruthy();

      const wrongOtp = String(Number(actualOtp) + 1).padStart(6, "0");
      const response = await request(app)
        .post("/api/auth/verify-otp")
        .send({
          email: uniqueEmail,
          otpCode: wrongOtp,
        })
        .expect(400);

      expect(response.body).toHaveProperty("success", false);
      expect(response.body).toHaveProperty("message", "Invalid or expired OTP");
    });

    it("should return error for user not found", async () => {
      const response = await request(app)
        .post("/api/auth/verify-otp")
        .send({
          email: "nonexistent@campus.edu",
          otpCode: "123456",
        })
        .expect(404);

      expect(response.body).toHaveProperty("success", false);
      expect(response.body).toHaveProperty(
        "message",
        "User not found. Please sign up first.",
      );
    });
  });

  describe("POST /api/auth/resend-otp", () => {
    beforeEach(() => {
      clearAuthCache();
    });

    it("should resend OTP to email", async () => {
      const uniqueEmail = `test-resend-${Date.now()}@campus.edu`;
      await request(app)
        .post("/api/auth/signup")
        .send({
          ...testUser,
          email: uniqueEmail,
        })
        .expect(200);

      const response = await request(app)
        .post("/api/auth/resend-otp")
        .send({ email: uniqueEmail })
        .expect(200);

      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty(
        "message",
        "OTP resent successfully to your email",
      );
      expect(response.body).toHaveProperty("development_otp");
    });

    it("should return error for non-existent email", async () => {
      const response = await request(app)
        .post("/api/auth/resend-otp")
        .send({ email: "nonexistent@campus.edu" })
        .expect(404);

      expect(response.body).toHaveProperty("success", false);
      expect(response.body).toHaveProperty(
        "message",
        "Email not found. Please sign up first.",
      );
    });
  });

  describe("DELETE /api/auth/account", () => {
    let authData;
    let testUserData;

    beforeEach(async () => {
      clearAuthCache();
      testUserData = {
        email: `delete-test-${Date.now()}@campus.edu`,
        name: "Delete Test User",
        password: "TestPassword123",
      };
      authData = await getAuthToken(testUserData);
    });

    it("should delete account with valid password", async () => {
      const response = await request(app)
        .delete("/api/auth/account")
        .set("Authorization", `Bearer ${authData.accessToken}`)
        .send({
          password: testUserData.password,
          reason: "user_requested",
        })
        .expect(200);

      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty(
        "message",
        "Your account has been successfully deleted. All your data has been removed.",
      );

      // Verify user is soft deleted
      const user = await User.findOne({ email: testUserData.email });
      expect(user).toBeTruthy();
      expect(user.isDeleted).toBe(true);
      expect(user.isActive).toBe(false);
      expect(user.deletedAt).toBeTruthy();
      expect(user.deletionReason).toBe("user_requested");
    });

    it("should require password for local auth users", async () => {
      const response = await request(app)
        .delete("/api/auth/account")
        .set("Authorization", `Bearer ${authData.accessToken}`)
        .send({
          reason: "user_requested",
        })
        .expect(400);

      expect(response.body).toHaveProperty("success", false);
      expect(response.body).toHaveProperty(
        "message",
        "Current password is required to delete your account.",
      );
    });

    it("should reject invalid password", async () => {
      const response = await request(app)
        .delete("/api/auth/account")
        .set("Authorization", `Bearer ${authData.accessToken}`)
        .send({
          password: "WrongPassword123",
          reason: "user_requested",
        })
        .expect(401);

      expect(response.body).toHaveProperty("success", false);
      expect(response.body).toHaveProperty(
        "message",
        "Invalid password. Please try again.",
      );
    });

    it("should reject request without authentication", async () => {
      const response = await request(app)
        .delete("/api/auth/account")
        .send({
          password: testUserData.password,
          reason: "user_requested",
        })
        .expect(401);

      expect(response.body).toHaveProperty("success", false);
      expect(response.body).toHaveProperty(
        "message",
        "Authentication required. Please log in.",
      );
    });

    it("should delete all associated data", async () => {
      // Create a contact first
      await request(app)
        .post("/api/contacts")
        .set("Authorization", `Bearer ${authData.accessToken}`)
        .send({
          name: "Test Contact",
          email: "testcontact@example.com",
          phoneNumber: "+1234567890",  
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

      // Get the user ID
      const user = await User.findOne({ email: testUserData.email });
      const userId = user._id;

      // Verify data exists
      let contacts = await TrustedContact.countDocuments({ userId });
      expect(contacts).toBeGreaterThan(0);
      let alerts = await SOSAlert.countDocuments({ userId });
      expect(alerts).toBeGreaterThan(0);
      let refreshTokens = await RefreshToken.countDocuments({ userId });
      expect(refreshTokens).toBeGreaterThan(0);

      // Delete account
      await request(app)
        .delete("/api/auth/account")
        .set("Authorization", `Bearer ${authData.accessToken}`)
        .send({
          password: testUserData.password,
          reason: "user_requested",
        })
        .expect(200);

      // Verify all data is deleted
      contacts = await TrustedContact.countDocuments({ userId });
      expect(contacts).toBe(0);
      alerts = await SOSAlert.countDocuments({ userId });
      expect(alerts).toBe(0);
      refreshTokens = await RefreshToken.countDocuments({ userId });
      expect(refreshTokens).toBe(0);
    });

    it("should reject deletion of already deleted account", async () => {
      // Delete account first
      await request(app)
        .delete("/api/auth/account")
        .set("Authorization", `Bearer ${authData.accessToken}`)
        .send({
          password: testUserData.password,
          reason: "user_requested",
        })
        .expect(200);

      // Try to delete again
      const response = await request(app)
        .delete("/api/auth/account")
        .set("Authorization", `Bearer ${authData.accessToken}`)
        .send({
          password: testUserData.password,
          reason: "user_requested",
        })
        .expect(400);

      expect(response.body).toHaveProperty("success", false);
      expect(response.body).toHaveProperty(
        "message",
        "Account has already been deleted.",
      );
    });

    it("should clear cookies on deletion", async () => {
      const response = await request(app)
        .delete("/api/auth/account")
        .set("Authorization", `Bearer ${authData.accessToken}`)
        .send({
          password: testUserData.password,
          reason: "user_requested",
        });

      // Check for cookie clearing headers
      const setCookieHeader = response.headers["set-cookie"];
      if (setCookieHeader) {
        const cookieStrings = Array.isArray(setCookieHeader)
          ? setCookieHeader
          : [setCookieHeader];
        expect(cookieStrings.some((c) => c.includes("accessToken=;"))).toBe(
          true,
        );
        expect(cookieStrings.some((c) => c.includes("refreshToken=;"))).toBe(
          true,
        );
      }
    });
  });

  describe("Protected Routes", () => {
    let logoutAuthData;
    let meAuthData;
    let logoutUser;
    let meUser;

    beforeAll(async () => {
      // Create a separate user for logout test
      logoutUser = {
        email: `logout-test-${Date.now()}@campus.edu`,
        name: "Logout Test User",
        password: "TestPassword123",
      };
      logoutAuthData = await getAuthToken(logoutUser);

      // Create a separate user for me tests
      meUser = {
        email: `me-test-${Date.now()}@campus.edu`,
        name: "Me Test User",
        password: "TestPassword123",
      };
      meAuthData = await getAuthToken(meUser);
    });

    describe("POST /api/auth/logout", () => {
      it("should logout successfully", async () => {
        const response = await request(app)
          .post("/api/auth/logout")
          .set("Authorization", `Bearer ${logoutAuthData.accessToken}`)
          .send({ refreshToken: logoutAuthData.refreshToken })
          .expect(200);

        expect(response.body).toHaveProperty("success", true);
        expect(response.body).toHaveProperty(
          "message",
          "Logged out successfully",
        );
      });
    });

    describe("GET /api/auth/me", () => {
      it("should return user profile with valid auth", async () => {
        const response = await request(app)
          .get("/api/auth/me")
          .set("Authorization", `Bearer ${meAuthData.accessToken}`)
          .expect(200);

        expect(response.body).toHaveProperty("success", true);
        expect(response.body).toHaveProperty("user");
        expect(response.body.user).toHaveProperty("email", meUser.email);
        expect(response.body.user).toHaveProperty("trustedContactsCount", 0);
        expect(response.body.user).toHaveProperty("maxContacts", 3);
      });

      it("should return 401 without token", async () => {
        const response = await request(app).get("/api/auth/me").expect(401);

        expect(response.body).toHaveProperty("success", false);
        expect(response.body).toHaveProperty(
          "message",
          "Authentication required. Please log in.",
        );
      });

      it("should return 401 with invalid token", async () => {
        const response = await request(app)
          .get("/api/auth/me")
          .set("Authorization", "Bearer invalid-token")
          .expect(401);

        expect(response.body).toHaveProperty("success", false);
      });

      it("should return 400 for deleted account", async () => {
        // Delete the account
        await request(app)
          .delete("/api/auth/account")
          .set("Authorization", `Bearer ${meAuthData.accessToken}`)
          .send({
            password: meUser.password,
            reason: "user_requested",
          })
          .expect(200);

        // Try to access protected route
        const response = await request(app)
          .get("/api/auth/me")
          .set("Authorization", `Bearer ${meAuthData.accessToken}`)
          .expect(400);

        expect(response.body).toHaveProperty("success", false);
        expect(response.body).toHaveProperty(
          "message",
          "Account has already been deleted.",
        );
        expect(response.body).toHaveProperty("code", "ACCOUNT_DELETED");
      });
    });
  });
});
