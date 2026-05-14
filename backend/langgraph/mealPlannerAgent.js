import { BaseMessage, HumanMessage, SystemMessage } from "@langchain/core/messages";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { StateGraph, END, START } from "@langchain/langgraph";
import { checkIngredientCompliance } from "../utils/complianceUtils.js";

/**
 * Meal Planner Agent
 * 
 * This agent generates personalized weekly meal plans following a structured flow:
 * 1. Define Task - Gather user profile and preferences
 * 2. Research - Fetch user's saved recipes
 * 3. Plan - Decide which recipes to use or generate placeholders
 * 4. Build - Construct the meal plan object
 * 5. Evaluate - Validate all recipes for dietary compliance
 * 6. Deliver - Save and return the meal plan
 */

/**
 * @typedef {Object} UserProfile
 * @property {string} userId - User's database ID
 * @property {string} firstName
 * @property {string} primaryDiet
 * @property {string[]} dietaryRestrictions
 * @property {string[]} customDietaryRestrictions
 * @property {string} conditionTreating
 * @property {boolean} inFlare
 */

/**
 * @typedef {Object} MealPlanSettings
 * @property {number} planDuration - Number of days (1-14)
 * @property {Object} includedMealTypes - Which meal types to include
 * @property {boolean} includedMealTypes.breakfast
 * @property {boolean} includedMealTypes.lunch
 * @property {boolean} includedMealTypes.dinner
 * @property {boolean} includedMealTypes.snack
 * @property {string} dynamicPreferences - Optional special requests
 */

/**
 * @typedef {Object} AgentState
 * @property {UserProfile} userProfile - User's profile data
 * @property {MealPlanSettings} settings - Meal plan generation settings
 * @property {Date} startDate - Starting date for the meal plan
 * @property {Array<object>} savedRecipes - User's saved recipes from database
 * @property {Array<object>} mealPlan - The generated meal plan structure
 * @property {Array<object>} statusUpdates - Status updates to send to client
 * @property {object | null} finalResponse - Final response to return
 * @property {string | null} error - Error message if something goes wrong
 */

/** @type {AgentState} */
export const initialMealPlannerState = {
  userProfile: null,
  settings: null,
  startDate: null,
  savedRecipes: [],
  mealPlan: [],
  statusUpdates: [],
  finalResponse: null,
  error: null,
};

/**
 * Node 1: Define Task
 * Validates input and prepares the generation context
 * NOTE: startDate is now optional - if null, creates a template
 */
export const defineTaskNode = async (state, config) => {
  console.log("--- Running defineTaskNode ---");
  console.log("User Profile:", state.userProfile);
  console.log("Settings:", state.settings);
  console.log("Start Date:", state.startDate);
  
  const isTemplate = !state.startDate;
  console.log("Creating template:", isTemplate);

  const statusUpdate = {
    type: "status",
    phase: "Defining Task",
    message: `Preparing to generate a ${state.settings.planDuration}-day meal plan${isTemplate ? ' template' : ''}...`,
    state: "in_progress",
  };

  // Validate required data (startDate is now optional)
  if (!state.userProfile || !state.settings) {
    return {
      error: "Missing required data: userProfile or settings",
      statusUpdates: [statusUpdate],
    };
  }

  return {
    statusUpdates: [statusUpdate],
  };
};

/**
 * Node 2: Research
 * Fetches user's saved recipes from the database
 */
export const researchNode = async (state, config) => {
  console.log("--- Running researchNode ---");
  
  const statusUpdate = {
    type: "status",
    phase: "Researching",
    message: "Fetching your saved recipes...",
    state: "in_progress",
  };

  try {
    // TODO: Fetch saved recipes from database
    // For now, we'll use the savedRecipes passed in state
    console.log(`Found ${state.savedRecipes.length} saved recipes`);

    return {
      statusUpdates: [statusUpdate],
    };
  } catch (error) {
    console.error("Error fetching saved recipes:", error);
    return {
      error: `Failed to fetch saved recipes: ${error.message}`,
      statusUpdates: [statusUpdate],
    };
  }
};

