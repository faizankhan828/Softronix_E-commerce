import mongoose from "mongoose";

const carouselItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
  title: String,
  subTitle: String,
  description: String,
  mainImage: String,
  detailImage: String,
  lightBackground: String,
  darkBackground: String,
  accentColor: String,
  darkAccentColor: String,
  price: String,
  material: String,
  model: String,
  collection: String,
  displayOrder: { type: Number, default: 0 },
});

const featuredCategorySchema = new mongoose.Schema({
  name: String,
  image: String,
  description: String,
  link: String,
  displayOrder: { type: Number, default: 0 },
});

const shopBenefitSchema = new mongoose.Schema({
  title: String,
  description: String,
  icon: String,
});

const homepageSettingsSchema = new mongoose.Schema(
  {
    carousel: {
      items: [carouselItemSchema],
      autoplay: { type: Boolean, default: true },
      autoplaySpeed: { type: Number, default: 5000 },
    },
    featuredCategories: [featuredCategorySchema],
    newArrivalsCount: { type: Number, default: 8 },
    sustainableFashion: {
      title: { type: String, default: "Sustainable Fashion" },
      description: { type: String, default: "We believe in sustainable fashion..." },
      features: [String],
      image: String,
    },
    shopBenefits: {
      items: [shopBenefitSchema],
    },
    newsletter: {
      title: { type: String, default: "Subscribe to our newsletter" },
      description: { type: String, default: "Get the latest updates..." },
    },
  },
  { timestamps: true }
);

const HomepageSettings = mongoose.model("HomepageSettings", homepageSettingsSchema);

export default HomepageSettings;
