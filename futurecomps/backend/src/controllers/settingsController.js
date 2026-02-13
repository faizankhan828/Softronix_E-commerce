import Settings from "../models/Settings.js";

// @desc    Get store settings (public)
// @route   GET /api/settings/public/store
// @access  Public
export const getPublicStoreSettings = async (req, res) => {
  try {
    const settings = await Settings.getSettings();
    res.json({
      storeName: settings.storeName,
      storeEmail: settings.storeEmail,
      storePhone: settings.storePhone,
      storeAddress: settings.storeAddress,
      currency: settings.currency,
      taxRate: settings.taxRate,
      notifications: settings.notifications,
      security: settings.security,
    });
  } catch (error) {
    console.error("Get public store settings error:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update store settings
// @route   PUT /api/settings/admin/store
// @access  Private/Admin
export const updateStoreSettings = async (req, res) => {
  try {
    const { storeName, storeEmail, storePhone, storeAddress, currency, taxRate } = req.body;

    const settings = await Settings.getSettings();

    if (storeName !== undefined) settings.storeName = storeName;
    if (storeEmail !== undefined) settings.storeEmail = storeEmail;
    if (storePhone !== undefined) settings.storePhone = storePhone;
    if (storeAddress !== undefined) settings.storeAddress = storeAddress;
    if (currency !== undefined) settings.currency = currency;
    if (taxRate !== undefined) settings.taxRate = taxRate;

    await settings.save();

    res.json({
      storeName: settings.storeName,
      storeEmail: settings.storeEmail,
      storePhone: settings.storePhone,
      storeAddress: settings.storeAddress,
      currency: settings.currency,
      taxRate: settings.taxRate,
      notifications: settings.notifications,
      security: settings.security,
    });
  } catch (error) {
    console.error("Update store settings error:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update notification settings
// @route   PUT /api/settings/admin/notifications
// @access  Private/Admin
export const updateNotificationSettings = async (req, res) => {
  try {
    const { stockAlerts, emailNotifications, orderConfirmations, marketingEmails } = req.body;

    const settings = await Settings.getSettings();

    if (stockAlerts !== undefined) settings.notifications.stockAlerts = stockAlerts;
    if (emailNotifications !== undefined) settings.notifications.emailNotifications = emailNotifications;
    if (orderConfirmations !== undefined) settings.notifications.orderConfirmations = orderConfirmations;
    if (marketingEmails !== undefined) settings.notifications.marketingEmails = marketingEmails;

    settings.markModified("notifications");
    await settings.save();

    res.json({
      storeName: settings.storeName,
      storeEmail: settings.storeEmail,
      storePhone: settings.storePhone,
      storeAddress: settings.storeAddress,
      currency: settings.currency,
      taxRate: settings.taxRate,
      notifications: settings.notifications,
      security: settings.security,
    });
  } catch (error) {
    console.error("Update notification settings error:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update security settings
// @route   PUT /api/settings/admin/security
// @access  Private/Admin
export const updateSecuritySettings = async (req, res) => {
  try {
    const { sessionTimeout, passwordExpiry } = req.body;

    const settings = await Settings.getSettings();

    if (sessionTimeout !== undefined) settings.security.sessionTimeout = sessionTimeout;
    if (passwordExpiry !== undefined) settings.security.passwordExpiry = passwordExpiry;

    settings.markModified("security");
    await settings.save();

    res.json({
      storeName: settings.storeName,
      storeEmail: settings.storeEmail,
      storePhone: settings.storePhone,
      storeAddress: settings.storeAddress,
      currency: settings.currency,
      taxRate: settings.taxRate,
      notifications: settings.notifications,
      security: settings.security,
    });
  } catch (error) {
    console.error("Update security settings error:", error);
    res.status(500).json({ message: error.message });
  }
};
