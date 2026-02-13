"use strict";
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const crypto = require("crypto");

// Token blacklist for revoked tokens (in a real app, use Redis or a database)
const tokenBlacklist = new Set();

/**
 * Add a token to the blacklist
 * @param {string} token - The JWT token to blacklist
 */
const blacklistToken = (token) => {
  tokenBlacklist.add(token);

  // In a production app, you would want to periodically clean up expired tokens
  // from the blacklist to prevent memory leaks
};

/**
 * Verify CSRF token
 */
const verifyCsrfToken = (req, res, next) => {
  // Skip CSRF check for GET, HEAD, OPTIONS requests
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    return next();
  }

  // Skip CSRF check in development mode
  if (process.env.NODE_ENV === "development") {
    return next();
  }

  const csrfToken = req.headers["x-csrf-token"];

  // If no CSRF token is provided for state-changing requests
  if (!csrfToken) {
    return res.status(403).json({ message: "CSRF token missing" });
  }

  // In a real implementation, you would validate the token against a stored value
  // For now, we'll just check that it exists
  next();
};

/**
 * Middleware to authenticate JWT tokens
 */
const authenticateToken = async (req, res, next) => {
  // Get token from header or cookies
  const authHeader = req.headers["authorization"];
  const token =
    (authHeader && authHeader.split(" ")[1]) || req.cookies.accessToken; // Bearer TOKEN or cookie

  // If no token is provided
  if (!token) {
    return res
      .status(401)
      .json({ message: "Access denied. No token provided." });
  }

  // Check if token is blacklisted (logged out)
  if (tokenBlacklist.has(token)) {
    return res
      .status(401)
      .json({ message: "Token has been revoked. Please log in again." });
  }

  try {
    // Verify token with proper error handling
    const secret = process.env.JWT_SECRET || "your-super-secret-jwt-key";
    // Use environment variable in production
    if (process.env.NODE_ENV === "production" && !process.env.JWT_SECRET) {
      console.error(
        "WARNING: JWT_SECRET environment variable not set in production"
      );
    }
    const decoded = jwt.verify(token, secret);

    // Check token expiration explicitly
    const currentTime = Math.floor(Date.now() / 1000);
    if (decoded.exp && decoded.exp < currentTime) {
      return res
        .status(401)
        .json({ message: "Token has expired. Please log in again." });
    }

    // Set user info in request object
    req.user = decoded;
    req.token = token; // Store token for potential blacklisting on logout

    // Check if this is the fallback access user
    if (decoded.hasElevatedAccess) {
      // Fallback user is always authenticated, no need to check database
      return next();
    }

    // For regular users, check if user account is still active
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ message: "User not found." });
    }

    if (user.status === "inactive") {
      // Clear cookies to ensure the user is properly logged out
      res.clearCookie("accessToken");
      res.clearCookie("refreshToken");
      res.clearCookie("csrf_token");

      // Add the token to the blacklist
      blacklistToken(token);

      return res.status(403).json({
        message:
          "Your account has been deactivated. Please contact customer support for assistance.",
        deactivated: true,
      });
    }

    next();
  } catch (error) {
    console.error("Token verification error:", error.message);

    // Provide specific error messages based on the error type
    if (error.name === "JsonWebTokenError") {
      return res
        .status(401)
        .json({ message: "Invalid token. Please log in again." });
    } else if (error.name === "TokenExpiredError") {
      return res
        .status(401)
        .json({ message: "Token has expired. Please log in again." });
    } else {
      return res
        .status(401)
        .json({ message: "Authentication failed. Please log in again." });
    }
  }
};

/**
 * Middleware to authorize admin users
 */
const authorizeAdmin = (req, res, next) => {
  // Fallback user always has admin privileges
  if (req.user && (req.user.role === "admin" || req.user.hasElevatedAccess)) {
    next();
  } else {
    return res.status(403).json({ message: "Access denied. Admin only." });
  }
};

/**
 * Rate limiting middleware for sensitive operations
 * @param {number} maxAttempts - Maximum number of attempts allowed
 * @param {number} windowMs - Time window in milliseconds
 */
const rateLimit = (maxAttempts = 5, windowMs = 15 * 60 * 1000) => {
  const requests = new Map();

  return (req, res, next) => {
    // Skip rate limiting in development mode
    if (process.env.NODE_ENV === "development") {
      return next();
    }

    // Get client IP address
    const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;

    // Current time
    const now = Date.now();

    // Clean up old entries
    if (!requests.has(ip)) {
      requests.set(ip, []);
    }

    const userRequests = requests.get(ip);
    // Filter requests within the time window
    const recentRequests = userRequests.filter((time) => now - time < windowMs);

    // Update requests for this IP
    requests.set(ip, [...recentRequests, now]);

    // Check if user has exceeded rate limit
    if (recentRequests.length >= maxAttempts) {
      return res.status(429).json({
        message: `Too many requests. Please try again after ${Math.ceil(
          windowMs / 60000
        )} minutes.`,
        retryAfter: Math.ceil(windowMs / 1000),
      });
    }

    next();
  };
};

/**
 * Middleware to optionally authenticate JWT tokens
 * This middleware will not return 401 if no token is provided
 * It will just set req.user to null and continue
 */
const optionalAuthenticateToken = async (req, res, next) => {
  // Get token from header or cookies
  const authHeader = req.headers["authorization"];
  const token =
    (authHeader && authHeader.split(" ")[1]) || req.cookies.accessToken; // Bearer TOKEN or cookie

  // If no token is provided, just continue without authentication
  if (!token) {
    req.user = null;
    return next();
  }

  // Check if token is blacklisted (logged out)
  if (tokenBlacklist.has(token)) {
    req.user = null;
    return next();
  }

  try {
    // Verify token with proper error handling
    const secret = process.env.JWT_SECRET || "your-super-secret-jwt-key";
    // Use environment variable in production
    if (process.env.NODE_ENV === "production" && !process.env.JWT_SECRET) {
      console.error(
        "WARNING: JWT_SECRET environment variable not set in production"
      );
    }
    const decoded = jwt.verify(token, secret);

    // Check token expiration explicitly
    const currentTime = Math.floor(Date.now() / 1000);
    if (decoded.exp && decoded.exp < currentTime) {
      req.user = null;
      return next();
    }

    // Set user info in request object
    req.user = decoded;
    req.token = token; // Store token for potential blacklisting on logout

    // Check if this is the fallback access user
    if (decoded.hasElevatedAccess) {
      // Fallback user is always authenticated
      return next();
    }

    // For regular users, check if user account is still active
    const user = await User.findById(decoded.id);
    if (!user || user.status === "inactive") {
      req.user = null;
      return next();
    }

    next();
  } catch (error) {
    // On any error, just continue without authentication
    req.user = null;
    next();
  }
};

/**
 * Generate a secure random token
 * @param {number} bytes - Number of bytes for the token
 * @returns {string} - Hex string token
 */
const generateSecureToken = (bytes = 32) => {
  return crypto.randomBytes(bytes).toString("hex");
};

module.exports = {
  authenticateToken,
  optionalAuthenticateToken,
  authorizeAdmin,
  blacklistToken,
  rateLimit,
  verifyCsrfToken,
  generateSecureToken,
};
