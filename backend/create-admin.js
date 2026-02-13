import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./src/models/User.js";

dotenv.config();

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("MongoDB connected");

    // Find the first user and make them admin
    const user = await User.findOne({});

    if (!user) {
      console.log("No users found in database. Please register a user first.");
      process.exit(1);
    }

    user.role = "admin";
    user.isActive = true;
    await user.save();

    console.log(`✅ Admin user created successfully!`);
    console.log(`Email: ${user.email}`);
    console.log(`Role: ${user.role}`);
    console.log(`Active: ${user.isActive}`);

    process.exit(0);
  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }
};

createAdmin();
