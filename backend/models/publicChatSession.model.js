import mongoose from "mongoose";

const publicChatMessageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ["user", "assistant"],
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const publicChatSessionSchema = new mongoose.Schema(
  {
    sessionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    ipAddress: {
      type: String,
      required: true,
      index: true,
    },
    recipeSlug: {
      type: String,
      required: true,
      index: true,
    },
    recipeTitle: {
      type: String,
      default: null,
    },
    adaptationsUsed: {
      type: Number,
      default: 0,
    },
    adaptedRecipeIds: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Recipe',
    }],
    messages: [publicChatMessageSchema],
    messageCount: {
      type: Number,
      default: 0,
    },
    userAgent: {
      type: String,
      default: null,
    },
    referrer: {
      type: String,
      default: null,
    },
    firstMessageAt: {
      type: Date,
      default: Date.now,
    },
    lastMessageAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    collection: "chatsessions-public",
  }
);

// Indexes for analytics
publicChatSessionSchema.index({ firstMessageAt: -1 });
publicChatSessionSchema.index({ recipeSlug: 1, lastMessageAt: -1 });

const PublicChatSession = mongoose.model("PublicChatSession", publicChatSessionSchema);

export default PublicChatSession;
