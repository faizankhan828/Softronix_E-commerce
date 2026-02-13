import mongoose from "mongoose";

const settingsSchema = new mongoose.Schema(
  {
    // Singleton key — only one document
    key: {
      type: String,
      default: "store",
      unique: true,
    },
    storeName: {
      type: String,
      default: "My E-Commerce Store",
    },
    storeEmail: {
      type: String,
      default: "contact@mystore.com",
    },
    storePhone: {
      type: String,
      default: "+1 (555) 123-4567",
    },
    storeAddress: {
      type: String,
      default: "123 Main St, City, Country",
    },
    currency: {
      type: String,
      default: "USD",
    },
    taxRate: {
      type: Number,
      default: 7.5,
    },
    notifications: {
      emailNotifications: { type: Boolean, default: true },
      orderConfirmations: { type: Boolean, default: true },
      stockAlerts: { type: Boolean, default: true },
      marketingEmails: { type: Boolean, default: false },
    },
    security: {
      sessionTimeout: { type: Number, default: 30 },
      passwordExpiry: { type: Number, default: 90 },
    },
  },
  { timestamps: true },
);

// Always return a settings document (upsert singleton)
settingsSchema.statics.getSettings = async function () {
  let settings = await this.findOne({ key: "store" });
  if (!settings) {
    settings = await this.create({ key: "store" });
  }
  return settings;
};

const Settings = mongoose.model("Settings", settingsSchema);
export default Settings;
