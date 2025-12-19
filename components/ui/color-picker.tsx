/**
 * Categorized Color Picker Component - Select Dropdown Style
 */

import { ThemedText } from '@/components/themed-text';
import { BorderRadius, Colors, ComponentSizes, Spacing, Typography } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { Modal, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ColorPickerProps {
  colors: string[];
  selectedColor: string;
  onColorSelect: (color: string) => void;
  label?: string;
  placeholder?: string;
}

interface ColorCategory {
  name: string;
  colors: string[];
}

/**
 * Categorize colors into groups
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const cleanHex = hex.replace('#', '');
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);
  return { r, g, b };
}

function categorizeColors(colors: string[]): ColorCategory[] {
  const categories: ColorCategory[] = [
    {
      name: 'Reds & Pinks',
      colors: colors.filter((c) => {
        const { r, g, b } = hexToRgb(c);
        return r > g && r > b && r > 150;
      }),
    },
    {
      name: 'Blues & Cyans',
      colors: colors.filter((c) => {
        const { r, g, b } = hexToRgb(c);
        return b > r && b > g && b > 150;
      }),
    },
    {
      name: 'Greens',
      colors: colors.filter((c) => {
        const { r, g, b } = hexToRgb(c);
        return g > r && g > b && g > 150;
      }),
    },
    {
      name: 'Yellows & Oranges',
      colors: colors.filter((c) => {
        const { r, g, b } = hexToRgb(c);
        return r > 200 && g > 150 && b < 150;
      }),
    },
    {
      name: 'Purples & Violets',
      colors: colors.filter((c) => {
        const { r, g, b } = hexToRgb(c);
        return r > 100 && b > 150 && g < r && g < b;
      }),
    },
    {
      name: 'Neutrals',
      colors: colors.filter((c) => {
        const { r, g, b } = hexToRgb(c);
        const avg = (r + g + b) / 3;
        const diff = Math.max(r, g, b) - Math.min(r, g, b);
        return diff < 50 || (avg > 50 && avg < 150);
      }),
    },
  ];

  // Filter out empty categories and add remaining colors to "Others"
  const categorizedColors = new Set<string>();
  const filteredCategories = categories.filter((cat) => {
    cat.colors.forEach((c) => categorizedColors.add(c));
    return cat.colors.length > 0;
  });

  const remainingColors = colors.filter((c) => !categorizedColors.has(c));
  if (remainingColors.length > 0) {
    filteredCategories.push({
      name: 'Others',
      colors: remainingColors,
    });
  }

  return filteredCategories;
}

export function ColorPicker({
  colors,
  selectedColor,
  onColorSelect,
  label,
  placeholder = 'Select a color',
}: ColorPickerProps) {
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? 'light'] || Colors.light;
  const [modalVisible, setModalVisible] = useState(false);
  const insets = useSafeAreaInsets();
  const categories = categorizeColors(colors);

  const isColorSelected = selectedColor && colors.includes(selectedColor);

  return (
    <View style={styles.container}>
      {label && (
        <ThemedText
          style={[styles.label, Typography.labelMedium, { color: themeColors.text }]}>
          {label}
        </ThemedText>
      )}
      
      <TouchableOpacity
        style={[
          styles.select,
          {
            backgroundColor: themeColors.cardBackground,
            borderColor: themeColors.border,
            borderWidth: 1,
            minHeight: ComponentSizes.inputHeightMedium,
          },
        ]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setModalVisible(true);
        }}
        activeOpacity={0.7}>
        {isColorSelected ? (
          <View style={styles.selectedColorContent}>
            <View
              style={[
                styles.colorSwatch,
                {
                  backgroundColor: selectedColor,
                  borderColor: themeColors.border,
                },
              ]}
            />
            <ThemedText
              style={[
                styles.selectText,
                Typography.bodyMedium,
                { color: themeColors.text },
              ]}>
              {selectedColor.toUpperCase()}
            </ThemedText>
          </View>
        ) : (
          <ThemedText
            style={[
              styles.selectText,
              Typography.bodyMedium,
              { color: themeColors.textTertiary },
            ]}>
            {placeholder}
          </ThemedText>
        )}
        <MaterialIcons
          name="keyboard-arrow-down"
          size={ComponentSizes.iconMedium}
          color={themeColors.textSecondary}
        />
      </TouchableOpacity>

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
                backgroundColor: themeColors.background,
                paddingBottom: Spacing.xl + insets.bottom,
              },
            ]}
            onStartShouldSetResponder={() => true}>
            <View
              style={[
                styles.modalHeader,
                { borderBottomColor: themeColors.border },
              ]}>
              <ThemedText style={[Typography.h4, { color: themeColors.text }]}>
                {label || 'Select Color'}
              </ThemedText>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <ThemedText
                  style={[Typography.labelLarge, { color: themeColors.primary }]}>
                  Done
                </ThemedText>
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.optionsList}>
              {categories.map((category) => (
                <View key={category.name} style={styles.category}>
                  <View style={styles.categoryHeader}>
                    <ThemedText
                      style={[
                        styles.categoryLabel,
                        Typography.labelSmall,
                        { color: themeColors.textSecondary },
                      ]}>
                      {category.name}
                    </ThemedText>
                  </View>
                  <View style={styles.colorGrid}>
                    {category.colors.map((colorOption) => {
                      const isSelected = selectedColor === colorOption;
                      return (
                        <TouchableOpacity
                          key={colorOption}
                          style={[
                            styles.colorButton,
                            {
                              backgroundColor: colorOption,
                              borderColor: themeColors.border,
                            },
                            isSelected && {
                              borderColor: themeColors.text,
                              borderWidth: 3,
                            },
                          ]}
                          onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            onColorSelect(colorOption);
                            setModalVisible(false);
                          }}
                          activeOpacity={0.7}>
                          {isSelected && (
                            <MaterialIcons
                              name="check"
                              size={ComponentSizes.iconSmall}
                              color="#FFFFFF"
                              style={styles.checkmark}
                            />
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
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
  selectedColorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  colorSwatch: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    marginRight: Spacing.sm,
  },
  selectText: {
    flex: 1,
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
  category: {
    marginBottom: Spacing.lg,
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
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.xl,
    gap: Spacing.sm,
  },
  colorButton: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});
