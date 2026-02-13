import express from "express";
import {
  getExamples,
  getExampleById,
  createExample,
  updateExample,
  deleteExample,
} from "../controllers/exampleController.js";

const router = express.Router();

router.route("/").get(getExamples).post(createExample);

router
  .route("/:id")
  .get(getExampleById)
  .put(updateExample)
  .delete(deleteExample);

export default router;
