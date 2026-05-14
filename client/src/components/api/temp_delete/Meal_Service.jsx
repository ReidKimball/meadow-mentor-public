import { useState, useRef, useEffect } from 'react';
// ... other imports
import Meal_AI from './Meal_AI.jsx';
import { getMealFromSCDChef } from '../ai.js';
import { Button, TextField, Alert } from '@mui/material'; // Combined MUI imports
import { ForkKnife } from 'lucide-react';
import { LoadingSpinner } from './LoadingSpinner.jsx';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { API_BASE_URL } from '../env-config.js';
import { useApiLimits } from '../context/ApiLimitsContext.jsx';
import ApiUsageDisplay from '../context/ApiUsageDisplay.jsx';
import AIStyleSelector from './UI/AIStyleSelector.jsx'

export default function Meal_Service() {

    const trackClick = () => {
        if (typeof window !== 'undefined' && window.umami) {
            window.umami.track('adapt_meal_button_click', {
                source: 'adapt_meal_page',
                location: 'adapt_meal_button',
                button_text: 'Adapt Meal'
            });
            //console.log(`(Meal_Service.jsx - Umami) - Adapt Meal button clicked`);
        }
    };

    const auth = getAuth();
    const { setApiLimits } = useApiLimits(); // Keep setApiLimits
    const [error, setError] = useState(null);
    const [mealText, setMealText] = useState("");
    const [formDisabled, setFormDisabled] = useState(false);
    const [isAILoading, setIsAILoading] = useState(false);
    const [responseId, setResponseId] = useState('');
    const [therapeuticDiet, setTherapeuticDiet] = useState('');
    const [hasScrolledToResponse, setHasScrolledToResponse] = useState(false);
    const [convoStyle, setConvoStyle] = useState('')

    const streamController = useRef(null);
    const mealSection = useRef(null);

    // Fetch therapeutic diet (keep this if needed specifically here)
    useEffect(() => {
        const fetchUserData = async () => {
            if (auth.currentUser) {
                try {
                    //console.log('(Meal_Service) Current Firebase UID:', auth.currentUser.uid);
                    // --- Get ID Token ---
                    const idToken = await auth.currentUser.getIdToken();
                    // --------------------
                    const response = await fetch(`${API_BASE_URL}/api/users/${auth.currentUser.uid}`, {
                        // --- Add Auth Header ---
                        headers: { 'Authorization': `Bearer ${idToken}` }
                        // ---------------------
                    });

                    // --- Add response checking ---
                    if (!response.ok) {
                        let errorBody = 'Could not read error body';
                        try { errorBody = await response.text(); } catch (e) { /* ignore */ }
                        console.error(`(Meal_Service fetchUserData) Fetch error status: ${response.status}, body: ${errorBody}`);
                        throw new Error(`Failed to fetch user diet (status ${response.status})`);
                    }
                    // --- End response checking ---

                    const apiUserData = await response.json();
                    //console.log('(Meal_Service) MongoDB User Data for Diet:', apiUserData);
                    setTherapeuticDiet(apiUserData.therapeuticDiet || ''); // Set default
                } catch (error) {
                    console.error('(Meal_Service) Error fetching user therapeutic diet', error);
                    setTherapeuticDiet(''); // Reset diet on error
                    // Optionally set an error state specific to diet fetching if needed
                }
            } else {
                //console.log("(Meal_Service) No user, clearing diet.");
                setTherapeuticDiet(''); // Clear diet if user logs out
            }
        };

        // Use onAuthStateChanged to fetch data when user logs in/out
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                fetchUserData();
            } else {
                setTherapeuticDiet('');
            }
        });
        return () => unsubscribe(); // Cleanup listener

    }, [auth]); // Depend only on auth object
    // --- END MODIFIED ---

    // Add effect to scroll when text appears and reset scroll flag on new generation
    useEffect(() => {
        if (isAILoading) {
            setHasScrolledToResponse(false); // Reset scroll flag when starting
        } else if (mealText && mealSection.current && !hasScrolledToResponse) {
            //console.log("(Meal_Service) - Scrolling to response section");
            mealSection.current.scrollIntoView({ behavior: 'smooth' });
            setHasScrolledToResponse(true); // Prevent re-scrolling on chunk updates
        }
    }, [isAILoading, mealText, hasScrolledToResponse]); // Dependencies

    // Cleanup stream controller
    useEffect(() => {
        return () => {
            if (streamController.current) {
                streamController.current.abort();
            }
        };
    }, []);


    async function getSCDMeal(formData) {
        trackClick();
        //const userMealDescription = formData.get("mealDescription");
        const userMealDescription = formData.get("mealDescription")?.trim(); // Trim input to remove whitespaces before and after words.
        //console.log('🔵 1. Got user description:', userMealDescription);

        if (!userMealDescription) {
            setError('You must enter text before using this AI service.');
            //console.log(`ERROR: user did not enter text into input box`);
            // Ensure loading/disabled states are reset if they were set before this check
            setIsAILoading(false);
            setFormDisabled(false);
            return; // Stop execution
        }

        // --- Get current user object ---
        const currentUser = auth.currentUser;
        // --- Check if user is logged in ---

        if (!currentUser) {
            setError('Please log in to use this feature.');
            setIsAILoading(false);
            setFormDisabled(false);
            return; // Stop execution
        }

        // Set loading/disabled states *after* validation
        setFormDisabled(true);
        setIsAILoading(true);
        setError(null); // Clear previous errors
        setMealText(''); // Clear previous meal text
        setResponseId(''); // Clear previous response ID

        try {
            //console.log('🔵 3. About to call AI...');
            const { stream, controller } = await getMealFromSCDChef(userMealDescription, currentUser, convoStyle);
            streamController.current = controller;

            let accumulatedText = '';
            let metadataReceived = false;

            for await (const part of stream) {
                if (part.type === 'chunk') {
                    setIsAILoading(false); // remove the loading spinner feedback once text starts streaming in
                    accumulatedText += part.text;
                    setMealText(accumulatedText);
                } else if (part.type === 'metadata' && !metadataReceived) {
                    metadataReceived = true;
                    setResponseId(part.responseId);
                    // --- Update context, not local state ---
                    setApiLimits(prev => {
                        if (!prev) return prev; // Handle case where context hasn't loaded yet
                        return {
                            ...prev,
                            limits: {
                                ...prev.limits,
                                mealConvert: { // Update specific service
                                    ...(prev.limits?.mealConvert || {}), // Keep existing properties if any
                                    remaining: part.remainingRequests
                                }
                            },
                            lastReset: part.resetTime || prev.lastReset // Update global reset time
                        };
                    });
                    //console.log("ApiLimitsContext updated via Meal_Service");
                } else if (part.error) { // Handle potential errors streamed back
                    console.error('Stream returned an error:', part.error);
                    throw new Error(part.error);
                }
            }
            setError(null); // Clear error on success
        } catch (streamError) {
            console.error('Stream error:', streamError);
            setIsAILoading(false); // Ensure loading stops on error
            if (streamError.name !== 'AbortError') { // Don't show error if user cancelled
                setError(streamError.message || 'An error occurred while generating the meal.');
            }
            setMealText(''); // Clear partial text on error
        } finally {
            setFormDisabled(false);
            streamController.current = null; // Clear controller ref
            //console.log('🔵 Finally block executed');
        }
    }


    // This function now just wraps the call and sets initial states
    function handleFormSubmit(event) {
        event.preventDefault(); // Prevent default form submission
        const formData = new FormData(event.target);
        // Initial state setting moved to getSCDMeal after validation
        getSCDMeal(formData);
    }


    function tryQuestion(mealType) {
        //console.log('tryQuestion entered: ', mealType);
        const formData = new FormData();
        formData.set("mealDescription", mealType);
        // Set loading states here before calling getSCDMeal directly
        setFormDisabled(true);
        setIsAILoading(true);
        setError(null);
        setMealText('');
        setResponseId('');
        getSCDMeal(formData); // Call the async function directly
    }

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
                    <div className='text-3xl'><h1>Adapt a Meal to {therapeuticDiet || 'your diet'}</h1></div>
                    <p>Do you miss a favorite meal or cuisine? Enter the meal, cuisine name, or a brief description below and Kay will adapt it to the {therapeuticDiet || 'specified diet'}!</p>
                    {/* Use onSubmit for the form */}
                    <form onSubmit={handleFormSubmit} className="add-ingredient-form">
                        <fieldset disabled={formDisabled || isAILoading}> {/* Also disable fieldset when AI is loading */}

                            {/* --- AIStyleSelector component --- */}
                            <AIStyleSelector
                                value={convoStyle}
                                onChange={handleConvoStyleChange}
                            />

                            {/* --- ApiUsageDisplay component --- */}
                            <ApiUsageDisplay
                                serviceName="mealConvert"
                            />

                            <TextField
                                name="mealDescription"
                                className="userInput"
                                id="outlined-basic"
                                label="Meal or Cuisine to Adapt" // More descriptive label
                                variant="outlined"
                                placeholder="e.g., lasagna, chinese food, pizza" // Updated placeholder
                                aria-label="Add meal description"
                                fullWidth // Make text field take full width
                                disabled={formDisabled || isAILoading} // Ensure field is disabled correctly
                            />

                            {error && <Alert severity="error" className="my-2">{error}</Alert>}
                            <Button
                                disabled={formDisabled || isAILoading} // Consistent disabling
                                type='submit'
                                variant='contained'
                                startIcon={<ForkKnife />}
                                size='large'
                                fullWidth // Make button take full width
                                sx={{ mt: 1 }} // Add some margin top
                            >
                                Adapt Meal
                            </Button>

                        </fieldset>
                    </form>
                    <div className='text-xl p-6 my-4 bg-blue-100 rounded-md'> {/* Adjusted styling */}
                        <div className='text-xl font-semibold mb-3'>Try these examples:</div> {/* Adjusted styling */}
                        <div className='gap-3 flex flex-col sm:flex-row flex-wrap justify-center'> {/* Responsive layout */}
                            <Button variant='outlined' startIcon={<ForkKnife />} onClick={() => tryQuestion("waffles")}>Waffles</Button>
                            <Button variant='outlined' startIcon={<ForkKnife />} onClick={() => tryQuestion("italian")}>Italian</Button>
                            <Button variant='outlined' startIcon={<ForkKnife />} sx={{ lineHeight: 1.2 }} onClick={() => tryQuestion("breakfast burrito with eggs and cheese")}>Breakfast Burrito</Button>
                        </div>
                    </div>

                    {mealText &&
                        <Meal_AI
                            ref={mealSection}
                            mealText={mealText}
                            responseId={responseId}
                        />
                    }
                </div>
            </main>
        </>
    );
}

