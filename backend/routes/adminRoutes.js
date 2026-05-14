import express from "express";
import {
  getUsersWithResponses,
  getResponsesByFilter,
  deleteResponse,
  getRecipeValidationLogs,
} from "../controllers/adminController.js";

const router = express.Router();

// All routes in this file are prefixed with /api/admin and are protected
// by verifyFirebaseToken and verifyAdmin middleware in server.js

router.route("/users-with-responses").get(getUsersWithResponses);
router.route("/responses").get(getResponsesByFilter);
router.route("/responses/:id").delete(deleteResponse);
router.route("/recipe-validation-logs").get(getRecipeValidationLogs);

export default router;
