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

  describe("Complete Contact Management Flow", () => {
    let contactId;
    const testContact = {
      name: "Integration Contact",
      email: "integration@example.com",
      relationship: "friend",
    };

    it("should create a contact", async () => {
      const res = await request(app)
        .post("/api/contacts")
        .set("Authorization", `Bearer ${authData.accessToken}`)
        .send(testContact)
        .expect(201);

      expect(res.body).toHaveProperty("success", true);
      expect(res.body.contact).toHaveProperty("name", testContact.name);
      expect(res.body.contact).toHaveProperty("email", testContact.email);
      expect(res.body.contact).toHaveProperty("isPrimary", true);

      contactId = res.body.contact.id;
    });

    it("should get all contacts", async () => {
      const res = await request(app)
        .get("/api/contacts")
        .set("Authorization", `Bearer ${authData.accessToken}`)
        .expect(200);

      expect(res.body).toHaveProperty("success", true);
      expect(res.body.contacts).toBeInstanceOf(Array);
      expect(res.body.contacts.length).toBeGreaterThan(0);
      expect(res.body).toHaveProperty("maxContacts", 3);
      expect(res.body).toHaveProperty("canAddMore");
    });

    it("should update a contact", async () => {
      const updatedData = {
        name: "Updated Integration Contact",
        relationship: "partner",
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
    });

    it("should handle duplicate contact creation", async () => {
      const res = await request(app)
        .post("/api/contacts")
        .set("Authorization", `Bearer ${authData.accessToken}`)
        .send(testContact)
        .expect(409);

      expect(res.body).toHaveProperty("success", false);
      expect(res.body).toHaveProperty("message", "Contact already exists");
    });

    it("should enforce max contacts limit", async () => {
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

      // Add third contact
      await request(app)
        .post("/api/contacts")
        .set("Authorization", `Bearer ${authData.accessToken}`)
        .send({
          name: "Third Contact",
          email: "third@example.com",
          relationship: "parent",
        })
        .expect(201);

      // Try to add fourth contact
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

    beforeAll(async () => {
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
        })
        .expect(201);

      expect(res.body.contact).toHaveProperty("isPrimary", true);
      firstContactId = res.body.contact.id;
    });

    it("should set second contact as non-primary", async () => {
      const res = await request(app)
        .post("/api/contacts")
        .set("Authorization", `Bearer ${authData.accessToken}`)
        .send({
          name: "Secondary Contact",
          email: "secondary@example.com",
          relationship: "sibling",
        })
        .expect(201);

      expect(res.body.contact).toHaveProperty("isPrimary", false);
      secondContactId = res.body.contact.id;
    });

    it("should allow switching primary contact", async () => {
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
});
