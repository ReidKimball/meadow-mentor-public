import React, { useState } from 'react';
import { Box, Button, Menu, MenuItem, ListItemIcon, ListItemText, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ClearIcon from '@mui/icons-material/Clear';
import MenuBookIcon from '@mui/icons-material/MenuBook';

/**
 * Option 4: Primary Action + Dropdown Menu
 * Clean, minimal design with primary action prominent
 */
const ButtonLayoutOption4 = ({
  handleSelectAll,
  handleDeselectAll,
  handleClearChecked,
  setIsAddModalOpen,
  setIsAddFromRecipeModalOpen,
  list
}) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleMenuAction = (action) => {
    action();
    handleClose();
  };

  // Determine if all items are selected
  const allSelected = list && list.items.length > 0 && list.items.every(item => item.checked);
  const hasItems = list && list.items.length > 0;

  return (
    
      <Box sx={{ display: 'flex', gap: 2 }}>
        {/* Primary Add Button */}
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setIsAddModalOpen(true)}
          sx={{ 
            flex: 1,
            textTransform: 'none',
            fontWeight: 600,
            py: 1.5
          }}
        >
          Add Ingredient
        </Button>

        {/* More Actions Menu */}
        <Button
          variant="outlined"
          onClick={handleClick}
          sx={{ 
            minWidth: 'auto',
            px: 2
          }}
        >
          <MoreVertIcon />
        </Button>

        <Menu
          anchorEl={anchorEl}
          open={open}
          onClose={handleClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
        >
          <MenuItem 
            onClick={() => handleMenuAction(() => setIsAddFromRecipeModalOpen(true))}
          >
            <ListItemIcon>
              <MenuBookIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Add from Recipe</ListItemText>
          </MenuItem>

          <MenuItem 
            onClick={() => handleMenuAction(allSelected ? handleDeselectAll : handleSelectAll)}
            disabled={!hasItems}
          >
            <ListItemIcon>
              <CheckCircleIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>{allSelected ? 'Deselect All' : 'Select All'}</ListItemText>
          </MenuItem>

          <MenuItem 
            onClick={() => handleMenuAction(handleClearChecked)}
            disabled={!list || !list.items.some(item => item.checked)}
          >
            <ListItemIcon>
              <ClearIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Remove Checked</ListItemText>
          </MenuItem>
        </Menu>
      </Box>
    
  );
};

export default ButtonLayoutOption4;
