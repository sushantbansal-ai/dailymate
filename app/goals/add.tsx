import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AccountPicker } from '@/components/ui/account-picker';
import { Button } from '@/components/ui/button';
import { ColorPicker } from '@/components/ui/color-picker';
import { DatePicker } from '@/components/ui/date-picker';
import { Input } from '@/components/ui/input';
import { BorderRadius, Colors, Spacing } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Goal } from '@/types';
import { getScrollViewBottomPadding } from '@/utils/constants';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Predefined colors for goals
const GOAL_COLORS = [
  '#FF6B6B', '#4ECDC4', '#FFE66D', '#95E1D3', '#F38181',
  '#AA96DA', '#FCBAD3', '#A8E6CF', '#FFD3A5', '#C7CEEA',
  '#6BCB77', '#4D96FF', '#9B59B6', '#E74C3C', '#3498DB',
  '#1ABC9C', '#F39C12', '#E67E22', '#34495E', '#16A085',
];

export default function AddGoalScreen() {
  const { goals, accounts, addGoal, updateGoal } = useApp();
  const router = useRouter();
  const params = useLocalSearchParams();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'] || Colors.light;
  const insets = useSafeAreaInsets();

  const editingGoal = params.id ? goals.find((g) => g.id === params.id) : null;
  const linkedAccount = editingGoal?.accountId ? accounts.find((a) => a.id === editingGoal.accountId) : null;

  const [name, setName] = useState(editingGoal?.name || '');
  const [targetAmount, setTargetAmount] = useState<string>(editingGoal?.targetAmount.toString() || '');
  const [currentAmount, setCurrentAmount] = useState<string>(
    editingGoal?.currentAmount.toString() || (linkedAccount ? linkedAccount.balance.toString() : '0')
  );
  const [targetDate, setTargetDate] = useState<string>(
    editingGoal?.targetDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [accountId, setAccountId] = useState<string>(editingGoal?.accountId || '');
  const [color, setColor] = useState(editingGoal?.color || GOAL_COLORS[0]);
  const [icon, setIcon] = useState(editingGoal?.icon || '🎯');
  const [description, setDescription] = useState(editingGoal?.description || '');
  const [enableNotifications, setEnableNotifications] = useState(
    editingGoal?.enableNotifications !== false
  );
  const [notifyAtPercentage, setNotifyAtPercentage] = useState<number[]>(
    editingGoal?.notifyAtPercentage || [25, 50, 75, 90, 100]
  );
  const [notifyDaysBefore, setNotifyDaysBefore] = useState<string>(
    editingGoal?.notifyDaysBefore?.toString() || '7'
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Update current amount when account is selected
  const selectedAccount = useMemo(() => {
    return accountId ? accounts.find((a) => a.id === accountId) : null;
  }, [accountId, accounts]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = 'Please enter goal name';
    if (!targetAmount || parseFloat(targetAmount) <= 0) newErrors.targetAmount = 'Please enter a valid target amount';
    if (!targetDate) newErrors.targetDate = 'Please select a target date';
    const current = parseFloat(currentAmount) || 0;
    const target = parseFloat(targetAmount) || 0;
    if (current > target) {
      newErrors.currentAmount = 'Current amount cannot exceed target amount';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    // If account is linked, use account balance as current amount
    let finalCurrentAmount = parseFloat(currentAmount) || 0;
    if (accountId && selectedAccount) {
      finalCurrentAmount = selectedAccount.balance;
    }

    const goalData: Goal = {
      id: editingGoal?.id || Date.now().toString(),
      name: name.trim(),
      targetAmount: parseFloat(targetAmount),
      currentAmount: finalCurrentAmount,
      targetDate,
      accountId: accountId || undefined,
      color,
      icon: icon.trim() || '🎯',
      description: description.trim() || undefined,
      enableNotifications,
      notifyAtPercentage: enableNotifications ? notifyAtPercentage : undefined,
      notifyDaysBefore: enableNotifications ? parseInt(notifyDaysBefore) || 7 : undefined,
      createdAt: editingGoal?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      if (editingGoal) {
        await updateGoal(goalData);
      } else {
        await addGoal(goalData);
      }
      router.back();
    } catch (error: any) {
      Alert.alert(
        'Error',
        error?.message || 'Failed to save goal. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const toggleNotificationThreshold = (threshold: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (notifyAtPercentage.includes(threshold)) {
      setNotifyAtPercentage(notifyAtPercentage.filter((t) => t !== threshold));
    } else {
      setNotifyAtPercentage([...notifyAtPercentage, threshold].sort((a, b) => a - b));
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
            {editingGoal ? 'Edit Goal' : 'Add Goal'}
          </ThemedText>
        </View>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: getScrollViewBottomPadding(insets.bottom) }]}>
        {/* Goal Name */}
        <Input
          label="Goal Name"
          value={name}
          onChangeText={setName}
          placeholder="e.g., Vacation Fund"
          error={errors.name}
        />

        {/* Description */}
        <Input
          label="Description (Optional)"
          value={description}
          onChangeText={setDescription}
          placeholder="Add a description for this goal"
          multiline
          numberOfLines={3}
        />

        {/* Target Amount */}
        <Input
          label="Target Amount"
          value={targetAmount}
          onChangeText={setTargetAmount}
          placeholder="0.00"
          keyboardType="decimal-pad"
          error={errors.targetAmount}
        />

        {/* Link Account (Optional) */}
        <View style={styles.section}>
          <ThemedText type="defaultSemiBold" style={[styles.sectionLabel, { color: colors.text }]}>
            Link Account (Optional)
          </ThemedText>
          <ThemedText style={[styles.helperText, { color: colors.textSecondary, marginBottom: Spacing.sm }]}>
            Link to an account to automatically track its balance as progress
          </ThemedText>
          <AccountPicker
            accounts={accounts}
            selectedAccountId={accountId}
            onAccountSelect={setAccountId}
            placeholder="Select account or leave empty"
          />
          {selectedAccount && (
            <View style={[styles.infoBox, { backgroundColor: colors.backgroundSecondary }]}>
              <MaterialIcons name="info" size={16} color={colors.info} />
              <ThemedText style={[styles.infoText, { color: colors.textSecondary }]}>
                Current amount will be automatically updated from {selectedAccount.name} balance
              </ThemedText>
            </View>
          )}
        </View>

        {/* Current Amount (only if not linked to account) */}
        {!accountId && (
          <Input
            label="Current Amount"
            value={currentAmount}
            onChangeText={setCurrentAmount}
            placeholder="0.00"
            keyboardType="decimal-pad"
            error={errors.currentAmount}
            helperText="Enter your current savings for this goal"
          />
        )}

        {/* Target Date */}
        <DatePicker
          label="Target Date"
          value={targetDate}
          onChange={(selectedDate) => setTargetDate(selectedDate)}
          placeholder="Select target date"
          minimumDate={new Date().toISOString().split('T')[0]}
          error={errors.targetDate}
        />

        {/* Icon (Emoji) */}
        <View style={styles.section}>
          <ThemedText type="defaultSemiBold" style={[styles.sectionLabel, { color: colors.text }]}>
            Icon (Emoji)
          </ThemedText>
          <View style={styles.iconContainer}>
            <TouchableOpacity
              style={[styles.iconButton, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}
              activeOpacity={0.7}>
              <ThemedText style={styles.iconDisplay}>{icon}</ThemedText>
            </TouchableOpacity>
            <Input
              value={icon}
              onChangeText={(text) => {
                if (text.length <= 2) {
                  setIcon(text);
                }
              }}
              placeholder="Enter emoji"
              style={styles.iconInput}
              maxLength={2}
            />
          </View>
        </View>

        {/* Color Selection */}
        <ColorPicker
          colors={GOAL_COLORS}
          selectedColor={color}
          onColorSelect={setColor}
          label="Color"
        />

        {/* Notification Settings */}
        <View style={styles.section}>
          <View style={styles.switchRow}>
            <View style={styles.switchLabel}>
              <ThemedText type="defaultSemiBold" style={[styles.sectionLabel, { color: colors.text }]}>
                Enable Notifications
              </ThemedText>
              <ThemedText style={[styles.helperText, { color: colors.textSecondary }]}>
                Get alerts when you reach goal milestones
              </ThemedText>
            </View>
            <Switch
              value={enableNotifications}
              onValueChange={(value) => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setEnableNotifications(value);
              }}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.cardBackground}
            />
          </View>

          {enableNotifications && (
            <>
              <View style={styles.thresholdContainer}>
                <ThemedText type="defaultSemiBold" style={[styles.sectionLabel, { color: colors.text, marginBottom: Spacing.sm }]}>
                  Notify At (%)
                </ThemedText>
                <View style={styles.thresholdGrid}>
                  {[25, 50, 75, 90, 100].map((threshold) => {
                    const isSelected = notifyAtPercentage.includes(threshold);
                    return (
                      <TouchableOpacity
                        key={threshold}
                        style={[
                          styles.thresholdButton,
                          {
                            backgroundColor: isSelected ? colors.primary : colors.cardBackground,
                            borderColor: isSelected ? colors.primary : colors.border,
                          },
                        ]}
                        onPress={() => toggleNotificationThreshold(threshold)}
                        activeOpacity={0.7}>
                        <ThemedText
                          style={[
                            styles.thresholdText,
                            { color: isSelected ? '#FFFFFF' : colors.text },
                          ]}>
                          {threshold}%
                        </ThemedText>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <View style={styles.section}>
                <Input
                  label="Notify Days Before Target Date"
                  value={notifyDaysBefore}
                  onChangeText={setNotifyDaysBefore}
                  placeholder="7"
                  keyboardType="number-pad"
                  helperText="Days before target date to send reminder"
                />
              </View>
            </>
          )}
        </View>

        <Button
          title={editingGoal ? 'Update Goal' : 'Create Goal'}
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
  helperText: {
    fontSize: 12,
    marginTop: 4,
  },
  iconContainer: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  iconButton: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.md,
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
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  switchLabel: {
    flex: 1,
    marginRight: Spacing.md,
  },
  thresholdContainer: {
    marginTop: Spacing.md,
  },
  thresholdGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  thresholdButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    minWidth: 60,
    alignItems: 'center',
  },
  thresholdText: {
    fontSize: 14,
    fontWeight: '600',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.sm,
    gap: Spacing.xs,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
  },
  submitButton: {
    marginTop: Spacing.md,
  },
});
