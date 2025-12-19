/**
 * Analytics Helper Functions
 * Calculate various statistics and analytics for transactions
 */

import { Account, Budget, Category, Label, PlannedTransaction, Transaction, TransactionType } from '@/types';

export interface CategorySpending {
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  amount: number;
  percentage: number;
  transactionCount: number;
}

export interface MonthlyTrend {
  month: string; // Format: "YYYY-MM"
  monthLabel: string; // Format: "Jan 2024"
  income: number;
  expense: number;
  net: number;
  transactionCount: number;
}

export interface AccountSpending {
  accountId: string;
  accountName: string;
  amount: number;
  percentage: number;
  transactionCount: number;
}

/**
 * Calculate spending by category
 * Handles split transactions by counting each split separately
 */
export function calculateCategorySpending(
  transactions: Transaction[],
  categories: Category[],
  type: 'income' | 'expense' = 'expense'
): CategorySpending[] {
  const filtered = transactions.filter((t) => t.type === type);
  const categoryMap = new Map<string, { amount: number; count: number }>();

  filtered.forEach((transaction) => {
    // Handle split transactions
    if (transaction.splits && transaction.splits.length > 0) {
      transaction.splits.forEach((split) => {
        const category = categories.find((c) => c.id === split.categoryId);
        if (category) {
          const existing = categoryMap.get(category.id) || { amount: 0, count: 0 };
          categoryMap.set(category.id, {
            amount: existing.amount + split.amount,
            count: existing.count + 1,
          });
        }
      });
    } else {
      // Regular transaction
      const category = categories.find((c) => c.id === transaction.categoryId);
      if (category) {
        const existing = categoryMap.get(category.id) || { amount: 0, count: 0 };
        categoryMap.set(category.id, {
          amount: existing.amount + transaction.amount,
          count: existing.count + 1,
        });
      }
    }
  });

  const total = Array.from(categoryMap.values()).reduce((sum, item) => sum + item.amount, 0);

  return Array.from(categoryMap.entries())
    .map(([categoryId, data]) => {
      const category = categories.find((c) => c.id === categoryId);
      return {
        categoryId,
        categoryName: category?.name || 'Uncategorized',
        categoryIcon: category?.icon || '💰',
        categoryColor: category?.color || '#999999',
        amount: data.amount,
        percentage: total > 0 ? (data.amount / total) * 100 : 0,
        transactionCount: data.count,
      };
    })
    .sort((a, b) => b.amount - a.amount);
}

/**
 * Calculate monthly trends
 */
export function calculateMonthlyTrends(
  transactions: Transaction[],
  months: number = 12
): MonthlyTrend[] {
  const now = new Date();
  const trends: MonthlyTrend[] = [];

  for (let i = months - 1; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const monthLabel = date.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });

    const monthTransactions = transactions.filter((t) => {
      const transactionDate = new Date(t.date);
      return (
        transactionDate.getFullYear() === date.getFullYear() &&
        transactionDate.getMonth() === date.getMonth()
      );
    });

    const income = monthTransactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    const expense = monthTransactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    trends.push({
      month: monthKey,
      monthLabel,
      income,
      expense,
      net: income - expense,
      transactionCount: monthTransactions.length,
    });
  }

  return trends;
}

/**
 * Calculate spending by account
 */
export function calculateAccountSpending(
  transactions: Transaction[],
  accounts: Array<{ id: string; name: string }>,
  type: 'income' | 'expense' = 'expense'
): AccountSpending[] {
  const filtered = transactions.filter((t) => t.type === type);
  const accountMap = new Map<string, { amount: number; count: number }>();

  filtered.forEach((transaction) => {
    const existing = accountMap.get(transaction.accountId) || { amount: 0, count: 0 };
    accountMap.set(transaction.accountId, {
      amount: existing.amount + transaction.amount,
      count: existing.count + 1,
    });
  });

  const total = Array.from(accountMap.values()).reduce((sum, item) => sum + item.amount, 0);

  return Array.from(accountMap.entries())
    .map(([accountId, data]) => {
      const account = accounts.find((a) => a.id === accountId);
      return {
        accountId,
        accountName: account?.name || 'Unknown Account',
        amount: data.amount,
        percentage: total > 0 ? (data.amount / total) * 100 : 0,
        transactionCount: data.count,
      };
    })
    .sort((a, b) => b.amount - a.amount);
}

/**
 * Filter transactions based on filter criteria
 */
