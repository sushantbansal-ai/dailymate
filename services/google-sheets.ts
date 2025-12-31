/**
 * Google Sheets Service
 * Handles OAuth authentication and Google Sheets API interactions
 */

import * as AuthSession from 'expo-auth-session';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';

const STORAGE_KEYS = {
  ACCESS_TOKEN: 'google_sheets_access_token',
  REFRESH_TOKEN: 'google_sheets_refresh_token',
  SPREADSHEET_ID: 'google_sheets_spreadsheet_id',
  SYNC_ENABLED: 'google_sheets_sync_enabled',
  LAST_SYNC_TIME: 'google_sheets_last_sync_time',
};

const GOOGLE_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_SECRET || '';

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets', 'https://www.googleapis.com/auth/drive.file'];
const DISCOVERY = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
  revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
};

export interface GoogleSheetsConfig {
  enabled: boolean;
  spreadsheetId?: string;
  accessToken?: string;
  refreshToken?: string;
  lastSyncTime?: number;
}

/**
 * Get Google Sheets configuration
 */
export async function getConfig(): Promise<GoogleSheetsConfig> {
  try {
    const [enabled, spreadsheetId, accessToken, refreshToken, lastSyncTime] = await Promise.all([
      SecureStore.getItemAsync(STORAGE_KEYS.SYNC_ENABLED),
      SecureStore.getItemAsync(STORAGE_KEYS.SPREADSHEET_ID),
      SecureStore.getItemAsync(STORAGE_KEYS.ACCESS_TOKEN),
      SecureStore.getItemAsync(STORAGE_KEYS.REFRESH_TOKEN),
      SecureStore.getItemAsync(STORAGE_KEYS.LAST_SYNC_TIME),
    ]);

    return {
      enabled: enabled === 'true',
      spreadsheetId: spreadsheetId || undefined,
      accessToken: accessToken || undefined,
      refreshToken: refreshToken || undefined,
      lastSyncTime: lastSyncTime ? parseInt(lastSyncTime, 10) : undefined,
    };
  } catch (error) {
    console.error('Error getting Google Sheets config:', error);
    return { enabled: false };
  }
}

/**
 * Save Google Sheets configuration
 */
export async function saveConfig(config: Partial<GoogleSheetsConfig>): Promise<void> {
  try {
    if (config.enabled !== undefined) {
      await SecureStore.setItemAsync(STORAGE_KEYS.SYNC_ENABLED, config.enabled.toString());
    }
    if (config.spreadsheetId !== undefined) {
      if (config.spreadsheetId) {
        await SecureStore.setItemAsync(STORAGE_KEYS.SPREADSHEET_ID, config.spreadsheetId);
      } else {
        await SecureStore.deleteItemAsync(STORAGE_KEYS.SPREADSHEET_ID);
      }
    }
    if (config.accessToken !== undefined) {
      if (config.accessToken) {
        await SecureStore.setItemAsync(STORAGE_KEYS.ACCESS_TOKEN, config.accessToken);
      } else {
        await SecureStore.deleteItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
      }
    }
    if (config.refreshToken !== undefined) {
      if (config.refreshToken) {
        await SecureStore.setItemAsync(STORAGE_KEYS.REFRESH_TOKEN, config.refreshToken);
      } else {
        await SecureStore.deleteItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
      }
    }
    if (config.lastSyncTime !== undefined) {
      await SecureStore.setItemAsync(STORAGE_KEYS.LAST_SYNC_TIME, config.lastSyncTime.toString());
    }
  } catch (error) {
    console.error('Error saving Google Sheets config:', error);
    throw error;
  }
}

/**
 * Authenticate with Google
 */
