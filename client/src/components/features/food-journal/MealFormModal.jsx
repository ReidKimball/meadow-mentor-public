import PresetSelector from '../meal-presets/PresetSelector.jsx';
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
    TextField, Button, Typography, Box, Paper, Chip, FormControl, InputLabel,
    Select, MenuItem, IconButton, LinearProgress, Grid, Divider, Alert, List,
    ListItem, ListItemText, CircularProgress, Autocomplete, createFilterOptions,
    Dialog, DialogTitle, DialogContent, DialogActions, Checkbox, Tooltip, Slider,
    Accordion, AccordionSummary, AccordionDetails, FormControlLabel,
    ListItemSecondaryAction
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import {
    Plus, X, Check, Save, Trash2, ChevronDown, Activity, HelpCircle, AlertCircle, Sparkles,
    Edit
} from 'lucide-react';
import { DateTimePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { API_BASE_URL } from '../../../env-config';
import * as mealPresetService from '../../../services/mealPresetService.js';
import { useUser } from '../../../context/UserContext.jsx';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
const MySwal = withReactContent(Swal);

const DEFAULT_MEAL_STATE = {
    mealType: 'breakfast', mealName: '', mealDateTime: dayjs(), ingredients: [],
    mealNotes: '', associatedSymptoms: [], complianceSnapshot: null,
};

const DEFAULT_SYMPTOM_STATE = {
    _id: null, symptomMasterId: '', symptomName: '', customSymptomName: '',
    severity: 3, timingRelativeToMeal: null, duration: null, location: null,
    customLocation: '', notes: '', occurredAt: dayjs(), source: 'meal',
};

const filterOptions = createFilterOptions({
    matchFrom: 'any', stringify: (option) => option, trim: true,
});

const getComplianceColor = (score) => {
    if (score === null || score === undefined) return 'default';
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'error';
};

const formatSymptomDateTime = (dateTimeString) => {
    if (!dateTimeString) return 'N/A';
    const dateObj = dayjs(dateTimeString);
    return dateObj.isValid() ? dateObj.format('MMM D, h:mm A') : 'Invalid Date';
};



export default function MealFormModal({
    open,
    onClose,
    isEditMode,
    initialMealData = DEFAULT_MEAL_STATE,
    onSave,
    onDelete,
    user,
    userData,
    availableIngredients = [],
    isLoadingAvailableIngredients = false,
    availableIngredientsError = null,
    masterSymptoms = [],
    onPresetChanged, // Add new prop
}) {
    const { getFreshIdToken } = useUser();
    const [presetSelectorOpen, setPresetSelectorOpen] = useState(false);
    const [mealNameInput, setMealNameInput] = useState(DEFAULT_MEAL_STATE.mealName);
    const [selectedMealType, setSelectedMealType] = useState(DEFAULT_MEAL_STATE.mealType);
    console.log('(MealFormModal) selectedMealType state:', selectedMealType); // DEBUG LINE
    const [mealDateTime, setMealDateTime] = useState(DEFAULT_MEAL_STATE.mealDateTime);
    const [ingredientsInput, setIngredientsInput] = useState(DEFAULT_MEAL_STATE.ingredients.join('\n'));
    const [mealNotes, setMealNotes] = useState(DEFAULT_MEAL_STATE.mealNotes);
    const [associatedSymptoms, setAssociatedSymptoms] = useState(DEFAULT_MEAL_STATE.associatedSymptoms);
    const [selectedDiet, setSelectedDiet] = useState(userData?.therapeuticDiet || '');

    const [currentSymptomInput, setCurrentSymptomInput] = useState(DEFAULT_SYMPTOM_STATE);
    const [showAddSymptomForm, setShowAddSymptomForm] = useState(false);
    const [autocompleteInputValue, setAutocompleteInputValue] = useState('');
    const autocompleteInputRef = useRef(null);

    const [saveAsPreset, setSaveAsPreset] = useState(false);
    const [presetNameInput, setPresetNameInput] = useState('');
    const [presetNameError, setPresetNameError] = useState('');

    const [editingSymptomId, setEditingSymptomId] = useState(null);

    const [complianceData, setComplianceData] = useState({ results: [], score: 0, compliantCount: 0, nonCompliantCount: 0, notFoundCount: 0 });
    const [isLoadingCompliance, setIsLoadingCompliance] = useState(false);
    const [complianceError, setComplianceError] = useState(null);
    const [newlyIntroducedSet, setNewlyIntroducedSet] = useState(new Set());

    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState(null);


    const handlePresetSelected = (selectedPreset) => {
        console.log("(MealFormModal) Preset selected:", selectedPreset);
    
        // Destructure with defaults to avoid errors if fields are missing in preset
        const { 
            mealName = '', 
            mealType = '', 
            ingredients = [], 
            diet_code = '', 
            mealNotes: presetMealNotes = '' // Preset might have its own notes
        } = selectedPreset;
    
        setMealNameInput(mealName);
        setSelectedMealType(mealType);
        setIngredientsInput(ingredients.join('\n'));
        setSelectedDiet(diet_code || (userData?.therapeuticDiet || '')); // Fallback to user's current diet or empty
        
        // Reset fields not typically part of a generic preset selection or that need fresh values
        setMealDateTime(dayjs()); // Set to current date and time
        setMealNotes(presetMealNotes); // Use preset's notes, or empty if none
        setAssociatedSymptoms([]); // Clear any previously associated symptoms
    
        // Reset compliance check state
        setComplianceData({ results: [], score: 0, compliantCount: 0, nonCompliantCount: 0, notFoundCount: 0 });
        setIsLoadingCompliance(false);
        setComplianceError(null);
    
        // If ingredients are present in the preset, trigger a new compliance check
        if (ingredients.length > 0 && (userData?.therapeuticDiet || diet_code)) {
            fetchComplianceCheck(ingredients, userData?.therapeuticDiet || diet_code);
        }
    
        setPresetSelectorOpen(false); // Close the preset selector modal
    };
    
    useEffect(() => {
        if (open) {
            setSaveError(null);
            setDeleteError(null);
            setIsSaving(false);
            setIsDeleting(false);
            setAutocompleteInputValue('');
            setShowAddSymptomForm(false);
            setCurrentSymptomInput(DEFAULT_SYMPTOM_STATE);
            setEditingSymptomId(null);
            setComplianceError(null);
            setSaveAsPreset(false);
            setPresetNameInput('');
            setPresetNameError('');

            if (isEditMode && initialMealData) {
                const mealToEdit = JSON.parse(JSON.stringify(initialMealData));
                mealToEdit.mealDateTime = dayjs(mealToEdit.mealDateTime);
                mealToEdit.associatedSymptoms = (mealToEdit.associatedSymptoms || []).map(s => ({
                    ...s,
                    occurredAt: dayjs(s.occurredAt)
                }));
                setMealNameInput(mealToEdit.mealName);
                setSelectedMealType(mealToEdit.mealType);
                setMealDateTime(mealToEdit.mealDateTime);
                setIngredientsInput(mealToEdit.ingredients.join('\n'));
                setMealNotes(mealToEdit.mealNotes);
                setAssociatedSymptoms(mealToEdit.associatedSymptoms);

                const initialNewlyIntroduced = new Set();
                if (mealToEdit.complianceSnapshot?.results) {
                    mealToEdit.complianceSnapshot.results.forEach(result => {
                        if (result.isNewlyIntroduced) {
                            initialNewlyIntroduced.add(result.ingredient.toLowerCase());
                        }
                    });
                }
                setNewlyIntroducedSet(initialNewlyIntroduced);
                setComplianceData(mealToEdit.complianceSnapshot || { results: [], score: 0, compliantCount: 0, nonCompliantCount: 0, notFoundCount: 0 });
            } else {
                setMealNameInput(DEFAULT_MEAL_STATE.mealName);
                setSelectedMealType(DEFAULT_MEAL_STATE.mealType);
                setMealDateTime(DEFAULT_MEAL_STATE.mealDateTime);
                setIngredientsInput(DEFAULT_MEAL_STATE.ingredients.join('\n'));
                setMealNotes(DEFAULT_MEAL_STATE.mealNotes);
                setAssociatedSymptoms(DEFAULT_MEAL_STATE.associatedSymptoms);
                setNewlyIntroducedSet(new Set());
                setComplianceData({ results: [], score: 0, compliantCount: 0, nonCompliantCount: 0, notFoundCount: 0 });
            }
        }
    }, [open, isEditMode, initialMealData]);

    const fetchComplianceCheck = useCallback(async (ingredients, dietCode) => {
        const firebaseUID = user?.uid;
        if (!firebaseUID || !dietCode || ingredients.length === 0) {
            setComplianceData({ results: [], score: 0, compliantCount: 0, nonCompliantCount: 0, notFoundCount: 0 });
            setComplianceError(null);
            return;
        }
        setIsLoadingCompliance(true);
        setComplianceError(null);

        try {
            const idToken = await user.getIdToken();

            const response = await fetch(`${API_BASE_URL}/api/foods/check-compliance`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${idToken}`,
                },
                body: JSON.stringify({ ingredients: ingredients, diet_code: dietCode }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || `HTTP error! status: ${response.status} ${response.statusText}`);
            }

            const resultsWithLocalNewStatus = data.results.map(result => ({
                ...result,
                isNewlyIntroduced: newlyIntroducedSet.has(result.ingredient.toLowerCase())
            }));

            setComplianceData({ ...data, results: resultsWithLocalNewStatus });
        } catch (error) {
            console.error('(MealFormModal) Compliance check error:', error);
            setComplianceError(error.message || 'Failed to check compliance.');
            setComplianceData({
                results: ingredients.map(ing => ({
                    ingredient: ing, normalized_ingredient: null, found: false, allowed: null,
                    note: 'Error checking compliance', isNewlyIntroduced: newlyIntroducedSet.has(ing.toLowerCase()),
                })),
                score: null, compliantCount: 0, nonCompliantCount: 0, notFoundCount: ingredients.length,
            });
        } finally {
            setIsLoadingCompliance(false);
        }
    }, [newlyIntroducedSet, user]);

    useEffect(() => {
        const currentIngredients = ingredientsInput.split('\n').map(ing => ing.trim()).filter(ing => ing !== '');
        if (open && currentIngredients.length > 0 && userData?.therapeuticDiet) {
            fetchComplianceCheck(currentIngredients, userData.therapeuticDiet);
        } else if (open) {
            setComplianceData({ results: [], score: 0, compliantCount: 0, nonCompliantCount: 0, notFoundCount: 0 });
            setIsLoadingCompliance(false);
            setComplianceError(null);
        }
    }, [open, ingredientsInput, userData?.therapeuticDiet, fetchComplianceCheck]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        console.log('(MealFormModal) handleInputChange - name:', name, 'value:', value); // DEBUG LINE
        if (name === 'mealName') setMealNameInput(value);
        if (name === 'mealNotes') setMealNotes(value);
        if (name === 'mealType') setSelectedMealType(value);
    };

    const handleDateTimeChange = (newValue) => {
        setMealDateTime(newValue);
    };

    const handleAddIngredient = (ingredientToAdd) => {
        if (!ingredientToAdd || typeof ingredientToAdd !== 'string') return;
        const trimmed = ingredientToAdd.trim();
        if (!trimmed || ingredientsInput.split('\n').map(ing => ing.trim().toLowerCase()).includes(trimmed.toLowerCase())) return;
        setIngredientsInput(prev => prev ? prev + '\n' + trimmed : trimmed);
        setAutocompleteInputValue('');
        setTimeout(() => { autocompleteInputRef.current?.focus(); }, 100);
    };

    const handleRemoveIngredient = (ingredientToRemove) => {
        const lower = ingredientToRemove.toLowerCase();
        setIngredientsInput(prev => 
            prev.split('\n')
                .map(ing => ing.trim())
                .filter(ing => ing.toLowerCase() !== lower && ing !== '')
                .join('\n')
        );
        setNewlyIntroducedSet(prevSet => {
            const newSet = new Set(prevSet);
            newSet.delete(lower);
            return newSet;
        });
    };

    const handleToggleNewlyIntroduced = (ingredient, isChecked) => {
        const lower = ingredient.toLowerCase();
        const newSet = new Set(newlyIntroducedSet);
        if (isChecked) newSet.add(lower);
        else newSet.delete(lower);
        setNewlyIntroducedSet(newSet);
        setComplianceData(prev => ({
            ...prev,
            results: prev.results.map(r => ({
                ...r,
                isNewlyIntroduced: newSet.has(r.ingredient.toLowerCase())
            }))
        }));
    };

    const handleSymptomInputChange = (e) => {
        const { name, value } = e.target;
        setCurrentSymptomInput(prev => ({ ...prev, [name]: value }));
        if (name === 'symptomMasterId') {
            const selected = masterSymptoms.find(s => s._id === value);
            setCurrentSymptomInput(prev => ({
                ...prev,
                symptomName: selected ? selected.displayName : '',
                customSymptomName: selected?.displayName === 'Other' ? prev.customSymptomName : '',
            }));
        }
        if (name === 'location' && value !== 'other') {
            setCurrentSymptomInput(prev => ({ ...prev, customLocation: '' }));
        }
    };

    const handleSymptomDateTimeChange = (newValue) => {
        setCurrentSymptomInput(prev => ({ ...prev, occurredAt: newValue }));
    };

    const handleSymptomSeverityChange = (event, newValue) => {
        setCurrentSymptomInput(prev => ({ ...prev, severity: newValue }));
    };

    const handleEditSymptomClick = (symptomId) => {
        const symptomToEdit = associatedSymptoms.find(s => s._id === symptomId);
        if (symptomToEdit) {
            const occurredAtDate = dayjs(symptomToEdit.occurredAt);
            setCurrentSymptomInput({
                ...symptomToEdit,
                occurredAt: occurredAtDate.isValid() ? occurredAtDate : dayjs()
            });
            setEditingSymptomId(symptomId);
            setShowAddSymptomForm(true);
            setSaveError(null);
        } else {
            console.error("Symptom to edit not found:", symptomId);
        }
    };

    const handleSaveSymptom = () => {
        if (!currentSymptomInput.symptomMasterId ||
            (currentSymptomInput.symptomName === 'Other' && !currentSymptomInput.customSymptomName.trim()) ||
            (currentSymptomInput.location === 'other' && !currentSymptomInput.customLocation.trim())) {
            setSaveError("Please fill required symptom fields (Type, Custom Name/Location if applicable).");
            return;
        }
        setSaveError(null);

        if (editingSymptomId) {
            setAssociatedSymptoms(prev => prev.map(s =>
                s._id === editingSymptomId ? { ...currentSymptomInput } : s
            ));
        } else {
            const newSymptom = { ...currentSymptomInput, _id: `temp_${Date.now()}` };
            setAssociatedSymptoms(prev => [...prev, newSymptom]);
        }

        setCurrentSymptomInput(DEFAULT_SYMPTOM_STATE);
        setShowAddSymptomForm(false);
        setEditingSymptomId(null);
    };

    const handleCancelSymptomEdit = () => {
        setCurrentSymptomInput(DEFAULT_SYMPTOM_STATE);
        setShowAddSymptomForm(false);
        setEditingSymptomId(null);
        setSaveError(null);
    };

    const handleRemoveSymptom = (symptomIdToRemove) => {
        setAssociatedSymptoms(prev => prev.filter(s => s._id !== symptomIdToRemove));
        if (editingSymptomId === symptomIdToRemove) {
            handleCancelSymptomEdit();
        }
    };

    const handleInternalSave = async () => {
        if (!mealNameInput.trim() || ingredientsInput.split('\n').filter(ing => ing.trim() !== '').length === 0) {
            setSaveError('Meal name and at least one ingredient are required.');
            return;
        }
        setIsSaving(true);
        setSaveError(null);
        setPresetNameError(''); // Clear previous preset name error

        const finalComplianceSnapshot = complianceData.results && complianceData.results.length > 0 
            ? complianceData 
            : (isEditMode && initialMealData?.complianceSnapshot ? initialMealData.complianceSnapshot : null);

        const mealPayload = {
            mealType: selectedMealType,
            mealName: mealNameInput.trim(),
            mealDateTime: mealDateTime.toISOString(), // Ensure mealDateTime is a dayjs object
            ingredients: ingredientsInput.split('\n').map(i => i.trim()).filter(i => i),
            mealNotes: mealNotes.trim(),
            associatedSymptoms: associatedSymptoms.map(s => ({
                ...s,
                // Ensure s.occurredAt is a dayjs object before calling toISOString()
                occurredAt: dayjs(s.occurredAt).toISOString() 
            })),
            complianceSnapshot: finalComplianceSnapshot,
            firebaseUID: userData?.uid, // Assuming userData is from useUser() hook
            diet_code: selectedDiet || userData?.therapeuticDiet,
        };

        try {
            if (saveAsPreset) {
                // 1. Validate preset name
                if (!presetNameInput.trim()) {
                    setPresetNameError('Please enter a name for the preset.');
                    setIsSaving(false); // Return early, so manually set isSaving
                    return;
                }
                // Preset name error is cleared at the start of handleInternalSave

                // 2. Create preset payload for the service
                const presetPayloadForService = {
                    presetName: presetNameInput.trim(),
                    mealName: mealPayload.mealName,
                    mealType: mealPayload.mealType,
                    ingredients: mealPayload.ingredients,
                    diet_code: mealPayload.diet_code,
                    complianceSnapshot: mealPayload.complianceSnapshot,
                    // firebaseUID will be added by the backend service
                };
                
                let presetSavedSuccessfully = false;
                try {
                    console.log("(MealFormModal) Attempting to create meal preset with payload:", presetPayloadForService);
                    const savedPreset = await mealPresetService.createMealPreset(presetPayloadForService, getFreshIdToken);
                    console.log("(MealFormModal) Meal preset saved successfully!");
                    presetSavedSuccessfully = true;
                    // Optionally, show a snackbar for preset success here if desired

                    if (onPresetChanged) {
                        onPresetChanged(savedPreset);
                    }

                } catch (presetError) {
                    console.error("(MealFormModal) Error saving meal preset:", presetError);
                    const presetErrorMessage = presetError.response?.data?.message || presetError.message || "An unexpected error occurred while saving preset.";
                    setSaveError(`Failed to save meal preset: ${presetErrorMessage}`);
                    // Let finally block handle setIsSaving(false)
                    return; // Stop if preset saving fails
                }

                // 3. If preset was saved, now also save/log the meal
                if (presetSavedSuccessfully) {
                    console.log("(MealFormModal) Attempting to also log meal with payload:", mealPayload);
                    const mealLogSuccess = await onSave(mealPayload); // onSave is from props

                    if (mealLogSuccess) {
                        console.log("(MealFormModal) Meal also logged successfully after preset creation!");
                        onClose(); // Close modal after both are successful
                    } else {
                        // Preset was saved, but meal log failed.
                        // onSave should ideally set its own specific error or return false.
                        setSaveError(prev => prev || "Meal preset saved, but failed to log the meal. Please review details.");
                        // Let finally block handle setIsSaving(false)
                        return; // Stop, don't proceed to common success path if meal log failed
                    }
                }
            } else {
                // Original logic: Save or update meal log (not as preset)
                let success;
                if (isEditMode) {
                    console.log("(MealFormModal) Attempting to update meal with ID:", initialMealData._id, "payload:", { ...mealPayload, _id: initialMealData._id });
                    success = await onSave({ ...mealPayload, _id: initialMealData._id });
                } else {
                    console.log("(MealFormModal) Attempting to create meal with payload:", mealPayload);
                    success = await onSave(mealPayload);
                }

                if (success) {
                    console.log(isEditMode ? "(MealFormModal) Meal updated successfully!" : "(MealFormModal) Meal saved successfully!");
                    onClose(); // Close modal after successful meal save/update
                } else {
                    // This case handles if onSave returns false or a falsy value without throwing an error
                    setSaveError(prev => prev || "Failed to save meal. Please check details and try again.");
                }
            }
        } catch (error) {
            // This outer catch will now primarily catch errors from the 'else' block's onSave if it throws,
            // or any other unexpected errors not caught by the inner try-catch for preset saving.
            console.error("(MealFormModal) Error during save operation:", error);
            const errorMessage = error.response?.data?.message || error.message || "An unexpected error occurred.";
            setSaveError(`Failed to save meal: ${errorMessage}`);
        } finally {
            setIsSaving(false);
        }
    };

    const handleInternalDelete = async () => {
        if (!initialMealData._id) return;

        MySwal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',      // Red for delete
            cancelButtonColor: '#6e7881',   // Gray for cancel
            confirmButtonText: 'Yes, delete it!',
            reverseButtons: true,            // Puts the confirm button on the left
            customClass: {
                container: 'my-swal-container',
                popup: 'my-swal-popup',
            }
        }).then(async (result) => {
            if (result.isConfirmed) {
                setDeleteError(null);
                setIsDeleting(true);

                try {
                    const success = await onDelete(initialMealData._id);

                    if (success) {
                        onClose();
                    } else {
                        setDeleteError(prev => prev || "Failed to delete meal. Please try again.");
                    }
                } catch (error) {
                    console.error("(MealFormModal) Error during onDelete callback:", error);
                    setDeleteError(error.message || "An unexpected error occurred during delete.");
                } finally {
                    setIsDeleting(false);
                }
            }
        });
    };

    const getIngredientChipProps = (ingredientName) => {
        const result = complianceData.results.find(r => r.ingredient.toLowerCase() === ingredientName.toLowerCase());
        const isChecked = newlyIntroducedSet.has(ingredientName.toLowerCase());
        const iconSize = 14;

        if (isLoadingCompliance) return { color: 'default', icon: <CircularProgress size={iconSize} />, label: ingredientName };
        if (!result || !result.found) return { color: 'default', icon: <HelpCircle size={iconSize} />, label: ingredientName, title: result?.note || "Not found", variant: 'outlined' };

        let baseIcon = result.allowed ? <Check size={iconSize} /> : <X size={iconSize} />;
        if (result.allowed === null) baseIcon = <AlertCircle size={iconSize} />;

        return {
            color: result.allowed === true ? 'success' : (result.allowed === false ? 'error' : 'warning'),
            icon: isChecked ? <Sparkles size={iconSize + 2} /> : baseIcon,
            label: ingredientName,
            title: result.note || (result.allowed === true ? "Compliant" : (result.allowed === false ? "Not Compliant" : "Status Unclear")),
        };
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>{isEditMode ? 'Edit Meal Details' : 'Log New Meal'}</DialogTitle>
            <DialogContent dividers>
                {saveError && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setSaveError(null)}>{saveError}</Alert>}
                {deleteError && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setDeleteError(null)}>{deleteError}</Alert>}
                {complianceError && <Alert severity="warning" sx={{ mb: 2 }}>Compliance Check: {complianceError}</Alert>}

                <PresetSelector
                    open={presetSelectorOpen}
                    onClose={() => setPresetSelectorOpen(false)}
                    onSelectPreset={handlePresetSelected}
                    currentDiet={userData?.therapeuticDiet}
                    currentMealData={{
                        mealType: selectedMealType,
                        mealName: mealNameInput,
                        mealDateTime: mealDateTime,
                        ingredients: ingredientsInput.split('\n'),
                        mealNotes: mealNotes,
                        associatedSymptoms: associatedSymptoms,
                    }}
                />

                <Box sx={{ mb: 2 }}>
                    <Button
                        variant="outlined"
                        color="primary"
                        fullWidth
                        startIcon={<SearchIcon />}
                        onClick={() => setPresetSelectorOpen(true)}
                        sx={{ mb: 2 }}
                    >
                        Use a Meal Preset
                    </Button>
                    <Divider sx={{ my: 1 }}>OR</Divider>
                </Box>

                <Grid container spacing={3}>
                    <Grid item xs={12} sm={6}>
                        <FormControl fullWidth variant="outlined" size="small" disabled={isSaving || isDeleting}>
                            <InputLabel id="modal-meal-type-label">Meal Type</InputLabel>
                            <Select labelId="modal-meal-type-label" name="mealType" value={selectedMealType} onChange={handleInputChange} label="Meal Type">
                                <MenuItem value="breakfast">Breakfast</MenuItem>
                                <MenuItem value="lunch">Lunch</MenuItem>
                                <MenuItem value="dinner">Dinner</MenuItem>
                                <MenuItem value="snack">Snack</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <LocalizationProvider dateAdapter={AdapterDayjs}>
                            <DateTimePicker label="Date & Time" value={mealDateTime} onChange={handleDateTimeChange} slotProps={{ textField: { fullWidth: true, size: "small" } }} disabled={isSaving || isDeleting} />
                        </LocalizationProvider>
                    </Grid>
                    <Grid item xs={12}>
                        <TextField fullWidth label="Meal Name/Description" variant="outlined" name="mealName" value={mealNameInput} onChange={handleInputChange} placeholder="E.g., Grilled Chicken Salad" size="small" disabled={isSaving || isDeleting} />
                    </Grid>

                    <Grid item xs={12}>
                        <FormControlLabel
                            control={<Checkbox checked={saveAsPreset} onChange={(e) => setSaveAsPreset(e.target.checked)} />}
                            label="Add Meal to Presets"
                        />

                        {saveAsPreset && (
                            <TextField
                                label="Preset Name"
                                value={presetNameInput}
                                onChange={(e) => {
                                    setPresetNameInput(e.target.value);
                                    if (presetNameError && e.target.value) {
                                        setPresetNameError('');
                                    }
                                }}
                                fullWidth
                                margin="normal"
                                required
                                error={!!presetNameError}
                                helperText={presetNameError}
                            />
                        )}
                    </Grid>

                    <Grid item xs={12}>
                        <Typography variant="subtitle1" gutterBottom>Ingredients</Typography>
                        {availableIngredientsError && <Alert severity="warning" sx={{ mb: 2 }}>Ingredient suggestions unavailable: {availableIngredientsError}</Alert>}
                        <Autocomplete
                            id="modal-ingredient-autocomplete"
                            freeSolo handleHomeEndKeys selectOnFocus
                            options={availableIngredients} getOptionLabel={(o) => o || ''} filterOptions={filterOptions}
                            loading={isLoadingAvailableIngredients} loadingText="Loading..."
                            value={null} inputValue={autocompleteInputValue}
                            onInputChange={(e, val) => setAutocompleteInputValue(val)}
                            onChange={(e, val, reason) => { if (val && (reason === 'selectOption' || reason === 'createOption')) handleAddIngredient(val); }}
                            disabled={isLoadingAvailableIngredients || !!availableIngredientsError || isLoadingCompliance || isSaving || isDeleting}
                            renderInput={(params) => (
                                <TextField {...params} inputRef={autocompleteInputRef} label="Add Ingredient" variant="outlined" size="small"
                                    InputProps={{ ...params.InputProps, endAdornment: (<>{isLoadingAvailableIngredients ? <CircularProgress color="inherit" size={20} /> : null}{params.InputProps.endAdornment}</>), }}
                                />
                            )}
                            ListboxProps={{ style: { maxHeight: 200 } }}
                        />
                        <Paper variant="outlined" sx={{ p: 1, mt: 2, maxHeight: '200px', overflowY: 'auto', minHeight: '60px' }}>
                            {ingredientsInput.split('\n').map(ing => ing.trim()).filter(ing => ing !== '').length === 0
                                ? <Typography variant="body2" color="textSecondary" textAlign="center" py={2}>No ingredients added yet</Typography>
                                : <Box>
                                    <Typography variant="caption" display="block" sx={{ mb: 1, fontStyle: 'italic', color: 'text.secondary' }}>Check box for newly introduced ingredients.</Typography>
                                    {ingredientsInput.split('\n').map(ing => ing.trim()).filter(ing => ing !== '').map((ingredient, index) => (
                                        <Tooltip key={`${ingredient}-${index}`} title={getIngredientChipProps(ingredient).title || ''} placement="top">
                                            <Box key={`${ingredient}-${index}-modal`} sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                                                <Tooltip title="Mark as newly introduced">
                                                    <Box component="span" sx={{ mr: 0.5 }}>
                                                        <Checkbox size="small" checked={newlyIntroducedSet.has(ingredient.toLowerCase())} onChange={(e) => handleToggleNewlyIntroduced(ingredient, e.target.checked)} disabled={isLoadingCompliance || isSaving || isDeleting} inputProps={{ 'aria-label': `Mark ${ingredient} as new` }} sx={{ padding: '2px', mr: 0.5 }} />
                                                    </Box>
                                                </Tooltip>
                                                <Chip {...getIngredientChipProps(ingredient)} size="small" onDelete={() => handleRemoveIngredient(ingredient)} disabled={isLoadingCompliance || isSaving || isDeleting} sx={{ mr: 0.5, flexGrow: 1 }} />
                                            </Box>
                                        </Tooltip>
                                    ))}
                                </Box>
                            }
                        </Paper>
                        {isLoadingCompliance && <LinearProgress sx={{ mt: 1 }} />}
                        {complianceData.results.length > 0 && !isLoadingCompliance && (
                            <Box sx={{ textAlign: 'right', mt: 1 }}>
                                <Typography variant="caption" sx={{ mr: 1 }}>Compliance:</Typography>
                                <Chip label={`${complianceData.score ?? 'N/A'}%`} size="small" color={getComplianceColor(complianceData.score)} />
                            </Box>
                        )}
                    </Grid>

                    <Grid item xs={12}>
                        <TextField label="Meal Notes (Optional)" multiline rows={3} fullWidth variant="outlined" size="small" name="mealNotes" value={mealNotes} onChange={handleInputChange} placeholder="Add notes about preparation, how you felt..." disabled={isSaving || isDeleting} />
                    </Grid>

                    <Grid item xs={12}>
                        <Accordion TransitionProps={{ unmountOnExit: true }} disabled={isSaving || isDeleting}>
                            <AccordionSummary expandIcon={<ChevronDown />} aria-controls="symptom-log-content" id="symptom-log-header">
                                <Typography variant="subtitle1" sx={{ display: 'flex', alignItems: 'center' }}><Activity size={18} style={{ marginRight: '8px' }} /> Log Symptoms (Optional)</Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                                <Box>
                                    {associatedSymptoms.length > 0 && (
                                        <Box mb={2}>
                                            <Typography variant="body2" sx={{ fontWeight: 'medium' }}>Symptoms Added:</Typography>
                                            <List dense>
                                                {associatedSymptoms.map((s) => (
                                                    <ListItem
                                                        key={s._id}
                                                        sx={{ pl: 0 }}
                                                        disabled={showAddSymptomForm && editingSymptomId !== null && editingSymptomId !== s._id}
                                                        secondaryAction={
                                                            <>
                                                                <Tooltip title="Edit symptom">
                                                                    <Box component="span" sx={{ mr: 0.5 }}>
                                                                        <IconButton
                                                                            edge="end"
                                                                            size="small"
                                                                            onClick={() => handleEditSymptomClick(s._id)}
                                                                            aria-label={`Edit symptom ${s.symptomName}`}
                                                                            disabled={isSaving || isDeleting || (showAddSymptomForm && editingSymptomId !== null && editingSymptomId !== s._id)}
                                                                        >
                                                                            <Edit size={16} />
                                                                        </IconButton>
                                                                    </Box>
                                                                </Tooltip>
                                                                <Tooltip title="Remove symptom">
                                                                    <Box component="span">
                                                                        <IconButton
                                                                            edge="end"
                                                                            size="small"
                                                                            onClick={() => handleRemoveSymptom(s._id)}
                                                                            aria-label={`Remove symptom ${s.symptomName}`}
                                                                            disabled={isSaving || isDeleting || showAddSymptomForm}
                                                                        >
                                                                            <Trash2 size={16} />
                                                                        </IconButton>
                                                                    </Box>
                                                                </Tooltip>
                                                            </>
                                                        }
                                                    >
                                                        <ListItemText
                                                            primary={s.symptomName === 'Other' ? s.customSymptomName : s.symptomName}
                                                            secondary={`Sev: ${s.severity}, Time: ${formatSymptomDateTime(s.occurredAt)}${s.notes ? ' ...' : ''}`}
                                                        />
                                                    </ListItem>
                                                ))}
                                            </List>
                                            <Divider sx={{ my: 1 }} />
                                        </Box>
                                    )}
                                    {!showAddSymptomForm && (
                                        <Button onClick={() => {
                                            setEditingSymptomId(null);
                                            setShowAddSymptomForm(true);
                                            setSaveError(null);
                                        }}
                                            startIcon={<Plus size={16} />}
                                            size="small"
                                            variant="outlined"
                                            disabled={isSaving || isDeleting}
                                        >
                                            Add New Symptom
                                        </Button>
                                    )}
                                    {showAddSymptomForm && (
                                        <Paper variant="outlined" sx={{ p: 2, mt: 1 }}>
                                            <Typography variant="body2" gutterBottom sx={{ fontWeight: 'medium' }}>
                                                {editingSymptomId ? 'Edit Symptom Details:' : 'New Symptom Details:'}
                                            </Typography>
                                            <Grid container spacing={2}>
                                                <Grid item xs={12} sm={editingSymptomId && currentSymptomInput.symptomName === 'Other' ? 6 : 12}>
                                                    <FormControl fullWidth size="small">
                                                        <InputLabel id="symp-type-lbl">Symptom Type</InputLabel>
                                                        <Select labelId="symp-type-lbl" name="symptomMasterId" value={currentSymptomInput.symptomMasterId} onChange={handleSymptomInputChange} label="Symptom Type">
                                                            <MenuItem value="" disabled><em>Select...</em></MenuItem>
                                                            {masterSymptoms.map(s => <MenuItem key={s._id} value={s._id}>{s.displayName}</MenuItem>)}
                                                        </Select>
                                                    </FormControl>
                                                </Grid>
                                                {currentSymptomInput.symptomName === 'Other' && (
                                                    <Grid item xs={12} sm={6}>
                                                        <TextField fullWidth size="small" label="Custom Symptom Name" name="customSymptomName" value={currentSymptomInput.customSymptomName} onChange={handleSymptomInputChange} required />
                                                    </Grid>
                                                )}
                                                <Grid item xs={12} sm={6}>
                                                    <Typography gutterBottom id="symp-sev-lbl">Severity (1-5)</Typography>
                                                    <Slider aria-labelledby="symp-sev-lbl" value={currentSymptomInput.severity} onChange={handleSymptomSeverityChange} step={1} marks min={1} max={5} valueLabelDisplay="auto" />
                                                </Grid>
                                                <Grid item xs={12} sm={6}>
                                                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                                                        <DateTimePicker label="Symptom Start Time" value={currentSymptomInput.occurredAt} onChange={handleSymptomDateTimeChange} slotProps={{ textField: { fullWidth: true, size: "small" } }} />
                                                    </LocalizationProvider>
                                                </Grid>
                                                <Grid item xs={12} sm={6}>
                                                    <FormControl fullWidth size="small">
                                                        <InputLabel id="symp-timing-lbl">Timing Relative To Meal</InputLabel>
                                                        <Select labelId="symp-timing-lbl" label="Timing Relative To Meal" name="timingRelativeToMeal" value={currentSymptomInput.timingRelativeToMeal || ''} onChange={handleSymptomInputChange}>
                                                            <MenuItem value={null}><em>Not Specified</em></MenuItem>
                                                            <MenuItem value="during">During</MenuItem>
                                                            <MenuItem value="within_30m">&lt; 30m</MenuItem>
                                                            <MenuItem value="30m_to_1h">30m-1h</MenuItem>
                                                            <MenuItem value="1h_to_3h">1-3h</MenuItem>
                                                            <MenuItem value="3h_to_6h">3-6h</MenuItem>
                                                            <MenuItem value="6h_to_12h">6-12h</MenuItem>
                                                            <MenuItem value="12h_to_24h">12-24h</MenuItem>
                                                            <MenuItem value="over_24h">&gt; 24h</MenuItem>
                                                        </Select>
                                                    </FormControl>
                                                </Grid>
                                                <Grid item xs={12} sm={6}>
                                                    <FormControl fullWidth size="small">
                                                        <InputLabel id="symp-dur-lbl">Duration</InputLabel>
                                                        <Select labelId="symp-dur-lbl" label="Duration" name="duration" value={currentSymptomInput.duration || ''} onChange={handleSymptomInputChange}>
                                                            <MenuItem value={null}><em>Not Specified</em></MenuItem>
                                                            <MenuItem value="under_1h">&lt; 1h</MenuItem>
                                                            <MenuItem value="1h_to_3h">1-3h</MenuItem>
                                                            <MenuItem value="3h_to_6h">3-6h</MenuItem>
                                                            <MenuItem value="half_day">~Half Day</MenuItem>
                                                            <MenuItem value="full_day">~Full Day</MenuItem>
                                                            <MenuItem value="ongoing">Ongoing</MenuItem>
                                                        </Select>
                                                    </FormControl>
                                                </Grid>
                                                <Grid item xs={12} sm={editingSymptomId && currentSymptomInput.location === 'other' ? 6 : 12}>
                                                    <FormControl fullWidth size="small">
                                                        <InputLabel id="symp-loc-lbl">Location</InputLabel>
                                                        <Select labelId="symp-loc-lbl" label="Location" name="location" value={currentSymptomInput.location || ''} onChange={handleSymptomInputChange}>
                                                            <MenuItem value={null}><em>N/A</em></MenuItem>
                                                            <MenuItem value="upper_abdomen">Upper Abd</MenuItem>
                                                            <MenuItem value="lower_abdomen">Lower Abd</MenuItem>
                                                            <MenuItem value="left_side_abdomen">Left Abd</MenuItem>
                                                            <MenuItem value="right_side_abdomen">Right Abd</MenuItem>
                                                            <MenuItem value="general_abdomen">General Abd</MenuItem>
                                                            <MenuItem value="chest">Chest</MenuItem>
                                                            <MenuItem value="head">Head</MenuItem>
                                                            <MenuItem value="joints">Joints</MenuItem>
                                                            <MenuItem value="skin">Skin</MenuItem>
                                                            <MenuItem value="other">Other</MenuItem>
                                                        </Select>
                                                    </FormControl>
                                                </Grid>
                                                {currentSymptomInput.location === 'other' && (
                                                    <Grid item xs={12} sm={6}>
                                                        <TextField fullWidth size="small" label="Custom Location" name="customLocation" value={currentSymptomInput.customLocation} onChange={handleSymptomInputChange} required />
                                                    </Grid>
                                                )}
                                                <Grid item xs={12}>
                                                    <TextField fullWidth multiline rows={2} size="small" label="Symptom Notes" name="notes" value={currentSymptomInput.notes} onChange={handleSymptomInputChange} />
                                                </Grid>
                                                <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                                                    <Button onClick={handleCancelSymptomEdit} size="small" color="secondary">
                                                        {editingSymptomId ? 'Cancel Edit' : 'Cancel Symptom'}
                                                    </Button>
                                                    <Button onClick={handleSaveSymptom} size="small" variant="contained">
                                                        {editingSymptomId ? 'Save Symptom' : 'Add Symptom'}
                                                    </Button>
                                                </Grid>
                                            </Grid>
                                        </Paper>
                                    )}
                                </Box>
                            </AccordionDetails>
                        </Accordion>
                    </Grid>
                </Grid>
            </DialogContent>
            <DialogActions sx={{ p: '16px 24px', justifyContent: isEditMode ? 'space-between' : 'flex-end' }}>
                {isEditMode && (
                    <Tooltip title={showAddSymptomForm && !!editingSymptomId ? "Finish symptom edit first" : ""}>
                        <Box component="span">
                            <Button
                                onClick={handleInternalDelete}
                                color="error" variant="outlined"
                                startIcon={isDeleting ? <CircularProgress size={18} color="inherit" /> : <Trash2 size={16} />}
                                disabled={isSaving || isDeleting || (showAddSymptomForm && !!editingSymptomId)}
                            >
                                {isDeleting ? 'Deleting...' : 'Delete Meal'}
                            </Button>
                        </Box>
                    </Tooltip>
                )}
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button onClick={onClose} color="secondary" disabled={isSaving || isDeleting}>
                        Cancel
                    </Button>
                    <Tooltip
                        title={showAddSymptomForm && !!editingSymptomId ? "Save or cancel symptom edit first" : ""}
                        disableHoverListener={!(showAddSymptomForm && !!editingSymptomId)}
                    >
                        <Box component="span">
                            <Button
                                onClick={handleInternalSave}
                                variant="contained"
                                color="primary"
                                startIcon={isSaving ? <CircularProgress size={18} color="inherit" /> : <Save size={18} />}
                                disabled={isSaving || isDeleting || isLoadingCompliance || (showAddSymptomForm && !!editingSymptomId)}
                            >
                                {isSaving ? 'Saving...' : (isEditMode ? 'Save Changes' : 'Log Meal')}
                            </Button>
                        </Box>
                    </Tooltip>
                </Box>
            </DialogActions>
        </Dialog>
    );
}

// Add this to your global CSS file or a relevant <style> block for MealFormModal
/*
.my-swal-popup {
  z-index: 1500 !important; 
}
.my-swal-container {
  z-index: 1500 !important; 
}
*/
