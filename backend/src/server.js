import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import mongoSanitize from "express-mongo-sanitize";
import rateLimit from "express-rate-limit";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";
import exampleRoutes from "./routes/exampleRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import pushRoutes from "./routes/push.js";
import todoRoutes from "./routes/todoRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import productRoutes from "./routes/productRoutes.js";

// Load environment variables
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Security Middleware
app.use(helmet()); // Set security headers
app.use(mongoSanitize()); // Prevent MongoDB injection

// Rate limiting for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: {
    message: "Too many login attempts, please try again after 15 minutes",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// General API rate limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    message: "Too many requests, please try again later",
  },
});

// Middleware
app.use(cors());

// Webhook route must be registered BEFORE express.json()
// because it needs the raw body for signature verification
app.use("/api/payment", paymentRoutes);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get("/", (req, res) => {
  res.json({ message: "Welcome to the API" });
});

// API Routes
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/profile", apiLimiter, profileRoutes);
app.use("/api/examples", apiLimiter, exampleRoutes);
app.use("/api/admin", apiLimiter, adminRoutes);
app.use("/api/upload", apiLimiter, uploadRoutes);
app.use("/api/push", apiLimiter, pushRoutes);
app.use("/api/todos", apiLimiter, todoRoutes);
app.use("/api/products", apiLimiter, productRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res
    .status(500)
    .json({ message: "Something went wrong!", error: err.message });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
