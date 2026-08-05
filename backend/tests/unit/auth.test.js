import request from "supertest";
import app from "../../server.js";
import User from "../../src/models/User.js";
import OTP from "../../src/models/OTP.js";
import { getAuthToken, clearAuthCache } from "../helpers/authHelper.js";

describe("Authentication API Tests", () => {
  const testUser = {
    email: "test@campus.edu",
    name: "Test User",
    password: "TestPassword123",
  };

  // Clear auth cache before each test to ensure fresh state
  beforeEach(() => {
    clearAuthCache();
  });

  describe("POST /api/auth/signup", () => {
    it("should send OTP to email for signup", async () => {
      // Use a unique email for this test to avoid conflicts
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

      // Verify OTP was saved in database
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
      // First signup - creates an unverified account
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

      // Second signup with same email - should reuse the unverified account
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

      // The new OTP should be different from the first one
      expect(secondResponse.body.development_otp).not.toBe(firstOtp);

      // Verify the user still exists and is still unverified
      const user = await User.findOne({ email: uniqueEmail });
      expect(user).toBeTruthy();
      expect(user.isVerified).toBe(false);
    });

    it("should return error when trying to sign up with email of a verified account", async () => {
      const uniqueEmail = `test-verified-${Date.now()}@campus.edu`;
      // First signup
      const signupResponse = await request(app)
        .post("/api/auth/signup")
        .send({
          ...testUser,
          email: uniqueEmail,
        })
        .expect(200);

      const otpCode = signupResponse.body.development_otp;

      // Verify the account
      await request(app)
        .post("/api/auth/verify-otp")
        .send({
          email: uniqueEmail,
          otpCode: otpCode,
        })
        .expect(200);

      // Try to sign up again with the now-verified account
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
      // First signup to get OTP
      const signupResponse = await request(app)
        .post("/api/auth/signup")
        .send({
          ...testUser,
          email: uniqueEmail,
        })
        .expect(200);

      const otpCode = signupResponse.body.development_otp;

      // Verify OTP using email
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

      // Verify user was created in database
      const user = await User.findOne({ email: uniqueEmail });
      expect(user).toBeTruthy();
      expect(user.isVerified).toBe(true);
    });

    it("should return error for invalid OTP", async () => {
      const uniqueEmail = `test-invalid-${Date.now()}@campus.edu`;
      // First signup
      const signupResponse = await request(app)
        .post("/api/auth/signup")
        .send({
          ...testUser,
          email: uniqueEmail,
        })
        .expect(200);

      // Get the actual OTP from the response
      const actualOtp = signupResponse.body.development_otp;
      expect(actualOtp).toBeTruthy();

      // Verify with wrong OTP (using a different 6-digit number)
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

    it("should return error for expired OTP", async () => {
      const uniqueEmail = `test-expired-${Date.now()}@campus.edu`;
      // First signup
      await request(app)
        .post("/api/auth/signup")
        .send({
          ...testUser,
          email: uniqueEmail,
        })
        .expect(200);

      // Manually expire the OTP
      await OTP.updateOne(
        { email: uniqueEmail },
        { expiresAt: new Date(Date.now() - 10000) },
      );

      // Verify with expired OTP
      const response = await request(app)
        .post("/api/auth/verify-otp")
        .send({
          email: uniqueEmail,
          otpCode: "123456",
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
      // First signup
      await request(app)
        .post("/api/auth/signup")
        .send({
          ...testUser,
          email: uniqueEmail,
        })
        .expect(200);

      // Resend OTP using email
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

  describe("Protected Routes", () => {
    let authData;
    let userId;

    const protectedRoutesUser = {
      email: `protected-routes-${Date.now()}@campus.edu`,
      name: "Protected Routes User",
      password: "TestPassword123",
    };

    beforeAll(async () => {
      authData = await getAuthToken(protectedRoutesUser);
      userId = authData.userId;
    });

    describe("GET /api/auth/me", () => {
      it("should return user profile with valid auth", async () => {
        const response = await request(app)
          .get("/api/auth/me")
          .set("Authorization", `Bearer ${authData.accessToken}`)
          .expect(200);

        expect(response.body).toHaveProperty("success", true);
        expect(response.body).toHaveProperty("user");
        expect(response.body.user).toHaveProperty(
          "email",
          protectedRoutesUser.email,
        );
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
    });

    describe("POST /api/auth/logout", () => {
      it("should logout successfully", async () => {
        const response = await request(app)
          .post("/api/auth/logout")
          .set("Authorization", `Bearer ${authData.accessToken}`)
          .send({ refreshToken: authData.refreshToken })
          .expect(200);

        expect(response.body).toHaveProperty("success", true);
        expect(response.body).toHaveProperty(
          "message",
          "Logged out successfully",
        );
      });
    });
  });
});
