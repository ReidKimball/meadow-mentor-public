import {
  sanitizeName,
  sanitizeEmail,
  containsUrl,
  containsHtml,
  detectMaliciousPatterns,
} from "../../utils/sanitization.utils.js";

describe("Sanitization Utils", () => {
  describe("sanitizeName", () => {
    test("should trim and normalize spaces", () => {
      const input = "  John   Doe  ";
      const output = sanitizeName(input);
      expect(output).toBe("John Doe");
    });

    test("should limit length to 50 characters", () => {
      const longName = "a".repeat(80);
      const output = sanitizeName(longName);
      expect(output.length).toBeLessThanOrEqual(50);
    });

    test("should remove zero-width characters", () => {
      const input = "John\u200B Doe";
      const output = sanitizeName(input);
      expect(output).toBe("John Doe");
    });
  });

  describe("sanitizeEmail", () => {
    test("should trim and lowercase emails", () => {
      const input = "  USER@Example.COM  ";
      const output = sanitizeEmail(input);
      expect(output).toBe("user@example.com");
    });

    test("should limit email length", () => {
      const localPart = "a".repeat(260);
      const input = `${localPart}@example.com`;
      const output = sanitizeEmail(input);
      expect(output.length).toBeLessThanOrEqual(254);
    });
  });

  describe("containsUrl", () => {
    test("should detect URLs", () => {
      expect(containsUrl("Visit https://example.com")).toBe(true);
      expect(containsUrl("Check bit.ly/abc")) // domain pattern still matches
        .toBe(true);
      expect(containsUrl("Normal text")).toBe(false);
    });
  });

  describe("containsHtml", () => {
    test("should detect HTML tags", () => {
      expect(containsHtml("<script>alert(1)</script>")).toBe(true);
      expect(containsHtml("<img src=x>"))
        .toBe(true);
      expect(containsHtml("Normal text")).toBe(false);
    });
  });

  describe("detectMaliciousPatterns", () => {
    test("should detect multiple patterns in attack payload", () => {
      const input =
        "<script>alert('XSS')</script> Click here: https://evil.com contact me@test.com";
      const patterns = detectMaliciousPatterns(input);

      expect(patterns).toEqual(
        expect.arrayContaining(["URL", "HTML", "EMAIL"])
      );
    });

    test("should handle the real attack payload from incident", () => {
      const input =
        "ı Seni Bekliyor - Tek Tıkla Al! https://bit.ly/4qm1a9D ✨";
      const patterns = detectMaliciousPatterns(input);

      expect(patterns).toContain("URL");
    });
  });
});
