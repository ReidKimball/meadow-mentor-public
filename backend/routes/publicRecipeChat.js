import express from 'express';
import rateLimit from 'express-rate-limit';
import * as publicRecipeChatController from '../controllers/publicRecipeChat.controller.js';
import { verifyFirebaseToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// 10 messages per IP per hour as requested
const chatRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: {
    error: "You've reached your chat limit for this hour. Please sign up to continue chatting or try again later."
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * @route POST /api/public-recipe-chat
 * @desc Ask Chef Kay a question about a public recipe
 * @access Public
 */
router.post('/', chatRateLimit, publicRecipeChatController.publicRecipeChat);
router.get('/session/:sessionId', publicRecipeChatController.getPublicChatHistory);

router.post('/claim', verifyFirebaseToken, publicRecipeChatController.claimPublicRecipeAdaptations);

/**
 * @route POST /api/public-recipe-chat/recipes/:id/generate-image
 * @desc Generate an image for a public-chat-adapted recipe
 * @access Public (rate limited)
 */
router.post('/recipes/:id/generate-image', chatRateLimit, publicRecipeChatController.generatePublicRecipeImage);

export default router;
