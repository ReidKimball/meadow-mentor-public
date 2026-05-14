/**
 * @file blogDraftParser.service.js
 * @description Parses Gmail draft content into structured blog post data for Sanity.
 * Handles HTML to text conversion and markdown to Portable Text conversion.
 * @author Antigravity
 * @version 1.0.0
 * @date 2026-01-22
 */

/**
 * @function parseGmailHtmlToText
 * @description Converts Gmail HTML content to plain text, preserving markdown syntax.
 * Gmail stores drafts as HTML with <br> tags for line breaks while keeping markdown intact.
 * @param {string} html - Raw HTML content from Gmail draft
 * @returns {string} Plain text content with markdown preserved
 */
export const parseGmailHtmlToText = (html) => {
  if (!html) return "";

  let text = html;

  // Replace <br> and <br/> with newlines
  text = text.replace(/<br\s*\/?>/gi, "\n");

  // Replace </p> and </div> with double newlines (paragraph breaks)
  text = text.replace(/<\/(p|div)>/gi, "\n\n");

  // Remove all remaining HTML tags
  text = text.replace(/<[^>]+>/g, "");

  // Decode common HTML entities
  text = text.replace(/&nbsp;/g, " ");
  text = text.replace(/&amp;/g, "&");
  text = text.replace(/&lt;/g, "<");
  text = text.replace(/&gt;/g, ">");
  text = text.replace(/&quot;/g, '"');
  text = text.replace(/&#39;/g, "'");
  text = text.replace(/&apos;/g, "'");

  // Normalize multiple consecutive newlines to max 2
  text = text.replace(/\n{3,}/g, "\n\n");

  // Trim whitespace
  text = text.trim();

  return text;
};

/**
 * @function extractBlogFields
 * @description Parses the structured blog draft format to extract title, SEO description, and content.
 * Expected format:
 *   # Blog Post Draft
 *   **Title:** [title text]
 *   **SEO Description:** [description text]
 *   ---
 *   **Content:**
 *   [article body in markdown]
 *   ---
 *   **Image Ideation:** [stripped out]
 *
 * @param {string} plainText - Plain text content with markdown formatting
 * @returns {{title: string, seoDescription: string, contentMarkdown: string}} Extracted fields
 */
export const extractBlogFields = (plainText) => {
  if (!plainText) {
    return { title: "", seoDescription: "", contentMarkdown: "" };
  }

  let title = "";
  let seoDescription = "";
  let contentMarkdown = "";

  // Extract Title (look for **Title:** pattern)
  const titleMatch = plainText.match(/\*\*Title:\*\*\s*(.+?)(?:\n|$)/i);
  if (titleMatch) {
    title = titleMatch[1].trim();
  }

  // Extract SEO Description (look for **SEO Description:** pattern)
  const seoMatch = plainText.match(
    /\*\*SEO Description:\*\*\s*(.+?)(?=\n---|\n\*\*|$)/is
  );
  if (seoMatch) {
    seoDescription = seoMatch[1].trim();
  }

  // Extract Content (everything after **Content:** until **Image Ideation:** or end)
  const contentMatch = plainText.match(
    /\*\*Content:\*\*\s*([\s\S]*?)(?=\n---\s*\n\*\*Image Ideation:\*\*|---\s*\n\*\*Image Ideation:\*\*|$)/i
  );
  if (contentMatch) {
    contentMarkdown = contentMatch[1].trim();
  }

  // If no structured content found, check for simpler format
  // (fallback for older drafts that might not have the structured format)
  if (!contentMarkdown && !title) {
    // Check if this is a simple markdown document
    // Use first H1 as title if present
    const h1Match = plainText.match(/^#\s+(.+?)(?:\n|$)/m);
    if (h1Match) {
      title = h1Match[1].trim();
      // Content is everything after the first line
      const firstLineEnd = plainText.indexOf("\n");
      if (firstLineEnd > -1) {
        contentMarkdown = plainText.substring(firstLineEnd + 1).trim();
      }
    } else {
      // Use entire text as content
      contentMarkdown = plainText;
    }
  }

  console.log(
    `[blogDraftParser.service.js] Extracted - Title: "${title.substring(0, 50)}...", SEO: "${seoDescription.substring(0, 50)}...", Content length: ${contentMarkdown.length} chars`
  );

  return {
    title,
    seoDescription,
    contentMarkdown,
  };
};

/**
 * @function markdownToPortableText
 * @description Converts markdown content to Sanity Portable Text block array.
 * Handles headings, paragraphs, bold, italic, links, and lists.
 * @param {string} markdown - Markdown content to convert
 * @returns {Array} Array of Portable Text blocks for Sanity
 */
export const markdownToPortableText = (markdown) => {
  if (!markdown) return [];

  const blocks = [];
  const lines = markdown.split("\n");
  let currentParagraph = [];
  let inList = false;
  let listItems = [];

  const flushParagraph = () => {
    if (currentParagraph.length > 0) {
      const text = currentParagraph.join(" ").trim();
      if (text) {
        blocks.push(createTextBlock(text, "normal"));
      }
      currentParagraph = [];
    }
  };

  const flushList = () => {
    if (listItems.length > 0) {
      for (const item of listItems) {
        blocks.push(createListItemBlock(item));
      }
      listItems = [];
      inList = false;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();

    // Skip empty lines (they end paragraphs)
    if (!trimmedLine) {
      flushParagraph();
      flushList();
      continue;
    }

    // Check for headings
    const headingMatch = trimmedLine.match(/^(#{1,4})\s+(.+)$/);
    if (headingMatch) {
      flushParagraph();
      flushList();
      const level = headingMatch[1].length;
      const headingText = headingMatch[2];
      const style = level === 1 ? "h1" : level === 2 ? "h2" : level === 3 ? "h3" : "h4";
      blocks.push(createTextBlock(headingText, style));
      continue;
    }

    // Check for bullet list items
    const bulletMatch = trimmedLine.match(/^[\*\-]\s+(.+)$/);
    if (bulletMatch) {
      flushParagraph();
      inList = true;
      listItems.push(bulletMatch[1]);
      continue;
    }

    // Check for blockquote
    const quoteMatch = trimmedLine.match(/^>\s*(.+)$/);
    if (quoteMatch) {
      flushParagraph();
      flushList();
      blocks.push(createTextBlock(quoteMatch[1], "blockquote"));
      continue;
    }

    // Check for horizontal rule (---)
    if (trimmedLine.match(/^-{3,}$/) || trimmedLine.match(/^\*{3,}$/)) {
      flushParagraph();
      flushList();
      // Skip horizontal rules (or you could add a custom block type)
      continue;
    }

    // Regular paragraph text
    if (inList) {
      flushList();
    }
    currentParagraph.push(trimmedLine);
  }

  // Flush any remaining content
  flushParagraph();
  flushList();

  return blocks;
};

/**
 * @function createTextBlock
 * @description Creates a Portable Text block with inline formatting (bold, italic, links).
 * @param {string} text - Text content with markdown formatting
 * @param {string} style - Block style (normal, h1, h2, h3, h4, blockquote)
 * @returns {Object} Portable Text block
 */
const createTextBlock = (text, style = "normal") => {
  const { children, markDefs } = parseInlineFormatting(text);

  return {
    _type: "block",
    _key: generateKey(),
    style,
    markDefs,
    children,
  };
};

/**
 * @function createListItemBlock
 * @description Creates a bullet list item block.
 * @param {string} text - List item text
 * @returns {Object} Portable Text list item block
 */
const createListItemBlock = (text) => {
  const { children, markDefs } = parseInlineFormatting(text);

  return {
    _type: "block",
    _key: generateKey(),
    style: "normal",
    listItem: "bullet",
    level: 1,
    markDefs,
    children,
  };
};

/**
 * @function parseInlineFormatting
 * @description Parses markdown inline formatting (bold, italic, links) into Portable Text spans.
 * @param {string} text - Text with markdown formatting
 * @returns {{children: Array, markDefs: Array}} Parsed spans and mark definitions
 */
const parseInlineFormatting = (text) => {
  const children = [];
  const markDefs = [];
  let remaining = text;

  // Regex patterns for inline formatting
  // Bold: **text** or __text__
  // Italic: *text* or _text_
  // Links: [text](url)

  // Simple approach: split by patterns and create spans
  // For now, handle common patterns

  // Pattern to match **bold**, *italic*, and [link](url)
  const pattern = /(\*\*(.+?)\*\*|\*(.+?)\*|\[(.+?)\]\((.+?)\))/g;

  let lastIndex = 0;
  let match;

  while ((match = pattern.exec(text)) !== null) {
    // Add text before the match as plain span
    if (match.index > lastIndex) {
      const plainText = text.substring(lastIndex, match.index);
      if (plainText) {
        children.push({
          _type: "span",
          _key: generateKey(),
          text: plainText,
          marks: [],
        });
      }
    }

    if (match[2]) {
      // Bold (**text**)
      children.push({
        _type: "span",
        _key: generateKey(),
        text: match[2],
        marks: ["strong"],
      });
    } else if (match[3]) {
      // Italic (*text*)
      children.push({
        _type: "span",
        _key: generateKey(),
        text: match[3],
        marks: ["em"],
      });
    } else if (match[4] && match[5]) {
      // Link [text](url)
      const linkKey = generateKey();
      markDefs.push({
        _type: "link",
        _key: linkKey,
        href: match[5],
      });
      children.push({
        _type: "span",
        _key: generateKey(),
        text: match[4],
        marks: [linkKey],
      });
    }

    lastIndex = pattern.lastIndex;
  }

  // Add remaining text after last match
  if (lastIndex < text.length) {
    const plainText = text.substring(lastIndex);
    if (plainText) {
      children.push({
        _type: "span",
        _key: generateKey(),
        text: plainText,
        marks: [],
      });
    }
  }

  // If no formatting was found, return the whole text as a single span
  if (children.length === 0) {
    children.push({
      _type: "span",
      _key: generateKey(),
      text: text,
      marks: [],
    });
  }

  return { children, markDefs };
};

/**
 * @function generateKey
 * @description Generates a random key for Portable Text elements.
 * @returns {string} Random alphanumeric key
 */
const generateKey = () => {
  return Math.random().toString(36).substring(2, 10);
};

/**
 * @function parseBlogDraft
 * @description Main function to parse a complete blog draft from Gmail.
 * Orchestrates HTML-to-text conversion, field extraction, and Portable Text conversion.
 * @param {string} htmlBody - Raw HTML body from Gmail draft
 * @param {string} subject - Email subject line (used as fallback title)
 * @returns {{title: string, seoDescription: string, bodyPortableText: Array}} Parsed blog post data
 */
export const parseBlogDraft = (htmlBody, subject = "") => {
  // Step 1: Convert HTML to plain text
  const plainText = parseGmailHtmlToText(htmlBody);

  // Step 2: Extract structured fields
  const { title, seoDescription, contentMarkdown } =
    extractBlogFields(plainText);

  // Step 3: Convert markdown content to Portable Text
  const bodyPortableText = markdownToPortableText(contentMarkdown);

  // Use extracted title, fall back to subject line if not found
  const finalTitle = title || subject || "Untitled Post";

  console.log(
    `[blogDraftParser.service.js] Parsed blog draft: "${finalTitle}" with ${bodyPortableText.length} blocks`
  );

  return {
    title: finalTitle,
    seoDescription,
    bodyPortableText,
  };
};
