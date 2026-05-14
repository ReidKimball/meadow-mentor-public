import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import Recipe from '../models/recipe.model.js';
import TherapeuticDietFood from '../models/therapeuticDietFood.model.js';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { HumanMessage } from '@langchain/core/messages';
import {
  AI_MEMORY_GOAL_CATEGORIES,
  AI_MEMORY_PROGRESS_TYPES,
  AI_MEMORY_SOURCES,
  SUPPORTED_DIET_STAGES,
} from '../services/aiMemory.service.js';
import { createPendingIngredientIssue } from '../services/linear.service.js'; // Fire-and-forget Linear issue creation for pending ingredients.

const allSupportedDietStages = [...new Set(Object.values(SUPPORTED_DIET_STAGES).flat())];

/**
 * Tool to search for recipes saved by the user.
 */
export const searchRecipesTool = tool(
  async (args) => {
    // Placeholder - actual search happens in search_recipes_node using state.userId
    console.log('[Tool: searchRecipes] Called with:', JSON.stringify(args));
    return JSON.stringify(args);
  },
  {
    name: 'search_recipes',
    description: 'Search for recipes. Can search your private saved/generated recipes, or the public community recipes, or both. Use this when the user asks for recipes they already have, mentions "my recipes", or wants to find community/public/others recipes. Supports searching by recipe title, tags, slug, and seoSlugCandidate. If the user asks to "show" or "list" recipes, call this tool with no query to list. Use the "scope" parameter to focus the search (defaults to "private" if the user refers to "my recipes", otherwise "all" is often best). When you show results to the user, format each as a markdown link to the in-app detail page using the returned url/markdownLink.',
    schema: z.object({
      query: z.string().optional().describe('The search query for title/tags/slug/seoSlugCandidate. Omit to list all.'),
      scope: z.enum(['private', 'public', 'all']).optional().default('private').describe('The scope of the search: "private" for user\'s saved recipes, "public" for community recipes, or "all" for both.'),
      mealType: z.enum(['breakfast', 'lunch', 'dinner', 'snack', 'dessert', 'appetizer', 'side dish', 'sauce or condiment', 'staple', 'beverage']).optional().describe('Filter by meal type if specified'),
      tags: z.array(z.string()).optional().describe('Filter by specific tags like "flare-friendly", "quick", etc.'),
      diet: z.string().optional().describe('Filter by diet code if needed, defaults to user primary diet'),
    }),
  }
);

/**
 * Tool for adding recipe ingredients to the user's shopping list.
 * The LLM calls this tool when the user asks to add ingredients.
 * The actual merge into the shopping list happens in a LangGraph node after credit confirmation modal.
 */
export const addToShoppingListTool = tool(
  async (args) => {
    // Placeholder - actual add happens in add_to_shopping_list nodes after HITL confirmation
    console.log('[Tool: add_to_shopping_list] Called with:', JSON.stringify(args));
    return JSON.stringify({ status: 'READY_TO_ADD', selection: args });
  },
  {
    name: 'add_to_shopping_list',
    description:
      'Add ingredients to the user\'s shopping list. Call this tool when you have enough information to add ingredients to the shopping list. Supports adding from a recipe (use recipeId + selectionMode) OR adding a user-provided list of ingredient names (use manualIngredientNames). Costs 1 credit. If the user lists specific ingredients like "add eggs, milk, bread", use manualIngredientNames. If adding from a recipe, include recipeId if known and set selectionMode to "all" unless user specified particular ingredients.',
    schema: z.object({
      recipeId: z
        .string()
        .optional()
        .describe('The MongoDB ID of the recipe to pull ingredients from (if known from chat context).'),
      manualIngredientNames: z
        .array(z.string())
        .optional()
        .describe('If adding without a recipe: ingredient names the user wants added (e.g., ["eggs", "milk"]).'),
      selectionMode: z
        .enum(['all', 'selected'])
        .optional()
        .describe('If adding from a recipe: whether to add ALL ingredients or only SELECTED ingredients.'),
      selectedIngredientIndexes: z
        .array(z.number())
        .optional()
        .describe('If selectionMode is selected: 1-based ingredient numbers the user chose.'),
      selectedIngredientNames: z
        .array(z.string())
        .optional()
        .describe('If selectionMode is selected: ingredient names the user chose.'),
    }),
  }
);

