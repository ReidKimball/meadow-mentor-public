/**
 * @file toolMetadata.js
 * @description Centralized metadata for AI tools to provide non-technical names
 * and user-facing descriptions. This is used by the AI to communicate about 
 * its capabilities and by the UI for status updates.
 */

export const TOOL_METADATA = {
  create_recipe: {
    friendlyName: "Create Recipe",
    actionVerb: "generating",
    description: "Generating a personalized recipe for you.",
  },
  edit_recipe: {
    friendlyName: "Modify Recipe",
    actionVerb: "updating",
    description: "Applying changes to your recipe.",
  },
  search_recipes: {
    friendlyName: "Search Recipes",
    actionVerb: "searching",
    description: "Searching through your collection and the community.",
  },
  get_recipe_details: {
    friendlyName: "View Recipe Details",
    actionVerb: "fetching",
    description: "Getting the full details for this recipe.",
  },
  add_to_shopping_list: {
    friendlyName: "Add to Shopping List",
    actionVerb: "adding",
    description: "Adding ingredients to your shopping list.",
  },
  save_user_memory: {
    friendlyName: "Remembering Your Journey",
    actionVerb: "remembering",
    description: "Saving an important long-term memory for future chats.",
  },
  update_user_state: {
    friendlyName: "Noting Your State",
    actionVerb: "remembering",
    description: "Remembering how you're feeling for this session.",
  },
  // implement soon (26 01 27)
  // get_health_data: {
  //   friendlyName: "Check Health Data",
  //   actionVerb: "checking",
  //   description: "Checking your saved health data.",
  // },
  check_ingredient_safety: {
    friendlyName: "Check Ingredient Safety",
    actionVerb: "checking",
    description: "Checking ingredients against your therapeutic diet database.",
  },
  web_search_tool: {
    friendlyName: "Web Search",
    actionVerb: "searching",
    description: "Searching the web for supplemental information.",
  },
  add_ingredientDB_tool: {
    friendlyName: "Add Ingredient",
    actionVerb: "adding",
    description: "Adding a new ingredient to your therapeutic diet database.",
  },
  edit_ingredientDB_tool: {
    friendlyName: "Edit Ingredient",
    actionVerb: "updating",
    description: "Updating an existing ingredient in your therapeutic diet database.",
  }
}

/**
 * Returns a concise string for the AI system prompt to learn these names.
 */
export const getToolNamesPrompt = () => {
  const lines = Object.entries(TOOL_METADATA).map(([key, meta]) => {
    return `- ${key}: "${meta.friendlyName}"`;
  });
  
  return `
### AI Tool Naming 
When you communicate with the user about your specific capabilities or tools you are using, ALWAYS use these non-technical, friendly names instead of the technical tool IDs:
${lines.join('\n')}

### Internal Field Privacy
When summarizing changes to a recipe (e.g., after an edit), NEVER mention technical or internal database fields to the user. Specifically, NEVER mention "SEO Slug Candidate" or "seoSlugCandidate". Treat these as background system details that the user should not be aware of.
`;
};

export default {
  TOOL_METADATA,
  getToolNamesPrompt
};
