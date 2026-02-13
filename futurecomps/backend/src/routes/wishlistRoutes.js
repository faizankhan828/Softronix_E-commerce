import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  clearWishlist,
  syncWishlist,
} from "../controllers/wishlistController.js";

const router = express.Router();

router.route("/").get(protect, getWishlist).post(protect, addToWishlist).delete(protect, clearWishlist);

router.post("/sync", protect, syncWishlist);
router.delete("/:itemId", protect, removeFromWishlist);

export default router;
