import { API_BASE_URL } from "./env-config.js";

export async function getRecipeFromChefClaude(
  ingredientsArr,
  user,
  convoStyle
) {
  // Add check for user object
  if (!user) {
    console.error("(ai.js getRecipeFromChefClaude) - User object is missing.");
    throw new Error("Authentication required.");
  }

  const ingredientsString = ingredientsArr.join(", ");
  try {
    //console.log("(ai.js) - trying to connect to /api/ai/recipe...");
    //console.log(`API_BASE_URL IS: ${API_BASE_URL}`);
    //console.log(`(ai.js) - convoStyle is: ${convoStyle}`);

    // --- Get ID Token from user object ---
    const idToken = await user.getIdToken();
    // --------------------------------------

    // Create an AbortController to manage the fetch request
    const controller = new AbortController();
    const { signal } = controller;

    // Return an object with both the stream and the controller
    return {
      stream: streamResponse(`${API_BASE_URL}/api/ai/recipe`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // --- Use the correct idToken ---
          Authorization: `Bearer ${idToken}`,
          // -------------------------------
        },
        body: JSON.stringify({
          ingredients: ingredientsString,
          apiService: "recipeGeneration",
          convo_style: convoStyle,
        }),
        signal,
      }),
      controller, // For cancellation if needed
    };
  } catch (error) {
    console.error("(ai.js getRecipeFromChefClaude) Error:", error.message);
    throw error; // Re-throw error (includes potential token errors)
  }
}

export async function getMealFromSCDChef(mealDescription, user, convoStyle) {
  // Add check for user object
  if (!user) {
    console.error("(ai.js getMealFromSCDChef) - User object is missing.");
    throw new Error("Authentication required.");
  }

  try {
    //console.log("(ai.js) - trying to connect to /api/ai/meal_convert...");
    //console.log(`(ai.js) - userMealDescription passed in from Meal.jsx is: ${mealDescription}`);
    //console.log(`API_BASE_URL IS: ${API_BASE_URL}`);
    //console.log(`(ai.js) - convoStyle is: ${convoStyle}`);

    // --- Get ID Token from user object ---
    const idToken = await user.getIdToken();
    // --------------------------------------

    // Create an AbortController to manage the fetch request
    const controller = new AbortController();
    const { signal } = controller;

    // Return an object with both the stream and the controller
    return {
      stream: streamResponse(`${API_BASE_URL}/api/ai/meal_convert`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // --- Use the correct idToken ---
          Authorization: `Bearer ${idToken}`,
          // -------------------------------
        },
        body: JSON.stringify({
          meal: mealDescription,
          apiService: "mealConvert",
          convo_style: convoStyle,
        }),
        signal,
      }),
      controller, // For cancellation if needed
    };
  } catch (error) {
    console.error("(ai.js getMealFromSCDChef) Error:", error.message);
    throw error; // Re-throw error
  }
}

export async function getInfoFromSCDCoach(query, user, convoStyle) {
  // Add check for user object
  if (!user) {
    console.error("(ai.js getInfoFromSCDCoach) - User object is missing.");
    throw new Error("Authentication required.");
  }

  try {
    //console.log("(ai.js) - trying to connect to /api/ai/askKay...");
    //console.log(`(ai.js) - userQuery passed in from Coach.jsx is: ${query}`);
    //console.log(`API_BASE_URL IS: ${API_BASE_URL}`);
    //console.log(`(ai.js) - convoStyle is: ${convoStyle}`);

    // --- Get ID Token from user object ---
    const idToken = await user.getIdToken();
    // --------------------------------------

    // Create an AbortController to manage the fetch request
    const controller = new AbortController();
    const { signal } = controller;

    // Return an object with both the stream and the controller
    return {
      stream: streamResponse(`${API_BASE_URL}/api/ai/askKay`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // --- Use the correct idToken ---
          Authorization: `Bearer ${idToken}`,
          // -------------------------------
        },
        body: JSON.stringify({
          question: query,
          apiService: "askKay",
          convo_style: convoStyle,
        }),
        signal,
      }),
      controller, // For cancellation if needed
    };
  } catch (error) {
    console.error("(ai.js getInfoFromSCDCoach) Error:", error.message);
    throw error; // Re-throw error
  }
}

// Modified function signature to accept user object
export async function getIngLabelAnalysis(fileObject, user, convoStyle) {
  // Add check for user object
  if (!user) {
    console.error("(ai.js getIngLabelAnalysis) - User object is missing.");
    throw new Error("Authentication required."); // Or handle as appropriate
  }

  if (!fileObject) {
    console.error("(ai.js getIngLabelAnalysis) - File object is missing.");
    throw new Error("No file provided for analysis.");
  }

  try {
    //console.log("(ai.js) - trying to connect to /api/ai/analyze-image..."); // Updated path
    //console.log(`(ai.js) - File: ${fileObject.name}, Type: ${fileObject.type}`);
    //console.log(`API_BASE_URL IS: ${API_BASE_URL}`);
    //console.log(`(ai.js) - convoStyle is: ${convoStyle}`);

    const formData = new FormData();
    // --- Use the field name expected by the backend ('image') ---
    formData.append("image", fileObject);
    formData.append("apiService", "checkIngredients"); // Tell controller what kind of analysis
    formData.append("convo_style", convoStyle);

    // --- Get ID Token from user object ---
    const idToken = await user.getIdToken();
    // --------------------------------------

    // Create an AbortController to manage the fetch request
    const controller = new AbortController();
    const { signal } = controller;

    // Return an object with both the stream and the controller
    return {
      // --- Call the unified /analyze-image endpoint ---
      stream: streamResponse(`${API_BASE_URL}/api/ai/analyze-image`, {
        // -----------------------------------------------
        method: "POST",
        headers: {
          // 'Content-Type': 'multipart/form-data' // Not needed, fetch sets it for FormData
          Accept: "text/event-stream", // Expecting SSE stream
          Authorization: `Bearer ${idToken}`,
        },
        body: formData,
        signal,
      }),
      controller,
    };
  } catch (error) {
    console.error("(ai.js getIngLabelAnalysis) Error:", error.message);
    throw error;
  }
}

