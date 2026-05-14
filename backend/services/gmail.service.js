/**
 * @file gmail.service.js
 * @description Service for interacting with Gmail API to fetch drafts and manage labels.
 * Used by the Meadow Growth Engine to import blog post drafts from Gmail.
 * @requires googleapis - Google APIs Node.js client
 * @author Antigravity
 * @version 1.0.0
 * @date 2026-01-22
 */

import { google } from "googleapis";

// Label names used for blog draft workflow
const READY_LABEL_NAME = "Ready for Meadow";
const PUBLISHED_LABEL_NAME = "Published to Meadow";

/**
 * @constant {string} GMAIL_REDIRECT_URI
 * @description OAuth redirect URI used when initializing the Google OAuth2 client.
 * Defaults to OAuth Playground for manual refresh-token setup.
 */
const GMAIL_REDIRECT_URI =
  process.env.GMAIL_REDIRECT_URI || "https://developers.google.com/oauthplayground";

/**
 * @constant {string[]} REQUIRED_GMAIL_ENV_VARS
 * @description Required environment variables for Gmail OAuth integration.
 */
const REQUIRED_GMAIL_ENV_VARS = [
  "GMAIL_CLIENT_ID",
  "GMAIL_CLIENT_SECRET",
  "GMAIL_REFRESH_TOKEN",
];

/**
 * @function getMissingGmailEnvVars
 * @description Returns a list of required Gmail environment variables that are currently missing.
 * @returns {string[]} Array of missing environment variable names
 */
const getMissingGmailEnvVars = () => {
  return REQUIRED_GMAIL_ENV_VARS.filter((key) => !process.env[key]);
};

/**
 * @function getGmailErrorDetails
 * @description Normalizes Gmail/Google API errors into a predictable debug object.
 * Helps surface root-cause hints for auth failures like invalid_grant.
 * @param {Error & {response?: {status?: number, data?: any}, code?: string|number}} error - Raw error thrown by googleapis
 * @returns {{message: string, status: number|null, reason: string, description: string, hint: string}} Structured error details
 */
const getGmailErrorDetails = (error) => {
  const responseStatus = error?.response?.status;
  const responseError = error?.response?.data?.error;
  const message = error?.message || "Unknown Gmail API error.";

  const reason =
    (typeof responseError === "string" && responseError) ||
    responseError?.status ||
    responseError?.code ||
    (typeof error?.code === "string" ? error.code : "unknown_error");

  const description =
    responseError?.error_description ||
    responseError?.message ||
    error?.response?.data?.error_description ||
    message;

  let hint =
    "Verify Gmail OAuth credentials, scopes, and token values in backend environment variables.";

  if (
    message.includes("invalid_grant") ||
    reason === "invalid_grant" ||
    description.includes("invalid_grant")
  ) {
    hint =
      "Refresh token is no longer valid. Re-generate GMAIL_REFRESH_TOKEN and verify OAuth consent screen is set to Production (Testing mode can expire tokens quickly).";
  } else if (reason === "invalid_client") {
    hint =
      "Client ID/secret mismatch. Verify GMAIL_CLIENT_ID and GMAIL_CLIENT_SECRET belong to the same Google OAuth app.";
  } else if (responseStatus === 401 || responseStatus === 403) {
    hint =
      "Auth/scopes issue. Confirm Gmail API is enabled and the token has Gmail scopes (e.g. https://mail.google.com/).";
  }

  return {
    message,
    status: responseStatus || null,
    reason,
    description,
    hint,
  };
};

/**
 * @function logGmailError
 * @description Logs standardized Gmail API errors with context for faster debugging.
 * @param {string} context - Where the error happened
 * @param {Error} error - Raw Gmail API error
 * @returns {{message: string, status: number|null, reason: string, description: string, hint: string}} Structured error details
 */
const logGmailError = (context, error) => {
  const details = getGmailErrorDetails(error);
  console.error(`[gmail.service.js] ${context}:`, details);
  return details;
};

