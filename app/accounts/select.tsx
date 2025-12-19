import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Card } from '@/components/ui/card';
import { BorderRadius, Colors, Spacing } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Account } from '@/types';
import { getAccountIcon, getScrollViewBottomPadding } from '@/utils/constants';
import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function SelectAccountScreen() {
  const { accounts } = useApp();
  const router = useRouter();
  const params = useLocalSearchParams();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'] || Colors.light;
  const insets = useSafeAreaInsets();
  const type = params.type as 'from' | 'to';
  const current = params.current as string;

  const handleSelect = (account: Account) => {
    // Navigate back with selected account
    if (type === 'from') {
      router.setParams({ fromAccountId: account.id });
    } else {
      router.setParams({ toAccountId: account.id });
    }
    router.back();
  };

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={colors.iconActive || colors.primary} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <ThemedText type="title" style={styles.headerTitle}>Select Account</ThemedText>
        </View>
        <View style={styles.placeholder} />
      </View>

      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={[styles.content, { paddingBottom: getScrollViewBottomPadding(insets.bottom) }]}>
        {accounts.length === 0 ? (
          <Card>
            <ThemedText style={styles.emptyText}>
              No accounts available. Create an account first!
            </ThemedText>
          </Card>
        ) : (
          accounts.map((account) => (
            <TouchableOpacity
              key={account.id}
              onPress={() => handleSelect(account)}
              disabled={account.id === current}>
              <Card
                style={[
                  styles.accountCard,
                  account.id === current && styles.accountCardDisabled,
                ]}>
                <View style={styles.accountRow}>
                  <View style={[styles.accountColor, { backgroundColor: account.color }]}>
                    <ThemedText style={styles.accountIcon}>
                      {getAccountIcon(account.type, account.icon)}
                    </ThemedText>
                  </View>
                  <View style={styles.accountInfo}>
                    <ThemedText type="defaultSemiBold">{account.name}</ThemedText>
                    <ThemedText style={styles.accountType}>{account.type}</ThemedText>
                  </View>
                  <ThemedText type="defaultSemiBold">
                    ₹{account.balance.toLocaleString('en-IN')}
                  </ThemedText>
                </View>
              </Card>
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
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
  },
  accountCard: {
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  accountCardDisabled: {
    opacity: 0.5,
  },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  accountColor: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    marginRight: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountIcon: {
    fontSize: 24,
  },
  accountInfo: {
    flex: 1,
  },
  accountType: {
    fontSize: 13,
    opacity: 0.7,
    marginTop: Spacing.xs,
    color: '#6B7280',
  },
  emptyText: {
    textAlign: 'center',
    opacity: 0.7,
    color: '#6B7280',
  },
});
