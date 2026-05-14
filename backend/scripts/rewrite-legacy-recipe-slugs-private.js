/**
 * @file rewrite-legacy-recipe-slugs-private.js
 * @description One-time script to backfill `seoSlugCandidate` for private recipes that are missing it.
 *
 * We intentionally do NOT generate a `slug` here because private recipes do not need a public URL.
 * The goal is to ensure that when a legacy recipe is later made public/unlisted, it can produce a
 * better slug using the existing publish-time slug logic.
 *
 * Notes:
 * - Uses deterministic, title-based logic (no AI calls).
 * - Safe to run multiple times because it only targets recipes missing/blank `seoSlugCandidate`.
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Recipe from '../models/recipe.model.js';
import { generateSlug } from '../utils/generateSlug.js';

dotenv.config({ path: './backend/.env.config' });

const COPY_SUFFIX_RE = /\s*\((copy|copied)\)\s*$/i;
const COPY_TOKEN_SUFFIX_RE = /-(copy|copied)$/i;

const parseArgs = () => {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');

  const limitArg = args.find((a) => a.startsWith('--limit='));
  const limit = limitArg ? Number(limitArg.split('=')[1]) : null;

  return {
    dryRun,
    limit: Number.isFinite(limit) && limit > 0 ? limit : null,
  };
};

const main = async () => {
  const { dryRun, limit } = parseArgs();

  if (!process.env.DATABASE) {
    throw new Error('Missing required env var: DATABASE');
  }

  await mongoose.connect(process.env.DATABASE);

  const filter = {
    $or: [
      { visibility: 'private' },
      { visibility: { $exists: false }, isPublic: { $ne: true } },
    ],
    $and: [
      {
        $or: [
          { seoSlugCandidate: { $exists: false } },
          { seoSlugCandidate: null },
          { seoSlugCandidate: '' },
        ],
      },
    ],
  };

  const total = await Recipe.countDocuments(filter);
  const toProcess = limit ? Math.min(limit, total) : total;

  console.log(`[rewrite-legacy-recipe-slugs-private] Matched recipes: ${total}`);
  console.log(`[rewrite-legacy-recipe-slugs-private] Mode: ${dryRun ? 'DRY RUN' : 'WRITE'}`);
  if (limit) console.log(`[rewrite-legacy-recipe-slugs-private] Limit: ${limit}`);

  const cursor = Recipe.find(filter).cursor();

  let processed = 0;
  let updated = 0;

  for await (const recipe of cursor) {
    if (limit && processed >= limit) break;
    processed += 1;

    const title = typeof recipe.recipeTitle === 'string' ? recipe.recipeTitle : '';
    const cleanedTitle = title.replace(COPY_SUFFIX_RE, '').trim();
    const fallbackTitle = cleanedTitle || title;

    const baseCandidate = generateSlug(fallbackTitle, 'recipe', '')
      .replace(COPY_TOKEN_SUFFIX_RE, '')
      .trim();

    const candidate = (() => {
      if (baseCandidate && baseCandidate !== 'recipe') return baseCandidate;

      const safe = typeof fallbackTitle === 'string' ? fallbackTitle : '';
      const normalized = safe
        .trim()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/['’]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, '')
        .replace(COPY_TOKEN_SUFFIX_RE, '');

      return normalized;
    })();

    if (dryRun) {
      console.log(`[dry-run] ${recipe._id}: ${candidate}`);
      continue;
    }

    if (!candidate) {
      console.log(`[skipped] ${recipe._id}: missing recipeTitle`);
      continue;
    }

    recipe.seoSlugCandidate = candidate;

    await recipe.save();

    updated += 1;
    console.log(`[updated] ${recipe._id}: seoSlugCandidate set`);
  }

  console.log(`[rewrite-legacy-recipe-slugs-private] Processed: ${processed}/${toProcess}`);
  console.log(`[rewrite-legacy-recipe-slugs-private] Updated: ${updated}`);

  await mongoose.disconnect();
};

main().catch(async (err) => {
  console.error('[rewrite-legacy-recipe-slugs-private] Error:', err);
  try {
    await mongoose.disconnect();
  } catch (e) {
    // ignore
  }
  process.exitCode = 1;
});
