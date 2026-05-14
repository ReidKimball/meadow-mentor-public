# Database Migrations

This directory contains database migration scripts for schema changes and data transformations.

## Meal Plans Migration

### migrate-meal-plans-to-templates.js

Migrates the meal planner from date-locked plans to template-based plans.

**What it does:**
1. Renames `mealplans` collection to `meal-plans`
2. Transforms plans to template format (dayNumber instead of dates)
3. Creates `calendar-assignments` for active plans
4. Removes old fields (startDate, endDate, isActive)
5. Adds new fields (duration, timesUsed, lastUsedDate)

**How to run:**

```bash
# From the project root
node backend/migrations/migrate-meal-plans-to-templates.js
```

**Prerequisites:**
- MongoDB connection string in `.env.config`
- Backup your database first!

**Backup command:**
```bash
mongodump --uri="your_mongodb_uri" --out=./backup
```

**What to expect:**
- Console output showing each step
- Verification at the end
- Safe to run multiple times (idempotent)

**After migration:**
- Old meal plans become reusable templates
- Active plans get calendar assignments
- Frontend will need updates to use new API

## Rollback

If you need to rollback:

```bash
# Restore from backup
mongorestore --uri="your_mongodb_uri" ./backup
```

## Testing

Test on a development database first:
1. Copy production data to dev
2. Run migration on dev
3. Test the application
4. Run on production when confident
