/**
 * @file Defines the WeeklyMealPlanner feature screen.
 * @description Manages meal plan generation, viewing, assignment, and related actions.
 * @requires module:react - React core and hooks.
 * @requires module:@mui/material - UI primitives and feedback components.
 * @author Cascade
 * @version 1.0.0
 * @date 2026-01-18
 */

// React/Third-Party Libraries
import React, { useState, useEffect } from 'react';
import {
    Container, Typography, Box, Paper, Button, IconButton, Modal, Card, CardHeader, CardContent, Grid, Chip, Stack, Popover, Snackbar, Alert, Tooltip, Checkbox, FormControlLabel, TextField, FormControl, FormLabel, RadioGroup, Radio
} from '@mui/material';
import { ChevronLeft, ChevronRight, Close, CalendarMonth, Settings, Delete, MenuBook, Edit, Check, Visibility } from '@mui/icons-material';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import Swal from 'sweetalert2';

// Internal Components
import RecipeCard from '../recipes/RecipeCard';
import MealPlannerSettings from './MealPlannerSettings';
import MealPlannerTabs from './MealPlannerTabs';
import MealPlansLibrary from './MealPlansLibrary';
import CalendarView from './CalendarView';
import UsageView from './UsageView';
import AssignPlanModal from './AssignPlanModal';
import DuplicatePlanModal from './DuplicatePlanModal';
import ViewPlanModal from './ViewPlanModal';

// Contexts
import { useUser } from '../../../context/UserContext';
import { useQueryInvalidation } from '../../../hooks/useUserQueries';

// Services
import {
    generateMealPlan,
    generatePlaceholderRecipe,
    generatePlaceholderIdea,
    getMealPlans,
    deleteMealPlan as deleteMealPlanAPI,
    saveMealPlanSettings as saveMealPlanSettingsAPI,
    getMealPlanSettings as getMealPlanSettingsAPI,
    assignMealPlan as assignMealPlanAPI,
    getActivePlanForDate,
    duplicateMealPlan as duplicateMealPlanAPI,
    unassignMealPlanForDate as unassignMealPlanAPI
} from '../../../services/mealPlannerService';
import { getRecipeById, generateRecipeImage } from '../../../services/recipeService';
import { addIngredients } from '../../../services/shoppingListService';

// Utilities
import { API_BASE_URL, MARKETING_BASE_URL } from '../../../env-config';
import { getMealPlanPublishCheck, publishMealPlan, updateMealPlan as updateMealPlanAPI } from '../../../services/mealPlannerService';
import CreditConfirmationModal from '../../Common/CreditConfirmationModal';
import CreditsRequiredModal from '../../Common/CreditsRequiredModal';
import { HttpError } from '../../../utils/http-errors';

