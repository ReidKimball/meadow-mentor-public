/**
 * @file ai.controller.js
 * @description This file contains the AI controller logic for handling AI-related requests,
 *              primarily for journal analysis using Google Gemini AI.
 * @module controllers/ai.controller
 */

import dotenv from "dotenv";
//import { GoogleGenerativeAI } from "@google/generative-ai";
import { GoogleGenAI } from "@google/genai"
import { getSystemPromptForDiet } from "../services/aiPromptUtils.js"; // Import shared functions from aiPromptUtils.js
import User from "../models/user.model.js";
import AIResponse from "../models/aiResponse.model.js"; // To save the analysis
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js"; // Ensure utc plugin is added
import timezone from "dayjs/plugin/timezone.js";
import mongoose from "mongoose";

dayjs.extend(utc);
dayjs.extend(timezone);

dotenv.config({ path: "./.env.config" });
dotenv.config(); // Ensure environment variables are loaded

////////////////////////
//
/**
 * @constant {string} modelSelected - Specifies the AI model provider to use. Currently supports "GEMINI".
 */
const modelSelected = "GEMINI"; // CLAUDE and GEMINI are options

/**
 * @constant {string} geminiModelSelected - The specific Gemini model to be used, loaded from environment variables.
 */
const geminiModelSelected = process.env.GEMINI_MODEL; // || "gemini-2.5-pro-exp-03-25"; // Use env var

/**
 * @constant {GoogleGenAI} genAI - Instance of GoogleGenAI initialized with the API key.
 */
//const genAI = new GoogleGenAI(process.env.GOOGLE_API_KEY);
const ai = new GoogleGenAI(process.env.GOOGLE_API_KEY);

// Set the system instruction during model initialization
// TEMPERATURE
// Lower values (0.0 - 0.3): More focused, deterministic, and consistent responses
// Medium values (0.4 - 0.7): Balanced between consistency and creativity
// Higher values (0.8 - 1.0): More creative, diverse, and potentially unexpected responses

/**
 * Dynamically retrieves and configures a Gemini AI model instance.
 * The system instruction for the model is generated based on the service type, diet, and conversation style.
 * @param {string} diet_code - The diet code relevant to the user's therapeutic diet.
 * @param {number} [temperature=0.3] - The temperature setting for the AI model, influencing creativity.
 * @returns {Object} An object containing model configuration parameters.
 * @throws {Error} If the system instruction cannot be generated.
 */
async function getGeminiModel(serviceType, diet_code, convo_style, temperature) {
  console.log(
    `(ai.controller.js - getGeminiModel) - Getting model for diet: ${diet_code}, temp: ${temperature}`
  );
  const systemInstructionText = await getSystemPromptForDiet(serviceType, diet_code, convo_style, temperature);
  if (!systemInstructionText) {
    console.error(
      "(ai.controller.js - getGeminiModel) - Failed to get system prompt for diet code:",
      diet_code
    );
    throw new Error("Failed to generate system instruction for AI model.");
  }

  // New SDK: Return model configuration parameters
  return {
    modelName: geminiModelSelected, // Model name string
    systemInstruction: { parts: [{ text: systemInstructionText }] }, // System instruction object
    generationConfig: {
      temperature: temperature,
      maxOutputTokens: 8192,
      // topK: 1, // use defaults unless tuning
      // topP: 1,
      thinkingConfig: {
        thinkingBudget: 0,
      },
      // consider adding safety settings
    },
  };
}

// --- START: Reusable Helper Function for Detailed Meal Formatting ---
/**
 * Formats detailed meal and symptom data into a human-readable string for AI analysis.
 * It includes user context, diet information, and compliance details, adjusting for user's timezone.
 * @param {Array<Object>} mealsData - An array of meal objects, each containing meal details, compliance, and associated symptoms.
 * @param {Object} dateRange - An object with `startDate` and `endDate` for the analysis period.
 * @param {Object} user - The user object, containing at least `firstName`.
 * @param {string} diet_code - The therapeutic diet code the user is following.
 * @param {string} [userTimezone=null] - The user's specified timezone for formatting dates and times.
 * @returns {string} A formatted string containing all relevant meal and symptom data.
 */
function formatDetailedMealData(
  mealsData,
  dateRange,
  user,
  diet_code,
  userTimezone = null
) {
  const dateFormat = "MMM D, YYYY h:mm A Z";
  const timeFormat = "h:mm A Z";
  const fallbackTimezone = "UTC"; // Default if user timezone is not set or invalid

  // Determine the timezone to use for formatting
  let formatTimezone = fallbackTimezone;

  // --- MODIFICATION START ---
  if (userTimezone) {
    try {
      // Attempt to use the timezone. If invalid, dayjs.tz() might throw or
      // the resulting object might be invalid depending on dayjs version/config.
      // Calling format() on it is a good way to trigger potential errors.
      const testFormat = dayjs.tz(new Date(), userTimezone).format(); // Test conversion

      // Basic check if the format produced something sensible (optional, but safer)
      // This check might need refinement based on how dayjs handles truly invalid zones
      if (testFormat && !testFormat.includes("Invalid Date")) {
        formatTimezone = userTimezone;
      } else {
        console.warn(
          `[formatDetailedMealData] Dayjs considered timezone "${userTimezone}" invalid. Falling back to ${fallbackTimezone}.`
        );
      }
    } catch (e) {
      console.warn(
        `[formatDetailedMealData] Invalid user timezone specified: "${userTimezone}". Falling back to ${fallbackTimezone}. Error: ${e.message}`
      );
    }
  }

  console.log(
    `[formatDetailedMealData] Formatting dates using timezone: ${formatTimezone}`
  );

  // Adjust the range header formatting slightly if needed, or keep it simple UTC display
  let formatted = `Analysis Context for period ${dayjs
    .utc(dateRange.startDate)
    .format("MMM D, YYYY")} to ${dayjs
    .utc(dateRange.endDate)
    .format("MMM D, YYYY")}:\n`;
  formatted += `User: ${user.firstName}\n`;
  formatted += `User's Therapeutic Diet: ${diet_code}\n\n`;
  formatted +=
    "Meal & Symptom Data (Times shown in user's specified timezone or UTC if not set):\n"; // Add context note

  mealsData.forEach((meal) => {
    formatted += `\n--- Meal: ${meal.mealType} - ${meal.mealName} ---\n`;
    // Format Meal Date/Time using the determined timezone AND the updated format string
    formatted += `  Date: ${dayjs
      .utc(meal.mealDateTime)
      .tz(formatTimezone)
      .format(dateFormat)}\n`; // REMOVED +tzLabel
    formatted += `  Diet meal was logged under: ${meal.diet_code}\n`;
    formatted += `  Compliance: ${meal.complianceSnapshot?.score ?? "N/A"}%\n`;

    const ingredientsSummary = (meal.complianceSnapshot?.results || [])
      .map((ing) => {
        let tag = "";
        if (ing.isNewlyIntroduced) tag = " [NEW]";
        if (ing.allowed === false)
          tag += ` [NON-COMPLIANT: ${ing.note || "Reason unknown"}]`;
        else if (ing.allowed === null && !ing.found) tag += " [NOT FOUND]";
        else if (ing.note && ing.allowed !== false)
          tag += ` [Note: ${ing.note}]`; // Add notes for allowed items too
        return `${ing.ingredient}${tag}`;
      })
      .join("; "); // Use semicolon for better separation
    formatted += `  Ingredients: ${ingredientsSummary || "N/A"}\n`;

    if (meal.mealNotes) {
      formatted += `  Meal Notes: ${meal.mealNotes}\n`;
    }

    if (meal.associatedSymptoms && meal.associatedSymptoms.length > 0) {
      formatted += `  Symptoms Logged With Meal:\n`;
      meal.associatedSymptoms.forEach((s) => {
        const symptomName =
          s.symptomName === "Other" ? s.customSymptomName : s.symptomName;
        const location =
          s.location === "other"
            ? s.customLocation
            : s.location?.replace(/_/g, " ");
        formatted += `    - ${symptomName || "Symptom"} (Severity: ${
          s.severity
        }/5`;
        // MODIFY THIS LINE for symptom time: Parse UTC, convert to local, format
        formatted += `, Occurred: ${dayjs
          .utc(s.occurredAt)
          .tz(formatTimezone)
          .format(timeFormat)}`;
        if (s.timingRelativeToMeal)
          formatted += `, Timing: ${s.timingRelativeToMeal.replace(/_/g, " ")}`;
        if (s.duration)
          formatted += `, Duration: ${s.duration.replace(/_/g, " ")}`;
        if (location) formatted += `, Loc: ${location}`;
        if (s.notes) formatted += `, Notes: ${s.notes}`;
        formatted += `)\n`;
      });
    }
  });
  return formatted;
}
// --- END: Reusable Helper Function ---

