import mongoose from "mongoose";
import { logger } from "../utils/logger.js";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("MONGODB_URI is required");
}

const connectionOptions = {
  // Connection pool settings
  maxPoolSize: 10,
  minPoolSize: 2,
  maxIdleTimeMS: 30000,
  socketTimeoutMS: 45000,
  connectTimeoutMS: 10000,
  serverSelectionTimeoutMS: 5000,
  heartbeatFrequencyMS: 10000,
  retryWrites: true,
  retryReads: true,
};

// Enable Mongoose debug in development
if (process.env.NODE_ENV === "development") {
  mongoose.set("debug", (collectionName, method, query, doc) => {
    logger.debug(`Mongoose: ${collectionName}.${method}`, { query, doc });
  });
}

// Enable query sanitization
mongoose.set("sanitizeFilter", true);

// Enable strict query mode
mongoose.set("strictQuery", true);

let isConnected = false;

export const connectDB = async () => {
  if (isConnected) {
    logger.info("Using existing MongoDB connection");
    return;
  }

  try {
    const connection = await mongoose.connect(MONGODB_URI, connectionOptions);
    isConnected = true;

    // Connection events
    mongoose.connection.on("connected", () => {
      logger.info("MongoDB connected successfully");
    });

    mongoose.connection.on("error", (err) => {
      logger.error("MongoDB connection error:", err);
    });

    mongoose.connection.on("disconnected", () => {
      logger.warn("MongoDB disconnected");
      isConnected = false;
    });

    // Handle application termination
    process.on("SIGINT", async () => {
      await mongoose.connection.close();
      logger.info("MongoDB connection closed due to app termination");
      process.exit(0);
    });

    logger.info("MongoDB connection established", {
      host: connection.connection.host,
      database: connection.connection.name,
      poolSize: connectionOptions.maxPoolSize,
    });

    return connection;
  } catch (error) {
    logger.error("MongoDB connection error:", error);
    throw error;
  }
};

export const getConnection = () => mongoose.connection;
export default { connectDB, getConnection };
