const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const cartItemSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      default: () => uuidv4(),
    },
    productId: {
      type: String,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
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
      discountedPrice: mongoose.Schema.Types.Mixed,
      images: [String],
    },
  },
  {
    timestamps: true,
  }
);

const cartSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
    },
    items: [cartItemSchema],
    appliedCoupon: {
      couponId: String,
      code: String,
      discountAmount: Number,
      type: {
        type: String,
        enum: ["percentage", "fixed", "shipping"],
      },
    },
  },
  {
    timestamps: true,
    suppressReservedKeysWarning: true, // Suppress warnings about reserved keys
  }
);

// Method to add item to cart
cartSchema.methods.addItem = function (item) {
  this.items.push({
    ...item,
    _id: uuidv4(),
  });
};

const Cart = mongoose.model("Cart", cartSchema);

module.exports = Cart;
