/**
 * @file index_doc_Gemini_2.5_Flash.js
 * @description Main entry point for the Meadow Mentor Node.js Express backend server.
 * This file sets up the Express application, configures global middleware,
 * initializes crucial services like MongoDB, Firebase Admin SDK, and Sanity CMS client,
 * and mounts various API routers. It also defines several core API endpoints
 * for user management, blog content, and AI response handling.
 *
 * @version 1.0.0
 * @requires express - Core web framework for Node.js.
 * @requires morgan - HTTP request logger middleware.
 * @requires cors - Middleware for enabling Cross-Origin Resource Sharing.
 * @requires dotenv - Module to load environment variables from .env files.
 * @requires @anthropic-ai/sdk - Official SDK for interacting with Anthropic's Claude AI.

 * @requires body-parser - Middleware to parse incoming request bodies.
 * @requires fs - Node.js file system module (for reading service account keys/JSON data).
 * @requires path - Node.js path module (for resolving file paths).
 * @requires url - Node.js URL module (for `fileURLToPath` in ES Modules).
 * @requires mongoose - MongoDB object data modeling (ODM) library.
 * @requires firebase-admin - Firebase Admin SDK for backend integration (e.g., Auth).
 * @requires @sanity/client - Client for interacting with Sanity.io CMS.
 * @requires ./models/user.model.js - Mongoose model for user data.
 * @requires ./models/aiResponse.model.js - Mongoose model for AI response data.
 * @requires ./routes/conditions.js - Router for conditions-related API endpoints.
 * @requires ./routes/therapeuticDiets.js - Router for therapeutic diet information.
 * @requires ./routes/conditionSearchStats.js - Router for collecting condition search analytics.
 * @requires ./routes/meals.js - Router for user meal logging.
 * @requires ./routes/symptoms.js - Router for user symptom logging.
 * @requires ./routes/foods.js - Router for food-related endpoints, including compliance checks.
 * @requires ./routes/ai.routes.js - Router for AI-related requests (e.g., recipe generation, compliance).
 * @requires ./routes/mealPresets.js - Router for managing user-defined meal presets.
 * @requires ./routes/therapeuticDietFood.routes.js - Router for managing therapeutic diet food items (CRUD).
 * @requires ./middleware/verifyAdmin.js - Middleware to verify administrator privileges.
 * @requires ./middleware/authMiddleware.js - Middleware to verify Firebase ID tokens.
 * @date 2025-05-20
 * @author Reid Kimball/Reiditron
 */

// Main entry point

/**
 * @section Core Node.js Modules
 * @description Imports essential Node.js built-in modules.
 */
import fs from "fs"; // File system module for reading files (e.g., Firebase service account).
import path from "path"; // Path module for resolving absolute file paths.
import { fileURLToPath } from "url"; // Utility for converting module URL to file path (ES module equivalent of __dirname).
import crypto from "crypto"; // Node.js crypto module for generating UUIDs
import dotenv from "dotenv"; // Module for loading environment variables from a .env file.

/**
 * @section Environment Configuration
 * @description Load environment variables from a custom .env.config file.
 * This must be done at the very top before any other modules that rely on environment variables are loaded.
 */
// DO NOT FUCKING DELETE THESE dotenv.config() CALLS
// They are necessary for loading environment variables from different files.
dotenv.config({ path: "./.env.config" });
dotenv.config({ path: "./ai_prompts/.env.scd" }); // Loads SCD-specific AI prompts.
dotenv.config({ path: "./ai_prompts/.env.gaps" }); // Loads GAPS-specific AI prompts.
dotenv.config({ path: "./ai_prompts/.env.paleo-aip" }); // Loads Paleo-AIP-specific AI prompts.
dotenv.config({ path: "./ai_prompts/.env.mediterranean" }); // Loads Mediterranean-specific AI prompts.
dotenv.config({ path: "./ai_prompts/.env.dairy-free" }); // Loads Dairy-Free-specific AI prompts.
dotenv.config({ path: "./ai_prompts/.env.gluten-free" }); // Loads Gluten-Free-specific AI prompts.
dotenv.config({ path: "./ai_prompts/.env.nut-free" }); // Loads Nut-Free-specific AI prompts.
dotenv.config({ path: "./ai_prompts/.env.ai-personas" }); // Loads AI persona/conversation style prompts.
dotenv.config(); // Loads default .env file (if present) for general environment variables.

/**
 * @section Third-Party Libraries
 * @description Imports external libraries and frameworks.
 */
import express from "express"; // The core Express.js framework for building web applications.
import morgan from "morgan"; // HTTP request logger middleware for Node.js, providing development logging.
import cors from "cors"; // Express middleware to enable Cross-Origin Resource Sharing (CORS).

import bodyParser from "body-parser"; // Parses incoming request bodies in a middleware before your handlers.
import mongoose from "mongoose"; // MongoDB Object Data Modeling (ODM) library.
import admin from "firebase-admin"; // Firebase Admin SDK for server-side Firebase operations.
import { createClient } from "@sanity/client"; // Client for interacting with Sanity.io, a headless CMS.

/**
 * @section Internal Modules - Models
 * @description Imports Mongoose models representing MongoDB collections.
 */
import User from "./models/user.model.js"; // Mongoose model for user profiles.
import AIResponse from "./models/aiResponse.model.js"; // Mongoose model for storing AI responses.
import * as userHealthService from "./services/userHealth.service.js"; // Service for user health data operations.
import { registerUser } from "./services/userRegistration.orchestrator.js";
import { updateSubscriberDietAndCondition } from "./services/mailerlite.service.js";

/**
 * @section Internal Modules - Routers
 * @description Imports Express routers that encapsulate API endpoints for specific domains.
 */
