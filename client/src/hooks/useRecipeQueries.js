/**
 * @file useRecipeQueries.js
 * @description TanStack Query hooks for recipe data.
 * Provides automatic caching, background refetching, and query invalidation
 * for saved and generated recipes.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAuth } from 'firebase/auth';
import { API_BASE_URL } from '../env-config.js';
import { queryKeys } from './useUserQueries.js';

const auth = getAuth();

/**
 * Helper to get a fresh Firebase ID token.
 */
async function getFreshIdToken() {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('User not authenticated');
  }
  return currentUser.getIdToken(true);
}

/**
 * Fetches saved recipes from the backend.
 * @returns {Promise<Array>} Array of saved recipes.
 */
async function fetchSavedRecipes() {
  const token = await getFreshIdToken();
  const response = await fetch(`${API_BASE_URL}/api/recipes/saved`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch saved recipes: ${response.status}`);
  }
  
  const data = await response.json();
  return data.data || [];
}

/**
 * Fetches generated recipes from the backend.
 * @returns {Promise<Array>} Array of generated recipes.
 */
async function fetchGeneratedRecipes() {
  const token = await getFreshIdToken();
  const response = await fetch(`${API_BASE_URL}/api/recipes/generated`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch generated recipes: ${response.status}`);
  }
  
  return response.json();
}

/**
 * Hook to fetch and cache saved recipes.
 * 
 * @returns {object} Query result with saved recipes array, loading state, and error.
 */
export function useSavedRecipesQuery() {
  const currentUser = auth.currentUser;
  const uid = currentUser?.uid;

  console.log('[TanStack] useSavedRecipesQuery using uid:', uid, 'queryKey:', queryKeys.savedRecipes(uid));

  const query = useQuery({
    queryKey: queryKeys.savedRecipes(uid),
    queryFn: async () => {
      console.log('[TanStack] Fetching saved recipes...');
      const result = await fetchSavedRecipes();
      console.log('[TanStack] Fetched saved recipes, count:', result?.length);
      return result;
    },
    enabled: !!uid,
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });

  return {
    ...query,
    savedRecipes: query.data || [],
    savedRecipeIds: new Set((query.data || []).map(r => r._id)),
  };
}

/**
 * Hook to fetch and cache generated recipes.
 * 
 * @returns {object} Query result with generated recipes array, loading state, and error.
 */
export function useGeneratedRecipesQuery() {
  const currentUser = auth.currentUser;
  const uid = currentUser?.uid;

  const query = useQuery({
    queryKey: queryKeys.generatedRecipes(uid),
    queryFn: fetchGeneratedRecipes,
    enabled: !!uid,
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });

  return {
    ...query,
    generatedRecipes: query.data || [],
  };
}

/**
 * Mutation hook to save a recipe.
 * Automatically invalidates saved recipes query on success.
 * 
 * @returns {object} Mutation object with mutate function.
 */
export function useSaveRecipeMutation() {
  const queryClient = useQueryClient();
  const currentUser = auth.currentUser;
  const uid = currentUser?.uid;

  return useMutation({
    mutationFn: async ({ recipeId, rating }) => {
      const token = await getFreshIdToken();
      const response = await fetch(`${API_BASE_URL}/api/recipes/${recipeId}/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ rating }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to save recipe');
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Invalidate saved recipes to trigger refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.savedRecipes(uid) });
    },
  });
}

/**
 * Mutation hook to unsave a recipe.
 * Automatically invalidates saved recipes query on success.
 * 
 * @returns {object} Mutation object with mutate function.
 */
export function useUnsaveRecipeMutation() {
  const queryClient = useQueryClient();
  const currentUser = auth.currentUser;
  const uid = currentUser?.uid;

  return useMutation({
    mutationFn: async (recipeId) => {
      const token = await getFreshIdToken();
      const response = await fetch(`${API_BASE_URL}/api/recipes/${recipeId}/save`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to unsave recipe');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.savedRecipes(uid) });
    },
  });
}

/**
 * Mutation hook to duplicate a recipe.
 * Invalidates both saved and generated recipe queries.
 * 
 * @returns {object} Mutation object with mutate function.
 */
export function useDuplicateRecipeMutation() {
  const queryClient = useQueryClient();
  const currentUser = auth.currentUser;
  const uid = currentUser?.uid;

  return useMutation({
    mutationFn: async ({ recipeId, newTitle }) => {
      const token = await getFreshIdToken();
      const response = await fetch(`${API_BASE_URL}/api/recipes/${recipeId}/duplicate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ newTitle }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to duplicate recipe');
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Invalidate all recipe queries
      queryClient.invalidateQueries({ queryKey: ['recipes', uid] });
    },
  });
}

/**
 * Mutation hook to generate an AI image for a recipe.
 * Invalidates generated recipes query on success.
 * 
 * @returns {object} Mutation object with mutate function.
 */
export function useGenerateRecipeImageMutation() {
  const queryClient = useQueryClient();
  const currentUser = auth.currentUser;
  const uid = currentUser?.uid;

  return useMutation({
    mutationFn: async (recipeId) => {
      const token = await getFreshIdToken();
      const response = await fetch(`${API_BASE_URL}/api/recipes/${recipeId}/generate-image`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to generate image');
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Invalidate all recipe queries since image affects display
      queryClient.invalidateQueries({ queryKey: ['recipes', uid] });
      // Also invalidate user data since credits were spent
      queryClient.invalidateQueries({ queryKey: ['user', uid] });
    },
  });
}
