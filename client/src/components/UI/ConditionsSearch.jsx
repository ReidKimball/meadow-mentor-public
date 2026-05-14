import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../env-config.js';
import {
    TextField,
    Button,
    Card,
    CardContent,
    Typography,
    CircularProgress,
    Alert,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Chip,
    Autocomplete
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import RestaurantIcon from '@mui/icons-material/Restaurant';

function ConditionsSearch() {
    const [searchTerm, setSearchTerm] = useState('');
    const [conditions, setConditions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [suggestions, setSuggestions] = useState([]);
    const [loadingSuggestions, setLoadingSuggestions] = useState(false);

    // Fetch suggestions when searchTerm changes
    useEffect(() => {
        const fetchSuggestions = async () => {
            if (searchTerm.length < 2) {
                setSuggestions([]);
                return;
            }

            setLoadingSuggestions(true);
            try {
                const response = await fetch(
                    `${API_BASE_URL}/api/conditions/autocomplete?term=${encodeURIComponent(searchTerm)}`
                );

                if (!response.ok) {
                    throw new Error('Failed to fetch suggestions');
                }

                const data = await response.json();
                setSuggestions(data.suggestions);
            } catch (err) {
                console.error('Error fetching suggestions:', err);
                setSuggestions([]);
            } finally {
                setLoadingSuggestions(false);
            }
        };

        // Use debounce to prevent too many API calls
        const timeoutId = setTimeout(() => {
            fetchSuggestions();
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [searchTerm]);

    const searchConditions = async (term = searchTerm) => {
        if (!term.trim()) return;

        setLoading(true);
        setError(null);

        //console.log(`ConditionsSearch: Searching for condition: "${term}"`);
        //console.log(`ConditionsSearch: Sending request to ${API_BASE_URL}/api/conditions/search?condition=${encodeURIComponent(term)}`);

        try {
            const response = await fetch(`${API_BASE_URL}/api/conditions/search?condition=${encodeURIComponent(term)}`);

            if (!response.ok) {
                throw new Error('Failed to fetch conditions');
            }

            const data = await response.json();
            //console.log(`ConditionsSearch: Received ${data.results.length} results from API`);
            setConditions(data.results);

        } catch (err) {
            console.error('Error fetching conditions:', err);
            setError('Failed to fetch conditions. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            searchConditions();
        }
    };

    const handleAutocompleteChange = (event, newValue) => {
        if (newValue) {
            setSearchTerm(newValue);
            // Automatically search when a suggestion is selected
            searchConditions(newValue);
        }
    };

    return (
        <div className="w-full max-w-3xl mx-auto p-4 md:p-6">
            <Typography
                variant="h4"
                component="h4"
                // className="font-medium tracking-wide text-2xl md:text-4xl pb-4 text-center text-gray-800 font-montserrat leading-tight"
                className='font-[Montserrat] tracking-[0.015em] leading-[1.2] text-4xl font-medium text-center pb-4 md:text-4xl'
                sx={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 500, letterSpacing: '0.015em', lineHeight: 1.2 }}
            >
                Find therapeutic diets for your condition
            </Typography>

            <div className="flex flex-col sm:flex-row gap-2 mb-6">
                <Autocomplete
                    freeSolo
                    options={suggestions}
                    loading={loadingSuggestions}
                    onInputChange={(event, newInputValue) => {
                        setSearchTerm(newInputValue);
                    }}
                    onChange={handleAutocompleteChange}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            fullWidth
                            variant="outlined"
                            placeholder="Enter your health condition..."
                            value={searchTerm}
                            onKeyDown={handleKeyPress}
                            size="medium"
                            className="flex-grow font-sourcesanspro"
                            sx={{
                                fontFamily: 'Source Sans Pro, sans-serif',
                                '& .MuiInputBase-input': {
                                    fontFamily: 'Source Sans Pro, sans-serif',
                                    fontSize: '1rem',
                                    letterSpacing: '-0.01em',
                                    lineHeight: 1.6
                                }
                            }}
                        />
                    )}
                    className="flex-grow"
                />
                <Button
                    variant="contained"
                    color="primary"
                    onClick={() => searchConditions()}
                    startIcon={<SearchIcon />}
                    className="whitespace-nowrap py-3 px-6 font-sourcesanspro font-semibold"
                    sx={{
                        fontFamily: 'Source Sans Pro, sans-serif',
                        fontWeight: 600,
                        letterSpacing: '-0.005em'
                    }}
                >
                    Search
                </Button>
            </div>

            {loading && (
                <div className="flex justify-center my-8">
                    <CircularProgress />
                </div>
            )}

            {error && (
                <Alert severity="error" className="mb-4 font-sourcesanspro">
                    {error}
                </Alert>
            )}

            {conditions.length > 0 ? (
                <div className="space-y-4">
                    {conditions.map((condition, index) => (
                        <Card key={index} className="w-full overflow-hidden shadow-md hover:shadow-lg transition-shadow">
                            <CardContent className="p-4">
                                <Typography
                                    variant="h5"
                                    component="h5"
                                    className="font-medium mb-2 text-xl md:text-2xl"
                                    sx={{
                                        fontFamily: 'Montserrat, sans-serif',
                                        fontWeight: 500,
                                        letterSpacing: '0.01em',
                                        lineHeight: 1.3
                                    }}
                                >
                                    {condition.condition_name}
                                </Typography>

                                <Typography
                                    variant="body1"
                                    color="textSecondary"
                                    className="mb-3"
                                    sx={{
                                        fontFamily: 'Source Sans Pro, sans-serif',
                                        fontWeight: 400,
                                        letterSpacing: '-0.01em',
                                        lineHeight: 1.6,
                                        fontSize: '1rem'
                                    }}
                                >
                                    {condition.description}
                                </Typography>

                                <div>
                                    <div className="flex items-center mb-2 pt-4">
                                        <RestaurantIcon className="mr-2 text-gray-600" fontSize="small" />
                                        <Typography
                                            variant="subtitle1"
                                            className="font-semibold"
                                            sx={{
                                                fontFamily: 'Source Sans Pro, sans-serif',
                                                fontWeight: 600,
                                                letterSpacing: '-0.005em'
                                            }}
                                        >
                                            Recommended diets:
                                        </Typography>
                                    </div>

                                    <List dense className="pl-2">
                                        {condition.diets_recommended.map((diet, idx) => (
                                            <ListItem key={idx} className="py-0" sx={{ paddingLeft: '28px' }}>
                                                <ListItemIcon sx={{ minWidth: '16px', marginRight: '4px' }} className="min-w-0 mr-1">
                                                    <FiberManualRecordIcon fontSize="small" className="text-gray-600" style={{ fontSize: '8px' }} />
                                                </ListItemIcon>
                                                <ListItemText
                                                    primary={diet}
                                                    sx={{
                                                        '& .MuiTypography-root': {
                                                            fontFamily: 'Source Sans Pro, sans-serif',
                                                            fontWeight: 400,
                                                            letterSpacing: '-0.01em',
                                                            lineHeight: 1.6
                                                        }
                                                    }}
                                                />
                                            </ListItem>
                                        ))}
                                    </List>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : !loading && searchTerm.trim() && (
                <Alert
                    severity="info"
                    sx={{
                        '& .MuiAlert-message': {
                            fontFamily: 'Source Sans Pro, sans-serif',
                            fontWeight: 400,
                            letterSpacing: '-0.01em',
                            lineHeight: 1.6
                        }
                    }}
                >
                    No conditions found matching your search.
                </Alert>
            )}
        </div>
    );
}

export default ConditionsSearch;
