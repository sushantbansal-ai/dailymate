/**
 * Planned Transaction Service
 * Handles auto-creation and management of planned transactions
 */

import * as Storage from '@/services/storage';
import { PlannedTransaction, Transaction } from '@/types';
import { calculateNextOccurrenceDate, hasReachedEndDate, isPlannedTransactionDue } from '@/utils/planned-transaction-helpers';

/**
 * Check and auto-create due planned transactions
 * Returns array of created transaction IDs
 */
export async function processDuePlannedTransactions(): Promise<string[]> {
  const plannedTransactions = await Storage.getPlannedTransactions();
  const createdTransactionIds: string[] = [];
  const updatedPlannedTransactions: PlannedTransaction[] = [];

  for (const plannedTransaction of plannedTransactions) {
    // Skip if cancelled or not set to auto-create
    if (plannedTransaction.status === 'cancelled' || !plannedTransaction.autoCreate) {
      continue;
    }

    // Check if transaction is due
    if (!isPlannedTransactionDue(plannedTransaction)) {
      continue;
    }

    // Check if recurrence has ended
    if (hasReachedEndDate(plannedTransaction)) {
      // Mark as cancelled since recurrence ended
      const updated = {
        ...plannedTransaction,
        status: 'cancelled' as const,
        updatedAt: new Date().toISOString(),
      };
      updatedPlannedTransactions.push(updated);
      continue;
    }

    // Create the transaction
    const transaction: Transaction = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      accountId: plannedTransaction.accountId,
      categoryId: plannedTransaction.categoryId,
      type: plannedTransaction.type,
      amount: plannedTransaction.amount,
      description: plannedTransaction.description,
      date: plannedTransaction.nextOccurrenceDate || plannedTransaction.scheduledDate,
      time: plannedTransaction.time,
      toAccountId: plannedTransaction.toAccountId,
      labels: plannedTransaction.labels,
      payeeIds: plannedTransaction.payeeIds,
      status: plannedTransaction.status || 'completed',
      itemName: plannedTransaction.itemName,
      warrantyDate: plannedTransaction.warrantyDate,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      // Add transaction
      await Storage.addTransaction(transaction);
      createdTransactionIds.push(transaction.id);

      // Update planned transaction
      if (plannedTransaction.recurrence === 'none') {
        // One-time: mark as completed
        const updated = {
          ...plannedTransaction,
          status: 'completed' as const,
          lastCreatedDate: transaction.date,
          updatedAt: new Date().toISOString(),
        };
        updatedPlannedTransactions.push(updated);
      } else {
        // Recurring: calculate next occurrence
        const lastCreated = plannedTransaction.lastCreatedDate || plannedTransaction.scheduledDate;
        const nextOccurrence = calculateNextOccurrenceDate(
          lastCreated,
          plannedTransaction.recurrence
        );

        // Check if next occurrence exceeds end date
        if (plannedTransaction.endDate && new Date(nextOccurrence) > new Date(plannedTransaction.endDate)) {
          // Mark as cancelled since recurrence ended
          const updated = {
            ...plannedTransaction,
            status: 'cancelled' as const,
            lastCreatedDate: transaction.date,
            updatedAt: new Date().toISOString(),
          };
          updatedPlannedTransactions.push(updated);
        } else {
          // Update with next occurrence
          const updated = {
            ...plannedTransaction,
            lastCreatedDate: transaction.date,
            nextOccurrenceDate: nextOccurrence,
            updatedAt: new Date().toISOString(),
          };
          updatedPlannedTransactions.push(updated);
        }
      }
    } catch (error) {
      console.error('Error creating transaction from planned transaction:', error);
    }
  }

  // Update all modified planned transactions
  for (const updated of updatedPlannedTransactions) {
    await Storage.updatePlannedTransaction(updated);
  }

  return createdTransactionIds;
}
