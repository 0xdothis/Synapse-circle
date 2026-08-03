import request from "supertest";
import app from "../../server.js";
import User from "../../src/models/User.js";
import TrustedContact from "../../src/models/TrustedContact.js";
import SOSAlert from "../../src/models/SOSAlert.js";
import { getAuthToken, clearAuthCache } from "../helpers/authHelper.js";
import path from "path";
import { fileURLToPath } from "url";
import fs from "node:fs";
import { isCloudinaryConfigured } from "../../src/config/cloudinary.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const hasCloudinary = isCloudinaryConfigured;

describe("Profile API Tests", () => {
  let authData;
  let userId;
  let alertId;

  const testUser = {
    email: "profiletest@campus.edu",
    name: "Profile Test User",
    password: "TestPassword123",
  };

  const testContact = {
    name: "Test Contact",
    email: "testcontact@example.com",
    relationship: "friend",
  };

  beforeAll(async () => {
    authData = await getAuthToken(testUser);
    userId = authData.userId;

    await request(app)
      .post("/api/contacts")
      .set("Cookie", authData.cookies)
      .set("x-csrf-token", authData.csrfToken)
      .send(testContact);

    for (let i = 0; i < 3; i++) {
      const response = await request(app)
        .post("/api/sos/trigger")
        .set("Cookie", authData.cookies)
        .set("x-csrf-token", authData.csrfToken)
        .send({
          latitude: 37.7749 + i * 0.001,
          longitude: -122.4194 + i * 0.001,
          locationAvailable: true,
          message: `Test alert ${i + 1}`,
        });

      if (i === 0) {
        alertId = response.body.alertId;
      }
    }

    if (alertId) {
      await request(app)
        .post(`/api/sos/cancel/${alertId}`)
        .set("Cookie", authData.cookies)
        .set("x-csrf-token", authData.csrfToken)
        .send({ reason: "false_alarm" });
    }
  });

  beforeEach(() => {
    clearAuthCache();
  });

  describe("GET /api/profile/me", () => {
    it("should get full user profile with contacts and stats", async () => {
      const response = await request(app)
        .get("/api/profile/me")
        .set("Cookie", authData.cookies)
        .set("x-csrf-token", authData.csrfToken)
        .expect(200);

      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty("profile");

      const { profile } = response.body;

      expect(profile).toHaveProperty("id", userId);
      expect(profile).toHaveProperty("name", testUser.name);
      expect(profile).toHaveProperty("email", testUser.email);
      expect(profile).toHaveProperty("profilePicture");
      expect(profile).toHaveProperty("university");
      expect(profile).toHaveProperty("universityId");
      expect(profile).toHaveProperty("isVerified", true);
      expect(profile).toHaveProperty("isActive", true);

      expect(profile).toHaveProperty("preferences");
      expect(profile.preferences).toHaveProperty("autoShareLocation", true);
      expect(profile.preferences).toHaveProperty("alertSound", true);

      expect(profile).toHaveProperty("onboardingStep");

      expect(profile).toHaveProperty("safetySetup");
      expect(profile.safetySetup).toHaveProperty("institutionSelected");
      expect(profile.safetySetup).toHaveProperty("trustedContactsAdded");
      expect(profile.safetySetup).toHaveProperty("locationPermissionEnabled");
      expect(profile.safetySetup).toHaveProperty("isComplete");

      expect(profile).toHaveProperty("trustedContacts");
      expect(Array.isArray(profile.trustedContacts)).toBe(true);
      expect(profile.trustedContacts.length).toBeGreaterThan(0);

      if (profile.trustedContacts.length > 0) {
        const contact = profile.trustedContacts[0];
        expect(contact).toHaveProperty("id");
        expect(contact).toHaveProperty("name");
        expect(contact).toHaveProperty("email");
        expect(contact).toHaveProperty("relationship");
        expect(contact).toHaveProperty("isPrimary");
      }

      expect(profile).toHaveProperty("stats");
      expect(profile.stats).toHaveProperty("total");
      expect(profile.stats).toHaveProperty("active");
      expect(profile.stats).toHaveProperty("cancelled");
      expect(profile.stats).toHaveProperty("resolved");

      expect(profile).toHaveProperty("maxContacts", 3);
      expect(profile).toHaveProperty("createdAt");
      expect(profile).toHaveProperty("lastLogin");
    });

    it("should return 401 without token", async () => {
      const response = await request(app).get("/api/profile/me").expect(401);

      expect(response.body).toHaveProperty("success", false);
      expect(response.body).toHaveProperty(
        "message",
        "Authentication required. Please log in.",
      );
    });

    it("should return 404 for non-existent user", async () => {
      const tempUser = {
        email: "tempprofile@campus.edu",
        name: "Temp User",
        password: "TestPassword123",
      };

      const tempAuth = await getAuthToken(tempUser);
      const tempUserId = tempAuth.userId;
      await User.findByIdAndDelete(tempUserId);
      clearAuthCache();

      const response = await request(app)
        .get("/api/profile/me")
        .set("Cookie", tempAuth.cookies)
        .set("x-csrf-token", tempAuth.csrfToken)
        .expect(404);

      expect(response.body).toHaveProperty("success", false);
      expect(response.body).toHaveProperty(
        "message",
        "User not found. Please log in again.",
      );
    });
  });

  describe("PUT /api/profile/me", () => {
    it("should update full profile", async () => {
      const updateData = {
        name: "Updated Name",
        email: "updated@campus.edu",
        university: "Updated University",
        preferences: {
          autoShareLocation: false,
          alertSound: false,
        },
      };

      const response = await request(app)
        .put("/api/profile/me")
        .set("Cookie", authData.cookies)
        .set("x-csrf-token", authData.csrfToken)
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty(
        "message",
        "Profile updated successfully",
      );
      expect(response.body).toHaveProperty("profile");

      const { profile } = response.body;
      expect(profile).toHaveProperty("name", updateData.name);
      expect(profile).toHaveProperty("email", updateData.email);
      expect(profile).toHaveProperty("university", updateData.university);
      expect(profile.preferences).toHaveProperty("autoShareLocation", false);
      expect(profile.preferences).toHaveProperty("alertSound", false);

      const user = await User.findById(userId);
      expect(user.name).toBe(updateData.name);
      expect(user.email).toBe(updateData.email);
      expect(user.selectedUniversity).toBe(updateData.university);
    });

    it("should update only specified fields", async () => {
      const updateData = {
        name: "Partial Update Name",
      };

      const response = await request(app)
        .put("/api/profile/me")
        .set("Cookie", authData.cookies)
        .set("x-csrf-token", authData.csrfToken)
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty("success", true);
      expect(response.body.profile).toHaveProperty("name", updateData.name);

      expect(response.body.profile).toHaveProperty(
        "email",
        "updated@campus.edu",
      );
    });

    it("should return 409 for duplicate email", async () => {
      const anotherUser = {
        email: "anotherprofile@campus.edu",
        name: "Another User",
        password: "TestPassword123",
      };

      await getAuthToken(anotherUser);

      const response = await request(app)
        .put("/api/profile/me")
        .set("Cookie", authData.cookies)
        .set("x-csrf-token", authData.csrfToken)
        .send({
          email: anotherUser.email,
        })
        .expect(409);

      expect(response.body).toHaveProperty("success", false);
      expect(response.body).toHaveProperty(
        "message",
        "Email already in use by another account",
      );
    });

    it("should return 401 without token", async () => {
      const response = await request(app)
        .put("/api/profile/me")
        .send({ name: "Test" })
        .expect(401);

      expect(response.body).toHaveProperty("success", false);
      expect(response.body).toHaveProperty(
        "message",
        "Authentication required. Please log in.",
      );
    });

    it("should return 404 for non-existent user", async () => {
      const tempUser = {
        email: "tempprofile2@campus.edu",
        name: "Temp User 2",
        password: "TestPassword123",
      };

      const tempAuth = await getAuthToken(tempUser);
      const tempUserId = tempAuth.userId;
      await User.findByIdAndDelete(tempUserId);
      clearAuthCache();

      const response = await request(app)
        .put("/api/profile/me")
        .set("Cookie", tempAuth.cookies)
        .set("x-csrf-token", tempAuth.csrfToken)
        .send({ name: "Test" })
        .expect(404);

      expect(response.body).toHaveProperty("success", false);
      expect(response.body).toHaveProperty(
        "message",
        "User not found. Please log in again.",
      );
    });
  });

  describe("PUT /api/profile/name", () => {
    it("should update name only", async () => {
      const newName = "Name Only Update";

      const response = await request(app)
        .put("/api/profile/name")
        .set("Cookie", authData.cookies)
        .set("x-csrf-token", authData.csrfToken)
        .send({ name: newName })
        .expect(200);

      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty(
        "message",
        "Name updated successfully",
      );
      expect(response.body).toHaveProperty("name", newName);

      const user = await User.findById(userId);
      expect(user.name).toBe(newName);
    });

    it("should return 400 for empty name", async () => {
      const response = await request(app)
        .put("/api/profile/name")
        .set("Cookie", authData.cookies)
        .set("x-csrf-token", authData.csrfToken)
        .send({ name: "" })
        .expect(400);

      expect(response.body).toHaveProperty("success", false);
      expect(response.body).toHaveProperty(
        "message",
        expect.stringContaining("Name is required"),
      );
    });

    it("should return 401 without token", async () => {
      const response = await request(app)
        .put("/api/profile/name")
        .send({ name: "Test" })
        .expect(401);

      expect(response.body).toHaveProperty("success", false);
      expect(response.body).toHaveProperty(
        "message",
        "Authentication required. Please log in.",
      );
    });
  });

  describe("PUT /api/profile/email", () => {
    it("should update email only", async () => {
      const newEmail = "newemail@campus.edu";

      const response = await request(app)
        .put("/api/profile/email")
        .set("Cookie", authData.cookies)
        .set("x-csrf-token", authData.csrfToken)
        .send({ email: newEmail })
        .expect(200);

      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty(
        "message",
        "Email updated successfully",
      );
      expect(response.body).toHaveProperty("email", newEmail);

      const user = await User.findById(userId);
      expect(user.email).toBe(newEmail);
    });

    it("should return 400 for invalid email", async () => {
      const response = await request(app)
        .put("/api/profile/email")
        .set("Cookie", authData.cookies)
        .set("x-csrf-token", authData.csrfToken)
        .send({ email: "invalid-email" })
        .expect(400);

      expect(response.body).toHaveProperty("success", false);
      expect(response.body).toHaveProperty(
        "message",
        expect.stringContaining("Valid email is required"),
      );
    });

    it("should return 409 for duplicate email", async () => {
      const anotherUser = {
        email: "anotheremail@campus.edu",
        name: "Another User",
        password: "TestPassword123",
      };

      await getAuthToken(anotherUser);

      const response = await request(app)
        .put("/api/profile/email")
        .set("Cookie", authData.cookies)
        .set("x-csrf-token", authData.csrfToken)
        .send({ email: anotherUser.email })
        .expect(409);

      expect(response.body).toHaveProperty("success", false);
      expect(response.body).toHaveProperty(
        "message",
        "Email already in use by another account",
      );
    });
  });

  const describeCloudinary = hasCloudinary ? describe : describe.skip;

  describeCloudinary("POST /api/profile/picture", () => {
    it("should upload a profile picture", async () => {
      const testImagePath = path.join(__dirname, "fixtures", "test-image.png");

      const base64Image =
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==";
      const buffer = Buffer.from(base64Image, "base64");

      const tempDir = path.join(__dirname, "fixtures");
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      fs.writeFileSync(testImagePath, buffer);

      const response = await request(app)
        .post("/api/profile/picture")
        .set("Cookie", authData.cookies)
        .set("x-csrf-token", authData.csrfToken)
        .attach("profilePicture", testImagePath)
        .expect(200);

      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty(
        "message",
        "Profile picture uploaded successfully",
      );
      expect(response.body).toHaveProperty("profilePicture");
      expect(response.body).toHaveProperty("publicId");

      const user = await User.findById(userId);
      expect(user.profilePicture).toBeTruthy();
      expect(user.profilePicture).toContain("res.cloudinary.com");

      fs.unlinkSync(testImagePath);
    });

    it("should return 400 for no file upload", async () => {
      const response = await request(app)
        .post("/api/profile/picture")
        .set("Cookie", authData.cookies)
        .set("x-csrf-token", authData.csrfToken)
        .expect(400);

      expect(response.body).toHaveProperty("success", false);
      expect(response.body).toHaveProperty("message", "No file uploaded");
    });

    it("should return 400 for invalid file type", async () => {
      const testFilePath = path.join(__dirname, "fixtures", "test.txt");
      fs.writeFileSync(testFilePath, "This is not an image");

      const response = await request(app)
        .post("/api/profile/picture")
        .set("Cookie", authData.cookies)
        .set("x-csrf-token", authData.csrfToken)
        .attach("profilePicture", testFilePath)
        .expect(400);

      expect(response.body).toHaveProperty("success", false);
      expect(response.body).toHaveProperty(
        "message",
        expect.stringContaining("Invalid file type"),
      );

      fs.unlinkSync(testFilePath);
    });

    it("should return 401 without token", async () => {
      const testImagePath = path.join(__dirname, "fixtures", "test-image.png");

      if (!fs.existsSync(testImagePath)) {
        const base64Image =
          "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==";
        const buffer = Buffer.from(base64Image, "base64");
        const tempDir = path.join(__dirname, "fixtures");
        if (!fs.existsSync(tempDir)) {
          fs.mkdirSync(tempDir, { recursive: true });
        }
        fs.writeFileSync(testImagePath, buffer);
      }

      const response = await request(app)
        .post("/api/profile/picture")
        .attach("profilePicture", testImagePath)
        .expect(401);

      expect(response.body).toHaveProperty("success", false);
      expect(response.body).toHaveProperty(
        "message",
        "Authentication required. Please log in.",
      );
    });
  });

  describeCloudinary("DELETE /api/profile/picture", () => {
    it("should delete profile picture", async () => {
      const testImagePath = path.join(
        __dirname,
        "fixtures",
        "test-image-delete.png",
      );

      const base64Image =
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==";
      const buffer = Buffer.from(base64Image, "base64");
      const tempDir = path.join(__dirname, "fixtures");
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      fs.writeFileSync(testImagePath, buffer);

      await request(app)
        .post("/api/profile/picture")
        .set("Cookie", authData.cookies)
        .set("x-csrf-token", authData.csrfToken)
        .attach("profilePicture", testImagePath)
        .expect(200);

      const response = await request(app)
        .delete("/api/profile/picture")
        .set("Cookie", authData.cookies)
        .set("x-csrf-token", authData.csrfToken)
        .expect(200);

      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty(
        "message",
        "Profile picture deleted successfully",
      );

      const user = await User.findById(userId);
      expect(user.profilePicture).toBeNull();

      if (fs.existsSync(testImagePath)) {
        fs.unlinkSync(testImagePath);
      }
    });

    it("should return 404 if user not found", async () => {
      const tempUser = {
        email: "tempprofilepic@campus.edu",
        name: "Temp User Pic",
        password: "TestPassword123",
      };

      const tempAuth = await getAuthToken(tempUser);
      const tempUserId = tempAuth.userId;
      await User.findByIdAndDelete(tempUserId);
      clearAuthCache();

      const response = await request(app)
        .delete("/api/profile/picture")
        .set("Cookie", tempAuth.cookies)
        .set("x-csrf-token", tempAuth.csrfToken)
        .expect(404);

      expect(response.body).toHaveProperty("success", false);
      expect(response.body).toHaveProperty(
        "message",
        "User not found. Please log in again.",
      );
    });

    it("should return 401 without token", async () => {
      const response = await request(app)
        .delete("/api/profile/picture")
        .expect(401);

      expect(response.body).toHaveProperty("success", false);
      expect(response.body).toHaveProperty(
        "message",
        "Authentication required. Please log in.",
      );
    });
  });

  describe("GET /api/profile/history", () => {
    it("should get alert history with all statuses", async () => {
      const response = await request(app)
        .get("/api/profile/history?status=all&limit=10&page=1")
        .set("Cookie", authData.cookies)
        .set("x-csrf-token", authData.csrfToken)
        .expect(200);

      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty("alerts");
      expect(Array.isArray(response.body.alerts)).toBe(true);
      expect(response.body.alerts.length).toBeGreaterThan(0);

      expect(response.body).toHaveProperty("pagination");
      expect(response.body.pagination).toHaveProperty("total");
      expect(response.body.pagination).toHaveProperty("page", 1);
      expect(response.body.pagination).toHaveProperty("limit", 10);
      expect(response.body.pagination).toHaveProperty("totalPages");

      expect(response.body).toHaveProperty("statusCounts");
      expect(response.body.statusCounts).toHaveProperty("all");
      expect(response.body.statusCounts).toHaveProperty("sent");
      expect(response.body.statusCounts).toHaveProperty("cancelled");
      expect(response.body.statusCounts).toHaveProperty("resolved");
      expect(response.body.statusCounts).toHaveProperty("failed");

      if (response.body.alerts.length > 0) {
        const alert = response.body.alerts[0];
        expect(alert).toHaveProperty("id");
        expect(alert).toHaveProperty("status");
        expect(alert).toHaveProperty("message");
        expect(alert).toHaveProperty("timestamp");
        expect(alert).toHaveProperty("canCancel");
        expect(alert).toHaveProperty("cancellationTimeRemaining");

        if (alert.location) {
          expect(alert.location).toHaveProperty("latitude");
          expect(alert.location).toHaveProperty("longitude");
        }
      }
    });

    it("should filter history by status - cancelled", async () => {
      const response = await request(app)
        .get("/api/profile/history?status=cancelled&limit=10&page=1")
        .set("Cookie", authData.cookies)
        .set("x-csrf-token", authData.csrfToken)
        .expect(200);

      expect(response.body).toHaveProperty("success", true);
      expect(
        response.body.alerts.every((alert) => alert.status === "cancelled"),
      ).toBe(true);
    });

    it("should filter history by status - sent", async () => {
      const response = await request(app)
        .get("/api/profile/history?status=sent&limit=10&page=1")
        .set("Cookie", authData.cookies)
        .set("x-csrf-token", authData.csrfToken)
        .expect(200);

      expect(response.body).toHaveProperty("success", true);
      expect(
        response.body.alerts.every((alert) => alert.status === "sent"),
      ).toBe(true);
    });

    it("should paginate history correctly", async () => {
      const response = await request(app)
        .get("/api/profile/history?limit=1&page=1")
        .set("Cookie", authData.cookies)
        .set("x-csrf-token", authData.csrfToken)
        .expect(200);

      expect(response.body).toHaveProperty("success", true);
      expect(response.body.alerts).toHaveLength(1);
      expect(response.body.pagination).toHaveProperty("page", 1);
      expect(response.body.pagination).toHaveProperty("limit", 1);
    });

    it("should return 401 without token", async () => {
      const response = await request(app)
        .get("/api/profile/history")
        .expect(401);

      expect(response.body).toHaveProperty("success", false);
      expect(response.body).toHaveProperty(
        "message",
        "Authentication required. Please log in.",
      );
    });
  });

  describe("GET /api/profile/history/:alertId", () => {
    it("should get a specific alert from history", async () => {
      const historyResponse = await request(app)
        .get("/api/profile/history?limit=1&page=1")
        .set("Cookie", authData.cookies)
        .set("x-csrf-token", authData.csrfToken)
        .expect(200);

      if (historyResponse.body.alerts.length === 0) {
        console.warn("No alerts found, skipping test");
        return;
      }

      const alertIdToGet = historyResponse.body.alerts[0].id;

      const response = await request(app)
        .get(`/api/profile/history/${alertIdToGet}`)
        .set("Cookie", authData.cookies)
        .set("x-csrf-token", authData.csrfToken)
        .expect(200);

      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty("alert");

      const alert = response.body.alert;
      expect(alert).toHaveProperty("id", alertIdToGet);
      expect(alert).toHaveProperty("status");
      expect(alert).toHaveProperty("message");
      expect(alert).toHaveProperty("timestamp");
      expect(alert).toHaveProperty("canCancel");
      expect(alert).toHaveProperty("cancellationTimeRemaining");

      if (alert.location) {
        expect(alert.location).toHaveProperty("latitude");
        expect(alert.location).toHaveProperty("longitude");
      }
    });

    it("should return 404 for non-existent alert", async () => {
      const response = await request(app)
        .get("/api/profile/history/507f1f77bcf86cd799439011")
        .set("Cookie", authData.cookies)
        .set("x-csrf-token", authData.csrfToken)
        .expect(404);

      expect(response.body).toHaveProperty("success", false);
      expect(response.body).toHaveProperty("message", "Alert not found");
    });

    it("should return 401 without token", async () => {
      const response = await request(app)
        .get("/api/profile/history/507f1f77bcf86cd799439011")
        .expect(401);

      expect(response.body).toHaveProperty("success", false);
      expect(response.body).toHaveProperty(
        "message",
        "Authentication required. Please log in.",
      );
    });
  });

  describe("GET /api/profile/me - Full Profile Integration", () => {
    it("should return complete profile with all data", async () => {
      const response = await request(app)
        .get("/api/profile/me")
        .set("Cookie", authData.cookies)
        .set("x-csrf-token", authData.csrfToken)
        .expect(200);

      expect(response.body).toHaveProperty("success", true);

      const { profile } = response.body;

      expect(profile).toHaveProperty("id");
      expect(profile).toHaveProperty("name");
      expect(profile).toHaveProperty("email");
      expect(profile).toHaveProperty("profilePicture");
      expect(profile).toHaveProperty("university");
      expect(profile).toHaveProperty("isVerified");
      expect(profile).toHaveProperty("preferences");
      expect(profile).toHaveProperty("safetySetup");
      expect(profile).toHaveProperty("trustedContacts");
      expect(profile).toHaveProperty("stats");
      expect(profile).toHaveProperty("maxContacts");
      expect(profile).toHaveProperty("createdAt");
      expect(profile).toHaveProperty("lastLogin");

      const { safetySetup } = profile;
      expect(safetySetup).toHaveProperty("institutionSelected");
      expect(safetySetup).toHaveProperty("trustedContactsAdded");
      expect(safetySetup).toHaveProperty("locationPermissionEnabled");
      expect(safetySetup).toHaveProperty("isComplete");

      if (profile.trustedContacts.length > 0) {
        expect(safetySetup.trustedContactsAdded).toBe(true);
      }

      const { stats } = profile;
      expect(stats.total).toBeGreaterThanOrEqual(0);
      expect(stats.active).toBeGreaterThanOrEqual(0);
      expect(stats.cancelled).toBeGreaterThanOrEqual(0);
      expect(stats.resolved).toBeGreaterThanOrEqual(0);
    });
  });
});