import conditionsRouter from "./routes/conditions.js"; // Router for managing health conditions data.
import therapeuticDietsRouter from "./routes/therapeuticDiets.js"; // Router for therapeutic diet information.
import conditionSearchStatsRouter from "./routes/conditionSearchStats.js"; // Router for collecting condition search analytics.
import mealsRouter from "./routes/meals.js"; // Router for user meal logging.
import adminRoutes from "./routes/adminRoutes.js"; // Router for admin-specific endpoints.
import symptomsRouter from "./routes/symptoms.js"; // Router for user symptom logging.
import foodsRouter from "./routes/foods.js"; // Router for food-related endpoints, including compliance checks.
import aiRouter from "./routes/ai.routes.js"; // Router for AI-related requests (e.g., recipe generation, compliance).
import mealPresetsRouter from "./routes/mealPresets.js"; // Router for managing user-defined meal presets.
import therapeuticDietFoodRoutes from "./routes/therapeuticDietFood.routes.js"; // Router for managing therapeutic diet food items (CRUD).
import mcpRouter from "./routes/mcp.routes.js"; // Router for MCP API endpoints.
import langchainRouter from "./routes/langchain.routes.js"; // Router for LangChain-powered endpoints.
import userRoutes from "./routes/userRoutes.js"; // Router for user-related endpoints.
import recipeCardRouter from "./routes/recipeCard.routes.js"; // Router for recipe card management.
import publicRecipeRouter from "./routes/publicRecipe.routes.js"; // Router for public recipe management.
import publicMealPlanRouter from "./routes/publicMealPlan.routes.js"; // Router for public meal plan (SEO) endpoints.
import shoppingListRouter from "./routes/shoppingList.routes.js"; // Router for shopping list management.
import onboardingRoutes from "./routes/onboarding.routes.js"; // Router for onboarding-related endpoints.
import newsletterRoutes from "./routes/newsletter.js"; // Router for newsletter-related endpoints.
import leadMagnetRoutes from "./routes/leadMagnet.routes.js"; // Router for the 5-R checklist lead magnet.
import publicRecipeChatRouter from "./routes/publicRecipeChat.js"; // Router for public recipe AI chat.
import mealPlannerRouter from "./routes/mealPlanner.routes.js"; // Router for weekly meal planner feature.
import recipeCreditRouter from "./routes/recipeCredit.routes.js"; // Router for recipe generation with credits.
import mealPlanCreditRouter from "./routes/mealPlanCredit.routes.js"; // Router for meal plan generation with credits.
import stripeWebhookRouter from "./routes/stripeWebhook.routes.js"; // Router for Stripe webhooks and credit purchases.
import sessionContextRouter from "./routes/sessionContext.routes.js"; // Router for ephemeral session context.
import growthEngineRouter from "./routes/growthEngine.routes.js"; // Router for Meadow Growth Engine (Gmail to Sanity sync).
import bowelMovementRouter from "./routes/bowelMovement.routes.js"; // Router for bowel movement logging.
import { verifyTurnstileToken } from "./services/turnstile.service.js"; // Cloudflare Turnstile verification.

/**
 * @section Internal Modules - Middleware
 * @description Imports custom middleware functions used across the application.
 */
import { subscribeUser } from "./services/mailerlite.service.js";
import { verifyAdmin } from "./middleware/verifyAdmin.js"; // Middleware to check if an authenticated user is an administrator.
import { verifyFirebaseToken } from "./middleware/authMiddleware.js"; // Middleware to verify Firebase ID tokens.
import { validateUserRegistration, validateUserUpdate, normalizeUserInput } from "./middleware/inputValidation.middleware.js"; // Middleware for validating and normalizing user input.
import { checkIpBlacklist } from "./middleware/ipBlocking.middleware.js"; // Middleware to block requests from blacklisted IPs.
import errorHandler from "./middleware/errorHandler.js"; // Global error handling middleware

/**
 * @constant {string} __filename
 * @description The absolute path of the current module file.
 * This is an ES module equivalent for Node.js's CommonJS `__filename`.
 */
const __filename = fileURLToPath(import.meta.url);
/**
 * @constant {string} __dirname
 * @description The absolute path of the directory containing the current module file.
 * This is an ES module equivalent for Node.js's CommonJS `__dirname`.
 */
const __dirname = path.dirname(__filename);

/**
 * @section Environment Variable Loading
 * @description Loads configuration variables from various .env files.
 * Multiple dotenv.config() calls allow loading variables from different files,
 * with later calls potentially overriding earlier ones if keys overlap.
 * It's crucial to specify paths for specialized configurations like AI prompts.
 *
 * @remarks
 * - `.env.scd`, `.env.gaps`, etc., contain AI system prompts specific to therapeutic diets.
 * - `.env.ai-personas` contains AI conversational style prompts.
 * - `.env.config` contains general application configurations.
 * - A final `dotenv.config()` without a path loads the default `.env` file.
 */

/**
 * @section Firebase Admin SDK Initialization
 * @description Initializes the Firebase Admin SDK, essential for server-side Firebase
 * authentication (e.g., verifying ID tokens) and other Firebase services.
 *
 * @remarks
 * - The SDK is initialized only once using `if (!admin.apps.length)`.
 * - It prioritizes loading service account credentials from `GOOGLE_APPLICATION_CREDENTIALS`
 *   environment variable for production security.
 * - Falls back to a local JSON file (`./scd-guide-f62f8-firebase-adminsdk-fbsvc-51898fda5f.json`)
 *   for development, which *must* be added to `.gitignore`.
 * - The application exits immediately (`process.exit(1)`) if Firebase Admin SDK
 *   initialization fails, as it's a critical dependency.
 */
if (!admin.apps.length) {
  try {
    const serviceAccountPath =
      process.env.GOOGLE_APPLICATION_CREDENTIALS ||
      "./scd-guide-f62f8-firebase-adminsdk-fbsvc-51898fda5f.json";
    if (!fs.existsSync(serviceAccountPath)) {
      throw new Error(
        `Service account key file not found at ${serviceAccountPath}. Set GOOGLE_APPLICATION_CREDENTIALS environment variable or place the file.`
      );
    }
    const serviceAccount = JSON.parse(
      fs.readFileSync(serviceAccountPath, "utf8")
    );

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log("✅ Firebase Admin SDK Initialized Successfully.");
  } catch (error) {
    console.error("❌ !!! Firebase Admin SDK Initialization Failed !!!", error);
    process.exit(1); // Exit if Firebase Admin can't initialize
  }
}

/**
 * @constant {number} PORT
 * @description The port number on which the Express server will listen.
 * Defaults to `8080` if `process.env.PORT` is not set.
 */
const PORT = process.env.PORT || 8080;

/**
 * @constant {express.Application} app
 * @description The main Express application instance.
 */
const app = express();

/**
 * @section Global Express Middleware Setup
 * @description Configures various middleware functions that process all incoming requests.
 * The order of middleware is crucial, as they execute sequentially.
 */

// Middleware to generate and attach a unique requestId to each incoming request.
// This should be one of the very first middleware.
app.use((req, res, next) => {
  req.requestId = crypto.randomUUID();
  // Optionally, set it as a response header too, if clients might find it useful.
  // res.setHeader('X-Request-Id', req.requestId);
  next();
});

// Middleware to add 'ngrok-skip-browser-warning' header.
// This is specifically for ngrok users to bypass a browser warning.
app.use((req, res, next) => {
  res.setHeader("ngrok-skip-browser-warning", "true");
  next();
});

// Middleware to serve static files from the client's 'dist' directory.
// This is typically used in a production environment to serve the built frontend application.
app.use(express.static(path.join(__dirname, "..", "client", "dist")));

