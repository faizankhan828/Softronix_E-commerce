import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  createCheckoutFromCart,
  createSingleProductCheckout,
  handleWebhook,
  getMyOrders,
  getOrderById,
} from "../controllers/checkoutController.js";

const router = express.Router();

// ── Webhook (raw body — must be before express.json()) ──
router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  handleWebhook,
);

// ── Authenticated ───────────────────────────────────────
router.post(
  "/create-checkout-session",
  express.json(),
  protect,
  createCheckoutFromCart,
);
router.post(
  "/create-single-checkout",
  express.json(),
  protect,
  createSingleProductCheckout,
);
router.get("/orders", protect, getMyOrders);
router.get("/orders/:id", protect, getOrderById);

export default router;
