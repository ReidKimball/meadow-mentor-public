// client/src/context/CreditContext.jsx
// NOTE: This context is being phased out. New code should use useCreditsQuery() from hooks/useUserQueries.js
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { getAuth } from 'firebase/auth';
import { API_BASE_URL } from '../env-config';
import { useUser } from './UserContext';
import { useQueryInvalidation } from '../hooks/useUserQueries';

const CreditContext = createContext(null);

export const useCredit = () => {
  const context = useContext(CreditContext);
  if (!context) {
    throw new Error('useCredit must be used within a CreditProvider');
  }
  return context;
};

export const CreditProvider = ({ children }) => {
  const [creditBalance, setCreditBalance] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const { user, getFreshIdToken } = useUser();
  const { invalidateUser } = useQueryInvalidation();
  const auth = getAuth();

  // Sync credit balance from user profile whenever the user object changes
  useEffect(() => {
    if (user && user.creditBalance !== undefined) {
      setCreditBalance(user.creditBalance);
    }
  }, [user]);

  // Fetch credit balance manually (fall back to user refetch)
  const fetchCreditBalance = useCallback(async () => {
    if (!auth.currentUser || !user) {
      setCreditBalance(0);
      return;
    }
    // Instead of a separate fetch, we rely on the user object being synced.
    // If a hard refresh is needed, UserContext.refetchUser should be used.
    if (user.creditBalance !== undefined) {
      setCreditBalance(user.creditBalance);
    }
  }, [auth.currentUser, user]);

  // Optimistically update credit balance
  const deductCreditsOptimistically = useCallback((amount) => {
    setCreditBalance(prev => Math.max(0, prev - amount));
  }, []);

  const addCreditsOptimistically = useCallback((amount) => {
    setCreditBalance(prev => prev + amount);
  }, []);

  // Fetch transaction history
  const fetchTransactions = useCallback(async (limit = 20) => {
    if (!auth.currentUser) return;

    try {
      const idToken = await getFreshIdToken();
      const response = await fetch(`${API_BASE_URL}/api/stripe/purchase-history?limit=${limit}`, {
        headers: {
          'Authorization': `Bearer ${idToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch transactions');
      }

      const data = await response.json();
      setTransactions(data.purchases || []);

    } catch (err) {
      console.error('Error fetching transactions:', err);
    }
  }, [auth.currentUser, getFreshIdToken]);

  // Purchase credits
  const purchaseCredits = useCallback(async (packageId) => {
    if (!auth.currentUser) {
      throw new Error('User not authenticated');
    }

    try {
      const idToken = await getFreshIdToken();
      const response = await fetch(`${API_BASE_URL}/api/stripe/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          packageId,
          successUrl: `${window.location.origin}/credits/success`,
          cancelUrl: `${window.location.origin}/pricing`,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const { url } = await response.json();

      // Redirect to Stripe checkout
      window.location.href = url;

    } catch (err) {
      console.error('Error purchasing credits:', err);
      throw err;
    }
  }, [auth.currentUser, getFreshIdToken]);

  // Check if user can afford an action
  const canAfford = useCallback((cost) => {
    return creditBalance >= cost;
  }, [creditBalance]);

  // Get credit packages
  const getCreditPackages = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/stripe/credit-packages`);

      if (!response.ok) {
        throw new Error('Failed to fetch credit packages');
      }

      const data = await response.json();
      return data.packages;

    } catch (err) {
      console.error('Error fetching credit packages:', err);
      throw err;
    }
  }, []);

  // Refetch credit balance (e.g., after returning from Stripe or after credit consumption)
  const refetchCredits = useCallback(async () => {
    // Invalidate user query to trigger refetch (includes creditBalance)
    // The useEffect syncing user.creditBalance will then update local state
    invalidateUser();
    await fetchTransactions();
  }, [invalidateUser, fetchTransactions]);

  // Initialize on mount and when user changes
  useEffect(() => {
    if (auth.currentUser && user) {
      // We don't need to call fetchCreditBalance() here because it's synced via the user effect above
      fetchTransactions();
      setIsLoading(false);
    } else if (!user && !isLoading) {
      setCreditBalance(0);
      setTransactions([]);
      setIsLoading(false);
    }
  }, [auth.currentUser, user?.firebaseUID, fetchTransactions]);

  // Listen for storage events (for multi-tab sync)
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'creditBalance') {
        setCreditBalance(parseInt(e.newValue) || 0);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Persist credit balance to localStorage for multi-tab sync
  useEffect(() => {
    localStorage.setItem('creditBalance', creditBalance.toString());
  }, [creditBalance]);

  const value = useMemo(() => ({
    // State
    creditBalance,
    isLoading,
    error,
    transactions,

    // Computed
    hasCredits: creditBalance > 0,
    isOutOfCredits: creditBalance === 0,

    // Actions
    deductCreditsOptimistically,
    addCreditsOptimistically,
    fetchCreditBalance,
    fetchTransactions,
    purchaseCredits,
    refetchCredits,
    canAfford,
    getCreditPackages,
  }), [
    creditBalance,
    isLoading,
    error,
    transactions,
    deductCreditsOptimistically,
    addCreditsOptimistically,
    fetchCreditBalance,
    fetchTransactions,
    purchaseCredits,
    refetchCredits,
    canAfford,
    getCreditPackages,
  ]);

  return (
    <CreditContext.Provider value={value}>
      {children}
    </CreditContext.Provider>
  );
};

// Custom hook for credit operations
export const useCreditOperations = () => {
  const {
    creditBalance,
    deductCreditsOptimistically,
    addCreditsOptimistically,
    canAfford
  } = useCredit();

  const executeWithCredits = useCallback(async (
    cost,
    action,
    options = {}
  ) => {
    const {
      onSuccess,
      onError,
      onInsufficientCredits,
      showTopUpModal
    } = options;

    // Check if user can afford
    if (!canAfford(cost)) {
      if (onInsufficientCredits) {
        onInsufficientCredits();
      }
      if (showTopUpModal) {
        showTopUpModal();
      }
      return { success: false, error: 'Insufficient credits' };
    }

    // Optimistic update
    deductCreditsOptimistically(cost);

    try {
      const result = await action();

      if (onSuccess) {
        onSuccess(result);
      }

      return { success: true, data: result };

    } catch (error) {
      // Revert optimistic update
      addCreditsOptimistically(cost);

      if (onError) {
        onError(error);
      }

      return { success: false, error };
    }
  }, [canAfford, deductCreditsOptimistically, addCreditsOptimistically]);

  return { executeWithCredits };
};

export default CreditContext;
