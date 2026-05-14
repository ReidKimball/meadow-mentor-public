Here is the **Master Spec Sheet** for your AI Coding Agent. Copy and paste the block below directly into your coding environment.

***

# Page Specification: 7-Day GF & DF Meal Plan
**Target URL:** `/plans/gf-df-7-day-starter`
**Target Keyword:** `gluten and dairy free meal plan`
**Brand Voice:** Chef Kay (Warm, Empathetic, Capable).
**Primary Color:** Deep Forest Green (`#013D1D`)
**Accent Color:** Amber Rich (`#FFBF00`)

---

## 1. Metadata (Next.js `metadata` object)
*   **Title:** "7-Day Meal Plan Gluten Free Dairy Free | Meadow Mentor"
*   **Description:** "A complete 7-day gluten and dairy free meal plan. Delicious, gut-friendly recipes designed to help you thrive without the restriction fatigue. Try it free."
*   **OpenGraph Title:** "The 'No-Miss' Gluten & Dairy Free Meal Plan."

---

## 2. Page Layout & Content

### Section A: The Hero (Visual & H1)
*   **H1 Headline:** "7-Day Gluten & Dairy Free Meal Plan"
*   **Subheadline:** "Stop asking 'What can I eat?' and start asking 'What do I *want* to eat?'"
*   **Chef Kay Intro (Text):**
    > "Navigating two restrictions at once is exhausting. I’ve done the heavy lifting for you. This plan uses the **Mediterranean** framework—focusing on fresh proteins, healthy fats, and vibrant vegetables—naturally modified to be 100% Gluten and Dairy Free. No cardboard bread, just real food."

### Section B: The "Answer Engine" Block (Crucial for AEO)
*   *Developer Note:* Render this as a simple, semantic HTML `<table>` or `<ul>` list immediately after the intro. This is for AI bots to scrape quickly.
*   **Title:** "At a Glance: Your Week of Eats"
*   **Content:**
    *   **Day 1:** Quinoa Porridge / Turmeric Chicken Soup / Baked Salmon
    *   **Day 2:** Oat Pancakes / Leftover Soup / Turkey Zucchini Stir-Fry
    *   **Day 3:** Green Smoothie / Turkey Burger Bowl / Beef Stew
    *   **Day 4:** Spinach Scramble / Tuna Salad / Roasted Chicken Thighs
    *   **Day 5:** Chia Pudding / Chicken Rice Soup / Baked Cod
    *   **Day 6:** Sweet Potato Hash / Leftover Cod / Shepherd’s Pie
    *   **Day 7:** Pumpkin Oatmeal / Leftover Pie / One-Pan Roast Chicken

### Section C: The Visual Plan (The "Meat")
*   *Developer Note:* Iterate the `DayViewCard` component 7 times.
*   *Tag Logic:* Set the component tag to `"GF & DF Safe"` (Color: Amber).

**Data for Component Injection:**

*   **Day 1**
    *   Breakfast: Warm Quinoa Porridge with Stewed Blueberries
    *   Lunch: Lemon-Turmeric Chicken Soup (Rice Noodles)
    *   Dinner: Baked Salmon with Maple-Glazed Carrots
*   **Day 2**
    *   Breakfast: Banana Oat Pancakes (Almond Milk)
    *   Lunch: Leftover Turmeric Chicken Soup
    *   Dinner: Ground Turkey Stir-Fry with Zucchini Noodles
*   **Day 3**
    *   Breakfast: Green Smoothie (Spinach, Pineapple, Avocado)
    *   Lunch: Turkey Burger Salad Bowl (Avocado Oil Mayo)
    *   Dinner: Slow Cooker Beef Stew (Potatoes & Carrots)
*   **Day 4**
    *   Breakfast: Scrambled Eggs with Spinach
    *   Lunch: Mediterranean Tuna Salad with Olives
    *   Dinner: Grilled Chicken Thighs with Roasted Sweet Potatoes
*   **Day 5**
    *   Breakfast: Chia Seed Pudding with Coconut Milk
    *   Lunch: Chicken & Rice Soup (Bone Broth Base)
    *   Dinner: Baked Cod with Steamed Green Beans
*   **Day 6**
    *   Breakfast: Sweet Potato Hash with Poached Eggs
    *   Lunch: Leftover Baked Cod & Greens
    *   Dinner: Shepherd’s Pie (Cauliflower Mash Topping)
*   **Day 7**
    *   Breakfast: Pumpkin Spice Oatmeal (GF Oats)
    *   Lunch: Shepherd's Pie Leftovers
    *   Dinner: Roast Chicken with Root Vegetables (One Pan)

### Section D: "How to Use This in the App" (The Conversion Bridge)
*   *Style:* High contrast box (Green background, White text).
*   **Headline:** "Customize This Plan Instantly"
*   **Body Copy:**
    > "Need to swap the Salmon? Or want to generate a shopping list? You can run this exact logic in the Meadow Mentor app:"
*   **Steps (Visual List):**
    1.  **Select Diet:** Choose **"Mediterranean"** (Best for variety).
    2.  **Add Filters:** Toggle ON **"Gluten-Free"** and **"Dairy-Free"**.
    3.  **Click Generate:** Chef Kay will build your custom menu in seconds.
*   **CTA Button:** "Start My Custom Plan Free" (Links to Signup).

### Section E: FAQ (For Long-Tail Keywords)
*   **Q: Can I use this plan for IBS?**
    *   *A:* This base plan is gentle, but if you have IBS, use the Meadow Mentor app to overlay the **"Low FODMAP"** filter on top of these recipes.
*   **Q: Is this plan high protein?**
    *   *A:* Yes. We prioritize lean meats and fish to keep you satiated without the dairy bloat.

---

## 3. Technical Requirements
1.  **Images:** Use placeholders or reuse existing assets from your recipe database for the thumbnails.
2.  **Responsive:** The `DayViewCard` must stack vertically on mobile.
3.  **Internal Linking:** If you mention "Bone Broth" or "Chicken," link to those specific recipes if they exist in your `/recipes/` folder.