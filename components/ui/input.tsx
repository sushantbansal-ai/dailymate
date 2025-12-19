import { ThemedText } from '@/components/themed-text';
import { BorderRadius, Colors, ComponentSizes, Spacing, Typography } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { StyleSheet, TextInput, TextInputProps, View } from 'react-native';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  size?: 'small' | 'medium' | 'large';
}

export function Input({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  size = 'medium',
  style,
  ...props
}: InputProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const borderColor = error ? colors.error : colors.border;
  
  const inputHeight = size === 'small' ? ComponentSizes.inputHeightSmall : size === 'large' ? ComponentSizes.inputHeightLarge : ComponentSizes.inputHeightMedium;

  return (
    <View style={styles.container}>
      {label && (
        <ThemedText
          style={[styles.label, Typography.labelMedium, { color: colors.text }]}>
          {label} {error && <ThemedText style={{ color: colors.error }}>*</ThemedText>}
        </ThemedText>
      )}
      
      <View
        style={[
          styles.inputWrapper,
          {
            backgroundColor: colors.cardBackground,
            borderColor,
            borderWidth: error ? 1.5 : 1,
            minHeight: inputHeight,
          },
        ]}>
        {leftIcon && <View style={styles.iconLeft}>{leftIcon}</View>}
        
        <TextInput
          style={[
            styles.input,
            Typography.bodyMedium,
            {
              color: colors.text,
              flex: 1,
            },
            style,
          ]}
          placeholderTextColor={colors.textTertiary}
          {...props}
        />
        
        {rightIcon && <View style={styles.iconRight}>{rightIcon}</View>}
      </View>
      
      {(error || helperText) && (
        <ThemedText
          style={[
            styles.helperText,
            Typography.bodySmall,
            { color: error ? colors.error : colors.textSecondary },
          ]}>
          {error || helperText}
        </ThemedText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.lg,
  },
  label: {
    marginBottom: Spacing.sm,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
  },
  input: {
    paddingVertical: Spacing.md,
  },
  iconLeft: {
    marginRight: Spacing.md,
  },
  iconRight: {
    marginLeft: Spacing.md,
  },
  helperText: {
    marginTop: Spacing.sm,
  },
});
