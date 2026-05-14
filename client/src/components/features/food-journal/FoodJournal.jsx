import { useState, useEffect, useCallback, useMemo } from 'react';
import { getAuth } from 'firebase/auth';
import {
    // Keep necessary MUI imports for layout and core elements
    Button, Typography, Box, Paper, Grid, Divider, Alert, CircularProgress, Tooltip,
} from '@mui/material';
import {
    Plus, Calendar, Edit, BrainCircuit, Lock
} from 'lucide-react';
import MealFormModal from './MealFormModal';
import { API_BASE_URL } from '../../../env-config.js';
import dayjs from 'dayjs';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import utc from 'dayjs/plugin/utc';

import { getMealPresets, deleteMealPreset, updateMealPreset } from '../../../services/mealPresetService.js'; // Added updateMealPreset
import { useUser } from '../../../context/UserContext.jsx';

// --- Import the new child components ---
import MealDetailViewer from './MealDetailViewer.jsx';
import MealHistoryList from './MealHistoryList.jsx';
import AIChatInterface from './AIChatInterface.jsx';
import PresetDetailViewer from '../meal-presets/PresetDetailViewer.jsx'; // Added import for PresetDetailViewer
// ---------------------------------------

// --- Navigation and Alerts ---
import { useNavigate } from 'react-router'; // <-- Import useNavigate
import Swal from 'sweetalert2';             // <-- Import Swal
import withReactContent from 'sweetalert2-react-content'; // <-- Import withReactContent

dayjs.extend(localizedFormat);
dayjs.extend(utc);

const MySwal = withReactContent(Swal); // Initialize Swal


// --- Helper Functions ---
// Keep trackClick as it's used in this component's handlers
const trackClick = (eventName = 'button_click', details = {}) => {
    if (typeof window !== 'undefined' && window.umami) {
        window.umami.track(eventName, { source: 'food_journal_ai_page', ...details });
    };
};



