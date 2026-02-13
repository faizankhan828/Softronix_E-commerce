import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  syncCart,
} from "../controllers/cartController.js";

const router = express.Router();

// All cart routes require authentication
router.use(protect);

router.get("/", getCart);
router.post("/add", addToCart);
router.put("/update", updateCartItem);
router.delete("/remove/:itemId", removeFromCart);
router.delete("/clear", clearCart);
router.post("/sync", syncCart);

export default router;
