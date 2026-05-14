import React from 'react';
import { Box, Typography, Autocomplete, TextField, CircularProgress, Button } from '@mui/material';
import { useUser } from '../../../context/UserContext';

export const defaultSteps = [
    {
        label: "Welcome & Validation",
        title: (user) => `${user?.firstName || 'Friend'}, you're taking a powerful step for your health.`,
        description: "We know starting a therapeutic diet can feel overwhelming, especially when you're not feeling your best. This guide will help you select your diet and restrictions. You can do this.",
        cta: "Let's Get Started"
    },
    {
        label: "Let's Tailor Your Path",
        title: "To provide perfectly aligned guidance, just confirm your diet plan:",
        content: ({
            selectedPrimaryDiet, setSelectedPrimaryDiet,
            selectedRestrictions, setSelectedRestrictions,
            conditionTreating, setConditionTreating,
            availablePrimaryDiets, filteredRestrictions, availableConditions,
            dietsLoading, conditionsLoading,
            updateError,
            restrictionInputValue, setRestrictionInputValue
        }) => (
            <Box sx={{ mt: 2 }}>
                <Autocomplete
                    options={availablePrimaryDiets}
                    getOptionLabel={(option) => option.diet_name || ''}
                    value={availablePrimaryDiets.find(d => d.diet_code === selectedPrimaryDiet) || null}
                    onChange={(event, newValue) => {
                        setSelectedPrimaryDiet(newValue ? newValue.diet_code : '');
                    }}
                    loading={dietsLoading}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            label="Select Your Primary Diet"
                            variant="outlined"
                            InputProps={{
                                ...params.InputProps,
                                endAdornment: (
                                    <React.Fragment>
                                        {dietsLoading ? <CircularProgress color="inherit" size={20} /> : null}
                                        {params.InputProps.endAdornment}
                                    </React.Fragment>
                                ),
                            }}
                        />
                    )}
                />
                <Autocomplete
                    sx={{ mt: 2 }}
                    multiple
                    freeSolo
                    disableCloseOnSelect
                    options={filteredRestrictions}
                    getOptionLabel={(option) => option.diet_name || option}
                    value={selectedRestrictions}
                    inputValue={restrictionInputValue}
                    onInputChange={(event, newInputValue) => {
                        setRestrictionInputValue(newInputValue);
                    }}
                    onChange={(event, newValue) => {
                        const newValues = newValue.map(option => {
                            // If the option is a string, it's a custom value.
                            // If it's an object, it's a predefined diet, so we use its diet_code.
                            return typeof option === 'string' ? option : option.diet_code;
                        });
                        setSelectedRestrictions(newValues);
                    }}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            label="Select or Add Restrictions (e.g., Dairy-Free, tomatoes)"
                            variant="outlined"
                            helperText="You can select from the list or type your own. Press Enter, Comma, or Click to add."
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ',' || e.key === 'Tab') {
                                    if (restrictionInputValue.trim()) {
                                        e.preventDefault();
                                        // avoid adding duplicates
                                        if (!selectedRestrictions.includes(restrictionInputValue.trim())) {
                                            setSelectedRestrictions([...selectedRestrictions, restrictionInputValue.trim()]);
                                        }
                                        setRestrictionInputValue('');
                                    }
                                }
                            }}
                        />
                    )}
                />
                <Autocomplete
                    sx={{ mt: 2 }}
                    options={availableConditions.map(c => c.condition_name)}
                    value={conditionTreating}
                    onChange={(event, newValue) => {
                        setConditionTreating(newValue);
                    }}
                    loading={conditionsLoading}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            label="Select Your Health Condition"
                            variant="outlined"
                            InputProps={{
                                ...params.InputProps,
                                endAdornment: (
                                    <React.Fragment>
                                        {conditionsLoading ? <CircularProgress color="inherit" size={20} /> : null}
                                        {params.InputProps.endAdornment}
                                    </React.Fragment>
                                ),
                            }}
                        />
                    )}
                />
                {updateError && (
                    <Typography color="error" sx={{ mt: 2 }}>
                        {updateError}
                    </Typography>
                )}
            </Box>
        ),
        cta: "Create My Plan"
    },
    {
        label: "Let's Get Your First Recipe",
        title: (user) => `Your ${user?.primaryDiet || 'new'} plan is ready!`,
        content: ({ user, navigateToFirstWin }) => {
            const primaryDiet = user?.primaryDiet || 'new';
            return (
                <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Button variant="contained" color="primary" onClick={() => navigateToFirstWin('/ask-kay')}>
                        {`Get first ${primaryDiet} recipe from Chef Kay`}
                    </Button>
                    {/* <Button variant="contained" color="primary" onClick={() => navigateToFirstWin('/shopping-list')}>
                        {`Build my first shopping list for ${primaryDiet}`}
                    </Button> */}
                    {/* <Button variant="contained" color="primary" onClick={() => navigateToFirstWin('/first-yes-foods')}>
                        {`See my top 5 'Yes' foods for ${primaryDiet}`}
                    </Button> */}
                </Box>
            );
        },
        cta: null
    },
];

// You can define other step arrays for different diets here if needed
// export const scdSteps = [ ... ];
// export const aipSteps = [ ... ];

// For now, we'll just export a single object containing the step arrays
export const dietSteps = {
    default: defaultSteps,
    // Add other diets here, e.g.,
    // "Specific Carbohydrate Diet (SCD)": scdSteps,
};