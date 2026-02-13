import express from "express";
import {
  getProfile,
  updateProfile,
  deleteAccount,
  getProfileStats,
} from "../controllers/profileController.js";
import { protect, isVerified } from "../middleware/authMiddleware.js";

const router = express.Router();

// All routes are protected and require verification
router.use(protect);
router.use(isVerified);

router.route("/").get(getProfile).put(updateProfile).delete(deleteAccount);

router.get("/stats", getProfileStats);

export default router;
