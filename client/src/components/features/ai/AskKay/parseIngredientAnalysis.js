/**
 * parseIngredientAnalysis
 * 
 * Parses the AI's markdown response to extract structured ingredient analysis data.
 * 
 * @param {string} aiResponse - The raw markdown response from the AI
 * @returns {Object|null} Parsed analysis data or null if not an ingredient analysis
 */
export const parseIngredientAnalysis = (aiResponse) => {
  // console.log('[parseIngredientAnalysis] Parsing AI response...');
  // console.log('[parseIngredientAnalysis] Full AI response:', aiResponse);
  
  // Check if this is an ingredient analysis response
  if (!aiResponse.includes('# Analysis') && !aiResponse.includes('Ingredient') && !aiResponse.includes('SCD Aligned')) {
    // console.log('[parseIngredientAnalysis] Not an ingredient analysis response');
    return null;
  }

  try {
    // Extract compliance status and diet name (handle bold markdown ** around aligned/not aligned and diet)
    const complianceRegex = /This food item is \*\*(not aligned|aligned)\*\* with the \*\*(.+?)\*\*/i;
    const isCompliantMatch = aiResponse.match(complianceRegex);
    // console.log('[parseIngredientAnalysis] Compliance match:', isCompliantMatch);
    
    const isCompliant = isCompliantMatch ? !isCompliantMatch[1].toLowerCase().includes('not') : false;
    const diet = isCompliantMatch ? isCompliantMatch[2] : 'Specific Carbohydrate Diet (SCD)'; // Fallback to SCD
    
    // console.log('[parseIngredientAnalysis] isCompliant:', isCompliant);
    // console.log('[parseIngredientAnalysis] Diet:', diet);
    // console.log('[parseIngredientAnalysis] Match text:', isCompliantMatch ? isCompliantMatch[1] : 'no match');

    // Extract problematic ingredients
    const problematicMatch = aiResponse.match(/\*\*Primary concerns:\*\* (.+)/);
    const problematicIngredients = problematicMatch 
      ? problematicMatch[1].split(',').map(ing => ing.trim())
      : [];
    // console.log('[parseIngredientAnalysis] problematicIngredients:', problematicIngredients);

    // Parse the markdown table
    // NOTE: This regex assumes no pipe characters (|) exist within cell content.
    // The system prompt instructs the AI to avoid pipes in content, but this is still
    // a potential point of failure. Future improvement: use a more robust markdown
    // table parser library or implement proper escape handling.
    const ingredients = [];
    const tableRegex = /\|(.+?)\|(.+?)\|(.+?)\|(.+?)\|/g;
    let match;
    let rowCount = 0;

    while ((match = tableRegex.exec(aiResponse)) !== null) {
      rowCount++;
      // console.log(`[parseIngredientAnalysis] Table row ${rowCount}:`, match[0]);
      
      // Skip header row and separator row
      if (rowCount <= 2) {
        // console.log(`[parseIngredientAnalysis] Skipping row ${rowCount} (header/separator)`);
        continue;
      }

      const [, name, aligned, confidence, reason] = match.map(s => s.trim());
      
      // Skip if this looks like a header or separator
      if (name.toLowerCase().includes('ingredient') || name.includes('---')) {
        // console.log(`[parseIngredientAnalysis] Skipping row ${rowCount} (looks like header)`);
        continue;
      }

      const ingredient = {
        name,
        aligned: aligned.toLowerCase(),
        confidence,
        reason
      };
      // console.log(`[parseIngredientAnalysis] Adding ingredient:`, ingredient);
      ingredients.push(ingredient);
    }

    // console.log('[parseIngredientAnalysis] Total parsed ingredients:', ingredients.length);
    // console.log('[parseIngredientAnalysis] Parsed ingredients:', ingredients);

    // Extract summary
    const summaryMatch = aiResponse.match(/## Summary\s+(.+?)(?=\n\n|$)/s);
    const summary = summaryMatch ? summaryMatch[1].trim() : '';
    // console.log('[parseIngredientAnalysis] Summary:', summary);

    return {
      isCompliant,
      diet,
      ingredients,
      summary,
      problematicIngredients
    };

  } catch (error) {
    console.error('[parseIngredientAnalysis] Error parsing response:', error);
    return null;
  }
};

/**
 * isIngredientAnalysis
 * 
 * Quick check to determine if a message contains ingredient analysis.
 * 
 * @param {string} content - Message content
 * @returns {boolean} True if this appears to be ingredient analysis
 */
export const isIngredientAnalysis = (content) => {
  return content.includes('# Analysis') || 
         (content.includes('Ingredient') && content.includes('SCD Aligned'));
};
