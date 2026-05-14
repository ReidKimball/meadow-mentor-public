import { BaseMessage, HumanMessage, SystemMessage, AIMessage, ToolMessage } from "@langchain/core/messages";
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from "@langchain/core/prompts";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { loadPrompt } from "../ai_prompts/loadPrompt.js";
import { checkIngredientCompliance } from "../utils/complianceUtils.js";
import { StateGraph, END, START, Annotation } from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { MemorySaver } from "@langchain/langgraph";
import Recipe from "../models/recipe.model.js";
import User from "../models/user.model.js";
import ShoppingList from "../models/shoppingList.model.js";
import TherapeuticDietFood from "../models/therapeuticDietFood.model.js";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import {
  searchRecipesTool,
  getRecipeDetailsTool,
  createRecipeTool,
  editRecipeTool,
  addToShoppingListTool,
  saveUserMemoryTool,
  updateUserStateTool,
  checkIngredientSafetyTool,
  webSearchTool,
  addIngredientDBTool,
  editIngredientDBTool,
} from "./askKayTools.js";
import { getToolNamesPrompt, TOOL_METADATA } from "../config/toolMetadata.js";
import { saveUserMemory } from "../services/aiMemory.service.js";
import { createPendingIngredientIssue } from "../services/linear.service.js"; // Fire-and-forget Linear issue creation for pending ingredients.
const setThinkingBudget = -1; // 0 = off, -1 = dynamic, or set a specific token limit for 2.5 reasoning.
console.log(`[askKayAgent] Using thinking budget: ${setThinkingBudget}`);

/**
 * Selects the Gemini model for Ask Kay from environment configuration.
 *
 * Priority order:
 * 1) GEMINI_MODEL_NAME (shared app-level model selector)
 * 2) gemini-flash-latest (safe fallback)
 *
 * @returns {string}
 */
function selectAskKayGeminiModel() {
  let model = process.env.GEMINI_MODEL_NAME || "gemini-flash-latest";
  return model;
}


/**
 * @typedef {Object} UserProfile
 * @property {string} firstName
 * @property {string} primaryDiet
 * @property {string[]} dietaryRestrictions
 * @property {string[]} customDietaryRestrictions
 * @property {string} conditionTreating
 * @property {boolean} inFlare
 * @property {string} formattedGuidelines
 * @property {string | null} dietStage
 * @property {string} aiMemorySummary
 * @property {object | null} aiMemory
 */


/**
 * @typedef {Object} AgentState
 * @property {BaseMessage[]} messages - The history of the conversation including tool outputs.
 * @property {UserProfile} userProfile - Merged user profile and health data.
 * @property {string | null} imageBase64 - A base64-encoded string of an uploaded image.
 * @property {string | null} userId - The ID of the authenticated user.
 * @property {Array<object>} statusUpdates - A list of status updates to send to the client.
 * @property {object | null} currentRecipe - The latest generated recipe JSON.
 * @property {string | null} recipeExplanation - Captured explanation for the recipe.
 * @property {object | null} validationResult - Result from checkIngredientCompliance.
 * @property {number} correctionAttempts - Counter for the self-correction loop.
 * @property {object | null} finalResponse - The final, structured response.
 * @property {boolean} isConfirmed - Whether a credit-based action has been confirmed.
 */
/** @type {AgentState} */
export const initialAgentState = {
  messages: [],
  userProfile: {},
  userInput: "",
  imageBase64: null,
  userId: null,
  firebaseUID: null,
  statusUpdates: [],
  currentRecipe: null,
  recipeExplanation: null,
  validationResult: null,
  correctionAttempts: 0,
  finalResponse: null,
  isConfirmed: false,
  intent: null,
  recipeRequirements: null, // Stores args from create_recipe tool call
  modificationRequirements: null, // Stores args from edit_recipe tool call
  shoppingListAddRequirements: null, // Stores args from add_to_shopping_list tool call
  shoppingListSourceRecipeId: null,
  promptTemplateName: "generate_recipe_prompt",
  targetRecipeId: null,
  existingRecipeJson: null,
  unknownIngredients: [],
  researchedIngredients: [],
  researchAttempts: 0,
};

const AgentState = Annotation.Root({
  messages: Annotation({
    reducer: (x, y) => x.concat(y),
    default: () => [],
  }),
  userProfile: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => ({}),
  }),
  userInput: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => "",
  }),
  imageBase64: Annotation({
    reducer: (x, y) => y !== undefined ? y : x, // Allow explicit null to clear
    default: () => null,
  }),
  userId: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => null,
  }),
  firebaseUID: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => null,
  }),
  statusUpdates: Annotation({
    reducer: (x, y) => y,
    default: () => [],
  }),
  currentRecipe: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => null,
  }),
  recipeExplanation: Annotation({
    reducer: (x, y) => (y !== undefined ? y : x),
    default: () => null,
  }),
  validationResult: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => null,
  }),
  correctionAttempts: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => 0,
  }),
  finalResponse: Annotation({
    reducer: (x, y) => y !== undefined ? y : x, // Allow explicit null to clear
    default: () => null,
  }),
  isConfirmed: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => false,
  }),
  intent: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => null,
  }),
  recipeRequirements: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => null,
  }),
  modificationRequirements: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => null,
  }),
  shoppingListAddRequirements: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => null,
  }),
  shoppingListSourceRecipeId: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => null,
  }),
  promptTemplateName: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => "generate_recipe_prompt",
  }),
  targetRecipeId: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => null,
  }),
  existingRecipeJson: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => null,
  }),
  unknownIngredients: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => [],
  }),
  researchedIngredients: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => [],
  }),
  researchAttempts: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => 0,
  }),
});

// 1. Define tools
// All tools the LLM can call — used for model binding via llm.bindTools(tools).
const tools = [
  searchRecipesTool,
  getRecipeDetailsTool,
  createRecipeTool,
  editRecipeTool,
  addToShoppingListTool,
  saveUserMemoryTool,
  updateUserStateTool,
  checkIngredientSafetyTool,
  webSearchTool,
  addIngredientDBTool,
  editIngredientDBTool,
];

// Tools handled by the generic ToolNode (no dedicated graph node).
// Tools with dedicated nodes are excluded so their no-op placeholder handlers
// can never silently execute on a routing miss.
const genericNodeTools = [
  webSearchTool,
  addIngredientDBTool,
  editIngredientDBTool,
];
const rawToolNode = new ToolNode(genericNodeTools);

// Priority map: higher value = kept when truncation is needed.
// save_user_memory is highest because it is a durable write the LLM
// will not naturally retry after truncation drops it.
const TOOL_CALL_PRIORITY = {
  save_user_memory: 10,
  create_recipe: 9,
  edit_recipe: 9,
  add_to_shopping_list: 8,
  check_ingredient_safety: 7,
  search_recipes: 6,
  get_recipe_details: 6,
  update_user_state: 5,
};

// Map of tool names to their dedicated graph nodes.
// Used by routeTools to direct tool calls to the correct node.
const DEDICATED_NODE_MAP = {
  create_recipe: "create_recipe_logic",
  edit_recipe: "edit_recipe_logic",
  search_recipes: "search_recipes_logic",
  add_to_shopping_list: "add_to_shopping_list_prepare",
  get_recipe_details: "get_recipe_details_logic",
  save_user_memory: "save_user_memory_node",
  update_user_state: "update_user_state_node",
  check_ingredient_safety: "check_ingredient_safety_node",
};

/**
 * Custom wrapper around the LangGraph ToolNode to emit SSE status updates
 * to the frontend when standard tools finish successfully.
 */
const agentToolsNode = async (state) => {
  console.log("--- Running agentToolsNode ---");
  const result = await rawToolNode.invoke(state);
  
  // Extract messages from the ToolNode result (may be a class instance, not a plain object)
  const resultMessages = result?.messages || [];
  
  const lastMsg = state.messages[state.messages.length - 1];
  const toolCalls = lastMsg?.tool_calls || [];
  
  const statusUpdates = [];
  for (const tc of toolCalls) {
    const meta = TOOL_METADATA[tc.name];
    if (meta) {
      statusUpdates.push({
        type: "status",
        phase: meta.friendlyName,
        message: `${meta.friendlyName} completed.`,
        state: "success",
      });
    }
  }

  console.log(`[agentToolsNode] Emitting ${statusUpdates.length} status updates for tools: ${toolCalls.map(tc => tc.name).join(", ")}`);
  
  return {
    messages: resultMessages,
    statusUpdates,
  };
};

// 2. Define nodes

/**
 * Calls the LLM and lets it decide whether to respond normally or call a tool.
 * @param {AgentState} state The current state of the graph.
 * @returns {Promise<Partial<AgentState>>} Updated state.
 */
