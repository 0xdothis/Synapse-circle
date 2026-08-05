import request from "supertest";
import app from "../../server.js";
import User from "../../src/models/User.js";
import SOSAlert from "../../src/models/SOSAlert.js";
import config from "../../src/utils/config.js";
import TrustedContact from "../../src/models/TrustedContact.js";
import CampusSecurity from "../../src/models/CampusSecurity.js";
import { getAuthToken } from "../helpers/authHelper.js";

describe("SOS Alert Integration Tests", () => {
  let authData;
  let userId;
  let alertId;

  const testUser = {
    email: "integration-sos@campus.edu",
    name: "Integration SOS User",
    password: "TestPassword123",
  };

  beforeAll(async () => {
    authData = await getAuthToken(testUser);
    userId = authData.userId;

    // Ensure user has contacts
    await request(app)
      .post("/api/contacts")
      .set("Authorization", `Bearer ${authData.accessToken}`)
      .send({
        name: "SOS Contact",
        email: "soscontact@example.com",
        relationship: "friend",
      })
      .expect(201);

    // Ensure campus security exists
    const securityExists = await CampusSecurity.findOne();
    if (!securityExists) {
      await CampusSecurity.create({
        name: "Campus Security",
        phoneNumber: "+1234567899",
        email: "security@campus.edu",
        location: "Main Campus",
        isActive: true,
      });
    }
  });

  describe("Complete SOS Flow", () => {
    it("should trigger an SOS alert", async () => {
      const locationData = {
        latitude: 37.7749,
        longitude: -122.4194,
        locationAvailable: true,
        message: "Emergency! Need help!",
      };

      const res = await request(app)
        .post("/api/sos/trigger")
        .set("Authorization", `Bearer ${authData.accessToken}`)
        .send(locationData)
        .expect(200);

      expect(res.body).toHaveProperty("success", true);
      expect(res.body).toHaveProperty("alertId");
      expect(res.body).toHaveProperty("status", "sent");
      expect(res.body).toHaveProperty("contactsNotified");
      expect(res.body.contactsNotified).toBeInstanceOf(Array);
      expect(res.body.contactsNotified.length).toBeGreaterThan(0);
      expect(res.body).toHaveProperty("deliveredCount");
      expect(res.body).toHaveProperty("totalCount");

      alertId = res.body.alertId;

      // Verify alert in database
      const alert = await SOSAlert.findById(alertId);
      expect(alert).toBeTruthy();
      expect(alert.userId.toString()).toBe(userId);
      expect(alert.status).toBe("sent");
      expect(alert.latitude).toBe(locationData.latitude);
      expect(alert.longitude).toBe(locationData.longitude);
    });

    it("should get alert status", async () => {
      const res = await request(app)
        .get(`/api/sos/status/${alertId}`)
        .set("Authorization", `Bearer ${authData.accessToken}`)
        .expect(200);

      expect(res.body).toHaveProperty("success", true);
      expect(res.body).toHaveProperty("status", "sent");
      expect(res.body).toHaveProperty("canCancel", true);
      expect(res.body).toHaveProperty("cancellationTimeRemaining");
      expect(res.body).toHaveProperty("createdAt");
      expect(res.body).toHaveProperty("updatedAt");
    });

    it("should cancel an SOS alert", async () => {
      const res = await request(app)
        .post(`/api/sos/cancel/${alertId}`)
        .set("Authorization", `Bearer ${authData.accessToken}`)
        .send({ reason: "false_alarm" })
        .expect(200);

      expect(res.body).toHaveProperty("success", true);
      expect(res.body).toHaveProperty("status", "cancelled");
      expect(res.body).toHaveProperty("alertId", alertId);

      // Verify alert status updated
      const alert = await SOSAlert.findById(alertId);
      expect(alert.status).toBe("cancelled");
      expect(alert.cancellationReason).toBe("false_alarm");
    });

    it("should prevent cancelling already cancelled alert", async () => {
      const res = await request(app)
        .post(`/api/sos/cancel/${alertId}`)
        .set("Authorization", `Bearer ${authData.accessToken}`)
        .send({ reason: "false_alarm" })
        .expect(400);

      expect(res.body).toHaveProperty("success", false);
      expect(res.body.message).toContain("Alert cannot be cancelled");
    });
  });

  describe("SOS History", () => {
    it("should get alert history", async () => {
      // Create multiple alerts
      for (let i = 0; i < 3; i++) {
        await request(app)
          .post("/api/sos/trigger")
          .set("Authorization", `Bearer ${authData.accessToken}`)
          .send({
            latitude: 37.7749 + i * 0.001,
            longitude: -122.4194 + i * 0.001,
          })
          .expect(200);
      }

      const res = await request(app)
        .get("/api/sos/history")
        .set("Authorization", `Bearer ${authData.accessToken}`)
        .expect(200);

      expect(res.body).toHaveProperty("success", true);
      expect(res.body.alerts).toBeInstanceOf(Array);
      expect(res.body.alerts.length).toBeGreaterThan(0);
      expect(res.body).toHaveProperty("total");
      expect(res.body).toHaveProperty("limit", 20);
      expect(res.body).toHaveProperty("offset", 0);
    });

    it("should get specific alert", async () => {
      const res = await request(app)
        .get(`/api/sos/history/${alertId}`)
        .set("Authorization", `Bearer ${authData.accessToken}`)
        .expect(200);

      expect(res.body).toHaveProperty("success", true);
      expect(res.body.alert).toHaveProperty("id", alertId);
      expect(res.body.alert).toHaveProperty("status", "cancelled");
      expect(res.body.alert).toHaveProperty("cancelledAt");
    });

    it("should filter history by status", async () => {
      const res = await request(app)
        .get("/api/sos/history?status=sent")
        .set("Authorization", `Bearer ${authData.accessToken}`)
        .expect(200);

      expect(res.body).toHaveProperty("success", true);
      expect(res.body.alerts.every((alert) => alert.status === "sent")).toBe(
        true,
      );
    });

    it("should paginate history correctly", async () => {
      const res = await request(app)
        .get("/api/sos/history?limit=2&offset=0")
        .set("Authorization", `Bearer ${authData.accessToken}`)
        .expect(200);

      expect(res.body.alerts.length).toBeLessThanOrEqual(2);
      expect(res.body).toHaveProperty("limit", 2);
      expect(res.body).toHaveProperty("offset", 0);
    });
  });

  describe("SOS Rate Limiting", () => {
    it("should enforce SOS rate limiting", async () => {
      const originalDisable = process.env.DISABLE_RATE_LIMITING;
      const originalConfigDisable = config.disableRateLimiting;

      try {
        process.env.DISABLE_RATE_LIMITING = "false";
        config.disableRateLimiting = false;

        // Make multiple SOS triggers
        for (let i = 0; i < 4; i++) {
          await request(app)
            .post("/api/sos/trigger")
            .set("Authorization", `Bearer ${authData.accessToken}`)
            .send({
              latitude: 37.7749,
              longitude: -122.4194,
            });
        }

        // The 5th should be rate limited
        const res = await request(app)
          .post("/api/sos/trigger")
          .set("Authorization", `Bearer ${authData.accessToken}`)
          .send({
            latitude: 37.7749,
            longitude: -122.4194,
          })
          .expect(429);

        expect(res.body).toHaveProperty(
          "message",
          "Too many SOS triggers. Please wait before sending another alert.",
        );
      } finally {
        process.env.DISABLE_RATE_LIMITING = originalDisable;
        config.disableRateLimiting = originalConfigDisable;
      }
    });
  });

  describe("SOS Error Handling", () => {
    it("should handle non-existent alert ID", async () => {
      const res = await request(app)
        .get("/api/sos/history/507f1f77bcf86cd799439011")
        .set("Authorization", `Bearer ${authData.accessToken}`)
        .expect(404);

      expect(res.body).toHaveProperty("success", false);
      expect(res.body).toHaveProperty("message", "Alert not found");
    });

    it("should handle unauthorized SOS trigger", async () => {
      const res = await request(app)
        .post("/api/sos/trigger")
        .send({
          latitude: 37.7749,
          longitude: -122.4194,
        })
        .expect(401);

      expect(res.body).toHaveProperty("success", false);
      expect(res.body).toHaveProperty(
        "message",
        "Authentication required. Please log in.",
      );
    });
  });
});
