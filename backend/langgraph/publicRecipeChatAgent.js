/**
 * @file publicRecipeChatAgent.js
 * @description Agentic LangGraph implementation for public recipe page chat (Chef Kay).
 *
 * This version replaces rigid intent routing with the agentic "model decides" pattern:
 * - The model can respond conversationally OR call a tool.
 * - Tool execution is server-controlled via ToolNode.
 * - After tools run, the model continues reasoning with tool outputs.
 *
 * Current supported tools:
 * - `discover_public_recipes`: browse/filter public recipes.
 * - `adapt_recipe`: placeholder in Task 3 (real duplication/edit happens in Task 4).
 *
 * Output contract:
 * - The controller expects `{ finalResponse: string, recipeData?: object }`.
 * - Streaming is done by chunking the finalResponse and emitting `chat_chunk` via the provided socket.
 *
 * @version 2.0.0
 * @requires @langchain/langgraph - StateGraph orchestration.
 * @requires @langchain/langgraph/prebuilt - ToolNode for executing tool calls.
 * @requires @langchain/google-genai - Gemini chat model.
 * @requires @langchain/core/messages - Message primitives.
 * @requires ../utils/prompt_loader.js - Modular public prompt loader.
 * @requires ./publicRecipeChatTools.js - Tool definitions for public chat.
 * @date 2025-12-29
 * @author Cascade
 */

import { StateGraph, START, END } from '@langchain/langgraph';
import { ToolNode } from '@langchain/langgraph/prebuilt';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { AIMessage, HumanMessage, SystemMessage } from '@langchain/core/messages';

import Recipe from '../models/recipe.model.js';
import TherapeuticDiet from '../models/therapeuticDiets.model.js';
import Condition from '../models/conditions.model.js';

import { loadPublicRecipeChatPrompt } from '../utils/prompt_loader.js';
import { publicRecipeChatTools } from './publicRecipeChatTools.js';

/**
 * @typedef {Object} PublicChefChatState
 * @property {import('@langchain/core/messages').BaseMessage[]} messages - Chat history (no System messages).
 * @property {string} recipeSlug - The current public recipe slug.
 * @property {string|null|undefined} appBaseUrl - Base URL for public links (e.g., http://localhost:3000 or https://meadowmentor.com).
 * @property {object|null} recipeData - Mongo recipe document (lean).
 * @property {Array<object>} allDiets - Supported therapeutic diets.
 * @property {Array<object>} allConditions - Supported conditions.
 * @property {string|null} finalResponse - Final assistant response for controller to store.
 */

/**
 * @constant
 * @type {PublicChefChatState}
 */
export const initialPublicAgentStateV2 = {
  messages: [],
  recipeSlug: '',
  appBaseUrl: null,
  recipeData: null,
  allDiets: [],
  allConditions: [],
  finalResponse: null,
};

/**
 * Returns the Google API key used by Gemini.
 *
 * @function getGoogleApiKey
 * @returns {string}
 * @throws {Error} If no key is configured.
 */
function getGoogleApiKey() {
  const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Missing Google API Key. Please ensure GOOGLE_API_KEY is set in your environment.');
  }
  return apiKey;
}

/**
 * Converts a stored recipe document into placeholder data used by the public prompt loader.
 *
 * @function buildPromptData
 * @param {object|null} recipeData
 * @param {Array<object>} allDiets
 * @param {Array<object>} allConditions
 * @returns {object}
 */
function buildPromptData(recipeData, allDiets, allConditions, appBaseUrl) {
  const dietList = Array.isArray(allDiets)
    ? allDiets
        .map((d) => `- **${d.diet_name} (${d.diet_code})**: ${d.description}`)
        .join('\n')
    : '';

  const conditionList = Array.isArray(allConditions)
    ? allConditions
        .map(
          (c) =>
            `- **${c.condition_name}**: ${c.description} (Recommended diets: ${(c.diets_recommended || []).join(', ')})`
        )
        .join('\n')
    : '';

  const recipePromptData = recipeData
    ? {
        RECIPE_TITLE: recipeData.recipeTitle,
        RECIPE_DESCRIPTION: recipeData.recipeDescription,
        RECIPE_DIET: recipeData.recipeDiet,
        RECIPE_MEAL_TYPE: recipeData.mealType,
        PREP_TIME: recipeData.prepTime,
        COOK_TIME: recipeData.cookTime,
        YIELD: recipeData.recipeYield,
        TAGS: (recipeData.tags || []).join(', '),
        INGREDIENTS: (recipeData.ingredients || [])
          .map((ing) => `- ${ing.amount} ${ing.unit || ''} ${ing.name}`)
          .join('\n'),
        STEPS: (recipeData.steps || []).map((step, i) => `${i + 1}. ${step}`).join('\n'),
      }
    : {};

  return {
    ...recipePromptData,
    DIET_LIST: dietList,
    CONDITION_LIST: conditionList,
    APP_BASE_URL: (
      (typeof appBaseUrl === 'string' && appBaseUrl.startsWith('http') ? appBaseUrl : process.env.APP_BASE_URL) ||
      'https://meadowmentor.com'
    ).replace(/\/$/, ''),
  };
}

