// backend/middleware/verifyAdmin.js
import User from "../models/user.model.js"; // Adjust path as needed

export const verifyAdmin = async (req, res, next) => {
  // verifyFirebaseToken middleware should have run first and populated req.user
  if (!req.user || !req.user.uid) { // Check for req.user and req.user.uid
    console.warn("verifyAdmin: Firebase UID not found in req.user. Ensure verifyFirebaseToken runs first.");
    return res
      .status(401)
      .json({ error: "Unauthorized - Authentication token not processed or UID missing" });
  }

  const firebaseUID = req.user.uid; // Use the UID from the decoded token

  try {
    const user = await User.findOne({ firebaseUID: firebaseUID }); // Query using the correct UID

    if (user && user.isAdmin) {
      // Optionally, you can enrich req.user with more app-specific user details from MongoDB
      // For example: req.appUser = user;
      next(); // User is admin, proceed
    } else {
      console.warn(
        `verifyAdmin: User ${firebaseUID} is not an admin or not found in the database.`
      );
      res.status(403).json({ error: "Forbidden - Admin access required" });
    }
  } catch (error) {
    console.error("Error verifying admin status for UID:", firebaseUID, error);
    res.status(500).json({ error: "Internal server error during admin check" });
  }
};
