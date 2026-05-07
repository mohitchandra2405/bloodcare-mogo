require("dotenv").config();

const mongoose = require("mongoose");
const connectDatabase = require("../config/db");
const { resetAndSeedData } = require("../data/bootstrap");

async function seedDatabase() {
  try {
    await connectDatabase();
    await resetAndSeedData();
    console.log("MongoDB seed completed successfully.");
  } catch (error) {
    console.error("MongoDB seed failed.", error);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
}

seedDatabase();
