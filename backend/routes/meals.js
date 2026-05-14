/**
 * @file meals_doc.js
 * @description Manages API endpoints related to user meals. This includes logging new meals, 
 *              retrieving meal history, fetching meals by date or recent activity, updating existing 
 *              meals, and deleting meals. It also handles the logging of associated symptoms 
 *              linked to specific meal entries. All routes are designed to be protected and 
 *              expect a Firebase UID (`req.user.uid`) from an upstream authentication middleware.
 * @version 1.0.0
 * @requires express - Framework for building the router and handling HTTP requests.
 * @requires ../models/userMeal.model.js - Mongoose model for user meal data.
 * @requires ../models/userSymptoms.model.js - Mongoose model for user symptom data.
 * @requires dayjs - Utility library for date and time manipulation.
 * @requires mongoose - ODM library for MongoDB, used here for `ObjectId` if needed directly.
 * @date 2025-05-21
 * @author Cascade AI
 */

// Core Node.js/Express Modules
import express from "express"; // Express framework for routing

// Internal Modules & Models
import UserMeal from "../models/userMeal.model.js"; // Import the UserMeal model for database operations
import UserSymptoms from "../models/userSymptoms.model.js"; // Import UserSymptoms model for linking symptoms to meals

// Third-Party Libraries
import dayjs from "dayjs"; // Utility for date/time manipulation
import utc from "dayjs/plugin/utc.js"; // Plugin for UTC handling with dayjs
import isToday from "dayjs/plugin/isToday.js"; // Plugin to check if a date is today with dayjs
import mongoose from "mongoose"; // MongoDB ODM, useful for ObjectId types

dayjs.extend(utc);
dayjs.extend(isToday);

// Potentially import middleware for authentication
// import { verifyUserToken } from '../middleware/authMiddleware.js'; // Example: Authentication middleware

/**
 * @constant {object} router
 * @description Express router instance for handling meal-related API routes.
 */
const router = express.Router();

/**
 * @function saveAssociatedSymptoms
 * @async
 * @description Saves an array of symptom objects to the UserSymptoms collection, associating them with a specific meal and user.
 *              If the provided symptoms array is empty or invalid, the function will log a message and exit without saving.
 *              It performs a bulk insert for efficiency.
 * @param {Array<Object>} symptomsArray - An array of symptom objects to be saved. Each object should conform to the UserSymptoms schema (excluding `firebaseUID`, `associatedMealId`, `source`, and `_id` which are set by this function).
 * @param {mongoose.Types.ObjectId | string} mealId - The ID of the meal with which these symptoms are associated.
 * @param {string} userId - The Firebase UID of the user to whom these symptoms belong.
 * @returns {Promise<void>} A promise that resolves when the symptoms have been processed (either saved or skipped).
 * @throws Will log errors to the console if the bulk insert operation fails but does not re-throw the error to the caller by default.
 */
const saveAssociatedSymptoms = async (symptomsArray, mealId, userId) => {
  if (
    !symptomsArray ||
    !Array.isArray(symptomsArray) ||
    symptomsArray.length === 0
  ) {
    console.log(
      `[meals.js saveAssociatedSymptoms] No symptoms provided for meal ${mealId}.`
    );
    return; // Nothing to save
  }

  const symptomDocsToSave = symptomsArray.map((symptom) => ({
    ...symptom, // Spread the symptom data from the request
    firebaseUID: userId,
    associatedMealId: mealId,
    source: "meal", // Explicitly set source
    // Ensure _id is removed if it's a temporary frontend ID
    _id: undefined, // Mongoose will generate a new ID
  }));

  try {
    // Bulk insert the prepared symptom documents
    await UserSymptoms.insertMany(symptomDocsToSave, { ordered: false }); // ordered:false attempts to insert all, even if some fail
    console.log(
      `[meals.js saveAssociatedSymptoms] Saved ${symptomDocsToSave.length} symptoms for meal ${mealId}.`
    );
  } catch (error) {
    console.error(
      `[meals.js saveAssociatedSymptoms] Error bulk saving symptoms for meal ${mealId}:`,
      error
    );
    // Decide how to handle partial failures. Log it for now.
    // Depending on requirements, you might want to throw the error
    // or attempt individual saves, but bulk is generally preferred.
  }
};

