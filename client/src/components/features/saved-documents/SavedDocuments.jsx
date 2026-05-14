import { app } from '../../../config/firestore.js'
import React, { useState, useEffect } from 'react';
//import { useAuth } from '../../context/AuthContext.jsx';
import { getAuth, onAuthStateChanged } from 'firebase/auth' // Removed unused onAuthStateChanged
import { API_BASE_URL } from '../../../env-config.js';
import { format } from 'date-fns';
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Button, CircularProgress, Box, Typography } from '@mui/material' // Added CircularProgress, Box, Typography

// Define filter options - makes rendering and tracking easier
const filterOptions = [
    { value: 'all', label: 'All' },
    { value: 'recipeGeneration', label: 'Recipes' },
    { value: 'mealConvert', label: 'Adapted Meals' },
    { value: 'askKay', label: 'Ask Kay' },
    { value: 'mealPlanner', label: '7-Day Meal Plan' },
    { value: 'checkIngredients', label: 'Ingredient Checks' },
    { value: 'analyzeMeal', label: 'Meal Analysis' },
    { value: 'analyzeDoctorReport', label: 'Report Analysis' }
];

// Tracking function factory - similar to HealthTools.jsx
const createFilterTrackFunction = (filterType) => {

    return () => {
        if (typeof window !== 'undefined' && window.umami) {
            window.umami.track('saved_documents_filter_click', {
                source: 'saved_documents_page',
                location: 'saved_documents_filter_buttons',
                filter_type: `${filterType}_saved_docs_filter_button` // Track which filter was clicked
            });
            //console.log(`(SavedDocuments.jsx) - Umami track: Filter button clicked: ${filterType}_saved_docs_filter_button`);
        }
    };
};