// HTTP request logger. 'dev' format provides concise colored output for development.
if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev", { skip: (req, res) => req.method === "OPTIONS" }));
}

app.use("/api/stripe/stripe-webhook", express.raw({ type: "application/json" }));
// Parses incoming JSON payloads. Configured with a 10MB limit to prevent excessively large requests.
app.use(express.json({ limit: "10mb" }));
// Parses URL-encoded bodies (typically from HTML form submissions).
// 'extended: true' allows for rich objects and arrays to be encoded into the URL-encoded format.
app.use(bodyParser.urlencoded({ limit: "10mb", extended: true }));

/**
 * @middleware CORS Configuration
 * @description Configures Cross-Origin Resource Sharing (CORS) to allow requests
 * from specified origins. This is critical for security and allowing the frontend
 * application to communicate with the backend.
 * @property {string[]} origin - An array of allowed origins. Requests from other origins will be rejected.
 * @property {boolean} credentials - Allows cookies and authorization headers to be sent cross-origin.
 * @property {string[]} methods - Allowed HTTP methods for CORS requests.
 * @property {string[]} allowedHeaders - Allowed HTTP headers for CORS requests.
 */
app.use(
  cors({
    origin: [
      "http://localhost:3000", // For local Next.js development.
      "http://localhost:5001", // For local Next.js development with custom port.
      "http://localhost:5173", // For local React App Vite development.
      "https://app.meadowmentor.com", // Production app domain (Cloud Run mapped).
      "https://meadowmentor.com", // Production marketing site.
      "https://www.meadowmentor.com", // Production marketing site (with www).
    ],
    credentials: true,
    methods: ["GET", "POST", "PATCH", "OPTIONS", "DELETE", "PUT"],
    allowedHeaders: ["Content-Type", "Authorization", "X-API-Service", "X-Session-ID", "Idempotency-Key"],
    exposedHeaders: ["X-Session-ID"],
  })
);

/**
 * @section Sanity Client Initialization
 * @description Initializes the Sanity.io client for fetching content from the headless CMS.
 * Configuration details are pulled from environment variables.
 *
 * @remarks
 * - `useCdn` is set to `true` in production for faster content delivery.
 * - `apiVersion` ensures compatibility with the Sanity API.
 */
const sanityClient = createClient({
  projectId: process.env.SANITY_PROJECT_ID,
  dataset: process.env.SANITY_DATASET,
  useCdn: process.env.NODE_ENV === "production",
  apiVersion: "2023-05-03", // Use a UTC date string for API versioning.
  // token: process.env.SANITY_API_READ_TOKEN, // Uncomment if using a token for read access.
});
console.log(
  `📖 Sanity Client Initialized for Project: ${process.env.SANITY_PROJECT_ID}, Dataset: ${process.env.SANITY_DATASET}`
);

/**
 * @section MongoDB Connection Setup
 * @description Establishes a connection to the MongoDB database using Mongoose.
 * The database URI is loaded from environment variables.
 *
 * @remarks
 * - The application exits immediately (`process.exit(1)`) if the database
 *   connection fails, as it's a critical dependency for most operations.
 * - This `then().catch()` block for connection happens before `app.listen()`
 *   to ensure the DB is ready before the server starts accepting requests.
 */
const DB = process.env.DATABASE;
mongoose
  .connect(DB)
  .then(() => {
    console.log(`🌱 DB connection to ${mongoose.connection.name} successful!`);
  })
  .catch((error) => {
    console.error("❌ DB connection error:", error);
    process.exit(1); // Exit if DB connection fails
  });

/**
 * @section API Route Mounting
 * @description Mounts various Express routers to specific API paths.
 * Routers group related API endpoints, improving modularity and organization.
 * Authentication middleware (`verifyFirebaseToken`) is applied selectively.
 */

/**
 * @subsection Public Routes
 * @description These routes do not require any authentication middleware.
 */
app.use("/api/conditions", conditionsRouter);
app.use("/api/therapeutic-diets", therapeuticDietsRouter);
app.use("/api/foods", foodsRouter); // Food data can be public for now, specific compliance checks may require auth.
app.use("/api/newsletter", newsletterRoutes); // Mounts router for newsletter-related endpoints.
app.use("/api/lead-magnet", leadMagnetRoutes); // Mounts router for the 5-R checklist lead magnet.
app.use("/api/public-recipes", publicRecipeRouter); // Mounts the public recipe router.
app.use("/api/public-meal-plans", publicMealPlanRouter); // Mounts the public meal plan router.
app.use("/api/public-recipe-chat", publicRecipeChatRouter); // Mounts the public recipe chat router.

/**
 * @subsection Protected Routes (Authentication Required)
 * @description These routes require a valid Firebase ID token for access.
 * The `verifyFirebaseToken` middleware is applied to ensure authentication.
 */
app.use("/api/admin", verifyFirebaseToken, adminRoutes);
app.use("/api/admin/growth", verifyFirebaseToken, verifyAdmin, growthEngineRouter); // Meadow Growth Engine routes (admin only)
app.use("/api/meal-presets", verifyFirebaseToken, mealPresetsRouter);
app.use(
  "/api/condition-search-stats",
  verifyFirebaseToken,
  conditionSearchStatsRouter
);
app.use("/api/meals", verifyFirebaseToken, mealsRouter);
app.use("/api/symptoms", verifyFirebaseToken, symptomsRouter);
app.use("/api/ai", verifyFirebaseToken, aiRouter); // All AI-related endpoints are protected.
app.use("/api/langchain", verifyFirebaseToken, langchainRouter); // All LangChain endpoints are protected.
app.use(
  "/api/therapeutic-diet-foods",
  verifyFirebaseToken,
  therapeuticDietFoodRoutes
); // Mounts router for therapeutic diet food items.
app.use("/api/recipes", verifyFirebaseToken, recipeCardRouter); // Mounts router for recipe card management.
app.use("/api/shopping-list", verifyFirebaseToken, shoppingListRouter); // Mounts router for shopping list management.
app.use("/api/meal-planner", verifyFirebaseToken, mealPlannerRouter); // Mounts router for weekly meal planner.
app.use("/api/users", verifyFirebaseToken, userRoutes);
app.use("/api/user-health", verifyFirebaseToken, sessionContextRouter); // Mounts session context router.
app.use("/api/bowel-movements", verifyFirebaseToken, bowelMovementRouter); // Mounts bowel movement logging router.

// Credit System Routes
app.use("/api/stripe", stripeWebhookRouter); // Stripe webhooks (no auth needed)
app.use("/api/recipes", verifyFirebaseToken, recipeCreditRouter); // Recipe generation with credits
app.use("/api/meal-plans", verifyFirebaseToken, mealPlanCreditRouter); // Meal plan generation with credits

