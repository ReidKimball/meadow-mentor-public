'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
    Box,
    Typography,
    CircularProgress,
    Alert,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Container,
    SelectChangeEvent
} from '@mui/material';
import { Masonry } from '@mui/lab';
import { getPublicRecipes } from '@/services/recipeService';
import { Recipe } from '@/types/recipe';
import RecipeSummaryCard from '@/components/RecipeSummaryCard';

export default function RecipesClient() {
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedDiet, setSelectedDiet] = useState('All');

    const diets = [
        { code: 'All', name: 'All Diets' },
        { code: 'SCD', name: 'Specific Carbohydrate Diet' },
        { code: 'GAPS', name: 'GAPS Protocol' },
        { code: 'Paleo AIP', name: 'Paleo Autoimmune Protocol' },
        { code: 'Mediterranean', name: 'Mediterranean Diet' },
    ];

    const fetchPublicRecipes = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await getPublicRecipes(selectedDiet);
            if (response.success) {
                const filteredRecipes = response.data.filter(recipe => !recipe.isFirstHealingMeal);
                setRecipes(filteredRecipes);
            } else {
                throw new Error('Failed to fetch public recipes.');
            }
        } catch (err: any) {
            setError(err.message);
            console.error('Error fetching public recipes:', err);
        } finally {
            setLoading(false);
        }
    }, [selectedDiet]);

    useEffect(() => {
        fetchPublicRecipes();
    }, [fetchPublicRecipes]);

    const handleDietChange = (event: SelectChangeEvent) => {
        setSelectedDiet(event.target.value);
    };

    // Loading State
    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
                <CircularProgress sx={{ color: '#013D1D' }} />
            </Box>
        );
    }

    // Error State
    if (error) {
        return (
            <Container maxWidth="lg" sx={{ mt: 4 }}>
                <Alert severity="error">{error}</Alert>
            </Container>
        );
    }

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: '#fafafa', pb: 8 }}>
            {/* Hero / Header Section */}
            <Box
                sx={{
                    background: 'linear-gradient(180deg, rgba(220, 252, 231, 0.4) 0%, #fafafa 100%)',
                    pt: { xs: 8, md: 10 },
                    pb: { xs: 4, md: 6 },
                    textAlign: 'center'
                }}
            >
                <Container maxWidth="lg">
                    <Typography
                        variant="h1"
                        sx={{
                            fontSize: { xs: '2rem', md: '3rem' },
                            fontWeight: 700,
                            color: '#013D1D',
                            mb: 2,
                            fontFamily: 'var(--font-heading, Montserrat)',
                        }}
                    >
                        Community Recipes
                    </Typography>
                    <Typography
                        variant="body1"
                        sx={{
                            mb: 4,
                            color: '#525252',
                            fontSize: '1.1rem',
                            maxWidth: '600px',
                            mx: 'auto'
                        }}
                    >
                        Explore recipes shared by the Meadow Mentor community. Healthy eating, made delicious.
                    </Typography>

                    {/* Filter */}
                    <FormControl sx={{ m: 1, minWidth: 240, bgcolor: 'white', borderRadius: 1 }}>
                        <InputLabel id="diet-filter-label">Filter by Diet</InputLabel>
                        <Select
                            labelId="diet-filter-label"
                            id="diet-filter"
                            value={selectedDiet}
                            label="Filter by Diet"
                            onChange={handleDietChange}
                        >
                            {diets.map((diet) => (
                                <MenuItem key={diet.code} value={diet.code}>
                                    {diet.name}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Container>
            </Box>

            {/* Recipes Grid */}
            <Container maxWidth="lg">
                {recipes.length > 0 ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%', mt: 2 }}>
                        <Masonry columns={{ xs: 1, sm: 2, md: 3 }} spacing={3} sx={{ maxWidth: '100%' }}>
                            {recipes.map((recipe) => (
                                <RecipeSummaryCard key={recipe._id} recipe={recipe} />
                            ))}
                        </Masonry>
                    </Box>
                ) : (
                    <Typography sx={{ textAlign: 'center', mt: 4, color: 'text.secondary' }}>
                        No public recipes found for this filter.
                    </Typography>
                )}
            </Container>
        </Box>
    );
}
