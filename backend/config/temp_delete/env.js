// backend/config/env.js

import * as dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

// Get the directory where the current file (env.js) is located
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

try {
  // This will resolve to the correct path regardless of where you run the command from
  dotenv.config({ path: join(__dirname, "../../backend/.env.config") });
  // OR more simply (going up from config folder to backend folder)
  dotenv.config({ path: join(__dirname, "../.env.config") });

  // Similarly for other config files
  dotenv.config({ path: join(__dirname, "../ai_prompts/.env.scd") });
  dotenv.config({ path: join(__dirname, "../ai_prompts/.env.gaps") });
  dotenv.config({ path: join(__dirname, "../ai_prompts/.env.paleo-aip") });

  console.log("Environment variables loaded.");
} catch (error) {
  console.error("Error loading .env files:", error);
}

// Export essential environment variables
//export const TEST = "THIS IS A TEST yo"; // YES this worked
export const PORT = process.env.PORT || 3000;
export const DATABASE_URL = process.env.DATABASE;
export const GEMINI_API_KEY = process.env.GOOGLE_API_KEY;
export const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
export const SONNET_MODEL =
  process.env.SONNET_MODEL || "claude-3-sonnet-20240229"; // Example default
export const PREFERRED_AI_PROVIDER = process.env.AI_PROVIDER || "GEMINI"; // 'GEMINI' or 'CLAUDE'
export const DEFAULT_GEMINI_MODEL =
  process.env.GEMINI_MODEL || "gemini-2.5-pro-exp-03-25"; // Or your preferred default
export const STRIPE_SECRET_KEY = process.env.STRIPE_LIVE; // Needed for user deletion

// Add other critical variables if needed elsewhere
// export const FRONTEND_URL_DEV = process.env.FRONTEND_URL_DEV;
// export const FRONTEND_URL_PROD = process.env.FRONTEND_URL_PROD;
// ... etc.
