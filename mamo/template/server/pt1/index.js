"use strict";
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const mongoose_1 = __importDefault(require("mongoose"));
const cookieParser = require("cookie-parser");
const auth_1 = __importDefault(require("./src/routes/auth"));
const products_1 = __importDefault(require("./src/routes/products"));
const cart_1 = __importDefault(require("./src/routes/cart"));
const wishlist_1 = __importDefault(require("./src/routes/wishlist"));
const orders_1 = __importDefault(require("./src/routes/orders"));
const users_1 = __importDefault(require("./src/routes/users"));
const coupons_1 = __importDefault(require("./src/routes/coupons"));
const stats_1 = __importDefault(require("./src/routes/statsRoutes"));
const settings_1 = __importDefault(require("./src/routes/settings"));
const homepage_1 = __importDefault(require("./src/routes/homepage"));
const userAddresses_1 = __importDefault(require("./src/routes/userAddresses"));
// Email routes removed
// Load environment variables
dotenv_1.default.config({ path: path_1.default.join(__dirname, ".env") });
// Verify environment variables are loaded (without exposing secrets)
console.log(
  "Environment variables loaded. NODE_ENV:",
  process.env.NODE_ENV || "development"
);
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000; // Using default port 5000
// Connect to MongoDB with proper error handling
const connectDB = async () => {
  try {
    await mongoose_1.default.connect(process.env.MONGODB_URI, {
      // Maximum number of connections in the pool
      maxPoolSize: 10,
      // Timeout for server selection (increased to 45 seconds)
      serverSelectionTimeoutMS: 45000,
      // Socket timeout (increased to 45 seconds)
      socketTimeoutMS: 45000,
      // Connection timeout (increased to 30 seconds)
      connectTimeoutMS: 30000,
    });
    console.log("MongoDB connected successfully");
  } catch (err) {
    console.log("MongoDB connection error:", err.message);
    // Don't exit the process, let it continue with error handling
  }
};

// Initialize database connection
connectDB();
// Middleware
app.use(
  (0, cors_1.default)({
    origin: [
      "http://localhost:3000",
      "http://localhost:5173",
      "http://localhost:5174",
      "https://khioneind.vercel.app",
    ], // Add your frontend origins
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    credentials: true, // Important for cookies to work cross-origin
  })
); // Enable CORS with specific configuration
app.use(express_1.default.json()); // Parse JSON request bodies
app.use(cookieParser(process.env.COOKIE_SECRET || "secure-cookie-secret")); // Parse cookies
// Serve static files (for favicon and other assets)
app.use(express_1.default.static(path_1.default.join(__dirname, "public")));
// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
  // Capture response
  const originalSend = res.send;
  res.send = function (body) {
    console.log(
      `Response for ${req.method} ${req.originalUrl} - Status: ${res.statusCode}`
    );
    return originalSend.call(this, body);
  };
  next();
});
// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
});

// Routes
app.use("/api/auth", auth_1.default);
app.use("/api/products", products_1.default);
app.use("/api/cart", cart_1.default);
app.use("/api/coupons", coupons_1.default);
app.use("/api/wishlist", wishlist_1.default);
app.use("/api/orders", orders_1.default);
app.use("/api/users", users_1.default);
app.use("/api/stats", stats_1.default);
app.use("/api/settings", settings_1.default);
app.use("/api/homepage", homepage_1.default);
app.use("/api/addresses", userAddresses_1.default);
// Email routes removed
// Handle common browser requests to prevent 404 errors
app.get(["/favicon.ico", "/favicon.png"], (req, res) => {
  res.setHeader("Cache-Control", "public, max-age=86400"); // Cache for 1 day
  res.status(204).end(); // No content response - prevents 404
});

// Handle robots.txt
app.get("/robots.txt", (req, res) => {
  res.setHeader("Content-Type", "text/plain");
  res.setHeader("Cache-Control", "public, max-age=86400");
  res.sendFile(path_1.default.join(__dirname, "public", "robots.txt"));
});

// Handle apple-touch-icon requests (common on mobile)
app.get("/apple-touch-icon*.png", (req, res) => {
  res.setHeader("Cache-Control", "public, max-age=86400");
  res.status(204).end(); // No content response
});

// Handle manifest.json
app.get("/manifest.json", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", "public, max-age=3600");
  res.sendFile(path_1.default.join(__dirname, "public", "manifest.json"));
});

// Root route for API status check
app.get("/api", (req, res) => {
  res.json({ status: "API is running", version: "1.0.0" });
});
// Database connection check middleware
app.use((req, res, next) => {
  if (mongoose_1.default.connection.readyState !== 1) {
    console.log("Database not connected, attempting to reconnect...");
    // You can still proceed, but log the issue
  }
  next();
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Server error:", err);

  // Handle MongoDB connection errors specifically
  if (err.name === "MongooseError" || err.message.includes("MongoDB")) {
    return res.status(503).json({
      message: "Database temporarily unavailable",
      error: "Please try again later",
    });
  }

  res
    .status(500)
    .json({ message: "Internal server error:", error: err.message });
});
// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
