# OAuth Redirect Troubleshooting Guide

## Step 1: Check Environment Variable

### 1.1 Verify the environment variable is set correctly

**In your browser console (F12), check what the debug logs show:**

```javascript
// Look for this in the console when you click "Continue with Google"
Environment variables: {
  NEXT_PUBLIC_SITE_URL: "https://your-domain.com",  // Should show your production domain
  windowOrigin: "https://your-domain.com",           // Should show your production domain
  finalRedirectUrl: "https://your-domain.com"        // Should show your production domain
}
```

**If `NEXT_PUBLIC_SITE_URL` is undefined or shows localhost:**

- The environment variable is not set in your deployment platform
- Check your deployment platform's environment variables settings

### 1.2 Check your deployment platform

**For Vercel:**

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Make sure `NEXT_PUBLIC_SITE_URL` is set to your production domain
3. Redeploy your application

**For Netlify:**

1. Go to Site Settings → Environment Variables
2. Add `NEXT_PUBLIC_SITE_URL` with your production domain
3. Redeploy

## Step 2: Check Google Cloud Console Configuration

### 2.1 Verify Authorized JavaScript Origins

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** → **Credentials**
3. Click on your OAuth 2.0 Client ID
4. Check **Authorized JavaScript origins**:

**Should include:**

```
https://your-production-domain.com
http://localhost:3000
http://localhost:3001
```

**Should NOT include:**

```
http://localhost:3000  (if you're testing production)
```

### 2.2 Verify Authorized Redirect URIs

**Should be exactly:**

```
https://your-supabase-project-ref.supabase.co/auth/v1/callback
```

**Should NOT be:**

```
https://your-production-domain.com/auth/callback
https://your-production-domain.com/dashboard
```

## Step 3: Check Supabase Configuration

### 3.1 Verify Site URL

1. Go to your Supabase Dashboard
2. Navigate to **Authentication** → **URL Configuration**
3. Check **Site URL**:

**Should be:**

```
https://your-production-domain.com
```

### 3.2 Verify Redirect URLs

In the same section, check **Redirect URLs**:

**Should include:**

```
https://your-production-domain.com/dashboard
https://your-production-domain.com/auth/callback
```

## Step 4: Common Issues and Solutions

### Issue 1: Environment variable not working

**Symptoms:** Console shows `NEXT_PUBLIC_SITE_URL: undefined`

**Solutions:**

1. **Check deployment platform:** Make sure the variable is set correctly
2. **Redeploy:** Environment variables require a redeploy to take effect
3. **Check spelling:** Make sure it's exactly `NEXT_PUBLIC_SITE_URL`
4. **Check scope:** Make sure it's set for "Production" environment

### Issue 2: Still redirecting to localhost

**Symptoms:** OAuth flow redirects to `http://localhost:3000/dashboard`

**Solutions:**

1. **Clear browser cache and cookies**
2. **Test in incognito/private mode**
3. **Check Google Cloud Console** has your production domain
4. **Verify Supabase Site URL** is set correctly

### Issue 3: "redirect_uri_mismatch" error

**Symptoms:** Google shows "Error 400: redirect_uri_mismatch"

**Solutions:**

1. **Check Google Cloud Console** redirect URI is exactly:
   ```
   https://your-supabase-project-ref.supabase.co/auth/v1/callback
   ```
2. **No trailing slashes** in the redirect URI
3. **Exact match required** - no typos

### Issue 4: "invalid_client" error

**Symptoms:** Google shows "Error 400: invalid_client"

**Solutions:**

1. **Check Supabase Dashboard** has correct Google Client ID and Secret
2. **Verify Google Cloud Console** credentials are correct
3. **Check OAuth consent screen** is configured

## Step 5: Testing Checklist

### 5.1 Before Testing

- [ ] Environment variable `NEXT_PUBLIC_SITE_URL` is set to production domain
- [ ] Application has been redeployed after setting environment variable
- [ ] Browser cache and cookies cleared
- [ ] Testing in incognito/private mode

### 5.2 During Testing

1. **Open browser console (F12)**
2. **Go to your production website**
3. **Click "Continue with Google"**
4. **Check console logs** for the debug information
5. **Complete OAuth flow**
6. **Verify redirect destination**

### 5.3 Expected Behavior

1. **Console should show:**

   ```
   Environment variables: {
     NEXT_PUBLIC_SITE_URL: "https://your-domain.com",
     windowOrigin: "https://your-domain.com",
     finalRedirectUrl: "https://your-domain.com"
   }
   ```

2. **OAuth flow should:**
   - Redirect to Google OAuth
   - After authorization, redirect to Supabase
   - Finally redirect to `https://your-domain.com/dashboard`

## Step 6: Quick Fixes

### Fix 1: Force environment variable

If the environment variable isn't working, you can temporarily hardcode it:

```typescript
const redirectUrl = "https://your-production-domain.com";
```

### Fix 2: Check deployment logs

Look at your deployment platform's logs to see if the environment variable is being loaded.

### Fix 3: Test locally with production URL

Set `NEXT_PUBLIC_SITE_URL=https://your-domain.com` in your local `.env.local` and test.

## Still Not Working?

If none of the above works:

1. **Share the console logs** from the debug output
2. **Check your deployment platform's environment variables** are actually set
3. **Verify your domain** is exactly correct (no typos)
4. **Test with a simple hardcoded URL** to isolate the issue

The most common issue is that the environment variable isn't actually set in the deployment platform or the application wasn't redeployed after setting it.
