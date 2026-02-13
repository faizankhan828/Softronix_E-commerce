// Script to create a test coupon
const mongoose = require("mongoose");
const Coupon = require("../models/Coupon");
require("dotenv").config({ path: "../../../../.env" });

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI || "mongodb://localhost:27017/ecommerce")
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => {
    console.error("Error connecting to MongoDB:", err);
    process.exit(1);
  });

// Create a test coupon
async function createTestCoupon() {
  try {
    // Check if the test coupon already exists
    const existingCoupon = await Coupon.findOne({ code: "TEST20" });
    if (existingCoupon) {
      console.log("Test coupon already exists:", existingCoupon);
      mongoose.disconnect();
      return;
    }

    // Create a new coupon
    const now = new Date();
    const endDate = new Date();
    endDate.setDate(now.getDate() + 30); // Valid for 30 days

    const newCoupon = new Coupon({
      code: "TEST20",
      description: "Test coupon - 20% off",
      type: "percentage",
      value: 20,
      minPurchase: 10,
      maxDiscount: 100,
      startDate: now,
      endDate: endDate,
      isActive: true,
      usageLimit: 100,
      oneTimePerUser: false,
    });

    // Save the coupon
    const savedCoupon = await newCoupon.save();
    console.log("Test coupon created successfully:", savedCoupon);
  } catch (error) {
    console.error("Error creating test coupon:", error);
  } finally {
    mongoose.disconnect();
  }
}

createTestCoupon();