export async function authenticateGoogle(): Promise<{ accessToken: string; refreshToken: string } | null> {
  try {
    // Generate redirect URI - Use Expo's built-in method which handles proxy correctly
    // This will automatically use https://auth.expo.io proxy if available
    let redirectUri = AuthSession.makeRedirectUri();
    
    // Get Expo username and slug for manual construction if needed
    const expoUsername = 
      process.env.EXPO_PUBLIC_EXPO_USERNAME || 
      Constants.expoConfig?.extra?.expoUsername || 
      Constants.expoConfig?.owner;
    const expoSlug = Constants.expoConfig?.slug || 'dailymate';
    
    // If not HTTPS, try to construct Expo proxy URI manually
    if (!redirectUri.startsWith('https://')) {
      if (expoUsername) {
        // Manually construct Expo proxy URI
        redirectUri = `https://auth.expo.io/@${expoUsername}/${expoSlug}`;
        console.log('Using manually constructed Expo proxy URI:', redirectUri);
      } else {
        const errorMessage = 
          'HTTPS redirect URI required for Google OAuth.\n\n' +
          'SOLUTION: Set up Expo proxy by adding to your .env file:\n' +
          'EXPO_PUBLIC_EXPO_USERNAME=your-expo-username\n\n' +
          'To find your Expo username, run: npx expo whoami\n\n' +
          `Current redirect URI: ${redirectUri}\n` +
          'This URI will not work with Google OAuth web applications.';
        throw new Error(errorMessage);
      }
    }
    
    // Ensure redirect URI matches the format Google expects
    // The redirect URI should be: https://auth.expo.io/@username/slug
    if (redirectUri.includes('auth.expo.io') && !redirectUri.match(/^https:\/\/auth\.expo\.io\/@[\w-]+\/[\w-]+$/)) {
      console.warn('Redirect URI format may be incorrect:', redirectUri);
      console.warn('Expected format: https://auth.expo.io/@username/slug');
    }
    
    console.log('Using redirect URI:', redirectUri);
    console.log('IMPORTANT: Add this EXACT HTTPS URI to Google Cloud Console:');
    console.log('1. Go to: APIs & Services > Credentials > Your OAuth Client');
    console.log('2. Click "Edit"');
    console.log('3. Under "Authorized redirect URIs", click "Add URI"');
    console.log(`4. Paste: ${redirectUri}`);
    console.log('5. Click "Save"');
    
    if (!GOOGLE_CLIENT_ID) {
      throw new Error('Google Client ID is not configured. Please set EXPO_PUBLIC_GOOGLE_CLIENT_ID in your .env file');
    }
    
    const request = new AuthSession.AuthRequest({
      clientId: GOOGLE_CLIENT_ID,
      scopes: SCOPES,
      redirectUri,
      responseType: AuthSession.ResponseType.Code,
      extraParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    });

    console.log('Starting OAuth flow with redirect URI:', redirectUri);
    const result = await request.promptAsync(DISCOVERY);
    console.log('OAuth result:', { type: result.type, error: result.type === 'error' ? result.error : null });

    if (result.type === 'error') {
      console.error('OAuth error:', result.error);
      const errorMessage = result.error?.message || '';
      const errorCode = result.error?.code;
      
      // Handle cancellation
      if (errorCode === 'ERR_REQUEST_CANCELED' || errorMessage.includes('cancel')) {
        return null; // User cancelled, don't throw error
      }
      
      if (errorMessage.includes('redirect_uri')) {
        throw new Error(
          `Redirect URI mismatch. Please add this exact URI to Google Cloud Console:\n${redirectUri}\n\n` +
          `Go to: APIs & Services > Credentials > Your OAuth Client > Authorized redirect URIs`
        );
      }
      
      if (errorMessage.includes('verification') || errorMessage.includes('not verified')) {
        throw new Error(
          'Google OAuth verification required.\n\n' +
          'SOLUTION:\n' +
          '1. Go to: APIs & Services > OAuth consent screen\n' +
          '2. Set Publishing status to "Testing" (not "In production")\n' +
          '3. Under "Test users", click "Add Users"\n' +
          '4. Add YOUR email address\n' +
          '5. Click "Save"\n' +
          '6. Wait 1-2 minutes, then try again\n\n' +
          'Note: Only test users can authenticate in Testing mode.'
        );
      }
      
      throw new Error(errorMessage || 'Authentication failed');
    }

    if (result.type === 'success' && result.params.code) {
      console.log('Received authorization code, exchanging for tokens...');
      
      // Exchange code for tokens
      const tokenResponse = await fetch(DISCOVERY.tokenEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          code: result.params.code,
          client_id: GOOGLE_CLIENT_ID,
          client_secret: GOOGLE_CLIENT_SECRET,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
        }).toString(),
      });

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText };
        }
        console.error('Token exchange error:', errorData);
        console.error('Response status:', tokenResponse.status);
        console.error('Response headers:', Object.fromEntries(tokenResponse.headers.entries()));
        
        if (errorData.error === 'invalid_grant') {
          throw new Error(
            'Authorization code expired or already used. Please try authenticating again.\n\n' +
            'This can happen if:\n' +
            '1. The code was already used\n' +
            '2. Too much time passed between authorization and token exchange\n' +
            '3. The redirect URI doesn\'t match exactly'
          );
        }
        
        throw new Error(errorData.error_description || errorData.error || 'Failed to exchange code for tokens');
      }

      const tokens = await tokenResponse.json();
      console.log('Successfully received tokens');

      if (tokens.access_token && tokens.refresh_token) {
        return {
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
        };
      } else {
        console.error('Token response missing required fields:', Object.keys(tokens));
        throw new Error('Missing access_token or refresh_token in response. Response: ' + JSON.stringify(tokens));
      }
    }

    if (result.type === 'dismiss') {
      console.log('OAuth flow dismissed by user');
      return null;
    }

    console.warn('Unexpected OAuth result:', result);
    return null;
  } catch (error: any) {
    console.error('Google authentication error:', error);
    throw error; // Re-throw to show error message in UI
  }
}

/**
 * Refresh access token
 */
