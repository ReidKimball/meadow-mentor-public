import mongoose from "mongoose";

const aiResponseSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    ref: "User",
  },
  firebaseUID: {
    type: String,
    required: true,
    index: true, // Added index for faster user lookups
  },
  serviceType: {
    type: String,
    required: true,
    enum: [
      "journalAnalysis",
      "recipeGeneration",
      "mealConvert",
      "askKay",
      "mealPlanner",
      "checkIngredients",
      "analyzeMeal",
      "analyzeDoctorReport",
    ],
    index: true, // Added index for filtering by service
  },
  prompt: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },
  // --- NEW: Store the full prompt/context sent to the AI ---
  fullPrompt: {
    type: String, // Store the potentially very long full context
    required: false, // Make optional for older records
  },
  // --- NEW: Store just the user's message text for easier history reconstruction ---
  userMessageText: {
    type: String,
    default: null, // Null for initial analysis requests
  },
  response: {
    type: String,
    required: true,
  },
  // --- NEW: Link messages within the same conversation ---
  conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "AIResponse", // Self-reference or just keep as ObjectId
    index: true,
    default: null, // Null for responses not part of a conversation (or pre-update)
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  imageUrl: String,
  saved: {
    type: Boolean,
    default: false,
  },
});

// Index for admin queries: efficiently find a user's responses and sort by date.
aiResponseSchema.index({ firebaseUID: 1, createdAt: -1 });

// --- Optional: Compound index for fetching specific conversation history ---
aiResponseSchema.index({ conversationId: 1, createdAt: 1 });
// --- Optional: Compound index for fetching user's conversations list ---
aiResponseSchema.index({
  firebaseUID: 1,
  serviceType: 1,
  conversationId: 1,
  createdAt: -1,
});

const AIResponse = mongoose.model("AIResponse", aiResponseSchema);
export default AIResponse;
