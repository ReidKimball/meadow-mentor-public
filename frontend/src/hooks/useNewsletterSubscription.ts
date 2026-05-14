'use client';

/**
 * @file Defines the `useNewsletterSubscription` hook.
 * @description Provides shared, reusable state + handlers for subscribing a user to the public newsletter.
 * This hook is used by both the marketing site footer and inline blog signup blocks to ensure a single,
 * consistent implementation for email validation, Cloudflare Turnstile gating, and API submission.
 *
 * @requires module:react - Core React hooks for state and refs.
 * @requires module:@/lib/api - Provides `API_BASE_URL` for backend API calls.
 * @author Cascade
 * @version 1.0.0
 * @date 2026-01-30
 */

// React/Third-Party Libraries
import { useCallback, useRef, useState } from 'react'; // React hooks for subscription form state.

// Internal Modules
import { API_BASE_URL } from '../lib/api'; // Backend base URL for newsletter subscription requests.

/**
 * @typedef {('idle'|'loading'|'success'|'error')} NewsletterSubscriptionStatus
 * @description Represents the current lifecycle status of the newsletter subscription request.
 */
export type NewsletterSubscriptionStatus = 'idle' | 'loading' | 'success' | 'error';

/**
 * @hook useNewsletterSubscription
 * @description Manages all shared state and business logic for subscribing an email address to the
 * public newsletter with Cloudflare Turnstile spam protection.
 *
 * @returns {object} Subscription state and handlers.
 * @returns {string} returns.email - The current email input value.
 * @returns {(value: string) => void} returns.setEmail - Sets the email input value.
 * @returns {NewsletterSubscriptionStatus} returns.status - Current status (`idle`, `loading`, `success`, `error`).
 * @returns {(value: NewsletterSubscriptionStatus) => void} returns.setStatus - Sets the current status.
 * @returns {string} returns.message - The current success/error message for the UI.
 * @returns {(value: string) => void} returns.setMessage - Sets the current UI message.
 * @returns {(string|null)} returns.token - Turnstile token (required to submit).
 * @returns {(value: string|null) => void} returns.setToken - Sets the Turnstile token.
 * @returns {import('react').MutableRefObject<any>} returns.turnstileRef - Ref used to reset the Turnstile widget.
 * @returns {() => void} returns.resetTurnstile - Resets the Turnstile widget (if mounted) and clears token.
 * @returns {() => Promise<void>} returns.handleSubscribe - Submits the newsletter subscription request.
 */
export function useNewsletterSubscription() {
  const [email, setEmail] = useState(''); // The user's email input.
  const [status, setStatus] = useState<NewsletterSubscriptionStatus>('idle'); // Request lifecycle status.
  const [message, setMessage] = useState(''); // UI feedback message (success/error).
  const [token, setToken] = useState<string | null>(null); // Cloudflare Turnstile token.

  const turnstileRef = useRef<any>(null); // Ref used to reset the Turnstile widget after submit.

  /**
   * Resets the Turnstile widget (if available) and clears the stored token.
   */
  const resetTurnstile = useCallback(() => {
    if (turnstileRef.current?.reset) {
      turnstileRef.current.reset();
    }
    setToken(null);
  }, []);

  /**
   * Handles the newsletter subscribe request.
   *
   * Validates email and Turnstile token, then submits `POST /api/newsletter/subscribe`.
   */
  const handleSubscribe = useCallback(async () => {
    if (!email) return;

    if (!/\S+@\S+\.\S+/.test(email)) {
      setStatus('error');
      setMessage('Please enter a valid email address.');
      return;
    }

    if (!token) {
      setStatus('error');
      setMessage('Please complete the security check.');
      return;
    }

    setStatus('loading');
    setMessage('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/newsletter/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, token }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || 'Subscription failed.');
      }

      setStatus('success');
      setMessage(data.message || 'Successfully subscribed!');
      setEmail('');
      resetTurnstile();
    } catch (error: any) {
      setStatus('error');
      setMessage(error?.message || 'An error occurred. Please try again.');
      resetTurnstile();
    }
  }, [email, resetTurnstile, token]);

  return {
    email,
    setEmail,
    status,
    setStatus,
    message,
    setMessage,
    token,
    setToken,
    turnstileRef,
    resetTurnstile,
    handleSubscribe,
  };
}