// Helper function to construct the user prompt for journal analysis
async function constructPromptsForJournalAnalysis(
  user,
  mealsData,
  diet_code_from_request, // from req.body, for interpreting mealsData context
  dateRange,
  convo_style_from_request, // from req.body, currently unused but kept for signature consistency
  previousMessagesFromReqBody // from req.body, includes current user message as last item if follow-up
) {
  const userTimezone = user.timezone;
  let userPromptText = "";
  const isFollowUp =
    Array.isArray(previousMessagesFromReqBody) &&
    previousMessagesFromReqBody.length > 0;

  let actualCurrentUserText = "";
  if (isFollowUp) {
    const lastMessage = previousMessagesFromReqBody[previousMessagesFromReqBody.length - 1];
    // Extract text from the last message, accommodating different possible structures
    if (lastMessage && lastMessage.parts && lastMessage.parts[0] && typeof lastMessage.parts[0].text === 'string') {
        actualCurrentUserText = lastMessage.parts[0].text;
    } else if (lastMessage && typeof lastMessage.message === 'string') { // Fallback for { sender, message }
        actualCurrentUserText = lastMessage.message;
    } else if (lastMessage && lastMessage.text && typeof lastMessage.text === 'string') { // Fallback for { role, text }
        actualCurrentUserText = lastMessage.text;
    } else if (lastMessage && lastMessage.parts && typeof lastMessage.parts.text === 'string') { // Fallback for { role, parts: {text: "..."}}
        actualCurrentUserText = lastMessage.parts.text;
    }
     else {
      console.warn('(constructPromptsForJournalAnalysis) Could not extract text from last message:', lastMessage);
    }
  }

  // This context is generated regardless of initial or follow-up, as per old logic
  const detailedMealsContext = formatDetailedMealData(
    mealsData,
    dateRange,
    user,
    diet_code_from_request,
    userTimezone
  );

  if (isFollowUp) {
    userPromptText = `User Question: "${actualCurrentUserText}"\n\n---\nPlease answer the question using the following detailed data context provided below:\n---\n\n${detailedMealsContext}`;
  } else {
    // For initial analysis, the prompt is primarily the detailed meal context.
    userPromptText = detailedMealsContext;
  }
  // The system prompt is handled by getGeminiModel for JOURNAL_ANALYSIS service type.
  // Returning null here ensures finalSystemInstruction uses modelConfig.systemInstruction.
  return { systemPrompt: null, userPrompt: userPromptText };
}

// --- Journal Analysis Handler ---
/**
 * Handles the journal analysis request. This function retrieves meal and symptom data,
 * formats it, interacts with the Gemini AI model to get an analysis, and streams the AI response.
 * It also incorporates user limits and conversation history.
 * @param {Object} req - The Express request object, containing user data, meal data, and conversation details.
 * @param {Object} res - The Express response object.
 * @returns {Promise<void>} A promise that resolves when the analysis is complete and response is sent.
 */
