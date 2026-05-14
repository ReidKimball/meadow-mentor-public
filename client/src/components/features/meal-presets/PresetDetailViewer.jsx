import React, { useState } from 'react';
import {
    Box, Paper, Typography, Button, Grid, Divider, Chip, List, ListItem, ListItemText,
    CircularProgress, Tooltip, useTheme, alpha, Card, Stack, IconButton
} from '@mui/material';
import { Edit, Trash2, Star, ListChecks, Info, ShieldAlert } from 'lucide-react'; // Added/changed icons
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import EditPresetModal from './EditPresetModal'; // Added import for EditPresetModal

const MySwal = withReactContent(Swal);

/**
 * @file PresetDetailViewer.jsx
 * @description Component to display the details of a selected meal preset.
 * Allows users to view preset information, and provides options to edit or delete the preset.
 * 
 * Props:
 *  - preset: Object | null - The meal preset object to display. Null if no preset is selected.
 *  - isLoading: boolean - Indicates if the preset data is currently being loaded.
 *  - onEditPreset: function - Callback function triggered when the 'Edit Preset' button is clicked. Receives preset ID.
 *  - onDeletePreset: function - Callback function triggered when the 'Delete Preset' button is clicked. Receives preset ID.
 *  - availableIngredients: array - List of available ingredients.
 *  - isLoadingAvailableIngredients: boolean - Indicates if the available ingredients are being loaded.
 *  - availableIngredientsError: string | null - Error message if available ingredients failed to load.
 */
