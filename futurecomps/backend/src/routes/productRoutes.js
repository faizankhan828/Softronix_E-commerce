import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { adminOnly } from "../middleware/adminMiddleware.js";
import {
  getProducts,
  getFeaturedProducts,
  getCategories,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getAllProductsAdmin,
  addReview,
} from "../controllers/productController.js";

const router = express.Router();

// ── Public ──────────────────────────────────────────────
router.get("/", getProducts);
router.get("/featured", getFeaturedProducts); // Must be before /:id
router.get("/categories", getCategories);

// ── Admin (must be before /:id to avoid catch-all) ──────
router.get("/admin/all", protect, adminOnly, getAllProductsAdmin);

// ── Public (param routes) ──────────────────────────────
router.get("/:id", getProductById);

// ── Authenticated ───────────────────────────────────────
router.post("/:id/reviews", protect, addReview);

// ── Admin CRUD ──────────────────────────────────────────
router.post("/", protect, adminOnly, createProduct);
router.put("/:id", protect, adminOnly, updateProduct);
router.delete("/:id", protect, adminOnly, deleteProduct);

export default router;
