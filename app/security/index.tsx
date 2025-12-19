/**
 * Security Settings Screen
 * Configure app lock, biometric authentication, PIN, and password
 */

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BorderRadius, Colors, ComponentSizes, Spacing, Typography } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as SecurityService from '@/services/security';
import type { LockSettings, LockType } from '@/services/security';

export default function SecuritySettingsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();
  const [settings, setSettings] = useState<LockSettings>({
    enabled: false,
    lockType: 'none',
    lockOnAppLaunch: true,
    lockOnBackground: true,
    lockDelay: 0,
  });
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricType, setBiometricType] = useState<string>('');
  const [hasPIN, setHasPIN] = useState(false);
  const [hasPassword, setHasPassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showSetPIN, setShowSetPIN] = useState(false);
  const [showSetPassword, setShowSetPassword] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const [lockSettings, biometricAvail, bioType, pinExists, passwordExists] = await Promise.all([
        SecurityService.getLockSettings(),
        SecurityService.isBiometricAvailable(),
        SecurityService.getBiometricType(),
        SecurityService.hasPIN(),
        SecurityService.hasPassword(),
      ]);

      setSettings(lockSettings);
      setBiometricAvailable(biometricAvail);
      setBiometricType(bioType);
      setHasPIN(pinExists);
      setHasPassword(passwordExists);
    } catch (error) {
      console.error('Error loading security settings:', error);
      Alert.alert('Error', 'Failed to load security settings');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleLock = async (enabled: boolean) => {
    if (enabled && settings.lockType === 'none') {
      Alert.alert(
        'Select Lock Type',
        'Please select a lock type (Biometric, PIN, or Password) before enabling app lock.',
        [{ text: 'OK' }]
      );
      return;
    }

    if (enabled && settings.lockType === 'biometric' && !biometricAvailable) {
      Alert.alert(
        'Biometric Not Available',
        'Biometric authentication is not available on this device. Please set up biometric authentication in your device settings.',
        [{ text: 'OK' }]
      );
      return;
    }

    if (enabled && settings.lockType === 'pin' && !hasPIN) {
      Alert.alert('PIN Not Set', 'Please set a PIN before enabling PIN lock.', [{ text: 'OK' }]);
      return;
    }

    if (enabled && settings.lockType === 'password' && !hasPassword) {
      Alert.alert('Password Not Set', 'Please set a password before enabling password lock.', [{ text: 'OK' }]);
      return;
    }

    try {
      const newSettings = { ...settings, enabled };
      await SecurityService.saveLockSettings(newSettings);
      setSettings(newSettings);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      console.error('Error saving lock settings:', error);
      Alert.alert('Error', 'Failed to save lock settings');
    }
  };

  const handleLockTypeChange = async (lockType: LockType) => {
    if (lockType === 'biometric' && !biometricAvailable) {
      Alert.alert(
        'Biometric Not Available',
        'Biometric authentication is not available on this device.',
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      const newSettings = { ...settings, lockType };
      
      // If biometric is selected and available, auto-enable lock
      if (lockType === 'biometric' && biometricAvailable) {
        newSettings.enabled = true;
      }
      // If PIN is selected and already set, auto-enable lock
      else if (lockType === 'pin' && hasPIN) {
        newSettings.enabled = true;
      }
      // If password is selected and already set, auto-enable lock
      else if (lockType === 'password' && hasPassword) {
        newSettings.enabled = true;
      }
      
      await SecurityService.saveLockSettings(newSettings);
      setSettings(newSettings);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      // Show helpful message if lock type was selected but credentials need to be set
      if (!newSettings.enabled) {
        if (lockType === 'pin' && !hasPIN) {
          Alert.alert('PIN Required', 'Please set a PIN to enable PIN lock.', [{ text: 'OK' }]);
        } else if (lockType === 'password' && !hasPassword) {
          Alert.alert('Password Required', 'Please set a password to enable password lock.', [{ text: 'OK' }]);
        }
      }
    } catch (error) {
      console.error('Error saving lock type:', error);
      Alert.alert('Error', 'Failed to save lock type');
    }
  };

  const handleSetPIN = async () => {
    if (pin.length < 4) {
      Alert.alert('Invalid PIN', 'PIN must be at least 4 digits');
      return;
    }

    if (pin !== confirmPin) {
      Alert.alert('PIN Mismatch', 'PINs do not match. Please try again.');
      return;
    }

    try {
      await SecurityService.setPIN(pin);
      setHasPIN(true);
      setPin('');
      setConfirmPin('');
      setShowSetPIN(false);
      
      // Auto-enable lock if PIN lock type is selected
      if (settings.lockType === 'pin') {
        const newSettings = { ...settings, enabled: true };
        await SecurityService.saveLockSettings(newSettings);
        setSettings(newSettings);
      }
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Success', 'PIN has been set successfully');
    } catch (error) {
      console.error('Error setting PIN:', error);
      Alert.alert('Error', 'Failed to set PIN');
    }
  };

  const handleSetPassword = async () => {
    if (password.length < 6) {
      Alert.alert('Invalid Password', 'Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Password Mismatch', 'Passwords do not match. Please try again.');
      return;
    }

    try {
      await SecurityService.setPassword(password);
      setHasPassword(true);
      setPassword('');
      setConfirmPassword('');
      setShowSetPassword(false);
      
      // Auto-enable lock if password lock type is selected
      if (settings.lockType === 'password') {
        const newSettings = { ...settings, enabled: true };
        await SecurityService.saveLockSettings(newSettings);
        setSettings(newSettings);
      }
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Success', 'Password has been set successfully');
    } catch (error) {
      console.error('Error setting password:', error);
      Alert.alert('Error', 'Failed to set password');
    }
  };

  const handleRemovePIN = async () => {
    Alert.alert(
      'Remove PIN',
      'Are you sure you want to remove your PIN? This will disable PIN lock if it is currently enabled.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await SecurityService.removePIN();
              setHasPIN(false);
              if (settings.lockType === 'pin') {
                const newSettings = { ...settings, enabled: false, lockType: 'none' };
                await SecurityService.saveLockSettings(newSettings);
                setSettings(newSettings);
              }
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            } catch (error) {
              console.error('Error removing PIN:', error);
              Alert.alert('Error', 'Failed to remove PIN');
            }
          },
        },
      ]
    );
  };

  const handleRemovePassword = async () => {
    Alert.alert(
      'Remove Password',
      'Are you sure you want to remove your password? This will disable password lock if it is currently enabled.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await SecurityService.removePassword();
              setHasPassword(false);
              if (settings.lockType === 'password') {
                const newSettings = { ...settings, enabled: false, lockType: 'none' };
                await SecurityService.saveLockSettings(newSettings);
                setSettings(newSettings);
              }
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            } catch (error) {
              console.error('Error removing password:', error);
              Alert.alert('Error', 'Failed to remove password');
            }
          },
        },
      ]
    );
  };

  const handleToggleLockOnLaunch = async (lockOnAppLaunch: boolean) => {
    try {
      const newSettings = { ...settings, lockOnAppLaunch };
      await SecurityService.saveLockSettings(newSettings);
      setSettings(newSettings);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  const handleToggleLockOnBackground = async (lockOnBackground: boolean) => {
    try {
      const newSettings = { ...settings, lockOnBackground };
      await SecurityService.saveLockSettings(newSettings);
      setSettings(newSettings);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  if (loading) {
    return (
      <ThemedView style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <ThemedText style={[Typography.bodyMedium, { color: colors.textSecondary }]}>Loading...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: Spacing.xxxl + insets.bottom }]}>
        {/* App Lock Toggle */}
        <Card variant="default" padding="lg" style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <MaterialIcons name="lock" size={24} color={colors.primary} />
              <ThemedText style={[Typography.h3, { color: colors.text, marginLeft: Spacing.md }]}>
                App Lock
              </ThemedText>
            </View>
            <Switch
              value={settings.enabled}
              onValueChange={handleToggleLock}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>
          <ThemedText style={[Typography.bodySmall, styles.cardDescription, { color: colors.textSecondary }]}>
            Lock your app with biometric authentication, PIN, or password
          </ThemedText>
        </Card>

        {/* Lock Type Selection */}
        <Card variant="default" padding="lg" style={styles.card}>
          <ThemedText style={[Typography.h4, styles.sectionTitle, { color: colors.text }]}>Lock Type</ThemedText>
          {!settings.enabled && (
            <ThemedText style={[Typography.bodySmall, { color: colors.textSecondary, marginBottom: Spacing.md }]}>
              Select a lock type to secure your app
            </ThemedText>
          )}
            <View style={styles.optionsList}>
              <TouchableOpacity
                style={[
                  styles.optionItem,
                  {
                    backgroundColor: settings.lockType === 'biometric' ? colors.primary + '20' : 'transparent',
                    borderColor: settings.lockType === 'biometric' ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => handleLockTypeChange('biometric')}
                disabled={!biometricAvailable}>
                <View style={styles.optionLeft}>
                  <MaterialIcons
                    name={biometricType?.includes('Face') ? 'face' : 'fingerprint'}
                    size={24}
                    color={biometricAvailable ? colors.primary : colors.textTertiary}
                  />
                  <View style={styles.optionText}>
                    <ThemedText style={[Typography.bodyMedium, { color: colors.text }]}>
                      {biometricType || 'Biometric'}
                    </ThemedText>
                    {!biometricAvailable && (
                      <ThemedText style={[Typography.bodySmall, { color: colors.textTertiary }]}>
                        Not available
                      </ThemedText>
                    )}
                  </View>
                </View>
                {settings.lockType === 'biometric' && (
                  <MaterialIcons name="check-circle" size={24} color={colors.primary} />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.optionItem,
                  {
                    backgroundColor: settings.lockType === 'pin' ? colors.primary + '20' : 'transparent',
                    borderColor: settings.lockType === 'pin' ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => handleLockTypeChange('pin')}>
                <View style={styles.optionLeft}>
                  <MaterialIcons name="lock" size={24} color={colors.primary} />
                  <View style={styles.optionText}>
                    <ThemedText style={[Typography.bodyMedium, { color: colors.text }]}>PIN</ThemedText>
                    {hasPIN ? (
                      <ThemedText style={[Typography.bodySmall, { color: colors.success }]}>Set</ThemedText>
                    ) : (
                      <ThemedText style={[Typography.bodySmall, { color: colors.textTertiary }]}>Not set</ThemedText>
                    )}
                  </View>
                </View>
                {settings.lockType === 'pin' && <MaterialIcons name="check-circle" size={24} color={colors.primary} />}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.optionItem,
                  {
                    backgroundColor: settings.lockType === 'password' ? colors.primary + '20' : 'transparent',
                    borderColor: settings.lockType === 'password' ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => handleLockTypeChange('password')}>
                <View style={styles.optionLeft}>
                  <MaterialIcons name="lock-outline" size={24} color={colors.primary} />
                  <View style={styles.optionText}>
                    <ThemedText style={[Typography.bodyMedium, { color: colors.text }]}>Password</ThemedText>
                    {hasPassword ? (
                      <ThemedText style={[Typography.bodySmall, { color: colors.success }]}>Set</ThemedText>
                    ) : (
                      <ThemedText style={[Typography.bodySmall, { color: colors.textTertiary }]}>Not set</ThemedText>
                    )}
                  </View>
                </View>
                {settings.lockType === 'password' && (
                  <MaterialIcons name="check-circle" size={24} color={colors.primary} />
                )}
              </TouchableOpacity>
            </View>
          </Card>

        {/* PIN Setup */}
        {settings.lockType === 'pin' && (
          <Card variant="default" padding="lg" style={styles.card}>
            <ThemedText style={[Typography.h4, styles.sectionTitle, { color: colors.text }]}>PIN Settings</ThemedText>
            {hasPIN && !showSetPIN ? (
              <View>
                <ThemedText style={[Typography.bodyMedium, { color: colors.text, marginBottom: Spacing.md }]}>
                  PIN is set
                </ThemedText>
                <Button title="Change PIN" onPress={() => setShowSetPIN(true)} variant="secondary" />
                <Button
                  title="Remove PIN"
                  onPress={handleRemovePIN}
                  variant="secondary"
                  style={{ marginTop: Spacing.sm }}
                />
              </View>
            ) : (
              <View>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.backgroundSecondary,
                      color: colors.text,
                      borderColor: colors.border,
                    },
                  ]}
                  value={pin}
                  onChangeText={setPin}
                  placeholder="Enter PIN (4-6 digits)"
                  placeholderTextColor={colors.textTertiary}
                  keyboardType="number-pad"
                  secureTextEntry={true}
                  maxLength={6}
                />
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.backgroundSecondary,
                      color: colors.text,
                      borderColor: colors.border,
                      marginTop: Spacing.md,
                    },
                  ]}
                  value={confirmPin}
                  onChangeText={setConfirmPin}
                  placeholder="Confirm PIN"
                  placeholderTextColor={colors.textTertiary}
                  keyboardType="number-pad"
                  secureTextEntry={true}
                  maxLength={6}
                />
                <View style={styles.buttonRow}>
                  <Button
                    title={hasPIN ? 'Update PIN' : 'Set PIN'}
                    onPress={handleSetPIN}
                    variant="primary"
                    style={{ flex: 1 }}
                  />
                  {hasPIN && (
                    <Button
                      title="Cancel"
                      onPress={() => {
                        setShowSetPIN(false);
                        setPin('');
                        setConfirmPin('');
                      }}
                      variant="secondary"
                      style={{ flex: 1, marginLeft: Spacing.sm }}
                    />
                  )}
                </View>
              </View>
            )}
          </Card>
        )}

        {/* Password Setup */}
        {settings.lockType === 'password' && (
          <Card variant="default" padding="lg" style={styles.card}>
            <ThemedText style={[Typography.h4, styles.sectionTitle, { color: colors.text }]}>
              Password Settings
            </ThemedText>
            {hasPassword && !showSetPassword ? (
              <View>
                <ThemedText style={[Typography.bodyMedium, { color: colors.text, marginBottom: Spacing.md }]}>
                  Password is set
                </ThemedText>
                <Button title="Change Password" onPress={() => setShowSetPassword(true)} variant="secondary" />
                <Button
                  title="Remove Password"
                  onPress={handleRemovePassword}
                  variant="secondary"
                  style={{ marginTop: Spacing.sm }}
                />
              </View>
            ) : (
              <View>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.backgroundSecondary,
                      color: colors.text,
                      borderColor: colors.border,
                    },
                  ]}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Enter password (min 6 characters)"
                  placeholderTextColor={colors.textTertiary}
                  secureTextEntry={true}
                />
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.backgroundSecondary,
                      color: colors.text,
                      borderColor: colors.border,
                      marginTop: Spacing.md,
                    },
                  ]}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Confirm password"
                  placeholderTextColor={colors.textTertiary}
                  secureTextEntry={true}
                />
                <View style={styles.buttonRow}>
                  <Button
                    title={hasPassword ? 'Update Password' : 'Set Password'}
                    onPress={handleSetPassword}
                    variant="primary"
                    style={{ flex: 1 }}
                  />
                  {hasPassword && (
                    <Button
                      title="Cancel"
                      onPress={() => {
                        setShowSetPassword(false);
                        setPassword('');
                        setConfirmPassword('');
                      }}
                      variant="secondary"
                      style={{ flex: 1, marginLeft: Spacing.sm }}
                    />
                  )}
                </View>
              </View>
            )}
          </Card>
        )}

        {/* Lock Options */}
        {settings.enabled && settings.lockType !== 'none' && (
          <Card variant="default" padding="lg" style={styles.card}>
            <ThemedText style={[Typography.h4, styles.sectionTitle, { color: colors.text }]}>Lock Options</ThemedText>
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <ThemedText style={[Typography.bodyMedium, { color: colors.text }]}>Lock on app launch</ThemedText>
                <ThemedText style={[Typography.bodySmall, { color: colors.textSecondary }]}>
                  Require authentication when opening the app
                </ThemedText>
              </View>
              <Switch
                value={settings.lockOnAppLaunch}
                onValueChange={handleToggleLockOnLaunch}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#FFFFFF"
              />
            </View>
            <View style={[styles.settingRow, { marginTop: Spacing.lg }]}>
              <View style={styles.settingLeft}>
                <ThemedText style={[Typography.bodyMedium, { color: colors.text }]}>Lock on background</ThemedText>
                <ThemedText style={[Typography.bodySmall, { color: colors.textSecondary }]}>
                  Require authentication when returning to the app
                </ThemedText>
              </View>
              <Switch
                value={settings.lockOnBackground}
                onValueChange={handleToggleLockOnBackground}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#FFFFFF"
              />
            </View>
          </Card>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
  },
  card: {
    marginBottom: Spacing.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  cardDescription: {
    marginTop: Spacing.xs,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
    fontWeight: '600',
  },
  optionsList: {
    gap: Spacing.md,
  },
  optionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionText: {
    marginLeft: Spacing.md,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingLeft: {
    flex: 1,
    marginRight: Spacing.md,
  },
  input: {
    height: ComponentSizes.inputHeight,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    fontSize: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    marginTop: Spacing.md,
  },
});

