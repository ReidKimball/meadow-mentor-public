/**
 * @file AskKay.jsx
 * @module pages/AskKay
 * @description This file exports the main chat component for the "Ask Kay" feature.
 * It includes sub-components for displaying messages (`Message`) and handling user input (`ChatInput`).
 * The `AskKay` component orchestrates the entire chat experience, managing message state, * handling user interactions, and communicating with backend services for AI responses and chat history.
 * It supports features like displaying recipes, handling API limits, showing chat history, and managing premium user upgrades.
 * @requires react
 * @requires react-router-dom
 * @requires @mui/material
 * @requires lucide-react
 * @requires framer-motion
 * @requires react-markdown
 * @requires module:context/UserContext
 * @requires module:services/langchainService
 * @requires module:services/onboardingService
 * @requires module:context/ApiLimitsContext
 * @requires module:context/RecipeContext
 * @requires module:components/Pages/AskKay/ChatHistoryModal
 * @requires module:components/Pages/AskKay/WelcomeMessage
 * @requires module:components/Pages/AskKay/KayThinkingIndicator
 * @requires module:components/Common/UpgradeModal
 * @requires module:utils/http-errors
 */

import { useState, useEffect, useRef, useCallback, useLayoutEffect } from "react";
import { Box, Paper, Typography, CircularProgress, Avatar, IconButton, Button } from "@mui/material";
import { Link as RouterLink } from 'react-router';
import { History, ArrowUp, CheckCircle, XCircle, Maximize, Minimize } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import PropTypes from 'prop-types';
import { useUser } from '../../../../context/UserContext.jsx';
import { useQueryInvalidation } from '../../../../hooks/useUserQueries.js';

import { API_BASE_URL } from '../../../../env-config.js';

import { askKay, getChatSessionMessages, clearActiveChatSession, setActiveChatSession } from '../../../../services/langchainService';
import { getFirstHealingMeal, completeFirstHealingMeal, completeAskKayIntro, getAskKayIntro } from '../../../../services/onboardingService'; // Import onboarding services
import { useRecipes } from '../../../../context/RecipeContext'; // Import useRecipes
import ChatHistoryModal from './ChatHistoryModal';
import ChatInput from './ChatInput.jsx';
import Message from './Message.jsx';
import StatusNode from './StatusNode.jsx';
const askKayBg = 'https://storage.googleapis.com/meadow_mentor_public_media/images/askkay_bg.webp';
//const kayTheOwl = 'https://storage.googleapis.com/meadow_mentor_public_media/images/chef_kay_in_sun_v4_headerbar.webp';
import WelcomeMessage from './WelcomeMessage.jsx';
import KayThinkingIndicator from './KayThinkingIndicator.jsx';
import GeneratedRecipeSummaryCard from '../../recipes/GeneratedRecipeSummaryCard.jsx';
import UpgradeModal from '../../../Common/UpgradeModal.jsx';
import CreditConfirmationModal from '../../../Common/CreditConfirmationModal.jsx';
import CreditsRequiredModal from '../../../Common/CreditsRequiredModal.jsx';
import { HttpError } from '../../../../utils/http-errors.js';
import RecipeSkeletonLoader from './RecipeSkeletonLoader.jsx';
import Alert from '@mui/material/Alert';

// --- Main Component --- //

/**
 * @function AskKay
 * @description The primary component for the "Ask Kay" chat interface.
 * It orchestrates the chat flow, including sending and receiving messages, managing chat sessions,
 * displaying welcome messages or a special "first healing meal" view, and handling API interactions.
 * It supports features like displaying recipes, handling API limits, showing chat history, and managing premium user upgrades.
 * @param {object} props - The component props.
 * @param {boolean} [props.isFirstHealingMeal=false] - If true, displays a special view for the user's first recipe.
 * @returns {JSX.Element} The main chat interface.
 */
