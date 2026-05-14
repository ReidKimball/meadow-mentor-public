import AiResponse from "../models/aiResponse.model.js";
import User from "../models/user.model.js";
import RecipeValidationLog from '../models/recipeValidationLog.model.js';

// @desc    Get all users who have AI responses
// @route   GET /api/admin/users-with-responses
// @access  Private/Admin
const getUsersWithResponses = async (req, res) => {
  try {
    // Find all distinct firebaseUIDs from the ai_responses collection
    const distinctFirebaseUIDs = await AiResponse.distinct("firebaseUID");

    if (!distinctFirebaseUIDs || distinctFirebaseUIDs.length === 0) {
      return res.json([]);
    }

    // Find all users matching the distinct firebaseUIDs
    const users = await User.find({
      firebaseUID: { $in: distinctFirebaseUIDs },
    }).select("firebaseUID email firstName lastName"); // Select fields to return

    res.json(users);
  } catch (error) {
    console.error("Error fetching users with AI responses:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Get AI responses based on filters
// @route   GET /api/admin/responses
// @access  Private/Admin
const getResponsesByFilter = async (req, res) => {
  try {
    const { firebaseUID, startDate, endDate, serviceType, saved } = req.query;

    if (!firebaseUID) {
      return res
        .status(400)
        .json({ message: "FirebaseUID is a required filter." });
    }

    let query = { firebaseUID };

    // Date range filter
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        query.createdAt.$lte = new Date(endDate);
      }
    }

    // Service type filter
    if (serviceType) {
      query.serviceType = serviceType;
    }

    // Saved status filter
    if (saved) {
      query.saved = saved === "true";
    }

    const responses = await AiResponse.find(query).sort({ createdAt: -1 }); // Sort by most recent

    res.json(responses);
  } catch (error) {
    console.error("Error fetching AI responses by filter:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Delete an AI response
// @route   DELETE /api/admin/responses/:id
// @access  Private/Admin
const deleteResponse = async (req, res) => {
  try {
    const response = await AiResponse.findById(req.params.id);

    if (response) {
      await response.deleteOne();
      res.json({ message: "AI response removed" });
    } else {
      res.status(404).json({ message: "AI response not found" });
    }
  } catch (error) {
    console.error("Error deleting AI response:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Get recipe validation logs with pagination
// @route   GET /api/admin/recipe-validation-logs
// @access  Private/Admin
const getRecipeValidationLogs = async (req, res) => {
  try {
    const { page = 1, limit = 20, isCompliant } = req.query;

    const query = {};
    if (isCompliant !== undefined) {
      query.isCompliant = isCompliant === 'true';
    }

    const logs = await RecipeValidationLog.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('userId', 'firstName lastName email') // Optionally populate user info
      .exec();

    const count = await RecipeValidationLog.countDocuments(query);

    res.json({
      logs,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page, 10),
    });
  } catch (error) {
    console.error('Error fetching recipe validation logs:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export { getUsersWithResponses, getResponsesByFilter, deleteResponse, getRecipeValidationLogs };