/**
 * @constant {OAuth2Client} oauth2Client
 * @description OAuth2 client configured with credentials from environment variables.
 * @access private
 */
let oauth2Client = null;

/**
 * @function getOAuth2Client
 * @description Returns a configured OAuth2 client, creating one if it doesn't exist.
 * @returns {OAuth2Client} Configured Google OAuth2 client
 */
const getOAuth2Client = () => {
  const missingVars = getMissingGmailEnvVars();
  if (missingVars.length > 0) {
    const error = new Error(
      `Missing Gmail env vars: ${missingVars.join(", ")}. Cannot initialize Gmail OAuth client.`
    );
    console.error("[gmail.service.js] OAuth configuration error:", error.message);
    throw error;
  }

  if (!oauth2Client) {
    oauth2Client = new google.auth.OAuth2(
      process.env.GMAIL_CLIENT_ID,
      process.env.GMAIL_CLIENT_SECRET,
      GMAIL_REDIRECT_URI
    );

    oauth2Client.setCredentials({
      refresh_token: process.env.GMAIL_REFRESH_TOKEN,
    });
  }
  return oauth2Client;
};

/**
 * @function getGmailClient
 * @description Creates and returns an authenticated Gmail API client.
 * @returns {gmail_v1.Gmail} Authenticated Gmail API client
 */
const getGmailClient = () => {
  const auth = getOAuth2Client();
  return google.gmail({ version: "v1", auth });
};

/**
 * @async
 * @function getLabelId
 * @description Gets the Gmail label ID for a given label name.
 * @param {gmail_v1.Gmail} gmail - Authenticated Gmail client
 * @param {string} labelName - Name of the label to find
 * @returns {Promise<string|null>} Label ID if found, null otherwise
 */
const getLabelId = async (gmail, labelName) => {
  try {
    const response = await gmail.users.labels.list({ userId: "me" });
    const labels = response.data.labels || [];
    const label = labels.find(
      (l) => l.name.toLowerCase() === labelName.toLowerCase()
    );
    return label ? label.id : null;
  } catch (error) {
    logGmailError(`Error fetching label "${labelName}"`, error);
    throw error;
  }
};

/**
 * @async
 * @function getDraftsWithLabel
 * @description Fetches all Gmail drafts that have the "Ready for Meadow" label.
 * @returns {Promise<Array<{id: string, messageId: string}>>} Array of draft objects with id and messageId
 */
export const getDraftsWithLabel = async () => {
  const gmail = getGmailClient();

  try {
    // Get the label ID for "Ready for Meadow"
    const labelId = await getLabelId(gmail, READY_LABEL_NAME);

    if (!labelId) {
      console.warn(
        `[gmail.service.js] Label "${READY_LABEL_NAME}" not found in Gmail.`
      );
      return [];
    }

    // List all drafts
    const draftsResponse = await gmail.users.drafts.list({ userId: "me" });
    const allDrafts = draftsResponse.data.drafts || [];

    if (allDrafts.length === 0) {
      console.log("[gmail.service.js] No drafts found in Gmail.");
      return [];
    }

    // Filter drafts that have the "Ready for Meadow" label
    const readyDrafts = [];

    for (const draft of allDrafts) {
      // Get full draft details to check labels
      const draftDetails = await gmail.users.drafts.get({
        userId: "me",
        id: draft.id,
      });

      const message = draftDetails.data.message;
      const labelIds = message.labelIds || [];

      if (labelIds.includes(labelId)) {
        readyDrafts.push({
          id: draft.id,
          messageId: message.id,
        });
      }
    }

    console.log(
      `[gmail.service.js] Found ${readyDrafts.length} drafts with "${READY_LABEL_NAME}" label.`
    );
    return readyDrafts;
  } catch (error) {
    logGmailError("Error fetching drafts", error);
    throw error;
  }
};