export async function getWeeklyMealPlan(mealPlanParams, user, convoStyle) {
  // Add check for user object
  if (!user) {
    console.error("(ai.js getWeeklyMealPlan) - User object is missing.");
    throw new Error("Authentication required.");
  }

  try {
    //console.log("(ai.js) - trying to connect to /api/ai/meal_plan...");
    //console.log(`(ai.js) - mealPlanParams passed in from MealPlanner_Service.jsx is:`, mealPlanParams);
    //console.log(`API_BASE_URL IS: ${API_BASE_URL}`);
    //console.log(`convoStyle is: ${convoStyle}`);

    // Ensure apiService is included in the params sent to the backend
    const paramsWithService = {
      ...mealPlanParams,
      apiService: "mealPlanner", // Match the key expected by checkUserLimits middleware
      convo_style: convoStyle,
    };

    // --- Get ID Token from user object ---
    const idToken = await user.getIdToken();
    // --------------------------------------

    // Create an AbortController to manage the fetch request
    const controller = new AbortController();
    const { signal } = controller;

    // Return an object with both the stream and the controller
    return {
      stream: streamResponse(`${API_BASE_URL}/api/ai/meal_plan`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // --- Use the correct idToken ---
          Authorization: `Bearer ${idToken}`,
          // -------------------------------
        },
        body: JSON.stringify(paramsWithService), // Send params including apiService
        signal,
      }),
      controller, // For cancellation if needed
    };
  } catch (error) {
    console.error("(ai.js getWeeklyMealPlan) Error:", error.message);
    // Re-throw the error so the calling component can handle it
    throw error;
  }
}

// Helper function to process streaming responses
async function* streamResponse(url, options) {
  try {
    const response = await fetch(url, options);

    if (!response.ok) {
      let errorMsg = "An error occurred during the request.";
      // Try to get more specific error from response body
      try {
        const errorData = await response.json();
        if (errorData.message) {
          errorMsg = errorData.message;
        } else if (response.status === 401) {
          errorMsg = "Unauthorized. Please ensure you are logged in.";
        } else if (response.status === 429) {
          errorMsg =
            "API limit reached. Please try again later or upgrade your plan.";
        } else {
          errorMsg = `Request failed with status ${response.status}`;
        }
      } catch (e) {
        // If body isn't JSON, use status text
        errorMsg = response.statusText || errorMsg;
      }
      console.error(
        `(ai.js streamResponse) Fetch error: ${response.status} - ${errorMsg}`
      );
      throw new Error(errorMsg); // Throw error with specific message
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let responseId = null;
    let remainingRequests = null;
    let resetTime = null;
    let accumulatedError = ""; // Accumulate potential SSE error messages

    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        if (accumulatedError) {
          // If an error message was received via SSE, throw it now
          throw new Error(accumulatedError);
        }
        // Yield the final metadata only if no error occurred during streaming
        yield {
          type: "metadata",
          responseId,
          remainingRequests,
          resetTime,
        };
        break;
      }

      // Decode the chunk and parse SSE format
      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split("\n\n"); // SSE messages are separated by double newlines

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          try {
            const data = JSON.parse(line.substring(6)); // Remove "data: " prefix

            if (data.error) {
              // Accumulate or immediately throw based on preference
              // Throwing immediately might be better for stopping processing
              console.error(
                "(ai.js streamResponse) Error received via SSE:",
                data.error
              );
              accumulatedError = data.error; // Store the error message
              // Optionally break the loop here if you want to stop on first error
              // break; // Uncomment to stop processing further chunks on error
            } else if (data.done) {
              // Store metadata from the final message
              responseId = data.responseId;
              remainingRequests = data.remainingRequests;
              resetTime = data.resetTime;
              // Don't break here yet, wait for reader.read() to return done: true
            } else if (data.chunk !== undefined && !accumulatedError) {
              // Only yield chunks if no error has been accumulated
              yield {
                type: "chunk",
                text: data.chunk,
              };
            }
          } catch (e) {
            console.error(
              "(ai.js streamResponse) Error parsing SSE data:",
              e,
              "Raw line:",
              line
            );
            // Handle potential JSON parse errors if backend sends malformed data
          }
        }
      }
      // If an error was accumulated in this loop iteration, break outer loop
      if (accumulatedError) {
        break;
      }
    }
    // After the loop, if an error was accumulated, throw it
    if (accumulatedError) {
      throw new Error(accumulatedError);
    }
  } catch (error) {
    console.error("(ai.js streamResponse) Streaming error caught:", error);
    // Re-throw the error so the calling component's catch block can handle it
    throw error;
  }
}
