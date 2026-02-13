const mongoose = require("mongoose");

// Define schema for reviews
const reviewSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
    },
    userId: {
      type: String,
      required: true,
    },
    userName: {
      type: String,
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      required: true,
    },
    createdAt: {
      type: String,
      default: () => new Date().toISOString(),
    },
  },
  { _id: false }
);

// Define main product schema
const productSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    discountedPrice: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
      validate: {
        validator: function (value) {
          return value === null || typeof value === "number";
        },
        message: "discountedPrice must be a number or null",
      },
    },
    images: {
      type: [String],
      required: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    colors: {
      type: [String],
      default: [],
    },
    sizes: {
      type: [String],
      default: [],
    },
    tags: {
      type: [String],
      default: [],
    },
    inStock: {
      type: Boolean,
      default: true,
    },
    inventory: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    isNew: {
      type: Boolean,
      default: false,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    rating: {
      type: Number,
      default: 0,
    },
    reviews: {
      type: [reviewSchema],
      default: [],
    },
    material: {
      type: String,
      default: "",
    },
    fit: {
      type: String,
      default: "",
    },
    care: {
      type: String,
      default: "",
    },
    origin: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
    suppressReservedKeysWarning: true, // Suppress warnings about reserved keys like 'isNew'
  }
);

// Define the product model
const Product = mongoose.model("Product", productSchema);

module.exports = Product;