export const analyzeJournal = async (req, res) => {
  // called from ai.routes.js endpoint api/ai/analyze-journal

  const firebaseUID = req.user?.uid; // From verifyFirebaseToken middleware
  const {
    mealsData,
    diet_code,
    dateRange,
    previousMessages,
    convo_style,
    conversationId: receivedConversationId,
  } = req.body;

  // IMPORTANT: The 'apiService' key for limits is determined *before* calling this controller
  // It's used by the checkUserLimits middleware. We need the *prompt* service type here.
  const serviceTypeForPrompt = "JOURNAL_ANALYSIS"; // Match the key in .env files
  const apiServiceKeyForLimits = "journalAnalysis"; // Match the key in user.model.js

  console.log(`(analyzeJournal) Request received for user: ${firebaseUID}`);
  console.log(
    `(analyzeJournal) Received convo_style from request: ${convo_style}` // Log received style
  );

  console.log(
    `(ai.controller.js - analyzeJournal) - meals data is: ${JSON.stringify(
      req.body.mealsData,
      null,
      2
    )}` // Use JSON.stringify with pretty-printing (indentation of 2 spaces)
  );

  console.log(
    `(ai.controller.js - analyzeJournal) - diet_code is: ${diet_code}`
  );
  console.log(
    `(ai.controller.js - analyzeJournal) - dateRange is: ${JSON.stringify(
      req.body.dateRange,
      null,
      2
    )}`
  );
  console.log(
    `(ai.controller.js - analyzeJournal) - previousMessages is: ${JSON.stringify(
      previousMessages,
      null,
      2
    )}`
  );

  try {
    // 1. Input Validation (Basic)
    if (!diet_code) {
      return res.status(400).json({ message: "Diet code is required." });
    }
    const isFollowUp =
      Array.isArray(previousMessages) && previousMessages.length > 0;

    // Adjust validation: mealsData/dateRange are required for initial,
    // and also expected (sent by frontend) for follow-ups in this implementation.
    if (!Array.isArray(mealsData) || mealsData.length === 0) {
      return res
        .status(400)
        .json({ message: "Meal data is required for analysis." });
    }
    if (!dateRange || !dateRange.startDate || !dateRange.endDate) {
      return res
        .status(400)
        .json({ message: "Date range is required for analysis." });
    }

    // Fetch user data to get convo_style preference (optional)
    const user = await User.findOne({ firebaseUID });
    if (!user) {
      // Should have been caught by checkUserLimits, but double-check
      return res.status(404).json({ message: "User profile not found." });
    }

    const userTimezone = user.timezone; // <-- Get user's timezone

    // --- Determine the final convo style to use ---
    // Prioritize style from request, fallback to user settings (if implemented), then default
    const final_convo_style =
      convo_style || user.settings?.convoStyle || "FRIENDLY";
    console.log(
      `(analyzeJournal) Using final convo_style: ${final_convo_style}`
    );

    // 2. Prepare Prompt / History & Get Model
    let streamingResponse;
    const modelConfig = await getGeminiModel(
      serviceTypeForPrompt,
      user.therapeuticDiet, // Use the user's actual diet for model configuration
      final_convo_style,    // Pass the determined conversation style
      0.5                     // Pass the temperature correctly
    );

    const { systemPrompt, userPrompt } = await constructPromptsForJournalAnalysis(
      user,
      mealsData,
      diet_code, // from req.body
      dateRange,
      final_convo_style, // Use the derived final_convo_style
      previousMessages // from req.body, includes current user message if follow-up
    );

    // Prepare contents for the new SDK
    let historyForSDK = [];
    if (Array.isArray(previousMessages) && previousMessages.length > 0) {
      // If previousMessages included the current user turn (as last item), slice it off for history.
      // The text of that turn is already incorporated into userPrompt by constructPromptsForJournalAnalysis.
      historyForSDK = previousMessages.slice(0, -1).map(msg => ({
        role: msg.role || (msg.sender === "user" ? "user" : "model"), // Normalize role
        parts: Array.isArray(msg.parts) ? msg.parts : [{ text: msg.message || msg.parts?.[0]?.text || '' }] // Normalize parts
      }));
    } else if (Array.isArray(previousMessages)) { // It's an array but empty (e.g. first turn, no actual history)
      historyForSDK = [];
    }
    // Ensure all parts in historyForSDK are correctly structured as [{text: "..."}]
    historyForSDK = historyForSDK.map(msg => ({
      ...msg,
      parts: Array.isArray(msg.parts) && msg.parts.every(p => typeof p.text === 'string') 
             ? msg.parts 
             : [{ text: (Array.isArray(msg.parts) && msg.parts[0]?.text) || msg.parts?.text || '' }] // Attempt to coerce if not already [{text: "..."}]
    }));


    const contents = [
      ...historyForSDK,
      { role: "user", parts: [{ text: userPrompt }] }, // userPrompt is the full text for the current user turn
    ];

    // Override systemInstruction from getGeminiModel if specific one is constructed for journal analysis
    const finalSystemInstruction = systemPrompt // systemPrompt will be null from our helper
      ? { parts: [{ text: systemPrompt }] }
      : modelConfig.systemInstruction; // So, this will be used

    console.log(
      `(analyzeJournal) Sending to Gemini. Model: ${modelConfig.modelName}, Temp: ${modelConfig.generationConfig.temperature}`
    );
    
    try {
      const streamingResult = await ai.models.generateContentStream({
        model: modelConfig.modelName,
        contents: contents,
        systemInstruction: finalSystemInstruction, // Use the potentially overridden system prompt
        generationConfig: modelConfig.generationConfig,
      });

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.flushHeaders();

      let fullResponseText = "";
      // for await (const chunk of result.stream) {
      for await (const chunk of streamingResult) {
        if (chunk && typeof chunk.text === 'string') { // Check if chunk and chunk.text exist and text is a string
          const textChunk = chunk.text; // Access text directly if available
          res.write(`data: ${JSON.stringify({ chunk: textChunk, done: false })}\n\n`); // Align with askKay
          fullResponseText += textChunk;
        } else {
          console.log("(analyzeJournal) Received an empty, non-text, or unexpectedly structured chunk:", chunk);
        }
      }

      // Save Response
      try {
        const savedResponse = new AIResponse({
          userId: user._id.toString(),
          firebaseUID: firebaseUID,
          serviceType: apiServiceKeyForLimits, // Use the key used for limits
          prompt: userPrompt, // Save the user's prompt for context
          response: fullResponseText,
        });
        await savedResponse.save();

        // Send final SSE chunk with metadata
        res.write(
          `data: ${JSON.stringify({
            // chunk: "", // Optional: include if frontend strictly expects it even when done
            done: true,
            remainingRequests: req.apiLimits?.remaining,
            resetTime: req.apiLimits?.lastReset,
            responseId: savedResponse._id,
            // You might also send the fullResponseText here if the client needs it one last time
            // analysis: fullResponseText, // Example from old code, consider if needed
          })}\n\n`
        );
        res.end();
        console.log("(analyzeJournal) Stream completed successfully.");
      } catch (saveError) {
        console.error(
          "(analyzeJournal) Error saving AI response:",
          saveError
        );
        // If saving fails, the stream might have already finished.
        // We can't easily send an SSE error now if res.end() was called.
        // Just log it server-side. The user already received the AI content.
        if (!res.writableEnded) {
          // If somehow saving failed *before* res.end(), try sending final chunk without responseId
          res.write(
            `data: ${JSON.stringify({
              // chunk: "", // Optional
              done: true,
              remainingRequests: req.apiLimits?.remaining,
              resetTime: req.apiLimits?.lastReset,
              responseId: null, // Indicate save failure
              error: "Failed to save response history.", // Optional error message
            })}\n\n`
          );
          res.end();
        }
      }
    } catch (error) {
      console.error(
        `(analyzeJournal) Top-level error for service ${req.body?.apiService}:`,
        error
      );
      // Handle potential errors during initial setup or the AI call itself
      if (res.headersSent && !res.writableEnded) {
        res.write(
          `data: ${JSON.stringify({
            // chunk: "", // Optional, align with how client handles errors
            error: error.message || "Error analyzing journal.",
            done: true // Indicate stream is finished, even with an error
          })}\n\n`
        );
        res.end();
      } else if (!res.headersSent) {
        // Check for safety feedback specifically
        if (error.response && error.response.promptFeedback) {
          console.error(
            "(analyzeJournal) AI Prompt Feedback:",
            error.response.promptFeedback
          );
          return res.status(400).json({
            message: `AI request blocked: ${error.response.promptFeedback.blockReason}`,
          });
        }
        res.status(500).json({
          error: error.message || "Failed to process journal analysis request.",
        });
      } else {
        if (!res.writableEnded) res.end();
      }
    }
  } catch (error) {
    // --- Top-level try-catch (NO CHANGES NEEDED HERE) ---
    console.error(
      `(analyzeJournal) Top-level error for service ${req.body?.apiService}:`,
      error
    );
    if (res.headersSent && !res.writableEnded) {
      res.write(
        `data: ${JSON.stringify({
          error: error.message || "Error processing journal analysis.",
          done: true // Indicate stream is finished, even with an error
        })}\n\n`
      );
      res.end();
    } else if (!res.headersSent) {
      if (error.response && error.response.promptFeedback) {
        console.error(
          "(analyzeJournal) AI Prompt Feedback:",
          error.response.promptFeedback
        );
        return res.status(400).json({
          message: `AI request blocked: ${error.response.promptFeedback.blockReason}`,
        });
      }
      res.status(500).json({
        error: error.message || "Failed to process journal analysis request.",
      });
    } else {
      if (!res.writableEnded) res.end();
    }
  }
};

// --- Meal Plan Handler ---
// Helper function (can be moved to utils)
const calculateEstimatedCalories = (user) => {
  const { sex, weightValue, weightUnit, activity } = user;
  if (
    !sex ||
    sex === "Not Specified" ||
    !weightValue ||
    weightValue <= 0 ||
    !activity ||
    activity === "Not Specified"
  )
    return null;
  const weightInLbs = weightUnit === "kg" ? weightValue * 2.20462 : weightValue;
  let multiplier;
  if (sex === "Male")
    multiplier =
      activity === "Sedentary"
        ? 12
        : activity === "Moderately active"
        ? 13
        : 14;
  else if (sex === "Female")
    multiplier =
      activity === "Sedentary"
        ? 10
        : activity === "Moderately active"
        ? 11
        : 12;
  else return null; // 'Other' not directly supported
  return Math.round(weightInLbs * multiplier);
};

