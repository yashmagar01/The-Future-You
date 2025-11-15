# Google OAuth Setup Guide

This guide will help you enable Google authentication in your Supabase project.

## Step 1: Create Google OAuth Credentials

1. **Go to Google Cloud Console**:
   - Visit: https://console.cloud.google.com/

2. **Create a new project** (or select existing):
   - Click "Select a project" → "New Project"
   - Name: "The Future You"
   - Click "Create"

3. **Enable Google+ API**:
   - Go to: "APIs & Services" → "Library"
   - Search for "Google+ API"
   - Click "Enable"

4. **Configure OAuth Consent Screen**:
   - Go to: "APIs & Services" → "OAuth consent screen"
   - Choose "External" → Click "Create"
   - Fill in required fields:
     ```
     App name: The Future You
     User support email: your-email@example.com
     Developer contact: your-email@example.com
     ```
   - Click "Save and Continue"
   - Skip scopes (click "Save and Continue")
   - Add test users if needed → Click "Save and Continue"

5. **Create OAuth Credentials**:
   - Go to: "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth client ID"
   - Application type: "Web application"
   - Name: "The Future You Web Client"
   - **Authorized JavaScript origins**:
     ```
     http://localhost:5173
     http://localhost:8081
     https://your-domain.com (for production)
     ```
   - **Authorized redirect URIs** - THIS IS CRITICAL:
     ```
     https://wmhccazmbgruojkruyij.supabase.co/auth/v1/callback
     http://localhost:5173 (for local testing)
     ```
   - Click "Create"

6. **Copy your credentials**:
   ```
   Client ID: xxxxx-xxxxx.apps.googleusercontent.com
   Client Secret: GOCSPX-xxxxxxxxxxxxx
   ```
   ⚠️ **SAVE THESE** - You'll need them for Supabase!

---

## Step 2: Configure Supabase

1. **Go to your Supabase Dashboard**:
   - URL: https://supabase.com/dashboard/project/wmhccazmbgruojkruyij

2. **Navigate to Authentication Settings**:
   - Click "Authentication" (left sidebar)
   - Click "Providers" tab

3. **Enable Google Provider**:
   - Find "Google" in the list
   - Toggle it **ON** (enable it)

4. **Enter your Google credentials**:
   ```
   Client ID: [paste from Google Cloud Console]
   Client Secret: [paste from Google Cloud Console]
   ```

5. **Copy the Callback URL** (you need this for Google Console):
   ```
   https://wmhccazmbgruojkruyij.supabase.co/auth/v1/callback
   ```
   ⚠️ Make sure you added this to Google Cloud Console in Step 1!

6. **Save configuration**

---

## Step 3: Update Google Cloud Console (If Needed)

If you forgot to add the callback URL earlier:

1. Go back to Google Cloud Console
2. "APIs & Services" → "Credentials"
3. Click on your OAuth client
4. Under "Authorized redirect URIs", add:
   ```
   https://wmhccazmbgruojkruyij.supabase.co/auth/v1/callback
   ```
5. Click "Save"

---

## Step 4: Test Google Authentication

1. **Start your dev server**:
   ```bash
   npm run dev
   ```

2. **Open your app**:
   ```
   http://localhost:8081/login
   ```

3. **Click "Continue with Google"**

4. **What should happen**:
   - Opens Google sign-in popup/redirect
   - You select/sign in with Google account
   - Returns to your app
   - You're logged in! ✅

---

## Troubleshooting

### Error: "redirect_uri_mismatch"

**Problem**: The redirect URI in Google Console doesn't match Supabase.

**Solution**:
1. Copy exact callback URL from Supabase: `https://wmhccazmbgruojkruyij.supabase.co/auth/v1/callback`
2. Add it to Google Console → Credentials → Your OAuth Client → Authorized redirect URIs
3. Save and wait 5 minutes for propagation

### Error: "Access blocked: This app's request is invalid"

**Problem**: OAuth consent screen not properly configured.

**Solution**:
1. Go to Google Console → OAuth consent screen
2. Ensure all required fields are filled
3. Add your email as a test user if app is in "Testing" mode
4. Publish app if ready for production

### Error: "Google sign-in popup blocked"

**Problem**: Browser blocking the popup.

**Solution**:
1. Allow popups for localhost in browser settings
2. Or: Supabase will use redirect instead of popup automatically

### User signed in but no profile created

**Problem**: Profile trigger might not be working.

**Solution**:
Check if profile was created:
```sql
SELECT * FROM public.profiles;
```

If missing, the trigger should create it automatically. If not:
```sql
-- Manually create profile for Google user
INSERT INTO public.profiles (id, full_name)
VALUES (
  'USER_ID_FROM_AUTH',
  'Name from Google'
);
```

### "Invalid client" error

**Problem**: Client ID or Secret is wrong.

**Solution**:
1. Go to Google Console → Credentials
2. Copy Client ID and Secret again
3. Update in Supabase → Authentication → Providers → Google
4. Save

---

## Production Setup

When deploying to production:

1. **Update Google OAuth Client**:
   - Add production domain to Authorized JavaScript origins:
     ```
     https://your-production-domain.com
     ```
   - Callback URI should still be your Supabase URL

2. **Publish OAuth Consent Screen**:
   - Go to OAuth consent screen
   - Click "Publish App"
   - Submit for verification if needed (for larger audience)

3. **Test on production**:
   - Deploy app
   - Test Google sign-in
   - Verify user data is saved correctly

---

## Security Best Practices

1. ✅ **Never commit** Google Client Secret to git
2. ✅ **Use HTTPS** in production (always)
3. ✅ **Restrict OAuth Client** to your domains only
4. ✅ **Enable email verification** in Supabase if needed
5. ✅ **Monitor auth logs** in Supabase Dashboard

---

## What Happens Behind the Scenes

1. User clicks "Continue with Google"
2. App calls `supabase.auth.signInWithOAuth({ provider: 'google' })`
3. Redirects to Google sign-in page
4. User authorizes app
5. Google redirects back to Supabase callback URL with auth code
6. Supabase exchanges code for tokens
7. Supabase creates/updates user in `auth.users`
8. Profile trigger creates entry in `public.profiles`
9. User is redirected back to your app (authenticated!)

---

## Quick Checklist

- [ ] Created Google Cloud project
- [ ] Enabled Google+ API
- [ ] Configured OAuth consent screen
- [ ] Created OAuth credentials (Client ID & Secret)
- [ ] Added Supabase callback URL to Google Console
- [ ] Enabled Google provider in Supabase
- [ ] Added Client ID & Secret to Supabase
- [ ] Tested sign-in on localhost
- [ ] Profile automatically created after sign-in

---

## Need Help?

- **Google OAuth Docs**: https://developers.google.com/identity/protocols/oauth2
- **Supabase Auth Docs**: https://supabase.com/docs/guides/auth/social-login/auth-google
- **Common Issues**: Check Supabase Dashboard → Logs for error details

---

**🎉 Once configured, users can sign in with just one click!**
