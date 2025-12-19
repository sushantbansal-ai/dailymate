/**
 * Categorized Account Picker Component - Select Dropdown Style
 */

import { ThemedText } from '@/components/themed-text';
import { BorderRadius, Colors, ComponentSizes, Spacing, Typography } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useFormatting } from '@/hooks/use-formatting';
import { Account } from '@/types';
import { ACCOUNT_TYPES_INFO } from '@/utils/constants';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { Modal, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface AccountPickerProps {
  accounts: Account[];
  selectedAccountId?: string;
  onAccountSelect: (accountId: string) => void;
  label?: string;
  excludeAccountId?: string;
  error?: string;
  placeholder?: string;
}

export function AccountPicker({
  accounts,
  selectedAccountId,
  onAccountSelect,
  label,
  excludeAccountId,
  error,
  placeholder = 'Select an account',
}: AccountPickerProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'] || Colors.light;
  const { formatCurrency } = useFormatting();
  const [modalVisible, setModalVisible] = useState(false);
  const insets = useSafeAreaInsets();

  // Filter accounts
  const filteredAccounts = excludeAccountId
    ? accounts.filter((acc) => acc.id !== excludeAccountId)
    : accounts;

  // Create a map of account type to category
  const typeToCategory = ACCOUNT_TYPES_INFO.reduce((acc, typeInfo) => {
    acc[typeInfo.value] = typeInfo.category;
    return acc;
  }, {} as Record<string, string>);

  // Group accounts by category
  const accountsByCategory = filteredAccounts.reduce((acc, account) => {
    const category = typeToCategory[account.type] || 'Other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(account);
    return acc;
  }, {} as Record<string, Account[]>);

  const categoryOrder = ['Basic', 'Bank Accounts', 'Deposits & Investments', 'Credit', 'Other'];

  const selectedAccount = filteredAccounts.find((acc) => acc.id === selectedAccountId);

  if (filteredAccounts.length === 0) {
    return (
      <View style={styles.container}>
        {label && (
          <ThemedText
            style={[styles.label, Typography.labelMedium, { color: colors.text }]}>
            {label} {error && <ThemedText style={{ color: colors.error }}>*</ThemedText>}
          </ThemedText>
        )}
        <ThemedText style={[styles.errorText, { color: colors.error }]}>
          No accounts available. Create an account first!
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
        activeOpacity={0.7}>
        {selectedAccount ? (
          <View style={styles.selectedAccountContent}>
            <View style={[styles.accountColorDot, { backgroundColor: selectedAccount.color }]} />
            <View style={styles.selectedAccountInfo}>
              <ThemedText
                style={[
                  styles.selectText,
                  Typography.bodyMedium,
                  { color: colors.text },
                ]}>
                {selectedAccount.name}
              </ThemedText>
              <ThemedText
                style={[
                  styles.selectBalance,
                  Typography.bodySmall,
                  { color: colors.textSecondary },
                ]}>
                {formatCurrency(selectedAccount.balance)}
              </ThemedText>
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
                {label || 'Select Account'}
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
                const categoryAccounts = accountsByCategory[category];
                if (!categoryAccounts || categoryAccounts.length === 0) return null;

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
                    {categoryAccounts.map((account) => {
                      const isSelected = selectedAccountId === account.id;
                      return (
                        <TouchableOpacity
                          key={account.id}
                          style={[
                            styles.option,
                            { borderBottomColor: colors.borderLight },
                            isSelected && {
                              backgroundColor: colors.backgroundSecondary,
                            },
                          ]}
                          onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            onAccountSelect(account.id);
                            setModalVisible(false);
                          }}
                          activeOpacity={0.7}>
                          <View style={styles.optionContent}>
                            <View style={[styles.optionColorDot, { backgroundColor: account.color }]} />
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
                                {account.name}
                              </ThemedText>
                              <ThemedText
                                style={[
                                  styles.optionBalance,
                                  Typography.bodySmall,
                                  { color: colors.textSecondary },
                                ]}>
                                {formatCurrency(account.balance)}
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
  selectedAccountContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  accountColorDot: {
    width: 24,
    height: 24,
    borderRadius: BorderRadius.full,
    marginRight: Spacing.sm,
  },
  selectedAccountInfo: {
    flex: 1,
  },
  selectText: {
    flex: 1,
  },
  selectBalance: {
    marginTop: 2,
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
  optionColorDot: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.full,
    marginRight: Spacing.md,
  },
  optionInfo: {
    flex: 1,
  },
  optionText: {
    marginBottom: 2,
  },
  optionBalance: {
    fontSize: 12,
  },
});
