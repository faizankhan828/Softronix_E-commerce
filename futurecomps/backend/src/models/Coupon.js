import mongoose from "mongoose";

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, "Coupon code is required"],
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    discountType: {
      type: String,
      enum: ["percentage", "fixed"],
      required: true,
    },
    discountValue: {
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
      default: null, // null = no cap
    },
    expiresAt: {
      type: Date,
      default: null, // null = never expires
    },
    usageLimit: {
      type: Number,
      default: null, // null = unlimited
    },
    usedCount: {
      type: Number,
      default: 0,
    },
    usedBy: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        usedAt: { type: Date, default: Date.now },
      },
    ],
    onePerUser: {
      type: Boolean,
      default: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    // Track origin: "manual" (admin created) or "negotiation" (AI haggle)
    source: {
      type: String,
      enum: ["manual", "negotiation"],
      default: "manual",
    },
    // For negotiation coupons: which user + product
    negotiationMeta: {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        default: null,
      },
      reason: { type: String, default: "" },
    },
    // Stripe coupon/promotion code IDs (synced on creation)
    stripeCouponId: {
      type: String,
      default: null,
    },
    stripePromotionCodeId: {
      type: String,
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

// Check if coupon is currently valid
couponSchema.methods.isValid = function (cartSubtotal, userId) {
  if (!this.isActive) return { valid: false, reason: "Coupon is inactive" };

  if (this.expiresAt && new Date() > this.expiresAt) {
    return { valid: false, reason: "Coupon has expired" };
  }

  if (this.usageLimit !== null && this.usedCount >= this.usageLimit) {
    return { valid: false, reason: "Coupon usage limit reached" };
  }

  if (this.onePerUser && userId) {
    const alreadyUsed = this.usedBy.some(
      (u) => u.userId.toString() === userId.toString(),
    );
    if (alreadyUsed) {
      return { valid: false, reason: "You have already used this coupon" };
    }
  }

  if (cartSubtotal < this.minPurchase) {
    return {
      valid: false,
      reason: `Minimum purchase of $${this.minPurchase.toFixed(2)} required`,
    };
  }

  return { valid: true };
};

// Calculate the discount for a given subtotal
couponSchema.methods.calculateDiscount = function (subtotal) {
  let discount = 0;

  if (this.discountType === "percentage") {
    discount = subtotal * (this.discountValue / 100);
  } else if (this.discountType === "fixed") {
    discount = this.discountValue;
  }

  // Apply max discount cap
  if (this.maxDiscount !== null && discount > this.maxDiscount) {
    discount = this.maxDiscount;
  }

  // Never exceed subtotal
  discount = Math.min(discount, subtotal);

  return Math.round(discount * 100) / 100;
};

// Record usage
couponSchema.methods.recordUsage = function (userId) {
  this.usedCount += 1;
  if (userId) {
    this.usedBy.push({ userId });
  }
  return this.save();
};

const Coupon = mongoose.model("Coupon", couponSchema);

export default Coupon;
