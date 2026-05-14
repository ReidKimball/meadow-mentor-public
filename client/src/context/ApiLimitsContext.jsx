import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import { getAuth, onAuthStateChanged } from 'firebase/auth'
import { API_BASE_URL } from '../env-config'
import { useUser } from './UserContext'

const ApiLimitsContext = createContext()

const formatTimeLocale = (isoTimestamp, options) => {
    if (!isoTimestamp) return 'N/A';
    try {
        const date = new Date(isoTimestamp);
        if (isNaN(date.getTime())) return 'Invalid Date';
        return date.toLocaleString('en-US', {
            timeZone: 'America/Los_Angeles', // Or adjust as needed
            ...options,
        });
    } catch (e) {
        console.error("Error formatting time:", e);
        return 'Error';
    }
};

const formatCSTTime = (utcTimestamp) => {
    // Create date object from UTC timestamp
    const date = new Date(utcTimestamp)

    // Format to CST using built-in locale support
    return date.toLocaleString('en-US', {
        timeZone: 'America/Los_Angeles',
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    })
}

const formatNextResetTime = (lastResetIsoString) => {
    if (!lastResetIsoString) return 'N/A';
    try {
        const lastResetDate = new Date(lastResetIsoString);
        if (isNaN(lastResetDate.getTime())) {
            console.error("Invalid lastReset date received:", lastResetIsoString);
            return 'Invalid Date';
        }
        // Add 24 hours (1440 minutes) - adjust if reset period is different
        const nextResetDate = new Date(lastResetDate.getTime() + 24 * 60 * 60 * 1000);
        return formatTimeLocale(nextResetDate, {
            // weekday: 'long',
            // month: 'long',
            // day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
        });
    } catch (e) {
        console.error("Error formatting next reset time:", e);
        return 'Error';
    }
};

export function ApiLimitsProvider({ children }) {
    const auth = getAuth()
    const { isNewUser } = useUser()
    const [apiLimits, setApiLimits] = useState(null)
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // --- Fetch User Limits Logic (using useCallback) ---
    const fetchUserLimits = useCallback(async (user) => {
        if (!user || isNewUser) { 
            // Clear state if no user or if it's a new user signup in progress
            setApiLimits(null);
            setIsLoading(false);
            setError(null);
            console.log('(ApiLimitsContext.jsx) - User logged out or new user, limits cleared.');
            return;
        }

        console.log(`(ApiLimitsContext.jsx) - Fetching limits for user: ${user.uid}`);
        setIsLoading(true);
        setError(null); // Clear previous errors before fetch

        try {
            // --- Get the Firebase ID token ---
            const idToken = await user.getIdToken();
            // ---------------------------------

            // --- Fetch user data with retry logic ---
            let userData = null;
            let responseOk = false;
            for (let i = 0; i < 3; i++) { // Try up to 3 times
                const response = await fetch(`${API_BASE_URL}/api/users/${user.uid}`, {
                    headers: { 'Authorization': `Bearer ${idToken}` },
                });

                if (response.ok) {
                    userData = await response.json();
                    responseOk = true;
                    break; // Success, exit loop
                } else if (response.status === 404) {
                    console.warn(`(ApiLimitsContext.jsx) User not found, attempt ${i + 1}. Retrying...`);
                    await new Promise(resolve => setTimeout(resolve, 750)); // Wait 750ms
                } else {
                    // For other errors, break immediately and handle below
                    break;
                }
            }

            if (responseOk) {
                const currentLimits = userData.apiUsage?.limits || {};
                const currentLastReset = userData.apiUsage?.lastReset || null;

                // Set the combined state
                setApiLimits({
                    limits: currentLimits,
                    lastReset: currentLastReset,
                });

            } else {
                // This will be hit if all retries fail or a non-404 error occurs
                throw new Error(`Failed to fetch user limits for UID: ${user.uid} after retries.`);
            }

        } catch (err) {
            console.error("Error fetching API limits:", err);
            setError(err.message);
            setApiLimits(null); // Clear limits on error
        } finally {
            setIsLoading(false);
        }
    }, [isNewUser]); 


    // --- Effect to handle Auth State Changes ---
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            // Short-circuit during signup to avoid hitting backend before profile exists
            if (isNewUser) {
                setApiLimits(null);
                setIsLoading(false);
                setError(null);
                return;
            }
            fetchUserLimits(user); // Call fetch logic with the current user (or null)
        });

        return () => {
            unsubscribe();
        };
    }, [auth, fetchUserLimits, isNewUser]); 


    // --- Log state changes for debugging (optional) ---
    useEffect(() => {
        console.log('(ApiLimitsContext.jsx) - State Updated:', { isLoading, error, apiLimits });
    }, [isLoading, error, apiLimits]);

    // --- Derive formatted times from apiLimits state using useMemo ---
    const formattedLastResetTime = useMemo(() => {
        return apiLimits?.lastReset ? formatCSTTime(apiLimits.lastReset) : null;
    }, [apiLimits?.lastReset]);

    const formattedNextResetTime = useMemo(() => {
        return apiLimits?.lastReset ? formatNextResetTime(apiLimits.lastReset) : null;
    }, [apiLimits?.lastReset]);

    // --- Provide Context Value ---
    // Memoize the value object to prevent unnecessary re-renders of consumers
    const value = useMemo(() => ({
        apiLimits,              // Contains { limits: {...}, lastReset: '...' }
        isLoading,
        error,
        formattedLastResetTime, // Derived state for display
        formattedNextResetTime, // Derived state for display
        setApiLimits,           // Function to update the entire limits state object
    }), [apiLimits, isLoading, error, formattedLastResetTime, formattedNextResetTime]);

    return (
        <ApiLimitsContext.Provider value={value}>
            {children}
        </ApiLimitsContext.Provider>
    );
} 

export function useApiLimits() {
    const context = useContext(ApiLimitsContext);
    if (!context) {
        throw new Error('useApiLimits must be used within an ApiLimitsProvider');
    }
    return context;
}