/**
 * Tool to fetch the full details of a specific recipe.
 */
export const getRecipeDetailsTool = tool(
  async ({ recipeId, slug }) => {
    console.log(`[Tool: getRecipeDetails] Fetching details for ${recipeId || slug}`);
    const query = recipeId ? { _id: recipeId } : { slug };
    const recipe = await Recipe.findOne(query).lean();
    
    if (!recipe) return 'Recipe not found.';
    return JSON.stringify(recipe);
  },
  {
    name: 'get_recipe_details',
    description: 'Fetch the full ingredients and instructions for a specific recipe using its ID or slug. Use this when the user asks for details about a specific dish they already have. IMPORTANT: Only use a recipeId returned by search_recipes or a slug the user provided. Never invent or guess an ID. DO NOT call create_recipe after this tool. Just summarize the details or let the UI display the card.',
    schema: z.object({
      recipeId: z.string().optional().describe('The MongoDB ID of the recipe'),
      slug: z.string().optional().describe('The URL-friendly slug of the recipe')
    }),
  }
);

/**
 * Tool for creating a new recipe.
 * The LLM calls this tool when the user asks for a recipe.
 * The actual recipe generation happens in the generate_recipe node after credit confirmation.
 */
export const createRecipeTool = tool(
  async (args) => {
    // Placeholder - actual generation happens in generate_recipe node after HITL confirmation
    console.log('[Tool: create_recipe] Called with:', JSON.stringify(args));
    return JSON.stringify({ status: 'READY_FOR_GENERATION', requirements: args });
  },
  {
    name: 'create_recipe',
    description: 'Generate a NEW personalized recipe. Do NOT use this if the user is asking about an existing recipe or one found via search. Costs 1 credit.',
    schema: z.object({
      dishDescription: z.string().describe('What the user wants to eat (e.g., "chicken soup", "quick breakfast", "comfort food for a flare")'),
      mainIngredients: z.array(z.string()).optional().describe('Specific ingredients the user mentioned wanting to include'),
      mealType: z.enum(['breakfast', 'lunch', 'dinner', 'snack', 'dessert', 'appetizer', 'side dish', 'sauce or condiment', 'staple', 'beverage']).optional().describe('Type of meal if specified by user'),
      specialRequirements: z.string().optional().describe('Any special requirements like "low fiber", "quick to make", "kid-friendly", "use leftovers"'),
    }),
  }
);

/**
 * Tool for modifying an existing recipe.
 * The LLM calls this tool when the user wants to change a recipe.
 * The actual modification happens in the modify_recipe node after credit confirmation.
 */
