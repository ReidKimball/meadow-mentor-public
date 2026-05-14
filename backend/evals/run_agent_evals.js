import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import { askKayAgent } from "../langgraph/askKayAgent.js";
import User from "../models/user.model.js";
import * as userHealthService from "../services/userHealth.service.js";
import TherapeuticDiet from "../models/therapeuticDiets.model.js";
import { HumanMessage } from "@langchain/core/messages";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// -- ENV LOADING --
const backendRoot = path.join(__dirname, "..");
dotenv.config({ path: path.join(backendRoot, ".env.config") });
// Load prompts - ensuring these are loaded so the agent can find them
dotenv.config({ path: path.join(backendRoot, "ai_prompts/.env.scd") });
dotenv.config({ path: path.join(backendRoot, "ai_prompts/.env.gaps") });
dotenv.config({ path: path.join(backendRoot, "ai_prompts/.env.paleo-aip") });
dotenv.config({ path: path.join(backendRoot, "ai_prompts/.env.mediterranean") });
dotenv.config({ path: path.join(backendRoot, "ai_prompts/.env.dairy-free") });
dotenv.config({ path: path.join(backendRoot, "ai_prompts/.env.gluten-free") });
dotenv.config({ path: path.join(backendRoot, "ai_prompts/.env.nut-free") });
dotenv.config({ path: path.join(backendRoot, "ai_prompts/.env.ai-personas") });
dotenv.config({ path: path.join(backendRoot, ".env") });

async function runEvals() {
  console.log("Starting Agent Evals...");

  if (!process.env.DATABASE) {
    console.error("❌ DATABASE env var not set. Make sure you are running from backend directory or have .env file.");
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.DATABASE);
    console.log("✅ Connected to DB");
  } catch (err) {
    console.error("❌ DB Connection Failed:", err);
    process.exit(1);
  }

  // Find a test user
  // Try to find 'reid' first, or fallback to any user
  const user = await User.findOne({ email: /rkimball/i }) || await User.findOne({});
  if (!user) {
    console.error("❌ No user found in database to run evals against.");
    process.exit(1);
  }
  console.log(`👤 Using User: ${user.email} (${user._id})`);

  // Hydrate user profile
  let userProfile = {};
  try {
    const mergedUser = await userHealthService.getMergedUserData(user.firebaseUID);
    const diet = await TherapeuticDiet.findOne({ diet_code: mergedUser.primaryDiet });
    const formattedGuidelines =
      diet && diet.general_guidelines.length > 0
        ? diet.general_guidelines.map((line) => `- ${line}`).join("\n")
        : "No specific dietary guidelines were found.";

    userProfile = {
        userId: user._id.toString(),
        firstName: mergedUser.firstName,
        primaryDiet: mergedUser.primaryDiet,
        dietaryRestrictions: mergedUser.dietaryRestrictions || [],
        customDietaryRestrictions: mergedUser.customDietaryRestrictions || [],
        conditionTreating: mergedUser.conditionTreating || 'Not specified',
        inFlare: mergedUser.inFlare || false,
        formattedGuidelines: formattedGuidelines,
    };
    console.log("✅ User Profile Hydrated");
  } catch (err) {
    console.error("❌ Failed to hydrate user profile:", err);
    process.exit(1);
  }

  const testCases = [
    {
      name: "General Conversation",
      input: "Hi, who are you?",
      check: (finalState) => {
        // Should just be a text response, no tool calls
        const lastMsg = finalState.messages[finalState.messages.length - 1];
        return !lastMsg.tool_calls || lastMsg.tool_calls.length === 0;
      }
    },
    {
      name: "Search Recipes (Intent)",
      input: "Find me some chicken recipes",
      check: (finalState) => {
        // Expect a tool call to 'search_recipes' in the history
        const toolCalls = finalState.messages.flatMap(m => m.tool_calls || []);
        const hasSearch = toolCalls.some(tc => tc.name === 'search_recipes');
        if (!hasSearch) console.log("   - Missing search_recipes tool call");
        return hasSearch;
      }
    },
    {
      name: "Create Recipe (Intent)",
      input: "Create a recipe for apple pie",
      check: (finalState) => {
        // Should trigger 'create_recipe' tool
        // Because of interruptBefore, the last message should be the AI proposing the tool call
        const lastMsg = finalState.messages[finalState.messages.length - 1];
        const hasCreate = lastMsg.tool_calls && lastMsg.tool_calls.some(tc => tc.name === 'create_recipe');
        if (!hasCreate) console.log("   - Missing create_recipe tool call");
        return hasCreate;
      }
    }
  ];

  let passedCount = 0;

  for (const test of testCases) {
    console.log(`\n🧪 Testing: "${test.name}"`);
    console.log(`   Input: "${test.input}"`);

    const threadId = `eval_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const config = { configurable: { thread_id: threadId } };
    
    const initialState = {
      messages: [ new HumanMessage(test.input) ],
      userProfile: userProfile,
      userId: user._id.toString(),
      firebaseUID: user.firebaseUID,
      isConfirmed: false 
    };

    try {
      const result = await askKayAgent.invoke(initialState, config);
      const passed = test.check(result);
      
      if (passed) {
        console.log("   ✅ PASSED");
        passedCount++;
      } else {
        console.log("   ❌ FAILED");
        const lastMsg = result.messages[result.messages.length - 1];
        console.log("   Last Message:", JSON.stringify(lastMsg, null, 2));
      }
    } catch (err) {
      console.error("   ❌ ERROR:", err);
    }
  }

  console.log(`\n\n🎉 Evals Completed: ${passedCount}/${testCases.length} passed.`);
  
  await mongoose.disconnect();
  process.exit(0);
}

runEvals();
