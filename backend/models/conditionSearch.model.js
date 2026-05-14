import mongoose from "mongoose";

const conditionSearchSchema = new mongoose.Schema(
  {
    normalized_term: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    search_count: {
      type: Number,
      default: 1,
    },
    original_terms: {
      type: [String],
      default: [],
    },
    matched_condition: {
      type: Boolean,
      default: false,
    },
    first_searched: {
      type: Date,
      default: Date.now,
    },
    last_searched: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

const ConditionSearch = mongoose.model(
  "ConditionSearch", // the function
  conditionSearchSchema, // the schema
  "condition-searches" // the collection name in MongoDB
);

export default ConditionSearch;