export default function SavedDocuments() {
    const auth = getAuth(app)
    const [responses, setResponses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    //console.log('(SavedDocuments.jsx) - user is: ', auth.currentUser?.uid || 'not logged in') // Safer logging
    const [error, setError] = useState(null);

    useEffect(() => {
        async function fetchSavedResponses() {
            if (!auth.currentUser) {
                //console.log('(SavedDocuments.jsx) - No user logged in, skipping fetch.');
                setLoading(false); // Stop loading if no user
                setError('Please log in to view saved documents.'); // Optional: Inform user
                return;
            }

            // Reset error state on new fetch attempt
            setError(null);
            setLoading(true);

            try {
                const token = await auth.currentUser.getIdToken(); // Get fresh token
                const response = await fetch(`${API_BASE_URL}/api/saved-responses/${auth.currentUser.uid}`, {
                    headers: {
                        // Use the idToken for authorization
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (!response.ok) {
                    // Provide more specific error info if possible
                    const errorData = await response.text(); // Or response.json() if API sends JSON errors
                    console.error(`Failed to fetch saved responses: ${response.status} ${response.statusText}`, errorData);
                    throw new Error(`Failed to fetch saved responses (Status: ${response.status})`);
                }

                const data = await response.json();
                // Sort responses by date, newest first
                data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                setResponses(data);
            } catch (err) {
                console.error('Error fetching saved responses:', err);
                setError(`Failed to load your saved responses. ${err.message}. Please try again later.`);
            } finally {
                setLoading(false);
            }
        }

        // Use onAuthStateChanged to react to login/logout and fetch data accordingly
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                //console.log('(SavedDocuments.jsx) - Auth state changed, user logged in. Fetching data.');
                fetchSavedResponses();
            } else {
                //console.log('(SavedDocuments.jsx) - Auth state changed, user logged out.');
                setResponses([]); // Clear responses on logout
                setLoading(false);
                setError('Please log in to view saved documents.'); // Set error on logout
            }
        });

        // Cleanup subscription on component unmount
        return () => unsubscribe();

    }, [auth]); // Depend only on auth object itself

    // Filter responses based on selected type
    const filteredResponses = filter === 'all'
        ? responses
        : responses.filter(response => response.serviceType === filter);

    // Helper function to format the date
    const formatDate = (dateString) => {
        try {
            return format(new Date(dateString), 'MMM d, yyyy • h:mm a');
        } catch (e) {
            console.warn(`(SavedDocuments.jsx) - Could not format date: ${dateString}`, e);
            return 'Invalid Date'; // Return a placeholder
        }
    };

    // Helper to get a friendly name for service type
    const getServiceTypeName = (type) => {
        const names = {
            'recipeGeneration': 'Recipe',
            'mealConvert': 'Adapted Meal',
            'askKay': 'Ask Kay',
            'mealPlanner': '7-Day Meal Plan',
            'checkIngredients': 'Ingredient Check',
            'analyzeMeal': 'Meal Analysis',
            'analyzeDoctorReport': 'Medical Report Analysis' // Make sure key matches backend
        };
        return names[type] || type; // Fallback to the raw type
    };

    // Helper to get appropriate icon for service type
    const getServiceIcon = (type) => {
        const icons = {
            'recipeGeneration': '🍲',
            'mealConvert': '🥗',
            'askKay': '💬',
            'mealPlanner': '📆',
            'checkIngredients': '🔍',
            'analyzeMeal': '📊',
            'analyzeDoctorReport': '🏥' // Make sure key matches backend
        };
        return icons[type] || '📄'; // Fallback icon
    };

    const handleFilterClick = (value) => {
        setFilter(value);
        createFilterTrackFunction(value)(); // Trigger Umami tracking
    };


    return (
        <Box sx={{ maxWidth: '1200px', mx: 'auto', px: { xs: 2, sm: 3 }, py: 4 }}> {/* Use Box for layout + responsive padding */}
            <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', mb: 4, textAlign: 'center' }}>
                Your Saved Responses
            </Typography>

            {/* Filter options - Use MUI Buttons and map over options */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 4, justifyContent: 'center' }}>
                {filterOptions.map(option => {
                    // Only render filter buttons for types that actually exist in the fetched responses, plus 'All'
                    const typeExists = responses.some(resp => resp.serviceType === option.value);
                    if (option.value !== 'all' && !typeExists) {
                        return null; // Don't show button if no documents of this type exist
                    }
                    return (
                        <Button
                            key={option.value}
                            onClick={() => handleFilterClick(option.value)}
                            variant={filter === option.value ? 'contained' : 'outlined'}
                            color={filter === option.value ? 'primary' : 'inherit'}
                            sx={{ borderRadius: '9999px', px: 2 }} // Style using sx prop for consistency
                        >
                            {option.label}
                        </Button>
                    );
                })}
            </Box>

            {error && !loading && ( // Show error only if not loading
                <Box sx={{ bgcolor: 'error.light', color: 'error.contrastText', p: 2, borderRadius: 1, mb: 4, textAlign: 'center' }}>
                    {error}
                </Box>
            )}

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
                    <CircularProgress />
                </Box>
            ) : !auth.currentUser ? ( // Specific message if not logged in (redundant with error but clear)
                <Box sx={{ textAlign: 'center', color: 'text.secondary', py: 12 }}>
                    <Typography variant="h6" gutterBottom>Please Log In</Typography>
                    <Typography>Log in to see your saved responses.</Typography>
                </Box>
            ) : filteredResponses.length === 0 ? (
                <Box sx={{ textAlign: 'center', color: 'text.secondary', py: 12 }}>
                    <Typography variant="h6" gutterBottom>
                        {filter === 'all' ? 'No saved responses yet!' : `No saved ${getServiceTypeName(filter).toLowerCase()} found`}
                    </Typography>
                    <Typography>
                        {filter === 'all'
                            ? 'Responses you save from Kay will appear here.'
                            : `Saved ${getServiceTypeName(filter).toLowerCase()} will appear here.`}
                    </Typography>
                </Box>
            ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, maxWidth: '800px', mx: 'auto' }}>
                    {filteredResponses.map(item => (
                        <Box key={item._id} sx={{ bgcolor: 'background.paper', borderRadius: 2, boxShadow: 2, overflow: 'hidden', border: 1, borderColor: 'divider' }}>
                            {/* Header */}
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, bgcolor: 'grey.100', borderBottom: 1, borderColor: 'divider' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Typography component="span" sx={{ fontSize: '1.5rem' }}>{getServiceIcon(item.serviceType)}</Typography>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>{getServiceTypeName(item.serviceType)}</Typography>
                                </Box>
                                <Typography variant="caption" sx={{ color: 'text.secondary' }}>{formatDate(item.createdAt)}</Typography>
                            </Box>

                            {/* User prompt */}
                            {item.prompt && ( // Only show prompt section if it exists
                                <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', bgcolor: '#e3f2fd' /* Light blue background */ }}>
                                    <Typography variant="overline" sx={{ color: 'text.secondary', display: 'block', mb: 0.5 }}>Your Input</Typography>
                                    {typeof item.prompt === 'string' ? (
                                        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{item.prompt}</Typography>
                                    ) : item.prompt && item.prompt.inlineData ? (
                                        <Box>
                                            <Typography variant="body2" sx={{ fontStyle: 'italic', mb: 1 }}>Image uploaded:</Typography>
                                            <img
                                                src={`data:${item.prompt.inlineData.mimeType};base64,${item.prompt.inlineData.data}`}
                                                alt="Uploaded content"
                                                style={{ marginTop: '8px', maxHeight: '200px', maxWidth: '100%', borderRadius: '4px', border: '1px solid #ccc' }}
                                            />
                                        </Box>
                                    ) : (
                                        <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'text.disabled' }}>[No text prompt provided]</Typography>
                                    )}
                                </Box>
                            )}

                            {/* AI response */}
                            <Box sx={{ p: { xs: 2, sm: 3 } }}>
                                <Typography variant="overline" sx={{ color: 'text.secondary', display: 'block', mb: 0.5 }}>Kay's Response</Typography>
                                <Box component="article" className="prose" sx={{
                                    '& p': { mb: 1.5 }, // Add spacing between paragraphs in Markdown
                                    '& ul, & ol': { pl: 2.5, mb: 1.5 }, // Indent lists and add bottom margin
                                    '& li': { mb: 0.5 }, // Spacing between list items
                                    '& h1, & h2, & h3, & h4, & h5, & h6': { mb: 1.5, mt: 2.5 }, // Spacing for headings
                                    maxWidth: 'none', // Override prose max-width if needed inside the container
                                    fontSize: '0.95rem', // Adjust base font size if needed
                                    lineHeight: 1.6 // Adjust line height
                                }}>
                                    <ReactMarkdown children={item.response || ''} remarkPlugins={[remarkGfm]} />
                                </Box>
                            </Box>
                        </Box>
                    ))}
                </Box>
            )}
        </Box>
    );
}