/**
 * @route POST /log
 * @description Logs a new meal for the authenticated user and optionally saves associated symptoms. 
 *              The meal data and any associated symptoms are provided in the request body.
 * @access Protected - Requires user authentication. Expects `req.user.uid` to be populated by upstream authentication middleware.
 * @param {object} req - Express request object.
 * @param {object} req.user - Expected to contain the authenticated user's information, specifically `req.user.uid`.
 * @param {object} req.body - The request body containing meal and symptom data.
 * @param {string} req.body.diet_code - The code of the diet the user is following (e.g., "SCD", "MEDITERRANEAN").
 * @param {string} req.body.mealName - The name or description of the meal (e.g., "Breakfast", "Chicken Salad").
 * @param {Array<object>} req.body.ingredients - An array of ingredient objects part of the meal.
 * @param {object} req.body.complianceSnapshot - An object detailing the meal's compliance with the diet.
 * @param {string} req.body.mealDateTime - ISO 8601 timestamp string for when the meal was consumed.
 * @param {Array<object>} [req.body.associatedSymptoms] - Optional. An array of symptom objects to be logged with the meal. Each object should contain symptom details.
 * @param {object} res - Express response object.
 * @returns {object} 201 - JSON object containing the newly created meal data (including its `_id`) and any associated symptoms that were saved. 
 *                        Example: `{ "_id": "mealId123", "mealName": "...", ..., "associatedSymptoms": [{...}] }`
 * @returns {object} 400 - JSON object with an error message if required meal data fields are missing or if validation fails.
 *                        Example: `{ "message": "Missing required meal data fields." }` or `{ "message": "Validation error: ..." }`
 * @returns {object} 401 - JSON object with an error message if the user is not authenticated (i.e., `req.user.uid` is missing).
 *                        Example: `{ "message": "Unauthorized: User must be logged in." }`
 * @returns {object} 500 - JSON object with an error message if there's a server-side error during meal creation or symptom saving.
 *                        Example: `{ "message": "Failed to save meal properly - ID missing after create operation." }` or `{ "message": "Server error while logging meal." }`
 */

