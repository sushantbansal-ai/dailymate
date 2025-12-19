import * as NotificationService from '@/services/notifications';
import * as PlannedTransactionService from '@/services/planned-transactions';
import * as Storage from '@/services/storage';
import { Account, Bill, Budget, Category, Contact, Goal, Label, PlannedTransaction, Transaction } from '@/types';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';

interface AppContextType {
  accounts: Account[];
  transactions: Transaction[];
  categories: Category[];
  labels: Label[];
  contacts: Contact[];
  budgets: Budget[];
  goals: Goal[];
  plannedTransactions: PlannedTransaction[];
  bills: Bill[];
  loading: boolean;
  addAccount: (account: Account) => Promise<void>;
  updateAccount: (account: Account) => Promise<void>;
  deleteAccount: (accountId: string) => Promise<void>;
  addTransaction: (transaction: Transaction) => Promise<void>;
  updateTransaction: (transaction: Transaction) => Promise<void>;
  deleteTransaction: (transactionId: string) => Promise<void>;
  addCategory: (category: Category) => Promise<void>;
  updateCategory: (category: Category) => Promise<void>;
  deleteCategory: (categoryId: string) => Promise<void>;
  addLabel: (label: Label) => Promise<void>;
  updateLabel: (label: Label) => Promise<void>;
  deleteLabel: (labelId: string) => Promise<void>;
  addContact: (contact: Contact) => Promise<void>;
  updateContact: (contact: Contact) => Promise<void>;
  deleteContact: (contactId: string) => Promise<void>;
  addBudget: (budget: Budget) => Promise<void>;
  updateBudget: (budget: Budget) => Promise<void>;
  deleteBudget: (budgetId: string) => Promise<void>;
  addGoal: (goal: Goal) => Promise<void>;
  updateGoal: (goal: Goal) => Promise<void>;
  deleteGoal: (goalId: string) => Promise<void>;
  addPlannedTransaction: (plannedTransaction: PlannedTransaction) => Promise<void>;
  updatePlannedTransaction: (plannedTransaction: PlannedTransaction) => Promise<void>;
  deletePlannedTransaction: (plannedTransactionId: string) => Promise<void>;
  addBill: (bill: Bill) => Promise<void>;
  updateBill: (bill: Bill) => Promise<void>;
  deleteBill: (billId: string) => Promise<void>;
  refreshData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [labels, setLabels] = useState<Label[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [plannedTransactions, setPlannedTransactions] = useState<PlannedTransaction[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const [accountsData, transactionsData, categoriesData, labelsData, contactsData, budgetsData, goalsData, plannedTransactionsData, billsData] = await Promise.all([
        Storage.getAccounts(),
        Storage.getTransactions(),
        Storage.getCategories(),
        Storage.getLabels(),
        Storage.getContacts(),
        Storage.getBudgets(),
        Storage.getGoals(),
        Storage.getPlannedTransactions(),
        Storage.getBills(),
      ]);
      setAccounts(accountsData);
      setTransactions(transactionsData);
      setCategories(categoriesData);
      setLabels(labelsData);
      setContacts(contactsData);
      setBudgets(budgetsData);
      setGoals(goalsData);
      setPlannedTransactions(plannedTransactionsData);
      
      // Update bill statuses and calculate next due dates
      const updatedBills = billsData.map((bill) => {
        const updatedBill = NotificationService.updateBillStatus(bill);
        const nextDueDate = NotificationService.calculateNextDueDate(updatedBill);
        return { ...updatedBill, nextDueDate: nextDueDate || undefined };
      });
      setBills(updatedBills);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // Request notification permissions on app start
    NotificationService.requestNotificationPermissions();
    
    // Process due planned transactions on app start
    PlannedTransactionService.processDuePlannedTransactions()
      .then((createdIds) => {
        if (createdIds.length > 0) {
          console.log(`Auto-created ${createdIds.length} transaction(s) from planned transactions`);
          loadData(); // Reload to show new transactions
        }
      })
      .catch((error) => {
        console.error('Error processing due planned transactions:', error);
      });
  }, []);

  const addAccount = async (account: Account) => {
    await Storage.addAccount(account);
    await loadData();
    // Schedule notifications for the new account
    try {
      await NotificationService.scheduleAccountNotifications(account);
    } catch (error) {
      console.error('Error scheduling notifications:', error);
    }
  };

