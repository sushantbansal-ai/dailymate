/**
 * Bills List Screen
 * View and manage all bills
 */

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { BorderRadius, Colors, ComponentSizes, Spacing, Typography } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useFormatting } from '@/hooks/use-formatting';
import { Bill, BillStatus } from '@/types';
import { getScrollViewBottomPadding } from '@/utils/constants';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, FlatList, RefreshControl, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function BillsScreen() {
  const { bills, accounts, categories, contacts, loading, refreshData, deleteBill, updateBill } = useApp();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();
  const { formatCurrency, formatDate } = useFormatting();

  const [filterStatus, setFilterStatus] = useState<'all' | BillStatus>('all');

  // Filter bills by status
  const filteredBills = useMemo(() => {
    if (filterStatus === 'all') return bills;
    return bills.filter((bill) => bill.status === filterStatus);
  }, [bills, filterStatus]);

  // Sort bills: overdue first, then by due date
  const sortedBills = useMemo(() => {
    return [...filteredBills].sort((a, b) => {
      if (a.status === 'overdue' && b.status !== 'overdue') return -1;
      if (a.status !== 'overdue' && b.status === 'overdue') return 1;
      
      const aDueDate = a.nextDueDate ? new Date(a.nextDueDate).getTime() : Infinity;
      const bDueDate = b.nextDueDate ? new Date(b.nextDueDate).getTime() : Infinity;
      return aDueDate - bDueDate;
    });
  }, [filteredBills]);

  const getStatusColor = (status: BillStatus) => {
    switch (status) {
      case 'paid':
        return colors.success;
      case 'overdue':
        return colors.error;
      case 'pending':
        return colors.warning;
      case 'cancelled':
        return colors.textTertiary;
      default:
        return colors.textSecondary;
    }
  };

  const getStatusIcon = (status: BillStatus) => {
    switch (status) {
      case 'paid':
        return 'check-circle';
      case 'overdue':
        return 'error';
      case 'pending':
        return 'schedule';
      case 'cancelled':
        return 'cancel';
      default:
        return 'info';
    }
  };

  const handleDelete = (bill: Bill) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      'Delete Bill',
      `Are you sure you want to delete "${bill.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteBill(bill.id);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch (error: any) {
              Alert.alert('Error', error?.message || 'Failed to delete bill');
            }
          },
        },
      ]
    );
  };

  const handleMarkAsPaid = async (bill: Bill) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const updatedBill: Bill = {
        ...bill,
        status: 'paid',
        lastPaidDate: new Date().toISOString().split('T')[0],
        lastPaidAmount: bill.amount,
      };
      await updateBill(updatedBill);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Failed to update bill');
    }
  };

  const renderBill = ({ item: bill }: { item: Bill }) => {
    const category = categories.find((c) => c.id === bill.categoryId);
    const account = accounts.find((a) => a.id === bill.accountId);
    const payee = bill.payeeId ? contacts.find((c) => c.id === bill.payeeId) : null;
    const statusColor = getStatusColor(bill.status);
    const statusIcon = getStatusIcon(bill.status);
    const isOverdue = bill.status === 'overdue';
    const isPending = bill.status === 'pending';

    // Calculate days until due
    let daysUntilDue: number | null = null;
    if (bill.nextDueDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const dueDate = new Date(bill.nextDueDate);
      dueDate.setHours(0, 0, 0, 0);
      const diffTime = dueDate.getTime() - today.getTime();
      daysUntilDue = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    return (
      <Card variant="default" padding="lg" style={styles.billCard}>
        <View style={styles.billHeader}>
          <View style={styles.billLeft}>
            <View style={[styles.categoryIconContainer, { backgroundColor: category?.color ? category.color + '20' : colors.backgroundSecondary }]}>
              <ThemedText style={styles.categoryIcon}>
                {category?.icon || '💡'}
              </ThemedText>
            </View>
            <View style={styles.billInfo}>
              <View style={styles.billTitleRow}>
                <ThemedText style={[Typography.bodyLarge, styles.billName, { color: colors.text }]}>
                  {bill.name}
                </ThemedText>
                <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
                  <MaterialIcons name={statusIcon as any} size={14} color={statusColor} />
                  <ThemedText style={[Typography.labelSmall, { color: statusColor, marginLeft: 4, textTransform: 'capitalize' }]}>
                    {bill.status}
                  </ThemedText>
                </View>
              </View>
              <View style={styles.billMeta}>
                {account && (
                  <ThemedText style={[Typography.bodySmall, { color: colors.textSecondary }]}>
                    {account.name}
                  </ThemedText>
                )}
                {payee && (
                  <>
                    {account && (
                      <ThemedText style={[Typography.bodySmall, { color: colors.textTertiary, marginHorizontal: Spacing.xs }]}>•</ThemedText>
                    )}
                    <ThemedText style={[Typography.bodySmall, { color: colors.textSecondary }]}>
                      {payee.name}
                    </ThemedText>
                  </>
                )}
              </View>
            </View>
          </View>
          <View style={styles.billRight}>
            <ThemedText style={[Typography.h3, styles.billAmount, { color: colors.error }]}>
              {formatCurrency(bill.amount)}
            </ThemedText>
            {bill.nextDueDate && (
              <ThemedText
                style={[
                  Typography.bodySmall,
                  {
                    color: isOverdue ? colors.error : isPending && daysUntilDue !== null && daysUntilDue <= 3 ? colors.warning : colors.textSecondary,
                    marginTop: Spacing.xs,
                  },
                ]}>
                {isOverdue
                  ? `Overdue ${formatDate(bill.nextDueDate, 'short')}`
                  : daysUntilDue !== null && daysUntilDue === 0
                    ? 'Due today'
                    : daysUntilDue !== null && daysUntilDue === 1
                      ? 'Due tomorrow'
                      : daysUntilDue !== null && daysUntilDue > 1
                        ? `Due in ${daysUntilDue} days`
                        : `Due ${formatDate(bill.nextDueDate, 'short')}`}
              </ThemedText>
            )}
          </View>
        </View>

        {/* Bill Details */}
        {bill.description && (
          <ThemedText style={[Typography.bodySmall, styles.billDescription, { color: colors.textSecondary }]}>
            {bill.description}
          </ThemedText>
        )}

        {/* Recurrence Info */}
        <View style={styles.billRecurrence}>
          <MaterialIcons name="repeat" size={16} color={colors.textTertiary} />
          <ThemedText style={[Typography.bodySmall, { color: colors.textSecondary, marginLeft: Spacing.xs }]}>
            {bill.recurrence === 'monthly' ? 'Monthly' : bill.recurrence === 'yearly' ? 'Yearly' : bill.recurrence}
            {bill.dueDateType === 'recurring' && bill.dueDay && ` (Day ${bill.dueDay})`}
          </ThemedText>
        </View>

        {/* Last Paid Info */}
        {bill.lastPaidDate && (
          <View style={styles.billLastPaid}>
            <MaterialIcons name="check-circle" size={16} color={colors.success} />
            <ThemedText style={[Typography.bodySmall, { color: colors.textSecondary, marginLeft: Spacing.xs }]}>
              Last paid: {formatDate(bill.lastPaidDate, 'medium')} ({formatCurrency(bill.lastPaidAmount || bill.amount)})
            </ThemedText>
          </View>
        )}

        {/* Actions */}
        <View style={styles.billActions}>
          {bill.status !== 'paid' && bill.status !== 'cancelled' && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.success + '20' }]}
              onPress={() => handleMarkAsPaid(bill)}
              activeOpacity={0.7}>
              <MaterialIcons name="check" size={ComponentSizes.iconSmall} color={colors.success} />
              <ThemedText style={[Typography.labelMedium, { color: colors.success, marginLeft: Spacing.xs }]}>
                Mark Paid
              </ThemedText>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.primary + '20' }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push(`/bills/add?id=${bill.id}`);
            }}
            activeOpacity={0.7}>
            <MaterialIcons name="edit" size={ComponentSizes.iconSmall} color={colors.primary} />
            <ThemedText style={[Typography.labelMedium, { color: colors.primary, marginLeft: Spacing.xs }]}>
              Edit
            </ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.error + '20' }]}
            onPress={() => handleDelete(bill)}
            activeOpacity={0.7}>
            <MaterialIcons name="delete-outline" size={ComponentSizes.iconSmall} color={colors.error} />
            <ThemedText style={[Typography.labelMedium, { color: colors.error, marginLeft: Spacing.xs }]}>
              Delete
            </ThemedText>
          </TouchableOpacity>
        </View>
      </Card>
    );
  };

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={colors.iconActive || colors.primary} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <ThemedText type="title" style={styles.headerTitle}>Bills & Reminders</ThemedText>
        </View>
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push('/bills/add');
          }}
          style={styles.addButton}>
          <MaterialIcons name="add" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Status Filter */}
      <View style={styles.filterContainer}>
        {(['all', 'pending', 'overdue', 'paid', 'cancelled'] as const).map((status) => (
          <TouchableOpacity
            key={status}
            style={[
              styles.filterButton,
              {
                backgroundColor: filterStatus === status ? colors.primary : 'transparent',
                borderColor: colors.border,
              },
            ]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setFilterStatus(status);
            }}
            activeOpacity={0.7}>
            <ThemedText
              style={[
                Typography.bodySmall,
                {
                  color: filterStatus === status ? '#FFFFFF' : colors.textSecondary,
                  fontWeight: filterStatus === status ? '600' : '500',
                },
              ]}>
              {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
            </ThemedText>
          </TouchableOpacity>
        ))}
      </View>

      {/* Bills List */}
      {sortedBills.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Card variant="default" padding="xl" style={styles.emptyCard}>
            <MaterialIcons name="receipt-long" size={64} color={colors.textTertiary} />
            <ThemedText style={[Typography.h3, styles.emptyText, { color: colors.text }]}>
              {filterStatus === 'all' ? 'No bills yet' : `No ${filterStatus} bills`}
            </ThemedText>
            <ThemedText style={[Typography.bodyMedium, styles.emptySubtext, { color: colors.textSecondary }]}>
              {filterStatus === 'all'
                ? 'Add your first bill to start tracking payments'
                : `No bills with status "${filterStatus}"`}
            </ThemedText>
            {filterStatus === 'all' && (
              <Button
                title="Add Bill"
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push('/bills/add');
                }}
                variant="primary"
                style={styles.emptyButton}
              />
            )}
          </Card>
        </View>
      ) : (
        <FlatList
          data={sortedBills}
          renderItem={renderBill}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.listContent, { paddingBottom: getScrollViewBottomPadding(insets.bottom) }]}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={refreshData} />}
          showsVerticalScrollIndicator={false}
        />
      )}
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
  addButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  filterButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  listContent: {
    padding: Spacing.lg,
  },
  billCard: {
    marginBottom: Spacing.md,
  },
  billHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  billLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  categoryIconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  categoryIcon: {
    fontSize: 24,
  },
  billInfo: {
    flex: 1,
  },
  billTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
    flexWrap: 'wrap',
  },
  billName: {
    fontWeight: '600',
    flex: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  billMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  billRight: {
    alignItems: 'flex-end',
    marginLeft: Spacing.md,
  },
  billAmount: {
    fontWeight: '700',
  },
  billDescription: {
    marginBottom: Spacing.sm,
  },
  billRecurrence: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  billLastPaid: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  billActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
    flexWrap: 'wrap',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    flex: 1,
    minWidth: 100,
    justifyContent: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  emptyCard: {
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

