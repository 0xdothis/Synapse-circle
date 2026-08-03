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

async function connectDB() {
  if (isConnected) return;

  try {
    const mongoURI =
      process.env.MONGODB_URI || "mongodb://localhost:27017/safewalk_test";
    await mongoose.connect(mongoURI, {
      maxPoolSize: 5,
      minPoolSize: 2,
      connectTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    isConnected = true;
    console.log("🧪 Test MongoDB connected successfully");
  } catch (error) {
    console.error("🧪 Test MongoDB connection error:", error);
    throw error;
  }
}

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
    if (
      indexError.message?.includes("ns not found") ||
      indexError.code === 26
    ) {
      console.log(
        "🧪 TrustedContacts collection doesn't exist yet, skipping index cleanup",
      );
    } else {
      console.error(
        "🧪 Unexpected error during index cleanup:",
        indexError.message,
      );
      throw indexError;
    }
  }
}

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

async function setupTestDatabase() {
  if (!isConnected) {
    await connectDB();
  }
  await dropStalePhoneNumberIndex();
  await clearAllCollections();
}

async function cleanupTestDatabase() {
  try {
    await clearAllCollections();
    await mongoose.disconnect();
    isConnected = false;
    console.log("🧪 Test MongoDB disconnected");
  } catch (error) {
    console.error("🧪 Error during cleanup:", error);
  }
}

beforeAll(async () => {
  await setupTestDatabase();
});

afterAll(async () => {
  await cleanupTestDatabase();
});

// Suppress console logs in CI
if (process.env.CI === "true") {
  console.log = jest.fn();
  console.error = jest.fn();
  console.warn = jest.fn();
}
