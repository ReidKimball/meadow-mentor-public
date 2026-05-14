import express from "express";
import SymptomsMaster from "../models/symptomsMaster.model.js";
import UserSymptoms from "../models/userSymptoms.model.js";
// Potentially import authentication middleware
// import { verifyUserToken } from '../middleware/authMiddleware.js'; // Example

const router = express.Router();

// --- GET /api/symptoms/master - Fetch active master symptoms list ---
// Optional: Add authentication if needed, though often master lists are public
router.get("/master", async (req, res) => {
  try {
    console.log("[symptoms.js /master] Fetching active master symptoms list");
    const activeSymptoms = await SymptomsMaster.find(
      { isActive: true }, // Only fetch active symptoms
      // Select fields useful for the frontend dropdown/display
      {
        _id: 1,
        symptomCode: 1,
        displayName: 1,
        description: 1,
        requiresLocation: 1,
      }
    ).sort({ displayName: 1 }); // Sort alphabetically by display name

    console.log(
      `[symptoms.js /master] Found ${activeSymptoms.length} active symptoms.`
    );
    res.status(200).json(activeSymptoms);
  } catch (error) {
    console.error(
      "[symptoms.js /master] Error fetching master symptoms:",
      error
    );
    res.status(500).json({
      message: "Failed to fetch master symptoms list.",
      error: error.message,
    });
  }
});

// --- POST /api/symptoms/log-event - Log a standalone symptom occurrence ---
// *** REQUIRES AUTHENTICATION ***
// router.post("/log-event", verifyUserToken, async (req, res) => { // Example with middleware
router.post("/log-event", async (req, res) => {
  // Assuming middleware adds user info to req. If not, adapt authorization.
  const firebaseUID = req.user?.uid; // Example: Get UID from authenticated user
  if (!firebaseUID) {
    return res
      .status(401)
      .json({ message: "Unauthorized: User must be logged in." });
  }

  try {
    const symptomData = req.body;
    console.log(
      "[symptoms.js /log-event] Received symptom log event request:",
      symptomData
    );

    // Basic Validation (Mongoose schema validation will also run)
    if (
      !symptomData.severity ||
      !symptomData.occurredAt ||
      (!symptomData.symptomMasterId && !symptomData.customSymptomName) // Need either a master ID or custom name
    ) {
      return res
        .status(400)
        .json({
          message:
            "Missing required symptom data fields (severity, occurredAt, symptomMasterId/customSymptomName).",
        });
    }

    // Validate 'Other' specific fields
    if (symptomData.symptomName === "Other" && !symptomData.customSymptomName) {
      return res
        .status(400)
        .json({
          message: "Custom symptom name is required when 'Other' is selected.",
        });
    }
    if (symptomData.location === "other" && !symptomData.customLocation) {
      return res
        .status(400)
        .json({
          message: "Custom location is required when 'other' is selected.",
        });
    }

    const newSymptomEvent = new UserSymptoms({
      ...symptomData,
      firebaseUID: firebaseUID, // Set UID from authenticated user
      source: "event", // Explicitly set source
      associatedMealId: null, // No associated meal for standalone events
    });

    const savedSymptom = await newSymptomEvent.save();

    console.log(
      "[symptoms.js /log-event] Symptom event saved successfully:",
      savedSymptom._id
    );
    res.status(201).json(savedSymptom); // 201 Created
  } catch (error) {
    console.error(
      "[symptoms.js /log-event] Error saving symptom event:",
      error
    );
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res
        .status(400)
        .json({ message: "Validation failed", errors: messages });
    }
    res.status(500).json({
      message: "Failed to save symptom event.",
      error: error.message,
    });
  }
});

// --- Add other symptom-specific routes here (e.g., GET symptoms by date range, DELETE symptom event) ---
// Example: GET symptoms for a user within a date range (excluding meal-associated ones)
// router.get("/events/:firebaseUID", verifyUserToken, async(req, res) => { ... });
// Example: DELETE a specific symptom event log
// router.delete("/event/:symptomId", verifyUserToken, async(req, res) => { ... });

export default router;
