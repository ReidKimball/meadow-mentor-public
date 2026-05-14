import React from 'react';
import {
    Box, Paper, Typography, Button, Grid, Divider, Chip, List, ListItem, ListItemText,
    CircularProgress, Tooltip, useTheme, alpha, Card, Stack
} from '@mui/material';
import { Edit, Info, Activity, HelpCircle, Check, X, AlertCircle, Sparkles, Clock, Calendar, MapPin, AlarmClock, FileText } from 'lucide-react';
import dayjs from 'dayjs';

// Helper functions
const formatMealDateTime = (dateTimeString) => {
    if (!dateTimeString) return 'N/A';
    return dayjs(dateTimeString).format('MMM D, YYYY h:mm A');
};

const formatSymptomDateTime = (dateTimeString) => {
    if (!dateTimeString) return 'N/A';
    const dateObj = dayjs(dateTimeString);
    return dateObj.isValid() ? dateObj.format('MMM D, h:mm A') : 'Invalid Date';
};

const getComplianceColor = (score) => {
    if (score === null || score === undefined) return 'default';
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'error';
};

const getIngredientChipPropsForView = (result) => {
    if (!result || !result.ingredient) return { color: 'default', label: 'Error' };
    const iconSize = 16;
    let icon = null; let color = 'default';
    if (!result.found) { icon = <HelpCircle size={iconSize} />; }
    else if (result.allowed === true) { icon = <Check size={iconSize} />; color = 'success'; }
    else if (result.allowed === false) { icon = <X size={iconSize} />; color = 'error'; }
    else { icon = <AlertCircle size={iconSize} />; color = 'warning'; }
    if (result.isNewlyIntroduced) icon = <Sparkles size={iconSize + 2} />;
    return { label: result.ingredient, color, icon, size: "medium", variant: "outlined" };
};

