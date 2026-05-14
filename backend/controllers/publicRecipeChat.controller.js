import crypto from 'crypto';
import mongoose from 'mongoose';
import PublicChatSession from '../models/publicChatSession.model.js';
import Recipe from '../models/recipe.model.js';
import User from '../models/user.model.js';
import { publicRecipeChatAgentV2, initialPublicAgentStateV2 } from '../langgraph/publicRecipeChatAgent.js';
import { HumanMessage, AIMessage } from "@langchain/core/messages";
import sharp from 'sharp';
import { generateRecipeImage } from '../services/imageGeneration.service.js';
import { uploadBufferToGCS } from '../utils/gcs.js';

/**
 * Handles public recipe chat requests with streaming and session persistence.
 */
export const publicRecipeChat = async (req, res) => {
  try {
    const { message, recipeSlug, sessionId: existingSessionId, chatHistory: clientHistory } = req.body;
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];
    const referrer = req.headers['referer'];

    const appBaseUrl = (() => {
      const origin = req.headers.origin;
      if (typeof origin === 'string' && origin.startsWith('http')) return origin.replace(/\/$/, '');

      if (typeof referrer === 'string' && referrer.startsWith('http')) {
        try {
          return new URL(referrer).origin;
        } catch (err) {
          return null;
        }
      }

      return null;
    })();

    if (!message || !recipeSlug) {
      return res.status(400).json({ error: "Message and recipeSlug are required." });
    }

    // 1. Manage Session
    let sessionId = existingSessionId;
    let chatSession;

    if (sessionId) {
      chatSession = await PublicChatSession.findOne({ sessionId });
    }

    if (!chatSession) {
      // Generate unique session ID if not provided or not found
      sessionId = crypto.createHash('md5')
        .update(`${ipAddress}-${Date.now()}-${Math.random()}`)
        .digest('hex');
      
      chatSession = new PublicChatSession({
        sessionId,
        ipAddress,
        recipeSlug,
        userAgent,
        referrer,
        messages: []
      });

      // Persist immediately so tool logic (adapt_recipe) can read/update this session during the agent run.
      await chatSession.save();
    }

    // 2. Prepare Agent State
    // V2 agent uses a single messages[] array (HumanMessage/AIMessage) instead of separate userInput + chatHistory.
    const priorMessages = (chatSession.messages || []).map((msg) =>
      msg.role === 'user' ? new HumanMessage(msg.content) : new AIMessage(msg.content)
    );

    // 3. Set up SSE for streaming
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Session-ID', sessionId);

    // Helper to send SSE chunks
    const sendChunk = (data) => {
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    // 4. Run Agent
    let fullResponse = "";
    
    // We pass a mock socket-like object to handle streaming chunks back to SSE
    const config = {
      configurable: {
        socket: {
          emit: (event, data) => {
            if (event === 'chat_chunk') {
              sendChunk({ type: 'chunk', content: data.chunk });
            }

            if (event === 'recipe_card') {
              sendChunk({ type: 'recipeCard', recipe: data.recipe });
            }
          }
        },
        sessionId,
        recipeSlug,
        appBaseUrl,
      }
    };

    const result = await publicRecipeChatAgentV2.invoke(
      {
        ...initialPublicAgentStateV2,
        recipeSlug,
        appBaseUrl,
        messages: [...priorMessages, new HumanMessage(message)],
      },
      config
    );

    fullResponse = result.finalResponse;

    // 5. Persist to MongoDB
    chatSession.messages.push({ role: 'user', content: message });
    chatSession.messages.push({ role: 'assistant', content: fullResponse });
    chatSession.messageCount = chatSession.messages.length;
    chatSession.lastMessageAt = new Date();
    
    // Cache title if we don't have it yet
    if (!chatSession.recipeTitle && result.recipeData) {
      chatSession.recipeTitle = result.recipeData.recipeTitle;
    }

    await chatSession.save();

    // 6. Finalize SSE
    sendChunk({ type: 'complete', sessionId });
    res.end();

  } catch (error) {
    console.error("Public Chat Error:", error);
    if (!res.headersSent) {
      res.status(500).json({ error: "An error occurred during your chat. Please try again." });
    } else {
      res.write(`data: ${JSON.stringify({ type: 'error', message: "Stream interrupted." })}\n\n`);
      res.end();
    }
  }
};

/**
 * @route POST /api/public-recipe-chat/claim
 * @desc Claim any anonymous public Chef Kay adapted recipes for the authenticated user.
 * @access Private (Firebase)
 */
export const claimPublicRecipeAdaptations = async (req, res) => {
  try {
    const { anonSessionId } = req.body || {};

    if (!anonSessionId || typeof anonSessionId !== 'string') {
      return res.status(400).json({ success: false, message: 'anonSessionId is required.' });
    }

    const session = await mongoose.startSession();
    let recipeIds = [];

    try {
      await session.withTransaction(async () => {
        const user = await User.findOne({ firebaseUID: req.user.uid }).session(session);
        if (!user) {
          throw new Error('User not found.');
        }

        const claimable = await Recipe.find({
          anonSessionId,
          source: 'public_chef_kay_adaptation',
          claimedByUserId: null,
        })
          .session(session)
          .select({ _id: 1 });

        recipeIds = claimable.map((r) => r._id);
        if (recipeIds.length === 0) {
          return;
        }

        await Recipe.updateMany(
          { _id: { $in: recipeIds } },
          {
            $set: {
              generatedBy: user._id,
              claimedByUserId: user._id,
            },
            $addToSet: { savedBy: user._id },
          },
          { session }
        );

        await User.updateOne(
          { _id: user._id },
          { $addToSet: { savedRecipes: { $each: recipeIds } } },
          { session }
        );
      });
    } finally {
      session.endSession();
    }

    return res.status(200).json({
      success: true,
      claimedCount: recipeIds.length,
      recipeIds,
    });
  } catch (error) {
    console.error('[claimPublicRecipeAdaptations] Error:', error);
    const message = String(error?.message || '').includes('User not found')
      ? 'User not found.'
      : 'Failed to claim recipes.';
    const status = message === 'User not found.' ? 404 : 500;
    return res.status(status).json({ success: false, message });
  }
};
/**
 * Retrieves the message history for a given public chat session.
 */
