/**
 * @file stripe.service.js
 * @description Stripe service helpers used by the user registration
 * orchestrator. Provides focused customer operations that can participate in
 * distributed transactions with rollback semantics.
 */

import Stripe from "stripe";

let stripeClient = null;
let stripeClientApiKey = null;

/**
 * Lazily initialize and return the shared Stripe client.
 * This avoids crashing the app at startup if STRIPE_LIVE is missing,
 * but will still fail fast when a Stripe operation is actually invoked.
 *
 * @returns {Stripe} Stripe client instance.
 */
const getStripeClient = () => {
  const stripeMode = (process.env.STRIPE_MODE || "test").toLowerCase();
  const apiKey =
    stripeMode === "live"
      ? process.env.STRIPE_SECRET_KEY_LIVE || process.env.STRIPE_LIVE
      : process.env.STRIPE_SECRET_KEY_TEST || process.env.STRIPE_SANDBOX_SECRET_KEY || process.env.STRIPE_LIVE;

  if (!stripeClient || stripeClientApiKey !== apiKey) {

    if (!apiKey) {
      console.error(
        "❌ (stripe.service) STRIPE_LIVE is not set. Stripe operations cannot be performed."
      );
      throw new Error(
        "Stripe configuration error: STRIPE_LIVE is missing. Set this environment variable in the backend."
      );
    }

    stripeClient = new Stripe(apiKey, { apiVersion: '2025-12-15.clover' });
    stripeClientApiKey = apiKey;
    console.log("✅ (stripe.service) Stripe client initialized.");
  }

  return stripeClient;
};

/**
 * Look up a Stripe customer by email or firebaseUID.
 * First searches by email, then by firebaseUID in metadata if not found.
 * This handles cases where Firebase/Stripe extension creates customers without email.
 *
 * @param {string} email - Customer email address.
 * @param {string} [firebaseUID] - Optional Firebase UID to search by metadata.
 * @returns {Promise<object|null>} The Stripe customer object or null if not found.
 */
export const getStripeCustomer = async (email, firebaseUID = null) => {
  try {
    const stripe = getStripeClient();
    
    // First, try to find by email
    const customersByEmail = await stripe.customers.list({
      email,
      limit: 1,
    });

    if (customersByEmail.data.length > 0) {
      const customer = customersByEmail.data[0];
      console.log(
        `✅ (stripe.service) Found existing Stripe customer ${customer.id} for ${email}`
      );
      return customer;
    }

    // If not found by email and firebaseUID provided, search by metadata
    if (firebaseUID) {
      console.log(
        `ℹ️ (stripe.service) No customer found by email, searching by firebaseUID: ${firebaseUID}`
      );
      
      // Search all customers and filter by metadata (Stripe doesn't support metadata search in list)
      const allCustomers = await stripe.customers.search({
        query: `metadata['firebaseUID']:'${firebaseUID}'`,
        limit: 1,
      });

      if (allCustomers.data.length > 0) {
        const customer = allCustomers.data[0];
        console.log(
          `✅ (stripe.service) Found existing Stripe customer ${customer.id} by firebaseUID ${firebaseUID}`
        );
        
        // Update the customer with the email if it's missing
        if (!customer.email) {
          console.log(
            `📝 (stripe.service) Updating Stripe customer ${customer.id} with email ${email}`
          );
          const updatedCustomer = await stripe.customers.update(customer.id, {
            email,
          });
          return updatedCustomer;
        }
        
        return customer;
      }
    }

    console.log(`ℹ️ (stripe.service) No Stripe customer found for ${email}${firebaseUID ? ` or firebaseUID ${firebaseUID}` : ''}`);
    return null;
  } catch (error) {
    console.error(
      `❌ (stripe.service) Error fetching Stripe customer for ${email}:`,
      error
    );
    throw error;
  }
};

/**
 * Create a new Stripe customer for a user.
 *
 * @param {{firebaseUID: string, firstName: string, lastName?: string, email: string}} userData
 * @returns {Promise<object>} The created Stripe customer object.
 */
export const createStripeCustomer = async (userData) => {
  try {
    const stripe = getStripeClient();
    const customer = await stripe.customers.create({
      email: userData.email,
      name: `${userData.firstName} ${userData.lastName || ""}`.trim(),
      metadata: {
        firebaseUID: userData.firebaseUID,
        source: "meadow-mentor-backend",
      },
    });

    console.log(
      `✅ (stripe.service) Created Stripe customer ${customer.id} for ${userData.email}`
    );
    return customer;
  } catch (error) {
    console.error("❌ (stripe.service) Failed to create Stripe customer:", error);
    throw error;
  }
};

/**
 * Archive a Stripe customer as part of rollback. Stripe does not truly delete
 * customers with history, so we mark them as archived via metadata.
 *
 * @param {string} customerId - Stripe customer ID.
 * @returns {Promise<void>}
 */
export const archiveStripeCustomer = async (customerId) => {
  try {
    const stripe = getStripeClient();
    await stripe.customers.update(customerId, {
      metadata: {
        archived: "true",
        archivedAt: new Date().toISOString(),
        reason: "registration_rollback",
      },
    });

    console.log(
      `✅ (stripe.service) Archived Stripe customer ${customerId} via metadata`
    );
  } catch (error) {
    console.error(
      `❌ (stripe.service) Failed to archive Stripe customer ${customerId}:`,
      error
    );
    throw error;
  }
};

/**
 * Verify whether a Stripe customer exists.
 *
 * @param {string} customerId - Stripe customer ID.
 * @returns {Promise<boolean>} True if the customer exists, false if missing.
 */
export const verifyStripeCustomer = async (customerId) => {
  try {
    const stripe = getStripeClient();
    await stripe.customers.retrieve(customerId);
    return true;
  } catch (error) {
    if (error.code === "resource_missing") {
      return false;
    }
    throw error;
  }
};

/**
 * Delete all Stripe customers associated with an email address.
 *
 * This is primarily used for cleanup when a malicious signup attempt is
 * detected so that no unwanted Stripe customers remain.
 *
 * @param {string} email - Customer email address.
 * @returns {Promise<void>}
 */
export const deleteStripeCustomersByEmail = async (email) => {
  try {
    const stripe = getStripeClient();
    const customers = await stripe.customers.list({
      email,
      limit: 10,
    });

    if (customers.data.length === 0) {
      console.log(
        `ℹ️ (stripe.service) No Stripe customers found to delete for ${email}`
      );
      return;
    }

    for (const customer of customers.data) {
      try {
        await stripe.customers.del(customer.id);
        console.log(
          `✅ (stripe.service) Deleted Stripe customer ${customer.id} for ${email}`
        );
      } catch (deleteError) {
        console.error(
          `❌ (stripe.service) Failed to delete Stripe customer ${customer.id} for ${email}:`,
          deleteError
        );
      }
    }
  } catch (error) {
    console.error(
      `❌ (stripe.service) Error deleting Stripe customers for ${email}:`,
      error
    );
    throw error;
  }
};
