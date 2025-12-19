/**
 * Reports & Analytics Screen
 */

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Card } from '@/components/ui/card';
import { CustomDateRangePicker } from '@/components/ui/custom-date-range-picker';
import { LineChart } from '@/components/ui/line-chart';
import { PieChart } from '@/components/ui/pie-chart';
import { SimpleChart } from '@/components/ui/simple-chart';
import { TransactionFilters, type TransactionFiltersType } from '@/components/ui/transaction-filters';
import { BorderRadius, Colors, ComponentSizes, Spacing, Typography } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useFormatting } from '@/hooks/use-formatting';
import { useStocks } from '@/hooks/use-stocks';
import {
    calculateAccountSpending,
    calculateBalanceTrend,
    calculateBudgetChart,
    calculateCashFlow,
    calculateCategorySpending,
    calculateCategoryTrends,
    calculateInvestmentPortfolio,
    calculateLabelSpending,
    calculateMonthlyTrends,
    calculatePlannedPayments,
    calculateSpendingPredictions,
    calculateSummary,
    calculateYearOverYearComparison,
    filterTransactions,
    type CategorySpending,
    type LabelSpending,
} from '@/utils/analytics-helpers';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ReportsScreen() {
  const { transactions, accounts, categories, labels, budgets, plannedTransactions, loading, refreshData } = useApp();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | '1y' | 'all' | 'custom'>('30d');
  const [showFilters, setShowFilters] = useState(false);
  const [showCustomDateRange, setShowCustomDateRange] = useState(false);
  const [filters, setFilters] = useState<TransactionFiltersType>({});
  const [expenseView, setExpenseView] = useState<'category' | 'label'>('category');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');

  // Memoize filter keys count to avoid recalculating
  const activeFiltersCount = useMemo(() => Object.keys(filters).length, [filters]);
  const hasActiveFilters = useMemo(() => activeFiltersCount > 0, [activeFiltersCount]);

  const { formatCurrency } = useFormatting();
  const { getStockBalance } = useStocks(accounts);

  // Calculate date range
  const dateRangeFilter = useMemo(() => {
    if (dateRange === 'all') return {};
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
  }, [dateRange, customStartDate, customEndDate]);

  // Get actual start and end dates for YoY comparison
  const actualDateRange = useMemo(() => {
    if (dateRange === 'all') {
      const allDates = transactions.map((t) => new Date(t.date));
      if (allDates.length === 0) {
        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - 30);
        return { startDate: start.toISOString().split('T')[0], endDate: end.toISOString().split('T')[0] };
      }
      const minDate = new Date(Math.min(...allDates.map((d) => d.getTime())));
      const maxDate = new Date(Math.max(...allDates.map((d) => d.getTime())));
      return { startDate: minDate.toISOString().split('T')[0], endDate: maxDate.toISOString().split('T')[0] };
    }
    return dateRangeFilter;
  }, [dateRange, dateRangeFilter, transactions]);

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    return filterTransactions(transactions, { ...filters, ...dateRangeFilter });
  }, [transactions, filters, dateRangeFilter]);

  // Calculate analytics
  const summary = useMemo(() => calculateSummary(filteredTransactions), [filteredTransactions]);
  const categorySpending = useMemo(
    () => calculateCategorySpending(filteredTransactions, categories, 'expense'),
    [filteredTransactions, categories]
  );
  const labelSpending = useMemo(
    () => calculateLabelSpending(filteredTransactions, labels, 'expense'),
    [filteredTransactions, labels]
  );
  const monthlyTrends = useMemo(() => calculateMonthlyTrends(filteredTransactions, 6), [filteredTransactions]);
  const accountSpending = useMemo(
    () => calculateAccountSpending(filteredTransactions, accounts, 'expense'),
    [filteredTransactions, accounts]
  );
  
  // New analytics
  const balanceTrend = useMemo(() => {
    const days = dateRange === 'all' ? 90 : dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : dateRange === '90d' ? 90 : 365;
    return calculateBalanceTrend(transactions, accounts, days);
  }, [transactions, accounts, dateRange]);
  
  const cashFlow = useMemo(() => {
    const days = dateRange === 'all' ? 90 : dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : dateRange === '90d' ? 90 : 365;
    return calculateCashFlow(filteredTransactions, days);
  }, [filteredTransactions, dateRange]);
  
  const investmentPortfolio = useMemo(() => {
    // Include stock balances with live prices
    const accountsWithStockPrices = accounts.map((acc) => {
      if (acc.type === 'Stocks') {
        return { ...acc, balance: getStockBalance(acc) };
      }
      return acc;
    });
    return calculateInvestmentPortfolio(accountsWithStockPrices);
  }, [accounts, getStockBalance]);
  
  const budgetChart = useMemo(
    () => calculateBudgetChart(budgets, transactions, categories),
    [budgets, transactions, categories]
  );
  
  const plannedPayments = useMemo(
    () => calculatePlannedPayments(plannedTransactions, 6),
    [plannedTransactions]
  );

  // Year-over-Year Comparison
  const yearOverYear = useMemo(() => {
    if (!actualDateRange.startDate || !actualDateRange.endDate) return null;
    return calculateYearOverYearComparison(transactions, actualDateRange.startDate, actualDateRange.endDate);
  }, [transactions, actualDateRange]);

  // Category Trends
  const categoryTrends = useMemo(() => {
    if (!actualDateRange.startDate || !actualDateRange.endDate) return [];
    return calculateCategoryTrends(
      filteredTransactions,
      categories,
      actualDateRange.startDate,
      actualDateRange.endDate,
      'monthly'
    ).slice(0, 5); // Top 5 categories
  }, [filteredTransactions, categories, actualDateRange]);

  // Spending Predictions
  const spendingPredictions = useMemo(() => {
    if (!actualDateRange.startDate || !actualDateRange.endDate) return [];
    return calculateSpendingPredictions(transactions, actualDateRange.startDate, actualDateRange.endDate, 3);
  }, [transactions, actualDateRange]);

  // Prepare chart data
  const expenseChartData = useMemo(() => {
    if (expenseView === 'category') {
      return categorySpending.slice(0, 5).map((item) => ({
        label: item.categoryName,
        value: item.amount,
        color: item.categoryColor,
      }));
    } else {
      return labelSpending.slice(0, 5).map((item) => ({
        label: item.labelName,
        value: item.amount,
        color: item.labelColor,
      }));
    }
  }, [expenseView, categorySpending, labelSpending]);
  
  const expenseSpendingData = expenseView === 'category' ? categorySpending : labelSpending;

  const monthlyChartData = useMemo(() => {
    return monthlyTrends.map((trend) => ({
      label: trend.monthLabel.split(' ')[0], // Just month name
      value: Math.abs(trend.expense),
      color: colors.error,
    }));
  }, [monthlyTrends, colors]);

  const accountChartData = useMemo(() => {
    return accountSpending.slice(0, 5).map((item) => ({
      label: item.accountName,
      value: item.amount,
      color: colors.primary,
    }));
  }, [accountSpending, colors]);

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerContent}>
          <ThemedText style={[Typography.h1, { color: colors.text }]}>Reports & Analytics</ThemedText>
        </View>
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setShowFilters(true);
          }}
          style={[
            styles.filterButton,
            {
              backgroundColor: hasActiveFilters ? colors.primary : colors.cardBackground,
              borderColor: hasActiveFilters ? colors.primary : colors.border,
            },
          ]}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={hasActiveFilters ? `Filters active, ${activeFiltersCount} filter${activeFiltersCount !== 1 ? 's' : ''}` : 'Open filters'}
          accessibilityHint="Opens the filter options to refine your reports">
          <MaterialIcons
            name="filter-list"
            size={ComponentSizes.iconSmall}
            color={hasActiveFilters ? '#FFFFFF' : colors.textSecondary}
          />
        </TouchableOpacity>
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
        {/* Summary Cards */}
        <View style={styles.summaryRow}>
          <Card variant="default" padding="md" style={styles.summaryCard}>
            <ThemedText style={[styles.summaryLabel, { color: colors.textSecondary }]}>Income</ThemedText>
            <ThemedText style={[styles.summaryValue, { color: colors.success }]}>
              {formatCurrency(summary.totalIncome)}
            </ThemedText>
          </Card>
          <Card variant="default" padding="md" style={styles.summaryCard}>
            <ThemedText style={[styles.summaryLabel, { color: colors.textSecondary }]}>Expense</ThemedText>
            <ThemedText style={[styles.summaryValue, { color: colors.error }]}>
              {formatCurrency(summary.totalExpense)}
            </ThemedText>
          </Card>
        </View>

        <View style={styles.summaryRow}>
          <Card variant="default" padding="md" style={styles.summaryCard}>
            <ThemedText style={[styles.summaryLabel, { color: colors.textSecondary }]}>Net</ThemedText>
            <ThemedText
              style={[
                styles.summaryValue,
                { color: summary.net >= 0 ? colors.success : colors.error },
              ]}>
              {formatCurrency(summary.net)}
            </ThemedText>
          </Card>
          <Card variant="default" padding="md" style={styles.summaryCard}>
            <ThemedText style={[styles.summaryLabel, { color: colors.textSecondary }]}>Savings Rate</ThemedText>
            <ThemedText style={[styles.summaryValue, { color: colors.primary }]}>
              {summary.savingsRate.toFixed(1)}%
            </ThemedText>
          </Card>
        </View>

        {/* Year-over-Year Comparison */}
        {yearOverYear && actualDateRange.startDate && actualDateRange.endDate && (
          <Card variant="default" padding="lg" style={styles.chartCard}>
            <ThemedText style={[Typography.h3, styles.chartTitle, { color: colors.text }]}>
              Year-over-Year Comparison
            </ThemedText>
            <View style={styles.yoyContainer}>
              <View style={styles.yoyRow}>
                <View style={styles.yoyColumn}>
                  <ThemedText style={[Typography.bodySmall, { color: colors.textSecondary }]}>Current Period</ThemedText>
                  <ThemedText style={[Typography.h4, { color: colors.text, marginTop: Spacing.xs }]}>
                    Income: {formatCurrency(yearOverYear.currentPeriod.income)}
                  </ThemedText>
                  <ThemedText style={[Typography.h4, { color: colors.text }]}>
                    Expense: {formatCurrency(yearOverYear.currentPeriod.expense)}
                  </ThemedText>
                  <ThemedText
                    style={[
                      Typography.h4,
                      {
                        color: yearOverYear.currentPeriod.net >= 0 ? colors.success : colors.error,
                        marginTop: Spacing.xs,
                      },
                    ]}>
                    Net: {formatCurrency(yearOverYear.currentPeriod.net)}
                  </ThemedText>
                </View>
                <View style={styles.yoyColumn}>
                  <ThemedText style={[Typography.bodySmall, { color: colors.textSecondary }]}>Previous Period</ThemedText>
                  <ThemedText style={[Typography.h4, { color: colors.text, marginTop: Spacing.xs }]}>
                    Income: {formatCurrency(yearOverYear.previousPeriod.income)}
                  </ThemedText>
                  <ThemedText style={[Typography.h4, { color: colors.text }]}>
                    Expense: {formatCurrency(yearOverYear.previousPeriod.expense)}
                  </ThemedText>
                  <ThemedText
                    style={[
                      Typography.h4,
                      {
                        color: yearOverYear.previousPeriod.net >= 0 ? colors.success : colors.error,
                        marginTop: Spacing.xs,
                      },
                    ]}>
                    Net: {formatCurrency(yearOverYear.previousPeriod.net)}
                  </ThemedText>
                </View>
              </View>
              <View style={[styles.yoyChanges, { backgroundColor: colors.backgroundSecondary, marginTop: Spacing.md }]}>
                <ThemedText style={[Typography.bodyMedium, { color: colors.textSecondary, marginBottom: Spacing.sm }]}>
                  Changes
                </ThemedText>
                <View style={styles.yoyChangeRow}>
                  <View style={styles.yoyChangeItem}>
                    <ThemedText style={[Typography.bodySmall, { color: colors.textSecondary }]}>Income</ThemedText>
                    <ThemedText
                      style={[
                        Typography.bodyLarge,
                        {
                          color: yearOverYear.changes.incomeChange >= 0 ? colors.success : colors.error,
                          fontWeight: '600',
                        },
                      ]}>
                      {yearOverYear.changes.incomeChange >= 0 ? '+' : ''}
                      {formatCurrency(yearOverYear.changes.incomeChange)} (
                      {yearOverYear.changes.incomeChangePercent.toFixed(1)}%)
                    </ThemedText>
                  </View>
                  <View style={styles.yoyChangeItem}>
                    <ThemedText style={[Typography.bodySmall, { color: colors.textSecondary }]}>Expense</ThemedText>
                    <ThemedText
                      style={[
                        Typography.bodyLarge,
                        {
                          color: yearOverYear.changes.expenseChange >= 0 ? colors.error : colors.success,
                          fontWeight: '600',
                        },
                      ]}>
                      {yearOverYear.changes.expenseChange >= 0 ? '+' : ''}
                      {formatCurrency(yearOverYear.changes.expenseChange)} (
                      {yearOverYear.changes.expenseChangePercent.toFixed(1)}%)
                    </ThemedText>
                  </View>
                  <View style={styles.yoyChangeItem}>
                    <ThemedText style={[Typography.bodySmall, { color: colors.textSecondary }]}>Net</ThemedText>
                    <ThemedText
                      style={[
                        Typography.bodyLarge,
                        {
                          color: yearOverYear.changes.netChange >= 0 ? colors.success : colors.error,
                          fontWeight: '600',
                        },
                      ]}>
                      {yearOverYear.changes.netChange >= 0 ? '+' : ''}
                      {formatCurrency(yearOverYear.changes.netChange)} (
                      {yearOverYear.changes.netChangePercent.toFixed(1)}%)
                    </ThemedText>
                  </View>
                </View>
              </View>
            </View>
          </Card>
        )}

        {/* Category Trends */}
        {categoryTrends.length > 0 && (
          <Card variant="default" padding="lg" style={styles.chartCard}>
            <ThemedText style={[Typography.h3, styles.chartTitle, { color: colors.text }]}>
              Category Trends
            </ThemedText>
            <LineChart
              lines={categoryTrends.slice(0, 3).map((trend) => ({
                data: trend.periods.map((p) => ({ label: p.periodLabel, value: p.amount })),
                color: trend.categoryColor,
                label: trend.categoryName,
              }))}
              height={200}
              showValues={false}
              showDots={true}
            />
            <View style={styles.categoryTrendList}>
              {categoryTrends.map((trend, index) => (
                <View
                  key={trend.categoryId}
                  style={[
                    styles.categoryTrendItem,
                    {
                      borderBottomColor: colors.border,
                      borderBottomWidth: index < categoryTrends.length - 1 ? 1 : 0,
                    },
                  ]}>
                  <View style={styles.categoryTrendLeft}>
                    <ThemedText style={styles.categoryIcon}>{trend.categoryIcon}</ThemedText>
                    <View>
                      <ThemedText style={[Typography.bodyMedium, { color: colors.text }]}>
                        {trend.categoryName}
                      </ThemedText>
                      <ThemedText style={[Typography.bodySmall, { color: colors.textSecondary }]}>
                        Avg: {formatCurrency(trend.averageAmount)}
                      </ThemedText>
                    </View>
                  </View>
                  <View style={styles.categoryTrendRight}>
                    <View
                      style={[
                        styles.trendBadge,
                        {
                          backgroundColor:
                            trend.trend === 'increasing'
                              ? colors.error + '20'
                              : trend.trend === 'decreasing'
                                ? colors.success + '20'
                                : colors.textTertiary + '20',
                        },
                      ]}>
                      <MaterialIcons
                        name={
                          trend.trend === 'increasing'
                            ? 'trending-up'
                            : trend.trend === 'decreasing'
                              ? 'trending-down'
                              : 'trending-flat'
                        }
                        size={16}
                        color={
                          trend.trend === 'increasing'
                            ? colors.error
                            : trend.trend === 'decreasing'
                              ? colors.success
                              : colors.textSecondary
                        }
                      />
                      <ThemedText
                        style={[
                          Typography.bodySmall,
                          {
                            color:
                              trend.trend === 'increasing'
                                ? colors.error
                                : trend.trend === 'decreasing'
                                  ? colors.success
                                  : colors.textSecondary,
                            marginLeft: Spacing.xs,
                          },
                        ]}>
                        {trend.changePercent >= 0 ? '+' : ''}
                        {trend.changePercent.toFixed(1)}%
                      </ThemedText>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </Card>
        )}

        {/* Spending Predictions */}
        {spendingPredictions.length > 0 && (
          <Card variant="default" padding="lg" style={styles.chartCard}>
            <View style={styles.chartHeader}>
              <ThemedText style={[Typography.h3, styles.chartTitle, { color: colors.text }]}>
                Spending Predictions
              </ThemedText>
              <View
                style={[
                  styles.confidenceBadge,
                  {
                    backgroundColor:
                      spendingPredictions[0]?.confidence === 'high'
                        ? colors.success + '20'
                        : spendingPredictions[0]?.confidence === 'medium'
                          ? colors.warning + '20'
                          : colors.error + '20',
                  },
                ]}>
                <ThemedText
                  style={[
                    Typography.labelSmall,
                    {
                      color:
                        spendingPredictions[0]?.confidence === 'high'
                          ? colors.success
                          : spendingPredictions[0]?.confidence === 'medium'
                            ? colors.warning
                            : colors.error,
                    },
                  ]}>
                  {spendingPredictions[0]?.confidence === 'high'
                    ? 'High Confidence'
                    : spendingPredictions[0]?.confidence === 'medium'
                      ? 'Medium Confidence'
                      : 'Low Confidence'}
                </ThemedText>
              </View>
            </View>
            <SimpleChart
              data={spendingPredictions.map((p) => ({
                label: p.periodLabel.split(' ')[0],
                value: p.predictedExpense,
                color: colors.error,
              }))}
              height={180}
              showValues={true}
            />
            <View style={styles.predictionList}>
              {spendingPredictions.map((prediction, index) => (
                <View
                  key={prediction.period}
                  style={[
                    styles.predictionItem,
                    {
                      borderBottomColor: colors.border,
                      borderBottomWidth: index < spendingPredictions.length - 1 ? 1 : 0,
                    },
                  ]}>
                  <ThemedText style={[Typography.bodyMedium, { color: colors.text }]}>
                    {prediction.periodLabel}
                  </ThemedText>
                  <View style={styles.predictionAmounts}>
                    <ThemedText style={[Typography.bodySmall, { color: colors.success }]}>
                      Income: {formatCurrency(prediction.predictedIncome)}
                    </ThemedText>
                    <ThemedText style={[Typography.bodySmall, { color: colors.error }]}>
                      Expense: {formatCurrency(prediction.predictedExpense)}
                    </ThemedText>
                    <ThemedText
                      style={[
                        Typography.bodyMedium,
                        {
                          color: prediction.predictedNet >= 0 ? colors.success : colors.error,
                          fontWeight: '600',
                          marginTop: Spacing.xs,
                        },
                      ]}>
                      Net: {formatCurrency(prediction.predictedNet)}
                    </ThemedText>
                  </View>
                </View>
              ))}
            </View>
          </Card>
        )}

        {/* Balance Trend */}
        {balanceTrend.length > 0 && (
          <Card variant="default" padding="lg" style={styles.chartCard}>
            <ThemedText style={[Typography.h3, styles.chartTitle, { color: colors.text }]}>
              Balance Trend
            </ThemedText>
            <LineChart
              data={balanceTrend.map((t) => ({ label: t.dateLabel, value: t.balance }))}
              height={180}
              showValues={true}
              showDots={true}
            />
            <View style={styles.trendList}>
              <View style={styles.trendItem}>
                <ThemedText style={[styles.trendMonth, { color: colors.textSecondary }]}>Current</ThemedText>
                <ThemedText style={[styles.trendNet, { color: colors.success }]}>
                  {formatCurrency(balanceTrend[balanceTrend.length - 1]?.balance || 0)}
                </ThemedText>
              </View>
            </View>
          </Card>
        )}

        {/* Cash Flow */}
        {cashFlow.length > 0 && (
          <Card variant="default" padding="lg" style={styles.chartCard}>
            <ThemedText style={[Typography.h3, styles.chartTitle, { color: colors.text }]}>
              Cash Flow
            </ThemedText>
            <LineChart
              lines={[
                {
                  data: cashFlow.map((cf) => ({ label: cf.dateLabel, value: cf.income })),
                  color: colors.success,
                  label: 'Income',
                },
                {
                  data: cashFlow.map((cf) => ({ label: cf.dateLabel, value: cf.expense })),
                  color: colors.error,
                  label: 'Expense',
                },
              ]}
              height={180}
              showValues={false}
              showDots={true}
            />
            <View style={styles.trendList}>
              {cashFlow.slice(-5).map((cf, index) => (
                <View key={cf.date} style={[styles.trendItem, { borderBottomColor: colors.border, borderBottomWidth: index < Math.min(5, cashFlow.length) - 1 ? 1 : 0 }]}>
                  <ThemedText style={[styles.trendMonth, { color: colors.text }]}>{cf.dateLabel}</ThemedText>
                  <View style={styles.trendAmounts}>
                    <ThemedText style={[styles.trendIncome, { color: colors.success }]}>
                      +{formatCurrency(cf.income)}
                    </ThemedText>
                    <ThemedText style={[styles.trendExpense, { color: colors.error }]}>
                      -{formatCurrency(cf.expense)}
                    </ThemedText>
                  </View>
                </View>
              ))}
            </View>
          </Card>
        )}

        {/* Spending by Category/Label */}
        {expenseChartData.length > 0 && (
          <Card variant="default" padding="lg" style={styles.chartCard}>
            <View style={styles.chartHeader}>
              <ThemedText style={[Typography.h3, styles.chartTitle, { color: colors.text }]}>
                Expense Breakdown
              </ThemedText>
              <View style={styles.viewToggle}>
                <TouchableOpacity
                  style={[
                    styles.toggleButton,
                    {
                      backgroundColor: expenseView === 'category' ? colors.primary : 'transparent',
                      borderColor: colors.border,
                    },
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setExpenseView('category');
                  }}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel="View expenses by category"
                  accessibilityState={{ selected: expenseView === 'category' }}>
                  <ThemedText
                    style={[
                      styles.toggleText,
                      { color: expenseView === 'category' ? '#FFFFFF' : colors.textSecondary },
                    ]}>
                    Category
                  </ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.toggleButton,
                    {
                      backgroundColor: expenseView === 'label' ? colors.primary : 'transparent',
                      borderColor: colors.border,
                    },
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setExpenseView('label');
                  }}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel="View expenses by label"
                  accessibilityState={{ selected: expenseView === 'label' }}>
                  <ThemedText
                    style={[
                      styles.toggleText,
                      { color: expenseView === 'label' ? '#FFFFFF' : colors.textSecondary },
                    ]}>
                    Label
                  </ThemedText>
                </TouchableOpacity>
              </View>
            </View>
            <PieChart data={expenseChartData} size={220} showLegend={true} />
            <View style={styles.categoryList}>
              {expenseSpendingData.slice(0, 5).map((item, index) => {
                const categoryItem = expenseView === 'category' ? item as CategorySpending : null;
                const labelItem = expenseView === 'label' ? item as LabelSpending : null;
                const itemKey = categoryItem?.categoryId || labelItem?.labelId || `item-${index}`;
                
                return (
                  <View
                    key={itemKey}
                    style={[
                      styles.categoryItem,
                      {
                        borderBottomColor: colors.border,
                        borderBottomWidth: index < expenseSpendingData.slice(0, 5).length - 1 ? 1 : 0,
                      },
                    ]}>
                    <View style={styles.categoryItemLeft}>
                      {categoryItem && (
                        <ThemedText style={styles.categoryIcon}>{categoryItem.categoryIcon}</ThemedText>
                      )}
                      <ThemedText style={[styles.categoryName, { color: colors.text }]}>
                        {categoryItem?.categoryName || labelItem?.labelName || 'Unknown'}
                      </ThemedText>
                    </View>
                    <View style={styles.categoryItemRight}>
                      <ThemedText style={[styles.categoryAmount, { color: colors.text }]}>
                        {formatCurrency(item.amount)}
                      </ThemedText>
                      <ThemedText style={[styles.categoryPercentage, { color: colors.textSecondary }]}>
                        {item.percentage.toFixed(1)}%
                      </ThemedText>
                    </View>
                  </View>
                );
              })}
            </View>
          </Card>
        )}

        {/* Monthly Trends */}
        {monthlyChartData.length > 0 && (
          <Card variant="default" padding="lg" style={styles.chartCard}>
            <ThemedText style={[Typography.h3, styles.chartTitle, { color: colors.text }]}>
              Monthly Trends
            </ThemedText>
            <SimpleChart data={monthlyChartData} height={180} showValues={true} />
            <View style={styles.trendList}>
              {monthlyTrends.map((trend, index) => (
                <View key={trend.month} style={[styles.trendItem, { borderBottomColor: colors.border, borderBottomWidth: index < monthlyTrends.length - 1 ? 1 : 0 }]}>
                  <ThemedText style={[styles.trendMonth, { color: colors.text }]}>
                    {trend.monthLabel}
                  </ThemedText>
                  <View style={styles.trendAmounts}>
                    <ThemedText style={[styles.trendIncome, { color: colors.success }]}>
                      +{formatCurrency(trend.income)}
                    </ThemedText>
                    <ThemedText style={[styles.trendExpense, { color: colors.error }]}>
                      -{formatCurrency(trend.expense)}
                    </ThemedText>
                    <ThemedText
                      style={[
                        styles.trendNet,
                        { color: trend.net >= 0 ? colors.success : colors.error },
                      ]}>
                      {formatCurrency(trend.net)}
                    </ThemedText>
                  </View>
                </View>
              ))}
            </View>
          </Card>
        )}

        {/* Investment Portfolio */}
        {investmentPortfolio.length > 0 && (
          <Card variant="default" padding="lg" style={styles.chartCard}>
            <ThemedText style={[Typography.h3, styles.chartTitle, { color: colors.text }]}>
              Investment Portfolio
            </ThemedText>
            <PieChart
              data={investmentPortfolio.map((item) => ({
                label: item.accountName,
                value: item.balance,
                color: colors.primary,
              }))}
              size={220}
              showLegend={true}
            />
            <View style={styles.accountList}>
              {investmentPortfolio.map((item, index) => (
                <View
                  key={item.accountId}
                  style={[
                    styles.accountItem,
                    {
                      borderBottomColor: colors.border,
                      borderBottomWidth: index < investmentPortfolio.length - 1 ? 1 : 0,
                    },
                  ]}>
                  <View style={styles.accountItemLeft}>
                    <ThemedText style={[styles.accountName, { color: colors.text }]}>
                      {item.accountName}
                    </ThemedText>
                    <ThemedText style={[styles.accountType, { color: colors.textSecondary }]}>
                      {item.accountType}
                    </ThemedText>
                  </View>
                  <View style={styles.accountItemRight}>
                    <ThemedText style={[styles.accountAmount, { color: colors.text }]}>
                      {formatCurrency(item.balance)}
                    </ThemedText>
                    <ThemedText style={[styles.accountPercentage, { color: colors.textSecondary }]}>
                      {item.percentage.toFixed(1)}%
                    </ThemedText>
                  </View>
                </View>
              ))}
            </View>
          </Card>
        )}

        {/* Budget Chart */}
        {budgetChart.length > 0 && (
          <Card variant="default" padding="lg" style={styles.chartCard}>
            <ThemedText style={[Typography.h3, styles.chartTitle, { color: colors.text }]}>
              Budget vs Actual
            </ThemedText>
            <SimpleChart
              data={budgetChart.map((item) => ({
                label: item.budgetName.length > 8 ? `${item.budgetName.substring(0, 7)}...` : item.budgetName,
                value: item.spent,
                color: item.color,
              }))}
              height={180}
              showValues={true}
            />
            <View style={styles.budgetList}>
              {budgetChart.map((item, index) => (
                <View
                  key={item.budgetId}
                  style={[
                    styles.budgetItem,
                    {
                      borderBottomColor: colors.border,
                      borderBottomWidth: index < budgetChart.length - 1 ? 1 : 0,
                    },
                  ]}>
                  <View style={styles.budgetItemLeft}>
                    <View style={[styles.budgetColorDot, { backgroundColor: item.color }]} />
                    <ThemedText style={[styles.budgetName, { color: colors.text }]}>
                      {item.budgetName}
                    </ThemedText>
                  </View>
                  <View style={styles.budgetItemRight}>
                    <ThemedText style={[styles.budgetAmount, { color: colors.text }]}>
                      {formatCurrency(item.spent)} / {formatCurrency(item.budgetAmount)}
                    </ThemedText>
                    <ThemedText
                      style={[
                        styles.budgetPercentage,
                        {
                          color: item.percentage > 100 ? colors.error : item.percentage > 80 ? colors.warning : colors.success,
                        },
                      ]}>
                      {item.percentage.toFixed(1)}%
                    </ThemedText>
                  </View>
                </View>
              ))}
            </View>
          </Card>
        )}

        {/* Planned Payments */}
        {plannedPayments.length > 0 && plannedPayments.some((p) => p.totalAmount > 0) && (
          <Card variant="default" padding="lg" style={styles.chartCard}>
            <ThemedText style={[Typography.h3, styles.chartTitle, { color: colors.text }]}>
              Planned Payments
            </ThemedText>
            <SimpleChart
              data={plannedPayments.map((item) => ({
                label: item.monthLabel.split(' ')[0],
                value: item.totalAmount,
                color: colors.warning,
              }))}
              height={180}
              showValues={true}
            />
            <View style={styles.plannedList}>
              {plannedPayments.map((item, index) => (
                <View
                  key={item.month}
                  style={[
                    styles.plannedItem,
                    {
                      borderBottomColor: colors.border,
                      borderBottomWidth: index < plannedPayments.length - 1 ? 1 : 0,
                    },
                  ]}>
                  <ThemedText style={[styles.plannedMonth, { color: colors.text }]}>
                    {item.monthLabel}
                  </ThemedText>
                  <View style={styles.plannedItemRight}>
                    <ThemedText style={[styles.plannedAmount, { color: colors.text }]}>
                      {formatCurrency(item.totalAmount)}
                    </ThemedText>
                    <ThemedText style={[styles.plannedCount, { color: colors.textSecondary }]}>
                      {item.pendingCount} pending, {item.completedCount} completed
                    </ThemedText>
                  </View>
                </View>
              ))}
            </View>
          </Card>
        )}

        {/* Spending by Account */}
        {accountChartData.length > 0 && (
          <Card variant="default" padding="lg" style={styles.chartCard}>
            <ThemedText style={[Typography.h3, styles.chartTitle, { color: colors.text }]}>
              Top Accounts
            </ThemedText>
            <SimpleChart data={accountChartData} height={180} showValues={true} />
            <View style={styles.accountList}>
              {accountSpending.slice(0, 5).map((item, index) => (
                <View
                  key={item.accountId}
                  style={[
                    styles.accountItem,
                    {
                      borderBottomColor: colors.border,
                      borderBottomWidth: index < accountSpending.slice(0, 5).length - 1 ? 1 : 0,
                    },
                  ]}>
                  <ThemedText style={[styles.accountName, { color: colors.text }]}>
                    {item.accountName}
                  </ThemedText>
                  <View style={styles.accountItemRight}>
                    <ThemedText style={[styles.accountAmount, { color: colors.text }]}>
                      {formatCurrency(item.amount)}
                    </ThemedText>
                    <ThemedText style={[styles.accountPercentage, { color: colors.textSecondary }]}>
                      {item.percentage.toFixed(1)}%
                    </ThemedText>
                  </View>
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
              Try adjusting your filters or date range
            </ThemedText>
          </Card>
        )}
      </ScrollView>

      {/* Filter Modal */}
      <TransactionFilters
        visible={showFilters}
        onClose={() => setShowFilters(false)}
        onApply={(newFilters) => {
          setFilters(newFilters);
        }}
        onReset={() => {
          setFilters({});
        }}
        accounts={accounts}
        categories={categories}
        currentFilters={filters}
      />

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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
    borderBottomWidth: 1,
  },
  headerContent: {
    flex: 1,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    minHeight: ComponentSizes.minTouchTarget,
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
  summaryRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  summaryCard: {
    flex: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 13,
    marginBottom: Spacing.xs,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  chartCard: {
    marginBottom: Spacing.lg,
  },
  chartTitle: {
    marginBottom: Spacing.lg,
    fontWeight: '600',
  },
  categoryList: {
    marginTop: Spacing.lg,
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  categoryItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIcon: {
    fontSize: 20,
    marginRight: Spacing.md,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '500',
  },
  categoryItemRight: {
    alignItems: 'flex-end',
  },
  categoryAmount: {
    fontSize: 14,
    fontWeight: '600',
  },
  categoryPercentage: {
    fontSize: 12,
    marginTop: Spacing.xxs,
  },
  trendList: {
    marginTop: Spacing.lg,
  },
  trendItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  trendMonth: {
    fontSize: 14,
    fontWeight: '500',
  },
  trendAmounts: {
    alignItems: 'flex-end',
    gap: Spacing.xxs,
  },
  trendIncome: {
    fontSize: 12,
    fontWeight: '600',
  },
  trendExpense: {
    fontSize: 12,
    fontWeight: '600',
  },
  trendNet: {
    fontSize: 14,
    fontWeight: '700',
  },
  accountList: {
    marginTop: Spacing.lg,
  },
  accountItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  accountName: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  accountItemRight: {
    alignItems: 'flex-end',
  },
  accountAmount: {
    fontSize: 14,
    fontWeight: '600',
  },
  accountPercentage: {
    fontSize: 12,
    marginTop: Spacing.xxs,
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
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  viewToggle: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  toggleButton: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    minHeight: ComponentSizes.minTouchTarget,
  },
  toggleText: {
    fontSize: 12,
    fontWeight: '600',
  },
  accountItemLeft: {
    flex: 1,
  },
  accountType: {
    fontSize: 12,
    marginTop: Spacing.xxs,
  },
  budgetList: {
    marginTop: Spacing.lg,
  },
  budgetItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  budgetItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  budgetColorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: Spacing.md,
  },
  budgetName: {
    fontSize: 14,
    fontWeight: '500',
  },
  budgetItemRight: {
    alignItems: 'flex-end',
  },
  budgetAmount: {
    fontSize: 14,
    fontWeight: '600',
  },
  budgetPercentage: {
    fontSize: 12,
    marginTop: Spacing.xxs,
    fontWeight: '600',
  },
  plannedList: {
    marginTop: Spacing.lg,
  },
  plannedItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  plannedMonth: {
    fontSize: 14,
    fontWeight: '500',
  },
  plannedItemRight: {
    alignItems: 'flex-end',
  },
  plannedAmount: {
    fontSize: 14,
    fontWeight: '600',
  },
  plannedCount: {
    fontSize: 12,
    marginTop: Spacing.xxs,
  },
  yoyContainer: {
    marginTop: Spacing.md,
  },
  yoyRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  yoyColumn: {
    flex: 1,
  },
  yoyChanges: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  yoyChangeRow: {
    gap: Spacing.sm,
  },
  yoyChangeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryTrendList: {
    marginTop: Spacing.lg,
  },
  categoryTrendItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  categoryTrendLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryTrendRight: {
    alignItems: 'flex-end',
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
  },
  confidenceBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
  },
  predictionList: {
    marginTop: Spacing.lg,
  },
  predictionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  predictionAmounts: {
    alignItems: 'flex-end',
    gap: Spacing.xxs,
  },
});
