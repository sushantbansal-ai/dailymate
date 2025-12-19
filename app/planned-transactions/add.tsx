import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AccountPicker } from '@/components/ui/account-picker';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CategoryPicker } from '@/components/ui/category-picker';
import { DatePicker } from '@/components/ui/date-picker';
import { Input } from '@/components/ui/input';
import { LabelsPicker } from '@/components/ui/labels-picker';
import { PayeePicker } from '@/components/ui/payee-picker';
import { Select } from '@/components/ui/select';
import { StatusPicker } from '@/components/ui/status-picker';
import { TimePicker } from '@/components/ui/time-picker';
import { BorderRadius, Colors, Spacing } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { PlannedTransaction, RecurrenceType, TransactionStatus, TransactionType } from '@/types';
import { getScrollViewBottomPadding } from '@/utils/constants';
import { calculateNextOccurrenceDate } from '@/utils/planned-transaction-helpers';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function AddPlannedTransactionScreen() {
  const {
    plannedTransactions,
    accounts,
    categories,
    labels,
    contacts,
    addPlannedTransaction,
    updatePlannedTransaction,
  } = useApp();
  const router = useRouter();
  const params = useLocalSearchParams();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'] || Colors.light;
  const insets = useSafeAreaInsets();

  const editingPlannedTransaction = params.id
    ? plannedTransactions.find((pt) => pt.id === params.id)
    : null;

  const [type, setType] = useState<TransactionType>(editingPlannedTransaction?.type || 'expense');
  const [accountId, setAccountId] = useState<string>(editingPlannedTransaction?.accountId || '');
  const [toAccountId, setToAccountId] = useState<string>(editingPlannedTransaction?.toAccountId || '');
  const [categoryId, setCategoryId] = useState<string>(editingPlannedTransaction?.categoryId || '');
  const [amount, setAmount] = useState<string>(editingPlannedTransaction?.amount.toString() || '');
  const [description, setDescription] = useState<string>(editingPlannedTransaction?.description || '');
  const [scheduledDate, setScheduledDate] = useState<string>(
    editingPlannedTransaction?.scheduledDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [time, setTime] = useState<string>(editingPlannedTransaction?.time || '');
  const [selectedLabelIds, setSelectedLabelIds] = useState<string[]>(editingPlannedTransaction?.labels || []);
  const [payeeIds, setPayeeIds] = useState<string[]>(editingPlannedTransaction?.payeeIds || []);
  const [status, setStatus] = useState<TransactionStatus>(editingPlannedTransaction?.status || 'pending');
  const [itemName, setItemName] = useState<string>(editingPlannedTransaction?.itemName || '');
  const [warrantyDate, setWarrantyDate] = useState<string>(editingPlannedTransaction?.warrantyDate || '');
  const [recurrence, setRecurrence] = useState<RecurrenceType>(editingPlannedTransaction?.recurrence || 'none');
  const [endDate, setEndDate] = useState<string>(editingPlannedTransaction?.endDate || '');
  const [enableNotifications, setEnableNotifications] = useState(
    editingPlannedTransaction?.enableNotifications !== false
  );
  const [notifyDaysBefore, setNotifyDaysBefore] = useState<string>(
    editingPlannedTransaction?.notifyDaysBefore?.join(', ') || '7, 1'
  );
  const [notifyOnDay, setNotifyOnDay] = useState(editingPlannedTransaction?.notifyOnDay !== false);
  const [autoCreate, setAutoCreate] = useState(editingPlannedTransaction?.autoCreate !== false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const filteredCategories = useMemo(() => {
    return categories.filter((c) => {
      if (type === 'income') return c.type === 'income';
      if (type === 'expense') return c.type === 'expense';
      return true;
    });
  }, [categories, type]);

  // Calculate next occurrence date for display
  const nextOccurrenceDate = useMemo(() => {
    if (recurrence === 'none') return scheduledDate;
    return calculateNextOccurrenceDate(scheduledDate, recurrence);
  }, [scheduledDate, recurrence]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!accountId) newErrors.accountId = 'Please select an account';
    if (type === 'transfer' && !toAccountId) newErrors.toAccountId = 'Please select destination account';
    if (!categoryId && type !== 'transfer') newErrors.categoryId = 'Please select a category';
    if (!amount || parseFloat(amount) <= 0) newErrors.amount = 'Please enter a valid amount';
    if (!description.trim()) newErrors.description = 'Please enter a description';
    if (!scheduledDate) newErrors.scheduledDate = 'Please select a scheduled date';
    if (recurrence !== 'none' && endDate && new Date(endDate) <= new Date(scheduledDate)) {
      newErrors.endDate = 'End date must be after scheduled date';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    // Parse notify days before
    const notifyDaysArray = enableNotifications
      ? notifyDaysBefore
          .split(',')
          .map((d) => parseInt(d.trim()))
          .filter((d) => !isNaN(d) && d >= 0)
      : undefined;

    const plannedTransactionData: PlannedTransaction = {
      id: editingPlannedTransaction?.id || Date.now().toString(),
      accountId,
      categoryId: categoryId || 'other-expense',
      type,
      amount: parseFloat(amount),
      description: description.trim(),
      scheduledDate,
      time: time || undefined,
      toAccountId: type === 'transfer' ? toAccountId : undefined,
      labels: selectedLabelIds.length > 0 ? selectedLabelIds : undefined,
      payeeIds: payeeIds.length > 0 ? payeeIds : undefined,
      status: status,
      itemName: itemName.trim() || undefined,
      warrantyDate: warrantyDate || undefined,
      recurrence,
      endDate: recurrence !== 'none' && endDate ? endDate : undefined,
      enableNotifications,
      notifyDaysBefore: notifyDaysArray,
      notifyOnDay: enableNotifications ? notifyOnDay : undefined,
      autoCreate,
      nextOccurrenceDate: recurrence !== 'none' ? nextOccurrenceDate : scheduledDate,
      createdAt: editingPlannedTransaction?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      if (editingPlannedTransaction) {
        await updatePlannedTransaction(plannedTransactionData);
      } else {
        await addPlannedTransaction(plannedTransactionData);
      }
      router.back();
    } catch (error: any) {
      Alert.alert(
        'Error',
        error?.message || 'Failed to save planned transaction. Please try again.',
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
            {editingPlannedTransaction ? 'Edit Planned Transaction' : 'Add Planned Transaction'}
          </ThemedText>
        </View>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: getScrollViewBottomPadding(insets.bottom) }]}>
        {/* Transaction Type */}
        <Card style={styles.card}>
          <ThemedText type="defaultSemiBold" style={styles.label}>Type</ThemedText>
          <View style={styles.typeButtons}>
            {(['expense', 'income', 'transfer'] as TransactionType[]).map((transactionType) => {
              const isActive = type === transactionType;
              const getActiveColor = () => {
                if (transactionType === 'income') return colors.income;
                if (transactionType === 'expense') return colors.expense;
                return colors.transfer;
              };
              return (
                <TouchableOpacity
                  key={transactionType}
                  style={[
                    styles.typeButton,
                    { borderColor: colors.border },
                    isActive && {
                      backgroundColor: getActiveColor(),
                      borderColor: getActiveColor(),
                    },
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setType(transactionType);
                    setCategoryId('');
                    if (transactionType !== 'transfer') {
                      setToAccountId('');
                    }
                  }}
                  activeOpacity={0.7}>
                  <ThemedText
                    style={[
                      styles.typeButtonText,
                      { color: colors.text },
                      isActive && styles.typeButtonTextActive,
                    ]}>
                    {transactionType.charAt(0).toUpperCase() + transactionType.slice(1)}
                  </ThemedText>
                </TouchableOpacity>
              );
            })}
          </View>
        </Card>

        {/* Account Selection */}
        <AccountPicker
          accounts={accounts}
          selectedAccountId={accountId}
          onAccountSelect={setAccountId}
          label="From Account"
          error={errors.accountId}
        />

        {/* To Account (for transfers) */}
        {type === 'transfer' && (
          <AccountPicker
            accounts={accounts}
            selectedAccountId={toAccountId}
            onAccountSelect={setToAccountId}
            label="To Account"
            excludeAccountId={accountId}
            error={errors.toAccountId}
          />
        )}

        {/* Category Selection (not for transfers) */}
        {type !== 'transfer' && (
          <CategoryPicker
            categories={categories}
            selectedCategoryId={categoryId}
            onCategorySelect={setCategoryId}
            label="Category"
            filterType={type}
            error={errors.categoryId}
          />
        )}

        {/* Amount */}
        <Input
          label="Amount"
          value={amount}
          onChangeText={setAmount}
          placeholder="0.00"
          keyboardType="decimal-pad"
          error={errors.amount}
        />

        {/* Description */}
        <Input
          label="Description"
          value={description}
          onChangeText={setDescription}
          placeholder="Enter description"
          error={errors.description}
        />

        {/* Scheduled Date */}
        <DatePicker
          label="Scheduled Date"
          value={scheduledDate}
          onChange={(selectedDate) => setScheduledDate(selectedDate)}
          placeholder="Select scheduled date"
          minimumDate={new Date()}
          error={errors.scheduledDate}
        />

        {/* Time */}
        <TimePicker
          label="Time (Optional)"
          value={time}
          onChange={setTime}
          placeholder="Select time"
        />

        {/* Recurrence */}
        <Select
          label="Recurrence"
          value={recurrence}
          options={[
            { label: 'One-time', value: 'none' },
            { label: 'Daily', value: 'daily' },
            { label: 'Weekly', value: 'weekly' },
            { label: 'Monthly', value: 'monthly' },
            { label: 'Yearly', value: 'yearly' },
          ]}
          onValueChange={(value) => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setRecurrence(value as RecurrenceType);
          }}
          placeholder="Select recurrence"
        />

        {/* End Date (for recurring) */}
        {recurrence !== 'none' && (
          <DatePicker
            label="End Date (Optional)"
            value={endDate}
            onChange={(selectedDate) => setEndDate(selectedDate)}
            placeholder="Select end date (leave empty for no end)"
            minimumDate={scheduledDate ? new Date(scheduledDate) : new Date()}
            error={errors.endDate}
            helperText="When recurrence should stop"
          />
        )}

        {/* Next Occurrence Display (for recurring) */}
        {recurrence !== 'none' && (
          <View style={styles.section}>
            <ThemedText type="defaultSemiBold" style={[styles.sectionLabel, { color: colors.text }]}>
              Next Occurrence
            </ThemedText>
            <View style={[styles.readOnlyField, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
              <ThemedText style={[styles.readOnlyText, { color: colors.textSecondary }]}>
                {nextOccurrenceDate}
              </ThemedText>
            </View>
          </View>
        )}

        {/* Item Name */}
        <Input
          label="Item Name (Optional)"
          value={itemName}
          onChangeText={setItemName}
          placeholder="Enter item name"
        />

        {/* Labels */}
        <LabelsPicker
          labels={labels}
          selectedLabelIds={selectedLabelIds}
          onLabelsChange={setSelectedLabelIds}
          label="Labels (Optional)"
          placeholder="Select labels"
        />

        {/* Payees */}
        <PayeePicker
          contacts={contacts}
          selectedPayeeIds={payeeIds}
          onPayeeIdsChange={setPayeeIds}
          label="Payees (Optional)"
          placeholder="Select payees"
        />

        {/* Status */}
        <StatusPicker
          selectedStatus={status}
          onStatusSelect={setStatus}
          label="Status"
        />

        {/* Warranty Date */}
        <DatePicker
          label="Warranty Date (Optional)"
          value={warrantyDate}
          onChange={(selectedDate) => setWarrantyDate(selectedDate)}
          placeholder="Select warranty expiration date"
          minimumDate={new Date()}
        />

        {/* Notification Settings */}
        <Card style={styles.card}>
          <View style={styles.switchRow}>
            <View style={styles.switchLabel}>
              <ThemedText type="defaultSemiBold" style={[styles.sectionLabel, { color: colors.text }]}>
                Enable Notifications
              </ThemedText>
              <ThemedText style={[styles.helperText, { color: colors.textSecondary }]}>
                Get reminders before scheduled date
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
              <Input
                label="Notify Days Before (comma-separated)"
                value={notifyDaysBefore}
                onChangeText={setNotifyDaysBefore}
                placeholder="e.g., 7, 1"
                keyboardType="default"
                helperText="Days before scheduled date to send notifications (e.g., 7, 1 means 7 days before and 1 day before)"
              />
              <View style={styles.switchRow}>
                <View style={styles.switchLabel}>
                  <ThemedText type="defaultSemiBold" style={[styles.sectionLabel, { color: colors.text }]}>
                    Notify on Scheduled Date
                  </ThemedText>
                  <ThemedText style={[styles.helperText, { color: colors.textSecondary }]}>
                    Send notification on the scheduled date
                  </ThemedText>
                </View>
                <Switch
                  value={notifyOnDay}
                  onValueChange={(value) => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setNotifyOnDay(value);
                  }}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor={colors.cardBackground}
                />
              </View>
            </>
          )}
        </Card>

        {/* Auto-create Settings */}
        <Card style={styles.card}>
          <View style={styles.switchRow}>
            <View style={styles.switchLabel}>
              <ThemedText type="defaultSemiBold" style={[styles.sectionLabel, { color: colors.text }]}>
                Auto-create Transaction
              </ThemedText>
              <ThemedText style={[styles.helperText, { color: colors.textSecondary }]}>
                Automatically create transaction when scheduled date arrives
              </ThemedText>
            </View>
            <Switch
              value={autoCreate}
              onValueChange={(value) => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setAutoCreate(value);
              }}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.cardBackground}
            />
          </View>
        </Card>

        <Button
          title={editingPlannedTransaction ? 'Update Planned Transaction' : 'Create Planned Transaction'}
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
  card: {
    marginBottom: Spacing.lg,
    padding: Spacing.md,
  },
  label: {
    marginBottom: Spacing.md,
    fontSize: 14,
    fontWeight: '600',
  },
  typeButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  typeButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
    minHeight: 44,
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  typeButtonTextActive: {
    color: '#FFFFFF',
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
  helperText: {
    fontSize: 12,
    marginTop: 4,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  switchLabel: {
    flex: 1,
    marginRight: Spacing.md,
  },
  submitButton: {
    marginTop: Spacing.md,
  },
});