export const getMealPlan = async (req, res) => {
  const userIP = req.ip || req.connection.remoteAddress;
  const firebaseUID = req.user?.uid;

  try {
    const user = await User.findOne({ firebaseUID });
    if (!user) return res.status(404).json({ error: "User not found" });

    const {
      meals,
      cookingPreferences,
      includeShoppingList,
      dietaryRestrictions,
      favoriteIngredients,
      dislikedIngredients,
      apiService,
      convo_style,
    } = req.body;
    const serviceTypeForPrompt = "MEAL_PLANNER"; // Match prompt key
    const apiServiceKeyForLimits = "mealPlanner"; // Match user model key
    const temperature = 0.7;

    console.log(
      `(ai.controller getMealPlan) User: ${firebaseUID}, Service: ${apiServiceKeyForLimits}, Prefs:`,
      req.body
    );

    // Setup SSE
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    });
    let fullResponse = "";

    // Get Model
    const modelConfig = await getGeminiModel(
      serviceTypeForPrompt,    // Correct serviceType
      user.therapeuticDiet,    // Correct diet_code
      convo_style,             // Pass the convo_style from req.body
      temperature              // Correct temperature
    );

    // Prepare Prompt
    const estimatedCalories = calculateEstimatedCalories(user);
    const calorieContext = estimatedCalories
      ? `Estimated daily calories needed: ${estimatedCalories}.`
      : "Bio-data for calorie estimation not provided.";
    const mealPreferencesText = `
      - Include meals: ${meals?.join(", ") || "Not specified"}
      - Cooking preferences: ${
        cookingPreferences?.join(", ") || "Not specified"
      }
      - Include shopping list: ${includeShoppingList ? "Yes" : "No"}
      ${
        dietaryRestrictions
          ? `- Additional restrictions: ${dietaryRestrictions}`
          : ""
      }
      ${
        favoriteIngredients
          ? `- Favorite ingredients: ${favoriteIngredients}`
          : ""
      }
      ${
        dislikedIngredients
          ? `- Disliked ingredients: ${dislikedIngredients}`
          : ""
      }
    `;
    const prompt = `${user.firstName} has ${user.conditionTreating} and follows the ${user.therapeuticDiet} diet. ${calorieContext} Create a 7-day meal plan with these preferences:\n${mealPreferencesText}\nSpeak directly to them.`;

    // Stream Response
    const streamingResult = await ai.models.generateContentStream({
      model: modelConfig.modelName,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      systemInstruction: modelConfig.systemInstruction,
      generationConfig: modelConfig.generationConfig,
    });

    for await (const chunk of streamingResult) {
      const chunkText = chunk.text;
      fullResponse += chunkText;
      res.write(
        `data: ${JSON.stringify({ chunk: chunkText, done: false })}\n\n`
      );
    }

    // Save Response
    const savedResponse = new AIResponse({
      userId: user._id.toString(),
      firebaseUID: firebaseUID,
      serviceType: apiServiceKeyForLimits, // Use the key used for limits/model
      prompt: JSON.stringify(req.body), // Save preferences
      response: fullResponse,
    });
    await savedResponse.save();

    // Send final SSE chunk with metadata
    res.write(
      `data: ${JSON.stringify({
        chunk: "",
        done: true,
        remainingRequests: req.apiLimits?.remaining,
        resetTime: req.apiLimits?.lastReset,
        responseId: savedResponse._id,
      })}\n\n`
    );
    res.end();
    console.log("(ai.controller getMealPlan) Stream completed.");
  } catch (error) {
    console.error("(ai.controller getMealPlan) Error:", error);
    if (res.headersSent && !res.writableEnded) {
      res.write(
        `data: ${JSON.stringify({
          error: error.message || "Error generating meal plan.",
        })}\n\n`
      );
      res.end();
    } else if (!res.headersSent) {
      res.status(500).json({
        error: error.message || "Failed to process meal plan request.",
      });
    } else {
      if (!res.writableEnded) res.end();
    }
  }
};

// --- Recipe Generation Handler ---
export const getRecipe = async (req, res) => {
  const userIP = req.ip || req.connection.remoteAddress;
  const firebaseUID = req.user?.uid;

  try {
    const user = await User.findOne({ firebaseUID });
    if (!user) {
      // Ensure response is not sent if headers already sent (should not happen here)
      if (!res.headersSent) {
        return res.status(404).json({ error: "User not found" });
      }
      console.error("(ai.controller getRecipe) Error: User not found, but headers already sent.");
      return; // Stop execution
    }

    const { ingredients, apiService, convo_style } = req.body;
    const serviceTypeForPrompt = "RECIPE_GENERATION"; // Match prompt key
    const apiServiceKeyForLimits = apiService; // Match user model key
    const temperature = 0.7;

    console.log(
      `(ai.controller getRecipe) User: ${firebaseUID}, Service: ${apiServiceKeyForLimits}, Ingredients: ${ingredients}`
    );

    // Setup SSE - once headers are written, errors must be sent via SSE
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    });
    let fullResponse = "";

    try {
      // This try block handles Gemini interaction and SSE streaming
      const modelConfig = await getGeminiModel(
        serviceTypeForPrompt,
        user.therapeuticDiet,
        convo_style,
        temperature
      );

      const prompt = `${user.firstName} has ${user.conditionTreating} and follows the ${user.therapeuticDiet} diet. Ingredients: ${ingredients}. Speak directly to them.`;

      const {
        modelName,
        systemInstruction,
        generationConfig: originalGenerationConfig,
      } = modelConfig;

      if (!modelName) {
        throw new Error("Model configuration is incomplete: modelName missing.");
      }

      let finalGenerationConfig;
      if (originalGenerationConfig) {
        const { thinkingConfig, ...restOfGenerationConfig } = originalGenerationConfig;
        if (Object.keys(restOfGenerationConfig).length > 0) {
          finalGenerationConfig = restOfGenerationConfig;
        }
      }

      const requestParams = {
        model: modelName,
        contents: [{ role: "user", parts: [{ text: prompt }] }],
      };

      if (systemInstruction) {
        requestParams.systemInstruction = systemInstruction;
      }
      if (finalGenerationConfig) {
        requestParams.generationConfig = finalGenerationConfig;
      }

      console.log('Detailed requestParams for Gemini:', JSON.stringify(requestParams, null, 2));

      if (!ai || !ai.models || typeof ai.models.generateContentStream !== 'function') {
        console.error("Gemini SDK 'ai.models.generateContentStream' is not available.", {
            ai_exists: !!ai,
            models_exists: !!ai?.models,
            func_type: typeof ai?.models?.generateContentStream
        });
        throw new Error("Gemini SDK is not properly initialized or 'generateContentStream' is missing.");
      }
      
      const streamingResult = await ai.models.generateContentStream(requestParams);

      if (!streamingResult || typeof streamingResult[Symbol.asyncIterator] !== 'function') {
        console.error('streamingResult is not an async iterable. Received:', streamingResult);
        throw new Error('Failed to get a valid stream from Gemini API. The response was not iterable.');
      }
      
      console.log('Got streaming result, starting iteration...');
      for await (const chunk of streamingResult) {
        const chunkText = chunk.text;
        console.log('Got chunk:', chunkText.substring(0, 50) + '...');
        
        fullResponse += chunkText;
        res.write(
          `data: ${JSON.stringify({ chunk: chunkText, done: false })}\n\n`
        );
      }
      
      const savedResponse = new AIResponse({
        userId: user._id.toString(),
        firebaseUID: firebaseUID,
        serviceType: apiServiceKeyForLimits,
        prompt: ingredients,
        response: fullResponse,
        model: modelName,
        tokensUsed: Math.ceil(fullResponse.length / 4), // add this to aiResponse model
      });
      await savedResponse.save();

      res.write(`data: ${JSON.stringify({
        done: true,
        remainingRequests: req.apiLimits?.remaining,
        resetTime: req.apiLimits?.lastReset,
        responseId: savedResponse._id,
      })}\n\n`);
      console.log("(ai.controller getRecipe) Stream completed.");

    } catch (error) {
      // This catch handles errors during Gemini interaction or SSE streaming
      console.error("(ai.controller getRecipe) Error during streaming/Gemini call:", error);
      if (!res.writableEnded) { // Check if we can still write to the stream
        try {
          res.write(`data: ${JSON.stringify({
            error: error.message || "An error occurred while processing your request.",
            done: true
          })}\n\n`);
        } catch (sseError) {
          console.error("Error writing error to SSE stream:", sseError);
        }
      }
    } finally {
      // Ensure the response is always ended if it hasn't been already
      if (!res.writableEnded) {
        res.end();
      }
    }
  } catch (error) {
    // This outer catch handles errors before SSE headers are sent (e.g., User.findOne, req.body issues)
    console.error("(ai.controller getRecipe) Fatal setup error:", error);
    if (!res.headersSent) {
      res.status(500).json({
        error: error.message || "An unexpected server error occurred.",
      });
    } else {
      // Headers sent, but we're in the outer catch. This implies an issue with error propagation
      // or an error occurred after headersSent but before the inner try-catch.
      // The SSE stream should have been ended by the inner finally block if it reached that far.
      if (!res.writableEnded) {
         console.error("(ai.controller getRecipe) Headers sent, but stream not ended in outer catch. Forcing end.");
         res.end();
      }
    }
  }
};

