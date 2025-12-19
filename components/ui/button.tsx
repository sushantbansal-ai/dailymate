import { ThemedText } from '@/components/themed-text';
import { BorderRadius, Colors, ComponentSizes, Shadows, Spacing, Typography } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { ActivityIndicator, TouchableOpacity, View, ViewStyle } from 'react-native';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode | string;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  style?: ViewStyle;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  style,
}: ButtonProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const handlePress = () => {
    if (!disabled && !loading) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onPress();
    }
  };

  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: BorderRadius.md,
      paddingHorizontal: size === 'small' ? Spacing.lg : size === 'large' ? Spacing.xl : Spacing.xl,
      minHeight: size === 'small' ? ComponentSizes.buttonHeightSmall : size === 'large' ? ComponentSizes.buttonHeightLarge : ComponentSizes.buttonHeightMedium,
      gap: Spacing.sm,
      opacity: disabled ? 0.5 : 1,
    };

    if (fullWidth) {
      baseStyle.width = '100%';
    }

    switch (variant) {
      case 'primary':
        return {
          ...baseStyle,
          backgroundColor: colors.primary,
          ...Shadows.sm,
        };
      case 'secondary':
        return {
          ...baseStyle,
          backgroundColor: colors.backgroundSecondary,
          borderWidth: 1,
          borderColor: colors.border,
        };
      case 'outline':
        return {
          ...baseStyle,
          backgroundColor: 'transparent',
          borderWidth: 1.5,
          borderColor: colors.primary,
        };
      case 'ghost':
        return {
          ...baseStyle,
          backgroundColor: 'transparent',
        };
      case 'destructive':
        return {
          ...baseStyle,
          backgroundColor: colors.error,
          ...Shadows.sm,
        };
      default:
        return baseStyle;
    }
  };

  const getTextColor = () => {
    if (variant === 'primary' || variant === 'destructive') {
      return '#FFFFFF';
    }
    if (variant === 'outline') {
      return colors.primary;
    }
    return colors.text;
  };

  const textStyle = size === 'small' ? Typography.buttonSmall : size === 'large' ? Typography.buttonLarge : Typography.buttonMedium;

  const renderIcon = () => {
    if (!icon) return null;
    
    const iconSize = size === 'small' ? 16 : size === 'large' ? 24 : 20;
    
    if (typeof icon === 'string') {
      return (
        <MaterialIcons 
          name={icon as keyof typeof MaterialIcons.glyphMap} 
          size={iconSize} 
          color={getTextColor()} 
        />
      );
    }
    
    return <View>{icon}</View>;
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      style={[getButtonStyle(), style]}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: disabled || loading }}>
      {loading ? (
        <ActivityIndicator size="small" color={getTextColor()} />
      ) : (
        <>
          {icon && iconPosition === 'left' && renderIcon()}
          <ThemedText
            style={[
              textStyle,
              {
                color: getTextColor(),
                textAlign: 'center',
              },
            ]}>
            {title}
          </ThemedText>
          {icon && iconPosition === 'right' && renderIcon()}
        </>
      )}
    </TouchableOpacity>
  );
}
