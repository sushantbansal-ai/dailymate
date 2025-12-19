import { ThemedText } from '@/components/themed-text';
import { BorderRadius, Colors, ComponentSizes, Spacing, Typography } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { Modal, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface SelectOption {
  label: string;
  value: string;
}

interface SelectProps {
  label?: string;
  value?: string;
  options: SelectOption[];
  onValueChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  helperText?: string;
  size?: 'small' | 'medium' | 'large';
}

export function Select({
  label,
  value,
  options,
  onValueChange,
  placeholder = 'Select an option',
  error,
  helperText,
  size = 'medium',
}: SelectProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [modalVisible, setModalVisible] = useState(false);
  const insets = useSafeAreaInsets();

  const selectedOption = options.find((opt) => opt.value === value);
  const inputHeight = size === 'small' ? ComponentSizes.inputHeightSmall : size === 'large' ? ComponentSizes.inputHeightLarge : ComponentSizes.inputHeightMedium;

  return (
    <View style={styles.container}>
      {label && (
        <ThemedText
          style={[styles.label, Typography.labelMedium, { color: colors.text }]}>
          {label} {error && <ThemedText style={{ color: colors.error }}>*</ThemedText>}
        </ThemedText>
      )}
      
      <TouchableOpacity
        style={[
          styles.select,
          {
            backgroundColor: colors.cardBackground,
            borderColor: error ? colors.error : colors.border,
            borderWidth: error ? 1.5 : 1,
            minHeight: inputHeight,
          },
        ]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setModalVisible(true);
        }}
        activeOpacity={0.7}>
        <ThemedText
          style={[
            styles.selectText,
            Typography.bodyMedium,
            { color: selectedOption ? colors.text : colors.textTertiary },
          ]}>
          {selectedOption ? selectedOption.label : placeholder}
        </ThemedText>
        <MaterialIcons
          name="keyboard-arrow-down"
          size={ComponentSizes.iconMedium}
          color={colors.textSecondary}
        />
      </TouchableOpacity>
      
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

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}>
          <View
            style={[
              styles.modalContent,
              {
                backgroundColor: colors.background,
                paddingBottom: Spacing.xl + insets.bottom,
              },
            ]}
            onStartShouldSetResponder={() => true}>
            <View
              style={[
                styles.modalHeader,
                { borderBottomColor: colors.border },
              ]}>
              <ThemedText style={[Typography.h4, { color: colors.text }]}>
                {label || 'Select Option'}
              </ThemedText>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <ThemedText
                  style={[Typography.labelLarge, { color: colors.primary }]}>
                  Done
                </ThemedText>
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.optionsList}>
              {options.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.option,
                    { borderBottomColor: colors.borderLight },
                    value === option.value && {
                      backgroundColor: colors.backgroundSecondary,
                    },
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    onValueChange(option.value);
                    setModalVisible(false);
                  }}
                  activeOpacity={0.7}>
                  <ThemedText
                    style={[
                      styles.optionText,
                      Typography.bodyMedium,
                      {
                        color: value === option.value ? colors.primary : colors.text,
                        fontWeight: value === option.value ? '600' : '400',
                      },
                    ]}>
                    {option.label}
                  </ThemedText>
                  {value === option.value && (
                    <MaterialIcons
                      name="check"
                      size={ComponentSizes.iconMedium}
                      color={colors.primary}
                    />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
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
  select: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  selectText: {
    flex: 1,
  },
  helperText: {
    marginTop: Spacing.sm,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(57, 69, 65, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    maxHeight: '80%',
    paddingBottom: Spacing.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.xl,
    borderBottomWidth: 1,
  },
  optionsList: {
    maxHeight: 400,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    borderBottomWidth: 1,
    minHeight: ComponentSizes.minTouchTarget,
  },
  optionText: {
    flex: 1,
  },
});
