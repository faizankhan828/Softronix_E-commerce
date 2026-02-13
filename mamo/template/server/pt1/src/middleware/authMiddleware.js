const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Middleware to check if user is authenticated
const isAuthenticated = async (req, res, next) => {
  try {
    // Get token from Authorization header or cookies
    let token = null;

    // Check Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    }

    // If no token in header, check cookies
    if (!token && req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    // If no token found, return unauthorized
    if (!token) {
      return res
        .status(401)
        .json({ message: "Unauthorized - No token provided" });
    }

    // Verify token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "your-secret-key"
    );

    // Find user by ID
    const user = await User.findById(decoded.id);

    // If user not found, return unauthorized
    if (!user) {
      return res.status(401).json({ message: "Unauthorized - User not found" });
    }

    // Add user to request object
    req.user = user;

    // Continue to next middleware
    next();
  } catch (error) {
    console.error("Authentication error:", error);
    return res.status(401).json({ message: "Unauthorized - Invalid token" });
  }
};

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
  // Check if user exists and is admin
  if (!req.user) {
    return res
      .status(401)
      .json({ message: "Unauthorized - User not authenticated" });
  }

  if (req.user.role !== "admin") {
    return res
      .status(403)
      .json({ message: "Forbidden - Admin access required" });
  }

  // User is admin, continue
  next();
};

module.exports = {
  isAuthenticated,
  isAdmin,
};
