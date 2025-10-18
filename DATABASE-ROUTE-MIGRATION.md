# Database Migration: Update Route Names

## Problem

The `sessions` table in Supabase has a CHECK constraint that only allows the old route names:

- `birth_childhood`
- `coming_of_age`
- `marriage`
- `death`

The new route names are:

- `childhood` ✅
- `school-life` ✅
- `work-life` ✅
- `relationships` ✅
- `hobbies` ✅
- `community` ✅

## Solution

Run the migration script to update the database constraint.

---

## How to Apply the Migration

### Option 1: Via Supabase Dashboard (Recommended)

1. **Go to your Supabase Dashboard**

   - Navigate to: https://supabase.com/dashboard
   - Select your project

2. **Open SQL Editor**

   - Click on "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Copy and Paste the Migration Script**

   - Open the file: `database-migration-update-routes.sql`
   - Copy ALL the contents
   - Paste into the SQL Editor

4. **Run the Migration**

   - Click the "Run" button (or press Ctrl+Enter)
   - Wait for the success message

5. **Verify the Migration**
   ```sql
   -- Run this query to verify the constraint was updated
   SELECT constraint_name, check_clause
   FROM information_schema.check_constraints
   WHERE constraint_name = 'sessions_rite_of_passage_check';
   ```

---

### Option 2: Via Supabase CLI

If you have Supabase CLI installed:

```bash
# Run the migration
supabase db push

# Or execute the SQL file directly
psql $DATABASE_URL < database-migration-update-routes.sql
```

---

## What the Migration Does

1. **Drops the old CHECK constraint** that only allowed 4 old route names
2. **Adds a new CHECK constraint** that allows both old and new route names (for backward compatibility)
3. **Updates existing data** (if any) to use the new route names
4. **Adds a comment** to the column for documentation

---

## After Migration

Once the migration is complete, your app will be able to:

- ✅ Create sessions with new route names (`childhood`, `school-life`, etc.)
- ✅ Still support old route names (for any existing data)
- ✅ Navigate to all 6 new category pages without errors

---

## Rollback (If Needed)

If you need to rollback to the old constraint:

```sql
-- Drop the new constraint
ALTER TABLE sessions DROP CONSTRAINT sessions_rite_of_passage_check;

-- Add back the old constraint
ALTER TABLE sessions
ADD CONSTRAINT sessions_rite_of_passage_check
CHECK (rite_of_passage IN ('birth_childhood', 'coming_of_age', 'marriage', 'death'));
```

---

## Files Created/Updated

- ✅ `database-migration-update-routes.sql` - Migration script
- ✅ `database-v2-fresh-install.sql` - Updated fresh install script
- ✅ `src/lib/promptTemplates.ts` - Added prompts for new routes
- ✅ `DATABASE-ROUTE-MIGRATION.md` - This guide

---

## Need Help?

If you encounter any issues:

1. Check the Supabase logs for error messages
2. Verify you have admin access to the database
3. Make sure no active sessions are using the old constraint
