/**
 * @file PresetFormModal.jsx
 * @description Modal component for creating and editing meal presets.
 *
 * This component provides a form within a dialog to allow users to input
 * or modify the details of a meal preset, including its name, ingredients,
 * and associated diet code.
 *
 * Key Features:
 * - Form for preset name, ingredients (multi-line), and diet code.
 * - Validation for required fields (e.g., preset name).
 * - Integration with meal preset services for saving data.
 * - Loading and error states for save operations.
 *
 * @requires react
 * @requires @mui/material
 * @requires lucide-react - For icons
 * @requires ../../services/mealPresetService.js - (Though saving is handled by parent via onSave prop)
 * @requires ../../context/UserContext.jsx - For `getFreshIdToken`
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Button,
    Box,
    CircularProgress,
    Alert,
    Grid,
    Typography
} from '@mui/material';
import { Save, X } from 'lucide-react';
import { useUser } from '../../context/UserContext.jsx'; // Assuming getFreshIdToken might be needed directly or passed through

const DEFAULT_PRESET_STATE = {
    presetName: '',
    ingredients: [],
    dietCode: '',
};

/**
 * @function PresetFormModal
 * @description A modal dialog for creating or editing a meal preset.
 * @param {object} props - The component's props.
 * @param {boolean} props.open - Controls the visibility of the modal.
 * @param {function} props.onClose - Callback function to close the modal.
 * @param {object} [props.presetData=null] - The existing preset data if in edit mode. If null, assumes create mode.
 * @param {function} props.onSave - Callback function to save the preset data. 
 *                                   Expected signature: `async (presetId, dataToSave, getFreshIdToken) => void` for edit,
 *                                   or `async (dataToSave, getFreshIdToken) => void` for create.
 * @param {string} [props.dialogTitle="Edit Preset"] - The title for the dialog.
 * @returns {JSX.Element} The PresetFormModal component.
 */
export default function PresetFormModal({
    open,
    onClose,
    presetData = null, // If null, it's a new preset; otherwise, it's an existing one to edit.
    onSave,
    dialogTitle = "Edit Meal Preset"
}) {
    const { getFreshIdToken } = useUser();
    const [formData, setFormData] = useState(DEFAULT_PRESET_STATE);
    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState(null);

    useEffect(() => {
        if (open) {
            if (presetData) {
                setFormData({
                    presetName: presetData.presetName || '',
                    ingredients: Array.isArray(presetData.ingredients) ? presetData.ingredients.join('\n') : '',
                    dietCode: presetData.dietCode || '',
                });
            } else {
                setFormData(DEFAULT_PRESET_STATE);
            }
            setSaveError(null);
            setIsSaving(false);
        } else {
            // Reset form when modal is closed and not just hidden
            setFormData(DEFAULT_PRESET_STATE);
            setSaveError(null);
            setIsSaving(false);
        }
    }, [open, presetData]);

    const handleChange = (event) => {
        const { name, value } = event.target;
        setFormData(prevData => ({
            ...prevData,
            [name]: value,
        }));
    };

    const handleSave = async () => {
        if (!formData.presetName.trim()) {
            setSaveError('Preset name is required.');
            return;
        }
        setSaveError(null);
        setIsSaving(true);

        const ingredientsArray = formData.ingredients.split('\n').map(ing => ing.trim()).filter(ing => ing);
        
        const dataToSave = {
            presetName: formData.presetName.trim(),
            ingredients: ingredientsArray,
            dietCode: formData.dietCode.trim(),
        };

        try {
            // The onSave prop should handle whether it's a create or update operation
            // and pass the ID if it's an update.
            if (presetData && presetData._id) { // Editing existing preset
                await onSave(presetData._id, dataToSave, getFreshIdToken);
            } else { // Creating new preset (though current focus is edit)
                // This path might not be used if this modal is strictly for editing
                // await onSave(dataToSave, getFreshIdToken); 
                console.warn("PresetFormModal: Save called without presetData._id, assuming edit context for now.");
                // For now, let's assume onSave expects id for edit, if not, parent needs to adapt
                // Or, make onSave prop more flexible or have separate onUpdate/onCreate props.
                // For this iteration, we focus on edit, so presetData._id is expected.
                setSaveError("Cannot save: Preset ID is missing for an update operation.");
                setIsSaving(false);
                return;
            }
            onClose(); // Close modal on successful save
        } catch (error) {
            console.error('Failed to save preset:', error);
            setSaveError(error.message || 'An unexpected error occurred.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleClose = () => {
        if (isSaving) return; // Prevent closing while saving
        onClose();
    };

    return (
        <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
            <DialogTitle>
                <Box display="flex" alignItems="center">
                    <Save size={24} style={{ marginRight: 8 }} />
                    {dialogTitle}
                </Box>
            </DialogTitle>
            <DialogContent dividers>
                {saveError && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {saveError}
                    </Alert>
                )}
                <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid item xs={12}>
                        <TextField
                            label="Preset Name"
                            name="presetName"
                            value={formData.presetName}
                            onChange={handleChange}
                            fullWidth
                            required
                            variant="outlined"
                            disabled={isSaving}
                            helperText={!formData.presetName.trim() && "Preset name cannot be empty."}
                            error={!formData.presetName.trim()}
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <TextField
                            label="Ingredients (one per line)"
                            name="ingredients"
                            value={formData.ingredients}
                            onChange={handleChange}
                            fullWidth
                            multiline
                            rows={6}
                            variant="outlined"
                            disabled={isSaving}
                            placeholder="e.g.\nChicken breast\nBroccoli florets\nOlive oil"
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <TextField
                            label="Diet Code (e.g., SCD, GAPS)"
                            name="dietCode"
                            value={formData.dietCode}
                            onChange={handleChange}
                            fullWidth
                            variant="outlined"
                            disabled={isSaving}
                            helperText="Leave blank if not specific to a diet."
                        />
                    </Grid>
                </Grid>
            </DialogContent>
            <DialogActions sx={{ p: '16px 24px' }}>
                <Button
                    onClick={handleClose}
                    disabled={isSaving}
                    variant="outlined"
                    startIcon={<X size={18} />}
                    color="inherit"
                >
                    Cancel
                </Button>
                <Button
                    onClick={handleSave}
                    disabled={isSaving || !formData.presetName.trim()}
                    variant="contained"
                    color="primary"
                    startIcon={isSaving ? <CircularProgress size={18} color="inherit" /> : <Save size={18} />}
                >
                    {isSaving ? 'Saving...' : 'Save Preset'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
