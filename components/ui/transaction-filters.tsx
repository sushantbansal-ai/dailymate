/**
 * Transaction Filters Component - Advanced filtering modal
 */

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { Input } from '@/components/ui/input';
import { BorderRadius, Colors, ComponentSizes, Spacing, Typography } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Account, Category, TransactionType } from '@/types';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Modal, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export interface TransactionFiltersType {
  type?: TransactionType | 'all';
  accountIds?: string[];
  categoryIds?: string[];
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
  searchQuery?: string;
}

interface TransactionFiltersProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: TransactionFiltersType) => void;
  onReset: () => void;
  accounts: Account[];
  categories: Category[];
  currentFilters: TransactionFiltersType;
}

export function TransactionFilters({
  visible,
  onClose,
  onApply,
  onReset,
  accounts,
  categories,
  currentFilters,
}: TransactionFiltersProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'] || Colors.light;
  const insets = useSafeAreaInsets();

  const [type, setType] = useState<TransactionType | 'all'>(currentFilters.type || 'all');
  const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>(currentFilters.accountIds || []);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>(currentFilters.categoryIds || []);
  const [startDate, setStartDate] = useState<string>(currentFilters.startDate || '');
  const [endDate, setEndDate] = useState<string>(currentFilters.endDate || '');
  const [minAmount, setMinAmount] = useState<string>(currentFilters.minAmount?.toString() || '');
  const [maxAmount, setMaxAmount] = useState<string>(currentFilters.maxAmount?.toString() || '');
  const [searchQuery, setSearchQuery] = useState<string>(currentFilters.searchQuery || '');

  // Memoize selected IDs sets for O(1) lookup performance
  const selectedAccountIdsSet = useMemo(
    () => new Set(selectedAccountIds),
    [selectedAccountIds]
  );

  const selectedCategoryIdsSet = useMemo(
    () => new Set(selectedCategoryIds),
    [selectedCategoryIds]
  );

  // Sync state when currentFilters prop changes
  useEffect(() => {
    if (visible) {
      setType(currentFilters.type || 'all');
      setSelectedAccountIds(currentFilters.accountIds || []);
      setSelectedCategoryIds(currentFilters.categoryIds || []);
      setStartDate(currentFilters.startDate || '');
      setEndDate(currentFilters.endDate || '');
      setMinAmount(currentFilters.minAmount?.toString() || '');
      setMaxAmount(currentFilters.maxAmount?.toString() || '');
      setSearchQuery(currentFilters.searchQuery || '');
    }
  }, [visible, currentFilters]);

  const handleApply = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    // Validate and parse amount range
    const min = minAmount.trim() ? parseFloat(minAmount.trim()) : undefined;
    const max = maxAmount.trim() ? parseFloat(maxAmount.trim()) : undefined;
    
    // Ensure min <= max and handle NaN
    let finalMin = min;
    let finalMax = max;
    if (min !== undefined && !isNaN(min) && max !== undefined && !isNaN(max) && min > max) {
      // Swap if min > max
      finalMin = max;
      finalMax = min;
    }
    
    // Set to undefined if NaN
    if (finalMin !== undefined && isNaN(finalMin)) {
      finalMin = undefined;
    }
    if (finalMax !== undefined && isNaN(finalMax)) {
      finalMax = undefined;
    }
    
    const filters: TransactionFiltersType = {
      type: type === 'all' ? undefined : type,
      accountIds: selectedAccountIds.length > 0 ? selectedAccountIds : undefined,
      categoryIds: selectedCategoryIds.length > 0 ? selectedCategoryIds : undefined,
      startDate: startDate.trim() || undefined,
      endDate: endDate.trim() || undefined,
      minAmount: finalMin,
      maxAmount: finalMax,
      searchQuery: searchQuery.trim() || undefined,
    };
    onApply(filters);
    onClose();
  }, [minAmount, maxAmount, type, selectedAccountIds, selectedCategoryIds, startDate, endDate, searchQuery, onApply, onClose]);

  const handleReset = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setType('all');
    setSelectedAccountIds([]);
    setSelectedCategoryIds([]);
    setStartDate('');
    setEndDate('');
    setMinAmount('');
    setMaxAmount('');
    setSearchQuery('');
    onReset();
    onClose();
  }, [onReset, onClose]);

  const hasActiveFilters = useMemo(() => {
    return (
      type !== 'all' ||
      selectedAccountIds.length > 0 ||
      selectedCategoryIds.length > 0 ||
      startDate !== '' ||
      endDate !== '' ||
      minAmount !== '' ||
      maxAmount !== '' ||
      searchQuery.trim() !== ''
    );
  }, [type, selectedAccountIds.length, selectedCategoryIds.length, startDate, endDate, minAmount, maxAmount, searchQuery]);

  const toggleAccount = useCallback((accountId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (selectedAccountIdsSet.has(accountId)) {
      setSelectedAccountIds(selectedAccountIds.filter((id) => id !== accountId));
    } else {
      setSelectedAccountIds([...selectedAccountIds, accountId]);
    }
  }, [selectedAccountIds, selectedAccountIdsSet]);

  const toggleCategory = useCallback((categoryId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (selectedCategoryIdsSet.has(categoryId)) {
      setSelectedCategoryIds(selectedCategoryIds.filter((id) => id !== categoryId));
    } else {
      setSelectedCategoryIds([...selectedCategoryIds, categoryId]);
    }
  }, [selectedCategoryIds, selectedCategoryIdsSet]);

  // Memoize type button handlers
  const handleTypeChange = useCallback((filterType: 'all' | 'expense' | 'income' | 'transfer') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setType(filterType);
  }, []);

  // Memoize FlatList renderItem callbacks
  const renderAccountChip = useCallback(({ item: account }: { item: Account }) => {
    const isSelected = selectedAccountIdsSet.has(account.id);
    return (
      <AccountChip
        account={account}
        isSelected={isSelected}
        colors={colors}
        onPress={() => toggleAccount(account.id)}
      />
    );
  }, [selectedAccountIdsSet, colors, toggleAccount]);

  const renderCategoryChip = useCallback(({ item: category }: { item: Category }) => {
    const isSelected = selectedCategoryIdsSet.has(category.id);
    return (
      <CategoryChip
        category={category}
        isSelected={isSelected}
        colors={colors}
        onPress={() => toggleCategory(category.id)}
      />
    );
  }, [selectedCategoryIdsSet, colors, toggleCategory]);

  const accountKeyExtractor = useCallback((item: Account) => item.id, []);
  const categoryKeyExtractor = useCallback((item: Category) => item.id, []);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onClose}
        />
        <View
          style={[
            styles.modalContent,
            {
              backgroundColor: colors.background,
            },
          ]}
          onStartShouldSetResponder={() => true}
          onMoveShouldSetResponder={() => false}
          onResponderTerminationRequest={() => false}>
          {/* Header */}
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <ThemedText style={[Typography.h4, { color: colors.text }]}>Filter Transactions</ThemedText>
            <TouchableOpacity onPress={onClose}>
              <MaterialIcons name="close" size={ComponentSizes.iconMedium} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView 
            style={styles.scrollView} 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={true}
            nestedScrollEnabled={true}
            removeClippedSubviews={true}
            keyboardShouldPersistTaps="handled"
            bounces={true}>
            {/* Search */}
            <View style={styles.section}>
              <Input
                label="Search"
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search by description..."
                leftIcon={<MaterialIcons name="search" size={20} color={colors.textSecondary} />}
              />
            </View>

            {/* Transaction Type */}
            <View style={styles.section}>
              <ThemedText type="defaultSemiBold" style={[styles.sectionLabel, { color: colors.text }]}>
                Type
              </ThemedText>
              <View style={styles.typeButtons}>
                {(['all', 'expense', 'income', 'transfer'] as const).map((filterType) => {
                  const isActive = type === filterType;
                  return (
                    <TypeButton
                      key={filterType}
                      filterType={filterType}
                      isActive={isActive}
                      colors={colors}
                      onPress={() => handleTypeChange(filterType)}
                    />
                  );
                })}
              </View>
            </View>

            {/* Accounts */}
            {accounts.length > 0 && (
              <View style={styles.section}>
                <ThemedText type="defaultSemiBold" style={[styles.sectionLabel, { color: colors.text }]}>
                  Accounts
                </ThemedText>
                <FlatList
                  data={accounts}
                  renderItem={renderAccountChip}
                  keyExtractor={accountKeyExtractor}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.chipContainer}
                  contentContainerStyle={styles.chipContentContainer}
                  removeClippedSubviews={true}
                  maxToRenderPerBatch={10}
                  updateCellsBatchingPeriod={50}
                  initialNumToRender={10}
                  windowSize={5}
                />
              </View>
            )}

            {/* Categories */}
            {categories.length > 0 && (
              <View style={styles.section}>
                <ThemedText type="defaultSemiBold" style={[styles.sectionLabel, { color: colors.text }]}>
                  Categories
                </ThemedText>
                <FlatList
                  data={categories}
                  renderItem={renderCategoryChip}
                  keyExtractor={categoryKeyExtractor}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.chipContainer}
                  contentContainerStyle={styles.chipContentContainer}
                  removeClippedSubviews={true}
                  maxToRenderPerBatch={10}
                  updateCellsBatchingPeriod={50}
                  initialNumToRender={10}
                  windowSize={5}
                />
              </View>
            )}

            {/* Date Range */}
            <View style={styles.section}>
              <ThemedText type="defaultSemiBold" style={[styles.sectionLabel, { color: colors.text }]}>
                Date Range
              </ThemedText>
              <View style={styles.dateRangeContainer}>
                <View style={styles.dateInput}>
                  <DatePicker
                    label="Start Date"
                    value={startDate}
                    onChange={setStartDate}
                    placeholder="Start date"
                  />
                </View>
                <View style={styles.dateInput}>
                  <DatePicker
                    label="End Date"
                    value={endDate}
                    onChange={setEndDate}
                    placeholder="End date"
                    minimumDate={startDate ? new Date(startDate) : undefined}
                  />
                </View>
              </View>
            </View>

            {/* Amount Range */}
            <View style={styles.section}>
              <ThemedText type="defaultSemiBold" style={[styles.sectionLabel, { color: colors.text }]}>
                Amount Range
              </ThemedText>
              <View style={styles.amountRangeContainer}>
                <View style={styles.amountInput}>
                  <Input
                    label="Min Amount"
                    value={minAmount}
                    onChangeText={setMinAmount}
                    placeholder="0.00"
                    keyboardType="decimal-pad"
                  />
                </View>
                <View style={styles.amountInput}>
                  <Input
                    label="Max Amount"
                    value={maxAmount}
                    onChangeText={setMaxAmount}
                    placeholder="0.00"
                    keyboardType="decimal-pad"
                  />
                </View>
              </View>
            </View>
          </ScrollView>

          {/* Footer Actions */}
          <View style={[styles.footer, { borderTopColor: colors.border, paddingBottom: insets.bottom }]}>
            <Button
              title="Reset"
              onPress={handleReset}
              variant="secondary"
              style={styles.footerButton}
              disabled={!hasActiveFilters}
            />
            <Button
              title="Apply Filters"
              onPress={handleApply}
              variant="primary"
              style={styles.footerButton}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

