import { useState } from 'react'
import { useRef } from 'react'
import { useEffect } from 'react'
import IngredientsList from './IngredientsList.jsx'
import Recipe_AI from './Recipe_AI.jsx'
import { getRecipeFromChefClaude } from '../ai.js'
import { Button, Alert } from '@mui/material'
import { CirclePlus } from 'lucide-react'
import TextField from '@mui/material/TextField';
import { LoadingSpinner } from './LoadingSpinner.jsx'
import { getAuth, onAuthStateChanged } from 'firebase/auth'
import { API_BASE_URL } from '../env-config.js'
import { useApiLimits } from '../context/ApiLimitsContext'
import ApiUsageDisplay from '../context/ApiUsageDisplay.jsx'
import AIStyleSelector from './UI/AIStyleSelector.jsx'

export default function Recipe_Service() {

    const trackClick = () => {

        // Check if umami is available in the window object
        if (typeof window !== 'undefined' && window.umami) {
            window.umami.track('create_recipe_button_click', {
                source: 'create_recipe_page',
                location: 'get_recipe_button',
                button_text: 'Get Recipe'
            });
            //console.log(`(Recipe_Service.jsx - Umami) - Create Recipe button clicked`);
        }
    };

    const auth = getAuth()
    const { setApiLimits } = useApiLimits()
    const [error, setError] = useState(null)
    const [ingredients, setIngredients] = useState([])
    const [recipeText, setRecipeText] = useState('')
    const [responseId, setResponseId] = useState('')
    const [formDisabled, setFormDisabled] = useState(false)
    const [isAILoading, setIsAILoading] = useState(false)
    const [therapeuticDiet, setTherapeuticDiet] = useState('')
    const [hasScrolledToResponse, setHasScrolledToResponse] = useState(false)
    const [convoStyle, setConvoStyle] = useState('')

    // Store controller reference for streaming
    const streamController = useRef(null);

    // this is used below to send as a prop to the IngredientsList component, and in the IngredientsList.jsx
    const recipeSection = useRef(null) // if using this on a DOM node best practice to set to null
    ////console.log('the recipeSection ref object is: ', recipeSection)

    // Keep fetchUserData useEffect as it fetches diet, ensure auth header is correct
    useEffect(() => {
        const fetchUserData = async () => {
            if (auth.currentUser) {
                try {
                    //console.log('(Recipe_Service) Current Firebase UID:', auth.currentUser.uid);
                    const idToken = await auth.currentUser.getIdToken(); // Get token
                    const response = await fetch(`${API_BASE_URL}/api/users/${auth.currentUser.uid}`, {
                        headers: { 'Authorization': `Bearer ${idToken}` } // Use token
                    });
                    if (!response.ok) {
                        let errorBody = 'Could not read error body';
                        try { errorBody = await response.text(); } catch (e) { }
                        console.error(`(Recipe_Service fetchUserData) Fetch error: ${response.status}, Body: ${errorBody}`);
                        throw new Error(`Failed to fetch user data (status ${response.status})`);
                    }
                    const apiUserData = await response.json();
                    //console.log('(Recipe_Service) MongoDB User Data:', apiUserData);
                    setTherapeuticDiet(apiUserData.therapeuticDiet || ''); // Set default
                } catch (error) {
                    console.error('(Recipe_Service) Error fetching user data', error);
                    setTherapeuticDiet(''); // Reset on error
                }
            } else {
                setTherapeuticDiet(''); // Clear if no user
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

    }, [auth]); // Depend on auth object

    // Add effect to scroll when text appears and reset scroll flag on new generation
    useEffect(() => {
        if (isAILoading) {
            setHasScrolledToResponse(false); // Reset scroll flag when starting
        } else if (recipeText && recipeSection.current && !hasScrolledToResponse) {
            //console.log("(Recipe_Service) - Scrolling to response section");
            recipeSection.current.scrollIntoView({ behavior: 'smooth' });
            setHasScrolledToResponse(true); // Prevent re-scrolling on chunk updates
        }
    }, [isAILoading, recipeText, hasScrolledToResponse]); // Dependencies

    // Add cleanup to abort any ongoing streams if component unmounts
    useEffect(() => {
        return () => {
            if (streamController.current) {
                streamController.current.abort();
            }
        };
    }, []);

    // --- MODIFIED getRecipe function ---
    async function getRecipe() {
        trackClick();
        // --- Check for current user object ---
        const currentUser = auth.currentUser;
        if (!currentUser) {
            console.error('(Recipe_Service getRecipe) - User not logged in.');
            setError('Please log in to generate a recipe.');
            setIsAILoading(false); // Ensure loading stops
            setFormDisabled(false); // Ensure form is enabled
            return; // Stop execution
        }
        // --- End check ---

        // Check if ingredients are provided
        if (ingredients.length === 0) { // You might want >= 4 here if that's the real rule
            setError('Please add at least one ingredient.'); // Or 'at least 4 ingredients.'
            setIsAILoading(false);
            setFormDisabled(false);
            return;
        }

        //console.log(`(Recipe_Service getRecipe) - Ingredients array size: ${ingredients.length}`);
        setError(null); // Clear previous errors
        setRecipeText('');
        setResponseId('');
        setIsAILoading(true); // Set loading true here before async call
        setFormDisabled(true); // Disable form before async call

        try {
            // --- Pass the currentUser object instead of currentUser.uid ---
            const { stream, controller } = await getRecipeFromChefClaude(
                ingredients,
                currentUser, // Pass the whole user object
                convoStyle
            );
            // -------------------------------------------------------------
            streamController.current = controller;

            let accumulatedText = '';
            let metadataReceived = false;

            for await (const part of stream) {
                if (part.type === 'chunk') {
                    setIsAILoading(false); // Stop spinner once text arrives
                    accumulatedText += part.text;
                    setRecipeText(accumulatedText);
                } else if (part.type === 'metadata' && !metadataReceived) {
                    metadataReceived = true;
                    setResponseId(part.responseId);
                    // Update context with metadata
                    setApiLimits(prev => {
                        if (!prev) return prev;
                        return {
                            ...prev,
                            limits: {
                                ...prev.limits,
                                recipeGeneration: {
                                    ...(prev.limits?.recipeGeneration || {}),
                                    remaining: part.remainingRequests
                                }
                            },
                            lastReset: part.resetTime || prev.lastReset // Use new reset time if available
                        };
                    });
                    //console.log("(Recipe_Service) ApiLimitsContext updated.");
                }
                // Error handling now primarily within streamResponse
            }
            //console.log("(Recipe_Service getRecipe) - Streaming finished successfully.");

        } catch (streamError) {
            console.error('(Recipe_Service getRecipe) Stream error:', streamError);
            setIsAILoading(false); // Ensure loading stops on error
            if (streamError.name !== 'AbortError') {
                setError(streamError.message || 'An error occurred while generating the recipe.');
            }
            setRecipeText(''); // Clear partial text on error
        } finally {
            // Now done inside the loop/catch: setIsAILoading(false);
            setFormDisabled(false); // Re-enable form
            streamController.current = null; // Clear controller ref
            //console.log('(Recipe_Service getRecipe) - Finally block executed');
        }
    }
    // --- END MODIFIED getRecipe function ---

    function addIngredients(formData) {
        const newIngredient = formData.get("ingredient") //Extracts the value of the "ingredient" field from the form data submitted in the `event` object.
        // const newIngredient = formData.get("ingredient")?.trim(); // Use optional chaining and trim

        if (newIngredient !== '') {
            // addIngredients is the state function inside Recipe function above
            // take the previous state of the ingredients array, add the new ingredient from the user submitted form
            setIngredients(prevIngredients => [...prevIngredients, newIngredient])
            setError(null); // Clear error if adding succeeds

            // --- Clear the input field ---
            const inputElement = document.querySelector('input[name="ingredient"]');
            if (inputElement) {
                inputElement.value = ''; // Set value to empty string
                inputElement.focus();     // Optional: keep focus
            }
            // --- End input clearing ---


        } else {
            setError('You must enter text before using this AI service.')
            //console.log(`ERROR: user did not enter text into input box`)
        }
    }

    // --- Kept disableUserForm (used by IngredientsList) ---
    function disableUserForm() { // Renamed from disableUserForm(formData) as formData isn't needed
        // Don't need to disable form here, getRecipe does it. Just call getRecipe.
        // setFormDisabled(true) // getRecipe handles this
        // setIsAILoading(true) // getRecipe handles this
        //console.log('🔵 Get Recipe button clicked (via disableUserForm)');
        getRecipe(); // Directly call the main recipe function
    }

    function handleConvoStyleChange(event) {
        setConvoStyle(event.target.value);
    }

    // Log the convoStyle to the console whenever it changes
    useEffect(() => {
        //console.log(`🔵 (Recipe_Service.jsx) - AI Convo style changed to: ${convoStyle}`);
    }, [convoStyle]);

    return (
        <>
            <main>
                {isAILoading && <div className='loading-spinner'><LoadingSpinner /></div>}

                <div className='ai-service-container'>
                    <div className='text-3xl'>Create a Meal from Ingredients</div>
                    <p className='pb-8'>Have a list of ingredients but don't know what {therapeuticDiet || 'diet-compliant'} meal to make? Enter your ingredients one at a time to get a recipe suggestion. You need at least 4 ingredients to ask Kay for recipe recommendations.</p>

                    {/* --- AIStyleSelector component --- */}
                    <AIStyleSelector
                        value={convoStyle}
                        onChange={handleConvoStyleChange}
                    />
                    {/* --- ApiUsageDisplay component --- */}
                    <ApiUsageDisplay serviceName="recipeGeneration" />


                    {/* --- Form for adding ingredients (stays the same) --- */}
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            addIngredients(new FormData(e.target));
                        }}
                        className="add-ingredient-form"
                    >
                        <fieldset disabled={formDisabled}>
                            <TextField
                                name="ingredient"
                                className="userInput"
                                id="ingredient-input"
                                label="Add Ingredient"
                                variant="outlined"
                                placeholder="e.g. chicken"
                                aria-label="Add ingredient"
                                disabled={formDisabled}
                                autoFocus
                                fullWidth
                            />
                            {/* Display add ingredient error here */}
                            {error && !recipeText && <Alert severity="error" sx={{ mt: 1 }}>{error}</Alert>}
                            <Button
                                disabled={formDisabled}
                                type='submit'
                                variant='contained'
                                startIcon={<CirclePlus />}
                                size='large'
                                sx={{ mt: 1 }}
                            >
                                Add Ingredient
                            </Button>
                        </fieldset>
                    </form>

                    {/* --- Display IngredientsList WHEN ingredients exist --- */}
                    {/* The list itself will decide when to show the "Get Recipe" button */}
                    {ingredients.length > 0 && (
                        <div className='mt-4'>
                            <IngredientsList
                                ref={recipeSection}
                                // Pass the function to trigger recipe generation
                                getClaudeRecipe={disableUserForm} // Pass the correctly scoped function
                                ingredients={ingredients}
                                formDisabled={formDisabled || isAILoading} // Pass disabled state
                            />
                            {/* Display recipe generation error here */}
                            {error && recipeText && <Alert severity="error" sx={{ mt: 1 }}>{error}</Alert>}

                            {/* --- REMOVED the extra "Get Recipe" button from here --- */}
                        </div>
                    )}


                    {/* --- Display AI Response (Keep as is) --- */}
                    {recipeText &&
                        <Recipe_AI
                            ingredients={ingredients}
                            recipeText={recipeText}
                            responseId={responseId}
                        />
                    }
                </div>
            </main>
        </>
    )
}