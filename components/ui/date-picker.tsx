import { ThemedText } from '@/components/themed-text';
import { BorderRadius, Colors, ComponentSizes, Spacing, Typography } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { Alert, Modal, Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface DatePickerProps {
  label?: string;
  value?: string; // ISO date string (YYYY-MM-DD)
  onChange: (date: string) => void;
  placeholder?: string;
  error?: string;
  helperText?: string;
  minimumDate?: Date;
  maximumDate?: Date;
  size?: 'small' | 'medium' | 'large';
}

// Lazy load DateTimePicker to avoid errors if not installed
let DateTimePicker: any = null;
try {
  DateTimePicker = require('@react-native-community/datetimepicker').default;
} catch (e) {
  // DateTimePicker not available
}

export function DatePicker({
  label,
  value,
  onChange,
  placeholder = 'Select date',
  error,
  helperText,
  minimumDate,
  maximumDate,
  size = 'medium',
}: DatePickerProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [modalVisible, setModalVisible] = useState(false);
  const insets = useSafeAreaInsets();
  const [tempDate, setTempDate] = useState<Date>(() => {
    if (value) {
      const parsed = new Date(value);
      return isNaN(parsed.getTime()) ? new Date() : parsed;
    }
    return new Date();
  });

  const inputHeight = size === 'small' ? ComponentSizes.inputHeightSmall : size === 'large' ? ComponentSizes.inputHeightLarge : ComponentSizes.inputHeightMedium;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setModalVisible(false);
      if (event.type === 'set' && selectedDate) {
        const dateString = selectedDate.toISOString().split('T')[0];
        onChange(dateString);
      }
    } else {
      if (selectedDate) {
        setTempDate(selectedDate);
      }
    }
  };

  const handleIOSConfirm = () => {
    const dateString = tempDate.toISOString().split('T')[0];
    onChange(dateString);
    setModalVisible(false);
  };

  // Android - Native date picker
  if (Platform.OS === 'android') {
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
            styles.dateButton,
            {
              backgroundColor: colors.cardBackground,
              borderColor: error ? colors.error : colors.border,
              borderWidth: error ? 1.5 : 1,
              minHeight: inputHeight,
            },
          ]}
          onPress={() => {
            if (!DateTimePicker) {
              Alert.alert(
                'Date Picker Unavailable',
                'The date picker requires a native rebuild. Please run:\nnpx expo prebuild && npx expo run:android'
              );
              return;
            }
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setModalVisible(true);
          }}
          activeOpacity={0.7}>
          <ThemedText
            style={[
              styles.dateText,
              Typography.bodyMedium,
              { color: value ? colors.text : colors.textTertiary },
            ]}>
            {value ? formatDate(value) : placeholder}
          </ThemedText>
          <MaterialIcons
            name="calendar-today"
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

        {modalVisible && DateTimePicker && (
          <DateTimePicker
            value={value ? (() => {
              const parsed = new Date(value);
              return isNaN(parsed.getTime()) ? new Date() : parsed;
            })() : new Date()}
            mode="date"
            display="default"
            onChange={handleDateChange}
            minimumDate={minimumDate}
            maximumDate={maximumDate}
          />
        )}
      </View>
    );
  }

  // iOS - Modal-based picker
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
          styles.dateButton,
          {
            backgroundColor: colors.cardBackground,
            borderColor: error ? colors.error : colors.border,
            borderWidth: error ? 1.5 : 1,
            minHeight: inputHeight,
          },
        ]}
        onPress={() => {
          if (!DateTimePicker) {
            Alert.alert(
              'Date Picker Unavailable',
              'The date picker requires a native rebuild. Please run:\nnpx expo prebuild && npx expo run:ios'
            );
            return;
          }
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          if (value) {
            const parsed = new Date(value);
            setTempDate(isNaN(parsed.getTime()) ? new Date() : parsed);
          } else {
            setTempDate(new Date());
          }
          setModalVisible(true);
        }}
        activeOpacity={0.7}>
        <ThemedText
          style={[
            styles.dateText,
            Typography.bodyMedium,
            { color: value ? colors.text : colors.textTertiary },
          ]}>
          {value ? formatDate(value) : placeholder}
        </ThemedText>
        <MaterialIcons
          name="calendar-today"
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
                {label || 'Select Date'}
              </ThemedText>
              <TouchableOpacity onPress={handleIOSConfirm}>
                <ThemedText
                  style={[Typography.labelLarge, { color: colors.primary }]}>
                  Done
                </ThemedText>
              </TouchableOpacity>
            </View>

            {DateTimePicker && (
              <DateTimePicker
                value={tempDate}
                mode="date"
                display="spinner"
                onChange={handleDateChange}
                minimumDate={minimumDate}
                maximumDate={maximumDate}
                style={styles.iosPicker}
              />
            )}
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
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  dateText: {
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
    paddingBottom: Spacing.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.xl,
    borderBottomWidth: 1,
  },
  iosPicker: {
    height: 200,
  },
});