export function filterTransactions(
  transactions: Transaction[],
  filters: {
    type?: TransactionType | 'all';
    accountIds?: string[];
    categoryIds?: string[];
    startDate?: string;
    endDate?: string;
    minAmount?: number;
    maxAmount?: number;
    searchQuery?: string;
  }
): Transaction[] {
  let filtered = [...transactions];

  // Filter by type
  if (filters.type && filters.type !== 'all') {
    filtered = filtered.filter((t) => t.type === filters.type);
  }

  // Filter by accounts
  if (filters.accountIds && filters.accountIds.length > 0) {
    filtered = filtered.filter((t) => filters.accountIds!.includes(t.accountId));
  }

  // Filter by categories (including split transactions)
  if (filters.categoryIds && filters.categoryIds.length > 0) {
    filtered = filtered.filter((t) => {
      // Check primary category
      if (filters.categoryIds!.includes(t.categoryId)) {
        return true;
      }
      // Check split categories
      if (t.splits && t.splits.length > 0) {
        return t.splits.some((split) => filters.categoryIds!.includes(split.categoryId));
      }
      return false;
    });
  }

  // Filter by date range
  if (filters.startDate) {
    const start = new Date(filters.startDate);
    start.setHours(0, 0, 0, 0);
    filtered = filtered.filter((t) => new Date(t.date) >= start);
  }

  if (filters.endDate) {
    const end = new Date(filters.endDate);
    end.setHours(23, 59, 59, 999);
    filtered = filtered.filter((t) => new Date(t.date) <= end);
  }

  // Filter by amount range
  if (filters.minAmount !== undefined) {
    filtered = filtered.filter((t) => t.amount >= filters.minAmount!);
  }

  if (filters.maxAmount !== undefined) {
    filtered = filtered.filter((t) => t.amount <= filters.maxAmount!);
  }

  // Filter by search query
  if (filters.searchQuery && filters.searchQuery.trim()) {
    const query = filters.searchQuery.toLowerCase();
    filtered = filtered.filter(
      (t) =>
        t.description.toLowerCase().includes(query) ||
        t.itemName?.toLowerCase().includes(query)
    );
  }

  return filtered;
}

/**
 * Calculate summary statistics
 */
