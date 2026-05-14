// langchain.routes.js
import express from "express";
import {
  askKay,
  getChatSessions,
  getChatSessionMessages,
  deleteChatSession,
  setActiveChatSession,
  clearActiveChatSession,
} from "../controllers/langchain.controller.js";
import upload from "../middleware/uploadMiddleware.js";
// Note: checkUserLimits removed - askKay now uses credit system instead of API rate limits

const router = express.Router();

// @route   POST /api/langchain/ask-kay
// @desc    Send a message to the LangChain-powered assistant
// @access  Private (uses credit system, not API rate limits)
router.post(
  "/ask-kay",
  upload.single("file"), // parse optional file first
  askKay
);

// @route   GET /api/langchain/sessions
// @desc    Get all of the user's chat sessions
// @access  Private
router.get("/sessions", getChatSessions);

// @route   GET /api/langchain/sessions/:chatId
// @desc    Get the messages for a specific chat session
// @access  Private
router.get("/sessions/:chatId", getChatSessionMessages);

// @route   DELETE /api/langchain/sessions/:sessionId
// @desc    Delete a specific chat session
// @access  Private
router.delete("/sessions/:sessionId", deleteChatSession);

// Route to set a user's active chat session
router.patch("/ask-kay/sessions/:sessionId/active", setActiveChatSession);

// Route to clear a user's active chat session
router.delete("/ask-kay/sessions/active", clearActiveChatSession);

export default router;
