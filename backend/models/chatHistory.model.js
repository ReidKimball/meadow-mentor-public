import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ["user", "assistant", "recipe"],
    required: true,
  },
  content: {
    type: mongoose.Schema.Types.Mixed, // Can be a string or a structured object
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const chatSessionSchema = new mongoose.Schema(
  {
    firebaseUID: {
      type: String,
      required: [true, "firebaseUID is required for chat history"],
      index: true, // Index for faster queries
    },
    title: {
      type: String,
      default: "New Chat",
    },
    messages: [messageSchema],
  },
  {
    timestamps: true, // Adds createdAt and updatedAt timestamps
  }
);

// Add a post-save hook to update the user's last open chat
chatSessionSchema.post("save", async function (doc) {
  const User = mongoose.model("User");
  await User.findOneAndUpdate(
    { firebaseUID: doc.firebaseUID },
    { lastOpenAskKayChat: doc._id }
  );
});

const ChatSession = mongoose.model("ChatSession", chatSessionSchema);

export default ChatSession;