const callModelNode = async (state) => {
  console.log("--- Running callModelNode ---");
  const { messages, userProfile, imageBase64 } = state;

  const llm = new ChatGoogleGenerativeAI({
    model: selectAskKayGeminiModel(),
    temperature: 1.0,
    apiKey: process.env.GOOGLE_API_KEY,
    config: {
      thinkingConfig: {
        thinkingBudget: setThinkingBudget,
      },
    },
  });

  // Determine if this specific turn has an image to analyze
  // Check if the latest user message is requesting image analysis
  const lastUserMessage = messages[messages.length - 1];
  const isImageAnalysisTurn = imageBase64 && lastUserMessage && 
    lastUserMessage._getType() === "human" && 
    typeof lastUserMessage.content === "string"; // Only if it's a fresh text message with image
  
  console.log(`[callModelNode] Tool Binding Status: isImageAnalysisTurn=${isImageAnalysisTurn}, Tool Count=${tools.length}`);

  // Bind tools unless this is an image analysis turn (vision + tools can conflict)
  const llmWithTools = isImageAnalysisTurn ? llm : llm.bindTools(tools);

  const systemPromptText = loadPrompt("ask_kay_v26", {
    firstName: userProfile.firstName,
    primaryDiet: userProfile.primaryDiet || "Not specified",
    dietaryRestrictions: userProfile.dietaryRestrictions.join(", ") || "None",
    customDietaryRestrictions:
      userProfile.customDietaryRestrictions.join(", ") || "None",
    conditionTreating: userProfile.conditionTreating,
    inFlare: userProfile.inFlare,
    dynamicDietaryGuidelines: userProfile.formattedGuidelines,
    dietStage: userProfile.dietStage || "None recorded",
    aiMemorySummary: userProfile.aiMemorySummary || "No saved long-term memory yet.",
    bmTrendContextSummary: userProfile.bmTrendContextSummary || "No current BM trend context.",
    sessionEnergyLevel: userProfile.sessionContext?.energyLevel || "null",
    sessionStressMode: userProfile.sessionContext?.stressMode ? "TRUE" : "false",
    sessionExpiresAt: userProfile.sessionContext?.expiresAt || "null",
  }) + getToolNamesPrompt();

  //console.log("[callModelNode] System prompt:", systemPromptText);

  // Build messages array, including image if present
  let llmMessages = [
    new SystemMessage(systemPromptText),
    ...(messages || []),
  ];

  // If there's an image, add it to the last user message for vision analysis
  if (imageBase64) {
    console.log("[callModelNode] Image detected, adding to LLM call for vision analysis");
    const lastMsg = llmMessages[llmMessages.length - 1];
    if (lastMsg && lastMsg._getType() === "human") {
      // Replace last message with multimodal version
      const textContent = typeof lastMsg.content === "string" ? lastMsg.content : "";
      llmMessages[llmMessages.length - 1] = new HumanMessage({
        content: [
          { type: "text", text: textContent || "Please analyze this ingredient label for my diet." },
          { type: "image_url", image_url: `data:image/jpeg;base64,${imageBase64}` },
        ],
      });
    }
  }

  const response = await llmWithTools.invoke(llmMessages);

  let finalResponse = response;
  if (response.tool_calls && response.tool_calls.length > 1) {
    const sorted = [...response.tool_calls].sort(
      (a, b) => (TOOL_CALL_PRIORITY[b.name] || 0) - (TOOL_CALL_PRIORITY[a.name] || 0)
    );

    const winner = sorted[0];
    const winnerIndex = response.tool_calls.indexOf(winner);

    console.warn(
      `[callModelNode] Multiple tool calls detected (${response.tool_calls.length}: ${response.tool_calls.map(tc => tc.name).join(", ")}). Keeping highest priority: ${winner.name}`
    );

    finalResponse = new AIMessage({
      content: response.content,
      tool_calls: [winner],
      additional_kwargs: {
        ...response.additional_kwargs,
        tool_calls: response.additional_kwargs?.tool_calls ? [response.additional_kwargs.tool_calls[winnerIndex]] : undefined,
      },
      response_metadata: response.response_metadata,
      id: response.id,
      usage_metadata: response.usage_metadata,
    });
  }

  // Debug: log the tool calls if they exist
  if (finalResponse.tool_calls && finalResponse.tool_calls.length > 0) {
    console.log("[callModelNode] Tool calls:", finalResponse.tool_calls.map(tc => tc.name));
  } else {
    console.log("[callModelNode] No tool calls, responding conversationally");
  }

  // Clear imageBase64 after processing so it doesn't persist to future turns
  return {
    messages: [finalResponse],
    imageBase64: null,
  };
};

/**
 * Loads the target recipe for editing. If the user has saved (but does not own) the recipe,
 * duplicates it to a new recipe owned by the user, then continues with editing.
 *
 * @param {AgentState} state
 * @returns {Promise<Partial<AgentState>>}
 */
const loadRecipeForEditNode = async (state) => {
  console.log("--- Running loadRecipeForEditNode ---");
  const { modificationRequirements, userId } = state;

  if (!userId || !modificationRequirements) {
    return {
      finalResponse: {
        error: "I couldn't determine which recipe to edit. Please try again and mention the recipe name.",
      },
    };
  }

  const recentRecipeReference = getMostRecentRecipeReferenceFromMessages(state.messages);
  const { recipeId, recipeTitle } = modificationRequirements;
  const targetId = recipeId || recentRecipeReference?.recipeId || null;
  const targetTitle = recipeTitle || recentRecipeReference?.recipeTitle || null;

  console.log(
    "[loadRecipeForEditNode] Recipe state snapshot:",
    JSON.stringify(
      {
        messageCount: Array.isArray(state.messages) ? state.messages.length : 0,
        modificationRequirements: {
          recipeId: recipeId || null,
          recipeTitle: recipeTitle || null,
        },
        recentRecipeReference,
        resolvedTarget: {
          recipeId: targetId,
          recipeTitle: targetTitle,
        },
        currentRecipe: state.currentRecipe
          ? {
              _id: state.currentRecipe._id ? String(state.currentRecipe._id) : null,
              recipeTitle: state.currentRecipe.recipeTitle || null,
            }
          : null,
      },
      null,
      2
    )
  );

  const baseAccessQuery = {
    $or: [{ generatedBy: userId }, { savedBy: userId }],
  };

  let recipe = null;
  if (targetId) {
    recipe = await Recipe.findOne({ _id: targetId, ...baseAccessQuery }).lean();
  }
  if (!recipe && targetTitle) {
    const escaped = targetTitle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    recipe = await Recipe.findOne({
      ...baseAccessQuery,
      recipeTitle: { $regex: `^${escaped}$`, $options: "i" },
    }).lean();
  }

  if (!recipe) {
    return {
      finalResponse: {
        error: "I couldn't find that recipe in your collection. Try asking again and include the exact recipe title, or ask me to search your recipes first.",
      },
    };
  }

  const isOwner = String(recipe.generatedBy) === String(userId);

  if (!isOwner) {
    // Duplicate recipe (similar to recipeCard.controller duplicateRecipe)
    const duplicateData = { ...recipe };
    delete duplicateData._id;
    delete duplicateData.slug;
    delete duplicateData.createdAt;
    delete duplicateData.updatedAt;
    delete duplicateData.__v;

    duplicateData.generatedBy = userId;
    duplicateData.visibility = "private";
    duplicateData.ratings = [];
    duplicateData.savedBy = [userId];

    const duplicatedRecipe = await new Recipe(duplicateData).save();

    await User.updateOne(
      { _id: userId },
      { $addToSet: { savedRecipes: duplicatedRecipe._id } }
    );

    return {
      targetRecipeId: duplicatedRecipe._id.toString(),
      existingRecipeJson: JSON.stringify(
        duplicatedRecipe.toObject ? duplicatedRecipe.toObject() : duplicatedRecipe
      ),
      statusUpdates: [
        {
          type: "status",
          phase: "Modifying Recipe",
          message: "Made you a private copy of that recipe so we can edit it safely...",
          state: "in_progress",
        },
      ],
    };
  }

  return {
    targetRecipeId: recipe._id.toString(),
    existingRecipeJson: JSON.stringify(recipe),
  };
};

/**
 * Fetches the full details of a specific recipe.
 * @param {AgentState} state 
 * @returns {Promise<Partial<AgentState>>}
 */
const getRecipeDetailsNode = async (state) => {
  console.log("--- Running getRecipeDetailsNode ---");
  const { messages } = state;
  const lastMessage = messages[messages.length - 1];
  const toolCall = lastMessage?.tool_calls?.find((tc) => tc.name === "get_recipe_details");

  if (!toolCall) {
    return {
      messages: [
        new ToolMessage({
          tool_call_id: lastMessage.tool_calls?.[0]?.id || "unknown",
          content: "Error: No tool call found for get_recipe_details.",
          name: "get_recipe_details",
        }),
      ],
    };
  }

  const { recipeId, slug } = toolCall.args || {};
  console.log(`[getRecipeDetailsNode] Fetching details for ${recipeId || slug}`);

  try {
    const query = recipeId ? { _id: recipeId } : { slug };
    const recipe = await Recipe.findOne(query).lean();

    if (!recipe) {
      return {
        messages: [
          new ToolMessage({
            tool_call_id: toolCall.id,
            content: "Recipe not found.",
            name: "get_recipe_details",
          }),
        ],
        statusUpdates: [
          {
            type: "status",
            phase: TOOL_METADATA.get_recipe_details.friendlyName,
            message: "Recipe not found.",
            state: "failure",
          },
        ],
      };
    }

    return {
      messages: [
        new ToolMessage({
          tool_call_id: toolCall.id,
          content: JSON.stringify(recipe),
          name: "get_recipe_details",
        }),
      ],
      statusUpdates: [
        {
          type: "status",
          phase: TOOL_METADATA.get_recipe_details.friendlyName,
          message: `Fetched details for: ${recipe.recipeTitle}`,
          state: "success",
        },
      ],
    };
  } catch (error) {
    console.error("[getRecipeDetailsNode] Failed:", error);
    return {
      messages: [
        new ToolMessage({
          tool_call_id: toolCall.id,
          content: "Error fetching recipe details.",
          name: "get_recipe_details",
        }),
      ],
    };
  }
};

/**
 * Handles the search_recipes tool call.
 * Uses the userId from state to securely query the database.
 * @param {AgentState} state The current state of the graph.
 * @returns {Promise<Partial<AgentState>>} Updated state with tool output.
 */
