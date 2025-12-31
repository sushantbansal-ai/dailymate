/**
 * Sync Service
 * Handles bidirectional synchronization between app and Google Sheets
 */

import * as GoogleSheets from './google-sheets';
import * as Storage from './storage';
import type {
  Account,
  Bill,
  Budget,
  Category,
  Contact,
  Goal,
  Label,
  PlannedTransaction,
  Transaction,
} from '@/types';

const SHEET_NAMES = {
  ACCOUNTS: 'Accounts',
  TRANSACTIONS: 'Transactions',
  CATEGORIES: 'Categories',
  LABELS: 'Labels',
  CONTACTS: 'Contacts',
  BUDGETS: 'Budgets',
  GOALS: 'Goals',
  PLANNED_TRANSACTIONS: 'Planned Transactions',
  BILLS: 'Bills',
};

/**
 * Convert array of objects to sheet rows (with headers)
 */
function arrayToSheetRows<T extends Record<string, any>>(items: T[]): any[][] {
  if (items.length === 0) return [];
  
  const headers = Object.keys(items[0]);
  const rows = items.map((item) => headers.map((key) => {
    const value = item[key];
    if (value === null || value === undefined) return '';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  }));
  
  return [headers, ...rows];
}

/**
 * Convert sheet rows to array of objects
 */
function sheetRowsToArray<T>(rows: any[][]): T[] {
  if (rows.length < 2) return [];
  
  const headers = rows[0];
  return rows.slice(1).map((row) => {
    const obj: any = {};
    headers.forEach((header, index) => {
      const value = row[index] || '';
      // Try to parse JSON if it looks like JSON
      if (value.startsWith('{') || value.startsWith('[')) {
        try {
          obj[header] = JSON.parse(value);
        } catch {
          obj[header] = value;
        }
      } else {
        obj[header] = value;
      }
    });
    return obj as T;
  });
}

/**
 * Sync accounts to Google Sheets
 */
export async function syncAccountsToSheets(spreadsheetId: string): Promise<boolean> {
  try {
    const accounts = await Storage.getAccounts();
    const rows = arrayToSheetRows(accounts);
    
    // Clear existing data and write new data
    await GoogleSheets.clearSheet(spreadsheetId, `${SHEET_NAMES.ACCOUNTS}!A:Z`);
    if (rows.length > 0) {
      return await GoogleSheets.writeSheet(spreadsheetId, `${SHEET_NAMES.ACCOUNTS}!A1`, rows);
    }
    return true;
  } catch (error) {
    console.error('Error syncing accounts to sheets:', error);
    return false;
  }
}

/**
 * Sync accounts from Google Sheets
 */
export async function syncAccountsFromSheets(spreadsheetId: string): Promise<Account[]> {
  try {
    const rows = await GoogleSheets.readSheet(spreadsheetId, `${SHEET_NAMES.ACCOUNTS}!A:Z`);
    if (!rows || rows.length === 0) return [];
    
    const accounts = sheetRowsToArray<Account>(rows);
    await Storage.saveAccounts(accounts);
    return accounts;
  } catch (error) {
    console.error('Error syncing accounts from sheets:', error);
    return [];
  }
}

/**
 * Sync transactions to Google Sheets
 */
export async function syncTransactionsToSheets(spreadsheetId: string): Promise<boolean> {
  try {
    const transactions = await Storage.getTransactions();
    const rows = arrayToSheetRows(transactions);
    
    await GoogleSheets.clearSheet(spreadsheetId, `${SHEET_NAMES.TRANSACTIONS}!A:Z`);
    if (rows.length > 0) {
      return await GoogleSheets.writeSheet(spreadsheetId, `${SHEET_NAMES.TRANSACTIONS}!A1`, rows);
    }
    return true;
  } catch (error) {
    console.error('Error syncing transactions to sheets:', error);
    return false;
  }
}

