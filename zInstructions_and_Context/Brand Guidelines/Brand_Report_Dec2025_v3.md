# Brand Implementation Report - November 2025 (Updated)

**Date:** December 31, 2025
**Scope:** Branding, UI Components, and Landing Page Implementation (`frontend/src/app/page.tsx`)

## 1. Core Brand Identity

**Brand Name:** Meadow Mentor
**Tagline:** "Your personal chef for gut health." (always in lowercase to be friendly, approachable, conversational)
**Sub-Tagline:** "Meadow Mentor helps you navigate IBD, IBS, and Celiac so you can thrive, one meal at a time."
**Tagline Combo:** "Your personal chef for gut health. Thrive, one meal at a time."
**Mission:** Supporting IBD, IBS, Celiac, and digestive conditions with personalized recipes and meal plans.
**Brand Persona:** "The Creative Culinarian." A modern, data-driven concierge. Empathetic but competent; reduces mental load rather than adding to it.
**Social OG Image:** Alt metadata: "Meadow Mentor app interface with fresh ingredients. Text reads: Your personal chef for gut health."
**H1 and H2:** Every H1 and H2 must be hyper-specific about food and symptom management to anchor the brand.

---

## 2. Color Palette & Accessibility Rules

### Primary Colors
*   **Deep Forest Green:** `#013D1D`
    *   *Role:* **Primary Text & Action.** The "Workhorse."
    *   *Usage:* Headings, Body Text (Light Mode), Buttons (Light Mode), Footer Background (Dark Mode).
*   **Amber Rich:** `#FFBF00`
    *   *Role:* **High-Visibility Action & Brand Accent.** The "Firefly."
    *   *Usage:* Buttons (Dark Mode), Mascot Background, Iconography.
    *   *Strict Rule:* **Never use for text.** Never place white text on top of this.

### Secondary & UI Colors
*   **Soft Mint:** `#DCFCE7`
    *   *Usage:* Interactive borders (Dark Mode), Light backgrounds.
*   **Pale Cream:** `#FFF8E5`
    *   *Usage:* Hover states for Amber buttons, "Morning Sun" background.
*   **Status Colors:**
    *   **Safe/Allowed:** `#013D1D` (Green)
    *   **Avoid/Not Allowed:** `#740D06` (Red)

### Neutral Tones
*   **Headings:** `#1a1a1a` (Dark Gray/Black)
*   **Body Text:** `#1a1a1a`
*   **Taglines:** `#1f2937` (Slate Gray)
*   **Backgrounds:**
    *   `#fafafa` (Light Gray - Who Is This For, Main Page Bg, Founder Section)
    *   `#ffffff` (White - Recipe Section, Cards)

---

### Accessibility & Usage Rules (WCAG AA Compliance)
To ensure trust and readability for users with autoimmune conditions/visual impairments:
1.  **Text on Light Backgrounds:** MUST use **Deep Forest Green (`#013D1D`)**. Do not use Gray or Black. Links should be Underlined, not a different color.
2.  **Text on Dark Backgrounds:** MUST use **Pure White (`#FFFFFF`)**.
3.  **The "No-Go" Zone:**
    *   ❌ White text on Amber buttons.
    *   ❌ Amber text on White backgrounds.

---

## 3. Typography

**Fonts:**
*   **Headings:** `Montserrat` (Weights: 600, 700)
*   **Body:** `Source Sans 3` (Weights: 400, 600)

**Hierarchy:**
*   **Hero Heading (H1):** `#013D1D` | Weight: 700 | `2.5rem` (xs) - `3.5rem` (md) 
*   **Section Headings (H2):** `#013D1D` | Weight: 700 | `2rem` (xs) - `2.75rem` (md)
*   **Sub-Headings (H3):** `1.5rem` (xs) - `2rem` (md) | Weight: 600
*   **Body Text:** `#013D1D` (Light Mode) / `#FFFFFF` (Dark Mode)
*   **Body/Lead:** `1rem` - `1.25rem` | Line Height: 1.6

