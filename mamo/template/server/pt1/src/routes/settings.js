const express = require("express");
const {
  authenticateToken,
  authorizeAdmin,
  optionalAuthenticateToken,
} = require("../middleware/auth");
const settingsController = require("../controllers/settingsController");

const router = express.Router();

// Public route for store settings - no authentication required
router.get("/public/store", settingsController.getStoreSettings);

// Routes below require authentication
router.use("/admin", authenticateToken);
router.use("/preferences", authenticateToken);

// Store settings routes (admin only)
router.get("/admin/store", authorizeAdmin, settingsController.getStoreSettings);
router.put(
  "/admin/store",
  authorizeAdmin,
  settingsController.updateStoreSettings
);

// Notification settings routes (admin only)
router.put(
  "/admin/notifications",
  authorizeAdmin,
  settingsController.updateNotificationSettings
);

// Security settings routes (admin only)
router.put(
  "/admin/security",
  authorizeAdmin,
  settingsController.updateSecuritySettings
);

// User preferences routes (for any authenticated user)
router.put("/preferences", settingsController.updateUserPreferences);

// Keep the old routes for backward compatibility
router.get(
  "/store",
  optionalAuthenticateToken,
  settingsController.getStoreSettings
);

module.exports = router;
