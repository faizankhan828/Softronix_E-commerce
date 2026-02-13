const mongoose = require("mongoose");

const storeSettingsSchema = new mongoose.Schema(
  {
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
    // Notification settings (email notifications disabled)
    notifications: {
      stockAlerts: {
        type: Boolean,
        default: true,
      },
    },
    // Security settings
    security: {
      sessionTimeout: {
        type: Number,
        default: 30,
      },
      passwordExpiry: {
        type: Number,
        default: 90,
      },
    },
  },
  {
    timestamps: true,
  }
);

// There should only be one store settings document
storeSettingsSchema.statics.getSettings = async function () {
  const settings = await this.findOne();
  if (settings) {
    return settings;
  }

  // If no settings exist, create default settings
  return await this.create({});
};

const StoreSettings = mongoose.model("StoreSettings", storeSettingsSchema);

module.exports = StoreSettings;
