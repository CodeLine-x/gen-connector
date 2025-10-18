# Vercel Blob Storage Setup Guide

## Why Vercel Blob?

Vercel Blob is the recommended storage solution for this project because:

- ✅ **Seamless integration** with Next.js and Vercel
- ✅ **No configuration needed** - works out of the box
- ✅ **Automatic CDN** - files are served via Vercel's edge network
- ✅ **Simple API** - just `put()`, `list()`, and `del()`
- ✅ **Free tier** - 500GB bandwidth + 1GB storage per month
- ✅ **No buckets to manage** - just upload and go!

## Architecture

This app uses **API routes** for file uploads:

```
Client (Browser) → /api/upload → Vercel Blob → CDN
```

**Why API routes?**

- ✅ Keeps token secure on the server
- ✅ Works on both client and server
- ✅ No CORS issues
- ✅ Better security (token never exposed to client)

## Setup Steps

### Step 1: Create a Vercel Blob Store

1. **Go to Vercel Dashboard**: https://vercel.com/dashboard
2. **Navigate to Storage**:
   - Click on your project (or create one)
   - Click on the **"Storage"** tab at the top
3. **Create Blob Store**:
   - Click **"Create Database"** or **"Create Store"**
   - Select **"Blob"**
   - Give it a name (e.g., `gen-connector-storage`)
   - Click **"Create"**

### Step 2: Get Your Token

After creating the Blob store:

1. You'll see a token automatically generated
2. Copy the **`BLOB_READ_WRITE_TOKEN`**
3. It looks like: `vercel_blob_rw_XXXXXXXXXXXXXXXX`

### Step 3: Add to Environment Variables

#### For Local Development:

1. Create a `.env` file in your project root (if you haven't already)
2. Add the token:

```env
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_XXXXXXXXXXXXXXXX
```

#### For Production (Vercel):

The token is automatically added to your environment variables when you create the Blob store in your Vercel project! No extra setup needed.

If you're deploying to a different Vercel project:

1. Go to **Project Settings** > **Environment Variables**
2. Add `BLOB_READ_WRITE_TOKEN` with your token
3. Redeploy your project

### Step 4: Verify Setup

Run your development server:

```bash
npm run dev
```

Try uploading audio by:

1. Sign in to your app
2. Go to "Coming of Age" (or any category)
3. Click "Start Recording"
4. Record some audio
5. Click "Stop"
6. Check the console - you should see the audio URL

## File Organization

Files are automatically organized with this structure:

```
audio-recordings/
  ├── {session-id}/
  │   ├── audio-1234567890.webm
  │   └── audio-1234567891.webm
generated-images/
  ├── {session-id}/
  │   └── image-1234567890.png
generated-videos/
  └── {session-id}/
      └── video-1234567890.mp4
```

## Pricing

### Free Tier (Hobby Plan):

- **Bandwidth**: 500GB/month
- **Storage**: 1GB

### Pro Plan:

- **Bandwidth**: $0.15/GB
- **Storage**: $0.15/GB/month

For this app (voice recordings + images):

- **Voice recording**: ~100KB per 30 seconds
- **Generated images**: ~500KB per image
- **1 hour of conversation**: ~12MB (720 recordings)
- **With 50 images**: ~25MB + 25MB = **~37MB per session**

**You can have ~27 full sessions on the free tier!**

## Advantages over Supabase Storage

| Feature     | Vercel Blob            | Supabase Storage             |
| ----------- | ---------------------- | ---------------------------- |
| Setup       | Zero config            | Create buckets, set policies |
| CDN         | Global edge network    | Built-in CDN                 |
| Integration | Native to Vercel       | Requires configuration       |
| Pricing     | Simple usage-based     | Included in plan             |
| API         | 3 functions            | Full S3-compatible API       |
| Best for    | Next.js apps on Vercel | Any app, more control        |

## Managing Files

### View Files

Go to your Vercel Dashboard > Storage > Your Blob Store to see all uploaded files.

### Delete Files

You can delete files via:

1. Vercel Dashboard (manual)
2. API call using `del()` function (programmatic)

Example:

```typescript
import { del } from "@vercel/blob";
await del("audio-recordings/session-123/audio.webm");
```

## Troubleshooting

### Error: "BLOB_READ_WRITE_TOKEN is not defined"

**Solution**: Make sure your `.env` file has the token and restart your dev server.

### Error: "Failed to upload audio to storage"

**Check**:

1. Token is correct in `.env`
2. File is a valid Blob
3. Network connection is stable
4. Vercel Blob store was created

### Files not showing up

**Wait a moment** - uploads can take a few seconds to appear in the dashboard.

### Large file uploads failing

**Check your file size** - Vercel Blob has a 500MB limit per file on the free tier.

## Migration from Supabase Storage

If you were using Supabase Storage before:

1. ✅ **Code is already updated** - `src/lib/storage.ts` now uses Vercel Blob
2. ✅ **No bucket creation needed** - files are automatically organized
3. ✅ **Database stays in Supabase** - only file storage moved to Vercel Blob
4. 🔄 **Existing files** - will need to be manually migrated or left in Supabase

## Next Steps

After setup:

1. Test audio upload by recording a conversation
2. Check Vercel Dashboard to see uploaded files
3. Deploy to Vercel for production use
4. Monitor usage in Vercel Dashboard > Storage > Analytics

## Additional Resources

- [Vercel Blob Documentation](https://vercel.com/docs/storage/vercel-blob)
- [Vercel Blob SDK Reference](https://vercel.com/docs/storage/vercel-blob/using-blob-sdk)
- [Vercel Blob Pricing](https://vercel.com/docs/storage/vercel-blob/usage-and-pricing)