const searchRecipesNode = async (state) => {
  console.log("--- Running searchRecipesNode ---");
  const { messages, userId, userProfile } = state;
  const lastMessage = messages[messages.length - 1];
  const toolCall = lastMessage?.tool_calls?.find((tc) => tc.name === "search_recipes");

  if (!toolCall) {
    console.error("[searchRecipesNode] No search_recipes tool call found.");
    return {
      messages: [
        new ToolMessage({
          tool_call_id: lastMessage.tool_calls?.[0]?.id || "unknown",
          content: "Error: No tool call found for search_recipes.",
          name: "search_recipes",
        }),
      ],
    };
  }

  const { query: rawQuery, scope, mealType, tags, diet } = toolCall.args || {};
  const query = typeof rawQuery === "string" ? rawQuery.trim() : "";
  console.log(`[searchRecipesNode] Searching for "${query}" (scope: ${scope}) for user ${userId}`);

  try {
    let scopeCriteria = {};
    if (scope === "public") {
      scopeCriteria = { visibility: "public" };
    } else if (scope === "all") {
      scopeCriteria = {
        $or: [
          { generatedBy: userId },
          { savedBy: userId },
          { visibility: "public" }
        ]
      };
    } else {
      // Default to private/mine
      // Fix: Only look at "savedBy" so that if a user "unsaves" a recipe they generated,
      // it stops showing up in their "my recipes" search results.
      scopeCriteria = {
        savedBy: userId
      };
    }

    const searchCriteria = { ...scopeCriteria };

    const buildLoosePattern = (text) => {
      const safe = typeof text === "string" ? text : "";
      const parts = safe
        .trim()
        .split(/[\s-]+/)
        .filter(Boolean)
        .map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));

      if (parts.length === 0) return "";
      if (parts.length === 1) return parts[0];
      return parts.join("[-\\s]+");
    };

    const isGenericQuery = /^(recipe|recipes|saved\s+recipes|my\s+recipes|community\s+recipes|public\s+recipes)$/i.test(query);
    const looksLikeObjectId = /^[a-f0-9]{24}$/i.test(query);

    // 1. Text Search (Title/Tags/Slug/SEO) - omit for "list all" style requests
    if (query && !isGenericQuery) {
      const queryPattern = buildLoosePattern(query);

      // If the user pasted an ID, match directly.
      if (looksLikeObjectId) {
        if (!searchCriteria.$and) searchCriteria.$and = [];
        searchCriteria.$and.push({ _id: query });
      } else if (queryPattern) {
        searchCriteria.$and = [
          {
            $or: [
              { recipeTitle: { $regex: queryPattern, $options: "i" } },
              { tags: { $regex: queryPattern, $options: "i" } },
              { slug: { $regex: queryPattern, $options: "i" } },
              { seoSlugCandidate: { $regex: queryPattern, $options: "i" } },
            ],
          },
        ];
      }
    }

    // 2. Meal Type Filter
    if (mealType) {
      searchCriteria.mealType = mealType;
    }

    // 3. Tags Filter (e.g., "flare-friendly")
    if (tags && tags.length > 0) {
      if (!searchCriteria.$and) searchCriteria.$and = [];
      tags.forEach((tag) => {
        const tagPattern = buildLoosePattern(tag);
        if (!tagPattern) return;
        searchCriteria.$and.push({ tags: { $regex: tagPattern, $options: "i" } });
      });
    }

    // 4. Diet Filter
    const dietToFilter = diet || userProfile.primaryDiet;
    if (dietToFilter) {
      searchCriteria.recipeDiet = dietToFilter;
    }

    console.log("[searchRecipesNode] Query:", JSON.stringify(searchCriteria, null, 2));

    let recipes = await Recipe.find(searchCriteria)
      .sort({ updatedAt: -1, createdAt: -1 })
      .limit(25)
      .select('_id recipeTitle recipeDiet mealType slug tags visibility generatedBy savedBy')
      .lean();

    // Relax diet filter if no results and using personal diet as default
    if (recipes.length === 0 && !diet && userProfile.primaryDiet) {
      const relaxedCriteria = { ...searchCriteria };
      delete relaxedCriteria.recipeDiet;
      console.log("[searchRecipesNode] Query (no diet fallback):", JSON.stringify(relaxedCriteria, null, 2));
      recipes = await Recipe.find(relaxedCriteria)
        .sort({ updatedAt: -1, createdAt: -1 })
        .limit(25)
        .select('_id recipeTitle recipeDiet mealType slug tags visibility generatedBy savedBy')
        .lean();
    }

    const results = recipes.map((r) => {
      const recipeId = r._id?.toString?.() ?? r._id;
      
      // Determine if this is a private/saved recipe or a general public one
      const isOwnedOrSaved = 
        String(r.generatedBy) === String(userId) || 
        (r.savedBy && r.savedBy.some(id => String(id) === String(userId)));
      
      // Choose correct URL based on ownership/save status
      const detailPath = isOwnedOrSaved
        ? (r.slug ? `/my-recipes/${r.slug}` : `/my-recipes/${recipeId}`)
        : (r.slug ? `/public-recipes/${r.slug}` : `/public-recipes/${recipeId}`);

      return {
        recipeId,
        title: r.recipeTitle,
        slug: r.slug,
        mealType: r.mealType,
        diet: r.recipeDiet,
        tags: r.tags,
        visibility: r.visibility,
        ownership: isOwnedOrSaved ? "mine/saved" : "community",
        url: detailPath,
        markdownLink: `[${r.recipeTitle}](${detailPath})`,
      };
    });

    return {
      messages: [
        new ToolMessage({
          tool_call_id: toolCall.id,
          content: JSON.stringify(results),
          name: "search_recipes",
        }),
      ],
      statusUpdates: [
        {
          type: "status",
          phase: TOOL_METADATA.search_recipes.friendlyName,
          message: results.length > 0 ? `Found ${results.length} matches.` : "No matches found.",
          state: "success",
        },
      ],
    };
  } catch (error) {
    console.error("[searchRecipesNode] Search failed:", error);
    return {
      messages: [
        new ToolMessage({
          tool_call_id: toolCall.id,
          content: "Error occurred while searching for recipes.",
          name: "search_recipes",
        }),
      ],
    };
  }
};

/**
 * Extracts recipe requirements from the tool call and prepares for generation.
 * This node runs after HITL credit confirmation.
 * @param {AgentState} state The current state of the graph.
 * @returns {Promise<Partial<AgentState>>} Updated state with recipe requirements.
 */
const createRecipeLogicNode = async (state) => {
  console.log("--- Running createRecipeLogicNode ---");

  if (!state.isConfirmed) {
    console.log("[createRecipeLogicNode] Not confirmed, returning empty.");
    return {};
  }

  // Extract the tool call args from the last AI message
  const { messages } = state;
  const lastMessage = messages[messages.length - 1];
  const toolCall = lastMessage?.tool_calls?.find((tc) => tc.name === "create_recipe");

  if (!toolCall) {
    console.error("[createRecipeLogicNode] No create_recipe tool call found.");
    return {};
  }

  const requirements = toolCall.args;
  console.log("[createRecipeLogicNode] Extracted requirements:", JSON.stringify(requirements));

  // Build the recipe request string for the generation prompt
  let recipeRequest = requirements.dishDescription || "a recipe";
  if (requirements.mainIngredients?.length > 0) {
    recipeRequest += ` using ${requirements.mainIngredients.join(", ")}`;
  }
  if (requirements.mealType) {
    recipeRequest += ` for ${requirements.mealType}`;
  }
  if (requirements.specialRequirements) {
    recipeRequest += `. Special requirements: ${requirements.specialRequirements}`;
  }

  return {
    recipeRequirements: requirements,
    userInput: recipeRequest,
    isConfirmed: false,
    finalResponse: null, // Clear stale response from previous turns
    statusUpdates: [
      {
        type: "status",
        phase: TOOL_METADATA.create_recipe.friendlyName,
        message: TOOL_METADATA.create_recipe.description,
        state: "in_progress",
      },
    ],
  };
};

/**
 * Extracts modification requirements from the tool call and prepares for modification.
 * This node runs after HITL credit confirmation.
 * @param {AgentState} state The current state of the graph.
 * @returns {Promise<Partial<AgentState>>} Updated state with modification requirements.
 */
const editRecipeLogicNode = async (state) => {
  console.log("--- Running editRecipeLogicNode ---");

  if (!state.isConfirmed) {
    console.log("[editRecipeLogicNode] Not confirmed, returning empty.");
    return {};
  }

  // Extract the tool call args from the last AI message
  const { messages } = state;
  const lastMessage = messages[messages.length - 1];
  const toolCall = lastMessage?.tool_calls?.find((tc) => tc.name === "edit_recipe");

  if (!toolCall) {
    console.error("[editRecipeLogicNode] No edit_recipe tool call found.");
    return {};
  }

  const modifications = toolCall.args;
  console.log("[editRecipeLogicNode] Extracted modifications:", JSON.stringify(modifications));

  // Build the modification request string
  let modRequest = `Modify the recipe`;
  if (modifications.recipeTitle) {
    modRequest += ` "${modifications.recipeTitle}"`;
  }
  modRequest += `: ${modifications.modifications}`;

  return {
    modificationRequirements: modifications,
    userInput: modRequest,
    promptTemplateName: "edit_recipe_prompt",
    isConfirmed: false,
    finalResponse: null, // Clear stale response from previous turns
    statusUpdates: [
      {
        type: "status",
        phase: TOOL_METADATA.edit_recipe.friendlyName,
        message: TOOL_METADATA.edit_recipe.description,
        state: "in_progress",
      },
    ],
  };
};

/**
 * Calls the LLM to generate a recipe based on the requirements.
 */