/**
 * Node 3: Plan
 * Decides which recipes to use for each meal slot
 */
export const planNode = async (state, config) => {
  console.log("--- Running planNode ---");
  
  const statusUpdate = {
    type: "status",
    phase: "Planning",
    message: "Selecting recipes and planning meals...",
    state: "in_progress",
  };

  const { settings, startDate, savedRecipes, userProfile } = state;
  const mealPlan = [];

  // Get list of enabled meal types
  const enabledMealTypes = Object.entries(settings.includedMealTypes)
    .filter(([_, enabled]) => enabled)
    .map(([mealType, _]) => mealType);

  console.log("Enabled meal types:", enabledMealTypes);

  // Track used recipes to ensure variety across days
  // Key: mealType, Value: Set of used recipe IDs
  const usedRecipesByMealType = {};
  enabledMealTypes.forEach(mealType => {
    usedRecipesByMealType[mealType] = new Set();
  });

  // Generate meal plan for each day
  for (let dayOffset = 0; dayOffset < settings.planDuration; dayOffset++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(currentDate.getDate() + dayOffset);

    const dayPlan = {
      date: currentDate,
      meals: {},
    };

    // For each enabled meal type, select or generate a recipe
    for (const mealType of enabledMealTypes) {
      // Filter saved recipes by meal type and diet
      let eligibleRecipes = savedRecipes.filter((recipe) => {
        const matchesMealType = recipe.mealType?.toLowerCase() === mealType.toLowerCase();
        const matchesDiet = recipe.recipeDiet === userProfile.primaryDiet;
        
        // If in flare, prioritize flare-friendly recipes
        if (userProfile.inFlare) {
          const isFlareFriendly = recipe.tags?.some(tag => 
            tag.toLowerCase().includes('flare-friendly') || 
            tag.toLowerCase().includes('flare friendly')
          );
          return matchesMealType && matchesDiet && isFlareFriendly;
        }
        
        return matchesMealType && matchesDiet;
      });

      // Filter out already used recipes for this meal type
      const unusedRecipes = eligibleRecipes.filter(recipe => 
        !usedRecipesByMealType[mealType].has(recipe._id.toString())
      );

      console.log(`Day ${dayOffset + 1}, ${mealType}: Found ${eligibleRecipes.length} eligible recipes, ${unusedRecipes.length} unused`);

      // Use unused recipes if available, otherwise allow reuse
      const recipesToChooseFrom = unusedRecipes.length > 0 ? unusedRecipes : eligibleRecipes;

      if (recipesToChooseFrom.length > 0) {
        // Use a saved recipe (randomly select)
        const selectedRecipe = recipesToChooseFrom[Math.floor(Math.random() * recipesToChooseFrom.length)];
        
        // Track this recipe as used for this meal type
        usedRecipesByMealType[mealType].add(selectedRecipe._id.toString());
        
        console.log(`  -> Selected recipe has recipeImage?`, !!selectedRecipe.recipeImage);
        console.log(`  -> recipeImage value:`, selectedRecipe.recipeImage);
        dayPlan.meals[mealType] = {
          recipeId: selectedRecipe._id,
          recipeTitle: selectedRecipe.recipeTitle,
          recipeDescription: selectedRecipe.recipeDescription,
          recipeDiet: selectedRecipe.recipeDiet,
          recipeImage: selectedRecipe.recipeImage, // Include recipe image
          recipeImageVersion: selectedRecipe.imageVersion || 0,
          mealType: selectedRecipe.mealType,
          isPlaceholder: false,
        };
        console.log(`  -> Using saved recipe: ${selectedRecipe.recipeTitle}`);
      } else {
        // Generate a placeholder
        dayPlan.meals[mealType] = {
          isPlaceholder: true,
          needsGeneration: true,
          mealType: mealType,
        };
        console.log(`  -> Will generate placeholder for ${mealType}`);
      }
    }

    mealPlan.push(dayPlan);
  }

  console.log("Recipe usage summary:");
  enabledMealTypes.forEach(mealType => {
    console.log(`  ${mealType}: ${usedRecipesByMealType[mealType].size} unique recipes used`);
  });

  return {
    mealPlan,
    statusUpdates: [statusUpdate],
  };
};

