import React from 'react';
import { Box, Button, Typography } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ClearIcon from '@mui/icons-material/Clear';
import AddIcon from '@mui/icons-material/Add';
import MenuBookIcon from '@mui/icons-material/MenuBook';

/**
 * Option 2: Segmented Button Group
 * Clean, grouped design with consistent styling
 */
const ButtonLayoutOption2 = ({
  handleSelectAll,
  handleClearChecked,
  setIsAddModalOpen,
  setIsAddFromRecipeModalOpen,
  list
}) => {
  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="caption" sx={{ display: 'block', mb: 1, color: 'text.secondary' }}>
        Option 2: Segmented Button Group
      </Typography>
      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', sm: 'row' },
        gap: 1,
        '& .MuiButton-root': {
          borderRadius: 0,
          textTransform: 'none',
          fontWeight: 500,
        },
        '& .MuiButton-root:first-of-type': {
          borderTopLeftRadius: 8,
          borderBottomLeftRadius: { xs: 0, sm: 8 },
          borderTopRightRadius: { xs: 8, sm: 0 },
        },
        '& .MuiButton-root:last-of-type': {
          borderTopRightRadius: 8,
          borderBottomRightRadius: 8,
          borderBottomLeftRadius: { xs: 8, sm: 0 },
          borderTopLeftRadius: { xs: 0, sm: 0 },
        }
      }}>
        <Button
          variant="contained"
          startIcon={<CheckCircleIcon />}
          onClick={handleSelectAll}
          disabled={!list || list.items.length === 0 || list.items.every(item => item.checked)}
          sx={{ flex: 1 }}
        >
          Select All
        </Button>

        <Button
          variant="contained"
          color="secondary"
          startIcon={<ClearIcon />}
          onClick={handleClearChecked}
          disabled={!list || !list.items.some(item => item.checked)}
          sx={{ flex: 1 }}
        >
          Clear
        </Button>

        <Button
          variant="contained"
          color="success"
          startIcon={<AddIcon />}
          onClick={() => setIsAddModalOpen(true)}
          sx={{ flex: 1 }}
        >
          Add Item
        </Button>

        <Button
          variant="contained"
          color="info"
          startIcon={<MenuBookIcon />}
          onClick={() => setIsAddFromRecipeModalOpen(true)}
          sx={{ flex: 1 }}
        >
          Recipe
        </Button>
      </Box>
    </Box>
  );
};

export default ButtonLayoutOption2;
