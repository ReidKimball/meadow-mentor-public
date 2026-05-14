// langChainController.js

/**
 * @fileoverview Controller for LangChain-powered features.
 * This controller will handle all interactions with the LangChain services,
 * including managing conversation history, calling different chains, and formatting
 * responses to be sent back to the client.
 * 
 * Credit System Integration:
 * - Recipe generation (recipe_request) costs 1 credit and requires confirmation
 * - Ingredient analysis (ingredient_analysis) costs 1 credit, no confirmation
 * - General questions (general_question) are free
 */

// import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { AIMessage, HumanMessage, SystemMessage } from "@langchain/core/messages";
import mongoose from "mongoose";
import User from "../models/user.model.js";
import UserHealth from "../models/userHealth.model.js";
import ChatSession from "../models/chatHistory.model.js";
import Recipe from "../models/recipe.model.js";
import TherapeuticDiet from "../models/therapeuticDiets.model.js";
import SystemPromptAnalysis from "../models/systemPromptAnalysis.model.js";
import { askKayAgent } from "../langgraph/askKayAgent.js";
import { buildAiMemorySummary, normalizeAiMemory } from "../services/aiMemory.service.js";
import * as userHealthService from "../services/userHealth.service.js";
import { deductCredits, getCreditBalance, refundCredits } from "../services/credit.service.js";
import { CREDIT_FEATURES } from "../config/creditCosts.js";
import { loadPrompt } from "../ai_prompts/loadPrompt.js";
import { updateSubscriberGotRecipeFromChefKay } from "../services/mailerlite.service.js";

// In-memory store for pending credit confirmations
// Key: pendingId, Value: { userId, chatSessionId, initialState, actionType, cost, createdAt }
const pendingCreditConfirmations = new Map();

// Clean up old pending confirmations every 5 minutes (expire after 10 minutes)
setInterval(() => {
  const now = Date.now();
  const expirationMs = 10 * 60 * 1000; // 10 minutes
  for (const [key, value] of pendingCreditConfirmations.entries()) {
    if (now - value.createdAt > expirationMs) {
      pendingCreditConfirmations.delete(key);
      console.log(`[Credit] Expired pending confirmation: ${key}`);
    }
  }
}, 5 * 60 * 1000);

const summarizeAskKayAgentState = (agentState) => {
  const values = agentState?.values || {};
  const messages = Array.isArray(values.messages) ? values.messages : [];
  const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;
  const normalizedCurrentRecipe = values.currentRecipe && typeof values.currentRecipe === 'object'
    ? values.currentRecipe
    : null;

  return {
    next: agentState?.next || [],
    messageCount: messages.length,
    lastMessageType: typeof lastMessage?._getType === 'function' ? lastMessage._getType() : null,
    lastMessageContent:
      typeof lastMessage?.content === 'string'
        ? lastMessage.content.slice(0, 500)
        : Array.isArray(lastMessage?.content)
          ? '[array-content]'
          : null,
    shoppingListSourceRecipeId: values.shoppingListSourceRecipeId || null,
    targetRecipeId: values.targetRecipeId || null,
    modificationRequirements: values.modificationRequirements
      ? {
          recipeId: values.modificationRequirements.recipeId || null,
          recipeTitle: values.modificationRequirements.recipeTitle || null,
          modifications: values.modificationRequirements.modifications || null,
        }
      : null,
    currentRecipe: normalizedCurrentRecipe
      ? {
          _id: normalizedCurrentRecipe._id ? String(normalizedCurrentRecipe._id) : null,
          recipeTitle: normalizedCurrentRecipe.recipeTitle || null,
        }
      : null,
  };
};

/**
 * Maps agent intent to credit action type
 * @param {string} intent - The classified intent from the agent
 * @returns {string|null} The action type or null if free
 */
const getActionTypeFromIntent = (intent) => {
  if (intent === 'recipe_request') return 'CREATE_RECIPE';
  if (intent === 'ingredient_analysis') return 'CHECK_INGREDIENTS';
  return null; // general_question is free
};

/**
 * Handles a new message from the user in the 'Ask Kay' chat interface.
 * @param {object} req - The Express request object.
 * @param {object} res - The Express response object.
 * @returns {Promise<void>}
 */
