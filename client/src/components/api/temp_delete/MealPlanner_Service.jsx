import { useState, useRef, useEffect } from 'react'
import { getAuth } from 'firebase/auth'
import { getWeeklyMealPlan } from '../ai.js'
import {
    List,
    ListItem,
    ListItemText,
    Card,
    CardContent,
    TextField,
    Button,
    Checkbox,
    FormGroup,
    FormControlLabel,
    Paper,
    Typography,
    Box,
    CircularProgress,
    Divider,
    Alert,
    FormControl as MuiFormControl, // Renamed to avoid conflict
    InputLabel,
    Select,
    MenuItem,
} from '@mui/material' // Added Alert
import { Calendar, ChefHat, ShoppingCart, Edit, Save, BookmarkIcon, XCircle } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import Copy_Text from './Copy_Text.jsx'
import { LoadingSpinner } from './LoadingSpinner.jsx'
import { API_BASE_URL } from '../env-config.js'
import { useApiLimits } from '../context/ApiLimitsContext.jsx'
import ApiUsageDisplay from '../context/ApiUsageDisplay'
import { Link } from 'react-router'; // Assuming you use react-router for Links
import AIStyleSelector from './UI/AIStyleSelector.jsx'

export default function MealPlanner_Service() {

    const trackClick = () => {
        // Check if umami is available in the window object
        if (typeof window !== 'undefined' && window.umami) {
            window.umami.track('create_meal_plan_button_click', {
                source: 'meal_planner_page',
                location: 'create_meal_plan_button',
                button_text: 'Create 7-Day Meal Plan'
            });
            //console.log(`(MealPlanner_Service.jsx - Umami) - Create 7-Day Meal Plan button clicked`);

        }
    };
    const auth = getAuth()
    const [mealPlanText, setMealPlanText] = useState("")
    const [formDisabled, setFormDisabled] = useState(false)
    const [isAILoading, setIsAILoading] = useState(false)
    const [error, setError] = useState(null)
    const [responseId, setResponseId] = useState('')
    const [isSaved, setIsSaved] = useState(false)
    const { setApiLimits } = useApiLimits()
    const [isLoading, setIsLoading] = useState(true) // For fetching user data
    const [isUpdating, setIsUpdating] = useState(false); // For update operation spinner
    const [isEditing, setIsEditing] = useState(false)
    const [saveSuccess, setSaveSuccess] = useState(false)
    const [isPremium, setIsPremium] = useState(false); // TODO: update this based on the result of getPremiumStatus.jsx
    // Flag to prevent multiple scrolls per generation
    const [hasScrolledToResponse, setHasScrolledToResponse] = useState(false);
    const [convoStyle, setConvoStyle] = useState('')

    // Add ref for the abort controller
    const streamController = useRef(null);
    // Add ref for scrolling
    const mealPlanResponseSection = useRef(null);


    // --- State for User Data ---
    const [userData, setUserData] = useState({
        // Initialize with defaults or nulls
        firstName: '', // Keep other fields if needed for the PATCH request
        lastName: '',
        conditionTreating: '',
        therapeuticDiet: '',
        weightValue: null,
        weightUnit: 'kg', // Default unit
        sex: 'Not Specified',
        activity: 'Not Specified',
        // other fields if fetched...
        // apiUsage info (fetched separately or together)
        mealPlannerUsesRemaining: '',
        apiLastReset: '',
        accountCreationDate: null,
        lastLoginDate: null,
        nextBillingDate: null, // Example for premium info
    });
    // Store originally fetched data to revert on cancel
    const [bioUserData, setBioUserData] = useState(null);


    // Meal plan preferences state (remains the same)
    const [preferences, setPreferences] = useState({
        includeMeals: { breakfast: true, lunch: true, dinner: true, snack: true },
        cookingPreferences: { cooking: true, baking: true, homemade: true },
        includeShoppingList: true,
        dietaryRestrictions: '',
        favoriteIngredients: '',
        dislikedIngredients: '',
    })

    // --- Fetch User Data ---
    const fetchUserData = async () => {
        // Use currentUser directly from auth hook scope
        const currentUser = auth.currentUser;
        if (currentUser) {
            setIsLoading(true);
            setError(null);
            //console.log('Fetching user data for UID:', currentUser.uid);
            try {
                // --- Get ID Token ---
                const idToken = await currentUser.getIdToken();
                // --------------------

                const response = await fetch(`${API_BASE_URL}/api/users/${currentUser.uid}`, {
                    headers: {
                        // --- Add Auth Header ---
                        'Authorization': `Bearer ${idToken}`
                        // ---------------------
                    }
                });
                if (!response.ok) {
                    let errorBody = 'Could not read error body';
                    try { errorBody = await response.text(); } catch (e) { }
                    console.error(`(MealPlanner fetchUserData) Fetch error status: ${response.status}, body: ${errorBody}`);
                    throw new Error(`Failed to fetch user data (status: ${response.status})`);
                }
                const apiUserData = await response.json();
                //console.log('Fetched MongoDB User Data:', apiUserData);

                const fetchedData = {
                    firstName: apiUserData.firstName || '',
                    lastName: apiUserData.lastName || '',
                    conditionTreating: apiUserData.conditionTreating || '',
                    therapeuticDiet: apiUserData.therapeuticDiet || '',
                    weightValue: apiUserData.weightValue,
                    weightUnit: apiUserData.weightUnit || 'kg',
                    sex: apiUserData.sex || 'Not Specified',
                    activity: apiUserData.activity || 'Not Specified', // <-- Fetch activity
                    mealPlannerUsesRemaining: apiUserData.apiUsage?.limits?.mealPlanner?.remaining,
                    apiLastReset: apiUserData.apiUsage?.lastReset,
                    accountCreationDate: apiUserData.createdAt,
                    lastLoginDate: apiUserData.lastLogin,
                    nextBillingDate: apiUserData.paymentStatus?.nextBillingDate,
                };

                setUserData(prev => ({ ...prev, ...fetchedData }));
                setBioUserData(fetchedData); // <-- Store original fetched data including activity

                // Update specific state if needed (though it's in userData now)
                //setMealPlannerUsesRemaining(apiUserData.apiUsage?.limits?.mealPlanner?.remaining);
                //setLastResetTime(apiUserData.apiUsage?.lastReset);
                // Set premium status based on fetched data (example)
                setIsPremium(apiUserData.paymentStatus?.status === 'active');

            } catch (err) {
                console.error('Error fetching user data:', err);
                setError(`Error loading profile: ${err.message}`);
                // Keep existing data or clear it? Decide based on UX preference.
                // setUserData({ ...initial state... }); // Option to clear
            } finally {
                setIsLoading(false); // Stop loading indicator for fetch
            }
        } else {
            //console.log("No user logged in, cannot fetch data.");
            setIsLoading(false); // Ensure loading stops if no user
            setUserData({ // Reset user data on logout
                firstName: '', lastName: '', conditionTreating: '', therapeuticDiet: '',
                weightValue: null, weightUnit: 'kg', sex: 'Not Specified', activity: 'Not Specified',
                mealPlannerUsesRemaining: '', apiLastReset: '', accountCreationDate: null, lastLoginDate: null, nextBillingDate: null,
            });
            setBioUserData(null);
        }
    };
    // --- END MODIFIED ---

    // --- Call fetchUserData on mount and when auth state changes ---
    // Fetch user data on auth state change
    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(user => {
            fetchUserData(); // Call fetchUserData which now checks auth.currentUser internally
            if (!user) {
                // Explicitly clear meal plan related state on logout too
                setError(null);
                setMealPlanText("");
                setIsEditing(false);
                setIsSaved(false);
            }
        });
        return () => unsubscribe();
    }, [auth]); // Depend only on auth


    // --- MODIFIED: Handle Profile Update ---
    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        const currentUser = auth.currentUser;
        if (!currentUser) {
            setError("You must be logged in to update your profile.");
            return;
        }

        setIsUpdating(true);
        setSaveSuccess(false);
        setError(null);
        try {
            const updatePayload = {
                weightValue: userData.weightValue ? Number(userData.weightValue) : null,
                weightUnit: userData.weightUnit, sex: userData.sex, activity: userData.activity,
            };
            //console.log("Sending update payload:", updatePayload);

            // --- Get ID Token ---
            const idToken = await currentUser.getIdToken();
            // --------------------

            const response = await fetch(`${API_BASE_URL}/api/users/${currentUser.uid}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    // --- Add Auth Header ---
                    'Authorization': `Bearer ${idToken}`
                    // ---------------------
                },
                body: JSON.stringify(updatePayload)
            });

            if (response.ok) {
                const updatedUser = await response.json();
                //console.log("Profile updated successfully:", updatedUser);
                setIsEditing(false);
                setSaveSuccess(true);
                const updatedData = {
                    weightValue: updatedUser.weightValue, weightUnit: updatedUser.weightUnit,
                    sex: updatedUser.sex, activity: updatedUser.activity,
                };
                setUserData(prev => ({ ...prev, ...updatedData }));
                setBioUserData(prev => ({ ...prev, ...updatedData }));
                setTimeout(() => setSaveSuccess(false), 3000);
            } else {
                let errorData = { error: `Failed to update profile (status: ${response.status})` };
                try { errorData = await response.json(); } catch (err) { }
                throw new Error(errorData.error || `Failed to update profile`);
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            setError(`Update failed: ${error.message}`);
        } finally {
            setIsUpdating(false);
        }
    };
    // --- END MODIFIED ---

    // --- Handle Cancel Edit ---
    const handleCancelEdit = () => {
        setUserData(prev => ({ // Revert to original data
            ...prev,
            weightValue: bioUserData?.weightValue,
            weightUnit: bioUserData?.weightUnit || 'kg',
            sex: bioUserData?.sex || '',
            activity: bioUserData?.activity || 'Not Specified', // <-- Revert activity
        }));
        setIsEditing(false);
        setError(null); // Clear any previous errors shown during edit
    };

    // Add effect to scroll when text appears and reset scroll flag on new generation
    useEffect(() => {
        if (isAILoading) {
            setHasScrolledToResponse(false); // Reset scroll flag when starting
        } else if (mealPlanText && mealPlanResponseSection.current && !hasScrolledToResponse) {
            //console.log("(MealPlanner_Service) - Scrolling to response section");
            mealPlanResponseSection.current.scrollIntoView({ behavior: 'smooth' });
            setHasScrolledToResponse(true); // Prevent re-scrolling on chunk updates
        }
    }, [isAILoading, mealPlanText, hasScrolledToResponse]); // Dependencies

    // --- Form Input Handlers ---
    const handleCheckboxChange = (category, name) => (event) => {
        setPreferences(prev => ({
            ...prev,
            [category]: { ...prev[category], [name]: event.target.checked }
        }))
    }

    const handleSingleCheckboxChange = (name) => (event) => {
        setPreferences(prev => ({ ...prev, [name]: event.target.checked }))
    }

    const handleTextChange = (name) => (event) => {
        setPreferences(prev => ({ ...prev, [name]: event.target.value }))
    }

    // Update this handler for profile data
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setUserData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // --- Generate Meal Plan Function (Modified for Streaming) ---
    async function generateMealPlan() {
        trackClick();
        const currentUser = auth.currentUser; // Get user object
        if (!currentUser) {
            setError('You must be logged in to generate a meal plan.');
            return;
        }

        setFormDisabled(true);
        setIsAILoading(true);
        setError(null);
        setMealPlanText(''); // Clear previous plan
        setResponseId(''); // Clear previous response ID
        setIsSaved(false); // Reset save button state

        /*
        old as of 25 04 19 
        // Construct parameters from preferences state
        const mealPlanParams = {
            meals: Object.entries(preferences.includeMeals)
                .filter(([_, include]) => include)
                .map(([meal]) => meal),
            cookingPreferences: Object.entries(preferences.cookingPreferences)
                .filter(([_, include]) => include)
                .map(([pref]) => pref),
            includeShoppingList: preferences.includeShoppingList,
            dietaryRestrictions: preferences.dietaryRestrictions,
            favoriteIngredients: preferences.favoriteIngredients,
            dislikedIngredients: preferences.dislikedIngredients,
            // apiService will be added in ai.js's getWeeklyMealPlan
        };
        */

        const mealPlanParams = { /* ... construct params ... */
            meals: Object.entries(preferences.includeMeals).filter(([_, v]) => v).map(([k]) => k),
            cookingPreferences: Object.entries(preferences.cookingPreferences).filter(([_, v]) => v).map(([k]) => k),
            includeShoppingList: preferences.includeShoppingList,
            dietaryRestrictions: preferences.dietaryRestrictions,
            favoriteIngredients: preferences.favoriteIngredients,
            dislikedIngredients: preferences.dislikedIngredients,
        };

        try {
            //console.log("(MealPlanner_Service) - Calling getWeeklyMealPlan for streaming...");
            const { stream, controller } = await getWeeklyMealPlan(mealPlanParams, currentUser, convoStyle);
            streamController.current = controller; // Store the controller

            let accumulatedText = '';
            let metadataReceived = false; // Flag to process metadata only once
            let uiResetDone = false

            //console.log("(MealPlanner_Service) - Starting stream iteration...");
            for await (const part of stream) {
                if (controller.signal.aborted) break;

                if (part.type === 'chunk') {
                    accumulatedText += part.text;
                    setMealPlanText(accumulatedText);
                    if (!uiResetDone) { // <-- Keep this logic
                        setIsAILoading(false);
                        setFormDisabled(false);
                        uiResetDone = true;
                    }
                } else if (part.type === 'metadata' && !metadataReceived) {
                    metadataReceived = true;
                    //console.log("(MealPlanner_Service) - Received metadata:", part);
                    setResponseId(part.responseId || '');
                    // --- Update context ---
                    setApiLimits(prev => {
                        if (!prev) return prev;
                        return {
                            ...prev,
                            limits: {
                                ...prev.limits,
                                mealPlanner: {
                                    ...(prev.limits?.mealPlanner || {}),
                                    remaining: part.remainingRequests
                                }
                            },
                            lastReset: part.resetTime || prev.lastReset // Use new reset time if available
                        };
                    });
                    //console.log("ApiLimitsContext updated via MealPlanner_Service");
                } else if (part.error) {
                    console.error('Stream returned an error:', part.error);
                    throw new Error(part.error);
                }
            }
            setError(null); // Clear error on success
        } catch (streamError) {
            console.error('Stream error:', streamError);
            if (streamError.name !== 'AbortError') {
                setError(streamError.message || 'An error occurred while generating the meal plan.');
            }
            setMealPlanText(''); // Clear partial text on error
        } finally {
            setIsAILoading(false); // Ensure loading stops in all cases
            setFormDisabled(false); // Ensure form is enabled in all cases
            streamController.current = null;
            //console.log('🔵 Meal Plan Finally block executed');
        }
    }
    // --- END MODIFIED ---

    const saveResponse = async () => {
        const currentUser = auth.currentUser; // Get user object
        if (!currentUser) {
            console.error('(MealPlanner_Service saveResponse) - User not logged in.');
            // Optionally show an error to the user
            setError("You must be logged in to save a plan.");
            return;
        }
        if (!responseId || isSaved) {
            //console.log('(MealPlanner_Service saveResponse) - Returning early - responseId missing or already saved');
            return;
        }

        //console.log('(MealPlanner_Service) - Save button clicked! responseId:', responseId);
        setIsSaved(true); // Optimistically set saving state (consider adding a loading indicator)

        try {
            // --- Get ID Token ---
            const idToken = await currentUser.getIdToken();
            // --------------------

            const response = await fetch(`${API_BASE_URL}/api/save-response`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // --- Add Auth Header ---
                    'Authorization': `Bearer ${idToken}`
                    // ---------------------
                },
                body: JSON.stringify({ responseId: responseId })
            });

            //console.log('(MealPlanner_Service) - Response from save API status:', response.status);

            if (response.ok) {
                //console.log('(MealPlanner_Service) - Response successfully saved');
                // Keep isSaved as true
            } else {
                const errorData = await response.json().catch(() => ({})); // Try parsing error
                console.error('Error saving response:', errorData);
                setError(errorData.error || `Failed to save plan (status ${response.status})`);
                setIsSaved(false); // Revert saved state on error
            }

        } catch (error) {
            console.error('Error saving responses:', error);
            setError(`Error saving plan: ${error.message}`);
            setIsSaved(false); // Revert saved state on error
        }
    };
    // --- END MODIFIED ---


    // Add cleanup effect for aborting streams
    useEffect(() => {
        return () => {
            if (streamController.current) {
                //console.log("(MealPlanner_Service) - Aborting stream on unmount");
                streamController.current.abort();
            }
        };
    }, []);

    function handleConvoStyleChange(event) {
        setConvoStyle(event.target.value);
    }

    // Log the convoStyle to the console whenever it changes
    useEffect(() => {
        //console.log(`🔵 (Meal_Service.jsx) - AI Convo style changed to: ${convoStyle}`);
    }, [convoStyle]);

    return (
        <>
            <main>
                {isAILoading && <div className='loading-spinner'><LoadingSpinner /></div>}

                <div className='ai-service-container'>
                    {/* Header */}
                    <div className='text-3xl'><h1>7-Day Meal Planner</h1></div>
                    <p>Generate a personalized weekly meal plan that follows your therapeutic diet.
                        The plan will include your selected meal types and respect your cooking preferences.
                        Providing your bio data below can help the AI estimate daily calories more accurately (optional).</p>

                    {/* AI Style and API Usage */}
                    <form className="add-ingredient-form" style={{ marginBottom: '1rem' }}> {/* Added style for spacing */}
                        <fieldset disabled={formDisabled || isAILoading}>
                            <AIStyleSelector value={convoStyle} onChange={handleConvoStyleChange} />
                            <ApiUsageDisplay serviceName="mealPlanner" />
                        </fieldset>
                    </form>


                    {/* Bio Data Section (Uses updated fetch/update handlers) */}
                    <div className="flex flex-col md:flex-row gap-4 md:gap-8 my-6">
                        <div className='flex flex-col w-full'>
                            <Card elevation={3} className="mb-4">
                                <CardContent>
                                    <div className="flex justify-between items-center mb-4">
                                        <Typography variant='h5' component='div'>
                                            Bio Data for Daily Calories
                                        </Typography>
                                        {auth.currentUser && ( // Only show edit if logged in
                                            !isEditing ? (
                                                <Button
                                                    variant="outlined"
                                                    startIcon={<Edit size={18} />}
                                                    onClick={() => setIsEditing(true)}
                                                    disabled={isLoading} // Disable if still loading initial data
                                                >
                                                    Edit
                                                </Button>
                                            ) : (
                                                <div className="flex gap-2">
                                                    <Button
                                                        variant="outlined"
                                                        color="secondary"
                                                        onClick={handleCancelEdit}
                                                        startIcon={<XCircle size={18} />}
                                                        disabled={isUpdating} // Disable while update is in progress
                                                    >
                                                        Cancel
                                                    </Button>
                                                    <Button
                                                        variant="contained"
                                                        color="primary"
                                                        onClick={handleUpdateProfile}
                                                        disabled={isUpdating || isLoading} // Disable during update or initial load
                                                        startIcon={isUpdating ? <CircularProgress size={20} color="inherit" /> : <Save size={18} />}
                                                    >
                                                        Save
                                                    </Button>
                                                </div>
                                            )
                                        )}
                                    </div>

                                    {/* --- Loading/Error/Success States --- */}
                                    {isLoading && !isLoading ? (
                                        <div className="flex justify-center items-center py-8">
                                            <CircularProgress />
                                            <Typography variant="body1" className="ml-2">Loading Profile...</Typography>
                                        </div>
                                    ) : error ? ( // Show profile fetch/update errors here
                                        <Alert severity="error" className="mb-4">{error}</Alert>
                                    ) : saveSuccess ? (
                                        <Alert severity="success" className="mb-4">
                                            Profile updated successfully!
                                        </Alert>
                                    ) : null}


                                    {/* --- Profile Fields (View/Edit) --- */}
                                    {!isLoading && auth.currentUser && ( // Render only when not loading and user is logged in
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4">
                                            {/* --- Sex Field --- */}
                                            {isEditing ? (
                                                <MuiFormControl variant="outlined" fullWidth size="small">
                                                    <InputLabel id="sex-label">Sex</InputLabel>
                                                    <Select
                                                        labelId="sex-label"
                                                        name="sex"
                                                        value={userData.sex || ''} // Ensure controlled component
                                                        onChange={handleInputChange}
                                                        label="Sex"
                                                    >
                                                        <MenuItem value=""><em>Not Specified</em></MenuItem>
                                                        <MenuItem value="Male">Male</MenuItem>
                                                        <MenuItem value="Female">Female</MenuItem>
                                                        <MenuItem value="Other">Other</MenuItem> {/* Added Other based on model */}
                                                    </Select>
                                                </MuiFormControl>
                                            ) : (
                                                <div className="profile-info-item">
                                                    <Typography variant="subtitle2" color="textSecondary" gutterBottom>Sex</Typography>
                                                    <Typography variant="body1" className="font-medium">
                                                        {userData.sex || <span className="text-gray-500 italic">Not specified</span>}
                                                    </Typography>
                                                </div>
                                            )}

                                            {/* --- Weight Field --- */}
                                            {isEditing ? (
                                                <div className="flex flex-col gap-2 w-full">
                                                    <div className="flex gap-2 items-start"> {/* Use items-start for alignment */}
                                                        <TextField
                                                            type="number"
                                                            name="weightValue"
                                                            value={userData.weightValue ?? ''} // Use ?? for null/undefined -> ''
                                                            onChange={handleInputChange}
                                                            label="Weight"
                                                            variant="outlined"
                                                            fullWidth
                                                            size="small"
                                                            inputProps={{ min: 0, step: 0.1 }} // Allow 0, ensure step
                                                            InputLabelProps={{ shrink: true }} // Keep label floated if value is 0 or null
                                                        />
                                                        <MuiFormControl variant="outlined" style={{ minWidth: 90 }} size="small">
                                                            <InputLabel id="weight-unit-label">Unit</InputLabel>
                                                            <Select
                                                                labelId="weight-unit-label"
                                                                name="weightUnit"
                                                                value={userData.weightUnit || 'kg'} // Default to 'kg'
                                                                onChange={handleInputChange}
                                                                label="Unit"
                                                            >
                                                                <MenuItem value="kg">kg</MenuItem>
                                                                <MenuItem value="lbs">lbs</MenuItem>
                                                            </Select>
                                                        </MuiFormControl>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="profile-info-item">
                                                    <Typography variant="subtitle2" color="textSecondary" gutterBottom>Weight</Typography>
                                                    <Typography variant="body1" className="font-medium">
                                                        {userData.weightValue ? `${userData.weightValue} ${userData.weightUnit}` : <span className="text-gray-500 italic">Not specified</span>}
                                                    </Typography>
                                                </div>
                                            )}

                                            {/* --- Activity Level Field (NEW) --- */}
                                            {isEditing ? (
                                                <MuiFormControl variant="outlined" fullWidth size="small">
                                                    <InputLabel id="activity-label">Activity Level</InputLabel>
                                                    <Select
                                                        labelId="activity-label"
                                                        name="activity"
                                                        value={userData.activity || 'Not Specified'} // Ensure default
                                                        onChange={handleInputChange}
                                                        label="Activity Level"
                                                    >
                                                        <MenuItem value="Not Specified"><em>Not Specified</em></MenuItem>
                                                        <MenuItem value="Sedentary">Sedentary</MenuItem>
                                                        <MenuItem value="Moderately active">Moderately active</MenuItem>
                                                        <MenuItem value="Very active">Very active</MenuItem>
                                                    </Select>
                                                </MuiFormControl>
                                            ) : (
                                                <div className="profile-info-item">
                                                    <Typography variant="subtitle2" color="textSecondary" gutterBottom>Activity Level</Typography>
                                                    <Typography variant="body1" className="font-medium">
                                                        {userData.activity && userData.activity !== 'Not Specified' ? userData.activity : <span className="text-gray-500 italic">Not specified</span>}
                                                    </Typography>
                                                </div>
                                            )}
                                            {/* --- End Activity Level Field --- */}
                                        </div>
                                    )}
                                    {!auth.currentUser && !isLoading && (
                                        <Typography color="textSecondary">Please log in to view and edit profile information.</Typography>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </div>




                    {/* --- Meal Plan Preferences Form --- */}
                    <Paper elevation={3} className="p-6 my-4">
                        <Typography variant="h6" gutterBottom>Meal Plan Preferences</Typography>
                        <Box className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Meal Types Section */}
                            <Box>
                                <Typography variant="subtitle1" gutterBottom>Include these meals:</Typography>
                                <FormGroup>
                                    <FormControlLabel control={<Checkbox checked={preferences.includeMeals.breakfast} onChange={handleCheckboxChange('includeMeals', 'breakfast')} disabled={formDisabled || isAILoading} />} label="Breakfast" />
                                    <FormControlLabel control={<Checkbox checked={preferences.includeMeals.lunch} onChange={handleCheckboxChange('includeMeals', 'lunch')} disabled={formDisabled || isAILoading} />} label="Lunch" />
                                    <FormControlLabel control={<Checkbox checked={preferences.includeMeals.dinner} onChange={handleCheckboxChange('includeMeals', 'dinner')} disabled={formDisabled || isAILoading} />} label="Dinner" />
                                    <FormControlLabel control={<Checkbox checked={preferences.includeMeals.snack} onChange={handleCheckboxChange('includeMeals', 'snack')} disabled={formDisabled || isAILoading} />} label="snack" />
                                </FormGroup>
                            </Box>

                            {/* Cooking Preferences Section */}
                            <Box>
                                <Typography variant="subtitle1" gutterBottom>I'm comfortable with:</Typography>
                                <FormGroup>
                                    <FormControlLabel control={<Checkbox checked={preferences.cookingPreferences.cooking} onChange={handleCheckboxChange('cookingPreferences', 'cooking')} disabled={formDisabled || isAILoading} />} label="Cooking meals from scratch" />
                                    <FormControlLabel control={<Checkbox checked={preferences.cookingPreferences.baking} onChange={handleCheckboxChange('cookingPreferences', 'baking')} disabled={formDisabled || isAILoading} />} label="Baking (bread, desserts, etc.)" />
                                    <FormControlLabel control={<Checkbox checked={preferences.cookingPreferences.homemade} onChange={handleCheckboxChange('cookingPreferences', 'homemade')} disabled={formDisabled || isAILoading} />} label="Making things at home (ferments, yogurt, etc.)" />
                                    <FormControlLabel control={<Checkbox checked={preferences.includeShoppingList} onChange={handleSingleCheckboxChange('includeShoppingList')} disabled={formDisabled || isAILoading} />} label="Include a shopping list" />
                                </FormGroup>
                            </Box>
                        </Box>

                        <Divider className="my-4" />

                        {/* Additional Preferences Section */}
                        <Box className="grid grid-cols-1 gap-4 mt-4">
                            <TextField fullWidth variant="outlined" label="Dietary restrictions or allergies (optional)" value={preferences.dietaryRestrictions} onChange={handleTextChange('dietaryRestrictions')} disabled={formDisabled || isAILoading} multiline rows={2} margin="normal" />
                            <TextField fullWidth variant="outlined" label="Favorite ingredients to include (optional)" value={preferences.favoriteIngredients} onChange={handleTextChange('favoriteIngredients')} disabled={formDisabled || isAILoading} multiline rows={2} margin="normal" />
                            <TextField fullWidth variant="outlined" label="Ingredients to avoid (optional)" value={preferences.dislikedIngredients} onChange={handleTextChange('dislikedIngredients')} disabled={formDisabled || isAILoading} multiline rows={2} margin="normal" />
                        </Box>
                    </Paper>

                    {/* Display General Errors */}
                    {error && !isLoading && !isEditing && ( // Show general errors if not loading/editing profile
                        <Alert severity="error" className="my-4">{error}</Alert>
                    )}


                    {/* --- Action Buttons --- */}
                    <div className="mt-4 m-auto">
                        <Button
                            onClick={generateMealPlan}
                            variant="contained"
                            startIcon={isAILoading ? <CircularProgress size={20} color="inherit" /> : <Calendar />}
                            size="large"
                            disabled={formDisabled || isAILoading || !auth.currentUser} // Disable if loading, generating, or not logged in
                            fullWidth
                        >
                            {isAILoading ? 'Creating 7-Day Meal Plan...' : 'Create 7-Day Meal Plan'}
                        </Button>

                        {mealPlanText && (
                            <Button
                                onClick={() => { setMealPlanText(""); setError(null); setIsSaved(false); }} // Clear plan, error, and saved state
                                variant="outlined"
                                size="large"
                                fullWidth
                                className='mt-4'
                                disabled={isAILoading} // Disable while generating
                            >
                                Start New Plan
                            </Button>
                        )}
                    </div>

                    {/* Meal Plan Response (Uses updated saveResponse handler) */}
                    {mealPlanText && (
                        <section ref={mealPlanResponseSection} className="suggested-recipe-container max-w-none mt-8" aria-live="polite">
                            {/* Scroll target is the section itself */}
                            <div className="py-4 flex items-center gap-2 flex-wrap"> {/* Use flex-wrap */}
                                <Typography variant="h4" component="div" className="font-bold flex-grow">Your 7-Day Meal Plan</Typography> {/* Use Typography */}
                                <Copy_Text AI_Text={mealPlanText} />
                                <Button
                                    onClick={saveResponse}
                                    variant={isSaved ? "contained" : "outlined"}
                                    color={isSaved ? "success" : "primary"}
                                    startIcon={<BookmarkIcon size={18} />}
                                    disabled={isSaved || !auth.currentUser || isAILoading} // Disable if saved, not logged in, or AI is loading
                                >
                                    {isSaved ? "Plan Saved" : "Save Plan"}
                                </Button>
                            </div>
                            {/* Apply max-w-none to override prose defaults if needed */}
                            <article className="prose prose-sm sm:prose-base lg:prose-lg xl:prose-xl max-w-none prose-headings:font-semibold prose-p:my-2 prose-ul:list-disc prose-ol:list-decimal prose-li:my-1" aria-live="polite">
                                <ReactMarkdown children={mealPlanText} remarkPlugins={[remarkGfm]} />
                            </article>
                        </section>
                    )}
                </div>
            </main>
        </>
    )
}