  const updateAccount = async (account: Account) => {
    await Storage.updateAccount(account);
    await loadData();
    // Reschedule notifications for the updated account
    try {
      await NotificationService.scheduleAccountNotifications(account);
      // Check goal milestones for goals linked to this account
      const updatedGoals = await Storage.getGoals();
      const linkedGoals = updatedGoals.filter((g) => g.accountId === account.id);
      for (const goal of linkedGoals) {
        if (goal.enableNotifications) {
          await NotificationService.checkGoalMilestones(goal, account.balance);
        }
      }
    } catch (error) {
      console.error('Error scheduling notifications:', error);
    }
  };

  const deleteAccount = async (accountId: string) => {
    // Cancel notifications for this account
    try {
      await NotificationService.cancelAccountNotifications(accountId);
    } catch (error) {
      console.error('Error canceling notifications:', error);
    }
    
    await Storage.deleteAccount(accountId);
    // Also delete related transactions
    const relatedTransactions = transactions.filter((t) => t.accountId === accountId || t.toAccountId === accountId);
    for (const transaction of relatedTransactions) {
      await Storage.deleteTransaction(transaction.id);
    }
    await loadData();
  };

  const addTransaction = async (transaction: Transaction) => {
    await Storage.addTransaction(transaction);
    // Update account balances
    const account = accounts.find((a) => a.id === transaction.accountId);
    if (account) {
      let newBalance = account.balance;
      if (transaction.type === 'income') {
        newBalance += transaction.amount;
      } else if (transaction.type === 'expense') {
        newBalance -= transaction.amount;
      } else if (transaction.type === 'transfer' && transaction.toAccountId) {
        newBalance -= transaction.amount;
        const toAccount = accounts.find((a) => a.id === transaction.toAccountId);
        if (toAccount) {
          const updatedToAccount = {
            ...toAccount,
            balance: toAccount.balance + transaction.amount,
            updatedAt: new Date().toISOString(),
          };
          await Storage.updateAccount(updatedToAccount);
        }
      }
      const updatedAccount = {
        ...account,
        balance: newBalance,
        updatedAt: new Date().toISOString(),
      };
      await Storage.updateAccount(updatedAccount);
    }
    await loadData();
    
    // Check budget thresholds for expense transactions
    if (transaction.type === 'expense') {
      try {
        const updatedBudgets = await Storage.getBudgets();
        const updatedTransactions = await Storage.getTransactions();
        for (const budget of updatedBudgets) {
          if (budget.enableNotifications) {
            const spending = NotificationService.calculateBudgetSpending(budget, updatedTransactions);
            await NotificationService.checkBudgetThresholds(budget, spending);
          }
        }
      } catch (error) {
        console.error('Error checking budget thresholds:', error);
      }
    }
  };

  const updateTransaction = async (transaction: Transaction) => {
    // Find the old transaction to revert its balance changes
    const oldTransaction = transactions.find((t) => t.id === transaction.id);
    
    // Revert old transaction's balance changes first
    if (oldTransaction) {
      const oldAccount = accounts.find((a) => a.id === oldTransaction.accountId);
      if (oldAccount) {
        let revertedBalance = oldAccount.balance;
        if (oldTransaction.type === 'income') {
          revertedBalance -= oldTransaction.amount;
        } else if (oldTransaction.type === 'expense') {
          revertedBalance += oldTransaction.amount;
        } else if (oldTransaction.type === 'transfer' && oldTransaction.toAccountId) {
          revertedBalance += oldTransaction.amount;
          const oldToAccount = accounts.find((a) => a.id === oldTransaction.toAccountId);
          if (oldToAccount) {
            const revertedToAccount = {
              ...oldToAccount,
              balance: oldToAccount.balance - oldTransaction.amount,
              updatedAt: new Date().toISOString(),
            };
            await Storage.updateAccount(revertedToAccount);
          }
        }
        const revertedAccount = {
          ...oldAccount,
          balance: revertedBalance,
          updatedAt: new Date().toISOString(),
        };
        await Storage.updateAccount(revertedAccount);
      }
    }

    // Reload accounts to get updated balances before applying new transaction
    const updatedAccounts = await Storage.getAccounts();
    
    // Apply new transaction's balance changes
    const account = updatedAccounts.find((a) => a.id === transaction.accountId);
    if (account) {
      let newBalance = account.balance;
      if (transaction.type === 'income') {
        newBalance += transaction.amount;
      } else if (transaction.type === 'expense') {
        newBalance -= transaction.amount;
      } else if (transaction.type === 'transfer' && transaction.toAccountId) {
        newBalance -= transaction.amount;
        const toAccount = updatedAccounts.find((a) => a.id === transaction.toAccountId);
        if (toAccount) {
          const updatedToAccount = {
            ...toAccount,
            balance: toAccount.balance + transaction.amount,
            updatedAt: new Date().toISOString(),
          };
          await Storage.updateAccount(updatedToAccount);
        }
      }
      const updatedAccount = {
        ...account,
        balance: newBalance,
        updatedAt: new Date().toISOString(),
      };
      await Storage.updateAccount(updatedAccount);
    }

    await Storage.updateTransaction(transaction);
    await loadData();
    
    // Check budget thresholds for expense transactions
    if (transaction.type === 'expense') {
      try {
        const updatedBudgets = await Storage.getBudgets();
        const updatedTransactions = await Storage.getTransactions();
        for (const budget of updatedBudgets) {
          if (budget.enableNotifications) {
            const spending = NotificationService.calculateBudgetSpending(budget, updatedTransactions);
            await NotificationService.checkBudgetThresholds(budget, spending);
          }
        }
      } catch (error) {
        console.error('Error checking budget thresholds:', error);
      }
    }
  };

