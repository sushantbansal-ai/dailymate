import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { BorderRadius, Colors, ComponentSizes, Shadows, Spacing, Typography } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useFormatting } from '@/hooks/use-formatting';
import * as NotificationService from '@/services/notifications';
import { getScrollViewBottomPadding } from '@/utils/constants';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function BudgetScreen() {
  const { budgets, goals, plannedTransactions, categories, transactions, accounts, loading, refreshData } = useApp();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<'budgets' | 'goals' | 'planned'>('budgets');
  const { formatDate } = useFormatting();

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerContent}>
          <ThemedText style={[Typography.h1, { color: colors.text }]}>
            Budget & Goals
          </ThemedText>
          <ThemedText style={[Typography.bodyMedium, styles.subtitle, { color: colors.textSecondary }]}>
            Track your spending and savings
          </ThemedText>
        </View>
        <Button
          title="+ Add"
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            if (activeTab === 'budgets') {
              router.push('/budgets/add');
            } else if (activeTab === 'goals') {
              router.push('/goals/add');
            } else if (activeTab === 'planned') {
              router.push('/planned-transactions/add');
            }
          }}
          variant="primary"
          size="small"
        />
      </View>

      {/* Segmented Control */}
      <View style={styles.segmentedControl}>
        <TouchableOpacity
          style={[
            styles.segment,
            activeTab === 'budgets' && styles.segmentActive,
            activeTab === 'budgets' ? { backgroundColor: colors.cardBackground } : { backgroundColor: 'transparent' },
            activeTab === 'budgets' && Shadows.sm,
          ]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setActiveTab('budgets');
          }}
          activeOpacity={0.7}>
          <MaterialIcons
            name="account-balance-wallet"
            size={ComponentSizes.iconSmall}
            color={activeTab === 'budgets' ? colors.primary : colors.textTertiary}
          />
          <ThemedText
            style={[
              Typography.labelMedium,
              { color: activeTab === 'budgets' ? colors.primary : colors.textTertiary, marginLeft: Spacing.xs },
            ]}>
            Budgets
          </ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.segment,
            activeTab === 'goals' && styles.segmentActive,
            activeTab === 'goals' ? { backgroundColor: colors.cardBackground } : { backgroundColor: 'transparent' },
            activeTab === 'goals' && Shadows.sm,
          ]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setActiveTab('goals');
          }}
          activeOpacity={0.7}>
          <MaterialIcons
            name="track-changes"
            size={ComponentSizes.iconSmall}
            color={activeTab === 'goals' ? colors.primary : colors.textTertiary}
          />
          <ThemedText
            style={[
              Typography.labelMedium,
              { color: activeTab === 'goals' ? colors.primary : colors.textTertiary, marginLeft: Spacing.xs },
            ]}>
            Goals
          </ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.segment,
            activeTab === 'planned' && styles.segmentActive,
            activeTab === 'planned' ? { backgroundColor: colors.cardBackground } : { backgroundColor: 'transparent' },
            activeTab === 'planned' && Shadows.sm,
          ]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setActiveTab('planned');
          }}
          activeOpacity={0.7}>
          <MaterialIcons
            name="calendar-today"
            size={ComponentSizes.iconSmall}
            color={activeTab === 'planned' ? colors.primary : colors.textTertiary}
          />
          <ThemedText
            style={[
              Typography.labelMedium,
              { color: activeTab === 'planned' ? colors.primary : colors.textTertiary, marginLeft: Spacing.xs },
            ]}>
            Planned
          </ThemedText>
        </TouchableOpacity>
      </View>

      {/* Content based on active tab */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: getScrollViewBottomPadding(insets.bottom) }]}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refreshData} />}>
        {activeTab === 'budgets' && (
          <>
            {budgets.length === 0 ? (
          <>
            <View style={[styles.emptyCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }, Shadows.sm]}>
              <View style={[styles.iconCircle, { backgroundColor: colors.backgroundSecondary }]}>
                <MaterialIcons name="trending-up" size={48} color={colors.primary} />
              </View>
              <ThemedText style={[Typography.h2, styles.emptyTitle, { color: colors.text }]}>
                No Budgets Set
              </ThemedText>
              <ThemedText style={[Typography.bodyMedium, styles.emptyDescription, { color: colors.textSecondary }]}>
                Create your first budget to track spending and reach your financial goals.
              </ThemedText>
              <Button
                title="Create Budget"
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push('/budgets/add');
                }}
                variant="primary"
                size="medium"
                style={styles.emptyButton}
              />
            </View>

            {/* Feature Cards */}
            <View style={styles.features}>
              <View style={[styles.featureCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
                <MaterialIcons name="bar-chart" size={ComponentSizes.iconLarge} color={colors.primary} />
                <ThemedText style={[Typography.labelLarge, { color: colors.text, marginTop: Spacing.sm }]}>
                  Track Spending
                </ThemedText>
                <ThemedText style={[Typography.bodySmall, { color: colors.textSecondary, marginTop: Spacing.xs }]}>
                  Monitor your expenses by category
                </ThemedText>
              </View>
              <View style={[styles.featureCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
                <MaterialIcons name="savings" size={ComponentSizes.iconLarge} color={colors.success} />
                <ThemedText style={[Typography.labelLarge, { color: colors.text, marginTop: Spacing.sm }]}>
                  Set Goals
                </ThemedText>
                <ThemedText style={[Typography.bodySmall, { color: colors.textSecondary, marginTop: Spacing.xs }]}>
                  Save for what matters most
                </ThemedText>
              </View>
            </View>
          </>
        ) : (
          budgets.map((budget) => {
            const spending = NotificationService.calculateBudgetSpending(budget, transactions);
            const percentage = budget.amount > 0 ? (spending / budget.amount) * 100 : 0;
            const remaining = budget.amount - spending;
            const category = budget.categoryId ? categories.find((c) => c.id === budget.categoryId) : null;
            const progressColor = percentage >= 100 ? colors.error : percentage >= 90 ? colors.warning : percentage >= 75 ? colors.info : colors.success;
            const isExceeded = spending > budget.amount;

            return (
              <Card key={budget.id} variant="default" padding="lg" style={styles.budgetCard}>
                <TouchableOpacity
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.push(`/budgets/add?id=${budget.id}`);
                  }}
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
                          {category ? category.name : 'Overall Budget'} • {budget.period.charAt(0).toUpperCase() + budget.period.slice(1)}
                        </ThemedText>
                      </View>
                    </View>
                  </View>

                  {/* Progress Bar */}
                  <View style={styles.progressContainer}>
                    <View style={[styles.progressBar, { backgroundColor: colors.backgroundSecondary }]}>
                      <View
                        style={[
                          styles.progressFill,
                          {
                            width: `${Math.min(percentage, 100)}%`,
                            backgroundColor: progressColor,
                          },
                        ]}
                      />
                    </View>
                    <View style={styles.progressInfo}>
                      <ThemedText style={[Typography.bodySmall, { color: colors.textSecondary }]}>
                        {percentage.toFixed(1)}% used
                      </ThemedText>
                      <ThemedText
                        style={[
                          Typography.bodySmall,
                          { color: isExceeded ? colors.error : colors.textSecondary },
                        ]}>
                        {isExceeded ? 'Exceeded' : `₹${remaining.toFixed(2)} remaining`}
                      </ThemedText>
                    </View>
                  </View>

                  {/* Amount Info */}
                  <View style={styles.amountInfo}>
                    <View style={styles.amountItem}>
                      <ThemedText style={[Typography.bodySmall, { color: colors.textTertiary }]}>Spent</ThemedText>
                      <ThemedText style={[Typography.bodyLarge, { color: colors.expense, fontWeight: '600' }]}>
                        ₹{spending.toFixed(2)}
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
          </>
        )}

        {activeTab === 'goals' && (
          <>
            {goals.length === 0 ? (
              <>
                <View style={[styles.emptyCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }, Shadows.sm]}>
                  <View style={[styles.iconCircle, { backgroundColor: colors.backgroundSecondary }]}>
                    <MaterialIcons name="track-changes" size={48} color={colors.primary} />
                  </View>
                  <ThemedText style={[Typography.h2, styles.emptyTitle, { color: colors.text }]}>
                    No Goals Set
                  </ThemedText>
                  <ThemedText style={[Typography.bodyMedium, styles.emptyDescription, { color: colors.textSecondary }]}>
                    Create your first savings goal to track your progress.
                  </ThemedText>
                  <Button
                    title="Create Goal"
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      router.push('/goals/add');
                    }}
                    variant="primary"
                    size="medium"
                    style={styles.emptyButton}
                  />
                </View>
              </>
            ) : (
              goals.map((goal) => {
                // Calculate progress
                let currentAmount = goal.currentAmount;
                if (goal.accountId) {
                  const account = accounts.find((a) => a.id === goal.accountId);
                  if (account) {
                    currentAmount = account.balance;
                  }
                }

                const percentage = goal.targetAmount > 0 ? (currentAmount / goal.targetAmount) * 100 : 0;
                const remaining = goal.targetAmount - currentAmount;
                const isCompleted = currentAmount >= goal.targetAmount;
                const targetDate = new Date(goal.targetDate);
                const today = new Date();
                const daysRemaining = Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                const isOverdue = daysRemaining < 0 && !isCompleted;
                const progressColor = isCompleted
                  ? colors.success
                  : isOverdue
                    ? colors.error
                    : percentage >= 90
                      ? colors.success
                      : percentage >= 75
                        ? colors.info
                        : percentage >= 50
                          ? colors.warning
                          : colors.primary;

                return (
                  <Card key={goal.id} variant="default" padding="lg" style={styles.budgetCard}>
                    <TouchableOpacity
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        router.push(`/goals/add?id=${goal.id}`);
                      }}
                      activeOpacity={0.7}>
                      <View style={styles.budgetHeader}>
                        <View style={styles.budgetInfo}>
                          <View style={[styles.budgetIcon, { backgroundColor: goal.color + '20' }]}>
                            <ThemedText style={styles.budgetIconText}>{goal.icon || '🎯'}</ThemedText>
                          </View>
                          <View style={styles.budgetDetails}>
                            <ThemedText style={[Typography.bodyLarge, { color: colors.text, fontWeight: '600' }]}>
                              {goal.name}
                            </ThemedText>
                            {goal.description && (
                              <ThemedText style={[Typography.bodySmall, { color: colors.textSecondary }]}>
                                {goal.description}
                              </ThemedText>
                            )}
                          </View>
                        </View>
                      </View>

                      {/* Progress Bar */}
                      <View style={styles.progressContainer}>
                        <View style={[styles.progressBar, { backgroundColor: colors.backgroundSecondary }]}>
                          <View
                            style={[
                              styles.progressFill,
                              {
                                width: `${Math.min(percentage, 100)}%`,
                                backgroundColor: progressColor,
                              },
                            ]}
                          />
                        </View>
                        <View style={styles.progressInfo}>
                          <ThemedText style={[Typography.bodySmall, { color: colors.textSecondary }]}>
                            {percentage.toFixed(1)}% complete
                          </ThemedText>
                          {isCompleted ? (
                            <ThemedText style={[Typography.bodySmall, { color: colors.success }]}>
                              ✓ Completed!
                            </ThemedText>
                          ) : isOverdue ? (
                            <ThemedText style={[Typography.bodySmall, { color: colors.error }]}>Overdue</ThemedText>
                          ) : (
                            <ThemedText style={[Typography.bodySmall, { color: colors.textSecondary }]}>
                              {daysRemaining} days left
                            </ThemedText>
                          )}
                        </View>
                      </View>

                      {/* Amount Info */}
                      <View style={styles.amountInfo}>
                        <View style={styles.amountItem}>
                          <ThemedText style={[Typography.bodySmall, { color: colors.textTertiary }]}>Saved</ThemedText>
                          <ThemedText style={[Typography.bodyLarge, { color: colors.success, fontWeight: '600' }]}>
                            ₹{currentAmount.toFixed(2)}
                          </ThemedText>
                        </View>
                        <View style={styles.amountDivider} />
                        <View style={styles.amountItem}>
                          <ThemedText style={[Typography.bodySmall, { color: colors.textTertiary }]}>Target</ThemedText>
                          <ThemedText style={[Typography.bodyLarge, { color: colors.text, fontWeight: '600' }]}>
                            ₹{goal.targetAmount.toFixed(2)}
                          </ThemedText>
                        </View>
                        <View style={styles.amountDivider} />
                        <View style={styles.amountItem}>
                          <ThemedText style={[Typography.bodySmall, { color: colors.textTertiary }]}>Remaining</ThemedText>
                          <ThemedText
                            style={[
                              Typography.bodyLarge,
                              { color: remaining > 0 ? colors.text : colors.success, fontWeight: '600' },
                            ]}>
                            ₹{Math.max(0, remaining).toFixed(2)}
                          </ThemedText>
                        </View>
                      </View>
                    </TouchableOpacity>
                  </Card>
                );
              })
            )}
          </>
        )}

        {activeTab === 'planned' && (
          <>
            {plannedTransactions.filter((pt) => pt.status !== 'cancelled').length === 0 ? (
              <View style={[styles.emptyCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }, Shadows.sm]}>
                <View style={[styles.iconCircle, { backgroundColor: colors.backgroundSecondary }]}>
                  <MaterialIcons name="calendar-today" size={48} color={colors.primary} />
                </View>
                <ThemedText style={[Typography.h2, styles.emptyTitle, { color: colors.text }]}>
                  No Planned Transactions
                </ThemedText>
                <ThemedText style={[Typography.bodyMedium, styles.emptyDescription, { color: colors.textSecondary }]}>
                  Schedule your future transactions here!
                </ThemedText>
                <Button
                  title="Add Planned Transaction"
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.push('/planned-transactions/add');
                  }}
                  variant="primary"
                  size="medium"
                  style={styles.emptyButton}
                />
              </View>
            ) : (
              plannedTransactions
                .filter((pt) => pt.status !== 'cancelled')
                .sort((a, b) => {
                  const dateA = new Date(a.nextOccurrenceDate || a.scheduledDate).getTime();
                  const dateB = new Date(b.nextOccurrenceDate || b.scheduledDate).getTime();
                  return dateA - dateB;
                })
                .slice(0, 5)
                .map((plannedTransaction) => {
                  const scheduledDate = plannedTransaction.nextOccurrenceDate || plannedTransaction.scheduledDate;
                  const category = categories.find((c) => c.id === plannedTransaction.categoryId);
                  const isDue = new Date(scheduledDate) <= new Date();
                  const amountColor =
                    plannedTransaction.type === 'income'
                      ? colors.income
                      : plannedTransaction.type === 'expense'
                        ? colors.expense
                        : colors.transfer;

                  return (
                    <Card key={plannedTransaction.id} variant="default" padding="lg" style={styles.budgetCard}>
                      <TouchableOpacity
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          router.push(`/planned-transactions/add?id=${plannedTransaction.id}`);
                        }}
                        activeOpacity={0.7}>
                        <View style={styles.budgetHeader}>
                          <View style={styles.budgetInfo}>
                            <View style={[styles.budgetIcon, { backgroundColor: category?.color + '20' || colors.backgroundSecondary }]}>
                              <ThemedText style={styles.budgetIconText}>{category?.icon || '💰'}</ThemedText>
                            </View>
                            <View style={styles.budgetDetails}>
                              <ThemedText style={[Typography.bodyLarge, { color: colors.text, fontWeight: '600' }]}>
                                {plannedTransaction.description}
                              </ThemedText>
                              <ThemedText style={[Typography.bodySmall, { color: colors.textSecondary }]}>
                                {category?.name || 'Uncategorized'} • {formatDate(scheduledDate)}
                              </ThemedText>
                            </View>
                          </View>
                        </View>
                        <View style={styles.amountDateRow}>
                          <ThemedText style={[Typography.h4, { color: amountColor, fontWeight: '600' }]}>
                            {plannedTransaction.type === 'expense' ? '-' : plannedTransaction.type === 'income' ? '+' : ''}₹
                            {plannedTransaction.amount.toFixed(2)}
                          </ThemedText>
                          {isDue && (
                            <View style={[styles.dueBadge, { backgroundColor: colors.warning + '20' }]}>
                              <ThemedText style={[Typography.bodySmall, { color: colors.warning }]}>Due</ThemedText>
                            </View>
                          )}
                        </View>
                      </TouchableOpacity>
                    </Card>
                  );
                })
            )}
          </>
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
  },
  subtitle: {
    marginTop: Spacing.xs,
  },
  segmentedControl: {
    flexDirection: 'row',
    margin: Spacing.lg,
    gap: Spacing.sm,
  },
  segment: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.md,
    minHeight: ComponentSizes.minTouchTarget,
  },
  segmentActive: {
    borderWidth: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
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
    marginBottom: Spacing.xl,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  emptyTitle: {
    marginBottom: Spacing.md,
  },
  emptyDescription: {
    textAlign: 'center',
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  emptyButton: {
    minWidth: 200,
  },
  features: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  featureCard: {
    flex: 1,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    alignItems: 'center',
  },
  amountDateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dueBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
});
