/**
 * @file publicRecipeChatTools.js
 * @description Defines LangChain tools used by the public Chef Kay chat agent.
 *
 * These tools are designed for the public `/recipes/[slug]` pages.
 *
 * Key constraints:
 * - The agent must never directly modify the original public recipe.
 * - For now, `adapt_recipe` is a placeholder tool; the persistence logic is implemented in a later task.
 *
 * @version 1.0.0
 * @requires @langchain/core/tools - Tool wrapper for LLM tool calling.
 * @requires zod - Runtime schema validation.
 * @requires ../services/publicRecipeDiscovery.service.js - Server-controlled MongoDB search for public recipes.
 * @date 2025-12-29
 * @author Cascade
 */

import { tool } from '@langchain/core/tools';
import { z } from 'zod';

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';

import { findPublicRecipesForDiscovery } from '../services/publicRecipeDiscovery.service.js';
import Recipe from '../models/recipe.model.js';
import PublicChatSession from '../models/publicChatSession.model.js';
import { dietCodes } from '../models/therapeuticDiets.model.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ADAPT_PROMPT_PATH = path.join(__dirname, '..', 'ai_prompts', 'public_recipe_chat', 'adapt_recipe_prompt.md');

function getGoogleApiKey() {
  const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('Missing Google API Key. Please ensure GOOGLE_API_KEY is set in your environment.');
  return apiKey;
}

function selectGeminiModel() {
  const envModel =
    process.env.GEMINI_MODEL_NAME;
  return envModel || 'gemini-flash-latest';
}

function extractTaggedBlock(text, tagName) {
  if (typeof text !== 'string') return '';
  const rx = new RegExp(`<${tagName}>\\s*([\\s\\S]*?)\\s*<\\/${tagName}>`, 'i');
  const match = text.match(rx);
  return match?.[1]?.trim() || '';
}

function inferDietOverride(modifications) {
  const text = typeof modifications === 'string' ? modifications : '';
  if (!text) return null;

  const normalizedText = text.toLowerCase();

  const normalizedMap = new Map(
    (dietCodes || []).map((code) => [String(code).toLowerCase(), code])
  );

  if (/\bspecific carbohydrate diet\b/i.test(text) || /\bscd\b/i.test(text)) {
    return 'SCD';
  }

  for (const [normalized, code] of normalizedMap.entries()) {
    if (normalized && normalizedText.includes(normalized)) return code;
  }

  return null;
}

function pickAllowedRecipeFields(candidate) {
  if (!candidate || typeof candidate !== 'object') return {};

  const allowed = {
    recipeTitle: candidate.recipeTitle,
    seoSlugCandidate: candidate.seoSlugCandidate,
    recipeDescription: candidate.recipeDescription,
    recipeDiet: candidate.recipeDiet,
    mealType: candidate.mealType,
    prepTime: candidate.prepTime,
    cookTime: candidate.cookTime,
    totalTime: candidate.totalTime,
    recipeYield: candidate.recipeYield,
    ingredients: candidate.ingredients,
    steps: candidate.steps,
    notes: candidate.notes,
    tags: candidate.tags,
    calories: candidate.calories,
  };

  Object.keys(allowed).forEach((k) => {
    if (allowed[k] === undefined) delete allowed[k];
  });

  return allowed;
}

/**
 * Tool: discover_public_recipes
 *
 * Used when the user asks for other recipes, recipe ideas, browsing, etc.
 * This keeps discovery server-controlled (no raw Mongo queries from the model).
 */
