export interface Ingredient {
  name: string;
  amount: string;
  unit?: string;
  notes?: string;
}

export interface Recipe {
  _id: string;
  slug: string;
  recipeTitle: string;
  recipeDescription: string;
  recipeImage?: {
    thumbnail?: string;
    display?: string;
    original?: string;
  };
  recipeDiet: string;
  mealType: string;
  tags: string[];
  totalTime: string;
  prepTime?: string;
  cookTime?: string;
  recipeYield?: string;
  averageRating?: number;
  ratings?: any[];
  isFirstHealingMeal?: boolean;
  ingredients?: Ingredient[];
  steps?: string[];
}
