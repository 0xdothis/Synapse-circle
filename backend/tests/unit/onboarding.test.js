import request from "supertest";
import app from "../../server.js";
import User from "../../src/models/User.js";
import TrustedContact from "../../src/models/TrustedContact.js";
import {
  getAuthToken,
  clearAuthCache,
  clearAuthCacheForUser,
} from "../helpers/authHelper.js";

describe("Onboarding API Tests", () => {
  let authData;
  let userId;

  const testUser = {
    email: "onboardingtest@campus.edu",
    name: "Onboarding Test User",
    password: "TestPassword123",
  };

  beforeAll(async () => {
    authData = await getAuthToken(testUser);
    userId = authData.userId;
  });

  beforeEach(() => {
    clearAuthCache();
    // Clean up contacts before each test to ensure clean state
    TrustedContact.deleteMany({ userId }).catch(() => {});
  });

  afterEach(async () => {
    // Clean up after each test
    await TrustedContact.deleteMany({ userId }).catch(() => {});
  });

  describe("GET /api/auth/onboarding-status", () => {
    it("should return current onboarding status", async () => {
      const response = await request(app)
        .get("/api/auth/onboarding-status")
        .set("Authorization", `Bearer ${authData.accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty("currentStep", "welcome");
      expect(response.body).toHaveProperty("progress", 20);
      expect(response.body).toHaveProperty("isComplete", false);
      expect(response.body).toHaveProperty("canGoForward", true);
      expect(response.body).toHaveProperty("canGoBack", false);
      expect(response.body).toHaveProperty("nextStep", "location");
      expect(response.body).toHaveProperty("previousStep", null);
      expect(response.body).toHaveProperty("steps");
      expect(Array.isArray(response.body.steps)).toBe(true);
      expect(response.body.steps).toHaveLength(5);
      expect(response.body).toHaveProperty("contactsCount", 0);
      expect(response.body).toHaveProperty("maxContacts", 3);
      expect(response.body).toHaveProperty("user");
      expect(response.body.user).toHaveProperty("id", userId);
      expect(response.body.user).toHaveProperty("email", testUser.email);
    });

    it("should require authentication", async () => {
      const response = await request(app)
        .get("/api/auth/onboarding-status")
        .expect(401);

      expect(response.body).toHaveProperty("success", false);
      expect(response.body).toHaveProperty(
        "message",
        "Authentication required. Please log in.",
      );
    });

    it("should handle user not found", async () => {
      const disposableUser = {
        email: "onboarding-status-notfound@campus.edu",
        name: "Disposable Status User",
        password: "TestPassword123",
      };
      const disposableAuth = await getAuthToken(disposableUser);
      const disposableUserId = disposableAuth.userId;

      await User.findByIdAndDelete(disposableUserId);
      clearAuthCacheForUser(disposableUser.email);

      const response = await request(app)
        .get("/api/auth/onboarding-status")
        .set("Authorization", `Bearer ${disposableAuth.accessToken}`)
        .expect(404);

      expect(response.body).toHaveProperty("success", false);
      expect(response.body).toHaveProperty(
        "message",
        "User not found. Please log in again.",
      );
    });
  });

  describe("PATCH /api/auth/onboarding-step", () => {
    it("should update onboarding step to location", async () => {
      const response = await request(app)
        .patch("/api/auth/onboarding-step")
        .set("Authorization", `Bearer ${authData.accessToken}`)
        .send({ step: "location" })
        .expect(200);

      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty(
        "message",
        "Onboarding step updated to: location",
      );
      expect(response.body).toHaveProperty("step", "location");
      expect(response.body).toHaveProperty("isComplete", false);
      expect(response.body).toHaveProperty("progress", 40);
      expect(response.body).toHaveProperty("canGoForward", true);
      expect(response.body).toHaveProperty("canGoBack", true);
      expect(response.body).toHaveProperty("previousStep", "welcome");
      expect(response.body).toHaveProperty("nextStep", "contacts");

      const user = await User.findById(userId);
      expect(user.onboardingStep).toBe("location");
    });

    it("should update onboarding step to university", async () => {
      await request(app)
        .patch("/api/auth/onboarding-step")
        .set("Authorization", `Bearer ${authData.accessToken}`)
        .send({ step: "location" })
        .expect(200);

      await request(app)
        .patch("/api/auth/onboarding-step")
        .set("Authorization", `Bearer ${authData.accessToken}`)
        .send({ step: "contacts" })
        .expect(200);

      const response = await request(app)
        .patch("/api/auth/onboarding-step")
        .set("Authorization", `Bearer ${authData.accessToken}`)
        .send({ step: "university" })
        .expect(200);

      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty("step", "university");
      expect(response.body).toHaveProperty("progress", 80);
      expect(response.body).toHaveProperty("canGoForward", true);
      expect(response.body).toHaveProperty("canGoBack", true);
      expect(response.body).toHaveProperty("previousStep", "contacts");
      expect(response.body).toHaveProperty("nextStep", "complete");
    });

    it("should update onboarding step to contacts", async () => {
      const response = await request(app)
        .patch("/api/auth/onboarding-step")
        .set("Authorization", `Bearer ${authData.accessToken}`)
        .send({ step: "contacts" })
        .expect(200);

      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty("step", "contacts");
      expect(response.body).toHaveProperty("progress", 60);
      expect(response.body).toHaveProperty("canGoForward", true);
      expect(response.body).toHaveProperty("canGoBack", true);
      expect(response.body).toHaveProperty("previousStep", "location");
      expect(response.body).toHaveProperty("nextStep", "university");

      expect(response.body).toHaveProperty("contacts");
      expect(response.body.contacts).toHaveProperty("count", 0);
      expect(response.body.contacts).toHaveProperty("maxContacts", 3);
    });

    it("should allow going backward freely", async () => {
      await request(app)
        .patch("/api/auth/onboarding-step")
        .set("Authorization", `Bearer ${authData.accessToken}`)
        .send({ step: "location" });

      const response = await request(app)
        .patch("/api/auth/onboarding-step")
        .set("Authorization", `Bearer ${authData.accessToken}`)
        .send({ step: "welcome" })
        .expect(200);

      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty("step", "welcome");
      expect(response.body).toHaveProperty("progress", 20);
      expect(response.body).toHaveProperty("canGoForward", true);
      expect(response.body).toHaveProperty("canGoBack", false);
      expect(response.body).toHaveProperty("previousStep", null);
      expect(response.body).toHaveProperty("nextStep", "location");
    });

    it("should prevent jumping forward more than 1 step", async () => {
      await request(app)
        .patch("/api/auth/onboarding-step")
        .set("Authorization", `Bearer ${authData.accessToken}`)
        .send({ step: "welcome" });

      const response = await request(app)
        .patch("/api/auth/onboarding-step")
        .set("Authorization", `Bearer ${authData.accessToken}`)
        .send({ step: "contacts" })
        .expect(400);

      expect(response.body).toHaveProperty("success", false);
      expect(response.body).toHaveProperty(
        "message",
        expect.stringContaining("Please complete steps in order"),
      );
      expect(response.body).toHaveProperty("currentStep", "welcome");
      expect(response.body).toHaveProperty("nextStep", "location");
    });

    it("should prevent completing onboarding without contacts", async () => {
      await request(app)
        .patch("/api/auth/onboarding-step")
        .set("Authorization", `Bearer ${authData.accessToken}`)
        .send({ step: "location" })
        .expect(200);

      await request(app)
        .patch("/api/auth/onboarding-step")
        .set("Authorization", `Bearer ${authData.accessToken}`)
        .send({ step: "contacts" })
        .expect(200);

      await request(app)
        .patch("/api/auth/onboarding-step")
        .set("Authorization", `Bearer ${authData.accessToken}`)
        .send({ step: "university" })
        .expect(200);

      const response = await request(app)
        .patch("/api/auth/onboarding-step")
        .set("Authorization", `Bearer ${authData.accessToken}`)
        .send({ step: "complete" })
        .expect(400);

      expect(response.body).toHaveProperty("success", false);
      expect(response.body).toHaveProperty(
        "message",
        expect.stringContaining("Please add at least one trusted contact"),
      );
      expect(response.body).toHaveProperty("requiredStep", "contacts");
      expect(response.body).toHaveProperty("contactCount", 0);
    });

    it("should allow completing onboarding with contacts", async () => {
      await User.findByIdAndUpdate(userId, { onboardingStep: "welcome" });

      const steps = ["location", "contacts", "university"];
      for (const step of steps) {
        await request(app)
          .patch("/api/auth/onboarding-step")
          .set("Authorization", `Bearer ${authData.accessToken}`)
          .send({ step });
      }

      await TrustedContact.create({
        userId: userId,
        name: "Test Contact",
        email: "testcontact@example.com",
        relationship: "friend",
        isActive: true,
      });

      const response = await request(app)
        .patch("/api/auth/onboarding-step")
        .set("Authorization", `Bearer ${authData.accessToken}`)
        .send({ step: "complete" })
        .expect(200);

      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty("step", "complete");
      expect(response.body).toHaveProperty("isComplete", true);
      expect(response.body).toHaveProperty("progress", 100);
      expect(response.body).toHaveProperty("canGoForward", false);
      expect(response.body).toHaveProperty("canGoBack", true);
      expect(response.body).toHaveProperty("previousStep", "university");
      expect(response.body).toHaveProperty("nextStep", null);

      const user = await User.findById(userId);
      expect(user.isVerified).toBe(true);
      expect(user.lastLogin).toBeTruthy();
      expect(user.onboardingStep).toBe("complete");

      expect(response.body).toHaveProperty("contacts");
      expect(response.body.contacts).toHaveProperty("count", 1);
      expect(response.body.contacts).toHaveProperty("maxContacts", 3);
    });

    /**
     * University data test - fixed to handle response structure
     */
    it("should process university data correctly", async () => {
      await User.findByIdAndUpdate(userId, { onboardingStep: "welcome" });
      await TrustedContact.deleteMany({ userId });

      // Move to location
      const locationRes = await request(app)
        .patch("/api/auth/onboarding-step")
        .set("Authorization", `Bearer ${authData.accessToken}`)
        .send({ step: "location" })
        .expect(200);

      expect(locationRes.body).toHaveProperty("step", "location");

      // Move to contacts WITH a contact
      const contactData = {
        name: "Test University Contact",
        email: "universitytest@example.com",
        relationship: "friend",
      };

      const contactsResponse = await request(app)
        .patch("/api/auth/onboarding-step")
        .set("Authorization", `Bearer ${authData.accessToken}`)
        .send({
          step: "contacts",
          data: {
            contacts: [contactData],
          },
        })
        .expect(200);

      // Verify contact was added
      expect(contactsResponse.body).toHaveProperty("success", true);
      expect(contactsResponse.body).toHaveProperty("step", "contacts");
      expect(contactsResponse.body).toHaveProperty("contactsAdded");
      expect(contactsResponse.body.contactsAdded).toBeGreaterThan(0);

      // Move to university with data
      const universityName = "Test University";
      const universityAcronym = "TU";

      const response = await request(app)
        .patch("/api/auth/onboarding-step")
        .set("Authorization", `Bearer ${authData.accessToken}`)
        .send({
          step: "university",
          data: {
            name: universityName,
            acronym: universityAcronym,
            location: "Test City, Test Country",
          },
        })
        .expect(200);

      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty("step", "university");
      const user = await User.findById(userId);
      expect(user.university.name).toBe(universityName);
      expect(user.university.acronym).toBe(universityAcronym.toUpperCase());
      expect(user.selectedUniversity).toBe(universityName);
    });

    /**
     * Location data test - move to location step first, then send data
     */
    it("should process location data correctly", async () => {
      // Reset to welcome step
      await User.findByIdAndUpdate(userId, { onboardingStep: "welcome" });

      // First move to location step
      await request(app)
        .patch("/api/auth/onboarding-step")
        .set("Authorization", `Bearer ${authData.accessToken}`)
        .send({ step: "location" })
        .expect(200);

      // Now send location data
      const locationData = {
        latitude: 37.7749,
        longitude: -122.4194,
      };

      const response = await request(app)
        .patch("/api/auth/onboarding-step")
        .set("Authorization", `Bearer ${authData.accessToken}`)
        .send({
          step: "location",
          data: {
            location: locationData,
          },
        })
        .expect(200);

      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty("step", "location");

      const user = await User.findById(userId);
      expect(user.preferences).toBeDefined();
      expect(user.preferences.onboardingLocation).toBeDefined();
      expect(user.preferences.onboardingLocation.latitude).toBe(
        locationData.latitude,
      );
      expect(user.preferences.onboardingLocation.longitude).toBe(
        locationData.longitude,
      );
      expect(user.preferences.onboardingLocation.updatedAt).toBeTruthy();
    });

    it("should require authentication", async () => {
      const response = await request(app)
        .patch("/api/auth/onboarding-step")
        .send({ step: "location" })
        .expect(401);

      expect(response.body).toHaveProperty("success", false);
      expect(response.body).toHaveProperty(
        "message",
        "Authentication required. Please log in.",
      );
    });

    it("should validate step input", async () => {
      const response = await request(app)
        .patch("/api/auth/onboarding-step")
        .set("Authorization", `Bearer ${authData.accessToken}`)
        .send({ step: "invalid-step" })
        .expect(400);

      expect(response.body).toHaveProperty("success", false);
      expect(response.body).toHaveProperty(
        "message",
        expect.stringContaining("Invalid onboarding step"),
      );
    });

    it("should handle user not found", async () => {
      const disposableUser = {
        email: "onboarding-step-notfound@campus.edu",
        name: "Disposable Step User",
        password: "TestPassword123",
      };
      const disposableAuth = await getAuthToken(disposableUser);
      const disposableUserId = disposableAuth.userId;

      await User.findByIdAndDelete(disposableUserId);
      clearAuthCacheForUser(disposableUser.email);

      const response = await request(app)
        .patch("/api/auth/onboarding-step")
        .set("Authorization", `Bearer ${disposableAuth.accessToken}`)
        .send({ step: "location" })
        .expect(404);

      expect(response.body).toHaveProperty("success", false);
      expect(response.body).toHaveProperty(
        "message",
        "User not found. Please log in again.",
      );
    });

    it("should return contact count when on contacts step", async () => {
      await User.findByIdAndUpdate(userId, { onboardingStep: "welcome" });
      await TrustedContact.deleteMany({ userId });

      await request(app)
        .patch("/api/auth/onboarding-step")
        .set("Authorization", `Bearer ${authData.accessToken}`)
        .send({ step: "location" })
        .expect(200);

      await TrustedContact.create({
        userId: userId,
        name: "Another Contact",
        email: "another@example.com",
        relationship: "sibling",
        isActive: true,
      });

      const response = await request(app)
        .patch("/api/auth/onboarding-step")
        .set("Authorization", `Bearer ${authData.accessToken}`)
        .send({ step: "contacts" })
        .expect(200);

      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty("step", "contacts");
      expect(response.body).toHaveProperty("contacts");
      expect(response.body.contacts).toHaveProperty("count", 1);
      expect(response.body.contacts).toHaveProperty("maxContacts", 3);

      await request(app)
        .patch("/api/auth/onboarding-step")
        .set("Authorization", `Bearer ${authData.accessToken}`)
        .send({ step: "university" })
        .expect(200);
    });

    /**
     * FIXED: Invalid data type test - data.isObject() runs first
     */
    it("should handle data validation for invalid data type", async () => {
      // Reset to welcome step
      await User.findByIdAndUpdate(userId, { onboardingStep: "welcome" });

      // Move to contacts step first
      await request(app)
        .patch("/api/auth/onboarding-step")
        .set("Authorization", `Bearer ${authData.accessToken}`)
        .send({ step: "location" })
        .expect(200);

      await request(app)
        .patch("/api/auth/onboarding-step")
        .set("Authorization", `Bearer ${authData.accessToken}`)
        .send({ step: "contacts" })
        .expect(200);

      // Now try to move to university with a string as data
      const response = await request(app)
        .patch("/api/auth/onboarding-step")
        .set("Authorization", `Bearer ${authData.accessToken}`)
        .send({
          step: "university",
          data: "invalid-data-type",
        })
        .expect(400);

      expect(response.body).toHaveProperty("success", false);
      // The data.isObject() validator runs first
      expect(response.body).toHaveProperty(
        "message",
        expect.stringContaining("Data must be an object"),
      );
    });
  });

  describe("Onboarding Step Statuses", () => {
    it("should show correct step statuses after moving forward", async () => {
      await User.findByIdAndUpdate(userId, { onboardingStep: "welcome" });

      await request(app)
        .patch("/api/auth/onboarding-step")
        .set("Authorization", `Bearer ${authData.accessToken}`)
        .send({ step: "location" });

      const response = await request(app)
        .get("/api/auth/onboarding-status")
        .set("Authorization", `Bearer ${authData.accessToken}`)
        .expect(200);

      const steps = response.body.steps;

      expect(steps[0].step).toBe("welcome");
      expect(steps[0].isCompleted).toBe(true);
      expect(steps[0].isActive).toBe(false);

      expect(steps[1].step).toBe("location");
      expect(steps[1].isCompleted).toBe(false);
      expect(steps[1].isActive).toBe(true);

      expect(steps[2].isCompleted).toBe(false);
      expect(steps[2].isActive).toBe(false);
      expect(steps[3].isCompleted).toBe(false);
      expect(steps[3].isActive).toBe(false);
      expect(steps[4].isCompleted).toBe(false);
      expect(steps[4].isActive).toBe(false);
    });

    it("should show all steps as completed when onboarding is complete", async () => {
      await request(app)
        .patch("/api/auth/onboarding-step")
        .set("Authorization", `Bearer ${authData.accessToken}`)
        .send({ step: "location" });

      await request(app)
        .patch("/api/auth/onboarding-step")
        .set("Authorization", `Bearer ${authData.accessToken}`)
        .send({ step: "contacts" });

      await request(app)
        .patch("/api/auth/onboarding-step")
        .set("Authorization", `Bearer ${authData.accessToken}`)
        .send({ step: "university" });

      await TrustedContact.create({
        userId: userId,
        name: "Final Contact",
        email: "final@example.com",
        relationship: "parent",
        isActive: true,
      });

      await request(app)
        .patch("/api/auth/onboarding-step")
        .set("Authorization", `Bearer ${authData.accessToken}`)
        .send({ step: "complete" });

      const response = await request(app)
        .get("/api/auth/onboarding-status")
        .set("Authorization", `Bearer ${authData.accessToken}`)
        .expect(200);

      expect(response.body.isComplete).toBe(true);
      expect(response.body.progress).toBe(100);

      const steps = response.body.steps;
      steps.forEach((step) => {
        expect(step.isCompleted).toBe(true);
        expect(step.isActive).toBe(false);
        expect(step.isLocked).toBe(false);
      });
    });
  });
});