// --- Meal Conversion Handler ---
export const convertMeal = async (req, res) => {
  const userIP = req.ip || req.connection.remoteAddress;
  const firebaseUID = req.user?.uid;

  try {
    const user = await User.findOne({ firebaseUID });
    if (!user) {
      // Ensure response is not sent if headers already sent (should not happen here)
      if (!res.headersSent) {
        return res.status(404).json({ error: "User not found" });
      }
      console.error("(ai.controller convertMeal) Error: User not found, but headers already sent.");
      return; // Stop execution
    }

    const { meal, apiService, convo_style } = req.body;
    const serviceTypeForPrompt = "MEAL_CONVERT"; // Match prompt key
    const apiServiceKeyForLimits = apiService; // Match user model key
    const temperature = 0.7;

    console.log(
      `(ai.controller convertMeal) User: ${firebaseUID}, Service: ${apiServiceKeyForLimits}, Meal: ${meal}`
    );

    // Setup SSE
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    });
    let fullResponse = "";

    try {
    // Get Model
    const modelConfig = await getGeminiModel(
      serviceTypeForPrompt,    // Correct serviceType
      user.therapeuticDiet,    // Correct diet_code
      convo_style,             // Pass the convo_style from req.body
      temperature              // Correct temperature
    );

    // Prepare Prompt
    const prompt = `${user.firstName} has ${user.conditionTreating} and follows the ${user.therapeuticDiet} diet. Meal to adapt: ${meal}. Speak directly to them.`;

    const {
      modelName,
      systemInstruction,
      generationConfig: originalGenerationConfig,
    } = modelConfig;

    if (!modelName) {
      throw new Error("Model configuration is incomplete: modelName missing.");
    }

    let finalGenerationConfig;
    if (originalGenerationConfig) {
      const { thinkingConfig, ...restOfGenerationConfig } = originalGenerationConfig;
      if (Object.keys(restOfGenerationConfig).length > 0) {
        finalGenerationConfig = restOfGenerationConfig;
      }
    }

    const requestParams = {
      model: modelName,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    };

    if (systemInstruction) {
      requestParams.systemInstruction = systemInstruction;
    }
    if (finalGenerationConfig) {
      requestParams.generationConfig = finalGenerationConfig;
    }

    console.log('Detailed requestParams for Gemini:', JSON.stringify(requestParams, null, 2));

    if (!ai || !ai.models || typeof ai.models.generateContentStream !== 'function') {
      console.error("Gemini SDK 'ai.models.generateContentStream' is not available.", {
          ai_exists: !!ai,
          models_exists: !!ai?.models,
          func_type: typeof ai?.models?.generateContentStream
      });
      throw new Error("Gemini SDK is not properly initialized or 'generateContentStream' is missing.");
    }
    // Stream Response
    const streamingResult = await ai.models.generateContentStream(requestParams);

      if (!streamingResult || typeof streamingResult[Symbol.asyncIterator] !== 'function') {
        console.error('streamingResult is not an async iterable. Received:', streamingResult);
        throw new Error('Failed to get a valid stream from Gemini API. The response was not iterable.');
      }
      
      console.log('Got streaming result, starting iteration...');
      for await (const chunk of streamingResult) {
        const chunkText = chunk.text;
        console.log('Got chunk:', chunkText.substring(0, 50) + '...');
        
        fullResponse += chunkText;
        res.write(
          `data: ${JSON.stringify({ chunk: chunkText, done: false })}\n\n`
        );
      }

    // Save Response
    const savedResponse = new AIResponse({
      userId: user._id.toString(),
      firebaseUID: firebaseUID,
      serviceType: apiServiceKeyForLimits, // Use the key used for limits
      prompt: meal,
      response: fullResponse,
    });
    await savedResponse.save();

    // Send final SSE chunk with metadata
    res.write(`data: ${JSON.stringify({
      done: true,
      remainingRequests: req.apiLimits?.remaining,
      resetTime: req.apiLimits?.lastReset,
      responseId: savedResponse._id,
    })}\n\n`);
    console.log("(ai.controller convertMeal) Stream completed.");

    } catch (error) {
      // This catch handles errors during Gemini interaction or SSE streaming
      console.error("(ai.controller convertMeal) Error during streaming/Gemini call:", error);
      if (!res.writableEnded) { // Check if we can still write to the stream
        try {
          res.write(`data: ${JSON.stringify({
            error: error.message || "An error occurred while processing your request.",
            done: true
          })}\n\n`);
        } catch (sseError) {
          console.error("Error writing error to SSE stream:", sseError);
        }
      }
    } finally {
      // Ensure the response is always ended if it hasn't been already
      if (!res.writableEnded) {
        res.end();
      }
    }
  } catch (error) {
    // This outer catch handles errors before SSE headers are sent (e.g., User.findOne, req.body issues)
    console.error("(ai.controller convertMeal) Fatal setup error:", error);
    if (!res.headersSent) {
      res.status(500).json({
        error: error.message || "An unexpected server error occurred.",
      });
    } else {
      // Headers sent, but we're in the outer catch. This implies an issue with error propagation
      // or an error occurred after headersSent but before the inner try-catch.
      // The SSE stream should have been ended by the inner finally block if it reached that far.
      if (!res.writableEnded) {
         console.error("(ai.controller convertMeal) Headers sent, but stream not ended in outer catch. Forcing end.");
         res.end();
      }
    }
  }
};

