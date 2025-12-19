import { Colors, ComponentSizes, Shadows, Spacing, Typography } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { MaterialIcons } from '@expo/vector-icons';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from './themed-text';

export function TabBarWithFAB({ state, descriptors, navigation }: BottomTabBarProps) {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();

  const tabs = [
    { name: 'index', label: 'Home', icon: 'home' },
    { name: 'transactions', label: 'Stats', icon: 'bar-chart' },
    { name: 'explore', label: 'Budget', icon: 'track-changes' },
    { name: 'settings', label: 'Settings', icon: 'settings' },
  ];

  const leftTabs = tabs.slice(0, 2);
  const rightTabs = tabs.slice(2, 4);

  const renderTab = (tab: typeof tabs[0], index: number) => {
    const isFocused = state.index === index;
    const onPress = () => {
      const event = navigation.emit({
        type: 'tabPress',
        target: state.routes[index].key,
        canPreventDefault: true,
      });

      if (!isFocused && !event.defaultPrevented) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        navigation.navigate(state.routes[index].name);
      }
    };

    return (
      <TouchableOpacity
        key={tab.name}
        onPress={onPress}
        style={styles.tab}
        activeOpacity={0.7}>
        <MaterialIcons
          name={tab.icon as any}
          size={ComponentSizes.iconLarge}
          color={isFocused ? colors.primary : colors.tabIconDefault}
        />
        <ThemedText
          style={[
            Typography.labelSmall,
            styles.tabLabel,
            {
              color: isFocused ? colors.primary : colors.textSecondary,
              fontWeight: isFocused ? '600' : '500',
            },
          ]}>
          {tab.label}
        </ThemedText>
      </TouchableOpacity>
    );
  };

  return (
    <View
      style={[
        styles.tabBar,
        {
          backgroundColor: colors.cardBackground,
          borderTopColor: colors.border,
          paddingBottom: insets.bottom,
        },
        Shadows.sm,
      ]}>
      {/* Left tabs */}
      <View style={styles.tabsGroup}>
        {leftTabs.map((tab, idx) => renderTab(tab, idx))}
      </View>

      {/* FAB */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary }, Shadows.md]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          router.push('/transactions/add');
        }}
        activeOpacity={0.9}
        accessibilityRole="button"
        accessibilityLabel="Add new transaction"
        accessibilityHint="Opens the form to create a new transaction">
        <MaterialIcons name="add" size={ComponentSizes.iconXLarge} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Right tabs */}
      <View style={styles.tabsGroup}>
        {rightTabs.map((tab, idx) => renderTab(tab, idx + 2))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    minHeight: 65,
  },
  tabsGroup: {
    flexDirection: 'row',
    flex: 1,
    justifyContent: 'space-around',
  },
  tab: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    minWidth: ComponentSizes.minTouchTarget,
    minHeight: ComponentSizes.minTouchTarget,
  },
  tabLabel: {
    marginTop: 2,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: Spacing.md,
    marginTop: -28, // Raise above the tab bar
  },
});
