import request from "supertest";
import app from "../../server.js";
import User from "../../src/models/User.js";
import TrustedContact from "../../src/models/TrustedContact.js";
import { getAuthToken } from "../helpers/authHelper.js";

describe("Onboarding Integration Tests", () => {
  let authData;
  let userId;

  const testUser = {
    email: "integration-onboarding@campus.edu",
    name: "Integration Onboarding User",
    password: "TestPassword123",
  };

  beforeAll(async () => {
    authData = await getAuthToken(testUser);
    userId = authData.userId;
  });

  describe("Complete Onboarding Flow", () => {
    it("should start at welcome step", async () => {
      const res = await request(app)
        .get("/api/auth/onboarding-status")
        .set("Cookie", authData.cookies)
        .set("x-csrf-token", authData.csrfToken)
        .expect(200);

      expect(res.body).toHaveProperty("success", true);
      expect(res.body).toHaveProperty("currentStep", "welcome");
      expect(res.body).toHaveProperty("progress", 20);
      expect(res.body).toHaveProperty("isComplete", false);
      expect(res.body).toHaveProperty("canGoForward", true);
      expect(res.body).toHaveProperty("canGoBack", false);
      expect(res.body).toHaveProperty("nextStep", "location");
    });

    it("should update to location step", async () => {
      const res = await request(app)
        .patch("/api/auth/onboarding-step")
        .set("Cookie", authData.cookies)
        .set("x-csrf-token", authData.csrfToken)
        .send({
          step: "location",
          data: {
            location: {
              latitude: 37.7749,
              longitude: -122.4194,
            },
          },
        })
        .expect(200);

      expect(res.body).toHaveProperty("success", true);
      expect(res.body).toHaveProperty("step", "location");
      expect(res.body).toHaveProperty("progress", 40);

      // Verify location was saved
      const user = await User.findById(userId);
      expect(user.preferences.onboardingLocation).toBeDefined();
      expect(user.preferences.onboardingLocation.latitude).toBe(37.7749);
      expect(user.preferences.onboardingLocation.longitude).toBe(-122.4194);
    });

    it("should update to contacts step", async () => {
      const res = await request(app)
        .patch("/api/auth/onboarding-step")
        .set("Cookie", authData.cookies)
        .set("x-csrf-token", authData.csrfToken)
        .send({
          step: "contacts",
          data: {
            contacts: [
              {
                name: "Test Contact",
                email: "onboardingcontact@example.com",
                relationship: "friend",
              },
            ],
          },
        })
        .expect(200);

      expect(res.body).toHaveProperty("success", true);
      expect(res.body).toHaveProperty("step", "contacts");
      expect(res.body).toHaveProperty("progress", 60);
      expect(res.body.contacts).toHaveProperty("count", 1);

      const contact = await TrustedContact.findOne({ userId, isActive: true });
      expect(contact).toBeTruthy();
      expect(contact.name).toBe("Test Contact");
    });

    it("should update to university step", async () => {
      const res = await request(app)
        .patch("/api/auth/onboarding-step")
        .set("Cookie", authData.cookies)
        .set("x-csrf-token", authData.csrfToken)
        .send({
          step: "university",
          data: {
            selectedUniversity: "Test University",
          },
        })
        .expect(200);

      expect(res.body).toHaveProperty("success", true);
      expect(res.body).toHaveProperty("step", "university");
      expect(res.body).toHaveProperty("progress", 80);

      const user = await User.findById(userId);
      expect(user.selectedUniversity).toBe("Test University");
    });

    it("should complete onboarding", async () => {
      const res = await request(app)
        .patch("/api/auth/onboarding-step")
        .set("Cookie", authData.cookies)
        .set("x-csrf-token", authData.csrfToken)
        .send({ step: "complete" })
        .expect(200);

      expect(res.body).toHaveProperty("success", true);
      expect(res.body).toHaveProperty("step", "complete");
      expect(res.body).toHaveProperty("isComplete", true);
      expect(res.body).toHaveProperty("progress", 100);
      expect(res.body).toHaveProperty("canGoForward", false);
      expect(res.body).toHaveProperty("canGoBack", true);

      const user = await User.findById(userId);
      expect(user.isVerified).toBe(true);
      expect(user.onboardingStep).toBe("complete");
    });
  });

  describe("Onboarding Navigation", () => {
    let testUser2;
    let authData2;

    beforeAll(async () => {
      testUser2 = {
        email: "onboarding-nav@campus.edu",
        name: "Nav Test User",
        password: "TestPassword123",
      };
      authData2 = await getAuthToken(testUser2);
    });

    it("should allow going backward freely", async () => {
      // Move forward first
      await request(app)
        .patch("/api/auth/onboarding-step")
        .set("Cookie", authData2.cookies)
        .set("x-csrf-token", authData2.csrfToken)
        .send({ step: "location" })
        .expect(200);

      // Go back
      const res = await request(app)
        .patch("/api/auth/onboarding-step")
        .set("Cookie", authData2.cookies)
        .set("x-csrf-token", authData2.csrfToken)
        .send({ step: "welcome" })
        .expect(200);

      expect(res.body).toHaveProperty("success", true);
      expect(res.body).toHaveProperty("step", "welcome");
      expect(res.body).toHaveProperty("progress", 20);
    });

    it("should prevent jumping forward more than 1 step", async () => {
      await request(app)
        .patch("/api/auth/onboarding-step")
        .set("Cookie", authData2.cookies)
        .set("x-csrf-token", authData2.csrfToken)
        .send({ step: "welcome" })
        .expect(200);

      const res = await request(app)
        .patch("/api/auth/onboarding-step")
        .set("Cookie", authData2.cookies)
        .set("x-csrf-token", authData2.csrfToken)
        .send({ step: "contacts" })
        .expect(400);

      expect(res.body).toHaveProperty("success", false);
      expect(res.body.message).toContain("Please complete steps in order");
    });

    it("should prevent completing without contacts", async () => {
      const tempUser = {
        email: "no-contacts@campus.edu",
        name: "No Contacts User",
        password: "TestPassword123",
      };
      const tempAuth = await getAuthToken(tempUser);

      await request(app)
        .patch("/api/auth/onboarding-step")
        .set("Cookie", tempAuth.cookies)
        .set("x-csrf-token", tempAuth.csrfToken)
        .send({ step: "location" })
        .expect(200);

      await request(app)
        .patch("/api/auth/onboarding-step")
        .set("Cookie", tempAuth.cookies)
        .set("x-csrf-token", tempAuth.csrfToken)
        .send({ step: "contacts" })
        .expect(200);

      await request(app)
        .patch("/api/auth/onboarding-step")
        .set("Cookie", tempAuth.cookies)
        .set("x-csrf-token", tempAuth.csrfToken)
        .send({ step: "university" })
        .expect(200);

      const res = await request(app)
        .patch("/api/auth/onboarding-step")
        .set("Cookie", tempAuth.cookies)
        .set("x-csrf-token", tempAuth.csrfToken)
        .send({ step: "complete" })
        .expect(400);

      expect(res.body).toHaveProperty("success", false);
      expect(res.body.message).toContain(
        "Please add at least one trusted contact",
      );
    });
  });

  describe("Onboarding Status", () => {
    it("should show correct step statuses", async () => {
      const res = await request(app)
        .get("/api/auth/onboarding-status")
        .set("Cookie", authData.cookies)
        .set("x-csrf-token", authData.csrfToken)
        .expect(200);

      expect(res.body).toHaveProperty("success", true);
      expect(res.body).toHaveProperty("isComplete", true);
      expect(res.body).toHaveProperty("progress", 100);

      const steps = res.body.steps;
      steps.forEach((step) => {
        expect(step.isCompleted).toBe(true);
        expect(step.isActive).toBe(false);
      });
    });

    it("should show contacts count", async () => {
      const res = await request(app)
        .get("/api/auth/onboarding-status")
        .set("Cookie", authData.cookies)
        .set("x-csrf-token", authData.csrfToken)
        .expect(200);

      expect(res.body).toHaveProperty("contactsCount");
      expect(res.body).toHaveProperty("maxContacts", 3);
    });
  });
});
