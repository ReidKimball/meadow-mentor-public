import { useState } from 'react'
import { useRef } from 'react'
import { useEffect } from 'react'
import CheckIngredients_AI from './CheckIngredients_AI.jsx'
import { getIngLabelAnalysis } from '../ai.js'
import { Button } from '@mui/material'
import { ForkKnife, ListCheck } from 'lucide-react'
import TextField from '@mui/material/TextField';
import { LoadingSpinner } from './LoadingSpinner.jsx'
import { Upload } from 'lucide-react'
import { getAuth, onAuthStateChanged } from 'firebase/auth'
import { API_BASE_URL } from '../env-config.js'
import { useApiLimits } from '../context/ApiLimitsContext'
import ApiUsageDisplay from '../context/ApiUsageDisplay'
import AIStyleSelector from './UI/AIStyleSelector.jsx'

export default function CheckIngredients_Service() {

    const trackClick = () => {
        // Check if umami is available in the window object
        if (typeof window !== 'undefined' && window.umami) {
            window.umami.track('check_ingredients_button_click', {
                source: 'check_ingredients_page',
                location: 'check_ingredients_button',
                button_text: 'Check Ingredients'
            });
            //console.log(`(CheckIngredients_Service.jsx - Umami) - Check Ingredients button clicked`);
        }
    };

    const auth = getAuth()
    const { setApiLimits } = useApiLimits()
    const [error, setError] = useState(null)
    // create an empty state array called ingredients and a function addIngredients
    const [ingLabelText, setIngLabelText] = useState("")
    const [formDisabled, setFormDisabled] = useState(false)
    //console.log(`on CheckIngredients_Service component load formDisabled is set to: ${formDisabled}`)
    const [isAILoading, setIsAILoading] = useState(false)
    const [uploadedImage, setUploadedImage] = useState(null) // State for the uploaded image
    const [responseId, setResponseId] = useState('')
    const [therapeuticDiet, setTherapeuticDiet] = useState('')
    const [hasScrolledToResponse, setHasScrolledToResponse] = useState(false)
    const [convoStyle, setConvoStyle] = useState('')

    // Store controller reference for streaming
    const streamController = useRef(null);
    // this is used below to send as a prop to the CheckIngredients_AI component
    const ingLabelSection = useRef(null) // if using this on a DOM node best practice to set to null
    //console.log('the ingLabelSection ref object is: ', ingLabelSection)

    useEffect(() => {
        const fetchUserData = async () => {
            // Use auth.currentUser directly from the hook's scope
            if (auth.currentUser) {
                try {
                    //console.log('(CheckIngredients_Service.jsx) Current Firebase UID:', auth.currentUser.uid);

                    // --- Get the Firebase ID token ---
                    const idToken = await auth.currentUser.getIdToken();
                    // ---------------------------------

                    const response = await fetch(`${API_BASE_URL}/api/users/${auth.currentUser.uid}`, {
                        // --- Add the Authorization header ---
                        headers: {
                            'Authorization': `Bearer ${idToken}`
                        }
                        // ------------------------------------
                    });

                    // --- Add response checking ---
                    if (!response.ok) {
                        let errorBody = 'Could not read error body';
                        try {
                            errorBody = await response.text();
                        } catch (e) { /* ignore read error */ }
                        console.error(`(CheckIngredients_Service.jsx fetchUserData) Fetch error status: ${response.status}, body: ${errorBody}`);
                        throw new Error(`Failed to fetch user data (status ${response.status})`);
                    }
                    // --- End response checking ---

                    const apiUserData = await response.json();
                    //console.log('(CheckIngredients_Service.jsx) MongoDB User Data:', apiUserData);

                    setTherapeuticDiet(apiUserData.therapeuticDiet); // Corrected state setter
                    //console.log(`(CheckIngredients_Service.jsx) - ${apiUserData.email}'s therapeutic diet is ${apiUserData.therapeuticDiet}.`); // Use fetched data directly

                } catch (error) {
                    console.error('(CheckIngredients_Service.jsx) Error fetching user data:', error);
                    setTherapeuticDiet(''); // Reset on error
                    // Optionally set an error state to show the user
                }
            } else {
                //console.log("(CheckIngredients_Service.jsx) No user logged in, clearing diet.");
                setTherapeuticDiet(''); // Clear diet if user logs out
            }
        };
        // Need to listen for auth changes to trigger fetchUserData correctly
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                fetchUserData();
            } else {
                // Handle user logging out while on the page
                setTherapeuticDiet('');
            }
        });

        // Cleanup listener on component unmount
        return () => unsubscribe();

    }, [auth]); // Depend only on auth object

    // Add effect to scroll when text appears and reset scroll flag on new generation
    useEffect(() => {
        if (isAILoading) {
            setHasScrolledToResponse(false); // Reset scroll flag when starting
        } else if (ingLabelText && ingLabelSection.current && !hasScrolledToResponse) {
            //console.log("(CheckIngredients_Service) - Scrolling to response section");
            ingLabelSection.current.scrollIntoView({ behavior: 'smooth' });
            setHasScrolledToResponse(true); // Prevent re-scrolling on chunk updates
        }
    }, [isAILoading, ingLabelText, hasScrolledToResponse]); // Dependencies

    // Add cleanup to abort any ongoing streams if component unmounts
    useEffect(() => {
        return () => {
            if (streamController.current) {
                streamController.current.abort();
            }
        };
    }, []);

    async function checkIngredients() {
        try {
            if (!uploadedImage) {
                //console.log(`ERROR: user did not upload an image`)
                setError('You must upload a file before using this AI service.')
                return
            }

            // --- Get the current user object ---
            const currentUser = auth.currentUser;
            // -----------------------------------

            if (!currentUser) { // Check if user is logged in
                setError('Please log in to use this feature.');
                return;
            }

            setFormDisabled(true);
            setIsAILoading(true);
            setError(null);
            setIngLabelText('');
            setResponseId('');

            // Check if the actual file object exists (important!)
            if (!uploadedFileObject) {
                setError('File object missing, please re-upload.');
                // No need to set loading/disabled here, finally block handles it
                return; // Return early
            }

            // --- Pass the currentUser object to the ai.js function ---
            const { stream, controller } = await getIngLabelAnalysis(
                // Pass the actual file object from the input
                // Assuming handleFileUpload sets the file object in state, or get it directly
                uploadedFileObject, // You'll need state to hold the File object, not just the URL
                currentUser,
                convoStyle
            );
            // --------------------------------------------------------
            streamController.current = controller;

            let accumulatedText = '';
            let metadataReceived = false;

            for await (const part of stream) {
                if (part.type === 'chunk') {
                    setIsAILoading(false);
                    accumulatedText += part.text;
                    setIngLabelText(accumulatedText);
                } else if (part.type === 'metadata' && !metadataReceived) {
                    metadataReceived = true;
                    setResponseId(part.responseId);
                    // Update context with metadata
                    setApiLimits(prev => ({
                        ...prev,
                        limits: {
                            ...prev?.limits, // Add safety check for prev.limits
                            checkIngredients: {
                                ...(prev?.limits?.checkIngredients || {}), // Safety check
                                remaining: part.remainingRequests
                            }
                        },
                        // Ensure lastReset exists in part.resetTime before updating
                        lastReset: part.resetTime || prev?.lastReset,
                    }));
                }
                // Error handling is now primarily within streamResponse
            }
            //console.log("Streaming finished successfully.");

        } catch (error) {
            console.error('(CheckIngredients_Service) Error processing ingredients:', error);
            setError(error.message || 'An error occurred while processing the ingredients');
            setIngLabelText(''); // Clear any partial text on error
        } finally {
            setIsAILoading(false);
            setFormDisabled(false);
            streamController.current = null; // Clear controller ref
            //console.log('(CheckIngredients_Service) Finally block executed');
        }
    }

    // State to hold the actual File object
    const [uploadedFileObject, setUploadedFileObject] = useState(null);

    // Update handleFileUpload to store the File object
    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        if (file) {
            const imageUrl = URL.createObjectURL(file);
            setUploadedImage(imageUrl); // Keep for preview
            setUploadedFileObject(file); // Store the actual File object
            setError(null); // Clear error when new file selected
        } else {
            setUploadedImage(null);
            setUploadedFileObject(null);
        }
    };

    function handleFormSubmit(event) {
        trackClick()
        event.preventDefault()
        // We don't need FormData here anymore if getIngLabelAnalysis handles it
        // const formData = new FormData(event.target)
        if (!uploadedFileObject) {
            setError('Please upload an image file first.');
            return;
        }
        setFormDisabled(true)
        setIsAILoading(true)
        checkIngredients() // Call checkIngredients without FormData
    }

    // Clear result text
    function clearResult() {
        setIngLabelText('')
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
                    <div className='text-3xl'><h1>Check Ingredients</h1></div>
                    <p>Check if the ingredients on a nutrition label are allowed on {therapeuticDiet}.</p>
                    <form onSubmit={handleFormSubmit} className="add-ingredient-form">
                        <fieldset disabled={formDisabled}>

                            {/* --- AIStyleSelector component --- */}
                            <AIStyleSelector
                                value={convoStyle}
                                onChange={handleConvoStyleChange}
                            />

                            {/* --- ApiUsageDisplay component --- */}
                            <ApiUsageDisplay serviceName="checkIngredients" />


                            <div className='flex flex-row gap-4'>
                                <Upload className='w-8 h-8 text-gray-500 mb-2' />
                                <span className='text-lg text-gray-700'>Upload your ingredient label below</span>
                            </div>

                            <label htmlFor="checkIngredientImage" className="flex flex-col items-center justify-center h-48 w-full border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition-colors">
                                <input id='checkIngredientImage' type='file' className='h-full w-full' name='checkIngredientImage' accept='image/*' onChange={handleFileUpload}></input>
                                {!uploadedImage && <span className="text-gray-500">Click or drag file here</span>}
                                {uploadedImage && <img src={uploadedImage} alt="Preview" style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} />}
                            </label>

                            {error && <div className="error-message">{error}</div>}
                            <Button disabled={formDisabled || !uploadedFileObject} type='submit' variant='contained' startIcon={<ListCheck />} size='large'>Check Ingredients</Button>
                            <Button onClick={clearResult} variant='outlined' size='large'>Start New Chat</Button>
                        </fieldset>
                    </form>

                    <div className='text-4xl p-8 bg-blue-200 rounded-md'>
                        <div className='text-4xl'>Try these ingredient labels:</div>
                        <div className='gap-8 p-8 flex flex-col flex-wrap content-center md:flex-row md:justify-center'>
                            <Button variant='outlined' startIcon={<ForkKnife />} className="cta-button bg-blue-800 shadow-sm hover:shadow-md" onClick={() => tryQuestion("waffles")}>Waffles</Button>
                            <Button variant='outlined' startIcon={<ForkKnife />} className="cta-button bg-blue-800 shadow-sm hover:shadow-md" onClick={() => tryQuestion("pizza")}>Pizza</Button>
                            <Button variant='outlined' startIcon={<ForkKnife />} sx={{ lineHeight: 1.2 }} className="cta-button bg-blue-800 shadow-sm hover:shadow-md" onClick={() => tryQuestion("breakfast burrito with eggs and cheese")}>Breakfast Burrito with Eggs and Cheese</Button>
                        </div>
                    </div>

                    {ingLabelText &&
                        <CheckIngredients_AI
                            ref={ingLabelSection}
                            ingLabelText={ingLabelText}
                            responseId={responseId}
                        />
                    }
                </div>
            </main>
        </>
    )
}
