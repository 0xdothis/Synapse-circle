import TrustedContact from "../models/TrustedContact.js";
import CampusSecurity from "../models/CampusSecurity.js";
import { logger } from "../utils/logger.js";
import config from "../utils/config.js";

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
 * Get all active trusted contacts for a user, plus the max/canAddMore summary.
 */
const listContacts = async (userId) => {
  const contacts = await TrustedContact.find({
    userId,
    isActive: true,
  })
    .select("-__v")
    .sort({ isPrimary: -1, createdAt: 1 });

  return {
    contacts,
    count: contacts.length,
    maxContacts: config.maxTrustedContacts,
    canAddMore: contacts.length < config.maxTrustedContacts,
  };
};

/**
 * Create a new trusted contact for a user.
 * Returns { conflict, maxReached, contact } — callers check which case applies.
 */
const addContact = async (
  userId,
  { name, email, relationship, phoneNumber },
) => {
  const normalizedEmail = email.toLowerCase().trim();

  const existingContact = await TrustedContact.findOne({
    userId,
    email: normalizedEmail,
    isActive: true,
  });

  if (existingContact) {
    return { conflict: true, contact: existingContact };
  }

  const existingContacts = await TrustedContact.countDocuments({
    userId,
    isActive: true,
  });

  if (existingContacts >= config.maxTrustedContacts) {
    return { maxReached: true, maxContacts: config.maxTrustedContacts };
  }

  const isPrimary = existingContacts === 0;
  const contact = await TrustedContact.create({
    userId,
    name: name.trim(),
    email: normalizedEmail,
    phoneNumber: phoneNumber?.trim() || null,
    relationship,
    isPrimary,
  });

  logger.info(`New trusted contact added for user ${userId}:`, {
    contactId: contact._id,
    name: contact.name,
    email: contact.email,
    phoneNumber: contact.phoneNumber,
  });

  return { contact };
};

/**
 * Update an existing trusted contact.
 * Returns { notFound: true } | { emailConflict: true } | { contact }.
 */
const editContact = async (
  userId,
  contactId,
  { name, email, relationship, phoneNumber, isPrimary },
) => {
  const contact = await findActiveContact(userId, contactId);

  if (!contact) {
    return { notFound: true };
  }

  if (email && email.toLowerCase().trim() !== contact.email) {
    const existingContact = await TrustedContact.findOne({
      userId,
      email: email.toLowerCase().trim(),
      isActive: true,
      _id: { $ne: contactId },
    });

    if (existingContact) {
      return { emailConflict: true };
    }
  }

  if (name) contact.name = name.trim();
  if (email) contact.email = email.toLowerCase().trim();
  if (relationship) contact.relationship = relationship;
  if (phoneNumber !== undefined)
    contact.phoneNumber = phoneNumber?.trim() || null;

  await syncPrimaryContactAfterUpdate(userId, contactId, contact, isPrimary);

  await contact.save();

  logger.info(`Contact ${contactId} updated for user ${userId}`);

  return { contact };
};

/**
 * Soft-delete a trusted contact and reassign primary status if needed.
 * Returns { notFound: true } | { deleted: true }.
 */
const removeContact = async (userId, contactId) => {
  const contact = await TrustedContact.findOne({
    _id: contactId,
    userId,
    isActive: true,
  });

  if (!contact) {
    return { notFound: true };
  }

  contact.isActive = false;
  await contact.save();

  if (contact.isPrimary) {
    await syncPrimaryContactAfterDelete(userId, contactId);
  }

  logger.info(`Contact ${contactId} deleted for user ${userId}`);

  return { deleted: true };
};

const listCampusSecurityContacts = async () => {
  const securityContacts = await CampusSecurity.find({
    isActive: true,
  })
    .select("-__v")
    .sort({ isPrimary: -1, name: 1 });

  return { securityContacts, count: securityContacts.length };
};

export default {
  listContacts,
  addContact,
  editContact,
  removeContact,
  listCampusSecurityContacts,
};