/**
 * Sends a final assistant response to the client over the socket interface.
 *
 * The public web UI expects `chat_chunk` events (chunked strings).
 *
 * @function streamFinalResponse
 * @param {object|undefined} socket
 * @param {string} text
 * @returns {string}
 */
function streamFinalResponse(socket, text) {
  const safeText = typeof text === 'string' ? text : '';
  if (!socket) return safeText;

  const chunkSize = 240;
  for (let i = 0; i < safeText.length; i += chunkSize) {
    socket.emit('chat_chunk', { chunk: safeText.slice(i, i + chunkSize) });
  }

  socket.emit('chat_complete', { fullText: safeText });
  return safeText;
}

/**
 * Loads recipe + therapeutic diet + condition context.
 *
 * @async
 * @function loadContextNode
 * @param {PublicChefChatState} state
 * @returns {Promise<Partial<PublicChefChatState>>}
 */
async function loadContextNode(state) {
  const { recipeSlug } = state;

  const [recipe, diets, conditions] = await Promise.all([
    Recipe.findOne({ slug: recipeSlug }).lean(),
    TherapeuticDiet.find({ supported: true }).lean(),
    Condition.find({ supported: true }).lean(),
  ]);

  return {
    recipeData: recipe,
    allDiets: diets,
    allConditions: conditions,
  };
}

/**
 * Main model node: decides whether to respond conversationally or call tools.
 *
 * @async
 * @function callModelNode
 * @param {PublicChefChatState} state
 * @returns {Promise<Partial<PublicChefChatState>>}
 */
async function callModelNode(state) {
  const apiKey = getGoogleApiKey();

  const envModel = process.env.GEMINI_MODEL_NAME;
  const model = envModel || 'gemini-flash-latest';

  const llm = new ChatGoogleGenerativeAI({
    model,
    apiKey,
    temperature: 1.0,
  });

  const promptData = buildPromptData(state.recipeData, state.allDiets, state.allConditions, state.appBaseUrl);
  const systemPrompt = await loadPublicRecipeChatPrompt(promptData);

  const llmWithTools = llm.bindTools(publicRecipeChatTools);

  const history = Array.isArray(state.messages) ? state.messages : [];
  const llmMessages = [new SystemMessage(systemPrompt), ...history];

  const response = await llmWithTools.invoke(llmMessages);

  return {
    messages: [response],
  };
}

/**
 * Routes to ToolNode when the model called a tool, otherwise routes to final.
 *
 * @function routeTools
 * @param {PublicChefChatState} state
 * @returns {'tools'|'final'}
 */
function routeTools(state) {
  const messages = Array.isArray(state.messages) ? state.messages : [];
  const last = messages[messages.length - 1];
  const toolCalls = last?.tool_calls;
  if (Array.isArray(toolCalls) && toolCalls.length > 0) return 'tools';
  return 'final';
}

/**
 * Final response node. Streams the assistant content and exposes it as `finalResponse`.
 *
 * @async
 * @function finalNode
 * @param {PublicChefChatState} state
 * @param {object} config
 * @returns {Promise<Partial<PublicChefChatState>>}
 */
async function finalNode(state, config) {
  const { socket } = config?.configurable || {};
  const messages = Array.isArray(state.messages) ? state.messages : [];

  const last = messages[messages.length - 1];
  const content = typeof last?.content === 'string' ? last.content : '';

  return {
    finalResponse: streamFinalResponse(socket, content),
  };
}

const toolNode = new ToolNode(publicRecipeChatTools);

const workflow = new StateGraph({
  channels: {
    messages: { value: (x, y) => x.concat(y), default: () => [] },
    recipeSlug: { value: (x, y) => y, default: () => '' },
    appBaseUrl: { value: (x, y) => y, default: () => null },
    recipeData: { value: (x, y) => y, default: () => null },
    allDiets: { value: (x, y) => y, default: () => [] },
    allConditions: { value: (x, y) => y, default: () => [] },
    finalResponse: { value: (x, y) => y, default: () => null },
  },
});

workflow.addNode('loadContext', loadContextNode);
workflow.addNode('agent', callModelNode);
workflow.addNode('tools', toolNode);
workflow.addNode('final', finalNode);

workflow.addEdge(START, 'loadContext');
workflow.addEdge('loadContext', 'agent');

workflow.addConditionalEdges('agent', routeTools, {
  tools: 'tools',
  final: 'final',
});

workflow.addEdge('tools', 'agent');
workflow.addEdge('final', END);

export const publicRecipeChatAgentV2 = workflow.compile();
