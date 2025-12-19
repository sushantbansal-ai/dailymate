/**
 * Helper functions for account-related operations
 */

import { Account } from '@/types';

/**
 * Get account name by ID from accounts array
 * @param accountId - The account ID to lookup
 * @param accounts - Array of accounts
 * @param fallback - Fallback text if account not found (default: 'Unknown')
 * @returns Account name or fallback
 */
export function getAccountName(
  accountId: string,
  accounts: Account[],
  fallback: string = 'Unknown'
): string {
  return accounts.find((a) => a.id === accountId)?.name || fallback;
}

/**
 * Calculate total balance from accounts array
 * @param accounts - Array of accounts
 * @returns Total balance
 */
export function calculateTotalBalance(accounts: Account[]): number {
  return accounts.reduce((sum, account) => sum + account.balance, 0);
}

/**
 * Get account by ID
 * @param accountId - The account ID to lookup
 * @param accounts - Array of accounts
 * @returns Account object or undefined
 */
export function getAccountById(
  accountId: string,
  accounts: Account[]
): Account | undefined {
  return accounts.find((a) => a.id === accountId);
}

/**
 * Filter accounts by type
 * @param accounts - Array of accounts
 * @param type - Account type to filter by
 * @returns Filtered accounts array
 */
export function filterAccountsByType(
  accounts: Account[],
  type: Account['type']
): Account[] {
  return accounts.filter((account) => account.type === type);
}
