import { Account, Bill, Budget, Category, Contact, DEFAULT_CATEGORIES, Goal, Label, PlannedTransaction, Transaction } from '@/types';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  ACCOUNTS: '@dailymate:accounts',
  TRANSACTIONS: '@dailymate:transactions',
  CATEGORIES: '@dailymate:categories',
  LABELS: '@dailymate:labels',
  CONTACTS: '@dailymate:contacts',
  BUDGETS: '@dailymate:budgets',
  GOALS: '@dailymate:goals',
  PLANNED_TRANSACTIONS: '@dailymate:planned_transactions',
  BILLS: '@dailymate:bills',
};

// Accounts
export const getAccounts = async (): Promise<Account[]> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.ACCOUNTS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting accounts:', error);
    return [];
  }
};

export const saveAccounts = async (accounts: Account[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(accounts));
  } catch (error) {
    console.error('Error saving accounts:', error);
    throw error;
  }
};

export const addAccount = async (account: Account): Promise<void> => {
  const accounts = await getAccounts();
  accounts.push(account);
  await saveAccounts(accounts);
};

export const updateAccount = async (account: Account): Promise<void> => {
  const accounts = await getAccounts();
  const index = accounts.findIndex((a) => a.id === account.id);
  if (index !== -1) {
    accounts[index] = account;
    await saveAccounts(accounts);
  }
};

export const deleteAccount = async (accountId: string): Promise<void> => {
  const accounts = await getAccounts();
  const filtered = accounts.filter((a) => a.id !== accountId);
  await saveAccounts(filtered);
};

// Transactions
export const getTransactions = async (): Promise<Transaction[]> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting transactions:', error);
    return [];
  }
};

export const saveTransactions = async (transactions: Transaction[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
  } catch (error) {
    console.error('Error saving transactions:', error);
    throw error;
  }
};

export const addTransaction = async (transaction: Transaction): Promise<void> => {
  const transactions = await getTransactions();
  transactions.push(transaction);
  await saveTransactions(transactions);
};

export const updateTransaction = async (transaction: Transaction): Promise<void> => {
  const transactions = await getTransactions();
  const index = transactions.findIndex((t) => t.id === transaction.id);
  if (index !== -1) {
    transactions[index] = transaction;
    await saveTransactions(transactions);
  }
};

export const deleteTransaction = async (transactionId: string): Promise<void> => {
  const transactions = await getTransactions();
  const filtered = transactions.filter((t) => t.id !== transactionId);
  await saveTransactions(filtered);
};

// Categories
export const getCategories = async (): Promise<Category[]> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.CATEGORIES);
    if (data) {
      return JSON.parse(data);
    }
    // Initialize with default categories if none exist
    await saveCategories(DEFAULT_CATEGORIES);
    return DEFAULT_CATEGORIES;
  } catch (error) {
    console.error('Error getting categories:', error);
    return DEFAULT_CATEGORIES;
  }
};

export const saveCategories = async (categories: Category[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
  } catch (error) {
    console.error('Error saving categories:', error);
    throw error;
  }
};

export const addCategory = async (category: Category): Promise<void> => {
  const categories = await getCategories();
  categories.push(category);
  await saveCategories(categories);
};

export const updateCategory = async (category: Category): Promise<void> => {
  const categories = await getCategories();
  const index = categories.findIndex((c) => c.id === category.id);
  if (index !== -1) {
    categories[index] = category;
    await saveCategories(categories);
  }
};

export const deleteCategory = async (categoryId: string): Promise<void> => {
  const categories = await getCategories();
  const filtered = categories.filter((c) => c.id !== categoryId);
  await saveCategories(filtered);
};

// Labels
export const getLabels = async (): Promise<Label[]> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.LABELS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting labels:', error);
    return [];
  }
};

export const saveLabels = async (labels: Label[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.LABELS, JSON.stringify(labels));
  } catch (error) {
    console.error('Error saving labels:', error);
    throw error;
  }
};

export const addLabel = async (label: Label): Promise<void> => {
  const labels = await getLabels();
  labels.push(label);
  await saveLabels(labels);
};

export const updateLabel = async (label: Label): Promise<void> => {
  const labels = await getLabels();
  const index = labels.findIndex((l) => l.id === label.id);
  if (index !== -1) {
    labels[index] = label;
    await saveLabels(labels);
  }
};

export const deleteLabel = async (labelId: string): Promise<void> => {
  const labels = await getLabels();
  const filtered = labels.filter((l) => l.id !== labelId);
  await saveLabels(filtered);
};

// Contacts
export const getContacts = async (): Promise<Contact[]> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.CONTACTS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting contacts:', error);
    return [];
  }
};

export const saveContacts = async (contacts: Contact[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.CONTACTS, JSON.stringify(contacts));
  } catch (error) {
    console.error('Error saving contacts:', error);
    throw error;
  }
};

