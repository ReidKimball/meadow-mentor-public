import React from 'react';
import { Box, Skeleton, Card, CardContent, CardMedia } from '@mui/material';

/**
 * @function RecipeSkeletonLoader
 * @description Renders a skeleton loader component that mimics the layout of a GeneratedRecipeSummaryCard.
 * This is used to provide visual feedback to the user while recipes are loading.
 * @returns {JSX.Element} The skeleton loader component.
 */
function RecipeSkeletonLoader() {
  return (
    <Card sx={{ 
      width: '100%', 
      borderRadius: '16px', 
      backgroundColor: '#FFF7E6',
      boxShadow: '0 8px 24px rgba(0,0,0,0.12)'
    }}>
      {/* Image skeleton */}
      <Skeleton variant="rectangular" height={200} />
      
      <CardContent sx={{ p: 2 }}>
        {/* Title skeleton */}
        <Skeleton variant="text" width="80%" height={32} sx={{ mb: 1 }} />
        
        {/* Rating skeleton */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Skeleton variant="rectangular" width={100} height={20} sx={{ borderRadius: 1 }} />
          <Skeleton variant="text" width={80} height={20} sx={{ ml: 1 }} />
        </Box>
        
        {/* Description skeleton */}
        <Box sx={{ minHeight: '60px', mb: 1.5 }}>
          <Skeleton variant="text" width="100%" />
          <Skeleton variant="text" width="95%" />
          <Skeleton variant="text" width="85%" />
        </Box>
        
        {/* Tags skeleton */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
          <Skeleton variant="rectangular" width={80} height={24} sx={{ borderRadius: '12px' }} />
          <Skeleton variant="rectangular" width={60} height={24} sx={{ borderRadius: '12px' }} />
          <Skeleton variant="rectangular" width={70} height={24} sx={{ borderRadius: '12px' }} />
          <Skeleton variant="rectangular" width={90} height={24} sx={{ borderRadius: '12px' }} />
        </Box>
        
        {/* Buttons skeleton */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
          <Skeleton variant="rectangular" width="48%" height={40} sx={{ borderRadius: '8px' }} />
          <Skeleton variant="rectangular" width="48%" height={40} sx={{ borderRadius: '8px' }} />
        </Box>
      </CardContent>
    </Card>
  );
}

export default RecipeSkeletonLoader;