export const generateRecipeNode = async (state, config) => {
  console.log("--- Running generateRecipeNode ---");
  const {
    userInput,
    messages,
    userProfile,
    correctionAttempts,
    promptTemplateName,
    existingRecipeJson,
  } = state;

  const safeExistingRecipeJson =
    typeof existingRecipeJson === "string"
      ? existingRecipeJson.replace(/\{/g, "{{").replace(/\}/g, "}}").trim()
      : "";

  const llm = new ChatGoogleGenerativeAI({
    model: selectAskKayGeminiModel(),
    temperature: 1.0,
    apiKey: process.env.GOOGLE_API_KEY,
    config: {
      thinkingConfig: {
        thinkingBudget: setThinkingBudget,
      },
    },
  });

  const promptVars = {
    firstName: userProfile.firstName,
    primaryDiet: userProfile.primaryDiet || "Not specified",
    dietaryRestrictions: userProfile.dietaryRestrictions.join(", ") || "None",
    customDietaryRestrictions:
      userProfile.customDietaryRestrictions.join(", ") || "None",
    conditionTreating: userProfile.conditionTreating,
    inFlare: userProfile.inFlare,
    dynamicDietaryGuidelines: userProfile.formattedGuidelines,
    dietStage: userProfile.dietStage || "None recorded",
    aiMemorySummary: userProfile.aiMemorySummary || "No saved long-term memory yet.",
    bmTrendContextSummary: userProfile.bmTrendContextSummary || "No current BM trend context.",
    sessionEnergyLevel: userProfile.sessionContext?.energyLevel || "null",
    sessionStressMode: userProfile.sessionContext?.stressMode ? "TRUE" : "false",
    sessionExpiresAt: userProfile.sessionContext?.expiresAt || "null",
    recipeRequest: userInput,
    editRequest: userInput,
    existingRecipeJson: safeExistingRecipeJson,
  };

  const systemPrompt = loadPrompt(promptTemplateName || "generate_recipe_prompt", promptVars);

  const responsePrompt = ChatPromptTemplate.fromMessages([
    ["system", systemPrompt],
    new MessagesPlaceholder("messages"),
    ["human", "{input}"],
  ]);

  const responseChain = responsePrompt.pipe(llm);

  const invokePayload = {
    input: userInput,
    messages: messages,
  };

  const response = await responseChain.invoke(invokePayload);

  // 5. Parse and Update State
  const recipeMatch = response.content.match(
    /<recipe_json>([\s\S]*?)<\/recipe_json>/
  );
  let recipeJson = null;
  let recipeExplanation = null;

  if (recipeMatch && recipeMatch[1]) {
    try {
      recipeJson = JSON.parse(recipeMatch[1]);
      console.log(
        `[generateRecipeNode] Successfully parsed recipe: "${recipeJson.recipeTitle}"`
      );

      const closeTagIndex = response.content.indexOf('</recipe_json>');
      if (closeTagIndex !== -1) {
        recipeExplanation = response.content
          .substring(closeTagIndex + '</recipe_json>'.length)
          .trim();
      }
    } catch (e) {
      console.error("[generateRecipeNode] Failed to parse recipe JSON", e);
    }
  }

  const statusUpdates = [];
  if (correctionAttempts > 0) {
    statusUpdates.push({
      type: "status",
      phase: "Correcting Recipe",
      message: `Correction attempt ${correctionAttempts} complete. Regenerating...`,
      state: "success",
    });
  }

  if (recipeJson) {
    statusUpdates.push({
      type: "status",
      phase: TOOL_METADATA.create_recipe.friendlyName,
      message: "Recipe draft is complete. Moving to validation.",
      state: "success",
    });
  } else {
    statusUpdates.push({
      type: "status",
      phase: "Generating Recipe",
      message: "Could not generate a recipe from the response.",
      state: "failure",
    });
  }

  statusUpdates.push({
    type: "status",
    phase: "Validating Recipe",
    message: "Checking ingredients for compliance...",
    state: "in_progress",
  });

  return {
    currentRecipe: recipeJson,
    recipeExplanation: recipeExplanation,
    statusUpdates,
    // Add the AI response to messages so the agent knows what it did
    messages: [
      new AIMessage({
        content: recipeJson
          ? "Recipe draft generated and stored in state."
          : "Recipe generation attempt completed.",
      }),
    ],
  };
};

/**
 * Saves the edited recipe back to MongoDB (allowed fields only).
 * Disallowed fields are preserved from the existing recipe document.
 *
 * @param {AgentState} state
 * @returns {Promise<Partial<AgentState>>}
 */
const saveEditedRecipeNode = async (state) => {
  console.log("--- Running saveEditedRecipeNode ---");
  const { currentRecipe, targetRecipeId, existingRecipeJson, recipeExplanation } = state;

  if (!currentRecipe || !targetRecipeId || !existingRecipeJson) {
    return {
      finalResponse: {
        error: "I couldn't save your recipe changes due to missing context. Please try again.",
      },
    };
  }

  const existing = JSON.parse(existingRecipeJson);

  const allowedUpdate = {
    recipeTitle: currentRecipe.recipeTitle,
    recipeDescription: currentRecipe.recipeDescription,
    mealType: currentRecipe.mealType,
    prepTime: currentRecipe.prepTime,
    cookTime: currentRecipe.cookTime,
    totalTime: currentRecipe.totalTime,
    recipeYield: currentRecipe.recipeYield,
    ingredients: currentRecipe.ingredients,
    steps: currentRecipe.steps,
    notes: currentRecipe.notes,
    calories: currentRecipe.calories,
    tags: currentRecipe.tags,
    visibility: currentRecipe.visibility,
    seoSlugCandidate: currentRecipe.seoSlugCandidate ?? existing.seoSlugCandidate,
  };

  const saved = await Recipe.findByIdAndUpdate(
    targetRecipeId,
    { $set: allowedUpdate },
    { new: true }
  ).lean();

  return {
    currentRecipe: saved,
    finalResponse: {
      recipe: saved,
      conversationalText: recipeExplanation || "",
      shouldGenerateImage: true,
    },
    statusUpdates: [
      {
        type: "status",
        phase: "Modifying Recipe",
        message: "Recipe updated successfully!",
        state: "success",
      },
    ],
    modificationRequirements: null,
    promptTemplateName: "generate_recipe_prompt",
    targetRecipeId: null,
    existingRecipeJson: null,
  };
};

/**
 * Validates the ingredients of the current recipe against the user's diet.
 * @param {AgentState} state The current state of the graph.
 * @param {object} config The graph's config object, containing the socket.
 * @returns {Promise<Partial<AgentState>>} The updated state with the validation result.
 */
export const validateRecipeNode = async (state, config) => {
  console.log("--- Running validateRecipeNode ---");
  const { currentRecipe, userProfile } = state;

  if (!currentRecipe || !currentRecipe.ingredients) {
    console.error(
      "[validateRecipeNode] No recipe or ingredients found in state to validate."
    );
    return {
      validationResult: { error: "Missing recipe data for validation." },
      statusUpdates: [
        {
          type: "status",
          phase: "Validating Recipe",
          message: "Cannot validate a recipe that was not generated.",
          state: "failure",
        },
      ],
    };
  }

  const ingredientNames = currentRecipe.ingredients.map((ing) => ing.name);
  const validationResult = await checkIngredientCompliance(
    ingredientNames,
    userProfile.primaryDiet
  );
  
  const unknownIngredientsList = validationResult.results
    .filter(r => !r.found)
    .map(r => r.ingredient);

  const isCompliant =
    validationResult.nonCompliantCount === 0 &&
    validationResult.notFoundCount === 0;

  let statusUpdate;
  if (isCompliant) {
    statusUpdate = {
      type: "status",
      phase: "Validating Recipe",
      message: "Recipe is fully compliant!",
      state: "success",
    };
  } else if (unknownIngredientsList.length > 0) {
    statusUpdate = {
      type: "status",
      phase: "Validating Recipe",
      message: `Found ${unknownIngredientsList.length} unknown ingredients. Initiating research...`,
      state: "in_progress",
    };
  } else {
    const message = `Found ${validationResult.nonCompliantCount} non-compliant ingredients.`;
    statusUpdate = {
      type: "status",
      phase: "Validating Recipe",
      message: message,
      state: "failure",
    };
  }

  return {
    validationResult: validationResult,
    unknownIngredients: unknownIngredientsList,
    statusUpdates: [statusUpdate],
  };
};

/**
 * Node to research unknown ingredients using Google Search and update the DB.
 * @param {AgentState} state The current state of the graph.
 * @param {object} config The graph's config object.
 * @returns {Promise<Partial<AgentState>>} The updated state with researched ingredients.
 */
