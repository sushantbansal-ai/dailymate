/**
 * Time Picker Component
 */

import { ThemedText } from '@/components/themed-text';
import { BorderRadius, Colors, ComponentSizes, Spacing, Typography } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { Modal, Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface TimePickerProps {
  label?: string;
  value?: string; // Time string (HH:mm format)
  onChange: (time: string) => void;
  placeholder?: string;
  error?: string;
  helperText?: string;
  size?: 'small' | 'medium' | 'large';
}

// Lazy load DateTimePicker to avoid errors if not installed
let DateTimePicker: any = null;
try {
  DateTimePicker = require('@react-native-community/datetimepicker').default;
} catch (e) {
  // DateTimePicker not available
}

export function TimePicker({
  label,
  value,
  onChange,
  placeholder = 'Select time',
  error,
  helperText,
  size = 'medium',
}: TimePickerProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [modalVisible, setModalVisible] = useState(false);
  const insets = useSafeAreaInsets();
  
  const parseTime = (timeString?: string): Date => {
    if (!timeString) return new Date();
    const [hours, minutes] = timeString.split(':').map(Number);
    const date = new Date();
    date.setHours(hours || 0, minutes || 0, 0, 0);
    return date;
  };

  const [tempTime, setTempTime] = useState<Date>(parseTime(value));

  const inputHeight = size === 'small' ? ComponentSizes.inputHeightSmall : size === 'large' ? ComponentSizes.inputHeightLarge : ComponentSizes.inputHeightMedium;

  const formatTime = (timeString?: string) => {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours || '0', 10);
    const min = minutes || '00';
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${min} ${period}`;
  };

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    if (Platform.OS === 'android') {
      setModalVisible(false);
    }
    if (selectedTime) {
      setTempTime(selectedTime);
      const hours = selectedTime.getHours().toString().padStart(2, '0');
      const minutes = selectedTime.getMinutes().toString().padStart(2, '0');
      onChange(`${hours}:${minutes}`);
    }
  };

  const handleConfirm = () => {
    const hours = tempTime.getHours().toString().padStart(2, '0');
    const minutes = tempTime.getMinutes().toString().padStart(2, '0');
    onChange(`${hours}:${minutes}`);
    setModalVisible(false);
  };

  if (!DateTimePicker) {
    return (
      <View style={styles.container}>
        {label && (
          <ThemedText
            style={[styles.label, Typography.labelMedium, { color: colors.text }]}>
            {label} {error && <ThemedText style={{ color: colors.error }}>*</ThemedText>}
          </ThemedText>
        )}
        <ThemedText style={[styles.errorText, { color: colors.error }]}>
          Time picker is not available. Please install @react-native-community/datetimepicker
        </ThemedText>
      </View>
    );
  }

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
          setTempTime(parseTime(value));
          if (Platform.OS === 'android') {
            setModalVisible(true);
          } else {
            setModalVisible(true);
          }
        }}
        activeOpacity={0.7}>
        <ThemedText
          style={[
            styles.selectText,
            Typography.bodyMedium,
            { color: value ? colors.text : colors.textTertiary },
          ]}>
          {value ? formatTime(value) : placeholder}
        </ThemedText>
        <MaterialIcons
          name="access-time"
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

      {Platform.OS === 'ios' && (
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
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <ThemedText
                    style={[Typography.labelLarge, { color: colors.textSecondary }]}>
                    Cancel
                  </ThemedText>
                </TouchableOpacity>
                <ThemedText style={[Typography.h4, { color: colors.text }]}>
                  {label || 'Select Time'}
                </ThemedText>
                <TouchableOpacity onPress={handleConfirm}>
                  <ThemedText
                    style={[Typography.labelLarge, { color: colors.primary }]}>
                    Done
                  </ThemedText>
                </TouchableOpacity>
              </View>
              
              <View style={styles.pickerContainer}>
                <DateTimePicker
                  value={tempTime}
                  mode="time"
                  display="spinner"
                  onChange={handleTimeChange}
                  textColor={colors.text}
                />
              </View>
            </View>
          </TouchableOpacity>
        </Modal>
      )}

      {Platform.OS === 'android' && modalVisible && (
        <DateTimePicker
          value={tempTime}
          mode="time"
          display="default"
          onChange={handleTimeChange}
        />
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
  errorText: {
    marginTop: Spacing.sm,
    fontSize: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(57, 69, 65, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    paddingBottom: Spacing.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.xl,
    borderBottomWidth: 1,
  },
  pickerContainer: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
});
