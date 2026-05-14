
# Incremental Component Reorganization Plan

This document outlines a structured, incremental plan to reorganize the `components` directory. This approach is designed to be safe, manageable, and highly automatable with the help of an AI assistant.

## The Strategy: Incremental Refactoring

The core idea is to refactor one "module" or "feature" at a time. A module is a logical grouping of components that work together (e.g., `auth`, `payments`, `shopping-list`).

For each module, the process is:

1.  **Create** the new destination directory.
2.  **Move** a small, related group of component files.
3.  **Find** all references to the moved files in the codebase.
4.  **Update** the import paths to reflect the new location.
5.  **Verify** the changes by running tests and, if necessary, manually checking the application.

This cycle is repeated for each module, ensuring the application remains in a working state throughout the process.

## AI-Powered Automation Workflow

An AI assistant can automate the most tedious parts of this process. Here’s how the AI can execute each step of the plan:

1.  **Directory Creation:** The AI can use shell commands to create the new directories as needed.
2.  **File Moving:** The AI can move the component files to their new locations.
3.  **Impact Analysis (Finding References):** The AI can use search tools (`grep`, `search_file_content`) to find all files that import the moved components.
4.  **Automated Refactoring (Updating Imports):** The AI can read the content of each affected file, construct the correct new import path, and use a `replace` operation to update the code. This is far more efficient and less error-prone than manual updates.
5.  **Verification:** The AI can run your project's test suite (`npm test`, `yarn test`, etc.) to automatically verify that the changes have not introduced any regressions.

By following this structured plan, the AI can systematically work through the reorganization, requiring your intervention only for strategic decisions and approvals.

## Step-by-Step Reorganization Plan

Here is the proposed sequence of modules to refactor. This order is designed to minimize dependencies and group related components logically.

### Phase 1: Foundational Modules

These modules are core to the application but have relatively few dependencies, making them a good starting point.

**1. The `api` (or `services`) Module**
*   **Description:** Centralize all components that are responsible for making API calls.
*   **Files to move:** `AIService.jsx`, `CheckIngredients_Service.jsx`, `Coach_Service.jsx`, `MealAnalysis_Service.jsx`, `MealPlanner_Service.jsx`, `Meal_Service.jsx`, `MedicalReportAnalysis_Service.jsx`, `Recipe_Service.jsx`
*   **Destination:** `src/components/api/`

**2. The `auth` Module**
*   **Description:** Group all components related to user authentication and authorization.
*   **Files to move:** `AdminRoute.jsx`, `Login.jsx`, `LoginButton.jsx`, `LogoutButton.jsx`, `Profile.jsx`, `ProfileButton.jsx`, `ProtectedRoute/`, `ResetPassword.jsx`, `Signup.jsx`, `withAuth0.jsx`
*   **Destination:** `src/components/auth/`

**3. The `common` Module**
*   **Description:** Consolidate shared, reusable components that are not tied to a specific feature.
*   **Files to move:** `Copy_Text.jsx`, `IngredientsInput.jsx`, `IngredientsList.jsx`, `LoadingSpinner.jsx`, `MetaTags.jsx`, `UpgradeModal.jsx`, `ConfettiModal.jsx`
*   **Destination:** `src/components/common/`

### Phase 2: Feature-Specific Modules

Once the foundational modules are in place, we can move on to the feature-specific components.

**4. The `payments` Module**
*   **Description:** Group all components related to pricing and payments.
*   **Files to move:** `GetEarlyAdopterPlan.jsx`, `getPremiumStatus.jsx`, `PricingTable.jsx`, `stripePayment.jsx`, `stripePayment_For Stripe Test and Live.jsx`, `earlyAdopterPanel.jsx`, `premiumPanel.jsx`, `standardPanel.jsx`
*   **Destination:** `src/components/features/payments/`

**5. The `ai` Module**
*   **Description:** Centralize all AI-related UI components.
*   **Files to move:** `CheckIngredients_AI.jsx`, `Coach_AI.jsx`, `Meal_AI.jsx`, `Recipe_AI.jsx`, `Pages/AIChatInterface.jsx`, `Pages/AskKay/`
*   **Destination:** `src/components/features/ai/`

**6. The `admin` Module**
*   **Description:** Admin pages and tools.
*   **Files to move:** `AdminPanel.jsx`, `Pages/FoodDbAdminPage.jsx`
*   **Destination:** `src/components/features/admin/`

