import request from "supertest";
import app from "../../server.js";
import User from "../../src/models/User.js";
import CampusSecurity from "../../src/models/CampusSecurity.js";
import { getAuthToken, clearAuthCache } from "../helpers/authHelper.js";

describe("University API Integration Tests", () => {
  let authData;
  let userId;

  const testUser = {
    email: "integration-university@campus.edu",
    name: "Integration University User",
    password: "TestPassword123",
  };

  const testUniversity = {
    name: "Integration Test University",
    acronym: "ITU",
    location: "Integration City, Integration Country",
  };

  beforeAll(async () => {
    authData = await getAuthToken(testUser);
    userId = authData.userId;
  });

  beforeEach(() => {
    clearAuthCache();
  });

  describe("Complete University Management Flow", () => {
    it("should save university during onboarding", async () => {
      const response = await request(app)
        .post("/api/university")
        .set("Authorization", `Bearer ${authData.accessToken}`)
        .send(testUniversity)
        .expect(200);

      expect(response.body).toHaveProperty("success", true);
      expect(response.body.data.university).toHaveProperty(
        "name",
        testUniversity.name,
      );
      expect(response.body.data.university).toHaveProperty(
        "acronym",
        testUniversity.acronym.toUpperCase(),
      );

      const user = await User.findById(userId);
      expect(user.university.name).toBe(testUniversity.name);
      expect(user.university.acronym).toBe(
        testUniversity.acronym.toUpperCase(),
      );
      expect(user.selectedUniversity).toBe(testUniversity.name);
    });

    it("should retrieve the saved university", async () => {
      const response = await request(app)
        .get("/api/university")
        .set("Authorization", `Bearer ${authData.accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty("success", true);
      expect(response.body.data.university).toHaveProperty(
        "name",
        testUniversity.name,
      );
      expect(response.body.data.university).toHaveProperty(
        "acronym",
        testUniversity.acronym.toUpperCase(),
      );
      expect(response.body.data.university).toHaveProperty(
        "location",
        testUniversity.location,
      );
    });

    it("should update the university", async () => {
      const updateData = {
        name: "Updated Integration University",
        acronym: "UIU",
        location: "Updated City, Updated Country",
      };

      const response = await request(app)
        .put("/api/university")
        .set("Authorization", `Bearer ${authData.accessToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty("success", true);
      expect(response.body.data.university).toHaveProperty(
        "name",
        updateData.name,
      );
      expect(response.body.data.university).toHaveProperty(
        "acronym",
        updateData.acronym.toUpperCase(),
      );
      expect(response.body.data.university).toHaveProperty(
        "location",
        updateData.location,
      );

      const user = await User.findById(userId);
      expect(user.university.name).toBe(updateData.name);
      expect(user.university.acronym).toBe(updateData.acronym.toUpperCase());
      expect(user.university.location).toBe(updateData.location);
      expect(user.selectedUniversity).toBe(updateData.name);
    });

    it("should get security contacts for the university", async () => {
      await CampusSecurity.deleteMany({ universityAcronym: "UIU" });

      await CampusSecurity.create({
        name: "Integration Security",
        phoneNumber: "+1234567899",
        email: "security@integration.edu",
        location: "Security Office",
        universityAcronym: "UIU",
        isActive: true,
      });

      const response = await request(app)
        .get("/api/university/security")
        .set("Authorization", `Bearer ${authData.accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty("success", true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0]).toHaveProperty("universityAcronym", "UIU");
      expect(response.body).toHaveProperty("university");
    });

    it("should remove the university", async () => {
      const response = await request(app)
        .delete("/api/university")
        .set("Authorization", `Bearer ${authData.accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty("success", true);
      expect(response.body.data).toHaveProperty("university", null);

      const user = await User.findById(userId);
      expect(user.university).toBeNull();
      expect(user.selectedUniversity).toBeNull();
    });

    it("should return null when retrieving removed university", async () => {
      const response = await request(app)
        .get("/api/university")
        .set("Authorization", `Bearer ${authData.accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty("success", true);
      expect(response.body.data).toHaveProperty("university", null);
    });

    it("should return 409 when trying to save after already having a university", async () => {
      await request(app)
        .post("/api/university")
        .set("Authorization", `Bearer ${authData.accessToken}`)
        .send({
          name: "Another University",
          acronym: "AU",
          location: "Another City",
        })
        .expect(200);

      const response = await request(app)
        .post("/api/university")
        .set("Authorization", `Bearer ${authData.accessToken}`)
        .send({
          name: "Third University",
          acronym: "TU",
          location: "Third City",
        })
        .expect(409);

      expect(response.body).toHaveProperty("success", false);
      expect(response.body).toHaveProperty(
        "message",
        "University already set for this user. Use PUT to update.",
      );
    });
  });

  describe("University List Integration", () => {
    it("should get all unique universities from all users", async () => {
      const universities = [
        { name: "Harvard University", acronym: "HU" },
        { name: "Stanford University", acronym: "SU" },
        { name: "MIT", acronym: "MIT" },
        { name: "Oxford University", acronym: "OU" },
      ];

      for (const uni of universities) {
        const user = {
          email: `uni-list-${uni.acronym.toLowerCase()}-${Date.now()}@campus.edu`,
          name: `User ${uni.acronym}`,
          password: "TestPassword123",
        };
        const auth = await getAuthToken(user);
        await request(app)
          .post("/api/university")
          .set("Authorization", `Bearer ${auth.accessToken}`)
          .send(uni)
          .expect(200);
      }

      const response = await request(app)
        .get("/api/university/list")
        .set("Authorization", `Bearer ${authData.accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty("success", true);
      expect(response.body.count).toBeGreaterThanOrEqual(4);
      expect(response.body.data).toBeInstanceOf(Array);

      const names = response.body.data.map((uni) => uni.name);
      expect(names).toContain("Harvard University");
      expect(names).toContain("Stanford University");
      expect(names).toContain("MIT");
      expect(names).toContain("Oxford University");

      const acronyms = response.body.data.map((uni) => uni.acronym);
      const uniqueAcronyms = new Set(acronyms);
      expect(uniqueAcronyms.size).toBe(acronyms.length);
    });
  });

  describe("Authentication and Authorization", () => {
    it("should require authentication for all endpoints", async () => {
      const endpoints = [
        { method: "post", url: "/api/university" },
        { method: "get", url: "/api/university" },
        { method: "put", url: "/api/university" },
        { method: "delete", url: "/api/university" },
        { method: "get", url: "/api/university/security" },
        { method: "get", url: "/api/university/list" },
        { method: "get", url: "/api/university/search" },
      ];

      for (const endpoint of endpoints) {
        const response = await request(app)
          [endpoint.method](endpoint.url)
          .send(testUniversity);
        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty("success", false);
        expect(response.body).toHaveProperty(
          "message",
          "Authentication required. Please log in.",
        );
      }
    });
  });

  describe("Error Handling", () => {
    it("should handle validation errors gracefully", async () => {
      const response = await request(app)
        .post("/api/university")
        .set("Authorization", `Bearer ${authData.accessToken}`)
        .send({
          name: "A".repeat(1000),
          acronym: "",
        })
        .expect(400);

      expect(response.body).toHaveProperty("success", false);
      expect(response.body).toHaveProperty("message");
    });

    it("should handle invalid acronym format", async () => {
      const response = await request(app)
        .post("/api/university")
        .set("Authorization", `Bearer ${authData.accessToken}`)
        .send({
          name: "Test University",
          acronym: "T@U$",
          location: "Test City",
        })
        .expect(400);

      expect(response.body).toHaveProperty("success", false);
      expect(response.body).toHaveProperty(
        "message",
        expect.stringContaining("Acronym can only contain letters and numbers"),
      );
    });
  });

  describe("Search Functionality", () => {
    beforeAll(async () => {
      const searchUnis = [
        { name: "Yale University", acronym: "YU" },
        { name: "Princeton University", acronym: "PU" },
        { name: "Columbia University", acronym: "CU" },
      ];

      for (const uni of searchUnis) {
        const user = {
          email: `search-${uni.acronym.toLowerCase()}-${Date.now()}@campus.edu`,
          name: `User ${uni.acronym}`,
          password: "TestPassword123",
        };
        const auth = await getAuthToken(user);
        await request(app)
          .post("/api/university")
          .set("Authorization", `Bearer ${auth.accessToken}`)
          .send(uni)
          .expect(200);
      }
    });

    it("should search and return matching universities", async () => {
      const response = await request(app)
        .get("/api/university/search?q=Yale")
        .set("Authorization", `Bearer ${authData.accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty("success", true);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data.some((uni) => uni.name.includes("Yale"))).toBe(
        true,
      );
    });

    it("should search by partial name", async () => {
      const response = await request(app)
        .get("/api/university/search?q=university")
        .set("Authorization", `Bearer ${authData.accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty("success", true);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(
        response.body.data.every((uni) =>
          uni.name.toLowerCase().includes("university"),
        ),
      ).toBe(true);
    });

    it("should return empty results for non-matching search", async () => {
      const response = await request(app)
        .get("/api/university/search?q=NonExistent")
        .set("Authorization", `Bearer ${authData.accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty("success", true);
      expect(response.body.count).toBe(0);
      expect(response.body.data).toEqual([]);
    });
  });

  describe("Get University By Acronym", () => {
    let testAcronym;

    beforeAll(async () => {
      const uni = { name: "Acronym Test University", acronym: "ATU" };
      testAcronym = "ATU";

      const user = {
        email: `atu-user-${Date.now()}@campus.edu`,
        name: "ATU User",
        password: "TestPassword123",
      };
      const auth = await getAuthToken(user);
      await request(app)
        .post("/api/university")
        .set("Authorization", `Bearer ${auth.accessToken}`)
        .send(uni)
        .expect(200);
    });

    it("should get university details by acronym", async () => {
      const response = await request(app)
        .get(`/api/university/${testAcronym}`)
        .set("Authorization", `Bearer ${authData.accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty("success", true);
      expect(response.body.data).toHaveProperty("acronym", testAcronym);
      expect(response.body.data).toHaveProperty(
        "name",
        "Acronym Test University",
      );
      expect(response.body.data).toHaveProperty("totalUsers", 1);
      expect(response.body.data.users).toBeInstanceOf(Array);
    });

    it("should handle case-insensitive acronym", async () => {
      const response = await request(app)
        .get(`/api/university/${testAcronym.toLowerCase()}`)
        .set("Authorization", `Bearer ${authData.accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty("success", true);
      expect(response.body.data).toHaveProperty("acronym", testAcronym);
    });

    it("should return 404 for non-existent acronym", async () => {
      const response = await request(app)
        .get("/api/university/NONEXISTENT")
        .set("Authorization", `Bearer ${authData.accessToken}`)
        .expect(404);

      expect(response.body).toHaveProperty("success", false);
      expect(response.body).toHaveProperty(
        "message",
        'University with acronym "NONEXISTENT" not found',
      );
    });
  });
});
