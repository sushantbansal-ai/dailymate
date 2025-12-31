# Google Sheets Sync Setup Guide

This guide will help you set up Google Sheets synchronization for DailyMate.

## Prerequisites

1. A Google account
2. Access to Google Cloud Console

## Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Enter project name (e.g., "DailyMate Sync")
4. Click "Create"

## Step 2: Enable Google Sheets API

1. In your project, go to "APIs & Services" → "Library"
2. Search for "Google Sheets API"
3. Click on it and press "Enable"
4. Also enable "Google Drive API" (required for creating spreadsheets)

## Step 3: Create OAuth 2.0 Credentials

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth client ID"
3. Configure the OAuth consent screen (CRITICAL for development):
   - Choose "External" user type
   - Fill in app name: "DailyMate"
   - Add your email as support email
   - Add your email as developer contact
   - **Publishing status**: Choose "Testing" (not "In production")
   - **Test users**: Click "Add Users" and add YOUR email address
     - This allows you to use the app without Google verification
     - You can add multiple test users
   - Save and continue through the scopes
   - Click "Save and Continue" through all steps
   - **Important**: Keep the app in "Testing" mode for development
4. Create OAuth client ID:
   - Application type: "Web application"
   - Name: "DailyMate Web Client"
   - **Authorized redirect URIs** - **CRITICAL**: 
     - Google OAuth requires HTTPS URLs (not custom schemes like `dailymate://`)
     - **Option 1 - Expo Proxy (Recommended for Development)**:
       - Format: `https://auth.expo.io/@your-expo-username/DailyMate`
       - Replace `your-expo-username` with your Expo username (found in `expo whoami`)
       - Example: `https://auth.expo.io/@john_doe/DailyMate`
     - **Option 2 - Check Console Logs**:
       - Try authenticating in the app
       - Check console logs for: "Using redirect URI: [URI]"
       - Copy that EXACT HTTPS URI and add it
     - **Important**: The URI MUST start with `https://` - custom schemes won't work!
   - Click "Create"
5. Copy the **Client ID** and **Client Secret**

### Finding Your Expo Username

To use Expo proxy, you need your Expo username:

```bash
# Check your Expo username
npx expo whoami

# If not logged in, login first
npx expo login
```

Then add this to your `.env` file:
```env
EXPO_USERNAME=your-expo-username
```

## Step 4: Configure Environment Variables

Create a `.env` file in your project root (or add to your existing `.env`):

```env
EXPO_PUBLIC_GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_CLIENT_SECRET=your-client-secret-here
EXPO_USERNAME=your-expo-username
```

**Important:** 
- For Expo, environment variables must be prefixed with `EXPO_PUBLIC_` to be accessible in the app
- `EXPO_USERNAME` is used to generate the HTTPS redirect URI for Expo proxy
- Never commit your `.env` file to version control
- Add `.env` to your `.gitignore`

## Step 5: Restart Development Server

After adding environment variables, restart your Expo development server:

```bash
npm start
# or
expo start
```

## Step 6: Connect in App

1. Open DailyMate app
2. Go to Settings → Google Sheets Sync
3. Tap "Connect Google Account"
4. Sign in with your Google account
5. Grant permissions for Google Sheets and Google Drive
6. Create a new spreadsheet or enter an existing spreadsheet ID
7. Enable "Auto Sync" toggle

## How It Works

- **Auto Sync**: When enabled, all data changes (add, update, delete) are automatically synced to Google Sheets
- **Manual Sync**: You can manually sync to or from Google Sheets using the sync buttons
- **Data Organization**: Data is organized into separate sheets:
  - Accounts
  - Transactions
  - Categories
  - Labels
  - Contacts
  - Budgets
  - Goals
  - Planned Transactions
  - Bills

## Troubleshooting

### Authentication Fails

#### Error on Expo Proxy Page (auth.expo.io shows error but URL has code)
**If you see an error page on `auth.expo.io` but the URL contains `?code=...`:**

This means Google OAuth worked, but Expo proxy couldn't redirect back to your app. Try these solutions:

1. **Ensure app is running**: Make sure your Expo app is running and in the foreground
2. **Check app scheme**: Verify `app.json` has `"scheme": "dailymate"` configured
3. **Try again**: Close the error page and try authenticating again - sometimes it works on retry
4. **Check console logs**: Look for OAuth result logs in your terminal/console
5. **Manual workaround**: If the code is in the URL, you can manually copy it, but the app should handle it automatically

**If the error persists:**
- The redirect URI might not match exactly - check that `https://auth.expo.io/@buildingdots/dailymate` is in Google Cloud Console
- Try restarting your Expo development server
- Make sure you're using the latest version of `expo-auth-session`

#### Error: "expo.io has not completed the Google verification process"
**This happens when your OAuth consent screen is not properly configured for testing.**

**Solution:**
1. Go to Google Cloud Console → APIs & Services → OAuth consent screen
2. Make sure **Publishing status** is set to **"Testing"** (not "In production")
3. Under **Test users**, click **"Add Users"**
4. Add **YOUR email address** (the one you'll use to sign in)
5. Click **"Save"**
6. Wait 1-2 minutes for changes to propagate
7. Try authenticating again

**Note**: In Testing mode, only test users can authenticate. For production, you'll need to submit for Google verification.

#### Error: "redirect_uri mismatch" or "invalid_request"
1. **Check console logs** - When you try to authenticate, check the console for: "Using redirect URI: [URI]"
2. **Add exact URI** - Copy that exact URI and add it to Google Cloud Console:
   - Go to: APIs & Services → Credentials → Your OAuth Client
   - Click "Edit"
   - Under "Authorized redirect URIs", click "Add URI"
   - Paste the exact URI from the console logs
   - Click "Save"
3. **Wait a few minutes** - Google may take 1-2 minutes to propagate changes
4. **Try again** - Retry authentication in the app

#### Other Authentication Issues
- Check that your Client ID and Client Secret are correct
- Verify environment variables are loaded (restart Expo server after adding .env)
- Ensure Google Sheets API and Google Drive API are enabled
- Make sure you're using a "Web application" OAuth client (not iOS/Android)

### Sync Errors
- Check internet connection
- Verify spreadsheet ID is correct
- Ensure you have write permissions to the spreadsheet
- Check that the spreadsheet exists and is accessible

### Token Expired
- The app automatically refreshes tokens when needed
- If issues persist, disconnect and reconnect your Google account

## Security Notes

- OAuth tokens are stored securely using `expo-secure-store`
- Never share your Client Secret
- Keep your `.env` file private
- Regularly review OAuth app permissions in Google Cloud Console

## Support

For issues or questions, check:
- [Google Sheets API Documentation](https://developers.google.com/sheets/api)
- [Expo AuthSession Documentation](https://docs.expo.dev/guides/authentication/#google)

