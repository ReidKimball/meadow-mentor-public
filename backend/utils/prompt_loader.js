import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROMPT_DIR = path.join(__dirname, '..', 'ai_prompts', 'public_recipe_chat');

/**
 * Loads modular prompts and replaces placeholders with provided data.
 * @param {Object} data - The data to inject into placeholders
 * @returns {Promise<string>} The combined and populated system prompt
 */
export async function loadPublicRecipeChatPrompt(data = {}) {
  try {
    const files = [
      'core_identity.md',
      'nutrition_education.md',
      'therapeutic_diets.md',
      'recipe_context.md',
      'app_features.md'
    ];

    const promptParts = await Promise.all(
      files.map(async (file) => {
        try {
          const content = await fs.readFile(path.join(PROMPT_DIR, file), 'utf-8');
          return injectData(content, data);
        } catch (err) {
          console.error(`Error loading prompt file ${file}:`, err);
          return '';
        }
      })
    );

    return promptParts.filter(Boolean).join('\n\n---\n\n');
  } catch (error) {
    console.error('Error in loadPublicRecipeChatPrompt:', error);
    throw error;
  }
}

/**
 * Loads only the Chef Kay identity/persona prompt.
 *
 * This is useful for lightweight LLM calls (like intent routing or criteria extraction)
 * where we want consistent personality but do not want to load the full public recipe
 * chat system prompt bundle.
 *
 * @async
 * @function loadPublicRecipeChatCoreIdentityPrompt
 * @param {Object} data - Optional template values to inject into the prompt.
 * @returns {Promise<string>} The populated core identity prompt.
 */
export async function loadPublicRecipeChatCoreIdentityPrompt(data = {}) {
  try {
    const content = await fs.readFile(path.join(PROMPT_DIR, 'core_identity.md'), 'utf-8');
    return injectData(content, data);
  } catch (error) {
    console.error('Error in loadPublicRecipeChatCoreIdentityPrompt:', error);
    throw error;
  }
}

function injectData(content, data) {
  let result = content;
  
  // Basic template replacement {{VARIABLE}}
  Object.entries(data).forEach(([key, value]) => {
    const placeholder = new RegExp(`{{${key}}}`, 'g');
    result = result.replace(placeholder, value || 'N/A');
  });

  return result;
}