// MCP API Routes
// Mount the MCP router. The base path will include the API version from config.
import mcpConfig from "./config/mcp.config.js";
app.use(`/mcp/${mcpConfig.apiVersion}`, mcpRouter);

app.use("/api/onboarding", onboardingRoutes);

/**
 * @route GET /api/blog/posts
 * @description Retrieves a list of recent blog posts from Sanity CMS.
 * Posts are ordered by publication date in descending order and limited to 12.
 * This endpoint is public and does not require authentication.
 * @access Public
 * @returns {object[]} 200 - An array of blog post objects, each containing _id, title, slug, publishedAt, mainImage, and description.
 * @returns {object} 500 - If there's an error fetching posts from Sanity.
 */
const POSTS_QUERY = `*[
  _type == "post"
  && defined(slug.current)
]|order(publishedAt desc)[0...12]{_id, title, slug, publishedAt, mainImage, description}`;

app.get("/api/blog/posts", async (req, res) => {

  try {
    const posts = await sanityClient.fetch(POSTS_QUERY);

    res.status(200).json(posts);
  } catch (error) {
    console.error("❌ (index.js) - Error fetching posts from Sanity:", error);
    res
      .status(500)
      .json({ error: "Failed to fetch blog posts", details: error.message });
  }
});

/**
 * @route GET /api/blog/posts/:slug
 * @description Retrieves a single blog post from Sanity CMS by its unique slug.
 * This endpoint is public and does not require authentication.
 * @access Public
 * @param {string} req.params.slug - The unique slug of the blog post to retrieve.
 * @returns {object} 200 - The blog post object, including its body, author name, and SEO metadata.
 * @returns {object} 400 - If the slug parameter is missing.
 * @returns {object} 404 - If a post with the specified slug is not found.
 * @returns {object} 500 - If there's an error fetching the post from Sanity.
 */
// query to fetch a single post by slug
const SINGLE_POST_QUERY = `*[
  _type == "post"
  && slug.current == $slug
][0]{
  _id,
  title,
  slug,
  publishedAt,
  description,
  mainImage,
  body,
  "authorName": author->{
    name,
    image,
    bio
  },
  seo
}`;

app.get("/api/blog/posts/:slug", async (req, res) => {
  const { slug } = req.params;


  if (!slug) {
    console.warn("⚠️ (index.js) - Slug parameter is required for single post.");
    return res.status(400).json({ error: "Slug parameter is required" });
  }

  try {
    const post = await sanityClient.fetch(SINGLE_POST_QUERY, { slug });

    if (!post) {
      console.log(`⚠️ (index.js) - Post with slug "${slug}" not found.`);
      return res.status(404).json({ error: "Post not found" });
    }


    res.status(200).json(post);
  } catch (error) {
    console.error(
      `❌ (index.js) - Error fetching post with slug "${slug}":`,
      error
    );
    res
      .status(500)
      .json({ error: "Failed to fetch blog post", details: error.message });
  }
});

/**
 * @route POST /api/users
 * @description Creates a new user profile and health record in MongoDB.
 * Creates both User and UserHealth documents in a transaction.
 * This endpoint is typically called during the signup process after a user has been created in Firebase Authentication.
 * @access Protected (requires `verifyFirebaseToken`)
 * @middleware verifyFirebaseToken - Authenticates the user.
 * @param {string} req.body.firebaseUID - The Firebase UID of the newly created user.
 * @param {string} req.body.firstName - The user's first name.
 * @param {string} req.body.email - The user's email address.
 * @param {string} [req.body.primaryDiet] - The user's selected therapeutic diet (optional, goes to UserHealth).
 * @param {string} [req.body.therapeuticDiet] - Legacy field name for primaryDiet (optional).
 * @param {string} [req.body.conditionTreating] - The user's reported condition (optional, goes to UserHealth).
 * @returns {object} 201 - The merged user profile and health data.
 * @returns {object} 400 - If required fields (firebaseUID, firstName, email) are missing or validation fails.
 * @returns {object} 409 - If a user with the given `firebaseUID` or `email` already exists (duplicate key error).
 * @returns {object} 500 - For any other internal server error during user creation.
 */
app.post(
  "/api/users",
  checkIpBlacklist,
  verifyFirebaseToken,
  validateUserRegistration,
  normalizeUserInput,
  async (req, res) => {


  try {
    const {
      firebaseUID,
      firstName,
      lastName,
      email,
      primaryDiet,
      therapeuticDiet, // Legacy field name
      conditionTreating,
      dietaryRestrictions,
      customDietaryRestrictions,
      sex,
      activity,
      weightValue,
      weightUnit,
      inFlare,
    } = req.body;

    if (!firebaseUID || !firstName || !email) {
      console.warn(
        "⚠️ (index.js /api/users) - Missing required fields (firebaseUID, firstName, email)."
      );
      return res
        .status(400)
        .json({ error: "Missing required signup fields(UID, Name, Email)." });
    }

    // Verify Turnstile Token
    const { token } = req.body;
    const remoteIp = req.ip || req.connection?.remoteAddress;
    const isHuman = await verifyTurnstileToken(token, remoteIp);
    
    if (!isHuman) {
        console.warn(`⚠️ (index.js /api/users) - Turnstile verification failed for IP: ${remoteIp}`);
        return res.status(400).json({ message: "Security check failed. Please try again." });
    }

    // Prepare User (profile) data
    const userData = {
      firebaseUID,
      firstName,
      lastName: lastName || "",
      email,
    };

    // Prepare UserHealth data
    const healthData = {
      primaryDiet: primaryDiet || therapeuticDiet || null, // Support both field names
      conditionTreating: conditionTreating || "",
      dietaryRestrictions: dietaryRestrictions || [],
      customDietaryRestrictions: customDietaryRestrictions || [],
      sex: sex || "Not Specified",
      activity: activity || "Not Specified",
      inFlare: inFlare || false,
    };

    // Handle weight data (convert legacy fields to nested object)
    if (weightValue !== undefined || weightUnit !== undefined) {
      healthData.weight = {
        value: weightValue || null,
        unit: weightUnit || "kg",
      };
    }

    console.log(`👤 (index.js /api/users) - Creating user with health data for: ${firebaseUID}`);

    // Create both User and UserHealth documents in a transaction
    const registrationResult = await registerUser(userData, healthData);
    


    // Subscribe user to MailerLite
    try {
      await subscribeUser(email, firstName);
    } catch (error) {
      console.error("Error subscribing user to MailerLite:", error);
      // Don't block the user creation process if MailerLite subscription fails
    }

    // Return merged data
    res.status(201).json(registrationResult);
  } catch (error) {
    console.error("❌ (index.js /api/users) Error saving user profile:", error);
    if (error.code === 11000) {
      console.error(
        "⚠️ (index.js /api/users) - Duplicate key error:",
        error.keyValue
      );
      return res.status(409).json({
        error:
          "Account conflict. This user ID or email might already be registered.",
      });
    }
    if (error.name === "ValidationError") {
      console.error(
        "⚠️ (index.js /api/users) - Validation Error:",
        error.message
      );
      return res
        .status(400)
        .json({ error: `Validation failed: ${error.message}` });
    }
    res
      .status(500)
      .json({ error: "Failed to create user profile. " + error.message });
  }
});