// --- Ask Kay (Coaching) Handler ---
export const askKay = async (req, res) => {
  const userIP = req.ip || req.connection.remoteAddress;
  const firebaseUID = req.user?.uid;

  try {
    // Initial setup - errors here can use res.status().json()
    const user = await User.findOne({ firebaseUID });
    if (!user) {
      // Ensure response is not sent if headers already sent (should not happen here)
      if (!res.headersSent) {
        return res.status(404).json({ error: "User not found" });
      }
      console.error("(ai.controller askKay) Error: User not found, but headers already sent.");
      return; // Stop execution
    }

    const { question, apiService, convo_style } = req.body;
    const serviceTypeForPrompt = "ASK_KAY";
    const apiServiceKeyForLimits = apiService;
    const temperature = 0.3;

    // Corrected console.log
    console.log(
      `(ai.controller askKay) User: ${firebaseUID}, Service: ${apiServiceKeyForLimits}, Question: ${question}`
    );

    // Setup SSE - once headers are written, errors must be sent via SSE
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    });
    let fullResponse = "";

    try {
      // This try block handles Gemini interaction and SSE streaming
      const modelConfig = await getGeminiModel(
        serviceTypeForPrompt,
        user.therapeuticDiet,
        convo_style,
        temperature
      );

      const prompt = `${user.firstName} has ${user.conditionTreating} and follows the ${user.therapeuticDiet} diet. Question: ${question}. Speak directly to them.`;

      const {
        modelName,
        systemInstruction,
        generationConfig: originalGenerationConfig,
      } = modelConfig;

      if (!modelName) {
        throw new Error("Model configuration is incomplete: modelName missing.");
      }

      let finalGenerationConfig;
      if (originalGenerationConfig) {
        const { thinkingConfig, ...restOfGenerationConfig } = originalGenerationConfig;
        if (Object.keys(restOfGenerationConfig).length > 0) {
          finalGenerationConfig = restOfGenerationConfig;
        }
      }

      const requestParams = {
        model: modelName,
        contents: [{ role: "user", parts: [{ text: prompt }] }],
      };

      if (systemInstruction) {
        requestParams.systemInstruction = systemInstruction;
      }
      if (finalGenerationConfig) {
        requestParams.generationConfig = finalGenerationConfig;
      }

      console.log('Detailed requestParams for Gemini:', JSON.stringify(requestParams, null, 2));

      if (!ai || !ai.models || typeof ai.models.generateContentStream !== 'function') {
        console.error("Gemini SDK 'ai.models.generateContentStream' is not available.", {
            ai_exists: !!ai,
            models_exists: !!ai?.models,
            func_type: typeof ai?.models?.generateContentStream
        });
        throw new Error("Gemini SDK is not properly initialized or 'generateContentStream' is missing.");
      }
      
      const streamingResult = await ai.models.generateContentStream(requestParams);

      if (!streamingResult || typeof streamingResult[Symbol.asyncIterator] !== 'function') {
        console.error('streamingResult is not an async iterable. Received:', streamingResult);
        throw new Error('Failed to get a valid stream from Gemini API. The response was not iterable.');
      }
      
      console.log('Got streaming result, starting iteration...');
      for await (const chunk of streamingResult) {
        const chunkText = chunk.text;
        console.log('Got chunk:', chunkText.substring(0, 50) + '...');
        
        fullResponse += chunkText;
        res.write(
          `data: ${JSON.stringify({ chunk: chunkText, done: false })}\n\n`
        );
      }
      
      const savedResponse = new AIResponse({
        userId: user._id.toString(),
        firebaseUID: firebaseUID,
        serviceType: apiServiceKeyForLimits,
        prompt: question,
        response: fullResponse,
        model: modelName,
        tokensUsed: Math.ceil(fullResponse.length / 4), // add this to aiResponse model
      });
      await savedResponse.save();

      res.write(`data: ${JSON.stringify({
        done: true,
        remainingRequests: req.apiLimits?.remaining,
        resetTime: req.apiLimits?.lastReset,
        responseId: savedResponse._id,
      })}\n\n`);
      console.log("(ai.controller askKay) Stream completed.");

    } catch (error) {
      // This catch handles errors during Gemini interaction or SSE streaming
      console.error("(ai.controller askKay) Error during streaming/Gemini call:", error);
      if (!res.writableEnded) { // Check if we can still write to the stream
        try {
          res.write(`data: ${JSON.stringify({
            error: error.message || "An error occurred while processing your request.",
            done: true
          })}\n\n`);
        } catch (sseError) {
          console.error("Error writing error to SSE stream:", sseError);
        }
      }
    } finally {
      // Ensure the response is always ended if it hasn't been already
      if (!res.writableEnded) {
        res.end();
      }
    }
  } catch (error) {
    // This outer catch handles errors before SSE headers are sent (e.g., User.findOne, req.body issues)
    console.error("(ai.controller askKay) Fatal setup error:", error);
    if (!res.headersSent) {
      res.status(500).json({
        error: error.message || "An unexpected server error occurred.",
      });
    } else {
      // Headers sent, but we're in the outer catch. This implies an issue with error propagation
      // or an error occurred after headersSent but before the inner try-catch.
      // The SSE stream should have been ended by the inner finally block if it reached that far.
      if (!res.writableEnded) {
         console.error("(ai.controller askKay) Headers sent, but stream not ended in outer catch. Forcing end.");
         res.end();
      }
    }
  }
};

// --- Image Analysis Handler ---
/**
 * Handles the image analysis request. This function processes an image, interacts with the Gemini AI model
 * to analyze its content (e.g., ingredient labels), and streams the AI response back to the client.
 * It also handles user limits and error conditions, including AI safety feedback.
 * @param {Object} req - The Express request object, containing user data and image details.
 * @param {Object} res - The Express response object for streaming the AI response.
 * @returns {Promise<void>} A promise that resolves when the analysis is complete or an error occurs.
 */
