import mongoose from "mongoose";
import TrustedContact from "../models/TrustedContact.js";
import config from "./config.js";
import { logger } from "./logger.js";
import { EMAIL_REGEX } from "./regex.js";

/**
 * Validate a single contact
 */
export const validateContact = (contact, index) => {
  if (!contact.name || !contact.email || !contact.relationship) {
    throw new Error(
      `Contact at index ${index} is missing required fields (name, email, relationship)`,
    );
  }
  if (contact.name.length > 100) {
    throw new Error(
      `Contact at index ${index} name cannot exceed 100 characters`,
    );
  }
  if (!EMAIL_REGEX.test(contact.email)) {
    throw new Error(`Contact at index ${index} has invalid email format`);
  }
  const validRelationships = [
    "parent",
    "sibling",
    "friend",
    "roommate",
    "partner",
    "other",
  ];
  if (!validRelationships.includes(contact.relationship)) {
    throw new Error(`Contact at index ${index} has invalid relationship`);
  }
  return true;
};

/**
 * Deduplicate contacts within the same request
 */
export const deduplicateContacts = (contacts) => {
  const uniqueContacts = [];
  const seenEmails = new Set();
  const duplicateInRequest = [];

  for (const contact of contacts) {
    const email = contact.email.toLowerCase().trim();
    if (!seenEmails.has(email)) {
      seenEmails.add(email);
      uniqueContacts.push(contact);
    } else {
      duplicateInRequest.push(contact);
    }
  }

  return { uniqueContacts, duplicateInRequest };
};

/**
 * Check existing contacts and calculate capacity
 */
export const checkContactCapacity = async (userId) => {
  const existingCount = await TrustedContact.countDocuments({
    userId,
    isActive: true,
  });

  const maxAllowed = Math.max(0, config.maxTrustedContacts - existingCount);

  return { existingCount, maxAllowed };
};

/**
 * Get duplicate emails from existing contacts
 */
export const getExistingDuplicates = async (userId, contacts) => {
  if (contacts.length === 0) {
    return {
      existingEmailSet: new Set(),
      contactsToCreate: [],
      skippedContacts: [],
    };
  }

  const existingEmails = await TrustedContact.find({
    userId,
    isActive: true,
    email: { $in: contacts.map((c) => c.email.toLowerCase().trim()) },
  }).select("email");

  const existingEmailSet = new Set(existingEmails.map((e) => e.email));

  const contactsToCreate = contacts.filter(
    (c) => !existingEmailSet.has(c.email.toLowerCase().trim()),
  );
  const skippedContacts = contacts.filter((c) =>
    existingEmailSet.has(c.email.toLowerCase().trim()),
  );

  return { existingEmailSet, contactsToCreate, skippedContacts };
};

/**
 * Main function to handle contact processing during onboarding
 */