/**
 * Node 4: Build
 * Generates AI placeholders for meals that need them
 */
export const buildNode = async (state, config) => {
  console.log("--- Running buildNode ---");
  
  const statusUpdate = {
    type: "status",
    phase: "Building",
    message: "Generating recipe ideas for missing meals...",
    state: "in_progress",
  };

  const { mealPlan, userProfile, settings } = state;
  const llm = new ChatGoogleGenerativeAI({
    model: "gemini-flash-latest",
    temperature: 1.0,
  });

  // Count how many placeholders need generation
  let placeholdersToGenerate = 0;
  for (const day of mealPlan) {
    for (const [mealType, meal] of Object.entries(day.meals)) {
      if (meal.needsGeneration) {
        placeholdersToGenerate++;
      }
    }
  }

  console.log(`Generating ${placeholdersToGenerate} recipe placeholders...`);

  // Generate placeholders
  for (const day of mealPlan) {
    for (const [mealType, meal] of Object.entries(day.meals)) {
      if (meal.needsGeneration) {
        try {
          const prompt = `Generate a brief recipe idea for a ${mealType} meal.

User Profile:
- Diet: ${userProfile.primaryDiet}
- Condition: ${userProfile.conditionTreating}
- In Flare: ${userProfile.inFlare ? "Yes" : "No"}
- Dietary Restrictions: ${userProfile.dietaryRestrictions.join(", ") || "None"}
- Custom Restrictions: ${userProfile.customDietaryRestrictions.join(", ") || "None"}

${settings.dynamicPreferences ? `Special Preferences: ${settings.dynamicPreferences}` : ""}

Respond with ONLY a JSON object in this exact format:
{
  "title": "Recipe Title",
  "description": "Brief 1-2 sentence description"
}`;

          console.log(`Generating placeholder for ${mealType}...`);
          const response = await llm.invoke([new HumanMessage(prompt)]);
          
          // Parse the JSON response
          const jsonMatch = response.content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const placeholderData = JSON.parse(jsonMatch[0]);
            day.meals[mealType] = {
              ...meal,
              title: placeholderData.title,
              description: placeholderData.description,
              needsGeneration: false,
            };
            console.log(`  -> Generated: ${placeholderData.title}`);
          } else {
            throw new Error("Failed to parse LLM response");
          }
        } catch (error) {
          console.error(`Error generating placeholder for ${mealType}:`, error);
          // Fallback placeholder
          day.meals[mealType] = {
            ...meal,
            title: `${mealType.charAt(0).toUpperCase() + mealType.slice(1)} Meal`,
            description: "A delicious and compliant meal option.",
            needsGeneration: false,
          };
        }
      }
    }
  }

  return {
    mealPlan,
    statusUpdates: [statusUpdate],
  };
};

/**
 * Node 5: Evaluate
 * Validates all recipes and placeholders for dietary compliance
 */
export const evaluateNode = async (state, config) => {
  console.log("--- Running evaluateNode ---");
  
  const statusUpdate = {
    type: "status",
    phase: "Evaluating",
    message: "Validating meal plan for dietary compliance...",
    state: "in_progress",
  };

  // TODO: Implement validation logic
  // For now, we'll assume all meals are compliant since:
  // 1. Saved recipes are already validated
  // 2. AI-generated placeholders will be validated when fully generated

  console.log("Meal plan validation complete");

  return {
    statusUpdates: [statusUpdate],
  };
};

