/**
 * @file userRegistration.orchestrator.js
 * @description Coordinates distributed user registration across MongoDB,
 * Stripe, and Firebase with rollback support. This orchestrator is invoked by
 * the POST /api/users endpoint after Phase 1 validation has passed.
 */

import { RollbackStack } from "../utils/rollback.utils.js";
import { createUserWithHealth } from "./userHealth.service.js";
import {
  deleteFirebaseUser,
  updateFirebaseDisplayName,
  upsertFirestoreCustomerMapping,
} from "./firebase.service.js";
import {
  getStripeCustomer,
  createStripeCustomer,
  archiveStripeCustomer,
} from "./stripe.service.js";
import User from "../models/user.model.js";
import UserHealth from "../models/userHealth.model.js";

/**
 * Orchestrate user registration across MongoDB, Stripe, and Firebase.
 *
 * Assumes input has already passed Phase 1 validation and normalization.
 *
 * @param {Object} userData - User profile data (firebaseUID, firstName, lastName, email).
 * @param {Object} healthData - User health data.
 * @returns {Promise<Object>} Merged user + health data with Stripe metadata.
 */
export const registerUser = async (userData, healthData) => {
  const rollbackStack = new RollbackStack();

  console.log(
    `🚀 (userRegistration.orchestrator) Starting registration for ${userData.email}`
  );

  let user;
  let health;
  let stripeCustomer;

  try {
    // ============================================================
    // STEP 1: Create MongoDB User + UserHealth (atomic within MongoDB)
    // ============================================================
    console.log(
      "📝 (userRegistration.orchestrator) Step 1: Creating MongoDB documents"
    );

    const mongoResult = await createUserWithHealth(userData, healthData);
    user = mongoResult.user;
    health = mongoResult.health;

    rollbackStack.push("Delete MongoDB User + UserHealth", async () => {
      await User.deleteOne({ _id: user._id });
      await UserHealth.deleteOne({ userId: user._id });
    });

    console.log(
      `✅ (userRegistration.orchestrator) MongoDB documents created: ${user._id}`
    );

    // ============================================================
    // STEP 2: Ensure Stripe customer exists
    // ============================================================
    console.log(
      "💳 (userRegistration.orchestrator) Step 2: Verifying Stripe customer"
    );

    stripeCustomer = await getStripeCustomer(userData.email, userData.firebaseUID);

    if (!stripeCustomer) {
      console.log(
        "💳 (userRegistration.orchestrator) Creating new Stripe customer"
      );
      stripeCustomer = await createStripeCustomer({
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        firebaseUID: userData.firebaseUID,
      });

      rollbackStack.push("Archive Stripe Customer", async () => {
        await archiveStripeCustomer(stripeCustomer.id);
      });
    } else {
      console.log(
        `ℹ️ (userRegistration.orchestrator) Using existing Stripe customer: ${stripeCustomer.id}`
      );
    }

    if (!user.paymentStatus) {
      user.paymentStatus = {};
    }
    user.paymentStatus.stripeId = stripeCustomer.id;
    await user.save();

    console.log(
      `✅ (userRegistration.orchestrator) Stripe customer linked: ${stripeCustomer.id}`
    );

    // Ensure Firestore customers/{firebaseUID} mapping exists for Stripe extension
    // This lets the firestore-stripe-payments extension reuse the existing
    // Stripe customer for checkout sessions and billing portal instead of
    // creating a new one on the fly.
    const stripeDashboardLink = `https://dashboard.stripe.com${
      stripeCustomer.livemode ? "" : "/test"
    }/customers/${stripeCustomer.id}`;

    await upsertFirestoreCustomerMapping(
      userData.firebaseUID,
      stripeCustomer.id,
      userData.email,
      stripeDashboardLink
    );

    // ============================================================
    // STEP 3: Update Firebase display name (sanitized first name)
    // ============================================================
    console.log(
      "🔥 (userRegistration.orchestrator) Step 3: Updating Firebase display name"
    );

    await updateFirebaseDisplayName(userData.firebaseUID, userData.firstName);

    console.log(
      "✅ (userRegistration.orchestrator) Firebase display name updated"
    );

    // SUCCESS: All steps completed
    console.log(
      `🎉 (userRegistration.orchestrator) Registration completed successfully for ${userData.email}`
    );

    return {
      ...user.toObject(),
      ...health.toObject(),
      stripeCustomerId: stripeCustomer.id,
    };
  } catch (error) {
    console.error(
      `❌ (userRegistration.orchestrator) Registration failed for ${userData.email}:`,
      error
    );
    console.log(
      `🔄 (userRegistration.orchestrator) Initiating rollback (${rollbackStack.size()} operations)`
    );

    const rollbackResults = await rollbackStack.executeAll();

    const successCount = rollbackResults.filter((r) => r.success).length;
    const failCount = rollbackResults.filter((r) => !r.success).length;

    console.log(
      `🔄 (userRegistration.orchestrator) Rollback completed: ${successCount} succeeded, ${failCount} failed`
    );

    if (failCount > 0) {
      console.error(
        "⚠️ (userRegistration.orchestrator) Some rollbacks failed. Manual cleanup may be required.",
        rollbackResults.filter((r) => !r.success)
      );
    }

    // Attempt to delete Firebase user (may have existed before this flow)
    try {
      console.log(
        `🔥 (userRegistration.orchestrator) Attempting to delete Firebase user: ${userData.firebaseUID}`
      );
      await deleteFirebaseUser(userData.firebaseUID);
    } catch (firebaseError) {
      console.error(
        "❌ (userRegistration.orchestrator) Failed to delete Firebase user during rollback:",
        firebaseError
      );
    }

    // Re-throw original error for the caller (route handler) to handle
    throw error;
  }
};

/**
 * Manual rollback helper for a user registration across systems.
 *
 * @param {string} firebaseUID - Firebase UID of the user to rollback.
 * @returns {Promise<void>}
 */
export const rollbackUserRegistration = async (firebaseUID) => {
  console.log(
    `🔄 (userRegistration.orchestrator) Manual rollback initiated for ${firebaseUID}`
  );

  try {
    const user = await User.findOne({ firebaseUID });

    if (user) {
      await UserHealth.deleteOne({ userId: user._id });
      console.log(
        `✅ (userRegistration.orchestrator) Deleted UserHealth for ${firebaseUID}`
      );

      if (user.paymentStatus?.stripeId) {
        await archiveStripeCustomer(user.paymentStatus.stripeId);
        console.log(
          `✅ (userRegistration.orchestrator) Archived Stripe customer: ${user.paymentStatus.stripeId}`
        );
      }

      await User.deleteOne({ _id: user._id });
      console.log(
        `✅ (userRegistration.orchestrator) Deleted User for ${firebaseUID}`
      );
    }

    await deleteFirebaseUser(firebaseUID);
    console.log(
      `✅ (userRegistration.orchestrator) Deleted Firebase user: ${firebaseUID}`
    );

    console.log(
      `🎉 (userRegistration.orchestrator) Manual rollback completed for ${firebaseUID}`
    );
  } catch (error) {
    console.error(
      `❌ (userRegistration.orchestrator) Manual rollback failed for ${firebaseUID}:`,
      error
    );
    throw error;
  }
};
