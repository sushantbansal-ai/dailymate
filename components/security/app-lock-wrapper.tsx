/**
 * App Lock Wrapper Component
 * Handles app lock logic and displays lock screen when needed
 */

import { AppLockScreen } from '@/components/security/app-lock-screen';
import * as SecurityService from '@/services/security';
import type { LockSettings } from '@/services/security';
import { useEffect, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';

interface AppLockWrapperProps {
  children: React.ReactNode;
}

export function AppLockWrapper({ children }: AppLockWrapperProps) {
  const [isLocked, setIsLocked] = useState(false);
  const [lockSettings, setLockSettings] = useState<LockSettings | null>(null);
  const [biometricType, setBiometricType] = useState<string>('');
  const [backgroundTime, setBackgroundTime] = useState<number | null>(null);

  useEffect(() => {
    checkLockStatus();
    loadSettings();

    // Listen to app state changes
    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    if (lockSettings?.enabled && lockSettings.lockOnBackground && backgroundTime) {
      // Check if we should lock based on delay
      const timeSinceBackground = Date.now() - backgroundTime;
      const delayMs = lockSettings.lockDelay * 1000;
      
      if (timeSinceBackground >= delayMs) {
        setIsLocked(true);
      }
    }
  }, [lockSettings, backgroundTime]);

  const loadSettings = async () => {
    try {
      const settings = await SecurityService.getLockSettings();
      const bioType = await SecurityService.getBiometricType();
      setLockSettings(settings);
      setBiometricType(bioType);
    } catch (error) {
      console.error('Error loading lock settings:', error);
    }
  };

  const checkLockStatus = async () => {
    try {
      const shouldLock = await SecurityService.shouldLockApp();
      setIsLocked(shouldLock);
    } catch (error) {
      console.error('Error checking lock status:', error);
    }
  };

  const handleAppStateChange = async (nextAppState: AppStateStatus) => {
    if (nextAppState === 'background' || nextAppState === 'inactive') {
      // App is going to background
      if (lockSettings?.enabled && lockSettings.lockOnBackground) {
        setBackgroundTime(Date.now());
      }
    } else if (nextAppState === 'active') {
      // App is coming to foreground
      if (lockSettings?.enabled && lockSettings.lockOnBackground && backgroundTime) {
        const timeSinceBackground = Date.now() - backgroundTime;
        const delayMs = (lockSettings.lockDelay || 0) * 1000;
        
        if (timeSinceBackground >= delayMs) {
          setIsLocked(true);
        }
      }
      
      // Reload settings in case they changed
      await loadSettings();
    }
  };

  const handleUnlock = async (success: boolean) => {
    if (!lockSettings) return;

    if (success) {
      setIsLocked(false);
      setBackgroundTime(null);
    }
  };

  // If lock is not enabled, show children
  if (!lockSettings || !lockSettings.enabled) {
    return <>{children}</>;
  }

  // If locked, show lock screen
  if (isLocked && lockSettings.lockType !== 'none') {
    return (
      <AppLockScreen
        lockType={lockSettings.lockType}
        onUnlock={handleUnlock}
        biometricType={biometricType}
      />
    );
  }

  // Otherwise, show children
  return <>{children}</>;
}

