// langchainService.js
import { API_BASE_URL } from "../env-config.js";
import { HttpError } from "../utils/http-errors.js";

/**
 * Sends a message to the LangChain-powered 'Ask Kay' backend endpoint.
 * @param {string} message - The user's text message.
 * @param {File | null} file - The file to upload, or null.
 * @param {string | null} chatId - The ID of the current chat session, or null for a new chat.
 * @param {Function} getFreshIdToken - Function to get a fresh Firebase ID token.
 * @param {Object} options - Optional parameters for credit flow.
 * @param {string} options.pendingCreditId - ID from credit confirmation flow.
 * @param {boolean} options.isFirstHealingMeal - Whether this is the first healing meal (free).
 * @param {boolean} options.isAskKayIntro - Whether this is the Ask Kay intro flow.
 * @returns {Promise<Response>} The raw response object for stream handling.
 */
const askKay = async (message, file, chatId, getFreshIdToken, options = {}) => {
  const token = await getFreshIdToken();
  const { pendingCreditId, isFirstHealingMeal, isAskKayIntro } = options;

  const formData = new FormData();
  formData.append("message", message);
  if (file) {
    formData.append("file", file);
  }
  if (chatId) {
    formData.append("chatId", chatId);
  }
  // Credit flow parameters
  if (pendingCreditId) {
    formData.append("pendingCreditId", pendingCreditId);
  }
  if (isFirstHealingMeal) {
    formData.append("isFirstHealingMeal", "true");
  }
  // Ask Kay intro flow
  if (isAskKayIntro) {
    formData.append("isAskKayIntro", "true");
  }
  // Inform backend rate limiting quota middleware which service is being used
  formData.append("apiService", "askKay");

  const response = await fetch(`${API_BASE_URL}/api/langchain/ask-kay`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "text/event-stream",
    },
    body: formData,
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => response.text());
    const errorMessage =
      typeof errorBody === "object"
        ? errorBody.message || errorBody.error
        : errorBody;
    throw new HttpError(
      errorMessage || "Failed to get response from Kay.",
      response.status,
      errorBody
    );
  }

  // Return the raw response object for the component to handle the stream
  return response;
};

/**
 * Fetches all chat sessions for the user.
 * @param {Function} getFreshIdToken - Function to get a fresh Firebase ID token.
 * @returns {Promise<Array>} A list of chat sessions.
 */
const getChatSessions = async (getFreshIdToken) => {
  try {
    const token = await getFreshIdToken();
    const response = await fetch(`${API_BASE_URL}/api/langchain/sessions`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new HttpError(
        errorData.error || "Failed to fetch chat sessions.",
        response.status,
        errorData
      );
    }

    return await response.json();
  } catch (error) {
    console.error("Error in getChatSessions service:", error);
    throw error;
  }
};

/**
 * Fetches all messages for a specific chat session.
 * @param {string} chatId - The ID of the chat session.
 * @param {Function} getFreshIdToken - Function to get a fresh Firebase ID token.
 * @returns {Promise<Array>} The messages for the specified chat session.
 */
const getChatSessionMessages = async (chatId, getFreshIdToken) => {
  try {
    const token = await getFreshIdToken();
    const response = await fetch(
      `${API_BASE_URL}/api/langchain/sessions/${chatId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new HttpError(
        errorData.error || "Failed to fetch chat session messages.",
        response.status,
        errorData
      );
    }

    return await response.json();
  } catch (error) {
    console.error("Error in getChatSessionMessages service:", error);
    throw error;
  }
};

/**
 * Deletes a specific chat session.
 * @param {string} sessionId - The ID of the chat session to delete.
 * @param {Function} getFreshIdToken - Function to get a fresh Firebase ID token.
 * @returns {Promise<object>} The response from the server.
 */
const deleteChatSession = async (sessionId, getFreshIdToken) => {
  try {
    const token = await getFreshIdToken();
    const response = await fetch(
      `${API_BASE_URL}/api/langchain/sessions/${sessionId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new HttpError(
        errorData.error || "Failed to delete chat session.",
        response.status,
        errorData
      );
    }

    return await response.json();
  } catch (error) {
    console.error("Error in deleteChatSession service:", error);
    throw error;
  }
};

/**
 * Sets the specified chat session as the user's last active one.
 * @param {string} sessionId - The ID of the chat session to set as active.
 * @param {Function} getFreshIdToken - Function to get a fresh Firebase ID token.
 * @returns {Promise<object>} The response from the server.
 */
export const setActiveChatSession = async (sessionId, getFreshIdToken) => {
  const token = await getFreshIdToken();
  const response = await fetch(
    `${API_BASE_URL}/api/langchain/ask-kay/sessions/${sessionId}/active`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new HttpError(
      errorBody.message ||
        errorBody.error ||
        "Failed to set active chat session.",
      response.status,
      errorBody
    );
  }

  return response.json();
};

/**
 * Clears the user's last active chat session reference.
 * @param {Function} getFreshIdToken - Function to get a fresh Firebase ID token.
 * @returns {Promise<object>} The response from the server.
 */
const clearActiveChatSession = async (getFreshIdToken) => {
  const token = await getFreshIdToken();
  const response = await fetch(
    `${API_BASE_URL}/api/langchain/ask-kay/sessions/active`,
    {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new HttpError(
      errorBody.message ||
        errorBody.error ||
        "Failed to clear active chat session.",
      response.status,
      errorBody
    );
  }

  return response.json();
};

export {
  askKay,
  getChatSessions,
  getChatSessionMessages,
  deleteChatSession,
  clearActiveChatSession,
};
