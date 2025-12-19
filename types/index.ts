export type AccountType =
  | 'Cash'
  | 'Digital Wallet'
  | 'Savings Account'
  | 'Current Account'
  | 'Fixed Deposit (FD)'
  | 'Recurring Deposit (RD)'
  | 'Public Provident Fund (PPF)'
  | 'Monthly Income Scheme (MIS)'
  | 'National Pension System (NPS)'
  | 'Mutual Fund'
  | 'Stocks'
  | 'Bonds'
  | 'Gold'
  | 'Credit Card'
  | 'Loan'
  | 'Other';

export interface AccountTypeInfo {
  label: string;
  value: AccountType;
  icon: string;
  category: string;
}

export type TransactionType = 'income' | 'expense' | 'transfer';

// Account-specific fields based on type
export interface AccountDetails {
  // Common fields for investment/deposit accounts
  startDate?: string;
  endDate?: string;
  maturityDate?: string;
  interestRate?: number; // Annual interest rate in percentage
  principalAmount?: number; // Initial investment amount
  
  // For Fixed Deposit (FD)
  fdTenure?: number; // Tenure in months/years
  fdType?: 'cumulative' | 'non-cumulative';
  
  // For Recurring Deposit (RD)
  rdMonthlyAmount?: number;
  rdTenure?: number; // Tenure in months
  
  // For Public Provident Fund (PPF)
  ppfAccountNumber?: string;
  ppfMaturityDate?: string;
  
  // For Monthly Income Scheme (MIS)
  misMonthlyIncome?: number;
  
  // For National Pension System (NPS)
  npsPRAN?: string; // Permanent Retirement Account Number
  npsTier?: 'Tier I' | 'Tier II';
  
  // For Mutual Fund
  mutualFundScheme?: string;
  mutualFundFolioNumber?: string;
  mutualFundNav?: number; // Net Asset Value
  
  // For Stocks
  stockSymbol?: string;
  stockExchange?: string;
  stockQuantity?: number;
  stockPurchasePrice?: number;
  
  // For Bonds
  bondFaceValue?: number;
  bondCouponRate?: number;
  bondMaturityDate?: string;
  
  // For Credit Card
  creditCardNumber?: string; // Last 4 digits
  creditCardLimit?: number;
  creditCardDueDate?: number; // Day of month
  creditCardBank?: string;
  
  // For Loan
  loanPrincipal?: number;
  loanInterestRate?: number;
  loanTenure?: number; // In months
  loanEMI?: number;
  loanStartDate?: string;
  loanEndDate?: string;
  loanType?: 'home' | 'personal' | 'car' | 'education' | 'other';
  
  // For Digital Wallet
  walletProvider?: string; // Paytm, PhonePe, etc.
  walletPhoneNumber?: string;
  
  // For Savings/Current Account
  accountNumber?: string;
  bankName?: string;
  ifscCode?: string;
  branchName?: string;
  
  // Notification settings
  enableNotifications?: boolean;
  notificationDaysBefore?: number; // Days before end date to notify (default: 7)
}

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
  color: string;
  icon?: string; // Custom emoji icon for the account
  details?: AccountDetails;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: 'income' | 'expense';
}

export type TransactionStatus = 'pending' | 'completed' | 'cancelled' | 'failed';

export interface Label {
  id: string;
  name: string;
  color: string;
  createdAt: string;
  updatedAt: string;
}

