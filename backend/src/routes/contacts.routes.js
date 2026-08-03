import express from "express";

import contactsController from "../controllers/contacts.controller.js";
import { authenticate } from "../middlewares/auth.js";
import { validate, contactValidation } from "../middlewares/validator.js";
import { contactLimiter } from "../middlewares/rateLimiter.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { verifyCsrfToken } from "../utils/tokenService.js";

const router = express.Router();

/**
 * @swagger
 * /api/contacts:
 *   get:
 *     summary: Get all trusted contacts
 *     description: Returns all active trusted contacts for the authenticated user
 *     tags: [Contacts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Contacts retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get("/", authenticate, contactsController.getContacts);

/**
 * @swagger
 * /api/contacts:
 *   post:
 *     summary: Add a new trusted contact
 *     description: Adds a new trusted contact for the authenticated user (max 3 contacts)
 *     tags: [Contacts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Contact added successfully
 *       400:
 *         description: Max contacts reached or validation error
 *       401:
 *         description: Unauthorized
 *       409:
 *         description: Contact already exists
 */
router.post(
  "/",
  authenticate,
  verifyCsrfToken,
  contactLimiter,
  validate(contactValidation.create),
  contactsController.createContact,
);

/**
 * @swagger
 * /api/contacts/{contactId}:
 *   put:
 *     summary: Update a trusted contact
 *     tags: [Contacts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Contact updated successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Contact not found
 */
router.put(
  "/:contactId",
  authenticate,
  verifyCsrfToken,
  validate(contactValidation.update),
  asyncHandler(contactsController.updateContact),
);

/**
 * @swagger
 * /api/contacts/{contactId}:
 *   delete:
 *     summary: Delete a trusted contact
 *     description: Soft deletes a trusted contact (sets isActive to false)
 *     tags: [Contacts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Contact deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Contact not found
 */
router.delete(
  "/:contactId",
  authenticate,
  verifyCsrfToken,
  asyncHandler(contactsController.deleteContact),
);

/**
 * @swagger
 * /api/contacts/campus-security:
 *   get:
 *     summary: Get campus security contacts
 *     tags: [Contacts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Campus security contacts retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get(
  "/campus-security",
  authenticate,
  asyncHandler(contactsController.getCampusSecurityContacts),
);

export default router;
