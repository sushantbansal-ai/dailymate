import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { DatePicker } from '@/components/ui/date-picker';
import { Input } from '@/components/ui/input';
import { BorderRadius, Colors, ComponentSizes, Spacing, Typography } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getFieldLabelsForAccountType } from '@/services/notifications';
import { AccountDetails, AccountType } from '@/types';
import * as Haptics from 'expo-haptics';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

interface AccountDetailsFormProps {
  accountType: AccountType;
  details: AccountDetails;
  onChange: (details: AccountDetails) => void;
  errors?: Record<string, string>;
}

export function AccountDetailsForm({
  accountType,
  details,
  onChange,
  errors = {},
}: AccountDetailsFormProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const fieldLabels = getFieldLabelsForAccountType(accountType);

  const updateField = (field: string, value: string | number | boolean) => {
    onChange({ ...details, [field]: value });
  };

  const renderField = (field: string, label: string, type: 'text' | 'number' | 'date' | 'select' = 'text', options?: string[], minimumDate?: string) => {
    const value = (details as any)[field];
    const error = errors[field];

    if (type === 'date') {
      // Convert minimumDate string to Date object if provided
      const minDate = minimumDate ? new Date(minimumDate) : undefined;
      
      return (
        <DatePicker
          key={field}
          label={label}
          value={value || undefined}
          onChange={(dateString) => {
            updateField(field, dateString);
          }}
          placeholder="Select date"
          error={error}
          minimumDate={minDate}
        />
      );
    }

    if (type === 'select' && options) {
      return (
        <View key={field} style={styles.section}>
          <ThemedText style={[styles.label, Typography.labelMedium, { color: colors.text }]}>
            {label} {error && <ThemedText style={{ color: colors.error }}>*</ThemedText>}
          </ThemedText>
          <View style={styles.selectOptions}>
            {options.map((option) => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.selectOption,
                  {
                    backgroundColor: value === option ? colors.primary : colors.cardBackground,
                    borderColor: value === option ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  updateField(field, option);
                }}
                activeOpacity={0.7}>
                <ThemedText
                  style={[
                    Typography.bodyMedium,
                    {
                      color: value === option ? '#FFFFFF' : colors.text,
                      fontWeight: value === option ? '600' : '500',
                    },
                  ]}>
                  {option}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </View>
          {error && (
            <ThemedText style={[styles.errorText, Typography.bodySmall, { color: colors.error }]}>
              {error}
            </ThemedText>
          )}
        </View>
      );
    }

    return (
      <Input
        key={field}
        label={label}
        value={value?.toString() || ''}
        onChangeText={(text) => {
          if (type === 'number') {
            const numValue = text === '' ? '' : parseFloat(text);
            updateField(field, numValue);
          } else {
            updateField(field, text);
          }
        }}
        placeholder={`Enter ${label.toLowerCase()}`}
        keyboardType={type === 'number' ? 'decimal-pad' : 'default'}
        error={error}
      />
    );
  };

  // Render fields based on account type
  const renderTypeSpecificFields = () => {
    switch (accountType) {
      case 'Fixed Deposit (FD)':
        return (
          <>
            {renderField('startDate', fieldLabels.startDate || 'Start Date', 'date')}
            {renderField('endDate', fieldLabels.endDate || 'End Date', 'date', undefined, details.startDate)}
            {renderField('principalAmount', fieldLabels.principalAmount || 'Deposit Amount', 'number')}
            {renderField('interestRate', fieldLabels.interestRate || 'Interest Rate (%)', 'number')}
            {renderField('fdTenure', fieldLabels.fdTenure || 'Tenure (months)', 'number')}
            {renderField('fdType', fieldLabels.fdType || 'FD Type', 'select', ['cumulative', 'non-cumulative'])}
          </>
        );

      case 'Recurring Deposit (RD)':
        return (
          <>
            {renderField('startDate', fieldLabels.startDate || 'Start Date', 'date')}
            {renderField('endDate', fieldLabels.endDate || 'End Date', 'date', undefined, details.startDate)}
            {renderField('rdMonthlyAmount', fieldLabels.rdMonthlyAmount || 'Monthly Deposit Amount', 'number')}
            {renderField('interestRate', fieldLabels.interestRate || 'Interest Rate (%)', 'number')}
            {renderField('rdTenure', fieldLabels.rdTenure || 'Tenure (months)', 'number')}
          </>
        );

      case 'Public Provident Fund (PPF)':
        return (
          <>
            {renderField('startDate', fieldLabels.startDate || 'Start Date', 'date')}
            {renderField('ppfAccountNumber', fieldLabels.ppfAccountNumber || 'PPF Account Number', 'text')}
            {renderField('ppfMaturityDate', fieldLabels.ppfMaturityDate || 'Maturity Date', 'date', undefined, details.startDate)}
          </>
        );

      case 'Monthly Income Scheme (MIS)':
        return (
          <>
            {renderField('startDate', fieldLabels.startDate || 'Start Date', 'date')}
            {renderField('endDate', fieldLabels.endDate || 'End Date', 'date', undefined, details.startDate)}
            {renderField('principalAmount', fieldLabels.principalAmount || 'Principal Amount', 'number')}
            {renderField('interestRate', fieldLabels.interestRate || 'Interest Rate (%)', 'number')}
            {renderField('misMonthlyIncome', fieldLabels.misMonthlyIncome || 'Monthly Income Amount', 'number')}
          </>
        );

      case 'National Pension System (NPS)':
        return (
          <>
            {renderField('npsPRAN', fieldLabels.npsPRAN || 'PRAN', 'text')}
            {renderField('npsTier', fieldLabels.npsTier || 'NPS Tier', 'select', ['Tier I', 'Tier II'])}
          </>
        );

      case 'Mutual Fund':
        return (
          <>
            {renderField('mutualFundScheme', fieldLabels.mutualFundScheme || 'Scheme Name', 'text')}
            {renderField('mutualFundFolioNumber', fieldLabels.mutualFundFolioNumber || 'Folio Number', 'text')}
            {renderField('mutualFundNav', fieldLabels.mutualFundNav || 'NAV (Current)', 'number')}
          </>
        );

      case 'Stocks':
        return (
          <>
            {renderField('stockSymbol', fieldLabels.stockSymbol || 'Stock Symbol', 'text')}
            {renderField('stockExchange', fieldLabels.stockExchange || 'Exchange', 'select', ['NSE', 'BSE', 'NYSE', 'NASDAQ', 'Other'])}
            {renderField('stockQuantity', fieldLabels.stockQuantity || 'Quantity', 'number')}
            {renderField('stockPurchasePrice', fieldLabels.stockPurchasePrice || 'Purchase Price', 'number')}
            <Card style={styles.infoCard} variant="outlined" padding="md">
              <ThemedText style={[Typography.bodySmall, { color: colors.textSecondary }]}>
                💡 Tip: For Indian stocks (NSE/BSE), enter symbol like RELIANCE, TCS, INFY. For US stocks, enter symbol like AAPL, GOOGL, MSFT.
              </ThemedText>
            </Card>
          </>
        );

      case 'Bonds':
        return (
          <>
            {renderField('bondFaceValue', fieldLabels.bondFaceValue || 'Face Value', 'number')}
            {renderField('bondCouponRate', fieldLabels.bondCouponRate || 'Coupon Rate (%)', 'number')}
            {renderField('bondMaturityDate', fieldLabels.bondMaturityDate || 'Maturity Date', 'date')}
          </>
        );

      case 'Credit Card':
        return (
          <>
            {renderField('creditCardNumber', fieldLabels.creditCardNumber || 'Card Number (Last 4)', 'text')}
            {renderField('creditCardLimit', fieldLabels.creditCardLimit || 'Credit Limit', 'number')}
            {renderField('creditCardDueDate', fieldLabels.creditCardDueDate || 'Due Date (Day)', 'number')}
            {renderField('creditCardBank', fieldLabels.creditCardBank || 'Bank Name', 'text')}
          </>
        );

      case 'Loan':
        return (
          <>
            {renderField('loanType', fieldLabels.loanType || 'Loan Type', 'select', ['home', 'personal', 'car', 'education', 'other'])}
            {renderField('loanPrincipal', fieldLabels.loanPrincipal || 'Loan Amount', 'number')}
            {renderField('loanInterestRate', fieldLabels.loanInterestRate || 'Interest Rate (%)', 'number')}
            {renderField('loanTenure', fieldLabels.loanTenure || 'Tenure (months)', 'number')}
            {renderField('loanEMI', fieldLabels.loanEMI || 'EMI Amount', 'number')}
            {renderField('loanStartDate', fieldLabels.loanStartDate || 'Loan Start Date', 'date')}
            {renderField('loanEndDate', fieldLabels.loanEndDate || 'Loan End Date', 'date', undefined, details.loanStartDate)}
          </>
        );

      case 'Digital Wallet':
        return (
          <>
            {renderField('walletProvider', fieldLabels.walletProvider || 'Wallet Provider', 'text')}
            {renderField('walletPhoneNumber', fieldLabels.walletPhoneNumber || 'Phone Number', 'text')}
          </>
        );

      case 'Savings Account':
      case 'Current Account':
        return (
          <>
            {renderField('accountNumber', fieldLabels.accountNumber || 'Account Number', 'text')}
            {renderField('bankName', fieldLabels.bankName || 'Bank Name', 'text')}
            {renderField('ifscCode', fieldLabels.ifscCode || 'IFSC Code', 'text')}
            {renderField('branchName', fieldLabels.branchName || 'Branch Name', 'text')}
          </>
        );

      default:
        return null;
    }
  };

  // Show notification settings for accounts with end dates
  const hasEndDate = ['Fixed Deposit (FD)', 'Recurring Deposit (RD)', 'Public Provident Fund (PPF)', 'Monthly Income Scheme (MIS)', 'Bonds', 'Loan'].includes(accountType);

  return (
    <View>
      {renderTypeSpecificFields()}
      
      {hasEndDate && (
        <Card style={styles.notificationCard} variant="outlined" padding="lg">
          <ThemedText style={[Typography.labelLarge, { color: colors.text, marginBottom: Spacing.md }]}>
            Notification Settings
          </ThemedText>
          <View style={styles.switchRow}>
            <View style={{ flex: 1 }}>
              <ThemedText style={[Typography.bodyMedium, { color: colors.text, marginBottom: Spacing.xs }]}>
                Remind me before end date
              </ThemedText>
              <ThemedText style={[Typography.bodySmall, { color: colors.textSecondary }]}>
                Get notified before your investment matures
              </ThemedText>
            </View>
            <TouchableOpacity
              style={[
                styles.switch,
                {
                  backgroundColor: details.enableNotifications !== false ? colors.primary : colors.border,
                },
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                updateField('enableNotifications', details.enableNotifications === false ? true : false);
              }}
              activeOpacity={0.7}>
              <View
                style={[
                  styles.switchThumb,
                  details.enableNotifications !== false && styles.switchThumbActive,
                ]}
              />
            </TouchableOpacity>
          </View>
          {details.enableNotifications !== false && (
            <Input
              label="Days before end date"
              value={details.notificationDaysBefore?.toString() || ''}
              onChangeText={(text) => {
                if (text === '') {
                  updateField('notificationDaysBefore', undefined);
                } else {
                  const numValue = parseInt(text, 10);
                  if (!isNaN(numValue) && numValue > 0) {
                    updateField('notificationDaysBefore', numValue);
                  }
                }
              }}
              keyboardType="number-pad"
              placeholder="7"
              helperText="You'll receive a notification this many days before the end date"
            />
          )}
        </Card>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: Spacing.lg,
  },
  label: {
    marginBottom: Spacing.sm,
  },
  selectOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
  selectOption: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    minHeight: ComponentSizes.minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    marginTop: Spacing.sm,
  },
  notificationCard: {
    marginTop: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  infoCard: {
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  switch: {
    width: 52,
    height: 32,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    padding: 2,
  },
  switchThumb: {
    width: 28,
    height: 28,
    borderRadius: BorderRadius.full,
    backgroundColor: '#FFFFFF',
    alignSelf: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  switchThumbActive: {
    alignSelf: 'flex-end',
  },
});
