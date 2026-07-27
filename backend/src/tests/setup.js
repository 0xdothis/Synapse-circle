// src/tests/setup.js
import dotenv from "dotenv";
import mongoose from "mongoose";
import { jest, beforeAll, afterAll } from "@jest/globals";

// Load test environment variables
dotenv.config({ path: ".env.test" });

process.env.NODE_ENV = "test";
process.env.DISABLE_EMAIL_SENDING = "true";
process.env.DISABLE_RATE_LIMITING = "true";

jest.setTimeout(30000);

let isConnected = false;

/**
 * Drop stale phoneNumber index from TrustedContact collection if it exists
 */
async function dropStalePhoneNumberIndex() {
  try {
    const collection = mongoose.connection.collection("trustedcontacts");
    const indexes = await collection.indexes();
    let droppedAny = false;

    for (const index of indexes) {
      if (index.name?.includes("phoneNumber")) {
        await collection.dropIndex(index.name);
        console.log(`🧪 Dropped stale index: ${index.name}`);
        droppedAny = true;
      }
    }

    if (!droppedAny) {
      console.log("🧪 No stale phoneNumber index found to drop");
    }
  } catch (indexError) {
    // If the collection doesn't exist yet, that's fine - it will be created with the correct schema
    if (
      indexError.message?.includes("ns not found") ||
      indexError.code === 26
    ) {
      console.log(
        "🧪 TrustedContacts collection doesn't exist yet, skipping index cleanup",
      );
    } else {
      // Re-throw unexpected errors
      console.error(
        "🧪 Unexpected error during index cleanup:",
        indexError.message,
      );
      throw indexError;
    }
  }
}

/**
 * Clear all collections in the database
 */
async function clearAllCollections() {
  const collections = mongoose.connection.collections;
  const errors = [];

  for (const key in collections) {
    try {
      await collections[key].deleteMany();
    } catch (cleanupError) {
      errors.push({ collection: key, error: cleanupError.message });
      console.warn(
        `🧪 Warning: Could not clear collection ${key}:`,
        cleanupError.message,
      );
    }
  }

  return errors;
}

/**
 * Connect to MongoDB and setup test environment
 */
async function connectAndSetupDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    isConnected = true;
    console.log("🧪 Test MongoDB connected successfully");
  } catch (error) {
    console.error("🧪 Test MongoDB connection error:", error);
    throw error;
  }
}

/**
 * Setup test database with clean state
 */
async function setupTestDatabase() {
  // Connect if not already connected
  if (!isConnected) {
    await connectAndSetupDatabase();
  }

  // Drop stale index
  await dropStalePhoneNumberIndex();

  // Clear all collections
  await clearAllCollections();
}

/**
 * Clean up after all tests
 */
async function cleanupTestDatabase() {
  try {
    await clearAllCollections();
    await mongoose.disconnect();
    isConnected = false;
    console.log("🧪 Test MongoDB disconnected");
  } catch (error) {
    console.error("🧪 Error during cleanup:", error);
    // Don't re-throw - we want the test suite to complete even if cleanup fails
  }
}

beforeAll(async () => {
  await setupTestDatabase();
});

afterAll(async () => {
  await cleanupTestDatabase();
});

// Suppress console logs in CI environment
if (process.env.CI === "true") {
  console.log = jest.fn();
  console.error = jest.fn();
  console.warn = jest.fn();
}