export default function PresetDetailViewer({
    preset,
    isLoading,
    onEditPreset,
    onDeletePreset,
    availableIngredients,
    isLoadingAvailableIngredients,
    availableIngredientsError,
}) {
    const theme = useTheme();
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [currentPresetToEdit, setCurrentPresetToEdit] = useState(null);

    const handleDeleteClick = () => {
        if (!preset || !preset._id) return;
        MySwal.fire({
            title: 'Are you sure?',
            text: `You are about to delete the preset "${preset.presetName}". This action cannot be undone.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: theme.palette.error.main,
            cancelButtonColor: theme.palette.grey[600],
            confirmButtonText: 'Yes, delete it!',
            customClass: {
                popup: 'swal-popup',
                title: 'swal-title',
                htmlContainer: 'swal-text',
            }
        }).then((result) => {
            if (result.isConfirmed) {
                onDeletePreset(preset._id);
            }
        });
    };

    const handleEditClick = () => {
        if (preset) {
            setCurrentPresetToEdit(preset);
            setIsEditModalOpen(true);
        }
    };

    const handleModalUpdatePreset = async (updatedPresetDataFromModal) => {
        console.log('[PresetDetailViewer] handleModalUpdatePreset called with:', updatedPresetDataFromModal);
        
        // Optimistically update the local state for the modal first
        setCurrentPresetToEdit(updatedPresetDataFromModal); 

        if (onEditPreset) { // onEditPreset is handlePresetAddedOrUpdated from FoodJournal_AI_Analysis
            console.log('[PresetDetailViewer] Calling onEditPreset (handlePresetAddedOrUpdated)...');
            try {
                await onEditPreset(updatedPresetDataFromModal); 
                console.log('[PresetDetailViewer] onEditPreset (handlePresetAddedOrUpdated) finished successfully.');
            } catch (error) {
                console.error('[PresetDetailViewer] Error during onEditPreset:', error);
                // Consider showing an error to the user here if the main save fails
            }
        }
        
        console.log('[PresetDetailViewer] Setting isEditModalOpen to false.');
        setIsEditModalOpen(false); 
        // setCurrentPresetToEdit(null); // Delay or remove this explicit nullification
    };

    if (isLoading) {
        return (
            <Paper 
                elevation={2} 
                sx={{ 
                    p: { xs: 2, sm: 3, md: 4 }, 
                    mb: { xs: 2, sm: 3, md: 4 }, 
                    borderRadius: 3,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    minHeight: '300px',
                    boxShadow: theme.shadows[3]
                }}
            >
                <Box sx={{ textAlign: 'center' }}>
                    <CircularProgress size={40} thickness={4} />
                    <Typography variant="body1" sx={{ mt: 2, color: 'text.secondary' }}>
                        Loading preset details...
                    </Typography>
                </Box>
            </Paper>
        );
    }

    if (!preset) {
        return (
            <Paper 
                elevation={2} 
                sx={{ 
                    p: { xs: 2, sm: 3, md: 4 }, 
                    mb: { xs: 2, sm: 3, md: 4 }, 
                    borderRadius: 3,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    minHeight: '300px',
                    bgcolor: alpha(theme.palette.secondary.light, 0.03), // Using secondary color theme
                    boxShadow: theme.shadows[3]
                }}
            >
                 <Star size={48} color={theme.palette.text.disabled} style={{ marginBottom: theme.spacing(2) }} />
                <Typography variant="h6" sx={{ color: 'text.secondary', mb: 1 }}>
                    No Preset Selected
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center', maxWidth: '400px' }}>
                    Select a preset from the list to view its details, or create a new one.
                </Typography>
            </Paper>
        );
    }

    return (
        <Paper 
            elevation={2} 
            sx={{ 
                p: { xs: 2, sm: 3, md: 4 }, 
                mb: { xs: 2, sm: 3, md: 4 }, 
                borderRadius: 3,
                boxShadow: theme.shadows[3]
            }}
        >
            <Box 
                display="flex" 
                justifyContent="space-between" 
                alignItems="center" 
                mb={3}
                sx={{ flexWrap: 'wrap', gap: 1 }}
            >
                <Typography 
                    variant="h5" 
                    component="h2" 
                    sx={{ 
                        fontWeight: 500,
                        color: theme.palette.secondary.main, // Using secondary color theme
                        overflow: 'hidden', 
                        textOverflow: 'ellipsis', 
                        pr: 1 
                    }}
                >
                    {preset.presetName}
                </Typography>
                <Stack direction="row" spacing={1}>
                    <Button
                        variant="outlined"
                        color="secondary" // Using secondary color theme
                        startIcon={<Edit size={16} />}
                        onClick={handleEditClick} // Changed to use local handler
                        disabled={isLoading} // Disable if still loading (though covered by main loader)
                        sx={{ borderRadius: 2, px: 2, py: 1 }}
                    >
                        Edit
                    </Button>
                    <Tooltip title="Delete Preset" arrow>
                        <IconButton
                            onClick={handleDeleteClick}
                            color="error"
                            disabled={isLoading}
                            sx={{ 
                                border: `1px solid ${alpha(theme.palette.error.main, 0.5)}`,
                                borderRadius: 2,
                                '&:hover': {
                                    backgroundColor: alpha(theme.palette.error.main, 0.08),
                                    borderColor: theme.palette.error.main,
                                }
                            }}
                        >
                            <Trash2 size={18} />
                        </IconButton>
                    </Tooltip>
                </Stack>
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* Preset Details */}
            <Grid container spacing={1}>                
                {/* Ingredients List */}
                <Grid item xs={12} md={6}>
                     <Card variant="outlined" sx={{ p: 2, borderRadius: 2, height: '100%', bgcolor: alpha(theme.palette.background.default, 0.3) }}>
                        <Typography variant="overline" color="textSecondary" display="block" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                            <ListChecks size={16} style={{ marginRight: theme.spacing(1), color: theme.palette.text.secondary }} />
                            Ingredients ({preset.ingredients?.length || 0})
                        </Typography>
                        {preset.ingredients && preset.ingredients.length > 0 ? (
                            <Box sx={{ maxHeight: '200px', overflowY: 'auto', pr: 1 }}>
                                <List dense disablePadding>
                                    {preset.ingredients.map((ingredient, index) => (
                                        <ListItem key={index} disableGutters sx={{ py: 0.25, '&:not(:last-child)': { borderBottom: `1px dashed ${theme.palette.divider}` } }}>
                                            <ListItemText 
                                                primary={
                                                    <Typography variant="body2" component="span">
                                                        {ingredient}
                                                    </Typography>
                                                } 
                                            />
                                        </ListItem>
                                    ))}
                                </List>
                            </Box>
                        ) : (
                            <Typography variant="body2" color="textSecondary" sx={{ fontStyle: 'italic' }}>
                                No ingredients listed for this preset.
                            </Typography>
                        )}
                    </Card>
                </Grid>
            </Grid>
            
            {/* Optional: Notes or Description section if you add it to presets model later */}
            {/* {preset.notes && (
                <>
                    <Divider sx={{ my: 3 }} />
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                        <Info size={20} style={{ marginRight: theme.spacing(1), color: theme.palette.text.secondary }} />
                        Notes
                    </Typography>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', color: 'text.secondary' }}>
                        {preset.notes}
                    </Typography>
                </>
            )} */}

            {currentPresetToEdit && (
                <EditPresetModal
                    open={isEditModalOpen}
                    onClose={() => {
                        console.log('[PresetDetailViewer] EditPresetModal onClose called (backdrop/esc). Setting isEditModalOpen to false.');
                        setIsEditModalOpen(false);
                        setCurrentPresetToEdit(null); // Ok to nullify on explicit close without save
                    }}
                    initialPresetData={currentPresetToEdit}
                    onUpdatePreset={handleModalUpdatePreset} // Corrected: was onEditPreset, should be handleModalUpdatePreset
                    availableIngredients={availableIngredients}
                    isLoadingAvailableIngredients={isLoadingAvailableIngredients}
                    availableIngredientsError={availableIngredientsError}
                />
            )}
        </Paper>
    );
}
