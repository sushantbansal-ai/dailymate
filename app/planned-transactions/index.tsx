import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { BorderRadius, Colors, ComponentSizes, Shadows, Spacing, Typography } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { useAccounts } from '@/hooks/use-accounts';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useFormatting } from '@/hooks/use-formatting';
import { PlannedTransaction } from '@/types';
import { getScrollViewBottomPadding } from '@/utils/constants';
import {
    formatRecurrence,
    getPlannedTransactionStatusText,
    hasReachedEndDate,
    isPlannedTransactionDue,
} from '@/utils/planned-transaction-helpers';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function PlannedTransactionsScreen() {
  const { plannedTransactions, accounts, categories, loading, refreshData, deletePlannedTransaction } = useApp();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();
  const { formatDate } = useFormatting();
  const { getAccountName } = useAccounts(accounts);

  // Filter and sort planned transactions
  const sortedPlannedTransactions = useMemo(() => {
    return [...plannedTransactions]
      .filter((pt) => pt.status !== 'cancelled')
      .sort((a, b) => {
        const dateA = new Date(a.nextOccurrenceDate || a.scheduledDate).getTime();
        const dateB = new Date(b.nextOccurrenceDate || b.scheduledDate).getTime();
        return dateA - dateB;
      });
  }, [plannedTransactions]);

  const handleDelete = async (plannedTransaction: PlannedTransaction) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      'Delete Planned Transaction',
      `Are you sure you want to delete "${plannedTransaction.description}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deletePlannedTransaction(plannedTransaction.id);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete planned transaction');
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status: PlannedTransaction['status'], isDue: boolean) => {
    if (status === 'completed') return colors.success;
    if (status === 'cancelled') return colors.textTertiary;
    if (isDue) return colors.warning;
    return colors.primary;
  };

  const getCategory = (categoryId: string) => {
    return categories.find((c) => c.id === categoryId);
  };

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerContent}>
          <ThemedText style={[Typography.h1, { color: colors.text }]}>Planned Transactions</ThemedText>
          <ThemedText style={[Typography.bodyMedium, styles.subtitle, { color: colors.textSecondary }]}>
            Schedule future transactions
          </ThemedText>
        </View>
        <Button
          title="+ Add"
          onPress={() => router.push('/planned-transactions/add')}
          variant="primary"
          size="small"
        />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: getScrollViewBottomPadding(insets.bottom) }]}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refreshData} />}>
        {sortedPlannedTransactions.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
            <MaterialIcons name="calendar-today" size={64} color={colors.textTertiary} />
            <ThemedText style={[Typography.h3, styles.emptyText, { color: colors.text }]}>
              No Planned Transactions
            </ThemedText>
            <ThemedText style={[Typography.bodyMedium, styles.emptySubtext, { color: colors.textSecondary }]}>
              Schedule your future transactions here!
            </ThemedText>
            <Button
              title="Add Planned Transaction"
              onPress={() => router.push('/planned-transactions/add')}
              variant="primary"
              style={styles.emptyButton}
            />
          </View>
        ) : (
          sortedPlannedTransactions.map((plannedTransaction) => {
            const category = getCategory(plannedTransaction.categoryId);
            const isDue = isPlannedTransactionDue(plannedTransaction);
            const hasEnded = hasReachedEndDate(plannedTransaction);
            const statusColor = getStatusColor(plannedTransaction.status || 'pending', isDue);
            const scheduledDate = plannedTransaction.nextOccurrenceDate || plannedTransaction.scheduledDate;
            const amountColor =
              plannedTransaction.type === 'income'
                ? colors.income
                : plannedTransaction.type === 'expense'
                  ? colors.expense
                  : colors.transfer;

            return (
              <Card key={plannedTransaction.id} variant="default" padding="lg" style={styles.transactionCard}>
                <TouchableOpacity
                  onPress={() => router.push(`/planned-transactions/add?id=${plannedTransaction.id}`)}
                  activeOpacity={0.7}>
                  <View style={styles.transactionHeader}>
                    <View style={styles.transactionInfo}>
                      <View style={[styles.categoryIcon, { backgroundColor: category?.color + '20' || colors.backgroundSecondary }]}>
                        <ThemedText style={styles.categoryIconText}>{category?.icon || '💰'}</ThemedText>
                      </View>
                      <View style={styles.transactionDetails}>
                        <ThemedText style={[Typography.bodyLarge, { color: colors.text, fontWeight: '600' }]}>
                          {plannedTransaction.description}
                        </ThemedText>
                        <ThemedText style={[Typography.bodySmall, { color: colors.textSecondary }]}>
                          {category?.name || 'Uncategorized'} • {getAccountName(plannedTransaction.accountId)}
                        </ThemedText>
                        <View style={styles.metaRow}>
                          <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
                            <ThemedText style={[Typography.bodySmall, { color: statusColor }]}>
                              {getPlannedTransactionStatusText(plannedTransaction.status || 'pending')}
                            </ThemedText>
                          </View>
                          {plannedTransaction.recurrence !== 'none' && (
                            <View style={[styles.recurrenceBadge, { backgroundColor: colors.backgroundSecondary }]}>
                              <MaterialIcons name="repeat" size={12} color={colors.textSecondary} />
                              <ThemedText style={[Typography.bodySmall, { color: colors.textSecondary, marginLeft: 4 }]}>
                                {formatRecurrence(plannedTransaction.recurrence)}
                              </ThemedText>
                            </View>
                          )}
                          {isDue && (
                            <View style={[styles.dueBadge, { backgroundColor: colors.warning + '20' }]}>
                              <ThemedText style={[Typography.bodySmall, { color: colors.warning }]}>Due</ThemedText>
                            </View>
                          )}
                        </View>
                      </View>
                    </View>
                    <View style={styles.transactionActions}>
                      <TouchableOpacity
                        onPress={(e) => {
                          e.stopPropagation();
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          router.push(`/planned-transactions/add?id=${plannedTransaction.id}`);
                        }}
                        style={styles.actionButton}
                        activeOpacity={0.7}>
                        <MaterialIcons name="edit" size={ComponentSizes.iconMedium} color={colors.primary} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={(e) => {
                          e.stopPropagation();
                          handleDelete(plannedTransaction);
                        }}
                        style={styles.actionButton}
                        activeOpacity={0.7}>
                        <MaterialIcons name="delete-outline" size={ComponentSizes.iconMedium} color={colors.error} />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Amount and Date */}
                  <View style={styles.amountDateRow}>
                    <View style={styles.amountContainer}>
                      <ThemedText style={[Typography.h4, { color: amountColor, fontWeight: '600' }]}>
                        {plannedTransaction.type === 'expense' ? '-' : plannedTransaction.type === 'income' ? '+' : ''}₹
                        {plannedTransaction.amount.toFixed(2)}
                      </ThemedText>
                    </View>
                    <View style={styles.dateContainer}>
                      <MaterialIcons name="calendar-today" size={16} color={colors.textTertiary} />
                      <ThemedText style={[Typography.bodySmall, { color: colors.textSecondary, marginLeft: Spacing.xs }]}>
                        {formatDate(scheduledDate)}
                      </ThemedText>
                      {plannedTransaction.time && (
                        <ThemedText style={[Typography.bodySmall, { color: colors.textTertiary, marginLeft: Spacing.xs }]}>
                          • {plannedTransaction.time}
                        </ThemedText>
                      )}
                    </View>
                  </View>

                  {/* Auto-create indicator */}
                  {plannedTransaction.autoCreate && (
                    <View style={[styles.autoCreateBadge, { backgroundColor: colors.info + '20' }]}>
                      <MaterialIcons name="auto-awesome" size={14} color={colors.info} />
                      <ThemedText style={[Typography.bodySmall, { color: colors.info, marginLeft: 4 }]}>
                        Auto-create enabled
                      </ThemedText>
                    </View>
                  )}

                  {/* End date indicator */}
                  {hasEnded && (
                    <View style={[styles.endedBadge, { backgroundColor: colors.textTertiary + '20' }]}>
                      <ThemedText style={[Typography.bodySmall, { color: colors.textTertiary }]}>
                        Recurrence ended
                      </ThemedText>
                    </View>
                  )}
                </TouchableOpacity>
              </Card>
            );
          })
        )}
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
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
    borderBottomWidth: 1,
  },
  headerContent: {
    flex: 1,
  },
  subtitle: {
    marginTop: Spacing.xs,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
    paddingTop: 0,
  },
  transactionCard: {
    marginBottom: Spacing.md,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  transactionInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  categoryIconText: {
    fontSize: 24,
  },
  transactionDetails: {
    flex: 1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xs,
    gap: Spacing.xs,
    flexWrap: 'wrap',
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  recurrenceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  dueBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  transactionActions: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  actionButton: {
    padding: Spacing.sm,
    minHeight: ComponentSizes.minTouchTarget,
    minWidth: ComponentSizes.minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  amountDateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  amountContainer: {
    flex: 1,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  autoCreateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    alignSelf: 'flex-start',
  },
  endedBadge: {
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    alignSelf: 'flex-start',
  },
  emptyCard: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.xxxl,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 280,
    marginTop: Spacing.xl,
    ...Shadows.sm,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  emptySubtext: {
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  emptyButton: {
    marginTop: Spacing.sm,
  },
});