export interface Contact {
  id: string;
  name: string;
  phoneNumber?: string;
  email?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TransactionSplit {
  id: string;
  categoryId: string;
  amount: number;
  description?: string; // Optional description for this split
}

export interface Transaction {
  id: string;
  accountId: string;
  categoryId: string; // Primary category (used when splits is empty or for backward compatibility)
  type: TransactionType;
  amount: number;
  description: string;
  date: string; // ISO date string (YYYY-MM-DD)
  time?: string; // Time string (HH:mm format)
  toAccountId?: string; // For transfers
  labels?: string[]; // Array of label IDs
  payeeIds?: string[]; // Array of Contact IDs (supports multiple payees)
  status?: TransactionStatus;
  itemName?: string;
  warrantyDate?: string; // ISO date string for warranty expiration
  splits?: TransactionSplit[]; // Array of splits (when transaction is split across categories)
  createdAt: string;
  updatedAt: string;
}

export type BudgetPeriod = 'weekly' | 'monthly' | 'yearly';

export interface Budget {
  id: string;
  name: string;
  categoryId?: string; // Optional: if null, it's an overall budget
  amount: number; // Budget limit
  period: BudgetPeriod;
  startDate: string; // ISO date string (YYYY-MM-DD)
  endDate?: string; // ISO date string (YYYY-MM-DD) - calculated based on period
  color: string;
  icon?: string;
  // Notification settings
  enableNotifications?: boolean;
  notifyAtPercentage?: number[]; // Array of percentages (e.g., [50, 75, 90, 100]) to notify at
  createdAt: string;
  updatedAt: string;
}

export interface Goal {
  id: string;
  name: string;
  targetAmount: number; // Target savings amount
  currentAmount: number; // Current progress (can be manually updated or linked to account)
  targetDate: string; // ISO date string (YYYY-MM-DD)
  accountId?: string; // Optional: link to an account to track balance automatically
  color: string;
  icon?: string;
  description?: string;
  // Notification settings
  enableNotifications?: boolean;
  notifyAtPercentage?: number[]; // Array of percentages (e.g., [25, 50, 75, 90, 100]) to notify at
  notifyDaysBefore?: number; // Days before target date to notify (default: 7)
  createdAt: string;
  updatedAt: string;
}

export type RecurrenceType = 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';

export type BillStatus = 'pending' | 'paid' | 'overdue' | 'cancelled';

export interface Bill {
  id: string;
  name: string;
  description?: string;
  amount: number;
  categoryId: string;
  accountId: string; // Account to pay from
  payeeId?: string; // Contact ID of the biller
  // Due date settings
  dueDateType: 'fixed' | 'recurring'; // Fixed date or recurring (e.g., every 15th of month)
  dueDate?: string; // ISO date string (YYYY-MM-DD) - for fixed date bills
  dueDay?: number; // Day of month (1-31) - for recurring monthly bills
  // Recurrence settings
  recurrence: RecurrenceType; // monthly, yearly, etc.
  startDate: string; // ISO date string - when bill started
  endDate?: string; // ISO date string - when bill ends (optional)
  // Payment tracking
  lastPaidDate?: string; // ISO date string - last time bill was paid
  lastPaidAmount?: number; // Last payment amount
  nextDueDate?: string; // ISO date string - calculated next due date
  status: BillStatus;
  // Notification settings
  enableNotifications?: boolean;
  notifyDaysBefore?: number[]; // Array of days before due date to notify (e.g., [7, 3, 1, 0])
  notifyOnDueDate?: boolean; // Notify on the due date
  // Auto-pay settings
  autoPay?: boolean; // Automatically create transaction when due
  // Visual
  color: string;
  icon?: string;
  createdAt: string;
  updatedAt: string;
}

export type PlannedTransactionStatus = 'pending' | 'completed' | 'cancelled' | 'skipped';

export interface PlannedTransaction {
  id: string;
  // Transaction details (similar to Transaction)
  accountId: string;
  categoryId: string;
  type: TransactionType;
  amount: number;
  description: string;
  scheduledDate: string; // ISO date string (YYYY-MM-DD) - when this transaction should occur
  time?: string; // Time string (HH:mm format)
  toAccountId?: string; // For transfers
  labels?: string[]; // Array of label IDs
  payeeIds?: string[]; // Array of Contact IDs
  status?: TransactionStatus; // Status when transaction is created
  itemName?: string;
  warrantyDate?: string;
  // Recurrence settings
  recurrence: RecurrenceType;
  endDate?: string; // ISO date string - when recurrence should stop (optional)
  // Notification settings
  enableNotifications?: boolean;
  notifyDaysBefore?: number[]; // Array of days before scheduled date to notify (e.g., [7, 1, 0])
  notifyOnDay?: boolean; // Notify on the scheduled date
  // Auto-creation settings
  autoCreate?: boolean; // Automatically create transaction when scheduled date arrives
  // Tracking
  lastCreatedDate?: string; // Last date when transaction was auto-created
  nextOccurrenceDate?: string; // Next scheduled date (for recurring)
  createdAt: string;
  updatedAt: string;
}

export const DEFAULT_CATEGORIES: Category[] = [
  // Expense categories
  { id: 'food', name: 'Food & Dining', icon: '🍽️', color: '#FF6B6B', type: 'expense' },
  { id: 'transport', name: 'Transportation', icon: '🚗', color: '#4ECDC4', type: 'expense' },
  { id: 'shopping', name: 'Shopping', icon: '🛍️', color: '#FFE66D', type: 'expense' },
  { id: 'bills', name: 'Bills & Utilities', icon: '💡', color: '#95E1D3', type: 'expense' },
  { id: 'entertainment', name: 'Entertainment', icon: '🎬', color: '#F38181', type: 'expense' },
  { id: 'healthcare', name: 'Healthcare', icon: '🏥', color: '#AA96DA', type: 'expense' },
  { id: 'education', name: 'Education', icon: '📚', color: '#FCBAD3', type: 'expense' },
  { id: 'travel', name: 'Travel', icon: '✈️', color: '#A8E6CF', type: 'expense' },
  { id: 'personal', name: 'Personal Care', icon: '💅', color: '#FFD3A5', type: 'expense' },
  { id: 'other-expense', name: 'Other', icon: '📦', color: '#C7CEEA', type: 'expense' },
  // Income categories
  { id: 'salary', name: 'Salary', icon: '💰', color: '#6BCB77', type: 'income' },
  { id: 'freelance', name: 'Freelance', icon: '💼', color: '#4D96FF', type: 'income' },
  { id: 'investment', name: 'Investment Returns', icon: '📈', color: '#9B59B6', type: 'income' },
  { id: 'gift', name: 'Gift', icon: '🎁', color: '#E74C3C', type: 'income' },
  { id: 'other-income', name: 'Other Income', icon: '💵', color: '#3498DB', type: 'income' },
];
