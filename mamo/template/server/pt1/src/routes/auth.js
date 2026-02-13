const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const {
  authenticateToken,
  verifyCsrfToken,
  rateLimit,
} = require("../middleware/auth");
const crypto = require("crypto");
const { authenticator } = require("otplib");
const QRCode = require("qrcode");
const authController = require("../controllers/authController");

const router = express.Router();

// Apply CSRF protection to all routes except GET requests and token refresh
router.use((req, res, next) => {
  // Skip CSRF verification for refresh token endpoint
  if (req.path === "/refresh-token") {
    return next();
  }
  // Apply CSRF verification to all other routes
  verifyCsrfToken(req, res, next);
});

// Apply rate limiting to sensitive routes
const authRateLimit = rateLimit(5, 15 * 60 * 1000); // 5 attempts per 15 minutes

// Auth routes
router.post("/register", authRateLimit, authController.register);
router.post("/login", authRateLimit, authController.login);
// Email verification removed
router.post("/forgot-password", authRateLimit, authController.forgotPassword);
router.post("/reset-password", authRateLimit, authController.resetPassword);
router.get("/me", authenticateToken, authController.getCurrentUser); // GET request, no CSRF needed
router.post("/refresh-token", authController.refreshToken); // Token refresh endpoint
router.post("/2fa/setup", authenticateToken, authController.setupTwoFactor);
router.post("/2fa/enable", authenticateToken, authController.enableTwoFactor);
router.post("/2fa/verify", authRateLimit, authController.verifyTwoFactor);
router.post("/logout", authenticateToken, authController.logout);

// Update user profile
router.put("/profile", authenticateToken, authController.updateProfile);

// Change password
router.put(
  "/change-password",
  authenticateToken,
  authRateLimit, // Add rate limiting to password changes
  authController.changePassword
);

// Delete account
router.delete(
  "/account",
  authenticateToken,
  authRateLimit,
  authController.deleteAccount
);

// Two-factor authentication routes

// Disable 2FA
router.post("/2fa/disable", authenticateToken, authController.disableTwoFactor);

module.exports = router;
