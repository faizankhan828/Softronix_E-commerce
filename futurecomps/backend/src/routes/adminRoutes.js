import express from "express";
import {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  getStats,
  bulkUpdateUsers,
  getAllOrders,
  updateOrderStatus,
  getNegotiationCoupons,
  setBottomPrice,
} from "../controllers/adminController.js";
import { protect } from "../middleware/authMiddleware.js";
import { adminOnly } from "../middleware/adminMiddleware.js";

const router = express.Router();

// All routes require authentication and admin role
router.use(protect, adminOnly);

// Admin statistics (users, products, orders, revenue, coupons)
router.get("/stats", getStats);

// User management
router.get("/users", getAllUsers);
router.get("/users/:id", getUserById);
router.put("/users/:id", updateUser);
router.delete("/users/:id", deleteUser);

// Bulk operations
router.post("/users/bulk-update", bulkUpdateUsers);

// Order management
router.get("/orders", getAllOrders);
router.put("/orders/:id/status", updateOrderStatus);

// Negotiation / Pricing controls
router.get("/negotiation-coupons", getNegotiationCoupons);
router.put("/products/:id/pricing", setBottomPrice);

export default router;
