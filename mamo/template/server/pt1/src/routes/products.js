const express = require("express");
const { authenticateToken, authorizeAdmin } = require("../middleware/auth");
const productController = require("../controllers/productController");

const router = express.Router();

// Public routes
router.get("/", productController.getAllProducts);
router.get("/featured", productController.getFeaturedProducts);
router.get("/new-arrivals", productController.getNewArrivals);
router.get("/categories", productController.getProductCategories);
router.get("/:id", productController.getProductById);
router.get("/:id/inventory", productController.checkInventory);

// Protected routes - require authentication
router.post(
  "/:id/reviews",
  authenticateToken,
  productController.addProductReview
);

// Admin routes - require admin privileges
router.post(
  "/",
  authenticateToken,
  authorizeAdmin,
  productController.createProduct
);
router.put(
  "/:id",
  authenticateToken,
  authorizeAdmin,
  productController.updateProduct
);
router.delete(
  "/:id",
  authenticateToken,
  authorizeAdmin,
  productController.deleteProduct
);

module.exports = router;
