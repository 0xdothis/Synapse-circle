import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "..", ".env") });

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/safewalk";

async function dropCollections() {
  try {
    console.log(`📦 Connecting to MongoDB at: ${MONGODB_URI}`);
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected");

    const collections = ["users", "otps", "trustedcontacts"];

    for (const name of collections) {
      try {
        await mongoose.connection.collection(name).drop();
        console.log(`✅ Dropped collection: ${name}`);
      } catch (e) {
        if (e.code === 26) {
          console.log(`ℹ️ Collection ${name} doesn't exist, skipping`);
        } else {
          console.log(`⚠️ Error dropping ${name}: ${e.message}`);
        }
      }
    }

    console.log("🎉 All collections dropped successfully!");
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
  }
}

await dropCollections();
