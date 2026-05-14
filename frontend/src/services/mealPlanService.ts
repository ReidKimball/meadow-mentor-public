/**
 * @file Public meal plan service.
 * @description Provides server-safe helper functions for fetching **public/unlisted** meal plans
 * from the backend API for SEO pages under `/plans/*`.
 *
 * Uses Next.js ISR by configuring `fetch` with `next.revalidate`.
 *
 * @requires module:fetch - Built-in fetch API (Next.js runtime).
 * @requires @/lib/api - API base URL constants.
 * @author Cascade
 * @version 1.0.0
 * @date 2025-12-17
 */

import { API_BASE_URL } from '@/lib/api';

export interface PublicMealPlanListItem {
  _id: string;
  planName: string;
  slug: string;
  duration: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface PublicMealSlot {
  recipeId?: string;
  recipeTitle?: string;
  recipeDescription?: string;
  recipeDiet?: string;
  recipeImage?: {
    thumbnail?: string;
    display?: string;
    original?: string;
  };
  mealType?: string;
  isPlaceholder?: boolean;
  title?: string;
  description?: string;
  recipeSlug?: string | null;
}

export interface PublicMealPlanDay {
  dayNumber: number;
  meals: {
    breakfast: PublicMealSlot | null;
    lunch: PublicMealSlot | null;
    dinner: PublicMealSlot | null;
    snack: PublicMealSlot | null;
  };
}

export interface PublicMealPlan {
  _id: string;
  planName: string;
  visibility: 'public' | 'unlisted';
  slug: string;
  duration: number;
  days: PublicMealPlanDay[];
  settings?: {
    dynamicPreferences?: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface PublicMealPlanListResponse {
  success: boolean;
  data: PublicMealPlanListItem[];
}

export interface PublicMealPlanBySlugResponse {
  success: boolean;
  data: PublicMealPlan;
}

/**
 * Fetches all public meal plans.
 * @async
 * @function getPublicMealPlans
 * @returns {Promise<PublicMealPlanListResponse>} Response containing public meal plans.
 * @throws {Error} If the network request fails.
 */
export async function getPublicMealPlans(): Promise<PublicMealPlanListResponse> {
  const url = `${API_BASE_URL}/api/public-meal-plans`;

  const response = await fetch(url, {
    next: { revalidate: 60 },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch public meal plans: ${response.status}`);
  }

  return response.json();
}

/**
 * Fetches a single public or unlisted meal plan by slug.
 * @async
 * @function getPublicMealPlanBySlug
 * @param {string} slug - The meal plan slug.
 * @returns {Promise<PublicMealPlanBySlugResponse | null>} Response or null when not found.
 * @throws {Error} If the network request fails.
 */
export async function getPublicMealPlanBySlug(
  slug: string
): Promise<PublicMealPlanBySlugResponse | null> {
  const url = `${API_BASE_URL}/api/public-meal-plans/slug/${encodeURIComponent(slug)}`;

  const response = await fetch(url, {
    next: { revalidate: 60 },
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`Failed to fetch meal plan: ${response.status}`);
  }

  return response.json();
}