export default function MealDetailViewer({
    meal,
    isLoading,
    onEdit,
    isUserDataLoading,
    userDataError,
    therapeuticDietSet,
}) {
    const theme = useTheme();

    if (isLoading) {
        return (
            <Paper 
                elevation={2} 
                sx={{ 
                    p: 4, 
                    mb: 4, 
                    borderRadius: 3,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    minHeight: '300px'
                }}
            >
                <Box sx={{ textAlign: 'center' }}>
                    <CircularProgress size={40} thickness={4} />
                    <Typography 
                        variant="body1" 
                        sx={{ 
                            mt: 2, 
                            color: 'text.secondary' 
                        }}
                    >
                        Loading meal details...
                    </Typography>
                </Box>
            </Paper>
        );
    }

    if (!meal) {
        return (
            <Paper 
                elevation={2} 
                sx={{ 
                    p: 4, 
                    mb: 4, 
                    borderRadius: 3,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    minHeight: '300px',
                    bgcolor: alpha(theme.palette.primary.light, 0.03)
                }}
            >
                <Typography 
                    variant="h6" 
                    sx={{ 
                        color: 'text.secondary',
                        mb: 1
                    }}
                >
                    No Meal Selected
                </Typography>
                <Typography 
                    variant="body2" 
                    sx={{ 
                        color: 'text.secondary',
                        textAlign: 'center',
                        maxWidth: '400px'
                    }}
                >
                    Select a meal from the history list to view details and analyze your diet compliance.
                </Typography>
            </Paper>
        );
    }

    // Ensure associatedSymptoms is an array
    const symptoms = meal.associatedSymptoms || [];

    return (
        <Paper 
            elevation={2} 
            sx={{ 
                p: 4, 
                mb: 4, 
                borderRadius: 3 
            }}
        >
            <Box 
                display="flex" 
                justifyContent="space-between" 
                alignItems="center" 
                mb={3}
            >
                <Typography 
                    variant="h5" 
                    component="h2" 
                    sx={{ 
                        fontWeight: 500,
                        color: theme.palette.primary.main,
                        overflow: 'hidden', 
                        textOverflow: 'ellipsis', 
                        pr: 2 
                    }}
                >
                    {meal.mealName}
                </Typography>
                <Button
                    variant="outlined"
                    color="primary"
                    startIcon={<Edit size={16} />}
                    onClick={onEdit}
                    disabled={!meal || isLoading || isUserDataLoading || !!userDataError || !therapeuticDietSet}
                    sx={{ 
                        borderRadius: 2,
                        px: 2,
                        py: 1
                    }}
                >
                    Edit Meal
                </Button>
            </Box>

            {/* Details Grid */}
            <Card 
                variant="outlined" 
                sx={{ 
                    mb: 3, 
                    p: 2, 
                    borderRadius: 2,
                    bgcolor: alpha(theme.palette.background.paper, 0.7),
                    boxShadow: 'none'
                }}
            >
                <Grid container spacing={3} alignItems="center">
                    <Grid item xs={12} sm={4}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Calendar size={18} color={theme.palette.text.secondary} />
                            <Box sx={{ ml: 1.5 }}>
                                <Typography variant="caption" color="textSecondary" display="block">
                                    Date & Time
                                </Typography>
                                <Typography variant="body2">
                                    {formatMealDateTime(meal.mealDateTime)}
                                </Typography>
                            </Box>
                        </Box>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <FileText size={18} color={theme.palette.text.secondary} />
                            <Box sx={{ ml: 1.5 }}>
                                <Typography variant="caption" color="textSecondary" display="block">
                                    Meal Type
                                </Typography>
                                <Typography variant="body2">
                                    {meal.mealType.charAt(0).toUpperCase() + meal.mealType.slice(1)}
                                </Typography>
                            </Box>
                        </Box>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <Typography variant="caption" color="textSecondary" gutterBottom>
                                Compliance Score
                            </Typography>
                            <Chip 
                                label={`${meal.complianceSnapshot?.score ?? 'N/A'}%`} 
                                color={getComplianceColor(meal.complianceSnapshot?.score)} 
                                sx={{ 
                                    fontWeight: 'bold',
                                    fontSize: '1rem',
                                    px: 1
                                }}
                            />
                        </Box>
                    </Grid>
                </Grid>
            </Card>

            {/* Ingredients */}
            <Box sx={{ mb: 3 }}>
                <Typography 
                    variant="h6" 
                    gutterBottom 
                    sx={{ 
                        fontWeight: 500,
                        display: 'flex',
                        alignItems: 'center',
                        mb: 2
                    }}
                >
                    <Sparkles 
                        size={20} 
                        style={{ marginRight: '8px' }} 
                        color={theme.palette.primary.main} 
                    /> 
                    Ingredients
                </Typography>
                <Box 
                    sx={{ 
                        display: 'flex', 
                        flexWrap: 'wrap', 
                        gap: 1, 
                        p: 1,
                        pb: 2
                    }}
                >
                    {meal.complianceSnapshot?.results?.length > 0 ? (
                        meal.complianceSnapshot.results.map((res, idx) => (
                            <Tooltip 
                                key={`${res.ingredient}-${idx}`} 
                                title={res.note || 'No details'}
                                arrow
                            >
                                <Chip 
                                    {...getIngredientChipPropsForView(res)} 
                                    sx={{ 
                                        borderRadius: '16px',
                                        px: 0.5,
                                        '& .MuiChip-label': {
                                            px: 1
                                        },
                                        transition: 'all 0.2s ease',
                                        '&:hover': {
                                            transform: 'translateY(-2px)',
                                            boxShadow: theme.shadows[1]
                                        }
                                    }}
                                />
                            </Tooltip>
                        ))
                    ) : (
                        <Typography 
                            variant="body2" 
                            sx={{ 
                                fontStyle: 'italic', 
                                color: 'text.secondary',
                                p: 1
                            }}
                        >
                            No ingredient data.
                        </Typography>
                    )}
                </Box>
            </Box>
            
            <Divider sx={{ my: 3 }} />

            {/* Meal Notes */}
            <Box sx={{ mb: 3 }}>
                <Typography 
                    variant="h6" 
                    gutterBottom 
                    sx={{ 
                        fontWeight: 500,
                        display: 'flex', 
                        alignItems: 'center',
                        mb: 2
                    }}
                >
                    <Info 
                        size={20} 
                        style={{ marginRight: '8px' }} 
                        color={theme.palette.primary.main} 
                    /> 
                    Meal Notes
                </Typography>
                <Card 
                    variant="outlined" 
                    sx={{ 
                        borderRadius: 2,
                        p: 2,
                        bgcolor: alpha(theme.palette.background.paper, 0.7),
                        minHeight: '60px',
                        display: 'flex',
                        alignItems: 'center'
                    }}
                >
                    <Typography 
                        sx={{ 
                            fontStyle: meal.mealNotes ? 'normal' : 'italic', 
                            color: meal.mealNotes ? 'text.primary' : 'text.secondary', 
                            wordBreak: 'break-word' 
                        }}
                    >
                        {meal.mealNotes || "No notes logged for this meal."}
                    </Typography>
                </Card>
            </Box>

            <Divider sx={{ my: 3 }} />

            {/* Associated Symptoms */}
            <Box>
                <Typography 
                    variant="h6" 
                    gutterBottom 
                    sx={{ 
                        fontWeight: 500,
                        display: 'flex', 
                        alignItems: 'center',
                        mb: 2
                    }}
                >
                    <Activity 
                        size={20} 
                        style={{ marginRight: '8px' }} 
                        color={theme.palette.primary.main} 
                    /> 
                    Logged Symptoms
                </Typography>
                
                {symptoms.length > 0 ? (
                    <Stack spacing={2}>
                        {symptoms.map((s, idx) => (
                            <Card 
                                key={s._id || `view-symptom-${idx}`} 
                                variant="outlined"
                                sx={{
                                    p: 2,
                                    borderRadius: 2,
                                    borderColor: theme.palette.divider,
                                    bgcolor: alpha(theme.palette.background.paper, 0.7)
                                }}
                            >
                                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                        <Typography 
                                            variant="subtitle1" 
                                            sx={{ 
                                                fontWeight: 500,
                                                color: theme.palette.text.primary,
                                                flex: 1
                                            }}
                                        >
                                            {s.symptomName === 'Other' ? s.customSymptomName : s.symptomName}
                                        </Typography>
                                        <Chip 
                                            label={`Severity: ${s.severity}/5`}
                                            size="small"
                                            color={s.severity > 3 ? "error" : s.severity > 1 ? "warning" : "success"}
                                            sx={{ ml: 1, fontWeight: 500 }}
                                        />
                                    </Box>
                                    
                                    <Grid container spacing={1} sx={{ mt: 0.5 }}>
                                        <Grid item xs={12} sm={4}>
                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                <Clock size={14} color={theme.palette.text.secondary} />
                                                <Typography 
                                                    variant="caption" 
                                                    color="textSecondary"
                                                    sx={{ ml: 0.5 }}
                                                >
                                                    Occurred: {formatSymptomDateTime(s.occurredAt)}
                                                </Typography>
                                            </Box>
                                        </Grid>
                                        
                                        {s.timingRelativeToMeal && (
                                            <Grid item xs={12} sm={4}>
                                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                    <AlarmClock size={14} color={theme.palette.text.secondary} />
                                                    <Typography 
                                                        variant="caption" 
                                                        color="textSecondary"
                                                        sx={{ ml: 0.5 }}
                                                    >
                                                        {s.timingRelativeToMeal.replace(/_/g, ' ')}
                                                    </Typography>
                                                </Box>
                                            </Grid>
                                        )}
                                        
                                        {s.duration && (
                                            <Grid item xs={12} sm={4}>
                                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                    <HelpCircle size={14} color={theme.palette.text.secondary} />
                                                    <Typography 
                                                        variant="caption" 
                                                        color="textSecondary"
                                                        sx={{ ml: 0.5 }}
                                                    >
                                                        Duration: {s.duration.replace(/_/g, ' ')}
                                                    </Typography>
                                                </Box>
                                            </Grid>
                                        )}
                                        
                                        {(s.location === 'other' ? s.customLocation : s.location) && (
                                            <Grid item xs={12} sm={4}>
                                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                    <MapPin size={14} color={theme.palette.text.secondary} />
                                                    <Typography 
                                                        variant="caption" 
                                                        color="textSecondary"
                                                        sx={{ ml: 0.5 }}
                                                    >
                                                        Location: {s.location === 'other' ? s.customLocation : s.location.replace(/_/g, ' ')}
                                                    </Typography>
                                                </Box>
                                            </Grid>
                                        )}
                                    </Grid>
                                    
                                    {s.notes && (
                                        <Box sx={{ mt: 1.5, pt: 1.5, borderTop: `1px solid ${alpha(theme.palette.divider, 0.5)}` }}>
                                            <Typography variant="caption" color="textSecondary">Notes:</Typography>
                                            <Typography variant="body2" sx={{ pl: 1, pt: 0.5 }}>
                                                {s.notes}
                                            </Typography>
                                        </Box>
                                    )}
                                </Box>
                            </Card>
                        ))}
                    </Stack>
                ) : (
                    <Card 
                        variant="outlined" 
                        sx={{ 
                            p: 2, 
                            borderRadius: 2,
                            bgcolor: alpha(theme.palette.background.paper, 0.7),
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            minHeight: '80px'
                        }}
                    >
                        <Typography 
                            sx={{ 
                                fontStyle: 'italic', 
                                color: 'text.secondary',
                                textAlign: 'center'
                            }}
                        >
                            No symptoms logged for this meal.
                        </Typography>
                    </Card>
                )}
            </Box>
        </Paper>
    );
}
