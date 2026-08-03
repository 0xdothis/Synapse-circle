import request from "supertest";
import app from "../../server.js";
import User from "../../src/models/User.js";
import TrustedContact from "../../src/models/TrustedContact.js";
import SOSAlert from "../../src/models/SOSAlert.js";
import { getAuthToken } from "../helpers/authHelper.js";

describe("Profile Integration Tests", () => {
  let authData;
  let userId;

  const testUser = {
    email: "integration-profile@campus.edu",
    name: "Integration Profile User",
    password: "TestPassword123",
  };

  beforeAll(async () => {
    authData = await getAuthToken(testUser);
    userId = authData.userId;

    // Add a contact
    await request(app)
      .post("/api/contacts")
      .set("Cookie", authData.cookies)
      .set("x-csrf-token", authData.csrfToken)
      .send({
        name: "Profile Contact",
        email: "profilecontact@example.com",
        relationship: "friend",
      })
      .expect(201);

    // Create some alerts
    for (let i = 0; i < 3; i++) {
      await request(app)
        .post("/api/sos/trigger")
        .set("Cookie", authData.cookies)
        .set("x-csrf-token", authData.csrfToken)
        .send({
          latitude: 37.7749 + i * 0.001,
          longitude: -122.4194 + i * 0.001,
        })
        .expect(200);
    }
  });

  describe("Get Profile", () => {
    it("should get full user profile", async () => {
      const res = await request(app)
        .get("/api/profile/me")
        .set("Cookie", authData.cookies)
        .set("x-csrf-token", authData.csrfToken)
        .expect(200);

      expect(res.body).toHaveProperty("success", true);
      expect(res.body).toHaveProperty("profile");

      const { profile } = res.body;
      expect(profile).toHaveProperty("id", userId);
      expect(profile).toHaveProperty("name", testUser.name);
      expect(profile).toHaveProperty("email", testUser.email);
      expect(profile).toHaveProperty("profilePicture");
      expect(profile).toHaveProperty("isVerified", true);
      expect(profile).toHaveProperty("isActive", true);

      // Check safety setup
      expect(profile).toHaveProperty("safetySetup");
      expect(profile.safetySetup).toHaveProperty("institutionSelected");
      expect(profile.safetySetup).toHaveProperty("trustedContactsAdded", true);
      expect(profile.safetySetup).toHaveProperty("isComplete");

      // Check contacts
      expect(profile).toHaveProperty("trustedContacts");
      expect(profile.trustedContacts).toBeInstanceOf(Array);
      expect(profile.trustedContacts.length).toBeGreaterThan(0);

      // Check stats
      expect(profile).toHaveProperty("stats");
      expect(profile.stats).toHaveProperty("total");
      expect(profile.stats).toHaveProperty("active");
      expect(profile.stats).toHaveProperty("cancelled");
      expect(profile.stats).toHaveProperty("resolved");
      expect(profile.stats.total).toBeGreaterThan(0);

      expect(profile).toHaveProperty("maxContacts", 3);
    });
  });

  describe("Update Profile", () => {
    it("should update full profile", async () => {
      const updateData = {
        name: "Updated Profile Name",
        email: "updatedprofile@campus.edu",
        university: "Updated University",
        preferences: {
          autoShareLocation: false,
          alertSound: false,
        },
      };

      const res = await request(app)
        .put("/api/profile/me")
        .set("Cookie", authData.cookies)
        .set("x-csrf-token", authData.csrfToken)
        .send(updateData)
        .expect(200);

      expect(res.body).toHaveProperty("success", true);
      expect(res.body.profile).toHaveProperty("name", updateData.name);
      expect(res.body.profile).toHaveProperty("email", updateData.email);
      expect(res.body.profile).toHaveProperty(
        "university",
        updateData.university,
      );
      expect(res.body.profile.preferences).toHaveProperty(
        "autoShareLocation",
        false,
      );
    });

    it("should update name only", async () => {
      const newName = "Name Only Update";
      const res = await request(app)
        .put("/api/profile/name")
        .set("Cookie", authData.cookies)
        .set("x-csrf-token", authData.csrfToken)
        .send({ name: newName })
        .expect(200);

      expect(res.body).toHaveProperty("success", true);
      expect(res.body).toHaveProperty("name", newName);
    });

    it("should update email only", async () => {
      const newEmail = "newemailonly@campus.edu";
      const res = await request(app)
        .put("/api/profile/email")
        .set("Cookie", authData.cookies)
        .set("x-csrf-token", authData.csrfToken)
        .send({ email: newEmail })
        .expect(200);

      expect(res.body).toHaveProperty("success", true);
      expect(res.body).toHaveProperty("email", newEmail);
    });

    it("should handle duplicate email error", async () => {
      const anotherUser = {
        email: "anotherprofile@campus.edu",
        name: "Another User",
        password: "TestPassword123",
      };

      await getAuthToken(anotherUser);

      const res = await request(app)
        .put("/api/profile/email")
        .set("Cookie", authData.cookies)
        .set("x-csrf-token", authData.csrfToken)
        .send({ email: anotherUser.email })
        .expect(409);

      expect(res.body).toHaveProperty("success", false);
      expect(res.body).toHaveProperty(
        "message",
        "Email already in use by another account",
      );
    });
  });

  describe("Alert History", () => {
    it("should get alert history with filters", async () => {
      const res = await request(app)
        .get("/api/profile/history?status=all&limit=10&page=1")
        .set("Cookie", authData.cookies)
        .set("x-csrf-token", authData.csrfToken)
        .expect(200);

      expect(res.body).toHaveProperty("success", true);
      expect(res.body).toHaveProperty("alerts");
      expect(res.body.alerts).toBeInstanceOf(Array);
      expect(res.body.alerts.length).toBeGreaterThan(0);

      expect(res.body).toHaveProperty("pagination");
      expect(res.body.pagination).toHaveProperty("total");
      expect(res.body.pagination).toHaveProperty("page", 1);
      expect(res.body.pagination).toHaveProperty("limit", 10);

      expect(res.body).toHaveProperty("statusCounts");
      expect(res.body.statusCounts).toHaveProperty("all");
      expect(res.body.statusCounts).toHaveProperty("sent");
      expect(res.body.statusCounts).toHaveProperty("cancelled");
      expect(res.body.statusCounts).toHaveProperty("resolved");
    });

    it("should get specific alert", async () => {
      // Get first alert ID
      const historyRes = await request(app)
        .get("/api/profile/history?limit=1")
        .set("Cookie", authData.cookies)
        .set("x-csrf-token", authData.csrfToken)
        .expect(200);

      if (historyRes.body.alerts.length > 0) {
        const alertId = historyRes.body.alerts[0].id;

        const res = await request(app)
          .get(`/api/profile/history/${alertId}`)
          .set("Cookie", authData.cookies)
          .set("x-csrf-token", authData.csrfToken)
          .expect(200);

        expect(res.body).toHaveProperty("success", true);
        expect(res.body.alert).toHaveProperty("id", alertId);
        expect(res.body.alert).toHaveProperty("status");
        expect(res.body.alert).toHaveProperty("timestamp");
        expect(res.body.alert).toHaveProperty("canCancel");
        expect(res.body.alert).toHaveProperty("cancellationTimeRemaining");
      }
    });

    it("should handle non-existent alert in history", async () => {
      const res = await request(app)
        .get("/api/profile/history/507f1f77bcf86cd799439011")
        .set("Cookie", authData.cookies)
        .set("x-csrf-token", authData.csrfToken)
        .expect(404);

      expect(res.body).toHaveProperty("success", false);
      expect(res.body).toHaveProperty("message", "Alert not found");
    });
  });
});
