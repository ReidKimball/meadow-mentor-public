/**
 * @file rewrite-legacy-recipe-slugs-public.js
 * @description One-time script for externally visible recipes (public/unlisted) to copy the existing
 * `slug` value into `seoSlugCandidate`.
 *
 * This is useful when your public slugs are already “perfect”, but the stored `seoSlugCandidate`
 * is missing/low-quality. This ensures that when someone copies a public recipe, the copy retains
 * a good candidate to generate a shareable slug later.
 *
 * Notes:
 * - This intentionally breaks old slug URLs (no alias/redirect support).
 * - Uses the Recipe model's existing pre-save slug generation logic, including collision handling.
 * - Targets only externally visible recipes (visibility: public|unlisted, or legacy isPublic: true).
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Recipe from '../models/recipe.model.js';

dotenv.config({ path: './backend/.env.config' });

const LEGACY_SLUG_RE = /-[0-9a-f]{24}$/i;

const parseArgs = () => {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const includeLegacy = args.includes('--include-legacy');

  const limitArg = args.find((a) => a.startsWith('--limit='));
  const limit = limitArg ? Number(limitArg.split('=')[1]) : null;

  return {
    dryRun,
    includeLegacy,
    limit: Number.isFinite(limit) && limit > 0 ? limit : null,
  };
};

const main = async () => {
  const { dryRun, limit, includeLegacy } = parseArgs();

  if (!process.env.DATABASE) {
    throw new Error('Missing required env var: DATABASE');
  }

  await mongoose.connect(process.env.DATABASE);

  const filter = {
    $or: [
      { visibility: { $in: ['public', 'unlisted'] } },
      { visibility: { $exists: false }, isPublic: true },
      { isPublic: true },
    ],
    slug: { $exists: true, $ne: '' },
  };

  const total = await Recipe.countDocuments(filter);
  const toProcess = limit ? Math.min(limit, total) : total;

  console.log(`[rewrite-legacy-recipe-slugs-public] Matched recipes: ${total}`);
  console.log(`[rewrite-legacy-recipe-slugs-public] Mode: ${dryRun ? 'DRY RUN' : 'WRITE'}`);
  console.log(`[rewrite-legacy-recipe-slugs-public] Include legacy slugs: ${includeLegacy ? 'YES' : 'NO'}`);
  if (limit) console.log(`[rewrite-legacy-recipe-slugs-public] Limit: ${limit}`);

  const cursor = Recipe.find(filter).cursor();

  let processed = 0;
  let updated = 0;
  let skippedLegacy = 0;
  let skippedUnchanged = 0;

  for await (const recipe of cursor) {
    if (limit && processed >= limit) break;
    processed += 1;

    const slug = typeof recipe.slug === 'string' ? recipe.slug.trim() : '';
    if (!slug) {
      continue;
    }

    const isLegacy = LEGACY_SLUG_RE.test(slug);
    if (isLegacy && !includeLegacy) {
      skippedLegacy += 1;
      if (dryRun) {
        console.log(`[dry-run][skipped-legacy] ${recipe._id}: ${slug}`);
      }
      continue;
    }

    const currentCandidate = typeof recipe.seoSlugCandidate === 'string'
      ? recipe.seoSlugCandidate.trim()
      : '';

    if (currentCandidate === slug) {
      skippedUnchanged += 1;
      if (dryRun) {
        console.log(`[dry-run][unchanged] ${recipe._id}: ${slug}`);
      }
      continue;
    }

    if (dryRun) {
      console.log(`[dry-run][update] ${recipe._id}: seoSlugCandidate '${currentCandidate}' -> '${slug}'`);
      continue;
    }

    recipe.seoSlugCandidate = slug;
    await recipe.save();
    updated += 1;
    console.log(`[updated] ${recipe._id}: seoSlugCandidate set from slug`);
  }

  console.log(`[rewrite-legacy-recipe-slugs-public] Processed: ${processed}/${toProcess}`);
  console.log(`[rewrite-legacy-recipe-slugs-public] Updated seoSlugCandidate: ${updated}`);
  console.log(`[rewrite-legacy-recipe-slugs-public] Skipped legacy: ${skippedLegacy}`);
  console.log(`[rewrite-legacy-recipe-slugs-public] Skipped unchanged: ${skippedUnchanged}`);

  await mongoose.disconnect();
};

main().catch(async (err) => {
  console.error('[rewrite-legacy-recipe-slugs-public] Error:', err);
  try {
    await mongoose.disconnect();
  } catch (e) {
    // ignore
  }
  process.exitCode = 1;
});
