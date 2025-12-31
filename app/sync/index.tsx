/**
 * Google Sheets Sync Settings Screen
 * Configure and manage Google Sheets synchronization
 */

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { BorderRadius, Colors, ComponentSizes, Spacing, Typography } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Switch, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as GoogleSheets from '@/services/google-sheets';
import * as SyncService from '@/services/sync';

export default function SyncSettingsScreen() {
  const { refreshData } = useApp();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();
  const [config, setConfig] = useState<GoogleSheets.GoogleSheetsConfig>({ enabled: false });
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [spreadsheetIdInput, setSpreadsheetIdInput] = useState('');
  const [authenticating, setAuthenticating] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const currentConfig = await GoogleSheets.getConfig();
      setConfig(currentConfig);
      setSpreadsheetIdInput(currentConfig.spreadsheetId || '');
    } catch (error) {
      console.error('Error loading config:', error);
      Alert.alert('Error', 'Failed to load sync settings');
    } finally {
      setLoading(false);
    }
  };

  const handleAuthenticate = async () => {
    try {
      setAuthenticating(true);
      const tokens = await GoogleSheets.authenticateGoogle();
      
      if (tokens) {
        await GoogleSheets.saveConfig({
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
        });
        await loadConfig();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('Success', 'Successfully connected to Google');
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert('Error', 'Failed to authenticate with Google');
      }
    } catch (error: any) {
      console.error('Authentication error:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const errorMessage = error?.message || 'Failed to authenticate with Google';
      Alert.alert('Authentication Error', errorMessage);
    } finally {
      setAuthenticating(false);
    }
  };

  const handleCreateSpreadsheet = async () => {
    try {
      setSyncing(true);
      const spreadsheetId = await GoogleSheets.createSpreadsheet('DailyMate - Financial Data');
      
      if (spreadsheetId) {
        await GoogleSheets.saveConfig({ spreadsheetId });
        setSpreadsheetIdInput(spreadsheetId);
        await loadConfig();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('Success', 'Spreadsheet created successfully');
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert('Error', 'Failed to create spreadsheet');
      }
    } catch (error) {
      console.error('Error creating spreadsheet:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', 'Failed to create spreadsheet');
    } finally {
      setSyncing(false);
    }
  };

  const handleSetSpreadsheetId = async () => {
    if (!spreadsheetIdInput.trim()) {
      Alert.alert('Error', 'Please enter a spreadsheet ID');
      return;
    }

    try {
      await GoogleSheets.saveConfig({ spreadsheetId: spreadsheetIdInput.trim() });
      await loadConfig();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      Alert.alert('Success', 'Spreadsheet ID saved');
    } catch (error) {
      console.error('Error saving spreadsheet ID:', error);
      Alert.alert('Error', 'Failed to save spreadsheet ID');
    }
  };

  const handleToggleSync = async (enabled: boolean) => {
    if (enabled && !config.accessToken) {
      Alert.alert('Authentication Required', 'Please authenticate with Google first');
      return;
    }

    if (enabled && !config.spreadsheetId) {
      Alert.alert('Spreadsheet Required', 'Please create or set a spreadsheet ID first');
      return;
    }

    try {
      await GoogleSheets.saveConfig({ enabled });
      setConfig({ ...config, enabled });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      if (enabled && config.spreadsheetId) {
        // Perform initial sync
        handleSyncToSheets();
      }
    } catch (error) {
      console.error('Error toggling sync:', error);
      Alert.alert('Error', 'Failed to update sync settings');
    }
  };

  const handleSyncToSheets = async () => {
    if (!config.spreadsheetId) {
      Alert.alert('Error', 'No spreadsheet ID configured');
      return;
    }

    try {
      setSyncing(true);
      const success = await SyncService.syncAllToSheets(config.spreadsheetId);
      
      if (success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('Success', 'Data synced to Google Sheets successfully');
        await loadConfig();
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert('Error', 'Failed to sync data to Google Sheets');
      }
    } catch (error) {
      console.error('Sync error:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', 'Failed to sync data');
    } finally {
      setSyncing(false);
    }
  };

  const handleSyncFromSheets = async () => {
    if (!config.spreadsheetId) {
      Alert.alert('Error', 'No spreadsheet ID configured');
      return;
    }

    Alert.alert(
      'Sync from Google Sheets',
      'This will replace your local data with data from Google Sheets. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sync',
          style: 'destructive',
          onPress: async () => {
            try {
              setSyncing(true);
              const success = await SyncService.syncAllFromSheets(config.spreadsheetId!);
              
              if (success) {
                await refreshData();
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                Alert.alert('Success', 'Data synced from Google Sheets successfully');
                await loadConfig();
              } else {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                Alert.alert('Error', 'Failed to sync data from Google Sheets');
              }
            } catch (error) {
              console.error('Sync error:', error);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
              Alert.alert('Error', 'Failed to sync data');
            } finally {
              setSyncing(false);
            }
          },
        },
      ]
    );
  };

  const handleDisconnect = async () => {
    Alert.alert(
      'Disconnect Google Sheets',
      'Are you sure you want to disconnect? This will remove all sync settings.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            try {
              await GoogleSheets.disconnect();
              await loadConfig();
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              Alert.alert('Success', 'Disconnected from Google Sheets');
            } catch (error) {
              console.error('Error disconnecting:', error);
              Alert.alert('Error', 'Failed to disconnect');
            }
          },
        },
      ]
    );
  };

  const formatLastSyncTime = (timestamp?: number): string => {
    if (!timestamp) return 'Never';
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  if (loading) {
    return (
      <ThemedView style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <ThemedText style={[Typography.bodyMedium, { color: colors.textSecondary, marginTop: Spacing.md }]}>
            Loading...
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: Spacing.xxxl + insets.bottom }]}>
        
        {/* Header */}
        <View style={styles.header}>
          <MaterialIcons name="cloud-sync" size={32} color={colors.primary} />
          <ThemedText style={[Typography.h2, { color: colors.text, marginTop: Spacing.md }]}>
            Google Sheets Sync
          </ThemedText>
          <ThemedText style={[Typography.bodyMedium, styles.subtitle, { color: colors.textSecondary }]}>
            Sync your financial data with Google Sheets
          </ThemedText>
        </View>

        {/* Sync Toggle */}
        <Card variant="default" padding="lg" style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <MaterialIcons name="sync" size={24} color={colors.primary} />
              <ThemedText style={[Typography.h3, { color: colors.text, marginLeft: Spacing.md }]}>
                Auto Sync
              </ThemedText>
            </View>
            <Switch
              value={config.enabled}
              onValueChange={handleToggleSync}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#FFFFFF"
              disabled={syncing}
            />
          </View>
          <ThemedText style={[Typography.bodySmall, styles.cardDescription, { color: colors.textSecondary }]}>
            Automatically sync data when changes are made
          </ThemedText>
          {config.lastSyncTime && (
            <ThemedText style={[Typography.bodySmall, { color: colors.textTertiary, marginTop: Spacing.xs }]}>
              Last sync: {formatLastSyncTime(config.lastSyncTime)}
            </ThemedText>
          )}
        </Card>

        {/* Authentication */}
        <Card variant="default" padding="lg" style={styles.card}>
          <ThemedText style={[Typography.h4, styles.sectionTitle, { color: colors.text }]}>
            Authentication
          </ThemedText>
          {config.accessToken ? (
            <View style={styles.authenticatedContainer}>
              <MaterialIcons name="check-circle" size={24} color={colors.success} />
              <ThemedText style={[Typography.bodyMedium, { color: colors.success, marginLeft: Spacing.sm }]}>
                Connected to Google
              </ThemedText>
            </View>
          ) : (
            <View>
              <ThemedText style={[Typography.bodySmall, { color: colors.textSecondary, marginBottom: Spacing.md }]}>
                Connect your Google account to enable sync
              </ThemedText>
              <Button
                title={authenticating ? 'Authenticating...' : 'Connect Google Account'}
                onPress={handleAuthenticate}
                variant="primary"
                disabled={authenticating}
                icon="account-circle"
              />
            </View>
          )}
        </Card>

        {/* Spreadsheet Configuration */}
        {config.accessToken && (
          <Card variant="default" padding="lg" style={styles.card}>
            <ThemedText style={[Typography.h4, styles.sectionTitle, { color: colors.text }]}>
              Spreadsheet
            </ThemedText>
            {config.spreadsheetId ? (
              <View>
                <View style={styles.spreadsheetInfo}>
                  <MaterialIcons name="description" size={20} color={colors.primary} />
                  <ThemedText style={[Typography.bodyMedium, { color: colors.text, marginLeft: Spacing.sm, flex: 1 }]}>
                    {config.spreadsheetId}
                  </ThemedText>
                </View>
                <ThemedText style={[Typography.bodySmall, { color: colors.textSecondary, marginTop: Spacing.sm }]}>
                  Spreadsheet is configured
                </ThemedText>
              </View>
            ) : (
              <View>
                <ThemedText style={[Typography.bodySmall, { color: colors.textSecondary, marginBottom: Spacing.md }]}>
                  Create a new spreadsheet or enter an existing spreadsheet ID
                </ThemedText>
                <Button
                  title={syncing ? 'Creating...' : 'Create New Spreadsheet'}
                  onPress={handleCreateSpreadsheet}
                  variant="primary"
                  disabled={syncing}
                  icon="add"
                  style={{ marginBottom: Spacing.md }}
                />
                <View style={styles.inputContainer}>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: colors.backgroundSecondary,
                        color: colors.text,
                        borderColor: colors.border,
                      },
                    ]}
                    value={spreadsheetIdInput}
                    onChangeText={setSpreadsheetIdInput}
                    placeholder="Enter Spreadsheet ID"
                    placeholderTextColor={colors.textTertiary}
                  />
                  <Button
                    title="Set Spreadsheet ID"
                    onPress={handleSetSpreadsheetId}
                    variant="secondary"
                    style={{ marginTop: Spacing.sm }}
                  />
                </View>
              </View>
            )}
          </Card>
        )}

        {/* Manual Sync */}
        {config.enabled && config.spreadsheetId && (
          <Card variant="default" padding="lg" style={styles.card}>
            <ThemedText style={[Typography.h4, styles.sectionTitle, { color: colors.text }]}>
              Manual Sync
            </ThemedText>
            <ThemedText style={[Typography.bodySmall, { color: colors.textSecondary, marginBottom: Spacing.md }]}>
              Manually sync data to or from Google Sheets
            </ThemedText>
            <View style={styles.buttonRow}>
              <Button
                title={syncing ? 'Syncing...' : 'Sync to Sheets'}
                onPress={handleSyncToSheets}
                variant="primary"
                disabled={syncing}
                icon="cloud-upload"
                style={{ flex: 1 }}
              />
              <Button
                title={syncing ? 'Syncing...' : 'Sync from Sheets'}
                onPress={handleSyncFromSheets}
                variant="secondary"
                disabled={syncing}
                icon="cloud-download"
                style={{ flex: 1, marginLeft: Spacing.sm }}
              />
            </View>
          </Card>
        )}

        {/* Disconnect */}
        {config.accessToken && (
          <Card variant="default" padding="lg" style={styles.card}>
            <Button
              title="Disconnect"
              onPress={handleDisconnect}
              variant="secondary"
              icon="logout"
            />
          </Card>
        )}

        {/* Info */}
        <Card variant="default" padding="lg" style={styles.card}>
          <View style={styles.infoContainer}>
            <MaterialIcons name="info" size={20} color={colors.info} />
            <View style={styles.infoText}>
              <ThemedText style={[Typography.bodySmall, { color: colors.textSecondary }]}>
                • Data is synced to separate sheets: Accounts, Transactions, Categories, Labels, Contacts, Budgets, Goals, Planned Transactions, and Bills
              </ThemedText>
              <ThemedText style={[Typography.bodySmall, { color: colors.textSecondary, marginTop: Spacing.xs }]}>
                • When auto-sync is enabled, changes are automatically synced to Google Sheets
              </ThemedText>
              <ThemedText style={[Typography.bodySmall, { color: colors.textSecondary, marginTop: Spacing.xs }]}>
                • Make sure to set up Google OAuth credentials in your environment variables
              </ThemedText>
            </View>
          </View>
        </Card>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  subtitle: {
    marginTop: Spacing.xs,
    textAlign: 'center',
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
  authenticatedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputContainer: {
    marginTop: Spacing.sm,
  },
  input: {
    height: ComponentSizes.inputHeight,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    fontSize: 16,
  },
  spreadsheetInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoText: {
    flex: 1,
    marginLeft: Spacing.sm,
  },
});

