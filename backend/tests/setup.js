import dotenv from "dotenv";
import mongoose from "mongoose";
import { jest, beforeAll, afterAll } from "@jest/globals";

// Load test environment variables
dotenv.config({ path: ".env.test" });

process.env.NODE_ENV = "test";
process.env.DISABLE_EMAIL_SENDING = "true";
process.env.DISABLE_RATE_LIMITING = "true";

// Increase timeout for all tests
jest.setTimeout(120000);

let isConnected = false;

async function connectDB() {
  if (isConnected) return;

  try {
    const mongoURI =
      process.env.MONGODB_TEST_URI ||
      process.env.MONGODB_URI ||
      "mongodb://localhost:27017/safewalk_test";

    console.log(`🧪 Connecting to test database: ${mongoURI}`);

    await mongoose.connect(mongoURI, {
      maxPoolSize: 5,
      minPoolSize: 1,
      connectTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      serverSelectionTimeoutMS: 30000,
    });
    isConnected = true;
    console.log("🧪 Test MongoDB connected successfully");
  } catch (error) {
    console.error("🧪 Test MongoDB connection error:", error.message);
    if (
      error.message.includes("ETIMEOUT") ||
      error.message.includes("querySrv") ||
      error.message.includes("MongoNetworkError")
    ) {
      console.log("🧪 Retrying with localhost...");
      try {
        await mongoose.connect("mongodb://localhost:27017/safewalk_test", {
          maxPoolSize: 5,
          minPoolSize: 1,
          connectTimeoutMS: 30000,
          socketTimeoutMS: 45000,
        });
        isConnected = true;
        console.log("🧪 Test MongoDB connected successfully to localhost");
      } catch (fallbackError) {
        console.error("🧪 Fallback connection failed:", fallbackError.message);
        throw fallbackError;
      }
    } else {
      throw error;
    }
  }
}

async function dropStalePhoneNumberIndex() {
  try {
    const collection = mongoose.connection.collection("trustedcontacts");
    if (!collection) return;

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
      console.log("🧪 Index cleanup skipped:", indexError.message);
    }
  }
}

async function clearAllCollections() {
  const collections = mongoose.connection.collections;

  for (const key in collections) {
    try {
      await collections[key].deleteMany({});
      console.log(`🧪 Cleared collection: ${key}`);
    } catch (cleanupError) {
      console.warn(
        `🧪 Warning: Could not clear collection ${key}:`,
        cleanupError.message,
      );
    }
  }
}

async function setupTestDatabase() {
  if (!isConnected) {
    await connectDB();
  }

  if (isConnected) {
    try {
      await dropStalePhoneNumberIndex();
    } catch (error) {
      console.log("🧪 Index cleanup skipped:", error.message);
    }

    await clearAllCollections();
  }
}

async function cleanupTestDatabase() {
  if (!isConnected) return;

  try {
    if (mongoose.connection.readyState === 1) {
      await clearAllCollections();
      await mongoose.disconnect();
    }
    isConnected = false;
    console.log("🧪 Test MongoDB disconnected");
  } catch (error) {
    console.error("🧪 Error during cleanup:", error.message);
    try {
      await mongoose.disconnect();
    } catch (_) {}
    isConnected = false;
  }
}

beforeAll(async () => {
  await setupTestDatabase();
}, 120000);

afterAll(async () => {
  await cleanupTestDatabase();
}, 120000);

// Suppress console logs in CI
if (process.env.CI === "true") {
  console.log = jest.fn();
  console.error = jest.fn();
  console.warn = jest.fn();
}
