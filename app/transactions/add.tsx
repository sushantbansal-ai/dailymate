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
import { SplitTransactionForm } from '@/components/ui/split-transaction-form';
import { StatusPicker } from '@/components/ui/status-picker';
import { TimePicker } from '@/components/ui/time-picker';
import { BorderRadius, Colors, ComponentSizes, Spacing } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Label, Transaction, TransactionSplit, TransactionStatus, TransactionType } from '@/types';
import { getScrollViewBottomPadding } from '@/utils/constants';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function AddTransactionScreen() {
  const { accounts, categories, labels, contacts, transactions, addTransaction, updateTransaction } = useApp();
  const router = useRouter();
  const params = useLocalSearchParams();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'] || Colors.light;
  const insets = useSafeAreaInsets();

  const editingTransaction = params.id ? transactions.find((t) => t.id === params.id) : null;

  const [type, setType] = useState<TransactionType>(editingTransaction?.type || 'expense');
  const [accountId, setAccountId] = useState<string>(editingTransaction?.accountId || '');
  const [toAccountId, setToAccountId] = useState<string>(editingTransaction?.toAccountId || '');
  const [categoryId, setCategoryId] = useState<string>(editingTransaction?.categoryId || '');
  const [amount, setAmount] = useState<string>(editingTransaction?.amount.toString() || '');
  const [description, setDescription] = useState<string>(editingTransaction?.description || '');
  const [date, setDate] = useState<string>(editingTransaction?.date || new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState<string>(editingTransaction?.time || '');
  const [selectedLabelIds, setSelectedLabelIds] = useState<string[]>(editingTransaction?.labels || []);
  const [payeeIds, setPayeeIds] = useState<string[]>(editingTransaction?.payeeIds || []);
  const [status, setStatus] = useState<TransactionStatus>(editingTransaction?.status || 'completed');
  const [itemName, setItemName] = useState<string>(editingTransaction?.itemName || '');
  const [warrantyDate, setWarrantyDate] = useState<string>(editingTransaction?.warrantyDate || '');
  const [isSplitEnabled, setIsSplitEnabled] = useState<boolean>(
    editingTransaction?.splits && editingTransaction.splits.length > 0 ? true : false
  );
  const [splits, setSplits] = useState<TransactionSplit[]>(
    editingTransaction?.splits || []
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const filteredCategories = categories.filter((c) => {
    if (type === 'income') return c.type === 'income';
    if (type === 'expense') return c.type === 'expense';
    return true; // For transfers, show all or none
  });

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!accountId) newErrors.accountId = 'Please select an account';
    if (type === 'transfer' && !toAccountId) newErrors.toAccountId = 'Please select destination account';
    
    // Validation for split transactions
    if (isSplitEnabled && splits.length > 0) {
      const totalSplitAmount = splits.reduce((sum, split) => sum + split.amount, 0);
      const transactionAmount = parseFloat(amount) || 0;
      const difference = Math.abs(transactionAmount - totalSplitAmount);
      
      if (splits.length === 0) {
        newErrors.splits = 'Please add at least one split';
      } else if (difference > 0.01) {
        newErrors.splits = `Split amounts (${totalSplitAmount.toFixed(2)}) must equal transaction amount (${transactionAmount.toFixed(2)})`;
      }
      
      // Validate each split
      splits.forEach((split, index) => {
        if (!split.categoryId) {
          newErrors[`split-${index}-category`] = 'Please select a category for each split';
        }
        if (split.amount <= 0) {
          newErrors[`split-${index}-amount`] = 'Split amount must be greater than 0';
        }
      });
    } else {
      // Regular transaction validation
      if (!categoryId && type !== 'transfer') newErrors.categoryId = 'Please select a category';
    }
    
    if (!amount || parseFloat(amount) <= 0) newErrors.amount = 'Please enter a valid amount';
    if (!description.trim()) newErrors.description = 'Please enter a description';
    if (!date) newErrors.date = 'Please select a date';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    const transaction: Transaction = {
      id: editingTransaction?.id || Date.now().toString(),
      accountId,
      categoryId: isSplitEnabled && splits.length > 0 ? splits[0].categoryId : (categoryId || 'other-expense'),
      type,
      amount: parseFloat(amount),
      description: description.trim(),
      date,
      time: time || undefined,
      toAccountId: type === 'transfer' ? toAccountId : undefined,
      labels: selectedLabelIds.length > 0 ? selectedLabelIds : undefined,
      payeeIds: payeeIds.length > 0 ? payeeIds : undefined,
      status: status,
      itemName: itemName.trim() || undefined,
      warrantyDate: warrantyDate || undefined,
      splits: isSplitEnabled && splits.length > 0 ? splits : undefined,
      createdAt: editingTransaction?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      if (editingTransaction) {
        await updateTransaction(transaction);
      } else {
        await addTransaction(transaction);
      }
      router.back();
    } catch (error: any) {
      Alert.alert(
        'Error',
        error?.message || 'Failed to save transaction. Please try again.',
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
            {editingTransaction ? 'Edit Transaction' : 'Add Transaction'}
          </ThemedText>
        </View>
        <View style={styles.placeholder} />
      </View>

      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={[styles.content, { paddingBottom: getScrollViewBottomPadding(insets.bottom) }]}>
        {/* Transaction Type */}
        <Card style={styles.card}>
          <ThemedText type="defaultSemiBold" style={styles.label}>
            Type
          </ThemedText>
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
                    setCategoryId(''); // Reset category when type changes
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

        {/* Category Selection (not for transfers, and not when split is enabled) */}
        {type !== 'transfer' && !isSplitEnabled && (
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
          editable={!isSplitEnabled || splits.length === 0}
        />

        {/* Split Transaction Toggle */}
        {type !== 'transfer' && (
          <Card style={styles.card}>
            <TouchableOpacity
              style={styles.splitToggle}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setIsSplitEnabled(!isSplitEnabled);
                if (!isSplitEnabled && splits.length === 0) {
                  // Initialize with one split when enabling
                  setSplits([
                    {
                      id: Date.now().toString(),
                      categoryId: categoryId || filteredCategories[0]?.id || '',
                      amount: parseFloat(amount) || 0,
                      description: '',
                    },
                  ]);
                } else if (isSplitEnabled) {
                  // Clear splits when disabling
                  setSplits([]);
                }
              }}
              activeOpacity={0.7}>
              <View style={styles.splitToggleLeft}>
                <MaterialIcons
                  name="call-split"
                  size={ComponentSizes.iconMedium}
                  color={isSplitEnabled ? colors.primary : colors.textSecondary}
                />
                <ThemedText
                  style={[
                    styles.splitToggleText,
                    { color: isSplitEnabled ? colors.primary : colors.text },
                  ]}>
                  Split Transaction
                </ThemedText>
              </View>
              <View
                style={[
                  styles.toggleSwitch,
                  {
                    backgroundColor: isSplitEnabled ? colors.primary : colors.border,
                  },
                ]}>
                <View
                  style={[
                    styles.toggleThumb,
                    {
                      transform: [{ translateX: isSplitEnabled ? 20 : 0 }],
                      backgroundColor: '#FFFFFF',
                    },
                  ]}
                />
              </View>
            </TouchableOpacity>
            {errors.splits && (
              <ThemedText style={[styles.errorText, { color: colors.error }]}>
                {errors.splits}
              </ThemedText>
            )}
          </Card>
        )}

        {/* Split Transaction Form */}
        {isSplitEnabled && type !== 'transfer' && (
          <SplitTransactionForm
            totalAmount={parseFloat(amount) || 0}
            splits={splits}
            categories={filteredCategories}
            type={type}
            onSplitsChange={setSplits}
          />
        )}

        {/* Description */}
        <Input
          label="Description"
          value={description}
          onChangeText={setDescription}
          placeholder="Enter description"
          error={errors.description}
        />

        {/* Date */}
        <DatePicker
          label="Date"
          value={date}
          onChange={(selectedDate) => setDate(selectedDate)}
          placeholder="Select date"
          error={errors.date}
        />

        {/* Time */}
        <TimePicker
          label="Time (Optional)"
          value={time}
          onChange={setTime}
          placeholder="Select time"
        />

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
          onAddLabel={async (labelName: string, color: string) => {
            const newLabel: Label = {
              id: Date.now().toString(),
              name: labelName,
              color,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            await addLabel(newLabel);
            return newLabel;
          }}
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

        <Button
          title={editingTransaction ? 'Update Transaction' : 'Add Transaction'}
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
  section: {
    marginBottom: Spacing.lg,
  },
  errorText: {
    fontSize: 12,
    marginTop: Spacing.xs,
  },
  submitButton: {
    marginTop: Spacing.md,
  },
  splitToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  splitToggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  splitToggleText: {
    fontSize: 16,
    fontWeight: '600',
  },
  toggleSwitch: {
    width: 44,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
});
