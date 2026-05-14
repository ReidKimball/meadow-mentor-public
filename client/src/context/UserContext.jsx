// UserContext to check both MongoDB and Firestore

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { collection, getFirestore, onSnapshot, query, where } from 'firebase/firestore';
import { app } from '../config/firestore';
import { API_BASE_URL } from '../env-config.js';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const UserContext = createContext(null);

export const useUser = () => useContext(UserContext);

const auth = getAuth();
const db = getFirestore(app);

export const UserProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isNewUser, setIsNewUser] = useState(false); // <-- Add state for new user signup flow
    const [subscriptionStatus, setSubscriptionStatus] = useState('free');
    const [firebaseSubscriptionActive, setFirebaseSubscriptionActive] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const [sessionContext, setSessionContext] = useState(null);

    // Function to get a fresh ID token
    const getFreshIdToken = useCallback(async () => {
        if (auth.currentUser) {
            try {
                const freshToken = await auth.currentUser.getIdToken(true); // true forces refresh
                localStorage.setItem('firebaseToken', freshToken); // Update stored token
                return freshToken;
            } catch (error) {
                console.error("(UserContext.jsx) Error refreshing Firebase ID token:", error);
                if (error.code === 'auth/user-token-expired' || error.code === 'auth/user-disabled' || error.code === 'auth/user-not-found') {
                    setUser(null);
                    setSubscriptionStatus('free');
                    setFirebaseSubscriptionActive(false);
                    setIsAdmin(false);
                    localStorage.removeItem('firebaseToken');
                }
                throw error;
            }
        } else {
            localStorage.removeItem('firebaseToken');
            throw new Error("User not authenticated. Please log in.");
        }
    }, [auth.currentUser]);

    useEffect(() => {
        let firestoreUnsubscribe = () => { }; // Initialize unsubscribe function

        const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
            // If we're in the middle of a new user signup, don't do anything yet.
            // The signup form will call setIsNewUser(false) to trigger this again.
            if (isNewUser) {
                setLoading(false);
                return;
            }

            // If user object is already populated by signup form, don't refetch.
            if (user && firebaseUser && user.firebaseUID === firebaseUser.uid) {
                setLoading(false);
                return;
            }

            setLoading(true); // Set loading true at the start of auth change handling
            if (firebaseUser) {
                // Identify user in PostHog
                if (window.posthog) {
                    window.posthog.identify(firebaseUser.uid, { email: firebaseUser.email });
                }

                try {
                    const idToken = await getFreshIdToken();
                    const tokenResult = await firebaseUser.getIdTokenResult();
                    setIsAdmin(!!tokenResult.claims.admin);

                    // --- Fetch user data with retry logic for signup race condition ---
                    let userData = null;
                    let responseOk = false;
                    for (let i = 0; i < 3; i++) { // Try up to 3 times
                        const response = await fetch(`${API_BASE_URL}/api/users/${firebaseUser.uid}`, {
                            headers: { 'Authorization': `Bearer ${idToken}` },
                        });

                        if (response.ok) {
                            userData = await response.json();
                            responseOk = true;
                            break; // Success, exit loop
                        } else if (response.status === 404) {
                            console.warn(`(UserContext.jsx) User not found, attempt ${i + 1}. Retrying...`);
                            await new Promise(resolve => setTimeout(resolve, 750)); // Wait 750ms before retrying
                        } else {
                            // For other errors, break immediately
                            break;
                        }
                    }

                    if (responseOk) {
                        setUser(userData);
                        setSubscriptionStatus(userData.paymentStatus?.status || 'free');

                        // Setup Firestore listener for real-time subscription updates
                        const q = query(collection(db, 'customers', firebaseUser.uid, 'subscriptions'), where('status', 'in', ['trialing', 'active']));
                        firestoreUnsubscribe = onSnapshot(q, (snapshot) => {
                            setFirebaseSubscriptionActive(snapshot.docs.length > 0);
                            setLoading(false);
                        }, (error) => {
                            console.error("(UserContext.jsx) Error listening to Firestore subscriptions:", error);
                            setFirebaseSubscriptionActive(false);
                            setLoading(false);
                        });

                        // Also fetch session context on login
                        fetchSessionContext();
                    } else {
                        console.error(`(UserContext.jsx) Failed to fetch user data for UID: ${firebaseUser.uid} after retries.`);
                        setUser(null);
                        setSubscriptionStatus('free');
                        setFirebaseSubscriptionActive(false);
                        setIsAdmin(false);
                        setLoading(false);
                    }
                } catch (error) {
                    console.error('(UserContext.jsx) Error during user data fetch or listener setup:', error);
                    setUser(null);
                    setSubscriptionStatus('free');
                    setFirebaseSubscriptionActive(false);
                    setIsAdmin(false);
                    setLoading(false);
                }
            } else {
                // User is signed out
                if (window.posthog) {
                    window.posthog.reset();
                }

                setUser(null);
                setSubscriptionStatus('free');
                setFirebaseSubscriptionActive(false);
                setIsAdmin(false);
                firestoreUnsubscribe(); // Clean up listener on sign out
                localStorage.removeItem('firebaseToken'); // <-- REMOVE TOKEN HERE
                setLoading(false); // Stop loading on sign out
                setSessionContext(null);
            }
        });

        // Cleanup function for the effect
        return () => {
            //console.log("(UserContext.jsx) Cleaning up auth and Firestore listeners.");
            unsubscribeAuth(); // Unsubscribe from auth changes
            firestoreUnsubscribe(); // Unsubscribe from Firestore
        };
        // Dependency array: db is needed for collection() inside the listener setup
    }, [auth, db, isNewUser]); // <-- Add isNewUser to dependency array


    const fetchSessionContext = useCallback(async () => {
        try {
            const idToken = await getFreshIdToken();
            const response = await fetch(`${API_BASE_URL}/api/user-health/session-context`, {
                headers: { 'Authorization': `Bearer ${idToken}` },
            });
            if (response.ok) {
                const data = await response.json();
                setSessionContext(data.sessionContext);
            }
        } catch (error) {
            console.error('(UserContext.jsx) Error fetching session context:', error);
        }
    }, [getFreshIdToken]);

    const updateSessionContext = useCallback(async (energyLevel, stressMode) => {
        try {
            const idToken = await getFreshIdToken();
            const response = await fetch(`${API_BASE_URL}/api/user-health/session-context`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${idToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ energyLevel, stressMode }),
            });
            if (response.ok) {
                const data = await response.json();
                setSessionContext(data.sessionContext);
                return data.sessionContext;
            }
        } catch (error) {
            console.error('(UserContext.jsx) Error updating session context:', error);
        }
    }, [getFreshIdToken]);

    // Provide both subscription sources and a combined check
    const isSubscriber = () => {
        return ['active', 'trial'].includes(subscriptionStatus) || firebaseSubscriptionActive;
    };

    const value = useMemo(() => ({
        user,
        setUser,
        loading,
        isNewUser,
        setIsNewUser,
        subscriptionStatus,
        firebaseSubscriptionActive,
        isAdmin,
        isSubscriber: isSubscriber(),
        getFreshIdToken,
        sessionContext,
        setSessionContext,
        updateSessionContext,
        fetchSessionContext,
    }), [
        user,
        setUser,
        loading,
        isNewUser,
        setIsNewUser,
        subscriptionStatus,
        firebaseSubscriptionActive,
        isAdmin,
        isSubscriber,
        getFreshIdToken,
        sessionContext,
        updateSessionContext,
        fetchSessionContext,
    ]);

    return (
        <UserContext.Provider value={value}>
            {children}
        </UserContext.Provider>
    );
};
