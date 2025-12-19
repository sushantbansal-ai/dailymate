import { ThemedText } from '@/components/themed-text';
import { BorderRadius, Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';

interface FABProps {
  onPress: () => void;
  style?: ViewStyle;
}

export function FAB({ onPress, style }: FABProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <TouchableOpacity
      style={[
        styles.fab,
        {
          backgroundColor: colors.primary,
          shadowColor: colors.primary,
        },
        style,
      ]}
      onPress={onPress}
      activeOpacity={0.8}>
      <ThemedText style={styles.fabIcon}>+</ThemedText>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  fab: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabIcon: {
    fontSize: 32,
    color: '#FFFFFF',
    fontWeight: '300',
    lineHeight: 32,
  },
});