const WeeklyMealPlanner = () => {
    const { getFreshIdToken, user, setUser, isAdmin: isAdminFromContext } = useUser();
    const isAdmin = !!(user?.isAdmin || isAdminFromContext);
    const { invalidateUser } = useQueryInvalidation();

    // Tab state
    const [activeTab, setActiveTab] = useState('calendar');

    // Date and calendar state
    const [selectedDate, setSelectedDate] = useState(dayjs());
    const [currentDayIndex, setCurrentDayIndex] = useState(0);
    const [calendarAnchorEl, setCalendarAnchorEl] = useState(null);

    // Modal state
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedRecipe, setSelectedRecipe] = useState(null);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [duplicateModalOpen, setDuplicateModalOpen] = useState(false);
    const [viewPlanModalOpen, setViewPlanModalOpen] = useState(false);
    const [assignModalOpen, setAssignModalOpen] = useState(false);

    // Publish modal state (admin-only)
    const [publishModalOpen, setPublishModalOpen] = useState(false);
    const [publishPlan, setPublishPlan] = useState(null);
    const [publishTargetVisibility, setPublishTargetVisibility] = useState('public');
    const [publishSlug, setPublishSlug] = useState('');
    const [publishCheckLoading, setPublishCheckLoading] = useState(false);
    const [publishNonPublicRecipes, setPublishNonPublicRecipes] = useState([]);
    const [publishRecipesVisibility, setPublishRecipesVisibility] = useState('unlisted');

    // Credit System State
    const [showCreditConfirmationModal, setShowCreditConfirmationModal] = useState(false);
    const [creditConfirmationData, setCreditConfirmationData] = useState(null);
    const [showCreditsRequiredModal, setShowCreditsRequiredModal] = useState(false);
    const [creditsRequiredData, setCreditsRequiredData] = useState(null);

    const [showCreditSpendConfirmationsInFuture, setShowCreditSpendConfirmationsInFuture] = useState(true);

    // Meal plan state
    const [generatedMealPlan, setGeneratedMealPlan] = useState(null);
    const [generatedMealPlanId, setGeneratedMealPlanId] = useState(null);
    const [savedMealPlans, setSavedMealPlans] = useState([]);
    const [loadingPlans, setLoadingPlans] = useState(false);

    // Plan actions state
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatingRecipe, setGeneratingRecipe] = useState(null);
    const [planToDuplicate, setPlanToDuplicate] = useState(null);
    const [planToView, setPlanToView] = useState(null);
    const [planToAssign, setPlanToAssign] = useState(null);
    const [assignStartDate, setAssignStartDate] = useState(dayjs());
    const [makeActiveAfterAssign, setMakeActiveAfterAssign] = useState(true);

    // Duplicate modal state
    const [duplicateStartDate, setDuplicateStartDate] = useState(dayjs());
    const [makeActiveAfterDuplicate, setMakeActiveAfterDuplicate] = useState(true);

    // Edit state
    const [editingPlanId, setEditingPlanId] = useState(null);
    const [editingPlanName, setEditingPlanName] = useState('');

    // UI state
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const [isAddingPlanIngredients, setIsAddingPlanIngredients] = useState(false);
    const [mealPlanSettings, setMealPlanSettings] = useState({
        planDuration: 1,
        includedMealTypes: {
            breakfast: true,
            lunch: true,
            dinner: true,
            snack: true,
        },
        dynamicPreferences: '',
    });

    // Load settings on component mount
    useEffect(() => {
        const loadSettings = async () => {
            try {
                console.log('Loading meal plan settings from user profile...');
                const settings = await getMealPlanSettingsAPI(getFreshIdToken);
                console.log('Settings loaded from API:', settings);
                console.log('Settings type:', typeof settings);
                console.log('Settings keys:', settings ? Object.keys(settings) : 'null');

                if (settings) {
                    console.log('Setting meal plan settings state to:', settings);
                    setMealPlanSettings(settings);
                    console.log('State updated');
                }
            } catch (error) {
                console.error('Error loading settings:', error);
                console.error('Error details:', error.message);
                // Use default settings if loading fails
            }
        };

        loadSettings();
    }, []); // Empty dependency array - only run once on mount

    useEffect(() => {
        const nextValue = user?.preferences?.showCreditSpendConfirmations;
        if (typeof nextValue === 'boolean') {
            setShowCreditSpendConfirmationsInFuture(nextValue);
        }
    }, [user?.preferences?.showCreditSpendConfirmations]);

    const updateShowCreditSpendConfirmationsInFuture = async (nextValue) => {
        setShowCreditSpendConfirmationsInFuture(nextValue);

        setUser((prev) => {
            if (!prev) return prev;
            return {
                ...prev,
                preferences: {
                    ...(prev.preferences || {}),
                    showCreditSpendConfirmations: nextValue,
                },
            };
        });

        try {
            const token = await getFreshIdToken();
            const firebaseUID = user?.firebaseUID;
            if (!firebaseUID) return;

            const response = await fetch(`${API_BASE_URL}/api/users/${firebaseUID}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    preferences: {
                        showCreditSpendConfirmations: nextValue,
                    },
                }),
            });

            if (response.ok) {
                const updatedUser = await response.json();
                setUser(updatedUser);
                invalidateUser();
            }
        } catch (error) {
            console.error('[WeeklyMealPlanner] Failed to update credit confirmation preference:', error);
        }
    };

    /**
     * Aggregates ingredients across a meal plan and adds them to the shopping list.
     * @param {object} plan - Meal plan with day/meal data.
     */
    const handleAddPlanIngredients = async (plan) => {
        if (!user) {
            setSnackbar({
                open: true,
                message: 'Please log in to add ingredients to your shopping list.',
                severity: 'warning',
            });
            return;
        }

        if (!plan?.days?.length) {
            setSnackbar({
                open: true,
                message: 'No meals found in this plan.',
                severity: 'warning',
            });
            return;
        }

        setIsAddingPlanIngredients(true);

        try {
            const recipeIdSet = new Set();
            let skippedMeals = 0;

            plan.days.forEach((day) => {
                ['breakfast', 'lunch', 'dinner', 'snack'].forEach((mealType) => {
                    const meal = day?.meals?.[mealType];
                    if (!meal?.recipeId || meal?.isPlaceholder) {
                        if (meal) {
                            skippedMeals += 1;
                        }
                        return;
                    }
                    recipeIdSet.add(String(meal.recipeId));
                });
            });

            const recipeIds = Array.from(recipeIdSet);
            if (recipeIds.length === 0) {
                setSnackbar({
                    open: true,
                    message: 'No saved recipes found to add ingredients from.',
                    severity: 'warning',
                });
                return;
            }

            const recipeResponses = await Promise.all(
                recipeIds.map((id) => getRecipeById(id, getFreshIdToken))
            );

            const ingredients = recipeResponses
                .map((response) => response?.data || response)
                .flatMap((recipe) => recipe?.ingredients || []);

            const cleanedIngredients = ingredients.filter((ingredient) => ingredient?.name);

            if (cleanedIngredients.length === 0) {
                setSnackbar({
                    open: true,
                    message: 'No ingredients found in the selected recipes.',
                    severity: 'warning',
                });
                return;
            }

            await addIngredients(cleanedIngredients, getFreshIdToken);

            const skippedMessage = skippedMeals > 0
                ? ` Added ingredients, but skipped ${skippedMeals} placeholder meal${skippedMeals > 1 ? 's' : ''}.`
                : '';

            setSnackbar({
                open: true,
                message: `Ingredients added to your shopping list!${skippedMessage}`,
                severity: skippedMeals > 0 ? 'warning' : 'success',
            });
        } catch (error) {
            if (error instanceof HttpError && error.status === 403) {
                setSnackbar({
                    open: true,
                    message: 'Shopping list limit reached. Please upgrade to add more items.',
                    severity: 'warning',
                });
            } else {
                setSnackbar({
                    open: true,
                    message: `Failed to add ingredients: ${error.message}`,
                    severity: 'error',
                });
            }
        } finally {
            setIsAddingPlanIngredients(false);
        }
    };

    const handleRecipeDataChange = async () => {
        if (!selectedRecipe?._id) {
            return;
        }

        try {
            const response = await getRecipeById(selectedRecipe._id, getFreshIdToken);
            const refreshedRecipe = response.data || response;
            setSelectedRecipe(refreshedRecipe);
        } catch (error) {
            console.error('[WeeklyMealPlanner] Failed to refresh recipe details:', error);
        }
    };

    // Load active plan for selected date
    useEffect(() => {
        const loadActivePlan = async () => {
            try {
                console.log('=== Loading Active Plan for Date ===');
                console.log('Selected date:', selectedDate.format('YYYY-MM-DD'));

                const activePlan = await getActivePlanForDate(getFreshIdToken, selectedDate.toDate());

                if (activePlan) {
                    console.log('Active plan found:', activePlan._id);
                    console.log('Plan name:', activePlan.planName);
                    console.log('Assignment date range:', activePlan.assignmentStartDate, 'to', activePlan.assignmentEndDate);

                    setGeneratedMealPlan(activePlan);
                    setGeneratedMealPlanId(activePlan._id);

                    // Calculate which day index to show based on selected date and assignment
                    const assignmentStartDate = new Date(activePlan.assignmentStartDate);
                    const currentDate = selectedDate.toDate();
                    const daysDiff = Math.floor((currentDate - assignmentStartDate) / (1000 * 60 * 60 * 24));
                    const dayIndex = Math.max(0, Math.min(daysDiff, activePlan.days.length - 1));

                    console.log('Setting day index to:', dayIndex);
                    setCurrentDayIndex(dayIndex);
                } else {
                    console.log('No active plan for this date');
                    // Don't clear the plan if user is navigating within the same plan's date range
                    // Only clear if there's truly no active plan
                    if (generatedMealPlan) {
                        const assignmentStart = new Date(generatedMealPlan.assignmentStartDate);
                        const assignmentEnd = new Date(generatedMealPlan.assignmentEndDate);
                        const currentDate = selectedDate.toDate();

                        // If current date is outside the loaded plan's assignment range, clear it
                        if (currentDate < assignmentStart || currentDate > assignmentEnd) {
                            console.log('Selected date outside current assignment range, clearing plan');
                            setGeneratedMealPlan(null);
                            setGeneratedMealPlanId(null);
                            setCurrentDayIndex(0);
                        }
                    }
                }
            } catch (error) {
                console.error('Error loading active plan:', error);
                // Don't show error to user, just log it
            }
        };

        loadActivePlan();
    }, [selectedDate]); // Run whenever selected date changes

    const handlePrevDay = () => {
        const newDate = selectedDate.subtract(1, 'day');
        console.log('=== Navigate to Previous Day ===');
        console.log('New date:', newDate.format('MMM DD, YYYY'), newDate.format('dddd'));
        setSelectedDate(newDate);
        // The useEffect will handle loading the active plan for this date
    };

    const handleNextDay = () => {
        const newDate = selectedDate.add(1, 'day');
        console.log('=== Navigate to Next Day ===');
        console.log('New date:', newDate.format('MMM DD, YYYY'), newDate.format('dddd'));
        setSelectedDate(newDate);
        // The useEffect will handle loading the active plan for this date
    };

    /**
     * Handles clicking a meal slot to open the recipe modal.
     * @param {object} meal - Meal data for the selected slot.
     */
    const handleTitleClick = async (meal) => {
        console.log('=== handleTitleClick called ===');
        console.log('Meal data:', meal);
        console.log('Has recipeId?', !!meal.recipeId);
        console.log('Is placeholder?', meal.isPlaceholder);

        // If it's a saved recipe with recipeId, fetch the full recipe
        if (meal.recipeId && !meal.isPlaceholder) {
            try {
                console.log('Fetching full recipe for ID:', meal.recipeId);
                const response = await getRecipeById(meal.recipeId, getFreshIdToken);
                console.log('Full recipe response:', response);

                // Extract the recipe data from the response
                const fullRecipe = response.data || response;
                console.log('Full recipe data:', fullRecipe);
                console.log('Full recipe has ingredients?', !!fullRecipe.ingredients);
                console.log('Full recipe has steps?', !!fullRecipe.steps);
                setSelectedRecipe(fullRecipe);
                setModalOpen(true);
            } catch (error) {
                console.error('Error fetching recipe:', error);
                setSnackbar({
                    open: true,
                    message: 'Failed to load recipe details',
                    severity: 'error',
                });
            }
        } else {
            // For mock data or other cases, use the meal data directly
            console.log('Using meal data directly (not fetching from API)');
            setSelectedRecipe(meal);
            setModalOpen(true);
        }
    };

    const handleCloseModal = () => {
        setModalOpen(false);
        setSelectedRecipe(null);
    };

    const handleDateButtonClick = (event) => {
        setCalendarAnchorEl(event.currentTarget);
    };

    const handleCalendarClose = () => {
        setCalendarAnchorEl(null);
    };

    const handleDateChange = (newDate) => {
        setSelectedDate(newDate);
        handleCalendarClose();
        // TODO: Fetch meal plan from database based on selected date
        console.log('Selected date:', newDate.format('MMM DD, YYYY'));
        console.log('Day of week:', newDate.format('dddd'));
    };

    const handleSettingsOpen = () => {
        setSettingsOpen(true);
    };
    const handleSettingsClose = () => {
        setSettingsOpen(false);
    };

    const handleSettingsSave = async (newSettings) => {
        console.log('Saving settings:', newSettings);

        try {
            await saveMealPlanSettingsAPI(getFreshIdToken, newSettings);
            setMealPlanSettings(newSettings);
            setSettingsOpen(false);
            setSnackbar({
                open: true,
                message: 'Settings saved successfully!',
                severity: 'success',
            });
        } catch (error) {
            console.error('Error saving settings:', error);
            setSnackbar({
                open: true,
                message: `Failed to save settings: ${error.message}`,
                severity: 'error',
            });
        }
    };

    const handleGenerateMealPlan = async () => {
        console.log('=== Generate Meal Plan Template Button Clicked ===');
        console.log('Current settings:', mealPlanSettings);
        console.log('Creating template (no specific date)');

        setIsGenerating(true);

        try {
            // Generate template (no startDate needed)
            let result = await generateMealPlan(
                getFreshIdToken,
                mealPlanSettings
            );

            // Credit Logic
            if (result.requiresConfirmation) {
                if (!showCreditSpendConfirmationsInFuture) {
                    result = await generateMealPlan(
                        getFreshIdToken,
                        mealPlanSettings,
                        { confirm: true }
                    );
                } else {
                    console.log('Credit confirmation required');
                    setCreditConfirmationData({ ...result, action: 'GENERATE_MEAL_PLAN' });
                    setShowCreditConfirmationModal(true);
                    return;
                }
            }

            if (result.insufficientCredits) {
                console.log('Insufficient credits');
                setCreditsRequiredData(result);
                setShowCreditsRequiredModal(true);
                return;
            }

            console.log('Meal plan generation complete!', result);
            console.log('Meal plan days:', result.mealPlan?.days);
            console.log('First day meals:', result.mealPlan?.days?.[0]?.meals);
            console.log('Meal plan ID:', result.mealPlan?._id);

            // Create a new object to ensure state update
            const newMealPlan = { ...result.mealPlan };
            console.log('Setting meal plan state:', newMealPlan);

            setGeneratedMealPlan(newMealPlan);
            setGeneratedMealPlanId(newMealPlan?._id);
            setCurrentDayIndex(0); // Reset to first day

            // Reload saved plans to show the new plan in the library
            await handleLoadSavedPlans();

            setSnackbar({
                open: true,
                message: 'Meal plan generated successfully!',
                severity: 'success',
            });
        } catch (error) {
            console.error('Error generating meal plan:', error);
            setSnackbar({
                open: true,
                message: `Failed to generate meal plan: ${error.message}`,
                severity: 'error',
            });
        } finally {
            setIsGenerating(false);
        }
    };

    const handleCreditConfirm = async () => {
        console.log('=== User Confirmed Credit Deduction ===');
        const action = creditConfirmationData?.action || 'GENERATE_MEAL_PLAN'; // Default for backward compatibility
        const params = creditConfirmationData?.params || {};

        setShowCreditConfirmationModal(false);
        setGeneratingRecipe(params.mealType); // Set loading state if recipe
        if (action === 'GENERATE_MEAL_PLAN') setIsGenerating(true);

        try {
            let result;

            if (action === 'GENERATE_MEAL_PLAN') {
                result = await generateMealPlan(
                    getFreshIdToken,
                    mealPlanSettings,
                    { confirm: true }
                );
            } else if (action === 'GENERATE_RECIPE') {
                const { planId, dayIndex, mealType } = params;
                result = await generatePlaceholderRecipe(
                    getFreshIdToken,
                    planId,
                    dayIndex,
                    mealType,
                    { confirm: true }
                );
            }

            console.log(`${action} successful after confirmation!`, result);

            if (action === 'GENERATE_MEAL_PLAN') {
                const newMealPlan = { ...result.mealPlan };
                setGeneratedMealPlan(newMealPlan);
                setGeneratedMealPlanId(newMealPlan?._id);
                setCurrentDayIndex(0);
                await handleLoadSavedPlans();
            } else if (action === 'GENERATE_RECIPE') {
                // The recipe generation logic returns { success: true, recipe: ... }
                // Need to handle the local state update here similar to handleGenerateRecipe
                const { dayIndex, mealType, currentPlan, planId } = params;
                const mealTypeKey = mealType.toLowerCase();

                const applyMealUpdate = (plan, updates) => {
                    if (!plan?.days?.[dayIndex]?.meals?.[mealTypeKey]) {
                        return plan;
                    }

                    const nextPlan = JSON.parse(JSON.stringify(plan));
                    nextPlan.days[dayIndex].meals[mealTypeKey] = {
                        ...nextPlan.days[dayIndex].meals[mealTypeKey],
                        ...updates,
                    };

                    return nextPlan;
                };

                const updateMealPlanState = (updates) => {
                    if (planToView) {
                        setPlanToView(prev => (prev ? applyMealUpdate(prev, updates) : prev));
                        setSavedMealPlans(prev =>
                            prev.map(plan => (plan._id === planId ? applyMealUpdate(plan, updates) : plan))
                        );
                    } else {
                        setGeneratedMealPlan(prev => (prev ? applyMealUpdate(prev, updates) : prev));
                    }
                };

                console.log('[WeeklyMealPlanner] Recipe generated after credit confirmation:', result);
                console.log('[WeeklyMealPlanner] Marking meal slot as image generating (confirmed flow):', {
                    planId,
                    dayIndex,
                    mealType,
                    recipeId: result.recipe._id,
                });

                updateMealPlanState({
                    recipeId: result.recipe._id,
                    recipeTitle: result.recipe.recipeTitle,
                    recipeDescription: result.recipe.recipeDescription,
                    recipeDiet: result.recipe.recipeDiet,
                    recipeImage: result.recipe.recipeImage,
                    recipeImageVersion: result.recipe.imageVersion || 0,
                    mealType: result.recipe.mealType,
                    isPlaceholder: false,
                    isImageGenerating: true,
                });

                const handleImageGeneration = async () => {
                    try {
                        console.log('[WeeklyMealPlanner] Starting image generation request (confirmed flow):', result.recipe._id);
                        const imageResponse = await generateRecipeImage(result.recipe._id, getFreshIdToken);
                        console.log('[WeeklyMealPlanner] Image generation response received (confirmed flow):', imageResponse);
                        const imageUrls = imageResponse?.data || imageResponse?.recipe?.recipeImage || imageResponse?.imageUrls;

                        if (!imageUrls) {
                            console.warn('[WeeklyMealPlanner] Image generation response missing image URLs (confirmed flow):', imageResponse);
                            updateMealPlanState({ isImageGenerating: false });
                            setSnackbar({
                                open: true,
                                message: 'Recipe image generation completed, but no image was returned.',
                                severity: 'warning',
                            });
                            return;
                        }

                        updateMealPlanState({
                            recipeImage: imageUrls,
                            recipeImageVersion: (currentPlan?.days?.[dayIndex]?.meals?.[mealTypeKey]?.recipeImageVersion || 0) + 1,
                            isImageGenerating: false,
                        });
                    } catch (imageError) {
                        console.error('[WeeklyMealPlanner] Image generation request failed (confirmed flow):', imageError);
                        updateMealPlanState({ isImageGenerating: false });
                        setSnackbar({
                            open: true,
                            message: `Failed to generate recipe image: ${imageError.message}`,
                            severity: 'warning',
                        });
                    }
                };

                handleImageGeneration();
            }

            setSnackbar({
                open: true,
                message: 'Action completed successfully!',
                severity: 'success',
            });
            invalidateUser(); // Refresh credit balance via TanStack Query
        } catch (error) {
            console.error('Error after credit confirmation:', error);
            setSnackbar({
                open: true,
                message: `Failed: ${error.message}`,
                severity: 'error',
            });
        } finally {
            setIsGenerating(false);
            setGeneratingRecipe(null);
        }
    };

    const handleCreditCancel = () => {
        setShowCreditConfirmationModal(false);
        setCreditConfirmationData(null);
    };

    const handleCloseSnackbar = () => {
        setSnackbar({ ...snackbar, open: false });
    };

    const handleLoadSavedPlans = async () => {
        console.log('=== Loading Saved Meal Plans ===');
        setLoadingPlans(true);

        try {
            const mealPlans = await getMealPlans(getFreshIdToken);
            console.log('Saved meal plans:', mealPlans);
            console.log('Number of plans:', mealPlans?.length);

            // Sort by newest first (createdAt descending)
            const sortedPlans = (mealPlans || []).sort((a, b) => {
                const dateA = new Date(a.createdAt || 0);
                const dateB = new Date(b.createdAt || 0);
                return dateB - dateA; // Newest first
            });

            console.log('Sorted plans (newest first)');
            setSavedMealPlans(sortedPlans);
            // No longer need to show modal - plans are displayed in Library tab
        } catch (error) {
            console.error('Error loading meal plans:', error);
            setSnackbar({
                open: true,
                message: `Failed to load meal plans: ${error.message}`,
                severity: 'error',
            });
        } finally {
            setLoadingPlans(false);
        }
    };

    // Tab switching handler
    const handleTabChange = (event, newValue) => {
        console.log('=== Tab Changed ===');
        console.log('New tab:', newValue);
        setActiveTab(newValue);

        // Load saved plans when switching to library tab
        if (newValue === 'library' && savedMealPlans.length === 0) {
            handleLoadSavedPlans();
        }
    };

    // Open assign modal
    const handleOpenAssignModal = (plan) => {
        console.log('=== Opening Assign Modal ===');
        console.log('Plan:', plan);
        setPlanToAssign(plan);
        setAssignStartDate(selectedDate); // Default to currently selected date
        setMakeActiveAfterAssign(true);
        setAssignModalOpen(true);
    };

    // Confirm assignment from modal
    const handleConfirmAssign = async () => {
        console.log('=== Confirming Assignment ===');
        console.log('Plan:', planToAssign);
        console.log('Start date:', assignStartDate.format('YYYY-MM-DD'));
        console.log('Make active:', makeActiveAfterAssign);

        try {
            const result = await assignMealPlanAPI(
                getFreshIdToken,
                planToAssign._id,
                assignStartDate.toDate(),
                makeActiveAfterAssign
            );

            console.log('Assignment created:', result.assignment);
            console.log('Plan usage updated:', result.mealPlan);

            // Close modal
            setAssignModalOpen(false);
            setPlanToAssign(null);

            // Switch to calendar tab and navigate to assignment date
            setActiveTab('calendar');
            setSelectedDate(assignStartDate);

            // Reload saved plans to update usage stats
            await handleLoadSavedPlans();

            setSnackbar({
                open: true,
                message: `Assigned meal plan: ${planToAssign.planName}`,
                severity: 'success',
            });
        } catch (error) {
            console.error('Error assigning meal plan:', error);
            setSnackbar({
                open: true,
                message: `Failed to assign meal plan: ${error.message}`,
                severity: 'error',
            });
        }
    };

    const handleOpenDuplicateModal = (plan) => {
        console.log('=== Opening Duplicate Modal ===');
        console.log('Plan to duplicate:', plan);
        setPlanToDuplicate(plan);
        setDuplicateStartDate(selectedDate); // Default to currently viewed date
        setMakeActiveAfterDuplicate(true);
        setDuplicateModalOpen(true);
    };

    const handleOpenViewPlanModal = (plan) => {
        console.log('=== Opening View Plan Modal ===');
        console.log('Plan to view:', plan);
        setPlanToView(plan);
        setViewPlanModalOpen(true);
    };

    const handleDuplicateMealPlan = async () => {
        console.log('=== Duplicating Meal Plan Template ===');
        console.log('Plan ID:', planToDuplicate._id);
        console.log('Creating new template (no dates)');
        console.log('Will assign to date:', duplicateStartDate.format('YYYY-MM-DD'));
        console.log('Make active:', makeActiveAfterDuplicate);

        try {
            // Step 1: Duplicate the template (creates new template, no dates)
            const duplicatedPlan = await duplicateMealPlanAPI(
                getFreshIdToken,
                planToDuplicate._id
            );

            console.log('Duplicated template created:', duplicatedPlan._id);

            // Step 2: If makeActive, assign it to the selected date
            if (makeActiveAfterDuplicate) {
                console.log('Assigning duplicated template to date...');
                const result = await assignMealPlanAPI(
                    getFreshIdToken,
                    duplicatedPlan._id,
                    duplicateStartDate.toDate(),
                    true
                );
                console.log('Assignment created:', result.assignment);
            }

            // Close modal
            setDuplicateModalOpen(false);
            setPlanToDuplicate(null);

            // Reload saved plans list (with sorting)
            await handleLoadSavedPlans();

            // Navigate to the assignment date
            console.log('Navigating to assignment date:', duplicateStartDate.format('YYYY-MM-DD'));
            setSelectedDate(duplicateStartDate);

            // If makeActive was true, load the duplicated plan
            if (makeActiveAfterDuplicate) {
                setGeneratedMealPlan(duplicatedPlan);
                setGeneratedMealPlanId(duplicatedPlan._id);
                setCurrentDayIndex(0);
            }

            setSnackbar({
                open: true,
                message: `Meal plan duplicated successfully${makeActiveAfterDuplicate ? ' and assigned' : ''}`,
                severity: 'success',
            });
        } catch (error) {
            console.error('Error duplicating meal plan:', error);
            setSnackbar({
                open: true,
                message: `Failed to duplicate meal plan: ${error.message}`,
                severity: 'error',
            });
        }
    };

    const handleStartEditingPlanName = (plan) => {
        console.log('=== Start Editing Plan Name ===');
        console.log('Plan:', plan);
        setEditingPlanId(plan._id);
        setEditingPlanName(plan.planName);
    };

    const handleSaveEditedPlanName = async (newName) => {
        console.log('=== Saving Edited Plan Name ===');
        console.log('Plan ID:', editingPlanId);
        console.log('New name:', newName);

        // Use the passed value or fall back to state
        const nameToSave = newName !== undefined ? newName : editingPlanName;

        if (!editingPlanId || !nameToSave.trim()) {
            console.log('No plan ID or empty name, canceling');
            setEditingPlanId(null);
            setEditingPlanName('');
            return;
        }

        try {
            const token = await getFreshIdToken();
            const response = await fetch(`${API_BASE_URL}/api/meal-planner/${editingPlanId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ planName: nameToSave }),
            });

            if (response.ok) {
                console.log('Plan name updated successfully');

                // Update local state
                setSavedMealPlans(prev =>
                    prev.map(plan =>
                        plan._id === editingPlanId
                            ? { ...plan, planName: nameToSave }
                            : plan
                    )
                );

                // If this is the currently loaded plan, update it too
                if (generatedMealPlanId === editingPlanId) {
                    setGeneratedMealPlan(prev => ({ ...prev, planName: nameToSave }));
                }

                setSnackbar({
                    open: true,
                    message: 'Plan name updated successfully',
                    severity: 'success',
                });
            } else {
                console.error('Failed to update plan name');
                setSnackbar({
                    open: true,
                    message: 'Failed to update plan name',
                    severity: 'error',
                });
            }
        } catch (error) {
            console.error('Error updating plan name:', error);
            setSnackbar({
                open: true,
                message: `Error updating plan name: ${error.message}`,
                severity: 'error',
            });
        } finally {
            setEditingPlanId(null);
            setEditingPlanName('');
        }
    };

    const handleCancelEditingPlanName = () => {
        console.log('=== Cancel Editing Plan Name ===');
        setEditingPlanId(null);
        setEditingPlanName('');
    };

    const slugifyPlanName = (name) => {
        return String(name || '')
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '')
            .replace(/-{2,}/g, '-')
            .slice(0, 80);
    };

    const handleMealPlanVisibilityChange = async (plan, nextVisibility) => {
        if (!isAdmin) {
            setSnackbar({
                open: true,
                message: 'Admin access required to change visibility',
                severity: 'error',
            });
            return;
        }

        if (!plan?._id) return;

        if (nextVisibility === 'private') {
            try {
                const result = await updateMealPlanAPI(getFreshIdToken, plan._id, {
                    visibility: 'private',
                    slug: null,
                });

                const updated = result?.mealPlan || result?.data?.mealPlan || result?.mealPlan;
                const nextPlan = updated || { ...plan, visibility: 'private', slug: null };

                setSavedMealPlans((prev) =>
                    prev.map((p) => (p._id === plan._id ? { ...p, ...nextPlan } : p))
                );

                setSnackbar({
                    open: true,
                    message: 'Meal plan set to private',
                    severity: 'success',
                });
            } catch (error) {
                setSnackbar({
                    open: true,
                    message: `Failed to update visibility: ${error.message}`,
                    severity: 'error',
                });
            }
            return;
        }

        setPublishPlan(plan);
        setPublishTargetVisibility(nextVisibility);
        setPublishSlug(plan.slug || '');
        setPublishRecipesVisibility('unlisted');
        setPublishNonPublicRecipes([]);
        setPublishModalOpen(true);

        try {
            setPublishCheckLoading(true);
            const check = await getMealPlanPublishCheck(getFreshIdToken, plan._id);
            setPublishNonPublicRecipes(check?.nonPublicRecipes || []);
        } catch (error) {
            setSnackbar({
                open: true,
                message: `Failed to check plan recipes: ${error.message}`,
                severity: 'error',
            });
        } finally {
            setPublishCheckLoading(false);
        }
    };

    const handleConfirmPublishPlan = async () => {
        if (!publishPlan?._id) return;

        try {
            const trimmedSlug = publishSlug.trim();
            const payload = {
                visibility: publishTargetVisibility,
            };

            if (publishNonPublicRecipes.length > 0) {
                payload.recipesVisibility = publishRecipesVisibility;
            }
            if (trimmedSlug) payload.slug = trimmedSlug;

            const result = await publishMealPlan(getFreshIdToken, publishPlan._id, payload);

            const updatedPlan = result?.mealPlan || result?.data?.mealPlan || result?.mealPlan;
            const nextPlan = updatedPlan || {
                ...publishPlan,
                visibility: publishTargetVisibility,
                slug: publishSlug,
            };

            setSavedMealPlans((prev) =>
                prev.map((p) => (p._id === publishPlan._id ? { ...p, ...nextPlan } : p))
            );

            setPublishModalOpen(false);
            setPublishPlan(null);

            setSnackbar({
                open: true,
                message: `Meal plan published as ${publishTargetVisibility}`,
                severity: 'success',
            });
        } catch (error) {
            setSnackbar({
                open: true,
                message: `Failed to publish plan: ${error.message}`,
                severity: 'error',
            });
        }
    };

    const handleDeleteMealPlan = async (plan) => {
        console.log('=== Delete Meal Plan Requested ===');
        console.log('Plan:', plan);

        // Handle both plan object and planId string
        const planId = typeof plan === 'string' ? plan : plan._id;
        console.log('Plan ID:', planId);

        // Show confirmation dialog
        const result = await Swal.fire({
            title: 'Delete Meal Plan?',
            text: "This action cannot be undone. Are you sure you want to delete this meal plan?",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete it!',
            cancelButtonText: 'Cancel',
            customClass: {
                popup: 'my-swal-popup',
                container: 'my-swal-container'
            }
        });

        // If user clicked cancel, return early
        if (!result.isConfirmed) {
            console.log('Delete cancelled by user');
            return;
        }

        console.log('Delete confirmed, proceeding...');

        try {
            await deleteMealPlanAPI(getFreshIdToken, planId);

            // Remove from local state
            setSavedMealPlans(prev => prev.filter(plan => plan._id !== planId));

            // If the deleted plan is currently loaded, clear it
            if (generatedMealPlanId === planId) {
                setGeneratedMealPlan(null);
                setGeneratedMealPlanId(null);
            }

            console.log('Meal plan deleted successfully');

            setSnackbar({
                open: true,
                message: 'Meal plan deleted successfully',
                severity: 'success',
            });
        } catch (error) {
            console.error('Error deleting meal plan:', error);
            setSnackbar({
                open: true,
                message: `Failed to delete meal plan: ${error.message}`,
                severity: 'error',
            });
        }
    };

    const handleGenerateRecipe = async (dayIndex, mealType) => {
        console.log('=== Generate Recipe from Placeholder ===');
        console.log('Day Index:', dayIndex);
        console.log('Meal Type:', mealType);

        // Determine which plan we're working with (calendar view or library view)
        const planId = planToView?._id || generatedMealPlanId;
        const currentPlan = planToView || generatedMealPlan;

        console.log('Meal Plan ID:', planId);

        if (!planId) {
            setSnackbar({
                open: true,
                message: 'No meal plan found. Please generate a meal plan first.',
                severity: 'error',
            });
            return;
        }

        setGeneratingRecipe(mealType);

        try {
            let result = await generatePlaceholderRecipe(
                getFreshIdToken,
                planId,
                dayIndex,
                mealType
            );

            // Credit Check Logic
            if (result.requiresConfirmation) {
                if (!showCreditSpendConfirmationsInFuture) {
                    result = await generatePlaceholderRecipe(
                        getFreshIdToken,
                        planId,
                        dayIndex,
                        mealType,
                        { confirm: true }
                    );
                } else {
                    setCreditConfirmationData({
                        ...result,
                        action: 'GENERATE_RECIPE',
                        params: { planId, dayIndex, mealType, currentPlan }
                    });
                    setShowCreditConfirmationModal(true);
                    setGeneratingRecipe(null); // Reset here since we are waiting for user
                    return;
                }
            }

            if (result.insufficientCredits) {
                setCreditsRequiredData(result);
                setShowCreditsRequiredModal(true);
                setGeneratingRecipe(null);
                return;
            }

            console.log('[WeeklyMealPlanner] Recipe generated for placeholder:', result);

            const applyMealUpdate = (plan, updates) => {
                if (!plan?.days?.[dayIndex]?.meals?.[mealType.toLowerCase()]) {
                    return plan;
                }

                const nextPlan = JSON.parse(JSON.stringify(plan));
                const mealTypeKey = mealType.toLowerCase();
                nextPlan.days[dayIndex].meals[mealTypeKey] = {
                    ...nextPlan.days[dayIndex].meals[mealTypeKey],
                    ...updates,
                };

                return nextPlan;
            };

            const updateMealPlanState = (updates) => {
                if (planToView) {
                    setPlanToView(prev => (prev ? applyMealUpdate(prev, updates) : prev));
                    setSavedMealPlans(prev =>
                        prev.map(plan => (plan._id === planId ? applyMealUpdate(plan, updates) : plan))
                    );
                } else {
                    setGeneratedMealPlan(prev => (prev ? applyMealUpdate(prev, updates) : prev));
                }
            };

            const mealTypeKey = mealType.toLowerCase();

            console.log('[WeeklyMealPlanner] Marking meal slot as image generating:', {
                planId,
                dayIndex,
                mealType,
                recipeId: result.recipe._id,
            });

            updateMealPlanState({
                recipeId: result.recipe._id,
                recipeTitle: result.recipe.recipeTitle,
                recipeDescription: result.recipe.recipeDescription,
                recipeDiet: result.recipe.recipeDiet,
                recipeImage: result.recipe.recipeImage,
                recipeImageVersion: result.recipe.imageVersion || 0,
                mealType: result.recipe.mealType,
                isPlaceholder: false,
                isImageGenerating: true,
            });

            const handleImageGeneration = async () => {
                try {
                    console.log('[WeeklyMealPlanner] Starting image generation request:', result.recipe._id);
                    const imageResponse = await generateRecipeImage(result.recipe._id, getFreshIdToken);
                    console.log('[WeeklyMealPlanner] Image generation response received:', imageResponse);
                    const imageUrls = imageResponse?.data || imageResponse?.recipe?.recipeImage || imageResponse?.imageUrls;

                    if (!imageUrls) {
                        console.warn('[WeeklyMealPlanner] Image generation response missing image URLs:', imageResponse);
                        updateMealPlanState({ isImageGenerating: false });
                        setSnackbar({
                            open: true,
                            message: 'Recipe image generation completed, but no image was returned.',
                            severity: 'warning',
                        });
                        return;
                    }

                    updateMealPlanState({
                        recipeImage: imageUrls,
                        recipeImageVersion: (currentPlan?.days?.[dayIndex]?.meals?.[mealTypeKey]?.recipeImageVersion || 0) + 1,
                        isImageGenerating: false,
                    });
                } catch (imageError) {
                    console.error('[WeeklyMealPlanner] Image generation request failed:', imageError);
                    updateMealPlanState({ isImageGenerating: false });
                    setSnackbar({
                        open: true,
                        message: `Failed to generate recipe image: ${imageError.message}`,
                        severity: 'warning',
                    });
                }
            };

            handleImageGeneration();

            setSnackbar({
                open: true,
                message: `Recipe "${result.recipe.recipeTitle}" generated! Image is on the way.`,
                severity: 'success',
            });

            // Optimistically update API usage limits in UserContext
            if (user?.apiUsage?.limits?.mealPlanner) {
                setUser({
                    ...user,
                    apiUsage: {
                        ...user.apiUsage,
                        limits: {
                            ...user.apiUsage.limits,
                            mealPlanner: {
                                ...user.apiUsage.limits.mealPlanner,
                                remaining: user.apiUsage.limits.mealPlanner.remaining - 1
                            }
                        }
                    }
                });
            }
        } catch (error) {
            console.error('Error generating recipe:', error);
            setSnackbar({
                open: true,
                message: `Failed to generate recipe: ${error.message}`,
                severity: 'error',
            });
        } finally {
            setGeneratingRecipe(null);
        }
    };

    const handleGeneratePlaceholder = async (dayIndex, mealType) => {
        console.log('=== Generate Placeholder Meal Idea ===');
        console.log('Day Index:', dayIndex);
        console.log('Meal Type:', mealType);

        // Determine which plan we're working with (calendar view or library view)
        const planId = planToView?._id || generatedMealPlanId;
        const currentPlan = planToView || generatedMealPlan;

        console.log('Meal Plan ID:', planId);

        if (!planId) {
            setSnackbar({
                open: true,
                message: 'No meal plan found. Please generate a meal plan first.',
                severity: 'error',
            });
            return;
        }

        setGeneratingRecipe(mealType);

        try {
            const result = await generatePlaceholderIdea(
                getFreshIdToken,
                planId,
                dayIndex,
                mealType
            );

            console.log('Placeholder idea generated:', result);

            // Update the meal plan in state with the new placeholder
            const updatedMealPlan = { ...currentPlan };
            const mealTypeKey = mealType.toLowerCase();
            updatedMealPlan.days[dayIndex].meals[mealTypeKey] = {
                title: result.placeholder.title,
                description: result.placeholder.description,
                mealType: mealType,
                isPlaceholder: true,
            };

            console.log('Updated meal plan:', updatedMealPlan);

            // Update the appropriate state
            if (planToView) {
                setPlanToView(updatedMealPlan);

                // Also update the savedMealPlans array so the library view reflects the change
                setSavedMealPlans(prev =>
                    prev.map(plan => {
                        if (plan._id === planId) {
                            // Deep copy to ensure nested updates are reflected
                            return JSON.parse(JSON.stringify(updatedMealPlan));
                        }
                        return plan;
                    })
                );
            } else {
                setGeneratedMealPlan(updatedMealPlan);
            }

            setSnackbar({
                open: true,
                message: `Meal idea "${result.placeholder.title}" generated successfully!`,
                severity: 'success',
            });

            // Optimistically update API usage limits in UserContext
            if (user?.apiUsage?.limits?.mealPlanner) {
                setUser({
                    ...user,
                    apiUsage: {
                        ...user.apiUsage,
                        limits: {
                            ...user.apiUsage.limits,
                            mealPlanner: {
                                ...user.apiUsage.limits.mealPlanner,
                                remaining: user.apiUsage.limits.mealPlanner.remaining - 1
                            }
                        }
                    }
                });
            }
        } catch (error) {
            console.error('Error generating placeholder idea:', error);
            setSnackbar({
                open: true,
                message: `Failed to generate meal idea: ${error.message}`,
                severity: 'error',
            });
        } finally {
            setGeneratingRecipe(null);
        }
    };

    const handleReplaceMeal = async (dayIndex, mealType, selectedRecipe) => {
        console.log('=== Replace Meal ===');
        console.log('Day Index:', dayIndex);
        console.log('Meal Type:', mealType);
        console.log('Selected Recipe:', selectedRecipe.recipeTitle);

        const planId = planToView?._id || generatedMealPlanId;

        if (!planId) {
            setSnackbar({
                open: true,
                message: 'No meal plan found.',
                severity: 'error',
            });
            return;
        }

        try {
            const token = await getFreshIdToken();

            // Update the meal in the plan
            const response = await fetch(`${API_BASE_URL}/api/meal-planner/${planId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    dayIndex,
                    mealType,
                    updates: {
                        recipeId: selectedRecipe._id,
                        recipeTitle: selectedRecipe.recipeTitle,
                        recipeDescription: selectedRecipe.recipeDescription,
                        recipeDiet: selectedRecipe.recipeDiet,
                        recipeImage: selectedRecipe.recipeImage,
                        mealType: selectedRecipe.mealType,
                        isPlaceholder: false,
                    },
                }),
            });

            if (response.ok) {
                console.log('Meal replaced successfully');

                // Update local state
                const updatedPlan = planToView ? { ...planToView } : { ...generatedMealPlan };
                updatedPlan.days[dayIndex].meals[mealType] = {
                    recipeId: selectedRecipe._id,
                    recipeTitle: selectedRecipe.recipeTitle,
                    recipeDescription: selectedRecipe.recipeDescription,
                    recipeDiet: selectedRecipe.recipeDiet,
                    recipeImage: selectedRecipe.recipeImage,
                    mealType: selectedRecipe.mealType,
                    isPlaceholder: false,
                };

                if (planToView) {
                    setPlanToView(updatedPlan);

                    // Update savedMealPlans array
                    setSavedMealPlans(prev =>
                        prev.map(plan => {
                            if (plan._id === planId) {
                                return JSON.parse(JSON.stringify(updatedPlan));
                            }
                            return plan;
                        })
                    );
                } else {
                    setGeneratedMealPlan(updatedPlan);
                }

                setSnackbar({
                    open: true,
                    message: `Meal replaced with "${selectedRecipe.recipeTitle}"`,
                    severity: 'success',
                });
            } else {
                throw new Error('Failed to replace meal');
            }
        } catch (error) {
            console.error('Error replacing meal:', error);
            setSnackbar({
                open: true,
                message: `Failed to replace meal: ${error.message}`,
                severity: 'error',
            });
        }
    };

    const handleRemoveMeal = async (dayIndex, mealType) => {
        console.log('=== Remove Meal ===');
        console.log('Day Index:', dayIndex);
        console.log('Meal Type:', mealType);

        const planId = planToView?._id || generatedMealPlanId;

        if (!planId) {
            setSnackbar({
                open: true,
                message: 'No meal plan found.',
                severity: 'error',
            });
            return;
        }

        try {
            const token = await getFreshIdToken();

            // Update the meal to null (remove it)
            const response = await fetch(`${API_BASE_URL}/api/meal-planner/${planId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    dayIndex,
                    mealType,
                    updates: null, // Set to null to clear the slot
                }),
            });

            if (response.ok) {
                console.log('Meal removed successfully');

                // Update local state
                const updatedPlan = planToView ? { ...planToView } : { ...generatedMealPlan };
                updatedPlan.days[dayIndex].meals[mealType] = null;

                if (planToView) {
                    setPlanToView(updatedPlan);

                    // Update savedMealPlans array
                    setSavedMealPlans(prev =>
                        prev.map(plan => {
                            if (plan._id === planId) {
                                return JSON.parse(JSON.stringify(updatedPlan));
                            }
                            return plan;
                        })
                    );
                } else {
                    setGeneratedMealPlan(updatedPlan);
                }

                setSnackbar({
                    open: true,
                    message: 'Meal removed successfully',
                    severity: 'success',
                });
            } else {
                throw new Error('Failed to remove meal');
            }
        } catch (error) {
            console.error('Error removing meal:', error);
            setSnackbar({
                open: true,
                message: `Failed to remove meal: ${error.message}`,
                severity: 'error',
            });
        }
    };

    const handleSurpriseMe = async (dayIndex, mealType) => {
        console.log('=== Surprise Me ===');
        console.log('Day Index:', dayIndex);
        console.log('Meal Type:', mealType);

        const planId = planToView?._id || generatedMealPlanId;
        const currentPlan = planToView || generatedMealPlan;

        if (!planId) {
            setSnackbar({
                open: true,
                message: 'No meal plan found.',
                severity: 'error',
            });
            return;
        }

        setGeneratingRecipe(mealType);

        try {
            const token = await getFreshIdToken();

            // Call backend to generate surprise meal
            const response = await fetch(`${API_BASE_URL}/api/meal-planner/${planId}/surprise-me`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    dayIndex,
                    mealType,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to generate surprise meal');
            }

            const result = await response.json();
            console.log('Surprise meal result:', result);

            // Update local state
            const updatedPlan = { ...currentPlan };
            updatedPlan.days[dayIndex].meals[mealType] = result.meal;

            if (planToView) {
                setPlanToView(updatedPlan);

                // Update savedMealPlans array
                setSavedMealPlans(prev =>
                    prev.map(plan => {
                        if (plan._id === planId) {
                            return JSON.parse(JSON.stringify(updatedPlan));
                        }
                        return plan;
                    })
                );
            } else {
                setGeneratedMealPlan(updatedPlan);
            }

            const message = result.meal.isPlaceholder
                ? `AI generated: "${result.meal.title}"`
                : `Surprise! Meal replaced with "${result.meal.recipeTitle}"`;

            setSnackbar({
                open: true,
                message,
                severity: 'success',
            });
        } catch (error) {
            console.error('Error in Surprise Me:', error);
            setSnackbar({
                open: true,
                message: `Failed to surprise you: ${error.message}`,
                severity: 'error',
            });
        } finally {
            setGeneratingRecipe(null);
        }
    };

    const handleEditMeal = async (planId, dayIndex, mealType, newTitle, newDescription) => {
        console.log('=== Edit Meal ===');
        console.log('Plan ID:', planId);
        console.log('Day Index:', dayIndex);
        console.log('Meal Type:', mealType);
        console.log('New Title:', newTitle);
        console.log('New Description:', newDescription);

        try {
            const token = await getFreshIdToken();

            // Update the meal in the plan (only title and description for placeholders)
            const response = await fetch(`${API_BASE_URL}/api/meal-planner/${planId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    dayIndex,
                    mealType,
                    updates: {
                        title: newTitle,
                        description: newDescription,
                    },
                }),
            });

            if (response.ok) {
                console.log('Meal updated successfully');

                // Update local state if this is the currently viewed plan
                if (planToView && planToView._id === planId) {
                    const updatedPlan = { ...planToView };
                    updatedPlan.days[dayIndex].meals[mealType] = {
                        ...updatedPlan.days[dayIndex].meals[mealType],
                        title: newTitle,
                        description: newDescription,
                    };
                    setPlanToView(updatedPlan);
                }

                setSnackbar({
                    open: true,
                    message: 'Meal updated successfully',
                    severity: 'success',
                });
            } else {
                throw new Error('Failed to update meal');
            }
        } catch (error) {
            console.error('Error updating meal:', error);
            setSnackbar({
                open: true,
                message: `Failed to update meal: ${error.message}`,
                severity: 'error',
            });
        }
    };

    const handleUnassignMealPlan = async () => {
        console.log('=== Unassign Meal Plan ===');
        console.log('Selected date:', selectedDate.format('YYYY-MM-DD'));
        console.log('Current plan:', generatedMealPlan?.planName);

        // Show confirmation dialog
        const result = await Swal.fire({
            title: 'Unassign Meal Plan?',
            text: `This will remove "${generatedMealPlan?.planName}" from ${selectedDate.format('MMM DD, YYYY')}. The plan template will remain in your library.`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#1976d2',
            cancelButtonColor: '#9e9e9e',
            confirmButtonText: 'Yes, unassign it',
            cancelButtonText: 'Cancel',
        });

        if (!result.isConfirmed) {
            console.log('Unassign cancelled by user');
            return;
        }

        console.log('Unassign confirmed, proceeding...');

        try {
            await unassignMealPlanAPI(getFreshIdToken, selectedDate.toDate());

            console.log('Meal plan unassigned successfully');

            // Clear the plan from view
            setGeneratedMealPlan(null);
            setGeneratedMealPlanId(null);
            setCurrentDayIndex(0);

            setSnackbar({
                open: true,
                message: 'Meal plan unassigned successfully',
                severity: 'success',
            });
        } catch (error) {
            console.error('Error unassigning meal plan:', error);
            setSnackbar({
                open: true,
                message: `Failed to unassign meal plan: ${error.message}`,
                severity: 'error',
            });
        }
    };

    const calendarOpen = Boolean(calendarAnchorEl);

    // Use generated meal plan if available, otherwise show empty state
    const mealPlanToDisplay = generatedMealPlan?.days || [];
    const currentDayData = mealPlanToDisplay[currentDayIndex];

    console.log('Render - generatedMealPlan:', generatedMealPlan);
    console.log('Render - mealPlanToDisplay:', mealPlanToDisplay);
    console.log('Render - currentDayIndex:', currentDayIndex);
    console.log('Render - currentDayData:', currentDayData);

    // Get the day name from the selected date
    const selectedDayName = selectedDate.format('dddd'); // e.g., "Tuesday"

    return (
        <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Container maxWidth="lg" sx={{ py: { xs: 0, sm: 4 }, px: { xs: 0, sm: 3 } }}>
                <Paper elevation={3} sx={{ p: { xs: 2, md: 4 }, borderRadius: { xs: 0, sm: 4 }, backgroundColor: 'white' }}>
                    {/* Header */}
                    <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
                        Weekly Meal Planner
                    </Typography>

                    {/* Tab Navigation */}
                    <MealPlannerTabs
                        activeTab={activeTab}
                        onTabChange={handleTabChange}
                    />

                    {/* Tab Content */}
                    {activeTab === 'library' ? (
                        <MealPlansLibrary
                            savedMealPlans={savedMealPlans}
                            loadingPlans={loadingPlans}
                            onOpenSettings={() => setSettingsOpen(true)}
                            onGenerateNewPlan={handleGenerateMealPlan}
                            onAssignPlan={handleOpenAssignModal}
                            onViewPlan={handleOpenViewPlanModal}
                            onDuplicatePlan={handleOpenDuplicateModal}
                            onDeletePlan={handleDeleteMealPlan}
                            isAdmin={isAdmin}
                            onVisibilityChange={handleMealPlanVisibilityChange}
                            editingPlanId={editingPlanId}
                            editingPlanName={editingPlanName}
                            onStartEditingPlanName={handleStartEditingPlanName}
                            onSaveEditedPlanName={handleSaveEditedPlanName}
                            onCancelEditingPlanName={handleCancelEditingPlanName}
                            onEditPlanName={setEditingPlanName}
                            isGenerating={isGenerating}
                        />
                    ) : activeTab === 'calendar' ? (
                        <CalendarView
                            selectedDate={selectedDate}
                            onPrevDay={handlePrevDay}
                            onNextDay={handleNextDay}
                            onOpenCalendar={handleDateButtonClick}
                            generatedMealPlan={generatedMealPlan}
                            currentDayIndex={currentDayIndex}
                            onMealClick={handleTitleClick}
                            onUnassign={handleUnassignMealPlan}
                        />
                    ) : (
                        <UsageView />
                    )}

                    {/* Calendar Popover */}
                    <Popover
                        open={calendarOpen}
                        anchorEl={calendarAnchorEl}
                        onClose={handleCalendarClose}
                        anchorOrigin={{
                            vertical: 'bottom',
                            horizontal: 'center',
                        }}
                        transformOrigin={{
                            vertical: 'top',
                            horizontal: 'center',
                        }}
                    >
                        <DateCalendar
                            value={selectedDate}
                            onChange={handleDateChange}
                            sx={{
                                '& .MuiPickersDay-root': {
                                    '&.Mui-selected': {
                                        backgroundColor: 'primary.main',
                                    },
                                },
                            }}
                        />
                    </Popover>

                    {/* Assign Plan Modal */}
                    <AssignPlanModal
                        open={assignModalOpen}
                        onClose={() => setAssignModalOpen(false)}
                        plan={planToAssign}
                        selectedDate={assignStartDate}
                        onDateChange={setAssignStartDate}
                        makeActive={makeActiveAfterAssign}
                        onMakeActiveChange={setMakeActiveAfterAssign}
                        onConfirm={handleConfirmAssign}
                    />

                    <Modal
                        open={publishModalOpen}
                        onClose={() => {
                            setPublishModalOpen(false);
                            setPublishPlan(null);
                        }}
                        aria-labelledby="publish-plan-modal-title"
                    >
                        <Box
                            sx={{
                                position: 'absolute',
                                top: '50%',
                                left: '50%',
                                transform: 'translate(-50%, -50%)',
                                width: { xs: '95%', sm: 560 },
                                bgcolor: 'background.paper',
                                borderRadius: 2,
                                boxShadow: 24,
                                p: 3,
                            }}
                        >
                            <Typography id="publish-plan-modal-title" variant="h6" sx={{ mb: 2 }}>
                                Publish meal plan
                            </Typography>

                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                Visibility: <strong>{publishTargetVisibility}</strong>
                            </Typography>

                            <TextField
                                label="Slug"
                                value={publishSlug}
                                onChange={(e) => setPublishSlug(e.target.value)}
                                fullWidth
                                size="small"
                                sx={{ mb: 2 }}
                            />

                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                Link will be: <strong>{`${MARKETING_BASE_URL}/plans/${publishSlug || ''}`}</strong>
                            </Typography>

                            {publishCheckLoading ? (
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                    Checking recipes...
                                </Typography>
                            ) : publishNonPublicRecipes.length > 0 ? (
                                <Box sx={{ mb: 2 }}>
                                    <Typography variant="body2" sx={{ mb: 1 }}>
                                        This plan contains recipes that are not public yet:
                                    </Typography>
                                    <Box sx={{ maxHeight: 160, overflow: 'auto', border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 1 }}>
                                        {publishNonPublicRecipes.map((r) => (
                                            <Typography key={r._id} variant="body2" color="text.secondary">
                                                - {r.recipeTitle}
                                            </Typography>
                                        ))}
                                    </Box>
                                    <FormControl sx={{ mt: 2 }}>
                                        <FormLabel>Set these recipes to:</FormLabel>
                                        <RadioGroup
                                            value={publishRecipesVisibility}
                                            onChange={(e) => setPublishRecipesVisibility(e.target.value)}
                                        >
                                            <FormControlLabel
                                                value="unlisted"
                                                control={<Radio />}
                                                label="Unlisted (viewable by link, not shown on public recipes page)"
                                            />
                                            <FormControlLabel
                                                value="public"
                                                control={<Radio />}
                                                label="Public (shown on public recipes page)"
                                            />
                                        </RadioGroup>
                                    </FormControl>
                                </Box>
                            ) : null}

                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                                <Button
                                    variant="outlined"
                                    onClick={() => {
                                        setPublishModalOpen(false);
                                        setPublishPlan(null);
                                    }}
                                    sx={{ textTransform: 'none' }}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    variant="contained"
                                    onClick={handleConfirmPublishPlan}
                                    disabled={
                                        publishCheckLoading
                                    }
                                    sx={{ textTransform: 'none' }}
                                >
                                    Publish
                                </Button>
                            </Box>
                        </Box>
                    </Modal>

                </Paper>

                {/* Recipe Modal */}
                <Modal
                    open={modalOpen}
                    onClose={handleCloseModal}
                    aria-labelledby="recipe-modal-title"
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        p: 2,
                    }}
                >
                    <Box
                        sx={{
                            position: 'relative',
                            maxHeight: '90vh',
                            maxWidth: '600px',
                            width: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            '&:focus': {
                                outline: 'none',
                            },
                        }}
                    >
                        {/* Sticky Header Bar with Close Button */}
                        <Box
                            sx={{
                                display: 'flex',
                                justifyContent: 'flex-end',
                                alignItems: 'center',
                                backgroundColor: 'white',
                                borderBottom: '1px solid',
                                borderColor: 'divider',
                                py: 1,
                                px: 2,
                                position: 'sticky',
                                top: 0,
                                zIndex: 10,
                            }}
                        >
                            <Tooltip title="Close" arrow>
                                <IconButton
                                    onClick={handleCloseModal}
                                    size="small"
                                    sx={{
                                        '&:hover': {
                                            backgroundColor: 'action.hover',
                                        },
                                    }}
                                >
                                    <Close />
                                </IconButton>
                            </Tooltip>
                        </Box>

                        {/* Scrollable Recipe Content */}
                        <Box sx={{ overflowY: 'auto', flex: 1 }}>
                            {selectedRecipe && (
                                <RecipeCard
                                    recipe={selectedRecipe}
                                    showSaveButton={true}
                                    onDataChange={handleRecipeDataChange}
                                />
                            )}
                        </Box>
                    </Box>
                </Modal>

                {/* Duplicate Modal */}
                <DuplicatePlanModal
                    open={duplicateModalOpen}
                    onClose={() => setDuplicateModalOpen(false)}
                    plan={planToDuplicate}
                    startDate={duplicateStartDate}
                    onStartDateChange={setDuplicateStartDate}
                    makeActive={makeActiveAfterDuplicate}
                    onMakeActiveChange={setMakeActiveAfterDuplicate}
                    onConfirm={handleDuplicateMealPlan}
                />

                {/* View Plan Modal */}
                <ViewPlanModal
                    open={viewPlanModalOpen}
                    onClose={() => setViewPlanModalOpen(false)}
                    plan={planToView}
                    onMealClick={handleTitleClick}
                    onGenerateRecipe={handleGenerateRecipe}
                    onGeneratePlaceholder={handleGeneratePlaceholder}
                    onReplaceMeal={handleReplaceMeal}
                    onSurpriseMe={handleSurpriseMe}
                    onEditMeal={handleEditMeal}
                    onRemoveMeal={handleRemoveMeal}
                    generatingRecipe={generatingRecipe}
                    onAddPlanIngredients={handleAddPlanIngredients}
                    isAddingPlanIngredients={isAddingPlanIngredients}
                />

                {/* Settings Modal */}
                <MealPlannerSettings
                    open={settingsOpen}
                    onClose={handleSettingsClose}
                    onSave={handleSettingsSave}
                    initialSettings={mealPlanSettings}
                />

                {/* Snackbar for notifications */}
                <Snackbar
                    open={snackbar.open}
                    autoHideDuration={6000}
                    onClose={handleCloseSnackbar}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                >
                    <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
                        {snackbar.message}
                    </Alert>
                </Snackbar>

                {/* Credit Modals */}
                <CreditConfirmationModal
                    open={showCreditConfirmationModal}
                    onConfirm={handleCreditConfirm}
                    onCancel={handleCreditCancel}
                    featureName={creditConfirmationData?.featureName || 'Action'}
                    cost={creditConfirmationData?.cost || 0}
                    currentBalance={creditConfirmationData?.balance || 0}
                    balanceAfter={creditConfirmationData?.balance ? creditConfirmationData.balance - (creditConfirmationData.cost || 0) : 0}
                    showConfirmationsInFuture={showCreditSpendConfirmationsInFuture}
                    onShowConfirmationsInFutureChange={updateShowCreditSpendConfirmationsInFuture}
                />

                <CreditsRequiredModal
                    open={showCreditsRequiredModal}
                    onClose={() => setShowCreditsRequiredModal(false)}
                    creditsRequired={creditsRequiredData?.cost || 0}
                    creditsAvailable={creditsRequiredData?.balance || 0}
                    featureName={creditsRequiredData?.featureName || 'Action'}
                />
            </Container>
        </LocalizationProvider>
    );
};

export default WeeklyMealPlanner;