export async function refreshAccessToken(refreshToken: string): Promise<string | null> {
  try {
    const response = await fetch(DISCOVERY.tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        refresh_token: refreshToken,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        grant_type: 'refresh_token',
      }).toString(),
    });

    const tokens = await response.json();

    if (tokens.access_token) {
      await saveConfig({ accessToken: tokens.access_token });
      return tokens.access_token;
    }

    return null;
  } catch (error) {
    console.error('Error refreshing access token:', error);
    return null;
  }
}

/**
 * Get valid access token (refresh if needed)
 */
export async function getValidAccessToken(): Promise<string | null> {
  const config = await getConfig();
  
  if (!config.accessToken || !config.refreshToken) {
    return null;
  }

  // Try to use existing token first
  // In production, you should check token expiry
  // For now, we'll refresh if we get a 401 error

  return config.accessToken;
}

/**
 * Create a new spreadsheet
 */
export async function createSpreadsheet(title: string): Promise<string | null> {
  try {
    const accessToken = await getValidAccessToken();
    if (!accessToken) {
      throw new Error('No access token');
    }

    const response = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        properties: {
          title,
        },
      }),
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Token expired, try to refresh
        const config = await getConfig();
        if (config.refreshToken) {
          const newToken = await refreshAccessToken(config.refreshToken);
          if (newToken) {
            return createSpreadsheet(title);
          }
        }
      }
      throw new Error(`Failed to create spreadsheet: ${response.statusText}`);
    }

    const data = await response.json();
    return data.spreadsheetId;
  } catch (error) {
    console.error('Error creating spreadsheet:', error);
    return null;
  }
}

/**
 * Read data from a sheet
 */
export async function readSheet(spreadsheetId: string, range: string): Promise<any[][] | null> {
  try {
    const accessToken = await getValidAccessToken();
    if (!accessToken) {
      throw new Error('No access token');
    }

    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}`;
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        const config = await getConfig();
        if (config.refreshToken) {
          const newToken = await refreshAccessToken(config.refreshToken);
          if (newToken) {
            return readSheet(spreadsheetId, range);
          }
        }
      }
      throw new Error(`Failed to read sheet: ${response.statusText}`);
    }

    const data = await response.json();
    return data.values || [];
  } catch (error) {
    console.error('Error reading sheet:', error);
    return null;
  }
}

/**
 * Write data to a sheet
 */
export async function writeSheet(
  spreadsheetId: string,
  range: string,
  values: any[][]
): Promise<boolean> {
  try {
    const accessToken = await getValidAccessToken();
    if (!accessToken) {
      throw new Error('No access token');
    }

    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?valueInputOption=RAW`;
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values,
      }),
    });

    if (!response.ok) {
      if (response.status === 401) {
        const config = await getConfig();
        if (config.refreshToken) {
          const newToken = await refreshAccessToken(config.refreshToken);
          if (newToken) {
            return writeSheet(spreadsheetId, range, values);
          }
        }
      }
      throw new Error(`Failed to write sheet: ${response.statusText}`);
    }

    return true;
  } catch (error) {
    console.error('Error writing sheet:', error);
    return false;
  }
}

/**
 * Append data to a sheet
 */
export async function appendSheet(
  spreadsheetId: string,
  range: string,
  values: any[][]
): Promise<boolean> {
  try {
    const accessToken = await getValidAccessToken();
    if (!accessToken) {
      throw new Error('No access token');
    }

    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}:append?valueInputOption=RAW`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values,
      }),
    });

    if (!response.ok) {
      if (response.status === 401) {
        const config = await getConfig();
        if (config.refreshToken) {
          const newToken = await refreshAccessToken(config.refreshToken);
          if (newToken) {
            return appendSheet(spreadsheetId, range, values);
          }
        }
      }
      throw new Error(`Failed to append sheet: ${response.statusText}`);
    }

    return true;
  } catch (error) {
    console.error('Error appending to sheet:', error);
    return false;
  }
}

/**
 * Clear a sheet range
 */
export async function clearSheet(spreadsheetId: string, range: string): Promise<boolean> {
  try {
    const accessToken = await getValidAccessToken();
    if (!accessToken) {
      throw new Error('No access token');
    }

    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}:clear`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        const config = await getConfig();
        if (config.refreshToken) {
          const newToken = await refreshAccessToken(config.refreshToken);
          if (newToken) {
            return clearSheet(spreadsheetId, range);
          }
        }
      }
      throw new Error(`Failed to clear sheet: ${response.statusText}`);
    }

    return true;
  } catch (error) {
    console.error('Error clearing sheet:', error);
    return false;
  }
}

/**
 * Disconnect Google Sheets
 */
export async function disconnect(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
    await SecureStore.deleteItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
    await SecureStore.deleteItemAsync(STORAGE_KEYS.SPREADSHEET_ID);
    await SecureStore.deleteItemAsync(STORAGE_KEYS.SYNC_ENABLED);
    await SecureStore.deleteItemAsync(STORAGE_KEYS.LAST_SYNC_TIME);
  } catch (error) {
    console.error('Error disconnecting Google Sheets:', error);
  }
}


