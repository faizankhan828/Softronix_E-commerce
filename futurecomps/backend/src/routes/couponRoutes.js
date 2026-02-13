import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { adminOnly } from "../middleware/adminMiddleware.js";
import {
  createCoupon,
  getAllCoupons,
  deactivateCoupon,
  validateCoupon,
  applyCouponToCart,
  removeCouponFromCart,
} from "../controllers/couponController.js";

const router = express.Router();

// ── Admin ───────────────────────────────────────────────
router.post("/", protect, adminOnly, createCoupon);
router.get("/", protect, adminOnly, getAllCoupons);
router.put("/:id/deactivate", protect, adminOnly, deactivateCoupon);

// ── Authenticated ───────────────────────────────────────
router.post("/validate", protect, validateCoupon);
router.post("/apply", protect, applyCouponToCart);
router.post("/remove", protect, removeCouponFromCart);

export default router;