/**
 * Sync transactions from Google Sheets
 */
export async function syncTransactionsFromSheets(spreadsheetId: string): Promise<Transaction[]> {
  try {
    const rows = await GoogleSheets.readSheet(spreadsheetId, `${SHEET_NAMES.TRANSACTIONS}!A:Z`);
    if (!rows || rows.length === 0) return [];
    
    const transactions = sheetRowsToArray<Transaction>(rows);
    await Storage.saveTransactions(transactions);
    return transactions;
  } catch (error) {
    console.error('Error syncing transactions from sheets:', error);
    return [];
  }
}

/**
 * Sync categories to Google Sheets
 */
export async function syncCategoriesToSheets(spreadsheetId: string): Promise<boolean> {
  try {
    const categories = await Storage.getCategories();
    const rows = arrayToSheetRows(categories);
    
    await GoogleSheets.clearSheet(spreadsheetId, `${SHEET_NAMES.CATEGORIES}!A:Z`);
    if (rows.length > 0) {
      return await GoogleSheets.writeSheet(spreadsheetId, `${SHEET_NAMES.CATEGORIES}!A1`, rows);
    }
    return true;
  } catch (error) {
    console.error('Error syncing categories to sheets:', error);
    return false;
  }
}

/**
 * Sync categories from Google Sheets
 */
export async function syncCategoriesFromSheets(spreadsheetId: string): Promise<Category[]> {
  try {
    const rows = await GoogleSheets.readSheet(spreadsheetId, `${SHEET_NAMES.CATEGORIES}!A:Z`);
    if (!rows || rows.length === 0) return [];
    
    const categories = sheetRowsToArray<Category>(rows);
    await Storage.saveCategories(categories);
    return categories;
  } catch (error) {
    console.error('Error syncing categories from sheets:', error);
    return [];
  }
}

/**
 * Sync labels to Google Sheets
 */
export async function syncLabelsToSheets(spreadsheetId: string): Promise<boolean> {
  try {
    const labels = await Storage.getLabels();
    const rows = arrayToSheetRows(labels);
    
    await GoogleSheets.clearSheet(spreadsheetId, `${SHEET_NAMES.LABELS}!A:Z`);
    if (rows.length > 0) {
      return await GoogleSheets.writeSheet(spreadsheetId, `${SHEET_NAMES.LABELS}!A1`, rows);
    }
    return true;
  } catch (error) {
    console.error('Error syncing labels to sheets:', error);
    return false;
  }
}

/**
 * Sync labels from Google Sheets
 */
export async function syncLabelsFromSheets(spreadsheetId: string): Promise<Label[]> {
  try {
    const rows = await GoogleSheets.readSheet(spreadsheetId, `${SHEET_NAMES.LABELS}!A:Z`);
    if (!rows || rows.length === 0) return [];
    
    const labels = sheetRowsToArray<Label>(rows);
    await Storage.saveLabels(labels);
    return labels;
  } catch (error) {
    console.error('Error syncing labels from sheets:', error);
    return [];
  }
}

/**
 * Sync contacts to Google Sheets
 */
export async function syncContactsToSheets(spreadsheetId: string): Promise<boolean> {
  try {
    const contacts = await Storage.getContacts();
    const rows = arrayToSheetRows(contacts);
    
    await GoogleSheets.clearSheet(spreadsheetId, `${SHEET_NAMES.CONTACTS}!A:Z`);
    if (rows.length > 0) {
      return await GoogleSheets.writeSheet(spreadsheetId, `${SHEET_NAMES.CONTACTS}!A1`, rows);
    }
    return true;
  } catch (error) {
    console.error('Error syncing contacts to sheets:', error);
    return false;
  }
}

/**
 * Sync contacts from Google Sheets
 */
