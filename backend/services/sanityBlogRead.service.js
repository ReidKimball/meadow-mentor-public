/**
 * @file sanityBlogRead.service.js
 * @description Service for reading published blog content from Sanity CMS.
 * Provides helper functions to fetch lists of published posts and retrieve a
 * single post by slug for downstream workflows (e.g., MailerLite campaigns).
 *
 * @version 1.0.0
 * @requires @sanity/client - Sanity CMS client for data fetching.
 * @date 2026-01-24
 * @author Cascade
 */

/**
 * @section Third-Party Libraries
 * @description External dependencies used by this service.
 */
import { createClient } from "@sanity/client"; // Sanity client for CMS read operations.

/**
 * @section Environment Configuration
 * @description Reads environment variables used for Sanity client setup.
 */
const SANITY_PROJECT_ID = process.env.SANITY_PROJECT_ID;
const SANITY_DATASET = process.env.SANITY_DATASET;
const SANITY_READ_TOKEN = process.env.SANITY_API_READ_TOKEN;

/**
 * @constant {import("@sanity/client").SanityClient} sanityReadClient
 * @description Lazily initialized Sanity client for read operations.
 * Uses `useCdn: false` to ensure fresh data for admin workflows.
 * @access private
 */
let sanityReadClient = null;

/**
 * @function getSanityReadClient
 * @description Initializes (if needed) and returns the Sanity read client.
 * Falls back to unauthenticated reads if no read token is provided.
 * @returns {import("@sanity/client").SanityClient} Configured Sanity client.
 */
const getSanityReadClient = () => {
  if (!sanityReadClient) {
    sanityReadClient = createClient({
      projectId: SANITY_PROJECT_ID,
      dataset: SANITY_DATASET,
      apiVersion: "2023-05-03",
      token: SANITY_READ_TOKEN || undefined,
      useCdn: false,
    });

    console.log(
      `[sanityBlogRead.service.js] ✅ Sanity read client initialized for project: ${SANITY_PROJECT_ID}`
    );
  }

  return sanityReadClient;
};

/**
 * @constant {string} PUBLISHED_POSTS_QUERY
 * @description GROQ query for listing published posts with slugs.
 */
const PUBLISHED_POSTS_QUERY = `*[
  _type == "post"
  && defined(slug.current)
  && defined(publishedAt)
]|order(publishedAt desc){
  _id,
  title,
  slug,
  publishedAt,
  description,
  mainImage{asset}
}`;

/**
 * @constant {string} SINGLE_PUBLISHED_POST_QUERY
 * @description GROQ query for fetching a single published post by slug.
 */
const SINGLE_PUBLISHED_POST_QUERY = `*[
  _type == "post"
  && defined(slug.current)
  && slug.current == $slug
  && defined(publishedAt)
][0]{
  _id,
  title,
  slug,
  publishedAt,
  description,
  mainImage{asset},
  body
}`;

/**
 * @function getMainImageUrl
 * @description Builds a public Sanity CDN URL from a mainImage asset reference.
 * @param {object} mainImage - Sanity image field with asset reference.
 * @returns {string|null} Public URL for the image or null if unavailable.
 */
export const getMainImageUrl = (mainImage) => {
  const assetRef = mainImage?.asset?._ref;

  if (!assetRef || !SANITY_PROJECT_ID || !SANITY_DATASET) {
    return null;
  }

  const parts = assetRef.split("-");
  if (parts.length < 4) {
    return null;
  }

  const [, assetId, dimensions, format] = parts;
  if (!assetId || !dimensions || !format) {
    return null;
  }

  return `https://cdn.sanity.io/images/${SANITY_PROJECT_ID}/${SANITY_DATASET}/${assetId}-${dimensions}.${format}`;
};

/**
 * @async
 * @function getPublishedPosts
 * @description Fetches a list of published posts for admin selection.
 * @returns {Promise<Array>} Array of published posts with title, slug, and metadata.
 * @throws {Error} Throws if the Sanity fetch fails.
 */
export const getPublishedPosts = async () => {
  const client = getSanityReadClient();

  try {
    return await client.fetch(PUBLISHED_POSTS_QUERY);
  } catch (error) {
    console.error(
      "[sanityBlogRead.service.js] ❌ Failed to fetch published posts:",
      error.message
    );
    throw error;
  }
};

/**
 * @async
 * @function getPublishedPostBySlug
 * @description Fetches a single published post by slug.
 * @param {string} slug - The slug for the published post.
 * @returns {Promise<object|null>} The published post or null if not found.
 * @throws {Error} Throws if the Sanity fetch fails.
 */
export const getPublishedPostBySlug = async (slug) => {
  const client = getSanityReadClient();

  try {
    return await client.fetch(SINGLE_PUBLISHED_POST_QUERY, { slug });
  } catch (error) {
    console.error(
      `[sanityBlogRead.service.js] ❌ Failed to fetch post for slug "${slug}":`,
      error.message
    );
    throw error;
  }
};
