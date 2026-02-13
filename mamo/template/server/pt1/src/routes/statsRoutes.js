const express = require("express");
const router = express.Router();
const statsController = require("../controllers/statsController");
const { authenticateToken, authorizeAdmin } = require("../middleware/auth");

// Get dashboard statistics (admin only)
router.get(
  "/dashboard",
  authenticateToken,
  authorizeAdmin,
  statsController.getDashboardStats
);

// Get order statistics (admin only)
router.get(
  "/orders",
  authenticateToken,
  authorizeAdmin,
  statsController.getOrderStats
);

module.exports = router;
