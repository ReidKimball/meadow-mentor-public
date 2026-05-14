/**
 * @file firebase.service.js
 * @description Firebase Admin service helpers used by the user registration
 * orchestrator. Provides small, focused wrappers around common operations so
 * they can be reused and composed with rollback logic in Phase 2.
 */

import admin from "firebase-admin";

/**
 * Update a Firebase user's display name.
 *
 * @param {string} uid - Firebase UID.
 * @param {string} displayName - New (already validated/normalized) display name.
 * @returns {Promise<void>}
 */
export const updateFirebaseDisplayName = async (uid, displayName) => {
  try {
    await admin.auth().updateUser(uid, { displayName });
    console.log(
      `✅ (firebase.service) Updated display name for Firebase user ${uid}`
    );
  } catch (error) {
    console.error(
      `❌ (firebase.service) Failed to update display name for ${uid}:`,
      error
    );
    throw error;
  }
};

/**
 * Delete Firestore customer data for a Firebase user.
 *
 * This removes the Stripe customer mapping document and any immediate
 * subcollection documents under `customers/{uid}` in the default Firestore
 * database. It is used for cleanup when malicious signups are detected or
 * when rolling back account creation.
 *
 * @param {string} uid - Firebase UID whose customer document should be removed.
 * @returns {Promise<void>}
 */
export const deleteFirestoreCustomerData = async (uid) => {
  try {
    const db = admin.firestore();
    const docRef = db.collection("customers").doc(uid);

    const docSnapshot = await docRef.get();
    if (!docSnapshot.exists) {
      console.log(
        `ℹ️ (firebase.service) No Firestore customer document found for ${uid}`
      );
      return;
    }

    const subcollections = await docRef.listCollections();
    for (const subcollection of subcollections) {
      const subSnapshot = await subcollection.get();
      if (subSnapshot.empty) {
        continue;
      }

      const batch = db.batch();
      subSnapshot.docs.forEach((subDoc) => {
        batch.delete(subDoc.ref);
      });
      await batch.commit();
    }

    await docRef.delete();
    console.log(
      `✅ (firebase.service) Deleted Firestore customer document for ${uid}`
    );
  } catch (error) {
    console.error(
      `❌ (firebase.service) Failed to delete Firestore customer data for ${uid}:`,
      error
    );
    throw error;
  }
};

/**
 * Ensure a Firestore customer mapping exists for a Firebase user.
 *
 * This creates or updates the document at `customers/{uid}` with the
 * provided Stripe customer metadata. The Stripe Firebase extension relies
 * on this mapping (via the `stripeId` field) when creating checkout
 * sessions and billing portal links. By upserting this mapping during
 * registration, we ensure the extension reuses the existing Stripe
 * customer instead of creating a duplicate one on the fly.
 *
 * @param {string} uid - Firebase UID of the user.
 * @param {string} stripeCustomerId - Existing Stripe customer ID.
 * @param {string} [email] - Optional email to store alongside the mapping.
 * @param {string} [stripeLink] - Optional Stripe dashboard link for convenience.
 * @returns {Promise<void>}
 */
export const upsertFirestoreCustomerMapping = async (
  uid,
  stripeCustomerId,
  email,
  stripeLink
) => {
  try {
    const db = admin.firestore();
    const docRef = db.collection("customers").doc(uid);

    const payload = {
      stripeId: stripeCustomerId,
    };

    if (email) {
      payload.email = email;
    }

    if (stripeLink) {
      payload.stripeLink = stripeLink;
    }

    await docRef.set(payload, { merge: true });
    console.log(
      `✅ (firebase.service) Upserted Firestore customer mapping for ${uid} -> ${stripeCustomerId}`
    );
  } catch (error) {
    console.error(
      `❌ (firebase.service) Failed to upsert Firestore customer mapping for ${uid}:`,
      error
    );
    throw error;
  }
};

/**
 * Delete a Firebase user as part of rollback or manual cleanup.
 *
 * Idempotent: if the user does not exist, this is treated as success.
 *
 * @param {string} uid - Firebase UID.
 * @returns {Promise<void>}
 */
export const deleteFirebaseUser = async (uid) => {
  try {
    await admin.auth().deleteUser(uid);
    console.log(`✅ (firebase.service) Deleted Firebase user: ${uid}`);
  } catch (error) {
    if (error.code === "auth/user-not-found") {
      console.log(
        `ℹ️ (firebase.service) Firebase user ${uid} already deleted or does not exist`
      );
      return;
    }

    console.error(
      `❌ (firebase.service) Failed to delete Firebase user ${uid}:`,
      error
    );
    throw error;
  }
};

/**
 * Check whether a Firebase user exists.
 *
 * @param {string} uid - Firebase UID.
 * @returns {Promise<boolean>} True if the user exists; false if not found.
 */
export const verifyFirebaseUser = async (uid) => {
  try {
    await admin.auth().getUser(uid);
    return true;
  } catch (error) {
    if (error.code === "auth/user-not-found") {
      return false;
    }
    throw error;
  }
};

/**
 * Fetch the full Firebase user record.
 *
 * @param {string} uid - Firebase UID.
 * @returns {Promise<import("firebase-admin/lib/auth" ).UserRecord>} The user record.
 */
export const getFirebaseUser = async (uid) => {
  try {
    const userRecord = await admin.auth().getUser(uid);
    return userRecord;
  } catch (error) {
    console.error(
      `❌ (firebase.service) Failed to get Firebase user ${uid}:`,
      error
    );
    throw error;
  }
};
