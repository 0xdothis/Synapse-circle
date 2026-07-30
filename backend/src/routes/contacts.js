import express from "express";

import TrustedContact from "../models/TrustedContact.js";
import CampusSecurity from "../models/CampusSecurity.js";
import { authenticate } from "../middlewares/auth.js";
import { validate, contactValidation } from "../middlewares/validator.js";
import { contactLimiter } from "../middlewares/rateLimiter.js";
import { logger } from "../utils/logger.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import config from "../utils/config.js";
import { verifyCsrfToken } from "../utils/tokenService.js";

const router = express.Router();

const findActiveContact = (userId, contactId) => {
  return TrustedContact.findOne({
    _id: contactId,
    userId,
    isActive: true,
  });
};

const syncPrimaryContactAfterUpdate = async (
  userId,
  contactId,
  contact,
  isPrimary,
) => {
  if (isPrimary && !contact.isPrimary) {
    await TrustedContact.updateMany(
      { userId, isActive: true },
      { isPrimary: false },
    );
    contact.isPrimary = true;
    return;
  }

  if (isPrimary === false && contact.isPrimary) {
    contact.isPrimary = false;
    const otherContacts = await TrustedContact.findOne({
      userId,
      isActive: true,
      _id: { $ne: contactId },
    });
    if (otherContacts) {
      otherContacts.isPrimary = true;
      await otherContacts.save();
    }
  }
};

const syncPrimaryContactAfterDelete = async (userId, contactId) => {
  const newPrimary = await TrustedContact.findOne({
    userId,
    isActive: true,
    _id: { $ne: contactId },
  });
  if (newPrimary) {
    newPrimary.isPrimary = true;
    await newPrimary.save();
  }
};

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
router.get("/", authenticate, async (req, res, next) => {
  try {
    const contacts = await TrustedContact.find({
      userId: req.userId,
      isActive: true,
    })
      .select("-__v")
      .sort({ isPrimary: -1, createdAt: 1 });

    res.status(200).json({
      success: true,
      contacts,
      count: contacts.length,
      maxContacts: config.maxTrustedContacts,
      canAddMore: contacts.length < config.maxTrustedContacts,
    });
  } catch (error) {
    next(error);
  }
});

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
  async (req, res, next) => {
    const { name, email, relationship } = req.body;
    const userId = req.userId;

    // Check if contact already exists for this user (by email)
    const existingContact = await TrustedContact.findOne({
      userId,
      email: email.toLowerCase().trim(),
      isActive: true,
    });

    if (existingContact) {
      return res.status(409).json({
        success: false,
        message: "Contact already exists",
        contact: existingContact,
      });
    }

    const existingContacts = await TrustedContact.countDocuments({
      userId,
      isActive: true,
    });

    if (existingContacts >= config.maxTrustedContacts) {
      return res.status(400).json({
        success: false,
        message: `You can only have up to ${config.maxTrustedContacts} trusted contacts`,
        maxContacts: config.maxTrustedContacts,
      });
    }

    const isPrimary = existingContacts === 0;
    const contact = await TrustedContact.create({
      userId,
      name: name.trim(),
      email: email.toLowerCase().trim(),
      relationship,
      isPrimary,
    });

    logger.info(`New trusted contact added for user ${userId}:`, {
      contactId: contact._id,
      name: contact.name,
      email: contact.email,
    });

    res.status(201).json({
      success: true,
      message: "Contact added successfully",
      contact,
    });
  },
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
  asyncHandler(async (req, res) => {
    const { contactId } = req.params;
    const { name, email, relationship, isPrimary } = req.body;
    const userId = req.userId;

    const contact = await findActiveContact(userId, contactId);

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: "Contact not found",
      });
    }

    // Check for duplicate email if email is being changed
    if (email && email.toLowerCase().trim() !== contact.email) {
      const existingContact = await TrustedContact.findOne({
        userId,
        email: email.toLowerCase().trim(),
        isActive: true,
        _id: { $ne: contactId },
      });

      if (existingContact) {
        return res.status(409).json({
          success: false,
          message: "Another contact with this email already exists",
        });
      }
    }

    if (name) contact.name = name.trim();
    if (email) contact.email = email.toLowerCase().trim();
    if (relationship) contact.relationship = relationship;

    await syncPrimaryContactAfterUpdate(userId, contactId, contact, isPrimary);

    await contact.save();

    logger.info(`Contact ${contactId} updated for user ${userId}`);

    res.status(200).json({
      success: true,
      message: "Contact updated successfully",
      contact,
    });
  }),
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
  asyncHandler(async (req, res) => {
    const { contactId } = req.params;
    const userId = req.userId;

    const contact = await TrustedContact.findOne({
      _id: contactId,
      userId,
      isActive: true,
    });

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: "Contact not found",
      });
    }

    contact.isActive = false;
    await contact.save();

    if (contact.isPrimary) {
      await syncPrimaryContactAfterDelete(userId, contactId);
    }

    logger.info(`Contact ${contactId} deleted for user ${userId}`);

    res.status(200).json({
      success: true,
      message: "Contact deleted successfully",
    });
  }),
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
  asyncHandler(async (req, res) => {
    const securityContacts = await CampusSecurity.find({
      isActive: true,
    })
      .select("-__v")
      .sort({ isPrimary: -1, name: 1 });

    res.status(200).json({
      success: true,
      securityContacts,
      count: securityContacts.length,
    });
  }),
);

export default router;