// --- Main Component ---
export default function FoodJournal_AI_Analysis() {

    const navigate = useNavigate(); // <-- Initialize useNavigate

    const auth = getAuth();
    const user = auth.currentUser;
    const {
        user: contextUser,
        loading: isUserContextLoading,
        isSubscriber,
        getFreshIdToken // Ensure getFreshIdToken is destructured
    } = useUser(); // <-- Get user context data

    // --- State ---
    // (State remains the same: userData, mealsHistory, selectedMealForView, modals, ingredients, symptoms, feedback, dateRange, chatHistory, aiLoading, aiError)
    const [userData, setUserData] = useState({ therapeuticDiet: null, firstName: 'User' });
    const [isUserDataLoading, setIsUserDataLoading] = useState(true);
    const [userDataError, setUserDataError] = useState(null);
    const [mealsHistory, setMealsHistory] = useState([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const [historyError, setHistoryError] = useState(null);
    const [selectedMealForView, setSelectedMealForView] = useState(null);
    const [isLoadingSelectedMeal, setIsLoadingSelectedMeal] = useState(false); // Keep this if detail view might fetch more data later
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [availableIngredients, setAvailableIngredients] = useState([]);
    const [isLoadingAvailableIngredients, setIsLoadingAvailableIngredients] = useState(false);
    const [availableIngredientsError, setAvailableIngredientsError] = useState(null);
    const [masterSymptoms, setMasterSymptoms] = useState([]);
    const [isLoadingMasterSymptoms, setIsLoadingMasterSymptoms] = useState(false);
    const [masterSymptomsError, setMasterSymptomsError] = useState(null);
    const [feedbackMessage, setFeedbackMessage] = useState(null);
    //const [dateRange, setDateRange] = useState({ startDate: null, endDate: null });
    const [dateRange, setDateRange] = useState({ startDate: dayjs().subtract(6, 'day').startOf('day'), endDate: dayjs().endOf('day') });
    const [chatHistory, setChatHistory] = useState([]);
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [aiError, setAiError] = useState(null);
    const [responseId, setResponseId] = useState(null); // To store the ID for saving
    const [convoStyle, setConvoStyle] = useState(''); // Default or load from user settings later if desired

    // --- State for Meal Presets ---
    /** @type {[Array<Object>, Function]} State for storing fetched meal presets. */
    const [presets, setPresets] = useState([]);
    /** @type {[boolean, Function]} State for loading status of meal presets. */
    const [isLoadingPresets, setIsLoadingPresets] = useState(false);
    /** @type {[string|null, Function]} State for error messages during meal preset fetching. */
    const [presetsError, setPresetsError] = useState(null);
    /** @type {[string|null, Function]} State for the ID of the currently selected meal preset. */
    const [selectedPresetId, setSelectedPresetId] = useState(null);
    // -----------------------------

    // Derived State (Meals filtered by date range)
    const mealsInRange = useMemo(() => {
        // (logic remains the same)
        if (!dateRange.startDate || !dateRange.endDate) return [];
        const start = dateRange.startDate.startOf('day');
        const end = dateRange.endDate.endOf('day');
        return mealsHistory.filter(meal => {
            const mealDate = dayjs(meal.mealDateTime);
            return mealDate.isAfter(start.subtract(1, 'millisecond')) && mealDate.isBefore(end.add(1, 'millisecond'));
        });
    }, [mealsHistory, dateRange]);

    // Derived State (Selected Preset Object)
    /**
     * @type {Object|null} The full meal preset object corresponding to `selectedPresetId`.
     * Derived using `useMemo` for efficiency.
     */
    const selectedPresetObject = useMemo(() => {
        if (!selectedPresetId || !presets || presets.length === 0) {
            return null;
        }
        return presets.find(p => p._id === selectedPresetId);
    }, [selectedPresetId, presets]);

    // --- Effects ---
    // Fetch User Data (Profile Info) - Simplified to use context user when available
    useEffect(() => {
        // Use contextUser data when available and loaded
        if (!isUserContextLoading && contextUser) {
            //console.log("(AI_Analysis) Using User Context Data:", contextUser);
            setUserData({
                firstName: contextUser.firstName || 'User',
                therapeuticDiet: contextUser.therapeuticDiet || null,
                // Map other relevant fields if needed
            });
            setUserDataError(null); // Clear any previous fetch error
            setIsUserDataLoading(false); // Mark profile data as loaded
        } else if (!isUserContextLoading && !contextUser && user) {
            // Context loaded but no contextUser, AND firebase user exists (edge case?)
            console.warn("(AI_Analysis) Context loaded but user empty, falling back to direct fetch.");
            // Consider if direct fetch is still needed or if this indicates a problem
            // For now, let's assume context is the source of truth once loaded
            setUserData({ therapeuticDiet: null, firstName: 'User' });
            setUserDataError("Failed to load user profile from context.");
            setIsUserDataLoading(false);
        } else if (!isUserContextLoading && !user) {
            // Context loaded, no firebase user (logged out)
            //console.log("(AI_Analysis) No user logged in (checked context and auth).");
            setUserData({ therapeuticDiet: null, firstName: 'User' });
            setUserDataError("User not logged in.");
            setIsUserDataLoading(false);
        }
        // If isUserContextLoading is true, we wait for the next effect run
    }, [user, contextUser, isUserContextLoading]);


    // Fetch Meal History
    const fetchHistory = useCallback(async () => {
        if (!user) {
            setMealsHistory([]);
            setSelectedMealForView(null);
            setIsLoadingHistory(false);
            return;
        }
        setIsLoadingHistory(true);
        setHistoryError(null);
        try {
            const idToken = await user.getIdToken();
            const response = await fetch(`${API_BASE_URL}/api/meals/${user.uid}`, {
                headers: { Authorization: `Bearer ${idToken}` },
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: `HTTP error ${response.status}` }));
                throw new Error(errorData.message || `Failed to fetch meal history: ${response.statusText}`);
            }
            const data = await response.json();
            const fetchedMeals = (data.meals || data).map(meal => ({
                ...meal,
                associatedSymptoms: meal.associatedSymptoms || []
            }));

            const sortedMeals = [...fetchedMeals].sort((a, b) => dayjs(b.mealDateTime).diff(dayjs(a.mealDateTime)));
            setMealsHistory(sortedMeals);

        } catch (err) {
            console.error("(AI_Analysis) Error fetching meal history:", err);
            setHistoryError(err.message || "Could not load meal history.");
            setMealsHistory([]);
            setSelectedMealForView(null);
        } finally {
            setIsLoadingHistory(false);
        }
    }, [user]); // Removed selectedMealForView dependency

    useEffect(() => {
        fetchHistory();
    }, [fetchHistory]);

    // Fetch Available Ingredients
    useEffect(() => {
        const fetchAvailableIngredients = async () => {
            if (!user || isUserContextLoading || !contextUser?.therapeuticDiet) {
                setAvailableIngredients([]); return;
            }
            setIsLoadingAvailableIngredients(true);
            setAvailableIngredientsError(null);
            try {
                const idToken = await user.getIdToken();
                const response = await fetch(`${API_BASE_URL}/api/foods/by-diet/${contextUser.therapeuticDiet}`, {
                    headers: { Authorization: `Bearer ${idToken}` },
                });
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.message || `Failed to fetch ingredients: ${response.statusText}`);
                }
                const ingredientsList = await response.json();
                setAvailableIngredients(ingredientsList);
            } catch (error) {
                console.error("(AI_Analysis) Error fetching available ingredients:", error);
                setAvailableIngredientsError(error.message || "Could not load ingredient suggestions.");
                setAvailableIngredients([]);
            } finally {
                setIsLoadingAvailableIngredients(false);
            }
        };
        fetchAvailableIngredients();
    }, [user, contextUser?.therapeuticDiet, isUserContextLoading]);

    // Fetch Master Symptom List
    useEffect(() => {
        const fetchMasterSymptoms = async () => {
            if (!user) {
                setMasterSymptoms([]);
                setMasterSymptomsError("Login required to load symptoms.");
                setIsLoadingMasterSymptoms(false);
                return;
            }
            setIsLoadingMasterSymptoms(true);
            setMasterSymptomsError(null);
            try {
                const idToken = await user.getIdToken();
                const response = await fetch(`${API_BASE_URL}/api/symptoms/master`, {
                    headers: { 'Authorization': `Bearer ${idToken}` }
                });
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({ message: `HTTP error ${response.status}` }));
                    throw new Error(errorData.message || `Failed to fetch master symptoms: ${response.statusText}`);
                }
                const symptomsList = await response.json();
                setMasterSymptoms(symptomsList);
            } catch (error) {
                console.error("(AI_Analysis) Error fetching master symptoms:", error);
                setMasterSymptomsError(error.message || "Could not load symptom list.");
                setMasterSymptoms([]);
            } finally {
                setIsLoadingMasterSymptoms(false);
            }
        };
        fetchMasterSymptoms();
    }, [user]);


    // Fetch Meal Presets
    /**
     * @function fetchMealPresets
     * @description Fetches meal presets for the current user and their therapeutic diet.
     * Uses `getMealPresets` service and handles loading and error states.
     * Requires `getFreshIdToken` from `useUser` for authenticated API calls.
     */
    const fetchMealPresets = useCallback(async () => {
        if (!user || !contextUser?.therapeuticDiet || !getFreshIdToken) {
            setPresets([]);
            setIsLoadingPresets(false);
            return;
        }
        setIsLoadingPresets(true);
        setPresetsError(null);
        try {
            const fetchedPresets = await getMealPresets(contextUser.therapeuticDiet, getFreshIdToken);
            setPresets(fetchedPresets || []);
        } catch (err) {
            console.error("(AI_Analysis) Error fetching meal presets:", err);
            setPresetsError(err.message || "Could not load meal presets.");
            setPresets([]);
        } finally {
            setIsLoadingPresets(false);
        }
    }, [user, contextUser?.therapeuticDiet, getFreshIdToken]); // REMOVED selectedPresetId

    useEffect(() => {
        fetchMealPresets();
    }, [fetchMealPresets]);

    // Handler for when a preset is added via MealFormModal or updated via EditPresetModal
    const handlePresetAddedOrUpdated = async (presetDataToSave) => {
        console.log('[FoodJournal] handlePresetAddedOrUpdated called with:', presetDataToSave);
        setIsLoadingPresets(true);
        try {
            let response;

            // This logic assumes an existing preset will have a ._id property.
            if (presetDataToSave._id) {
                console.log('[FoodJournal] Updating existing preset ID:', presetDataToSave._id);
                response = await updateMealPreset(presetDataToSave._id, presetDataToSave, getFreshIdToken);
                MySwal.fire('Preset updated successfully!', 'success');
            } else { // New preset: Create (POST)
                console.log('[FoodJournal] Creating new preset.');
                response = await fetch(`${API_BASE_URL}/api/meal-presets`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${await getFreshIdToken()}` },
                    body: JSON.stringify(presetDataToSave),
                });
                MySwal.fire('Preset added successfully!', 'success');
            }
            console.log('[FoodJournal] Preset save/update API call successful. Response:', response);

            // After successful save, refresh the presets list to ensure UI consistency
            await fetchMealPresets();
            console.log('[FoodJournal] Presets fetched and state updated after save/update.');

        } catch (error) {
            console.error("[FoodJournal] Error in handlePresetAddedOrUpdated:", error);
            MySwal.fire(`Error: ${error.message || 'Could not save preset.'}`, 'error');
            // Re-throw to allow the calling component to know about the error if needed
            throw error;
        } finally {
            setIsLoadingPresets(false);
        }
    };

    // --- Event Handlers ---
    // (handleSelectMealForView, modal handlers, handleSaveMeal, handleDeleteMeal, handleDateRangeChange, handleGetAnalysis, handleSendChatMessage remain the same)
    const handleSelectMealForView = (mealId) => {
        trackClick('select_meal_view', { mealId });
        const mealToView = mealsHistory.find(meal => meal._id === mealId);
        setSelectedMealForView(mealToView || null);
        setSelectedPresetId(null); // Clear selected preset when a meal is selected
        // console.log("(AI_Analysis) Selected meal for view:", mealToView);
        // If a meal is selected, potentially clear chat history or set a new context for AI chat
    };
    const handleOpenAddModal = () => { trackClick('open_add_meal_modal'); setIsAddModalOpen(true); };
    const handleOpenEditModal = () => { if (!selectedMealForView) return; trackClick('open_edit_meal_modal', { mealId: selectedMealForView._id }); setIsEditModalOpen(true); };
    const handleCloseModals = () => { setIsAddModalOpen(false); setIsEditModalOpen(false); };

    const handleSaveMeal = async (mealPayload) => {
        if (!user) { setFeedbackMessage({ severity: 'error', text: 'User not authenticated.' }); return false; }
        const isEditing = !!mealPayload._id;
        const url = isEditing ? `${API_BASE_URL}/api/meals/${mealPayload._id}` : `${API_BASE_URL}/api/meals/log`;
        const method = isEditing ? 'PATCH' : 'POST';
        trackClick(isEditing ? 'save_edited_meal' : 'save_new_meal', { mealId: mealPayload._id });

        try {
            const idToken = await user.getIdToken();
            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
                body: JSON.stringify(mealPayload),
            });
            const savedMealData = await response.json();
            if (!response.ok) { throw new Error(savedMealData.message || `Failed to ${isEditing ? 'update' : 'save'} meal`); }

            const processedSavedMeal = { ...savedMealData, associatedSymptoms: savedMealData.associatedSymptoms || [] };

            setMealsHistory(prev => {
                const updated = isEditing
                    ? prev.map(meal => meal._id === processedSavedMeal._id ? processedSavedMeal : meal)
                    : [processedSavedMeal, ...prev];
                return updated.sort((a, b) => dayjs(b.mealDateTime).diff(dayjs(a.mealDateTime)));
            });

            if (isEditing && selectedMealForView?._id === processedSavedMeal._id) {
                setSelectedMealForView(processedSavedMeal);
            } else if (!isEditing) {
                setSelectedMealForView(processedSavedMeal);
            }

            setFeedbackMessage({ severity: 'success', text: `Meal ${isEditing ? 'updated' : 'saved'} successfully!` });
            setTimeout(() => setFeedbackMessage(null), 3000);
            return true;
        } catch (error) {
            console.error(`(AI_Analysis) Error ${isEditing ? 'updating' : 'saving'} meal:`, error);
            setFeedbackMessage({ severity: 'error', text: error.message || `Failed to ${isEditing ? 'update' : 'save'} meal.` });
            return false;
        }
    };
    const handleDeleteMeal = async (mealIdToDelete) => {
        if (!user || !mealIdToDelete) { setFeedbackMessage({ severity: 'error', text: 'Cannot delete meal: User not authenticated or Meal ID missing.' }); return false; }
        trackClick('delete_meal', { mealId: mealIdToDelete });

        try {
            const idToken = await user.getIdToken();
            const response = await fetch(`${API_BASE_URL}/api/meals/${mealIdToDelete}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${idToken}` },
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: `HTTP error ${response.status}` }));
                throw new Error(errorData.message || `Failed to delete meal: ${response.statusText}`);
            }

            const updatedHistory = mealsHistory.filter(meal => meal._id !== mealIdToDelete);
            setMealsHistory(updatedHistory);

            if (selectedMealForView?._id === mealIdToDelete) {
                setSelectedMealForView(null); // Clear selection if deleted
            }

            setFeedbackMessage({ severity: 'info', text: 'Meal deleted.' });
            setTimeout(() => setFeedbackMessage(null), 3000);
            return true;
        } catch (error) {
            console.error("(AI_Analysis) Error deleting meal:", error);
            setFeedbackMessage({ severity: 'error', text: error.message || 'Failed to delete meal.' });
            return false;
        }
    };

    const handleDateRangeChange = (newValue, dateIdentifier) => {
        trackClick('change_date_range_picker', { dateIdentifier });
        const newStartDate = dateIdentifier === 'start' ? (newValue ? newValue.startOf('day') : null) : dateRange.startDate;
        const newEndDate = dateIdentifier === 'end' ? (newValue ? newValue.endOf('day') : null) : dateRange.endDate;

        if (newStartDate && newEndDate && newEndDate.isBefore(newStartDate)) {
            setFeedbackMessage({ severity: 'warning', text: 'End date cannot be before start date. Please adjust.' });
            return;
        }
        if (feedbackMessage?.text.includes('End date cannot be before start date')) {
            setFeedbackMessage(null);
        }
        setDateRange({ startDate: newStartDate, endDate: newEndDate });
        setSelectedMealForView(null);
        setChatHistory([]);
        setAiError(null);
    };

    // --- NEW: Handler for AIStyleSelector ---
    const handleConvoStyleChange = (event) => {
        setConvoStyle(event.target.value);
    };

    // Log convoStyle changes (optional)
    useEffect(() => {
        //console.log(`🔵 (FoodJournal_AI_Analysis.jsx) - AI Convo style changed to: ${convoStyle}`);
    }, [convoStyle]);
    // --- END NEW ---

    // --- NEW: Define Locked Feature Handler ---
    const handleLockedFeatureClick = (featureName = 'This feature') => {
        trackClick('locked_feature_click', { featureName });
        if (!isSubscriber) {
            MySwal.fire({
                icon: 'info',
                title: 'Premium Feature',
                html: `${featureName} requires a <a href="/pricing" style="color: #10b981; text-decoration: underline;">Premium subscription</a>. Unlock advanced AI insights and tools!`,
                confirmButtonText: 'View Pricing',
                showCancelButton: true,
                cancelButtonText: 'Maybe Later',
                confirmButtonColor: '#10b981', // Emerald 500
                cancelButtonColor: '#6b7280', // Gray 500
            }).then((result) => {
                if (result.isConfirmed) {
                    navigate('/pricing'); // Navigate to pricing page
                }
            });
        }
    };


    const handleGetAnalysis = async () => {
        trackClick('get_ai_analysis', { startDate: dateRange.startDate?.toISOString(), endDate: dateRange.endDate?.toISOString(), mealCount: mealsInRange.length });
        if (!user) { setAiError("User not authenticated."); setFeedbackMessage({ severity: 'error', text: 'Please log in to use AI analysis.' }); return; }

        // --- NEW: Handle Locked Feature ---
        if (!isSubscriber) {
            handleLockedFeatureClick('AI Meal History Analysis');
            return;
        }
        // --- END NEW ---

        if (!dateRange.startDate || !dateRange.endDate) { setAiError("Please select a valid date range first."); setFeedbackMessage({ severity: 'warning', text: 'Select a start and end date for analysis.' }); return; }
        if (mealsInRange.length === 0) { setAiError("No meal data found in the selected date range."); setFeedbackMessage({ severity: 'info', text: 'No meals logged in this period to analyze.' }); return; }
        if (!userData.therapeuticDiet) { setAiError("User therapeutic diet is not set."); setFeedbackMessage({ severity: 'warning', text: 'Please set your therapeutic diet in your profile.' }); return; }

        setIsAiLoading(true);
        setAiError(null);
        setChatHistory([]);
        setResponseId(null); // Clear previous response ID

        try {
            const payload = {
                apiService: "journalAnalysis", // <-- ADD THIS LINE
                mealsData: mealsInRange,
                diet_code: userData.therapeuticDiet, // diet code from user profile sent to backend endpoint /api/ai/analyze-journal
                dateRange: { startDate: dateRange.startDate.toISOString(), endDate: dateRange.endDate.toISOString() },
                convo_style: convoStyle || 'MINIMAL', // <-- INCLUDE CONVO STYLE (provide default)
            };
            //console.log("(AI_Analysis) Sending data for analysis:", payload);
            const idToken = await user.getIdToken();

            const response = await fetch(`${API_BASE_URL}/api/ai/analyze-journal`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
                body: JSON.stringify(payload),
            });

            if (!response.ok || !response.body) {
                const errorData = await response.json().catch(() => ({ message: `Analysis failed: ${response.statusText} (Status: ${response.status})` }));
                throw new Error(errorData.message || `Analysis failed: ${response.statusText}`);
            }

            const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
            let accumulatedText = '';
            let metadataReceived = false;

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;

                // Process potential multiple SSE messages in one chunk
                const lines = value.split('\n');
                for (const line of lines) {
                    if (line.startsWith('data:')) {
                        try {
                            const jsonData = JSON.parse(line.substring(5)); // Get text after "data:"

                            if (jsonData.error) {
                                throw new Error(jsonData.error);
                            }

                            if (jsonData.chunk) {
                                accumulatedText += jsonData.chunk;
                                setChatHistory([{ sender: 'ai', message: accumulatedText }]); // Update chat with accumulating text
                            }

                            if (jsonData.done && !metadataReceived) {
                                metadataReceived = true;
                                setResponseId(jsonData.responseId); // Store the response ID
                                //console.log("(AI_Analysis) Stream finished, metadata received:", jsonData);
                            }
                        } catch (e) {
                            console.error("Error parsing SSE data line:", line, e);
                        }
                    }
                }
            }
            // Final update to ensure the full message is set (might be redundant if last chunk was processed)
            setChatHistory([{ sender: 'ai', message: accumulatedText }]);
            trackClick('get_ai_analysis_success');
            // --- End streaming fetch ---

        } catch (error) {
            console.error("(AI_Analysis) Error getting AI analysis:", error);
            setAiError(error.message || "Failed to get analysis from AI.");
            setFeedbackMessage({ severity: 'error', text: error.message || "An error occurred during analysis." });
            setChatHistory([{ sender: 'ai', message: `Sorry, I encountered an error: ${error.message}` }]); // Show error in chat
            trackClick('get_ai_analysis_error', { error: error.message });
        } finally {
            setIsAiLoading(false);
        }
    };
    // --- END MODIFIED ---

    // --- MODIFIED: handleSendChatMessage ---
    const handleSendChatMessage = async (messageText) => {
        if (!user || !messageText.trim() || isAiLoading) return;

        // --- Gate the actual API call ---
        if (!isSubscriber) {
            handleLockedFeatureClick('AI Meal History Chat'); // Use the centralized handler
            return; // Stop execution if not subscriber
        }

        const userMessage = { sender: 'user', message: messageText.trim() };
        trackClick('send_ai_chat_message');
        const currentChat = [...chatHistory, userMessage];
        setChatHistory(currentChat); // Add user message immediately
        setIsAiLoading(true);
        setAiError(null);
        setResponseId(null); // Clear previous response ID for follow-up

        try {
            const payload = {
                apiService: "journalAnalysis",
                previousMessages: currentChat, // Send history including the latest user message
                diet_code: userData.therapeuticDiet,
                convo_style: convoStyle || 'MINIMAL', // <-- INCLUDE CONVO STYLE (provide default)
                mealsData: mealsInRange, // Include the meals relevant to the current view
                dateRange: { // Include the date range relevant to the current view
                    startDate: dateRange.startDate.toISOString(),
                    endDate: dateRange.endDate.toISOString()
                },
            };

            //console.log("(AI_Analysis Chat) Sending payload for follow-up:", payload);

            const idToken = await user.getIdToken();

            // --- Use streaming fetch for follow-up ---
            const response = await fetch(`${API_BASE_URL}/api/ai/analyze-journal`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
                body: JSON.stringify(payload),
            });

            if (!response.ok || !response.body) {
                const errorData = await response.json().catch(() => ({ message: `AI chat failed: ${response.statusText} (Status: ${response.status})` }));
                throw new Error(errorData.message || `AI chat failed: ${response.statusText}`);
            }

            const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
            let accumulatedAiResponse = ''; // Store only the *new* AI response text
            let metadataReceived = false;

            // Add a placeholder for the AI response in the chat
            setChatHistory(prev => [...prev, { sender: 'ai', message: '...' }]);

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;

                const lines = value.split('\n');
                for (const line of lines) {
                    if (line.startsWith('data:')) {
                        try {
                            const jsonData = JSON.parse(line.substring(5));

                            if (jsonData.error) { throw new Error(jsonData.error); }

                            if (jsonData.chunk) {
                                accumulatedAiResponse += jsonData.chunk;
                                // Update the *last* message in the chat history (the AI placeholder)
                                setChatHistory(prev => {
                                    const updatedChat = [...prev];
                                    updatedChat[updatedChat.length - 1] = { sender: 'ai', message: accumulatedAiResponse };
                                    return updatedChat;
                                });
                            }

                            if (jsonData.done && !metadataReceived) {
                                metadataReceived = true;
                                setResponseId(jsonData.responseId); // Store the response ID
                                // Update API limits context
                                setApiLimits(prev => {
                                    if (!prev) return prev;
                                    return {
                                        ...prev,
                                        limits: {
                                            ...prev.limits,
                                            journalAnalysis: {
                                                ...(prev.limits?.journalAnalysis || {}),
                                                remaining: jsonData.remainingRequests
                                            }
                                        },
                                        lastReset: jsonData.resetTime || prev.lastReset
                                    };
                                });
                                //console.log("(AI_Analysis Chat) Stream finished, metadata received:", jsonData);
                            }
                        } catch (e) { console.error("Error parsing SSE data line:", line, e); }
                    }
                }
            }
            // Ensure final AI response is set correctly (might be redundant)
            setChatHistory(prev => {
                const updatedChat = [...prev];
                updatedChat[updatedChat.length - 1] = { sender: 'ai', message: accumulatedAiResponse };
                return updatedChat;
            });
            trackClick('send_ai_chat_message_success');
            // --- End streaming fetch ---

        } catch (error) {
            console.error("(AI_Analysis) Error sending chat message:", error);
            setAiError(error.message || "Failed to get response from AI.");
            setChatHistory(prev => [...prev, { sender: 'ai', message: `Sorry, I encountered an error: ${error.message}` }]);
            trackClick('send_ai_chat_message_error', { error: error.message });
        } finally {
            setIsAiLoading(false);
        }
    };
    // --- END MODIFIED ---

    /**
     * @function handleSelectPreset
     * @description Handles the selection of a meal preset from the list.
     * For now, it logs and shows an info message.
     * @param {string} presetId - The ID of the selected meal preset.
     */
    const handleSelectPreset = (presetId) => {
        trackClick('select_preset_view', { presetId });
        console.log("Selected preset ID (FoodJournal_AI_Analysis):", presetId);
        setSelectedPresetId(presetId);
        setSelectedMealForView(null); // Clear selected meal when a preset is selected
        // Future: Implement logic to load preset into form or view details
        // const selected = presets.find(p => p._id === presetId);
        // if (selected) { /* Do something with the selected preset */ }
    };

    /**
     * @function handleUpdatePreset
     * @description Handles the updating of a meal preset.
     * @param {Object} updatedPresetData - The updated preset data.
     */
    const handleUpdatePreset = async (updatedPresetData) => {
        if (!getFreshIdToken) {
            MySwal.fire('Error', 'Authentication token is not available. Please try again.', 'error');
            return;
        }

        try {
            const savedPreset = await updateMealPreset(updatedPresetData._id, updatedPresetData, getFreshIdToken);

            setPresets(prevPresets =>
                prevPresets.map(p => p._id === savedPreset._id ? savedPreset : p)
            );

            MySwal.fire('Updated!', 'The meal preset has been updated successfully.', 'success');

        } catch (error) {
            console.error("(AI_Analysis) Error updating preset:", error);
            MySwal.fire('Error', error.message || 'Failed to update the preset.', 'error');
        }
    };

    /**
     * @function handleEditPreset
     * @description Placeholder for handling the editing of a meal preset.
     * Currently logs and shows an info message.
     * @param {string} presetId - The ID of the preset to edit.
     */
    const handleEditPreset = (presetId) => {
        trackClick('edit_preset_click_from_detail', { presetId });
        const presetToEdit = presets.find(p => p._id === presetId);
        if (presetToEdit) {
            // TODO: Implement opening PresetFormModal for editing
            // setEditingPreset(presetToEdit);
            // setIsPresetModalOpen(true); // Assuming you'll add state for this modal
            console.log("TODO: Open PresetFormModal for editing preset:", presetId, presetToEdit);
            MySwal.fire('Under Development', 'Preset editing is coming soon!', 'info');
        } else {
            MySwal.fire('Error', 'Could not find the preset to edit.', 'error');
        }
    };

    /**
     * @function handleDeletePreset
     * @description Handles the deletion of a meal preset using `deleteMealPreset` service.
     * Updates the local presets state on successful deletion.
     * @param {string} presetId - The ID of the preset to delete.
     */
    const handleDeletePreset = async (presetId) => {
        if (!presetId) return;

        MySwal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this! This will delete the preset for all users.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',      // Red for delete
            cancelButtonColor: '#6e7881',   // Gray for cancel
            confirmButtonText: 'Yes, delete it!',
            reverseButtons: false            // Explicitly set to ensure confirm is on the right
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const token = await getFreshIdToken();
                    await deleteMealPreset(presetId, token);
                    MySwal.fire(
                        'Deleted!',
                        'The preset has been deleted.',
                        'success'
                    );
                    // Refresh the preset list
                    fetchMealPresets();
                } catch (error) {
                    console.error('Error deleting preset:', error);
                    MySwal.fire(
                        'Error!',
                        error.message || 'Could not delete the preset.',
                        'error'
                    );
                }
            }
        });
    };

    // --- Main Render ---
    return (
        <main className='pb-8'>
            <div className='ai-service-container'>
                {/* Header */}
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} flexWrap="wrap" gap={1}>
                    <Typography variant="h4" component="h1">
                        {isUserContextLoading ? 'Loading...' : (contextUser?.firstName || 'User')}'s Food Journal Analysis
                    </Typography>
                </Box>

                {/* User Data Loading/Error Handling */}
                {isUserContextLoading && (<Box display="flex" alignItems="center" mb={2}><CircularProgress size={20} sx={{ mr: 1 }} /><Typography>Loading profile...</Typography></Box>)}
                {/* Show profile fetch error OR context error */}
                {userDataError && !isUserContextLoading && (<Alert severity="error" sx={{ mb: 2 }}>{userDataError} Set diet in <a href="/profile" className="underline">profile</a>.</Alert>)}
                {/* Check therapeutic diet via context user */}
                {!isUserContextLoading && contextUser && !contextUser.therapeuticDiet && (<Alert severity="warning" sx={{ mb: 2 }}>Therapeutic diet not set. <a href="/profile" className="underline">Set diet in profile</a> to enable AI analysis.</Alert>)}

                {/* Feedback Messages */}
                {feedbackMessage && (<Alert severity={feedbackMessage.severity} sx={{ mb: 2 }} onClose={() => setFeedbackMessage(null)}>{feedbackMessage.text}</Alert>)}


                {isSubscriber &&
                    <Paper elevation={1} variant='outlined' sx={{ p: 2, mb: 3 }}>
                        <Grid container spacing={2} justifyContent="center" alignItems="center">

                            {/* --- ADD AIStyleSelector --- */}
                            <Grid item xs={12} sm={12} md={6}>
                                <AIStyleSelector
                                    value={convoStyle}
                                    onChange={handleConvoStyleChange}
                                    disabled={isAiLoading || isUserContextLoading} // Disable while AI is working
                                    size="small" // Make it match date picker size
                                />
                            </Grid>
                            {/* --- END ADD --- */}

                        </Grid>
                        {/* --- ADD ApiUsageDisplay --- */}
                        <Grid item xs={12} sm={12} md={6} sx={{ mt: { xs: 1, md: 0 } }}> {/* Removed display and justifyContent */}
                            <ApiUsageDisplay serviceName="journalAnalysis" />
                        </Grid>
                        {/* --- END ADD --- */}
                        {aiError && <Alert severity="error" sx={{ mt: 2 }}>{aiError}</Alert>}
                    </Paper>
                }

                {/* --- Responsive Layout using Grid --- */}
                <Grid container spacing={3}>
                    {/* Right Panel (Meal History) */}
                    <Grid item xs={12} md={5}>
                        {/* --- Render MealHistoryList --- */}
                        <MealHistoryList
                            meals={mealsInRange} // Pass the filtered meals
                            totalMealCount={mealsHistory.length} // Pass total count for context
                            selectedMealId={selectedMealForView?._id}
                            onSelectMeal={handleSelectMealForView}
                            isLoading={isLoadingHistory}
                            error={historyError}
                            // TODO: Pass date range props when moving date pickers here
                            dateRange={dateRange}
                            onDateRangeChange={handleDateRangeChange}
                            onAnalyze={handleGetAnalysis}
                            isAiLoading={isAiLoading}
                            userData={userData}
                            onLogNewMeal={handleOpenAddModal} // Pass the handler
                            isUserDataLoading={isUserDataLoading || isUserContextLoading} // Pass loading state
                            userDataError={userDataError}       // Pass error state
                            // --- Pass subscriber status ---
                            isSubscriber={isSubscriber}
                            isUserLoading={isUserContextLoading} // Pass context loading state separately
                            handleLockedFeatureClick={handleLockedFeatureClick}
                            // --- Props for Meal Presets ---
                            presets={presets}
                            isLoadingPresets={isLoadingPresets}
                            presetsError={presetsError}
                            onSelectPreset={handleSelectPreset}
                            selectedPresetId={selectedPresetId}
                            totalPresetCount={presets.length}
                            onRefreshPresets={handlePresetAddedOrUpdated} // Pass the refresh handler
                        // -------------------------------
                        />
                        {/* -------------------------- */}
                    </Grid>

                    {/* Left Panel (Meal Detail + AI Chat OR Preset Detail) */}
                    <Grid item xs={12} md={7}>
                        {selectedPresetObject ? (
                            <PresetDetailViewer
                                preset={selectedPresetObject}
                                isLoading={isLoadingPresets} // You might have a more specific loading state if fetching full detail later
                                onEditPreset={handlePresetAddedOrUpdated} // Use the new handler for edits
                                onDeletePreset={handleDeletePreset}
                                availableIngredients={availableIngredients}
                                isLoadingAvailableIngredients={isLoadingAvailableIngredients}
                                availableIngredientsError={availableIngredientsError}
                            />
                        ) : (
                            <>
                                <MealDetailViewer
                                    meal={selectedMealForView}
                                    isLoading={isLoadingSelectedMeal} // Pass loading state if applicable
                                    onEdit={handleOpenEditModal}
                                    // Pass necessary props to control Edit button state
                                    isUserDataLoading={isUserDataLoading || isUserContextLoading}
                                    userDataError={userDataError}
                                    therapeuticDietSet={!!(contextUser?.therapeuticDiet || userData.therapeuticDiet)} // Check context first
                                />
                                {/* Render AIChatInterface only if a meal is selected or no preset is selected */}
                                {/* This prevents chat from showing when a preset is being viewed, adjust if needed */}
                                {!selectedPresetObject && (
                                    <AIChatInterface
                                        chatHistory={chatHistory}
                                        onSendMessage={handleSendChatMessage}
                                        isLoading={isAiLoading}
                                        error={aiError} // Pass AI-specific error
                                        isUserLoading={isUserContextLoading} // Pass context loading state
                                        isSubscriber={isSubscriber}
                                        handleLockedFeatureClick={handleLockedFeatureClick}
                                    />
                                )}
                            </>
                        )}
                    </Grid>


                </Grid>

                {/* --- Render the Modal (Keep as is) --- */}
                {(isAddModalOpen || isEditModalOpen) && (
                    <MealFormModal
                        open={isAddModalOpen || isEditModalOpen}
                        onClose={handleCloseModals}
                        isEditMode={isEditModalOpen}
                        initialMealData={isEditModalOpen ? selectedMealForView : undefined}
                        onSave={handleSaveMeal}
                        onDelete={handleDeleteMeal}
                        user={user}
                        userData={contextUser || userData} // Pass context user primarily for diet info
                        availableIngredients={availableIngredients}
                        isLoadingAvailableIngredients={isLoadingAvailableIngredients}
                        availableIngredientsError={availableIngredientsError}
                        masterSymptoms={masterSymptoms}
                        onPresetChanged={handlePresetAddedOrUpdated} // Pass the callback here
                    />
                )}
            </div>
        </main>
    );
}