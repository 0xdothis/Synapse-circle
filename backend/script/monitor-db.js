import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "..", ".env") });

async function monitorDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const db = mongoose.connection.db;

    console.log("\n📊 DATABASE MONITORING");
    console.log("=".repeat(50));

    // Collection stats
    const collections = await db.listCollections().toArray();
    console.log(`\n📚 Collections: ${collections.length}`);

    for (const coll of collections) {
      const stats = await db
        .collection(coll.name)
        .aggregate([{ $collStats: { storageStats: {} } }])
        .toArray();

      const storageStats = stats[0]?.storageStats || {};

      console.log(`\n📄 ${coll.name}:`);
      console.log(`   Documents: ${storageStats.count || 0}`);
      console.log(
        `   Size: ${((storageStats.size || 0) / 1024 / 1024).toFixed(2)} MB`,
      );
      console.log(`   Indexes: ${storageStats.nindexes || 0}`);
      console.log(
        `   Index Size: ${((storageStats.totalIndexSize || 0) / 1024 / 1024).toFixed(2)} MB`,
      );

      // Check indexes
      const indexes = await db.collection(coll.name).indexes();
      console.log(
        `   Indexes: ${indexes.map((i) => Object.keys(i.key).join(",")).join(" | ")}`,
      );
    }

    // Server status
    try {
      const serverStatus = await db.command({ serverStatus: 1 });
      console.log(`\n🖥️ Server Status:`);
      console.log(
        `   Connections: ${serverStatus.connections.current}/${serverStatus.connections.available}`,
      );
      console.log(
        `   Uptime: ${Math.floor(serverStatus.uptime / 60 / 60)} hours`,
      );
    } catch (e) {
      console.log(`\n⚠️ Could not get server status: ${e.message}`);
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
  }
}

await monitorDB();
