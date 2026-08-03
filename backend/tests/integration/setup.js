import dotenv from "dotenv";
import mongoose from "mongoose";
import { jest, beforeAll, afterAll } from "@jest/globals";

// Load test environment variables
dotenv.config({ path: ".env.test" });

process.env.NODE_ENV = "test";
process.env.DISABLE_EMAIL_SENDING = "true";
process.env.DISABLE_RATE_LIMITING = "true";

// Increase timeout for integration tests
jest.setTimeout(60000);

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
    console.log("🧪 Integration test MongoDB connected");
  } catch (error) {
    console.error("🧪 Integration test MongoDB connection error:", error);
    throw error;
  }
}

async function disconnectDB() {
  if (!isConnected) return;

  try {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
    isConnected = false;
    console.log("🧪 Integration test MongoDB disconnected");
  } catch (error) {
    console.error("🧪 Integration test cleanup error:", error);
  }
}

beforeAll(async () => {
  await connectDB();
});

afterAll(async () => {
  await disconnectDB();
});

// Suppress console logs in CI
if (process.env.CI === "true") {
  console.log = jest.fn();
  console.error = jest.fn();
  console.warn = jest.fn();
}
