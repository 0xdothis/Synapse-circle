import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "..", ".env") });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI not found in .env file");
  process.exit(1);
}

/**
 * Safely drop an index if it exists
 */
async function safeDropIndex(collection, indexName) {
  try {
    await collection.dropIndex(indexName);
    console.log(`✅ Dropped index: ${indexName}`);
    return true;
  } catch (error) {
    if (error.code === 27) {
      console.log(`ℹ️ Index ${indexName} doesn't exist`);
    } else {
      console.error(`❌ Failed to drop ${indexName}: ${error.message}`);
    }
    return false;
  }
}

/**
 * Safely create an index
 */
async function safeCreateIndex(collection, indexSpec, options = {}) {
  try {
    await collection.createIndex(indexSpec, options);
    const indexName = Array.isArray(indexSpec)
      ? indexSpec.map((i) => `${i[0]}_1`).join("_")
      : Object.keys(indexSpec).join("_");
    console.log(`✅ Created index: ${indexName}`);
    return true;
  } catch (error) {
    console.error(`❌ Could not create index: ${error.message}`);
    return false;
  }
}

/**
 * Optimize User collection indexes
 */
async function optimizeUserIndexes(users) {
  console.log("\n📊 Optimizing User collection indexes...");

  const indexes = await users.indexes();
  console.log(`📚 Existing User indexes: ${indexes.length}`);

  await safeDropIndex(users, "phoneNumber_1");
  await safeDropIndex(users, "email_1");
  await safeDropIndex(users, "createdAt_-1");

  await safeCreateIndex(users, { email: 1 }, { unique: true });
  await safeCreateIndex(users, { createdAt: -1 });
  await safeCreateIndex(users, { isVerified: 1, createdAt: -1 });
  await safeCreateIndex(users, { onboardingStep: 1 });
}

/**
 * Optimize OTP collection indexes
 */
async function optimizeOTPIndexes(otps) {
  console.log("\n📊 Optimizing OTP collection indexes...");

  const indexes = await otps.indexes();
  console.log(`📚 Existing OTP indexes: ${indexes.length}`);

  await safeDropIndex(otps, "expiresAt_1");
  await safeDropIndex(otps, "email_1_otpCode_1");

  await safeCreateIndex(otps, { email: 1 });
  await safeCreateIndex(otps, { expiresAt: 1 }, { expireAfterSeconds: 0 });
  await safeCreateIndex(otps, { isUsed: 1, expiresAt: 1 });
}

/**
 * Optimize TrustedContact collection indexes
 */
async function optimizeContactIndexes(contacts) {
  console.log("\n📊 Optimizing TrustedContact collection indexes...");

  await safeDropIndex(contacts, "userId_1_phoneNumber_1");

  await safeCreateIndex(contacts, { userId: 1, email: 1 }, { unique: true });
  await safeCreateIndex(contacts, { userId: 1, isActive: 1 });
  await safeCreateIndex(contacts, { isPrimary: 1 });
}

/**
 * Optimize SOSAlert collection indexes
 */
async function optimizeAlertIndexes(alerts) {
  console.log("\n📊 Optimizing SOSAlert collection indexes...");

  await safeCreateIndex(alerts, { userId: 1, createdAt: -1 });
  await safeCreateIndex(alerts, { status: 1, createdAt: -1 });
  await safeCreateIndex(alerts, { createdAt: -1 });
}

/**
 * Optimize RefreshToken collection indexes
 */
async function optimizeRefreshTokenIndexes(refreshTokens) {
  console.log("\n📊 Optimizing RefreshToken collection indexes...");

  await safeCreateIndex(refreshTokens, { jti: 1 }, { unique: true });
  await safeCreateIndex(refreshTokens, { userId: 1, revokedAt: 1 });
  await safeCreateIndex(
    refreshTokens,
    { expiresAt: 1 },
    { expireAfterSeconds: 0 },
  );
}

/**
 * Optimize EmergencyDirectory collection indexes
 */