export const processOnboardingContacts = async (userId, contacts) => {
  const result = {
    contactsAdded: 0,
    contactsErrors: [],
    shouldUpdateStep: false,
  };

  if (!contacts || !Array.isArray(contacts) || contacts.length === 0) {
    // Check if user already has contacts
    const existingCount = await TrustedContact.countDocuments({
      userId,
      isActive: true,
    });

    if (existingCount === 0) {
      result.contactsErrors.push({
        type: "no_contacts",
        message: "Please add at least one trusted contact",
      });
    } else {
      result.shouldUpdateStep = true;
    }
    return result;
  }

  // Step 1: Deduplicate contacts within the request
  const { uniqueContacts, duplicateInRequest } = deduplicateContacts(contacts);
  if (duplicateInRequest.length > 0) {
    result.contactsErrors.push({
      type: "duplicate_in_request",
      contacts: duplicateInRequest,
      message: `${duplicateInRequest.length} contact(s) have duplicate emails within the same request`,
    });
  }

  const { existingCount, maxAllowed } = await checkContactCapacity(userId);

  if (maxAllowed <= 0) {
    result.contactsErrors.push({
      type: "capacity_exceeded",
      message: `Maximum ${config.maxTrustedContacts} contacts already reached. Please delete a contact to add more.`,
      maxContacts: config.maxTrustedContacts,
      existingCount,
    });

    if (existingCount > 0) {
      result.shouldUpdateStep = true;
    }
    return result;
  }

  if (uniqueContacts.length > maxAllowed) {
    const droppedContacts = uniqueContacts.slice(maxAllowed);
    result.contactsErrors.push({
      type: "capacity_exceeded",
      message: `Only ${maxAllowed} contacts can be added. ${droppedContacts.length} contact(s) were not processed due to the ${config.maxTrustedContacts} contact limit.`,
      droppedCount: droppedContacts.length,
      maxAllowed,
      maxContacts: config.maxTrustedContacts,
      existingCount,
      droppedContacts,
    });
  }

  const contactsToAdd = uniqueContacts.slice(0, maxAllowed);

  // Step 4: Check for duplicates against existing contacts
  const { contactsToCreate, skippedContacts } = await getExistingDuplicates(
    userId,
    contactsToAdd,
  );

  if (skippedContacts.length > 0) {
    result.contactsErrors.push({
      type: "duplicate",
      contacts: skippedContacts,
      message: `${skippedContacts.length} contact(s) already exist`,
    });
  }

  if (contactsToCreate.length > 0) {
    const isPrimary = existingCount === 0;
    const { created, contactsAdded, error } = await createContactsInTransaction(
      userId,
      contactsToCreate,
      isPrimary,
    );

    if (error) {
      result.contactsErrors.push(error);
    } else {
      result.contactsAdded = contactsAdded;
    }
  }

  // Step 6: Determine if we should update the step
  const finalCount = await TrustedContact.countDocuments({
    userId,
    isActive: true,
  });

  if (finalCount > 0) {
    result.shouldUpdateStep = true;
  }

  return result;
};

/**
 * Create contacts in a transaction-safe way
 */
export const createContactsInTransaction = async (
  userId,
  contacts,
  isPrimary,
) => {
  if (contacts.length === 0) {
    return { created: [], contactsAdded: 0, error: null };
  }

  // Skip transactions in test environment (standalone MongoDB doesn't support them)
  if (process.env.NODE_ENV === "test") {
    try {
      const contactDocs = contacts.map((contact, index) => ({
        userId,
        name: contact.name.trim(),
        email: contact.email.toLowerCase().trim(),
        relationship: contact.relationship,
        isPrimary: isPrimary && index === 0,
      }));

      const created = await TrustedContact.insertMany(contactDocs);
      return { created, contactsAdded: created.length, error: null };
    } catch (error) {
      if (error.code === 11000) {
        return {
          created: [],
          contactsAdded: 0,
          error: {
            type: "duplicate",
            message: "Some contacts already exist",
          },
        };
      }
      throw error;
    }
  }

  // Production: Use transactions
  let session;

  try {
    session = await mongoose.startSession();
    session.startTransaction();

    const contactDocs = contacts.map((contact, index) => ({
      userId,
      name: contact.name.trim(),
      email: contact.email.toLowerCase().trim(),
      relationship: contact.relationship,
      isPrimary: isPrimary && index === 0,
    }));

    const created = await TrustedContact.insertMany(contactDocs, { session });

    const finalCount = await TrustedContact.countDocuments({
      userId,
      isActive: true,
    }).session(session);

    if (finalCount > config.maxTrustedContacts) {
      await session.abortTransaction();
      return {
        created: [],
        contactsAdded: 0,
        error: {
          type: "concurrent_operation",
          message:
            "Another operation added contacts concurrently. Please try again.",
          currentCount: finalCount,
          maxContacts: config.maxTrustedContacts,
        },
      };
    }

    await session.commitTransaction();
    return { created, contactsAdded: created.length, error: null };
  } catch (error) {
    if (session) {
      try {
        await session.abortTransaction();
      } catch (abortError) {
        logger.error("Error aborting transaction:", abortError);
      }
    }

    if (error.code === 11000) {
      return {
        created: [],
        contactsAdded: 0,
        error: {
          type: "duplicate_concurrent",
          message:
            "Some contacts were added in another request. Please refresh and try again.",
        },
      };
    }

    throw error;
  } finally {
    if (session) {
      try {
        await session.endSession();
      } catch (endError) {
        logger.error("Error ending session:", endError);
      }
    }
  }
};

export default {
  validateContact,
  deduplicateContacts,
  checkContactCapacity,
  getExistingDuplicates,
  createContactsInTransaction,
  processOnboardingContacts,
};
