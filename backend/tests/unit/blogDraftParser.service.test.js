/**
 * @file blogDraftParser.service.test.js
 * @description Unit tests for the blog draft parser service.
 * Tests HTML to text conversion, field extraction, and Portable Text generation.
 * @author Antigravity
 * @version 1.0.0
 * @date 2026-01-22
 */

import {
  parseGmailHtmlToText,
  extractBlogFields,
  markdownToPortableText,
  parseBlogDraft,
} from "../../services/blogDraftParser.service.js";

describe("blogDraftParser.service", () => {
  describe("parseGmailHtmlToText", () => {
    it("should convert <br> tags to newlines", () => {
      const html = "Line 1<br>Line 2<br/>Line 3";
      const result = parseGmailHtmlToText(html);
      expect(result).toBe("Line 1\nLine 2\nLine 3");
    });

    it("should decode HTML entities", () => {
      const html = "Tom &amp; Jerry &lt;3 &gt; friends &quot;forever&quot;";
      const result = parseGmailHtmlToText(html);
      expect(result).toBe('Tom & Jerry <3 > friends "forever"');
    });

    it("should remove remaining HTML tags", () => {
      const html =
        '<div class="test"><span style="color:red">Hello</span></div>';
      const result = parseGmailHtmlToText(html);
      expect(result).toContain("Hello");
      expect(result).not.toContain("<div");
      expect(result).not.toContain("<span");
    });

    it("should normalize multiple newlines", () => {
      const html = "Line 1<br><br><br><br>Line 2";
      const result = parseGmailHtmlToText(html);
      expect(result).toBe("Line 1\n\nLine 2");
    });
  });

  describe("extractBlogFields", () => {
    it("should extract title, SEO description, and content from structured format", () => {
      const plainText = `# Blog Post Draft

**Title:** Beyond Bland: Gut-Safe Flavor
**SEO Description:** Learn how to add flavor to your gut-healing diet without triggers.
---
**Content:**
# Introduction
This is the article body.

## Section 1
More content here.
---
**Image Ideation:**
A colorful kitchen scene with herbs.`;

      const result = extractBlogFields(plainText);

      expect(result.title).toBe("Beyond Bland: Gut-Safe Flavor");
      expect(result.seoDescription).toBe(
        "Learn how to add flavor to your gut-healing diet without triggers."
      );
      expect(result.contentMarkdown).toContain("# Introduction");
      expect(result.contentMarkdown).toContain("This is the article body.");
      expect(result.contentMarkdown).toContain("## Section 1");
      expect(result.contentMarkdown).not.toContain("Image Ideation");
    });

    it("should handle missing SEO description", () => {
      const plainText = `**Title:** Test Title
---
**Content:**
Article body here.`;

      const result = extractBlogFields(plainText);

      expect(result.title).toBe("Test Title");
      expect(result.contentMarkdown).toContain("Article body here.");
    });

    it("should strip out Image Ideation section", () => {
      const plainText = `**Title:** Test
**SEO Description:** Test desc
---
**Content:**
Body content
---
**Image Ideation:**
This should not appear in content.`;

      const result = extractBlogFields(plainText);

      expect(result.contentMarkdown).toBe("Body content");
      expect(result.contentMarkdown).not.toContain("Image Ideation");
      expect(result.contentMarkdown).not.toContain("should not appear");
    });
  });

  describe("markdownToPortableText", () => {
    it("should convert headings to blocks with correct styles", () => {
      const markdown = `# Heading 1
## Heading 2
### Heading 3`;

      const result = markdownToPortableText(markdown);

      expect(result.length).toBe(3);
      expect(result[0].style).toBe("h1");
      expect(result[1].style).toBe("h2");
      expect(result[2].style).toBe("h3");
    });

    it("should convert bullet lists", () => {
      const markdown = `Here is a list:
* Item 1
* Item 2
- Item 3`;

      const result = markdownToPortableText(markdown);

      const listItems = result.filter((block) => block.listItem === "bullet");
      expect(listItems.length).toBe(3);
    });

    it("should convert bold text to strong marks", () => {
      const markdown = "This is **bold** text.";
      const result = markdownToPortableText(markdown);

      expect(result.length).toBe(1);
      const boldSpan = result[0].children.find((c) =>
        c.marks?.includes("strong")
      );
      expect(boldSpan).toBeDefined();
      expect(boldSpan.text).toBe("bold");
    });

    it("should convert italic text to em marks", () => {
      const markdown = "This is *italic* text.";
      const result = markdownToPortableText(markdown);

      expect(result.length).toBe(1);
      const italicSpan = result[0].children.find((c) => c.marks?.includes("em"));
      expect(italicSpan).toBeDefined();
      expect(italicSpan.text).toBe("italic");
    });

    it("should convert links to markDefs", () => {
      const markdown = "Check out [this link](https://example.com) for more.";
      const result = markdownToPortableText(markdown);

      expect(result.length).toBe(1);
      expect(result[0].markDefs.length).toBe(1);
      expect(result[0].markDefs[0].href).toBe("https://example.com");

      const linkSpan = result[0].children.find((c) => c.text === "this link");
      expect(linkSpan).toBeDefined();
    });

    it("should skip horizontal rules", () => {
      const markdown = `Before
---
After`;

      const result = markdownToPortableText(markdown);

      const hrBlock = result.find((b) => b._type === "hr");
      expect(hrBlock).toBeUndefined();
    });
  });

  describe("parseBlogDraft", () => {
    it("should parse a complete Gmail draft to Sanity-ready data", () => {
      const htmlBody = `# Blog Post Draft<br>
<br>
**Title:** Food Reintroduction: Expand Your Diet Without Panic<br>
**SEO Description:** Terrified to reintroduce foods after an elimination diet? Learn how to expand your diet safely.<br>
---<br>
**Content:**<br>
# Food Reintroduction: Expand Your Diet Without Panic<br>
<br>
If you&apos;re on a healing diet, **reintroduction** can feel scary.<br>
<br>
Here are some tips:<br>
* Start slow<br>
* Keep a journal<br>
<br>
---<br>
**Image Ideation:**<br>
A person writing in a food journal.`;

      const subject = "Draft: Food Reintroduction";

      const result = parseBlogDraft(htmlBody, subject);

      expect(result.title).toBe(
        "Food Reintroduction: Expand Your Diet Without Panic"
      );
      expect(result.seoDescription).toContain("Terrified to reintroduce");
      expect(result.bodyPortableText.length).toBeGreaterThan(0);

      // Verify content doesn't contain Image Ideation
      const allText = result.bodyPortableText
        .map((b) => b.children?.map((c) => c.text).join(""))
        .join("");
      expect(allText).not.toContain("Image Ideation");
    });

    it("should fall back to subject line if title not found in body", () => {
      const htmlBody = "Just some plain content without structure.";
      const subject = "Fallback Title Here";

      const result = parseBlogDraft(htmlBody, subject);

      expect(result.title).toBe("Fallback Title Here");
    });
  });
});
