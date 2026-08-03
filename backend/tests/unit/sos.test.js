import request from "supertest";
import app from "../../server.js";
import User from "../../src/models/User.js";
import { getAuthToken } from "../helpers/authHelper.js";
import TrustedContact from "../../src/models/TrustedContact.js";
import SOSAlert from "../../src/models/SOSAlert.js";
import CampusSecurity from "../../src/models/CampusSecurity.js";
import config from "../../src/utils/config.js";

describe("SOS Alert API Tests", () => {
  let authData;
  let userId;
  let alertId;

  const testUser = {
    email: "sostest@campus.edu",
    name: "SOS Test User",
    password: "TestPassword123",
  };

  const testContact = {
    name: "Emergency Contact",
    email: "emergency@example.com",
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

    const securityExists = await CampusSecurity.findOne();
    if (!securityExists) {
      await CampusSecurity.create({
        name: "Test Security",
        phoneNumber: "+1234567899",
        email: "security@campus.edu",
        location: "Main Building",
        isActive: true,
      });
    }
  });

  describe("POST /api/sos/trigger", () => {
    it("should trigger an SOS alert with location", async () => {
      const locationData = {
        latitude: 37.7749,
        longitude: -122.4194,
        locationAvailable: true,
      };

      const response = await request(app)
        .post("/api/sos/trigger")
        .set("Cookie", authData.cookies)
        .set("x-csrf-token", authData.csrfToken)
        .send(locationData)
        .expect(200);

      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty("alertId");
      expect(response.body).toHaveProperty("status", "sent");
      expect(response.body).toHaveProperty("contactsNotified");
      expect(Array.isArray(response.body.contactsNotified)).toBe(true);
      expect(response.body.contactsNotified.length).toBeGreaterThan(0);
      expect(response.body).toHaveProperty("deliveredCount");
      expect(response.body).toHaveProperty("totalCount");
      expect(response.body).toHaveProperty("message");

      alertId = response.body.alertId;

      const alert = await SOSAlert.findById(alertId);
      expect(alert).toBeTruthy();
      expect(alert.userId.toString()).toBe(userId);
      expect(alert.latitude).toBe(locationData.latitude);
      expect(alert.longitude).toBe(locationData.longitude);
      expect(alert.status).toBe("sent");
    });

    it("should trigger SOS without location", async () => {
      const response = await request(app)
        .post("/api/sos/trigger")
        .set("Cookie", authData.cookies)
        .set("x-csrf-token", authData.csrfToken)
        .send({
          latitude: 37.7749,
          longitude: -122.4194,
          locationAvailable: false,
        })
        .expect(200);

      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty("alertId");
      expect(response.body).toHaveProperty("status", "sent");
    });

    it("should return 401 without token", async () => {
      const response = await request(app)
        .post("/api/sos/trigger")
        .send({
          latitude: 37.7749,
          longitude: -122.4194,
        })
        .expect(401);

      expect(response.body).toHaveProperty("success", false);
      expect(response.body).toHaveProperty(
        "message",
        "Authentication required. Please log in.",
      );
    });

    it("should return 429 for too many SOS triggers", async () => {
      const originalDisable = process.env.DISABLE_RATE_LIMITING;
      const originalConfigDisable = config.disableRateLimiting;

      try {
        process.env.DISABLE_RATE_LIMITING = "false";
        config.disableRateLimiting = false;
        await new Promise((resolve) => setTimeout(resolve, 100));

        for (let i = 0; i < 3; i++) {
          await request(app)
            .post("/api/sos/trigger")
            .set("Cookie", authData.cookies)
            .set("x-csrf-token", authData.csrfToken)
            .send({
              latitude: 37.7749,
              longitude: -122.4194,
            });
        }

        const response = await request(app)
          .post("/api/sos/trigger")
          .set("Cookie", authData.cookies)
          .set("x-csrf-token", authData.csrfToken)
          .send({
            latitude: 37.7749,
            longitude: -122.4194,
          });

        expect(response.status).toBe(429);
        expect(response.body).toHaveProperty(
          "message",
          "Too many SOS triggers. Please wait before sending another alert.",
        );
      } catch (error) {
        if (error.status === 429) {
          expect(error.status).toBe(429);
        } else {
          throw error;
        }
      } finally {
        process.env.DISABLE_RATE_LIMITING = originalDisable;
        config.disableRateLimiting = originalConfigDisable;
      }
    });
  });

  describe("POST /api/sos/cancel/:alertId", () => {
    it("should cancel an SOS alert", async () => {
      const triggerResponse = await request(app)
        .post("/api/sos/trigger")
        .set("Cookie", authData.cookies)
        .set("x-csrf-token", authData.csrfToken)
        .send({
          latitude: 37.7749,
          longitude: -122.4194,
        })
        .expect(200);

      const newAlertId = triggerResponse.body.alertId;

      const response = await request(app)
        .post(`/api/sos/cancel/${newAlertId}`)
        .set("Cookie", authData.cookies)
        .set("x-csrf-token", authData.csrfToken)
        .send({
          reason: "false_alarm",
        })
        .expect(200);

      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty("alertId", newAlertId);
      expect(response.body).toHaveProperty("status", "cancelled");
      expect(response.body).toHaveProperty(
        "message",
        "Alert cancelled successfully",
      );

      const alert = await SOSAlert.findById(newAlertId);
      expect(alert.status).toBe("cancelled");
      expect(alert.cancellationReason).toBe("false_alarm");
    });

    it("should return 404 for non-existent alert", async () => {
      const response = await request(app)
        .post("/api/sos/cancel/507f1f77bcf86cd799439011")
        .set("Cookie", authData.cookies)
        .set("x-csrf-token", authData.csrfToken)
        .send({
          reason: "false_alarm",
        })
        .expect(404);

      expect(response.body).toHaveProperty("success", false);
      expect(response.body).toHaveProperty("message", "Alert not found");
    });
  });

  describe("GET /api/sos/history", () => {
    it("should get alert history", async () => {
      for (let i = 0; i < 3; i++) {
        await request(app)
          .post("/api/sos/trigger")
          .set("Cookie", authData.cookies)
          .set("x-csrf-token", authData.csrfToken)
          .send({
            latitude: 37.7749 + i * 0.001,
            longitude: -122.4194 + i * 0.001,
          });
      }

      const response = await request(app)
        .get("/api/sos/history")
        .set("Cookie", authData.cookies)
        .set("x-csrf-token", authData.csrfToken)
        .expect(200);

      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty("alerts");
      expect(Array.isArray(response.body.alerts)).toBe(true);
      expect(response.body.alerts.length).toBeGreaterThan(0);
      expect(response.body).toHaveProperty("total");
      expect(response.body).toHaveProperty("offset", 0);
      expect(response.body).toHaveProperty("limit", 20);
    });

    it("should filter history by status", async () => {
      const response = await request(app)
        .get("/api/sos/history?status=sent")
        .set("Cookie", authData.cookies)
        .set("x-csrf-token", authData.csrfToken)
        .expect(200);

      expect(response.body).toHaveProperty("success", true);
      expect(
        response.body.alerts.every((alert) => alert.status === "sent"),
      ).toBe(true);
    });

    it("should paginate history", async () => {
      const response = await request(app)
        .get("/api/sos/history?limit=2&offset=0")
        .set("Cookie", authData.cookies)
        .set("x-csrf-token", authData.csrfToken)
        .expect(200);

      expect(response.body).toHaveProperty("success", true);
      expect(response.body.alerts.length).toBeLessThanOrEqual(2);
      expect(response.body).toHaveProperty("limit", 2);
      expect(response.body).toHaveProperty("offset", 0);
    });
  });

  describe("GET /api/sos/history/:alertId", () => {
    it("should get a specific alert", async () => {
      const triggerResponse = await request(app)
        .post("/api/sos/trigger")
        .set("Cookie", authData.cookies)
        .set("x-csrf-token", authData.csrfToken)
        .send({
          latitude: 37.7749,
          longitude: -122.4194,
        })
        .expect(200);

      const newAlertId = triggerResponse.body.alertId;

      const response = await request(app)
        .get(`/api/sos/history/${newAlertId}`)
        .set("Cookie", authData.cookies)
        .set("x-csrf-token", authData.csrfToken)
        .expect(200);

      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty("alert");
      expect(response.body.alert).toHaveProperty("id", newAlertId);
      expect(response.body.alert).toHaveProperty("status");
      expect(response.body.alert).toHaveProperty("timestamp");
      expect(response.body.alert).toHaveProperty("location");
      expect(response.body.alert).toHaveProperty("contactsNotified");
      expect(response.body.alert).toHaveProperty("canCancel");
      expect(response.body.alert).toHaveProperty("cancellationTimeRemaining");
    });

    it("should return 404 for non-existent alert", async () => {
      const response = await request(app)
        .get("/api/sos/history/507f1f77bcf86cd799439011")
        .set("Cookie", authData.cookies)
        .set("x-csrf-token", authData.csrfToken)
        .expect(404);

      expect(response.body).toHaveProperty("success", false);
      expect(response.body).toHaveProperty("message", "Alert not found");
    });
  });

  describe("GET /api/sos/status/:alertId", () => {
    it("should get alert status", async () => {
      const triggerResponse = await request(app)
        .post("/api/sos/trigger")
        .set("Cookie", authData.cookies)
        .set("x-csrf-token", authData.csrfToken)
        .send({
          latitude: 37.7749,
          longitude: -122.4194,
        })
        .expect(200);

      const newAlertId = triggerResponse.body.alertId;

      const response = await request(app)
        .get(`/api/sos/status/${newAlertId}`)
        .set("Cookie", authData.cookies)
        .set("x-csrf-token", authData.csrfToken)
        .expect(200);

      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty("status", "sent");
      expect(response.body).toHaveProperty("canCancel", true);
      expect(response.body).toHaveProperty("cancellationTimeRemaining");
      expect(response.body).toHaveProperty("createdAt");
      expect(response.body).toHaveProperty("updatedAt");
    });

    it("should return 404 for non-existent alert", async () => {
      const response = await request(app)
        .get("/api/sos/status/507f1f77bcf86cd799439011")
        .set("Cookie", authData.cookies)
        .set("x-csrf-token", authData.csrfToken)
        .expect(404);

      expect(response.body).toHaveProperty("success", false);
      expect(response.body).toHaveProperty("message", "Alert not found");
    });
  });
});
