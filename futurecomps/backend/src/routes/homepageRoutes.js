import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { adminOnly as admin } from "../middleware/adminMiddleware.js";
import {
  getHomepageSettings,
  updateHomepageSettings,
  getCarouselItems,
  addProductToCarousel,
  removeProductFromCarousel,
  updateCarouselItem,
  getProductsForCarousel,
} from "../controllers/homepageController.js";

const router = express.Router();

router.get("/settings", getHomepageSettings);
router.put("/settings", protect, admin, updateHomepageSettings);

router.get("/carousel", getCarouselItems);
router.post("/carousel", protect, admin, addProductToCarousel);
router.delete("/carousel/:productId", protect, admin, removeProductFromCarousel);
router.put("/carousel/:productId", protect, admin, updateCarouselItem);

router.get("/carousel/products", protect, admin, getProductsForCarousel);

export default router;
