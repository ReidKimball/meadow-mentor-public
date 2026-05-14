import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { useUser } from '../../../context/UserContext.jsx';
import { useQueryInvalidation } from '../../../hooks/useUserQueries.js';
import { completeOnboarding } from '../../../services/userService';
import { skipQuickStart, getFirstHealingMeal } from '../../../services/onboardingService';
import { Box, Stepper, Step, StepLabel, StepContent, Button, Typography, Autocomplete, TextField, CircularProgress, Grid } from '@mui/material';

import { motion, AnimatePresence } from 'framer-motion';
import ConfettiModal from '../../Common/ConfettiModal.jsx';
import SweetAlert from 'sweetalert2';
import { dietSteps } from './gettingStartedContent.jsx';
import { API_BASE_URL } from '../../../env-config.js';
import { getAuth } from 'firebase/auth';

export default function GettingStarted() {
  const [activeStep, setActiveStep] = useState(0);
  //const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSkipping, setIsSkipping] = useState(false);
  const navigate = useNavigate();
  const { user, loading, getFreshIdToken, setUser } = useUser();
  const { invalidateSavedRecipes } = useQueryInvalidation();
  const auth = getAuth();

  const capturePosthogEvent = useCallback((eventName, properties = {}) => {
    if (typeof window === 'undefined') return;
    if (!window.posthog || typeof window.posthog.capture !== 'function') return;

    window.posthog.capture(eventName, properties);
  }, []);

  const grantFirstHealingMeal = useCallback(async () => {
    try {
      const token = await getFreshIdToken();
      await getFirstHealingMeal(token);
      invalidateSavedRecipes();
    } catch (error) {
      console.error('(GettingStarted.jsx) - Failed to grant first healing meal:', error);
    }
  }, [getFreshIdToken, invalidateSavedRecipes]);

  // State for the new dropdowns
  const [selectedPrimaryDiet, setSelectedPrimaryDiet] = useState('');
  const [selectedRestrictions, setSelectedRestrictions] = useState([]);
  const [conditionTreating, setConditionTreating] = useState('');
  const [availablePrimaryDiets, setAvailablePrimaryDiets] = useState([]);
  const [availableRestrictions, setAvailableRestrictions] = useState([]);
  const [filteredRestrictions, setFilteredRestrictions] = useState([]);
  const [availableConditions, setAvailableConditions] = useState([]);
  const [dietsLoading, setDietsLoading] = useState(true);
  const [conditionsLoading, setConditionsLoading] = useState(true);
  const [updateError, setUpdateError] = useState('');
  const [restrictionInputValue, setRestrictionInputValue] = useState('');

  useEffect(() => {
    // Fetch diets and conditions when the component mounts
    const fetchPrimaryDiets = async () => {
      setDietsLoading(true);
      try {
        const response = await fetch(`${API_BASE_URL}/api/therapeutic-diets?diet_type=primary`);
        if (!response.ok) throw new Error('Failed to fetch primary diets');
        const data = await response.json();
        setAvailablePrimaryDiets(data);
      } catch (error) {
        console.error('Error fetching primary diets:', error);
        setUpdateError('Could not load primary diet options.');
      } finally {
        setDietsLoading(false);
      }
    };

    const fetchRestrictions = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/therapeutic-diets?diet_type=restriction`);
        if (!response.ok) throw new Error('Failed to fetch diet restrictions');
        const data = await response.json();
        setAvailableRestrictions(data);
      } catch (error) {
        console.error('Error fetching restrictions:', error);
        setUpdateError('Could not load diet restriction options.');
      }
    };

    const fetchConditions = async () => {
      setConditionsLoading(true);
      try {
        const response = await fetch(`${API_BASE_URL}/api/conditions`);
        if (!response.ok) throw new Error('Failed to fetch conditions');
        const data = await response.json();
        setAvailableConditions(data);
      } catch (error) {
        console.error('Error fetching conditions:', error);
        setUpdateError('Could not load condition options.');
      } finally {
        setConditionsLoading(false);
      }
    };

    fetchPrimaryDiets();
    fetchRestrictions();
    fetchConditions();
  }, []);

  // Filter restrictions based on the selected primary diet
  useEffect(() => {
    const exclusionMap = {
      'SCD': ['Gluten-Free Diet'],
      'GAPS': ['Gluten-Free Diet'],
      'Paleo AIP': ['Gluten-Free Diet', 'Dairy-Free Diet', 'Nut-Free Diet'],
      'Low Fiber': ['Nut-Free Diet'],
    };

    const excludedForSelectedDiet = exclusionMap[selectedPrimaryDiet] || [];

    // Filter the list of available restrictions
    const filtered = availableRestrictions.filter(
      (restriction) => !excludedForSelectedDiet.includes(restriction.diet_name)
    );
    setFilteredRestrictions(filtered);

    // Un-select any restrictions that are now excluded
    setSelectedRestrictions((currentRestrictions) =>
      currentRestrictions.filter((restrictionCode) => {
        const restrictionDetails = availableRestrictions.find(r => r.diet_code === restrictionCode);
        return restrictionDetails && !excludedForSelectedDiet.includes(restrictionDetails.diet_name);
      })
    );
  }, [selectedPrimaryDiet, availableRestrictions]);

  if (loading) {
    return <div>Loading...</div>;
  }

  // Dynamically select the steps based on the user's primary diet, with a fallback to default
  const primaryDiet = user?.therapeuticDiets?.[0];
  const steps = dietSteps[primaryDiet] || dietSteps['default'];

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleUpdateProfile = async () => {
    if (!selectedPrimaryDiet || !conditionTreating) {
      setUpdateError('Please select a primary diet and a condition.');
      return;
    }
    setUpdateError('');

    try {
      const idToken = await getFreshIdToken();

      // Separate predefined from custom restrictions
      const predefinedRestrictions = selectedRestrictions.filter(restriction =>
        availableRestrictions.some(ar => ar.diet_code === restriction)
      );
      const customRestrictions = selectedRestrictions.filter(restriction =>
        !availableRestrictions.some(ar => ar.diet_code === restriction)
      );

      const payload = {
        primaryDiet: selectedPrimaryDiet,
        dietaryRestrictions: predefinedRestrictions,
        customDietaryRestrictions: customRestrictions,
        conditionTreating: conditionTreating,
      };

      const response = await fetch(`${API_BASE_URL}/api/users/${auth.currentUser.uid}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        // Optimistically update user context to avoid a full re-render that resets the stepper
        setUser(prev => ({
          ...prev,
          primaryDiet: selectedPrimaryDiet,
          dietaryRestrictions: predefinedRestrictions,
          customDietaryRestrictions: customRestrictions,
          conditionTreating,
        }));

        handleNext(); // Advance to the next step seamlessly
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
      setUpdateError('There was an error saving your selections. Please try again.');
    }
  };

  {/* This may be used at all, might need to remove */ }
  const handleFinish = async (e) => {
    console.log('(GettingStarted.jsx) - handleFinish called');
    e?.preventDefault();
    try {
      console.log('Completing onboarding...');
      await completeOnboarding(getFreshIdToken);

      await grantFirstHealingMeal();

      capturePosthogEvent('app_onboarding_completed', {
        location: 'getting_started',
        primaryDiet: selectedPrimaryDiet,
        conditionTreating,
        dietaryRestrictionsCount: Array.isArray(selectedRestrictions) ? selectedRestrictions.length : 0,
      });

      // Optimistically mark onboarding as complete in context for immediate navigation logic
      setUser(prev => ({
        ...prev,
        onboarding: {
          ...prev.onboarding,
          onboardingComplete: true
        }
      }));
      //console.log('Onboarding complete, showing modal.');
      //setIsModalOpen(true);
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
      SweetAlert.fire({
        title: 'Error!',
        text: 'Could not save your progress. Please try again.',
        icon: 'error',
        confirmButtonText: 'OK'
      });
    }
  };

  // Finish onboarding and then navigate the user to their "first win" destination.
  const navigateToFirstWin = async (route) => {
    console.log('(GettingStarted.jsx) - navigateToFirstWin called, route:', route);

    try {
      console.log('Completing onboarding via navigateToFirstWin...');
      await completeOnboarding(getFreshIdToken);

      await grantFirstHealingMeal();

      capturePosthogEvent('app_onboarding_completed', {
        location: 'getting_started',
        primaryDiet: selectedPrimaryDiet,
        conditionTreating,
        dietaryRestrictionsCount: Array.isArray(selectedRestrictions) ? selectedRestrictions.length : 0,
        nextRoute: route,
      });

      // Optimistically mark onboarding as complete so ProtectedRoute logic updates immediately.
      setUser(prev => ({
        ...prev,
        onboarding: {
          ...prev.onboarding,
          onboardingComplete: true
        }
      }));

      // Show the celebratory confetti modal just like handleFinish.
      //setIsModalOpen(true);
    } catch (error) {
      console.error('Failed to complete onboarding via navigateToFirstWin:', error);
      // Fall through to navigation even if the request fails so the user is not blocked.
    }

    SweetAlert.fire({
      title: 'Great!',
      text: 'Let\'s get you to your first recipe.',
      icon: 'success',
      timer: 2000,
      showConfirmButton: false,
    }).then(() => {
      navigate(route);
    });
  };

  const handleSkipGuide = async () => {
    console.log('Skip button clicked.');
    if (window.umami) {
      window.umami.track('quick_start_skip_click', { source: 'quick_start_guide' });
    }
    setIsSkipping(true);
    try {
      const response = await skipQuickStart(getFreshIdToken);
      console.log('(GettingStarted.jsx) - Server response:', response.message);
      // Optimistically update context so ProtectedRoute immediately reflects the skip
      setUser(prev => ({
        ...prev,
        onboarding: {
          ...prev.onboarding,
          quickStartSkipped: true
        }
      }));
      navigate('/guidebook');
    } catch (error) {
      console.error('Failed to skip the quick start guide:', error);
      SweetAlert.fire({
        icon: 'error',
        title: 'Oops...',
        text: 'Could not save your preference. Please try again.',
      });
    } finally {
      setIsSkipping(false);
    }
  };

  const handleNavigateToApp = () => {
    navigate('/ask-kay');
  };

  return (
    <Box sx={{
      display: 'flex',
      flexDirection: { xs: 'column', md: 'row' },
      p: 3,
      gap: 4
    }}>
      {/* Image and Header Column (Top on Mobile, Right on Desktop) */}
      <Box sx={{ width: { xs: '100%', md: '50%' }, order: { xs: 1, md: 2 }, textAlign: 'center', p: 2 }}>
        <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 'semibold' }}>
          Get safe therapeutic recipes for your health condition.
        </Typography>
        <Box
          component="img"
          src="https://storage.googleapis.com/meadow_mentor_public_media/images/onboarding_tease_image_v3.webp"
          alt="Preview of therapeutic recipes available in Meadow Mentor"
          sx={{
            width: '100%',
            maxWidth: '450px',
            my: 2,
          }}
        />
      </Box>

      {/* Stepper Column (Bottom on Mobile, Left on Desktop) */}
      <Box sx={{ width: { xs: '100%', md: '50%' }, order: { xs: 2, md: 1 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Set Up Diet Plan
          </Typography>
          <Button
            onClick={handleSkipGuide}
            disabled={isSkipping}
            variant="text"
            sx={{ mb: 2 }}
          >
            {isSkipping ? <CircularProgress size={24} /> : 'Skip for now'}
          </Button>
        </Box>

        <Typography variant="h5" component="h2" gutterBottom>
          Goal: Set up your therapeutic diet plan
        </Typography>
        <Typography variant="h6" component="p" gutterBottom color="text.secondary">
          Less than 1 minute to complete
        </Typography>

        <Stepper activeStep={activeStep} orientation="vertical">
          {steps.map((step, index) => (
            <Step key={step.label} active>
              <StepLabel>
                <Typography variant="h6">{step.label}</Typography>
              </StepLabel>
              <StepContent TransitionProps={{ timeout: 0 }}>
                <AnimatePresence initial={false}>
                  {activeStep === index && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.4, ease: 'easeInOut' }}
                      style={{ overflow: 'hidden' }}
                    >
                      <Box sx={{ pt: 1, pb: 2 }}>
                        <Typography variant="h5" sx={{ mt: 1, mb: 1 }}>
                          {typeof step.title === 'function' ? step.title(user) : step.title}
                        </Typography>
                        {step.image && (
                          <Box
                            component="img"
                            src={step.image}
                            alt={step.title}
                            sx={{ width: '100%', borderRadius: '16px', boxShadow: 3, my: 2 }}
                          />
                        )}
                        <Typography>{step.description}</Typography>
                        {typeof step.content === 'function' ? step.content({
                          user,
                          selectedPrimaryDiet,
                          setSelectedPrimaryDiet,
                          selectedRestrictions,
                          setSelectedRestrictions,
                          conditionTreating,
                          setConditionTreating,
                          availablePrimaryDiets,
                          filteredRestrictions, // Pass filtered list to content
                          availableConditions,
                          dietsLoading,
                          conditionsLoading,
                          updateError,
                          navigateToFirstWin,
                          restrictionInputValue,
                          setRestrictionInputValue
                        }) : step.content}
                        <Box sx={{ mb: 2, mt: 2 }}>
                          <div>
                            <Button
                              variant="contained"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                if (!step.cta) return; // no default CTA when undefined
                                if (step.cta === 'Create My Plan') {
                                  handleUpdateProfile();
                                } else if (index === steps.length - 1) {
                                  handleFinish(e);
                                } else {
                                  handleNext();
                                }
                              }}
                              sx={{ mt: 1, mr: 1, display: step.cta ? 'inline-flex' : 'none' }}
                              type="button"
                            >
                              {index === steps.length - 1 ? 'Finish' : step.cta}
                            </Button>
                            <Button
                              disabled={index === 0}
                              onClick={handleBack}
                              sx={{ mt: 1, mr: 1 }}
                            >
                              Back
                            </Button>
                          </div>
                        </Box>
                      </Box>
                    </motion.div>
                  )}
                </AnimatePresence>
              </StepContent>
            </Step>
          ))}
        </Stepper>
      </Box>

      {/* <ConfettiModal 
        open={isModalOpen} 
        onClose={handleModalClose} 
        onNavigate={handleNavigateToApp} 
      /> */}
    </Box>
  );
}