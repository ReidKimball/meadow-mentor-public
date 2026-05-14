/**
 * @file App.jsx
 * @module App
 * @description The root component of the Meadow Mentor application.
 * This file sets up the main application structure, including:
 * - React Router for navigation between pages.
 * - Context providers for global state management (User, API Limits, Recipes).
 * - Authentication state handling to distinguish between public and protected routes.
 * - Layout components for consistent UI across the application.
 * @requires react
 * @requires react-router-dom
 * @requires firebase/auth
 * @requires module:config/firestore
 * @requires module:context/UserContext
 * @requires module:context/ApiLimitsContext
 * @requires module:context/RecipeContext
 * @requires module:components/Layout/AppLayout
 * @requires module:components/ProtectedRoute/ProtectedRoute
 * @requires module:components/AdminRoute
 */

import { useState, useEffect } from 'react'
import './App.css'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { auth } from './config/firestore.js'
import { onAuthStateChanged } from 'firebase/auth'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';

// Layout Components
import AppLayout from './components/Layout/AppLayout.jsx'

// Pages
import AdminPanel from './components/features/admin/AdminPanel.jsx'
import AdminRoute from './components/auth/AdminRoute.jsx'
import ProtectedRoute from './components/auth/ProtectedRoute/ProtectedRoute.jsx';
import { AppHeader } from './components/Layout/Header.jsx'
import Footer from './components/Layout/Footer.jsx'
// About and Pricing now served by Next.js marketing site
import Signup from './components/auth/Signup.jsx'
import Login from './components/auth/Login.jsx'
import Profile from './components/auth/Profile.jsx'
import Guidebook from './components/features/guidebook/Guidebook.jsx'
import Thankyou from './components/Pages/Thankyou.jsx'
//import Features from './components/Pages/Features.jsx'
import Updates from './components/Pages/Updates.jsx'
import Roadmap from './components/Pages/Roadmap.jsx'
import SavedDocuments from './components/features/saved-documents/SavedDocuments.jsx'
// Privacy and Terms now served by Next.js marketing site
import FoodJournal from './components/features/food-journal/FoodJournal.jsx'
import UserGrowth from './components/Pages/userGrowth.jsx'
import ScrollToTop from './components/utils/ScrollToTop.jsx';
// Blog now served by Next.js marketing site
import FoodDbAdminPage from './components/features/admin/FoodDbAdminPage.jsx';
import AIResponsesAdminPage from './components/features/admin/AIResponsesAdminPage.jsx';
import FoodCompassPage from './components/features/food-db/FoodCompass.jsx';
import AskKay from './components/features/ai/AskKay/AskKay.jsx';
import GettingStarted from './components/features/onboarding/GettingStarted.jsx';
import FirstHealingMealRoute from './components/auth/ProtectedRoute/FirstHealingMealRoute.jsx';
import ShoppingList from './components/features/shopping-list/ShoppingList.jsx';
import SavedRecipesPage from './components/features/recipes/SavedRecipesPage.jsx';
import BMLoggingDashboard from './components/features/bm-logging/BMLoggingDashboard.jsx';
import { MARKETING_BASE_URL } from './env-config.js';
// Public recipes now served by Next.js marketing site
import MyRecipeDetailPage from './components/features/recipes/MyRecipeDetailPage.jsx';
import PublicRecipeDetailPage from './components/features/recipes/PublicRecipeDetailPage.jsx';
import WeeklyMealPlanner from './components/features/meal-planner/WeeklyMealPlanner.jsx';
import UpgradePage from './components/features/payments/UpgradePage.jsx';
import CreditPurchaseSuccess from './components/features/payments/CreditPurchaseSuccess.jsx';
import RecipeValidationLogsPage from './pages/Admin/RecipeValidationLogsPage.jsx';
import GrowthEnginePage from './pages/Admin/GrowthEnginePage.jsx';
import { useAuthRedirect } from './hooks/useAuthRedirect';
import HowToVideos from './components/Pages/HowToVideos.jsx';

import { UserProvider } from './context/UserContext.jsx';
import { RecipeProvider } from './context/RecipeContext.jsx';
import { CreditProvider } from './context/CreditContext.jsx';

// TanStack Query client with sensible defaults
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000, // Data considered fresh for 30 seconds
      gcTime: 5 * 60 * 1000, // Cache garbage collected after 5 minutes
      retry: 2, // Retry failed requests twice
      refetchOnWindowFocus: true, // Refetch when user returns to tab
    },
  },
});

/**
 * @function App_v2
 * @description The main application component that orchestrates routing and global state.
 * It wraps all routes with necessary context providers (`UserProvider`, `ApiLimitsProvider`, `RecipeProvider`)
 * and uses Firebase Authentication to manage user session state. It renders different layouts
 * for public, protected, and admin routes.
 * @returns {JSX.Element} The fully configured application with routing and context providers.
 */

// This component will call the hook from within the UserProvider's scope.
const AuthRedirectHandler = () => {
  useAuthRedirect();
  return null; // This component does not render anything.
};

