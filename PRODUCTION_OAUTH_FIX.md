# Production OAuth Redirect Fix

## The Problem

Your production website redirects back to localhost after Google OAuth authentication. This happens because of incorrect redirect URI configuration in Google Cloud Console.

## The Solution

### Step 1: Check Your Google Cloud Console Configuration

1. **Go to Google Cloud Console**: https://console.cloud.google.com/
2. **Navigate to**: APIs & Services → Credentials
3. **Find your OAuth 2.0 Client ID** (the one you created for this app)
4. **Click on it to edit**

### Step 2: Update Authorized JavaScript Origins

In your OAuth client configuration, make sure you have BOTH:

**Authorized JavaScript origins:**

```
https://your-production-domain.com
http://localhost:3000
http://localhost:3001
```

**Authorized redirect URIs:**

```
https://your-supabase-project-ref.supabase.co/auth/v1/callback
```

### Step 3: Verify Your Production Domain

Make sure your production domain is correctly configured:

1. **Check your deployment platform** (Vercel, Netlify, etc.)
2. **Verify the domain** is properly set up
3. **Ensure HTTPS** is enabled (required for OAuth)

### Step 4: Update Supabase Configuration

In your Supabase Dashboard:

1. **Go to**: Authentication → URL Configuration
2. **Site URL**: Set to your production domain
   ```
   https://your-production-domain.com
   ```
3. **Redirect URLs**: Add your production domain
   ```
   https://your-production-domain.com/dashboard
   https://your-production-domain.com/auth/callback
   ```

### Step 5: Environment Variables (if needed)

If you're using environment variables for the redirect URL, create a `.env.local` file:

```env
# For development
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# For production (set in your deployment platform)
NEXT_PUBLIC_SITE_URL=https://your-production-domain.com
```

### Step 6: Update the Code (Optional)

If you want to use environment variables for the redirect URL, update your login page:

```typescript
const { error } = await supabase.auth.signInWithOAuth({
  provider: "google",
  options: {
    redirectTo: `${
      process.env.NEXT_PUBLIC_SITE_URL || window.location.origin
    }/dashboard`,
  },
});
```

## Common Issues and Solutions

### Issue 1: "redirect_uri_mismatch"

**Solution**: Make sure the redirect URI in Google Cloud Console is exactly:

```
https://your-supabase-project-ref.supabase.co/auth/v1/callback
```

### Issue 2: Still redirecting to localhost

**Solution**: Clear your browser cache and cookies, then try again.

### Issue 3: "invalid_client" error

**Solution**: Verify your Client ID and Client Secret in Supabase Dashboard.

### Issue 4: Domain not verified

**Solution**: In Google Cloud Console, go to OAuth consent screen and add your production domain to authorized domains.

## Testing Steps

1. **Clear browser cache and cookies**
2. **Go to your production website**
3. **Click "Continue with Google"**
4. **Complete the OAuth flow**
5. **Verify you're redirected to your production dashboard**

## Important Notes

- **Never use localhost URLs in production**
- **Always use HTTPS in production**
- **The redirect URI should always be the Supabase callback URL**
- **Your app URL goes in the "Authorized JavaScript origins"**

## Quick Checklist

- [ ] Google Cloud Console has your production domain in "Authorized JavaScript origins"
- [ ] Google Cloud Console has the Supabase callback URL in "Authorized redirect URIs"
- [ ] Supabase Dashboard has your production domain in "Site URL"
- [ ] Supabase Dashboard has your production domain in "Redirect URLs"
- [ ] Your production website uses HTTPS
- [ ] You've cleared browser cache and cookies

## Still Having Issues?

If you're still having problems:

1. **Check the browser console** for any error messages
2. **Check the Supabase logs** in your dashboard
3. **Verify all URLs** are exactly correct (no typos)
4. **Test in an incognito window** to avoid cached redirects
