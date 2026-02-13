const express = require("express");
const { authenticateToken, authorizeAdmin } = require("../middleware/auth");
const homepageController = require("../controllers/homepageController");

const router = express.Router();

// Public routes
router.get("/settings", homepageController.getHomepageSettings);
router.get("/carousel", homepageController.getCarouselItems);

// Admin routes
router.put(
  "/settings",
  authenticateToken,
  authorizeAdmin,
  homepageController.updateHomepageSettings
);
router.post(
  "/carousel",
  authenticateToken,
  authorizeAdmin,
  homepageController.addProductToCarousel
);
router.delete(
  "/carousel/:productId",
  authenticateToken,
  authorizeAdmin,
  homepageController.removeProductFromCarousel
);
router.put(
  "/carousel/:productId",
  authenticateToken,
  authorizeAdmin,
  homepageController.updateCarouselItem
);
router.get(
  "/carousel/products",
  authenticateToken,
  authorizeAdmin,
  homepageController.getProductsForCarousel
);

module.exports = router;