// --- POST /api/meals/log setup in index.js - Log a new meal ---
// *** REQUIRES AUTHENTICATION ***
// router.post("/log", verifyUserToken, async (req, res) => { // Example with middleware
router.post("/log", async (req, res) => {
  // Assuming middleware adds user info to req. If not, adapt authorization.
  const firebaseUID = req.user?.uid; // Example: Get UID from authenticated user
  if (!firebaseUID) {
    return res
      .status(401)
      .json({ message: "Unauthorized: User must be logged in." });
  }

  // Separate meal data and symptom data from the request body
  const { associatedSymptoms, ...mealDataFromRequest } = req.body;

  // Basic validation for meal data
  if (
    !mealDataFromRequest.diet_code ||
    !mealDataFromRequest.mealName ||
    !mealDataFromRequest.ingredients ||
    !mealDataFromRequest.complianceSnapshot ||
    !mealDataFromRequest.mealDateTime
  ) {
    return res
      .status(400)
      .json({ message: "Missing required meal data fields." });
  }
  console.log(
    "[meals.js /log] Received meal log request:",
    mealDataFromRequest
  );

  // --- Prepare the full meal document data ---
  const mealDocToCreate = {
    ...mealDataFromRequest,
    firebaseUID: firebaseUID, // Ensure UID is included
  };

  try {
    // Create and save the new meal document
    //const newMeal = new UserMeal({ ...mealData, firebaseUID: firebaseUID }); // Ensure UID is set correctly
    //const savedMeal = await newMeal.save();
    //let savedMeal = null;

    console.log(
      `[meals.js /log] Attempting to save meal document for user ${firebaseUID}...`
    );
    // Save the meal document
    //savedMeal = await newMeal.save(); // Let Mongoose save it

    // --- Use UserMeal.create() ---
    const savedMeal = await UserMeal.create(mealDocToCreate);
    // --- END Use UserMeal.create() ---

    // --- *** IMMEDIATE POST-SAVE LOGGING *** ---
    console.log("[meals.js /log] Meal save() method completed.");
    console.log(
      "[meals.js /log] ID on savedMeal instance after save:",
      savedMeal?._id?.toString() || "null/undefined"
    );
    console.log(
      "[meals.js /log] ID on savedMeal object after save:",
      savedMeal?._id?.toString() || "null/undefined"
    );
    // Log the full objects ONLY if needed for deep debug, can be verbose:
    // console.log("[meals.js /log] newMeal instance state:", JSON.stringify(newMeal));
    // console.log("[meals.js /log] savedMeal object state:", JSON.stringify(savedMeal));
    // --- *** END IMMEDIATE LOGGING *** ---

    // --- Check ID on the returned 'savedMeal' object ---
    const mealIdToUse = savedMeal?._id;

    if (!mealIdToUse) {
      // If still no ID, something is very wrong with the create operation or Mongoose
      console.error(
        "[meals.js /log] CRITICAL: Failed to obtain Meal ID after UserMeal.create()!"
      );
      // Log the returned object for inspection
      console.error(
        "[meals.js /log] savedMeal object state (in error):",
        JSON.stringify(savedMeal)
      );
      return res.status(500).json({
        message:
          "Failed to save meal properly - ID missing after create operation.",
      });
    }

    console.log(
      "[meals.js /log] Meal created successfully, ID obtained:",
      mealIdToUse.toString()
    );

    // --- MODIFICATION START ---
    // Await symptom saving *within* the try block
    try {
      await saveAssociatedSymptoms(
        associatedSymptoms,
        mealIdToUse,
        firebaseUID
      );
      console.log(
        `[meals.js /log] Symptom saving completed (or skipped) for meal ${mealIdToUse}.`
      );

      // Now, fetch the symptoms that were just saved (or [] if none were provided)
      const newlySavedSymptoms = await UserSymptoms.find({
        associatedMealId: mealIdToUse,
        firebaseUID: firebaseUID,
      });

      // Construct the response object including the symptoms
      const responseData = {
        ...savedMeal.toObject(), // Convert Mongoose doc to plain object
        associatedSymptoms: newlySavedSymptoms, // Add the fetched symptoms
      };

      // --- Return the created meal data WITH symptoms ---
      res.status(201).json(responseData); // Send the complete data
    } catch (symptomError) {
      // Handle symptom saving errors more gracefully if needed
      // For now, we'll log it and still return the meal data, but without symptoms guaranteed
      console.error(
        `[meals.js /log] Error during associated symptom saving for meal ${mealIdToUse}:`,
        symptomError
      );
      // Optionally: Decide if you should still return 201 or a different status/message
      // Returning the meal without guaranteed symptoms:
      const responseDataIncomplete = {
        ...savedMeal.toObject(),
        associatedSymptoms: [], // Indicate symptoms might be missing due to error
      };
      res.status(201).json(responseDataIncomplete); // Or maybe 207 Multi-Status?
      // Or rethrow/return 500 if symptom saving is critical:
      // throw symptomError; // This would trigger the outer catch block
    }
  } catch (error) {
    console.error(
      "[meals.js /log] Error during meal create or symptom processing:",
      error
    );
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res
        .status(400)
        .json({ message: "Validation failed", errors: messages });
    }
    res
      .status(500)
      .json({ message: "Failed to process meal log.", error: error.message });
  }
});

/**
 * @route GET /:firebaseUID
 * @description Retrieves all meals logged by a specific user, identified by their Firebase UID. 
 *              Results are sorted by mealDateTime in descending order (most recent first).
 * @access Protected - Requires user authentication. The authenticated user's UID (`req.user.uid`) should match `req.params.firebaseUID`.
 * @param {object} req - Express request object.
 * @param {string} req.params.firebaseUID - The Firebase UID of the user whose meals are to be retrieved.
 * @param {object} req.user - Expected to contain the authenticated user's information, specifically `req.user.uid` for authorization.
 * @param {object} res - Express response object.
 * @returns {object} 200 - JSON array of meal objects. Each meal object includes its details and any associated symptoms.
 *                        Example: `[{ "_id": "mealId1", ..., "associatedSymptoms": [{...}] }, { "_id": "mealId2", ..., "associatedSymptoms": [] }]`
 * @returns {object} 401 - JSON object with an error message if the user is not authenticated.
 *                        Example: `{ "message": "Unauthorized: User must be logged in." }`
 * @returns {object} 403 - JSON object with an error message if the authenticated user is trying to access another user's meals.
 *                        Example: `{ "message": "Forbidden: You can only access your own meals." }`
 * @returns {object} 500 - JSON object with an error message if there's a server-side error.
 *                        Example: `{ "message": "Server error while fetching meals." }`
 */
