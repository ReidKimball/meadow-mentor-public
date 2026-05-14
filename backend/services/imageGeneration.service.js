
/**
 * @file imageGeneration.service.js
 * @description Provides a centralized Gemini-powered image generation service for recipes.
 * This service is used by recipe image endpoints across the app (meal planner and AskKay flows).
 * @version 1.0.0
 * @date 2026-01-19
 * @author Cascade
 * @requires @google/genai - Gemini SDK for image generation.
 * @requires dotenv - Loads environment variables for API access.
 */

/**
 * @section Third-Party Dependencies
 */
import { GoogleGenAI } from "@google/genai"; // Gemini SDK for image generation.
import dotenv from "dotenv"; // Loads environment variables for API access.
dotenv.config();

/**
 * @constant ai
 * @description Shared Gemini client used for image generation.
 * @type {GoogleGenAI}
 */
const ai = new GoogleGenAI(process.env.GOOGLE_API_KEY);

/**
 * @constant SYSTEM_PROMPT
 * @description System prompt that enforces Meadow Mentor's visual style and 4:3 aspect ratio.
 * @type {string}
 */
const SYSTEM_PROMPT = `<ROLE>
You are an expert culinary photographer and art director for "Meadow Mentor," a healthtech brand. You are visualizing a recipe from a provided JSON object into a photorealistic, 8k, top-down (flat lay) food photography shot.
</ROLE>

<INPUT>
You will receive a JSON object containing: \`recipeTitle\`, \`recipeDiet\`, \`recipeDescription\`, \`mealType\`, \`ingredients\`, and \`steps\`.
</INPUT>

<GLOBAL_SCENE_SETTINGS>
- **Camera Angle:** Direct top-down flat lay (90-degree).
- **Framing / Aspect Ratio:** 4:3 landscape (wider than tall). Do NOT generate a 1:1 square image.
- **Lighting:** "Morning Sun." Bright, natural window light entering from the side.
    - *Crucial:* The image must feel **optimistic, hopeful, and high-key**. Avoid dark, moody, "rustic cabin" shadows. The food should look illuminated and vibrant.
- **Background:** A textured **warm wood surface** (e.g., walnut or oak). It should provide contrast but not make the scene feel gloomy.
- **Aesthetic:** High-end culinary magazine. High texture, rich detail, appetizing. "The In-Home Chef."
</GLOBAL_SCENE_SETTINGS>

<STYLING_LOGIC_TREE>
You must analyze the recipe type to determine the layout strategy. Choose **Strategy A** or **Strategy B**.

**STRATEGY A: The "Savory Nourish Bowl" (For Stir-frys, Salads, Skillets, Roasted Meals)**
- **Applicability:** Use this when the recipe results in distinct solid components (e.g., protein + veg + garnish).
- **Vessel:** Matte ceramic earthenware bowl (soft cream or stone color). No shiny porcelain.
- **Layout:** "The Culinary Pie Chart" (Strict Separation).
    - **Concept:** Visualize the bowl as a pie chart or color wheel. Each main ingredient must occupy its own distinct **sector** or **wedge** of the bowl.
    - **ANTI-MIXING RULE:** **Do NOT toss, mix, or scramble the ingredients together.** Even if the recipe is a "stir-fry" or "salad," you must visualize it **deconstructed**.
    - **Territories:**
        - **Protein:** Placed in a distinct pile (e.g., taking up the bottom 40% of the bowl).
        - **Item A:** Placed in a distinct pile next to the protein.
        - **Item B:** Placed in a distinct pile next to Item A.
    - **Boundaries:** Ingredients should touch at the borders, but they should not overlap significantly. We need to see clear color blocking (e.g., a block of green kale next to a block of orange carrots).
    - **Volume:** Pile the ingredients high. They should look bountiful and mound upwards, not lie flat.
    - **Connective Tissue:** While separated, the dish shouldn't look dry. Visualize a light gloss of oil, roasting juices, or sauce **drizzled over the top** of the finished arrangement to unify the lighting, rather than tossing the food in the sauce beforehand.
    - **Garnish Realism:** **No "floating" garnish.** Herbs or spices must be placed intentionally on the food or in a specific small side vessel (pinch bowl). Do not scatter loose leaves directly on the table. If on the food, place garnishes (nuts, herbs) deliberately on top of the specific section they complement, or in the center point where ingredients meet.
    - **State:** Food should look hot, fresh, and steaming (if cooked).

**STRATEGY B: The "Baker's Table" (For Cookies, Breads, Purees, Smoothies)**
- **Applicability:** Use this when the recipe results in a uniform item (cookies) or a blended mixture (puree), and the raw ingredients are visually distinct (flour, eggs, honey).
- **Vessel:** Matte cream ceramic plate (for dry items) or bowl (for purees).
- **Layout:** "Satellite Styling."
    - **Hero Dominance (CRITICAL):** The main vessel with the finished food must occupy **60-70% of the frame**. It is the undisputed hero.
    - **Satellite Props:** Place the raw/structural ingredients **AROUND** the main vessel in the background/periphery. They should provide context but not crowd the hero.
    - **The "One-of-Each" Rule:** Select a maximum of 3-4 distinct ingredient types to feature as satellites. **Each selected ingredient type must be represented only ONCE.**
        - *Bad:* A jar of honey AND a honey dipper. Two piles of spices. Two jars of bone broth. A single egg in two different cups.
        - *Good:* A single open jar of honey. A single small scoop of almond flour. A single cup with two eggs.
    - **Vessels for Satellites:** Use small, aesthetic props:
        - Powders (Flour/Spices): Small wooden scoops or small glass spice bottles.
        - Liquids (Honey/Oil): Glass jars or ceramic pinch bowls.
        - Produce: Placed on a small cutting board or in a ceramic crate. **Never** floating directly on the table surface.
    - **Safety Rule:** **NEVER** place raw animal products (raw eggs, raw meat) or messy raw flour directly touching the finished, ready-to-eat product.
</STYLING_LOGIC_TREE>

<DIETARY_REASONING>
- **Strict Adherence:** Analyze the \`recipeDiet\`.
    - If **SCD/GAPS/Paleo:** Ensure NO grains, rice, potatoes, or refined sugar are visible.
    - If **AIP:** Ensure no nightshades (tomatoes, peppers, eggplant) or seeds/nuts are visible.
    - If **Low-Fiber / Low-Residue:**
        - **Texture is Safety:** Vegetables must look **peeled** (no skins on carrots/potatoes) and **well-cooked** (soft edges, steamed/boiled texture).
        - **Avoid:** No raw broccoli florets, no tough skins, no raw leafy greens. If the recipe calls for these, visualize them as pureed or cooked down significantly. The JSON recipe will specify which.

- **Ingredient Texture:** Read notes in the ingredient list.
    - If "minced," render minced.
    - If "charred," render char marks.
    - If "well cooked," render soft/yielding textures.
    - If instructions say "discard whites," do not show raw egg whites in the satellite props. Show only the egg yolks without the whites.

<EXECUTION_TASK>
1. Read the JSON.
2. Determine if this is a **Savory Nourish Bowl** or a **Baker's Table** scenario.
3. Select the top 4-5 most visually interesting ingredients.
4. Generate the image adhering to the specific styling strategy above. Especially the "One-of-Each" Rule.
</EXECUTION_TASK>`;

