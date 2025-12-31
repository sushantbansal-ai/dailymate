/**
 * All Transactions Screen with Filters
 * View all transactions with comprehensive filtering options
 */

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { TransactionFilters, type TransactionFiltersType } from '@/components/ui/transaction-filters';
import { BorderRadius, Colors, ComponentSizes, Shadows, Spacing, Typography } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useFormatting } from '@/hooks/use-formatting';
import { useTransactions } from '@/hooks/use-transactions';
import { filterTransactions } from '@/utils/analytics-helpers';
import { sortTransactionsByDate } from '@/utils/transaction-helpers';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useCallback, useMemo, useState } from 'react';
import { Alert, FlatList, RefreshControl, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function AllTransactionsScreen() {
  const { transactions, accounts, categories, loading, refreshData, deleteTransaction } = useApp();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();
  const { formatCurrency, formatDate } = useFormatting();
  const { getTransactionTypeColor, getCategory } = useTransactions(transactions, categories);

  const [filtersVisible, setFiltersVisible] = useState(false);
  const [currentFilters, setCurrentFilters] = useState<TransactionFiltersType>({});

  // Apply filters and sort transactions
  const filteredTransactions = useMemo(() => {
    let filtered = filterTransactions(transactions, currentFilters);
    return sortTransactionsByDate(filtered, 'desc');
  }, [transactions, currentFilters]);

  const handleApplyFilters = (filters: TransactionFiltersType) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setCurrentFilters(filters);
  };

  const handleResetFilters = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setCurrentFilters({});
  };

  const hasActiveFilters = useMemo(() => {
    return (
      currentFilters.type !== undefined ||
      (currentFilters.accountIds && currentFilters.accountIds.length > 0) ||
      (currentFilters.categoryIds && currentFilters.categoryIds.length > 0) ||
      currentFilters.startDate !== undefined ||
      currentFilters.endDate !== undefined ||
      currentFilters.minAmount !== undefined ||
      currentFilters.maxAmount !== undefined ||
      currentFilters.searchQuery !== undefined
    );
  }, [currentFilters]);

  const getActiveFiltersCount = useMemo(() => {
    let count = 0;
    if (currentFilters.type && currentFilters.type !== 'all') count++;
    if (currentFilters.accountIds && currentFilters.accountIds.length > 0) count++;
    if (currentFilters.categoryIds && currentFilters.categoryIds.length > 0) count++;
    if (currentFilters.startDate) count++;
    if (currentFilters.endDate) count++;
    if (currentFilters.minAmount !== undefined) count++;
    if (currentFilters.maxAmount !== undefined) count++;
    if (currentFilters.searchQuery) count++;
    return count;
  }, [currentFilters]);

  const handleDelete = useCallback((transactionId: string) => {
    Alert.alert(
      'Delete Transaction',
      'Are you sure you want to delete this transaction? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              await deleteTransaction(transactionId);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch (error: any) {
              Alert.alert('Error', error?.message || 'Failed to delete transaction');
            }
          },
        },
      ]
    );
  }, [deleteTransaction]);

  const renderTransaction = useCallback(({ item: transaction }: { item: typeof transactions[0] }) => {
    const category = getCategory(transaction.categoryId);
    const account = accounts.find((a) => a.id === transaction.accountId);
    const amountColor = getTransactionTypeColor(transaction.type);
    const isExpense = transaction.type === 'expense';
    const isSplit = transaction.splits && transaction.splits.length > 0;
    const splitCount = transaction.splits?.length || 0;

    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.push(`/transactions/add?id=${transaction.id}`);
        }}>
        <Card variant="default" padding="lg" style={styles.transactionCard}>
          <View style={styles.transactionRow}>
            <View style={styles.transactionLeft}>
              <View style={[styles.categoryIconContainer, { backgroundColor: category?.color ? category.color + '20' : colors.backgroundSecondary }]}>
                <ThemedText style={styles.categoryIcon}>
                  {category?.icon || '💰'}
                </ThemedText>
                {isSplit && (
                  <View style={[styles.splitBadge, { backgroundColor: colors.primary }]}>
                    <MaterialIcons name="call-split" size={12} color="#FFFFFF" />
                  </View>
                )}
              </View>
              <View style={styles.transactionInfo}>
                <View style={styles.transactionDescriptionRow}>
                  <ThemedText style={[Typography.bodyLarge, styles.transactionDescription, { color: colors.text }]}>
                    {transaction.description}
                  </ThemedText>
                  {isSplit && (
                    <View style={[styles.splitIndicator, { backgroundColor: colors.primary + '20' }]}>
                      <MaterialIcons name="call-split" size={14} color={colors.primary} />
                      <ThemedText style={[Typography.labelSmall, { color: colors.primary, marginLeft: 2 }]}>
                        {splitCount}
                      </ThemedText>
                    </View>
                  )}
                </View>
                <View style={styles.transactionMeta}>
                  <ThemedText style={[Typography.bodySmall, styles.transactionMetaText, { color: colors.textSecondary }]}>
                    {formatDate(transaction.date, 'medium')}
                  </ThemedText>
                  {account && (
                    <>
                      <ThemedText style={[Typography.bodySmall, { color: colors.textTertiary, marginHorizontal: Spacing.xs }]}>•</ThemedText>
                      <ThemedText style={[Typography.bodySmall, styles.transactionMetaText, { color: colors.textSecondary }]}>
                        {account.name}
                      </ThemedText>
                    </>
                  )}
                  {!isSplit && category && (
                    <>
                      <ThemedText style={[Typography.bodySmall, { color: colors.textTertiary, marginHorizontal: Spacing.xs }]}>•</ThemedText>
                      <ThemedText style={[Typography.bodySmall, styles.transactionMetaText, { color: colors.textSecondary }]}>
                        {category.name}
                      </ThemedText>
                    </>
                  )}
                  {isSplit && (
                    <>
                      <ThemedText style={[Typography.bodySmall, { color: colors.textTertiary, marginHorizontal: Spacing.xs }]}>•</ThemedText>
                      <ThemedText style={[Typography.bodySmall, styles.transactionMetaText, { color: colors.textSecondary }]}>
                        {splitCount} categor{splitCount === 1 ? 'y' : 'ies'}
                      </ThemedText>
                    </>
                  )}
                </View>
              </View>
            </View>
            <View style={styles.transactionRight}>
              <ThemedText style={[Typography.h4, styles.transactionAmount, { color: amountColor }]}>
                {isExpense ? '-' : '+'}
                {formatCurrency(transaction.amount)}
              </ThemedText>
              <View style={styles.transactionActions}>
                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation();
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.push(`/transactions/add?id=${transaction.id}`);
                  }}
                  style={styles.actionIcon}
                  activeOpacity={0.7}>
                  <MaterialIcons name="edit" size={20} color={colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation();
                    handleDelete(transaction.id);
                  }}
                  style={styles.actionIcon}
                  activeOpacity={0.7}>
                  <MaterialIcons name="delete-outline" size={20} color={colors.error} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Card>
      </TouchableOpacity>
    );
  }, [getCategory, accounts, getTransactionTypeColor, formatCurrency, formatDate, colors, router, handleDelete]);

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerContent}>
          <ThemedText style={[Typography.h1, { color: colors.text }]}>All Transactions</ThemedText>
          <ThemedText style={[Typography.bodySmall, styles.subtitle, { color: colors.textSecondary }]}>
            {filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? 's' : ''}
            {hasActiveFilters && ` • ${getActiveFiltersCount} filter${getActiveFiltersCount !== 1 ? 's' : ''} active`}
          </ThemedText>
        </View>
        <Button
          title={hasActiveFilters ? `Filters (${getActiveFiltersCount})` : 'Filters'}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setFiltersVisible(true);
          }}
          variant={hasActiveFilters ? 'primary' : 'secondary'}
          size="small"
          icon="filter-list"
        />
      </View>

      {/* Transaction List */}
      {filteredTransactions.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={[styles.emptyCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }, Shadows.sm]}>
            <MaterialIcons name="receipt-long" size={64} color={colors.textTertiary} />
            <ThemedText style={[Typography.h3, styles.emptyText, { color: colors.text }]}>
              {hasActiveFilters ? 'No transactions found' : 'No transactions yet'}
            </ThemedText>
            <ThemedText style={[Typography.bodyMedium, styles.emptySubtext, { color: colors.textSecondary }]}>
              {hasActiveFilters
                ? 'Try adjusting your filters to see more results'
                : 'Add your first transaction to get started'}
            </ThemedText>
            {hasActiveFilters && (
              <Button
                title="Clear Filters"
                onPress={handleResetFilters}
                variant="secondary"
                size="medium"
                style={styles.emptyButton}
              />
            )}
          </View>
        </View>
      ) : (
        <FlatList
          data={filteredTransactions}
          renderItem={renderTransaction}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.listContent, { paddingBottom: Spacing.xxxl + insets.bottom }]}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={refreshData} />}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          updateCellsBatchingPeriod={50}
          initialNumToRender={15}
          windowSize={10}
        />
      )}

      {/* Filters Modal */}
      <TransactionFilters
        visible={filtersVisible}
        onClose={() => setFiltersVisible(false)}
        onApply={handleApplyFilters}
        onReset={handleResetFilters}
        accounts={accounts}
        categories={categories}
        currentFilters={currentFilters}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerContent: {
    flex: 1,
    marginRight: Spacing.md,
  },
  subtitle: {
    marginTop: Spacing.xs,
  },
  listContent: {
    padding: Spacing.lg,
  },
  transactionCard: {
    marginBottom: Spacing.md,
  },
  transactionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 60,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.lg,
    position: 'relative',
  },
  splitBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.light.background,
  },
  transactionDescriptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.xxs,
  },
  splitIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  categoryIcon: {
    fontSize: 24,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionDescription: {
    fontWeight: '600',
    marginBottom: Spacing.xxs,
  },
  transactionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  transactionMetaText: {
    lineHeight: 18,
  },
  transactionRight: {
    alignItems: 'flex-end',
    marginLeft: Spacing.md,
  },
  transactionAmount: {
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  transactionActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  actionIcon: {
    padding: Spacing.xs,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  emptyCard: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.xxxl,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: 400,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  emptySubtext: {
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  emptyButton: {
    minWidth: 200,
  },
});

