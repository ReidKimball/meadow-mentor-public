import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    TextField, Button, Typography, Box, Paper, Chip, FormControl, InputLabel,
    Select, MenuItem, IconButton, LinearProgress, Grid, Divider, Alert, List,
    ListItem, ListItemText, CircularProgress, Autocomplete, createFilterOptions,
    Dialog, DialogTitle, DialogContent, DialogActions, Tooltip, useTheme,
} from '@mui/material';
import { Save, X, Check, AlertCircle, Sparkles, HelpCircle } from 'lucide-react';
import dayjs from 'dayjs'; // Added import for dayjs
import { API_BASE_URL } from '../../../env-config'; // Assuming this is still relevant for any constants
import { useUser } from '../../../context/UserContext.jsx';
import IngredientsInput from '../../Common/IngredientsInput.jsx';
import { useDebounce } from '../../../hooks/useDebounce.js';
import { useUserFeedback } from '../../../context/UserFeedbackContext.jsx';

const DEFAULT_PRESET_STATE = {
    presetName: '',
    mealName: '',
    mealType: 'other', // Default mealType
    ingredients: [],
    diet_code: '', // Will be populated from user's diet or selection
    mealNotes: '',
    complianceSnapshot: null,
};

const filterOptionsAutocomplete = createFilterOptions({ // Renamed to avoid conflict if another filterOptions is needed
    matchFrom: 'any',
    stringify: (option) => option,
    trim: true,
});

const getComplianceColorForPreset = (score) => {
    if (score === null || score === undefined) return 'default';
    if (score >= 90) return 'success';
    if (score >= 70) return 'warning';
    return 'error';
};