export function calculateSummary(transactions: Transaction[]) {
  const income = transactions.filter((t) => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const expense = transactions.filter((t) => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const transfer = transactions.filter((t) => t.type === 'transfer').reduce((sum, t) => sum + t.amount, 0);
  const net = income - expense;
  const savingsRate = income > 0 ? ((income - expense) / income) * 100 : 0;

  return {
    totalIncome: income,
    totalExpense: expense,
    totalTransfer: transfer,
    net,
    savingsRate,
    transactionCount: transactions.length,
    averageTransaction: transactions.length > 0 ? (income + expense) / transactions.length : 0,
  };
}

/**
 * Advanced Statistics Dashboard
 */
export interface SpendingVelocity {
  dailyAverage: number;
  weeklyAverage: number;
  monthlyAverage: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  changePercent: number;
}

export interface TransactionFrequency {
  totalTransactions: number;
  averagePerDay: number;
  averagePerWeek: number;
  averagePerMonth: number;
  mostActiveDay: string;
  mostActiveDayCount: number;
}

export interface CategoryPerformance {
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  totalSpent: number;
  transactionCount: number;
  averageAmount: number;
  largestTransaction: number;
  smallestTransaction: number;
  lastTransactionDate?: string;
  trend: 'increasing' | 'decreasing' | 'stable';
}

export interface AccountStatistics {
  accountId: string;
  accountName: string;
  totalIncome: number;
  totalExpense: number;
  netFlow: number;
  transactionCount: number;
  averageTransaction: number;
  largestTransaction: number;
  lastTransactionDate?: string;
}

export interface TimeBasedStatistics {
  period: string;
  periodLabel: string;
  income: number;
  expense: number;
  net: number;
  transactionCount: number;
  averagePerDay: number;
}

export interface DashboardStatistics {
  spendingVelocity: SpendingVelocity;
  transactionFrequency: TransactionFrequency;
  topCategories: CategoryPerformance[];
  accountStats: AccountStatistics[];
  dailyStats: TimeBasedStatistics[];
  weeklyStats: TimeBasedStatistics[];
  monthlyStats: TimeBasedStatistics[];
  insights: string[];
}

/**
 * Calculate spending velocity
 */
export function calculateSpendingVelocity(
  transactions: Transaction[],
  startDate: string,
  endDate: string
): SpendingVelocity {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  
  const expenses = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const dailyAverage = daysDiff > 0 ? expenses / daysDiff : 0;
  const weeklyAverage = dailyAverage * 7;
  const monthlyAverage = dailyAverage * 30;

  // Calculate trend (compare first half vs second half)
  const midPoint = new Date(start.getTime() + (end.getTime() - start.getTime()) / 2);
  const firstHalfExpenses = transactions
    .filter((t) => {
      const tDate = new Date(t.date);
      return t.type === 'expense' && tDate >= start && tDate < midPoint;
    })
    .reduce((sum, t) => sum + t.amount, 0);
  
  const secondHalfExpenses = transactions
    .filter((t) => {
      const tDate = new Date(t.date);
      return t.type === 'expense' && tDate >= midPoint && tDate <= end;
    })
    .reduce((sum, t) => sum + t.amount, 0);

  const firstHalfDays = Math.ceil((midPoint.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  const secondHalfDays = Math.ceil((end.getTime() - midPoint.getTime()) / (1000 * 60 * 60 * 24));

  const firstHalfDaily = firstHalfDays > 0 ? firstHalfExpenses / firstHalfDays : 0;
  const secondHalfDaily = secondHalfDays > 0 ? secondHalfExpenses / secondHalfDays : 0;

  let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
  let changePercent = 0;

  if (firstHalfDaily > 0) {
    changePercent = ((secondHalfDaily - firstHalfDaily) / firstHalfDaily) * 100;
    if (changePercent > 5) {
      trend = 'increasing';
    } else if (changePercent < -5) {
      trend = 'decreasing';
    }
  }

  return {
    dailyAverage,
    weeklyAverage,
    monthlyAverage,
    trend,
    changePercent,
  };
}

/**
 * Calculate transaction frequency statistics
 */
export function calculateTransactionFrequency(
  transactions: Transaction[],
  startDate: string,
  endDate: string
): TransactionFrequency {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  const weeksDiff = daysDiff / 7;
  const monthsDiff = daysDiff / 30;

  // Count transactions by day of week
  const dayCounts: Record<string, number> = {
    'Sunday': 0,
    'Monday': 0,
    'Tuesday': 0,
    'Wednesday': 0,
    'Thursday': 0,
    'Friday': 0,
    'Saturday': 0,
  };

  transactions.forEach((t) => {
    const date = new Date(t.date);
    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
    dayCounts[dayName] = (dayCounts[dayName] || 0) + 1;
  });

  const mostActiveDay = Object.entries(dayCounts).reduce((a, b) => (dayCounts[a[0]] > dayCounts[b[0]] ? a : b))[0];
  const mostActiveDayCount = dayCounts[mostActiveDay];

  return {
    totalTransactions: transactions.length,
    averagePerDay: daysDiff > 0 ? transactions.length / daysDiff : 0,
    averagePerWeek: weeksDiff > 0 ? transactions.length / weeksDiff : 0,
    averagePerMonth: monthsDiff > 0 ? transactions.length / monthsDiff : 0,
    mostActiveDay,
    mostActiveDayCount,
  };
}

/**
 * Calculate category performance metrics
 */
export function calculateCategoryPerformance(
  transactions: Transaction[],
  categories: Category[],
  startDate: string,
  endDate: string
): CategoryPerformance[] {
  const start = new Date(startDate);
  const end = new Date(endDate);

  const categoryMap = new Map<string, {
    amounts: number[];
    dates: string[];
    total: number;
    count: number;
  }>();

  transactions.forEach((t) => {
    const tDate = new Date(t.date);
    if (tDate >= start && tDate <= end && t.type === 'expense') {
      if (t.splits && t.splits.length > 0) {
        t.splits.forEach((split) => {
          const existing = categoryMap.get(split.categoryId) || { amounts: [], dates: [], total: 0, count: 0 };
          existing.amounts.push(split.amount);
          existing.dates.push(t.date);
          existing.total += split.amount;
          existing.count += 1;
          categoryMap.set(split.categoryId, existing);
        });
      } else {
        const existing = categoryMap.get(t.categoryId) || { amounts: [], dates: [], total: 0, count: 0 };
        existing.amounts.push(t.amount);
        existing.dates.push(t.date);
        existing.total += t.amount;
        existing.count += 1;
        categoryMap.set(t.categoryId, existing);
      }
    }
  });

  const performances: CategoryPerformance[] = [];

  categoryMap.forEach((data, categoryId) => {
    const category = categories.find((c) => c.id === categoryId);
    if (!category) return;

    const amounts = data.amounts.sort((a, b) => a - b);
    const averageAmount = data.count > 0 ? data.total / data.count : 0;
    const largestTransaction = amounts.length > 0 ? amounts[amounts.length - 1] : 0;
    const smallestTransaction = amounts.length > 0 ? amounts[0] : 0;
    const lastTransactionDate = data.dates.length > 0
      ? data.dates.sort().reverse()[0]
      : undefined;

    // Calculate trend (first half vs second half)
    const midPoint = new Date(start.getTime() + (end.getTime() - start.getTime()) / 2);
    const firstHalfTotal = data.dates
      .filter((d) => new Date(d) < midPoint)
      .reduce((sum, d, i) => sum + data.amounts[data.dates.indexOf(d)], 0);
    const secondHalfTotal = data.dates
      .filter((d) => new Date(d) >= midPoint)
      .reduce((sum, d, i) => sum + data.amounts[data.dates.indexOf(d)], 0);

    const firstHalfCount = data.dates.filter((d) => new Date(d) < midPoint).length;
    const secondHalfCount = data.dates.filter((d) => new Date(d) >= midPoint).length;

    const firstHalfAvg = firstHalfCount > 0 ? firstHalfTotal / firstHalfCount : 0;
    const secondHalfAvg = secondHalfCount > 0 ? secondHalfTotal / secondHalfCount : 0;

    let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
    if (firstHalfAvg > 0) {
      const changePercent = ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100;
      if (changePercent > 5) {
        trend = 'increasing';
      } else if (changePercent < -5) {
        trend = 'decreasing';
      }
    }

    performances.push({
      categoryId,
      categoryName: category.name,
      categoryIcon: category.icon,
      categoryColor: category.color,
      totalSpent: data.total,
      transactionCount: data.count,
      averageAmount,
      largestTransaction,
      smallestTransaction,
      lastTransactionDate,
      trend,
    });
  });

  return performances.sort((a, b) => b.totalSpent - a.totalSpent);
}

/**
 * Calculate account statistics
 */
export function calculateAccountStatistics(
  transactions: Transaction[],
  accounts: Account[]
): AccountStatistics[] {
  const accountMap = new Map<string, {
    income: number;
    expense: number;
    amounts: number[];
    dates: string[];
    count: number;
  }>();

  transactions.forEach((t) => {
    const existing = accountMap.get(t.accountId) || {
      income: 0,
      expense: 0,
      amounts: [],
      dates: [],
      count: 0,
    };

    if (t.type === 'income') {
      existing.income += t.amount;
    } else if (t.type === 'expense') {
      existing.expense += t.amount;
    }

    existing.amounts.push(t.amount);
    existing.dates.push(t.date);
    existing.count += 1;
    accountMap.set(t.accountId, existing);
  });

  const stats: AccountStatistics[] = [];

  accountMap.forEach((data, accountId) => {
    const account = accounts.find((a) => a.id === accountId);
    if (!account) return;

    const amounts = data.amounts.sort((a, b) => b - a);
    const netFlow = data.income - data.expense;
    const averageTransaction = data.count > 0
      ? (data.income + data.expense) / data.count
      : 0;
    const largestTransaction = amounts.length > 0 ? amounts[0] : 0;
    const lastTransactionDate = data.dates.length > 0
      ? data.dates.sort().reverse()[0]
      : undefined;

    stats.push({
      accountId,
      accountName: account.name,
      totalIncome: data.income,
      totalExpense: data.expense,
      netFlow,
      transactionCount: data.count,
      averageTransaction,
      largestTransaction,
      lastTransactionDate,
    });
  });

  return stats.sort((a, b) => b.transactionCount - a.transactionCount);
}

/**
 * Calculate time-based statistics (daily, weekly, monthly)
 */
export function calculateTimeBasedStatistics(
  transactions: Transaction[],
  startDate: string,
  endDate: string,
  period: 'daily' | 'weekly' | 'monthly'
): TimeBasedStatistics[] {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const stats: TimeBasedStatistics[] = [];

  let currentPeriod = new Date(start);
  
  while (currentPeriod <= end) {
    let periodEnd: Date;
    let periodKey: string;
    let periodLabel: string;

    if (period === 'daily') {
      periodEnd = new Date(currentPeriod);
      periodEnd.setHours(23, 59, 59, 999);
      if (periodEnd > end) periodEnd = end;
      periodKey = currentPeriod.toISOString().split('T')[0];
      periodLabel = currentPeriod.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
    } else if (period === 'weekly') {
      periodEnd = new Date(currentPeriod);
      periodEnd.setDate(periodEnd.getDate() + 6);
      if (periodEnd > end) periodEnd = end;
      const weekStart = currentPeriod.toISOString().split('T')[0];
      const weekEnd = periodEnd.toISOString().split('T')[0];
      periodKey = `${weekStart}_${weekEnd}`;
      periodLabel = `${currentPeriod.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })} - ${periodEnd.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}`;
    } else {
      periodEnd = new Date(currentPeriod.getFullYear(), currentPeriod.getMonth() + 1, 0);
      if (periodEnd > end) periodEnd = end;
      periodKey = `${currentPeriod.getFullYear()}-${String(currentPeriod.getMonth() + 1).padStart(2, '0')}`;
      periodLabel = currentPeriod.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
    }

    const periodTransactions = transactions.filter((t) => {
      const tDate = new Date(t.date);
      return tDate >= currentPeriod && tDate <= periodEnd;
    });

    const income = periodTransactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    const expense = periodTransactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    const net = income - expense;
    const daysInPeriod = Math.ceil((periodEnd.getTime() - currentPeriod.getTime()) / (1000 * 60 * 60 * 24)) || 1;
    const averagePerDay = expense / daysInPeriod;

    stats.push({
      period: periodKey,
      periodLabel,
      income,
      expense,
      net,
      transactionCount: periodTransactions.length,
      averagePerDay,
    });

    // Move to next period
    if (period === 'daily') {
      currentPeriod.setDate(currentPeriod.getDate() + 1);
    } else if (period === 'weekly') {
      currentPeriod.setDate(currentPeriod.getDate() + 7);
    } else {
      currentPeriod.setMonth(currentPeriod.getMonth() + 1);
    }
  }

  return stats;
}

/**
 * Generate insights based on statistics
 */
export function generateInsights(
  transactions: Transaction[],
  spendingVelocity: SpendingVelocity,
  categoryPerformance: CategoryPerformance[],
  accountStats: AccountStatistics[]
): string[] {
  const insights: string[] = [];

  // Spending velocity insights
  if (spendingVelocity.trend === 'increasing' && spendingVelocity.changePercent > 10) {
    insights.push(`Your spending has increased by ${spendingVelocity.changePercent.toFixed(1)}% - consider reviewing your expenses`);
  } else if (spendingVelocity.trend === 'decreasing' && spendingVelocity.changePercent < -10) {
    insights.push(`Great! Your spending has decreased by ${Math.abs(spendingVelocity.changePercent).toFixed(1)}%`);
  }

  // Category insights
  const topCategory = categoryPerformance[0];
  if (topCategory && topCategory.totalSpent > 0) {
    const topCategoryPercentage = (topCategory.totalSpent / categoryPerformance.reduce((sum, c) => sum + c.totalSpent, 0)) * 100;
    if (topCategoryPercentage > 40) {
      insights.push(`${topCategory.categoryName} accounts for ${topCategoryPercentage.toFixed(1)}% of your spending`);
    }
  }

  // Account insights
  const accountWithMostTransactions = accountStats[0];
  if (accountWithMostTransactions && accountStats.length > 1) {
    insights.push(`Most transactions (${accountWithMostTransactions.transactionCount}) are from ${accountWithMostTransactions.accountName}`);
  }

  // Transaction frequency insights
  if (transactions.length > 0) {
    const expenseTransactions = transactions.filter((t) => t.type === 'expense');
    const averageExpense = expenseTransactions.reduce((sum, t) => sum + t.amount, 0) / expenseTransactions.length;
    const largeTransactions = expenseTransactions.filter((t) => t.amount > averageExpense * 2);
    if (largeTransactions.length > 0) {
      insights.push(`You have ${largeTransactions.length} large transaction${largeTransactions.length !== 1 ? 's' : ''} above average`);
    }
  }

  // Savings insights
  const income = transactions.filter((t) => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const expense = transactions.filter((t) => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  if (income > 0) {
    const savingsRate = ((income - expense) / income) * 100;
    if (savingsRate > 20) {
      insights.push(`Excellent! You're saving ${savingsRate.toFixed(1)}% of your income`);
    } else if (savingsRate < 0) {
      insights.push(`You're spending more than you earn - consider reviewing your budget`);
    }
  }

  return insights.slice(0, 5); // Limit to 5 insights
}

/**
 * Calculate comprehensive dashboard statistics
 */
export function calculateDashboardStatistics(
  transactions: Transaction[],
  accounts: Account[],
  categories: Category[],
  startDate: string,
  endDate: string
): DashboardStatistics {
  const spendingVelocity = calculateSpendingVelocity(transactions, startDate, endDate);
  const transactionFrequency = calculateTransactionFrequency(transactions, startDate, endDate);
  const categoryPerformance = calculateCategoryPerformance(transactions, categories, startDate, endDate);
  const accountStats = calculateAccountStatistics(transactions, accounts);
  const dailyStats = calculateTimeBasedStatistics(transactions, startDate, endDate, 'daily').slice(-30); // Last 30 days
  const weeklyStats = calculateTimeBasedStatistics(transactions, startDate, endDate, 'weekly').slice(-12); // Last 12 weeks
  const monthlyStats = calculateTimeBasedStatistics(transactions, startDate, endDate, 'monthly').slice(-12); // Last 12 months
  const insights = generateInsights(transactions, spendingVelocity, categoryPerformance, accountStats);

  return {
    spendingVelocity,
    transactionFrequency,
    topCategories: categoryPerformance.slice(0, 10),
    accountStats: accountStats.slice(0, 10),
    dailyStats,
    weeklyStats,
    monthlyStats,
    insights,
  };
}

export interface BalanceTrend {
  date: string; // Format: "YYYY-MM-DD"
  dateLabel: string; // Format: "Jan 15"
  balance: number;
}

export interface LabelSpending {
  labelId: string;
  labelName: string;
  labelColor: string;
  amount: number;
  percentage: number;
  transactionCount: number;
}

export interface CashFlow {
  date: string;
  dateLabel: string;
  income: number;
  expense: number;
  net: number;
}

export interface InvestmentPortfolio {
  accountId: string;
  accountName: string;
  accountType: string;
  balance: number;
  percentage: number;
}

export interface BudgetChart {
  budgetId: string;
  budgetName: string;
  budgetAmount: number;
  spent: number;
  remaining: number;
  percentage: number;
  color: string;
}

export interface PlannedPaymentChart {
  month: string;
  monthLabel: string;
  totalAmount: number;
  pendingCount: number;
  completedCount: number;
}

/**
 * Calculate balance trend over time
 * Works backwards from current balance
 */
export function calculateBalanceTrend(
  transactions: Transaction[],
  accounts: Account[],
  days: number = 30
): BalanceTrend[] {
  const now = new Date();
  const trends: BalanceTrend[] = [];
  
  // Calculate current balance (sum of all account balances)
  const currentBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);
  
  // Group transactions by date (sorted chronologically)
  const transactionsByDate = new Map<string, Transaction[]>();
  transactions.forEach((t) => {
    const dateKey = t.date;
    if (!transactionsByDate.has(dateKey)) {
      transactionsByDate.set(dateKey, []);
    }
    transactionsByDate.get(dateKey)!.push(t);
  });
  
  // Get all dates in range, sorted
  const allDates: string[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    allDates.push(date.toISOString().split('T')[0]);
  }
  
  // Calculate balance backwards from current balance
  let runningBalance = currentBalance;
  const balances: Array<{ date: string; balance: number }> = [];
  
  // Start from today and go backwards
  for (let i = allDates.length - 1; i >= 0; i--) {
    const dateKey = allDates[i];
    const dayTransactions = transactionsByDate.get(dateKey) || [];
    
    // Reverse transactions to get balance at start of day
    dayTransactions.forEach((t) => {
      if (t.type === 'income') {
        runningBalance -= t.amount; // Reverse income
      } else if (t.type === 'expense') {
        runningBalance += t.amount; // Reverse expense
      } else if (t.type === 'transfer') {
        // For transfers, we need to reverse both accounts
        // This is simplified - assumes transfer doesn't change total balance
      }
    });
    
    balances.unshift({ date: dateKey, balance: runningBalance });
  }
  
  // Convert to trend format
  balances.forEach((b) => {
    const date = new Date(b.date);
    trends.push({
      date: b.date,
      dateLabel: date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
      balance: b.balance,
    });
  });
  
  return trends;
}

/**
 * Calculate spending by labels
 */
export function calculateLabelSpending(
  transactions: Transaction[],
  labels: Label[],
  type: 'income' | 'expense' = 'expense'
): LabelSpending[] {
  const filtered = transactions.filter((t) => t.type === type && t.labels && t.labels.length > 0);
  const labelMap = new Map<string, { amount: number; count: number }>();

  filtered.forEach((transaction) => {
    transaction.labels?.forEach((labelId) => {
      const existing = labelMap.get(labelId) || { amount: 0, count: 0 };
      labelMap.set(labelId, {
        amount: existing.amount + transaction.amount,
        count: existing.count + 1,
      });
    });
  });

  const total = Array.from(labelMap.values()).reduce((sum, item) => sum + item.amount, 0);

  return Array.from(labelMap.entries())
    .map(([labelId, data]) => {
      const label = labels.find((l) => l.id === labelId);
      return {
        labelId,
        labelName: label?.name || 'Unknown Label',
        labelColor: label?.color || '#999999',
        amount: data.amount,
        percentage: total > 0 ? (data.amount / total) * 100 : 0,
        transactionCount: data.count,
      };
    })
    .sort((a, b) => b.amount - a.amount);
}

/**
 * Calculate cash flow over time
 */
export function calculateCashFlow(
  transactions: Transaction[],
  days: number = 30
): CashFlow[] {
  const now = new Date();
  const cashFlow: CashFlow[] = [];
  
  // Group transactions by date
  const transactionsByDate = new Map<string, Transaction[]>();
  transactions.forEach((t) => {
    const dateKey = t.date;
    if (!transactionsByDate.has(dateKey)) {
      transactionsByDate.set(dateKey, []);
    }
    transactionsByDate.get(dateKey)!.push(t);
  });
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateKey = date.toISOString().split('T')[0];
    
    const dayTransactions = transactionsByDate.get(dateKey) || [];
    const income = dayTransactions.filter((t) => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const expense = dayTransactions.filter((t) => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    
    cashFlow.push({
      date: dateKey,
      dateLabel: date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
      income,
      expense,
      net: income - expense,
    });
  }
  
  return cashFlow;
}

/**
 * Calculate investment portfolio breakdown
 */
export function calculateInvestmentPortfolio(
  accounts: Account[]
): InvestmentPortfolio[] {
  const investmentTypes = [
    'Fixed Deposit (FD)',
    'Recurring Deposit (RD)',
    'Public Provident Fund (PPF)',
    'Monthly Income Scheme (MIS)',
    'National Pension System (NPS)',
    'Mutual Fund',
    'Stocks',
    'Bonds',
    'Gold',
  ];
  
  const investmentAccounts = accounts.filter((acc) => investmentTypes.includes(acc.type));
  const total = investmentAccounts.reduce((sum, acc) => sum + acc.balance, 0);
  
  return investmentAccounts
    .map((account) => ({
      accountId: account.id,
      accountName: account.name,
      accountType: account.type,
      balance: account.balance,
      percentage: total > 0 ? (account.balance / total) * 100 : 0,
    }))
    .sort((a, b) => b.balance - a.balance);
}

/**
 * Calculate budget vs actual spending
 */
export function calculateBudgetChart(
  budgets: Budget[],
  transactions: Transaction[],
  categories: Category[]
): BudgetChart[] {
  return budgets.map((budget) => {
    // Calculate spending for this budget period
    const startDate = new Date(budget.startDate);
    const endDate = budget.endDate ? new Date(budget.endDate) : new Date();
    
    const periodTransactions = transactions.filter((t) => {
      const tDate = new Date(t.date);
      if (tDate < startDate || tDate > endDate || t.type !== 'expense') {
        return false;
      }
      
      // For split transactions, check if any split matches the budget category
      if (t.splits && t.splits.length > 0) {
        if (budget.categoryId) {
          return t.splits.some((split) => split.categoryId === budget.categoryId);
        }
        return true; // Overall budget matches all categories
      }
      
      // Regular transaction
      return budget.categoryId ? t.categoryId === budget.categoryId : true;
    });
    
    // Calculate spent amount
    const spent = periodTransactions.reduce((sum, t) => {
      if (t.splits && t.splits.length > 0) {
        // For split transactions, only count splits matching the budget category
        if (budget.categoryId) {
          const matchingSplits = t.splits.filter((split) => split.categoryId === budget.categoryId);
          return sum + matchingSplits.reduce((splitSum, split) => splitSum + split.amount, 0);
        }
        // Overall budget - count full transaction amount
        return sum + t.amount;
      }
      return sum + t.amount;
    }, 0);
    const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
    const remaining = budget.amount - spent;
    
    return {
      budgetId: budget.id,
      budgetName: budget.name,
      budgetAmount: budget.amount,
      spent,
      remaining,
      percentage,
      color: budget.color,
    };
  });
}

/**
 * Calculate planned payments overview
 */
export function calculatePlannedPayments(
  plannedTransactions: PlannedTransaction[],
  months: number = 6
): PlannedPaymentChart[] {
  const now = new Date();
  const charts: PlannedPaymentChart[] = [];
  
  for (let i = 0; i < months; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const monthLabel = date.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
    
    const monthPlanned = plannedTransactions.filter((pt) => {
      const scheduledDate = new Date(pt.scheduledDate);
      return (
        scheduledDate.getFullYear() === date.getFullYear() &&
        scheduledDate.getMonth() === date.getMonth() &&
        pt.status !== 'cancelled'
      );
    });
    
    const totalAmount = monthPlanned.reduce((sum, pt) => sum + pt.amount, 0);
    const pendingCount = monthPlanned.filter((pt) => pt.status === 'pending').length;
    const completedCount = monthPlanned.filter((pt) => pt.status === 'completed').length;
    
    charts.push({
      month: monthKey,
      monthLabel,
      totalAmount,
      pendingCount,
      completedCount,
    });
  }
  
  return charts;
}

/**
 * Year-over-Year Comparison
 * Compares current period with the same period last year
 */
export interface YearOverYearComparison {
  currentPeriod: {
    income: number;
    expense: number;
    net: number;
    transactionCount: number;
  };
  previousPeriod: {
    income: number;
    expense: number;
    net: number;
    transactionCount: number;
  };
  changes: {
    incomeChange: number;
    expenseChange: number;
    netChange: number;
    incomeChangePercent: number;
    expenseChangePercent: number;
    netChangePercent: number;
  };
}

export function calculateYearOverYearComparison(
  transactions: Transaction[],
  startDate: string,
  endDate: string
): YearOverYearComparison {
  const currentStart = new Date(startDate);
  const currentEnd = new Date(endDate);
  
  // Calculate previous year period (same duration)
  const daysDiff = Math.ceil((currentEnd.getTime() - currentStart.getTime()) / (1000 * 60 * 60 * 24));
  const previousEnd = new Date(currentStart);
  previousEnd.setFullYear(previousEnd.getFullYear() - 1);
  const previousStart = new Date(previousEnd);
  previousStart.setDate(previousStart.getDate() - daysDiff);

  // Filter current period transactions
  const currentTransactions = transactions.filter((t) => {
    const tDate = new Date(t.date);
    return tDate >= currentStart && tDate <= currentEnd;
  });

  // Filter previous period transactions
  const previousTransactions = transactions.filter((t) => {
    const tDate = new Date(t.date);
    return tDate >= previousStart && tDate <= previousEnd;
  });

  // Calculate current period stats
  const currentIncome = currentTransactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  const currentExpense = currentTransactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
  const currentNet = currentIncome - currentExpense;

  // Calculate previous period stats
  const previousIncome = previousTransactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  const previousExpense = previousTransactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
  const previousNet = previousIncome - previousExpense;

  // Calculate changes
  const incomeChange = currentIncome - previousIncome;
  const expenseChange = currentExpense - previousExpense;
  const netChange = currentNet - previousNet;

  const incomeChangePercent = previousIncome > 0 ? (incomeChange / previousIncome) * 100 : 0;
  const expenseChangePercent = previousExpense > 0 ? (expenseChange / previousExpense) * 100 : 0;
  const netChangePercent = previousNet !== 0 ? (netChange / Math.abs(previousNet)) * 100 : 0;

  return {
    currentPeriod: {
      income: currentIncome,
      expense: currentExpense,
      net: currentNet,
      transactionCount: currentTransactions.length,
    },
    previousPeriod: {
      income: previousIncome,
      expense: previousExpense,
      net: previousNet,
      transactionCount: previousTransactions.length,
    },
    changes: {
      incomeChange,
      expenseChange,
      netChange,
      incomeChangePercent,
      expenseChangePercent,
      netChangePercent,
    },
  };
}

/**
 * Category Trends Over Time
 * Shows how spending in each category changes over time periods
 */
export interface CategoryTrend {
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  periods: Array<{
    period: string;
    periodLabel: string;
    amount: number;
  }>;
  totalAmount: number;
  averageAmount: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  changePercent: number;
}

export function calculateCategoryTrends(
  transactions: Transaction[],
  categories: Category[],
  startDate: string,
  endDate: string,
  periodType: 'weekly' | 'monthly' = 'monthly'
): CategoryTrend[] {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  // Get all categories with spending
  const categorySpending = calculateCategorySpending(
    transactions.filter((t) => {
      const tDate = new Date(t.date);
      return tDate >= start && tDate <= end;
    }),
    categories,
    'expense'
  );

  const categoryTrends: CategoryTrend[] = [];

  categorySpending.forEach((category) => {
    const periods: Array<{ period: string; periodLabel: string; amount: number }> = [];
    let currentPeriod = new Date(start);

    while (currentPeriod <= end) {
      let periodEnd: Date;
      let periodKey: string;
      let periodLabel: string;

      if (periodType === 'weekly') {
        periodEnd = new Date(currentPeriod);
        periodEnd.setDate(periodEnd.getDate() + 6);
        if (periodEnd > end) periodEnd = end;
        periodKey = `${currentPeriod.getFullYear()}-W${Math.ceil((currentPeriod.getDate() + currentPeriod.getDay()) / 7)}`;
        periodLabel = currentPeriod.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
      } else {
        periodEnd = new Date(currentPeriod.getFullYear(), currentPeriod.getMonth() + 1, 0);
        if (periodEnd > end) periodEnd = end;
        periodKey = `${currentPeriod.getFullYear()}-${String(currentPeriod.getMonth() + 1).padStart(2, '0')}`;
        periodLabel = currentPeriod.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
      }

      // Filter transactions for this period
      const periodTransactions = transactions.filter((t) => {
        const tDate = new Date(t.date);
        return tDate >= currentPeriod && tDate <= periodEnd && t.type === 'expense';
      });

      // Calculate spending for this category in this period
      let periodAmount = 0;
      periodTransactions.forEach((t) => {
        if (t.splits && t.splits.length > 0) {
          const matchingSplit = t.splits.find((split) => split.categoryId === category.categoryId);
          if (matchingSplit) {
            periodAmount += matchingSplit.amount;
          }
        } else if (t.categoryId === category.categoryId) {
          periodAmount += t.amount;
        }
      });

      periods.push({
        period: periodKey,
        periodLabel,
        amount: periodAmount,
      });

      // Move to next period
      if (periodType === 'weekly') {
        currentPeriod.setDate(currentPeriod.getDate() + 7);
      } else {
        currentPeriod.setMonth(currentPeriod.getMonth() + 1);
      }
    }

    // Calculate trend
    const amounts = periods.map((p) => p.amount);
    const totalAmount = amounts.reduce((sum, a) => sum + a, 0);
    const averageAmount = periods.length > 0 ? totalAmount / periods.length : 0;

    // Determine trend (compare first half vs second half)
    const midPoint = Math.floor(periods.length / 2);
    const firstHalfAvg = midPoint > 0
      ? amounts.slice(0, midPoint).reduce((sum, a) => sum + a, 0) / midPoint
      : 0;
    const secondHalfAvg = periods.length - midPoint > 0
      ? amounts.slice(midPoint).reduce((sum, a) => sum + a, 0) / (periods.length - midPoint)
      : 0;

    let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
    let changePercent = 0;

    if (firstHalfAvg > 0 && secondHalfAvg > 0) {
      changePercent = ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100;
      if (changePercent > 5) {
        trend = 'increasing';
      } else if (changePercent < -5) {
        trend = 'decreasing';
      }
    }

    categoryTrends.push({
      categoryId: category.categoryId,
      categoryName: category.categoryName,
      categoryIcon: category.categoryIcon,
      categoryColor: category.categoryColor,
      periods,
      totalAmount,
      averageAmount,
      trend,
      changePercent,
    });
  });

  return categoryTrends.sort((a, b) => b.totalAmount - a.totalAmount);
}

/**
 * Spending Predictions
 * Simple linear regression to predict future spending
 */
export interface SpendingPrediction {
  period: string;
  periodLabel: string;
  predictedIncome: number;
  predictedExpense: number;
  predictedNet: number;
  confidence: 'high' | 'medium' | 'low';
}

export function calculateSpendingPredictions(
  transactions: Transaction[],
  startDate: string,
  endDate: string,
  periodsAhead: number = 3
): SpendingPrediction[] {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  // Get historical monthly data
  const monthlyData: Array<{ month: string; income: number; expense: number }> = [];
  let currentMonth = new Date(start);
  
  while (currentMonth <= end) {
    const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
    const actualEnd = monthEnd > end ? end : monthEnd;
    
    const monthTransactions = transactions.filter((t) => {
      const tDate = new Date(t.date);
      return tDate >= currentMonth && tDate <= actualEnd;
    });

    const income = monthTransactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    const expense = monthTransactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    monthlyData.push({
      month: `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}`,
      income,
      expense,
    });

    currentMonth.setMonth(currentMonth.getMonth() + 1);
  }

  if (monthlyData.length < 2) {
    return []; // Need at least 2 data points for prediction
  }

  // Simple moving average prediction (average of last 3 months)
  const predictions: SpendingPrediction[] = [];
  const lookback = Math.min(3, monthlyData.length);
  const recentData = monthlyData.slice(-lookback);
  
  const avgIncome = recentData.reduce((sum, d) => sum + d.income, 0) / recentData.length;
  const avgExpense = recentData.reduce((sum, d) => sum + d.expense, 0) / recentData.length;

  // Calculate variance for confidence
  const incomeVariance = recentData.reduce((sum, d) => sum + Math.pow(d.income - avgIncome, 2), 0) / recentData.length;
  const expenseVariance = recentData.reduce((sum, d) => sum + Math.pow(d.expense - avgExpense, 2), 0) / recentData.length;
  
  const incomeStdDev = Math.sqrt(incomeVariance);
  const expenseStdDev = Math.sqrt(expenseVariance);
  
  const incomeCoefficient = avgIncome > 0 ? incomeStdDev / avgIncome : 1;
  const expenseCoefficient = avgExpense > 0 ? expenseStdDev / avgExpense : 1;
  
  const avgCoefficient = (incomeCoefficient + expenseCoefficient) / 2;
  
  let confidence: 'high' | 'medium' | 'low' = 'medium';
  if (avgCoefficient < 0.2) {
    confidence = 'high';
  } else if (avgCoefficient > 0.5) {
    confidence = 'low';
  }

  // Generate predictions for future periods
  let predictionDate = new Date(end);
  predictionDate.setMonth(predictionDate.getMonth() + 1);

  for (let i = 0; i < periodsAhead; i++) {
    const monthEnd = new Date(predictionDate.getFullYear(), predictionDate.getMonth() + 1, 0);
    
    predictions.push({
      period: `${predictionDate.getFullYear()}-${String(predictionDate.getMonth() + 1).padStart(2, '0')}`,
      periodLabel: predictionDate.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }),
      predictedIncome: avgIncome,
      predictedExpense: avgExpense,
      predictedNet: avgIncome - avgExpense,
      confidence,
    });

    predictionDate.setMonth(predictionDate.getMonth() + 1);
  }

  return predictions;
}