// --- GET /api/meals/:firebaseUID - Get all meals for a user ---
// *** REQUIRES AUTHENTICATION *** (User should only get their own meals)
// router.get("/:firebaseUID", verifyUserToken, async (req, res) => { // Example with middleware
router.get("/:firebaseUID", async (req, res) => {
  const requestedUID = req.params.firebaseUID;
  const authenticatedUID = req.user?.uid; // Example: Get UID from authenticated user

  if (!authenticatedUID) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  // Authorization Check: Ensure the requested UID matches the logged-in user
  if (requestedUID !== authenticatedUID) {
    return res
      .status(403)
      .json({ message: "Forbidden: Cannot access meals for another user." });
  }

  try {
    const { limit = 20, page = 1 } = req.query; // Basic pagination
    console.log(
      `[meals.js /:firebaseUID] Fetching meals for user: ${authenticatedUID}`
    );

    const options = {
      sort: { mealDateTime: -1 }, // Sort by most recent first
      limit: parseInt(limit, 10),
      skip: (parseInt(page, 10) - 1) * parseInt(limit, 10),
    };

    // Fetch meals for the authenticated user
    const userMeals = await UserMeal.find(
      { firebaseUID: authenticatedUID },
      null,
      options
    );
    const totalMeals = await UserMeal.countDocuments({
      firebaseUID: authenticatedUID,
    });

    // --- Enhancement: Fetch associated symptoms for each meal ---
    // This can be performance-intensive if there are many meals/symptoms.
    // Consider fetching symptoms only when viewing meal details if needed.
    const mealIds = userMeals.map((meal) => meal._id);
    const symptoms = await UserSymptoms.find({
      associatedMealId: { $in: mealIds },
      firebaseUID: authenticatedUID, // Ensure symptoms also belong to the user
    });

    // Group symptoms by mealId for easier frontend lookup
    const symptomsByMealId = symptoms.reduce((acc, symptom) => {
      const mealId = symptom.associatedMealId.toString();
      if (!acc[mealId]) {
        acc[mealId] = [];
      }
      acc[mealId].push(symptom);
      return acc;
    }, {});

    // Attach symptoms to each meal object
    const mealsWithSymptoms = userMeals.map((meal) => ({
      ...meal.toObject(), // Convert Mongoose doc to plain object
      associatedSymptoms: symptomsByMealId[meal._id.toString()] || [], // Add symptoms array
    }));
    // --- End Symptom Enhancement ---

    res.status(200).json({
      // meals: userMeals, // Original response
      meals: mealsWithSymptoms, // Response with symptoms included
      totalPages: Math.ceil(totalMeals / options.limit),
      currentPage: parseInt(page, 10),
      totalMeals: totalMeals,
    });
  } catch (error) {
    console.error("[meals.js /:firebaseUID] Error fetching meals:", error);
    res
      .status(500)
      .json({ message: "Failed to fetch meals.", error: error.message });
  }
});

/**
 * @route GET /recent/:firebaseUID
 * @description Retrieves meals from the last 7 days, sorted by most recent logged by a specific user. 
 *              This is typically used for a quick overview or dashboard display.
 * @access Protected - Requires user authentication. Authenticated user's UID must match `req.params.firebaseUID`.
 * @param {object} req - Express request object.
 * @param {string} req.params.firebaseUID - The Firebase UID of the user.
 * @param {object} req.user - Expected to contain `req.user.uid` for authorization.
 * @param {object} res - Express response object.
 * @returns {object} 200 - JSON array containing up to 3 most recent meal objects, including associated symptoms.
 *                        Example: `[{ "_id": "mealIdRecent1", ...}, {"_id": "mealIdRecent2", ...}]`
 * @returns {object} 401 - JSON object with an error message if the user is not authenticated.
 *                        Example: `{ "message": "Unauthorized: User must be logged in." }`
 * @returns {object} 403 - JSON object with an error message if the user tries to access another user's data.
 *                        Example: `{ "message": "Forbidden: You can only access your own meals." }`
 * @returns {object} 500 - JSON object with an error message if there's a server-side error.
 *                        Example: `{ "message": "Error fetching recent meals." }`
 */