export const editRecipeTool = tool(
  async (args) => {
    // Placeholder - actual modification happens in modify_recipe node after HITL confirmation
    console.log('[Tool: edit_recipe] Called with:', JSON.stringify(args));
    return JSON.stringify({ status: 'READY_FOR_MODIFICATION', modifications: args });
  },
  {
    name: 'edit_recipe',
    description: 'Modify an existing recipe (e.g., swap ingredients, change serving size, update tags, change visibility). Use this when the user asks YOU to change a recipe. Costs 1 credit - call this tool IMMEDIATELY when the user requests a modification (a credit confirmation modal will appear automatically). IMPORTANT: If the recipe was recently shown in chat, use its Recipe ID from context as recipeId (do not guess). Only edit allowed fields (do NOT change generatedBy, savedBy, userPrompt, slug, recipeDiet, recipeImage, imageVersion, averageRating, isFirstHealingMeal). If you modify the seoSlugCandidate, NEVER mention this technical field to the user in your summary. If the recipe is saved but not owned, the system will duplicate it to a private copy first, then apply edits to the copy.',
    // original description before tryingto fix the creditConfirmationModal not showing: Modify an existing recipe (e.g., swap ingredients, change serving size, update tags, change visibility). Use this when the user asks YOU to change a recipe. Costs 1 credit and requires user confirmation. IMPORTANT: If the recipe was recently shown in chat, use its Recipe ID from context as recipeId (do not guess). Only edit allowed fields (do NOT change generatedBy, savedBy, userPrompt, slug, recipeDiet, recipeImage, imageVersion, averageRating, isFirstHealingMeal, isPublic). If the recipe is saved but not owned, the system will duplicate it to a private copy first, then apply edits to the copy.
    schema: z.object({
      recipeId: z.string().optional().describe('The MongoDB ID of the recipe to modify (if known from conversation context)'),
      recipeTitle: z.string().optional().describe('The title of the recipe to modify (if ID is not known)'),
      modifications: z.string().describe('Description of the changes requested (e.g., "swap chicken for beef", "make it dairy-free", "reduce to 2 servings")'),
    }),
  }
);

/**
 * Tool to update the user's ephemeral session context (energy level, stress).
 * Low energy or high stress triggers "Gentle Mode" in Kay's responses.
 */
export const updateUserStateTool = tool(
  async (args) => {
    // Placeholder - actual update happens in update_user_state_node
    console.log('[Tool: update_user_state] Called with:', JSON.stringify(args));
    return JSON.stringify({ status: 'READY_TO_UPDATE', context: args });
  },
  {
    name: 'update_user_state',
    description: "Update the user's current energy level or stress state based on what they share in conversation. Use when the user mentions feeling tired, exhausted, stressed, anxious, or shares how they're doing today. This helps personalize recipe suggestions. Does NOT cost credits.",
    schema: z.object({
      energyLevel: z.enum(['low', 'medium', 'high']).optional()
        .describe('User energy: "low" if tired/exhausted, "medium" if normal, "high" if energetic'),
      stressMode: z.boolean().optional()
        .describe('Set true if user mentions stress, anxiety, or a rough day'),
    }),
  }
);

/**
 * Tool to save durable Chef Kay memory that should persist across chat sessions.
 * The actual MongoDB write happens in the save_user_memory_node using authenticated user state.
 */
export const saveUserMemoryTool = tool(
  async (args) => {
    return JSON.stringify({ status: 'READY_TO_SAVE_MEMORY', memory: args });
  },
  {
    name: 'save_user_memory',
    description: 'Save important long-term memory for future Chef Kay chats. Use this proactively when the user clearly shares durable cross-session information such as their current diet stage, an active health goal, or recent health progress. Do NOT use this for temporary daily state like stress or energy. If the user appears to replace an existing primary goal, ask for clarification about priorities before calling this tool.',
    schema: z.object({
      type: z.enum(['diet_stage', 'goal', 'progress_note']).describe('Which durable memory category to save. Use diet_stage for current protocol stage, goal for active cross-session goals, and progress_note for meaningful wins, setbacks, or learnings.'),
      dietStage: z.enum(allSupportedDietStages).optional().describe('Required when type is diet_stage. The app-supported diet stage label. Examples: Stage 1-6, Full GAPS, Reintroduction, Intro Diet, Elimination, Maintenance.'),
      goal: z.string().min(1).optional().describe('Required when type is goal. The durable goal text to remember.'),
      priority: z.enum(['primary', 'secondary']).optional().describe('Required when type is goal. Use primary for the user\'s main goal and secondary for important supporting goals.'),
      category: z.enum(AI_MEMORY_GOAL_CATEGORIES).optional().describe('Required when type is goal. The goal category. Behavioral goals are valid long-term goals.'),
      status: z.enum(['active', 'paused', 'achieved']).optional().describe('Optional when type is goal. Defaults to active for current goals.'),
      existingPrimaryBehavior: z.enum(['demote_to_secondary', 'pause_old_primary']).optional().describe('Optional for goal saves. Required when the user confirms that a new primary goal should replace an existing active primary goal.'),
      dropGoal: z.string().optional().describe('Optional for goal saves. Existing goal text to remove if the user has clarified a new ranking and the secondary cap would otherwise be exceeded.'),
      noteType: z.enum(AI_MEMORY_PROGRESS_TYPES).optional().describe('Required when type is progress_note. The structured progress-note type, such as win, setback, tolerance, trigger, milestone, or adherence.'),
      summary: z.string().min(1).optional().describe('Required when type is progress_note. A short durable summary of what changed or was learned.'),
      relatedGoal: z.string().optional().describe('Optional when type is progress_note. Related goal text when the progress note supports a saved goal.'),
      source: z.enum(AI_MEMORY_SOURCES).optional().describe('Defaults to user_reported unless the memory is a cautious AI inference.'),
    }),
  }
);

