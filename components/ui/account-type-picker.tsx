/**
 * Categorized Account Type Picker Component - Select Dropdown Style
 */

import { ThemedText } from '@/components/themed-text';
import { BorderRadius, Colors, ComponentSizes, Spacing, Typography } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { AccountType, AccountTypeInfo } from '@/types';
import { ACCOUNT_TYPES_INFO } from '@/utils/constants';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { Modal, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface AccountTypePickerProps {
  selectedType?: AccountType;
  onTypeSelect: (type: AccountType) => void;
  label?: string;
  error?: string;
  placeholder?: string;
}

export function AccountTypePicker({
  selectedType,
  onTypeSelect,
  label,
  error,
  placeholder = 'Select account type',
}: AccountTypePickerProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'] || Colors.light;
  const [modalVisible, setModalVisible] = useState(false);
  const insets = useSafeAreaInsets();

  // Group account types by category
  const typesByCategory = ACCOUNT_TYPES_INFO.reduce((acc, typeInfo) => {
    const category = typeInfo.category || 'Other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(typeInfo);
    return acc;
  }, {} as Record<string, AccountTypeInfo[]>);

  const categoryOrder = ['Basic', 'Bank Accounts', 'Deposits & Investments', 'Credit', 'Other'];

  const selectedTypeInfo = ACCOUNT_TYPES_INFO.find((info) => info.value === selectedType);

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
            minHeight: ComponentSizes.inputHeightMedium,
          },
        ]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setModalVisible(true);
        }}
        activeOpacity={0.7}>
        {selectedTypeInfo ? (
          <View style={styles.selectedTypeContent}>
            <ThemedText style={styles.selectedTypeIcon}>{selectedTypeInfo.icon}</ThemedText>
            <ThemedText
              style={[
                styles.selectText,
                Typography.bodyMedium,
                { color: colors.text },
              ]}>
              {selectedTypeInfo.label}
            </ThemedText>
          </View>
        ) : (
          <ThemedText
            style={[
              styles.selectText,
              Typography.bodyMedium,
              { color: colors.textTertiary },
            ]}>
            {placeholder}
          </ThemedText>
        )}
        <MaterialIcons
          name="keyboard-arrow-down"
          size={ComponentSizes.iconMedium}
          color={colors.textSecondary}
        />
      </TouchableOpacity>
      
      {error && (
        <ThemedText
          style={[
            styles.helperText,
            Typography.bodySmall,
            { color: colors.error },
          ]}>
          {error}
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
                {label || 'Select Account Type'}
              </ThemedText>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <ThemedText
                  style={[Typography.labelLarge, { color: colors.primary }]}>
                  Done
                </ThemedText>
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.optionsList}>
              {categoryOrder.map((category) => {
                const categoryTypes = typesByCategory[category];
                if (!categoryTypes || categoryTypes.length === 0) return null;

                return (
                  <View key={category}>
                    <View style={styles.categoryHeader}>
                      <ThemedText
                        style={[
                          styles.categoryLabel,
                          Typography.labelSmall,
                          { color: colors.textSecondary },
                        ]}>
                        {category}
                      </ThemedText>
                    </View>
                    {categoryTypes.map((typeInfo) => {
                      const isSelected = selectedType === typeInfo.value;
                      return (
                        <TouchableOpacity
                          key={typeInfo.value}
                          style={[
                            styles.option,
                            { borderBottomColor: colors.borderLight },
                            isSelected && {
                              backgroundColor: colors.backgroundSecondary,
                            },
                          ]}
                          onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            onTypeSelect(typeInfo.value);
                            setModalVisible(false);
                          }}
                          activeOpacity={0.7}>
                          <View style={styles.optionContent}>
                            <ThemedText style={styles.optionIcon}>{typeInfo.icon}</ThemedText>
                            <View style={styles.optionInfo}>
                              <ThemedText
                                style={[
                                  styles.optionText,
                                  Typography.bodyMedium,
                                  {
                                    color: isSelected ? colors.primary : colors.text,
                                    fontWeight: isSelected ? '600' : '400',
                                  },
                                ]}>
                                {typeInfo.label}
                              </ThemedText>
                            </View>
                          </View>
                          {isSelected && (
                            <MaterialIcons
                              name="check"
                              size={ComponentSizes.iconMedium}
                              color={colors.primary}
                            />
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                );
              })}
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
  selectedTypeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  selectedTypeIcon: {
    fontSize: 20,
    marginRight: Spacing.sm,
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
  categoryHeader: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  categoryLabel: {
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: '600',
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
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionIcon: {
    fontSize: 24,
    marginRight: Spacing.md,
  },
  optionInfo: {
    flex: 1,
  },
  optionText: {
    flex: 1,
  },
});