async function optimizeEmergencyIndexes(emergency) {
  console.log("\n📊 Optimizing EmergencyDirectory collection indexes...");

  await safeCreateIndex(emergency, { type: 1, isActive: 1 });
  await safeCreateIndex(emergency, { coordinates: "2dsphere" });
  await safeCreateIndex(emergency, { isVerified: 1 });
}

/**
 * Optimize AlertRecipient collection indexes
 */
async function optimizeRecipientIndexes(recipients) {
  console.log("\n📊 Optimizing AlertRecipient collection indexes...");

  await safeCreateIndex(recipients, { alertId: 1 });
  await safeCreateIndex(recipients, { userId: 1, createdAt: -1 });
}

/**
 * Optimize CampusSecurity collection indexes
 */
async function optimizeSecurityIndexes(security) {
  console.log("\n📊 Optimizing CampusSecurity collection indexes...");

  await safeCreateIndex(security, { universityId: 1, isActive: 1 });
  await safeCreateIndex(security, { isActive: 1, isPrimary: 1 });
}

/**
 * Get collection info for summary
 */
async function getCollectionInfo(db, collectionName) {
  let collection = null;

  try {
    collection = db.collection(collectionName);
    const indexes = await collection.indexes();

    // Use $collStats for storage stats
    const stats = await collection
      .aggregate([{ $collStats: { storageStats: {} } }])
      .toArray();
    const storageStats = stats[0]?.storageStats || {};

    return {
      name: collectionName,
      indexes: indexes.length,
      indexNames: indexes.map((i) => Object.keys(i.key).join(", ")),
      documents: storageStats.count || 0,
      size: storageStats.size || 0,
    };
  } catch (error) {
    // Handle specific MongoDB errors
    if (error.code === 26 || error.codeName === "NamespaceNotFound") {
      console.log(`ℹ️ Collection ${collectionName} doesn't exist yet`);
    } else {
      console.log(
        `⚠️ Could not get info for ${collectionName}: ${error.message}`,
      );
    }

    return {
      name: collectionName,
      indexes: 0,
      indexNames: [],
      documents: 0,
      size: 0,
    };
  }
}

/**
 * Print summary of all collections
 */
async function printSummary(db) {
  console.log("\n" + "=".repeat(50));
  console.log("📊 INDEX OPTIMIZATION SUMMARY");
  console.log("=".repeat(50));

  const collectionNames = [
    "users",
    "otps",
    "trustedcontacts",
    "sosalerts",
    "refreshtokens",
    "emergencydirectories",
    "alertrecipients",
    "campusescurities",
  ];

  const allInfo = await Promise.all(
    collectionNames.map((name) => getCollectionInfo(db, name)),
  );

  allInfo.forEach((info) => {
    console.log(`\n📚 ${info.name}:`);
    console.log(`   Documents: ${info.documents.toLocaleString()}`);
    console.log(`   Size: ${(info.size / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   Indexes: ${info.indexes}`);
    if (info.indexNames.length > 0) {
      console.log(`   Index Names: ${info.indexNames.join(" | ")}`);
    }
  });

  console.log("\n🎉 Index optimization completed successfully!");
}

/**
 * Main optimization function
 */
async function optimizeIndexes() {
  let connection = null;

  try {
    console.log("📦 Connecting to MongoDB Atlas...");
    connection = await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB Atlas");

    const db = mongoose.connection.db;

    // Run all optimizations
    await optimizeUserIndexes(db.collection("users"));
    await optimizeOTPIndexes(db.collection("otps"));
    await optimizeContactIndexes(db.collection("trustedcontacts"));
    await optimizeAlertIndexes(db.collection("sosalerts"));
    await optimizeRefreshTokenIndexes(db.collection("refreshtokens"));
    await optimizeEmergencyIndexes(db.collection("emergencydirectories"));
    await optimizeRecipientIndexes(db.collection("alertrecipients"));
    await optimizeSecurityIndexes(db.collection("campusescurities"));

    // Print summary
    await printSummary(db);

    console.log("\n✅ All optimizations complete!");
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    if (connection) {
      await mongoose.disconnect().catch(() => {
        console.log("⚠️ Error disconnecting from MongoDB");
      });
    }
    process.exit(1);
  }
}

// Run the optimization
await optimizeIndexes();
