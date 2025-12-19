/**
 * Labels Picker Component - Multi-select Dropdown Style with Search and Create
 */

import { ThemedText } from '@/components/themed-text';
import { BorderRadius, Colors, ComponentSizes, Spacing, Typography } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Label } from '@/types';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useCallback, useMemo, useState } from 'react';
import { FlatList, Modal, ScrollView, StyleSheet, TextInput, TouchableOpacity, View, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Predefined colors for labels (matching add label screen)
const LABEL_COLORS = [
  '#FF6B6B', '#4ECDC4', '#FFE66D', '#95E1D3', '#F38181',
  '#AA96DA', '#FCBAD3', '#A8E6CF', '#FFD3A5', '#C7CEEA',
  '#6BCB77', '#4D96FF', '#9B59B6', '#E74C3C', '#3498DB',
  '#1ABC9C', '#F39C12', '#E67E22', '#34495E', '#16A085',
];

interface LabelsPickerProps {
  labels: Label[];
  selectedLabelIds: string[];
  onLabelsChange: (labelIds: string[]) => void;
  label?: string;
  error?: string;
  placeholder?: string;
  onAddLabel?: (labelName: string, color: string) => Promise<Label | null>;
}

export function LabelsPicker({
  labels,
  selectedLabelIds,
  onLabelsChange,
  label,
  error,
  placeholder = 'Select labels',
  onAddLabel,
}: LabelsPickerProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'] || Colors.light;
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const insets = useSafeAreaInsets();

  // Memoize selected labels
  const selectedLabels = useMemo(
    () => labels.filter((l) => selectedLabelIds.includes(l.id)),
    [labels, selectedLabelIds]
  );

  // Memoize selected IDs set for O(1) lookup
  const selectedLabelIdsSet = useMemo(
    () => new Set(selectedLabelIds),
    [selectedLabelIds]
  );

  // Filter labels based on search query
  const filteredLabels = useMemo(() => {
    if (!searchQuery.trim()) {
      return labels;
    }
    const query = searchQuery.toLowerCase();
    return labels.filter((labelItem) =>
      labelItem.name.toLowerCase().includes(query)
    );
  }, [labels, searchQuery]);

  // Check if search query matches an existing label
  const existingLabelMatch = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const query = searchQuery.trim().toLowerCase();
    return labels.find((l) => l.name.toLowerCase() === query);
  }, [labels, searchQuery]);

  // Check if we should show "Create Label" option
  const shouldShowCreateOption = useMemo(() => {
    return (
      onAddLabel &&
      searchQuery.trim().length > 0 &&
      !existingLabelMatch &&
      filteredLabels.length === 0
    );
  }, [onAddLabel, searchQuery, existingLabelMatch, filteredLabels.length]);

  const toggleLabel = useCallback((labelId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (selectedLabelIdsSet.has(labelId)) {
      onLabelsChange(selectedLabelIds.filter((id) => id !== labelId));
    } else {
      onLabelsChange([...selectedLabelIds, labelId]);
    }
  }, [selectedLabelIds, selectedLabelIdsSet, onLabelsChange]);

  const handleCreateLabel = useCallback(async () => {
    if (!onAddLabel || !searchQuery.trim()) return;

    const labelName = searchQuery.trim();
    
    // Check if label already exists (case-insensitive)
    const existingLabel = labels.find(
      (l) => l.name.toLowerCase() === labelName.toLowerCase()
    );
    
    if (existingLabel) {
      // If label exists, just select it
      if (!selectedLabelIdsSet.has(existingLabel.id)) {
        toggleLabel(existingLabel.id);
      }
      setSearchQuery('');
      return;
    }

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      // Pick a random color from predefined colors
      const randomColor = LABEL_COLORS[Math.floor(Math.random() * LABEL_COLORS.length)];
      const newLabel = await onAddLabel(labelName, randomColor);
      
      if (newLabel) {
        // Automatically select the newly created label
        if (!selectedLabelIdsSet.has(newLabel.id)) {
          onLabelsChange([...selectedLabelIds, newLabel.id]);
        }
        setSearchQuery('');
      }
    } catch (error) {
      console.error('Error creating label:', error);
      Alert.alert('Error', 'Failed to create label. Please try again.');
    }
  }, [onAddLabel, searchQuery, labels, selectedLabelIds, selectedLabelIdsSet, toggleLabel, onLabelsChange]);

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
        {selectedLabels.length > 0 ? (
          <View style={styles.selectedLabelsContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.selectedLabelsScroll}>
              {selectedLabels.map((label) => (
                <View
                  key={label.id}
                  style={[
                    styles.selectedLabelChip,
                    { backgroundColor: label.color + '20', borderColor: label.color },
                  ]}>
                  <ThemedText
                    style={[
                      styles.selectedLabelText,
                      Typography.bodySmall,
                      { color: label.color },
                    ]}>
                    {label.name}
                  </ThemedText>
                </View>
              ))}
            </ScrollView>
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
        onRequestClose={() => {
          setSearchQuery('');
          setModalVisible(false);
        }}>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => {
            setSearchQuery('');
            setModalVisible(false);
          }}>
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
                {label || 'Select Labels'}
              </ThemedText>
              <TouchableOpacity
                onPress={() => {
                  setSearchQuery('');
                  setModalVisible(false);
                }}>
                <ThemedText
                  style={[Typography.labelLarge, { color: colors.primary }]}>
                  Done
                </ThemedText>
              </TouchableOpacity>
            </View>
            
            {/* Search Input */}
            <View style={[styles.searchContainer, { borderBottomColor: colors.border }]}>
              <MaterialIcons name="search" size={20} color={colors.textSecondary} style={styles.searchIcon} />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search labels or type to create new..."
                placeholderTextColor={colors.textTertiary}
                style={[
                  styles.searchInput,
                  Typography.bodyMedium,
                  { color: colors.text, backgroundColor: colors.cardBackground },
                ]}
                autoCapitalize="words"
                autoCorrect={false}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity
                  onPress={() => setSearchQuery('')}
                  style={styles.clearButton}>
                  <MaterialIcons name="close" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              )}
            </View>

            {/* Create Label Option */}
            {shouldShowCreateOption && (
              <TouchableOpacity
                style={[styles.createButton, { borderBottomColor: colors.border }]}
                onPress={handleCreateLabel}
                activeOpacity={0.7}>
                <MaterialIcons name="add-circle-outline" size={ComponentSizes.iconMedium} color={colors.primary} />
                <View style={styles.createButtonContent}>
                  <ThemedText
                    style={[Typography.bodyMedium, { color: colors.primary, fontWeight: '600' }]}>
                    Create "{searchQuery.trim()}"
                  </ThemedText>
                  <ThemedText
                    style={[Typography.bodySmall, { color: colors.textSecondary, marginTop: 2 }]}>
                    Create a new label with this name
                  </ThemedText>
                </View>
              </TouchableOpacity>
            )}
            
            {filteredLabels.length === 0 && !shouldShowCreateOption ? (
              <View style={styles.emptyState}>
                <ThemedText
                  style={[
                    Typography.bodyMedium,
                    { color: colors.textSecondary, textAlign: 'center' },
                  ]}>
                  {searchQuery
                    ? 'No labels found matching your search.'
                    : 'No labels available. Create labels in settings.'}
                </ThemedText>
              </View>
            ) : (
              <FlatList
                data={filteredLabels}
                renderItem={({ item: labelItem }) => {
                  const isSelected = selectedLabelIdsSet.has(labelItem.id);
                  return (
                    <TouchableOpacity
                      key={labelItem.id}
                      style={[
                        styles.option,
                        { borderBottomColor: colors.borderLight },
                        isSelected && {
                          backgroundColor: colors.backgroundSecondary,
                        },
                      ]}
                      onPress={() => toggleLabel(labelItem.id)}
                      activeOpacity={0.7}>
                      <View style={styles.optionContent}>
                        <View
                          style={[
                            styles.labelColorDot,
                            { backgroundColor: labelItem.color },
                          ]}
                        />
                        <ThemedText
                          style={[
                            styles.optionText,
                            Typography.bodyMedium,
                            {
                              color: isSelected ? colors.primary : colors.text,
                              fontWeight: isSelected ? '600' : '400',
                            },
                          ]}>
                          {labelItem.name}
                        </ThemedText>
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
                }}
                keyExtractor={(item) => item.id}
                style={styles.optionsList}
                removeClippedSubviews={true}
                maxToRenderPerBatch={10}
                updateCellsBatchingPeriod={50}
                initialNumToRender={15}
                windowSize={10}
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
  select: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    minHeight: ComponentSizes.inputHeightMedium,
  },
  selectedLabelsContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  selectedLabelsScroll: {
    flex: 1,
  },
  selectedLabelChip: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    marginRight: Spacing.xs,
  },
  selectedLabelText: {
    fontSize: 12,
    fontWeight: '600',
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
  emptyState: {
    padding: Spacing.xl,
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
  labelColorDot: {
    width: 16,
    height: 16,
    borderRadius: BorderRadius.full,
    marginRight: Spacing.md,
  },
  optionText: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  searchIcon: {
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    fontSize: 16,
  },
  clearButton: {
    marginLeft: Spacing.sm,
    padding: Spacing.xs,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.xl,
    borderBottomWidth: 1,
    minHeight: ComponentSizes.minTouchTarget,
  },
  createButtonContent: {
    marginLeft: Spacing.md,
    flex: 1,
  },
});
