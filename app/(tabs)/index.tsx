import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Card } from '@/components/ui/card';
import { BorderRadius, Colors, ComponentSizes, Shadows, Spacing, Typography } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { useAccounts } from '@/hooks/use-accounts';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useFormatting } from '@/hooks/use-formatting';
import { useStocks } from '@/hooks/use-stocks';
import { useTransactions } from '@/hooks/use-transactions';
import { DEFAULT_RECENT_TRANSACTIONS_LIMIT, getScrollViewBottomPadding } from '@/utils/constants';
import { MaterialIcons } from '@expo/vector-icons';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function DashboardScreen() {
  const { accounts, transactions, categories, loading, refreshData } = useApp();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();

  // Use custom hooks for reusable logic
  const { formatCurrency, formatDate } = useFormatting();
  const { getStockBalance } = useStocks(accounts);
  const { totalBalance: baseTotalBalance } = useAccounts(accounts);
  
  // Calculate total balance including live stock prices
  const totalBalance = accounts.reduce((sum, account) => {
    if (account.type === 'Stocks') {
      return sum + getStockBalance(account);
    }
    return sum + account.balance;
  }, 0);
  const { getRecent, getTransactionTypeColor, getCategory } = useTransactions(
    transactions,
    categories
  );

  const recentTransactions = getRecent(DEFAULT_RECENT_TRANSACTIONS_LIMIT);

  // Calculate income and expenses
  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: getScrollViewBottomPadding(insets.bottom) }]}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refreshData} />
        }>
        {/* Header with Logo and Tagline */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={[styles.logoContainer, { backgroundColor: colors.primary }, Shadows.sm]}>
              <MaterialIcons name="account-balance-wallet" size={26} color="#FFFFFF" />
            </View>
            <ThemedText style={[Typography.displayMedium, styles.appTitle, { color: colors.text }]}>
              DailyMate
            </ThemedText>
          </View>
          <ThemedText style={[Typography.bodyMedium, styles.tagline, { color: colors.textSecondary }]}>
            Track your daily expenses
          </ThemedText>
        </View>

        {/* Current Balance Card */}
        <View style={[styles.balanceCard, { backgroundColor: colors.primary }, Shadows.lg]}>
          <ThemedText style={[Typography.labelMedium, styles.balanceLabel]}>
            Current Balance
          </ThemedText>
          <ThemedText style={[Typography.displayLarge, styles.balanceAmount]}>
            {formatCurrency(totalBalance)}
          </ThemedText>

          {/* Income and Expenses Sub-cards */}
          <View style={styles.incomeExpenseContainer}>
            <View style={[styles.incomeExpenseCard, { backgroundColor: colors.accentWarm }]}>
              <View style={[styles.iconContainer, { backgroundColor: 'rgba(255, 255, 255, 0.5)' }]}>
                <MaterialIcons name="trending-up" size={18} color={colors.primary} />
              </View>
              <View style={styles.incomeExpenseContent}>
                <ThemedText style={[Typography.labelSmall, styles.incomeExpenseLabel, { color: colors.text }]}>
                  Income
                </ThemedText>
                <ThemedText style={[Typography.h4, styles.incomeExpenseAmount, { color: colors.success }]}>
                  {formatCurrency(totalIncome)}
                </ThemedText>
              </View>
            </View>
            <View style={[styles.incomeExpenseCard, { backgroundColor: colors.accent }]}>
              <View style={[styles.iconContainer, { backgroundColor: 'rgba(255, 255, 255, 0.5)' }]}>
                <MaterialIcons name="trending-down" size={18} color={colors.primary} />
              </View>
              <View style={styles.incomeExpenseContent}>
                <ThemedText style={[Typography.labelSmall, styles.incomeExpenseLabel, { color: colors.text }]}>
                  Expenses
                </ThemedText>
                <ThemedText style={[Typography.h4, styles.incomeExpenseAmount, { color: colors.error }]}>
                  {formatCurrency(totalExpenses)}
                </ThemedText>
              </View>
            </View>
          </View>
        </View>

        {/* Recent Transactions */}
        <View style={styles.section}>
          <ThemedText style={[Typography.h2, styles.sectionTitle, { color: colors.text }]}>
            Recent Transactions
          </ThemedText>
          {recentTransactions.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
              <MaterialIcons name="receipt-long" size={64} color={colors.textTertiary} />
              <ThemedText style={[Typography.h4, styles.emptyText, { color: colors.text }]}>
                No transactions yet
              </ThemedText>
              <ThemedText style={[Typography.bodyMedium, styles.emptySubtext, { color: colors.textSecondary }]}>
                Add your first transaction!
              </ThemedText>
            </View>
          ) : (
            recentTransactions.map((transaction) => {
              const category = getCategory(transaction.categoryId);
              const amountColor = getTransactionTypeColor(transaction.type);
              const isExpense = transaction.type === 'expense';
              const isSplit = transaction.splits && transaction.splits.length > 0;
              const splitCount = transaction.splits?.length || 0;

              return (
                <Card 
                  key={transaction.id} 
                  variant="default" 
                  style={styles.transactionCard}
                  padding="lg"
                  onPress={() => {
                    // Future: Navigate to transaction details
                  }}>
                  <View style={styles.transactionRow}>
                    <View style={styles.transactionLeft}>
                      <View style={[styles.categoryIconContainer, { backgroundColor: colors.backgroundSecondary }]}>
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
                        <ThemedText style={[Typography.bodySmall, styles.transactionDate, { color: colors.textSecondary }]}>
                          {formatDate(transaction.date, 'medium')}
                        </ThemedText>
                      </View>
                    </View>
                    <ThemedText
                      style={[Typography.h4, styles.transactionAmount, { color: amountColor }]}>
                      {isExpense ? '-' : '+'}
                      {formatCurrency(transaction.amount)}
                    </ThemedText>
                  </View>
                </Card>
              );
            })
          )}
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
  },
  header: {
    marginBottom: Spacing.xl,
    paddingTop: Spacing.sm,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  logoContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.lg,
  },
  appTitle: {
    letterSpacing: -1,
  },
  tagline: {
    marginLeft: 64, // Align with title
  },
  balanceCard: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    marginBottom: Spacing.xl,
    minHeight: 220,
  },
  balanceLabel: {
    color: '#FFFFFF',
    opacity: 0.9,
    marginBottom: Spacing.sm,
  },
  balanceAmount: {
    color: '#FFFFFF',
    marginBottom: Spacing.xl,
    letterSpacing: -2,
  },
  incomeExpenseContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: 'auto',
  },
  incomeExpenseCard: {
    flex: 1,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  incomeExpenseContent: {
    flex: 1,
  },
  incomeExpenseLabel: {
    marginBottom: Spacing.xxs,
  },
  incomeExpenseAmount: {
    letterSpacing: -0.5,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    marginBottom: Spacing.lg,
    letterSpacing: -0.5,
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
  categoryIcon: {
    fontSize: 24,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionDescriptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.xxs,
  },
  transactionDescription: {
    fontWeight: '600',
  },
  splitIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  transactionDate: {
    lineHeight: 18,
  },
  transactionAmount: {
    fontWeight: '600',
    marginLeft: Spacing.lg,
  },
  emptyCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.xxxl,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 240,
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
