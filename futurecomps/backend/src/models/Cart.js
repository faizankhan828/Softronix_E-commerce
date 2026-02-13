import mongoose from "mongoose";

const cartItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },
    // Snapshot of selected variant at time of add
    size: { type: String, default: null },
    color: { type: String, default: null },
    // Price snapshot so cart reflects price at add-time
    price: { type: Number, required: true },
  },
  { _id: true },
);

const cartSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    items: [cartItemSchema],
    appliedCoupon: {
      code: { type: String, default: null },
      discountType: {
        type: String,
        enum: ["percentage", "fixed", null],
        default: null,
      },
      discountValue: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
  },
);

// Virtual: subtotal before coupon
cartSchema.virtual("subtotal").get(function () {
  return this.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
});

// Virtual: discount amount
cartSchema.virtual("discount").get(function () {
  if (!this.appliedCoupon || !this.appliedCoupon.code) return 0;
  const sub = this.subtotal;
  if (this.appliedCoupon.discountType === "percentage") {
    return (
      Math.round(sub * (this.appliedCoupon.discountValue / 100) * 100) / 100
    );
  }
  if (this.appliedCoupon.discountType === "fixed") {
    return Math.min(this.appliedCoupon.discountValue, sub);
  }
  return 0;
});

// Virtual: total after discount
cartSchema.virtual("total").get(function () {
  return Math.max(0, Math.round((this.subtotal - this.discount) * 100) / 100);
});

// Ensure virtuals are included in JSON
cartSchema.set("toJSON", { virtuals: true });
cartSchema.set("toObject", { virtuals: true });

const Cart = mongoose.model("Cart", cartSchema);

export default Cart;
