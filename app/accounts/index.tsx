import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BorderRadius, Colors, Shadows, Spacing } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useFormatting } from '@/hooks/use-formatting';
import { useStocks } from '@/hooks/use-stocks';
import { getAccountIcon, getScrollViewBottomPadding } from '@/utils/constants';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function AccountsListScreen() {
  const { accounts, loading, refreshData, deleteAccount } = useApp();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'] || Colors.light;
  const insets = useSafeAreaInsets();
  const { formatCurrency } = useFormatting();
  const { getStockBalance, getStockData, loading: stocksLoading } = useStocks(accounts);
  
  // Calculate total balance including live stock prices
  const totalBalance = useMemo(() => {
    return accounts.reduce((sum, account) => {
      if (account.type === 'Stocks') {
        return sum + getStockBalance(account);
      }
      return sum + account.balance;
    }, 0);
  }, [accounts, getStockBalance]);

  const handleDelete = async (accountId: string) => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete this account? All associated transactions will also be deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            await deleteAccount(accountId);
          },
        },
      ]
    );
  };

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => router.back()} 
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          accessibilityHint="Returns to the previous screen">
          <MaterialIcons name="arrow-back" size={24} color={colors.iconActive || colors.primary} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <ThemedText type="title" style={styles.headerTitle}>Your Accounts</ThemedText>
          <ThemedText style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            Manage your accounts
          </ThemedText>
        </View>
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push('/accounts/add');
          }}
          style={styles.addButton}
          activeOpacity={0.7}>
          <MaterialIcons name="add" size={20} color={colors.primary} />
          <ThemedText style={[styles.addButtonText, { color: colors.primary }]}>Add</ThemedText>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: getScrollViewBottomPadding(insets.bottom) }]}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refreshData} />
        }>
        {/* Total Balance Card */}
        <View style={[styles.totalBalanceCard, { backgroundColor: colors.primary }]}>
          <ThemedText style={styles.totalBalanceLabel}>Total Balance</ThemedText>
          <ThemedText style={styles.totalBalanceAmount}>
            {stocksLoading ? '...' : formatCurrency(totalBalance)}
          </ThemedText>
          {accounts.some(acc => acc.type === 'Stocks' && acc.details?.stockSymbol) && (
            <ThemedText style={styles.totalBalanceSubtext}>
              Includes live stock prices
            </ThemedText>
          )}
        </View>

        {/* Accounts List */}
        {accounts.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
            <MaterialIcons name="account-balance-wallet" size={64} color={colors.textTertiary} />
            <ThemedText style={[styles.emptyText, { color: colors.textSecondary }]}>
              No accounts yet
            </ThemedText>
            <ThemedText style={[styles.emptySubtext, { color: colors.textTertiary }]}>
              Create your first account to get started
            </ThemedText>
          </View>
        ) : (
          accounts.map((account) => (
            <TouchableOpacity
              key={account.id}
              style={[styles.accountCard, { backgroundColor: colors.cardBackground }]}
              activeOpacity={0.7}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push(`/accounts/edit?id=${account.id}`);
              }}>
              <View style={styles.accountRow}>
                <View style={[styles.accountIconContainer, { backgroundColor: account.color + '20' }]}>
                  <ThemedText style={styles.accountIcon}>
                    {getAccountIcon(account.type, account.icon)}
                  </ThemedText>
                </View>
                <View style={styles.accountInfo}>
                  <ThemedText type="defaultSemiBold" style={[styles.accountName, { color: colors.text }]}>
                    {account.name}
                  </ThemedText>
                  {account.type === 'Stocks' && account.details?.stockSymbol ? (
                    <View>
                      <ThemedText style={[styles.accountBalance, { color: colors.text }]}>
                        {formatCurrency(getStockBalance(account))}
                      </ThemedText>
                      {(() => {
                        const stockData = getStockData(account.id);
                        if (stockData?.quote) {
                          const isPositive = stockData.gainLoss >= 0;
                          return (
                            <View style={styles.stockInfo}>
                              <ThemedText style={[styles.stockPrice, { color: colors.textSecondary }]}>
                                {stockData.quote.price.toFixed(2)} {stockData.quote.currency}
                              </ThemedText>
                              <ThemedText style={[
                                styles.stockChange,
                                { color: isPositive ? colors.income : colors.expense }
                              ]}>
                                {isPositive ? '+' : ''}{stockData.gainLossPercent.toFixed(2)}%
                              </ThemedText>
                            </View>
                          );
                        }
                        if (stockData?.loading) {
                          return (
                            <ThemedText style={[styles.stockPrice, { color: colors.textTertiary }]}>
                              Loading...
                            </ThemedText>
                          );
                        }
                        return (
                          <ThemedText style={[styles.accountBalance, { color: colors.textSecondary }]}>
                            {formatCurrency(account.balance)}
                          </ThemedText>
                        );
                      })()}
                    </View>
                  ) : (
                    <ThemedText style={[styles.accountBalance, { color: colors.textSecondary }]}>
                      {formatCurrency(account.balance)}
                    </ThemedText>
                  )}
                </View>
                <View style={styles.accountActions}>
                  <TouchableOpacity
                    onPress={(e) => {
                      e.stopPropagation();
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      router.push(`/accounts/edit?id=${account.id}`);
                    }}
                    style={styles.actionIcon}
                    activeOpacity={0.7}>
                    <MaterialIcons name="edit" size={20} color={colors.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={(e) => {
                      e.stopPropagation();
                      handleDelete(account.id);
                    }}
                    style={styles.actionIcon}
                    activeOpacity={0.7}>
                    <MaterialIcons name="delete-outline" size={20} color={colors.error} />
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          ))
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
    alignItems: 'center',
    padding: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
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
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    fontWeight: '400',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    minHeight: 44,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
  },
  totalBalanceCard: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    marginBottom: Spacing.xl,
    alignItems: 'center',
    ...Shadows.md,
  },
  totalBalanceLabel: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
    marginBottom: Spacing.sm,
    fontWeight: '500',
  },
  totalBalanceAmount: {
    fontSize: 36,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -1,
  },
  totalBalanceSubtext: {
    fontSize: 11,
    color: '#FFFFFF',
    opacity: 0.8,
    marginTop: Spacing.xs,
    fontWeight: '500',
  },
  accountCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    minHeight: 80,
    ...Shadows.sm,
  },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  accountIconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  accountIcon: {
    fontSize: 24,
  },
  accountInfo: {
    flex: 1,
  },
  accountName: {
    fontSize: 16,
    marginBottom: 4,
  },
  accountBalance: {
    fontSize: 14,
  },
  stockInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: 2,
  },
  stockPrice: {
    fontSize: 12,
  },
  stockChange: {
    fontSize: 12,
    fontWeight: '600',
  },
  accountActions: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  actionIcon: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.md,
  },
  emptyCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
    marginTop: Spacing.md,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  emptySubtext: {
    textAlign: 'center',
    fontSize: 14,
  },
});
