"use strict";
const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

// Define the schema for a product in the wishlist
const ProductSchema = new mongoose.Schema(
  {
    id: String,
    name: String,
    price: Number,
    discountedPrice: mongoose.Schema.Types.Mixed,
    images: [String],
  },
  { _id: false }
);

// Define the schema for a wishlist item
const WishlistItemSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      default: () => uuidv4(),
    },
    productId: {
      type: String,
      required: true,
    },
    product: ProductSchema,
    addedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Define the schema for the wishlist
const WishlistSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
    },
    items: [WishlistItemSchema],
  },
  {
    timestamps: true,
  }
);

// Method to add item to wishlist
WishlistSchema.methods.addItem = function (item) {
  this.items.push({
    ...item,
    _id: uuidv4(),
    addedAt: new Date(),
  });
};

// Create and export the Wishlist model
const Wishlist = mongoose.model("Wishlist", WishlistSchema);

module.exports = Wishlist;
