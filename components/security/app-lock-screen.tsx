/**
 * App Lock Screen Component
 * Displays lock screen with biometric, PIN, or password authentication
 */

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { BorderRadius, Colors, ComponentSizes, Spacing, Typography } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as LocalAuthentication from 'expo-local-authentication';
import { useEffect, useState } from 'react';
import { Alert, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as SecurityService from '@/services/security';
import type { LockType } from '@/services/security';

interface AppLockScreenProps {
  lockType: LockType;
  onUnlock: (success: boolean) => void;
  biometricType?: string;
}

export function AppLockScreen({ lockType, onUnlock, biometricType }: AppLockScreenProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();
  const [pin, setPin] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  useEffect(() => {
    // Auto-trigger biometric authentication if enabled
    if (lockType === 'biometric') {
      handleBiometricAuth();
    }
  }, [lockType]);

  const handleBiometricAuth = async () => {
    setIsAuthenticating(true);
    try {
      const success = await SecurityService.authenticateBiometric();
      if (success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onUnlock(true);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        onUnlock(false);
      }
    } catch (error) {
      console.error('Biometric authentication error:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handlePINSubmit = async () => {
    if (pin.length < 4) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert('Invalid PIN', 'PIN must be at least 4 digits');
      return;
    }

    setIsAuthenticating(true);
    try {
      const isValid = await SecurityService.verifyPIN(pin);
      if (isValid) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setPin('');
        setAttempts(0);
        onUnlock(true);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        setPin('');
        
        if (newAttempts >= 5) {
          Alert.alert(
            'Too Many Attempts',
            'You have exceeded the maximum number of attempts. Please try again later.',
            [{ text: 'OK' }]
          );
        } else {
          Alert.alert('Invalid PIN', `Incorrect PIN. ${5 - newAttempts} attempts remaining.`);
        }
      }
    } catch (error) {
      console.error('PIN verification error:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handlePasswordSubmit = async () => {
    if (password.length < 6) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert('Invalid Password', 'Password must be at least 6 characters');
      return;
    }

    setIsAuthenticating(true);
    try {
      const isValid = await SecurityService.verifyPassword(password);
      if (isValid) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setPassword('');
        setAttempts(0);
        onUnlock(true);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        setPassword('');
        
        if (newAttempts >= 5) {
          Alert.alert(
            'Too Many Attempts',
            'You have exceeded the maximum number of attempts. Please try again later.',
            [{ text: 'OK' }]
          );
        } else {
          Alert.alert('Invalid Password', `Incorrect password. ${5 - newAttempts} attempts remaining.`);
        }
      }
    } catch (error) {
      console.error('Password verification error:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsAuthenticating(false);
    }
  };

  const renderBiometricLock = () => (
    <View style={styles.content}>
      <View style={[styles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
        <MaterialIcons
          name={biometricType?.includes('Face') ? 'face' : 'fingerprint'}
          size={64}
          color={colors.primary}
        />
      </View>
      <ThemedText style={[Typography.h2, styles.title, { color: colors.text }]}>
        {biometricType || 'Biometric'} Lock
      </ThemedText>
      <ThemedText style={[Typography.bodyMedium, styles.subtitle, { color: colors.textSecondary }]}>
        Use {biometricType || 'biometric authentication'} to unlock the app
      </ThemedText>
      <Button
        title={isAuthenticating ? 'Authenticating...' : `Unlock with ${biometricType || 'Biometric'}`}
        onPress={handleBiometricAuth}
        variant="primary"
        style={styles.unlockButton}
        disabled={isAuthenticating}
        icon={biometricType?.includes('Face') ? 'face' : 'fingerprint'}
      />
    </View>
  );

  const renderPINLock = () => (
    <View style={styles.content}>
      <View style={[styles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
        <MaterialIcons name="lock" size={64} color={colors.primary} />
      </View>
      <ThemedText style={[Typography.h2, styles.title, { color: colors.text }]}>PIN Lock</ThemedText>
      <ThemedText style={[Typography.bodyMedium, styles.subtitle, { color: colors.textSecondary }]}>
        Enter your PIN to unlock
      </ThemedText>
      <View style={styles.inputContainer}>
        <TextInput
          style={[
            styles.pinInput,
            {
              backgroundColor: colors.backgroundSecondary,
              color: colors.text,
              borderColor: colors.border,
            },
          ]}
          value={pin}
          onChangeText={setPin}
          placeholder="Enter PIN"
          placeholderTextColor={colors.textTertiary}
          keyboardType="number-pad"
          secureTextEntry={true}
          maxLength={6}
          autoFocus={true}
          onSubmitEditing={handlePINSubmit}
          editable={!isAuthenticating}
        />
      </View>
      <Button
        title="Unlock"
        onPress={handlePINSubmit}
        variant="primary"
        style={styles.unlockButton}
        disabled={pin.length < 4 || isAuthenticating}
      />
      {attempts > 0 && (
        <ThemedText style={[Typography.bodySmall, styles.attemptsText, { color: colors.error }]}>
          {5 - attempts} attempts remaining
        </ThemedText>
      )}
    </View>
  );

  const renderPasswordLock = () => (
    <View style={styles.content}>
      <View style={[styles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
        <MaterialIcons name="lock-outline" size={64} color={colors.primary} />
      </View>
      <ThemedText style={[Typography.h2, styles.title, { color: colors.text }]}>Password Lock</ThemedText>
      <ThemedText style={[Typography.bodyMedium, styles.subtitle, { color: colors.textSecondary }]}>
        Enter your password to unlock
      </ThemedText>
      <View style={styles.inputContainer}>
        <TextInput
          style={[
            styles.passwordInput,
            {
              backgroundColor: colors.backgroundSecondary,
              color: colors.text,
              borderColor: colors.border,
            },
          ]}
          value={password}
          onChangeText={setPassword}
          placeholder="Enter password"
          placeholderTextColor={colors.textTertiary}
          secureTextEntry={!showPassword}
          autoFocus={true}
          onSubmitEditing={handlePasswordSubmit}
          editable={!isAuthenticating}
        />
        <TouchableOpacity
          onPress={() => setShowPassword(!showPassword)}
          style={styles.eyeButton}
          accessibilityRole="button"
          accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}>
          <MaterialIcons
            name={showPassword ? 'visibility' : 'visibility-off'}
            size={24}
            color={colors.textSecondary}
          />
        </TouchableOpacity>
      </View>
      <Button
        title="Unlock"
        onPress={handlePasswordSubmit}
        variant="primary"
        style={styles.unlockButton}
        disabled={password.length < 6 || isAuthenticating}
      />
      {attempts > 0 && (
        <ThemedText style={[Typography.bodySmall, styles.attemptsText, { color: colors.error }]}>
          {5 - attempts} attempts remaining
        </ThemedText>
      )}
    </View>
  );

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {lockType === 'biometric' && renderBiometricLock()}
      {lockType === 'pin' && renderPINLock()}
      {lockType === 'password' && renderPasswordLock()}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    width: '100%',
    padding: Spacing.xl,
    alignItems: 'center',
    maxWidth: 400,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  title: {
    marginBottom: Spacing.sm,
    textAlign: 'center',
    fontWeight: '700',
  },
  subtitle: {
    marginBottom: Spacing.xl,
    textAlign: 'center',
  },
  inputContainer: {
    width: '100%',
    marginBottom: Spacing.lg,
    position: 'relative',
  },
  pinInput: {
    width: '100%',
    height: ComponentSizes.inputHeight,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.lg,
    fontSize: 18,
    textAlign: 'center',
    letterSpacing: 8,
  },
  passwordInput: {
    width: '100%',
    height: ComponentSizes.inputHeight,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.lg,
    paddingRight: 50,
    fontSize: 16,
  },
  eyeButton: {
    position: 'absolute',
    right: Spacing.md,
    top: '50%',
    transform: [{ translateY: -12 }],
    padding: Spacing.xs,
  },
  unlockButton: {
    width: '100%',
    marginTop: Spacing.md,
  },
  attemptsText: {
    marginTop: Spacing.md,
    textAlign: 'center',
  },
});

