import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
// MMA-267: Removed unused imports (askKayAgent, TherapeuticDiet, HumanMessage, AIMessage)
import User from "../models/user.model.js";
import * as userHealthService from "../services/userHealth.service.js";
import { researchUnknownIngredientsNode } from "../langgraph/askKayAgent.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// -- ENV LOADING --
const backendRoot = path.join(__dirname, "..");
dotenv.config({ path: path.join(backendRoot, ".env.config") });
dotenv.config({ path: path.join(backendRoot, "ai_prompts/.env.scd") });
dotenv.config({ path: path.join(backendRoot, "ai_prompts/.env.gaps") });
dotenv.config({ path: path.join(backendRoot, "ai_prompts/.env.paleo-aip") });
dotenv.config({ path: path.join(backendRoot, "ai_prompts/.env.mediterranean") });
dotenv.config({ path: path.join(backendRoot, "ai_prompts/.env.dairy-free") });
dotenv.config({ path: path.join(backendRoot, "ai_prompts/.env.gluten-free") });
dotenv.config({ path: path.join(backendRoot, "ai_prompts/.env.nut-free") });
dotenv.config({ path: path.join(backendRoot, "ai_prompts/.env.ai-personas") });
dotenv.config({ path: path.join(backendRoot, ".env") });

async function runTest() {
  console.log("Starting Web Search Fallback Test...");

  try {
    await mongoose.connect(process.env.DATABASE);
    console.log("✅ Connected to DB");
  } catch (err) {
    console.error("❌ DB Connection Failed:", err);
    process.exit(1);
  }

  // MMA-268: Use env variable for deterministic test user lookup
  const testEmail = process.env.TEST_USER_EMAIL || 'rkimball';
  const user = await User.findOne({ email: new RegExp(testEmail, 'i') });
  if (!user) {
    console.error("❌ No user found.");
    process.exit(1);
  }

  let userProfile = {};
  const mergedUser = await userHealthService.getMergedUserData(user.firebaseUID);
  userProfile = {
      userId: user._id.toString(),
      firstName: mergedUser.firstName,
      primaryDiet: mergedUser.primaryDiet || 'SCD',
      dietaryRestrictions: mergedUser.dietaryRestrictions || [],
      customDietaryRestrictions: mergedUser.customDietaryRestrictions || [],
      conditionTreating: mergedUser.conditionTreating || 'Not specified',
      inFlare: mergedUser.inFlare || false,
      formattedGuidelines: "No specific dietary guidelines were found.",
  };

  // MMA-267: Removed unused variables (input, threadId, config)
  console.log(`\n🧪 Testing researchUnknownIngredientsNode directly...`);

  const testState = {
    unknownIngredients: ["durian", "dragonfruit"],
    userProfile: userProfile
  };

  try {
    console.log("Running researchUnknownIngredientsNode directly...");
    const result = await researchUnknownIngredientsNode(testState, {});
    console.log("--- RESULT ---");
    console.log(JSON.stringify(result, null, 2));
  } catch (err) {
    console.error("   ❌ ERROR:", err);
  }

  await mongoose.disconnect();
  process.exit(0);
}

runTest();