export const analyzeImage = async (req, res) => {
  const userIP = req.ip || req.connection.remoteAddress;
  const firebaseUID = req.user?.uid;

  try {
    const user = await User.findOne({ firebaseUID });
    if (!user) {
      // Ensure response is not sent if headers already sent (should not happen here)
      if (!res.headersSent) {
        return res.status(404).json({ error: "User not found" });
      }
      console.error("(ai.controller analyzeImage) Error: User not found, but headers already sent.");
      return; // Stop execution
    }

    // Ensure file was uploaded by multer middleware
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    console.log(
      `(ai.controller analyzeImage) Received file: ${req.file.originalname}, size: ${req.file.size}`
    );

    // Get apiService and convo_style from the request body (sent via FormData)
    const { apiService, convo_style } = req.body;
    if (!apiService) {
      // This check is technically redundant if checkUserLimits runs first, but good practice
      return res
        .status(400)
        .json({ error: "API service type not specified in request body." });
    }
    console.log(
      `(ai.controller analyzeImage) Service: ${apiService}, Convo Style: ${convo_style}`
    );

    // --- Determine Prompt Type and DB Service Key based on apiService ---
    let serviceTypeForPrompt;
    const apiServiceKeyForLimits = apiService; // Usually matches, but allows override
    const temperature = 0.7;

    if (apiService === "checkIngredients") {
      serviceTypeForPrompt = "CHECK_INGREDIENTS"; // Matches key in .env.scd
      // apiServiceKeyForLimits remains 'checkIngredients' (matches user model)
    } else if (apiService === "analyzeMeal") {
      serviceTypeForPrompt = "ANALYZE_MEAL"; // Matches key in .env.scd
      // apiServiceKeyForLimits remains 'analyzeMeal' (matches user model)
    } else {
      // Handle unknown or unsupported apiService for image analysis
      console.error(
        `(ai.controller analyzeImage) Unsupported apiService for image analysis: ${apiService}`
      );
      return res
        .status(400)
        .json({ error: `Unsupported image analysis service: ${apiService}` });
    }
    // -----------------------------------------------------------------

    // Setup SSE
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    });
    let fullResponse = "";

    try {
    // This try block handles Gemini interaction and SSE streaming
    const modelConfig = await getGeminiModel(
      serviceTypeForPrompt,
      user.therapeuticDiet,
      convo_style,
      temperature
    );

    // Prepare Image Data
    const imageBuffer = req.file.buffer;
    const imageBase64 = imageBuffer.toString("base64");
    const imagePart = {
      inlineData: {
        data: imageBase64,
        mimeType: req.file.mimetype,
      },
    };

    // Prepare Text Prompt
    // Tailor the prompt based on the analysis type
    let textPrompt;
    if (apiService === "checkIngredients") {
      textPrompt = `${user.firstName} has ${user.conditionTreating}. Analyze this ingredient label image for ${user.therapeuticDiet} compliance according to the ${serviceTypeForPrompt} guidelines. Follow your system prompt. Refer to them directly.`;
    } else if (apiService === "analyzeMeal") {
      textPrompt = `${user.firstName} has ${user.conditionTreating}. Analyze this meal photo for ${user.therapeuticDiet} compliance according to the ${serviceTypeForPrompt} guidelines. Follow your system prompt. Refer to them directly.`;
    } else {
      textPrompt = `Analyze this image based on the guidelines for ${serviceTypeForPrompt}. User: ${user.firstName}, Diet: ${user.therapeuticDiet}.`; // Fallback
    }
    console.log(
      `(ai.controller analyzeImage) Text Prompt: ${textPrompt.substring(
        0,
        100
      )}...`
    );

    const {
      modelName,
      systemInstruction,
      generationConfig: originalGenerationConfig,
    } = modelConfig;

    if (!modelName) {
      throw new Error("Model configuration is incomplete: modelName missing.");
    }

    let finalGenerationConfig;
    if (originalGenerationConfig) {
      const { thinkingConfig, ...restOfGenerationConfig } = originalGenerationConfig;
      if (Object.keys(restOfGenerationConfig).length > 0) {
        finalGenerationConfig = restOfGenerationConfig;
      }
    }

    const requestParams = {
      model: modelName,
      contents: [{ role: "user", parts: [{ text: textPrompt }] }],
    };

    if (systemInstruction) {
      requestParams.systemInstruction = systemInstruction;
    }
    if (finalGenerationConfig) {
      requestParams.generationConfig = finalGenerationConfig;
    }

    console.log('Detailed requestParams for Gemini:', JSON.stringify(requestParams, null, 2));

    if (!ai || !ai.models || typeof ai.models.generateContentStream !== 'function') {
      console.error("Gemini SDK 'ai.models.generateContentStream' is not available.", {
          ai_exists: !!ai,
          models_exists: !!ai?.models,
          func_type: typeof ai?.models?.generateContentStream
      });
      throw new Error("Gemini SDK is not properly initialized or 'generateContentStream' is missing.");
    }

    // Stream Response (Multi-modal input: prompt + image)
    const streamingResult = await ai.models.generateContentStream({
      model: modelName,
      contents: [
        { role: "user", parts: [{ text: textPrompt }, imagePart] }, // Combined text and image parts for the user role
      ],
      systemInstruction: systemInstruction,
      generationConfig: finalGenerationConfig,
    });

    console.log('(ai.controller analyzeImage) Raw streamingResult from generateContentStream:', streamingResult);
    // For more detailed inspection, especially if the object is complex or has circular refs:
    // console.log('(ai.controller analyzeImage) Raw streamingResult (object):', streamingResult);
    // For a stringified version (might truncate or error on complex objects):
    // try {
    //   console.log('(ai.controller analyzeImage) Stringified streamingResult:', JSON.stringify(streamingResult, null, 2));
    // } catch (e) {
    //   console.error('(ai.controller analyzeImage) Error stringifying streamingResult:', e);
    // }

    if (!streamingResult || typeof streamingResult[Symbol.asyncIterator] !== 'function') {
      console.error(
        "(ai.controller analyzeImage) Error: streamingResult is not a valid async iterable. This means the AI call to generateContentStream might have failed or returned an unexpected response. Full streamingResult object logged above."
      );

      // Attempt to get more details from the 'response' promise if it exists
      // The 'response' field is a Promise that resolves to the full GenerateContentResponse
      if (streamingResult && typeof streamingResult.response?.then === 'function') {
        try {
          const aggregatedResponse = await streamingResult.response;
          console.error("(ai.controller analyzeImage) Aggregated response from streamingResult.response:", JSON.stringify(aggregatedResponse, null, 2));
          // Check for specific error structures in aggregatedResponse, e.g., promptFeedback for safety reasons
          if (aggregatedResponse?.promptFeedback?.blockReason) {
            console.error(
              `(ai.controller analyzeImage) Prompt feedback: Blocked due to ${aggregatedResponse.promptFeedback.blockReason}. ` +
              `Details: ${JSON.stringify(aggregatedResponse.promptFeedback.safetyRatings, null, 2)}`
            );
          }
        } catch (responseError) {
          console.error("(ai.controller analyzeImage) Error fetching or processing aggregated response from streamingResult.response:", responseError);
        }
      }

      if (!res.writableEnded) {
        res.write(
          `data: ${JSON.stringify({
            error: "AI service failed to initiate content stream. Please check server logs for details.",
            errorCode: "STREAM_INIT_FAILED",
            details: "streamingResult is not an async iterable after call to generateContentStream."
          })}

`
        );
        res.end();
      }
      return; // Critical to stop further processing
    }

    for await (const chunk of streamingResult) {
      // Handle potential errors during streaming from the provider itself
      if (
        chunk.candidates?.[0]?.finishReason &&
        chunk.candidates[0].finishReason !== "STOP"
      ) {
        console.error(
          `(ai.controller analyzeImage) AI stream stopped unexpectedly. Reason: ${chunk.candidates[0].finishReason}`
        );
        // Attempt to send an error back via SSE if possible
        if (!res.writableEnded) {
          res.write(
            `data: ${JSON.stringify({
              error: `AI generation stopped: ${chunk.candidates[0].finishReason}`,
            })}\n\n`
          );
          res.end();
        }
        return; // Stop processing
      }

      // Process valid chunks
      try {
        const chunkText = chunk.text;
        if (chunkText !== undefined) {
          // Check if text exists
          fullResponse += chunkText;
          res.write(
            `data: ${JSON.stringify({ chunk: chunkText, done: false })}\n\n`
          );
        }
      } catch (error) {
        // Catch potential errors from chunk.text if the chunk format is unexpected
        console.error(
          "(ai.controller analyzeImage) Error processing AI chunk:",
          error
        );
        // Decide if you want to send this error back to the client or just log it
        // Sending it might interrupt the UI flow depending on how frontend handles errors mid-stream
      }
    }

    console.log("(ai.controller analyzeImage) Stream processing finished.");

    // Save Response
    try {
      const savedResponse = new AIResponse({
        userId: user._id.toString(),
        firebaseUID: firebaseUID,
        serviceType: apiServiceKeyForLimits, // Use the key relevant to limits/DB categorization
        prompt: textPrompt, // Save the text part of the prompt for context
        // Storing base64 image in prompt might be too large, consider alternative if needed
        response: fullResponse,
        model: modelName,
        tokensUsed: Math.ceil(fullResponse.length / 4), // add this to aiResponse model
      });
      await savedResponse.save();
      console.log(
        `(ai.controller analyzeImage) Response saved for service ${apiServiceKeyForLimits}, ID: ${savedResponse._id}`
      );

      // Send final SSE chunk with metadata
      res.write(
        `data: ${JSON.stringify({
          chunk: "",
          done: true,
          remainingRequests: req.apiLimits?.remaining,
          resetTime: req.apiLimits?.lastReset,
          responseId: savedResponse._id,
        })}\n\n`
      );
      res.end();
      console.log(
        "(ai.controller analyzeImage) Stream completed successfully."
      );
    } catch (saveError) {
      console.error(
        "(ai.controller analyzeImage) Error saving AI response:",
        saveError
      );
      // If saving fails, the stream might have already finished.
      // We can't easily send an SSE error now if res.end() was called.
      // Just log it server-side. The user already received the AI content.
      if (!res.writableEnded) {
        // If somehow saving failed *before* res.end(), try sending final chunk without responseId
        res.write(
          `data: ${JSON.stringify({
            chunk: "",
            done: true,
            remainingRequests: req.apiLimits?.remaining,
            resetTime: req.apiLimits?.lastReset,
            responseId: null, // Indicate save failure
            error: "Failed to save response history.", // Optional error message
          })}\n\n`
        );
        res.end();
      }
    }
  } catch (error) {
    console.error(
      `(ai.controller analyzeImage) Top-level error for service ${req.body?.apiService}:`,
      error
    );
    // Handle potential errors during initial setup or the AI call itself
    if (res.headersSent && !res.writableEnded) {
      res.write(
        `data: ${JSON.stringify({
          error: error.message || "Error analyzing image.",
        })}\n\n`
      );
      res.end();
    } else if (!res.headersSent) {
      // Check for safety feedback specifically
      if (error.response && error.response.promptFeedback) {
        console.error(
          "(analyzeImage) AI Prompt Feedback:",
          error.response.promptFeedback
        );
        return res.status(400).json({
          message: `AI request blocked: ${error.response.promptFeedback.blockReason}`,
        }); // Closes .json() for the 400 status
      } // Closes if (error.response && error.response.promptFeedback)
      
      // If not safety feedback, send generic 500
      res.status(500).json({
        error: error.message || "Failed to process image analysis request.",
      }); // Closes .json() for the 500 status (this was original line 1430)
    } // IMPORTANT: This curly brace closes the `else if (!res.headersSent)` block.
      // The superfluous `else { ... }` block that was previously here should be gone.
  } // This is the closing brace for the main `catch (error)` block (original line 1434)
} finally {
  if (!res.writableEnded) res.end();
} 
}

