/**
 * Custom hook for account-related operations
 */

import { Account } from '@/types';
import {
    calculateTotalBalance,
    filterAccountsByType,
    getAccountById as getAccountByIdUtil,
    getAccountName as getAccountNameUtil,
} from '@/utils/account-helpers';
import { useCallback, useMemo } from 'react';

export function useAccounts(accounts: Account[]) {
  const getAccountName = useCallback(
    (accountId: string, fallback?: string) =>
      getAccountNameUtil(accountId, accounts, fallback),
    [accounts]
  );

  const getAccountById = useCallback(
    (accountId: string) => getAccountByIdUtil(accountId, accounts),
    [accounts]
  );

  const totalBalance = useMemo(() => calculateTotalBalance(accounts), [accounts]);

  const filterByType = useCallback(
    (type: Account['type']) => filterAccountsByType(accounts, type),
    [accounts]
  );

  return {
    getAccountName,
    getAccountById,
    totalBalance,
    filterByType,
  };
}
