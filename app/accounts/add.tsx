import { AccountDetailsForm } from '@/components/account-details-form';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AccountTypePicker } from '@/components/ui/account-type-picker';
import { Button } from '@/components/ui/button';
import { ColorPicker } from '@/components/ui/color-picker';
import { Input } from '@/components/ui/input';
import { BorderRadius, Colors, Spacing } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import * as NotificationService from '@/services/notifications';
import { Account, AccountDetails, AccountType } from '@/types';
import { ACCOUNT_COLORS, getAccountIcon, getScrollViewBottomPadding } from '@/utils/constants';
import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function AddAccountScreen() {
  const { accounts, addAccount, updateAccount } = useApp();
  const router = useRouter();
  const params = useLocalSearchParams();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'] || Colors.light;
  const insets = useSafeAreaInsets();
  const editingAccount = params.id ? accounts.find((a) => a.id === params.id) : null;

  const [name, setName] = useState(editingAccount?.name || '');
  const [type, setType] = useState<AccountType>(editingAccount?.type || 'Cash');
  const [balance, setBalance] = useState(editingAccount?.balance.toString() || '0');
  const [color, setColor] = useState(editingAccount?.color || ACCOUNT_COLORS[0]);
  const [icon, setIcon] = useState(editingAccount?.icon || getAccountIcon(type));
  const [details, setDetails] = useState<AccountDetails>(editingAccount?.details || {});
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Request notification permissions on mount
  useEffect(() => {
    NotificationService.requestNotificationPermissions();
  }, []);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = 'Please enter account name';
    if (!type) newErrors.type = 'Please select account type';
    if (!balance || parseFloat(balance) < 0) newErrors.balance = 'Please enter a valid balance';

    // Validate required fields based on account type
    const requiredFields = NotificationService.getRequiredFieldsForAccountType(type);
    for (const field of requiredFields) {
      if (!details[field as keyof AccountDetails]) {
        const fieldLabels = NotificationService.getFieldLabelsForAccountType(type);
        newErrors[field] = `Please enter ${fieldLabels[field] || field}`;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    const accountData: Account = {
      id: editingAccount?.id || Date.now().toString(),
      name: name.trim(),
      type,
      balance: parseFloat(balance),
      color,
      icon: icon || getAccountIcon(type),
      details: Object.keys(details).length > 0 ? details : undefined,
      createdAt: editingAccount?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      if (editingAccount) {
        await updateAccount(accountData);
      } else {
        await addAccount(accountData);
      }
      router.back();
    } catch (error: any) {
      Alert.alert(
        'Error',
        error?.message || 'Failed to save account. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={colors.iconActive || colors.primary} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <ThemedText type="title" style={styles.headerTitle}>
            {editingAccount ? 'Edit Account' : 'Add Account'}
          </ThemedText>
        </View>
        <View style={styles.placeholder} />
      </View>

      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={[styles.content, { paddingBottom: getScrollViewBottomPadding(insets.bottom) }]}>
        {/* Account Name */}
        <Input
          label="Account Name"
          value={name}
          onChangeText={setName}
          placeholder="e.g., HDFC Savings"
          error={errors.name}
        />

        {/* Account Type */}
        <AccountTypePicker
          label="Account Type"
          selectedType={type}
          onTypeSelect={(newType) => {
            setType(newType);
            // Update icon to match account type if not custom
            if (!editingAccount?.icon) {
              setIcon(getAccountIcon(newType));
            }
            // Reset details when type changes
            setDetails({});
          }}
          placeholder="Select account type"
          error={errors.type}
        />

        {/* Account Icon */}
        <View style={styles.section}>
          <ThemedText type="defaultSemiBold" style={[styles.sectionLabel, { color: colors.text }]}>
            Icon (Emoji)
          </ThemedText>
          <View style={styles.iconContainer}>
            <TouchableOpacity
              style={[styles.iconButton, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}
              onPress={() => {
                // In a real app, you'd open an emoji picker here
                // For now, we'll just show the current icon
              }}>
              <ThemedText style={styles.iconDisplay}>{icon}</ThemedText>
            </TouchableOpacity>
            <Input
              value={icon}
              onChangeText={(text) => {
                // Allow only emoji characters (basic validation)
                if (text.length <= 2) {
                  setIcon(text);
                }
              }}
              placeholder="Enter emoji"
              style={styles.iconInput}
              maxLength={2}
            />
          </View>
          <ThemedText style={[styles.helperText, { color: colors.textSecondary }]}>
            Use an emoji to represent this account (optional)
          </ThemedText>
        </View>

        {/* Initial Balance */}
        <Input
          label="Initial Balance"
          value={balance}
          onChangeText={setBalance}
          placeholder="0.00"
          keyboardType="decimal-pad"
          error={errors.balance}
        />

        {/* Account Details - Type Specific Fields */}
        <AccountDetailsForm
          accountType={type}
          details={details}
          onChange={setDetails}
          errors={errors}
        />

        {/* Color Selection */}
        <ColorPicker
          colors={ACCOUNT_COLORS}
          selectedColor={color}
          onColorSelect={setColor}
          label="Color"
        />

        <Button
          title={editingAccount ? 'Update Account' : 'Create Account'}
          onPress={handleSubmit}
          variant="primary"
          style={styles.submitButton}
        />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionLabel: {
    marginBottom: Spacing.sm,
    fontSize: 14,
    fontWeight: '600',
  },
  submitButton: {
    marginTop: 8,
  },
  iconContainer: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  iconButton: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  iconDisplay: {
    fontSize: 32,
  },
  iconInput: {
    flex: 1,
  },
  helperText: {
    fontSize: 12,
    marginTop: 4,
  },
});
