/**
 * @file leadMagnet.service.js
 * @description Service for orchestrating the 5-R Gut Health Checklist lead magnet delivery.
 * On submission, it adds the email to a MailerLite group and sends a transactional
 * welcome email via Resend containing a link to the publicly hosted PDF.
 *
 * @requires module:resend - Official Resend SDK for transactional email.
 * @requires module:../services/mailerlite.service - Internal MailerLite service for subscriber management.
 *
 * @author Cascade
 * @version 1.0.0
 * @date 2025-07-26
 */

import { Resend } from 'resend';
import { getMailerLiteClient } from './mailerlite.service.js';

/**
 * @constant {Resend|null} resendClient
 * @description Lazily-initialized Resend client using the RESEND_API_KEY environment variable.
 * @access private
 */
let resendClient = null;

const getResendClient = () => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error('RESEND_API_KEY is required but was not found in process.env.');
  }
  if (!resendClient) {
    resendClient = new Resend(apiKey);
  }
  return resendClient;
};

/**
 * @async
 * @function deliverLeadMagnet
 * @description Delivers the 5-R Gut Health Checklist lead magnet to a subscriber.
 * 1. Creates or updates the subscriber in MailerLite and assigns them to the
 *    configured lead-magnet group (or the fallback newsletter group).
 * 2. Sends a transactional email via Resend with a direct link to the PDF.
 *
 * @param {string} email - The subscriber's email address.
 * @returns {Promise<{mailerLiteResponse: object, resendResponse: object}>}
 *          A promise that resolves with both API responses.
 * @throws {Error} Throws if either MailerLite or Resend operations fail.
 */
export const deliverLeadMagnet = async (email) => {
  const groupId =
    process.env.MAILERLITE_LEAD_MAGNET_GROUP_ID ||
    process.env.MAILERLITE_EMAIL_GROUP_ID;

  if (!groupId) {
    throw new Error(
      'No MailerLite group ID configured. Set MAILERLITE_LEAD_MAGNET_GROUP_ID or MAILERLITE_EMAIL_GROUP_ID.'
    );
  }

  const fromEmail =
    process.env.RESEND_FROM_EMAIL ||
    process.env.MAILERLITE_FROM_EMAIL ||
    'reid@meadowmentor.com';

  const pdfUrl = process.env.LEAD_MAGNET_PDF_URL;
  if (!pdfUrl) {
    throw new Error('LEAD_MAGNET_PDF_URL is required but was not found in process.env.');
  }

  // 1. Add to MailerLite
  const mlResponse = await getMailerLiteClient().subscribers.createOrUpdate({
    email,
    groups: [groupId],
  });

  // 2. Send transactional email via Resend
  const resendResponse = await getResendClient().emails.send({
    from: `Reid at Meadow Mentor <${fromEmail}>`,
    to: [email],
    subject: 'Your 5R Framework for Gut Health Checklist 🌿',
    html: `
      <p>Hi there,</p>
      <p>Thanks for downloading the <strong>5R Framework for Gut Health Checklist</strong>.</p>
      <p>It is a practical framework I have used for over 20 years to manage Crohn's Disease, and it is the same structure I use with every coaching client.</p>
      <p style="margin: 24px 0;">
        <a href="${pdfUrl}" style="display:inline-block;padding:12px 24px;background:#FFBF00;color:#000;text-decoration:none;border-radius:8px;font-weight:700;">
          ⬇️ Download Your Checklist
        </a>
      </p>
      <p>If you are ready to go deeper, you can <a href="https://cal.com/reid-kimball-fkshix/60-min-meeting">book a 1-on-1 coaching session</a> with me anytime.</p>
      <p>In health,<br/>Reid Kimball<br/>Meadow Mentor</p>
    `,
    text: `Hi there,

Thanks for downloading the 5R Framework for Gut Health Checklist.

It is a practical framework I have used for over 20 years to manage Crohn's Disease, and it is the same structure I use with every coaching client.

Download your checklist here:
${pdfUrl}

If you are ready to go deeper, you can book a 1-on-1 coaching session with me anytime at https://cal.com/reid-kimball-fkshix/60-min-meeting

In health,
Reid Kimball
Meadow Mentor
`,
  });

  return { mailerLiteResponse: mlResponse, resendResponse };
};
