/**
 * @file mailerlite.service.js
 * @description This service module encapsulates all interactions with the MailerLite API.
 * It handles the creation and updating of subscribers for different groups, such as general app users and public newsletter signups.
 * It uses the official MailerLite Node.js SDK and relies on environment variables for secure API key and group ID management.
 * @requires module:@mailerlite/mailerlite-nodejs - The official MailerLite SDK for Node.js.
 * @author Cascade
 * @version 1.0.0
 * @date 2025-07-25
 */

// Third-Party Libraries
import MailerLite from "@mailerlite/mailerlite-nodejs"; // The official MailerLite SDK.

/**
 * @constant {MailerLite} mailerlite
 * @description An instance of the MailerLite SDK, configured with the API key from environment variables.
 * This instance is used for all subsequent API calls to MailerLite.
 * @access private
 */
let mailerlite = null;

let cachedFieldKeys = null;

export const getMailerLiteClient = () => {
  const apiKey = process.env.MAILERLITE_API_KEY;

  if (!apiKey) {
    throw new Error("MAILERLITE_API_KEY is required but was not found in process.env.");
  }

  if (!mailerlite) {
    mailerlite = new MailerLite({
      api_key: apiKey,
    });
  }

  return mailerlite;
};

/**
 * @async
 * @function updateSubscriberGotRecipeFromChefKay
 * @description Sets the MailerLite subscriber custom field "Got Recipe from Chef Kay" to "true" (TEXT).
 * This update does NOT set groups so it will not modify group membership.
 *
 * @param {string} email - The subscriber's email address.
 * @returns {Promise<object>} A promise that resolves with the response object from the MailerLite API.
 * @throws {Error} Throws an error if the API call to MailerLite fails.
 */
export const updateSubscriberGotRecipeFromChefKay = async (email) => {
  const { gotRecipeFromChefKayKey } = await getSubscriberFieldKeys();

  const params = {
    email,
    fields: {
      [gotRecipeFromChefKayKey]: "true",
    },
  };

  try {
    const response = await getMailerLiteClient().subscribers.createOrUpdate(params);
    return response;
  } catch (error) {
    console.error(
      "[mailerlite.service.js] Error updating subscriber got_recipe_from_chef_kay field:",
      error.response ? error.response.data : error.message
    );
    throw error;
  }
};

/**
 * @async
 * @function getSubscriberFieldKeys
 * @description Fetches and caches MailerLite field keys for subscriber updates.
 * MailerLite updates require the field "key" (not the display name).
 *
 * @returns {Promise<{dietKey: string, conditionKey: string, gotRecipeFromChefKayKey: string}>} Resolved field keys.
 * @throws {Error} Throws if the fields API request fails.
 */
const getSubscriberFieldKeys = async () => {
  if (cachedFieldKeys) return cachedFieldKeys;

  const response = await getMailerLiteClient().fields.get({ limit: 100, page: 1 });
  const fields = Array.isArray(response?.data?.data) ? response.data.data : [];

  const getKeyByName = (name) => {
    const match = fields.find(
      (field) =>
        typeof field?.name === "string" &&
        field.name.trim().toLowerCase() === name.trim().toLowerCase()
    );

    return typeof match?.key === "string" ? match.key : null;
  };

  cachedFieldKeys = {
    dietKey: getKeyByName("Diet") || "diet",
    conditionKey: getKeyByName("Condition") || "condition",
    gotRecipeFromChefKayKey:
      getKeyByName("Got Recipe from Chef Kay") || "got_recipe_from_chef_kay",
  };

  console.log("[mailerlite.service.js] Resolved MailerLite subscriber field keys:", cachedFieldKeys);

  return cachedFieldKeys;
};

/**
 * @async
 * @function subscribeUser
 * @description Subscribes a new user (typically from the main application signup) to a specific MailerLite group intended for registered application users.
 * It creates a new subscriber or updates an existing one with the provided email and first name.
 * @param {string} email - The user's email address.
 * @param {string} firstName - The user's first name.
 * @returns {Promise<object>} A promise that resolves with the response object from the MailerLite API upon successful subscription.
 * @throws {Error} Throws an error if the API call fails, which is then caught and re-thrown.
 */
export const subscribeUser = async (email, firstName) => {
  const params = {
    email,
    fields: {
      name: firstName,
    },
    groups: [process.env.MAILERLITE_APP_GROUP_ID],
  };

  try {
    const response = await getMailerLiteClient().subscribers.createOrUpdate(params);
    //console.log('User subscribed to MailerLite:', response);
    return response;
  } catch (error) {
    console.error("[mailerlite.service.js] Error subscribing user to MailerLite:", error.response ? error.response.data : error.message);
    throw error;
  }
};

/**
 * @async
 * @function updateSubscriberDietAndCondition
 * @description Updates a MailerLite subscriber's custom fields for Diet and Condition.
 * This uses MailerLite's `createOrUpdate` behavior keyed by email.
 *
 * IMPORTANT:
 * - MailerLite custom fields are keyed by their "tag" values (e.g. `$diet`, `$condition`).
 * - This update does NOT set groups so it will not modify group membership.
 *
 * @param {string} email - The subscriber's email address.
 * @param {string} diet - The primary diet text/code to store (ex: "SCD").
 * @param {string} condition - The condition text to store.
 * @returns {Promise<object>} A promise that resolves with the response object from the MailerLite API.
 * @throws {Error} Throws an error if the API call to MailerLite fails.
 */
export const updateSubscriberDietAndCondition = async (email, diet, condition) => {
  const { dietKey, conditionKey } = await getSubscriberFieldKeys();

  const params = {
    email,
    fields: {
      [dietKey]: diet,
      [conditionKey]: condition,
    },
  };

  try {
    const response = await getMailerLiteClient().subscribers.createOrUpdate(params);
    return response;
  } catch (error) {
    console.error(
      "[mailerlite.service.js] Error updating subscriber diet/condition fields:",
      error.response ? error.response.data : error.message
    );
    throw error;
  }
};

/**
 * @async
 * @function subscribeToPublicNewsletter
 * @description Subscribes a user to the public-facing newsletter group in MailerLite.
 * This is typically used for signups from the website's footer or landing page.
 * It creates a new subscriber or updates an existing one with just their email address.
 * @param {string} email - The user's email address to subscribe.
 * @returns {Promise<object>} A promise that resolves with the response object from the MailerLite API.
 * @throws {Error} Throws an error if the API call to MailerLite fails.
 */
export const subscribeToPublicNewsletter = async (email) => {
  const params = {
    email,
    groups: [process.env.MAILERLITE_EMAIL_GROUP_ID],
  };

  try {
    const response = await getMailerLiteClient().subscribers.createOrUpdate(params);
    return response;
  } catch (error) {
    console.error("[mailerlite.service.js] Error subscribing to public newsletter:", error.response ? error.response.data : error.message);
    throw error;
  }
};
