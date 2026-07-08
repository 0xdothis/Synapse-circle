// scripts/seed.js
import mongoose from "mongoose";
import dotenv from "dotenv";
import CampusSecurity from "../src/models/CampusSecurity.js";
import EmergencyDirectory from "../src/models/EmergencyDirectory.js";

dotenv.config();

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Clear existing data
    await CampusSecurity.deleteMany({});
    await EmergencyDirectory.deleteMany({});
    console.log("🧹 Cleared existing data");

    // Seed Campus Security
    const securityContacts = [
      {
        name: "Campus Security Main Desk",
        phoneNumber: "08134490997",
        email: "thanksayo@gmail.com",
        location: "Main Building, Ground Floor",
        coordinates: { latitude: 37.7749, longitude: -122.4194 },
        isPrimary: true,
        description: "24/7 Campus Security Main Desk",
        operatingHours: "24/7",
      },
      {
        name: "Campus Security Night Patrol",
        phoneNumber: "07070749664",
        email: "thanksagbebble@gmail.com",
        location: "Security Booth, Gate A",
        coordinates: { latitude: 37.775, longitude: -122.4195 },
        isPrimary: false,
        description: "Night Patrol Unit",
        operatingHours: "9:00 PM - 6:00 AM",
      },
    ];

    await CampusSecurity.insertMany(securityContacts);
    console.log("✅ Campus Security seeded");

    // Seed Emergency Directory
    const emergencyContacts = [
      {
        type: "security",
        name: "University Police Department",
        phoneNumber: "",
        email: "thanksayo@gmail.com",
        address: "University Police Station, Campus Road",
        coordinates: { latitude: 37.7751, longitude: -122.4196 },
        isVerified: true,
        description: "Campus Police Department",
        operatingHours: "24/7",
      },
      {
        type: "hospital",
        name: "University Health Center",
        phoneNumber: "+1234567893",
        address: "Health Center Building, Campus",
        coordinates: { latitude: 37.7752, longitude: -122.4197 },
        isVerified: true,
        description: "Campus Health Services",
        operatingHours: "8:00 AM - 8:00 PM",
      },
      {
        type: "hospital",
        name: "City General Hospital",
        phoneNumber: "+1234567894",
        address: "123 Main Street, City",
        coordinates: { latitude: 37.7753, longitude: -122.4198 },
        isVerified: true,
        description: "Nearest Hospital Emergency Room",
        operatingHours: "24/7",
      },
      {
        type: "police",
        name: "City Police Department",
        phoneNumber: "+1234567895",
        address: "456 Police Plaza, City",
        coordinates: { latitude: 37.7754, longitude: -122.4199 },
        isVerified: true,
        description: "City Police Department",
        operatingHours: "24/7",
      },
      {
        type: "ambulance",
        name: "City Ambulance Service",
        phoneNumber: "+1234567896",
        address: "789 Emergency Lane, City",
        coordinates: { latitude: 37.7755, longitude: -122.42 },
        isVerified: true,
        description: "Emergency Ambulance Service",
        operatingHours: "24/7",
      },
      {
        type: "fire",
        name: "City Fire Department",
        phoneNumber: "+1234567897",
        address: "321 Fire Station Road, City",
        coordinates: { latitude: 37.7756, longitude: -122.4201 },
        isVerified: true,
        description: "Emergency Fire Service",
        operatingHours: "24/7",
      },
    ];

    await EmergencyDirectory.insertMany(emergencyContacts);
    console.log("✅ Emergency Directory seeded");

    console.log("🎉 Seeding completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
};

await seedData();