/**
 * @route POST /api/users/last-login
 * @description Updates the `lastLogin` timestamp for the authenticated user in the database.
 * This is used to track user activity and can inform features like API usage resets.
 * The user is identified from the verified Firebase token — no UID in the URL,
 * which eliminates Insecure Direct Object Reference (IDOR) risk.
 * @access Protected (requires `verifyFirebaseToken`)
 * @middleware verifyFirebaseToken - Authenticates the user and attaches `req.user`.
 * @returns {object} 200 - Success message with the updated `lastLogin` timestamp.
 * @returns {object} 404 - If the authenticated user is not found in the database.
 * @returns {object} 500 - For any internal server error during the update.
 */
app.post(
  "/api/users/last-login",
  verifyFirebaseToken,
  async (req, res) => {
    try {
      const firebaseUID = req.user.uid;
      const user = await User.findOne({ firebaseUID });
      if (!user) {
        console.warn(
          `⚠️ (index.js /api/users/last-login) - User ${firebaseUID} not found.`
        );
        return res.status(404).json({ error: "User not found" });
      }

      const now = new Date();
      await User.updateOne(
        { firebaseUID },
        {
          $set: {
            previousLastLogin: user.lastLogin,
            lastLogin: now,
          },
        }
      );

      res.json({ success: true, lastLogin: now });
    } catch (error) {
      console.error(
        `❌ (index.js /api/users/last-login) - Error updating last login time for ${req.user.uid}:`,
        error
      );
      res.status(500).json({ error: "Failed to update last login time" });
    }
  }
);

/**
 * @route GET /api/users/:firebaseUID
 * @description Retrieves the complete user data (profile + health) from MongoDB.
 * Returns merged data from User and UserHealth collections.
 * @access Protected (requires `verifyFirebaseToken`)
 * @middleware verifyFirebaseToken - Authenticates the user.
 * @param {string} req.params.firebaseUID - The Firebase UID of the user whose data is to be retrieved.
 * @returns {object} 200 - The merged user profile and health data object.
 * @returns {object} 403 - If the authenticated user's UID does not match `req.params.firebaseUID`.
 * @returns {object} 404 - If the user with the specified `firebaseUID` is not found.
 * @returns {object} 500 - For any internal server error during retrieval.
 */
