import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    userName: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, default: "" },
  },
  { timestamps: true },
);

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
      index: true,
    },
    description: {
      type: String,
      required: [true, "Product description is required"],
    },
    price: {
      type: Number,
      required: [true, "Product price is required"],
      min: 0,
    },
    discountedPrice: {
      type: Number,
      default: null,
      min: 0,
    },
    currency: {
      type: String,
      default: "usd",
      lowercase: true,
    },
    category: {
      type: String,
      required: [true, "Product category is required"],
      trim: true,
      index: true,
    },
    attributes: {
      colors: [{ type: String, trim: true }],
      sizes: [{ type: String, trim: true }],
    },
    imageUrl: {
      type: String,
      default: "",
    },
    images: [{ type: String }],
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    reviewCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    reviews: [reviewSchema],
    stock: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    inStock: {
      type: Boolean,
      default: true,
    },
    tags: [{ type: String, trim: true, lowercase: true }],
    occasion: [{ type: String, trim: true, lowercase: true }],
    vibe: [{ type: String, trim: true, lowercase: true }],

    // Hidden pricing for negotiation — never exposed to public APIs
    hiddenBottomPrice: {
      type: Number,
      default: null,
      min: 0,
    },
    negotiationEnabled: {
      type: Boolean,
      default: false,
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    isNew: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

// Text index for search
productSchema.index({
  name: "text",
  description: "text",
  category: "text",
  tags: "text",
  occasion: "text",
  vibe: "text",
});

// Compound index for filtering
productSchema.index({ category: 1, price: 1, isActive: 1 });

// Pre-save: sync inStock with stock count, recalculate rating
productSchema.pre("save", function (next) {
  this.inStock = this.stock > 0;
  if (this.reviews && this.reviews.length > 0) {
    const total = this.reviews.reduce((sum, r) => sum + r.rating, 0);
    this.rating = Math.round((total / this.reviews.length) * 10) / 10;
    this.reviewCount = this.reviews.length;
  }
  next();
});

const Product = mongoose.model("Product", productSchema);

export default Product;
