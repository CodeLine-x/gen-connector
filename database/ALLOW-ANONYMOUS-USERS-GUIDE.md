# 🔓 Allow Anonymous Users Guide

## Problem

You're getting one or both of these errors:

**Error 1:**
```
Failed to create session: new row violates row-level security policy for table "sessions"
```

**Error 2:**
```
Failed to create session: insert or update on table "sessions" violates foreign key constraint "sessions_user_id_fkey"
```

These happen because:
1. RLS policies require authenticated users (`auth.uid()`)
2. Foreign key constraint requires user_id to exist in `auth.users` table

## Solution

Run **TWO SQL scripts in order** to fix both issues.

### Steps to Fix:

1. **Open Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Select your project

2. **Navigate to SQL Editor**
   - Click on "SQL Editor" in the left sidebar

3. **Run Script #1: Fix RLS Policies**
   - Click "New Query"
   - Open `database/04-allow-anonymous-users.sql`
   - Copy ALL the contents and paste into SQL Editor
   - Click "Run" → Wait for ✅ SUCCESS message

4. **Run Script #2: Remove Foreign Key Constraint**
   - Click "New Query" (create another new query)
   - Open `database/05-remove-user-fkey-constraint.sql`
   - Copy ALL the contents and paste into SQL Editor
   - Click "Run" → Wait for ✅ SUCCESS message

5. **Verify**
   - Both scripts should show success messages
   - Try creating a session as an anonymous user again
   - It should work! 🎉

## What This Does

**Script #1** updates the RLS policies to allow ALL users (authenticated and anonymous) to:
- ✅ View sessions
- ✅ Create sessions
- ✅ Update sessions
- ✅ Delete sessions
- ✅ Access related data (segments, turns, actions, generated_content)

**Script #2** removes the foreign key constraint so that:
- ✅ Anonymous user IDs (UUIDs) can be used without existing in `auth.users`
- ✅ Authenticated user IDs still work normally
- ✅ Sessions can be created by anyone, authenticated or not

## For Production

**⚠️ Important:** This is an open access setup suitable for prototypes and testing. For production, you may want to:

1. Restrict anonymous users to only their own data
2. Add rate limiting
3. Implement proper user authentication
4. Add data retention policies

## Alternative: Restrict by User ID

If you want anonymous users to only access their own sessions (more secure), use this policy instead:

```sql
CREATE POLICY "Users can access own sessions" ON sessions
  FOR ALL USING (user_id = COALESCE(auth.uid()::text, user_id));
```

But for now, the open access approach works great for prototyping! 🚀
