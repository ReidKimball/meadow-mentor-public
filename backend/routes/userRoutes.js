/**
 * @file userRoutes.js
 * @description User-related routes for the Meadow-Mentor API.
 * @author Reid Kimball
 * @date 2025-07-17
 */

import express from 'express';
import multer from 'multer';
const router = express.Router();
import { completeOnboarding, uploadProfileImage } from '../controllers/userController.js';
import { verifyFirebaseToken } from '../middleware/authMiddleware.js';

// Configure multer for memory storage
const upload = multer({ storage: multer.memoryStorage() }); 

/**
 * @route   PUT /api/users/complete-onboarding
 * @desc    Marks the user's onboarding process as complete.
 * @access  Private
 * @middleware verifyFirebaseToken - Ensures the user is authenticated through Firebase.
 */
router.route('/complete-onboarding').put(verifyFirebaseToken, completeOnboarding);

/**
 * @route   POST /api/users/profile-image
 * @desc    Upload or update user profile image
 * @access  Private
 * @middleware verifyFirebaseToken - Ensures the user is authenticated through Firebase.
 * @middleware upload.single('image') - Handles file upload with multer
 */
router.route('/profile-image').post(verifyFirebaseToken, upload.single('image'), uploadProfileImage);

export default router;
