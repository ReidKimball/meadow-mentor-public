/**
 * @file growthEngine.routes.js
 * @description API routes for the Meadow Growth Engine.
 * Provides endpoints for syncing content from Gmail to Sanity CMS.
 * @requires express - Express.js framework
 * @author Antigravity
 * @version 1.0.0
 * @date 2026-01-22
 */

import express from "express";
import * as gmailService from "../services/gmail.service.js";
import * as sanityBlogService from "../services/sanityBlogDraft.service.js";
import { parseBlogDraft } from "../services/blogDraftParser.service.js";
import * as sanityBlogReadService from "../services/sanityBlogRead.service.js";
import {
  buildSummaryHtml,
  createCampaignDraft,
} from "../services/mailerliteCampaign.service.js";

const router = express.Router();

/**
 * @route POST /api/admin/growth/gmail-import
 * @description Imports Gmail drafts with "Ready for Meadow" label into Sanity as blog post drafts.
 * For each draft:
 *   1. Fetches the draft content from Gmail
 *   2. Parses the structured markdown content
 *   3. Creates a draft blog post in Sanity
 *   4. Changes the Gmail label to "Published to Meadow"
 * @access Protected (requires admin authentication)
 * @returns {object} 200 - Summary of processed drafts
 * @returns {object} 500 - If there's an error during processing
 */
router.post("/gmail-import", async (req, res) => {
  console.log("[growthEngine.routes.js] Starting Gmail to Sanity import...");

  const results = {
    success: [],
    errors: [],
    totalProcessed: 0,
  };

  try {
    // Step 1: Get all drafts with "Ready for Meadow" label
    const drafts = await gmailService.getDraftsWithLabel();

    if (drafts.length === 0) {
      console.log("[growthEngine.routes.js] No drafts found to import.");
      return res.status(200).json({
        message: "No drafts found with 'Ready for Meadow' label.",
        results,
      });
    }

    console.log(
      `[growthEngine.routes.js] Found ${drafts.length} drafts to process.`
    );

    // Step 2: Process each draft
    for (const draft of drafts) {
      try {
        // Get draft content
        const { subject, body, draftId } = await gmailService.getDraftContent(
          draft.id
        );

        // Parse the draft content
        const { title, seoDescription, bodyPortableText } = parseBlogDraft(
          body,
          subject
        );

        // Create draft in Sanity
        const sanityResult = await sanityBlogService.createBlogDraft(
          title,
          seoDescription,
          bodyPortableText
        );

        // Change Gmail label to "Published to Meadow"
        await gmailService.changeLabelToPublished(draft.messageId);

        results.success.push({
          gmailDraftId: draft.id,
          title,
          sanityDocumentId: sanityResult.documentId,
          slug: sanityResult.slug,
        });

        console.log(
          `[growthEngine.routes.js] Successfully imported: "${title}"`
        );
      } catch (draftError) {
        console.error(
          `[growthEngine.routes.js] Error processing draft ${draft.id}:`,
          draftError.message
        );
        results.errors.push({
          gmailDraftId: draft.id,
          error: draftError.message,
        });
      }

      results.totalProcessed++;
    }

    console.log(
      `[growthEngine.routes.js] Import complete. Success: ${results.success.length}, Errors: ${results.errors.length}`
    );

    res.status(200).json({
      message: `Processed ${results.totalProcessed} drafts. ${results.success.length} imported successfully.`,
      results,
    });
  } catch (error) {
    console.error("[growthEngine.routes.js] Gmail import failed:", error);
    res.status(500).json({
      error: "Failed to import Gmail drafts",
      details: error.message,
    });
  }
});

/**
 * @route GET /api/admin/growth/published-posts
 * @description Returns published Sanity posts for MailerLite campaign selection.
 * @access Protected (requires admin authentication)
 * @returns {object[]} 200 - Array of published posts with title, slug, and metadata.
 * @returns {object} 500 - If there's an error fetching published posts.
 */
router.get("/published-posts", async (req, res) => {
  console.log("[growthEngine.routes.js] Fetching published Sanity posts...");

  try {
    const posts = await sanityBlogReadService.getPublishedPosts();

    res.status(200).json({
      count: posts.length,
      posts,
    });
  } catch (error) {
    console.error(
      "[growthEngine.routes.js] ❌ Failed to fetch published posts:",
      error.message
    );
    res.status(500).json({
      error: "Failed to fetch published posts",
      details: error.message,
    });
  }
});