router.get("/recent/:firebaseUID", async (req, res) => {
  const requestedUID = req.params.firebaseUID;
  const authenticatedUID = req.user?.uid;

  if (!authenticatedUID)
    return res.status(401).json({ message: "Unauthorized" });
  if (requestedUID !== authenticatedUID)
    return res.status(403).json({ message: "Forbidden" });

  try {
    const sevenDaysAgo = dayjs.utc().subtract(7, "day").startOf("day").toDate();
    console.log(
      `[meals.js /recent] Fetching recent meals for UID: ${authenticatedUID} since ${sevenDaysAgo.toISOString()}`
    );

    const recentMeals = await UserMeal.find({
      firebaseUID: authenticatedUID,
      mealDateTime: { $gte: sevenDaysAgo },
    }).sort({ mealDateTime: -1 });

    // --- Enhancement: Fetch associated symptoms (similar to above) ---
    // This can be performance-intensive if there are many meals/symptoms.
    // Consider fetching symptoms only when viewing meal details if needed.
    const mealIds = recentMeals.map((meal) => meal._id);
    const symptoms = await UserSymptoms.find({
      associatedMealId: { $in: mealIds },
      firebaseUID: authenticatedUID,
    });
    const symptomsByMealId = symptoms.reduce((acc, symptom) => {
      const mealId = symptom.associatedMealId.toString();
      if (!acc[mealId]) acc[mealId] = [];
      acc[mealId].push(symptom);
      return acc;
    }, {});
    const mealsWithSymptoms = recentMeals.map((meal) => ({
      ...meal.toObject(),
      associatedSymptoms: symptomsByMealId[meal._id.toString()] || [],
    }));
    // --- End Symptom Enhancement ---

    console.log(
      `[meals.js /recent] Found ${mealsWithSymptoms.length} recent meals.`
    );
    res.status(200).json(mealsWithSymptoms); // Return array directly
  } catch (error) {
    console.error("[meals.js /recent] Error fetching recent meals:", error);
    res
      .status(500)
      .json({ message: "Failed to fetch recent meals", error: error.message });
  }
});

/**
 * @route GET /detail/:mealId
 * @description Retrieves a specific meal by its ID, including any associated symptoms.
 * @access Protected - Requires user authentication. The authenticated user must be the owner of the meal.
 * @param {object} req - Express request object.
 * @param {string} req.params.mealId - The ID of the meal to retrieve.
 * @param {object} req.user - Expected to contain `req.user.uid` for authorization.
 * @param {object} res - Express response object.
 * @returns {object} 200 - JSON object containing the meal data and its associated symptoms.
 *                        Example: `{ "_id": "mealId123", ..., "associatedSymptoms": [{...}] }`
 * @returns {object} 401 - JSON object with an error message if the user is not authenticated.
 *                        Example: `{ "message": "Unauthorized: User must be logged in." }`
 * @returns {object} 403 - JSON object with an error message if the user tries to access a meal they do not own.
 *                        Example: `{ "message": "Forbidden: You do not own this meal log." }`
 * @returns {object} 404 - JSON object with an error message if the meal is not found.
 *                        Example: `{ "message": "Meal not found." }`
 * @returns {object} 500 - JSON object with an error message if there's a server-side error.
 *                        Example: `{ "message": "Failed to fetch meal detail.", error: error.message }`
 */
// --- GET /api/meals/detail/:mealId - Get a specific meal by its ID ---
// *** REQUIRES AUTHENTICATION ***
// router.get("/detail/:mealId", verifyUserToken, async (req, res) => { // Example
router.get("/detail/:mealId", async (req, res) => {
  const { mealId } = req.params;
  const authenticatedUID = req.user?.uid;

  if (!authenticatedUID)
    return res.status(401).json({ message: "Unauthorized" });
  if (!mongoose.Types.ObjectId.isValid(mealId)) {
    return res.status(400).json({ message: "Invalid meal ID format" });
  }

  try {
    const meal = await UserMeal.findById(mealId);

    if (!meal) {
      return res.status(404).json({ message: "Meal not found" });
    }

    // Authorization: Check ownership
    if (meal.firebaseUID !== authenticatedUID) {
      return res
        .status(403)
        .json({ message: "Forbidden: You do not own this meal log." });
    }

    // --- Fetch associated symptoms ---
    const associatedSymptoms = await UserSymptoms.find({
      associatedMealId: meal._id, // Use the found meal's ID
      firebaseUID: authenticatedUID, // Double-check ownership
    }).sort({ occurredAt: 1 }); // Sort symptoms chronologically maybe?
    // --- End Fetch ---

    // Combine meal data with symptoms
    const responseData = {
      ...meal.toObject(),
      associatedSymptoms: associatedSymptoms,
    };

    res.status(200).json(responseData);
  } catch (error) {
    console.error(
      "[meals.js /detail/:mealId] Error fetching meal detail:",
      error
    );
    res
      .status(500)
      .json({ message: "Failed to fetch meal detail.", error: error.message });
  }
});