/**
 * Generates (or edits) a recipe image using Gemini image generation.
 *
 * @async
 * @function generateRecipeImage
 * @param {object} recipe - Recipe document data.
 * @param {string} recipe.recipeTitle - Recipe title for prompt context.
 * @param {string} recipe.recipeDiet - Diet label for compliance styling.
 * @param {string} recipe.recipeDescription - Description used to guide plating.
 * @param {string} recipe.mealType - Meal type (breakfast, lunch, dinner, snack).
 * @param {Array} recipe.ingredients - Ingredient list for styling cues.
 * @param {Array} recipe.steps - Step list for context on textures.
 * @param {Buffer|null} [existingImageBuffer=null] - Optional existing image for edit mode.
 * @returns {Promise<Buffer>} Buffer containing generated image data.
 * @throws {Error} When the image generation response does not contain image data.
 */
export const generateRecipeImage = async (recipe, existingImageBuffer = null) => {
  const inputJson = JSON.stringify({
    recipeTitle: recipe.recipeTitle,
    recipeDiet: recipe.recipeDiet,
    recipeDescription: recipe.recipeDescription,
    mealType: recipe.mealType,
    ingredients: recipe.ingredients,
    steps: recipe.steps
  }, null, 2);

  // For Gemini image generation, we ask it to generate or EDIT an image
  let fullPrompt;
  if (existingImageBuffer) {
    fullPrompt = `${SYSTEM_PROMPT}\n\n<INPUT>\n${inputJson}\n</INPUT>\n\nCRITICAL: You are EDITING the provided image. Update the image to reflect the NEW ingredients, title, or instructions in the JSON while adhering to the same camera angle, lighting, and general composition of the original. Do not add any text to the image. It must be completely textless, clean, and professional looking. Generate the edited version now.`;
  } else {
    fullPrompt = `${SYSTEM_PROMPT}\n\n<INPUT>\n${inputJson}\n</INPUT>\n\nGenerate the image described above.`;
  }

  try {
    // Calling the image generation model
    // Using 'gemini-2.5-flash-image' which works via generateContent (multimodal)
    const userParts = [{ text: fullPrompt }];
    
    // Add existing image as base64 for editing if provided
    if (existingImageBuffer) {
      userParts.unshift({
        inlineData: {
          mimeType: 'image/webp', // Assume webp as per our saving logic
          data: existingImageBuffer.toString('base64')
        }
      });
    }

    const response = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL_IMAGE || 'models/gemini-2.5-flash-image',
      contents: [
        {
          role: 'user',
          parts: userParts
        }
      ],
      config: {
        responseModalities: ['IMAGE'],
        imageConfig: {
          aspectRatio: '4:3',
        },
      },
    });

    if (
      response && 
      response.candidates && 
      response.candidates.length > 0 && 
      response.candidates[0].content &&
      response.candidates[0].content.parts
    ) {
      // Find the part that is an image
      const imagePart = response.candidates[0].content.parts.find(p => p.inlineData && p.inlineData.mimeType.startsWith('image/'));
      
      if (imagePart && imagePart.inlineData && imagePart.inlineData.data) {
         // Convert standard b64 string to buffer
         return Buffer.from(imagePart.inlineData.data, 'base64');
      }
    }
    
    throw new Error("No image returned from generation service.");

  } catch (error) {
    console.error("[imageGeneration.service] Error generating recipe image:", error);
    throw error;
  }
};