function AskKay({ isFirstHealingMeal = false }) {
  const { getFreshIdToken, user, setUser, setSessionContext } = useUser();
  const { addGeneratedRecipe, refetchSavedRecipes, upsertSavedRecipe, upsertGeneratedRecipe } = useRecipes(); // Use the recipe context
  const { setCreditsOptimistic, invalidateUser, invalidateAllRecipes, invalidateSessionContext } = useQueryInvalidation(); // TanStack Query invalidation
  const [messages, setMessages] = useState([]);
  const [statusNodes, setStatusNodes] = useState([]); // New state for status updates
  const [currentChatId, setCurrentChatId] = useState(null);

  const [isLoading, setIsLoading] = useState(false);
  const [questionToType, setQuestionToType] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [upgradeModalContent, setUpgradeModalContent] = useState({ title: '', message: '' });
  const [showThinkingIndicator, setShowThinkingIndicator] = useState(false);
  const [isGeneratingRecipe, setIsGeneratingRecipe] = useState(false); // For skeleton loader
  const scrollContainerRef = useRef(null);
  const pendingUserScrollMessageIdRef = useRef(null);
  const prevMessagesLengthRef = useRef(0);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const hasFetchedHealingMeal = useRef(false); // Add this ref
  const hasCompletedHealingMeal = useRef(false);
  const hasTriggeredIntro = useRef(false); // Track if intro flow has been triggered

  // State for the First Healing Meal flow
  const [healingMealData, setHealingMealData] = useState(null);
  const [isHealingMealLoading, setIsHealingMealLoading] = useState(false);
  const [healingMealError, setHealingMealError] = useState(null);

  // State for credit confirmation flow
  const [showCreditConfirmationModal, setShowCreditConfirmationModal] = useState(false);
  const [creditConfirmationData, setCreditConfirmationData] = useState(null);
  const [pendingMessageData, setPendingMessageData] = useState(null); // Store message/file while waiting for confirmation

  // State for insufficient credits flow
  const [showCreditsRequiredModal, setShowCreditsRequiredModal] = useState(false);
  const [creditsRequiredData, setCreditsRequiredData] = useState(null);

  const [showCreditSpendConfirmationsInFuture, setShowCreditSpendConfirmationsInFuture] = useState(true);

  const createLocalMessageId = useCallback(() => {
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }, []);

  useEffect(() => {
    const nextValue = user?.preferences?.showCreditSpendConfirmations;
    if (typeof nextValue === 'boolean') {
      setShowCreditSpendConfirmationsInFuture(nextValue);
    }
  }, [user?.preferences?.showCreditSpendConfirmations]);

  const updateShowCreditSpendConfirmationsInFuture = useCallback(async (nextValue) => {
    setShowCreditSpendConfirmationsInFuture(nextValue);

    setUser((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        preferences: {
          ...(prev.preferences || {}),
          showCreditSpendConfirmations: nextValue,
        },
      };
    });

    try {
      const token = await getFreshIdToken();
      const firebaseUID = user?.firebaseUID;
      if (!firebaseUID) return;

      const response = await fetch(`${API_BASE_URL}/api/users/${firebaseUID}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          preferences: {
            showCreditSpendConfirmations: nextValue,
          },
        }),
      });

      if (response.ok) {
        const updatedUser = await response.json();
        setUser(updatedUser);
        invalidateUser();
      }
    } catch (error) {
      console.error('[AskKay] Failed to update credit confirmation preference:', error);
    }
  }, [API_BASE_URL, getFreshIdToken, invalidateUser, setUser, user?.firebaseUID]);

  const capturePosthogEvent = useCallback((eventName, properties = {}) => {
    if (typeof window === 'undefined') return;
    if (!window.posthog || typeof window.posthog.capture !== 'function') return;

    window.posthog.capture(eventName, properties);
  }, []);

  const handleSelectChat = useCallback(async (sessionId) => {
    setIsLoading(true);
    setStatusNodes([]); // Clear statuses when loading history
    try {
      const fetchedMessages = await getChatSessionMessages(sessionId, getFreshIdToken);
      setMessages(fetchedMessages);
      setCurrentChatId(sessionId);
    } catch (error) {
      console.error('Failed to load chat session:', error.message);
      // If the session is not found, it's likely deleted. Clear it from the user's profile.
      if (error instanceof HttpError && error.status === 404) {
        console.log(`[AskKay] Chat session ${sessionId} not found. Clearing from user profile.`);
        await clearActiveChatSession(getFreshIdToken);
      }
      setMessages([{ role: 'assistant', content: `Error: Could not load chat. ${error.message}`, _id: createLocalMessageId() }]);
    } finally {
      setIsLoading(false);
    }
  }, [getFreshIdToken, createLocalMessageId]);

  // --- Load last active chat on initial mount ---
  useEffect(() => {
    // Only run when we have a stable user UID, and not if it's the first healing meal flow
    // or if messages are already loaded.
    if (user?.firebaseUID && user?.lastOpenAskKayChat && !isFirstHealingMeal && messages.length === 0 && !isLoading) {
      console.log(`[AskKay] Found last open chat ID: ${user.lastOpenAskKayChat}. Loading session.`);
      handleSelectChat(user.lastOpenAskKayChat);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.firebaseUID, isFirstHealingMeal]); // Depend on UID to be stable across non-essential user updates.

  // --- Ask Kay Intro Flow for first-time users ---
  const isFirstAskKayVisit = user?.onboarding?.onboardingComplete &&
    !user?.onboarding?.askKayIntroShown &&
    !isFirstHealingMeal &&
    messages.length === 0 &&
    !currentChatId;

  useEffect(() => {
    const showIntroMessage = async () => {
      if (isFirstAskKayVisit && !hasTriggeredIntro.current && !isLoading) {
        hasTriggeredIntro.current = true;
        console.log('[AskKay] Showing Ask Kay intro message for first-time user');

        try {
          // Fetch the intro message content from the backend
          const { introContent } = await getAskKayIntro(getFreshIdToken);

          // Display the intro message locally (not persisted to backend yet)
          const introMessage = {
            role: 'assistant',
            content: introContent,
            _id: createLocalMessageId(),
          };
          setMessages([introMessage]);

          // Note: We don't mark as complete here yet. We wait for the user to engage.
          // The intro message is just local until they start a chat.
        } catch (err) {
          console.error('Error in Ask Kay intro flow:', err);
          // Don't show error to user - just let them continue normally
        }
      }
    };

    showIntroMessage();
  }, [isFirstAskKayVisit, getFreshIdToken, setUser, createLocalMessageId, isLoading]);

  // --- Fetch First Healing Meal ---
  useEffect(() => {
    if (isFirstHealingMeal && !hasFetchedHealingMeal.current && user?.firebaseUID) {
      const fetchMeal = async () => {
        setIsHealingMealLoading(true);
        setHealingMealError(null);
        try {
          const token = await getFreshIdToken();
          const data = await getFirstHealingMeal(token);
          setHealingMealData(data);
          hasFetchedHealingMeal.current = true;

          // Invalidate recipes so they show up in saved recipes
          invalidateAllRecipes();
        } catch (error) {
          console.error('Error fetching first healing meal:', error);
          setHealingMealError(error.message || 'Failed to fetch your first healing meal.');
        } finally {
          setIsHealingMealLoading(false);
        }
      };
      fetchMeal();
    }
  }, [isFirstHealingMeal, user?.firebaseUID, getFreshIdToken, setUser, invalidateAllRecipes]);

  useEffect(() => {
    if (!isFirstHealingMeal) return;

    return () => {
      if (!hasFetchedHealingMeal.current) return;
      if (hasCompletedHealingMeal.current) return;

      hasCompletedHealingMeal.current = true;

      (async () => {
        try {
          const token = await getFreshIdToken();
          await completeFirstHealingMeal(token);
        } catch (error) {
          console.error('Error completing first healing meal:', error);
        }
      })();
    };
  }, [isFirstHealingMeal, getFreshIdToken]);

  useLayoutEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const pendingId = pendingUserScrollMessageIdRef.current;
    if (!pendingId) return;

    const anchorEl = container.querySelector(`[data-message-id="${pendingId}"]`);
    if (!anchorEl) return;

    const targetScrollTop = anchorEl.offsetTop;
    const maxScrollTop = container.scrollHeight - container.clientHeight;

    // If we don't have enough content BELOW the user message yet (common while Kay hasn't
    // streamed much), the browser will clamp scrollTop and the message can't be aligned to the top.
    // In that case, keep the pending id so we retry on the next messages update.
    if (maxScrollTop >= targetScrollTop) {
      container.scrollTo({ top: targetScrollTop, behavior: 'smooth' });
      pendingUserScrollMessageIdRef.current = null;
    } else {
      container.scrollTop = maxScrollTop;
    }
  }, [messages]);

  useEffect(() => {
    const prevLen = prevMessagesLengthRef.current;
    const nextLen = messages.length;
    prevMessagesLengthRef.current = nextLen;

    const lastMessage = messages[nextLen - 1];
    if (!scrollContainerRef.current || nextLen <= prevLen || !lastMessage) return;

    if (lastMessage.role === 'recipe') {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages]);

  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      // If the last message is from the assistant and contains recipe data, hide the skeleton.
      if (lastMessage.role === 'assistant' && lastMessage.content.includes('<recipe_json>')) {
        setIsGeneratingRecipe(false);
      } else if (lastMessage.role === 'recipe') {
        // Also hide if the last message is a dedicated recipe object.
        setIsGeneratingRecipe(false);
      }
    }
  }, [messages]);

  useEffect(() => {
    console.log('[ASKKAY] isGeneratingRecipe changed:', isGeneratingRecipe);
  }, [isGeneratingRecipe]);

  const trackClick = () => {

    // Check if umami is available in the window object
    if (typeof window !== 'undefined' && window.umami) {
      window.umami.track('ask_kay_button_click', {
        source: 'ask_kay_page',
        location: 'ask_kay_button',
        button_text: 'Send Msg to Kay'
      });
      //console.log(`(Coach_Service.jsx - Umami) - Ask Kay button clicked`);
    }
  };

  const handleSend = async (message, file) => {
    trackClick(); // Track the click event

    const isFirstMessageInIntro = hasTriggeredIntro.current && !currentChatId;
    capturePosthogEvent('app_chefchat_sent', {
      location: 'ask_kay',
      hasAttachment: !!file,
      isAskKayIntro: isFirstMessageInIntro,
    });

    setIsLoading(true);
    setStatusNodes([]); // Clear previous status updates

    // Create a user message object that includes the attachment for local display
    const userMessage = {
      role: 'user',
      content: message,
      _id: createLocalMessageId(),
      attachment: null,
    };

    if (file) {
      // Create a local URL for the image to display it immediately
      userMessage.attachment = { type: 'image', url: URL.createObjectURL(file) };
    }

    pendingUserScrollMessageIdRef.current = userMessage._id;
    setMessages(prev => [...prev, userMessage]);
    setShowThinkingIndicator(true); // Show thinking indicator immediately

    let assistantMessageId = null; // Use this to track the ID of the assistant's message
    let recipeDetected = false; // To track if we've triggered the skeleton loader

    try {
      const response = await askKay(
        message,
        file,
        currentChatId,
        getFreshIdToken,
        { isAskKayIntro: isFirstMessageInIntro }
      );

      // If this was the first message in the intro flow, mark intro as complete
      if (isFirstMessageInIntro) {
        completeAskKayIntro(getFreshIdToken).catch(err =>
          console.error('Failed to mark Ask Kay intro complete:', err)
        );

        // Update user state so intro doesn't show again
        setUser(prev => ({
          ...prev,
          onboarding: {
            ...prev.onboarding,
            askKayIntroShown: true
          }
        }));
      }

      // Handle streaming response
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let sseBuffer = ""; // Buffer to accumulate partial SSE chunks across reads

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        // Accumulate chunk data into buffer (stream-safe decode)
        sseBuffer += decoder.decode(value, { stream: true });

        // Check for recipe tag and show skeleton loader ONCE
        if (!recipeDetected && sseBuffer.includes('<recipe_json>')) {
          recipeDetected = true;
          setIsGeneratingRecipe(true);
        }

        // Split into complete SSE events by blank line (handle both \n\n and \r\n\r\n)
        const events = sseBuffer.split(/\r?\n\r?\n/);
        // Keep the last partial (if any) for the next iteration
        sseBuffer = events.pop() || "";

        // Process each complete SSE event
        for (const evt of events) {
          // Parse standard SSE lines; concatenate all data: lines (support multi-line data)
          const evtLines = evt.split(/\r?\n/);
          let dataPayload = "";
          for (const l of evtLines) {
            if (l.startsWith("data:")) {
              dataPayload += l.slice(5).trimStart() + "\n"; // keep newline between data: lines per SSE spec
            }
          }

          const jsonString = dataPayload.trimEnd();
          if (!jsonString) continue; // ignore non-data events

          try {
            const data = JSON.parse(jsonString);

            if (data.event === "newChatCreated") {
              setCurrentChatId(data.chatId);
              setUser(prevUser => ({ ...prevUser, lastOpenAskKayChat: data.chatId }));
            } else if (data.event === "statusUpdate") {
              setShowThinkingIndicator(false); // Hide thinking on first status update

              const newStatus = data.message; // This is now our structured object

              if (newStatus.type === 'response') {
                // This is a direct conversational response, not a status.
                const responseMessage = {
                  role: 'assistant',
                  content: [{ type: 'text', content: newStatus.message }],
                  _id: createLocalMessageId(),
                };
                setMessages(prev => [...prev, responseMessage]);
              } else if (newStatus.type === 'status') {
                // This is a status update for a phase.
                // --- Update existing status or add new one ---
                setStatusNodes(prevStatuses => {
                  const existingStatusIndex = prevStatuses.findIndex(
                    (s) => s.phase === newStatus.phase
                  );
                  if (existingStatusIndex !== -1) {
                    const updatedStatuses = [...prevStatuses];
                    updatedStatuses[existingStatusIndex] = newStatus;
                    return updatedStatuses;
                  }
                  return [...prevStatuses, newStatus];
                });
              } else if (newStatus.type === 'user_context_update') {
                if (newStatus.context) {
                  setSessionContext(newStatus.context); // Update UserContext for immediate local use
                  invalidateSessionContext(); // Invalidate TanStack Query cache so other components refetch
                }
              }
            } else if (data.event === "textStreamEnded") {
              console.log("[ASKKAY] textStreamEnded received - enabling skeleton");
              setIsGeneratingRecipe(true);
            } else if (data.event === "error") {
              console.error("[ASKKAY] Received error event from backend:", data.message);
              // Hide skeleton loader and thinking indicator
              setIsGeneratingRecipe(false);
              setShowThinkingIndicator(false);

              // Add an error message to the chat
              const errorMessage = { role: 'assistant', content: data.message, _id: createLocalMessageId() };
              setMessages(prev => [...prev, errorMessage]);
            } else if (data.event === "metadata") {
              // Update credit balance immediately via TanStack Query
              if (data.creditsRemaining !== undefined && data.creditsRemaining !== null) {
                setCreditsOptimistic(data.creditsRemaining); // Instant UI update
                invalidateUser(); // Background refresh for consistency
              }
            } else if (data.event === "creditConfirmation") {
              setShowThinkingIndicator(false);

              if (!showCreditSpendConfirmationsInFuture) {
                setIsLoading(true);
                setShowThinkingIndicator(true);
                await processConfirmedCreditAction({
                  message,
                  file,
                  pendingId: data.pendingId,
                });
                return;
              }

              setCreditConfirmationData({
                pendingId: data.pendingId,
                featureName: data.featureName,
                cost: data.cost,
                currentBalance: data.currentBalance,
                balanceAfter: data.balanceAfter,
              });
              setPendingMessageData({ message, file });
              setShowCreditConfirmationModal(true);
              setIsLoading(false);
              return;
            } else if (data.event === "insufficientCredits") {
              // Insufficient credits - show modal
              setShowThinkingIndicator(false);
              setCreditsRequiredData({
                featureName: data.featureName,
                creditsRequired: data.creditsRequired,
                creditsAvailable: data.creditsAvailable,
              });
              setShowCreditsRequiredModal(true);
              setIsLoading(false);
              // Remove the user message we added since the request was aborted
              setMessages(prev => prev.slice(0, -1));
              return; // Stop processing
            }
            // Handle streaming text from both recipe (token) and general QA (conversationalText) flows
            else if (data.token || data.conversationalText) {
              if (!assistantMessageId) {
                // First token received: hide thinking indicator and create the initial assistant message bubble.
                setShowThinkingIndicator(false);

                const newAssistantMessage = {
                  role: 'assistant',
                  content: [{ type: 'text', content: data.token || data.conversationalText }],
                  _id: createLocalMessageId(),
                };
                assistantMessageId = newAssistantMessage._id;
                setMessages(prev => [...prev, newAssistantMessage]);
              } else {
                // Subsequent tokens: concatenate to the last text content object
                setMessages(prev => prev.map((msg) => {
                  if (msg._id === assistantMessageId) {
                    const updatedContent = [...msg.content];
                    const lastContentIndex = updatedContent.length - 1;

                    // If the last content object is text, concatenate the token
                    if (lastContentIndex >= 0 && updatedContent[lastContentIndex].type === 'text') {
                      updatedContent[lastContentIndex] = {
                        ...updatedContent[lastContentIndex],
                        content: updatedContent[lastContentIndex].content + (data.token || data.conversationalText)
                      };
                    } else {
                      // If no text content exists or last is not text, create new text object
                      updatedContent.push({ type: 'text', content: data.token || data.conversationalText });
                    }

                    return { ...msg, content: updatedContent };
                  }
                  return msg;
                }));
              }
            } else if (data.event === "recipeCard") {
              console.log("[ASKKAY] recipeCard received - disabling skeleton. Recipe:", data.recipe);
              console.log("[ASKKAY] Recipe _id check:", data.recipe?._id ? `Has _id: ${data.recipe._id}` : "NO _ID FOUND!");
              // Backend sends the saved recipe directly on `recipe` (not nested)
              const newRecipe = data.recipe;

              if (newRecipe?._id && !newRecipe?.isFirstHealingMeal) {
                capturePosthogEvent('app_recipe_generated', {
                  recipeId: newRecipe._id,
                  recipeTitle: newRecipe.recipeTitle,
                  source: 'ask_kay',
                });
              }

              // Hide skeleton loader and add the final recipe card
              setIsGeneratingRecipe(false);
              setMessages(prev => [...prev, { role: 'recipe', ...newRecipe, tempId: createLocalMessageId() }]);
              assistantMessageId = null; // Reset assistant message ID to force new message for post-recipe text

              // Check if this is the "First Healing Meal" and mark as complete if needed
              if (newRecipe.isFirstHealingMeal && !user?.onboarding?.firstHealingMealCompleted) {
                console.log("[ASKKAY] Recipe identified as First Healing Meal. Marking onboarding step as complete.");
                completeFirstHealingMeal(getFreshIdToken).then(() => {
                  // Optimistically update user context so the UI reflects the change immediately
                  setUser(prev => ({
                    ...prev,
                    onboarding: {
                      ...prev.onboarding,
                      firstHealingMealCompleted: true
                    }
                  }));
                }).catch(err => console.error("Failed to complete first healing meal via chat:", err));
              }

              // Recipe is already saved in the database by the backend, just add to context
              console.log("[ASKKAY] Adding recipe to RecipeContext (recipe already saved by backend)");
              console.log("[ASKKAY] Recipe being added to context:", { _id: newRecipe._id, title: newRecipe.recipeTitle });

              // Strip UI-only flags before putting into the global context to prevent
              // unintended regenerations on other pages (e.g. My Recipes).
              const { shouldGenerateImage: _, ...recipeForContext } = newRecipe;
              addGeneratedRecipe(recipeForContext);
              upsertGeneratedRecipe(recipeForContext);
              upsertSavedRecipe(recipeForContext);
              invalidateAllRecipes(); // TanStack Query: ensure /saved-recipes page sees new recipe
            } else if (data.event === "shoppingListUpdated") {
              if (typeof window !== 'undefined') {
                window.dispatchEvent(
                  new CustomEvent('shoppingListUpdated', {
                    detail: data.shoppingList || null,
                  })
                );
              }
            }
          } catch (e) {
            console.error('Failed to parse complete SSE event:', evt, e);
          }
        }
      }
    } catch (err) {
      setShowThinkingIndicator(false); // Hide thinking indicator on error
      setIsGeneratingRecipe(false); // Hide skeleton on error
      console.error(`Failed to send message:`, err);
      let errorMessageContent = 'An unexpected error occurred. Please try again.';

      if (err instanceof HttpError) {
        if (err.status === 429) {
          setUpgradeModalContent({
            title: 'Chat Limit Reached',
            message: 'You have reached the maximum number of messages you can send to Kay on the Basic plan.',
          });
          setUpgradeModalOpen(true);
          // We don't want to show an error message in the chat for this case
          return;
        } else {
          errorMessageContent = err.message || 'Failed to get a response from Kay.';
        }
      }

      // If streaming never started, add a new error message bubble
      const errorMessage = { role: 'assistant', content: errorMessageContent, _id: createLocalMessageId() };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      // Clean up the blob URL after the request is finished to prevent memory leaks
      if (userMessage.attachment?.url) {
        URL.revokeObjectURL(userMessage.attachment.url);
      }

      setIsLoading(false);
      setShowThinkingIndicator(false); // Ensure thinking indicator is always turned off
      setIsGeneratingRecipe(false); // Ensure skeleton is always turned off on finish/error
      // Don't clear status here, let it persist until the next message
    }
  };

  const handleNewChat = () => {
    // When user explicitly starts a new chat, we should clear the last open chat reference.
    // This will be handled by a new service function.
    setMessages([]);
    setCurrentChatId(null);
    setStatusNodes([]); // Clear statuses on new chat
  };

  const handleQuestionSelect = (question) => {
    if (isLoading || isTyping) return;
    handleSend(question, null);
  };

  // Credit confirmation handlers
  const processConfirmedCreditAction = useCallback(async ({ message, file, pendingId }) => {
    try {
      const response = await askKay(message, file, currentChatId, getFreshIdToken, {
        pendingCreditId: pendingId,
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let sseBuffer = "";
      let assistantMessageId = null;
      let recipeDetected = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        sseBuffer += decoder.decode(value, { stream: true });

        if (!recipeDetected && sseBuffer.includes('<recipe_json>')) {
          recipeDetected = true;
          setIsGeneratingRecipe(true);
        }

        const events = sseBuffer.split(/\r?\n\r?\n/);
        sseBuffer = events.pop() || "";

        for (const evt of events) {
          const evtLines = evt.split(/\r?\n/);
          let dataPayload = "";
          for (const l of evtLines) {
            if (l.startsWith("data:")) {
              dataPayload += l.slice(5).trimStart() + "\n";
            }
          }

          const jsonString = dataPayload.trimEnd();
          if (!jsonString) continue;

          try {
            const data = JSON.parse(jsonString);

            if (data.event === "newChatCreated") {
              setCurrentChatId(data.chatId);
              setUser(prevUser => ({ ...prevUser, lastOpenAskKayChat: data.chatId }));
            } else if (data.event === "statusUpdate") {
              setShowThinkingIndicator(false);
              const newStatus = data.message;
              if (newStatus.type === 'response') {
                const responseMessage = {
                  role: 'assistant',
                  content: [{ type: 'text', content: newStatus.message }],
                  _id: createLocalMessageId(),
                };
                setMessages(prev => [...prev, responseMessage]);
              } else if (newStatus.type === 'status') {
                setStatusNodes(prevStatuses => {
                  const existingStatusIndex = prevStatuses.findIndex(s => s.phase === newStatus.phase);
                  if (existingStatusIndex !== -1) {
                    const updatedStatuses = [...prevStatuses];
                    updatedStatuses[existingStatusIndex] = newStatus;
                    return updatedStatuses;
                  }
                  return [...prevStatuses, newStatus];
                });
              } else if (newStatus.type === 'user_context_update') {
                if (newStatus.context) {
                  setSessionContext(newStatus.context);
                  invalidateSessionContext();
                }
              }
            } else if (data.event === "error") {
              setIsGeneratingRecipe(false);
              setShowThinkingIndicator(false);
              const errorMessage = { role: 'assistant', content: data.message, _id: createLocalMessageId() };
              setMessages(prev => [...prev, errorMessage]);
            } else if (data.event === "metadata") {
              if (data.creditsRemaining !== undefined && data.creditsRemaining !== null) {
                setCreditsOptimistic(data.creditsRemaining);
                invalidateUser();
              }
            } else if (data.token || data.conversationalText) {
              if (!assistantMessageId) {
                setShowThinkingIndicator(false);
                const newAssistantMessage = {
                  role: 'assistant',
                  content: [{ type: 'text', content: data.token || data.conversationalText }],
                  _id: createLocalMessageId(),
                };
                assistantMessageId = newAssistantMessage._id;
                setMessages(prev => [...prev, newAssistantMessage]);
              } else {
                setMessages(prev => prev.map((msg) => {
                  if (msg._id === assistantMessageId) {
                    const updatedContent = [...msg.content];
                    const lastContentIndex = updatedContent.length - 1;
                    if (lastContentIndex >= 0 && updatedContent[lastContentIndex].type === 'text') {
                      updatedContent[lastContentIndex] = {
                        ...updatedContent[lastContentIndex],
                        content: updatedContent[lastContentIndex].content + (data.token || data.conversationalText)
                      };
                    } else {
                      updatedContent.push({ type: 'text', content: data.token || data.conversationalText });
                    }
                    return { ...msg, content: updatedContent };
                  }
                  return msg;
                }));
              }
            } else if (data.event === "recipeCard") {
              const newRecipe = data.recipe;

              if (newRecipe?._id && !newRecipe?.isFirstHealingMeal) {
                capturePosthogEvent('app_recipe_generated', {
                  recipeId: newRecipe._id,
                  recipeTitle: newRecipe.recipeTitle,
                  source: 'ask_kay',
                });
              }

              setIsGeneratingRecipe(false);
              setMessages(prev => [...prev, { role: 'recipe', ...newRecipe, tempId: createLocalMessageId() }]);

              if (newRecipe.isFirstHealingMeal && !user?.onboarding?.firstHealingMealCompleted) {
                completeFirstHealingMeal(getFreshIdToken).then(() => {
                  setUser(prev => ({
                    ...prev,
                    onboarding: {
                      ...prev.onboarding,
                      firstHealingMealCompleted: true
                    }
                  }));
                }).catch(err => console.error("Failed to complete first healing meal via chat:", err));
              }

              const { shouldGenerateImage: _, ...recipeForContext } = newRecipe;
              addGeneratedRecipe(recipeForContext);
              upsertGeneratedRecipe(recipeForContext);
              upsertSavedRecipe(recipeForContext);
              invalidateAllRecipes();
            } else if (data.event === "shoppingListUpdated") {
              if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('shoppingListUpdated', { detail: data.shoppingList || null }));
              }
            }
          } catch (e) {
            console.error('Failed to parse SSE event:', evt, e);
          }
        }
      }
    } catch (err) {
      console.error('Failed to process confirmed credit action:', err);
      const errorMessage = { role: 'assistant', content: 'Failed to generate recipe. Your credits were not charged.', _id: createLocalMessageId() };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setShowThinkingIndicator(false);
      setIsGeneratingRecipe(false);
    }
  }, [
    addGeneratedRecipe,
    capturePosthogEvent,
    completeFirstHealingMeal,
    createLocalMessageId,
    currentChatId,
    getFreshIdToken,
    invalidateAllRecipes,
    invalidateSessionContext,
    invalidateUser,
    setCreditsOptimistic,
    setSessionContext,
    setUser,
    upsertGeneratedRecipe,
    upsertSavedRecipe,
    user?.onboarding?.firstHealingMealCompleted,
  ]);

  const handleCreditConfirm = async () => {
    if (!creditConfirmationData || !pendingMessageData) return;

    setShowCreditConfirmationModal(false);
    const { message, file } = pendingMessageData;
    const { pendingId } = creditConfirmationData;

    // Clear pending data
    setPendingMessageData(null);
    setCreditConfirmationData(null);

    // Re-send the request with the pendingCreditId to confirm the credit deduction
    setIsLoading(true);
    setShowThinkingIndicator(true);

    await processConfirmedCreditAction({ message, file, pendingId });
  };

  const handleCreditCancel = () => {
    setShowCreditConfirmationModal(false);
    setCreditConfirmationData(null);
    setPendingMessageData(null);
    // Remove the user message we added
    setMessages(prev => prev.slice(0, -1));
  };

  const handleCreditsRequiredClose = () => {
    setShowCreditsRequiredModal(false);
    setCreditsRequiredData(null);
  };

  const isHealthProfileIncomplete = !user?.primaryDiet || !user?.conditionTreating;

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'row', // Changed to row for side-by-side layout
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: 'transparent',
        height: '80vh',
        width: '100%',
      }}>

      {/* Main Chat Area */}
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}>
        <div
          className="askkay-background"
          style={{ backgroundImage: `url(${askKayBg})` }}
        />

        <Box
          ref={scrollContainerRef}
          sx={{
            flexGrow: 1,
            overflowY: 'auto',
            p: 2,
            pb: '150px',
            position: 'relative',
            zIndex: 1,
            display: 'flex',
            flexDirection: 'column',
            marginLeft: { xs: 0, md: '10%', lg: '20%', xl: '30%' },
            marginRight: { xs: 0, md: '10%', lg: '20%', xl: '30%' },
            backgroundColor: 'transparent',
          }}
        >
          {isHealthProfileIncomplete && (
            <Alert
              severity="warning"
              sx={{
                mb: 3,
                fontSize: '1rem',
                fontWeight: 'normal',
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                flexWrap: 'wrap',
                '& .MuiAlert-icon': { fontSize: '2rem' },
              }}
            >
              <Button
                component={RouterLink}
                to="/quick_start_guide"
                color="inherit"
                size="normal"
                variant="outlined"
              >
                Set up diet plan
              </Button>
              <Typography variant="body1" sx={{ fontWeight: 'normal', py: 1 }}>
                Finish setting your primary diet and condition to personalize your recipes.
              </Typography>
            </Alert>
          )}
          <AnimatePresence>
            {isFirstHealingMeal ? (
              <>
                <Typography
                  variant="h4"
                  component="h1"
                  sx={{
                    textAlign: 'center',
                    my: 2,
                    color: '#013D1D',
                    fontFamily: 'Montserrat, sans-serif',
                    fontWeight: 700,
                  }}
                >
                  Your First Healing Recipe
                </Typography>
                {isHealingMealLoading && <CircularProgress sx={{ alignSelf: 'center', my: 4 }} />}
                {healingMealError && <Typography color="error" sx={{ textAlign: 'center' }}>{healingMealError}</Typography>}
                {healingMealData && (
                  <>
                    <Message message={{ role: 'assistant', content: healingMealData.welcomeMessage }} />
                    <Message message={{ role: 'recipe', ...healingMealData.recipe }} showSaveButton={true} />
                  </>
                )}
              </>
            ) : (
              <>
                {messages.length === 0 && !isLoading && <WelcomeMessage onQuestionSelect={handleQuestionSelect} isTyping={isTyping} />}
                {messages.map((msg, index) => (
                  <Box
                    key={msg._id || msg.tempId || index}
                    component="div"
                    data-message-id={msg._id || undefined}
                    data-temp-id={msg.tempId || undefined}
                  >
                    <Message message={msg} showSaveButton={true} />
                  </Box>
                ))}
                {showThinkingIndicator && <KayThinkingIndicator />}
                {/* Render Status Nodes Here */}
                {statusNodes.map((status, index) => (
                  <StatusNode key={`${status.phase}-${index}`} status={status} />
                ))}
                {isGeneratingRecipe && (
                  <>
                    {console.log('[ASKKAY] Rendering <RecipeSkeletonLoader/> in JSX')}
                    {/* center the recipe skeleton on this page */}
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                      <RecipeSkeletonLoader />
                    </Box>
                  </>
                )}
              </>
            )}
          </AnimatePresence>
        </Box>

        <ChatInput
          onSend={handleSend}
          isLoading={isLoading || isHealingMealLoading} // Disable input while healing meal is loading
          isTyping={isTyping}
          setIsTyping={setIsTyping}
          questionToType={questionToType}
          setQuestionToType={setQuestionToType}
          onOpenHistory={() => setIsHistoryModalOpen(true)}
          disabled={isFirstHealingMeal} // Disable input for the healing meal view
        />
      </Box>

      <ChatHistoryModal
        open={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        onSelectChat={handleSelectChat}
        onNewChat={handleNewChat}
      />
      <UpgradeModal
        open={upgradeModalOpen}
        onClose={() => setUpgradeModalOpen(false)}
        title={upgradeModalContent.title}
        message={upgradeModalContent.message}
      />

      {/* Credit Confirmation Modal */}
      <CreditConfirmationModal
        open={showCreditConfirmationModal}
        onConfirm={handleCreditConfirm}
        onCancel={handleCreditCancel}
        featureName={creditConfirmationData?.featureName || 'Feature'}
        cost={creditConfirmationData?.cost || 1}
        currentBalance={creditConfirmationData?.currentBalance || 0}
        balanceAfter={creditConfirmationData?.balanceAfter || 0}
        showConfirmationsInFuture={showCreditSpendConfirmationsInFuture}
        onShowConfirmationsInFutureChange={updateShowCreditSpendConfirmationsInFuture}
      />

      {/* Credits Required Modal */}
      <CreditsRequiredModal
        open={showCreditsRequiredModal}
        onClose={handleCreditsRequiredClose}
        featureName={creditsRequiredData?.featureName || 'Feature'}
        creditsRequired={creditsRequiredData?.creditsRequired || 1}
        creditsAvailable={creditsRequiredData?.creditsAvailable || 0}
      />
    </Box>
  );
}

AskKay.propTypes = {
  isFirstHealingMeal: PropTypes.bool,
};

export default AskKay;