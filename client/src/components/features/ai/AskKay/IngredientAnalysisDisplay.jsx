import React from 'react';
import { Box, Typography, Divider } from '@mui/material';
import ReactMarkdown from 'react-markdown';
import IngredientAnalysisSummary from './IngredientAnalysisSummary';
import IngredientAnalysisCard from './IngredientAnalysisCard';

/**
 * IngredientAnalysisDisplay Component
 * 
 * Main container for displaying ingredient analysis in a mobile-friendly card layout.
 * 
 * @param {Object} props - Component props
 * @param {Object} props.analysisData - Parsed analysis data
 * @param {boolean} props.analysisData.isCompliant - Overall SCD compliance
 * @param {string} props.analysisData.diet - Diet name
 * @param {Array} props.analysisData.ingredients - Array of ingredient objects
 * @param {string} [props.analysisData.summary] - Optional summary text
 * @param {Array} [props.analysisData.problematicIngredients] - Non-compliant ingredients
 */
const IngredientAnalysisDisplay = ({ analysisData }) => {
  const { 
    isCompliant, 
    diet, 
    ingredients, 
    summary,
    problematicIngredients 
  } = analysisData;

  console.log('[IngredientAnalysisDisplay] Rendering with data:', analysisData);

  return (
    <Box sx={{ width: '100%', maxWidth: '100%' }}>
      {/* Summary Alert */}
      <IngredientAnalysisSummary 
        isCompliant={isCompliant}
        diet={diet}
        problematicIngredients={problematicIngredients}
      />

      {/* Section Header */}
      <Typography 
        variant="h6" 
        sx={{ mb: 2, fontWeight: 600 }}
      >
        Ingredient Breakdown
      </Typography>

      {/* Ingredient Cards */}
      {ingredients && ingredients.length > 0 ? (
        ingredients.map((ingredient, index) => (
          <IngredientAnalysisCard 
            key={index} 
            ingredient={ingredient} 
          />
        ))
      ) : (
        <Typography variant="body2" color="text.secondary">
          No ingredients found in analysis.
        </Typography>
      )}

      {/* Final Summary (if provided) */}
      {summary && (
        <>
          <Divider sx={{ my: 3 }} />
          <Box sx={{ fontStyle: 'italic', fontSize: '0.875rem' }}>
            <strong>Summary:</strong>{' '}
            <ReactMarkdown
              components={{
                p: ({ children }) => <span>{children}</span>,
                strong: ({ children }) => <strong>{children}</strong>
              }}
              style={{ display: 'inline' }}
            >
              {summary}
            </ReactMarkdown>
          </Box>
        </>
      )}
    </Box>
  );
};

export default IngredientAnalysisDisplay;