export const researchUnknownIngredientsNode = async (state, config) => {
  console.log("--- Running researchUnknownIngredientsNode ---");
  const { unknownIngredients, userProfile, researchAttempts } = state;

  if (!unknownIngredients || unknownIngredients.length === 0) {
    return {};
  }

  const dietCode = userProfile.primaryDiet;
  if (!dietCode) {
    console.warn("[researchUnknownIngredientsNode] No primaryDiet found. Skipping research.");
    return {};
  }

  const llm = new ChatGoogleGenerativeAI({
    model: selectAskKayGeminiModel(),
    temperature: 0.1, // Keep it factual
    apiKey: process.env.GOOGLE_API_KEY,
  });
  
  // Use Gemini's search grounding tool
  const llmWithSearch = llm.bindTools([
    {
      "googleSearch": {}
    }
  ]);

  const prompt = `
    You are an expert clinical nutritionist specialized in therapeutic diets, specifically the ${dietCode} diet.
    We have encountered ${unknownIngredients.length} ingredients that are not in our ${dietCode} compliance database.
    
    Ingredients to research: ${unknownIngredients.join(", ")}
    
    Please use your built-in Google Search tool to determine if each of these ingredients is fundamentally "legal" or "allowed" on the strict ${dietCode} diet.
    Do not guess. You must return your findings as strictly formatted JSON.
    Provide ONLY valid JSON containing a single "results" array. No conversational text.
    
    Format:
    {
      "results": [
        {
          "ingredient": "string (the name of the ingredient)",
          "allowed": boolean (true if fundamentally allowed, false if not allowed),
          "note": "string (brief explanation, 1-2 sentences)"
        }
      ]
    }
  `;

  let researchData;
  try {
    console.log(`[researchUnknownIngredientsNode] Prompting LLM to research: ${unknownIngredients.join(", ")}`);
    const response = await llmWithSearch.invoke([new HumanMessage({ content: prompt })]);
    
    // MMA-269: Use regex to extract JSON from markdown code blocks
    const jsonMatch = response.content.match(/```json\s*([\s\S]*?)\s*```/);
    const text = jsonMatch ? jsonMatch[1] : response.content;
    researchData = JSON.parse(text.trim());
    
  } catch (error) {
    console.error("[researchUnknownIngredientsNode] Failed to research ingredients:", error);
    // MMA-266: Clear unknownIngredients to prevent infinite loop back to this node
    return {
      unknownIngredients: [],
      researchAttempts: (researchAttempts || 0) + 1,
      statusUpdates: [
        {
          type: "status",
          phase: "Researching Ingredients",
          message: "Web search failed. Reverting to original validation logic.",
          state: "failure",
        },
      ],
    };
  }

  if (!researchData || !researchData.results) {
    // MMA-266: Clear unknownIngredients to prevent infinite loop
    return { unknownIngredients: [], researchAttempts: (researchAttempts || 0) + 1 };
  }

  const researchedIngredients = researchData.results;
  
  // Save to Database (parallel for performance)
  // Track failed saves so they remain in unknownIngredients for retry/error handling
  const failedIngredients = [];
  const saveOperations = researchedIngredients.map(research => {
    console.log(`[researchUnknownIngredientsNode] Saving verified ingredient to DB: ${research.ingredient} - Allowed: ${research.allowed}`);
    // Use the Mongoose model directly as doing a tool call back and forth in a node is complicated.
    return TherapeuticDietFood.findOneAndUpdate(
      { diet_code: dietCode, normalized_food_name: research.ingredient.toLowerCase().trim() },
      {
        diet_code: dietCode,
        food_name: research.ingredient,
        normalized_food_name: research.ingredient.toLowerCase().trim(),
        verification_status: 'pending',
        allowed: research.allowed,
        note: research.note || null,
        source_file: "askKayAgent-WebSearch",
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).catch(err => {
      console.error(`[researchUnknownIngredientsNode] Error saving ${research.ingredient} to DB:`, err);
      failedIngredients.push(research.ingredient);
    });
  });
  await Promise.all(saveOperations);

  // Fire-and-forget: create a Linear issue for each successfully saved ingredient
  for (const research of researchedIngredients) {
    if (!failedIngredients.includes(research.ingredient)) {
      createPendingIngredientIssue({
        diet_code: dietCode,
        food_name: research.ingredient,
        allowed: research.allowed,
        note: research.note || null,
        createdAt: new Date().toISOString(),
      }).catch(() => {});
    }
  }

  const savedCount = researchedIngredients.length - failedIngredients.length;

  return {
    researchedIngredients: researchedIngredients,
    // Keep failed ingredients in unknownIngredients so the graph can retry or handle the error
    unknownIngredients: failedIngredients, // MMA-266: Only clear successfully saved ingredients
    researchAttempts: (researchAttempts || 0) + 1,
    statusUpdates: [
      {
        type: "status",
        phase: "Researching Ingredients",
        message: failedIngredients.length > 0
          ? `Saved ${savedCount} ingredients but ${failedIngredients.length} failed to save. Re-validating...`
          : `Updated food database with ${savedCount} ingredients. Re-validating recipe...`,
        state: failedIngredients.length > 0 ? "failure" : "success",
      },
    ],
  };
};

/**
 * Prepares a new prompt to instruct the LLM to correct a non-compliant recipe.
 * @param {AgentState} state The current state of the graph.
 * @param {object} config The graph's config object, containing the socket.
 * @returns {Promise<Partial<AgentState>>} The updated state with a new userInput for the next generation attempt.
 */
export const prepareCorrectionNode = async (state, config) => {
  console.log("--- Running prepareCorrectionNode ---");
  const { currentRecipe, validationResult, correctionAttempts } = state;

  const nonCompliantIngredients = validationResult.results
    .filter((r) => !r.found || !r.allowed)
    .map((r) => `\"${r.ingredient}\"`);

  const correctionInput = `The recipe you just generated, "${
    currentRecipe.recipeTitle
  }", is not compliant with the user's diet. The following ingredients are not allowed: ${nonCompliantIngredients.join(
    ", "
  )}. Please correct the recipe by replacing ONLY these ingredients with compliant alternatives and provide the full, corrected recipe in the <recipe_json> format. Do not add any conversational text before or after the JSON block.`;

  return {
    userInput: correctionInput, // This new input will be fed back into the generateRecipeNode
    correctionAttempts: correctionAttempts + 1,
    statusUpdates: [
      {
        type: "status",
        phase: "Correcting Recipe",
        message: `Attempting correction ${correctionAttempts + 1}...`,
        state: "in_progress",
      },
    ],
  };
};

/**
 * Handles the case where the agent fails to generate a compliant recipe after multiple attempts.
 * @param {AgentState} state The current state of the graph.
 * @param {object} config The graph's config object, containing the socket.
 * @returns {Promise<Partial<AgentState>>} The updated state with a final error message.
 */
export const handleFailureNode = async (state, config) => {
  console.log("--- Running handleFailureNode ---");

  return {
    finalResponse: {
      error:
        "I tried to create a recipe, but couldn't make it compliant after a few tries. Please try a different request!",
    },
    statusUpdates: [
      {
        type: "status",
        phase: "Correcting Recipe",
        message: "Failed to correct recipe after multiple attempts.",
        state: "failure",
      },
    ],
  };
};

/**
 * Generates the final conversational response after a recipe has been successfully validated.
 * @param {AgentState} state The current state of the graph.
 * @param {object} config The graph's config object, containing the socket.
 * @returns {Promise<Partial<AgentState>>} The updated state with the final response object.
 */
export const finalResponseNode = async (state, config) => {
  console.log("--- Running finalResponseNode ---");
  const { currentRecipe, userProfile, modificationRequirements, recipeExplanation } = state;

  const statusUpdates = [
    {
      type: "status",
      phase: "Generating Summary",
      message: "Preparing response...",
      state: "in_progress",
    },
  ];

  let conversationalText = "";
  if (modificationRequirements) {
    conversationalText = recipeExplanation || "";
  } else {
    // Generate a brief explanation about the recipe's benefits
    const llm = new ChatGoogleGenerativeAI({
      model: "gemini-flash-lite-latest",
      temperature: 1.0,
      apiKey: process.env.GOOGLE_API_KEY,
    });

    const explanationPrompt = `You just created a recipe called "${currentRecipe.recipeTitle}" for ${userProfile.firstName}.
Their diet is ${userProfile.primaryDiet} and they are treating ${userProfile.conditionTreating}.
${userProfile.inFlare ? "They are currently in a flare." : ""}

Write a brief (2-3 sentences) follow-up explaining why this recipe is beneficial for their condition and diet.
Then suggest they can save it to [My Recipes](/saved-recipes) or add ingredients to their [Shopping List](/shopping-list).
Do NOT repeat the ingredients or steps - they already see the recipe card.`;

    const explanationResponse = await llm.invoke([
      new HumanMessage(explanationPrompt),
    ]);

    conversationalText = explanationResponse.content || "";
    console.log(`[finalResponseNode] Generated explanation: ${conversationalText.substring(0, 100)}...`);
  }

  statusUpdates.push({
    type: "status",
    phase: "Generating Summary",
    message: "Summary complete.",
    state: "success",
  });

  return {
    finalResponse: {
      recipe: currentRecipe,
      conversationalText: conversationalText,
    },
    statusUpdates,
  };
};

/**
 * Node to generate the final conversational response for non-recipe paths.
 * @param {import("@langchain/langgraph").MessagesState} state - The current agent state.
 * @returns {Promise<Partial<import("@langchain/langgraph").MessagesState>>} State updates.
 */
const finalConversationalNode = async (state) => {
  console.log("--- Running finalConversationalNode ---");
  const { messages } = state;
  const lastMsg = messages[messages.length - 1];

  const content = typeof lastMsg?.content === "string" ? lastMsg.content : "";
  const recipeMatch = content.match(/<recipe_json>([\s\S]*?)<\/recipe_json>/);

  if (recipeMatch && recipeMatch[1]) {
    try {
      const recipeJson = JSON.parse(recipeMatch[1]);
      const closeTagIndex = content.indexOf("</recipe_json>");
      const afterTagText =
        closeTagIndex !== -1
          ? content.substring(closeTagIndex + "</recipe_json>".length).trim()
          : "";

      return {
        finalResponse: {
          recipe: recipeJson,
          conversationalText: afterTagText,
        },
      };
    } catch (e) {
      console.error("[finalConversationalNode] Failed to parse recipe JSON", e);
    }
  }

  // Check if a recipe was fetched via get_recipe_details tool earlier in this turn
  for (let i = messages.length - 2; i >= 0; i--) {
    const msg = messages[i];
    
    // Stop searching at human message boundary (previous turn)
    if (msg?._getType?.() === "human") {
      break;
    }
    
    // Check for get_recipe_details ToolMessage
    if (msg?.name === "get_recipe_details" && typeof msg.content === "string") {
      try {
        const recipe = JSON.parse(msg.content);
        // Verify it's an actual recipe object (has expected fields)
        if (recipe && recipe.recipeTitle) {
          console.log(`[finalConversationalNode] Found recipe from get_recipe_details: ${recipe.recipeTitle}`);
          return {
            finalResponse: {
              recipe,
              conversationalText: content,
            },
          };
        }
      } catch (e) {
        console.error("[finalConversationalNode] Failed to parse get_recipe_details result", e);
      }
      // Only check the most recent get_recipe_details call, even if parsing failed
      break;
    }
  }

  return {
    finalResponse: {
      conversationalText: lastMsg.content,
    },
  };
};

/**
 * Converts a get_recipe_details ToolMessage into a finalResponse with a recipe object.
 * This enables the backend controller to emit a recipeCard SSE event so the frontend
 * renders a GeneratedRecipeSummaryCard in chat.
 * @param {import("@langchain/langgraph").MessagesState} state
 * @returns {Promise<Partial<import("@langchain/langgraph").MessagesState>>}
 */
const finalRecipeDetailsNode = async (state) => {
  console.log("--- Running finalRecipeDetailsNode ---");
  const { messages } = state;
  const lastMsg = messages[messages.length - 1];

  const content = typeof lastMsg?.content === "string" ? lastMsg.content : "";
  try {
    const recipe = JSON.parse(content);
    return {
      finalResponse: {
        recipe,
        conversationalText: "",
      },
    };
  } catch (_) {
    return {
      finalResponse: {
        conversationalText: content || "Recipe not found.",
      },
    };
  }
};

/**
 * Routes after the generic ToolNode runs.
 * If the tool was get_recipe_details, finish by emitting a recipe card.
 * Otherwise, return to the agent to continue reasoning.
 * @param {import("@langchain/langgraph").MessagesState} state
 * @returns {string}
 */
const routeAfterTools = (state) => {
  const { messages } = state;
  const lastMsg = messages[messages.length - 1];

  if (lastMsg?.name === "get_recipe_details") return "final_recipe_details";
  return "agent";
};

/**
 * Attempts to extract the most recent Recipe ID from chat history.
 * The controller injects recipe cards into the LLM context with a "Recipe ID:" line.
 * @param {BaseMessage[]} messages
 * @returns {string|null}
 */
const getMostRecentRecipeReferenceFromMessages = (messages) => {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const content = messages[i]?.content;

    if (Array.isArray(content)) {
      for (const block of content) {
        if (block?.type === "recipe" && block.data) {
          return {
            recipeId: block.data._id ? String(block.data._id) : null,
            recipeTitle: block.data.recipeTitle || null,
          };
        }
      }
    }

    if (typeof content !== "string") continue;
    const recipeIdMatch = content.match(/Recipe ID:\s*([a-f0-9]{24})/i);
    const recipeTitleMatch = content.match(/Recipe Title:\s*(.+)/i);

    if (recipeIdMatch?.[1] || recipeTitleMatch?.[1]) {
      return {
        recipeId: recipeIdMatch?.[1] || null,
        recipeTitle: recipeTitleMatch?.[1]?.trim() || null,
      };
    }
  }

  return null;
};

