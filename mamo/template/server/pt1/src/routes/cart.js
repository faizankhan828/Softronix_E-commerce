"use strict";
const express = require("express");
const {
  optionalAuthenticateToken,
  authenticateToken,
  verifyCsrfToken,
  rateLimit,
} = require("../middleware/auth");
const cartController = require("../controllers/cartController");

const router = express.Router();

// Apply CSRF protection to all routes except GET requests
router.use(verifyCsrfToken);

// Apply rate limiting to cart operations
const cartRateLimit = rateLimit(20, 1 * 60 * 1000); // 20 attempts per minute

// Read operations can use optional authentication
router.get("/", optionalAuthenticateToken, cartController.getCart);
router.get(
  "/details",
  optionalAuthenticateToken,
  cartController.getCartDetails
);
router.get(
  "/check-inventory",
  optionalAuthenticateToken,
  cartController.checkInventory
);

// Write operations require authentication for logged-in users
// but will still work for guests via local storage
router.post(
  "/",
  optionalAuthenticateToken,
  cartRateLimit,
  cartController.addToCart
);
router.put(
  "/:itemId",
  optionalAuthenticateToken,
  cartRateLimit,
  cartController.updateCartItem
);
router.delete(
  "/:itemId",
  optionalAuthenticateToken,
  cartRateLimit,
  cartController.removeFromCart
);
router.delete(
  "/",
  optionalAuthenticateToken,
  cartRateLimit,
  cartController.clearCart
);

// Sync operation requires authentication
router.post("/sync", authenticateToken, cartRateLimit, cartController.syncCart);

module.exports = router;
