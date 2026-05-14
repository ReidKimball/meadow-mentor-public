/**
 * @file leadMagnet.routes.js
 * @description Express router for the 5-R Gut Healing Checklist lead magnet.
 * Handles public POST requests to submit an email address, which triggers
 * MailerLite group assignment and a transactional Resend email with the PDF link.
 *
 * @requires module:express - Express framework for creating the router.
 * @requires module:../services/leadMagnet.service - Service orchestrating MailerLite + Resend delivery.
 * @requires module:../services/turnstile.service - Optional Cloudflare Turnstile verification for bot protection.
 *
 * @author Cascade
 * @version 1.0.0
 * @date 2025-07-26
 */

import express from 'express';
import { deliverLeadMagnet } from '../services/leadMagnet.service.js';

/**
 * @constant {express.Router} router
 * @description Express router instance for lead-magnet endpoints.
 */
const router = express.Router();

/**
 * @route POST /api/lead-magnet
 * @description Accepts an email address, validates it, then triggers delivery
 * of the 5-R Gut Healing Starter Checklist via MailerLite and Resend.
 * @access public
 * @param {object} req - The Express request object.
 * @param {string} req.body.email - The subscriber's email address.
 * @param {object} res - The Express response object.
 * @returns {object} 200 - JSON object confirming delivery and including a success message.
 * @returns {object} 400 - JSON object if the email is missing or malformed.
 * @returns {object} 500 - JSON object if MailerLite or Resend delivery fails.
 */
router.post('/', async (req, res) => {
  const { email } = req.body;

  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return res.status(400).json({ message: 'A valid email address is required.' });
  }

  try {
    const { mailerLiteResponse, resendResponse } = await deliverLeadMagnet(email.trim().toLowerCase());

    console.log('[leadMagnet.routes.js] Lead magnet delivered:', {
      email: email.trim().toLowerCase(),
      mailerLiteStatus: mailerLiteResponse?.data?.id ? 'success' : 'unknown',
      resendId: resendResponse?.id,
    });

    return res.status(200).json({
      message: 'Check your inbox! Your 5-R Checklist is on its way.',
      resendEmailId: resendResponse?.id || null,
    });
  } catch (error) {
    console.error('[leadMagnet.routes.js] Lead magnet delivery error:', error.message || error);
    return res.status(500).json({
      message: 'Something went wrong sending your checklist. Please try again in a moment.',
    });
  }
});

export default router;
