/**
 * Helper functions for transaction-related operations
 */

import { Category, Transaction } from '@/types';
import { formatCurrency } from './formatters';

/**
 * Get transaction type color
 * @param type - Transaction type
 * @param colors - Color scheme object
 * @returns Color string
 */
export function getTransactionTypeColor(
  type: Transaction['type'],
  colors: { income: string; expense: string; transfer: string }
): string {
  switch (type) {
    case 'income':
      return colors.income;
    case 'expense':
      return colors.expense;
    case 'transfer':
      return colors.transfer;
    default:
      return colors.expense;
  }
}

/**
 * Get transaction type prefix symbol
 * @param type - Transaction type
 * @returns Symbol string
 */
export function getTransactionTypeSymbol(type: Transaction['type']): string {
  switch (type) {
    case 'income':
      return '+';
    case 'expense':
      return '-';
    case 'transfer':
      return '→';
    default:
      return '';
  }
}

/**
 * Format transaction amount with type symbol
 * @param transaction - Transaction object
 * @param options - Formatting options
 * @returns Formatted amount string
 */
export function formatTransactionAmount(
  transaction: Transaction,
  options?: {
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
  }
): string {
  const symbol = getTransactionTypeSymbol(transaction.type);
  const amount = formatCurrency(transaction.amount, options);
  return `${symbol}${amount}`;
}

/**
 * Get category by ID
 * @param categoryId - Category ID
 * @param categories - Array of categories
 * @returns Category object or undefined
 */
export function getCategoryById(
  categoryId: string,
  categories: Category[]
): Category | undefined {
  return categories.find((c) => c.id === categoryId);
}

/**
 * Sort transactions by date (newest first)
 * @param transactions - Array of transactions
 * @returns Sorted transactions array
 */
export function sortTransactionsByDate(
  transactions: Transaction[],
  order: 'asc' | 'desc' = 'desc'
): Transaction[] {
  return [...transactions].sort((a, b) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    return order === 'desc' ? dateB - dateA : dateA - dateB;
  });
}

/**
 * Filter transactions by type
 * @param transactions - Array of transactions
 * @param type - Transaction type to filter by (or 'all' for no filter)
 * @returns Filtered transactions array
 */
export function filterTransactionsByType(
  transactions: Transaction[],
  type: Transaction['type'] | 'all'
): Transaction[] {
  if (type === 'all') {
    return transactions;
  }
  return transactions.filter((t) => t.type === type);
}

/**
 * Get recent transactions
 * @param transactions - Array of transactions
 * @param limit - Number of transactions to return
 * @returns Array of recent transactions
 */
export function getRecentTransactions(
  transactions: Transaction[],
  limit: number = 5
): Transaction[] {
  return sortTransactionsByDate(transactions, 'desc').slice(0, limit);
}
