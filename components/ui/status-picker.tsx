/**
 * Transaction Status Picker Component
 */

import { ThemedText } from '@/components/themed-text';
import { BorderRadius, Colors, ComponentSizes, Spacing, Typography } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { TransactionStatus } from '@/types';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { Modal, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface StatusPickerProps {
  selectedStatus?: TransactionStatus;
  onStatusSelect: (status: TransactionStatus) => void;
  label?: string;
  error?: string;
  placeholder?: string;
}

const STATUS_OPTIONS: { value: TransactionStatus; label: string; icon: string; color: string }[] = [
  { value: 'pending', label: 'Pending', icon: '⏳', color: '#F59E0B' },
  { value: 'completed', label: 'Completed', icon: '✅', color: '#10B981' },
  { value: 'cancelled', label: 'Cancelled', icon: '❌', color: '#EF4444' },
  { value: 'failed', label: 'Failed', icon: '⚠️', color: '#EF4444' },
];

export function StatusPicker({
  selectedStatus,
  onStatusSelect,
  label,
  error,
  placeholder = 'Select status',
}: StatusPickerProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'] || Colors.light;
  const [modalVisible, setModalVisible] = useState(false);
  const insets = useSafeAreaInsets();

  const selectedStatusOption = STATUS_OPTIONS.find((opt) => opt.value === selectedStatus);

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
        {selectedStatusOption ? (
          <View style={styles.selectedStatusContent}>
            <ThemedText style={styles.selectedStatusIcon}>{selectedStatusOption.icon}</ThemedText>
            <ThemedText
              style={[
                styles.selectText,
                Typography.bodyMedium,
                { color: colors.text },
              ]}>
              {selectedStatusOption.label}
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
                {label || 'Select Status'}
              </ThemedText>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <ThemedText
                  style={[Typography.labelLarge, { color: colors.primary }]}>
                  Done
                </ThemedText>
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.optionsList}>
              {STATUS_OPTIONS.map((statusOption) => {
                const isSelected = selectedStatus === statusOption.value;
                return (
                  <TouchableOpacity
                    key={statusOption.value}
                    style={[
                      styles.option,
                      { borderBottomColor: colors.borderLight },
                      isSelected && {
                        backgroundColor: colors.backgroundSecondary,
                      },
                    ]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      onStatusSelect(statusOption.value);
                      setModalVisible(false);
                    }}
                    activeOpacity={0.7}>
                    <View style={styles.optionContent}>
                      <ThemedText style={styles.optionIcon}>{statusOption.icon}</ThemedText>
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
                          {statusOption.label}
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
  selectedStatusContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  selectedStatusIcon: {
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
