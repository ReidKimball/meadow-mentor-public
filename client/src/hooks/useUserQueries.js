/**
 * @file useUserQueries.js
 * @description TanStack Query hooks for user and credit data.
 * These hooks provide automatic caching, background refetching, and
 * query invalidation for seamless UI updates across the app.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAuth } from 'firebase/auth';
import { API_BASE_URL } from '../env-config.js';

const auth = getAuth();

/**
 * Helper to get a fresh Firebase ID token.
 * @returns {Promise<string>} The ID token.
 * @throws {Error} If user is not authenticated.
 */
async function getFreshIdToken() {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('User not authenticated');
  }
  return currentUser.getIdToken(true);
}

/**
 * Query key factory for consistent key management.
 * Using a factory pattern makes invalidation predictable.
 */
export const queryKeys = {
  user: (uid) => ['user', uid],
  credits: (uid) => ['user', uid, 'credits'],
  sessionContext: (uid) => ['user', uid, 'sessionContext'],
  savedRecipes: (uid) => ['recipes', uid, 'saved'],
  generatedRecipes: (uid) => ['recipes', uid, 'generated'],
};

/**
 * Fetches user data from the backend.
 * @param {string} uid - Firebase user ID.
 * @returns {Promise<object>} User data object.
 */
async function fetchUser(uid) {
  const token = await getFreshIdToken();
  const response = await fetch(`${API_BASE_URL}/api/users/${uid}`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch user: ${response.status}`);
  }
  
  return response.json();
}

/**
 * Hook to fetch and cache user data.
 * Auto-refetches when window regains focus.
 * 
 * @returns {object} Query result with user data, loading state, error, and refetch function.
 */
export function useUserQuery() {
  const currentUser = auth.currentUser;
  const uid = currentUser?.uid;

  return useQuery({
    queryKey: queryKeys.user(uid),
    queryFn: () => fetchUser(uid),
    enabled: !!uid, // Only run if user is authenticated
    staleTime: 30_000, // Consider fresh for 30 seconds
    refetchOnWindowFocus: true,
  });
}

/**
 * Hook to get credit balance from cached user data.
 * Derives credits from user query to avoid duplicate fetches.
 * 
 * @returns {object} Object with creditBalance, isLoading, error, and helper booleans.
 */
export function useCreditsQuery() {
  const queryClient = useQueryClient();
  const currentUser = auth.currentUser;
  const uid = currentUser?.uid;
  const { data: user, isLoading, error, refetch } = useUserQuery();
  
  const creditBalance = user?.creditBalance ?? 0;

  /**
   * Check if user can afford an action.
   * @param {number} cost - The cost in credits.
   * @returns {boolean} True if user has enough credits.
   */
  const canAfford = (cost) => creditBalance >= cost;

  /**
   * Optimistically deduct credits (for immediate UI feedback).
   * @param {number} amount - Amount to deduct.
   */
  const deductCreditsOptimistically = (amount) => {
    if (uid) {
      queryClient.setQueryData(queryKeys.user(uid), (oldData) => {
        if (!oldData) return oldData;
        return { ...oldData, creditBalance: Math.max(0, (oldData.creditBalance ?? 0) - amount) };
      });
    }
  };

  /**
   * Optimistically add credits (for immediate UI feedback).
   * @param {number} amount - Amount to add.
   */
  const addCreditsOptimistically = (amount) => {
    if (uid) {
      queryClient.setQueryData(queryKeys.user(uid), (oldData) => {
        if (!oldData) return oldData;
        return { ...oldData, creditBalance: (oldData.creditBalance ?? 0) + amount };
      });
    }
  };
  
  return {
    creditBalance,
    isLoading,
    error,
    refetch,
    hasCredits: creditBalance > 0,
    isOutOfCredits: creditBalance === 0,
    canAfford,
    deductCreditsOptimistically,
    addCreditsOptimistically,
  };
}

/**
 * Hook to get session context (flare status, energy level, etc.)
 * 
 * @returns {object} Query result with session context data.
 */
export function useSessionContextQuery() {
  const currentUser = auth.currentUser;
  const uid = currentUser?.uid;

  return useQuery({
    queryKey: queryKeys.sessionContext(uid),
    queryFn: async () => {
      const token = await getFreshIdToken();
      const response = await fetch(`${API_BASE_URL}/api/user-health/session-context`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch session context: ${response.status}`);
      }
      const data = await response.json();
      return data.sessionContext;
    },
    enabled: !!uid,
    staleTime: 60_000, // Session context changes less frequently
  });
}

