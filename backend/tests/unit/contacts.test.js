import request from "supertest";
import app from "../../server.js";
import User from "../../src/models/User.js";
import TrustedContact from "../../src/models/TrustedContact.js";
import { getAuthToken } from "../helpers/authHelper.js";

describe("Contacts API Tests", () => {
  let authData;
  let userId;
  let contactId;

  const testUser = {
    email: "contacttest@campus.edu",
    name: "Contact Test User",
    password: "TestPassword123",
  };

  const testContact = {
    name: "Jane Smith",
    email: "jane@example.com",
    relationship: "friend",
    phoneNumber: "+1234567890",
  };

  beforeAll(async () => {
    authData = await getAuthToken(testUser);
    userId = authData.userId;
  });

  // Clean up contacts before each test to ensure clean state
  beforeEach(async () => {
    await TrustedContact.deleteMany({ userId });
  });

  describe("POST /api/contacts", () => {
    it("should create a new trusted contact with phone number", async () => {
      const response = await request(app)
        .post("/api/contacts")
        .set("Authorization", `Bearer ${authData.accessToken}`)
        .send(testContact)
        .expect(201);

      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty(
        "message",
        "Contact added successfully",
      );
      expect(response.body).toHaveProperty("contact");
      expect(response.body.contact).toHaveProperty("name", testContact.name);
      expect(response.body.contact).toHaveProperty("email", testContact.email);
      expect(response.body.contact).toHaveProperty(
        "relationship",
        testContact.relationship,
      );
      expect(response.body.contact).toHaveProperty(
        "phoneNumber",
        testContact.phoneNumber,
      );
      expect(response.body.contact).toHaveProperty("isPrimary", true);
      expect(response.body.contact).toHaveProperty("isActive", true);

      contactId = response.body.contact.id;
    });

    it("should create a contact without phone number (optional)", async () => {
      const contactWithoutPhone = {
        name: "No Phone Contact",
        email: "nophone@example.com",
        relationship: "sibling",
      };

      const response = await request(app)
        .post("/api/contacts")
        .set("Authorization", `Bearer ${authData.accessToken}`)
        .send(contactWithoutPhone)
        .expect(201);

      expect(response.body).toHaveProperty("success", true);
      expect(response.body.contact).toHaveProperty("phoneNumber", null);
    });

    it("should validate phone number format", async () => {
      const invalidPhoneContact = {
        name: "Invalid Phone",
        email: "invalidphone@example.com",
        relationship: "friend",
        phoneNumber: "invalid-phone-number",
      };

      const response = await request(app)
        .post("/api/contacts")
        .set("Authorization", `Bearer ${authData.accessToken}`)
        .send(invalidPhoneContact)
        .expect(400);

      expect(response.body).toHaveProperty("success", false);
      expect(response.body).toHaveProperty(
        "message",
        expect.stringContaining("Please enter a valid phone number"),
      );
    });

    it("should return error for duplicate contact", async () => {
      // Create first contact
      await request(app)
        .post("/api/contacts")
        .set("Authorization", `Bearer ${authData.accessToken}`)
        .send(testContact)
        .expect(201);

      // Try to create duplicate
      const response = await request(app)
        .post("/api/contacts")
        .set("Authorization", `Bearer ${authData.accessToken}`)
        .send(testContact)
        .expect(409);

      expect(response.body).toHaveProperty("success", false);
      expect(response.body).toHaveProperty("message", "Contact already exists");
    });

    it("should create second contact with isPrimary false", async () => {
      // Create first contact
      await request(app)
        .post("/api/contacts")
        .set("Authorization", `Bearer ${authData.accessToken}`)
        .send({
          name: "First Contact",
          email: "first@example.com",
          relationship: "friend",
        })
        .expect(201);

      // Create second contact
      const secondContact = {
        name: "John Doe",
        email: "john@example.com",
        relationship: "roommate",
        phoneNumber: "+9876543210",
      };

      const response = await request(app)
        .post("/api/contacts")
        .set("Authorization", `Bearer ${authData.accessToken}`)
        .send(secondContact)
        .expect(201);

      expect(response.body).toHaveProperty("success", true);
      expect(response.body.contact).toHaveProperty("isPrimary", false);
      expect(response.body.contact).toHaveProperty(
        "phoneNumber",
        secondContact.phoneNumber,
      );
    });

    it("should return error when max contacts reached", async () => {
      // Add first contact
      await request(app)
        .post("/api/contacts")
        .set("Authorization", `Bearer ${authData.accessToken}`)
        .send({
          name: "Contact 1",
          email: "contact1@example.com",
          relationship: "friend",
        })
        .expect(201);

      // Add second contact
      await request(app)
        .post("/api/contacts")
        .set("Authorization", `Bearer ${authData.accessToken}`)
        .send({
          name: "Contact 2",
          email: "contact2@example.com",
          relationship: "sibling",
        })
        .expect(201);

      // Add third contact (max is 3)
      await request(app)
        .post("/api/contacts")
        .set("Authorization", `Bearer ${authData.accessToken}`)
        .send({
          name: "Contact 3",
          email: "contact3@example.com",
          relationship: "parent",
          phoneNumber: "+1122334455",
        })
        .expect(201);

      // Try to add fourth contact (should fail)
      const response = await request(app)
        .post("/api/contacts")
        .set("Authorization", `Bearer ${authData.accessToken}`)
        .send({
          name: "Contact 4",
          email: "contact4@example.com",
          relationship: "partner",
          phoneNumber: "+9988776655",
        })
        .expect(400);

      expect(response.body).toHaveProperty("success", false);
      expect(response.body).toHaveProperty(
        "message",
        expect.stringContaining("You can only have up to"),
      );
    });

    it("should return 401 without token", async () => {
      const response = await request(app)
        .post("/api/contacts")
        .send(testContact)
        .expect(401);

      expect(response.body).toHaveProperty("success", false);
      expect(response.body).toHaveProperty(
        "message",
        "Authentication required. Please log in.",
      );
    });
  });

  describe("GET /api/contacts", () => {
    it("should get all trusted contacts with phone numbers", async () => {
      // Create a contact first
      await request(app)
        .post("/api/contacts")
        .set("Authorization", `Bearer ${authData.accessToken}`)
        .send(testContact)
        .expect(201);

      const response = await request(app)
        .get("/api/contacts")
        .set("Authorization", `Bearer ${authData.accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty("contacts");
      expect(Array.isArray(response.body.contacts)).toBe(true);
      expect(response.body.contacts.length).toBeGreaterThan(0);
      expect(response.body).toHaveProperty("count");
      expect(response.body).toHaveProperty("maxContacts", 3);
      expect(response.body).toHaveProperty("canAddMore");

      // Check that phone number is included in response
      const contact = response.body.contacts.find(
        (c) => c.email === testContact.email,
      );
      if (contact) {
        expect(contact).toHaveProperty("phoneNumber");
      }
    });
  });

  describe("PUT /api/contacts/:contactId", () => {
    beforeEach(async () => {
      // Create a contact to update
      const res = await request(app)
        .post("/api/contacts")
        .set("Authorization", `Bearer ${authData.accessToken}`)
        .send(testContact)
        .expect(201);
      contactId = res.body.contact.id;
    });

    it("should update a contact including phone number", async () => {
      const updatedData = {
        name: "Jane Smith Updated",
        relationship: "partner",
        phoneNumber: "+1999888777",
      };

      const response = await request(app)
        .put(`/api/contacts/${contactId}`)
        .set("Authorization", `Bearer ${authData.accessToken}`)
        .send(updatedData)
        .expect(200);

      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty(
        "message",
        "Contact updated successfully",
      );
      expect(response.body.contact).toHaveProperty("name", updatedData.name);
      expect(response.body.contact).toHaveProperty(
        "relationship",
        updatedData.relationship,
      );
      expect(response.body.contact).toHaveProperty(
        "phoneNumber",
        updatedData.phoneNumber,
      );
    });

    it("should remove phone number when set to empty string", async () => {
      const updatedData = {
        phoneNumber: "",
      };

      const response = await request(app)
        .put(`/api/contacts/${contactId}`)
        .set("Authorization", `Bearer ${authData.accessToken}`)
        .send(updatedData)
        .expect(200);

      expect(response.body).toHaveProperty("success", true);
      expect(response.body.contact).toHaveProperty("phoneNumber", null);
    });

    it("should validate phone number format on update", async () => {
      const invalidData = {
        phoneNumber: "invalid-format",
      };

      const response = await request(app)
        .put(`/api/contacts/${contactId}`)
        .set("Authorization", `Bearer ${authData.accessToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body).toHaveProperty("success", false);
      expect(response.body).toHaveProperty(
        "message",
        expect.stringContaining("Please enter a valid phone number"),
      );
    });

    it("should return 404 for non-existent contact", async () => {
      const response = await request(app)
        .put("/api/contacts/507f1f77bcf86cd799439011")
        .set("Authorization", `Bearer ${authData.accessToken}`)
        .send({ name: "Non-existent" })
        .expect(404);

      expect(response.body).toHaveProperty("success", false);
      expect(response.body).toHaveProperty("message", "Contact not found");
    });
  });

  describe("DELETE /api/contacts/:contactId", () => {
    beforeEach(async () => {
      // Create a contact to delete
      const res = await request(app)
        .post("/api/contacts")
        .set("Authorization", `Bearer ${authData.accessToken}`)
        .send(testContact)
        .expect(201);
      contactId = res.body.contact.id;
    });

    it("should delete a contact", async () => {
      const response = await request(app)
        .delete(`/api/contacts/${contactId}`)
        .set("Authorization", `Bearer ${authData.accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty(
        "message",
        "Contact deleted successfully",
      );

      // Verify contact is soft deleted
      const contact = await TrustedContact.findById(contactId);
      expect(contact.isActive).toBe(false);
    });

    it("should return 404 for already deleted contact", async () => {
      // Delete first
      await request(app)
        .delete(`/api/contacts/${contactId}`)
        .set("Authorization", `Bearer ${authData.accessToken}`)
        .expect(200);

      // Try to delete again
      const response = await request(app)
        .delete(`/api/contacts/${contactId}`)
        .set("Authorization", `Bearer ${authData.accessToken}`)
        .expect(404);

      expect(response.body).toHaveProperty("success", false);
      expect(response.body).toHaveProperty("message", "Contact not found");
    });
  });

  describe("GET /api/contacts/campus-security", () => {
    it("should get campus security contacts", async () => {
      const response = await request(app)
        .get("/api/contacts/campus-security")
        .set("Authorization", `Bearer ${authData.accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty("securityContacts");
      expect(Array.isArray(response.body.securityContacts)).toBe(true);
      expect(response.body).toHaveProperty("count");
    });
  });
});
