import { createClient } from '@sanity/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables from backend/.env.config
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../backend/.env.config') });

const SANITY_PROJECT_ID = process.env.SANITY_PROJECT_ID;
const SANITY_DATASET = process.env.SANITY_DATASET;
const SANITY_TOKEN = process.env.SANITY_API_MEADOW_BLOG_DRAFTS_TOKEN;

if (!SANITY_TOKEN || !SANITY_PROJECT_ID || !SANITY_DATASET) {
  console.error('Error: Required Sanity environment variables are missing from backend/.env.config.');
  process.exit(1);
}

const client = createClient({
  projectId: SANITY_PROJECT_ID,
  dataset: SANITY_DATASET,
  useCdn: false, // Must be false for writing
  token: SANITY_TOKEN,
  apiVersion: '2024-02-22',
});

const generateKey = () => {
  return Math.random().toString(36).substring(2, 10);
};

const parseInlineFormatting = (text) => {
  const children = [];
  const markDefs = [];
  let remaining = text;

  const pattern = /(\*\*(.+?)\*\*|\*(.+?)\*|\[(.+?)\]\((.+?)\))/g;

  let lastIndex = 0;
  let match;

  while ((match = pattern.exec(text)) !== null) {
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
      children.push({
        _type: "span",
        _key: generateKey(),
        text: match[2],
        marks: ["strong"],
      });
    } else if (match[3]) {
      children.push({
        _type: "span",
        _key: generateKey(),
        text: match[3],
        marks: ["em"],
      });
    } else if (match[4] && match[5]) {
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

const markdownToPortableText = (markdown) => {
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

    if (!trimmedLine) {
      flushParagraph();
      flushList();
      continue;
    }

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

    const bulletMatch = trimmedLine.match(/^[\*\-]\s+(.+)$/);
    if (bulletMatch) {
      flushParagraph();
      inList = true;
      listItems.push(bulletMatch[1]);
      continue;
    }

    const quoteMatch = trimmedLine.match(/^>\s*(.+)$/);
    if (quoteMatch) {
      flushParagraph();
      flushList();
      blocks.push(createTextBlock(quoteMatch[1], "blockquote"));
      continue;
    }

    if (trimmedLine.match(/^-{3,}$/) || trimmedLine.match(/^\*{3,}$/)) {
      flushParagraph();
      flushList();
      continue;
    }

    if (inList) {
      flushList();
    }
    currentParagraph.push(trimmedLine);
  }

  flushParagraph();
  flushList();

  return blocks;
};

async function getReidKimballAuthorId() {
  const query = `*[_type == "author" && name match "Reid Kimball"][0]._id`;
  const authorId = await client.fetch(query);
  
  if (!authorId) {
     console.warn('Warning: Could not find author "Reid Kimball" in Sanity. Please ensure this author exists.');
     return null;
  }
  return authorId;
}

async function publishPost() {
  const args = process.argv.slice(2);
  const dataPath = args[0];

  if (!dataPath) {
    console.error('Error: Please provide the path to the post JSON data file.');
    process.exit(1);
  }

  try {
    const rawData = fs.readFileSync(dataPath, 'utf-8');
    const postData = JSON.parse(rawData);

    // Convert Markdown to Portable Text using custom parser
    const portableTextBlocks = markdownToPortableText(postData.markdownBody);

    // Resolve Author Reference
    const authorId = await getReidKimballAuthorId();

    // Construct Document
    const doc = {
      _type: 'post',
      title: postData.title,
      slug: {
        _type: 'slug',
        current: postData.slug,
      },
      description: postData.description,
      publishedAt: new Date().toISOString(),
      body: portableTextBlocks,
      seo: {
        metaTitle: postData.seoTitle || postData.title,
        metaDescription: postData.seoDescription || postData.description,
      }
    };

    if (authorId) {
      doc.author = {
        _type: 'reference',
        _ref: authorId,
      };
    }

    console.log(`Publishing post: "${doc.title}"...`);
    const response = await client.create(doc);
    
    console.log(`✅ Successfully published post! Document ID: ${response._id}`);
    
    // Cleanup temp file
    fs.unlinkSync(dataPath);
    console.log(`Cleaned up temporary data file: ${dataPath}`);

  } catch (error) {
    console.error('Error publishing post:', error);
    process.exit(1);
  }
}

publishPost();
