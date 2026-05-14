import express from 'express';
import { getFirstHealingMeal, completeFirstHealingMeal, skipQuickStart, completeAskKayIntro, getAskKayIntro } from '../controllers/onboarding.controller.js';
import { verifyFirebaseToken as protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// @route   GET /api/onboarding/first-healing-meal
// @desc    Get the first healing meal for the user
// @access  Private
router.get('/first-healing-meal', protect, getFirstHealingMeal);

// @route   POST /api/onboarding/first-healing-meal/complete
// @desc    Mark the first healing meal step as complete
// @access  Private
router.post('/first-healing-meal/complete', protect, completeFirstHealingMeal);

// @route   POST /api/onboarding/skip-quick-start
// @desc    Mark the Quick Start guide as skipped
// @access  Private
router.post('/skip-quick-start', protect, skipQuickStart);

// @route   PATCH /api/onboarding/ask-kay-intro-complete
// @desc    Mark the Ask Kay intro as shown
// @access  Private
router.patch('/ask-kay-intro-complete', protect, completeAskKayIntro);

// @route   GET /api/onboarding/ask-kay-intro
// @desc    Get the Chef Kay intro message
// @access  Private
router.get('/ask-kay-intro', protect, getAskKayIntro);

export default router;