function App_v2() {
  const [isAuthenticated, setIsAuthenticated] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user);
    });

    return () => unsubscribe();
  }, []);

  /**
   * @function PublicPageLayout
   * @description A layout component that wraps public-facing pages (login/signup).
   * Uses AppHeader for consistency with the logged-in experience.
   * @param {object} props - The component props.
   * @param {React.ReactNode} props.children - The page component to be rendered within the layout.
   * @returns {JSX.Element} A fragment containing the AppHeader, children, and Footer.
   */
  function PublicPageLayout({ children }) {
    return (
      <>
        <AppHeader />
        {children}
        <Footer />
      </>
    );
  }

  /**
   * @function MarketingRedirect
   * @description Redirects users to the Next.js marketing site.
   * Used for routes that are now handled by the marketing site at meadowmentor.com.
   */
  function MarketingRedirect() {
    useEffect(() => {
      window.location.href = MARKETING_BASE_URL;
    }, []);
    return null;
  }

  // Custom CSS to handle streaming markdown rendering issues
  const customMarkdownStyle = `
    .streaming-markdown-content * {
      white-space: pre-wrap !important;
    }
  `;

  return (
    <QueryClientProvider client={queryClient}>
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <UserProvider>
          <CreditProvider>
            <RecipeProvider>
              <BrowserRouter>
                <AuthRedirectHandler />
                {/* Render ScrollToTop here, inside BrowserRouter */}
                <ScrollToTop />
                <style>{customMarkdownStyle}</style>
                <Routes>
                  {/* Public routes - redirect marketing pages to Next.js site */}
                  <Route path="/" element={<MarketingRedirect />} />
                  <Route path="/about" element={<MarketingRedirect />} />
                  <Route path="/pricing" element={<MarketingRedirect />} />
                  <Route path="/blog" element={<MarketingRedirect />} />
                  <Route path="/blog/:slug" element={<MarketingRedirect />} />
                  <Route path="/recipes" element={<MarketingRedirect />} />
                  <Route path="/recipes/:slug" element={<MarketingRedirect />} />
                  <Route path="/privacy" element={<MarketingRedirect />} />
                  <Route path="/terms" element={<MarketingRedirect />} />

                  {/* Auth routes - stay in the app */}
                  <Route path="/signup" element={<PublicPageLayout><Signup setIsAuthenticated={setIsAuthenticated} /></PublicPageLayout>} />
                  <Route path="/login" element={<PublicPageLayout><Login setIsAuthenticated={setIsAuthenticated} /></PublicPageLayout>} />
                  <Route path="/thankyou" element={<PublicPageLayout><Thankyou /></PublicPageLayout>} />
                  <Route path="/updates" element={<PublicPageLayout><Updates /></PublicPageLayout>} />
                  <Route path="/roadmap" element={<PublicPageLayout><Roadmap /></PublicPageLayout>} />

                  {/* Protected routes */}
                  <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
                    <Route path="/quick_start_guide" element={<GettingStarted />} />
                    <Route path="/first-healing-meal" element={<FirstHealingMealRoute />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/guidebook" element={<Guidebook />} />
                    <Route path="/food-compass" element={<FoodCompassPage />} />
                    <Route path="/ask-kay" element={<AskKay />} />
                    <Route path="/food_journal" element={<FoodJournal />} />
                    <Route path="/shopping-list" element={<ShoppingList />} />
                    <Route path="/saved-recipes" element={<SavedRecipesPage />} />
                    <Route path="/my-recipes/:slug" element={<MyRecipeDetailPage />} />
                    <Route path="/public-recipes/:slug" element={<PublicRecipeDetailPage />} />
                    <Route path="/meal-planner" element={<WeeklyMealPlanner />} />
                    <Route path="/upgrade" element={<UpgradePage />} />
                    <Route path="/credits/success" element={<CreditPurchaseSuccess />} />
                    <Route path="/how-to-videos" element={<HowToVideos />} />
                    <Route path="/saved-documents" element={<SavedDocuments />} />
                    <Route path="/bowel-movements" element={<BMLoggingDashboard />} />

                    {/* Admin routes */}
                    <Route element={<AdminRoute />}>
                      <Route path="/admin" element={<AdminPanel />} />
                      <Route path="/usergrowth" element={<UserGrowth />} />
                      <Route path="/admin/food_db_admin" element={<FoodDbAdminPage />} />
                      <Route path="/admin/ai_responses_admin" element={<AIResponsesAdminPage />} />
                      <Route path="/admin/recipe-validation-logs" element={<RecipeValidationLogsPage />} />
                      <Route path="/admin/growth" element={<GrowthEnginePage />} />
                    </Route>

                    {/* Add a catch-all or redirect for authenticated users if needed */}
                    <Route path="*" element={<Navigate to="/profile" replace />} />
                  </Route>
                </Routes>
              </BrowserRouter>
            </RecipeProvider>
          </CreditProvider>
        </UserProvider>
      </LocalizationProvider>
    </QueryClientProvider>
  )
}

export default App_v2
