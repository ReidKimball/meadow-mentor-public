import React from 'react';
import { Box, IconButton, Typography, Tooltip } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ClearIcon from '@mui/icons-material/Clear';
import AddIcon from '@mui/icons-material/Add';
import MenuBookIcon from '@mui/icons-material/MenuBook';

/**
 * Option 1: Icon Buttons with Labels
 * Modern, compact design with icons and text labels
 */
const ButtonLayoutOption1 = ({
  handleSelectAll,
  handleClearChecked,
  setIsAddModalOpen,
  setIsAddFromRecipeModalOpen,
  list
}) => {
  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="caption" sx={{ display: 'block', mb: 1, color: 'text.secondary' }}>
        Option 1: Icon Buttons with Labels
      </Typography>
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' },
        gap: 2 
      }}>
        {/* Select All */}
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Tooltip title="Select all items">
            <span>
              <IconButton
                onClick={handleSelectAll}
                disabled={!list || list.items.length === 0 || list.items.every(item => item.checked)}
                sx={{
                  bgcolor: 'primary.main',
                  color: 'white',
                  '&:hover': { bgcolor: 'primary.dark' },
                  '&.Mui-disabled': { bgcolor: 'action.disabledBackground' },
                  mb: 0.5
                }}
              >
                <CheckCircleIcon />
              </IconButton>
            </span>
          </Tooltip>
          <Typography variant="caption" sx={{ textAlign: 'center', fontSize: '0.7rem' }}>
            Select All
          </Typography>
        </Box>

        {/* Clear Checked */}
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Tooltip title="Clear checked items">
            <span>
              <IconButton
                onClick={handleClearChecked}
                disabled={!list || !list.items.some(item => item.checked)}
                sx={{
                  bgcolor: 'secondary.main',
                  color: 'white',
                  '&:hover': { bgcolor: 'secondary.dark' },
                  '&.Mui-disabled': { bgcolor: 'action.disabledBackground' },
                  mb: 0.5
                }}
              >
                <ClearIcon />
              </IconButton>
            </span>
          </Tooltip>
          <Typography variant="caption" sx={{ textAlign: 'center', fontSize: '0.7rem' }}>
            Clear Checked
          </Typography>
        </Box>

        {/* Add Ingredient */}
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Tooltip title="Add new ingredient">
            <IconButton
              onClick={() => setIsAddModalOpen(true)}
              sx={{
                bgcolor: 'success.main',
                color: 'white',
                '&:hover': { bgcolor: 'success.dark' },
                mb: 0.5
              }}
            >
              <AddIcon />
            </IconButton>
          </Tooltip>
          <Typography variant="caption" sx={{ textAlign: 'center', fontSize: '0.7rem' }}>
            Add Item
          </Typography>
        </Box>

        {/* From Recipe */}
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Tooltip title="Add from recipe">
            <IconButton
              onClick={() => setIsAddFromRecipeModalOpen(true)}
              sx={{
                bgcolor: 'info.main',
                color: 'white',
                '&:hover': { bgcolor: 'info.dark' },
                mb: 0.5
              }}
            >
              <MenuBookIcon />
            </IconButton>
          </Tooltip>
          <Typography variant="caption" sx={{ textAlign: 'center', fontSize: '0.7rem' }}>
            From Recipe
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default ButtonLayoutOption1;
