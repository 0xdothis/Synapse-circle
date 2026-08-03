import request from "supertest";
import app from "../../server.js";
import User from "../../src/models/User.js";
import { getAuthToken } from "../helpers/authHelper.js";
import EmergencyDirectory from "../../src/models/EmergencyDirectory.js";

describe("Emergency Directory Integration Tests", () => {
  let authData;

  const testUser = {
    email: "integration-emergency@campus.edu",
    name: "Integration Emergency User",
    password: "TestPassword123",
  };

  beforeAll(async () => {
    authData = await getAuthToken(testUser);

    // Seed emergency directory
    await EmergencyDirectory.deleteMany({});
    await EmergencyDirectory.create([
      {
        type: "security",
        name: "Campus Security",
        phoneNumber: "+1234567890",
        email: "security@campus.edu",
        address: "Security Office, Main Campus",
        isVerified: true,
        isActive: true,
        location: {
          type: "Point",
          coordinates: [-122.4194, 37.7749],
        },
      },
      {
        type: "hospital",
        name: "University Health Center",
        phoneNumber: "+1234567891",
        email: "health@campus.edu",
        address: "Health Center, Main Campus",
        isVerified: true,
        isActive: true,
        location: {
          type: "Point",
          coordinates: [-122.4194, 37.7755],
        },
      },
      {
        type: "police",
        name: "City Police Department",
        phoneNumber: "+1234567892",
        email: "police@city.gov",
        address: "Police Station, Downtown",
        isVerified: true,
        isActive: true,
        location: {
          type: "Point",
          coordinates: [-122.42, 37.775],
        },
      },
    ]);
  });

  describe("Get Emergency Directory", () => {
    it("should get all emergency contacts", async () => {
      const res = await request(app)
        .get("/api/emergency/directory")
        .set("Cookie", authData.cookies)
        .set("x-csrf-token", authData.csrfToken)
        .expect(200);

      expect(res.body).toHaveProperty("success", true);
      expect(res.body).toHaveProperty("total");
      expect(res.body.contacts).toBeInstanceOf(Array);
      expect(res.body.contacts.length).toBeGreaterThan(0);
      expect(res.body).toHaveProperty("grouped");
      expect(res.body.grouped).toHaveProperty("security");
      expect(res.body.grouped).toHaveProperty("hospital");
      expect(res.body.grouped).toHaveProperty("police");
    });

    it("should filter by type", async () => {
      const res = await request(app)
        .get("/api/emergency/directory?type=hospital")
        .set("Cookie", authData.cookies)
        .set("x-csrf-token", authData.csrfToken)
        .expect(200);

      expect(res.body).toHaveProperty("success", true);
      expect(res.body.contacts.every((c) => c.type === "hospital")).toBe(true);
    });

    it("should search by name", async () => {
      const res = await request(app)
        .get("/api/emergency/directory?search=Health")
        .set("Cookie", authData.cookies)
        .set("x-csrf-token", authData.csrfToken)
        .expect(200);

      expect(res.body).toHaveProperty("success", true);
      expect(
        res.body.contacts.some((c) => c.name.toLowerCase().includes("health")),
      ).toBe(true);
    });

    it("should search by address", async () => {
      const res = await request(app)
        .get("/api/emergency/directory?search=Downtown")
        .set("Cookie", authData.cookies)
        .set("x-csrf-token", authData.csrfToken)
        .expect(200);

      expect(res.body).toHaveProperty("success", true);
      expect(
        res.body.contacts.some((c) =>
          c.address.toLowerCase().includes("downtown"),
        ),
      ).toBe(true);
    });
  });

  describe("Get Specific Emergency Contact", () => {
    let contactId;

    beforeAll(async () => {
      const contact = await EmergencyDirectory.findOne({ type: "security" });
      contactId = contact._id.toString();
    });

    it("should get a specific emergency contact", async () => {
      const res = await request(app)
        .get(`/api/emergency/directory/${contactId}`)
        .set("Cookie", authData.cookies)
        .set("x-csrf-token", authData.csrfToken)
        .expect(200);

      expect(res.body).toHaveProperty("success", true);
      expect(res.body.contact).toHaveProperty("_id", contactId);
      expect(res.body.contact).toHaveProperty("type", "security");
    });

    it("should return 404 for non-existent contact", async () => {
      const res = await request(app)
        .get("/api/emergency/directory/507f1f77bcf86cd799439011")
        .set("Cookie", authData.cookies)
        .set("x-csrf-token", authData.csrfToken)
        .expect(404);

      expect(res.body).toHaveProperty("success", false);
      expect(res.body).toHaveProperty("message", "Emergency contact not found");
    });
  });

  describe("Nearby Emergency Contacts", () => {
    it("should require latitude and longitude", async () => {
      const res = await request(app)
        .get("/api/emergency/nearby")
        .set("Cookie", authData.cookies)
        .set("x-csrf-token", authData.csrfToken)
        .expect(400);

      expect(res.body).toHaveProperty("success", false);
      expect(res.body).toHaveProperty(
        "message",
        "Latitude and longitude are required",
      );
    });

    it("should get nearby contacts", async () => {
      const res = await request(app)
        .get(
          "/api/emergency/nearby?latitude=37.7749&longitude=-122.4194&radius=1000",
        )
        .set("Cookie", authData.cookies)
        .set("x-csrf-token", authData.csrfToken)
        .expect(200);

      expect(res.body).toHaveProperty("success", true);
      expect(res.body).toHaveProperty("total");
      expect(res.body.contacts).toBeInstanceOf(Array);

      if (res.body.contacts.length > 0) {
        expect(res.body.contacts[0]).toHaveProperty("distance");
      }
    });

    it("should filter nearby contacts by type", async () => {
      const res = await request(app)
        .get(
          "/api/emergency/nearby?latitude=37.7749&longitude=-122.4194&type=hospital",
        )
        .set("Cookie", authData.cookies)
        .set("x-csrf-token", authData.csrfToken)
        .expect(200);

      expect(res.body).toHaveProperty("success", true);
      expect(res.body.contacts.every((c) => c.type === "hospital")).toBe(true);
    });
  });

  describe("Authentication", () => {
    it("should require authentication for emergency directory", async () => {
      const res = await request(app)
        .get("/api/emergency/directory")
        .expect(401);

      expect(res.body).toHaveProperty("success", false);
      expect(res.body).toHaveProperty(
        "message",
        "Authentication required. Please log in.",
      );
    });

    it("should require authentication for nearby contacts", async () => {
      const res = await request(app)
        .get("/api/emergency/nearby?latitude=37.7749&longitude=-122.4194")
        .expect(401);

      expect(res.body).toHaveProperty("success", false);
      expect(res.body).toHaveProperty(
        "message",
        "Authentication required. Please log in.",
      );
    });
  });
});