const askKay = async (req, res) => {
  // Credit tracking variables - declared outside try for refund handling in catch
  let creditDeducted = false;
  let detectedIntent = null;
  let dbUser = null;
  let actionTypeForRefund = null;
  let costForRefund = 0;

  try {
    //console.log(`google API key: ${process.env.GOOGLE_API_KEY}`);
    // When using multipart/form-data, text fields are in req.body, files in req.file
    const { message, chatId } = req.body;
    const { pendingCreditId, isFirstHealingMeal, isAskKayIntro } = req.body;
    const file = req.file;
    const firebaseUID = req.user.uid; // Provided by verifyFirebaseToken middleware
    let imageBase64 = null;

    if (!message && !file) {
      return res.status(400).json({ error: "Message or file is required." });
    }

    // Log file info and convert to base64 if present
    if (file) {
      console.log(
        `File received: ${file.originalname}, mimetype: ${file.mimetype}, size: ${file.size} bytes`
      );
      if (file.buffer) {
        imageBase64 = file.buffer.toString("base64");
        console.log("Converted image to base64 string.");
      }
    }

    let chatSession;
    let isNewChat = false;

    if (chatId) {
      chatSession = await ChatSession.findOne({ _id: chatId, firebaseUID });
      if (!chatSession) {
        return res.status(404).json({ error: "Chat session not found." });
      }
    } else {
      isNewChat = true;
      chatSession = new ChatSession({
        firebaseUID,
        title: message.substring(0, 50),
        messages: [],
      });

      // If this is the Ask Kay intro flow, prepend the scripted intro message
      if (isAskKayIntro === 'true' || isAskKayIntro === true) {
        const introMessage = loadPrompt('chef_kay_intro');
        // Extract just the message content (skip the header and ---)
        const introContent = introMessage.split('---').pop().trim();
        chatSession.messages.push({
          role: 'assistant',
          content: introContent,
        });
      }
    }

    // Prepare user message for DB, including attachment if it exists
    // If this request is a credit-confirmation resume, do NOT duplicate the user message.
    if (!pendingCreditId) {
      const userMessageForDb = { role: "user", content: message };
      if (file) {
        // For now, just note that an attachment was part of the message.
        // The base64 data is passed to the agent, not stored in the DB.
        userMessageForDb.attachment = { type: "image", provided: true };
      }
      chatSession.messages.push(userMessageForDb);
    }

    // Get merged user data (User + UserHealth) using centralized service
    const mergedUser = await userHealthService.getMergedUserData(firebaseUID);
    
    if (!mergedUser) {
      return res.status(404).json({ error: "User not found" });
    }
    
    const diet = await TherapeuticDiet.findOne({ diet_code: mergedUser.primaryDiet });
    const formattedGuidelines =
      diet && diet.general_guidelines.length > 0
        ? diet.general_guidelines.map((line) => `- ${line}`).join("\n")
        : "No specific dietary guidelines were found.";

    const normalizedAiMemory = normalizeAiMemory(
      mergedUser.primaryDiet,
      mergedUser.aiMemory
    );
    const aiMemorySummary = buildAiMemorySummary(
      mergedUser.primaryDiet,
      normalizedAiMemory
    );

    const chat_history = chatSession.messages.map((msg) => {
      let contentForLLM;
      if (Array.isArray(msg.content)) {
        const textParts = [];
        const recipePart = msg.content.find((part) => part.type === "recipe");
        const conversationalPart = msg.content.find(
          (part) => part.type === "text"
        );

        if (recipePart && recipePart.data) {
          const recipe = recipePart.data;
          const recipeLines = [
            `[CONTEXT: The user was previously shown this recipe card:`,
            `Recipe ID: ${recipe._id || "Unknown"}`,
            `Slug: ${recipe.slug || "None"}`,
            `Recipe Title: ${recipe.recipeTitle}`,
            `Description: ${recipe.recipeDescription || "No description."}`,
            `Diet: ${recipe.recipeDiet}`,
            `Meal Type: ${recipe.mealType}`,
            `Prep Time: ${recipe.prepTime || "N/A"}`,
            `Cook Time: ${recipe.cookTime || "N/A"}`,
            `Total Time: ${recipe.totalTime || "N/A"}`,
            `Yield: ${recipe.recipeYield || "N/A"}`,
            `Tags: ${(recipe.tags || []).join(", ") || "None"}`,
            `Is Public: ${recipe.isPublic ? "Yes" : "No"}`,
            `Ingredients:`,
            ...(recipe.ingredients || []).map(
              (ing) => `- ${ing.amount || ""} ${ing.unit || ""} ${ing.name}`
            ),
            `Instructions:`,
            ...(recipe.steps || []).map((step, i) => `${i + 1}. ${step}`),
            `]`,
          ];

          textParts.push(recipeLines.join("\n"));
        }

        if (conversationalPart && conversationalPart.content) {
          textParts.push(conversationalPart.content);
        }

        contentForLLM = textParts.join("\n\n");
      } else {
        contentForLLM = msg.content;
      }
      return msg.role === "user"
        ? new HumanMessage(contentForLLM)
        : new AIMessage(contentForLLM);
    });

    // Add current message to messages list for the agent
    const messages = [...chat_history];

    // --- Get database user for credit operations ---
    dbUser = await User.findOne({ firebaseUID: req.user.uid });
    if (!dbUser) {
      return res.status(404).json({ error: "User not found in database" });
    }

    const shouldShowCreditSpendConfirmations =
      typeof dbUser?.preferences?.showCreditSpendConfirmations === "boolean"
        ? dbUser.preferences.showCreditSpendConfirmations
        : true;
    const shouldAutoConfirmCredits = shouldShowCreditSpendConfirmations === false;

    // --- Check if this is a confirmed credit action from pending ---
    let confirmedActionType = null;
    let pendingData = null;
    let precomputedFinalResponse = null;

    if (pendingCreditId) {
      pendingData = pendingCreditConfirmations.get(pendingCreditId);
      if (!pendingData) {
        return res
          .status(400)
          .json({ error: "Credit confirmation expired or invalid" });
      }
      if (pendingData.userId.toString() !== dbUser._id.toString()) {
        return res
          .status(403)
          .json({ error: "Credit confirmation does not belong to this user" });
      }
      confirmedActionType = pendingData.actionType;
      precomputedFinalResponse = pendingData.finalResponse || null;
      pendingCreditConfirmations.delete(pendingCreditId);
      console.log(`[Credit] Processing confirmed action: ${confirmedActionType}`);
    }

    const initialState = {
      messages: messages,
      imageBase64: imageBase64,
      userId: dbUser._id.toString(),
      firebaseUID: firebaseUID,
      userProfile: {
        userId: dbUser._id.toString(),
        firstName: mergedUser.firstName,
        primaryDiet: mergedUser.primaryDiet,
        dietaryRestrictions: mergedUser.dietaryRestrictions || [],
        customDietaryRestrictions: mergedUser.customDietaryRestrictions || [],
        conditionTreating: mergedUser.conditionTreating || 'Not specified',
        inFlare: mergedUser.inFlare || false,
        formattedGuidelines: formattedGuidelines,
        dietStage: normalizedAiMemory.dietStage?.value || null,
        aiMemory: normalizedAiMemory,
        aiMemorySummary,
        bmTrendContextSummary: mergedUser.bmTrendContextSummary || "No current BM trend context.",
        sessionContext: (mergedUser.sessionContext && mergedUser.sessionContext.expiresAt && new Date(mergedUser.sessionContext.expiresAt) > new Date()) 
          ? mergedUser.sessionContext 
          : null,
      },
      isConfirmed: !!confirmedActionType,
    };

    // --- Set up Server-Sent Events (SSE) ---
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    if (isNewChat) {
      await chatSession.save();
      
      // For intro flow, send the seeded messages so frontend can display them
      const seededMessages = (isAskKayIntro === 'true' || isAskKayIntro === true) 
        ? chatSession.messages.filter(m => m.role === 'assistant').map(m => ({
            role: m.role,
            content: m.content,
            _id: m._id?.toString() || `seeded-${Date.now()}`
          }))
        : [];
      
      res.write(
        `data: ${JSON.stringify({
          event: "newChatCreated",
          chatId: chatSession._id,
          seededMessages: seededMessages,
        })}\n\n`
      );
    }

    // --- Early credit check for ingredient_analysis (image uploads) ---
    // We know the intent is ingredient_analysis if an image is provided
    if (imageBase64 && !isFirstHealingMeal && !confirmedActionType) {
      const featureConfig = CREDIT_FEATURES['CHECK_INGREDIENTS'];
      if (featureConfig) {
        const currentBalance = await getCreditBalance(dbUser._id);
        
        if (currentBalance < featureConfig.cost) {
          // Insufficient credits - send event and end
          res.write(
            `data: ${JSON.stringify({
              event: "insufficientCredits",
              featureName: featureConfig.displayName,
              creditsRequired: featureConfig.cost,
              creditsAvailable: currentBalance,
            })}\n\n`
          );
          res.write(`data: ${JSON.stringify({ event: "end" })}\n\n`);
          res.end();
          return;
        }

        // Ingredient analysis doesn't require confirmation - deduct immediately
        if (!featureConfig.requiresConfirmation) {
          try {
            await deductCredits(dbUser._id, featureConfig.cost, 'CHECK_INGREDIENTS', null, {
              message: message,
              chatSessionId: chatSession._id.toString(),
            });
            creditDeducted = true;
            actionTypeForRefund = 'CHECK_INGREDIENTS';
            costForRefund = featureConfig.cost;
            console.log(`[Credit] Deducted ${featureConfig.cost} credit(s) for CHECK_INGREDIENTS`);
          } catch (error) {
            console.error('[Credit] Failed to deduct credits for ingredient analysis:', error);
            res.write(
              `data: ${JSON.stringify({
                event: "error",
                message: "Failed to process credits. Please try again.",
              })}\n\n`
            );
            res.end();
            return;
          }
        }
      }
    }

    // --- Stream Agent Execution ---
    const thread_id = chatSession._id.toString();
    const agentConfig = {
      configurable: { thread_id },
    };

    // Use current state or initial state depending on if thread exists
    const currentAgentState = await askKayAgent.getState(agentConfig);
    const hasThread = currentAgentState && currentAgentState.values && Object.keys(currentAgentState.values).length > 0;

    console.log(
      '[askKay State Debug] Persisted state before agent run:',
      JSON.stringify(summarizeAskKayAgentState(currentAgentState), null, 2)
    );

    let inputState;
    if (confirmedActionType) {
      // Resume after interrupt - update state then pass null to continue from checkpoint
      console.log("[HITL] Current state before resume:", JSON.stringify(currentAgentState?.next));
      await askKayAgent.updateState(agentConfig, { isConfirmed: true });
      inputState = null;
      console.log("[HITL] Resuming from interrupt with isConfirmed=true");
    } else if (hasThread) {
      // New message in existing thread - only send the latest human message
      const lastUserMsg = chat_history[chat_history.length - 1];
      inputState = {
        messages: [lastUserMsg],
        userProfile: initialState.userProfile,
        imageBase64: imageBase64,
      userId: dbUser._id.toString(),
      firebaseUID: firebaseUID,
      };
    } else {
      // First message in thread
      inputState = initialState;
    }

    let finalState = null;

    // If this is a confirmation request that includes a precomputed response, skip re-running the agent.
    if (precomputedFinalResponse) {
      if (confirmedActionType && !creditDeducted) {
        const featureConfig = CREDIT_FEATURES[confirmedActionType];
        if (featureConfig) {
          await deductCredits(dbUser._id, featureConfig.cost, confirmedActionType, null, {
            message: message,
            chatSessionId: chatSession._id.toString(),
          });
          creditDeducted = true;
          actionTypeForRefund = confirmedActionType;
          costForRefund = featureConfig.cost;
        }
      }

      finalState = { finalResponse: precomputedFinalResponse };
    } else {
      const stream = await askKayAgent.stream(inputState, agentConfig);

      for await (const event of stream) {
        // Check for HITL Interrupt
        const state = await askKayAgent.getState(agentConfig);
        if (state.next && state.next.length > 0) {
          const nextNode = state.next[0];
          if (
            nextNode === "create_recipe_logic" ||
            nextNode === "edit_recipe_logic" ||
            nextNode === "add_to_shopping_list_logic"
          ) {
            const actionType =
              nextNode === "create_recipe_logic"
                ? "CREATE_RECIPE"
                : nextNode === "edit_recipe_logic"
                  ? "MODIFY_RECIPE"
                  : "GENERATE_SHOPPING_LIST";
            const featureConfig = CREDIT_FEATURES[actionType];
            
            // Only proceed with credit confirmation if the feature requires it
            if (featureConfig && featureConfig.requiresConfirmation) {
              const currentBalance = await getCreditBalance(dbUser._id);
              if (currentBalance < featureConfig.cost) {
                res.write(`data: ${JSON.stringify({
                  event: "insufficientCredits",
                  featureName: featureConfig.displayName,
                  creditsRequired: featureConfig.cost,
                  creditsAvailable: currentBalance,
                })}\n\n`);
                res.write(`data: ${JSON.stringify({ event: "end" })}\n\n`);
                res.end();
                return;
              }

              if (shouldAutoConfirmCredits) {
                confirmedActionType = actionType;
                try {
                  await deductCredits(dbUser._id, featureConfig.cost, confirmedActionType, null, {
                    message: message,
                    chatSessionId: chatSession._id.toString(),
                  });
                  creditDeducted = true;
                  actionTypeForRefund = confirmedActionType;
                  costForRefund = featureConfig.cost;
                } catch (error) {
                  console.error('[Credit] Failed to deduct credits (auto-confirm interrupt):', error);
                  res.write(
                    `data: ${JSON.stringify({
                      event: "error",
                      message: "Failed to process credits. Please try again.",
                    })}\n\n`
                  );
                  res.end();
                  return;
                }

                await askKayAgent.updateState(agentConfig, { isConfirmed: true });
                console.log("[HITL] Auto-confirming credit spend (user opted out of confirmations)");
                finalState = await askKayAgent.invoke(null, agentConfig);
                break;
              }

              const pendingId = `${dbUser._id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
              pendingCreditConfirmations.set(pendingId, {
                userId: dbUser._id,
                chatSessionId: chatSession._id,
                actionType: actionType,
                cost: featureConfig.cost,
                message: message,
                createdAt: Date.now(),
              });

              await chatSession.save();
              res.write(`data: ${JSON.stringify({
                event: "creditConfirmation",
                pendingId: pendingId,
                featureName: featureConfig.displayName,
                cost: featureConfig.cost,
                currentBalance: currentBalance,
                balanceAfter: currentBalance - featureConfig.cost,
              })}\n\n`);
              res.write(`data: ${JSON.stringify({ event: "end" })}\n\n`);
              res.end();
              return;
            }
          }
        }

        const key = Object.keys(event)[0];
        const stateValues = event[key];
        console.log(`--- Agent Event: ${key} ---`);

        // Credit deduction on tool logic execution
        if (
          (key === 'create_recipe_logic' ||
            key === 'edit_recipe_logic' ||
            key === 'add_to_shopping_list_logic') &&
          confirmedActionType &&
          !creditDeducted
        ) {
          const featureConfig = CREDIT_FEATURES[confirmedActionType];
          await deductCredits(dbUser._id, featureConfig.cost, confirmedActionType, null, {
            message: message,
            chatSessionId: chatSession._id.toString(),
          });
          creditDeducted = true;
          actionTypeForRefund = confirmedActionType;
          costForRefund = featureConfig.cost;
        }

        // Stream status updates
        if (stateValues.statusUpdates && stateValues.statusUpdates.length > 0) {
          console.log(`[SSE] Streaming ${stateValues.statusUpdates.length} status updates from ${key}`);
          for (const update of stateValues.statusUpdates) {
            console.log(`[SSE] Sending statusUpdate:`, update.type);
            res.write(`data: ${JSON.stringify({ event: "statusUpdate", message: update })}\n\n`);
          }
        }

        finalState = stateValues;
      }

      // Safety: interrupts can occur right as the stream ends.
      // If that happens, the loop above never runs again to detect `state.next`.
      if (!confirmedActionType) {
        const stateAfterStream = await askKayAgent.getState(agentConfig);
        if (stateAfterStream?.next && stateAfterStream.next.length > 0) {
          const nextNode = stateAfterStream.next[0];
          if (
            nextNode === "create_recipe_logic" ||
            nextNode === "edit_recipe_logic" ||
            nextNode === "add_to_shopping_list_logic"
          ) {
            const actionType =
              nextNode === "create_recipe_logic"
                ? "CREATE_RECIPE"
                : nextNode === "edit_recipe_logic"
                  ? "MODIFY_RECIPE"
                  : "GENERATE_SHOPPING_LIST";
            const featureConfig = CREDIT_FEATURES[actionType];
            if (featureConfig && featureConfig.requiresConfirmation) {
              const currentBalance = await getCreditBalance(dbUser._id);
              if (currentBalance < featureConfig.cost) {
                res.write(
                  `data: ${JSON.stringify({
                    event: "insufficientCredits",
                    featureName: featureConfig.displayName,
                    creditsRequired: featureConfig.cost,
                    creditsAvailable: currentBalance,
                  })}\n\n`
                );
                res.write(`data: ${JSON.stringify({ event: "end" })}\n\n`);
                res.end();
                return;
              }

              if (shouldAutoConfirmCredits) {
                confirmedActionType = actionType;
                try {
                  await deductCredits(dbUser._id, featureConfig.cost, confirmedActionType, null, {
                    message: message,
                    chatSessionId: chatSession._id.toString(),
                  });
                  creditDeducted = true;
                  actionTypeForRefund = confirmedActionType;
                  costForRefund = featureConfig.cost;
                } catch (error) {
                  console.error('[Credit] Failed to deduct credits (auto-confirm post-stream interrupt):', error);
                  res.write(
                    `data: ${JSON.stringify({
                      event: "error",
                      message: "Failed to process credits. Please try again.",
                    })}\n\n`
                  );
                  res.end();
                  return;
                }

                await askKayAgent.updateState(agentConfig, { isConfirmed: true });
                console.log(
                  "[HITL] Auto-confirming credit spend after stream end (user opted out of confirmations)"
                );
                finalState = await askKayAgent.invoke(null, agentConfig);
              } else {
                const pendingId = `${dbUser._id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                pendingCreditConfirmations.set(pendingId, {
                  userId: dbUser._id,
                  chatSessionId: chatSession._id,
                  actionType: actionType,
                  cost: featureConfig.cost,
                  message: message,
                  createdAt: Date.now(),
                });

                await chatSession.save();
                res.write(
                  `data: ${JSON.stringify({
                    event: "creditConfirmation",
                    pendingId: pendingId,
                    featureName: featureConfig.displayName,
                    cost: featureConfig.cost,
                    currentBalance: currentBalance,
                    balanceAfter: currentBalance - featureConfig.cost,
                  })}\n\n`
                );
                res.write(`data: ${JSON.stringify({ event: "end" })}\n\n`);
                res.end();
                return;
              }
            }
          }
        }
      }
    }

    // If the agent produced a NEW recipe directly (no tool / no interrupt), require the same credit confirmation.
    // Existing recipes (e.g., returned from get_recipe_details) already have an _id and should never trigger credits.
    if (
      finalState?.finalResponse?.recipe &&
      !finalState.finalResponse.recipe._id &&
      !confirmedActionType &&
      !isFirstHealingMeal
    ) {
      const featureConfig = CREDIT_FEATURES['CREATE_RECIPE'];

      if (featureConfig) {
        const currentBalance = await getCreditBalance(dbUser._id);
        if (currentBalance < featureConfig.cost) {
          res.write(
            `data: ${JSON.stringify({
              event: "insufficientCredits",
              featureName: featureConfig.displayName,
              creditsRequired: featureConfig.cost,
              creditsAvailable: currentBalance,
            })}\n\n`
          );
          res.write(`data: ${JSON.stringify({ event: "end" })}\n\n`);
          res.end();
          return;
        }

        if (shouldAutoConfirmCredits) {
          confirmedActionType = 'CREATE_RECIPE';

          try {
            await deductCredits(dbUser._id, featureConfig.cost, confirmedActionType, null, {
              message: message,
              chatSessionId: chatSession._id.toString(),
            });
            creditDeducted = true;
            actionTypeForRefund = confirmedActionType;
            costForRefund = featureConfig.cost;
          } catch (error) {
            console.error('[Credit] Failed to deduct credits (auto-confirm new recipe):', error);
            res.write(
              `data: ${JSON.stringify({
                event: "error",
                message: "Failed to process credits. Please try again.",
              })}\n\n`
            );
            res.end();
            return;
          }
        } else {

          const pendingId = `${dbUser._id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          pendingCreditConfirmations.set(pendingId, {
            userId: dbUser._id,
            chatSessionId: chatSession._id,
            actionType: 'CREATE_RECIPE',
            cost: featureConfig.cost,
            message: message,
            finalResponse: finalState.finalResponse,
            createdAt: Date.now(),
          });

          await chatSession.save();
          res.write(
            `data: ${JSON.stringify({
              event: "creditConfirmation",
              pendingId: pendingId,
              featureName: featureConfig.displayName,
              cost: featureConfig.cost,
              currentBalance: currentBalance,
              balanceAfter: currentBalance - featureConfig.cost,
            })}\n\n`
          );
          res.write(`data: ${JSON.stringify({ event: "end" })}\n\n`);
          res.end();
          return;
        }
      }
    }

    // --- Handle Final Response ---
    if (finalState.finalResponse) {
      if (finalState.finalResponse.error) {
        
        // If an error occurred inside the graph but we already deducted credits, explicitly refund them.
        if (creditDeducted && dbUser && costForRefund > 0) {
          try {
            const { refundCredits } = await import('../services/credit.service.js');
            await refundCredits(dbUser._id, costForRefund, actionTypeForRefund, 'Agent unable to complete action');
            console.log(`[Credit] Refunded ${costForRefund} credit(s) for ${actionTypeForRefund} due to graph error`);
            creditDeducted = false; // Prevent double refund
          } catch (refundError) {
            console.error('[Credit] Failed to refund credits in graceful error path:', refundError);
          }
        }

        res.write(
          `data: ${JSON.stringify({
            event: "error",
            message: finalState.finalResponse.error,
          })}\n\n`
        );
      } else {
        const { recipe, conversationalText, shoppingList } = finalState.finalResponse;

        // --- Handle System Prompt Analysis Logging (for ALL paths) ---
        if (finalState.systemPromptAnalysis) {
          try {
            const analysis = finalState.systemPromptAnalysis;
            const newAnalysis = new SystemPromptAnalysis({
              userName: analysis.userName,
              conditionTreating: analysis.conditionTreating,
              flareStatus: analysis.flareStatus,
              primaryDiet: analysis.primaryDiet,
              dietaryRestrictions: analysis.dietaryRestrictions,
              customDietaryRestrictions: analysis.customDietaryRestrictions,
              analysisDetails: analysis.systemPromptAnalysis,
            });
            await newAnalysis.save();
            console.log(
              "[askKay Controller] System prompt analysis saved successfully."
            );
          } catch (dbError) {
            console.error(
              "[askKay Controller] Failed to save system prompt analysis:",
              dbError
            );
          }
        }

        // This variable will hold the full text for saving to the database
        let fullConversationalText = "";

        if (shoppingList) {
          res.write(
            `data: ${JSON.stringify({
              event: "shoppingListUpdated",
              shoppingList,
            })}\n\n`
          );
        }

        // Handle the RECIPE path
        if (recipe) {
          const isExistingRecipe = !!recipe._id;
          let recipeToSend = recipe;

          if (!isExistingRecipe) {
            // 1. Save the recipe to the database
            // dbUser is already available from earlier in the function
            const recipePayload = {
              ...recipe,
              generatedBy: dbUser._id,
              isPublic: false,
            };

            // Ensure slug is not stored as null (unique sparse index collision)
            if (recipePayload.slug == null || recipePayload.slug === "") {
              delete recipePayload.slug;
            } else if (typeof recipePayload.slug === "string") {
              const trimmed = recipePayload.slug.trim();
              if (trimmed.length === 0) {
                delete recipePayload.slug;
              } else {
                recipePayload.slug = trimmed;
              }
            }

            const newRecipe = new Recipe(recipePayload);
            const savedRecipe = await newRecipe.save();
            recipeToSend = savedRecipe;

            if (
              !isFirstHealingMeal &&
              dbUser?.email &&
              dbUser?.onboarding?.gotRecipeFromChefKay !== true
            ) {
              try {
                const updateResult = await User.updateOne(
                  {
                    _id: dbUser._id,
                    "onboarding.gotRecipeFromChefKay": { $ne: true },
                  },
                  { $set: { "onboarding.gotRecipeFromChefKay": true } }
                );

                if (updateResult?.modifiedCount === 1) {
                  try {
                    await updateSubscriberGotRecipeFromChefKay(dbUser.email);
                  } catch (mailerliteError) {
                    console.error(
                      `❌ (langchain.controller.js /api/langchain/ask-kay) - MailerLite got_recipe_from_chef_kay sync failed for user ${firebaseUID}:`,
                      mailerliteError
                    );
                  }
                }
              } catch (error) {
                console.error(
                  `❌ (langchain.controller.js /api/langchain/ask-kay) - Failed to set onboarding.gotRecipeFromChefKay for user ${firebaseUID}:`,
                  error
                );
              }
            }
          }

          try {
            if (recipeToSend?._id) {
              const normalizedRecipeForState =
                typeof recipeToSend?.toObject === 'function'
                  ? recipeToSend.toObject()
                  : { ...recipeToSend };

              await askKayAgent.updateState(agentConfig, {
                shoppingListSourceRecipeId: recipeToSend._id.toString(),
                currentRecipe: normalizedRecipeForState,
                messages: [
                  new AIMessage(
                    `[CONTEXT: The user was previously shown this recipe card:\nRecipe ID: ${recipeToSend._id.toString()}\nRecipe Title: ${normalizedRecipeForState.recipeTitle || "Unknown"}\n]`
                  ),
                ],
              });

              const updatedAgentState = await askKayAgent.getState(agentConfig);
              console.log(
                '[askKay State Debug] Persisted state after saved recipe update:',
                JSON.stringify(summarizeAskKayAgentState(updatedAgentState), null, 2)
              );
            }
          } catch (error) {
            console.error(
              "❌ (langchain.controller.js /api/langchain/ask-kay) - Failed to update saved recipe context in agent state:",
              error
            );
          }

          // Prepare payload for event
          let recipePayloadForEvent = recipeToSend;
          // If available as Mongoose doc, convert to object
          if (recipeToSend && typeof recipeToSend.toObject === 'function') {
            recipePayloadForEvent = recipeToSend.toObject();
          } else {
             recipePayloadForEvent = { ...recipeToSend };
          }

          // Add flag if it was a new recipe or explicitly requested in finalResponse (e.g. for edits)
          if (!isExistingRecipe || finalState.finalResponse.shouldGenerateImage) {
             recipePayloadForEvent.shouldGenerateImage = true;
          }

          // 2. Send the recipe card to the client
          res.write(
            `data: ${JSON.stringify({
              event: "recipeCard",
              recipe: recipePayloadForEvent,
            })}\n\n`
          );

          // 3. Stream the final conversational text to the frontend
          if (conversationalText) {
            // conversationalText is now a plain string (captured from first LLM response)
            if (typeof conversationalText === 'string') {
              // Send the entire explanation as a single token event
              res.write(
                `data: ${JSON.stringify({ event: "token", token: conversationalText })}\n\n`
              );
              fullConversationalText = conversationalText;
            } else {
              // Fallback: if it's still a stream object (shouldn't happen)
              for await (const chunk of conversationalText) {
                const token = chunk.content ?? "";
                res.write(
                  `data: ${JSON.stringify({ event: "token", token })}\n\n`
                );
                fullConversationalText += token;
              }
            }
          }

          // 4. Save the structured message to the chat session
          chatSession.messages.push({
            role: "assistant",
            content: [
              { type: "recipe", data: recipeToSend.toObject ? recipeToSend.toObject() : recipeToSend },
              { type: "text", content: fullConversationalText.trim() },
            ],
          });
          await chatSession.save();

          // Handle the CONVERSATIONAL path (General chat or vision analysis)
        } else if (conversationalText) {
          // Send as a single block since we're using full node results
          const textContent = typeof conversationalText === 'string' ? conversationalText : String(conversationalText || '');
          res.write(
            `data: ${JSON.stringify({ conversationalText: textContent })}\n\n`
          );
          fullConversationalText = textContent;

          // Save the text response to the chat session
          if (fullConversationalText.trim()) {
            chatSession.messages.push({
              role: "assistant",
              content: fullConversationalText.trim(),
            });
            await chatSession.save();
          }
        }
      }
    }

    // --- End Stream ---
    // Send final metadata with credit balance
    const finalCreditBalance = creditDeducted ? await getCreditBalance(dbUser._id) : null;
    
    res.write(
      `data: ${JSON.stringify({
        event: "metadata",
        remainingRequests: req.apiLimits?.remaining,
        resetTime: req.apiLimits?.lastReset,
        creditsRemaining: finalCreditBalance,
      })}\n\n`
    );
    res.write(`data: ${JSON.stringify({ event: "end" })}\n\n`);
    res.end();
  } catch (error) {
    console.error("(langchain.controller.js) - Error in askKay:", error);
    
    // Refund credits if they were deducted and an error occurred
    if (creditDeducted && dbUser && costForRefund > 0) {
      try {
        await refundCredits(dbUser._id, costForRefund, actionTypeForRefund, 'Operation failed due to server error');
        console.log(`[Credit] Refunded ${costForRefund} credit(s) for ${actionTypeForRefund} due to error`);
      } catch (refundError) {
        console.error('[Credit] Failed to refund credits after error:', refundError);
        // Log this for manual review - credits need to be refunded manually
      }
    }
    
    if (!res.headersSent) {
      res.status(500).json({ error: "An internal server error occurred." });
    } else {
      try {
        res.write(
          `data: ${JSON.stringify({
            event: "error",
            message: "Internal server error.",
          })}\n\n`
        );
        res.end();
      } catch (_) {
        /* ignore further errors */
      }
    }
  }
};

/**
 * Retrieves a list of all chat sessions for the authenticated user.
 */
const getChatSessions = async (req, res) => {
  try {
    const firebaseUID = req.user.uid;
    const sessions = await ChatSession.find({ firebaseUID })
      .select("title createdAt updatedAt") // Select only needed fields
      .sort({ updatedAt: -1 }); // Sort by most recent

    res.status(200).json(sessions);
  } catch (error) {
    console.error("Error fetching chat sessions:", error);
    res.status(500).json({ error: "An internal server error occurred." });
  }
};

/**
 * Retrieves all messages for a specific chat session.
 */
const getChatSessionMessages = async (req, res) => {
  try {
    const firebaseUID = req.user.uid;
    const { chatId } = req.params;
    const session = await ChatSession.findOne({ _id: chatId, firebaseUID }).lean();

    if (session) {
      const messages = Array.isArray(session.messages) ? session.messages : [];

      const recipeIds = new Set();
      for (const message of messages) {
        const content = message?.content;
        if (!Array.isArray(content)) continue;

        for (const part of content) {
          if (part?.type !== "recipe") continue;
          const rawRecipeId = part?.data?._id;
          const normalizedRecipeId =
            typeof rawRecipeId === "string"
              ? rawRecipeId.trim()
              : typeof rawRecipeId?.toString === "function"
                ? rawRecipeId.toString().trim()
                : "";

          if (!normalizedRecipeId) continue;
          if (!mongoose.Types.ObjectId.isValid(normalizedRecipeId)) continue;
          recipeIds.add(normalizedRecipeId);
        }
      }

      let recipeById = new Map();
      if (recipeIds.size > 0) {
        const latestRecipes = await Recipe.find({
          _id: { $in: Array.from(recipeIds) },
        })
          .select("_id recipeImage imageVersion")
          .lean();

        recipeById = new Map(
          latestRecipes.map((r) => [String(r._id), r])
        );
      }

      const hydratedMessages = messages.map((message) => {
        const content = message?.content;
        if (!Array.isArray(content) || recipeById.size === 0) return message;

        const nextContent = content.map((part) => {
          if (part?.type !== "recipe" || !part?.data?._id) return part;
          const recipeId =
            typeof part.data._id === "string"
              ? part.data._id.trim()
              : typeof part.data._id?.toString === "function"
                ? part.data._id.toString().trim()
                : "";

          if (!recipeId) return part;
          const latest = recipeById.get(recipeId);
          if (!latest) return part;

          return {
            ...part,
            data: {
              ...part.data,
              recipeImage: latest.recipeImage ?? part.data.recipeImage,
              imageVersion:
                typeof latest.imageVersion === "number"
                  ? latest.imageVersion
                  : part.data.imageVersion,
            },
          };
        });

        return {
          ...message,
          content: nextContent,
        };
      });

      res.status(200).json(hydratedMessages);
    } else {
      res.status(404).json({ error: "Chat session not found." });
    }
  } catch (error) {
    console.error("Error fetching chat session messages:", error);
    res.status(500).json({ error: "An internal server error occurred." });
  }
};

/**
 * Deletes a specific chat session for the authenticated user.
 */
const deleteChatSession = async (req, res) => {
  try {
    const firebaseUID = req.user.uid;
    const { sessionId } = req.params;

    const result = await ChatSession.findOneAndDelete({
      _id: sessionId,
      firebaseUID,
    });

    if (!result) {
      return res.status(404).json({
        error:
          "Chat session not found or you do not have permission to delete it.",
      });
    }

    res.status(200).json({ message: "Chat session deleted successfully." });
  } catch (error) {
    console.error("Error deleting chat session:", error);
    res.status(500).json({
      error:
        "An internal server error occurred while deleting the chat session.",
    });
  }
};

/**
 * Sets the last active chat session for the authenticated user.
 */
const setActiveChatSession = async (req, res) => {
  try {
    const firebaseUID = req.user.uid;
    const { sessionId } = req.params;

    // Validate that the chat session belongs to the user
    const chatSession = await ChatSession.findOne({
      _id: sessionId,
      firebaseUID,
    });
    if (!chatSession) {
      return res.status(404).json({
        error: "Chat session not found or you do not have permission.",
      });
    }

    await User.findOneAndUpdate(
      { firebaseUID },
      { lastOpenAskKayChat: sessionId }
    );

    res
      .status(200)
      .json({ message: "Active chat session updated successfully." });
  } catch (error) {
    console.error("Error setting active chat session:", error);
    res.status(500).json({ error: "An internal server error occurred." });
  }
};

/**
 * Clears the last active chat session for the authenticated user.
 */
const clearActiveChatSession = async (req, res) => {
  try {
    const firebaseUID = req.user.uid;

    await User.findOneAndUpdate({ firebaseUID }, { lastOpenAskKayChat: null });

    res
      .status(200)
      .json({ message: "Active chat session cleared successfully." });
  } catch (error) {
    console.error("Error clearing active chat session:", error);
    res.status(500).json({ error: "An internal server error occurred." });
  }
};

export {
  askKay,
  getChatSessions,
  getChatSessionMessages,
  deleteChatSession,
  setActiveChatSession,
  clearActiveChatSession,
};

