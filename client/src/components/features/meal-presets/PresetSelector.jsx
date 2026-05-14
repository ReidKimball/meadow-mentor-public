// client/src/components/MealPresets/PresetSelector.jsx
import React, { useState, useEffect, forwardRef } from 'react';
import {
  Box, Button, Dialog, DialogTitle, DialogContent, DialogActions, 
  List, ListItemButton, ListItemText, ListItemSecondaryAction, 
  IconButton, Divider, Typography, Chip, TextField, 
  InputAdornment, Tooltip, useTheme, Snackbar, Alert,
  CircularProgress
} from '@mui/material';
import { Search as SearchIcon, Add as AddIcon, Check as CheckIcon, 
  Edit as EditIcon, Delete as DeleteIcon, Close as CloseIcon } from '@mui/icons-material';

import * as mealPresetService from '../../../services/mealPresetService.js';
import { useUser } from '../../../context/UserContext.jsx';
import EditPresetModal from './EditPresetModal.jsx';

const PresetSelector = ({ 
  open, 
  onClose, 
  onSelectPreset, 
  currentDiet,
  currentMealData
}) => {
  const { getFreshIdToken } = useUser();
  const [presets, setPresets] = useState([]); // Initialize with empty array, will be populated by API
  const [filteredPresets, setFilteredPresets] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPreset, setSelectedPreset] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success', // 'success', 'error', 'warning', 'info'
  });
  const theme = useTheme();

  // State for EditPresetModal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingPreset, setEditingPreset] = useState(null);

  // Load presets when the dialog opens
  useEffect(() => {
    console.log("PresetSelector loaded, this is the Select a Meal Preset modal form");
    const loadPresets = async () => {
      if (!open || !getFreshIdToken) return;
      
      setIsLoading(true);
      try {
        const data = await mealPresetService.getMealPresets(currentDiet, getFreshIdToken);
        //console.log("Loaded presets:", data);
        setPresets(data);
        setFilteredPresets(data);
      } catch (error) {
        showSnackbar('Failed to load presets', 'error');
      } finally {
        setIsLoading(false);
      }
    };

    loadPresets();
  }, [open, currentDiet, getFreshIdToken]);

  // Filter presets based on search term
  useEffect(() => {
    if (!searchTerm) {
      setFilteredPresets(presets);
      return;
    }

    const lowercasedFilter = searchTerm.toLowerCase();
    const filtered = presets.filter(preset => 
      preset.presetName.toLowerCase().includes(lowercasedFilter) ||
      preset.mealName.toLowerCase().includes(lowercasedFilter) ||
      preset.ingredients.some(ing => 
        ing.toLowerCase().includes(lowercasedFilter)
      )
    );
    setFilteredPresets(filtered);
  }, [searchTerm, presets]);

  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') return;
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handlePresetSelect = (preset) => {
    setSelectedPreset(preset);
    onSelectPreset(preset);
  };

  const handleSaveAsPreset = async () => {
    if (!currentMealData || !getFreshIdToken) return;
    
    setIsSaving(true);
    try {
      const { _id, ...presetData } = currentMealData;
      const nameForPreset = currentMealData.presetName || currentMealData.mealName || 'New Preset from Current Meal';
      
      const newPreset = await mealPresetService.createMealPreset({
        ...presetData,
        presetName: nameForPreset,
        diet_code: presetData.diet_code || currentDiet, 
      }, getFreshIdToken);
      
      setPresets(prev => [...prev, newPreset]);
      if (!searchTerm || newPreset.presetName.toLowerCase().includes(searchTerm.toLowerCase()) || newPreset.mealName.toLowerCase().includes(searchTerm.toLowerCase())) {
        setFilteredPresets(prev => [...prev, newPreset]);
      }
      setSelectedPreset(newPreset);
      onSelectPreset(newPreset);
      showSnackbar('Preset saved successfully');
    } catch (error) {
      console.error('Error saving preset:', error);
      showSnackbar('Failed to save preset', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // this is not used bc the modal doesn't allow deleting presets from this selector modal
  const handleDeletePreset = async (presetId) => {
    //if (!window.confirm('Are you sure you want to delete this preset?')) return;
    if (!getFreshIdToken) return;
    
    try {
      await mealPresetService.deleteMealPreset(presetId, getFreshIdToken);
      setPresets(prev => prev.filter(p => p._id !== presetId));
      setFilteredPresets(prev => prev.filter(p => p._id !== presetId));
      if (selectedPreset?._id === presetId) {
        setSelectedPreset(null);
      }
      showSnackbar('Preset deleted');
    } catch (error) {
      console.error('Error deleting preset:', error);
      showSnackbar('Failed to delete preset', 'error');
    }
  }; //end handleDeletePreset

  // this is not used bc the modal doesn't allow editing presets from this selector modal
  const handleEditPreset = (preset) => {
    console.log("Opening edit modal for preset:", preset);
    setEditingPreset(preset);
    setIsEditModalOpen(true);
  }; //end handleEditPreset

  const handleUpdatePresetInSelector = async (updatedPresetData) => {
    if (!getFreshIdToken || !updatedPresetData?._id) return;

    try {
      const updatedFromServer = await mealPresetService.updateMealPreset(
        updatedPresetData._id,
        updatedPresetData,
        getFreshIdToken
      );

      setPresets(prevPresets => 
        prevPresets.map(p => p._id === updatedFromServer._id ? updatedFromServer : p)
      );
      setFilteredPresets(prevFiltered => 
        prevFiltered.map(p => p._id === updatedFromServer._id ? updatedFromServer : p)
      );

      if (selectedPreset?._id === updatedFromServer._id) {
        setSelectedPreset(updatedFromServer);
        // If the currently selected preset (passed to MealFormModal) was updated,
        // we might want to re-trigger onSelectPreset if MealFormModal needs to react to the update.
        // For now, just updating local state and the modal's selected state.
      }

      showSnackbar('Preset updated successfully!');
      setIsEditModalOpen(false);
      setEditingPreset(null);
    } catch (error) {
      console.error('Error updating preset in PresetSelector:', error);
      showSnackbar(error.message || 'Failed to update preset.', 'error');
      // Let EditPresetModal handle its internal error display; don't close it from here on error.
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="sm" 
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          height: '80vh',
          maxHeight: 700,
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        borderBottom: `1px solid ${theme.palette.divider}`,
        py: 1.5
      }}>
        <Box>
          <Typography variant="h6">Select a Meal Preset</Typography>
          <Typography variant="body2" color="text.secondary">
            {filteredPresets.length} presets available
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent dividers sx={{ p: 0 }}>
        <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
          <TextField
            fullWidth
            variant="outlined"
            size="small"
            placeholder="Search presets by name or ingredients..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
              sx: { borderRadius: 2 }
            }}
          />
        </Box>

        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : filteredPresets.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="body1" color="text.secondary" gutterBottom>
              {searchTerm ? 'No matching presets found' : 'No presets available'}
            </Typography>
            {!searchTerm && (
              <Button 
                variant="outlined" 
                color="primary" 
                startIcon={<AddIcon />}
                onClick={handleSaveAsPreset}
                disabled={!currentMealData || isSaving}
                sx={{ mt: 1 }}
              >
                {isSaving ? 'Saving...' : 'Save Current Meal as Preset'}
              </Button>
            )}
          </Box>
        ) : (
          <List sx={{ overflowY: 'auto', maxHeight: 400 }} component="div">
            {filteredPresets.map((preset) => (
              <React.Fragment key={preset._id}>
                <ListItemButton
                  onClick={() => handlePresetSelect(preset)}
                  sx={{
                    '&:hover': {
                      backgroundColor: theme.palette.action.hover,
                    }
                  }}
                >
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="subtitle1" noWrap>
                          {preset.presetName}
                        </Typography>
                        <Chip 
                          label={preset.mealType} 
                          size="small" 
                          sx={{ 
                            textTransform: 'capitalize',
                            height: 20,
                            fontSize: '0.7rem'
                          }} 
                        />
                      </Box>
                    }
                    secondary={
                      <Box component="span" sx={{ display: 'block' }}>
                        <Typography variant="body2" color="text.primary" sx={{ display: 'block', mb: 0.5 }}>
                          {preset.mealName}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.5 }}>
                          {preset.ingredients.slice(0, 3).map((ingredient, idx) => (
                            <Chip
                              key={idx}
                              label={ingredient}
                              size="small"
                              variant="outlined"
                              sx={{ height: 20, fontSize: '0.7rem' }}
                            />
                          ))}
                          {preset.ingredients.length > 3 && (
                            <Chip
                              label={`+${preset.ingredients.length - 3} more`}
                              size="small"
                              variant="outlined"
                              sx={{ height: 20, fontSize: '0.7rem' }}
                            />
                          )}
                        </Box>
                      </Box>
                    }
                    primaryTypographyProps={{ noWrap: true }}
                    secondaryTypographyProps={{ component: 'span' }}
                    sx={{ pr: 2 }}
                  />
                </ListItemButton>
                <Divider />
              </React.Fragment>
            ))}
          </List>
        )}
      </DialogContent>
      
      <DialogActions sx={{ p: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        {/* The 'Save Current as Preset' button below has been removed */}
      </DialogActions>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Edit Preset Modal */}
      {editingPreset && (
        <EditPresetModal 
          open={isEditModalOpen}
          onClose={() => { 
            setIsEditModalOpen(false); 
            setEditingPreset(null); 
          }}
          initialPresetData={editingPreset}
          onUpdatePreset={handleUpdatePresetInSelector}
          // availableIngredients can be passed if PresetSelector fetches them, 
          // or EditPresetModal can fetch its own if needed.
          // For now, assuming EditPresetModal manages this if its IngredientsInput requires it.
        />
      )}
    </Dialog>
  );
};

export default PresetSelector;