/**
 * Tool to check the safety of ingredients against the therapeutic diet database.
 */
export const checkIngredientSafetyTool = tool(
  async (args) => {
    // Placeholder - actual search happens in check_ingredient_safety_node
    console.log('[Tool: check_ingredient_safety] Called with:', JSON.stringify(args));
    return JSON.stringify(args);
  },
  {
    name: 'check_ingredient_safety',
    description: 'CRITICAL: You DO NOT know the safety status of ingredients for therapeutic diets (SCD, Low FODMAP, etc.) from your internal knowledge. You MUST call this tool whenever a user asks if a food/ingredient is "allowed", "safe", "legal", "compliant", or "okay to eat". Do not guess. Check the official database. Supports multiple ingredients (e.g. ["milk", "honey"]). Costs 0 credits.',
    schema: z.object({
      ingredients: z.array(z.string()).describe('List of ingredient names to check (e.g., ["chickpeas", "tahini"])'),
    }),
  }
);

/**
 * Tool to perform a web search using Gemini API.
 */
export const webSearchTool = tool(
  async (args) => {
    try {
      console.log('[Tool: web_search_tool] Called with:', JSON.stringify(args));
      
      const llm = new ChatGoogleGenerativeAI({
        model: process.env.GEMINI_MODEL_NAME || "gemini-flash-latest",
        temperature: 1.0,
        apiKey: process.env.GOOGLE_API_KEY,
      }).bindTools([
        {
          googleSearch: {},
        },
      ]);
      
      const response = await llm.invoke([
        new HumanMessage({
          content: `Please perform a web search to answer the following query concisely based on factual information: "${args.query}"`
        })
      ]);
      
      // Try multiple paths where grounding metadata might live
      const responseMeta = response?.response_metadata;
      const groundingMeta = responseMeta?.groundingMetadata 
        || responseMeta?.grounding_metadata
        || responseMeta?.candidates?.[0]?.groundingMetadata;
      
      const chunks = groundingMeta?.groundingChunks 
        || groundingMeta?.grounding_chunks 
        || groundingMeta?.supportChunks
        || [];
      
      const sources = chunks
        .filter(c => c.web?.uri || c.uri || c.url)
        .map((c, i) => {
          const uri = c.web?.uri || c.uri || c.url;
          const title = c.web?.title || c.title || 'Source';
          return `[${i + 1}] [${title}](${uri})`;
        });
      
      let result = response.content;
      if (sources.length > 0) {
        result += `\n\n**Sources:**\n${sources.join('\n')}`;
      }
      
      console.log(`[Tool: web_search_tool] Extracted ${sources.length} grounding sources`);
      console.log(`[Tool: web_search_tool] Final result preview (last 500 chars):`, result.slice(-500));
      return result;
    } catch (error) {
      console.error("[Tool: web_search_tool] Error:", error);
      return `Failed to perform web search: ${error.message}`;
    }
  },
  {
    name: 'web_search_tool',
    description: 'Perform a web search using Google Search. Use this to find out if food ingredients are allowed on specific therapeutic diets, find medical papers, disease information, or supplement details. This tool returns unstructured text results from the web.',
    schema: z.object({
      query: z.string().describe('The search query (e.g., "Is quinoa allowed on the Specific Carbohydrate Diet?"). Be specific.'),
    }),
  }
);

