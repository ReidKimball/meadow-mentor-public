import React from 'react';
import { Card, CardContent, Box, Typography, Chip } from '@mui/material';

/**
 * IngredientAnalysisCard Component
 * 
 * Displays a single ingredient's SCD compliance analysis in a mobile-friendly card format.
 * 
 * @param {Object} props - Component props
 * @param {Object} props.ingredient - Ingredient data
 * @param {string} props.ingredient.name - Ingredient name
 * @param {string} props.ingredient.aligned - "yes" or "no"
 * @param {string} props.ingredient.confidence - Confidence percentage (e.g., "100%")
 * @param {string} props.ingredient.reason - Explanation for the alignment status
 */
const IngredientAnalysisCard = ({ ingredient }) => {
  const isAligned = ingredient.aligned.toLowerCase() === 'yes';
  
  return (
    <Card 
      sx={{ 
        mb: 1.5, 
        border: `2px solid ${isAligned ? '#4caf50' : '#f44336'}`,
        borderRadius: 2,
        boxShadow: 2
      }}
    >
      <CardContent>
        {/* Header: Name + Status Chip */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mb: 1,
          flexWrap: 'wrap',
          gap: 1
        }}>
          <Typography variant="h6" sx={{ fontWeight: 600, flex: 1, minWidth: 0 }}>
            {ingredient.name}
          </Typography>
          <Chip 
            label={ingredient.aligned} 
            color={isAligned ? 'success' : 'error'}
            size="small"
            sx={{ fontWeight: 'bold' }}
          />
        </Box>

        {/* Confidence Level */}
        <Typography 
          variant="body2" 
          color="text.secondary" 
          sx={{ mb: 1 }}
        >
          <strong>Confidence:</strong> {ingredient.confidence}
        </Typography>

        {/* Reason/Notes */}
        <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
          {ingredient.reason}
        </Typography>
      </CardContent>
    </Card>
  );
};

export default IngredientAnalysisCard;
