/**
 * @file newsletter.js
 * @description This file defines the Express router for all public-facing newsletter-related API endpoints.
 * It handles incoming requests for newsletter subscriptions and orchestrates the interaction with the MailerLite service.
 * @requires module:express - The Express framework for building the router.
 * @requires module:../services/mailerlite.service - The internal service for MailerLite API interactions.
 * @author Cascade
 * @version 1.0.0
 * @date 2025-07-25
 */

// newsletter routes file

// Third-Party Libraries
import express from 'express'; // Express framework for creating router.

// Internal Modules
import { subscribeToPublicNewsletter } from '../services/mailerlite.service.js'; // Service function for newsletter subscriptions.
import { verifyTurnstileToken } from '../services/turnstile.service.js';

/**
 * @constant {express.Router} router
 * @description An instance of the Express router to handle newsletter-specific routes.
 */
const router = express.Router();

// POST /api/newsletter from index.js
/**
 * @route POST /api/newsletter/subscribe
 * @description Endpoint to handle a new subscription to the public newsletter.
 * It expects an email address in the request body.
 * @access public
 * @param {object} req - The Express request object.
 * @param {string} req.body.email - The email address of the user to subscribe.
 * @param {object} res - The Express response object.
 * @returns {object} 200 - JSON object with a success message and the data from MailerLite.
 * @returns {object} 400 - JSON object with an error message if the email is not provided.
 * @returns {object} 500 - JSON object with an error message if the subscription fails on the server.
 */
router.post('/subscribe', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email is required.' });
  }

  const { token } = req.body;
  const remoteIp = req.ip || req.connection?.remoteAddress;

  console.log('[newsletter.js] DEBUG - Received token:', token ? `${token.substring(0, 20)}...` : 'EMPTY/NULL');
  console.log('[newsletter.js] DEBUG - Full request body keys:', Object.keys(req.body));

  const isHuman = await verifyTurnstileToken(token, remoteIp);
  if (!isHuman) {
      return res.status(400).json({ message: 'Security check failed. Please try again.' });
  }

  try {
    const response = await subscribeToPublicNewsletter(email);
    res.status(200).json({ message: 'Successfully subscribed!', data: response.data });
  } catch (error) {
    console.error('[newsletter.js] ❌ Newsletter subscription error:', error.response ? error.response.data : error.message);
    res.status(500).json({ message: 'Subscription failed.' });
  }
});

export default router;
