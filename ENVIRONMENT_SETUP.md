# Environment Variables Setup Guide

## Quick Start

1. **Copy the example file:**

   ```bash
   cp .env.example .env.local
   ```

2. **Fill in your actual values** in `.env.local`

3. **Never commit `.env.local`** to version control

## Required Environment Variables

### 1. Supabase Configuration

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

**How to get these:**

- Go to your Supabase project dashboard
- Navigate to Settings → API
- Copy the Project URL and anon/public key

### 2. OpenAI API Key

```env
OPENAI_API_KEY=sk-your_openai_api_key_here
```

**How to get this:**

- Go to [OpenAI Platform](https://platform.openai.com/api-keys)
- Create a new API key
- Add billing information (required for API usage)

### 3. Vercel Blob Storage

```env
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_token_here
```

**How to get this:**

- Deploy your app to Vercel
- Go to Vercel Dashboard → Your Project → Storage
- Enable Blob storage
- Copy the read/write token

### 4. Site URL (IMPORTANT for OAuth)

```env
NEXT_PUBLIC_SITE_URL=https://your-production-domain.com
```

**For development:** `http://localhost:3000`
**For production:** Your actual domain (e.g., `https://myapp.vercel.app`)

## Development Setup

1. **Create `.env.local`:**

   ```bash
   cp .env.example .env.local
   ```

2. **Edit `.env.local`** with your development values:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
   OPENAI_API_KEY=sk-your_openai_api_key_here
   BLOB_READ_WRITE_TOKEN=vercel_blob_rw_token_here
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

## Production Setup

### For Vercel Deployment:

1. **Go to Vercel Dashboard** → Your Project → Settings → Environment Variables

2. **Add all required variables:**

   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `OPENAI_API_KEY`
   - `BLOB_READ_WRITE_TOKEN`
   - `NEXT_PUBLIC_SITE_URL` (set to your Vercel domain)

3. **Redeploy** your application

### For Other Platforms:

Set the same environment variables in your deployment platform's settings.

## OAuth Configuration

### Google OAuth Setup:

1. **Google Cloud Console:**

   - Create OAuth 2.0 credentials
   - Add authorized origins: `https://your-domain.com` and `http://localhost:3000`
   - Add redirect URI: `https://your-project-ref.supabase.co/auth/v1/callback`

2. **Supabase Dashboard:**
   - Go to Authentication → Providers
   - Enable Google provider
   - Add your Google Client ID and Client Secret
   - Set Site URL to your production domain

## Testing

1. **Local testing:**

   ```bash
   npm run dev
   ```

   Go to `http://localhost:3000` and test OAuth

2. **Production testing:**
   - Deploy with correct environment variables
   - Test OAuth flow on production domain
   - Verify redirects work correctly

## Troubleshooting

### Common Issues:

1. **OAuth redirects to localhost:**

   - Check `NEXT_PUBLIC_SITE_URL` is set to your production domain
   - Verify Google Cloud Console has your production domain in authorized origins

2. **"Invalid API key" errors:**

   - Verify all API keys are correct
   - Check that billing is set up for OpenAI

3. **Database errors:**
   - Run the SQL schema in Supabase SQL Editor
   - Check that RLS policies are set up correctly

### Security Notes:

- Never commit `.env.local` to version control
- Use different API keys for development and production
- Regularly rotate your API keys
- Monitor API usage in your service dashboards