  const deleteTransaction = async (transactionId: string) => {
    const transaction = transactions.find((t) => t.id === transactionId);
    if (transaction) {
      // Revert account balance changes
      const account = accounts.find((a) => a.id === transaction.accountId);
      if (account) {
        let newBalance = account.balance;
        if (transaction.type === 'income') {
          newBalance -= transaction.amount;
        } else if (transaction.type === 'expense') {
          newBalance += transaction.amount;
        } else if (transaction.type === 'transfer' && transaction.toAccountId) {
          newBalance += transaction.amount;
          const toAccount = accounts.find((a) => a.id === transaction.toAccountId);
          if (toAccount) {
            const updatedToAccount = {
              ...toAccount,
              balance: toAccount.balance - transaction.amount,
              updatedAt: new Date().toISOString(),
            };
            await Storage.updateAccount(updatedToAccount);
          }
        }
        const updatedAccount = {
          ...account,
          balance: newBalance,
          updatedAt: new Date().toISOString(),
        };
        await Storage.updateAccount(updatedAccount);
      }
    }
    await Storage.deleteTransaction(transactionId);
    await loadData();
  };

  const addCategory = async (category: Category) => {
    await Storage.addCategory(category);
    await loadData();
  };

  const updateCategory = async (category: Category) => {
    await Storage.updateCategory(category);
    await loadData();
  };

  const deleteCategory = async (categoryId: string) => {
    // Check if category is used in transactions
    const isUsed = transactions.some((t) => t.categoryId === categoryId);
    if (isUsed) {
      throw new Error('Cannot delete category that is used in transactions');
    }
    await Storage.deleteCategory(categoryId);
    await loadData();
  };

  const addLabel = async (label: Label) => {
    await Storage.addLabel(label);
    await loadData();
  };

  const updateLabel = async (label: Label) => {
    await Storage.updateLabel(label);
    await loadData();
  };

  const deleteLabel = async (labelId: string) => {
    await Storage.deleteLabel(labelId);
    await loadData();
  };

  const addContact = async (contact: Contact) => {
    await Storage.addContact(contact);
    await loadData();
  };

  const updateContact = async (contact: Contact) => {
    await Storage.updateContact(contact);
    await loadData();
  };

  const deleteContact = async (contactId: string) => {
    await Storage.deleteContact(contactId);
    await loadData();
  };

  const addBudget = async (budget: Budget) => {
    await Storage.addBudget(budget);
    await loadData();
    // Schedule notifications for the new budget
    try {
      await NotificationService.scheduleBudgetNotifications(budget);
    } catch (error) {
      console.error('Error scheduling budget notifications:', error);
    }
  };

  const updateBudget = async (budget: Budget) => {
    await Storage.updateBudget(budget);
    await loadData();
    // Reschedule notifications for the updated budget
    try {
      await NotificationService.cancelBudgetNotifications(budget.id);
      await NotificationService.scheduleBudgetNotifications(budget);
    } catch (error) {
      console.error('Error scheduling budget notifications:', error);
    }
  };

  const deleteBudget = async (budgetId: string) => {
    // Cancel notifications for this budget
    try {
      await NotificationService.cancelBudgetNotifications(budgetId);
    } catch (error) {
      console.error('Error canceling budget notifications:', error);
    }
    await Storage.deleteBudget(budgetId);
    await loadData();
  };

  const addGoal = async (goal: Goal) => {
    await Storage.addGoal(goal);
    await loadData();
    // Schedule notifications for the new goal
    try {
      await NotificationService.scheduleGoalNotifications(goal);
    } catch (error) {
      console.error('Error scheduling goal notifications:', error);
    }
  };