export const discoverPublicRecipesTool = tool(
  async (args) => {
    const criteria = {
      diet: args?.diet || null,
      mealType: args?.mealType || null,
      flareFriendly: Boolean(args?.flareFriendly),
      keywords: args?.keywords || null,
      limit: typeof args?.limit === 'number' ? args.limit : 5,
    };

    const matches = await findPublicRecipesForDiscovery(criteria);
    return JSON.stringify({ criteria, matches });
  },
  {
    name: 'discover_public_recipes',
    description:
      'Find other public recipes available in the app. Use this when the user asks for other recipes, what else exists, recommendations, browsing, or recipe ideas. Provide simple criteria: diet (optional), mealType (optional), flareFriendly (optional), and keywords (optional). The tool returns a short list of matching public recipes with slugs for linking.',
    schema: z.object({
      diet: z.string().optional().describe('Diet code to filter by (e.g., SCD). Omit for any.'),
      mealType: z
        .enum([
          'breakfast',
          'lunch',
          'dinner',
          'snack',
          'dessert',
          'beverage',
          'appetizer',
          'side dish',
          'sauce or condiment',
          'staple',
        ])
        .optional()
        .describe('Meal type filter. Omit for any.'),
      flareFriendly: z.boolean().optional().describe('True if user wants gentle/flare-friendly options. Omit if unknown.'),
      keywords: z.string().optional().describe('Optional keyword phrase like "chicken" or "easy".'),
      limit: z.number().int().min(1).max(10).optional().describe('Max number of results to return.'),
    }),
  }
);

/**
 * Tool: adapt_recipe
 *
 * Called when the user is asking to adapt the CURRENT recipe.
 *
 * NOTE: In Task 3 this tool is a placeholder so the agent can learn the pattern.
 * In Task 4 we will implement the database duplication + edit pipeline.
 */
