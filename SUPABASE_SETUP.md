# Supabase Setup Guide

## Step 1: Create Tables

1. Go to your Supabase project dashboard
2. Click on **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy and paste the contents of `database-schema.sql`
5. Click **Run** to execute the SQL

This will create:

- `sessions` table
- `conversations` table
- `generated_content` table
- Row Level Security (RLS) policies

## Step 2: Create Storage Buckets

1. Go to **Storage** in the left sidebar
2. Create the following buckets (make them **public**):

### Bucket: `audio-recordings`

- **Public**: Yes
- **File size limit**: 50 MB
- **Allowed MIME types**:
  - `audio/webm`
  - `audio/mp3`
  - `audio/wav`

### Bucket: `generated-images`

- **Public**: Yes
- **File size limit**: 50 MB
- **Allowed MIME types**:
  - `image/png`
  - `image/jpeg`
  - `image/webp`

### Bucket: `generated-videos`

- **Public**: Yes
- **File size limit**: 100 MB
- **Allowed MIME types**:
  - `video/mp4`
  - `video/webm`

### Bucket: `archive-images`

- **Public**: Yes
- **File size limit**: 50 MB
- **Allowed MIME types**:
  - `image/png`
  - `image/jpeg`
  - `image/webp`

## Step 3: Set Up Google OAuth (Optional)

1. Go to **Authentication** > **Providers** in Supabase
2. Enable **Google** provider
3. Follow the instructions to set up Google OAuth:
   - Create a Google Cloud project
   - Enable Google+ API
   - Create OAuth credentials
   - Add authorized redirect URIs:
     - `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`
   - Copy the Client ID and Client Secret to Supabase

## Step 4: Verify Setup

Run this query in the SQL Editor to verify tables exist:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('sessions', 'conversations', 'generated_content');
```

You should see all three tables listed.

## Step 5: Test Authentication

1. Go to `http://localhost:3001`
2. Click "Sign In to Begin"
3. Try signing up with email/password or Google
4. Verify you're redirected to `/categories`

## Troubleshooting

### Error: "relation 'public.sessions' does not exist"

- You need to run the `database-schema.sql` file in Supabase SQL Editor

### Error: "new row violates row-level security policy"

- Make sure you're logged in
- Check that the RLS policies were created correctly

### Error: "The resource already exists"

- The table or bucket already exists
- This is okay, you can skip that step

### Storage Upload Fails

- Make sure the storage buckets are created
- Verify the buckets are set to **public**
- Check the allowed MIME types match what you're uploading

## Quick Setup Script

If you prefer, you can use this SQL script to create storage buckets programmatically:

```sql
-- Note: Storage buckets may need to be created via UI as some Supabase versions
-- don't support creating buckets via SQL
```

## Next Steps

After setup is complete:

1. Make sure your `.env` file has the correct Supabase credentials
2. Restart your Next.js dev server
3. Test the authentication flow
4. Test creating a conversation session
