import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
  size: { type: String, default: null },
  color: { type: String, default: null },
  imageUrl: { type: String, default: "" },
});

const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    items: {
      type: [orderItemSchema],
      required: true,
      validate: {
        validator: (v) => v.length > 0,
        message: "Order must have at least one item",
      },
    },
    subtotal: {
      type: Number,
      required: true,
    },
    discount: {
      type: Number,
      default: 0,
    },
    couponCode: {
      type: String,
      default: null,
    },
    total: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: "usd",
      lowercase: true,
    },
    stripeSessionId: {
      type: String,
      required: true,
      unique: true,
    },
    stripePaymentIntentId: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: [
        "pending",
        "paid",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
        "refunded",
      ],
      default: "pending",
    },
    shippingAddress: {
      name: { type: String, default: "" },
      line1: { type: String, default: "" },
      line2: { type: String, default: "" },
      city: { type: String, default: "" },
      state: { type: String, default: "" },
      postalCode: { type: String, default: "" },
      country: { type: String, default: "" },
    },
  },
  {
    timestamps: true,
  },
);

// Index for admin dashboard queries
orderSchema.index({ status: 1, createdAt: -1 });

const Order = mongoose.model("Order", orderSchema);

export default Order;
