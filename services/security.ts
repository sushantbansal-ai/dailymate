/**
 * Security Service
 * Handles app lock, biometric authentication, and PIN/password management
 */

import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

export type LockType = 'none' | 'biometric' | 'pin' | 'password';

export interface LockSettings {
  enabled: boolean;
  lockType: LockType;
  lockOnAppLaunch: boolean;
  lockOnBackground: boolean;
  lockDelay: number; // seconds to wait before locking when app goes to background
}

const STORAGE_KEYS = {
  LOCK_SETTINGS: 'lock_settings',
  PIN: 'app_pin',
  PASSWORD: 'app_password',
  LAST_UNLOCK_TIME: 'last_unlock_time',
};

const DEFAULT_SETTINGS: LockSettings = {
  enabled: false,
  lockType: 'none',
  lockOnAppLaunch: true,
  lockOnBackground: true,
  lockDelay: 0, // Lock immediately
};

/**
 * Check if biometric authentication is available
 */
export async function isBiometricAvailable(): Promise<boolean> {
  try {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    if (!compatible) return false;

    const enrolled = await LocalAuthentication.isEnrolledAsync();
    return enrolled;
  } catch (error) {
    console.error('Error checking biometric availability:', error);
    return false;
  }
}

/**
 * Get available biometric types
 */
export async function getBiometricType(): Promise<string> {
  try {
    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
    if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
      return 'Face ID';
    }
    if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
      return 'Touch ID';
    }
    if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
      return 'Iris';
    }
    return 'Biometric';
  } catch (error) {
    console.error('Error getting biometric type:', error);
    return 'Biometric';
  }
}

/**
 * Authenticate with biometrics
 */
export async function authenticateBiometric(): Promise<boolean> {
  try {
    const available = await isBiometricAvailable();
    if (!available) {
      throw new Error('Biometric authentication not available');
    }

    const biometricType = await getBiometricType();
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: `Authenticate with ${biometricType}`,
      cancelLabel: 'Cancel',
      disableDeviceFallback: false,
      fallbackLabel: 'Use PIN',
    });

    if (result.success) {
      await updateLastUnlockTime();
      return true;
    }

    return false;
  } catch (error) {
    console.error('Biometric authentication error:', error);
    return false;
  }
}

/**
 * Get lock settings
 */
export async function getLockSettings(): Promise<LockSettings> {
  try {
    const settingsJson = await SecureStore.getItemAsync(STORAGE_KEYS.LOCK_SETTINGS);
    if (!settingsJson) {
      return DEFAULT_SETTINGS;
    }
    return JSON.parse(settingsJson);
  } catch (error) {
    console.error('Error getting lock settings:', error);
    return DEFAULT_SETTINGS;
  }
}

/**
 * Save lock settings
 */
export async function saveLockSettings(settings: LockSettings): Promise<void> {
  try {
    await SecureStore.setItemAsync(STORAGE_KEYS.LOCK_SETTINGS, JSON.stringify(settings));
  } catch (error) {
    console.error('Error saving lock settings:', error);
    throw error;
  }
}

/**
 * Set PIN
 */
export async function setPIN(pin: string): Promise<void> {
  try {
    // Hash the PIN before storing (in production, use proper hashing)
    await SecureStore.setItemAsync(STORAGE_KEYS.PIN, pin);
  } catch (error) {
    console.error('Error setting PIN:', error);
    throw error;
  }
}

/**
 * Verify PIN
 */
export async function verifyPIN(pin: string): Promise<boolean> {
  try {
    const storedPIN = await SecureStore.getItemAsync(STORAGE_KEYS.PIN);
    if (!storedPIN) {
      return false;
    }
    const isValid = storedPIN === pin;
    if (isValid) {
      await updateLastUnlockTime();
    }
    return isValid;
  } catch (error) {
    console.error('Error verifying PIN:', error);
    return false;
  }
}

/**
 * Set password
 */
export async function setPassword(password: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(STORAGE_KEYS.PASSWORD, password);
  } catch (error) {
    console.error('Error setting password:', error);
    throw error;
  }
}

/**
 * Verify password
 */
export async function verifyPassword(password: string): Promise<boolean> {
  try {
    const storedPassword = await SecureStore.getItemAsync(STORAGE_KEYS.PASSWORD);
    if (!storedPassword) {
      return false;
    }
    const isValid = storedPassword === password;
    if (isValid) {
      await updateLastUnlockTime();
    }
    return isValid;
  } catch (error) {
    console.error('Error verifying password:', error);
    return false;
  }
}

/**
 * Check if PIN is set
 */
export async function hasPIN(): Promise<boolean> {
  try {
    const pin = await SecureStore.getItemAsync(STORAGE_KEYS.PIN);
    return pin !== null;
  } catch (error) {
    return false;
  }
}

/**
 * Check if password is set
 */
export async function hasPassword(): Promise<boolean> {
  try {
    const password = await SecureStore.getItemAsync(STORAGE_KEYS.PASSWORD);
    return password !== null;
  } catch (error) {
    return false;
  }
}

/**
 * Remove PIN
 */
export async function removePIN(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(STORAGE_KEYS.PIN);
  } catch (error) {
    console.error('Error removing PIN:', error);
  }
}

/**
 * Remove password
 */
export async function removePassword(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(STORAGE_KEYS.PASSWORD);
  } catch (error) {
    console.error('Error removing password:', error);
  }
}

/**
 * Update last unlock time
 */
async function updateLastUnlockTime(): Promise<void> {
  try {
    await SecureStore.setItemAsync(STORAGE_KEYS.LAST_UNLOCK_TIME, Date.now().toString());
  } catch (error) {
    console.error('Error updating last unlock time:', error);
  }
}

/**
 * Get last unlock time
 */
export async function getLastUnlockTime(): Promise<number | null> {
  try {
    const timeStr = await SecureStore.getItemAsync(STORAGE_KEYS.LAST_UNLOCK_TIME);
    return timeStr ? parseInt(timeStr, 10) : null;
  } catch (error) {
    return null;
  }
}

/**
 * Check if app should be locked
 */
export async function shouldLockApp(): Promise<boolean> {
  try {
    const settings = await getLockSettings();
    if (!settings.enabled) {
      return false;
    }

    // Check if lock is required on app launch
    if (settings.lockOnAppLaunch) {
      const lastUnlockTime = await getLastUnlockTime();
      if (!lastUnlockTime) {
        return true; // Never unlocked, lock required
      }
    }

    return false;
  } catch (error) {
    console.error('Error checking if app should be locked:', error);
    return false;
  }
}

/**
 * Unlock app based on lock type
 */
export async function unlockApp(): Promise<boolean> {
  try {
    const settings = await getLockSettings();
    if (!settings.enabled) {
      return true;
    }

    switch (settings.lockType) {
      case 'biometric':
        return await authenticateBiometric();
      case 'pin':
        // PIN verification should be handled by the lock screen component
        return false;
      case 'password':
        // Password verification should be handled by the lock screen component
        return false;
      default:
        return true;
    }
  } catch (error) {
    console.error('Error unlocking app:', error);
    return false;
  }
}

/**
 * Reset all security settings
 */
export async function resetSecurity(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(STORAGE_KEYS.LOCK_SETTINGS);
    await SecureStore.deleteItemAsync(STORAGE_KEYS.PIN);
    await SecureStore.deleteItemAsync(STORAGE_KEYS.PASSWORD);
    await SecureStore.deleteItemAsync(STORAGE_KEYS.LAST_UNLOCK_TIME);
  } catch (error) {
    console.error('Error resetting security:', error);
  }
}

