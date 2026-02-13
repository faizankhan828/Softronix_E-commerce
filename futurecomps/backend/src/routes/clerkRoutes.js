import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  searchProducts,
  inventoryCheck,
  getRecommendations,
  generateCoupon,
  getUserContext,
} from "../controllers/clerkController.js";

const router = express.Router();

// All clerk routes require authentication
router.use(protect);

// Search products (for AI context — includes hidden pricing data)
router.post("/search", searchProducts);

// Check inventory/availability
router.post("/inventory-check", inventoryCheck);

// Get personalized recommendations
router.get("/recommendations", getRecommendations);

// Generate negotiation coupon (AI haggle mode)
router.post("/generate-coupon", generateCoupon);

// Get user context (cart + purchase history for AI)
router.get("/user-context", getUserContext);

export default router;