/**
 * Mutation hook to update session context.
 * Automatically invalidates the session context query on success.
 * 
 * @returns {object} Mutation object with mutate function.
 */
export function useUpdateSessionContext() {
  const queryClient = useQueryClient();
  const currentUser = auth.currentUser;
  const uid = currentUser?.uid;

  return useMutation({
    mutationFn: async ({ energyLevel, stressMode, flareStatus }) => {
      const token = await getFreshIdToken();
      const response = await fetch(`${API_BASE_URL}/api/user-health/session-context`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ energyLevel, stressMode, flareStatus }),
      });
      if (!response.ok) {
        throw new Error(`Failed to update session context: ${response.status}`);
      }
      return response.json();
    },
    onSuccess: () => {
      // Invalidate session context - triggers automatic refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.sessionContext(uid) });
      // Also invalidate user data since flare status might be part of user
      queryClient.invalidateQueries({ queryKey: queryKeys.user(uid) });
    },
  });
}

/**
 * Hook to invalidate queries from anywhere in the app.
 * Use this when SSE events indicate data has changed.
 * 
 * @returns {object} Object with invalidation functions.
 */
export function useQueryInvalidation() {
  const queryClient = useQueryClient();
  const currentUser = auth.currentUser;
  const uid = currentUser?.uid;

  return {
    /**
     * Invalidate user data (triggers refetch of user and derived queries like credits).
     */
    invalidateUser: () => {
      if (uid) {
        queryClient.invalidateQueries({ queryKey: queryKeys.user(uid) });
      }
    },

    /**
     * Invalidate all user-related queries (user, credits, session context).
     */
    invalidateAllUserData: () => {
      if (uid) {
        queryClient.invalidateQueries({ queryKey: ['user', uid] });
      }
    },

    /**
     * Invalidate session context (triggers refetch).
     */
    invalidateSessionContext: () => {
      if (uid) {
        queryClient.invalidateQueries({ queryKey: queryKeys.sessionContext(uid) });
      }
    },

    /**
     * Invalidate saved recipes.
     */
    invalidateSavedRecipes: () => {
      if (uid) {
        queryClient.invalidateQueries({ queryKey: queryKeys.savedRecipes(uid) });
      }
    },

    /**
     * Invalidate generated recipes.
     */
    invalidateGeneratedRecipes: () => {
      if (uid) {
        queryClient.invalidateQueries({ queryKey: queryKeys.generatedRecipes(uid) });
      }
    },

    /**
     * Invalidate all recipe queries.
     */
    invalidateAllRecipes: () => {
      console.log('[TanStack] invalidateAllRecipes called, uid:', uid);
      if (uid) {
        queryClient.invalidateQueries({ queryKey: ['recipes', uid] });
        console.log('[TanStack] Invalidated queries with key:', ['recipes', uid]);
      } else {
        console.warn('[TanStack] invalidateAllRecipes called but no uid available');
      }
    },

    /**
     * Optimistically set credit balance (for immediate UI feedback).
     * Use when you know the new balance from SSE metadata.
     * @param {number} newBalance - The new credit balance.
     */
    setCreditsOptimistic: (newBalance) => {
      if (uid) {
        queryClient.setQueryData(queryKeys.user(uid), (oldData) => {
          if (!oldData) return oldData;
          return { ...oldData, creditBalance: newBalance };
        });
      }
    },
  };
}