// Memoized Type Button Component
const TypeButton = React.memo<{
  filterType: 'all' | 'expense' | 'income' | 'transfer';
  isActive: boolean;
  colors: typeof Colors.light;
  onPress: () => void;
}>(({ filterType, isActive, colors, onPress }) => (
  <TouchableOpacity
    style={[
      styles.typeButton,
      { borderColor: colors.border },
      isActive && { backgroundColor: colors.primary, borderColor: colors.primary },
    ]}
    onPress={onPress}
    activeOpacity={0.7}>
    <ThemedText
      style={[
        styles.typeButtonText,
        { color: isActive ? '#FFFFFF' : colors.text },
      ]}>
      {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
    </ThemedText>
  </TouchableOpacity>
));

TypeButton.displayName = 'TypeButton';

// Memoized Account Chip Component
const AccountChip = React.memo<{
  account: Account;
  isSelected: boolean;
  colors: typeof Colors.light;
  onPress: () => void;
}>(({ account, isSelected, colors, onPress }) => (
  <TouchableOpacity
    style={[
      styles.chip,
      {
        backgroundColor: isSelected ? colors.primary : colors.cardBackground,
        borderColor: isSelected ? colors.primary : colors.border,
      },
    ]}
    onPress={onPress}
    activeOpacity={0.7}>
    <ThemedText
      style={[
        styles.chipText,
        { color: isSelected ? '#FFFFFF' : colors.text },
      ]}>
      {account.name}
    </ThemedText>
  </TouchableOpacity>
));

AccountChip.displayName = 'AccountChip';

// Memoized Category Chip Component
const CategoryChip = React.memo<{
  category: Category;
  isSelected: boolean;
  colors: typeof Colors.light;
  onPress: () => void;
}>(({ category, isSelected, colors, onPress }) => (
  <TouchableOpacity
    style={[
      styles.chip,
      {
        backgroundColor: isSelected ? colors.primary : colors.cardBackground,
        borderColor: isSelected ? colors.primary : colors.border,
      },
    ]}
    onPress={onPress}
    activeOpacity={0.7}>
    <ThemedText
      style={[
        styles.chipText,
        { color: isSelected ? '#FFFFFF' : colors.text },
      ]}>
      {category.icon} {category.name}
    </ThemedText>
  </TouchableOpacity>
));

CategoryChip.displayName = 'CategoryChip';

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    maxHeight: '90%',
    flex: 1,
    paddingTop: Spacing.xl,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.lg,
    borderBottomWidth: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionLabel: {
    marginBottom: Spacing.md,
    fontSize: 14,
    fontWeight: '600',
  },
  typeButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
    flexWrap: 'wrap',
  },
  typeButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    minWidth: 80,
    alignItems: 'center',
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  chipContainer: {
    marginTop: Spacing.sm,
  },
  chipContentContainer: {
    paddingRight: Spacing.sm,
  },
  chip: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    marginRight: Spacing.sm,
    minHeight: ComponentSizes.minTouchTarget,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500',
  },
  dateRangeContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  dateInput: {
    flex: 1,
  },
  amountRangeContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  amountInput: {
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    padding: Spacing.xl,
    borderTopWidth: 1,
    gap: Spacing.md,
  },
  footerButton: {
    flex: 1,
  },
});