export const adaptRecipeTool = tool(
  async (args, config) => {
    const modifications = args?.modifications || '';
    const sessionId = config?.configurable?.sessionId;
    const recipeSlug = config?.configurable?.recipeSlug;
    const socket = config?.configurable?.socket;

    if (!sessionId || !recipeSlug) {
      return JSON.stringify({
        status: 'ERROR',
        message: 'Missing session context. Please refresh the page and try again.',
      });
    }

    const chatSession = await PublicChatSession.findOne({ sessionId }).lean();
    const adaptationsUsed = Number.isFinite(chatSession?.adaptationsUsed) ? chatSession.adaptationsUsed : 0;
    if (adaptationsUsed >= 3) {
      return JSON.stringify({
        status: 'LIMIT_REACHED',
        message:
          'You’ve used your 3 free recipe adaptations for this session. If you want unlimited adaptations and the ability to save recipes, create a free account.',
      });
    }

    const originalRecipe = await Recipe.findOne({ slug: recipeSlug, visibility: 'public' }).lean();
    if (!originalRecipe) {
      return JSON.stringify({ status: 'ERROR', message: 'I could not find that recipe to adapt.' });
    }

    const systemUserId = process.env.PUBLIC_CHEF_KAY_USER_ID;
    if (!systemUserId) {
      throw new Error(
        'Missing PUBLIC_CHEF_KAY_USER_ID. Create a system Mongo user for public adaptations and set this env var to its _id.'
      );
    }

    const apiKey = getGoogleApiKey();
    const model = selectGeminiModel();
    const llm = new ChatGoogleGenerativeAI({ model, apiKey, temperature: 1.0 });

    const adaptPrompt = await fs.readFile(ADAPT_PROMPT_PATH, 'utf-8');
    const llmMessages = [
      new SystemMessage(adaptPrompt),
      new HumanMessage(
        [
          `Valid diet options for recipeDiet: ${dietCodes.join(', ')}`,
          '',
          'Original recipe JSON:',
          JSON.stringify(originalRecipe),
          '',
          'Requested modifications:',
          modifications,
        ].join('\n')
      ),
    ];

    const response = await llm.invoke(llmMessages);
    const content = typeof response?.content === 'string' ? response.content : '';

    const recipeJsonText = extractTaggedBlock(content, 'recipe_json');
    const changeSummary = extractTaggedBlock(content, 'change_summary');
    if (!recipeJsonText) {
      return JSON.stringify({
        status: 'ERROR',
        message: 'I had trouble generating the adapted recipe. Please try again with a simpler request.',
      });
    }

    let candidateRecipe = null;
    try {
      candidateRecipe = JSON.parse(recipeJsonText);
    } catch (err) {
      return JSON.stringify({
        status: 'ERROR',
        message: 'I generated an invalid recipe format. Please try again.',
      });
    }

    let createdRecipeId = null;
    try {
      const duplicateData = { ...originalRecipe };
      const parentRecipeId = originalRecipe?._id;
      delete duplicateData._id;
      delete duplicateData.slug;
      delete duplicateData.createdAt;
      delete duplicateData.updatedAt;
      delete duplicateData.__v;
      delete duplicateData.recipeImage;
      delete duplicateData.imageVersion;

      duplicateData.generatedBy = systemUserId;
      duplicateData.visibility = 'private';
      duplicateData.isPublic = false;
      duplicateData.ratings = [];
      duplicateData.savedBy = [];

      duplicateData.source = 'public_chef_kay_adaptation';
      duplicateData.parentRecipeId = parentRecipeId || null;
      duplicateData.parentRecipeSlug = recipeSlug;
      duplicateData.anonSessionId = sessionId;
      duplicateData.claimedByUserId = null;

      const updates = pickAllowedRecipeFields(candidateRecipe);
      Object.assign(duplicateData, updates);

      const dietOverride = inferDietOverride(modifications);
      if (dietOverride) {
        duplicateData.recipeDiet = dietOverride;
      }

      if (duplicateData.recipeDiet && !dietCodes.includes(duplicateData.recipeDiet)) {
        console.warn(`[adapt_recipe] Invalid recipeDiet "${duplicateData.recipeDiet}" generated by AI.`);
        return JSON.stringify({
          status: 'ERROR',
          message: `I had trouble adapting the recipe. The diet "${duplicateData.recipeDiet}" is not a valid option. Please choose from one of the following: ${dietCodes.join(', ')}.`,
        });
      }

      const createdRecipe = await new Recipe(duplicateData).save();
      createdRecipeId = createdRecipe?._id;

      await PublicChatSession.updateOne(
        { sessionId },
        { $inc: { adaptationsUsed: 1 }, $addToSet: { adaptedRecipeIds: createdRecipe._id } }
      );

      if (socket?.emit) {
        socket.emit('recipe_card', { 
          recipe: {
            ...(createdRecipe.toObject ? createdRecipe.toObject() : createdRecipe),
            shouldGenerateImage: true
          }
        });
      }

      return JSON.stringify({
        status: 'ADAPTED',
        adaptedRecipeId: createdRecipe._id?.toString?.() || String(createdRecipe._id),
        changeSummary,
      });
    } catch (error) {
      if (createdRecipeId) {
        try {
          await Recipe.deleteOne({ _id: createdRecipeId });
        } catch (cleanupError) {
          console.error('[adapt_recipe] Failed to cleanup partially created recipe:', cleanupError);
        }
      }

      console.error('[adapt_recipe] Adaptation failed:', error);
      return JSON.stringify({
        status: 'ERROR',
        message: 'I ran into an issue while saving your adapted recipe. Please try again.',
      });
    }
  },
  {
    name: 'adapt_recipe',
    description:
      'Adapt the current recipe on this public page. Call this only after you understand how the user wants it adapted. Ask one simple question first ("How do you want to adapt this recipe?") and only ask follow-ups when needed. This tool will create an adapted copy (not modifying the original).',
    schema: z.object({
      modifications: z
        .string()
        .min(1)
        .describe('What to change about the recipe (e.g. "make it low fiber", "remove garlic", "swap dairy for coconut")'),
    }),
  }
);

/**
 * @constant
 * @type {Array<ReturnType<typeof tool>>}
 * @description List of all tools enabled for the public Chef Kay agent.
 */
export const publicRecipeChatTools = [discoverPublicRecipesTool, adaptRecipeTool];
