import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { CategoryPicker } from '@/components/ui/category-picker';
import { ColorPicker } from '@/components/ui/color-picker';
import { DatePicker } from '@/components/ui/date-picker';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { BorderRadius, Colors, Spacing } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Budget, BudgetPeriod } from '@/types';
import { getScrollViewBottomPadding } from '@/utils/constants';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Predefined colors for budgets
const BUDGET_COLORS = [
  '#FF6B6B', '#4ECDC4', '#FFE66D', '#95E1D3', '#F38181',
  '#AA96DA', '#FCBAD3', '#A8E6CF', '#FFD3A5', '#C7CEEA',
  '#6BCB77', '#4D96FF', '#9B59B6', '#E74C3C', '#3498DB',
  '#1ABC9C', '#F39C12', '#E67E22', '#34495E', '#16A085',
];

// Calculate end date based on period and start date
const calculateEndDate = (startDate: string, period: BudgetPeriod): string => {
  const start = new Date(startDate);
  const end = new Date(start);

  switch (period) {
    case 'weekly':
      end.setDate(start.getDate() + 7);
      break;
    case 'monthly':
      end.setMonth(start.getMonth() + 1);
      break;
    case 'yearly':
      end.setFullYear(start.getFullYear() + 1);
      break;
  }

  return end.toISOString().split('T')[0];
};

export default function AddBudgetScreen() {
  const { budgets, categories, addBudget, updateBudget } = useApp();
  const router = useRouter();
  const params = useLocalSearchParams();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'] || Colors.light;
  const insets = useSafeAreaInsets();

  const editingBudget = params.id ? budgets.find((b) => b.id === params.id) : null;

  const [name, setName] = useState(editingBudget?.name || '');
  const [categoryId, setCategoryId] = useState<string>(editingBudget?.categoryId || '');
  const [amount, setAmount] = useState<string>(editingBudget?.amount.toString() || '');
  const [period, setPeriod] = useState<BudgetPeriod>(editingBudget?.period || 'monthly');
  const [startDate, setStartDate] = useState<string>(
    editingBudget?.startDate || new Date().toISOString().split('T')[0]
  );
  const [color, setColor] = useState(editingBudget?.color || BUDGET_COLORS[0]);
  const [icon, setIcon] = useState(editingBudget?.icon || '💰');
  const [enableNotifications, setEnableNotifications] = useState(
    editingBudget?.enableNotifications !== false
  );
  const [notifyAtPercentage, setNotifyAtPercentage] = useState<number[]>(
    editingBudget?.notifyAtPercentage || [50, 75, 90, 100]
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Calculate end date based on period
  const endDate = useMemo(() => {
    return calculateEndDate(startDate, period);
  }, [startDate, period]);

  // Filter expense categories only
  const expenseCategories = useMemo(() => {
    return categories.filter((c) => c.type === 'expense');
  }, [categories]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = 'Please enter budget name';
    if (!amount || parseFloat(amount) <= 0) newErrors.amount = 'Please enter a valid amount';
    if (!startDate) newErrors.startDate = 'Please select a start date';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    const budgetData: Budget = {
      id: editingBudget?.id || Date.now().toString(),
      name: name.trim(),
      categoryId: categoryId || undefined,
      amount: parseFloat(amount),
      period,
      startDate,
      endDate,
      color,
      icon: icon.trim() || '💰',
      enableNotifications,
      notifyAtPercentage: enableNotifications ? notifyAtPercentage : undefined,
      createdAt: editingBudget?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      if (editingBudget) {
        await updateBudget(budgetData);
      } else {
        await addBudget(budgetData);
      }
      router.back();
    } catch (error: any) {
      Alert.alert(
        'Error',
        error?.message || 'Failed to save budget. Please try again.',
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
            {editingBudget ? 'Edit Budget' : 'Add Budget'}
          </ThemedText>
        </View>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: getScrollViewBottomPadding(insets.bottom) }]}>
        {/* Budget Name */}
        <Input
          label="Budget Name"
          value={name}
          onChangeText={setName}
          placeholder="e.g., Groceries Budget"
          error={errors.name}
        />

        {/* Category Selection (Optional) */}
        <CategoryPicker
          categories={expenseCategories}
          selectedCategoryId={categoryId}
          onCategorySelect={setCategoryId}
          label="Category (Optional)"
          filterType="expense"
          placeholder="Select category or leave empty for overall budget"
        />

        {/* Amount */}
        <Input
          label="Budget Amount"
          value={amount}
          onChangeText={setAmount}
          placeholder="0.00"
          keyboardType="decimal-pad"
          error={errors.amount}
        />

        {/* Period */}
        <Select
          label="Period"
          value={period}
          options={[
            { label: '📅 Weekly', value: 'weekly' },
            { label: '📆 Monthly', value: 'monthly' },
            { label: '📅 Yearly', value: 'yearly' },
          ]}
          onValueChange={(value) => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setPeriod(value as BudgetPeriod);
          }}
          placeholder="Select period"
        />

        {/* Start Date */}
        <DatePicker
          label="Start Date"
          value={startDate}
          onChange={(selectedDate) => setStartDate(selectedDate)}
          placeholder="Select start date"
          error={errors.startDate}
        />

        {/* End Date (Read-only, calculated) */}
        <View style={styles.section}>
          <ThemedText type="defaultSemiBold" style={[styles.sectionLabel, { color: colors.text }]}>
            End Date (Calculated)
          </ThemedText>
          <View style={[styles.readOnlyField, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
            <ThemedText style={[styles.readOnlyText, { color: colors.textSecondary }]}>
              {endDate}
            </ThemedText>
          </View>
        </View>

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
          colors={BUDGET_COLORS}
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
                Get alerts when you reach budget thresholds
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
          )}
        </View>

        <Button
          title={editingBudget ? 'Update Budget' : 'Create Budget'}
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
  readOnlyField: {
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
  },
  readOnlyText: {
    fontSize: 16,
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
  helperText: {
    fontSize: 12,
    marginTop: 4,
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
  submitButton: {
    marginTop: Spacing.md,
  },
});
