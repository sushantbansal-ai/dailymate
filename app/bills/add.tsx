/**
 * Add/Edit Bill Screen
 */

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AccountPicker } from '@/components/ui/account-picker';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CategoryPicker } from '@/components/ui/category-picker';
import { ColorPicker } from '@/components/ui/color-picker';
import { DatePicker } from '@/components/ui/date-picker';
import { Input } from '@/components/ui/input';
import { PayeePicker } from '@/components/ui/payee-picker';
import { Select } from '@/components/ui/select';
import { BorderRadius, Colors, Spacing, Typography } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Bill, BillStatus, RecurrenceType } from '@/types';
import { getScrollViewBottomPadding } from '@/utils/constants';
import * as NotificationService from '@/services/notifications';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function AddBillScreen() {
  const { bills, accounts, categories, contacts, addBill, updateBill } = useApp();
  const router = useRouter();
  const params = useLocalSearchParams();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();

  const editingBill = params.id ? bills.find((b) => b.id === params.id) : null;

  const [name, setName] = useState<string>(editingBill?.name || '');
  const [description, setDescription] = useState<string>(editingBill?.description || '');
  const [amount, setAmount] = useState<string>(editingBill?.amount.toString() || '');
  const [categoryId, setCategoryId] = useState<string>(editingBill?.categoryId || '');
  const [accountId, setAccountId] = useState<string>(editingBill?.accountId || '');
  const [payeeId, setPayeeId] = useState<string>(editingBill?.payeeId || '');
  const [dueDateType, setDueDateType] = useState<'fixed' | 'recurring'>(editingBill?.dueDateType || 'recurring');
  const [dueDate, setDueDate] = useState<string>(editingBill?.dueDate || '');
  const [dueDay, setDueDay] = useState<string>(editingBill?.dueDay?.toString() || '15');
  const [recurrence, setRecurrence] = useState<RecurrenceType>(editingBill?.recurrence || 'monthly');
  const [startDate, setStartDate] = useState<string>(editingBill?.startDate || new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState<string>(editingBill?.endDate || '');
  const [status, setStatus] = useState<BillStatus>(editingBill?.status || 'pending');
  const [enableNotifications, setEnableNotifications] = useState<boolean>(editingBill?.enableNotifications !== false);
  const [notifyDaysBefore, setNotifyDaysBefore] = useState<string>(
    editingBill?.notifyDaysBefore?.join(', ') || '7, 3, 1, 0'
  );
  const [notifyOnDueDate, setNotifyOnDueDate] = useState<boolean>(editingBill?.notifyOnDueDate !== false);
  const [autoPay, setAutoPay] = useState<boolean>(editingBill?.autoPay || false);
  const [color, setColor] = useState<string>(editingBill?.color || '#95E1D3');
  const [icon, setIcon] = useState<string>(editingBill?.icon || '💡');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const filteredCategories = categories.filter((c) => c.type === 'expense');

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = 'Please enter bill name';
    if (!amount || parseFloat(amount) <= 0) newErrors.amount = 'Please enter a valid amount';
    if (!categoryId) newErrors.categoryId = 'Please select a category';
    if (!accountId) newErrors.accountId = 'Please select an account';
    if (!startDate) newErrors.startDate = 'Please select start date';
    
    if (dueDateType === 'fixed' && !dueDate) {
      newErrors.dueDate = 'Please select due date';
    } else if (dueDateType === 'recurring') {
      const day = parseInt(dueDay);
      if (isNaN(day) || day < 1 || day > 31) {
        newErrors.dueDay = 'Please enter a valid day (1-31)';
      }
    }

    if (recurrence === 'none' && dueDateType === 'recurring') {
      newErrors.recurrence = 'Recurring bills must have a recurrence type';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    // Calculate next due date
    const billData: Bill = {
      id: editingBill?.id || Date.now().toString(),
      name: name.trim(),
      description: description.trim() || undefined,
      amount: parseFloat(amount),
      categoryId,
      accountId,
      payeeId: payeeId || undefined,
      dueDateType,
      dueDate: dueDateType === 'fixed' ? dueDate : undefined,
      dueDay: dueDateType === 'recurring' ? parseInt(dueDay) : undefined,
      recurrence: recurrence === 'none' ? 'monthly' : recurrence,
      startDate,
      endDate: endDate || undefined,
      status,
      enableNotifications,
      notifyDaysBefore: notifyDaysBefore
        .split(',')
        .map((d) => parseInt(d.trim()))
        .filter((d) => !isNaN(d)),
      notifyOnDueDate,
      autoPay,
      color,
      icon,
      createdAt: editingBill?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const nextDueDate = NotificationService.calculateNextDueDate(billData);
    const updatedBill = NotificationService.updateBillStatus({ ...billData, nextDueDate: nextDueDate || undefined });

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      if (editingBill) {
        await updateBill(updatedBill);
      } else {
        await addBill(updatedBill);
      }
      router.back();
    } catch (error: any) {
      Alert.alert(
        'Error',
        error?.message || 'Failed to save bill. Please try again.',
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
            {editingBill ? 'Edit Bill' : 'Add Bill'}
          </ThemedText>
        </View>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: getScrollViewBottomPadding(insets.bottom) }]}>
        {/* Bill Name */}
        <Input
          label="Bill Name"
          value={name}
          onChangeText={setName}
          placeholder="e.g., Electricity Bill, Rent"
          error={errors.name}
        />

        {/* Description */}
        <Input
          label="Description (Optional)"
          value={description}
          onChangeText={setDescription}
          placeholder="Additional notes about this bill"
        />

        {/* Amount */}
        <Input
          label="Amount"
          value={amount}
          onChangeText={setAmount}
          placeholder="0.00"
          keyboardType="decimal-pad"
          error={errors.amount}
        />

        {/* Category */}
        <CategoryPicker
          categories={filteredCategories}
          selectedCategoryId={categoryId}
          onCategorySelect={setCategoryId}
          label="Category"
          filterType="expense"
          error={errors.categoryId}
        />

        {/* Account */}
        <AccountPicker
          accounts={accounts}
          selectedAccountId={accountId}
          onAccountSelect={setAccountId}
          label="Pay From Account"
          error={errors.accountId}
        />

        {/* Payee */}
        <PayeePicker
          contacts={contacts}
          selectedPayeeIds={payeeId ? [payeeId] : []}
          onPayeeIdsChange={(ids) => setPayeeId(ids[0] || '')}
          label="Payee (Optional)"
          placeholder="Select biller"
        />

        {/* Due Date Type */}
        <Card style={styles.card}>
          <ThemedText style={styles.label}>Due Date Type</ThemedText>
          <View style={styles.typeButtons}>
            {(['fixed', 'recurring'] as const).map((type) => {
              const isActive = dueDateType === type;
              return (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.typeButton,
                    { borderColor: colors.border },
                    isActive && {
                      backgroundColor: colors.primary,
                      borderColor: colors.primary,
                    },
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setDueDateType(type);
                  }}
                  activeOpacity={0.7}>
                  <ThemedText
                    style={[
                      styles.typeButtonText,
                      { color: colors.text },
                      isActive && styles.typeButtonTextActive,
                    ]}>
                    {type === 'fixed' ? 'Fixed Date' : 'Recurring'}
                  </ThemedText>
                </TouchableOpacity>
              );
            })}
          </View>
        </Card>

        {/* Due Date (Fixed) */}
        {dueDateType === 'fixed' && (
          <DatePicker
            label="Due Date"
            value={dueDate}
            onChange={setDueDate}
            placeholder="Select due date"
            error={errors.dueDate}
          />
        )}

        {/* Due Day (Recurring) */}
        {dueDateType === 'recurring' && (
          <Input
            label="Due Day of Month (1-31)"
            value={dueDay}
            onChangeText={setDueDay}
            placeholder="15"
            keyboardType="number-pad"
            error={errors.dueDay}
          />
        )}

        {/* Recurrence */}
        <Select
          label="Recurrence"
          value={recurrence}
          onValueChange={(value) => setRecurrence(value as RecurrenceType)}
          options={[
            { label: 'Monthly', value: 'monthly' },
            { label: 'Yearly', value: 'yearly' },
            { label: 'Weekly', value: 'weekly' },
          ]}
          error={errors.recurrence}
        />

        {/* Start Date */}
        <DatePicker
          label="Start Date"
          value={startDate}
          onChange={setStartDate}
          placeholder="Select start date"
          error={errors.startDate}
        />

        {/* End Date (Optional) */}
        <DatePicker
          label="End Date (Optional)"
          value={endDate}
          onChange={setEndDate}
          placeholder="Select end date"
          minimumDate={startDate ? new Date(startDate) : undefined}
        />

        {/* Status */}
        <Select
          label="Status"
          value={status}
          onValueChange={(value) => setStatus(value as BillStatus)}
          options={[
            { label: 'Pending', value: 'pending' },
            { label: 'Paid', value: 'paid' },
            { label: 'Overdue', value: 'overdue' },
            { label: 'Cancelled', value: 'cancelled' },
          ]}
        />

        {/* Notification Settings */}
        <Card style={styles.card}>
          <View style={styles.switchRow}>
            <View style={styles.switchLeft}>
              <ThemedText style={styles.label}>Enable Notifications</ThemedText>
              <ThemedText style={[styles.helperText, { color: colors.textSecondary }]}>Get reminders before bill is due</ThemedText>
            </View>
            <Switch
              value={enableNotifications}
              onValueChange={setEnableNotifications}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>

          {enableNotifications && (
            <>
              <Input
                label="Notify Days Before (comma-separated)"
                value={notifyDaysBefore}
                onChangeText={setNotifyDaysBefore}
                placeholder="e.g., 7, 3, 1, 0"
                helperText="Days before due date to receive notifications"
              />

              <View style={styles.switchRow}>
                <View style={styles.switchLeft}>
                  <ThemedText style={styles.label}>Notify on Due Date</ThemedText>
                  <ThemedText style={[styles.helperText, { color: colors.textSecondary }]}>Get notification on the due date</ThemedText>
                </View>
                <Switch
                  value={notifyOnDueDate}
                  onValueChange={setNotifyOnDueDate}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor="#FFFFFF"
                />
              </View>
            </>
          )}
        </Card>

        {/* Auto-Pay */}
        <Card style={styles.card}>
          <View style={styles.switchRow}>
            <View style={styles.switchLeft}>
              <ThemedText style={styles.label}>Auto-Pay</ThemedText>
              <ThemedText style={[styles.helperText, { color: colors.textSecondary }]}>Automatically create transaction when bill is due</ThemedText>
            </View>
            <Switch
              value={autoPay}
              onValueChange={setAutoPay}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>
        </Card>

        {/* Color & Icon */}
        <ColorPicker
          colors={[
            '#95E1D3', '#FF6B6B', '#4ECDC4', '#FFE66D', '#F38181',
            '#AA96DA', '#FCBAD3', '#A8E6CF', '#FFD3A5', '#C7CEEA',
          ]}
          selectedColor={color}
          onColorSelect={setColor}
          label="Color"
        />

        <Input
          label="Icon (Emoji)"
          value={icon}
          onChangeText={setIcon}
          placeholder="💡"
          maxLength={2}
        />

        <Button
          title={editingBill ? 'Update Bill' : 'Add Bill'}
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
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  switchLeft: {
    flex: 1,
    marginRight: Spacing.md,
  },
  helperText: {
    ...Typography.bodySmall,
    marginTop: Spacing.xs,
    opacity: 0.7,
  },
  submitButton: {
    marginTop: Spacing.md,
  },
});

