/**
 * Custom Date Range Picker Component
 * Allows users to select custom start and end dates for reports
 */

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { DatePicker } from '@/components/ui/date-picker';
import { BorderRadius, Colors, ComponentSizes, Spacing, Typography } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { Modal, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface CustomDateRangePickerProps {
  visible: boolean;
  onClose: () => void;
  onApply: (startDate: string, endDate: string) => void;
  currentStartDate?: string;
  currentEndDate?: string;
}

export function CustomDateRangePicker({
  visible,
  onClose,
  onApply,
  currentStartDate,
  currentEndDate,
}: CustomDateRangePickerProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();

  const [startDate, setStartDate] = useState<string>(
    currentStartDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState<string>(
    currentEndDate || new Date().toISOString().split('T')[0]
  );

  const handleApply = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (new Date(startDate) > new Date(endDate)) {
      // Swap dates if start is after end
      onApply(endDate, startDate);
    } else {
      onApply(startDate, endDate);
    }
    onClose();
  };

  const handleQuickSelect = (days: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);
    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onClose}
        />
        <View
          style={[
            styles.modalContent,
            {
              backgroundColor: colors.background,
              paddingBottom: insets.bottom,
            },
          ]}
          onStartShouldSetResponder={() => true}
          onMoveShouldSetResponder={() => false}
          onResponderTerminationRequest={() => false}>
          {/* Header */}
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <ThemedText style={[Typography.h4, { color: colors.text }]}>Custom Date Range</ThemedText>
            <TouchableOpacity onPress={onClose}>
              <MaterialIcons name="close" size={ComponentSizes.iconMedium} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Quick Select Buttons */}
          <View style={styles.quickSelectContainer}>
            <ThemedText style={[Typography.bodySmall, { color: colors.textSecondary, marginBottom: Spacing.sm }]}>
              Quick Select
            </ThemedText>
            <View style={styles.quickSelectRow}>
              {[
                { label: '7 Days', days: 7 },
                { label: '30 Days', days: 30 },
                { label: '90 Days', days: 90 },
                { label: '1 Year', days: 365 },
              ].map(({ label, days }) => (
                <TouchableOpacity
                  key={days}
                  style={[
                    styles.quickSelectButton,
                    {
                      backgroundColor: colors.cardBackground,
                      borderColor: colors.border,
                    },
                  ]}
                  onPress={() => handleQuickSelect(days)}
                  activeOpacity={0.7}>
                  <ThemedText style={[Typography.bodySmall, { color: colors.text }]}>{label}</ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Date Pickers */}
          <View style={styles.datePickersContainer}>
            <DatePicker
              label="Start Date"
              value={startDate}
              onChange={setStartDate}
              placeholder="Select start date"
              maximumDate={endDate ? new Date(endDate) : undefined}
            />

            <DatePicker
              label="End Date"
              value={endDate}
              onChange={setEndDate}
              placeholder="Select end date"
              minimumDate={startDate ? new Date(startDate) : undefined}
              maximumDate={new Date()}
            />
          </View>

          {/* Footer Actions */}
          <View style={[styles.footer, { borderTopColor: colors.border }]}>
            <Button
              title="Cancel"
              onPress={onClose}
              variant="secondary"
              style={styles.footerButton}
            />
            <Button
              title="Apply"
              onPress={handleApply}
              variant="primary"
              style={styles.footerButton}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
  },
  quickSelectContainer: {
    padding: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  quickSelectRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  quickSelectButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  datePickersContainer: {
    padding: Spacing.lg,
    paddingTop: Spacing.md,
    gap: Spacing.md,
  },
  footer: {
    flexDirection: 'row',
    padding: Spacing.lg,
    borderTopWidth: 1,
    gap: Spacing.md,
  },
  footerButton: {
    flex: 1,
  },
});