export async function syncContactsFromSheets(spreadsheetId: string): Promise<Contact[]> {
  try {
    const rows = await GoogleSheets.readSheet(spreadsheetId, `${SHEET_NAMES.CONTACTS}!A:Z`);
    if (!rows || rows.length === 0) return [];
    
    const contacts = sheetRowsToArray<Contact>(rows);
    await Storage.saveContacts(contacts);
    return contacts;
  } catch (error) {
    console.error('Error syncing contacts from sheets:', error);
    return [];
  }
}

/**
 * Sync budgets to Google Sheets
 */
export async function syncBudgetsToSheets(spreadsheetId: string): Promise<boolean> {
  try {
    const budgets = await Storage.getBudgets();
    const rows = arrayToSheetRows(budgets);
    
    await GoogleSheets.clearSheet(spreadsheetId, `${SHEET_NAMES.BUDGETS}!A:Z`);
    if (rows.length > 0) {
      return await GoogleSheets.writeSheet(spreadsheetId, `${SHEET_NAMES.BUDGETS}!A1`, rows);
    }
    return true;
  } catch (error) {
    console.error('Error syncing budgets to sheets:', error);
    return false;
  }
}

/**
 * Sync budgets from Google Sheets
 */
export async function syncBudgetsFromSheets(spreadsheetId: string): Promise<Budget[]> {
  try {
    const rows = await GoogleSheets.readSheet(spreadsheetId, `${SHEET_NAMES.BUDGETS}!A:Z`);
    if (!rows || rows.length === 0) return [];
    
    const budgets = sheetRowsToArray<Budget>(rows);
    await Storage.saveBudgets(budgets);
    return budgets;
  } catch (error) {
    console.error('Error syncing budgets from sheets:', error);
    return [];
  }
}

/**
 * Sync goals to Google Sheets
 */
export async function syncGoalsToSheets(spreadsheetId: string): Promise<boolean> {
  try {
    const goals = await Storage.getGoals();
    const rows = arrayToSheetRows(goals);
    
    await GoogleSheets.clearSheet(spreadsheetId, `${SHEET_NAMES.GOALS}!A:Z`);
    if (rows.length > 0) {
      return await GoogleSheets.writeSheet(spreadsheetId, `${SHEET_NAMES.GOALS}!A1`, rows);
    }
    return true;
  } catch (error) {
    console.error('Error syncing goals to sheets:', error);
    return false;
  }
}

/**
 * Sync goals from Google Sheets
 */
export async function syncGoalsFromSheets(spreadsheetId: string): Promise<Goal[]> {
  try {
    const rows = await GoogleSheets.readSheet(spreadsheetId, `${SHEET_NAMES.GOALS}!A:Z`);
    if (!rows || rows.length === 0) return [];
    
    const goals = sheetRowsToArray<Goal>(rows);
    await Storage.saveGoals(goals);
    return goals;
  } catch (error) {
    console.error('Error syncing goals from sheets:', error);
    return [];
  }
}

/**
 * Sync planned transactions to Google Sheets
 */
export async function syncPlannedTransactionsToSheets(spreadsheetId: string): Promise<boolean> {
  try {
    const plannedTransactions = await Storage.getPlannedTransactions();
    const rows = arrayToSheetRows(plannedTransactions);
    
    await GoogleSheets.clearSheet(spreadsheetId, `${SHEET_NAMES.PLANNED_TRANSACTIONS}!A:Z`);
    if (rows.length > 0) {
      return await GoogleSheets.writeSheet(spreadsheetId, `${SHEET_NAMES.PLANNED_TRANSACTIONS}!A1`, rows);
    }
    return true;
  } catch (error) {
    console.error('Error syncing planned transactions to sheets:', error);
    return false;
  }
}

/**
 * Sync planned transactions from Google Sheets
 */
