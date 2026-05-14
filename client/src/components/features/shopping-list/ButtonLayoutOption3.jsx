import React, { useState } from 'react';
import { Box, Fab, SpeedDial, SpeedDialAction, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ClearIcon from '@mui/icons-material/Clear';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import MoreVertIcon from '@mui/icons-material/MoreVert';

/**
 * Option 3: Floating Action Button (FAB) with Speed Dial
 * Modern, mobile-first design with primary action prominent
 */
const ButtonLayoutOption3 = ({
  handleSelectAll,
  handleClearChecked,
  setIsAddModalOpen,
  setIsAddFromRecipeModalOpen,
  list
}) => {
  const [open, setOpen] = useState(false);

  const actions = [
    { 
      icon: <CheckCircleIcon />, 
      name: 'Select All', 
      onClick: handleSelectAll,
      disabled: !list || list.items.length === 0 || list.items.every(item => item.checked)
    },
    { 
      icon: <ClearIcon />, 
      name: 'Clear Checked', 
      onClick: handleClearChecked,
      disabled: !list || !list.items.some(item => item.checked)
    },
    { 
      icon: <MenuBookIcon />, 
      name: 'From Recipe', 
      onClick: () => setIsAddFromRecipeModalOpen(true),
      disabled: false
    },
  ];

  return (
    <Box sx={{ mb: 4, position: 'relative', minHeight: 200 }}>
      <Typography variant="caption" sx={{ display: 'block', mb: 1, color: 'text.secondary' }}>
        Option 3: FAB with Speed Dial
      </Typography>
      
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        height: 150,
        border: '2px dashed',
        borderColor: 'divider',
        borderRadius: 2,
        position: 'relative'
      }}>
        <Typography variant="body2" color="text.secondary">
          Main "Add" button + Speed dial for other actions
        </Typography>
        
        {/* Primary Add Button */}
        <Fab
          color="primary"
          aria-label="add"
          onClick={() => setIsAddModalOpen(true)}
          sx={{ position: 'absolute', bottom: 16, right: 16 }}
        >
          <AddIcon />
        </Fab>

        {/* Speed Dial for secondary actions */}
        <SpeedDial
          ariaLabel="More actions"
          sx={{ position: 'absolute', bottom: 16, left: 16 }}
          icon={<MoreVertIcon />}
          onClose={() => setOpen(false)}
          onOpen={() => setOpen(true)}
          open={open}
          direction="up"
        >
          {actions.map((action) => (
            <SpeedDialAction
              key={action.name}
              icon={action.icon}
              tooltipTitle={action.name}
              onClick={() => {
                if (!action.disabled) {
                  action.onClick();
                  setOpen(false);
                }
              }}
              sx={{
                opacity: action.disabled ? 0.5 : 1,
                pointerEvents: action.disabled ? 'none' : 'auto'
              }}
            />
          ))}
        </SpeedDial>
      </Box>
    </Box>
  );
};

export default ButtonLayoutOption3;