const getMostRecentRecipeIdFromMessages = (messages) => {
  return getMostRecentRecipeReferenceFromMessages(messages)?.recipeId || null;
};

/**
 * Prepares the add_to_shopping_list ingredients list.
 * This node runs AFTER the credit confirmation (add_to_shopping_list_logic).
 * If the user has not clarified ALL vs SELECTED ingredients, it asks a follow-up question.
 * If selection is clear, it stores the ingredient list in state so the execute node can run.
 * @param {AgentState} state
 * @returns {Promise<Partial<AgentState>>}
 */
const addToShoppingListPrepareNode = async (state) => {
  console.log("--- Running addToShoppingListPrepareNode ---");
  const { messages, userId, firebaseUID, shoppingListSourceRecipeId } = state;
  console.log(`[addToShoppingListPrepareNode] Initial state: userId=${userId}, sourceRecipeId=${shoppingListSourceRecipeId}`);
  const lastMessage = messages[messages.length - 1];
  const toolCall = lastMessage?.tool_calls?.find(
    (tc) => tc.name === "add_to_shopping_list"
  );

  const baseStateUpdate = { finalResponse: null };

  if (!toolCall) {
    console.error("[addToShoppingListPrepareNode] No add_to_shopping_list tool call found.");
    return {
      ...baseStateUpdate,
      messages: [
        new ToolMessage({
          tool_call_id: lastMessage.tool_calls?.[0]?.id || "unknown",
          content: "Error: No tool call found for add_to_shopping_list.",
          name: "add_to_shopping_list",
        }),
      ],
    };
  }

  const {
    recipeId: rawRecipeId,
    manualIngredientNames,
    selectionMode,
    selectedIngredientIndexes,
    selectedIngredientNames,
  } = toolCall.args || {};

  const normalizedManualNames = Array.isArray(manualIngredientNames)
    ? manualIngredientNames
        .map((n) => String(n || "").trim())
        .filter(Boolean)
    : [];

  if (normalizedManualNames.length > 0) {
    const manualIngredientsToAdd = normalizedManualNames.map((name) => ({ name }));

    console.log(`[addToShoppingListPrepareNode] Manual ingredients detected: ${normalizedManualNames.join(", ")}`);
    return {
      ...baseStateUpdate,
      shoppingListAddRequirements: {
        selectionMode: "manual",
        ingredients: manualIngredientsToAdd,
      },
    };
  }
  
  console.log(`[addToShoppingListPrepareNode] No manual ingredients, searching for recipeId...`);

  const looksLikeObjectId = (value) => {
    if (typeof value !== "string") return false;
    return /^[a-f0-9]{24}$/i.test(value.trim());
  };

  const normalizedRawRecipeId = looksLikeObjectId(rawRecipeId) ? rawRecipeId.trim() : null;
  const normalizedSourceRecipeId = looksLikeObjectId(shoppingListSourceRecipeId)
    ? shoppingListSourceRecipeId.trim()
    : null;

  const recipeId =
    normalizedRawRecipeId ||
    normalizedSourceRecipeId ||
    getMostRecentRecipeIdFromMessages(messages);

  if (!recipeId) {
    return {
      ...baseStateUpdate,
      messages: [
        new AIMessage(
          "Which recipe should I pull ingredients from? Open the recipe card you want, or tell me the recipe name, then I can add ingredients to your shopping list."
        ),
      ],
    };
  }

  const baseAccessQuery = {
    $or: [{ generatedBy: userId }, { savedBy: userId }],
  };

  const candidateRecipeIds = [
    normalizedRawRecipeId,
    normalizedSourceRecipeId,
    getMostRecentRecipeIdFromMessages(messages),
  ]
    .filter(Boolean)
    .map((id) => String(id).trim());

  const uniqueCandidateRecipeIds = [...new Set(candidateRecipeIds)];

  let recipe = null;
  let resolvedRecipeId = null;
  for (const candidateId of uniqueCandidateRecipeIds) {
    // eslint-disable-next-line no-await-in-loop
    const found = await Recipe.findOne({ _id: candidateId, ...baseAccessQuery })
      .select("_id recipeTitle ingredients")
      .lean();

    if (found) {
      recipe = found;
      resolvedRecipeId = candidateId;
      break;
    }
  }

  if (!recipe) {
    return {
      ...baseStateUpdate,
      messages: [
        new AIMessage(
          "I couldn't find that recipe in your collection. Please open the recipe card again (View Details) and try once more."
        ),
      ],
    };
  }

  const ingredientLines = (recipe.ingredients || []).map((ing, i) => {
    const amount = ing.amount ?? "";
    const unit = ing.unit ?? "";
    const name = ing.name ?? "";
    return `${i + 1}. ${amount} ${unit} ${name}`.replace(/\s+/g, " ").trim();
  });

  if (selectionMode !== "all" && selectionMode !== "selected") {
    return {
      ...baseStateUpdate,
      shoppingListSourceRecipeId: resolvedRecipeId,
      messages: [
        new AIMessage(
          `Do you want me to add **all** ingredients from "${recipe.recipeTitle}" to your shopping list, or only **selected** ones?\n\nReply with:\n- all\n- selected (and list ingredient names, like: "salmon, zucchini")\n\nIngredients:\n${ingredientLines.join("\n")}\n\nNote: This costs 1 credit after you choose.`
        ),
      ],
    };
  }

  let ingredientsToAdd = [];
  if (selectionMode === "all") {
    ingredientsToAdd = recipe.ingredients || [];
  } else {
    const hasNames = Array.isArray(selectedIngredientNames) && selectedIngredientNames.length > 0;
    const byIndex = Array.isArray(selectedIngredientIndexes)
      ? selectedIngredientIndexes
          .map((n) => Number(n))
          .filter((n) => Number.isFinite(n) && n >= 1)
          .map((n) => (recipe.ingredients || [])[n - 1])
          .filter(Boolean)
      : [];

    const byName = hasNames
      ? (recipe.ingredients || []).filter((ing) => {
          const ingName = (ing.name || "").toLowerCase().trim();
          return selectedIngredientNames.some((n) =>
            ingName.includes(String(n).toLowerCase().trim())
          );
        })
      : [];

    ingredientsToAdd = [
      ...new Map(
        [...byIndex, ...byName]
          .filter(Boolean)
          .map((ing) => [(ing.name || "").toLowerCase().trim(), ing])
      ).values(),
    ];
  }

  if (!ingredientsToAdd || ingredientsToAdd.length === 0) {
    return {
      ...baseStateUpdate,
      shoppingListSourceRecipeId: resolvedRecipeId,
      messages: [
        new AIMessage(
          `I couldn't tell which ingredients you wanted. Reply with **all** or send ingredient numbers like **1, 3, 5**.\n\nIngredients:\n${ingredientLines.join("\n")}`
        ),
      ],
    };
  }



  console.log(`[addToShoppingListPrepareNode] Final requirements prepared for recipe: ${recipe.recipeTitle}. Ingredient count: ${ingredientsToAdd.length}`);
  return {
    ...baseStateUpdate,
    shoppingListAddRequirements: {
      recipeId: resolvedRecipeId,
      selectionMode,
      ingredients: ingredientsToAdd,
      recipeTitle: recipe.recipeTitle,
    },
    shoppingListSourceRecipeId: resolvedRecipeId,
  };
};

