/**
 * Split Transaction Form Component
 * Allows users to split a transaction across multiple categories
 */

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CategoryPicker } from '@/components/ui/category-picker';
import { Input } from '@/components/ui/input';
import { BorderRadius, Colors, ComponentSizes, Spacing, Typography } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Category, TransactionSplit, TransactionType } from '@/types';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useCallback, useMemo } from 'react';
import { Alert, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

interface SplitTransactionFormProps {
  totalAmount: number;
  splits: TransactionSplit[];
  categories: Category[];
  type: TransactionType;
  onSplitsChange: (splits: TransactionSplit[]) => void;
  currencySymbol?: string;
}

export function SplitTransactionForm({
  totalAmount,
  splits,
  categories,
  type,
  onSplitsChange,
  currencySymbol = '₹',
}: SplitTransactionFormProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const filteredCategories = useMemo(() => {
    return categories.filter((c) => {
      if (type === 'income') return c.type === 'income';
      if (type === 'expense') return c.type === 'expense';
      return true;
    });
  }, [categories, type]);

  const totalSplitAmount = useMemo(() => {
    return splits.reduce((sum, split) => sum + split.amount, 0);
  }, [splits]);

  const remainingAmount = totalAmount - totalSplitAmount;
  const isValid = Math.abs(remainingAmount) < 0.01; // Allow small floating point differences

  const addSplit = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newSplit: TransactionSplit = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      categoryId: filteredCategories[0]?.id || '',
      amount: 0,
      description: '',
    };
    onSplitsChange([...splits, newSplit]);
  }, [splits, filteredCategories, onSplitsChange]);

  const removeSplit = useCallback(
    (splitId: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onSplitsChange(splits.filter((s) => s.id !== splitId));
    },
    [splits, onSplitsChange]
  );

  const updateSplit = useCallback(
    (splitId: string, updates: Partial<TransactionSplit>) => {
      onSplitsChange(
        splits.map((split) => (split.id === splitId ? { ...split, ...updates } : split))
      );
    },
    [splits, onSplitsChange]
  );

  const distributeEvenly = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (splits.length === 0) {
      Alert.alert('No Splits', 'Please add at least one split first.');
      return;
    }
    const amountPerSplit = totalAmount / splits.length;
    onSplitsChange(
      splits.map((split) => ({
        ...split,
        amount: Math.round(amountPerSplit * 100) / 100, // Round to 2 decimal places
      }))
    );
  }, [splits, totalAmount, onSplitsChange]);

  const distributeRemaining = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (splits.length === 0) {
      Alert.alert('No Splits', 'Please add at least one split first.');
      return;
    }
    const remaining = totalAmount - totalSplitAmount;
    if (Math.abs(remaining) < 0.01) {
      Alert.alert('Already Balanced', 'All amount has been distributed.');
      return;
    }
    // Add remaining to first split
    const updatedSplits = [...splits];
    updatedSplits[0] = {
      ...updatedSplits[0],
      amount: Math.round((updatedSplits[0].amount + remaining) * 100) / 100,
    };
    onSplitsChange(updatedSplits);
  }, [splits, totalAmount, totalSplitAmount, onSplitsChange]);

  return (
    <Card style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <MaterialIcons name="call-split" size={ComponentSizes.iconMedium} color={colors.primary} />
          <ThemedText style={[Typography.h4, { color: colors.text, marginLeft: Spacing.sm }]}>
            Split Transaction
          </ThemedText>
        </View>
        <TouchableOpacity
          onPress={addSplit}
          style={[styles.addButton, { backgroundColor: colors.primary }]}
          activeOpacity={0.7}>
          <MaterialIcons name="add" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ThemedText style={[Typography.bodySmall, styles.helperText, { color: colors.textSecondary }]}>
        Split this transaction across multiple categories
      </ThemedText>

      {/* Total Amount Display */}
      <View style={[styles.totalContainer, { backgroundColor: colors.backgroundSecondary }]}>
        <ThemedText style={[Typography.bodyMedium, { color: colors.textSecondary }]}>
          Total Amount:
        </ThemedText>
        <ThemedText style={[Typography.h3, { color: colors.text }]}>
          {currencySymbol}
          {totalAmount.toFixed(2)}
        </ThemedText>
      </View>

      {/* Splits List */}
      <ScrollView style={styles.splitsList} nestedScrollEnabled={true}>
        {splits.map((split, index) => {
          const category = filteredCategories.find((c) => c.id === split.categoryId);
          return (
            <Card key={split.id} style={styles.splitCard} variant="outlined">
              <View style={styles.splitHeader}>
                <ThemedText style={[Typography.labelMedium, { color: colors.text }]}>
                  Split {index + 1}
                </ThemedText>
                {splits.length > 1 && (
                  <TouchableOpacity
                    onPress={() => removeSplit(split.id)}
                    style={styles.removeButton}
                    activeOpacity={0.7}>
                    <MaterialIcons name="close" size={20} color={colors.error} />
                  </TouchableOpacity>
                )}
              </View>

              <CategoryPicker
                categories={filteredCategories}
                selectedCategoryId={split.categoryId}
                onCategorySelect={(categoryId) => updateSplit(split.id, { categoryId })}
                label="Category"
                filterType={type}
              />

              <Input
                label="Amount"
                value={split.amount > 0 ? split.amount.toString() : ''}
                onChangeText={(text) => {
                  const numValue = parseFloat(text) || 0;
                  updateSplit(split.id, { amount: numValue });
                }}
                placeholder="0.00"
                keyboardType="decimal-pad"
                error={
                  split.amount <= 0 ? 'Amount must be greater than 0' : undefined
                }
              />

              <Input
                label="Description (Optional)"
                value={split.description || ''}
                onChangeText={(text) => updateSplit(split.id, { description: text })}
                placeholder="e.g., Groceries, Household items"
              />
            </Card>
          );
        })}

        {splits.length === 0 && (
          <View style={styles.emptyState}>
            <MaterialIcons name="call-split" size={48} color={colors.textTertiary} />
            <ThemedText style={[Typography.bodyMedium, { color: colors.textSecondary, marginTop: Spacing.md }]}>
              No splits added yet
            </ThemedText>
            <ThemedText style={[Typography.bodySmall, { color: colors.textTertiary, marginTop: Spacing.xs }]}>
              Tap the + button to add a split
            </ThemedText>
          </View>
        )}
      </ScrollView>

      {/* Summary and Actions */}
      {splits.length > 0 && (
        <View style={[styles.summary, { borderTopColor: colors.border }]}>
          <View style={styles.summaryRow}>
            <ThemedText style={[Typography.bodyMedium, { color: colors.textSecondary }]}>
              Split Total:
            </ThemedText>
            <ThemedText
              style={[
                Typography.bodyLarge,
                {
                  color: isValid ? colors.success : colors.error,
                  fontWeight: '600',
                },
              ]}>
              {currencySymbol}
              {totalSplitAmount.toFixed(2)}
            </ThemedText>
          </View>
          <View style={styles.summaryRow}>
            <ThemedText style={[Typography.bodyMedium, { color: colors.textSecondary }]}>
              Remaining:
            </ThemedText>
            <ThemedText
              style={[
                Typography.bodyLarge,
                {
                  color: isValid ? colors.success : colors.error,
                  fontWeight: '600',
                },
              ]}>
              {remainingAmount >= 0 ? '+' : ''}
              {currencySymbol}
              {Math.abs(remainingAmount).toFixed(2)}
            </ThemedText>
          </View>

          {!isValid && (
            <View style={styles.actions}>
              <Button
                title="Distribute Evenly"
                onPress={distributeEvenly}
                variant="secondary"
                size="small"
                style={styles.actionButton}
              />
              {remainingAmount > 0 && (
                <Button
                  title="Add Remaining"
                  onPress={distributeRemaining}
                  variant="secondary"
                  size="small"
                  style={styles.actionButton}
                />
              )}
            </View>
          )}

          {isValid && (
            <View style={[styles.successMessage, { backgroundColor: colors.success + '20' }]}>
              <MaterialIcons name="check-circle" size={20} color={colors.success} />
              <ThemedText style={[Typography.bodySmall, { color: colors.success, marginLeft: Spacing.xs }]}>
                All amount distributed correctly
              </ThemedText>
            </View>
          )}
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  helperText: {
    marginBottom: Spacing.md,
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  splitsList: {
    maxHeight: 400,
    marginBottom: Spacing.md,
  },
  splitCard: {
    marginBottom: Spacing.md,
  },
  splitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  removeButton: {
    padding: Spacing.xs,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  summary: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  actionButton: {
    flex: 1,
  },
  successMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.md,
  },
});

