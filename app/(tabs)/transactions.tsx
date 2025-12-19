/**
 * Statistics Dashboard Screen
 * Comprehensive financial statistics and insights
 */

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Card } from '@/components/ui/card';
import { CustomDateRangePicker } from '@/components/ui/custom-date-range-picker';
import { LineChart } from '@/components/ui/line-chart';
import { SimpleChart } from '@/components/ui/simple-chart';
import { BorderRadius, Colors, ComponentSizes, Spacing, Typography } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useFormatting } from '@/hooks/use-formatting';
import {
  calculateAccountStatistics,
  calculateCategoryPerformance,
  calculateDashboardStatistics,
  calculateSpendingVelocity,
  calculateTimeBasedStatistics,
  calculateTransactionFrequency,
  filterTransactions,
} from '@/utils/analytics-helpers';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function StatsScreen() {
  const { transactions, accounts, categories, loading, refreshData } = useApp();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();
  const { formatCurrency } = useFormatting();

  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | '1y' | 'all' | 'custom'>('30d');
  const [showCustomDateRange, setShowCustomDateRange] = useState(false);
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');

  // Calculate date range
  const dateRangeFilter = useMemo(() => {
    if (dateRange === 'all') {
      // Get all transaction dates
      if (transactions.length === 0) {
        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - 30);
        return {
          startDate: start.toISOString().split('T')[0],
          endDate: end.toISOString().split('T')[0],
        };
      }
      const allDates = transactions.map((t) => new Date(t.date));
      const minDate = new Date(Math.min(...allDates.map((d) => d.getTime())));
      const maxDate = new Date(Math.max(...allDates.map((d) => d.getTime())));
      return {
        startDate: minDate.toISOString().split('T')[0],
        endDate: maxDate.toISOString().split('T')[0],
      };
    }
    if (dateRange === 'custom' && customStartDate && customEndDate) {
      return {
        startDate: customStartDate,
        endDate: customEndDate,
      };
    }

    const endDate = new Date();
    const startDate = new Date();

    switch (dateRange) {
      case '7d':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(endDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(endDate.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
    }

    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
    };
  }, [dateRange, customStartDate, customEndDate, transactions]);

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    return filterTransactions(transactions, dateRangeFilter);
  }, [transactions, dateRangeFilter]);

  // Calculate comprehensive statistics
  const dashboardStats = useMemo(() => {
    if (!dateRangeFilter.startDate || !dateRangeFilter.endDate) {
      return null;
    }
    return calculateDashboardStatistics(
      filteredTransactions,
      accounts,
      categories,
      dateRangeFilter.startDate,
      dateRangeFilter.endDate
    );
  }, [filteredTransactions, accounts, categories, dateRangeFilter]);

  const spendingVelocity = useMemo(() => {
    if (!dateRangeFilter.startDate || !dateRangeFilter.endDate) return null;
    return calculateSpendingVelocity(
      filteredTransactions,
      dateRangeFilter.startDate,
      dateRangeFilter.endDate
    );
  }, [filteredTransactions, dateRangeFilter]);

  const transactionFrequency = useMemo(() => {
    if (!dateRangeFilter.startDate || !dateRangeFilter.endDate) return null;
    return calculateTransactionFrequency(
      filteredTransactions,
      dateRangeFilter.startDate,
      dateRangeFilter.endDate
    );
  }, [filteredTransactions, dateRangeFilter]);

  const categoryPerformance = useMemo(() => {
    if (!dateRangeFilter.startDate || !dateRangeFilter.endDate) return [];
    return calculateCategoryPerformance(
      filteredTransactions,
      categories,
      dateRangeFilter.startDate,
      dateRangeFilter.endDate
    ).slice(0, 5);
  }, [filteredTransactions, categories, dateRangeFilter]);

  const accountStats = useMemo(() => {
    return calculateAccountStatistics(filteredTransactions, accounts).slice(0, 5);
  }, [filteredTransactions, accounts]);

  const dailyStats = useMemo(() => {
    if (!dateRangeFilter.startDate || !dateRangeFilter.endDate) return [];
    return calculateTimeBasedStatistics(
      filteredTransactions,
      dateRangeFilter.startDate,
      dateRangeFilter.endDate,
      'daily'
    ).slice(-14); // Last 14 days
  }, [filteredTransactions, dateRangeFilter]);

  const weeklyStats = useMemo(() => {
    if (!dateRangeFilter.startDate || !dateRangeFilter.endDate) return [];
    return calculateTimeBasedStatistics(
      filteredTransactions,
      dateRangeFilter.startDate,
      dateRangeFilter.endDate,
      'weekly'
    ).slice(-8); // Last 8 weeks
  }, [filteredTransactions, dateRangeFilter]);

  const monthlyStats = useMemo(() => {
    if (!dateRangeFilter.startDate || !dateRangeFilter.endDate) return [];
    return calculateTimeBasedStatistics(
      filteredTransactions,
      dateRangeFilter.startDate,
      dateRangeFilter.endDate,
      'monthly'
    ).slice(-6); // Last 6 months
  }, [filteredTransactions, dateRangeFilter]);

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerContent}>
          <ThemedText style={[Typography.h1, { color: colors.text }]}>Statistics Dashboard</ThemedText>
          <ThemedText style={[Typography.bodyMedium, styles.subtitle, { color: colors.textSecondary }]}>
            Comprehensive financial insights
          </ThemedText>
        </View>
      </View>

      {/* Date Range Selector */}
      <View style={styles.dateRangeContainer}>
        {(['7d', '30d', '90d', '1y', 'all', 'custom'] as const).map((range) => (
          <TouchableOpacity
            key={range}
            style={[
              styles.dateRangeButton,
              {
                backgroundColor: dateRange === range ? colors.primary : 'transparent',
                borderColor: colors.border,
              },
            ]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              if (range === 'custom') {
                setShowCustomDateRange(true);
              } else {
                setDateRange(range);
              }
            }}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={
              range === 'all'
                ? 'Show all time'
                : range === 'custom'
                  ? 'Select custom date range'
                  : `Show ${range === '7d' ? '7 days' : range === '30d' ? '30 days' : range === '90d' ? '90 days' : '1 year'}`
            }
            accessibilityState={{ selected: dateRange === range }}>
            <ThemedText
              style={[
                styles.dateRangeText,
                {
                  color: dateRange === range ? '#FFFFFF' : colors.textSecondary,
                  fontWeight: dateRange === range ? '600' : '500',
                },
              ]}>
              {range === 'all' ? 'All' : range === 'custom' ? 'Custom' : range.toUpperCase()}
            </ThemedText>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: Spacing.xxxl + insets.bottom }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refreshData} />}>
        
        {/* Key Metrics Cards */}
        {spendingVelocity && transactionFrequency && (
          <View style={styles.metricsRow}>
            <Card variant="default" padding="md" style={styles.metricCard}>
              <View style={styles.metricHeader}>
                <MaterialIcons name="speed" size={20} color={colors.primary} />
                <ThemedText style={[Typography.labelSmall, { color: colors.textSecondary, marginLeft: Spacing.xs }]}>
                  Daily Avg
                </ThemedText>
              </View>
              <ThemedText style={[Typography.h3, { color: colors.text, marginTop: Spacing.xs }]}>
                {formatCurrency(spendingVelocity.dailyAverage)}
              </ThemedText>
              <View style={styles.trendIndicator}>
                <MaterialIcons
                  name={spendingVelocity.trend === 'increasing' ? 'trending-up' : spendingVelocity.trend === 'decreasing' ? 'trending-down' : 'trending-flat'}
                  size={14}
                  color={spendingVelocity.trend === 'increasing' ? colors.error : spendingVelocity.trend === 'decreasing' ? colors.success : colors.textSecondary}
                />
                <ThemedText
                  style={[
                    Typography.labelSmall,
                    {
                      color: spendingVelocity.trend === 'increasing' ? colors.error : spendingVelocity.trend === 'decreasing' ? colors.success : colors.textSecondary,
                      marginLeft: 4,
                    },
                  ]}>
                  {spendingVelocity.changePercent >= 0 ? '+' : ''}
                  {spendingVelocity.changePercent.toFixed(1)}%
                </ThemedText>
              </View>
            </Card>

            <Card variant="default" padding="md" style={styles.metricCard}>
              <View style={styles.metricHeader}>
                <MaterialIcons name="calendar-today" size={20} color={colors.info} />
                <ThemedText style={[Typography.labelSmall, { color: colors.textSecondary, marginLeft: Spacing.xs }]}>
                  Transactions/Day
                </ThemedText>
              </View>
              <ThemedText style={[Typography.h3, { color: colors.text, marginTop: Spacing.xs }]}>
                {transactionFrequency.averagePerDay.toFixed(1)}
              </ThemedText>
              <ThemedText style={[Typography.bodySmall, { color: colors.textSecondary, marginTop: Spacing.xs }]}>
                Most active: {transactionFrequency.mostActiveDay}
              </ThemedText>
            </Card>
          </View>
        )}

        {/* Spending Velocity */}
        {spendingVelocity && (
          <Card variant="default" padding="lg" style={styles.chartCard}>
            <ThemedText style={[Typography.h3, styles.chartTitle, { color: colors.text }]}>
              Spending Velocity
            </ThemedText>
            <View style={styles.velocityGrid}>
              <View style={[styles.velocityItem, { backgroundColor: colors.backgroundSecondary }]}>
                <ThemedText style={[Typography.labelSmall, { color: colors.textSecondary }]}>Daily</ThemedText>
                <ThemedText style={[Typography.h4, { color: colors.text, marginTop: Spacing.xs }]}>
                  {formatCurrency(spendingVelocity.dailyAverage)}
                </ThemedText>
              </View>
              <View style={[styles.velocityItem, { backgroundColor: colors.backgroundSecondary }]}>
                <ThemedText style={[Typography.labelSmall, { color: colors.textSecondary }]}>Weekly</ThemedText>
                <ThemedText style={[Typography.h4, { color: colors.text, marginTop: Spacing.xs }]}>
                  {formatCurrency(spendingVelocity.weeklyAverage)}
                </ThemedText>
              </View>
              <View style={[styles.velocityItem, { backgroundColor: colors.backgroundSecondary }]}>
                <ThemedText style={[Typography.labelSmall, { color: colors.textSecondary }]}>Monthly</ThemedText>
                <ThemedText style={[Typography.h4, { color: colors.text, marginTop: Spacing.xs }]}>
                  {formatCurrency(spendingVelocity.monthlyAverage)}
                </ThemedText>
              </View>
            </View>
          </Card>
        )}

        {/* Transaction Frequency */}
        {transactionFrequency && (
          <Card variant="default" padding="lg" style={styles.chartCard}>
            <ThemedText style={[Typography.h3, styles.chartTitle, { color: colors.text }]}>
              Transaction Frequency
            </ThemedText>
            <View style={styles.frequencyGrid}>
              <View style={styles.frequencyItem}>
                <ThemedText style={[Typography.labelMedium, { color: colors.textSecondary }]}>Total</ThemedText>
                <ThemedText style={[Typography.h3, { color: colors.text, marginTop: Spacing.xs }]}>
                  {transactionFrequency.totalTransactions}
                </ThemedText>
              </View>
              <View style={styles.frequencyItem}>
                <ThemedText style={[Typography.labelMedium, { color: colors.textSecondary }]}>Per Day</ThemedText>
                <ThemedText style={[Typography.h3, { color: colors.text, marginTop: Spacing.xs }]}>
                  {transactionFrequency.averagePerDay.toFixed(1)}
                </ThemedText>
              </View>
              <View style={styles.frequencyItem}>
                <ThemedText style={[Typography.labelMedium, { color: colors.textSecondary }]}>Per Week</ThemedText>
                <ThemedText style={[Typography.h3, { color: colors.text, marginTop: Spacing.xs }]}>
                  {transactionFrequency.averagePerWeek.toFixed(1)}
                </ThemedText>
              </View>
              <View style={styles.frequencyItem}>
                <ThemedText style={[Typography.labelMedium, { color: colors.textSecondary }]}>Per Month</ThemedText>
                <ThemedText style={[Typography.h3, { color: colors.text, marginTop: Spacing.xs }]}>
                  {transactionFrequency.averagePerMonth.toFixed(1)}
                </ThemedText>
              </View>
            </View>
            <View style={[styles.mostActiveDay, { backgroundColor: colors.primary + '20', marginTop: Spacing.md }]}>
              <MaterialIcons name="event" size={16} color={colors.primary} />
              <ThemedText style={[Typography.bodyMedium, { color: colors.primary, marginLeft: Spacing.xs }]}>
                Most active day: {transactionFrequency.mostActiveDay} ({transactionFrequency.mostActiveDayCount} transactions)
              </ThemedText>
            </View>
          </Card>
        )}

        {/* Category Performance */}
        {categoryPerformance.length > 0 && (
          <Card variant="default" padding="lg" style={styles.chartCard}>
            <ThemedText style={[Typography.h3, styles.chartTitle, { color: colors.text }]}>
              Category Performance
            </ThemedText>
            <View style={styles.categoryPerformanceList}>
              {categoryPerformance.map((category, index) => (
                <View
                  key={category.categoryId}
                  style={[
                    styles.categoryPerformanceItem,
                    {
                      borderBottomColor: colors.border,
                      borderBottomWidth: index < categoryPerformance.length - 1 ? 1 : 0,
                    },
                  ]}>
                  <View style={styles.categoryPerformanceLeft}>
                    <View style={[styles.categoryIconContainer, { backgroundColor: category.categoryColor + '20' }]}>
                      <ThemedText style={styles.categoryIcon}>{category.categoryIcon}</ThemedText>
                    </View>
                    <View style={styles.categoryPerformanceInfo}>
                      <ThemedText style={[Typography.bodyMedium, { color: colors.text, fontWeight: '600' }]}>
                        {category.categoryName}
                      </ThemedText>
                      <ThemedText style={[Typography.bodySmall, { color: colors.textSecondary }]}>
                        {category.transactionCount} transactions • Avg: {formatCurrency(category.averageAmount)}
                      </ThemedText>
                    </View>
                  </View>
                  <View style={styles.categoryPerformanceRight}>
                    <ThemedText style={[Typography.h4, { color: colors.text }]}>
                      {formatCurrency(category.totalSpent)}
                    </ThemedText>
                    <View style={styles.trendIndicator}>
                      <MaterialIcons
                        name={category.trend === 'increasing' ? 'trending-up' : category.trend === 'decreasing' ? 'trending-down' : 'trending-flat'}
                        size={12}
                        color={category.trend === 'increasing' ? colors.error : category.trend === 'decreasing' ? colors.success : colors.textSecondary}
                      />
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </Card>
        )}

        {/* Account Statistics */}
        {accountStats.length > 0 && (
          <Card variant="default" padding="lg" style={styles.chartCard}>
            <ThemedText style={[Typography.h3, styles.chartTitle, { color: colors.text }]}>
              Account Statistics
            </ThemedText>
            <View style={styles.accountStatsList}>
              {accountStats.map((account, index) => (
                <View
                  key={account.accountId}
                  style={[
                    styles.accountStatsItem,
                    {
                      borderBottomColor: colors.border,
                      borderBottomWidth: index < accountStats.length - 1 ? 1 : 0,
                    },
                  ]}>
                  <View style={styles.accountStatsLeft}>
                    <ThemedText style={[Typography.bodyMedium, { color: colors.text, fontWeight: '600' }]}>
                      {account.accountName}
                    </ThemedText>
                    <ThemedText style={[Typography.bodySmall, { color: colors.textSecondary }]}>
                      {account.transactionCount} transactions
                    </ThemedText>
                  </View>
                  <View style={styles.accountStatsRight}>
                    <View style={styles.accountStatsRow}>
                      <ThemedText style={[Typography.bodySmall, { color: colors.success }]}>
                        +{formatCurrency(account.totalIncome)}
                      </ThemedText>
                      <ThemedText style={[Typography.bodySmall, { color: colors.error, marginLeft: Spacing.sm }]}>
                        -{formatCurrency(account.totalExpense)}
                      </ThemedText>
                    </View>
                    <ThemedText
                      style={[
                        Typography.bodyMedium,
                        {
                          color: account.netFlow >= 0 ? colors.success : colors.error,
                          fontWeight: '600',
                          marginTop: Spacing.xs,
                        },
                      ]}>
                      Net: {formatCurrency(account.netFlow)}
                    </ThemedText>
                  </View>
                </View>
              ))}
            </View>
          </Card>
        )}

        {/* Daily Statistics Chart */}
        {dailyStats.length > 0 && (
          <Card variant="default" padding="lg" style={styles.chartCard}>
            <ThemedText style={[Typography.h3, styles.chartTitle, { color: colors.text }]}>
              Daily Spending (Last 14 Days)
            </ThemedText>
            <SimpleChart
              data={dailyStats.map((stat) => ({
                label: stat.periodLabel,
                value: stat.expense,
                color: colors.error,
              }))}
              height={180}
              showValues={false}
            />
            <View style={styles.statsList}>
              {dailyStats.slice(-7).map((stat, index) => (
                <View
                  key={stat.period}
                  style={[
                    styles.statsItem,
                    {
                      borderBottomColor: colors.border,
                      borderBottomWidth: index < Math.min(7, dailyStats.length) - 1 ? 1 : 0,
                    },
                  ]}>
                  <ThemedText style={[Typography.bodySmall, { color: colors.text }]}>
                    {stat.periodLabel}
                  </ThemedText>
                  <View style={styles.statsAmounts}>
                    <ThemedText style={[Typography.bodySmall, { color: colors.error }]}>
                      {formatCurrency(stat.expense)}
                    </ThemedText>
                    <ThemedText style={[Typography.bodySmall, { color: colors.textSecondary, marginLeft: Spacing.sm }]}>
                      {stat.transactionCount} txns
                    </ThemedText>
                  </View>
                </View>
              ))}
            </View>
          </Card>
        )}

        {/* Weekly Statistics Chart */}
        {weeklyStats.length > 0 && (
          <Card variant="default" padding="lg" style={styles.chartCard}>
            <ThemedText style={[Typography.h3, styles.chartTitle, { color: colors.text }]}>
              Weekly Spending
            </ThemedText>
            <SimpleChart
              data={weeklyStats.map((stat) => ({
                label: stat.periodLabel.split(' - ')[0],
                value: stat.expense,
                color: colors.error,
              }))}
              height={180}
              showValues={false}
            />
            <View style={styles.statsList}>
              {weeklyStats.slice(-4).map((stat, index) => (
                <View
                  key={stat.period}
                  style={[
                    styles.statsItem,
                    {
                      borderBottomColor: colors.border,
                      borderBottomWidth: index < Math.min(4, weeklyStats.length) - 1 ? 1 : 0,
                    },
                  ]}>
                  <ThemedText style={[Typography.bodySmall, { color: colors.text }]}>
                    {stat.periodLabel}
                  </ThemedText>
                  <View style={styles.statsAmounts}>
                    <ThemedText style={[Typography.bodySmall, { color: colors.error }]}>
                      {formatCurrency(stat.expense)}
                    </ThemedText>
                    <ThemedText style={[Typography.bodySmall, { color: colors.textSecondary, marginLeft: Spacing.sm }]}>
                      Avg/day: {formatCurrency(stat.averagePerDay)}
                    </ThemedText>
                  </View>
                </View>
              ))}
            </View>
          </Card>
        )}

        {/* Monthly Statistics Chart */}
        {monthlyStats.length > 0 && (
          <Card variant="default" padding="lg" style={styles.chartCard}>
            <ThemedText style={[Typography.h3, styles.chartTitle, { color: colors.text }]}>
              Monthly Spending
            </ThemedText>
            <LineChart
              data={monthlyStats.map((stat) => ({
                label: stat.periodLabel,
                value: stat.expense,
              }))}
              height={180}
              showValues={false}
              showDots={true}
            />
            <View style={styles.statsList}>
              {monthlyStats.map((stat, index) => (
                <View
                  key={stat.period}
                  style={[
                    styles.statsItem,
                    {
                      borderBottomColor: colors.border,
                      borderBottomWidth: index < monthlyStats.length - 1 ? 1 : 0,
                    },
                  ]}>
                  <ThemedText style={[Typography.bodyMedium, { color: colors.text }]}>
                    {stat.periodLabel}
                  </ThemedText>
                  <View style={styles.statsAmounts}>
                    <ThemedText style={[Typography.bodySmall, { color: colors.success }]}>
                      +{formatCurrency(stat.income)}
                    </ThemedText>
                    <ThemedText style={[Typography.bodySmall, { color: colors.error, marginLeft: Spacing.sm }]}>
                      -{formatCurrency(stat.expense)}
                    </ThemedText>
                    <ThemedText
                      style={[
                        Typography.bodyMedium,
                        {
                          color: stat.net >= 0 ? colors.success : colors.error,
                          fontWeight: '600',
                          marginLeft: Spacing.sm,
                        },
                      ]}>
                      {formatCurrency(stat.net)}
                    </ThemedText>
                  </View>
                </View>
              ))}
            </View>
          </Card>
        )}

        {/* Insights */}
        {dashboardStats && dashboardStats.insights.length > 0 && (
          <Card variant="default" padding="lg" style={styles.chartCard}>
            <View style={styles.insightsHeader}>
              <MaterialIcons name="lightbulb" size={24} color={colors.warning} />
              <ThemedText style={[Typography.h3, { color: colors.text, marginLeft: Spacing.sm }]}>
                Insights
              </ThemedText>
            </View>
            <View style={styles.insightsList}>
              {dashboardStats.insights.map((insight, index) => (
                <View key={index} style={[styles.insightItem, { backgroundColor: colors.backgroundSecondary }]}>
                  <MaterialIcons name="info" size={16} color={colors.info} />
                  <ThemedText style={[Typography.bodyMedium, { color: colors.text, marginLeft: Spacing.sm, flex: 1 }]}>
                    {insight}
                  </ThemedText>
                </View>
              ))}
            </View>
          </Card>
        )}

        {/* Empty State */}
        {filteredTransactions.length === 0 && (
          <Card variant="default" padding="lg" style={styles.emptyCard}>
            <MaterialIcons name="bar-chart" size={64} color={colors.textTertiary} />
            <ThemedText style={[Typography.h3, styles.emptyText, { color: colors.text }]}>
              No data available
            </ThemedText>
            <ThemedText style={[Typography.bodyMedium, styles.emptySubtext, { color: colors.textSecondary }]}>
              Try adjusting your date range
            </ThemedText>
          </Card>
        )}
      </ScrollView>

      {/* Custom Date Range Modal */}
      <CustomDateRangePicker
        visible={showCustomDateRange}
        onClose={() => setShowCustomDateRange(false)}
        onApply={(startDate, endDate) => {
          setCustomStartDate(startDate);
          setCustomEndDate(endDate);
          setDateRange('custom');
        }}
        currentStartDate={customStartDate}
        currentEndDate={customEndDate}
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
  },
  headerContent: {
    flex: 1,
  },
  subtitle: {
    marginTop: Spacing.xs,
  },
  dateRangeContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  dateRangeButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    minHeight: ComponentSizes.minTouchTarget,
  },
  dateRangeText: {
    fontSize: 12,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
    paddingTop: 0,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  metricCard: {
    flex: 1,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  chartCard: {
    marginBottom: Spacing.lg,
  },
  chartTitle: {
    marginBottom: Spacing.lg,
    fontWeight: '600',
  },
  velocityGrid: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  velocityItem: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  frequencyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  frequencyItem: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    padding: Spacing.md,
  },
  mostActiveDay: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  categoryPerformanceList: {
    marginTop: Spacing.md,
  },
  categoryPerformanceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  categoryPerformanceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIconContainer: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  categoryIcon: {
    fontSize: 20,
  },
  categoryPerformanceInfo: {
    flex: 1,
  },
  categoryPerformanceRight: {
    alignItems: 'flex-end',
  },
  accountStatsList: {
    marginTop: Spacing.md,
  },
  accountStatsItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  accountStatsLeft: {
    flex: 1,
  },
  accountStatsRight: {
    alignItems: 'flex-end',
  },
  accountStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statsList: {
    marginTop: Spacing.lg,
  },
  statsItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  statsAmounts: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  insightsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  insightsList: {
    gap: Spacing.md,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 280,
    marginTop: Spacing.xl,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  emptySubtext: {
    textAlign: 'center',
  },
});