// --- Analyze Medical Report Handler ---
/**
 * Handles the medical report analysis request. This function is intended to process PDF reports
 * and interact with the Gemini AI model for analysis. Currently, streaming is not implemented for this feature.
 * @param {Object} req - The Express request object.
 * @param {Object} res - The Express response object.
 * @returns {Promise<void>} A promise that resolves when the analysis is complete or an error occurs.
 */
export const analyzeReport = async (req, res) => {
  // TODO: Implement streaming logic similar to analyzeImage
  console.warn(
    "(ai.controller analyzeReport) - Streaming not yet implemented for PDF reports."
  );
  // Placeholder for non-streaming or future implementation
  res.status(501).json({
    message: "Medical report analysis (streaming) not yet implemented.",
  });
};

// --- AI Response Retrieval --- //
/**
 * Retrieves a single AI response by its ID for a given user.
 * @param {Object} req - The Express request object, containing user ID and AI response ID.
 * @param {Object} res - The Express response object.
 * @returns {Promise<void>} A promise that resolves with the AI response data or an error.
 */
// as of 250524 I believe this is not used in app yet
export const getAIResponse = async (req, res) => {
  try {
    const firebaseUID = req.user?.uid;
    const { id } = req.params; // AI response ID

    if (!firebaseUID) {
      return res.status(401).json({ message: "Unauthorized: No Firebase UID provided." });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid AI response ID format." });
    }

    const aiResponse = await AIResponse.findOne({ _id: id, firebaseUID });

    if (!aiResponse) {
      return res.status(404).json({ message: "AI response not found or not authorized." });
    }

    res.status(200).json(aiResponse);
  } catch (error) {
    console.error(`Error fetching AI response: ${error.message}`);
    res.status(500).json({ message: "Server error while fetching AI response." });
  }
};

/**
 * Deletes a single AI response by its ID for a given user.
 * @param {Object} req - The Express request object, containing user ID and AI response ID.
 * @param {Object} res - The Express response object.
 * @returns {Promise<void>} A promise that resolves with a success message or an error.
 */
// as of 250524 I believe this is not used in app yet
export const deleteAIResponse = async (req, res) => {
  try {
    const firebaseUID = req.user?.uid;
    const { id } = req.params; // AI response ID

    if (!firebaseUID) {
      return res.status(401).json({ message: "Unauthorized: No Firebase UID provided." });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid AI response ID format." });
    }

    const result = await AIResponse.deleteOne({ _id: id, firebaseUID });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "AI response not found or not authorized for deletion." });
    }

    res.status(200).json({ message: "AI response deleted successfully." });
  } catch (error) {
    console.error(`Error deleting AI response: ${error.message}`);
    res.status(500).json({ message: "Server error while deleting AI response." });
  }
};

/**
 * Retrieves all AI responses for a given user, with optional filtering by type.
 * @param {Object} req - The Express request object, containing user ID and optional query parameters for type.
 * @param {Object} res - The Express response object.
 * @returns {Promise<void>} A promise that resolves with an array of AI responses or an error.
 */
// as of 250524 I believe this is not used in app yet
export const getAIResponses = async (req, res) => {
  try {
    const firebaseUID = req.user?.uid;
    const { type } = req.query; // Optional: 'journalAnalysis', 'imageAnalysis', 'chat'

    if (!firebaseUID) {
      return res.status(401).json({ message: "Unauthorized: No Firebase UID provided." });
    }

    const query = { firebaseUID };
    if (type) {
      query.type = type; // Filter by type if provided
    }

    const aiResponses = await AIResponse.find(query).sort({ createdAt: -1 }); // Sort by newest first

    res.status(200).json(aiResponses);
  } catch (error) {
    console.error(`Error fetching AI responses: ${error.message}`);
    res.status(500).json({ message: "Server error while fetching AI responses." });
  }
};
