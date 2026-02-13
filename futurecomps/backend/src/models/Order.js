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
    // Alias for total (used by COD orders)
    totalAmount: {
      type: Number,
      get: function() { return this.total; },
      set: function(v) { this.total = v; },
    },
    currency: {
      type: String,
      default: "usd",
      lowercase: true,
    },
    // Payment method
    paymentMethod: {
      type: String,
      enum: ["card", "cod", "online"],
      default: "card",
    },
    // Payment status
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
    },
    // Unique order ID for tracking
    orderId: {
      type: String,
      unique: true,
      sparse: true,
    },
    stripeSessionId: {
      type: String,
      unique: true,
      sparse: true, // Allows null values, unique when present
      default: null,
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
      fullName: { type: String, default: "" },
      name: { type: String, default: "" }, // Legacy field
      addressLine1: { type: String, default: "" },
      addressLine2: { type: String, default: "" },
      line1: { type: String, default: "" }, // Legacy field
      line2: { type: String, default: "" }, // Legacy field
      city: { type: String, default: "" },
      state: { type: String, default: "" },
      postalCode: { type: String, default: "" },
      country: { type: String, default: "" },
      phone: { type: String, default: "" },
    },
    // Package tracking fields
    tracking: {
      trackingNumber: { type: String, default: null },
      carrier: { 
        type: String, 
        enum: ["fedex", "ups", "usps", "dhl", "other", null],
        default: null 
      },
      estimatedDelivery: { type: Date, default: null },
      currentLocation: { type: String, default: null },
      lastUpdate: { type: Date, default: null },
      history: [{
        status: { type: String, required: true },
        location: { type: String, default: "" },
        description: { type: String, default: "" },
        timestamp: { type: Date, default: Date.now },
      }],
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
