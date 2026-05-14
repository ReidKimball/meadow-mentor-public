import React, { useState } from 'react';
import DateRangeComplianceScore from './DateRangeComplianceScore';
import {
    Box, Paper, Typography, List, ListItemButton, ListItemText, Chip,
    CircularProgress, Alert, Grid, Button, Tooltip, useTheme, alpha,
    Divider, Avatar, ListItemAvatar, Tabs, Tab
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import { Calendar, BrainCircuit, Plus, Lock, Coffee, UtensilsCrossed, 
    SunMedium, Salad, UtensilsIcon, Star } from 'lucide-react';
import dayjs from 'dayjs';

// Helper functions
const formatMealDateTime = (dateTimeString) => {
    if (!dateTimeString) return 'N/A';
    return dayjs(dateTimeString).format('MMM D, YYYY h:mm A');
};

const getComplianceColor = (score) => {
    if (score === null || score === undefined) return 'default';
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'error';
};

// Get meal type icon based on meal type
const getMealTypeIcon = (mealType) => {
    switch(mealType.toLowerCase()) {
        case 'breakfast':
            return <Coffee size={20} />;
        case 'lunch':
            return <SunMedium size={20} />;
        case 'dinner':
            return <UtensilsCrossed size={20} />;
        case 'snack':
            return <Salad size={20} />;
        default:
            return <UtensilsIcon size={20} />;
    }
};

// Placeholder for preset icon, can be customized later
const getPresetIcon = () => <Star size={20} />;

export default function MealHistoryList({
    meals,
    totalMealCount,
    selectedMealId,
    onSelectMeal,
    isLoading,
    error,
    dateRange,
    onDateRangeChange,
    onAnalyze,
    isAiLoading,
    userData,
    onLogNewMeal,
    isUserDataLoading,
    userDataError,
    isSubscriber,
    isUserLoading,
    handleLockedFeatureClick,
    presets,
    isLoadingPresets,
    presetsError,
    onSelectPreset,
    selectedPresetId,
    totalPresetCount,
}) {
    const theme = useTheme();
    const [activeTab, setActiveTab] = useState('meals');

    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
    };

    // Determine message based on loading, error, and meal counts
    let mealsContent;
    if (isLoading) {
        mealsContent = (
            <Box sx={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                flexDirection: 'column', 
                py: 4 
            }}>
                <CircularProgress size={36} thickness={4} />
                <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>
                    Loading meal history...
                </Typography>
            </Box>
        );
    } else if (error) {
        mealsContent = (
            <Alert 
                severity="error"
                sx={{ 
                    borderRadius: 2,
                    my: 2 
                }}
            >
                {error}
            </Alert>
        );
    } else if (totalMealCount === 0) {
        mealsContent = (
            <Box 
                sx={{ 
                    textAlign: 'center', 
                    py: 6,
                    px: 2,
                    bgcolor: alpha(theme.palette.primary.light, 0.05),
                    borderRadius: 2
                }}
            >
                <Typography variant="body1" sx={{ mb: 2, color: 'text.secondary' }}>
                    No meals logged yet.
                </Typography>
                <Button 
                    variant="outlined" 
                    color="primary"
                    onClick={onLogNewMeal}
                    startIcon={<Plus size={18} />}
                    sx={{ 
                        borderRadius: '20px',
                        px: 3
                    }}
                >
                    Log Your First Meal
                </Button>
            </Box>
        );
    } else if (meals.length === 0 && activeTab === 'meals') {
        mealsContent = (
            <Box 
                sx={{ 
                    textAlign: 'center', 
                    py: 4,
                    px: 2,
                    bgcolor: alpha(theme.palette.primary.light, 0.05),
                    borderRadius: 2
                }}
            >
                <Typography sx={{ color: 'text.secondary' }}>
                    No meals found in the selected date range.
                </Typography>
            </Box>
        );
    } else {
        mealsContent = (
            <List 
                dense 
                sx={{ 
                    maxHeight: { xs: '350px', md: '600px' }, 
                    overflowY: 'auto', 
                    pr: 1,
                    pb: 0,
                    pt: 0.5,
                    mt: 1,
                    '&::-webkit-scrollbar': {
                        width: '6px',
                    },
                    '&::-webkit-scrollbar-thumb': {
                        backgroundColor: alpha(theme.palette.primary.main, 0.2),
                        borderRadius: '3px',
                    },
                    '&::-webkit-scrollbar-track': {
                        backgroundColor: alpha(theme.palette.primary.main, 0.05),
                        borderRadius: '3px',
                    },
                }}
            >
                {meals.map((meal) => (
                    <ListItemButton
                        key={meal._id}
                        onClick={() => onSelectMeal(meal._id)}
                        selected={selectedMealId === meal._id}
                        sx={{ 
                            mb: 1, 
                            borderRadius: 2,
                            transition: 'all 0.2s ease',
                            border: '1px solid',
                            borderColor: selectedMealId === meal._id 
                                ? theme.palette.primary.main 
                                : alpha(theme.palette.divider, 0.5),
                            '&.Mui-selected': {
                                backgroundColor: alpha(theme.palette.primary.main, 0.08),
                                '&:hover': {
                                    backgroundColor: alpha(theme.palette.primary.main, 0.12)
                                }
                            },
                            '&:hover': {
                                backgroundColor: alpha(theme.palette.primary.main, 0.04),
                                transform: 'translateY(-1px)',
                                boxShadow: theme.shadows[1]
                            }
                        }}
                    >
                        <ListItemAvatar>
                            <Avatar 
                                sx={{ 
                                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                                    color: theme.palette.primary.main
                                }}
                            >
                                {getMealTypeIcon(meal.mealType)}
                            </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                            primary={
                                <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                                    {meal.mealName}
                                </Typography>
                            }
                            secondary={
                                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                                    {formatMealDateTime(meal.mealDateTime)}
                                </Typography>
                            }
                        />
                        <Chip 
                            label={meal.complianceSnapshot?.score !== null && meal.complianceSnapshot?.score !== undefined 
                                ? `${Math.round(meal.complianceSnapshot.score)}%` 
                                : 'N/A'}
                            color={getComplianceColor(meal.complianceSnapshot?.score)}
                            size="small" 
                            sx={{ fontWeight: 500, fontSize: '0.75rem' }}
                        />
                    </ListItemButton>
                ))}
            </List>
        );
    }

    let presetsContent;
    if (isLoadingPresets) {
        presetsContent = (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', py: 4 }}>
                <CircularProgress size={36} thickness={4} />
                 <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>
                    Loading presets...
                </Typography>
            </Box>
        );
    } else if (presetsError) {
        presetsContent = <Alert severity="error" sx={{ borderRadius: 2, my: 2 }}>{presetsError}</Alert>;
    } else if (totalPresetCount === 0) {
         presetsContent = (
            <Box sx={{ textAlign: 'center', py: 6, px: 2, bgcolor: alpha(theme.palette.secondary.light, 0.05), borderRadius: 2 }}>
                <Typography variant="body1" sx={{ mb: 2, color: 'text.secondary' }}>
                    No meal presets saved yet.
                </Typography>
                {/* Optionally, add a button to guide users to create presets if applicable */}
            </Box>
        );
    } else if (!presets || presets.length === 0) {
        presetsContent = (
            <Box sx={{ textAlign: 'center', py: 4, px: 2, bgcolor: alpha(theme.palette.secondary.light, 0.05), borderRadius: 2 }}>
                <Typography sx={{ color: 'text.secondary' }}>
                    No presets found.
                </Typography>
            </Box>
        );
    } else {
        presetsContent = (
            <List 
                dense 
                sx={{ 
                    maxHeight: { xs: '350px', md: '600px' }, 
                    overflowY: 'auto', 
                    pr: 1, 
                    pb: 0, 
                    pt: 0.5, 
                    mt: 1,
                     '&::-webkit-scrollbar': { width: '6px' },
                    '&::-webkit-scrollbar-thumb': { backgroundColor: alpha(theme.palette.secondary.main, 0.2), borderRadius: '3px' },
                    '&::-webkit-scrollbar-track': { backgroundColor: alpha(theme.palette.secondary.main, 0.05), borderRadius: '3px' },
                }}
            >
                {presets.map((preset) => (
                    <ListItemButton
                        key={preset._id}
                        onClick={() => onSelectPreset(preset._id)}
                        selected={selectedPresetId === preset._id}
                        sx={{ 
                            mb: 1, 
                            borderRadius: 2,
                            transition: 'all 0.2s ease',
                            border: '1px solid',
                            borderColor: selectedPresetId === preset._id 
                                ? theme.palette.secondary.main 
                                : alpha(theme.palette.divider, 0.5),
                            '&.Mui-selected': {
                                backgroundColor: alpha(theme.palette.secondary.main, 0.08),
                                '&:hover': {
                                    backgroundColor: alpha(theme.palette.secondary.main, 0.12)
                                }
                            },
                            '&:hover': {
                                backgroundColor: alpha(theme.palette.secondary.main, 0.04),
                                transform: 'translateY(-1px)',
                                boxShadow: theme.shadows[1]
                            }
                        }}
                    >
                        <ListItemAvatar>
                            <Avatar 
                                sx={{ 
                                    bgcolor: alpha(theme.palette.secondary.main, 0.1),
                                    color: theme.palette.secondary.main
                                }}
                            >
                                {getPresetIcon()}
                            </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                            primary={
                                <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                                    {preset.presetName} 
                                </Typography>
                            }
                            secondary={
                                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                                    {/* You might want to display diet code or number of ingredients */}
                                    {preset.dietCode ? `Diet: ${preset.dietCode}` : (preset.ingredients ? `${preset.ingredients.length} ingredients` : '')}
                                </Typography>
                            }
                        />
                        {/* Optionally, add a chip or other info for presets */}
                    </ListItemButton>
                ))}
            </List>
        );
    }

    const datePickerDisabled = isLoading || isUserLoading || !isSubscriber;
    const datePickerTooltipTitle = !isSubscriber ? "Upgrade to Premium to select custom date ranges" : "";

    const analyzeButtonDisabled = isLoading || isAiLoading || !dateRange.startDate || !dateRange.endDate || isUserLoading || !userData?.therapeuticDiet || !isSubscriber;
    const analyzeButtonTooltipTitle = !isSubscriber ? "Upgrade to Premium for AI Analysis" : "";

    return (
        <Paper 
            elevation={2} 
            sx={{ 
                p: { xs: 1.5, sm: 2 }, 
                borderRadius: 3, 
                display: 'flex', 
                flexDirection: 'column', 
                height: '100%',
                overflow: 'hidden'
            }}
        >
            <Tabs
                value={activeTab}
                onChange={handleTabChange}
                indicatorColor={activeTab === 'meals' ? "primary" : "secondary"}
                textColor={activeTab === 'meals' ? "primary" : "secondary"}
                variant="fullWidth"
                sx={{ 
                    mb: 1,
                    borderBottom: 1,
                    borderColor: 'divider',
                    '& .MuiTab-root': { 
                        minHeight: '48px', 
                        textTransform: 'none', 
                        fontWeight: 500,
                        fontSize: '0.95rem',
                     },
                     '& .Mui-selected': {
                        // This will be overridden by textColor="primary" or textColor="secondary" directly on Tabs
                    },
                }}
            >
                <Tab label="Meals" value="meals" />
                <Tab label="Presets" value="presets" />
            </Tabs>

            {activeTab === 'meals' && (
                <>
                    <Box sx={{ mb: 2, mt: 1, px: { xs: 0, sm: 1 } }}>
                    {totalMealCount > 0 && !error && !isLoading && (
                         <DateRangeComplianceScore 
                         mealsInRange={meals} 
                         isLoading={isLoading} 
                            sx={{ mb: 1.5, px: { xs: 0.5, sm: 1} }}
                        />
                    )}
                    </Box>
                    <Grid container spacing={1} alignItems="stretch" sx={{ mb: 1.5, mt: 1, px: { xs: 0, sm: 1 } }}>
                        <Grid item xs={12} sm={6} md sx={{ flexGrow: 1 }}>
                            <DatePicker
                                label="Start Date"
                                value={dateRange.startDate}
                                onChange={(newValue) => onDateRangeChange(newValue, 'start')}
                                slotProps={{ textField: { fullWidth: true, size: 'small' } }}
                                maxDate={dateRange.endDate || undefined}
                                disabled={isLoading || isUserLoading}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md sx={{ flexGrow: 1 }}>
                            <DatePicker
                                label="End Date"
                                value={dateRange.endDate}
                                onChange={(newValue) => onDateRangeChange(newValue, 'end')}
                                slotProps={{ textField: { fullWidth: true, size: 'small' } }}
                                minDate={dateRange.startDate || undefined}
                                disabled={isLoading || isUserLoading}
                            />
                        </Grid>
                        
                        {/* Log New Meal Button - Added Here */}
                        <Grid item xs={12} sm={6} md="auto">
                            <Button
                                variant="outlined"
                                color="primary"
                                fullWidth
                                onClick={onLogNewMeal}
                                startIcon={<Plus size={18} />}
                                disabled={isUserDataLoading || isLoading || isUserLoading} 
                                sx={{ borderRadius: '20px', height: '100%' }}
                            >
                                Log Meal
                            </Button>
                        </Grid>

                        {isSubscriber && (
                            <Grid item xs={12} sm={6} md="auto">
                                <Tooltip title={!userData?.therapeuticDiet ? "Set your diet in profile to enable analysis" : "Analyze meals in the selected date range with AI"}>
                                    <span> {/* Span for Tooltip when button is disabled */}
                                        <Button
                                            variant="outlined"
                                            color="secondary"
                                            fullWidth
                                            onClick={onAnalyze}
                                            startIcon={<BrainCircuit size={18} />}
                                            disabled={isAiLoading || !userData?.therapeuticDiet || isLoading || meals.length === 0 || isUserLoading}
                                            sx={{ borderRadius: '20px', height: '100%' }}
                                        >
                                            Analyze Meals
                                        </Button>
                                    </span>
                                </Tooltip>
                            </Grid>
                        )}
                    </Grid>
                    <Divider sx={{ my: 1 }} />
                    {/* Logged Meals List based on date range */}
                    {mealsContent}
                </>
            )}

            {activeTab === 'presets' && (
                <>
                    <Box sx={{ display: 'flex', alignItems: 'center', px: { xs: 0.5, sm: 1}, mb: 1.5, mt: 1 }}>
                        <Star size={22} style={{ marginRight: theme.spacing(1.5), color: theme.palette.secondary.main }} />
                        <Typography variant="h6" component="div" sx={{ fontWeight: 'medium', flexGrow: 1 }}>
                            Meal Presets
                        </Typography>
                        {/* Add any controls specific to presets here, e.g., a "New Preset" button */}
                    </Box>
                    <Divider sx={{ my: 1 }} />
                    {presetsContent}
                </>
            )}

        </Paper>
    );
}