/**
 * @async
 * @function getDraftContent
 * @description Retrieves the full content of a Gmail draft (subject and body).
 * @param {string} draftId - The Gmail draft ID
 * @returns {Promise<{subject: string, body: string, draftId: string}>} Draft content object
 */
export const getDraftContent = async (draftId) => {
  const gmail = getGmailClient();

  try {
    const response = await gmail.users.drafts.get({
      userId: "me",
      id: draftId,
      format: "full",
    });

    const message = response.data.message;
    const headers = message.payload.headers || [];

    // Extract subject from headers
    const subjectHeader = headers.find(
      (h) => h.name.toLowerCase() === "subject"
    );
    const subject = subjectHeader ? subjectHeader.value : "Untitled";

    // Extract body content
    let body = "";

    // Handle different message payload structures
    if (message.payload.body && message.payload.body.data) {
      // Simple message with body directly in payload
      body = Buffer.from(message.payload.body.data, "base64").toString("utf-8");
    } else if (message.payload.parts) {
      // Multipart message - look for text/plain or text/html
      for (const part of message.payload.parts) {
        if (part.mimeType === "text/plain" && part.body && part.body.data) {
          body = Buffer.from(part.body.data, "base64").toString("utf-8");
          break;
        } else if (
          part.mimeType === "text/html" &&
          part.body &&
          part.body.data
        ) {
          body = Buffer.from(part.body.data, "base64").toString("utf-8");
          // Continue looking for text/plain which is preferred
        }
      }
    }

    console.log(
      `[gmail.service.js] Retrieved draft "${subject}" (ID: ${draftId})`
    );

    return {
      draftId,
      subject,
      body,
    };
  } catch (error) {
    logGmailError(`Error getting draft content (ID: ${draftId})`, error);
    throw error;
  }
};

/**
 * @async
 * @function changeLabelToPublished
 * @description Changes the label on a draft's message from "Ready for Meadow" to "Published to Meadow".
 * @param {string} messageId - The Gmail message ID (not draft ID)
 * @returns {Promise<void>}
 */
export const changeLabelToPublished = async (messageId) => {
  const gmail = getGmailClient();

  try {
    const readyLabelId = await getLabelId(gmail, READY_LABEL_NAME);
    const publishedLabelId = await getLabelId(gmail, PUBLISHED_LABEL_NAME);

    if (!readyLabelId) {
      console.warn(
        `[gmail.service.js] Label "${READY_LABEL_NAME}" not found. Cannot remove.`
      );
    }

    if (!publishedLabelId) {
      console.warn(
        `[gmail.service.js] Label "${PUBLISHED_LABEL_NAME}" not found. Cannot add.`
      );
      return;
    }

    // Modify the message labels
    await gmail.users.messages.modify({
      userId: "me",
      id: messageId,
      requestBody: {
        addLabelIds: [publishedLabelId],
        removeLabelIds: readyLabelId ? [readyLabelId] : [],
      },
    });

    console.log(
      `[gmail.service.js] Changed label on message ${messageId} to "${PUBLISHED_LABEL_NAME}"`
    );
  } catch (error) {
    logGmailError(`Error changing label on message ${messageId}`, error);
    throw error;
  }
};

/**
 * @async
 * @function testConnection
 * @description Tests the Gmail API connection by fetching the user's profile.
 * Useful for verifying OAuth credentials are working.
 * @returns {Promise<{success: boolean, email: string}>} Connection status and user email
 */
export const testConnection = async () => {
  try {
    const gmail = getGmailClient();
    const response = await gmail.users.getProfile({ userId: "me" });
    console.log(
      `[gmail.service.js] Connected to Gmail as: ${response.data.emailAddress}`
    );
    return {
      success: true,
      email: response.data.emailAddress,
    };
  } catch (error) {
    const details = logGmailError("Gmail connection test failed", error);
    return {
      success: false,
      error: details.message,
      details,
    };
  }
};