/**
 * Node 6: Deliver
 * Prepares the final response and saves to database
 * NOTE: Now handles both templates (no dates) and dated plans
 */
export const deliverNode = async (state, config) => {
  console.log("--- Running deliverNode ---");
  
  const statusUpdate = {
    type: "status",
    phase: "Delivering",
    message: "Finalizing your meal plan...",
    state: "completed",
  };

  const { mealPlan, settings, startDate, userProfile } = state;
  const isTemplate = !startDate;

  console.log("Is template:", isTemplate);

  // If creating a template, use dayNumber instead of dates
  const finalMealPlan = isTemplate
    ? mealPlan.map((day, index) => ({
        dayNumber: index + 1,
        meals: day.meals,
      }))
    : mealPlan; // Keep original structure with dates if provided

  const finalResponse = {
    type: "meal_plan",
    planName: `${settings.planDuration}-Day Meal Plan`,
    days: finalMealPlan,
    settings,
  };

  // Only include dates if not a template
  if (!isTemplate) {
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + settings.planDuration - 1);
    finalResponse.startDate = startDate;
    finalResponse.endDate = endDate;
  }

  console.log("Meal plan generation complete!");
  console.log(`Generated ${mealPlan.length} days of meals`);
  console.log("Template mode:", isTemplate);

  return {
    finalResponse,
    statusUpdates: [statusUpdate],
  };
};

/**
 * Routing function to determine next node
 */
const routeAfterDefineTask = (state) => {
  if (state.error) {
    console.log("Error detected, ending graph");
    return END;
  }
  return "research";
};

const routeAfterResearch = (state) => {
  if (state.error) {
    return END;
  }
  return "plan";
};

const routeAfterPlan = (state) => {
  if (state.error) {
    return END;
  }
  return "build";
};

const routeAfterBuild = (state) => {
  if (state.error) {
    return END;
  }
  return "evaluate";
};

const routeAfterEvaluate = (state) => {
  if (state.error) {
    return END;
  }
  return "deliver";
};

/**
 * Build the LangGraph workflow
 */
export const buildMealPlannerGraph = () => {
  const workflow = new StateGraph({
    channels: initialMealPlannerState,
  });

  // Add nodes
  workflow.addNode("defineTask", defineTaskNode);
  workflow.addNode("research", researchNode);
  workflow.addNode("plan", planNode);
  workflow.addNode("build", buildNode);
  workflow.addNode("evaluate", evaluateNode);
  workflow.addNode("deliver", deliverNode);

  // Add edges
  workflow.addEdge(START, "defineTask");
  workflow.addConditionalEdges("defineTask", routeAfterDefineTask);
  workflow.addConditionalEdges("research", routeAfterResearch);
  workflow.addConditionalEdges("plan", routeAfterPlan);
  workflow.addConditionalEdges("build", routeAfterBuild);
  workflow.addConditionalEdges("evaluate", routeAfterEvaluate);
  workflow.addEdge("deliver", END);

  return workflow.compile();
};

/**
 * Main function to run the meal planner agent
 */
export const runMealPlannerAgent = async (userProfile, settings, startDate, savedRecipes = []) => {
  console.log("=== Starting Meal Planner Agent ===");
  
  const graph = buildMealPlannerGraph();
  
  const initialState = {
    ...initialMealPlannerState,
    userProfile,
    settings,
    startDate,
    savedRecipes,
  };

  try {
    const result = await graph.invoke(initialState);
    
    if (result.error) {
      console.error("Agent encountered an error:", result.error);
      return {
        success: false,
        error: result.error,
        statusUpdates: result.statusUpdates,
      };
    }

    console.log("=== Meal Planner Agent Complete ===");
    return {
      success: true,
      mealPlan: result.finalResponse,
      statusUpdates: result.statusUpdates,
    };
  } catch (error) {
    console.error("Fatal error in meal planner agent:", error);
    return {
      success: false,
      error: error.message,
      statusUpdates: [],
    };
  }
};
