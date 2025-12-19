import { ThemedView } from '@/components/themed-view';
import { BorderRadius, Colors, Shadows, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { ReactNode } from 'react';
import { StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';

interface CardProps {
  children: ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  variant?: 'default' | 'elevated' | 'outlined' | 'flat';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export function Card({
  children,
  style,
  onPress,
  variant = 'default',
  padding = 'lg',
}: CardProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const getPaddingValue = () => {
    switch (padding) {
      case 'none': return 0;
      case 'sm': return Spacing.md;
      case 'md': return Spacing.lg;
      case 'lg': return Spacing.xl;
      default: return Spacing.lg;
    }
  };

  const getCardStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      borderRadius: BorderRadius.lg,
      padding: getPaddingValue(),
      backgroundColor: colors.cardBackground,
    };

    switch (variant) {
      case 'elevated':
        return {
          ...baseStyle,
          ...Shadows.md,
          borderWidth: 0,
        };
      case 'outlined':
        return {
          ...baseStyle,
          borderWidth: 1,
          borderColor: colors.cardBorder,
          ...Shadows.none,
        };
      case 'flat':
        return {
          ...baseStyle,
          borderWidth: 0,
          ...Shadows.none,
        };
      case 'default':
      default:
        return {
          ...baseStyle,
          borderWidth: 1,
          borderColor: colors.cardBorder,
          ...Shadows.xs,
        };
    }
  };

  const cardContent = (
    <ThemedView
      style={[styles.card, getCardStyle(), style]}
      lightColor={colors.cardBackground}
      darkColor={colors.cardBackground}>
      {children}
    </ThemedView>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {cardContent}
      </TouchableOpacity>
    );
  }

  return cardContent;
}

const styles = StyleSheet.create({
  card: {
    // Base styles applied via getCardStyle
  },
});
