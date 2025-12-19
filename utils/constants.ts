/**
 * Application-wide constants
 */

import { AccountType, AccountTypeInfo } from '@/types';

/**
 * Account types available in the app with icons and categories
 */
export const ACCOUNT_TYPES_INFO: AccountTypeInfo[] = [
  // Basic
  { label: 'Cash', value: 'Cash', icon: '💵', category: 'Basic' },
  { label: 'Digital Wallet', value: 'Digital Wallet', icon: '📱', category: 'Basic' },
  
  // Bank Accounts
  { label: 'Savings Account', value: 'Savings Account', icon: '💰', category: 'Bank Accounts' },
  { label: 'Current Account', value: 'Current Account', icon: '🏦', category: 'Bank Accounts' },
  
  // Deposits & Investments
  { label: 'Fixed Deposit (FD)', value: 'Fixed Deposit (FD)', icon: '📊', category: 'Deposits & Investments' },
  { label: 'Recurring Deposit (RD)', value: 'Recurring Deposit (RD)', icon: '📈', category: 'Deposits & Investments' },
  { label: 'Public Provident Fund (PPF)', value: 'Public Provident Fund (PPF)', icon: '🏛️', category: 'Deposits & Investments' },
  { label: 'Monthly Income Scheme (MIS)', value: 'Monthly Income Scheme (MIS)', icon: '💸', category: 'Deposits & Investments' },
  { label: 'National Pension System (NPS)', value: 'National Pension System (NPS)', icon: '👴', category: 'Deposits & Investments' },
  { label: 'Mutual Fund', value: 'Mutual Fund', icon: '📉', category: 'Deposits & Investments' },
  { label: 'Stocks', value: 'Stocks', icon: '📈', category: 'Deposits & Investments' },
  { label: 'Bonds', value: 'Bonds', icon: '📜', category: 'Deposits & Investments' },
  { label: 'Gold', value: 'Gold', icon: '🥇', category: 'Deposits & Investments' },
  
  // Credit
  { label: 'Credit Card', value: 'Credit Card', icon: '💳', category: 'Credit' },
  { label: 'Loan', value: 'Loan', icon: '🏦', category: 'Credit' },
  
  // Other
  { label: 'Other', value: 'Other', icon: '📋', category: 'Other' },
];

/**
 * Account types as simple array (for backward compatibility)
 */
export const ACCOUNT_TYPES: AccountType[] = ACCOUNT_TYPES_INFO.map((info) => info.value);

/**
 * Get account type info by value
 */
export function getAccountTypeInfo(type: AccountType): AccountTypeInfo | undefined {
  return ACCOUNT_TYPES_INFO.find((info) => info.value === type);
}

/**
 * Get account icon by type (returns default icon if not found)
 */
export function getAccountIcon(type: AccountType, customIcon?: string): string {
  if (customIcon) return customIcon;
  const info = getAccountTypeInfo(type);
  return info?.icon || '💰';
}

/**
 * Get account types grouped by category
 */
export function getAccountTypesByCategory(): Record<string, AccountTypeInfo[]> {
  return ACCOUNT_TYPES_INFO.reduce((acc, info) => {
    if (!acc[info.category]) {
      acc[info.category] = [];
    }
    acc[info.category].push(info);
    return acc;
  }, {} as Record<string, AccountTypeInfo[]>);
}

/**
 * Default color palette for accounts
 */
export const ACCOUNT_COLORS = [
  '#FF6B6B',
  '#4ECDC4',
  '#FFE66D',
  '#95E1D3',
  '#F38181',
  '#AA96DA',
  '#FCBAD3',
  '#A8E6CF',
  '#FFD3A5',
  '#C7CEEA',
  '#6BCB77',
  '#4D96FF',
  '#9B59B6',
  '#E74C3C',
  '#3498DB',
  '#1ABC9C',
  '#F39C12',
  '#E67E22',
  '#34495E',
  '#16A085',
] as const;

/**
 * Transaction filter options
 */
export const TRANSACTION_FILTERS = ['all', 'income', 'expense', 'transfer'] as const;

/**
 * Default notification days before end date
 */
export const DEFAULT_NOTIFICATION_DAYS_BEFORE = 7;

/**
 * Default number of recent transactions to show
 */
export const DEFAULT_RECENT_TRANSACTIONS_LIMIT = 5;

/**
 * Currency code
 */
export const CURRENCY_CODE = 'INR';

/**
 * Locale for formatting
 */
export const LOCALE = 'en-IN';

/**
 * Tab bar height (including padding)
 * This is used to calculate proper bottom padding for screens
 */
export const TAB_BAR_HEIGHT = 65;

/**
 * Calculate bottom padding for scroll views to account for tab bar
 * @param safeAreaBottom - Bottom safe area inset
 * @returns Total bottom padding needed
 */
export function getScrollViewBottomPadding(safeAreaBottom: number): number {
  return TAB_BAR_HEIGHT + safeAreaBottom;
}
