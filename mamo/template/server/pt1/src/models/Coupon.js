const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["percentage", "fixed", "shipping"],
      required: true,
    },
    value: {
      type: Number,
      required: true,
      min: 0,
    },
    minPurchase: {
      type: Number,
      default: 0,
      min: 0,
    },
    maxDiscount: {
      type: Number,
      default: null,
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: {
      type: Date,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    usageLimit: {
      type: Number,
      default: null, // null = unlimited
    },
    usageCount: {
      type: Number,
      default: 0,
    },
    applicableProducts: {
      type: [String], // Array of product IDs
      default: [], // Empty array = all products
    },
    excludedProducts: {
      type: [String], // Array of product IDs
      default: [],
    },
    applicableCategories: {
      type: [String], // Array of category names
      default: [],
    },
    userRestriction: {
      type: [String], // Array of user IDs
      default: [],
    },
    oneTimePerUser: {
      type: Boolean,
      default: false,
    },
    usedBy: {
      type: [String], // Array of user IDs who have used this coupon
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Method to check if a coupon is valid and can be applied
couponSchema.methods.isValid = function (userId, cartTotal) {
  const now = new Date();

  // Check if coupon is active
  if (!this.isActive) return false;

  // For admin-created coupons, we'll allow future dates for testing
  // Only check if the coupon has expired (endDate is in the past)
  if (now > this.endDate) return false;

  // Check minimum purchase requirement
  if (cartTotal < this.minPurchase) return false;

  // Check usage limit
  if (this.usageLimit !== null && this.usageCount >= this.usageLimit)
    return false;

  // Check one-time per user restriction
  if (this.oneTimePerUser && userId && this.usedBy.includes(userId))
    return false;

  // Check user restriction
  if (
    this.userRestriction.length > 0 &&
    userId &&
    !this.userRestriction.includes(userId)
  )
    return false;

  return true;
};

// Method to calculate discount amount
couponSchema.methods.calculateDiscount = function (cartTotal, items) {
  let discountAmount = 0;

  if (this.type === "percentage") {
    discountAmount = cartTotal * (this.value / 100);

    // Apply maximum discount cap if set
    if (this.maxDiscount !== null && discountAmount > this.maxDiscount) {
      discountAmount = this.maxDiscount;
    }
  } else if (this.type === "fixed") {
    discountAmount = this.value;

    // Ensure discount doesn't exceed cart total
    if (discountAmount > cartTotal) {
      discountAmount = cartTotal;
    }
  } else if (this.type === "shipping") {
    // For shipping discounts, the value is the shipping cost to deduct
    discountAmount = this.value;
  }

  return discountAmount;
};

// Method to apply coupon (increments usage and adds user to usedBy)
couponSchema.methods.apply = async function (userId) {
  // Increment usage count
  this.usageCount += 1;

  // Add user to usedBy array if oneTimePerUser is true and user hasn't used it yet
  if (userId && this.oneTimePerUser && !this.usedBy.includes(userId)) {
    this.usedBy.push(userId);
    console.log(`Added user ${userId} to usedBy array for coupon ${this.code}`);
  }

  // Save the coupon with updated usage information
  try {
    const savedCoupon = await this.save();
    console.log(
      `Coupon ${this.code} applied successfully. Usage count: ${this.usageCount}, UsedBy: ${this.usedBy.length} users`
    );
    return savedCoupon;
  } catch (error) {
    console.error(`Error saving coupon ${this.code} after applying:`, error);
    throw error;
  }
};

const Coupon = mongoose.model("Coupon", couponSchema);

module.exports = Coupon;
