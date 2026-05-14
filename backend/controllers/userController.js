import User from '../models/user.model.js';
import sharp from 'sharp';
import { uploadBufferToGCS, deleteFileFromGCS } from '../utils/gcs.js';

// @desc    Mark user's onboarding as complete
// @route   PUT /api/users/complete-onboarding
// @access  Private
export const completeOnboarding = async (req, res) => {
  try {
    // req.user.uid should be populated by an authentication middleware
    const user = await User.findOne({ firebaseUID: req.user.uid });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Mark onboarding as complete
    if (!user.onboarding) {
      user.onboarding = {};
    }
    user.onboarding.onboardingComplete = true;

    // With the schema type as Mixed, we can now reliably check and convert the paymentStatus.
    if (typeof user.paymentStatus !== 'object' || user.paymentStatus === null) {
      user.paymentStatus = { status: 'free', plan: 'basic' };
      // Explicitly mark the path as modified for Mongoose.
      user.markModified('paymentStatus');
    }

    await user.save();

    res.status(200).json({ message: "Onboarding completed successfully." });
  } catch (error) {
    console.warn(`Error completing onboarding:`, error);
    res.status(500).json({ message: "Error completing onboarding", error: error.message });
  }
};

// @desc    Upload user profile image
// @route   POST /api/users/profile-image
// @access  Private
export const uploadProfileImage = async (req, res) => {
  try {
    // Validate file exists
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (req.file.size > maxSize) {
      return res.status(400).json({ message: 'File size exceeds 5MB limit' });
    }

    // Validate file type
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedMimeTypes.includes(req.file.mimetype)) {
      return res.status(400).json({ message: 'Invalid file type. Only JPEG, PNG, and WebP are allowed' });
    }

    // Get user from database
    const user = await User.findOne({ firebaseUID: req.user.uid });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Delete old profile image from GCS if it exists
    if (user.profileImageUrl) {
      try {
        // Extract the GCS path from the URL
        // URL format: https://storage.googleapis.com/meadow_mentor_public_media/images/users/...
        const urlParts = user.profileImageUrl.split('meadow_mentor_public_media/');
        if (urlParts.length > 1) {
          const oldImagePath = urlParts[1];
          await deleteFileFromGCS(oldImagePath);
          console.log(`Deleted old profile image: ${oldImagePath}`);
        }
      } catch (deleteError) {
        console.error('Error deleting old profile image:', deleteError);
        // Continue with upload even if deletion fails
      }
    }

    // Process image: resize to 240x240 and convert to WebP
    const timestamp = Date.now();
    const filename = `profile_${timestamp}.webp`;
    const destination = `images/users/${user._id}/${filename}`;

    // Use sharp to resize and convert to WebP
    const buffer = await sharp(req.file.buffer)
      .resize(240, 240, { fit: 'cover', position: 'center' })
      .webp({ quality: 85 })
      .toBuffer();

    // Upload to GCS (usePrefix=false to skip GenAI_RecipeCardHero prefix)
    const imageUrl = await uploadBufferToGCS(buffer, destination, false);

    // Update user document with new profile image URL
    user.profileImageUrl = imageUrl;
    await user.save();

    res.status(200).json({
      message: 'Profile image uploaded successfully',
      profileImageUrl: imageUrl
    });
  } catch (error) {
    console.error('Error uploading profile image:', error);
    res.status(500).json({
      message: 'Error uploading profile image',
      error: error.message
    });
  }
};