/**
 * Kicks off the paid shopping list add flow after the user confirms spending a credit.
 * @param {AgentState} state
 * @returns {Promise<Partial<AgentState>>}
 */
const addToShoppingListLogicNode = async (state) => {
  console.log("--- Running addToShoppingListLogicNode ---");

  if (!state.isConfirmed) {
    console.log("[addToShoppingListLogicNode] Not confirmed, returning empty.");
    return {};
  }

  return {
    isConfirmed: false,
    finalResponse: null, // Clear stale response from previous turns
    statusUpdates: [
      {
        type: "status",
        phase: TOOL_METADATA.add_to_shopping_list.friendlyName,
        message: TOOL_METADATA.add_to_shopping_list.description,
        state: "in_progress",
      },
    ],
  };
};

/**
 * Adds ingredients to the user's shopping list using the same merge rules as the controller.
 * @param {AgentState} state
 * @returns {Promise<Partial<AgentState>>}
 */
const addToShoppingListExecuteNode = async (state) => {
  console.log("--- Running addToShoppingListExecuteNode ---");
  const { firebaseUID, shoppingListAddRequirements } = state;
  console.log(`[addToShoppingListExecuteNode] Requirements found: ${!!shoppingListAddRequirements}, Ingredient count: ${shoppingListAddRequirements?.ingredients?.length}`);

  if (!firebaseUID || !shoppingListAddRequirements?.ingredients?.length) {
    return {
      finalResponse: {
        conversationalText:
          "I couldn't add ingredients because I was missing shopping list information. Please try again.",
      },
    };
  }

  let shoppingList = await ShoppingList.findOne({ firebaseUID });
  if (!shoppingList) {
    shoppingList = await ShoppingList.create({ firebaseUID, items: [] });
  }

  const requested = shoppingListAddRequirements.ingredients;

  for (const incomingIngredient of requested) {
    if (!incomingIngredient?.name) continue;

    const name = String(incomingIngredient.name).toLowerCase().trim();
    const existingItem = shoppingList.items.find((item) => item.name === name);

    if (existingItem) {
      if (typeof incomingIngredient.amount === "number") {
        existingItem.amount = (existingItem.amount || 0) + incomingIngredient.amount;
      }
    } else {
      shoppingList.items.push({
        name,
        amount: incomingIngredient.amount,
        unit: incomingIngredient.unit,
        checked: false,
      });
    }
  }

  const updatedShoppingList = await shoppingList.save();

  const summaryLines = requested
    .filter((i) => i?.name)
    .map((i) => {
      const amount = i.amount ?? "";
      const unit = i.unit ?? "";
      const name = String(i.name).toLowerCase().trim();
      return `- ${amount} ${unit} ${name}`.replace(/\s+/g, " ").trim();
    });

  const recipeTitle = shoppingListAddRequirements.recipeTitle
    ? ` from "${shoppingListAddRequirements.recipeTitle}"`
    : "";

  console.log(`[addToShoppingListExecuteNode] Successfully updated shopping list for user: ${firebaseUID}`);
  return {
    finalResponse: {
      conversationalText: `Added ${summaryLines.length} ingredient${summaryLines.length === 1 ? "" : "s"}${recipeTitle} to your shopping list:\n${summaryLines.join("\n")}\n\n[Open your shopping list](/shopping-list)`,
      shoppingList: updatedShoppingList.toObject ? updatedShoppingList.toObject() : updatedShoppingList,
    },
    statusUpdates: [
      {
        type: "status",
        phase: TOOL_METADATA.add_to_shopping_list.friendlyName,
        message: "Shopping list updated.",
        state: "success",
      },
    ],
    shoppingListAddRequirements: null,
  };
};

/**
 * Updates the user's ephemeral session context in MongoDB.
 * @param {AgentState} state 
 * @returns {Promise<Partial<AgentState>>}
 */
const updateUserStateNode = async (state) => {
  console.log("--- Running updateUserStateNode ---");
  const { messages, userId, firebaseUID } = state;
  const lastMessage = messages[messages.length - 1];
  const toolCall = lastMessage?.tool_calls?.find((tc) => tc.name === "update_user_state");

  if (!toolCall) {
    return {
      messages: [
        new ToolMessage({
          tool_call_id: lastMessage.tool_calls?.[0]?.id || "unknown",
          content: "Error: No tool call found for update_user_state.",
          name: "update_user_state",
        }),
      ],
    };
  }

  const { energyLevel, stressMode } = toolCall.args || {};
  console.log(`[updateUserStateNode] Updating context for user ${userId}: energyLevel=${energyLevel}, stressMode=${stressMode}`);

  try {
    const UserHealth = (await import('../models/userHealth.model.js')).default;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 4 * 60 * 60 * 1000); // +4 hours

    const update = {
      $set: {
        'sessionContext.source': 'conversation_inference',
        'sessionContext.updatedAt': now,
        'sessionContext.expiresAt': expiresAt,
      }
    };

    if (energyLevel !== undefined) update.$set['sessionContext.energyLevel'] = energyLevel;
    if (stressMode !== undefined) update.$set['sessionContext.stressMode'] = stressMode;

    const health = await UserHealth.findOneAndUpdate(
      { firebaseUID },
      { ...update, $setOnInsert: { userId } },
      { new: true, upsert: true }
    ).lean();

    return {
      messages: [
        new ToolMessage({
          tool_call_id: toolCall.id,
          content: JSON.stringify({ status: "success", context: health.sessionContext }),
          name: "update_user_state",
        }),
      ],
      userProfile: {
        ...state.userProfile,
        sessionContext: health.sessionContext
      },
      statusUpdates: [
        {
          type: "status",
          phase: TOOL_METADATA.update_user_state.friendlyName,
          message: TOOL_METADATA.update_user_state.description,
          state: "success",
        },
        {
          type: "user_context_update",
          context: health.sessionContext,
        },
      ],
    };
  } catch (error) {
    console.error("[updateUserStateNode] Update failed:", error);
    return {
      messages: [
        new ToolMessage({
          tool_call_id: toolCall.id,
          content: "Error updating user state.",
          name: "update_user_state",
        }),
      ],
    };
  }
};

/**
 * Saves durable Chef Kay memory to the UserHealth document.
 * @param {AgentState} state
 * @returns {Promise<Partial<AgentState>>}
 */
const saveUserMemoryNode = async (state) => {
  console.log("--- Running saveUserMemoryNode ---");
  const { messages, userId, firebaseUID, userProfile } = state;
  const lastMessage = messages[messages.length - 1];
  const toolCall = lastMessage?.tool_calls?.find((tc) => tc.name === "save_user_memory");

  if (!toolCall) {
    return {
      messages: [
        new ToolMessage({
          tool_call_id: lastMessage.tool_calls?.[0]?.id || "unknown",
          content: "Error: No tool call found for save_user_memory.",
          name: "save_user_memory",
        }),
      ],
    };
  }

  try {
    const result = await saveUserMemory({
      userId,
      firebaseUID,
      primaryDiet: userProfile.primaryDiet,
      memory: toolCall.args || {},
    });

    return {
      messages: [
        new ToolMessage({
          tool_call_id: toolCall.id,
          content: JSON.stringify({
            status: "success",
            summary: result.savedItemSummary,
            aiMemorySummary: result.aiMemorySummary,
          }),
          name: "save_user_memory",
        }),
      ],
      userProfile: {
        ...state.userProfile,
        aiMemory: result.aiMemory,
        aiMemorySummary: result.aiMemorySummary,
        dietStage: result.aiMemory?.dietStage?.value || null,
      },
      statusUpdates: [
        {
          type: "status",
          phase: TOOL_METADATA.save_user_memory.friendlyName,
          message: TOOL_METADATA.save_user_memory.description,
          state: "success",
        },
      ],
    };
  } catch (error) {
    console.error("[saveUserMemoryNode] Save failed:", error);
    return {
      messages: [
        new ToolMessage({
          tool_call_id: toolCall.id,
          content: `Error saving user memory: ${error.message}`,
          name: "save_user_memory",
        }),
      ],
    };
  }
};

/**
 * Node to check ingredient safety against the database.
 * @param {AgentState} state 
 * @returns {Promise<Partial<AgentState>>}
 */
