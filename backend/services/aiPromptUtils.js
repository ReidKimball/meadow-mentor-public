import fs from 'fs';
import path from 'path';

/**
 * @constant {string} SCDFoodListPath - Path to the SCD (Specific Carbohydrate Diet) food list JSON file.
 * @constant {string} GAPSFoodListPath - Path to the GAPS (Gut and Psychology Syndrome) food list JSON file.
 * @constant {string} PaleoAIPFoodListPath - Path to the Paleo-AIP (Autoimmune Protocol) food list JSON file.
 * @constant {string} NutFreeFoodListPath - Path to the Nut-Free food list JSON file.
 * @constant {string} GlutenFreeFoodListPath - Path to the Gluten-Free food list JSON file.
 * @constant {string} DairyFreeFoodListPath - Path to the Dairy-Free food list JSON file.
 * @constant {string} MediterraneanFoodListPath - Path to the Mediterranean food list JSON file.
 */
const SCDFoodListPath = path.join(process.cwd(), "json/SCD-Food-List.json");
const GAPSFoodListPath = path.join(process.cwd(), "json/GAPS-Food-List.json");
const PaleoAIPFoodListPath = path.join(
  process.cwd(),
  "json/Paleo-AIP-Food-List.json"
);
const NutFreeFoodListPath = path.join(
  process.cwd(),
  "json/Nut-Free-Food-List.json"
);
const GlutenFreeFoodListPath = path.join(
  process.cwd(),
  "json/Gluten-Free-Food-List.json"
);
const DairyFreeFoodListPath = path.join(
  process.cwd(),
  "json/Dairy-Free-Food-List.json"
);
const MediterraneanFoodListPath = path.join(
  process.cwd(),
  "json/Mediterranean-Food-List.json"
);

/**
 * @constant {object} SCDFoodListJson - Parsed JSON content of the SCD food list.
 * @constant {object} GAPSFoodListJson - Parsed JSON content of the GAPS food list.
 * @constant {object} PaleoAIPFoodListJson - Parsed JSON content of the Paleo-AIP food list.
 * @constant {object} NutFreeFoodListJson - Parsed JSON content of the Nut-Free food list.
 * @constant {object} GlutenFreeFoodListJson - Parsed JSON content of the Gluten-Free food list.
 * @constant {object} DairyFreeFoodListJson - Parsed JSON content of the Dairy-Free food list.
 * @constant {object} MediterraneanFoodListJson - Parsed JSON content of the Mediterranean food list.
 * @description These constants hold the parsed food list data, loaded synchronously at startup.
 */
const SCDFoodListJson = JSON.parse(fs.readFileSync(SCDFoodListPath, "utf-8"));
const GAPSFoodListJson = JSON.parse(fs.readFileSync(GAPSFoodListPath, "utf-8"));
const PaleoAIPFoodListJson = JSON.parse(
  fs.readFileSync(PaleoAIPFoodListPath, "utf-8")
);
const NutFreeFoodListJson = JSON.parse(
  fs.readFileSync(NutFreeFoodListPath, "utf-8")
);
const GlutenFreeFoodListJson = JSON.parse(
  fs.readFileSync(GlutenFreeFoodListPath, "utf-8")
);
const DairyFreeFoodListJson = JSON.parse(
  fs.readFileSync(DairyFreeFoodListPath, "utf-8")
);
const MediterraneanFoodListJson = JSON.parse(
  fs.readFileSync(MediterraneanFoodListPath, "utf-8")
);

/**
 * @constant {string} SCD_FOOD_LIST_PROMPT - Formatted string of the SCD food list for AI system prompts.
 * @constant {string} GAPS_FOOD_LIST_PROMPT - Formatted string of the GAPS food list for AI system prompts.
 * @constant {string} PALEO_AIP_FOOD_LIST_PROMPT - Formatted string of the Paleo-AIP food list for AI system prompts.
 * @constant {string} NUT_FREE_FOOD_LIST_PROMPT - Formatted string of the Nut-Free food list for AI system prompts.
 * @constant {string} GLUTEN_FREE_FOOD_LIST_PROMPT - Formatted string of the Gluten-Free food list for AI system prompts.
 * @constant {string} DAIRY_FREE_FOOD_LIST_PROMPT - Formatted string of the Dairy-Free food list for AI system prompts.
 * @constant {string} MEDITERRANEAN_FOOD_LIST_PROMPT - Formatted string of the Mediterranean food list for AI system prompts.
 * @description These constants provide the JSON food lists embedded into AI system prompts.
 */
