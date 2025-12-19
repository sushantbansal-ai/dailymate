import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BorderRadius, Colors, Shadows, Spacing } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getScrollViewBottomPadding } from '@/utils/constants';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { RefreshControl, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface SettingsMenuItem {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  iconColor: string;
  onPress: () => void;
  badge?: string | number;
}

export default function SettingsScreen() {
  const { accounts, categories, labels, contacts, budgets, goals, bills = [], loading, refreshData } = useApp();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'] || Colors.light;
  const insets = useSafeAreaInsets();

  const settingsMenuItems: SettingsMenuItem[] = [
    {
      id: 'accounts',
      title: 'Manage Accounts',
      subtitle: `${accounts.length} account${accounts.length !== 1 ? 's' : ''}`,
      icon: 'account-balance-wallet',
      iconColor: colors.primary,
      onPress: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push('/accounts');
      },
      badge: accounts.length,
    },
    {
      id: 'categories',
      title: 'Manage Categories',
      subtitle: `${categories.length} categor${categories.length !== 1 ? 'ies' : 'y'}`,
      icon: 'category',
      iconColor: colors.info,
      onPress: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push('/categories');
      },
      badge: categories.length,
    },
    {
      id: 'stats',
      title: 'Reports & Analytics',
      subtitle: 'View transaction statistics',
      icon: 'bar-chart',
      iconColor: colors.success,
      onPress: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push('/reports');
      },
    },
    {
      id: 'labels',
      title: 'Manage Labels',
      subtitle: `${labels.length} label${labels.length !== 1 ? 's' : ''}`,
      icon: 'label',
      iconColor: colors.warning,
      onPress: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push('/labels');
      },
      badge: labels.length,
    },
    {
      id: 'contacts',
      title: 'Manage Contacts',
      subtitle: `${contacts.length} contact${contacts.length !== 1 ? 's' : ''}`,
      icon: 'contacts',
      iconColor: colors.info,
      onPress: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push('/contacts');
      },
      badge: contacts.length,
    },
    {
      id: 'budgets',
      title: 'Manage Budgets',
      subtitle: `${budgets.length} budget${budgets.length !== 1 ? 's' : ''}`,
      icon: 'account-balance-wallet',
      iconColor: colors.primary,
      onPress: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push('/budgets');
      },
      badge: budgets.length,
    },
    {
      id: 'goals',
      title: 'Manage Goals',
      subtitle: `${goals.length} goal${goals.length !== 1 ? 's' : ''}`,
      icon: 'track-changes',
      iconColor: colors.success,
      onPress: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push('/goals');
      },
      badge: goals.length,
    },
    {
      id: 'bills',
      title: 'Bills & Reminders',
      subtitle: `${bills.length} bill${bills.length !== 1 ? 's' : ''}`,
      icon: 'receipt-long',
      iconColor: colors.warning,
      onPress: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push('/bills');
      },
      badge: bills.length,
    },
    {
      id: 'all-transactions',
      title: 'All Transactions',
      subtitle: 'View and filter all transactions',
      icon: 'receipt-long',
      iconColor: colors.info,
      onPress: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push('/transactions');
      },
    },
    {
      id: 'security',
      title: 'Security & Privacy',
      subtitle: 'App lock, biometric, PIN, and password',
      icon: 'security',
      iconColor: colors.error,
      onPress: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push('/security');
      },
    },
  ];

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <ThemedText type="title" style={styles.headerTitle}>Settings</ThemedText>
          <ThemedText style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            Manage your accounts and categories
          </ThemedText>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: getScrollViewBottomPadding(insets.bottom) }]}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refreshData} />
        }>
        {/* Settings Menu */}
        <View style={styles.section}>
          <ThemedText type="subtitle" style={[styles.sectionTitle, { color: colors.text }]}>
            Settings
          </ThemedText>
          <View style={styles.menuList}>
            {settingsMenuItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[styles.menuItem, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
                activeOpacity={0.7}
                onPress={item.onPress}
                accessibilityRole="button"
                accessibilityLabel={item.title}
                accessibilityHint={item.subtitle}>
                <View style={styles.menuItemContent}>
                  <View style={[styles.menuItemIcon, { backgroundColor: item.iconColor ? item.iconColor + '20' : colors.backgroundSecondary }]}>
                    <MaterialIcons name={item.icon as keyof typeof MaterialIcons.glyphMap} size={24} color={item.iconColor} />
                  </View>
                  <View style={styles.menuItemInfo}>
                    <ThemedText type="defaultSemiBold" style={[styles.menuItemTitle, { color: colors.text }]}>
                      {item.title}
                    </ThemedText>
                    <ThemedText style={[styles.menuItemSubtitle, { color: colors.textSecondary }]}>
                      {item.subtitle}
                    </ThemedText>
                  </View>
                  {item.badge !== undefined && (
                    <View style={[styles.badge, { backgroundColor: item.iconColor }]}>
                      <ThemedText style={styles.badgeText}>{item.badge}</ThemedText>
                    </View>
                  )}
                  <MaterialIcons name="chevron-right" size={20} color={colors.textTertiary} />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
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
    paddingBottom: Spacing.md,
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
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: Spacing.md,
  },
  menuList: {
    gap: Spacing.sm,
  },
  menuItem: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    ...Shadows.sm,
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  menuItemInfo: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 16,
    marginBottom: 2,
  },
  menuItemSubtitle: {
    fontSize: 13,
  },
  badge: {
    minWidth: 24,
    height: 24,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.sm,
    marginRight: Spacing.sm,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
});
