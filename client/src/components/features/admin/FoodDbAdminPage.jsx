import React, { useState, useEffect, useRef } from 'react';
import {
    Container,
    Typography,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Box,
    CircularProgress,
    InputAdornment,
    TextField,
    Alert,
    Paper,
    ToggleButtonGroup,
    ToggleButton,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    Switch,
    FormControlLabel,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TableSortLabel,
    Chip,
    IconButton,
    Tooltip
} from '@mui/material';
import {
    CheckCircle as CheckCircleIcon,
    Cancel as CancelIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    AddCircleOutline as AddCircleOutlineIcon,
    Search as SearchIcon,
    Close as CloseIcon
} from '@mui/icons-material';
// import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import { useUser } from '../../../context/UserContext.jsx'; // Corrected import path
import Swal from 'sweetalert2';
import { API_BASE_URL } from '../../../env-config.js';

const FoodDbAdminPage = () => {
    const [diets, setDiets] = useState([]);
    const [selectedDiet, setSelectedDiet] = useState('');
    const [foods, setFoods] = useState([]);
    const [sortedFoods, setSortedFoods] = useState([]);
    const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'allowed', 'notAllowed'
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
    const [loadingDiets, setLoadingDiets] = useState(false);
    const [loadingFoods, setLoadingFoods] = useState(false);
    const [error, setError] = useState('');

    // State for Add Food Dialog
    const [addFoodDialogOpen, setAddFoodDialogOpen] = useState(false);
    const [editFoodDialogOpen, setEditFoodDialogOpen] = useState(false);
    const [editingFood, setEditingFood] = useState(null);
    const [newFood, setNewFood] = useState({
        food_name: '',
        normalized_food_name: '',
        allowed: true,
        note: '',
        source_file: '',
        diet_code_override: null // Used when adding from 'ALL' view to a specific diet
    });
    const [addingFood, setAddingFood] = useState(false);
    const [editing, setEditing] = useState(false);
    const [addFoodDialogTitle, setAddFoodDialogTitle] = useState('Add New Food Item'); // State for dynamic dialog title
    const [editFoodDialogTitle, setEditFoodDialogTitle] = useState('Edit Food Item'); // State for dynamic edit dialog title

    const { getFreshIdToken } = useUser(); // Using the hook correctly

    const foodsFetchAbortRef = useRef(null);
    const foodsFetchRequestIdRef = useRef(0);

    const fetchFoodsForDiet = async (dietCode, currentSearchQuery = '') => {
        const requestId = ++foodsFetchRequestIdRef.current;

        if (foodsFetchAbortRef.current) {
            foodsFetchAbortRef.current.abort();
        }
        const abortController = new AbortController();
        foodsFetchAbortRef.current = abortController;

        setLoadingFoods(true);
        setError('');
        try {
            const token = await getFreshIdToken();
            if (!token) {
                setError('Authentication token not available. Please log in again.');
                if (requestId === foodsFetchRequestIdRef.current) {
                    setLoadingFoods(false);
                }
                return;
            }

            let url = `${API_BASE_URL}/api/therapeutic-diet-foods`;
            const params = new URLSearchParams();

            // Always include the food_name in the search if provided
            if (currentSearchQuery) {
                params.append('food_name', currentSearchQuery);
            }
            
            // Only include diet_code if a specific diet is selected (not 'ALL')
            if (dietCode && dietCode !== 'ALL') {
                params.append('diet_code', dietCode);
            }

            // If we have parameters, append them to the URL
            if (params.toString()) {
                url += `?${params.toString()}`;
            } else {
                // If no parameters, we want to fetch all foods
                url += '?include_all=true';
            }

            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                signal: abortController.signal,
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: `Failed to fetch foods`}));
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            if (requestId === foodsFetchRequestIdRef.current) {
                setFoods(data.data || []);
            }
        } catch (err) {
            if (err?.name === 'AbortError') {
                return;
            }
            console.error(`Error fetching foods:`, err);
            if (requestId === foodsFetchRequestIdRef.current) {
                setError(err.message || `Could not fetch foods.`);
                setFoods([]);
            }
        }
        if (requestId === foodsFetchRequestIdRef.current) {
            setLoadingFoods(false);
        }
    };

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            setDebouncedSearchQuery(searchQuery.trim());
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [searchQuery]);

    // Fetch diets on component mount
    useEffect(() => {
        const fetchDietsData = async () => {
            setLoadingDiets(true);
            setError('');
            try {
                // Assuming /api/diets does not require authentication
                const response = await fetch(`${API_BASE_URL}/api/therapeutic-diets`);
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({ message: 'Failed to fetch diets' }));
                    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                console.log("Fetched diets data:", data);
                setDiets(data || []);
            } catch (err) {
                console.error("Error fetching diets:", err);
                setError(err.message || 'Could not fetch diets.');
            }
            setLoadingDiets(false);
        };
        fetchDietsData();
    }, []);

    useEffect(() => {
        if (!selectedDiet) {
            setFoods([]);
            setSortedFoods([]);
        }
    }, [selectedDiet]);

    useEffect(() => {
        if (!selectedDiet || selectedDiet === 'ALL') return;

        console.log('[DEBUG] Fetching foods for diet:', selectedDiet);
        fetchFoodsForDiet(selectedDiet, '');
    }, [selectedDiet, getFreshIdToken]);

    useEffect(() => {
        if (!selectedDiet || selectedDiet !== 'ALL') return;

        if (debouncedSearchQuery && debouncedSearchQuery.length < 3) {
            if (foodsFetchAbortRef.current) {
                foodsFetchAbortRef.current.abort();
            }
            setFoods([]);
            setSortedFoods([]);
            setLoadingFoods(false);
            return;
        }

        console.log('[DEBUG] Fetching ALL foods with query:', debouncedSearchQuery);
        fetchFoodsForDiet('ALL', debouncedSearchQuery);
    }, [selectedDiet, debouncedSearchQuery, getFreshIdToken]);

    // Sort foods alphabetically by name whenever 'foods' state changes
    useEffect(() => {
        if (foods && foods.length > 0) {
            const sorted = [...foods].sort((a, b) => a.food_name.localeCompare(b.food_name));
            setSortedFoods(sorted);
        } else {
            setSortedFoods([]);
        }
    }, [foods]);

    const handleDietChange = (event) => {
        const selectedValue = event.target.value;
        console.log('[DEBUG] Diet selected:', selectedValue);
        setSelectedDiet(selectedValue);
        setFilterStatus('all');
    };

    const handleFilterChange = (event, newFilterStatus) => {
        if (newFilterStatus !== null) {
            setFilterStatus(newFilterStatus);
        }
    };

    const handleOpenAddFoodDialog = (foodNameToPreFill = null, dietCodeToPreFill = null) => {
        let dialogTitle = 'Add New Food Item';
        if (foodNameToPreFill && dietCodeToPreFill) {
            const dietObj = diets.find(d => d.diet_code === dietCodeToPreFill);
            const dietDisplayName = dietObj ? dietObj.diet_name : dietCodeToPreFill;
            dialogTitle = `Add '${foodNameToPreFill}' to ${dietDisplayName} Diet`;
        }
        setAddFoodDialogTitle(dialogTitle);

        setNewFood({
            food_name: foodNameToPreFill || '',
            normalized_food_name: foodNameToPreFill ? foodNameToPreFill.toLowerCase() : '', // Basic normalization
            allowed: true,
            note: '',
            source_file: '',
            diet_code_override: dietCodeToPreFill || null
        });
        setAddFoodDialogOpen(true);
    };

    const handleCloseAddFoodDialog = () => {
        if (addingFood) return;
        setAddFoodDialogOpen(false);
        setAddFoodDialogTitle('Add New Food Item'); // Reset title
        setNewFood(prev => ({ ...prev, diet_code_override: null })); // Clear override
    };

    const handleOpenEditFoodDialog = (food) => {
        setEditingFood(food);
        const dietObj = diets.find(d => d.diet_code === food.diet_code);
        const dietDisplayName = dietObj ? dietObj.diet_name : food.diet_code;
        setEditFoodDialogTitle(`Edit '${food.food_name}' (${dietDisplayName} Diet)`);
        setEditFoodDialogOpen(true);
    };

    const handleCloseEditFoodDialog = () => {
        if (editing) return;
        setEditFoodDialogOpen(false);
        setEditFoodDialogTitle('Edit Food Item'); // Reset title
    };

    const handleSubmitNewFood = async () => {
        const targetDietCode = newFood.diet_code_override || selectedDiet;

        if (!newFood.food_name.trim()) {
            Swal.fire('Validation Error', 'Food name cannot be empty.', 'error');
            return;
        }
        if (!targetDietCode) {
            Swal.fire('Error', 'No diet selected or specified.', 'error');
            return;
        }

        setAddingFood(true);
        // setError(''); // Clear main page error, rely on Swal for dialog errors

        try {
            const token = await getFreshIdToken();
            if (!token) {
                Swal.fire('Authentication Error', 'Session expired. Please log in again.', 'error');
                setAddingFood(false);
                return;
            }

            const response = await fetch(`${API_BASE_URL}/api/therapeutic-diet-foods`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    food_name: newFood.food_name.trim(),
                    diet_code: targetDietCode,
                    allowed: newFood.allowed,
                    note: newFood.note,
                    source_file: newFood.source_file
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'Failed to add food. Please try again.' }));
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }

            Swal.fire('Success!', `${newFood.food_name} added successfully to ${targetDietCode}.`, 'success');
            setAddFoodDialogOpen(false);
            fetchFoodsForDiet(selectedDiet, searchQuery.trim()); // Refresh based on current view
            setNewFood(prev => ({ ...prev, diet_code_override: null })); // Clear override

        } catch (err) {
            console.error("Error adding food:", err);
            Swal.fire('Error Adding Food', err.message || 'An unexpected error occurred.', 'error');
        } finally {
            setAddingFood(false);
            // Ensure override is cleared even on error if dialog remains open for some reason
            // However, dialog closes on success/failure typically. This is more of a safeguard.
            if (addFoodDialogOpen) { // Only if dialog is still open, which it shouldn't be after submit
                 // setNewFood(prev => ({ ...prev, diet_code_override: null }));
            } else {
                 setNewFood(prev => ({ // If dialog closed, ensure reset for next opening
                    food_name: '', normalized_food_name: '', allowed: true, note: '', source_file: '', diet_code_override: null
                }));
            }
        }
    };

    const handleSubmitEditedFood = async () => {
        if (!editingFood || !editingFood._id) {
            Swal.fire('Error', 'No food item selected for editing.', 'error');
            return;
        }
        if (!editingFood.food_name.trim()) {
            Swal.fire('Validation Error', 'Food name cannot be empty.', 'error');
            return;
        }
        // Ensure the original diet_code of the item being edited is used,
        // not the selectedDiet state, which could be 'ALL'.
        if (!editingFood.diet_code) {
            Swal.fire('Error', 'Diet code is missing for the food item being edited.', 'error');
            return;
        }

        setEditing(true);
        setError('');
        try {
            const token = await getFreshIdToken();
            if (!token) {
                setError('Authentication token not available. Please log in again.');
                setEditing(false);
                Swal.fire('Authentication Error', 'Please log in again.', 'error');
                return;
            }

            const payload = {
                food_name: editingFood.food_name.trim(),
                diet_code: editingFood.diet_code, // Use the actual diet_code of the item
                allowed: editingFood.allowed,
                note: editingFood.note,
                source_file: editingFood.source_file,
                // Do not send normalized_food_name, backend should handle it if necessary
            };

            const response = await fetch(`${API_BASE_URL}/api/therapeutic-diet-foods/${editingFood._id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'Failed to edit food. Please try again.' }));
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }

            Swal.fire('Success!', `${editingFood.food_name} updated successfully.`, 'success');
            setEditFoodDialogOpen(false);
            // Refresh foods based on the current view (selectedDiet and searchQuery)
            fetchFoodsForDiet(selectedDiet, searchQuery.trim()); 
        } catch (err) {
            console.error("Error editing food:", err);
            // Display a more specific error if available from the backend response
            const errorMessage = err.response && err.response.data && err.response.data.message 
                               ? err.response.data.message 
                               : err.message || 'An unexpected error occurred.';
            Swal.fire('Error Editing Food', `Error: ${errorMessage}`, 'error');
        } finally {
            setEditing(false);
        }
    };

    const filteredAndSortedFoods = sortedFoods.filter(food => {
        if (!food) return false;
        
        // Apply search filter if there's a search query
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            return food.food_name.toLowerCase().includes(query) || 
                   food.normalized_food_name.includes(query);
        }
        
        // Otherwise, apply status filter
        if (filterStatus === 'all') return true;
        return filterStatus === 'allowed' ? food.allowed : !food.allowed;
    });

    const getDisplayedFoodsCount = () => {
        if (loadingFoods) return 0;
        
        // If there's a search query, count matching foods
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            const matchingFoods = sortedFoods.filter(food => 
                food && 
                (food.food_name.toLowerCase().includes(query) || 
                 food.normalized_food_name.includes(query))
            );
            
            // If a specific diet is selected, only count foods in that diet
            if (selectedDiet && selectedDiet !== 'ALL') {
                return matchingFoods.filter(food => food.diet_code === selectedDiet).length;
            }
            return matchingFoods.length;
        }
        
        // If no search query, count all foods in the selected diet (or all foods if ALL is selected)
        if (selectedDiet && selectedDiet !== 'ALL') {
            return sortedFoods.filter(food => food.diet_code === selectedDiet).length;
        }
        
        return sortedFoods.length;
    };

    const displayedFoodsCount = getDisplayedFoodsCount();

    // Format date for display
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Get status chip color
    const getStatusChip = (isAllowed) => (
        <Chip
            icon={isAllowed ? <CheckCircleIcon /> : <CancelIcon />}
            label={isAllowed ? 'Allowed' : 'Not Allowed'}
            color={isAllowed ? 'success' : 'error'}
            variant="outlined"
            size="small"
        />
    );

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Paper sx={{ p: 3 }}>
                <Typography variant="h4" component="h1" gutterBottom>
                    Food Database Administration
                </Typography>

                {error && !addFoodDialogOpen && !editFoodDialogOpen && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                <Box sx={{ mb: 3 }}>
                    <FormControl fullWidth disabled={loadingDiets || addingFood || editing}>
                        <InputLabel id="diet-select-label">Select Therapeutic Diet</InputLabel>
                        <Select
                            labelId="diet-select-label"
                            id="diet-select"
                            value={selectedDiet}
                            label="Select Therapeutic Diet"
                            onChange={handleDietChange}
                        >
                            <MenuItem value="">
                                <em>None</em>
                            </MenuItem>
                            <MenuItem value="ALL">
                                <em>All Diets</em>
                            </MenuItem>
                            {/* Ensure diet.diet_code is unique */}
                            {diets.map((diet) => (
                                <MenuItem key={diet.diet_code} value={diet.diet_code}>
                                    {diet.diet_name}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    {loadingDiets && <CircularProgress size={24} sx={{ ml: 2, verticalAlign: 'middle' }} />}
                </Box>

                {selectedDiet && (
                    <Box>
                        <Box sx={{ mb: 3 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
                                <Typography variant="h5" component="h2">
                                    Foods for {selectedDiet === 'ALL' ? 'All Diets' : diets.find(d => d.diet_code === selectedDiet)?.diet_name || selectedDiet}
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                                    <TextField
                                        size="small"
                                        placeholder="Search foods..."
                                        variant="outlined"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        sx={{ minWidth: 250 }}
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <SearchIcon />
                                                </InputAdornment>
                                            ),
                                        }}
                                    />
                                    <ToggleButtonGroup
                                        color="primary"
                                        value={filterStatus}
                                        exclusive
                                        onChange={handleFilterChange}
                                        aria-label="Filter by allowed status"
                                        disabled={!!searchQuery.trim() || addingFood || editing || loadingFoods || selectedDiet === 'ALL'}
                                    >
                                        <ToggleButton value="all">All</ToggleButton>
                                        <ToggleButton value="allowed">Allowed</ToggleButton>
                                        <ToggleButton value="notAllowed">Not Allowed</ToggleButton>
                                    </ToggleButtonGroup>
                                    <Button 
                                        variant="contained" 
                                        startIcon={<AddCircleOutlineIcon />} 
                                        onClick={() => handleOpenAddFoodDialog()}
                                        disabled={addingFood || editing || loadingFoods || loadingDiets || selectedDiet === 'ALL'}
                                    >
                                        Add New Food
                                    </Button>
                                </Box>
                            </Box>
                            {searchQuery.trim() && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                    <Chip 
                                        label={`Search: "${searchQuery}"`} 
                                        onDelete={() => setSearchQuery('')}
                                        deleteIcon={<CloseIcon />}
                                        variant="outlined"
                                    />
                                    <Typography variant="body2" color="text.secondary">
                                        {displayedFoodsCount} result{displayedFoodsCount !== 1 ? 's' : ''}
                                    </Typography>
                                </Box>
                            )}
                        </Box>

                        {loadingFoods ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
                                <CircularProgress />
                            </Box>
                        ) : filteredAndSortedFoods.length > 0 ? (
                            <TableContainer component={Paper} elevation={2}>
                                <Table sx={{ minWidth: 650 }} aria-label="food database">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Food Name</TableCell>
                                            <TableCell>Diet</TableCell>
                                            <TableCell align="center">Status</TableCell>
                                            {/* <TableCell>Category</TableCell> */}
                                            <TableCell>Notes</TableCell>
                                            <TableCell>Source</TableCell>
                                            <TableCell>Last Updated</TableCell>
                                            <TableCell align="right">Actions</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {selectedDiet === 'ALL' && searchQuery.trim() ? (
                                            // When in ALL diets view with a search query, show options to add to each diet
                                            diets.map(diet => {
                                                // Check if this food exists in this diet
                                                const foodInThisDiet = sortedFoods.find(
                                                    f => f.diet_code === diet.diet_code && 
                                                    f.normalized_food_name.includes(searchQuery.trim().toLowerCase())
                                                );

                                                if (foodInThisDiet) {
                                                    // Show existing food entry
                                                    return (
                                                        <TableRow
                                                            key={`${foodInThisDiet._id}-${diet.diet_code}`}
                                                            hover
                                                            sx={{ '&:nth-of-type(odd)': { backgroundColor: 'action.hover' } }}
                                                        >
                                                            <TableCell component="th" scope="row">
                                                                <Box fontWeight="medium">{foodInThisDiet.food_name}</Box>
                                                                <Box fontSize="0.8rem" color="text.secondary">
                                                                    {foodInThisDiet.normalized_food_name}
                                                                </Box>
                                                            </TableCell>
                                                            <TableCell>{diet.diet_name || diet.diet_code}</TableCell>
                                                            <TableCell align="center">{getStatusChip(foodInThisDiet.allowed)}</TableCell>
                                                            <TableCell>{foodInThisDiet.note || '-'}</TableCell>
                                                            <TableCell>{foodInThisDiet.source_file || '-'}</TableCell>
                                                            <TableCell>{formatDate(foodInThisDiet.updatedAt || foodInThisDiet.createdAt)}</TableCell>
                                                            <TableCell align="right">
                                                                <Tooltip title="Edit">
                                                                    <IconButton size="small" color="primary" onClick={() => handleOpenEditFoodDialog(foodInThisDiet)}>
                                                                        <EditIcon fontSize="small" />
                                                                    </IconButton>
                                                                </Tooltip>
                                                            </TableCell>
                                                        </TableRow>
                                                    );
                                                } else {
                                                    // Show "Add to Diet" option
                                                    return (
                                                        <TableRow
                                                            key={`add-${searchQuery}-to-${diet.diet_code}`}
                                                            hover
                                                            sx={{ '&:nth-of-type(odd)': { backgroundColor: 'action.hover' } }}
                                                        >
                                                            <TableCell component="th" scope="row">
                                                                <Box fontWeight="medium">{searchQuery}</Box>
                                                            </TableCell>
                                                            <TableCell>{diet.diet_name || diet.diet_code}</TableCell>
                                                            <TableCell align="center">
                                                                <Chip label="Not Added" size="small" color="default" />
                                                            </TableCell>
                                                            <TableCell>-</TableCell>
                                                            <TableCell>-</TableCell>
                                                            <TableCell>-</TableCell>
                                                            <TableCell align="right">
                                                                <Button
                                                                    variant="outlined"
                                                                    size="small"
                                                                    startIcon={<AddCircleOutlineIcon />}
                                                                    onClick={() => handleOpenAddFoodDialog(searchQuery, diet.diet_code)}
                                                                >
                                                                    Add to {diet.diet_name || diet.diet_code}
                                                                </Button>
                                                            </TableCell>
                                                        </TableRow>
                                                    );
                                                }
                                            })
                                        ) : selectedDiet === 'ALL' ? (
                                            // Regular ALL diets view without search
                                            sortedFoods.map(food => (
                                                <TableRow
                                                    key={`${food._id}-${food.diet_code}`}
                                                    hover
                                                    sx={{ '&:nth-of-type(odd)': { backgroundColor: 'action.hover' } }}
                                                >
                                                    <TableCell component="th" scope="row">
                                                        <Box fontWeight="medium">{food.food_name}</Box>
                                                        <Box fontSize="0.8rem" color="text.secondary">
                                                            {food.normalized_food_name}
                                                        </Box>
                                                    </TableCell>
                                                    <TableCell>{food.diet_code}</TableCell>
                                                    <TableCell align="center">{getStatusChip(food.allowed)}</TableCell>
                                                    <TableCell>{food.note || '-'}</TableCell>
                                                    <TableCell>{food.source_file || '-'}</TableCell>
                                                    <TableCell>{formatDate(food.updatedAt || food.createdAt)}</TableCell>
                                                    <TableCell align="right">
                                                        <Tooltip title="Edit">
                                                            <IconButton size="small" color="primary" onClick={() => handleOpenEditFoodDialog(food)}>
                                                                <EditIcon fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : searchQuery.trim() ? (
                                            // Search within a specific diet
                                            filteredAndSortedFoods.map(food => (
                                                <TableRow
                                                    key={food._id}
                                                    hover
                                                    sx={{ '&:nth-of-type(odd)': { backgroundColor: 'action.hover' } }}
                                                >
                                                    <TableCell component="th" scope="row">
                                                        <Box fontWeight="medium">{food.food_name}</Box>
                                                        <Box fontSize="0.8rem" color="text.secondary">
                                                            {food.normalized_food_name}
                                                        </Box>
                                                    </TableCell>
                                                    <TableCell>{selectedDiet}</TableCell>
                                                    <TableCell align="center">{getStatusChip(food.allowed)}</TableCell>
                                                    <TableCell>{food.note || '-'}</TableCell>
                                                    <TableCell>{food.source_file || '-'}</TableCell>
                                                    <TableCell>{formatDate(food.updatedAt || food.createdAt)}</TableCell>
                                                    <TableCell align="right">
                                                        <Tooltip title="Edit">
                                                            <IconButton size="small" color="primary" onClick={() => handleOpenEditFoodDialog(food)}>
                                                                <EditIcon fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            // Regular view for a specific diet
                                            sortedFoods.map(food => (
                                                <TableRow
                                                    key={food._id}
                                                    hover
                                                    sx={{ '&:nth-of-type(odd)': { backgroundColor: 'action.hover' } }}
                                                >
                                                    <TableCell component="th" scope="row">
                                                        <Box fontWeight="medium">{food.food_name}</Box>
                                                        <Box fontSize="0.8rem" color="text.secondary">
                                                            {food.normalized_food_name}
                                                        </Box>
                                                    </TableCell>
                                                    <TableCell>{selectedDiet}</TableCell>
                                                    <TableCell align="center">{getStatusChip(food.allowed)}</TableCell>
                                                    <TableCell>{food.note || '-'}</TableCell>
                                                    <TableCell>{food.source_file || '-'}</TableCell>
                                                    <TableCell>{formatDate(food.updatedAt || food.createdAt)}</TableCell>
                                                    <TableCell align="right">
                                                        <Tooltip title="Edit">
                                                            <IconButton size="small" color="primary" onClick={() => handleOpenEditFoodDialog(food)}>
                                                                <EditIcon fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        ) : (
                            <Typography>No foods found for this diet with the current filter.</Typography>
                        )}
                    </Box>
                )}
            </Paper>

            <Dialog open={addFoodDialogOpen} onClose={handleCloseAddFoodDialog} disableEscapeKeyDown={addingFood} fullWidth maxWidth="sm">
                <DialogTitle sx={{ bgcolor: 'primary.main', color: 'primary.contrastText' }}>
                    {addFoodDialogTitle}
                </DialogTitle>
                <DialogContent sx={{ pt: 2 }}>
                    <DialogContentText sx={{mb: 2}}>
                        Enter the name of the food item and specify if it's allowed for this diet.
                    </DialogContentText>
                    <TextField
                        autoFocus
                        margin="dense"
                        id="foodName"
                        label="Food Name"
                        type="text"
                        fullWidth
                        variant="outlined"
                        value={newFood.food_name}
                        onChange={(e) => setNewFood({ ...newFood, food_name: e.target.value })}
                        disabled={addingFood}
                    />
                    <FormControlLabel
                        control={<Switch checked={newFood.allowed} onChange={(e) => setNewFood({ ...newFood, allowed: e.target.checked })} disabled={addingFood} />}
                        label={newFood.allowed ? "Allowed" : "Not Allowed"}
                        sx={{ mt: 1 }}
                    />
                    <TextField
                        margin="dense"
                        id="newFoodNote"
                        label="Note (Optional)"
                        type="text"
                        fullWidth
                        variant="outlined"
                        value={newFood.note}
                        onChange={(e) => setNewFood({ ...newFood, note: e.target.value })}
                        disabled={addingFood}
                        multiline
                        rows={2}
                    />
                    <TextField
                        margin="dense"
                        id="newSourceFile"
                        label="Source File (Optional)"
                        type="text"
                        fullWidth
                        variant="outlined"
                        value={newFood.source_file}
                        onChange={(e) => setNewFood({ ...newFood, source_file: e.target.value })}
                        disabled={addingFood}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseAddFoodDialog} disabled={addingFood}>Cancel</Button>
                    <Button onClick={handleSubmitNewFood} variant="contained" disabled={addingFood || !newFood.food_name.trim() || (!newFood.diet_code_override && !selectedDiet)}>
                        {addingFood ? <CircularProgress size={24} /> : 'Add Food'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Edit Food Dialog */}
            <Dialog open={editFoodDialogOpen} onClose={handleCloseEditFoodDialog} fullWidth maxWidth="sm" disableRestoreFocus>
                <DialogTitle sx={{ bgcolor: 'secondary.main', color: 'secondary.contrastText' }}>
                    {editFoodDialogTitle}
                </DialogTitle>
                <DialogContent sx={{ pt: 2 }}>
                    <DialogContentText sx={{mb: 2}}>
                        Modify the details of the food item.
                    </DialogContentText>
                    <TextField
                        autoFocus
                        margin="dense"
                        id="editFoodName"
                        label="Food Name"
                        type="text"
                        fullWidth
                        variant="outlined"
                        value={editingFood?.food_name || ''}
                        onChange={(e) => setEditingFood({ ...editingFood, food_name: e.target.value, normalized_food_name: e.target.value.toLowerCase() })}
                        disabled={editing}
                    />
                    <FormControlLabel
                        control={<Switch checked={editingFood?.allowed || false} onChange={(e) => setEditingFood({ ...editingFood, allowed: e.target.checked })} disabled={editing} />}
                        label={editingFood?.allowed ? "Allowed" : "Not Allowed"}
                        sx={{ mt: 1 }}
                    />
                    <TextField
                        margin="dense"
                        id="editFoodNote"
                        label="Note (Optional)"
                        type="text"
                        fullWidth
                        variant="outlined"
                        value={editingFood?.note || ''}
                        onChange={(e) => setEditingFood({ ...editingFood, note: e.target.value })}
                        disabled={editing}
                        multiline
                        rows={2}
                    />
                    <TextField
                        margin="dense"
                        id="editSourceFile"
                        label="Source File (Optional)"
                        type="text"
                        fullWidth
                        variant="outlined"
                        value={editingFood?.source_file || ''}
                        onChange={(e) => setEditingFood({ ...editingFood, source_file: e.target.value })}
                        disabled={editing}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseEditFoodDialog} disabled={editing}>Cancel</Button>
                    <Button onClick={handleSubmitEditedFood} variant="contained" disabled={editing || !editingFood || !editingFood.food_name?.trim() || !selectedDiet}>
                        {editing ? <CircularProgress size={24} /> : 'Save Changes'}
                    </Button>
                </DialogActions>
            </Dialog>

        </Container>
    );
};

export default FoodDbAdminPage;