app.get("/api/users/:firebaseUID", verifyFirebaseToken, async (req, res) => {
  // Authorization check: Only allow users to fetch their own profile.
  if (req.params.firebaseUID !== req.user.uid) {
    console.warn(
      `⚠️ (index.js /api/users GET) - Forbidden: User ${req.user.uid} tried to access profile of ${req.params.firebaseUID}.`
    );
    return res
      .status(403)
      .json({ message: "Forbidden: Cannot access profile for another user." });
  }

  try {
    // Use service to get merged User + UserHealth data
    const mergedUserData = await userHealthService.getMergedUserData(req.params.firebaseUID);
    
    if (!mergedUserData) {
      console.warn(
        `⚠️ (index.js /api/users GET) - User ${req.params.firebaseUID} not found.`
      );
      return res.status(404).json({ error: "User not found" });
    }
    

    res.json(mergedUserData);
  } catch (error) {
    console.error(
      `❌ (index.js /api/users GET) - Error retrieving user ${req.params.firebaseUID}:`,
      error
    );
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route PATCH /api/users/:firebaseUID
 * @description Updates user profile and health information in MongoDB.
 * Automatically splits data between User and UserHealth collections.
 * Users can only update their own profiles.
 * @access Protected (requires `verifyFirebaseToken`)
 * @middleware verifyFirebaseToken - Authenticates the user.
 * @param {string} req.params.firebaseUID - The Firebase UID of the user to be updated.
 * @param {object} req.body - The fields to update. Profile fields go to User collection, health fields go to UserHealth collection.
 * @returns {object} 200 - The merged updated user profile and health data.
 * @returns {object} 400 - If validation fails for any updated fields.
 * @returns {object} 403 - If the authenticated user's UID does not match `req.params.firebaseUID`.
 * @returns {object} 404 - If the user with the specified `firebaseUID` is not found.
 * @returns {object} 500 - For any other internal server error during the update.
 */
app.patch(
  "/api/users/:firebaseUID",
  verifyFirebaseToken,
  validateUserUpdate,
  normalizeUserInput,
  async (req, res) => {
  // Authorization check: Only allow users to update their own profile.
  if (req.params.firebaseUID !== req.user.uid) {
    console.warn(
      `⚠️ (index.js /api/users PATCH) - Forbidden: User ${req.user.uid} tried to update profile of ${req.params.firebaseUID}.`
    );
    return res
      .status(403)
      .json({ message: "Forbidden: Cannot update profile for another user." });
  }
  try {


    // Define allowed profile fields (User collection)
    const allowedProfileFields = [
      "firstName",
      "lastName",
      "timezone",
      "preferences",
    ];
    
    // Define allowed health fields (UserHealth collection)
    const allowedHealthFields = [
      "primaryDiet",
      "dietaryRestrictions",
      "customDietaryRestrictions",
      "conditionTreating",
      "weight",        // Now a nested object {value, unit}
      "weightValue",   // Legacy support - will be converted to weight.value
      "weightUnit",    // Legacy support - will be converted to weight.unit
      "sex",
      "activity",
      "inFlare",
    ];

    // Split incoming data into profile and health updates
    const profileData = {};
    const healthData = {};
    
    Object.keys(req.body).forEach((key) => {
      if (allowedProfileFields.includes(key)) {
        profileData[key] = req.body[key];
      } else if (allowedHealthFields.includes(key)) {
        // Handle legacy weightValue/weightUnit fields
        if (key === "weightValue" || key === "weightUnit") {
          if (!healthData.weight) {
            healthData.weight = {};
          }
          if (key === "weightValue") {
            healthData.weight.value = req.body[key];
          } else {
            healthData.weight.unit = req.body[key];
          }
        } else {
          healthData[key] = req.body[key];
        }
      }
    });



    // Use service to update both collections in a transaction
    const { user, health } = await userHealthService.updateUserWithHealth(
      req.params.firebaseUID,
      profileData,
      healthData
    );

    if (
      user?.email &&
      typeof healthData.primaryDiet === "string" &&
      healthData.primaryDiet &&
      typeof healthData.conditionTreating === "string" &&
      healthData.conditionTreating
    ) {
      try {
        await updateSubscriberDietAndCondition(
          user.email,
          healthData.primaryDiet,
          healthData.conditionTreating
        );
      } catch (error) {
        console.error(
          `❌ (index.js /api/users PATCH) - MailerLite diet/condition sync failed for user ${req.params.firebaseUID}:`,
          error
        );
      }
    }

    if (!user) {
      console.warn(
        `⚠️ (index.js /api/users PATCH) - User ${req.params.firebaseUID} not found for update.`
      );
      return res.status(404).json({ error: "User not found" });
    }
    
    // Merge and return updated data
    const mergedData = {
      ...user.toObject(),
      ...(health ? health.toObject() : {}),
    };
    
    console.log(
      `✅ (index.js /api/users PATCH) - User ${req.params.firebaseUID} profile and health data updated successfully.`
    );
    res.status(200).json(mergedData);
  } catch (error) {
    console.error(
      `❌ (index.js /api/users PATCH) - Error updating user ${req.params.firebaseUID}:`,
      error
    );
    if (error.name === "ValidationError") {
      return res.status(400).json({ error: error.message });
    }
    res
      .status(500)
      .json({ error: "Failed to update profile. Please try again." });
  }
});

/**
 * @route PATCH /api/users/payment-status
 * @description Updates the payment status for the authenticated user.
 * This endpoint is typically called by a client after a successful payment
 * or subscription change. The user is identified from the verified Firebase
 * token — no UID in the URL, which eliminates Insecure Direct Object
 * Reference (IDOR) risk.
 * @access Protected (requires `verifyFirebaseToken`)
 * @middleware verifyFirebaseToken - Authenticates the user and attaches `req.user`.
 * @param {object} req.body - The update payload.
 * @param {object} req.body.paymentStatus - An object containing payment status details (e.g., `isPremium`, `subscriptionId`, `stripeId`).
 * @returns {object} 200 - Success message and the updated user object.
 * @returns {object} 404 - If the user is not found.
 * @returns {object} 500 - For any internal server error during the update.
 */
app.patch(
  "/api/users/payment-status",
  verifyFirebaseToken,
  async (req, res) => {
    try {
      const uid = req.user.uid;
      const { paymentStatus } = req.body;

      const updatedUser = await User.findOneAndUpdate(
        { firebaseUID: uid },
        { paymentStatus },
        { new: true }
      );

      if (!updatedUser) {
        console.warn(
          `⚠️ (index.js /api/users/payment-status) - User ${uid} not found for payment status update.`
        );
        return res.status(404).json({ message: "User not found" });
      }
      console.log(
        `✅ (index.js /api/users/payment-status) - Payment status updated for user ${uid}.`
      );
      res
        .status(200)
        .json({ message: "Payment status updated", user: updatedUser });
    } catch (error) {
      console.error(
        `❌ (index.js /api/users/payment-status) - Error updating payment status for user ${req.user.uid}:`,
        error
      );
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

/**
 * @route GET /profile
 * @description Handles the redirect callback from authentication providers (e.g., Firebase).
 * This endpoint is essential for the client-side authentication flow, allowing the
 * frontend to receive auth parameters after successful login. It does not perform
 * any server-side authentication validation itself, only logs the event.
 * @access Public (part of authentication redirect flow)
 */
app.get("/profile", (req, res) => {
  console.log(`➡️ (index.js) - GET /profile (Firebase redirect) requested.`);
  // No response is typically sent here, as the client-side framework handles the redirect
  // and subsequent rendering. This route primarily serves as a target for the IdP.
  // For production SPAs, this often serves the index.html fallback for client-side routing.
});

/**
 * @section AI Response Management Endpoints
 * @description API endpoints for retrieving and saving AI-generated responses
 * to the `AIResponse` MongoDB collection.
 */

/**
 * @section Tombstone Routes — Retired / IDOR-patched endpoints
 * @description These routes catch calls to old URL patterns that included a
 * user ID in the path (IDOR risk), plus legacy saved-responses endpoints.
 * They return 410 Gone so any lingering caller surfaces loudly in logs
 * rather than silently 404-ing.
 * Safe to delete once no 410 hits appear in production logs for 2+ weeks.
 * @deprecated Scheduled for removal — monitor logs before deleting.
 */
app.get("/api/saved-responses", (_req, res) => {
  console.warn(
    `🚨 (index.js TOMBSTONE) - Hit deprecated GET /api/saved-responses`
  );
  res.status(410).json({ error: "Gone. This endpoint has been retired." });
});
app.get("/api/saved-responses/:serviceType", (req, res) => {
  console.warn(
    `🚨 (index.js TOMBSTONE) - Hit deprecated GET /api/saved-responses/${req.params.serviceType}`
  );
  res.status(410).json({ error: "Gone. This endpoint has been retired." });
});

app.post("/api/users/:firebaseUID/last-login", (req, res) => {
  console.warn(
    `🚨 (index.js TOMBSTONE) - Hit deprecated POST /api/users/${req.params.firebaseUID}/last-login`
  );
  res.status(410).json({ error: "Gone. Use POST /api/users/last-login instead." });
});

app.patch("/api/users/:uid/payment-status", (req, res) => {
  console.warn(
    `🚨 (index.js TOMBSTONE) - Hit deprecated PATCH /api/users/${req.params.uid}/payment-status`
  );
  res.status(410).json({ error: "Gone. Use PATCH /api/users/payment-status instead." });
});

/**
 * @route POST /api/save-response
 * @description Marks an existing AI response as 'saved' in the database.
 * This endpoint is typically called from the client when a user saves a response.
 * @access Protected (requires `verifyFirebaseToken`)
 * @middleware verifyFirebaseToken - Authenticates the user and attaches `req.user.uid`.
 * @param {object} req.body - The request body.
 * @param {string} req.body.responseId - The MongoDB `_id` of the AI response to be saved.
 * @returns {object} 200 - Success message with the updated AI response document.
 * @returns {object} 401 - If the user is not authenticated or the token is missing/invalid.
 * @returns {object} 404 - If the response with the given `responseId` is not found or does not belong to the authenticated user.
 * @returns {object} 500 - If an internal server error occurs during the update.
 */
app.post("/api/save-response", verifyFirebaseToken, async (req, res) => {
  const firebaseUID = req.user.uid; // UID from the verified token
  const { responseId } = req.body;

  if (!firebaseUID) {
    // This check should ideally be redundant if verifyFirebaseToken works correctly
    console.warn(
      "⚠️ [Save Endpoint] User not authenticated during save attempt."
    );
    return res.status(401).json({ error: "User not authenticated" });
  }

  try {
    console.log(`🔄 [Save Endpoint] Attempting to mark AI response as saved:`);
    console.log(`  _id (responseId): ${responseId}`);
    console.log(`  firebaseUID (from token): ${firebaseUID}`);

    const updatedResponse = await AIResponse.findOneAndUpdate(
      { _id: responseId, firebaseUID: firebaseUID }, // Ensure response belongs to the user
      { $set: { saved: true } },
      { new: true } // Return the updated document
    );

    if (!updatedResponse) {
      console.warn(
        `⚠️ [Save Endpoint] Response ${responseId} not found or not authorized for user ${firebaseUID}.`
      );
      return res
        .status(404)
        .json({ error: "Response not found or not authorized" });
    }

    console.log(
      `✅ [Save Endpoint] AI response ${responseId} marked as saved.`
    );
    res.status(200).json({ success: true, response: updatedResponse });
  } catch (error) {
    console.error("❌ Error saving response:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @section Admin Panel Routes
 * @description API endpoints for administrator functionalities, including user management.
 * These routes require both Firebase authentication and administrator privileges.
 */

/**
 * @route GET /api/users/checkAdmin/:firebaseUID
 * @description Checks if a specific user has administrator privileges.
 * This endpoint is typically used by the client to determine if an admin panel should be shown.
 * @access Admin only (requires `verifyFirebaseToken` and `verifyAdmin`)
 * @middleware verifyFirebaseToken - Authenticates the user.
 * @middleware verifyAdmin - Authorizes the user as an administrator.
 * @param {string} req.params.firebaseUID - The Firebase UID of the user to check.
 * @returns {object} 200 - An object `{ isAdmin: boolean }`.
 * @returns {object} 403 - If the authenticated user's UID does not match `req.params.firebaseUID`, or if the user is not an admin.
 * @returns {object} 404 - If the user is not found in the database.
 * @returns {object} 500 - For any internal server error.
 */
app.get(
  "/api/users/checkAdmin/:firebaseUID",
  verifyFirebaseToken,
  verifyAdmin,
  async (req, res) => {
    // This authorization check is technically redundant if verifyAdmin allows admins to check anyone,
    // but useful if we strictly want users to only check *their own* admin status.
    // Current setup implies admin can check anyone.
    // If strict self-check is desired, uncomment:
    /*
    if (req.params.firebaseUID !== req.user.uid) {
      return res.status(403).json({
        message: "Forbidden: Cannot check admin status for another user.",
      });
    }
    */

    try {
      const user = await User.findOne({ firebaseUID: req.params.firebaseUID }); // Use req.params.firebaseUID to allow admin to check others
      if (!user) {
        console.warn(
          `⚠️ (index.js /api/users/checkAdmin) - User ${req.params.firebaseUID} not found.`
        );
        return res.status(404).json({ error: "User not found" });
      }
      console.log(
        `🛡️ (index.js /api/users/checkAdmin) - Admin status for ${req.params.firebaseUID}: ${user.isAdmin}.`
      );
      res.json({ isAdmin: user.isAdmin === true });
    } catch (error) {
      console.error(
        `❌ (index.js /api/users/checkAdmin) - Error checking admin status for ${req.params.firebaseUID}:`,
        error
      );
      res.status(500).json({ error: error.message });
    }
  }
);

/**
 * @route GET /api/admin/users
 * @description Retrieves a list of all user profiles from the database.
 * This endpoint is exclusively for administrators.
 * @access Admin only (requires `verifyFirebaseToken` and `verifyAdmin`)
 * @middleware verifyFirebaseToken - Authenticates the user.
 * @middleware verifyAdmin - Authorizes the user as an administrator.
 * @returns {object[]} 200 - An array of simplified user objects (id, email, firstName, lastName, source).
 * @returns {object} 500 - If an error occurs during database retrieval.
 */
app.get(
  "/api/admin/users",
  verifyFirebaseToken,
  verifyAdmin,
  async (req, res) => {
    try {
      const users = await User.find({}); // Retrieve all users
      console.log(
        `🛡️ (index.js /api/admin/users) - Retrieved ${users.length} users for admin panel.`
      );
      res.json(
        users.map((user) => ({
          id: user.firebaseUID,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          source: "MongoDB", // Indicates data source
        }))
      );
    } catch (error) {
      console.error(
        "❌ (index.js /api/admin/users) - Error fetching all users:",
        error
      );
      res.status(500).json({ error: error.message });
    }
  }
);

/**
 * @route DELETE /api/admin/users/:userId
 * @description Deletes a user profile across multiple services (MongoDB, Stripe, Firebase).
 * This is a critical administrative function.
 * @access Admin only (requires `verifyFirebaseToken` and `verifyAdmin`)
 * @middleware verifyFirebaseToken - Authenticates the user.
 * @middleware verifyAdmin - Authorizes the user as an administrator.
 * @param {string} req.params.userId - The Firebase UID of the user to be deleted.
 * @returns {object} 200 - Success message indicating the user was deleted.
 * @returns {object} 404 - If the user is not found in MongoDB.
 * @returns {object} 500 - For any internal server error during deletion across services.
 * @remarks
 * - Requires `stripe` package if Stripe integration is enabled.
 * - Firebase user deletion (authentication record) is typically handled on the client side
 *   or via another Firebase Admin SDK call not directly implemented here for clarity.
 */
app.delete(
  "/api/admin/users/:userId",
  verifyFirebaseToken,
  verifyAdmin,
  async (req, res) => {
    try {
      const userId = req.params.userId;
      console.log(
        `🛡️ (index.js /api/admin/users DELETE) - Attempting to delete user: ${userId}`
      );

      // 1. Get user data (including Stripe ID if it exists)
      const user = await User.findOne({ firebaseUID: userId });
      if (!user) {
        console.warn(
          `⚠️ (index.js /api/admin/users DELETE) - User ${userId} not found in DB.`
        );
        return res.status(404).json({ error: "User not found" });
      }

      // 2. Delete from Stripe if a Stripe customer ID is associated
      if (user?.paymentStatus?.stripeId) {
        try {
          // Dynamically import stripe to avoid global dependency if not always needed
          const stripe = await import("stripe").then((mod) =>
            mod.default(process.env.STRIPE_SECRET_KEY)
          );
          await stripe.customers.del(user.paymentStatus.stripeId);
          console.log(
            `✅ (index.js /api/admin/users DELETE) - Stripe customer ${user.paymentStatus.stripeId} deleted.`
          );
        } catch (stripeError) {
          console.error(
            "❌ (index.js /api/admin/users DELETE) - Stripe deletion error:",
            stripeError
          );
          // Continue with other deletion steps even if Stripe fails, as it might be non-critical or already deleted.
        }
      }

      // 3. Delete from MongoDB
      await User.findOneAndDelete({ firebaseUID: userId });
      console.log(
        `✅ (index.js /api/admin/users DELETE) - MongoDB user ${userId} deleted.`
      );

      // 4. Return success response
      res.status(200).json({
        success: true,
        message: `User ${userId} deleted successfully.`,
      });

      // Note: Firebase authentication record deletion (admin.auth().deleteUser(userId))
      // should ideally be handled here as well for full cleanup, or confirmed client-side.
    } catch (error) {
      console.error(
        "❌ (index.js /api/admin/users DELETE) - User deletion error:",
        error
      );
      res.status(500).json({ error: error.message });
    }
  }
);

/**
 * @function calculateEstimatedCalories
 * @description Helper function to calculate a user's estimated daily calorie needs
 * based on their sex, weight, and activity level. This calculation uses a simplified
 * formula (weight * multiplier) and requires specific biometric data.
 *
 * @param {object} user - The user object containing `sex`, `weightValue`, `weightUnit`, and `activity`.
 * @param {string} user.sex - The user's biological sex ("Male", "Female", "Not Specified", "Other").
 * @param {number} user.weightValue - The user's weight value.
 * @param {"lbs"|"kg"} user.weightUnit - The unit of the user's weight.
 * @param {"Sedentary"|"Moderately active"|"Very active"|"Not Specified"} user.activity - The user's activity level.
 * @returns {number|null} The estimated daily calories rounded to the nearest integer, or `null` if insufficient data is provided.
 */
const calculateEstimatedCalories = (user) => {
  const { sex, weightValue, weightUnit, activity } = user;

  // Check if we have enough data to perform the calculation
  if (
    !sex ||
    sex === "Not Specified" ||
    !weightValue ||
    weightValue <= 0 ||
    !activity ||
    activity === "Not Specified"
  ) {
    console.log(
      `📊 (index.js - calculateEstimatedCalories) - Insufficient bio-data for calorie calculation for user ${user.firebaseUID}`
    );
    return null; // Not enough info to calculate
  }

  // Convert weight to lbs if necessary for consistent calculation
  const weightInLbs = weightUnit === "kg" ? weightValue * 2.20462 : weightValue;

  let multiplier;

  // Determine multiplier based on sex and activity level
  if (sex === "Male") {
    switch (activity) {
      case "Sedentary":
        multiplier = 12;
        break;
      case "Moderately active":
        multiplier = 13;
        break;
      case "Very active":
        multiplier = 14;
        break;
      default:
        console.warn(
          `⚠️ (index.js - calculateEstimatedCalories) - Unrecognized activity level for male: ${activity}`
        );
        return null;
    }
  } else if (sex === "Female") {
    switch (activity) {
      case "Sedentary":
        multiplier = 10;
        break;
      case "Moderately active":
        multiplier = 11;
        break;
      case "Very active":
        multiplier = 12;
        break;
      default:
        console.warn(
          `⚠️ (index.js - calculateEstimatedCalories) - Unrecognized activity level for female: ${activity}`
        );
        return null;
    }
  } else {
    console.warn(
      `⚠️ (index.js - calculateEstimatedCalories) - Sex "${sex}" not directly supported for calorie calculation.`
    );
    return null; // Handle 'Other' or unexpected sex values
  }

  const estimatedCalories = Math.round(weightInLbs * multiplier);
  console.log(
    `📊 (index.js - calculateEstimatedCalories) - Estimated calories for user ${user.firebaseUID}: ${estimatedCalories}`
  );
  return estimatedCalories;
};

// Handle 404 Not Found errors - for API routes not caught by specific routers
// THIS MUST BE BEFORE THE SPA CATCH-ALL app.get('*', ...)
app.use((req, res, next) => {
  if (req.path.startsWith("/api/") || req.path.startsWith("/mcp/")) {
    console.log(
      `[index.js] CUSTOM API 404 HANDLER: Path '${req.originalUrl}' not found. Sending 404 JSON response.`
    ); // <-- ADD THIS LOG
    const errorResponse = mcpConfig.createErrorResponse(
      "NOT_FOUND",
      `The requested resource '${req.originalUrl}' was not found.`,
      { path: req.originalUrl },
      req.requestId
    );
    return res.status(404).json(errorResponse);
  }
  // If not an API path, pass to the next handler
  next();
});

/**
 * @route GET *
 * @description Catch-all route to serve the client-side `index.html` for Single Page Applications (SPAs).
 * This ensures that direct URL access (e.g., refreshing a page) to routes not defined
 * by the Express server will still load the frontend application, allowing client-side
 * routing to take over. This middleware must be placed *last* in the chain.
 * @access Public
 * @param {express.Request} req - The Express request object.
 * @param {express.Response} res - The Express response object.
 * @param {express.NextFunction} next - The callback function to pass control to the next middleware (error handler).
 * @returns {void} Sends the `index.html` file, or a 500 error if the file cannot be sent.
 */
app.get("*", (req, res, next) => {
  const indexPath = path.join(__dirname, "..", "client", "dist", "index.html");
  console.log(`📦 (index.js Catch-All) Attempting to serve: ${indexPath}`);
  console.log(`📦 (index.js Catch-All) Current __dirname: ${__dirname}`);

  res.sendFile(indexPath, (err) => {
    if (err) {
      console.error(
        `❌ (index.js Catch-All) Error sending file ${indexPath}:`,
        err
      );
      // Pass the error to the next error handler if one exists, or send a generic error
      if (!res.headersSent) {
        res.status(500).send("Server error trying to send file.");
      }
    } else {
      console.log(`✅ (index.js - GET *) - Sent index.html to ${req.ip}`);
    }
  });
});

// Global error handling middleware - MUST be last!
app.use(errorHandler);

/**
 * @section Server Startup
 * @description Starts the Express server and listens for incoming requests on the configured port.
 * It also logs the database connection status.
 */
app.listen(PORT, () => {
  // Check Mongoose connection state before logging.
  // `readyState` 1 means connected, 0 means disconnected, 2 means connecting, 3 means disconnecting.
  if (mongoose.connection.readyState === 1) {
    console.log(`✅ DB connection to ${mongoose.connection.name} successful!`);
  } else {
    console.warn(
      `⚠️ DB connection status is ${mongoose.connection.readyState}. Waiting for connection...`
    );
    // Attach listeners to ensure connection status is logged even if it connects after listen
    mongoose.connection.on("connected", () => {
      console.log(
        `✅ DB connection to ${mongoose.connection.name} successful (connected after server started)!`
      );
    });
    mongoose.connection.on("error", (err) => {
      console.error(`❌ DB connection error after server started: ${err}`);
    });
  }
  console.log(`🚀 Server running on port ${PORT}`);
});
