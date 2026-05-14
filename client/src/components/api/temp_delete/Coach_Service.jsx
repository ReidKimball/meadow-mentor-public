import { useState } from 'react'
import { useRef } from 'react'
import { useEffect } from 'react'
import Coach_AI from './Coach_AI.jsx'
import { getInfoFromSCDCoach } from '../ai.js'
import { Button, TextField, Alert } from '@mui/material'; // Added Alert
import { MessageCircleQuestion } from 'lucide-react'
import { LoadingSpinner } from './LoadingSpinner.jsx'
import { getAuth, onAuthStateChanged } from 'firebase/auth'
import { API_BASE_URL } from '../env-config.js'
import { useApiLimits } from '../context/ApiLimitsContext'
import ApiUsageDisplay from '../context/ApiUsageDisplay.jsx'
import AIStyleSelector from './UI/AIStyleSelector.jsx'

export default function Coach_Service() {

    const trackClick = () => {

        // Check if umami is available in the window object
        if (typeof window !== 'undefined' && window.umami) {
            window.umami.track('ask_kay_button_click', {
                source: 'ask_kay_page',
                location: 'ask_kay_button',
                button_text: 'Ask Kay'
            });
            //console.log(`(Coach_Service.jsx - Umami) - Ask Kay button clicked`);
        }
    };

    const auth = getAuth()
    const { setApiLimits } = useApiLimits()
    const [error, setError] = useState(null)
    const [coachingText, setCoachingText] = useState("")
    const [formDisabled, setFormDisabled] = useState(false)
    const [isAILoading, setIsAILoading] = useState(false)
    const [responseId, setResponseId] = useState('')
    const [therapeuticDiet, setTherapeuticDiet] = useState('')
    const [hasScrolledToResponse, setHasScrolledToResponse] = useState(false)
    const [convoStyle, setConvoStyle] = useState('')

    // Store controller reference for streaming
    const streamController = useRef(null);

    //console.log('isAILoading is set to:', isAILoading)

    // this is used below to send as a prop to the Coach_AI component
    const coachingSection = useRef(null) // if using this on a DOM node best practice to set to null
    //console.log('the coachingSection ref object is: ', coachingSection)

    // --- MODIFIED: Fetch User Data ---
    useEffect(() => {
        const fetchUserDataInternal = async (user) => { // Renamed inner function
            if (!user) { // Guard clause if somehow called without user
                //console.log("(Coach_Service fetchUserData) No user provided, skipping fetch.");
                setTherapeuticDiet('');
                return;
            }
            try {
                //console.log('(Coach_Service) Fetching user data for UID:', user.uid);
                // --- Get ID Token ---
                const idToken = await user.getIdToken();
                // --------------------
                const response = await fetch(`${API_BASE_URL}/api/users/${user.uid}`, {
                    // --- Add Auth Header ---
                    headers: { 'Authorization': `Bearer ${idToken}` }
                    // ---------------------
                });

                // --- Add response checking ---
                if (!response.ok) {
                    let errorBody = 'Could not read error body';
                    try { errorBody = await response.text(); } catch (e) { }
                    console.error(`(Coach_Service fetchUserData) Fetch error status: ${response.status}, body: ${errorBody}`);
                    throw new Error(`Failed to fetch user diet (status ${response.status})`);
                }
                // --- End response checking ---

                const apiUserData = await response.json();
                //console.log('(Coach_Service) MongoDB User Data:', apiUserData);
                setTherapeuticDiet(apiUserData.therapeuticDiet || ''); // Set default
            } catch (error) {
                console.error('(Coach_Service) Error fetching user data:', error);
                setTherapeuticDiet(''); // Reset on error
                // Optionally set an error state to inform the user about the diet fetch failure
            }
        };

        // Use onAuthStateChanged to trigger the fetch when user logs in/out
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
                fetchUserDataInternal(currentUser); // Call the inner function with the user object
            } else {
                //console.log("(Coach_Service) No user logged in, clearing diet.");
                setTherapeuticDiet(''); // Clear diet on logout
            }
        });

        // Cleanup the listener when the component unmounts
        return () => unsubscribe();

    }, [auth]); // Depend only on the auth object
    // --- END MODIFIED ---

    // Add effect to scroll when text appears and reset scroll flag on new generation
    useEffect(() => {
        if (isAILoading) {
            setHasScrolledToResponse(false); // Reset scroll flag when starting
        } else if (coachingText && coachingSection.current && !hasScrolledToResponse) {
            //console.log("(Coach_Service) - Scrolling to response section");
            coachingSection.current.scrollIntoView({ behavior: 'smooth' });
            setHasScrolledToResponse(true); // Prevent re-scrolling on chunk updates
        }
    }, [isAILoading, coachingText, hasScrolledToResponse]); // Dependencies

    // Add cleanup to abort any ongoing streams if component unmounts
    useEffect(() => {
        return () => {
            if (streamController.current) {
                streamController.current.abort();
            }
        };
    }, []);

    // Cleanup stream controller
    useEffect(() => {
        return () => {
            if (streamController.current) {
                streamController.current.abort();
            }
        };
    }, []);

    async function getCoaching(formData) {
        const userQuery = formData.get("userQuery")?.trim(); // Extracts the value of the "userQuery" field from the form data.
        //console.log(`(Coach_Service.jsx) - user entered question is: ${userQuery}`)

        if (!userQuery) {
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
            return;
        }

        // Set loading/disabled states *after* validation
        setFormDisabled(true);
        setIsAILoading(true);
        setError(null); // Clear previous errors
        setCoachingText(''); // Clear previous meal text
        setResponseId(''); // Clear previous response ID

        try {
            // Start streaming
            const { stream, controller } = await getInfoFromSCDCoach(userQuery, currentUser, convoStyle)
            streamController.current = controller;

            let accumulatedText = '';
            let metadataReceived = false;

            for await (const part of stream) {
                if (part.type === 'chunk') {
                    setIsAILoading(false); // remove the loading spinner feedback once text starts streaming in
                    // Append each new chunk to the accumulated text
                    accumulatedText += part.text;
                    setCoachingText(accumulatedText);
                } else if (part.type === 'metadata' && !metadataReceived) {
                    // Handle the metadata (once)
                    metadataReceived = true;
                    setResponseId(part.responseId);
                    // --- Update context, not local state ---
                    setApiLimits(prev => {
                        if (!prev) return prev; // Handle case where context hasn't loaded yet
                        return {
                            ...prev,
                            limits: {
                                ...prev.limits,
                                askKay: { // Update specific service
                                    ...(prev.limits?.askKay || {}), // Keep existing properties if any
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
            //setMealText(''); // Clear partial text on error
            setCoachingText(''); // Clear partial text on error
        } finally {
            //setIsAILoading(false); // Handled in loop/catch
            setFormDisabled(false);
            streamController.current = null; // Clear controller ref
            //console.log('🔵 Finally block executed');
        }
    }

    // This function now just wraps the call and sets initial states
    function handleFormSubmit(event) {
        trackClick();
        event.preventDefault(); // Prevent default form submission
        const formData = new FormData(event.target);
        // Initial state setting moved to getSCDMeal after validation
        getCoaching(formData);
    }

    // This function now just wraps the call
    function tryQuestion(exampleQuestion) {
        //console.log('tryQuestion entered: ', exampleQuestion)
        const formData = new FormData() // creates empty FormData object, same type of object that's created when submitting an HTLM form
        formData.set("userQuery", exampleQuestion) // adds a key-value pair to the FormData object: 1. key is "mealDescript" which matches the forms input field, 2. value is whatever mealType is passed into the tryQuestion function
        getCoaching(formData)
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
                    <div className='text-3xl'><h1>Ask Kay Anything</h1></div>
                    <p>Ask Kay any question you have about {therapeuticDiet || 'your diet'}. How to manage stress, relationships, and make the {therapeuticDiet || 'diet'} easier to do are all valid questions. Think of this service as having your own private mentor to talk about anything that is challenging in your {therapeuticDiet || 'diet'} healing journey.</p>
                    <form onSubmit={handleFormSubmit} className="add-ingredient-form">
                        <fieldset disabled={formDisabled}>

                            {/* --- AIStyleSelector component --- */}
                            <AIStyleSelector
                                value={convoStyle}
                                onChange={handleConvoStyleChange}
                            />

                            {/* --- ApiUsageDisplay component --- */}
                            <ApiUsageDisplay
                                serviceName="askKay"
                            />

                            <TextField
                                name="userQuery"
                                className="userInput"
                                id="outlined-basic" label="Ask Question" variant="outlined"
                                placeholder="e.g. Tell me about the Bristol Stool Chart."
                                aria-label="Add question"
                                alt="question text field"
                                disabled={formDisabled}
                            />

                            {/* Display error message */}
                            {error && <Alert severity="error" sx={{ mt: 1 }}>{error}</Alert>}
                            <Button
                                disabled={formDisabled}
                                type='submit'
                                variant='contained'
                                startIcon={<MessageCircleQuestion />}
                                size='large'
                            >
                                Ask Kay
                            </Button>

                        </fieldset>
                    </form>
                    {/* 
                    OLD as of 25 04 19
                    <div className='text-4xl p-8 bg-blue-200 rounded-md'>
                        <div className='text-4xl'>Try these questions:</div>
                        <div className='gap-8 p-8 flex flex-col flex-wrap content-center md:flex-row md:justify-center'>
                            <Button variant='outlined' sx={{ lineHeight: 1.2 }} startIcon={<MessageCircleQuestion />} className="cta-button bg-blue-800 shadow-sm hover:shadow-md" onClick={() => tryQuestion(`Can AI LLMs help me with learning ${therapeuticDiet}?`)}>How can you help me with the {therapeuticDiet}?</Button>
                            <Button variant='outlined' sx={{ lineHeight: 1.2 }} startIcon={<MessageCircleQuestion />} className="cta-button bg-blue-800 shadow-sm hover:shadow-md" onClick={() => tryQuestion(`Why aren't complex carbohydrates allowed on ${therapeuticDiet}?`)}>Why aren't complex carbohydrates allowed on {therapeuticDiet}?</Button>
                            <Button variant='outlined' sx={{ lineHeight: 1.2 }} startIcon={<MessageCircleQuestion />} className="cta-button bg-blue-800 shadow-sm hover:shadow-md" onClick={() => tryQuestion("Tell me about the Bristol Stool Chart.")}>Tell me about the Bristol Stool Chart.</Button>
                            <Button variant='outlined' sx={{ lineHeight: 1.2 }} startIcon={<MessageCircleQuestion />} className="cta-button bg-blue-800 shadow-sm hover:shadow-md" onClick={() => tryQuestion(`Is glutamine a helpful supplement if I'm on ${therapeuticDiet}?`)}>Is glutamine a helpful supplement if I'm on {therapeuticDiet}?</Button>
                            <Button variant='outlined' sx={{ lineHeight: 1.2 }} startIcon={<MessageCircleQuestion />} className="cta-button bg-blue-800 shadow-sm hover:shadow-md" onClick={() => tryQuestion("Is there a way to test if my eggs are spoiled?")}>Is there a way to test if my eggs are spoiled?</Button>
                            <Button variant='outlined' sx={{ lineHeight: 1.2 }} startIcon={<MessageCircleQuestion />} className="cta-button bg-blue-800 shadow-sm hover:shadow-md" onClick={() => tryQuestion(`My family doesn't understand I need to eat ${therapeuticDiet} to stay healthy. What can I do to adhere to ${therapeuticDiet}?`)}>My family doesn't understand I need to eat {therapeuticDiet} to stay healthy. What can I do to adhere to {therapeuticDiet}?</Button>
                        </div>
                    </div> */}

                    {/* Keep Example Questions section */}
                    <div className='text-xl p-6 my-4 bg-blue-100 rounded-md'> {/* Adjusted styling */}
                        <div className='text-xl font-semibold mb-3'>Try these questions:</div> {/* Adjusted styling */}
                        <div className='gap-3 p-4 flex flex-col flex-wrap content-center md:flex-row md:justify-center'> {/* Adjusted styling */}
                            {/* Buttons use therapeuticDiet state which is now fetched correctly */}
                            <Button variant='outlined' sx={{ lineHeight: 1.2 }} startIcon={<MessageCircleQuestion />} onClick={() => tryQuestion(`Can AI LLMs help me with learning ${therapeuticDiet || 'my diet'}?`)}>How can you help me with the {therapeuticDiet || 'diet'}?</Button>
                            <Button variant='outlined' sx={{ lineHeight: 1.2 }} startIcon={<MessageCircleQuestion />} onClick={() => tryQuestion(`Why aren't complex carbohydrates allowed on ${therapeuticDiet || 'my diet'}?`)}>Why aren't complex carbs allowed?</Button>
                            <Button variant='outlined' sx={{ lineHeight: 1.2 }} startIcon={<MessageCircleQuestion />} onClick={() => tryQuestion("Tell me about the Bristol Stool Chart.")}>Bristol Stool Chart?</Button>
                            <Button variant='outlined' sx={{ lineHeight: 1.2 }} startIcon={<MessageCircleQuestion />} onClick={() => tryQuestion(`Is glutamine a helpful supplement if I'm on ${therapeuticDiet || 'my diet'}?`)}>Is glutamine helpful?</Button>
                            <Button variant='outlined' sx={{ lineHeight: 1.2 }} startIcon={<MessageCircleQuestion />} onClick={() => tryQuestion("Is there a way to test if my eggs are spoiled?")}>Testing spoiled eggs?</Button>
                            <Button variant='outlined' sx={{ lineHeight: 1.2 }} startIcon={<MessageCircleQuestion />} onClick={() => tryQuestion(`My family doesn't understand I need to eat ${therapeuticDiet || 'my diet'} to stay healthy. What can I do to adhere to ${therapeuticDiet || 'my diet'}?`)}>Family doesn't understand?</Button>
                        </div>
                    </div>

                    {/* AI Response display */}
                    {coachingText &&
                        <Coach_AI
                            ref={coachingSection}
                            coachingText={coachingText}
                            responseId={responseId}
                        />
                    }
                </div>
            </main>
        </>
    )
}