export const addContact = async (contact: Contact): Promise<void> => {
  const contacts = await getContacts();
  contacts.push(contact);
  await saveContacts(contacts);
};

export const updateContact = async (contact: Contact): Promise<void> => {
  const contacts = await getContacts();
  const index = contacts.findIndex((c) => c.id === contact.id);
  if (index !== -1) {
    contacts[index] = contact;
    await saveContacts(contacts);
  }
};

export const deleteContact = async (contactId: string): Promise<void> => {
  const contacts = await getContacts();
  const filtered = contacts.filter((c) => c.id !== contactId);
  await saveContacts(filtered);
};

// Budgets
export const getBudgets = async (): Promise<Budget[]> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.BUDGETS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting budgets:', error);
    return [];
  }
};

export const saveBudgets = async (budgets: Budget[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify(budgets));
  } catch (error) {
    console.error('Error saving budgets:', error);
    throw error;
  }
};

export const addBudget = async (budget: Budget): Promise<void> => {
  const budgets = await getBudgets();
  budgets.push(budget);
  await saveBudgets(budgets);
};

export const updateBudget = async (budget: Budget): Promise<void> => {
  const budgets = await getBudgets();
  const index = budgets.findIndex((b) => b.id === budget.id);
  if (index !== -1) {
    budgets[index] = budget;
    await saveBudgets(budgets);
  }
};

export const deleteBudget = async (budgetId: string): Promise<void> => {
  const budgets = await getBudgets();
  const filtered = budgets.filter((b) => b.id !== budgetId);
  await saveBudgets(filtered);
};

// Goals
export const getGoals = async (): Promise<Goal[]> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.GOALS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting goals:', error);
    return [];
  }
};

export const saveGoals = async (goals: Goal[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(goals));
  } catch (error) {
    console.error('Error saving goals:', error);
    throw error;
  }
};

export const addGoal = async (goal: Goal): Promise<void> => {
  const goals = await getGoals();
  goals.push(goal);
  await saveGoals(goals);
};

export const updateGoal = async (goal: Goal): Promise<void> => {
  const goals = await getGoals();
  const index = goals.findIndex((g) => g.id === goal.id);
  if (index !== -1) {
    goals[index] = goal;
    await saveGoals(goals);
  }
};

export const deleteGoal = async (goalId: string): Promise<void> => {
  const goals = await getGoals();
  const filtered = goals.filter((g) => g.id !== goalId);
  await saveGoals(filtered);
};

// Planned Transactions
export const getPlannedTransactions = async (): Promise<PlannedTransaction[]> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.PLANNED_TRANSACTIONS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting planned transactions:', error);
    return [];
  }
};

export const savePlannedTransactions = async (plannedTransactions: PlannedTransaction[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.PLANNED_TRANSACTIONS, JSON.stringify(plannedTransactions));
  } catch (error) {
    console.error('Error saving planned transactions:', error);
    throw error;
  }
};

export const addPlannedTransaction = async (plannedTransaction: PlannedTransaction): Promise<void> => {
  const plannedTransactions = await getPlannedTransactions();
  plannedTransactions.push(plannedTransaction);
  await savePlannedTransactions(plannedTransactions);
};

export const updatePlannedTransaction = async (plannedTransaction: PlannedTransaction): Promise<void> => {
  const plannedTransactions = await getPlannedTransactions();
  const index = plannedTransactions.findIndex((pt) => pt.id === plannedTransaction.id);
  if (index !== -1) {
    plannedTransactions[index] = plannedTransaction;
    await savePlannedTransactions(plannedTransactions);
  }
};

export const deletePlannedTransaction = async (plannedTransactionId: string): Promise<void> => {
  const plannedTransactions = await getPlannedTransactions();
  const filtered = plannedTransactions.filter((pt) => pt.id !== plannedTransactionId);
  await savePlannedTransactions(filtered);
};

// Bills
export const getBills = async (): Promise<Bill[]> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.BILLS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting bills:', error);
    return [];
  }
};

export const saveBills = async (bills: Bill[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.BILLS, JSON.stringify(bills));
  } catch (error) {
    console.error('Error saving bills:', error);
    throw error;
  }
};

export const addBill = async (bill: Bill): Promise<void> => {
  const bills = await getBills();
  bills.push(bill);
  await saveBills(bills);
};

export const updateBill = async (bill: Bill): Promise<void> => {
  const bills = await getBills();
  const index = bills.findIndex((b) => b.id === bill.id);
  if (index !== -1) {
    bills[index] = bill;
    await saveBills(bills);
  }
};

export const deleteBill = async (billId: string): Promise<void> => {
  const bills = await getBills();
  const filtered = bills.filter((b) => b.id !== billId);
  await saveBills(filtered);
};