/**
 * @route PATCH /:mealId
 * @description Updates an existing meal log and its associated symptoms. 
 *              The meal to be updated is identified by `mealId` in the URL path. 
 *              Only the owner of the meal can update it.
 * @access Protected - Requires user authentication. Authenticated user must be the owner of the meal.
 * @param {object} req - Express request object.
 * @param {string} req.params.mealId - The ID of the meal to update.
 * @param {object} req.user - Expected to contain `req.user.uid` for authorization.
 * @param {object} req.body - The request body containing fields to update. Can include `mealName`, `ingredients`, etc., and `associatedSymptoms`.
 * @param {Array<object>} [req.body.associatedSymptoms] - Optional. An array of new symptom objects. 
 *                             If provided, existing symptoms for this meal will be DELETED and REPLACED by these new ones. 
 *                             If an empty array `[]` is sent, all existing symptoms for this meal will be deleted. 
 *                             If this field is omitted, existing symptoms will NOT be modified.
 * @param {object} res - Express response object.
 * @returns {object} 200 - JSON object of the updated meal, including its (potentially updated) associated symptoms.
 *                        Example: `{ "_id": "mealId123", "mealName": "Updated Name", ..., "associatedSymptoms": [...] }`
 * @returns {object} 400 - JSON object with an error message if `mealId` is not a valid MongoDB ObjectId.
 *                        Example: `{ "message": "Invalid meal ID format." }`
 * @returns {object} 401 - JSON object with an error message if the user is not authenticated.
 *                        Example: `{ "message": "Unauthorized: User must be logged in." }`
 * @returns {object} 403 - JSON object with an error message if the user tries to update a meal they do not own.
 *                        Example: `{ "message": "Forbidden: You can only update your own meals." }`
 * @returns {object} 404 - JSON object with an error message if the meal to update is not found.
 *                        Example: `{ "message": "Meal not found." }`
 * @returns {object} 500 - JSON object with an error message if there's a server-side error.
 *                        Example: `{ "message": "Server error while updating meal." }`
 */
router.patch("/:mealId", async (req, res) => {
  const { mealId } = req.params;
  const authenticatedUID = req.user?.uid;
  const { associatedSymptoms, ...mealUpdateData } = req.body; // Separate symptoms

  if (!authenticatedUID)
    return res.status(401).json({ message: "Unauthorized" });
  if (!mongoose.Types.ObjectId.isValid(mealId)) {
    return res.status(400).json({ message: "Invalid meal ID format" });
  }

  try {
    // 1. Find the existing meal to check ownership *before* updating
    const existingMeal = await UserMeal.findById(mealId);
    if (!existingMeal) {
      return res.status(404).json({ message: "Meal not found" });
    }
    if (existingMeal.firebaseUID !== authenticatedUID) {
      return res
        .status(403)
        .json({ message: "Forbidden: You do not own this meal log." });
    }

    // 2. Update the meal document
    // Ensure critical fields like firebaseUID are not overwritten
    delete mealUpdateData.firebaseUID;
    delete mealUpdateData._id;

    const updatedMeal = await UserMeal.findByIdAndUpdate(
      mealId,
      { $set: mealUpdateData }, // Use $set to update only provided fields
      { new: true, runValidators: true } // Return updated doc, run schema validation
    );

    if (!updatedMeal) {
      // Should technically be caught by initial find, but good practice
      return res
        .status(404)
        .json({ message: "Meal not found after update attempt." });
    }
    console.log(
      `[meals.js PATCH /:mealId] Meal ${mealId} updated successfully.`
    );

    // 3. Replace associated symptoms
    //    a. Delete existing symptoms for this meal
    console.log(
      `[meals.js PATCH /:mealId] Deleting existing symptoms for meal ${mealId}.`
    );
    await UserSymptoms.deleteMany({
      associatedMealId: mealId,
      firebaseUID: authenticatedUID,
    });

    //    b. Save new symptoms (if provided)
    await saveAssociatedSymptoms(associatedSymptoms, mealId, authenticatedUID);

    // 4. Fetch the final updated meal with potentially newly added symptoms
    const finalUpdatedMealWithSymptoms = await UserMeal.findById(mealId);
    const finalAssociatedSymptoms = await UserSymptoms.find({
      associatedMealId: mealId,
      firebaseUID: authenticatedUID,
    });

    const responseData = {
      ...finalUpdatedMealWithSymptoms.toObject(),
      associatedSymptoms: finalAssociatedSymptoms,
    };

    res.status(200).json(responseData); // Return the fully updated meal with new symptoms
  } catch (error) {
    console.error(
      `[meals.js PATCH /:mealId] Error updating meal ${mealId}:`,
      error
    );
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res
        .status(400)
        .json({ message: "Validation failed", errors: messages });
    }
    res
      .status(500)
      .json({ message: "Failed to update meal.", error: error.message });
  }
});

