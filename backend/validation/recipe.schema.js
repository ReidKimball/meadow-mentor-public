import { z } from 'zod';

// Zod schema for recipe creation
export const createRecipeSchema = z.object({
  body: z.object({
    userPrompt: z.string().optional(),
    recipeTitle: z.string().min(1, 'Recipe title is required.'),
    recipeDiet: z.string().min(1, 'Recipe diet is required.'),
    recipeImage: z.string().url('Invalid URL for recipe image.').or(z.literal('')).optional(),
    recipeDescription: z.string().optional(),
    mealType: z.enum(['breakfast', 'lunch', 'dinner', 'snack', 'dessert', 'appetizer', 'side dish', 'sauce or condiment', 'staple', 'beverage']).optional(),
    rating: z.number().min(0).max(5).optional(),
    prepTime: z.string().optional(),
    cookTime: z.string().optional(),
    totalTime: z.string().optional(),
    recipeYield: z.string().optional(),
    ingredients: z.array(
      z.object({
        name: z.string().min(1, 'Ingredient name required.'),
        amount: z.union([
          z.number().positive('Amount must be positive.'),
          z.string().min(1, 'Amount required.')
        ]),
        unit: z.string().optional(),
        notes: z.string().optional()
      })
    ).min(1, 'At least one ingredient is required.'),
    steps: z.array(z.string()).min(1, 'At least one step is required.'),
    calories: z.number().int().nonnegative().optional(),
    tags: z.array(z.string()).optional(),
    visibility: z.enum(['private', 'unlisted', 'public']).optional().default('private'),
    isPublic: z.boolean().optional().default(false),
    seoSlugCandidate: z.string().optional(),
  }),
});