---

## 4. UI Components & Patterns

### Buttons (`CTAButton`)
We have established two distinct button contexts:

*   **Primary (Light Mode Context - "Morning Sun"):**
    *   Background: `#013D1D` (Deep Forest Green)
    *   Text: `#FFFFFF` (White)
    *   Hover: `#047857` (Section Green)
    *   Padding: `px: 4`, `py: 1.5` (Large)
*   **Primary (Dark Mode Context - "The Firefly"):**
    *   Background: `#FFBF00` (Amber Rich)
    *   Text: `#013D1D` (Deep Forest Green)
    *   Hover: `#FFF8E5` (Pale Cream) with Glow Effect.
    *   *CSS:* `box-shadow: 0 0 15px rgba(255, 191, 0, 0.6); transform: translateY(-2px);`

### Imagery: "Universal Kay"
Replaces generic circular accents with a specific brand asset.

*   **Visual Style:** Abstract SaaS Avatar (No limbs/wings). Modern, flat, vector-based.
*   **Key Features:**
    *   **Green Eyes:** Ties character to "Meadow" and primary text color.
    *   **"Morning Sun" Container:** The owl sits inside a specific container shape to ensure contrast on all backgrounds.
*   **Container Spec:**
    *   Color: `#FFBF00` (Amber Rich)
    *   Shape: Circle/Oval
    *   Depth: Inner Shadow (`box-shadow: inset 0 0 20px rgba(255, 160, 0, 0.6)`)
*   **Usage:** Use the same asset for both Light and Dark footers.
*   **Rounded Corners:**
    *   Recipe Cards: `borderRadius: 3` (approx 12px) or `22px`
    *   Soft, approachable feel.
*   **Shadows:**
    *   Deep, soft shadows for floating elements: `0 10px 40px rgba(0, 0, 0, 0.15)`
*   **Playful Rotations:**
    *   Recipe images in `RecipeSection` use slight rotations (`-8deg`, `8deg`, `2deg`) to create a dynamic, "scattered" look.

### Interactive Elements
*   **Frying Pan Animation:**
    *   CSS Keyframes for tilting pan and bouncing vegetables.
    *   Playful, engaging motion.
*   **Digestive Tract:**
    *   Interactive dots with Tooltips for educational content.
*   **Safe Foods Search:**
    *   Framer Motion for expanding/collapsing results.
    *   Immediate feedback with visual status chips.

---

## 5. Voice & Tone

*   **Empathetic but Capable:** "We know you're tired. Let us handle the meal planning."
*   **Empowering Verbs:** Shift away from "Healing" (which implies a cure) to **"Thrive," "Master," "Navigate," "Control."**
*   **Data-Driven:** Focus on pattern recognition and personalized insights, not just generic advice.

---

## 6. Footer Architecture

We have defined two rigid systems for footers.

### Option A: Dark Footer ("Forest & Firefly") - *Recommended*
*   **Background:** `#013D1D` (Deep Forest Green)
*   **Headings & Body Text:** `#FFFFFF` (Pure White)
*   **Links:** `#DCFCE7` (Light Mint, Underlined)
*   **Input Field Border:** `#DCFCE7` (Light Mint)
*   **Input Text:** `#FFFFFF` (White)
*   **CTA Button:** Amber (`#FFBF00`) with Green Text (`#013D1D`) -> Hovers to Cream w/ Glow.

### Option B: Light Footer ("Morning Sun")
*   **Background:** `#FFFFFF` (White)
*   **Headings & Body Text:** `#013D1D` (Deep Forest Green)
*   **Links:** `#013D1D` (Underlined)
*   **Input Field Border:** `#DCFCE7` (Light Mint)
*   **CTA Button:** Deep Green (`#013D1D`) with White Text (`#FFFFFF`).

---