  const updateGoal = async (goal: Goal) => {
    await Storage.updateGoal(goal);
    await loadData();
    // Reschedule notifications for the updated goal
    try {
      await NotificationService.cancelGoalNotifications(goal.id);
      await NotificationService.scheduleGoalNotifications(goal);
      // Check milestones for the updated goal
      const updatedGoals = await Storage.getGoals();
      const updatedGoal = updatedGoals.find((g) => g.id === goal.id);
      if (updatedGoal) {
        let currentAmount = updatedGoal.currentAmount;
        if (updatedGoal.accountId) {
          const account = accounts.find((a) => a.id === updatedGoal.accountId);
          if (account) {
            currentAmount = account.balance;
          }
        }
        await NotificationService.checkGoalMilestones(updatedGoal, currentAmount);
      }
    } catch (error) {
      console.error('Error scheduling goal notifications:', error);
    }
  };

  const deleteGoal = async (goalId: string) => {
    // Cancel notifications for this goal
    try {
      await NotificationService.cancelGoalNotifications(goalId);
    } catch (error) {
      console.error('Error canceling goal notifications:', error);
    }
    await Storage.deleteGoal(goalId);
    await loadData();
  };

  const addPlannedTransaction = async (plannedTransaction: PlannedTransaction) => {
    await Storage.addPlannedTransaction(plannedTransaction);
    await loadData();
    // Schedule notifications for the new planned transaction
    try {
      await NotificationService.schedulePlannedTransactionNotifications(plannedTransaction);
    } catch (error) {
      console.error('Error scheduling planned transaction notifications:', error);
    }
  };

  const updatePlannedTransaction = async (plannedTransaction: PlannedTransaction) => {
    await Storage.updatePlannedTransaction(plannedTransaction);
    await loadData();
    // Reschedule notifications for the updated planned transaction
    try {
      await NotificationService.cancelPlannedTransactionNotifications(plannedTransaction.id);
      await NotificationService.schedulePlannedTransactionNotifications(plannedTransaction);
    } catch (error) {
      console.error('Error scheduling planned transaction notifications:', error);
    }
  };

  const deletePlannedTransaction = async (plannedTransactionId: string) => {
    // Cancel notifications for this planned transaction
    try {
      await NotificationService.cancelPlannedTransactionNotifications(plannedTransactionId);
    } catch (error) {
      console.error('Error canceling planned transaction notifications:', error);
    }
    await Storage.deletePlannedTransaction(plannedTransactionId);
    await loadData();
  };

  const addBill = async (bill: Bill) => {
    // Calculate next due date and update status
    const nextDueDate = NotificationService.calculateNextDueDate(bill);
    const updatedBill = NotificationService.updateBillStatus({ ...bill, nextDueDate: nextDueDate || undefined });
    await Storage.addBill(updatedBill);
    await loadData();
    // Schedule notifications for the new bill
    try {
      await NotificationService.scheduleBillNotifications(updatedBill);
    } catch (error) {
      console.error('Error scheduling bill notifications:', error);
    }
  };

  const updateBill = async (bill: Bill) => {
    // Calculate next due date and update status
    const nextDueDate = NotificationService.calculateNextDueDate(bill);
    const updatedBill = NotificationService.updateBillStatus({ ...bill, nextDueDate: nextDueDate || undefined });
    await Storage.updateBill(updatedBill);
    await loadData();
    // Reschedule notifications for the updated bill
    try {
      await NotificationService.cancelBillNotifications(bill.id);
      await NotificationService.scheduleBillNotifications(updatedBill);
    } catch (error) {
      console.error('Error scheduling bill notifications:', error);
    }
  };

  const deleteBill = async (billId: string) => {
    // Cancel notifications for this bill
    try {
      await NotificationService.cancelBillNotifications(billId);
    } catch (error) {
      console.error('Error canceling bill notifications:', error);
    }
    await Storage.deleteBill(billId);
    await loadData();
  };

  const refreshData = async () => {
    await loadData();
  };

  return (
    <AppContext.Provider
      value={{
        accounts,
        transactions,
        categories,
        labels,
        contacts,
        budgets,
        goals,
        plannedTransactions,
        bills,
        loading,
        addAccount,
        updateAccount,
        deleteAccount,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        addCategory,
        updateCategory,
        deleteCategory,
        addLabel,
        updateLabel,
        deleteLabel,
        addContact,
        updateContact,
        deleteContact,
        addBudget,
        updateBudget,
        deleteBudget,
        addGoal,
        updateGoal,
        deleteGoal,
        addPlannedTransaction,
        updatePlannedTransaction,
        deletePlannedTransaction,
        addBill,
        updateBill,
        deleteBill,
        refreshData,
      }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
