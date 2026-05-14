/**
 * @file mailerliteCampaign.service.js
 * @description Service for creating MailerLite campaign drafts from Sanity blog posts.
 * Builds a summary + CTA HTML email and can submit it to the MailerLite Campaigns API
 * when the plan supports content submission.
 *
 * @version 1.0.0
 * @requires module:@mailerlite/mailerlite-nodejs - Official MailerLite SDK for campaigns.
 * @date 2026-01-24
 * @author Cascade
 */

/**
 * @section Third-Party Libraries
 * @description External dependencies used by this service.
 */
import MailerLite from "@mailerlite/mailerlite-nodejs"; // MailerLite SDK for campaign creation.

/**
 * @section Environment Configuration
 * @description Reads environment variables for MailerLite setup.
 */
const MAILERLITE_API_KEY = process.env.MAILERLITE_API_KEY;
const MAILERLITE_EMAIL_GROUP_ID = process.env.MAILERLITE_EMAIL_GROUP_ID;
const MAILERLITE_FROM_EMAIL = process.env.MAILERLITE_FROM_EMAIL;

/**
 * @constant {MailerLite} mailerlite
 * @description MailerLite SDK client configured with the API key.
 * @access private
 */
const mailerlite = new MailerLite({
  api_key: MAILERLITE_API_KEY,
});

/**
 * @function extractPlainTextFromPortableText
 * @description Flattens Sanity Portable Text blocks into plain text for summaries.
 * @param {Array} body - Sanity Portable Text blocks array.
 * @returns {string} Plain text representation of the content.
 */
const extractPlainTextFromPortableText = (body) => {
  if (!Array.isArray(body)) return "";

  return body
    .filter((block) => block?._type === "block")
    .map((block) =>
      (block.children || [])
        .map((child) => child.text)
        .filter(Boolean)
        .join("")
    )
    .filter(Boolean)
    .join("\n");
};

/**
 * @function buildSummaryText
 * @description Generates a short summary from Portable Text for email content.
 * @param {Array} body - Sanity Portable Text blocks array.
 * @param {number} maxBlocks - Maximum number of text blocks to include.
 * @param {number} maxChars - Maximum summary length in characters.
 * @returns {string} Summary text suitable for an email preview.
 */
const buildSummaryText = (body, maxBlocks = 3, maxChars = 800) => {
  if (!Array.isArray(body)) return "";

  const blocks = body.filter((block) => block?._type === "block");
  const selectedBlocks = blocks.slice(0, maxBlocks);
  const text = selectedBlocks
    .map((block) =>
      (block.children || [])
        .map((child) => child.text)
        .filter(Boolean)
        .join("")
    )
    .filter(Boolean)
    .join("\n\n")
    .trim();

  if (text.length <= maxChars) return text;

  const truncated = text.slice(0, maxChars);
  const safeCut = truncated.lastIndexOf(" ") > 0 ? truncated.lastIndexOf(" ") : maxChars;
  return `${truncated.slice(0, safeCut).trim()}…`;
};

/**
 * @function buildSummaryHtml
 * @description Builds the HTML email body with a summary and CTA button.
 * @param {object} params - Summary HTML parameters.
 * @param {string} params.title - Blog post title.
 * @param {string} params.slug - Blog post slug.
 * @param {Array} params.body - Sanity Portable Text blocks.
 * @param {string|null} params.imageUrl - Optional main image URL.
 * @param {string|null} params.preheaderText - Optional preheader text (hidden in email body).
 * @returns {string} HTML email content.
 */
export const buildSummaryHtml = ({ title, slug, body, imageUrl, preheaderText }) => {
  const summaryText = buildSummaryText(body);
  const paragraphs = summaryText.split("\n\n").filter(Boolean);
  const postUrl = `https://meadowmentor.com/blog/${slug}`;

  const paragraphHtml = paragraphs
    .map((paragraph) => `<p style=\"margin: 0 0 16px; line-height: 1.6;\">${paragraph}</p>`)
    .join("");

  const imageHtml = imageUrl
    ? `<img src="${imageUrl}" alt="${title}" style="width: 100%; max-width: 600px; height: auto; display: block; margin: 0 auto 20px; border-radius: 8px;" />`
    : "";

  const safePreheader = preheaderText ? preheaderText.trim() : "";
  const preheaderHtml = safePreheader
    ? `<div style="display: none; max-height: 0; overflow: hidden; opacity: 0; color: transparent; font-size: 1px; line-height: 1px;">${safePreheader}</div>`
    : "";

  return `
    <div style="font-family: 'Open Sans', Arial, sans-serif; color: #1b1b1b;">
      ${preheaderHtml}
      ${imageHtml}
      <h2 style="margin: 0 0 16px; font-family: 'Montserrat', 'Open Sans', Arial, sans-serif; color: #013D1D;">${title}</h2>
      ${paragraphHtml}
      <a
        href=\"${postUrl}\"
        style=\"display: inline-block; padding: 12px 20px; background: #0e5f38; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600;\"
      >
        Read more
      </a>
    </div>
  `.trim();
};

/**
 * @async
 * @function createCampaignDraft
 * @description Creates a MailerLite campaign draft, optionally including HTML content.
 * @param {object} params - Campaign creation parameters.
 * @param {string} params.title - Campaign name and subject line.
 * @param {string} params.html - HTML email content.
 * @param {string} params.fromName - Sender name for the email.
 * @param {boolean} params.includeContent - When true, sends HTML content to MailerLite.
 * @returns {Promise<object>} MailerLite API response.
 * @throws {Error} Throws if configuration is missing or API request fails.
 */
export const createCampaignDraft = async ({
  title,
  html,
  fromName,
  includeContent = true,
}) => {
  if (!MAILERLITE_API_KEY) {
    throw new Error("MAILERLITE_API_KEY is required to create campaigns.");
  }

  if (!MAILERLITE_FROM_EMAIL) {
    throw new Error("MAILERLITE_FROM_EMAIL is required to create campaigns.");
  }

  const emailPayload = {
    subject: title,
    from_name: fromName,
    from: MAILERLITE_FROM_EMAIL,
  };

  if (includeContent && html) {
    emailPayload.content = html;
  }

  const params = {
    name: title,
    type: "regular",
    emails: [emailPayload],
  };

  if (MAILERLITE_EMAIL_GROUP_ID) {
    params.groups = [MAILERLITE_EMAIL_GROUP_ID];
  }

  try {
    const response = await mailerlite.campaigns.create(params);
    return response.data;
  } catch (error) {
    console.error(
      "[mailerliteCampaign.service.js] ❌ Failed to create MailerLite campaign draft:",
      error.response ? error.response.data : error.message
    );
    throw error;
  }
};

/**
 * @function buildSummaryPlainText
 * @description Exposes a plain-text summary for debugging or future email fallbacks.
 * @param {Array} body - Sanity Portable Text blocks.
 * @returns {string} Plain-text summary.
 */
export const buildSummaryPlainText = (body) => buildSummaryText(body);

/**
 * @function getPlainTextFromPortableText
 * @description Exposes Portable Text flattening for future reuse.
 * @param {Array} body - Sanity Portable Text blocks.
 * @returns {string} Plain text content.
 */
export const getPlainTextFromPortableText = (body) =>
  extractPlainTextFromPortableText(body);