const checkIngredientSafetyNode = async (state) => {
  console.log("--- Running checkIngredientSafetyNode ---");
  const { messages, userProfile } = state;
  const lastMessage = messages[messages.length - 1];
  const toolCall = lastMessage?.tool_calls?.find((tc) => tc.name === "check_ingredient_safety");

  if (!toolCall) {
    return {
      messages: [
        new ToolMessage({
          tool_call_id: lastMessage.tool_calls?.[0]?.id || "unknown",
          content: "Error: No tool call found for check_ingredient_safety.",
          name: "check_ingredient_safety",
        }),
      ],
    };
  }

  const { ingredients } = toolCall.args || {};
  if (!ingredients || !Array.isArray(ingredients)) {
    return {
      messages: [
        new ToolMessage({
          tool_call_id: toolCall.id,
          content: "No ingredients provided to check.",
          name: "check_ingredient_safety",
        }),
      ],
    };
  }

  const primaryDiet = userProfile.primaryDiet;
  if (!primaryDiet) {
    return {
      messages: [
        new ToolMessage({
          tool_call_id: toolCall.id,
          content: "User primary diet not found. Cannot check compliance.",
          name: "check_ingredient_safety",
        }),
      ],
    };
  }

  console.log(`[checkIngredientSafetyNode] Checking ${ingredients.length} ingredients for diet ${primaryDiet}`);

  try {
    // 1. Exact Match Search
    const normalizedInputs = ingredients.map(ing => ing.toLowerCase().trim());
    
    // Find all matching foods in the database for this diet
    const exactMatches = await TherapeuticDietFood.find({
      diet_code: primaryDiet,
      normalized_food_name: { $in: normalizedInputs }
    }).lean();

    console.log(`[checkIngredientSafetyNode] Exact matches found:`, JSON.stringify(exactMatches, null, 2));

    const results = await Promise.all(ingredients.map(async (ing) => {
      const normalized = ing.toLowerCase().trim();
      const match = exactMatches.find(m => m.normalized_food_name === normalized);
      
      if (match) {
        return {
          ingredient: ing,
          status: match.allowed ? "allowed" : "not_allowed",
          databaseNote: match.note,
          isHardConstraint: true,
          matchType: "exact"
        };
      } else {
        // 2. Fallback: Keyword Search
        const words = normalized.split(/\s+/).filter(w => w.length > 2);
        
        if (words.length > 0) {
          // Attempt A: All Keywords (AND)
          const allKeywordsRegex = words.map(w => ({ normalized_food_name: { $regex: w, $options: 'i' } }));
          let fuzzyMatch = await TherapeuticDietFood.findOne({
            diet_code: primaryDiet,
            $and: allKeywordsRegex
          }).lean();

          // Attempt B: First 2 Keywords (AND) - for "cane sugar" matching "cane juice"
          if (!fuzzyMatch && words.length >= 2) {
            const partialKeywordsRegex = words.slice(0, 2).map(w => ({ normalized_food_name: { $regex: w, $options: 'i' } }));
            fuzzyMatch = await TherapeuticDietFood.findOne({
              diet_code: primaryDiet,
              $and: partialKeywordsRegex
            }).lean();
          }

          if (fuzzyMatch) {
            console.log(`[checkIngredientSafetyNode] Fuzzy match found for "${ing}": "${fuzzyMatch.food_name}"`);
            return {
              ingredient: ing,
              foundName: fuzzyMatch.food_name, // Tell AI what we actually found
              status: fuzzyMatch.allowed ? "allowed" : "not_allowed",
              databaseNote: fuzzyMatch.note,
              isHardConstraint: true,
              matchType: "fuzzy"
            };
          }
        }

        return {
          ingredient: ing,
          status: "unknown",
          databaseNote: "Not found in our specific diet database.",
          isHardConstraint: false
        };
      }
    }));

    const toolOutput = {
      dietCode: primaryDiet,
      results
    };

    console.log(`[checkIngredientSafetyNode] Final tool output:`, JSON.stringify(toolOutput, null, 2));

    return {
      messages: [
        new ToolMessage({
          tool_call_id: toolCall.id,
          content: JSON.stringify(toolOutput),
          name: "check_ingredient_safety",
        }),
      ],
      statusUpdates: [
        {
          type: "status",
          phase: TOOL_METADATA.check_ingredient_safety.friendlyName,
          message: `Checked ${ingredients.length} ingredients.`,
          state: "success",
        },
      ],
    };
  } catch (error) {
    console.error("[checkIngredientSafetyNode] Database query failed:", error);
    return {
      messages: [
        new ToolMessage({
          tool_call_id: toolCall.id,
          content: "Internal error checking ingredient safety.",
          name: "check_ingredient_safety",
        }),
      ],
    };
  }
};

/**
 * Custom tool router that handles the HITL interrupt for credit-based tools.
 * @param {import("@langchain/langgraph").MessagesState} state - The current agent state.
 * @returns {string} The name of the next node to execute.
 */
const routeTools = (state) => {
  const { messages } = state;
  const lastMessage = messages[messages.length - 1];

  if (!lastMessage.tool_calls || lastMessage.tool_calls.length === 0) {
    return "final_conversational";
  }

  // Scan ALL tool calls — not just index 0 — so a dedicated-node tool
  // is never missed when it appears after a generic tool in the array.
  for (const tc of lastMessage.tool_calls) {
    const node = DEDICATED_NODE_MAP[tc.name];
    if (node) return node;
  }

  return "tools";
};

/**
 * Routes after validation based on compliance and correction attempts.
 * @param {AgentState} state The current state of the graph.
 * @returns {string} Next node name.
 */
const routeAfterValidation = (state) => {
  const { validationResult, correctionAttempts, modificationRequirements, researchAttempts } = state;

  const isCompliant =
    validationResult &&
    validationResult.nonCompliantCount === 0 &&
    validationResult.notFoundCount === 0;
    
  // MMA-266: Cap research retries to prevent infinite loop
  if (validationResult?.notFoundCount > 0 && (researchAttempts || 0) < 2) return "research_unknown_ingredients";
  // If we've exhausted research attempts, treat unknowns as non-compliant and let the correction
  // logic or failure handler deal with it
  if (isCompliant && modificationRequirements) return "save_edited_recipe";
  if (isCompliant) return "prepare_final_response";
  if (correctionAttempts >= 2) return "handle_failure";
  return "prepare_correction";
};

const workflow = new StateGraph(AgentState)
  .addNode("agent", callModelNode)
  .addNode("final_conversational", finalConversationalNode)
  .addNode("final_recipe_details", finalRecipeDetailsNode)
  .addNode("tools", agentToolsNode)
  .addNode("search_recipes_logic", searchRecipesNode)
  .addNode("get_recipe_details_logic", getRecipeDetailsNode)
  .addNode("create_recipe_logic", createRecipeLogicNode)
  .addNode("edit_recipe_logic", editRecipeLogicNode)
  .addNode("add_to_shopping_list_prepare", addToShoppingListPrepareNode)
  .addNode("add_to_shopping_list_logic", addToShoppingListLogicNode)
  .addNode("add_to_shopping_list_execute", addToShoppingListExecuteNode)
  .addNode("load_recipe_for_edit", loadRecipeForEditNode)
  .addNode("generate_recipe", generateRecipeNode)
  .addNode("validate_recipe", validateRecipeNode)
  .addNode("prepare_correction", prepareCorrectionNode)
  .addNode("prepare_final_response", finalResponseNode)
  .addNode("save_edited_recipe", saveEditedRecipeNode)
  .addNode("handle_failure", handleFailureNode)
  .addNode("save_user_memory_node", saveUserMemoryNode)
  .addNode("update_user_state_node", updateUserStateNode)
  .addNode("check_ingredient_safety_node", checkIngredientSafetyNode)
  .addNode("research_unknown_ingredients", researchUnknownIngredientsNode);

// 4. Define the edges
workflow.addEdge(START, "agent");

workflow.addConditionalEdges("agent", routeTools, {
  tools: "tools",
  search_recipes_logic: "search_recipes_logic",
  create_recipe_logic: "create_recipe_logic",
  edit_recipe_logic: "edit_recipe_logic",
  add_to_shopping_list_prepare: "add_to_shopping_list_prepare",
  get_recipe_details_logic: "get_recipe_details_logic",
  save_user_memory_node: "save_user_memory_node",
  update_user_state_node: "update_user_state_node",
  check_ingredient_safety_node: "check_ingredient_safety_node",
  final_conversational: "final_conversational",
});

// After generic tools, either finish (recipe details) or go back to agent to think
workflow.addConditionalEdges("tools", routeAfterTools, {
  agent: "agent",
  final_recipe_details: "final_recipe_details",
});
workflow.addEdge("search_recipes_logic", "agent");
workflow.addEdge("get_recipe_details_logic", "agent");
workflow.addEdge("save_user_memory_node", "agent");
workflow.addEdge("check_ingredient_safety_node", "agent");

workflow.addConditionalEdges(
  "add_to_shopping_list_prepare",
  (s) => {
    console.log(`[Edge: add_to_shopping_list_prepare] Requirements: ${!!s.shoppingListAddRequirements}, FinalResponse: ${!!s.finalResponse}`);
    // Prioritize execution if we have requirements
    if (s.shoppingListAddRequirements) return "add_to_shopping_list_logic";
    // Otherwise, if we already have a response (stale or just generated), end or go to conversational
    if (s.finalResponse) return "end"; 
    return "final_conversational";
  },
  {
    end: END,
    add_to_shopping_list_logic: "add_to_shopping_list_logic",
    final_conversational: "final_conversational",
  }
);

workflow.addEdge("update_user_state_node", "agent");

workflow.addEdge("add_to_shopping_list_logic", "add_to_shopping_list_execute");
workflow.addEdge("add_to_shopping_list_execute", END);

// Conversational end
workflow.addEdge("final_conversational", END);
workflow.addEdge("final_recipe_details", END);

// Create/Edit logic flows - after confirmation, go to generate_recipe
workflow.addEdge("create_recipe_logic", "generate_recipe");
workflow.addEdge("edit_recipe_logic", "load_recipe_for_edit");
workflow.addConditionalEdges("load_recipe_for_edit", (s) => {
  if (s.finalResponse?.error) return "end";
  return "generate_recipe";
}, {
  generate_recipe: "generate_recipe",
  end: END,
});

// Recipe generation path
workflow.addEdge("generate_recipe", "validate_recipe");
workflow.addEdge("prepare_correction", "generate_recipe");

// Conditional routing for recipe validation
workflow.addConditionalEdges("validate_recipe", routeAfterValidation, {
  research_unknown_ingredients: "research_unknown_ingredients",
  prepare_final_response: "prepare_final_response",
  prepare_correction: "prepare_correction",
  save_edited_recipe: "save_edited_recipe",
  handle_failure: "handle_failure",
});

workflow.addEdge("research_unknown_ingredients", "validate_recipe");

workflow.addEdge("save_edited_recipe", END);

// End points
workflow.addEdge("prepare_final_response", END);
workflow.addEdge("handle_failure", END);

// 5. Compile with checkpointer
const checkpointer = new MemorySaver();
export const askKayAgent = workflow.compile({
  checkpointer,
  interruptBefore: [
    "create_recipe_logic",
    "edit_recipe_logic",
    "add_to_shopping_list_logic",
  ],
});