/**
 * @route POST /api/admin/growth/mailerlite-campaign
 * @description Creates a MailerLite campaign draft from a published Sanity post.
 * @access Protected (requires admin authentication)
 * @param {object} req.body - Request payload.
 * @param {string} req.body.slug - The Sanity blog post slug.
 * @returns {object} 200 - MailerLite campaign draft data.
 * @returns {object} 400 - If slug is missing.
 * @returns {object} 404 - If the post is not found.
 * @returns {object} 500 - If campaign creation fails.
 */
router.post("/mailerlite-campaign", async (req, res) => {
  const { slug } = req.body || {};

  if (!slug) {
    return res.status(400).json({ error: "Slug is required." });
  }

  console.log(
    `[growthEngine.routes.js] Creating MailerLite campaign draft for slug: ${slug}`
  );

  try {
    const post = await sanityBlogReadService.getPublishedPostBySlug(slug);

    if (!post) {
      return res.status(404).json({ error: "Published post not found." });
    }

    const postSlug = post.slug?.current || slug;
    const imageUrl = sanityBlogReadService.getMainImageUrl(post.mainImage);
    const summaryHtml = buildSummaryHtml({
      title: post.title,
      slug: postSlug,
      body: post.body,
      imageUrl,
      preheaderText: post.description,
    });

    const campaign = await createCampaignDraft({
      title: post.title,
      html: summaryHtml,
      fromName: "Reid Kimball (Meadow Mentor)",
      includeContent: false,
    });

    res.status(200).json({
      message: "MailerLite campaign draft created.",
      campaign,
      summaryHtml,
    });
  } catch (error) {
    console.error(
      "[growthEngine.routes.js] ❌ Failed to create MailerLite campaign draft:",
      error.response ? error.response.data : error.message
    );
    res.status(500).json({
      error: "Failed to create MailerLite campaign draft",
      details: error.message,
    });
  }
});

/**
 * @route GET /api/admin/growth/test-connections
 * @description Tests connections to Gmail and Sanity APIs.
 * Useful for verifying OAuth credentials and API tokens are working.
 * @access Protected (requires admin authentication)
 * @returns {object} 200 - Connection status for both services, including failure details when available
 */
router.get("/test-connections", async (req, res) => {
  console.log("[growthEngine.routes.js] Testing API connections...");

  try {
    const [gmailResult, sanityResult] = await Promise.allSettled([
      gmailService.testConnection(),
      sanityBlogService.testConnection(),
    ]);

    const gmailStatus =
      gmailResult.status === "fulfilled"
        ? gmailResult.value
        : {
            success: false,
            error: gmailResult.reason?.message || "Gmail connection check failed.",
            details: {
              reason: "connection_test_rejected",
              description:
                gmailResult.reason?.message ||
                "Gmail connection promise rejected before returning diagnostics.",
              hint:
                "Check backend Gmail env vars and OAuth token validity. Then re-test connection.",
            },
          };

    const sanityStatus =
      sanityResult.status === "fulfilled"
        ? sanityResult.value
        : {
            success: false,
            error: sanityResult.reason?.message || "Sanity connection check failed.",
          };

    res.status(200).json({
      gmail: gmailStatus,
      sanity: sanityStatus,
    });
  } catch (error) {
    console.error("[growthEngine.routes.js] Connection test failed:", error);
    res.status(500).json({
      error: "Connection test failed",
      details: error.message,
    });
  }
});

/**
 * @route GET /api/admin/growth/pending-drafts
 * @description Lists Gmail drafts with "Ready for Meadow" label without importing them.
 * Useful for previewing what will be imported.
 * @access Protected (requires admin authentication)
 * @returns {object} 200 - List of pending draft subjects
 */
router.get("/pending-drafts", async (req, res) => {
  console.log("[growthEngine.routes.js] Fetching pending drafts...");

  try {
    const drafts = await gmailService.getDraftsWithLabel();

    const draftPreviews = [];
    for (const draft of drafts) {
      const { subject } = await gmailService.getDraftContent(draft.id);
      draftPreviews.push({
        id: draft.id,
        subject,
      });
    }

    res.status(200).json({
      count: draftPreviews.length,
      drafts: draftPreviews,
    });
  } catch (error) {
    console.error("[growthEngine.routes.js] Error fetching pending drafts:", error);
    res.status(500).json({
      error: "Failed to fetch pending drafts",
      details: error.message,
    });
  }
});

export default router;
