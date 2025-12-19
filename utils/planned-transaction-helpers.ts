/**
 * Helper functions for planned transactions
 */

import { PlannedTransaction, RecurrenceType } from '@/types';

/**
 * Calculate the next occurrence date for a recurring planned transaction
 */
export function calculateNextOccurrenceDate(
  scheduledDate: string,
  recurrence: RecurrenceType,
  lastCreatedDate?: string
): string {
  const baseDate = lastCreatedDate ? new Date(lastCreatedDate) : new Date(scheduledDate);
  const nextDate = new Date(baseDate);

  switch (recurrence) {
    case 'daily':
      nextDate.setDate(baseDate.getDate() + 1);
      break;
    case 'weekly':
      nextDate.setDate(baseDate.getDate() + 7);
      break;
    case 'monthly':
      nextDate.setMonth(baseDate.getMonth() + 1);
      break;
    case 'yearly':
      nextDate.setFullYear(baseDate.getFullYear() + 1);
      break;
    case 'none':
    default:
      return scheduledDate;
  }

  return nextDate.toISOString().split('T')[0];
}

/**
 * Check if a planned transaction is due (scheduled date is today or in the past)
 */
export function isPlannedTransactionDue(plannedTransaction: PlannedTransaction): boolean {
  const scheduledDate = plannedTransaction.nextOccurrenceDate || plannedTransaction.scheduledDate;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const scheduled = new Date(scheduledDate);
  scheduled.setHours(0, 0, 0, 0);
  
  return scheduled <= today;
}

/**
 * Check if a planned transaction has reached its end date (for recurring transactions)
 */
export function hasReachedEndDate(plannedTransaction: PlannedTransaction): boolean {
  if (!plannedTransaction.endDate || plannedTransaction.recurrence === 'none') {
    return false;
  }
  
  const nextDate = plannedTransaction.nextOccurrenceDate || plannedTransaction.scheduledDate;
  const endDate = new Date(plannedTransaction.endDate);
  endDate.setHours(0, 0, 0, 0);
  const next = new Date(nextDate);
  next.setHours(0, 0, 0, 0);
  
  return next > endDate;
}

/**
 * Get status display text for a planned transaction
 */
export function getPlannedTransactionStatusText(status: PlannedTransaction['status']): string {
  switch (status) {
    case 'pending':
      return 'Pending';
    case 'completed':
      return 'Completed';
    case 'cancelled':
      return 'Cancelled';
    case 'skipped':
      return 'Skipped';
    default:
      return 'Pending';
  }
}

/**
 * Format recurrence display text
 */
export function formatRecurrence(recurrence: RecurrenceType): string {
  switch (recurrence) {
    case 'none':
      return 'One-time';
    case 'daily':
      return 'Daily';
    case 'weekly':
      return 'Weekly';
    case 'monthly':
      return 'Monthly';
    case 'yearly':
      return 'Yearly';
    default:
      return 'One-time';
  }
}
