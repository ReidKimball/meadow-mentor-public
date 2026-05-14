import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Box,
    Typography,
    IconButton,
    TextField,
    FormGroup,
    FormControlLabel,
    Checkbox,
    Stack,
    Tooltip,
} from '@mui/material';
import { Add, Remove, Close } from '@mui/icons-material';

const MealPlannerSettings = ({ open, onClose, onSave, initialSettings }) => {
    const [settings, setSettings] = useState({
        planDuration: 7,
        includedMealTypes: {
            breakfast: true,
            lunch: true,
            dinner: true,
            snack: true,
        },
        dynamicPreferences: '',
    });

    // Load initial settings when modal opens
    useEffect(() => {
        if (initialSettings) {
            setSettings(initialSettings);
        }
    }, [initialSettings, open]);

    const handleDurationChange = (delta) => {
        setSettings((prev) => ({
            ...prev,
            planDuration: Math.max(1, Math.min(14, prev.planDuration + delta)),
        }));
    };

    const handleMealTypeToggle = (mealType) => {
        setSettings((prev) => ({
            ...prev,
            includedMealTypes: {
                ...prev.includedMealTypes,
                [mealType]: !prev.includedMealTypes[mealType],
            },
        }));
    };

    const handlePreferencesChange = (event) => {
        setSettings((prev) => ({
            ...prev,
            dynamicPreferences: event.target.value,
        }));
    };

    const handleSave = () => {
        onSave(settings);
        onClose();
    };

    const handleCancel = () => {
        // Reset to initial settings
        if (initialSettings) {
            setSettings(initialSettings);
        }
        onClose();
    };

    return (
        <Dialog
            open={open}
            onClose={handleCancel}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                sx: { borderRadius: 3 },
            }}
        >
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
                <Typography variant="h5" component="span" sx={{ fontWeight: 'bold' }}>
                    Meal Plan Settings
                </Typography>
                <Tooltip title="Close" arrow>
                    <IconButton onClick={handleCancel} size="small">
                        <Close />
                    </IconButton>
                </Tooltip>
            </DialogTitle>

            <DialogContent dividers>
                <Stack spacing={3}>
                    {/* Plan Duration Stepper */}
                    <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                            Plan Duration
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Tooltip title="Decrease days" arrow>
                                <span>
                                    <IconButton
                                        onClick={() => handleDurationChange(-1)}
                                        disabled={settings.planDuration <= 1}
                                        sx={{
                                            border: 1,
                                            borderColor: 'divider',
                                            '&:hover': { bgcolor: 'action.hover' },
                                        }}
                                    >
                                        <Remove />
                                    </IconButton>
                                </span>
                            </Tooltip>
                            <Box
                                sx={{
                                    minWidth: 80,
                                    textAlign: 'center',
                                    py: 1.5,
                                    px: 3,
                                    border: 2,
                                    borderColor: 'primary.main',
                                    borderRadius: 2,
                                    bgcolor: 'primary.50',
                                }}
                            >
                                <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                                    {settings.planDuration}
                                </Typography>
                            </Box>
                            <Tooltip title="Increase days" arrow>
                                <span>
                                    <IconButton
                                        onClick={() => handleDurationChange(1)}
                                        disabled={settings.planDuration >= 14}
                                        sx={{
                                            border: 1,
                                            borderColor: 'divider',
                                            '&:hover': { bgcolor: 'action.hover' },
                                        }}
                                    >
                                        <Add />
                                    </IconButton>
                                </span>
                            </Tooltip>
                            <Typography variant="body1" color="text.secondary">
                                {settings.planDuration === 1 ? 'day' : 'days'}
                            </Typography>
                        </Box>
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                            Choose between 1-14 days
                        </Typography>
                    </Box>

                    {/* Meal Types */}
                    <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                            Include Meal Types
                        </Typography>
                        <FormGroup>
                            {['breakfast', 'lunch', 'dinner', 'snack'].map((mealType) => (
                                <FormControlLabel
                                    key={mealType}
                                    control={
                                        <Checkbox
                                            checked={settings.includedMealTypes[mealType]}
                                            onChange={() => handleMealTypeToggle(mealType)}
                                        />
                                    }
                                    label={mealType.charAt(0).toUpperCase() + mealType.slice(1)}
                                />
                            ))}
                        </FormGroup>
                    </Box>

                    {/* Dynamic Preferences */}
                    <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                            Special Preferences (Optional)
                        </Typography>
                        <TextField
                            fullWidth
                            multiline
                            rows={3}
                            value={settings.dynamicPreferences}
                            onChange={handlePreferencesChange}
                            placeholder="e.g., quick meals, use up chicken, low prep time"
                            variant="outlined"
                        />
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                            Add any special requests or preferences for meal generation
                        </Typography>
                    </Box>
                </Stack>
            </DialogContent>

            <DialogActions sx={{ px: 3, py: 2 }}>
                <Tooltip title="Discard changes" arrow>
                    <Button onClick={handleCancel} variant="outlined">
                        Cancel
                    </Button>
                </Tooltip>
                <Tooltip title="Save and apply settings" arrow>
                    <Button onClick={handleSave} variant="contained">
                        Save Settings
                    </Button>
                </Tooltip>
            </DialogActions>
        </Dialog>
    );
};

export default MealPlannerSettings;
