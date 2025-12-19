/**
 * Categorized Category Picker Component - Select Dropdown Style
 */

import { ThemedText } from '@/components/themed-text';
import { BorderRadius, Colors, ComponentSizes, Spacing, Typography } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Category } from '@/types';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { Modal, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface CategoryPickerProps {
  categories: Category[];
  selectedCategoryId?: string;
  onCategorySelect: (categoryId: string) => void;
  label?: string;
  filterType?: 'income' | 'expense';
  error?: string;
  placeholder?: string;
}

export function CategoryPicker({
  categories,
  selectedCategoryId,
  onCategorySelect,
  label,
  filterType,
  error,
  placeholder = 'Select a category',
}: CategoryPickerProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'] || Colors.light;
  const [modalVisible, setModalVisible] = useState(false);
  const insets = useSafeAreaInsets();

  // Filter categories by type if needed
  const filteredCategories = filterType
    ? categories.filter((c) => c.type === filterType)
    : categories;

  // Group categories by type
  const incomeCategories = filteredCategories.filter((c) => c.type === 'income');
  const expenseCategories = filteredCategories.filter((c) => c.type === 'expense');

  const selectedCategory = filteredCategories.find((c) => c.id === selectedCategoryId);

  if (filteredCategories.length === 0) {
    return (
      <View style={styles.container}>
        {label && (
          <ThemedText
            style={[styles.label, Typography.labelMedium, { color: colors.text }]}>
            {label} {error && <ThemedText style={{ color: colors.error }}>*</ThemedText>}
          </ThemedText>
        )}
        <ThemedText style={[styles.errorText, { color: colors.error }]}>
          No categories available. Create a category first!
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
            minHeight: ComponentSizes.inputHeightMedium,
          },
        ]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setModalVisible(true);
        }}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={selectedCategory ? `Selected category: ${selectedCategory.name}` : placeholder}
        accessibilityHint="Opens category selection dialog">
        {selectedCategory ? (
          <View style={styles.selectedCategoryContent}>
            <View style={[styles.categoryIconContainer, { backgroundColor: selectedCategory.color ? selectedCategory.color + '20' : colors.backgroundSecondary }]}>
              <ThemedText style={styles.selectedCategoryIcon}>{selectedCategory.icon}</ThemedText>
            </View>
            <View style={styles.selectedCategoryInfo}>
              <ThemedText
                style={[
                  styles.selectText,
                  Typography.bodyMedium,
                  { color: colors.text },
                ]}>
                {selectedCategory.name}
              </ThemedText>
              <View style={[styles.categoryTypeBadge, {
                backgroundColor: selectedCategory.type === 'income' ? colors.income + '20' : colors.expense + '20'
              }]}>
                <ThemedText style={[styles.categoryTypeText, {
                  color: selectedCategory.type === 'income' ? colors.income : colors.expense
                }]}>
                  {selectedCategory.type === 'income' ? 'Income' : 'Expense'}
                </ThemedText>
              </View>
            </View>
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
                {label || 'Select Category'}
              </ThemedText>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <ThemedText
                  style={[Typography.labelLarge, { color: colors.primary }]}>
                  Done
                </ThemedText>
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.optionsList}>
              {incomeCategories.length > 0 && (
                <View>
                  <View style={styles.categoryHeader}>
                    <ThemedText
                      style={[
                        styles.categoryLabel,
                        Typography.labelSmall,
                        { color: colors.income },
                      ]}>
                      Income Categories
                    </ThemedText>
                  </View>
                  {incomeCategories.map((category) => {
                    const isSelected = selectedCategoryId === category.id;
                    return (
                      <TouchableOpacity
                        key={category.id}
                        style={[
                          styles.option,
                          { borderBottomColor: colors.borderLight },
                          isSelected && {
                            backgroundColor: colors.backgroundSecondary,
                          },
                        ]}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          onCategorySelect(category.id);
                          setModalVisible(false);
                        }}
                        activeOpacity={0.7}>
                        <View style={styles.optionContent}>
                          <View style={[styles.optionIconContainer, { backgroundColor: category.color ? category.color + '20' : colors.backgroundSecondary }]}>
                            <ThemedText style={styles.optionIcon}>{category.icon}</ThemedText>
                          </View>
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
                              {category.name}
                            </ThemedText>
                            <View style={[styles.optionTypeBadge, {
                              backgroundColor: colors.income + '20'
                            }]}>
                              <ThemedText style={[styles.optionTypeText, {
                                color: colors.income
                              }]}>
                                Income
                              </ThemedText>
                            </View>
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
              )}

              {expenseCategories.length > 0 && (
                <View>
                  <View style={styles.categoryHeader}>
                    <ThemedText
                      style={[
                        styles.categoryLabel,
                        Typography.labelSmall,
                        { color: colors.expense },
                      ]}>
                      Expense Categories
                    </ThemedText>
                  </View>
                  {expenseCategories.map((category) => {
                    const isSelected = selectedCategoryId === category.id;
                    return (
                      <TouchableOpacity
                        key={category.id}
                        style={[
                          styles.option,
                          { borderBottomColor: colors.borderLight },
                          isSelected && {
                            backgroundColor: colors.backgroundSecondary,
                          },
                        ]}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          onCategorySelect(category.id);
                          setModalVisible(false);
                        }}
                        activeOpacity={0.7}>
                        <View style={styles.optionContent}>
                          <View style={[styles.optionIconContainer, { backgroundColor: category.color ? category.color + '20' : colors.backgroundSecondary }]}>
                            <ThemedText style={styles.optionIcon}>{category.icon}</ThemedText>
                          </View>
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
                              {category.name}
                            </ThemedText>
                            <View style={[styles.optionTypeBadge, {
                              backgroundColor: colors.expense + '20'
                            }]}>
                              <ThemedText style={[styles.optionTypeText, {
                                color: colors.expense
                              }]}>
                                Expense
                              </ThemedText>
                            </View>
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
              )}
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
  selectedCategoryContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIconContainer: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  selectedCategoryIcon: {
    fontSize: 20,
  },
  selectedCategoryInfo: {
    flex: 1,
  },
  categoryTypeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    marginTop: 4,
  },
  categoryTypeText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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
  optionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  optionIcon: {
    fontSize: 24,
  },
  optionInfo: {
    flex: 1,
  },
  optionText: {
    marginBottom: 4,
  },
  optionTypeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  optionTypeText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