**7. The `blog` Module**
*   **Description:** Blog and news pages.
*   **Files to move:** `Pages/BlogPostPage.tsx`, `WeeklyMeadow.jsx`
*   **Destination:** `src/components/features/blog/`

**8. The `food-db` Module**
*   **Description:** Food database UI.
*   **Files to move:** `Pages/FoodDbPage/` (all: `FoodCompass.jsx`, `FoodDbList.jsx`, `FoodDetailModal.jsx`, `FoodSearch.jsx`, `index.js`)
*   **Destination:** `src/components/features/food-db/`

**9. The `meal-planner` Module**
*   **Description:** Food journal and meal planner.
*   **Files to move:** `Pages/MealDetailViewer.jsx`, `Pages/MealFormModal.jsx`, `Pages/MealHistoryList.jsx`, `Pages/DateRangeComplianceScore.jsx`, `Pages/FoodJournal_AI_Analysis.jsx`
*   **Destination:** `src/components/features/meal-planner/`

**10. The `meal-presets` Module**
*   **Description:** Meal preset CRUD and selection.
*   **Files to move:** `MealPresets/` (all)
*   **Destination:** `src/components/features/meal-presets/`

**11. The `recipes` Module**
*   **Description:** Public recipes and saved recipes UI.
*   **Files to move:** `Pages/Recipes/` (`PublicRecipeDetailPage.jsx`, `RecipeSummaryCard.jsx`), `Pages/SavedRecipes/` (`PublicRecipesPage.jsx`, `SavedRecipesPage.jsx`)
*   **Destination:** `src/components/features/recipes/`

**12. The `shopping-list` Module**
*   **Description:** Shopping list management.
*   **Files to move:** `Pages/ShoppingList/` (`AddIngredientModal.jsx`, `EditIngredientModal.jsx`, `IngredientRow.jsx`, `ShoppingList.jsx`)
*   **Destination:** `src/components/features/shopping-list/`

### Phase 3: Top-Level Pages and UI

Finally, organize the main pages and the global UI elements.

**6. The `pages` Module**
*   **Description:** Move all top-level page components.
*   **Files to move:** `About.jsx`, `Features.jsx`, `LandingPageV2.jsx` (consider renaming to `Home.jsx`), `Account.jsx`, `HealthDashboard.jsx`, `Pages/GettingStarted.jsx`, `Pages/Guidebook.jsx`, `Pages/Pricing.jsx`, `Pages/Privacy.jsx`, `Pages/Terms.jsx`, `Roadmap.jsx` (plus `RoadmapTable.jsx`), `Pages/BlogPostPage.tsx`, `Pages/SavedDocuments.jsx`, `Thankyou.jsx`, `Updates.jsx`, `WeeklyMeadow.jsx`
*   **Destination:** `src/components/pages/`
*   **Landing page sections:** Move `LandingV2/` subcomponents to `src/components/pages/home/sections/` (or similar) and update imports from `LandingPageV2.jsx` accordingly in a later pass.

**7. The `ui` Module**
*   **Description:** Group general-purpose UI elements.
*   **Files to move:** `UI/`, `OpenAppButton.jsx`, `SaveResponseButton.jsx`
*   **Destination:** `src/components/ui/`

### Phase 4: Housekeeping and Conventions

*   **Directory casing:** Normalize to lowercase over time (`Common/` -> `common/`, `UI/` -> `ui/`, `Layout/` -> `layout/`).
*   **Utilities:** Consider relocating `components/utils/` to `src/utils/` and updating imports.
*   **WIP/Legacy:** Leave `Pages/temp_delete/` and duplicate files (e.g., `Pages/GettingStarted copy_250718.jsx`) untouched for now.

## Example: Executing the First Step with AI

Here’s how you would instruct an AI to perform the first step (refactoring the `api` module):

**You:** "Let's start the component reorganization. Please execute Phase 1, Step 1: the `api` module."

**AI:**

1.  "Okay, I will create the directory `src/components/api/`."
2.  "Now, I will move the following files to `src/components/api/`: `AIService.jsx`, `CheckIngredients_Service.jsx`, ..."
3.  "I will now search the codebase for all files that import these components."
4.  "I have found 15 files that need to be updated. I will now update the import paths in each file."
5.  "The import paths have been updated. I will now run the test suite to verify the changes."
6.  "All tests passed. The `api` module has been successfully refactored. Shall I proceed to the next step?"

This structured, AI-assisted approach will make the reorganization process faster, safer, and more manageable.
