import express from "express";
import {
  getPublicStoreSettings,
  updateStoreSettings,
  updateNotificationSettings,
  updateSecuritySettings,
} from "../controllers/settingsController.js";
import { protect } from "../middleware/authMiddleware.js";
import { adminOnly } from "../middleware/adminMiddleware.js";

const router = express.Router();

// Public endpoint — no auth required
router.get("/public/store", getPublicStoreSettings);

// Admin-only endpoints
router.put("/admin/store", protect, adminOnly, updateStoreSettings);
router.put("/admin/notifications", protect, adminOnly, updateNotificationSettings);
router.put("/admin/security", protect, adminOnly, updateSecuritySettings);

export default router;
