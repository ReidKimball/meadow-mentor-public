/**
 * @file sanityBlogDraft.service.js
 * @description Service for creating blog post drafts in Sanity CMS.
 * Uses the Sanity client with write permissions to create new post documents.
 * @requires @sanity/client - Sanity CMS client
 * @author Antigravity
 * @version 1.0.0
 * @date 2026-01-22
 */

import { createClient } from "@sanity/client";

/**
 * @constant {SanityClient} sanityWriteClient
 * @description Sanity client configured with write token for creating/updating documents.
 * Uses a separate token from the read-only client in index.js.
 * @access private
 */
let sanityWriteClient = null;

/**
 * @function getSanityWriteClient
 * @description Returns a Sanity client with write permissions.
 * @returns {SanityClient} Configured Sanity client with write access
 */
const getSanityWriteClient = () => {
  if (!sanityWriteClient) {
    sanityWriteClient = createClient({
      projectId: process.env.SANITY_PROJECT_ID,
      dataset: process.env.SANITY_DATASET,
      apiVersion: "2023-05-03",
      token: process.env.SANITY_API_MEADOW_BLOG_DRAFTS_TOKEN,
      useCdn: false, // Must be false for write operations
    });

    console.log(
      `[sanityBlogDraft.service.js] Sanity write client initialized for project: ${process.env.SANITY_PROJECT_ID}`
    );
  }
  return sanityWriteClient;
};

/**
 * @function generateSlug
 * @description Creates a URL-friendly slug from a title.
 * @param {string} title - The blog post title
 * @returns {string} URL-friendly slug
 */
export const generateSlug = (title) => {
  if (!title) return "untitled";

  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, "") // Remove non-word chars (except spaces and hyphens)
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Replace multiple hyphens with single
    .replace(/^-+|-+$/g, "") // Trim hyphens from start and end
    .substring(0, 96); // Max length 96 (matching Sanity schema)
};

/**
 * @async
 * @function createBlogDraft
 * @description Creates a new blog post draft in Sanity CMS.
 * The post is created as a draft (not published) so it can be reviewed first.
 * @param {string} title - Blog post title
 * @param {string} seoDescription - SEO meta description
 * @param {Array} bodyPortableText - Blog body as Portable Text blocks
 * @returns {Promise<{success: boolean, documentId: string, slug: string}>} Result of the creation
 */
export const createBlogDraft = async (
  title,
  seoDescription,
  bodyPortableText
) => {
  const client = getSanityWriteClient();
  const slug = generateSlug(title);

  // Create the document with a draft prefix
  const documentId = `drafts.${crypto.randomUUID()}`;

  try {
    const document = {
      _id: documentId,
      _type: "post",
      title,
      slug: {
        _type: "slug",
        current: slug,
      },
      description: seoDescription || "",
      body: bodyPortableText,
      // Leave author as null (user will fill in manually)
      // Leave mainImage as null (user will upload manually)
      // Leave categories as empty (user will select manually)
      // Leave publishedAt as null (set when published)
    };

    const result = await client.create(document);

    console.log(
      `[sanityBlogDraft.service.js] Created draft blog post: "${title}" (ID: ${result._id})`
    );

    return {
      success: true,
      documentId: result._id,
      slug,
      title,
    };
  } catch (error) {
    console.error(
      `[sanityBlogDraft.service.js] Error creating blog draft:`,
      error.message
    );
    throw error;
  }
};

/**
 * @async
 * @function checkSlugExists
 * @description Checks if a slug already exists in Sanity.
 * @param {string} slug - The slug to check
 * @returns {Promise<boolean>} True if slug exists, false otherwise
 */
export const checkSlugExists = async (slug) => {
  const client = getSanityWriteClient();

  try {
    const query = `*[_type == "post" && slug.current == $slug][0]._id`;
    const result = await client.fetch(query, { slug });
    return !!result;
  } catch (error) {
    console.error(
      `[sanityBlogDraft.service.js] Error checking slug existence:`,
      error.message
    );
    return false;
  }
};

/**
 * @async
 * @function createUniqueBlogDraft
 * @description Creates a blog draft, ensuring the slug is unique by appending a number if needed.
 * @param {string} title - Blog post title
 * @param {string} seoDescription - SEO meta description
 * @param {Array} bodyPortableText - Blog body as Portable Text blocks
 * @returns {Promise<{success: boolean, documentId: string, slug: string}>} Result of the creation
 */
export const createUniqueBlogDraft = async (
  title,
  seoDescription,
  bodyPortableText
) => {
  let baseSlug = generateSlug(title);
  let slug = baseSlug;
  let counter = 1;

  // Check if slug exists and append number if needed
  while (await checkSlugExists(slug)) {
    counter++;
    slug = `${baseSlug}-${counter}`;
    console.log(
      `[sanityBlogDraft.service.js] Slug "${baseSlug}" exists, trying "${slug}"`
    );
  }

  // Create with unique slug (may need to adjust the document before creation)
  return createBlogDraft(title, seoDescription, bodyPortableText);
};

/**
 * @async
 * @function testConnection
 * @description Tests the Sanity API connection by fetching project info.
 * @returns {Promise<{success: boolean, message: string}>} Connection status
 */
export const testConnection = async () => {
  const client = getSanityWriteClient();

  try {
    // Try to fetch a single post to verify connection
    const result = await client.fetch(`*[_type == "post"][0]._id`);

    return {
      success: true,
      message: `Connected to Sanity project ${process.env.SANITY_PROJECT_ID}`,
    };
  } catch (error) {
    console.error(
      "[sanityBlogDraft.service.js] Sanity connection test failed:",
      error.message
    );
    return {
      success: false,
      message: error.message,
    };
  }
};
