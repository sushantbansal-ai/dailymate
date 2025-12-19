import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { BorderRadius, Colors, ComponentSizes, Shadows, Spacing, Typography } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import * as NotificationService from '@/services/notifications';
import { Budget } from '@/types';
import { getScrollViewBottomPadding } from '@/utils/constants';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function BudgetsScreen() {
  const { budgets, categories, transactions, loading, refreshData, deleteBudget } = useApp();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();

  // Calculate spending for each budget
  const budgetsWithSpending = useMemo(() => {
    return budgets.map((budget) => {
      const spending = NotificationService.calculateBudgetSpending(budget, transactions);
      const percentage = budget.amount > 0 ? (spending / budget.amount) * 100 : 0;
      const remaining = budget.amount - spending;
      const category = budget.categoryId ? categories.find((c) => c.id === budget.categoryId) : null;
      
      return {
        ...budget,
        spending,
        percentage,
        remaining,
        category,
      };
    });
  }, [budgets, categories, transactions]);

  const handleDelete = async (budget: Budget) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      'Delete Budget',
      `Are you sure you want to delete "${budget.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteBudget(budget.id);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete budget');
            }
          },
        },
      ]
    );
  };

  const formatPeriod = (period: Budget['period']) => {
    switch (period) {
      case 'weekly':
        return 'Weekly';
      case 'monthly':
        return 'Monthly';
      case 'yearly':
        return 'Yearly';
    }
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return colors.error;
    if (percentage >= 90) return colors.warning;
    if (percentage >= 75) return colors.info;
    return colors.success;
  };

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerContent}>
          <ThemedText style={[Typography.h1, { color: colors.text }]}>Budgets</ThemedText>
          <ThemedText style={[Typography.bodyMedium, styles.subtitle, { color: colors.textSecondary }]}>
            Track your spending limits
          </ThemedText>
        </View>
        <Button
          title="+ Add"
          onPress={() => router.push('/budgets/add')}
          variant="primary"
          size="small"
        />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: getScrollViewBottomPadding(insets.bottom) }]}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refreshData} />}>
        {budgetsWithSpending.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
            <MaterialIcons name="account-balance-wallet" size={64} color={colors.textTertiary} />
            <ThemedText style={[Typography.h3, styles.emptyText, { color: colors.text }]}>
              No Budgets Found
            </ThemedText>
            <ThemedText style={[Typography.bodyMedium, styles.emptySubtext, { color: colors.textSecondary }]}>
              Create your first budget to track spending!
            </ThemedText>
            <Button
              title="Create Budget"
              onPress={() => router.push('/budgets/add')}
              variant="primary"
              style={styles.emptyButton}
            />
          </View>
        ) : (
          budgetsWithSpending.map((budget) => {
            const progressColor = getProgressColor(budget.percentage);
            const isExceeded = budget.spending > budget.amount;

            return (
              <Card key={budget.id} variant="default" padding="lg" style={styles.budgetCard}>
                <TouchableOpacity
                  onPress={() => router.push(`/budgets/add?id=${budget.id}`)}
                  activeOpacity={0.7}>
                  <View style={styles.budgetHeader}>
                    <View style={styles.budgetInfo}>
                      <View style={[styles.budgetIcon, { backgroundColor: budget.color + '20' }]}>
                        <ThemedText style={styles.budgetIconText}>{budget.icon || '💰'}</ThemedText>
                      </View>
                      <View style={styles.budgetDetails}>
                        <ThemedText style={[Typography.bodyLarge, { color: colors.text, fontWeight: '600' }]}>
                          {budget.name}
                        </ThemedText>
                        <ThemedText style={[Typography.bodySmall, { color: colors.textSecondary }]}>
                          {budget.category ? budget.category.name : 'Overall Budget'} • {formatPeriod(budget.period)}
                        </ThemedText>
                      </View>
                    </View>
                    <View style={styles.budgetActions}>
                      <TouchableOpacity
                        onPress={(e) => {
                          e.stopPropagation();
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          router.push(`/budgets/add?id=${budget.id}`);
                        }}
                        style={styles.actionButton}
                        activeOpacity={0.7}>
                        <MaterialIcons name="edit" size={ComponentSizes.iconMedium} color={colors.primary} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={(e) => {
                          e.stopPropagation();
                          handleDelete(budget);
                        }}
                        style={styles.actionButton}
                        activeOpacity={0.7}>
                        <MaterialIcons name="delete-outline" size={ComponentSizes.iconMedium} color={colors.error} />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Progress Bar */}
                  <View style={styles.progressContainer}>
                    <View style={[styles.progressBar, { backgroundColor: colors.backgroundSecondary }]}>
                      <View
                        style={[
                          styles.progressFill,
                          {
                            width: `${Math.min(budget.percentage, 100)}%`,
                            backgroundColor: progressColor,
                          },
                        ]}
                      />
                    </View>
                    <View style={styles.progressInfo}>
                      <ThemedText style={[Typography.bodySmall, { color: colors.textSecondary }]}>
                        {budget.percentage.toFixed(1)}% used
                      </ThemedText>
                      <ThemedText
                        style={[
                          Typography.bodySmall,
                          { color: isExceeded ? colors.error : colors.textSecondary },
                        ]}>
                        {isExceeded ? 'Exceeded' : `₹${budget.remaining.toFixed(2)} remaining`}
                      </ThemedText>
                    </View>
                  </View>

                  {/* Amount Info */}
                  <View style={styles.amountInfo}>
                    <View style={styles.amountItem}>
                      <ThemedText style={[Typography.bodySmall, { color: colors.textTertiary }]}>Spent</ThemedText>
                      <ThemedText style={[Typography.bodyLarge, { color: colors.expense, fontWeight: '600' }]}>
                        ₹{budget.spending.toFixed(2)}
                      </ThemedText>
                    </View>
                    <View style={styles.amountDivider} />
                    <View style={styles.amountItem}>
                      <ThemedText style={[Typography.bodySmall, { color: colors.textTertiary }]}>Budget</ThemedText>
                      <ThemedText style={[Typography.bodyLarge, { color: colors.text, fontWeight: '600' }]}>
                        ₹{budget.amount.toFixed(2)}
                      </ThemedText>
                    </View>
                  </View>
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
  budgetCard: {
    marginBottom: Spacing.md,
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  budgetInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  budgetIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  budgetIconText: {
    fontSize: 24,
  },
  budgetDetails: {
    flex: 1,
  },
  budgetActions: {
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
  progressContainer: {
    marginBottom: Spacing.md,
  },
  progressBar: {
    height: 8,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
    marginBottom: Spacing.xs,
  },
  progressFill: {
    height: '100%',
    borderRadius: BorderRadius.full,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  amountInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  amountItem: {
    flex: 1,
    alignItems: 'center',
  },
  amountDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(0,0,0,0.1)',
    marginHorizontal: Spacing.md,
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
