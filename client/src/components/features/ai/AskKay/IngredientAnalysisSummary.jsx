import React from 'react';
import { Alert, AlertTitle, Typography } from '@mui/material';

/**
 * IngredientAnalysisSummary Component
 * 
 * Displays a summary alert showing whether the food item is SCD compliant.
 * 
 * @param {Object} props - Component props
 * @param {boolean} props.isCompliant - Whether the food is SCD compliant
 * @param {string} props.diet - Diet name (e.g., "Specific Carbohydrate Diet (SCD)")
 * @param {string[]} [props.problematicIngredients] - Array of non-compliant ingredient names
 */
const IngredientAnalysisSummary = ({ isCompliant, diet, problematicIngredients }) => {
  return (
    <Alert 
      severity={isCompliant ? 'success' : 'error'} 
      sx={{ mb: 2, borderRadius: 2 }}
    >
      <AlertTitle sx={{ fontWeight: 'bold' }}>
        Analysis
      </AlertTitle>
      <Typography variant="body2">
        This food item is <strong>{isCompliant ? 'aligned' : 'not aligned'}</strong> with the {diet}.
        {!isCompliant && problematicIngredients && problematicIngredients.length > 0 && (
          <>
            <br />
            <br />
            <strong>Primary concerns:</strong> {problematicIngredients.join(', ')}
          </>
        )}
      </Typography>
    </Alert>
  );
};

export default IngredientAnalysisSummary;