/**
 * @route DELETE /:mealId
 * @description Deletes a specific meal log and all its associated symptoms. 
 *              The meal is identified by `mealId`. Only the owner of the meal can delete it.
 * @access Protected - Requires user authentication. Authenticated user must be the owner of the meal.
 * @param {object} req - Express request object.
 * @param {string} req.params.mealId - The ID of the meal to delete.
 * @param {object} req.user - Expected to contain `req.user.uid` for authorization.
 * @param {object} res - Express response object.
 * @returns {object} 200 - JSON object with a success message.
 *                        Example: `{ "message": "Meal and associated symptoms deleted successfully." }`
 * @returns {object} 400 - JSON object with an error message if `mealId` is not a valid MongoDB ObjectId.
 *                        Example: `{ "message": "Invalid meal ID format." }`
 * @returns {object} 401 - JSON object with an error message if the user is not authenticated.
 *                        Example: `{ "message": "Unauthorized: User must be logged in." }`
 * @returns {object} 403 - JSON object with an error message if the user tries to delete a meal they do not own.
 *                        Example: `{ "message": "Forbidden: You can only delete your own meals." }`
 * @returns {object} 404 - JSON object with an error message if the meal to delete is not found.
 *                        Example: `{ "message": "Meal not found or not authorized to delete." }` (The message might vary based on implementation details if combined with authorization check before finding).
 * @returns {object} 500 - JSON object with an error message if there's a server-side error.
 *                        Example: `{ "message": "Server error while deleting meal." }`
 */
router.delete("/:mealId", async (req, res) => {
  const { mealId } = req.params;
  const authenticatedUID = req.user?.uid;

  if (!authenticatedUID)
    return res.status(401).json({ message: "Unauthorized" });
  if (!mongoose.Types.ObjectId.isValid(mealId)) {
    return res.status(400).json({ message: "Invalid meal ID format" });
  }

  try {
    // 1. Find the meal to check ownership *before* deleting
    const mealToDelete = await UserMeal.findById(mealId);
    if (!mealToDelete) {
      // Still return success-like if not found, as the end state is "not present"
      // Alternatively, return 404 if you want to be strict.
      console.log(
        `[meals.js DELETE /:mealId] Meal ${mealId} not found, nothing to delete.`
      );
      return res.status(204).send(); // 204 No Content is suitable
      // return res.status(404).json({ message: "Meal not found" });
    }
    if (mealToDelete.firebaseUID !== authenticatedUID) {
      return res
        .status(403)
        .json({ message: "Forbidden: You do not own this meal log." });
    }

    // 2. Delete the meal document
    await UserMeal.findByIdAndDelete(mealId);
    console.log(
      `[meals.js DELETE /:mealId] Meal ${mealId} deleted successfully.`
    );

    // 3. Delete associated symptoms
    const deleteResult = await UserSymptoms.deleteMany({
      associatedMealId: mealId,
      firebaseUID: authenticatedUID,
    });
    console.log(
      `[meals.js DELETE /:mealId] Deleted ${deleteResult.deletedCount} associated symptoms for meal ${mealId}.`
    );

    res
      .status(200)
      .json({ message: "Meal and associated symptoms deleted successfully." }); // Or 204 No Content
  } catch (error) {
    console.error(
      `[meals.js DELETE /:mealId] Error deleting meal ${mealId}:`,
      error
    );
    res
      .status(500)
      .json({ message: "Failed to delete meal.", error: error.message });
  }
});

export default router;
