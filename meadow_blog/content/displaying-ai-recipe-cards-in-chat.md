# Developer Guide: Displaying AI-Generated Recipe Cards in a Chat Interface

This guide provides a high-level overview of how to dynamically display structured data, like recipe cards, within a streaming chat response from an AI. We'll break down the end-to-end flow, from the frontend request to the backend AI processing and back to the final UI rendering.

## Core Concept

The fundamental idea is to have the AI model return a special token or marker within its streamed response when it intends to send structured data. The backend detects this marker, processes the associated data (e.g., saves a recipe to the database), and then sends a distinct event to the frontend. The frontend listens for this specific event and renders a custom component instead of a standard text message.

---

## End-to-End Workflow

### 1. Frontend: Initiating the Request (`AskKay.jsx`)

The process begins in the main chat component. When a user sends a message, the application uses the browser's `fetch` API to make a request to the backend. The key is how the frontend handles the response stream.

- **Server-Sent Events (SSE):** The frontend is set up to handle a stream of events from the backend.
- **Event-Based Rendering:** It listens for different event types. A standard `message` event contains a piece of the AI's text response. However, it also listens for a custom `recipeCard` event.
- **State Update:** When a `recipeCard` event is received, its data payload (a recipe JSON object) is used to create a new message object with a special `role: 'recipe'`. This object is added to the chat history, triggering a UI update.

```javascript
// client/src/components/Pages/AskKay/AskKay.jsx

const handleSend = async (message) => {
  // ... setup code ...

  // Listen for the response stream
  // ...
        if (data.event === 'recipeCard') {
          const recipeMessage = { role: 'recipe', content: data.recipe };
          setMessages(prev => [...prev, recipeMessage]);
        } else if (data.event === 'stream') {
          // Append text chunk to the last message
        }
  // ...
};
```

### 2. Frontend: Rendering the Correct Component (`AskKay.jsx`)

A `Message` component acts as a router. It inspects the `role` of each message in the chat history and decides which component to render.

- If `role === 'user'`, it renders a user message bubble.
- If `role === 'assistant'`, it renders a standard AI response bubble.
- If `role === 'recipe'`, it renders the specialized `RecipeCard` component, passing the recipe data to it.

```javascript
// client/src/components/Pages/AskKay/AskKay.jsx

function Message({ message }) {
  // ...
  if (message.role === 'recipe') {
    return <RecipeCard recipe={message.content} />;
  } else if (message.role === 'assistant') {
    return <ReactMarkdown>{message.content}</ReactMarkdown>;
  } else {
    // user message
  }
  // ...
}
```

### 3. Frontend: The UI Component (`RecipeCard.jsx`)

This is a standard React component that receives a `recipe` object as a prop and displays its details in a structured format using UI library components (like Material UI's `Card`). It is self-contained and manages its own state for actions like saving or unsaving.

```javascript
// client/src/components/Pages/AskKay/RecipeCard.jsx

const RecipeCard = ({ recipe }) => {
  // ...
  return (
    <Card>
      <CardContent>
        <Typography variant="h4">{recipe.recipeTitle}</Typography>
        <Typography color="text.secondary">{recipe.recipeDescription}</Typography>
        {/* Render ingredients, instructions, etc. */}
      </CardContent>
      <CardActions>
        {/* Buttons for 'Save Recipe', 'Add to Shopping List', etc. */}
      </CardActions>
    </Card>
  );
};
```

### 4. Backend: AI and Streaming Logic (`langchain.controller.js`)

This is where the core AI interaction happens.

- **Prompt Engineering:** The system prompt sent to the LLM (e.g., Google's Gemini) explicitly instructs it to format recipe responses as a JSON object and wrap it with a unique identifier, like `[RECIPE_CARD_DATA] {...} [END_RECIPE_CARD_DATA]`.
- **Stream Processing:** The backend streams the response from the LLM chunk by chunk.
- **Marker Detection:** It buffers the incoming text and actively scans for the `[RECIPE_CARD_DATA]` marker. When the end marker `[END_RECIPE_CARD_DATA]` is found, it knows it has received the complete JSON object.
- **Database Interaction:** The backend parses the JSON string into an object, creates a new `Recipe` document, and saves it to the database.
- **Dispatching the Custom Event:** After successfully saving the recipe, the controller sends an SSE to the frontend with `event: 'recipeCard'` and the newly saved recipe object (including its database `_id`) as the payload.

```javascript
// backend/controllers/langchain.controller.js

const askKay = async (req, res) => {
  // ... setup LangChain stream ...

  let recipeBuffer = "";
  let isBufferingRecipe = false;

  for await (const chunk of stream) {
    const text = chunk.content;

    if (text.includes('[RECIPE_CARD_DATA]')) {
      isBufferingRecipe = true;
      // Start buffering
    }

    if (isBufferingRecipe) {
      recipeBuffer += text;
    }

    if (text.includes('[END_RECIPE_CARD_DATA]')) {
      isBufferingRecipe = false;
      // 1. Extract and parse the JSON from recipeBuffer
      // 2. const newRecipe = new Recipe({...});
      // 3. const savedRecipe = await newRecipe.save();
      // 4. Send the custom event to the client
      res.write(`data: ${JSON.stringify({ event: "recipeCard", recipe: savedRecipe })}\n\n`);
    } else if (!isBufferingRecipe) {
        // Send a normal text chunk
        res.write(`data: ${JSON.stringify({ event: "stream", chunk: text })}\n\n`);
    }
  }
  // ... end stream ...
};
```

### 5. Backend: Standard API Endpoints (`recipeCard.controller.js`)

While the AI controller handles the *creation* of recipes within the chat, a separate controller provides standard RESTful endpoints for managing those recipes (`/api/recipes`). These are used by the `RecipeCard` component itself for actions like saving or deleting a recipe after it has been rendered.

- `POST /api/recipes/:id/save`: Saves a recipe to a user's collection.
- `DELETE /api/recipes/:id/save`: Removes a recipe from a user's collection.

---

## Summary

By combining a smart prompt, backend stream processing with marker detection, and event-based rendering on the frontend, you can create a rich, interactive chat experience that goes beyond simple text responses. This pattern allows the AI to seamlessly integrate structured data components like recipe cards, product summaries, or interactive forms directly into the conversation flow.