export const getPublicChatHistory = async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    if (!sessionId) {
      return res.status(400).json({ error: "sessionId is required." });
    }

    const chatSession = await PublicChatSession.findOne({ sessionId });
    
    if (!chatSession) {
      return res.status(404).json({ error: "Session not found." });
    }

    // Format messages for the frontend
    const history = chatSession.messages.map((m, idx) => ({
      id: `${m.role}-${idx}-${Date.now()}`, // Generate semi-stable IDs
      role: m.role,
      content: m.content
    }));

    const adaptedRecipeIds = Array.isArray(chatSession.adaptedRecipeIds)
      ? chatSession.adaptedRecipeIds
      : [];

    const adaptedRecipesRaw = adaptedRecipeIds.length
      ? await Recipe.find({ _id: { $in: adaptedRecipeIds } })
          .select({
            _id: 1,
            recipeTitle: 1,
            recipeDescription: 1,
            recipeDiet: 1,
            mealType: 1,
            ingredients: 1,
            steps: 1,
            recipeImage: 1,
            imageVersion: 1,
          })
          .lean()
      : [];

    const adaptedRecipesById = new Map(
      adaptedRecipesRaw.map((r) => [String(r._id), r])
    );

    const adaptedRecipes = adaptedRecipeIds
      .map((id) => adaptedRecipesById.get(String(id)))
      .filter(Boolean);

    res.json({ success: true, history, adaptedRecipes });

  } catch (error) {
    console.error("Get History Error:", error);
    res.status(500).json({ error: "Failed to load chat history." });
  }
};

/**
 * @desc    Generate an AI image for a public-chat adapted recipe
 * @route   POST /api/public-recipe-chat/recipes/:id/generate-image
 * @access  Public
 */
export const generatePublicRecipeImage = async (req, res) => {
  try {
    const { id: recipeId } = req.params;
    const { anonSessionId } = req.body;
    
    if (!anonSessionId) {
      return res.status(400).json({ success: false, message: "anonSessionId is required." });
    }

    const recipe = await Recipe.findById(recipeId);
    if (!recipe) {
      return res.status(404).json({ success: false, message: "Recipe not found." });
    }

    // Verify this recipe was generated in the public chat for this session
    if (recipe.source !== 'public_chef_kay_adaptation' || recipe.anonSessionId !== anonSessionId) {
      return res.status(403).json({ success: false, message: "Not authorized to generate an image for this recipe." });
    }

    // Get the system user ID used for public adaptations
    const systemUserId = process.env.PUBLIC_CHEF_KAY_USER_ID;
    if (!systemUserId) {
      throw new Error("PUBLIC_CHEF_KAY_USER_ID environment variable is missing.");
    }

    // Generate the image buffer using Gemini
    const imageBuffer = await generateRecipeImage(recipe, null);

    // Increment image version
    recipe.imageVersion = (recipe.imageVersion || 0) + 1;
    const newVersion = recipe.imageVersion;

    // Determine filename base
    let filenameSlug = 'recipe';
    if (recipe.slug) {
      filenameSlug = recipe.slug;
    } else {
      const slugSource = recipe.seoSlugCandidate || recipe.recipeTitle;
      if (slugSource) {
        filenameSlug = slugSource.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
      }
    }
    const filenameBase = `${filenameSlug}-v${newVersion}`;

    // Process and upload images
    const sizes = {
      thumbnail: { width: 480, fit: 'inside', quality: 80 },
      display: { width: 800, fit: 'inside', quality: 85 },
      original: { quality: 90 },
    };

    const imageProcessor = sharp(imageBuffer);

    const uploadPromises = Object.entries(sizes).map(async ([key, settings]) => {
      let processor = imageProcessor.clone();
      if (settings.width) {
        processor = processor.resize({ width: settings.width, height: settings.height, fit: settings.fit });
      }
      const buffer = await processor.webp({ quality: settings.quality }).toBuffer();
      const destination = `users/${systemUserId}/recipes/${recipeId}/${filenameBase}-${key}.webp`;
      const url = await uploadBufferToGCS(buffer, destination);
      return [key, url];
    });

    const imageUrls = Object.fromEntries(await Promise.all(uploadPromises));

    // Update recipe and save
    recipe.recipeImage = imageUrls;
    await recipe.save();

    res.status(200).json({
      success: true,
      message: 'Image generated successfully.',
      data: imageUrls 
    });

  } catch (error) {
    console.error('[generatePublicRecipeImage] Error generating recipe image:', error);
    res.status(500).json({
      success: false,
      message: "Error generating image.",
      error: error.message
    });
  }
};