export async function syncPlannedTransactionsFromSheets(spreadsheetId: string): Promise<PlannedTransaction[]> {
  try {
    const rows = await GoogleSheets.readSheet(spreadsheetId, `${SHEET_NAMES.PLANNED_TRANSACTIONS}!A:Z`);
    if (!rows || rows.length === 0) return [];
    
    const plannedTransactions = sheetRowsToArray<PlannedTransaction>(rows);
    await Storage.savePlannedTransactions(plannedTransactions);
    return plannedTransactions;
  } catch (error) {
    console.error('Error syncing planned transactions from sheets:', error);
    return [];
  }
}

/**
 * Sync bills to Google Sheets
 */
export async function syncBillsToSheets(spreadsheetId: string): Promise<boolean> {
  try {
    const bills = await Storage.getBills();
    const rows = arrayToSheetRows(bills);
    
    await GoogleSheets.clearSheet(spreadsheetId, `${SHEET_NAMES.BILLS}!A:Z`);
    if (rows.length > 0) {
      return await GoogleSheets.writeSheet(spreadsheetId, `${SHEET_NAMES.BILLS}!A1`, rows);
    }
    return true;
  } catch (error) {
    console.error('Error syncing bills to sheets:', error);
    return false;
  }
}

/**
 * Sync bills from Google Sheets
 */
export async function syncBillsFromSheets(spreadsheetId: string): Promise<Bill[]> {
  try {
    const rows = await GoogleSheets.readSheet(spreadsheetId, `${SHEET_NAMES.BILLS}!A:Z`);
    if (!rows || rows.length === 0) return [];
    
    const bills = sheetRowsToArray<Bill>(rows);
    await Storage.saveBills(bills);
    return bills;
  } catch (error) {
    console.error('Error syncing bills from sheets:', error);
    return [];
  }
}

/**
 * Sync all data to Google Sheets
 */
export async function syncAllToSheets(spreadsheetId: string): Promise<boolean> {
  try {
    const results = await Promise.all([
      syncAccountsToSheets(spreadsheetId),
      syncTransactionsToSheets(spreadsheetId),
      syncCategoriesToSheets(spreadsheetId),
      syncLabelsToSheets(spreadsheetId),
      syncContactsToSheets(spreadsheetId),
      syncBudgetsToSheets(spreadsheetId),
      syncGoalsToSheets(spreadsheetId),
      syncPlannedTransactionsToSheets(spreadsheetId),
      syncBillsToSheets(spreadsheetId),
    ]);

    const allSuccess = results.every((result) => result === true);
    
    if (allSuccess) {
      await GoogleSheets.saveConfig({ lastSyncTime: Date.now() });
    }

    return allSuccess;
  } catch (error) {
    console.error('Error syncing all data to sheets:', error);
    return false;
  }
}

/**
 * Sync all data from Google Sheets
 */
export async function syncAllFromSheets(spreadsheetId: string): Promise<boolean> {
  try {
    await Promise.all([
      syncAccountsFromSheets(spreadsheetId),
      syncTransactionsFromSheets(spreadsheetId),
      syncCategoriesFromSheets(spreadsheetId),
      syncLabelsFromSheets(spreadsheetId),
      syncContactsFromSheets(spreadsheetId),
      syncBudgetsFromSheets(spreadsheetId),
      syncGoalsFromSheets(spreadsheetId),
      syncPlannedTransactionsFromSheets(spreadsheetId),
      syncBillsFromSheets(spreadsheetId),
    ]);

    await GoogleSheets.saveConfig({ lastSyncTime: Date.now() });
    return true;
  } catch (error) {
    console.error('Error syncing all data from sheets:', error);
    return false;
  }
}

/**
 * Bidirectional sync (merge strategy)
 */
export async function bidirectionalSync(spreadsheetId: string): Promise<boolean> {
  try {
    // For now, we'll use a simple strategy: upload app data to sheets
    // In production, you'd want to implement conflict resolution
    return await syncAllToSheets(spreadsheetId);
  } catch (error) {
    console.error('Error in bidirectional sync:', error);
    return false;
  }
}

