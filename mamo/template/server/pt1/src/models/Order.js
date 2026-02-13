"use strict";
const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

// Schema for order items (products)
const orderItemSchema = new mongoose.Schema({
  productId: {
    type: String,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  price: {
    type: Number,
    required: true,
  },
  size: {
    type: String,
    required: true,
  },
  color: {
    type: String,
    required: true,
  },
  product: {
    id: String,
    name: String,
    price: Number,
    image: String,
  },
});

// Schema for address information
const addressSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    addressLine1: {
      type: String,
      required: true,
    },
    addressLine2: {
      type: String,
    },
    city: {
      type: String,
      required: true,
    },
    state: {
      type: String,
      required: true,
    },
    postalCode: {
      type: String,
      required: true,
    },
    country: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
  },
  { _id: false }
);

// Main order schema
const orderSchema = new mongoose.Schema(
  {
    // Use orderId as a business identifier that's more user-friendly
    orderId: {
      type: String,
      default: function () {
        return uuidv4();
      },
      unique: true,
      required: true,
    },
    userId: {
      type: String,
      required: true,
      index: true,
    },
    items: [orderItemSchema],
    shippingAddress: addressSchema,
    billingAddress: addressSchema,
    paymentMethod: {
      type: String,
      required: true,
      enum: ["credit_card", "paypal", "cash_on_delivery", "jazz_cash"],
    },
    paymentDetails: {
      type: Object,
      default: {},
    },
    jazzCashDetails: {
      transactionCode: {
        type: String,
        default: function () {
          // Generate a unique transaction code for Jazz Cash payments
          return (
            "JC-" +
            Math.random().toString(36).substring(2, 8).toUpperCase() +
            "-" +
            Date.now().toString().substring(6)
          );
        },
      },
      accountNumber: {
        type: String,
        default: "",
      },
      paymentImage: {
        type: String,
        default: "",
      },
      paymentConfirmed: {
        type: Boolean,
        default: false,
      },
    },
    subtotal: {
      type: Number,
      required: true,
    },
    tax: {
      type: Number,
      required: true,
    },
    shippingCost: {
      type: Number,
      required: true,
    },
    discount: {
      type: Number,
      default: 0,
    },
    coupon: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    total: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      required: true,
      enum: [
        "pending",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
        "refunded",
      ],
      default: "pending",
    },
    notes: {
      type: String,
      default: "",
    },
    trackingNumber: {
      type: String,
      default: "",
    },
    estimatedDelivery: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

const Order = mongoose.model("Order", orderSchema);

module.exports = Order;
