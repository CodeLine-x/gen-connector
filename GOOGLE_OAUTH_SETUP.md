# Google OAuth Setup Guide

## Step 1: Configure Google OAuth in Supabase Dashboard

1. **Go to your Supabase Dashboard** → Authentication → Providers
2. **Enable Google Provider**:
   - Toggle "Enable Google provider" to ON
   - You'll need to create a Google OAuth app first

## Step 2: Create Google OAuth App

1. **Go to Google Cloud Console**: https://console.cloud.google.com/
2. **Create a new project** (or select existing one)
3. **Enable Google+ API**:
   - Go to "APIs & Services" → "Library"
   - Search for "Google+ API" and enable it
4. **Create OAuth 2.0 credentials**:
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth 2.0 Client IDs"
   - Application type: "Web application"
   - Name: "Intergenerational Voice Storytelling"
   - Authorized redirect URIs: Add your Supabase callback URL:
     ```
     https://your-project-ref.supabase.co/auth/v1/callback
     ```
   - Copy the **Client ID** and **Client Secret**

## Step 3: Configure Supabase with Google Credentials

Back in your Supabase Dashboard:

1. **Paste the Google credentials**:
   - Client ID: (from Google Cloud Console)
   - Client Secret: (from Google Cloud Console)
2. **Set the redirect URL** to:
   ```
   https://your-project-ref.supabase.co/auth/v1/callback
   ```

## Step 4: Test the Integration

Once configured, your Google Sign-in buttons should work automatically. The authentication flow is:

1. User clicks "Continue with Google"
2. Redirects to Google OAuth consent screen
3. User authorizes the app
4. Google redirects back to Supabase
5. Supabase creates/updates the user account
6. User is redirected to your dashboard

## Important Notes

- **No environment variables needed**: Google OAuth credentials are configured directly in Supabase Dashboard
- **Redirect URLs**: Make sure to add both development and production URLs in Google Cloud Console
- **Domain verification**: For production, you may need to verify your domain in Google Cloud Console

## Troubleshooting

### Common Issues:

1. **"redirect_uri_mismatch" error**:

   - Check that the redirect URI in Google Cloud Console matches exactly: `https://your-project-ref.supabase.co/auth/v1/callback`

2. **"invalid_client" error**:

   - Verify the Client ID and Client Secret are correct in Supabase Dashboard

3. **"access_denied" error**:
   - User denied permission or app not verified (for production)

### Development vs Production:

- **Development**: Use `http://localhost:3000` as authorized origin
- **Production**: Use your actual domain as authorized origin
- **Redirect URIs**: Always use the Supabase callback URL, not your app URL

## Testing

1. Start your development server: `npm run dev`
2. Go to `http://localhost:3001/auth/login`
3. Click "Continue with Google"
4. You should be redirected to Google's consent screen
5. After authorization, you should be redirected back to your dashboard

## Security Notes

- Keep your Google Client Secret secure
- Use HTTPS in production
- Regularly rotate your OAuth credentials
- Monitor authentication logs in Supabase Dashboard
