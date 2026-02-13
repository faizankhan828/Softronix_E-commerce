const StoreSettings = require("../models/StoreSettings");
const User = require("../models/User");

// Get store settings
const getStoreSettings = async (req, res) => {
  try {
    const settings = await StoreSettings.getSettings();
    res.json(settings);
  } catch (error) {
    console.error("Error fetching store settings:", error);

    // Return default settings if database is not available
    const defaultSettings = {
      storeName: "My E-Commerce Store",
      storeEmail: "contact@mystore.com",
      storePhone: "+1 (555) 123-4567",
      storeAddress: "123 Main St, City, Country",
      currency: "USD",
      taxRate: 7.5,
      notifications: {
        stockAlerts: true,
      },
      security: {
        sessionTimeout: 30,
        passwordExpiry: 90,
      },
    };

    res.json(defaultSettings);
  }
};

// Update store settings
const updateStoreSettings = async (req, res) => {
  try {
    const {
      storeName,
      storeEmail,
      storePhone,
      storeAddress,
      currency,
      taxRate,
    } = req.body;

    let settings = await StoreSettings.getSettings();

    // Update fields if provided
    if (storeName !== undefined) settings.storeName = storeName;
    if (storeEmail !== undefined) settings.storeEmail = storeEmail;
    if (storePhone !== undefined) settings.storePhone = storePhone;
    if (storeAddress !== undefined) settings.storeAddress = storeAddress;
    if (currency !== undefined) settings.currency = currency;
    if (taxRate !== undefined) settings.taxRate = taxRate;

    await settings.save();
    res.json(settings);
  } catch (error) {
    console.error("Error updating store settings:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update notification settings
const updateNotificationSettings = async (req, res) => {
  try {
    const {
      emailNotifications,
      orderConfirmations,
      stockAlerts,
      marketingEmails,
    } = req.body;

    let settings = await StoreSettings.getSettings();

    // Update notification fields if provided
    if (emailNotifications !== undefined)
      settings.notifications.emailNotifications = emailNotifications;
    if (orderConfirmations !== undefined)
      settings.notifications.orderConfirmations = orderConfirmations;
    if (stockAlerts !== undefined)
      settings.notifications.stockAlerts = stockAlerts;
    if (marketingEmails !== undefined)
      settings.notifications.marketingEmails = marketingEmails;

    await settings.save();
    res.json(settings);
  } catch (error) {
    console.error("Error updating notification settings:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update security settings
const updateSecuritySettings = async (req, res) => {
  try {
    const { sessionTimeout, passwordExpiry } = req.body;

    let settings = await StoreSettings.getSettings();

    // Update security fields if provided
    if (sessionTimeout !== undefined)
      settings.security.sessionTimeout = sessionTimeout;
    if (passwordExpiry !== undefined)
      settings.security.passwordExpiry = passwordExpiry;

    await settings.save();
    res.json(settings);
  } catch (error) {
    console.error("Error updating security settings:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update user preferences
const updateUserPreferences = async (req, res) => {
  try {
    const { newsletter, marketing, accountActivity } = req.body;

    // Find user
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update preferences if provided
    if (newsletter !== undefined) user.preferences.newsletter = newsletter;
    if (marketing !== undefined) user.preferences.marketing = marketing;
    if (accountActivity !== undefined)
      user.preferences.accountActivity = accountActivity;

    await user.save();
    res.json({
      preferences: user.preferences,
      message: "Preferences updated successfully",
    });
  } catch (error) {
    console.error("Error updating user preferences:", error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  getStoreSettings,
  updateStoreSettings,
  updateNotificationSettings,
  updateSecuritySettings,
  updateUserPreferences,
};
