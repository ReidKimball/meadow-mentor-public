import mongoose from 'mongoose';

const analysisDetailSchema = new mongoose.Schema({
  overall: { type: String, required: true },
  tone: { type: String, required: true },
  verbosity: { type: String, required: true },
  userInfo: { type: String, required: true },
  tools: { type: String, required: true },
  rating: {
    type: String,
    required: true,
    enum: ['poor', 'ok', 'good'],
  },
}, { _id: false });

const systemPromptAnalysisSchema = new mongoose.Schema({
  userName: { type: String, required: true },
  conditionTreating: { type: String, required: true },
  flareStatus: { type: String, required: true }, // Note: Storing as string from JSON
  primaryDiet: { type: String, required: true },
  dietaryRestrictions: { type: String, required: true },
  customDietaryRestrictions: { type: String, required: true },
  analysisDetails: [analysisDetailSchema],
}, {
  timestamps: true,
  collection: 'system-prompt-analyses' // Explicitly set collection name
});

const SystemPromptAnalysis = mongoose.model('SystemPromptAnalysis', systemPromptAnalysisSchema);

export default SystemPromptAnalysis;
