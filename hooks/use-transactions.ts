/**
 * Custom hook for transaction-related operations
 */

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Category, Transaction } from '@/types';
import {
    filterTransactionsByType,
    formatTransactionAmount,
    getCategoryById,
    getRecentTransactions,
    getTransactionTypeColor,
    getTransactionTypeSymbol,
    sortTransactionsByDate,
} from '@/utils/transaction-helpers';
import { useCallback } from 'react';

export function useTransactions(
  transactions: Transaction[],
  categories: Category[]
) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const getCategory = useCallback(
    (categoryId: string) => getCategoryById(categoryId, categories),
    [categories]
  );

  const getTransactionTypeColorMemo = useCallback(
    (type: Transaction['type']) =>
      getTransactionTypeColor(type, {
        income: colors.income,
        expense: colors.expense,
        transfer: colors.transfer,
      }),
    [colors]
  );

  const formatTransactionAmountMemo = useCallback(
    (transaction: Transaction) => formatTransactionAmount(transaction),
    []
  );

  const sortByDate = useCallback(
    (order: 'asc' | 'desc' = 'desc') => sortTransactionsByDate(transactions, order),
    [transactions]
  );

  const filterByType = useCallback(
    (type: Transaction['type'] | 'all') => filterTransactionsByType(transactions, type),
    [transactions]
  );

  const getRecent = useCallback(
    (limit?: number) => getRecentTransactions(transactions, limit),
    [transactions]
  );

  return {
    getCategory,
    getTransactionTypeColor: getTransactionTypeColorMemo,
    getTransactionTypeSymbol,
    formatTransactionAmount: formatTransactionAmountMemo,
    sortByDate,
    filterByType,
    getRecent,
  };
}