const EditPresetModal = ({
    open,
    onClose,
    initialPresetData, // This will be the preset object to edit
    onUpdatePreset,    // Callback to handle the actual update logic
    // Props for IngredientsInput (if it fetches its own suggestions)
    // Or pass availableIngredients directly if PresetSelector fetches them
    availableIngredients = [], 
    fetchAvailableIngredients, // Optional: if IngredientsInput should fetch
    isLoadingAvailableIngredients = false,
    availableIngredientsError = null,
}) => {
    const theme = useTheme();
    const { user: userData, getFreshIdToken, userLoading } = useUser();
    const { showSnackbar } = useUserFeedback();

    const [presetNameInput, setPresetNameInput] = useState('');
    const [mealNameInput, setMealNameInput] = useState(''); // Optional, defaults to preset name
    const [selectedMealType, setSelectedMealType] = useState('other');
    const [currentPresetIngredients, setCurrentPresetIngredients] = useState([]); // NEW: array of strings
    const [ingredientAutocompleteInputValue, setIngredientAutocompleteInputValue] = useState(''); // NEW: for Autocomplete
    const [mealNotes, setMealNotes] = useState('');
    const [selectedDiet, setSelectedDiet] = useState('');

    const [complianceData, setComplianceData] = useState(DEFAULT_PRESET_STATE.complianceSnapshot);
    const [isLoadingCompliance, setIsLoadingCompliance] = useState(false);
    const [complianceError, setComplianceError] = useState(null);
    const [newlyIntroducedSet, setNewlyIntroducedSet] = useState(new Set());

    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState(null);
    const [presetNameError, setPresetNameError] = useState('');

    const debouncedPresetIngredientsString = useDebounce(currentPresetIngredients.join('\n'), 500); // NEW

    //const { userData } = useUser(); // To get default diet

    const filterOptions = createFilterOptions({
        matchFrom: 'any',
        stringify: (option) => option,
        trim: true,
    });

    useEffect(() => {
        if (open && initialPresetData) {
            setPresetNameInput(initialPresetData.presetName || '');
            setMealNameInput(initialPresetData.mealName || initialPresetData.presetName || '');
            setSelectedMealType(initialPresetData.mealType || 'other');
            setCurrentPresetIngredients(initialPresetData.ingredients || []); // NEW
            setMealNotes(initialPresetData.mealNotes || '');
            setSelectedDiet(initialPresetData.diet_code || userData?.therapeuticDiet || '');
            setComplianceData(initialPresetData.complianceSnapshot || null);
            setSaveError(null);
            setPresetNameError('');
            setIsLoadingCompliance(false);
            setIsSaving(false);
        } else if (!open) {
            // Optionally reset all state when modal closes to ensure fresh state next time
            // This might be good practice unless specific state needs to persist
        }
    }, [open, initialPresetData, userData?.therapeuticDiet]);

    const fetchComplianceCheckForPreset = useCallback(async (ingredientsArray, dietCode) => { // ingredients is now an array
        if (!ingredientsArray || ingredientsArray.length === 0 || !dietCode) {
            setComplianceData(null);
            setComplianceError(null);
            return;
        }
        setIsLoadingCompliance(true);
        setComplianceError(null);
        try {
            const token = await getFreshIdToken();
            const response = await fetch(`${API_BASE_URL}/api/foods/check-compliance`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ ingredients: ingredientsArray, diet_code: dietCode }) // Pass array directly
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            console.log("(EditPresetModal) Compliance check results:", data);
            setComplianceData(data);
            const currentNewlyIntroduced = new Set();
            data.results.forEach(result => {
                if (result.isNewlyIntroduced) {
                    currentNewlyIntroduced.add(result.ingredient.toLowerCase());
                }
            });
            setNewlyIntroducedSet(currentNewlyIntroduced);
        } catch (error) {
            console.error("(EditPresetModal) Error fetching compliance check:", error);
            setComplianceError(error.message || "Failed to check compliance.");
            setComplianceData(null);
        } finally {
            setIsLoadingCompliance(false);
        }
    }, [getFreshIdToken]);

    useEffect(() => {
        if (debouncedPresetIngredientsString && selectedDiet && open) {
            // Convert the debounced string back to an array for the API call
            const ingredientsArray = debouncedPresetIngredientsString.split('\n').map(ing => ing.trim()).filter(ing => ing);
            if (ingredientsArray.length > 0) {
                fetchComplianceCheckForPreset(ingredientsArray, selectedDiet);
            }
        } else if (!debouncedPresetIngredientsString && open) {
            setComplianceData(null); // Clear compliance if no ingredients
            setComplianceError(null);
        }
    }, [debouncedPresetIngredientsString, selectedDiet, fetchComplianceCheckForPreset, open]);

    const handleAddIngredientToPreset = (ingredient) => {
        if (ingredient && typeof ingredient === 'string' && ingredient.trim() !== '') {
            const trimmedIngredient = ingredient.trim();
            if (!currentPresetIngredients.find(ing => ing.toLowerCase() === trimmedIngredient.toLowerCase())) {
                setCurrentPresetIngredients(prevIngredients => [...prevIngredients, trimmedIngredient]);
            }
            setIngredientAutocompleteInputValue(''); // Clear the autocomplete input
        }
    };

    const handleRemoveIngredientFromPreset = (ingredientToRemove) => {
        setCurrentPresetIngredients(prevIngredients => 
            prevIngredients.filter(ing => ing.toLowerCase() !== ingredientToRemove.toLowerCase())
        );
    };

    const handleInternalUpdate = async () => {
        if (!presetNameInput.trim()) {
            setPresetNameError('Preset name is required.');
            return;
        }
        setPresetNameError('');
        if (currentPresetIngredients.length === 0) { // NEW check
            setSaveError('Ingredients list cannot be empty for a preset.');
            return;
        }
        setSaveError(null);
        setIsSaving(true);

        const updatedPresetPayload = {
            ...initialPresetData, // Keep original _id and other non-editable fields if any
            presetName: presetNameInput.trim(),
            mealName: mealNameInput.trim() || presetNameInput.trim(), // Fallback mealName
            mealType: selectedMealType,
            ingredients: currentPresetIngredients, // NEW: use the array directly
            diet_code: selectedDiet || userData?.therapeuticDiet,
            mealNotes: mealNotes.trim(),
            complianceSnapshot: (complianceData && complianceData.results && complianceData.results.length > 0) ? complianceData : null,
            lastModified: new Date().toISOString(), // Good practice to update lastModified timestamp
        };
        
        try {
            if (onUpdatePreset) {
                await onUpdatePreset(updatedPresetPayload);
                // Do not call onClose here. Parent (PresetDetailViewer) will handle it.
            }
            // If onUpdatePreset is successful, the parent (PresetDetailViewer) will call its own logic
            // which includes setIsEditModalOpen(false), effectively closing this modal.
        } catch (error) {
            console.error("(EditPresetModal) Error during onUpdatePreset callback:", error);
            setSaveError(error.message || 'Failed to update preset.');
            showSnackbar(error.message || 'Failed to update preset', 'error'); // Show error locally too
        } finally {
            setIsSaving(false);
            // No onClose() here either. Successful save closes via parent. Error keeps it open.
        }
    };
    
    const handleRequestClose = () => {
        if (isSaving) return; // Don't close if actively saving
        onClose(); // Call the original onClose from PresetDetailViewer
    };

    const complianceScore = useMemo(() => {
        if (!complianceData || !complianceData.results || complianceData.results.length === 0) return null;
        return complianceData.score;
    }, [complianceData]);

    const renderComplianceChip = (ingredientName, onDelete) => { // Accept onDelete callback
        const result = complianceData?.results?.find(r => r.ingredient.toLowerCase() === ingredientName.toLowerCase());
        const isNewlyIntroduced = newlyIntroducedSet.has(ingredientName.toLowerCase());
        let chipColor = 'default';
        let chipLabel = ingredientName;
        let chipIcon = null;
        let tooltipTitle = `Compliance for ${ingredientName}`; 

        if (result) {
            chipColor = getComplianceColorForPreset(result.score);
            tooltipTitle = `${result.reason || ingredientName}`; 
            if (result.score < 70 && result.score >= 0) chipIcon = <AlertCircle size={15} style={{ marginRight: '4px' }} />;
            else if (result.score > 0) chipIcon = <Check size={15} style={{ marginRight: '4px' }} />;
            else chipIcon = <HelpCircle size={15} style={{ marginRight: '4px' }} />;
        } else if (isLoadingCompliance) {
            chipLabel = `${ingredientName} (Checking...)`;
            chipIcon = <CircularProgress size={13} color="inherit" sx={{ mr: 0.5}} />;
        } else {
            tooltipTitle = `${ingredientName} (Compliance not checked yet or no data)`;
            chipIcon = <HelpCircle size={15} style={{ marginRight: '4px' }} />;
        }

        if (isNewlyIntroduced) {
            chipIcon = (
                <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', mr: 0.5 }}>
                    {chipIcon}
                    <Sparkles size={14} style={{ color: theme.palette.warning.main }} />
                </Box>
            );
            tooltipTitle += ' (Newly Introduced)';
        }

        return (
            <Tooltip title={tooltipTitle} placement="top" arrow>
                <Chip
                    icon={chipIcon}
                    label={chipLabel}
                    color={chipColor}
                    size="small"
                    onDelete={onDelete} // Use the passed onDelete handler
                    disabled={isSaving || isLoadingCompliance}
                />
            </Tooltip>
        );
    };

    return (
        <Dialog 
            open={open} 
            onClose={handleRequestClose} // Use handleRequestClose for explicit close actions
            maxWidth="md" 
            fullWidth
            PaperProps={{ sx: { borderRadius: 2, height: '95vh', maxHeight: '800px' } }} // Adjusted max height
        >
            <DialogTitle sx={{ pb: 1, borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h5">Edit Meal Preset</Typography>
                <IconButton onClick={onClose} size="small" disabled={isSaving}>
                    <X size={20} />
                </IconButton>
            </DialogTitle>
            <DialogContent dividers>
                {saveError && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setSaveError(null)}>{saveError}</Alert>}
                
                <form onSubmit={(e) => { e.preventDefault(); handleInternalUpdate(); }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, p:0.5 }}>
                        <Grid container spacing={2}>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    label="Preset Name"
                                    fullWidth
                                    variant="outlined"
                                    value={presetNameInput}
                                    onChange={(e) => {
                                        setPresetNameInput(e.target.value);
                                        if (presetNameError && e.target.value) setPresetNameError('');
                                    }}
                                    required
                                    error={!!presetNameError}
                                    helperText={presetNameError || "The name you'll see in your list of presets."}
                                    disabled={isSaving}
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    label="Meal Name / Description"
                                    fullWidth
                                    variant="outlined"
                                    value={mealNameInput}
                                    onChange={(e) => setMealNameInput(e.target.value)}
                                    helperText="A brief description of the meal (e.g., 'Chicken and Veggie Stir-fry')."
                                    disabled={isSaving}
                                />
                            </Grid>
                        </Grid>

                        <Grid container spacing={2}>
                            <Grid item xs={12} md={6}>
                                <FormControl fullWidth variant="outlined" disabled={isSaving}>
                                    <InputLabel id="preset-meal-type-label">Meal Type</InputLabel>
                                    <Select
                                        labelId="preset-meal-type-label"
                                        value={selectedMealType}
                                        onChange={(e) => setSelectedMealType(e.target.value)}
                                        label="Meal Type"
                                    >
                                        <MenuItem value="breakfast">Breakfast</MenuItem>
                                        <MenuItem value="lunch">Lunch</MenuItem>
                                        <MenuItem value="dinner">Dinner</MenuItem>
                                        <MenuItem value="snack">Snack</MenuItem>
                                        <MenuItem value="dessert">Dessert</MenuItem>
                                        <MenuItem value="other">Other</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>                            
                        </Grid>
                        
                        {/* NEW Autocomplete for adding ingredients */}
                        <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>Ingredients</Typography>
                        {availableIngredientsError && <Alert severity="warning" sx={{ mb: 2 }}>Ingredient suggestions unavailable: {availableIngredientsError}</Alert>}
                        <Autocomplete
                            id="edit-preset-ingredient-autocomplete"
                            freeSolo
                            handleHomeEndKeys
                            selectOnFocus
                            options={availableIngredients}
                            getOptionLabel={(option) => option || ''}
                            filterOptions={filterOptions}
                            loading={isLoadingAvailableIngredients}
                            loadingText="Loading ingredient suggestions..."
                            value={null} // Controlled by inputValue, clears on selection
                            inputValue={ingredientAutocompleteInputValue}
                            onInputChange={(event, newValue) => {
                                setIngredientAutocompleteInputValue(newValue);
                            }}
                            onChange={(event, newValue, reason) => {
                                if (newValue && (reason === 'selectOption' || reason === 'createOption')) {
                                    handleAddIngredientToPreset(newValue);
                                }
                            }}
                            disabled={isLoadingAvailableIngredients || !!availableIngredientsError || isSaving}
                            renderInput={(params) => (
                                <TextField 
                                    {...params} 
                                    label="Add Ingredient to Preset"
                                    variant="outlined" 
                                    size="small"
                                    placeholder="Type or select an ingredient"
                                    InputProps={{
                                        ...params.InputProps,
                                        endAdornment: (
                                            <>
                                                {isLoadingAvailableIngredients ? <CircularProgress color="inherit" size={20} /> : null}
                                                {params.InputProps.endAdornment}
                                            </>
                                        ),
                                    }}
                                />
                            )}
                            ListboxProps={{ style: { maxHeight: 200 } }}
                            sx={{ mb: 2 }}
                        />
                        
                        <Paper variant="outlined" sx={{ p: 2, opacity: (isLoadingCompliance || !complianceData) ? 0.7 : 1, minHeight: '100px' }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
                                    Preset Compliance Overview
                                </Typography>
                                {complianceScore !== null && (
                                    <Chip
                                        label={`Overall Score: ${complianceScore.toFixed(0)}%`}
                                        color={getComplianceColorForPreset(complianceScore)}
                                        size="small"
                                        sx={{ fontWeight: 'bold' }}
                                    />
                                )}
                            </Box>
                            {isLoadingCompliance && <LinearProgress sx={{ mb: 1 }} />}
                            {complianceError && <Alert severity="error" sx={{ mb: 1 }}>{complianceError}</Alert>}
                            {!isLoadingCompliance && !complianceError && complianceData && complianceData.results && complianceData.results.length > 0 && (
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                    {currentPresetIngredients.map((ingredientName, index) => ( // Iterate over currentPresetIngredients
                                        <React.Fragment key={`${ingredientName}-${index}`}> {/* Ensure unique key if names can repeat, though add logic prevents it */}
                                            {renderComplianceChip(ingredientName, () => handleRemoveIngredientFromPreset(ingredientName))} {/* Pass onDelete handler */}
                                        </React.Fragment>
                                    ))}
                                </Box>
                            )}
                            {!isLoadingCompliance && !complianceError && currentPresetIngredients.length === 0 && (
                                <Typography variant="body2" color="text.secondary">
                                    No ingredients added to this preset yet. Add ingredients using the field above.
                                </Typography>
                            )}
                            {!isLoadingCompliance && !complianceError && complianceData && complianceData.results && complianceData.results.length === 0 && currentPresetIngredients.length > 0 && (
                                <Typography variant="body2" color="text.secondary">
                                    Enter ingredients to see compliance details.
                                </Typography>
                            )}
                             
                        </Paper>

                        <TextField
                            label="Preset Notes (Optional)"
                            multiline
                            rows={3}
                            fullWidth
                            variant="outlined"
                            value={mealNotes}
                            onChange={(e) => setMealNotes(e.target.value)}
                            placeholder="Any specific preparation notes, variations, or reminders for this preset."
                            disabled={isSaving}
                        />
                    </Box>
                </form>
            </DialogContent>
            <DialogActions sx={{ p: 2, borderTop: '1px solid #eee' }}>
                <Button onClick={onClose} color="inherit" disabled={isSaving}>Cancel</Button>
                <Button 
                    onClick={handleInternalUpdate} 
                    variant="contained" 
                    color="primary" 
                    disabled={isSaving || isLoadingCompliance || !presetNameInput.trim()}
                    startIcon={isSaving ? <CircularProgress size={20} color="inherit" /> : <Save size={18} />}
                >
                    {isSaving ? 'Updating Preset...' : 'Save Preset Changes'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default EditPresetModal;
