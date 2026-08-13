import request from "supertest";
import app from "../../server.js";
import User from "../../src/models/User.js";
import { getAuthToken } from "../helpers/authHelper.js";
import TrustedContact from "../../src/models/TrustedContact.js";

describe("Contacts Integration Tests", () => {
  let authData;
  let userId;

  const testUser = {
    email: "integration-contacts@campus.edu",
    name: "Integration Contacts User",
    password: "TestPassword123",
  };

  beforeAll(async () => {
    authData = await getAuthToken(testUser);
    userId = authData.userId;
  });

  // Clean up contacts before each test
  beforeEach(async () => {
    await TrustedContact.deleteMany({ userId });
  });

  describe("Complete Contact Management Flow", () => {
    let contactId;
    const testContact = {
      name: "Integration Contact",
      email: "integration@example.com",
      relationship: "friend",
      phoneNumber: "+1234567890",
    };

    it("should create a contact with phone number", async () => {
      const res = await request(app)
        .post("/api/contacts")
        .set("Authorization", `Bearer ${authData.accessToken}`)
        .send(testContact)
        .expect(201);

      expect(res.body).toHaveProperty("success", true);
      expect(res.body.contact).toHaveProperty("name", testContact.name);
      expect(res.body.contact).toHaveProperty("email", testContact.email);
      expect(res.body.contact).toHaveProperty(
        "phoneNumber",
        testContact.phoneNumber,
      );
      expect(res.body.contact).toHaveProperty("isPrimary", true);

      contactId = res.body.contact.id;
    });

    it("should create a contact without phone number", async () => {
      const contactWithoutPhone = {
        name: "No Phone Contact",
        email: "nophone@example.com",
        relationship: "sibling",
      };

      const res = await request(app)
        .post("/api/contacts")
        .set("Authorization", `Bearer ${authData.accessToken}`)
        .send(contactWithoutPhone)
        .expect(201);

      expect(res.body).toHaveProperty("success", true);
      expect(res.body.contact).toHaveProperty("phoneNumber", null);
    });

    it("should validate invalid phone number format", async () => {
      const invalidContact = {
        name: "Invalid Phone",
        email: "invalidphone@example.com",
        relationship: "friend",
        phoneNumber: "invalid-phone-number",
      };

      const res = await request(app)
        .post("/api/contacts")
        .set("Authorization", `Bearer ${authData.accessToken}`)
        .send(invalidContact)
        .expect(400);

      expect(res.body).toHaveProperty("success", false);
      expect(res.body).toHaveProperty(
        "message",
        expect.stringContaining("Please enter a valid phone number"),
      );
    });

    it("should get all contacts", async () => {
      // Create a contact first
      await request(app)
        .post("/api/contacts")
        .set("Authorization", `Bearer ${authData.accessToken}`)
        .send(testContact)
        .expect(201);

      const res = await request(app)
        .get("/api/contacts")
        .set("Authorization", `Bearer ${authData.accessToken}`)
        .expect(200);

      expect(res.body).toHaveProperty("success", true);
      expect(res.body.contacts).toBeInstanceOf(Array);
      expect(res.body.contacts.length).toBeGreaterThan(0);
      expect(res.body).toHaveProperty("maxContacts", 3);
      expect(res.body).toHaveProperty("canAddMore");

      // Verify phone number is included in response
      const contact = res.body.contacts.find(
        (c) => c.email === testContact.email,
      );
      if (contact) {
        expect(contact).toHaveProperty("phoneNumber");
      }
    });

    it("should update a contact including phone number", async () => {
      // Create contact first
      const createRes = await request(app)
        .post("/api/contacts")
        .set("Authorization", `Bearer ${authData.accessToken}`)
        .send(testContact)
        .expect(201);
      contactId = createRes.body.contact.id;

      const updatedData = {
        name: "Updated Integration Contact",
        relationship: "partner",
        phoneNumber: "+1999888777",
      };

      const res = await request(app)
        .put(`/api/contacts/${contactId}`)
        .set("Authorization", `Bearer ${authData.accessToken}`)
        .send(updatedData)
        .expect(200);

      expect(res.body).toHaveProperty("success", true);
      expect(res.body.contact).toHaveProperty("name", updatedData.name);
      expect(res.body.contact).toHaveProperty(
        "relationship",
        updatedData.relationship,
      );
      expect(res.body.contact).toHaveProperty(
        "phoneNumber",
        updatedData.phoneNumber,
      );
    });

    it("should remove phone number when set to empty string", async () => {
      // Create contact with phone number first
      const createRes = await request(app)
        .post("/api/contacts")
        .set("Authorization", `Bearer ${authData.accessToken}`)
        .send(testContact)
        .expect(201);
      contactId = createRes.body.contact.id;

      const updatedData = {
        phoneNumber: "",
      };

      const res = await request(app)
        .put(`/api/contacts/${contactId}`)
        .set("Authorization", `Bearer ${authData.accessToken}`)
        .send(updatedData)
        .expect(200);

      expect(res.body).toHaveProperty("success", true);
      expect(res.body.contact).toHaveProperty("phoneNumber", null);
    });

    it("should validate phone number format on update", async () => {
      // Create contact first
      const createRes = await request(app)
        .post("/api/contacts")
        .set("Authorization", `Bearer ${authData.accessToken}`)
        .send(testContact)
        .expect(201);
      contactId = createRes.body.contact.id;

      const invalidData = {
        phoneNumber: "invalid-format",
      };

      const res = await request(app)
        .put(`/api/contacts/${contactId}`)
        .set("Authorization", `Bearer ${authData.accessToken}`)
        .send(invalidData)
        .expect(400);

      expect(res.body).toHaveProperty("success", false);
      expect(res.body).toHaveProperty(
        "message",
        expect.stringContaining("Please enter a valid phone number"),
      );
    });

    it("should handle duplicate contact creation", async () => {
      // Create first contact
      await request(app)
        .post("/api/contacts")
        .set("Authorization", `Bearer ${authData.accessToken}`)
        .send(testContact)
        .expect(201);

      // Try to create duplicate
      const res = await request(app)
        .post("/api/contacts")
        .set("Authorization", `Bearer ${authData.accessToken}`)
        .send(testContact)
        .expect(409);

      expect(res.body).toHaveProperty("success", false);
      expect(res.body).toHaveProperty("message", "Contact already exists");
    });

    it("should enforce max contacts limit", async () => {
      // Add first contact
      await request(app)
        .post("/api/contacts")
        .set("Authorization", `Bearer ${authData.accessToken}`)
        .send({
          name: "First Contact",
          email: "first@example.com",
          relationship: "friend",
        })
        .expect(201);

      // Add second contact
      await request(app)
        .post("/api/contacts")
        .set("Authorization", `Bearer ${authData.accessToken}`)
        .send({
          name: "Second Contact",
          email: "second@example.com",
          relationship: "sibling",
        })
        .expect(201);

      // Add third contact (max is 3)
      await request(app)
        .post("/api/contacts")
        .set("Authorization", `Bearer ${authData.accessToken}`)
        .send({
          name: "Third Contact",
          email: "third@example.com",
          relationship: "parent",
        })
        .expect(201);

      // Try to add fourth contact (should fail)
      const res = await request(app)
        .post("/api/contacts")
        .set("Authorization", `Bearer ${authData.accessToken}`)
        .send({
          name: "Fourth Contact",
          email: "fourth@example.com",
          relationship: "other",
        })
        .expect(400);

      expect(res.body).toHaveProperty("success", false);
      expect(res.body.message).toContain("You can only have up to");
    });

    it("should delete a contact", async () => {
      // Create contact first
      const createRes = await request(app)
        .post("/api/contacts")
        .set("Authorization", `Bearer ${authData.accessToken}`)
        .send(testContact)
        .expect(201);
      contactId = createRes.body.contact.id;

      const res = await request(app)
        .delete(`/api/contacts/${contactId}`)
        .set("Authorization", `Bearer ${authData.accessToken}`)
        .expect(200);

      expect(res.body).toHaveProperty("success", true);
      expect(res.body).toHaveProperty(
        "message",
        "Contact deleted successfully",
      );

      // Verify contact is soft deleted
      const contact = await TrustedContact.findById(contactId);
      expect(contact.isActive).toBe(false);
    });

    it("should handle delete of non-existent contact", async () => {
      const res = await request(app)
        .delete("/api/contacts/507f1f77bcf86cd799439011")
        .set("Authorization", `Bearer ${authData.accessToken}`)
        .expect(404);

      expect(res.body).toHaveProperty("success", false);
      expect(res.body).toHaveProperty("message", "Contact not found");
    });
  });

  describe("Primary Contact Management", () => {
    let firstContactId;
    let secondContactId;

    beforeEach(async () => {
      await TrustedContact.deleteMany({ userId });
    });

    it("should set first contact as primary", async () => {
      const res = await request(app)
        .post("/api/contacts")
        .set("Authorization", `Bearer ${authData.accessToken}`)
        .send({
          name: "Primary Contact",
          email: "primary@example.com",
          relationship: "friend",
          phoneNumber: "+1111111111",
        })
        .expect(201);

      expect(res.body.contact).toHaveProperty("isPrimary", true);
      expect(res.body.contact).toHaveProperty("phoneNumber", "+1111111111");
      firstContactId = res.body.contact.id;
    });

    it("should set second contact as non-primary", async () => {
      // Create first contact
      const firstRes = await request(app)
        .post("/api/contacts")
        .set("Authorization", `Bearer ${authData.accessToken}`)
        .send({
          name: "First Contact",
          email: "first@example.com",
          relationship: "friend",
        })
        .expect(201);
      firstContactId = firstRes.body.contact.id;

      // Create second contact
      const res = await request(app)
        .post("/api/contacts")
        .set("Authorization", `Bearer ${authData.accessToken}`)
        .send({
          name: "Secondary Contact",
          email: "secondary@example.com",
          relationship: "sibling",
          phoneNumber: "+2222222222",
        })
        .expect(201);

      expect(res.body.contact).toHaveProperty("isPrimary", false);
      expect(res.body.contact).toHaveProperty("phoneNumber", "+2222222222");
      secondContactId = res.body.contact.id;
    });

    it("should allow switching primary contact", async () => {
      // Create first contact
      const firstRes = await request(app)
        .post("/api/contacts")
        .set("Authorization", `Bearer ${authData.accessToken}`)
        .send({
          name: "First Contact",
          email: "first@example.com",
          relationship: "friend",
        })
        .expect(201);
      firstContactId = firstRes.body.contact.id;

      // Create second contact
      const secondRes = await request(app)
        .post("/api/contacts")
        .set("Authorization", `Bearer ${authData.accessToken}`)
        .send({
          name: "Secondary Contact",
          email: "secondary@example.com",
          relationship: "sibling",
        })
        .expect(201);
      secondContactId = secondRes.body.contact.id;

      // Switch primary to second contact
      const res = await request(app)
        .put(`/api/contacts/${secondContactId}`)
        .set("Authorization", `Bearer ${authData.accessToken}`)
        .send({ isPrimary: true })
        .expect(200);

      expect(res.body.contact).toHaveProperty("isPrimary", true);

      // Verify first contact is no longer primary
      const firstContact = await TrustedContact.findById(firstContactId);
      expect(firstContact.isPrimary).toBe(false);
    });
  });

  describe("Campus Security Contacts", () => {
    it("should get campus security contacts", async () => {
      const res = await request(app)
        .get("/api/contacts/campus-security")
        .set("Authorization", `Bearer ${authData.accessToken}`)
        .expect(200);

      expect(res.body).toHaveProperty("success", true);
      expect(res.body).toHaveProperty("securityContacts");
      expect(Array.isArray(res.body.securityContacts)).toBe(true);
      expect(res.body).toHaveProperty("count");
    });
  });

  describe("Authentication", () => {
    it("should require authentication for creating contacts", async () => {
      const res = await request(app)
        .post("/api/contacts")
        .send({
          name: "Unauthorized Contact",
          email: "unauthorized@example.com",
          relationship: "friend",
        })
        .expect(401);

      expect(res.body).toHaveProperty("success", false);
      expect(res.body).toHaveProperty(
        "message",
        "Authentication required. Please log in.",
      );
    });

    it("should require authentication for getting contacts", async () => {
      const res = await request(app).get("/api/contacts").expect(401);

      expect(res.body).toHaveProperty("success", false);
      expect(res.body).toHaveProperty(
        "message",
        "Authentication required. Please log in.",
      );
    });

    it("should require authentication for updating contacts", async () => {
      const res = await request(app)
        .put("/api/contacts/507f1f77bcf86cd799439011")
        .send({ name: "Unauthorized Update" })
        .expect(401);

      expect(res.body).toHaveProperty("success", false);
      expect(res.body).toHaveProperty(
        "message",
        "Authentication required. Please log in.",
      );
    });

    it("should require authentication for deleting contacts", async () => {
      const res = await request(app)
        .delete("/api/contacts/507f1f77bcf86cd799439011")
        .expect(401);

      expect(res.body).toHaveProperty("success", false);
      expect(res.body).toHaveProperty(
        "message",
        "Authentication required. Please log in.",
      );
    });
  });
});
