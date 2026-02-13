import express from "express";
import {
  upload,
  uploadImage,
  getAuthParameters,
  deleteImage,
} from "../controllers/uploadController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// All routes require authentication
router.use(protect);

// Get authentication parameters for client-side upload
router.get("/auth", getAuthParameters);

// Upload image (server-side upload)
router.post("/image", upload.single("image"), uploadImage);

// Delete image
router.delete("/:fileId", deleteImage);

export default router;
