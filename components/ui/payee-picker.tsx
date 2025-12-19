/**
 * Payee Picker Component - Multi-select from Contacts with Search
 */

import { ThemedText } from '@/components/themed-text';
import { BorderRadius, Colors, ComponentSizes, Spacing, Typography } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Contact } from '@/types';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useCallback, useMemo, useState } from 'react';
import { FlatList, Modal, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface PayeePickerProps {
  contacts: Contact[];
  selectedPayeeIds: string[];
  onPayeeIdsChange: (payeeIds: string[]) => void;
  label?: string;
  error?: string;
  placeholder?: string;
  onAddContact?: () => void;
}

export function PayeePicker({
  contacts,
  selectedPayeeIds,
  onPayeeIdsChange,
  label,
  error,
  placeholder = 'Select payees',
  onAddContact,
}: PayeePickerProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'] || Colors.light;
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const insets = useSafeAreaInsets();

  // Memoize selected payees to avoid recalculating on every render
  const selectedPayees = useMemo(
    () => contacts.filter((c) => selectedPayeeIds.includes(c.id)),
    [contacts, selectedPayeeIds]
  );

  // Memoize selected IDs set for O(1) lookup
  const selectedPayeeIdsSet = useMemo(
    () => new Set(selectedPayeeIds),
    [selectedPayeeIds]
  );

  // Filter contacts based on search query
  const filteredContacts = useMemo(() => {
    if (!searchQuery.trim()) {
      return contacts;
    }
    const query = searchQuery.toLowerCase();
    return contacts.filter(
      (contact) =>
        contact.name.toLowerCase().includes(query) ||
        contact.phoneNumber?.toLowerCase().includes(query) ||
        contact.email?.toLowerCase().includes(query)
    );
  }, [contacts, searchQuery]);

  const togglePayee = useCallback((payeeId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (selectedPayeeIdsSet.has(payeeId)) {
      onPayeeIdsChange(selectedPayeeIds.filter((id) => id !== payeeId));
    } else {
      onPayeeIdsChange([...selectedPayeeIds, payeeId]);
    }
  }, [selectedPayeeIds, selectedPayeeIdsSet, onPayeeIdsChange]);

  // Memoized render item for FlatList
  const renderContactItem = useCallback(({ item: contact }: { item: Contact }) => {
    const isSelected = selectedPayeeIdsSet.has(contact.id);
    return (
      <TouchableOpacity
        style={[
          styles.option,
          { borderBottomColor: colors.borderLight },
          isSelected && {
            backgroundColor: colors.backgroundSecondary,
          },
        ]}
        onPress={() => togglePayee(contact.id)}
        activeOpacity={0.7}>
        <View style={styles.optionContent}>
          <View style={[styles.payeeAvatar, { backgroundColor: colors.primary + '20' }]}>
            <ThemedText style={[styles.payeeAvatarText, { color: colors.primary }]}>
              {contact.name.charAt(0).toUpperCase()}
            </ThemedText>
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
              {contact.name}
            </ThemedText>
            {contact.phoneNumber && (
              <ThemedText
                style={[
                  styles.optionSubtext,
                  Typography.bodySmall,
                  { color: colors.textSecondary },
                ]}>
                {contact.phoneNumber}
              </ThemedText>
            )}
            {contact.email && (
              <ThemedText
                style={[
                  styles.optionSubtext,
                  Typography.bodySmall,
                  { color: colors.textSecondary },
                ]}>
                {contact.email}
              </ThemedText>
            )}
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
  }, [colors, selectedPayeeIdsSet, togglePayee]);

  const keyExtractor = useCallback((item: Contact) => item.id, []);

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
        {selectedPayees.length > 0 ? (
          <View style={styles.selectedPayeesContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.selectedPayeesScroll}>
              {selectedPayees.map((payee) => (
                <View
                  key={payee.id}
                  style={[
                    styles.selectedPayeeChip,
                    { backgroundColor: colors.primary + '20', borderColor: colors.primary },
                  ]}>
                  <View style={[styles.chipAvatar, { backgroundColor: colors.primary }]}>
                    <ThemedText style={styles.chipAvatarText}>
                      {payee.name.charAt(0).toUpperCase()}
                    </ThemedText>
                  </View>
                  <ThemedText
                    style={[
                      styles.selectedPayeeChipText,
                      Typography.bodySmall,
                      { color: colors.primary },
                    ]}>
                    {payee.name}
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
                {label || 'Select Payees'}
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
                placeholder="Search contacts by name, phone, or email..."
                placeholderTextColor={colors.textTertiary}
                style={[
                  styles.searchInput,
                  Typography.bodyMedium,
                  { color: colors.text, backgroundColor: colors.cardBackground },
                ]}
                autoCapitalize="none"
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
            
            {onAddContact && (
              <TouchableOpacity
                style={[styles.addButton, { borderBottomColor: colors.border }]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setModalVisible(false);
                  setSearchQuery('');
                  onAddContact();
                }}
                activeOpacity={0.7}>
                <MaterialIcons name="add" size={ComponentSizes.iconMedium} color={colors.primary} />
                <ThemedText
                  style={[Typography.bodyMedium, { color: colors.primary, marginLeft: Spacing.sm }]}>
                  Add New Contact
                </ThemedText>
              </TouchableOpacity>
            )}

            {filteredContacts.length === 0 ? (
              <View style={styles.emptyState}>
                <ThemedText
                  style={[
                    Typography.bodyMedium,
                    { color: colors.textSecondary, textAlign: 'center' },
                  ]}>
                  {searchQuery
                    ? 'No contacts found matching your search.'
                    : 'No contacts available. Add contacts in settings.'}
                </ThemedText>
              </View>
            ) : (
              <FlatList
                data={filteredContacts}
                renderItem={renderContactItem}
                keyExtractor={keyExtractor}
                style={styles.optionsList}
                removeClippedSubviews={true}
                maxToRenderPerBatch={10}
                updateCellsBatchingPeriod={50}
                initialNumToRender={15}
                windowSize={10}
                ListEmptyComponent={
                  <View style={styles.emptyState}>
                    <ThemedText
                      style={[
                        Typography.bodyMedium,
                        { color: colors.textSecondary, textAlign: 'center' },
                      ]}>
                      {searchQuery
                        ? 'No contacts found matching your search.'
                        : 'No contacts available. Add contacts in settings.'}
                    </ThemedText>
                  </View>
                }
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
  selectedPayeesContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  selectedPayeesScroll: {
    flex: 1,
  },
  selectedPayeeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    marginRight: Spacing.xs,
  },
  chipAvatar: {
    width: 20,
    height: 20,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.xs,
  },
  chipAvatarText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  selectedPayeeChipText: {
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
  addButton: {
    flexDirection: 'row',
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
  payeeAvatar: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  payeeAvatarText: {
    fontSize: 16,
    fontWeight: '600',
  },
  optionInfo: {
    flex: 1,
  },
  optionText: {
    flex: 1,
    marginBottom: 2,
  },
  optionSubtext: {
    fontSize: 12,
  },
});
