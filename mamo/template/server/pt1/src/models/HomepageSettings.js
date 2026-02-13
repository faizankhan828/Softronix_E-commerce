const mongoose = require("mongoose");

// Define the schema for carousel items
const carouselItemSchema = new mongoose.Schema(
  {
    productId: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    subTitle: {
      type: String,
      default: "",
    },
    description: {
      type: String,
      default: "",
    },
    mainImage: {
      type: String,
      required: true,
    },
    detailImage: {
      type: String,
      required: true,
    },
    lightBackground: {
      type: String,
      default: "#F5F5F7",
    },
    darkBackground: {
      type: String,
      default: "#0A0A0B",
    },
    accentColor: {
      type: String,
      default: "#6E44FF",
    },
    darkAccentColor: {
      type: String,
      default: "#8F6FFF",
    },
    price: {
      type: String,
      required: true,
    },
    material: {
      type: String,
      default: "",
    },
    model: {
      type: String,
      default: "",
    },
    collectionName: {
      type: String,
      default: "",
    },
    displayOrder: {
      type: Number,
      default: 0,
    },
  },
  { _id: false }
);

// Define the schema for featured categories
const featuredCategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    image: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: "",
    },
    link: {
      type: String,
      required: true,
    },
    displayOrder: {
      type: Number,
      default: 0,
    },
  },
  { _id: false }
);

// Define the schema for homepage settings
const homepageSettingsSchema = new mongoose.Schema(
  {
    carousel: {
      items: {
        type: [carouselItemSchema],
        default: [],
      },
      autoplay: {
        type: Boolean,
        default: true,
      },
      autoplaySpeed: {
        type: Number,
        default: 5000,
      },
    },
    featuredCategories: {
      type: [featuredCategorySchema],
      default: [],
    },
    newArrivalsCount: {
      type: Number,
      default: 6,
    },
    sustainableFashion: {
      title: {
        type: String,
        default: "Sustainable Fashion for a Better Tomorrow",
      },
      description: {
        type: String,
        default:
          "We're committed to creating high-quality, timeless pieces that are made to last. Our sustainable practices include using organic materials, ethical manufacturing, and reducing waste at every stage of production.",
      },
      features: {
        type: [String],
        default: [
          "100% Organic Cotton",
          "Eco-friendly Packaging",
          "Fair Trade Certified",
          "Carbon Neutral Shipping",
        ],
      },
      image: {
        type: String,
        default:
          "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?q=80&w=2070",
      },
    },
    shopBenefits: {
      items: {
        type: [
          {
            title: String,
            description: String,
            icon: String,
          },
        ],
        default: [
          {
            title: "Free Shipping",
            description: "Free shipping on all orders over $100",
            icon: "Truck",
          },
          {
            title: "Free Returns",
            description: "30-day return policy for all items",
            icon: "RefreshCw",
          },
          {
            title: "Secure Checkout",
            description: "Safe & protected online shopping experience",
            icon: "ShieldCheck",
          },
        ],
      },
    },
    newsletter: {
      title: {
        type: String,
        default: "Join Our Community",
      },
      description: {
        type: String,
        default:
          "Subscribe to our newsletter and be the first to know about new collections, exclusive offers and fashion inspiration.",
      },
    },
  },
  {
    timestamps: true,
    suppressReservedKeysWarning: true, // Suppress warnings about reserved keys
  }
);

// There should only be one homepage settings document
homepageSettingsSchema.statics.getSettings = async function () {
  const settings = await this.findOne();
  if (settings) {
    return settings;
  }

  // If no settings exist, create default settings
  return await this.create({});
};

const HomepageSettings = mongoose.model(
  "HomepageSettings",
  homepageSettingsSchema
);

module.exports = HomepageSettings;