/**
 * Tool to add a new ingredient to the therapeutic diet database.
 */
export const addIngredientDBTool = tool(
  async (args) => {
    try {
      const { diet_code, food_name, allowed, note } = args;
      console.log('[Tool: add_ingredientDB_tool] Called with:', JSON.stringify(args));
      
      const newFood = new TherapeuticDietFood({
        diet_code: diet_code,
        food_name: food_name,
        normalized_food_name: food_name.toLowerCase().trim(),
        allowed: allowed,
        note: note,
        verification_status: 'pending'
      });
      await newFood.save();
      createPendingIngredientIssue({
        diet_code,
        food_name,
        allowed,
        note: note || null,
        createdAt: newFood.createdAt,
      }).catch(() => {}); // fire-and-forget
      return `Successfully added ${food_name} to the ${diet_code} database as ${allowed ? 'Allowed' : 'Not Allowed'}.`;
    } catch (error) {
      console.error("[Tool: add_ingredientDB_tool] Error:", error);
      return `Error adding to database: ${error.message}`;
    }
  },
  {
    name: 'add_ingredientDB_tool',
    description: 'Add a new food ingredient to the therapeutic diet database immediately after verifying its safety via web search. Use this to persist new knowledge. Do not use this to edit existing ingredients.',
    schema: z.object({
      diet_code: z.string().describe('The diet code (e.g., "SCD", "LOW_FODMAP")'),
      food_name: z.string().describe('The name of the food ingredient.'),
      allowed: z.boolean().describe('Whether the food is allowed on this diet.'),
      note: z.string().optional().describe('Any specific notes or warnings about this food.'),
    }),
  }
);

/**
 * Tool to edit an existing ingredient in the therapeutic diet database.
 */
export const editIngredientDBTool = tool(
  async (args) => {
    try {
      const { diet_code, food_name, allowed, note } = args;
      console.log('[Tool: edit_ingredientDB_tool] Called with:', JSON.stringify(args));
      
      // Always reset verification_status on AI-driven edits so changes are flagged for admin re-review
      const updateData = { verification_status: 'pending' };
      if (allowed !== undefined) updateData.allowed = allowed;
      if (note !== undefined) updateData.note = note;
      
      const updated = await TherapeuticDietFood.findOneAndUpdate(
        { diet_code: diet_code, normalized_food_name: food_name.toLowerCase().trim() },
        { $set: updateData },
        { new: true }
      );
      
      if (!updated) {
        return `Ingredient ${food_name} not found in the ${diet_code} database. Use add_ingredientDB_tool instead.`;
      }
      return `Successfully updated ${food_name} in the ${diet_code} database.`;
    } catch (error) {
      console.error("[Tool: edit_ingredientDB_tool] Error:", error);
      return `Error updating database: ${error.message}`;
    }
  },
  {
    name: 'edit_ingredientDB_tool',
    description: 'Edit an existing food ingredient in the therapeutic diet database. Use this to correct a mistake or update notes for an ingredient.',
    schema: z.object({
      diet_code: z.string().describe('The diet code (e.g., "SCD", "LOW_FODMAP")'),
      food_name: z.string().describe('The name of the food ingredient to edit.'),
      allowed: z.boolean().optional().describe('Updated allowed status if it needs to change.'),
      note: z.string().optional().describe('Updated notes or warnings.'),
    }),
  }
);
