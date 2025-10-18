# Production Deployment Guide

## Environment Variables for Production

Set these environment variables in your deployment platform (Vercel, Netlify, etc.):

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key

# Vercel Blob Storage
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_token_here

# Site URL (IMPORTANT for OAuth redirects)
NEXT_PUBLIC_SITE_URL=https://your-production-domain.com
```

## Google OAuth Configuration

### 1. Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** → **Credentials**
3. Find your OAuth 2.0 Client ID
4. Click to edit it

### 2. Update Authorized JavaScript Origins

Add your production domain:

```
https://your-production-domain.com
```

Keep development domains:

```
http://localhost:3000
http://localhost:3001
```

### 3. Update Authorized Redirect URIs

Make sure you have the Supabase callback URL:

```
https://your-supabase-project-ref.supabase.co/auth/v1/callback
```

## Supabase Configuration

### 1. Update Site URL

In your Supabase Dashboard:

1. Go to **Authentication** → **URL Configuration**
2. Set **Site URL** to: `https://your-production-domain.com`

### 2. Update Redirect URLs

Add your production domain:

```
https://your-production-domain.com/dashboard
https://your-production-domain.com/auth/callback
```

## Testing the Fix

1. **Clear browser cache and cookies**
2. **Go to your production website**
3. **Click "Continue with Google"**
4. **Complete OAuth flow**
5. **Verify redirect to production dashboard**

## Common Issues

### Issue: Still redirecting to localhost

**Solution**:

- Check that `NEXT_PUBLIC_SITE_URL` is set correctly in your deployment platform
- Verify Google Cloud Console has your production domain in "Authorized JavaScript origins"
- Clear browser cache and cookies

### Issue: "redirect_uri_mismatch" error

**Solution**:

- Make sure the redirect URI in Google Cloud Console is exactly: `https://your-supabase-project-ref.supabase.co/auth/v1/callback`

### Issue: "invalid_client" error

**Solution**:

- Verify Client ID and Client Secret in Supabase Dashboard

## Quick Checklist

- [ ] `NEXT_PUBLIC_SITE_URL` environment variable set to your production domain
- [ ] Google Cloud Console has production domain in "Authorized JavaScript origins"
- [ ] Google Cloud Console has Supabase callback URL in "Authorized redirect URIs"
- [ ] Supabase Dashboard has production domain in "Site URL"
- [ ] Supabase Dashboard has production domain in "Redirect URLs"
- [ ] Production website uses HTTPS
- [ ] Browser cache and cookies cleared