const SCD_FOOD_LIST_PROMPT = `# SCD_Food_List JSON: ${JSON.stringify(
  SCDFoodListJson
)}`;
const GAPS_FOOD_LIST_PROMPT = `# GAPS_Food_List JSON: ${JSON.stringify(
  GAPSFoodListJson
)}`;
const PALEO_AIP_FOOD_LIST_PROMPT = `# Paleo_AIP_Food_List JSON: ${JSON.stringify(
  PaleoAIPFoodListJson
)}`;
const NUT_FREE_FOOD_LIST_PROMPT = `# Nut_Free_Food_List JSON: ${JSON.stringify(
  NutFreeFoodListJson
)}`;
const GLUTEN_FREE_FOOD_LIST_PROMPT = `# Gluten_Free_Food_List JSON: ${JSON.stringify(
  GlutenFreeFoodListJson
)}`;
const DAIRY_FREE_FOOD_LIST_PROMPT = `# Dairy_Free_Food_List JSON: ${JSON.stringify(
  DairyFreeFoodListJson
)}`;
const MEDITERRANEAN_FOOD_LIST_PROMPT = `# Mediterranean_Food_List JSON: ${JSON.stringify(
  MediterraneanFoodListJson
)}`;

/**
 * @function getSystemPromptForDiet
 * @description Dynamically constructs an AI system prompt based on the requested
 * service type, therapeutic diet, and conversational style. It combines a base
 * prompt (loaded from environment variables), the relevant food list, and a
 * conversational style prompt.
 *
 * @param {string} serviceType - The type of AI service requested (e.g., "ASK_KAY", "INGREDIENTS", "MEAL_CONVERTER").
 * @param {string} diet - The therapeutic diet (e.g., "SCD", "GAPS", "Paleo AIP").
 * @param {string} convo_style - The desired conversational style (e.g., "MINIMAL", "FRIENDLY", "FORMAL").
 * @returns {string} The complete system prompt string for the AI model.
 * @example
 * // Get system prompt for SCD meal conversion in a friendly style:
 * getSystemPromptForDiet("MEAL_CONVERTER", "SCD", "FRIENDLY");
 */
export const getSystemPromptForDiet = (serviceType, diet, convo_style, temperature) => {
  let basePromptKey;
  let foodListPrompt;
  let convoStylePromptKey = `CONVO_STYLE_${convo_style?.toUpperCase() || "MINIMAL"}`;

  const dietPrefix =
    diet?.toUpperCase().replace(/ /g, "_").replace(/-/g, "_") || "SCD";
  const serviceSuffix = serviceType?.toUpperCase() || "ASK_KAY";

  basePromptKey = `${dietPrefix}_${serviceSuffix}`;

  // Fallback logic for base prompt:
  // 1. Try specific service/diet combo.
  // 2. Fallback to `ASK_KAY` for that diet.
  // 3. Fallback to `SCD_ASK_KAY` as a general default.
  if (!process.env[basePromptKey]) {
    console.warn(
      `⚠️ (services/aiPromptUtils.js) Prompt key '${basePromptKey}' not found. Falling back to 'ASK_KAY' for diet '${diet}'.`
    );
    basePromptKey = `${dietPrefix}_ASK_KAY`;
    if (!process.env[basePromptKey]) {
      console.warn(
        `⚠️ (services/aiPromptUtils.js) Fallback key '${basePromptKey}' not found. Defaulting to 'SCD_ASK_KAY'.`
      );
      basePromptKey = "SCD_ASK_KAY";
    }
  }

  // Select Food List Prompt based on Diet
  switch (diet) {
    case "SCD":
      foodListPrompt = SCD_FOOD_LIST_PROMPT;
      break;
    case "GAPS":
      foodListPrompt = GAPS_FOOD_LIST_PROMPT;
      break;
    case "Paleo AIP":
      foodListPrompt = PALEO_AIP_FOOD_LIST_PROMPT;
      break;
    case "Nut Free":
      foodListPrompt = NUT_FREE_FOOD_LIST_PROMPT;
      break;
    case "Gluten Free":
      foodListPrompt = GLUTEN_FREE_FOOD_LIST_PROMPT;
      break;
    case "Dairy Free":
      foodListPrompt = DAIRY_FREE_FOOD_LIST_PROMPT;
      break;
    case "Mediterranean":
      foodListPrompt = MEDITERRANEAN_FOOD_LIST_PROMPT;
      break;
    default:
      foodListPrompt = SCD_FOOD_LIST_PROMPT; // Default to SCD if diet is unknown
  }

  // Fallback for convo style prompt:
  if (!process.env[convoStylePromptKey]) {
    console.warn(
      `⚠️ (services/aiPromptUtils.js) Convo style key '${convoStylePromptKey}' not found. Defaulting to 'CONVO_STYLE_MINIMAL'.`
    );
    convoStylePromptKey = "CONVO_STYLE_MINIMAL";
  }

  const basePrompt = process.env[basePromptKey] || "";
  const convoPrompt = process.env[convoStylePromptKey] || "";

  console.log(
    `🤖 (services/aiPromptUtils.js) Using base prompt key: ${basePromptKey}, food list for: ${diet}, convo style key: ${convoStylePromptKey}`
  );
  // Log the actual base prompt content (careful with sensitive info, though these are AI prompts)
  console.log(`🤖 (services/aiPromptUtils.js) ${basePromptKey} is: ${basePrompt.substring(0, 50)}...`);
  return `${basePrompt} ${foodListPrompt} ${convoPrompt}`;
};
