import { Account, AccountType, Bill, Budget, Goal, PlannedTransaction } from '@/types';

// Safely import and configure notifications (lazy loading)
let Notifications: typeof import('expo-notifications') | null = null;
let initializationAttempted = false;

// Initialize notifications module (lazy, non-blocking)
const initNotifications = () => {
  if (initializationAttempted) return; // Already attempted
  initializationAttempted = true;
  
  try {
    // Use dynamic import to avoid blocking module load
    const notificationsModule = require('expo-notifications');
    Notifications = notificationsModule;
    
    // Configure notification handler
    if (Notifications && Notifications.setNotificationHandler) {
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
        }),
      });
    }
  } catch (error) {
    // Silently fail - notifications not available (e.g., in web or dev mode)
    Notifications = null;
  }
};

// Request permissions
export async function requestNotificationPermissions(): Promise<boolean> {
  initNotifications();
  
  if (!Notifications) {
    console.warn('Notifications module not available');
    return false;
  }
  
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    return finalStatus === 'granted';
  } catch (error) {
    console.warn('Error requesting notification permissions:', error);
    return false;
  }
}

// Get all scheduled notifications
export async function getAllScheduledNotifications() {
  initNotifications();
  if (!Notifications) return [];
  try {
    return await Notifications.getAllScheduledNotificationsAsync();
  } catch (error) {
    console.warn('Error getting scheduled notifications:', error);
    return [];
  }
}

// Cancel a specific notification
export async function cancelNotification(notificationId: string) {
  initNotifications();
  if (!Notifications) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch (error) {
    console.warn('Error canceling notification:', error);
  }
}

// Cancel all notifications for an account
export async function cancelAccountNotifications(accountId: string) {
  initNotifications();
  if (!Notifications) return;
  try {
    const notifications = await Notifications.getAllScheduledNotificationsAsync();
    const accountNotifications = notifications.filter(
      (n) => n.identifier.startsWith(`account-${accountId}-`)
    );
    
    for (const notification of accountNotifications) {
      await Notifications.cancelScheduledNotificationAsync(notification.identifier);
    }
  } catch (error) {
    console.warn('Error canceling account notifications:', error);
  }
}

// Schedule notification for account end date
export async function scheduleAccountNotifications(account: Account): Promise<void> {
  initNotifications();
  
  if (!Notifications) {
    console.warn('Notifications module not available');
    return;
  }

  try {
    // Cancel existing notifications for this account
    await cancelAccountNotifications(account.id);

    // Check if notifications are enabled
    if (account.details?.enableNotifications === false) {
      return;
    }

    // Get end date based on account type
    const endDate = getAccountEndDate(account);
    if (!endDate) {
      return;
    }

    const notificationDaysBefore = account.details?.notificationDaysBefore || 7;
    const notificationDate = new Date(endDate);
    notificationDate.setDate(notificationDate.getDate() - notificationDaysBefore);

    // Don't schedule if notification date is in the past
    if (notificationDate < new Date()) {
      return;
    }

    const notificationTitle = getNotificationTitle(account);
    const notificationBody = getNotificationBody(account, endDate);

    // Schedule notification
    await Notifications.scheduleNotificationAsync({
      content: {
        title: notificationTitle,
        body: notificationBody,
        data: {
          accountId: account.id,
          accountName: account.name,
          accountType: account.type,
          endDate: endDate,
        },
        sound: true,
      },
      trigger: {
        date: notificationDate,
      },
      identifier: `account-${account.id}-end-date`,
    });

    // Also schedule a notification on the end date itself
    const endDateObj = new Date(endDate);
    if (endDateObj > new Date()) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `${account.name} - End Date Today`,
          body: getEndDateNotificationBody(account, endDate),
          data: {
            accountId: account.id,
            accountName: account.name,
            accountType: account.type,
            endDate: endDate,
          },
          sound: true,
        },
        trigger: {
          date: endDateObj,
        },
        identifier: `account-${account.id}-end-date-today`,
      });
    }
  } catch (error) {
    console.warn('Error scheduling account notifications:', error);
  }
}

// Get end date based on account type
function getAccountEndDate(account: Account): string | null {
  const details = account.details;
  if (!details) return null;

  switch (account.type) {
    case 'Fixed Deposit (FD)':
      return details.endDate || details.maturityDate || null;
    
    case 'Recurring Deposit (RD)':
      return details.endDate || details.maturityDate || null;
    
    case 'Public Provident Fund (PPF)':
      return details.ppfMaturityDate || details.endDate || null;
    
    case 'Monthly Income Scheme (MIS)':
      return details.endDate || details.maturityDate || null;
    
    case 'Bonds':
      return details.bondMaturityDate || details.endDate || null;
    
    case 'Loan':
      return details.loanEndDate || details.endDate || null;
    
    case 'Credit Card':
      // For credit card, we'll use due date (day of month)
      // This is handled differently - monthly notifications
      return null;
    
    default:
      return details.endDate || details.maturityDate || null;
  }
}

// Get notification title
function getNotificationTitle(account: Account): string {
  switch (account.type) {
    case 'Fixed Deposit (FD)':
      return `FD Maturity Reminder: ${account.name}`;
    case 'Recurring Deposit (RD)':
      return `RD Maturity Reminder: ${account.name}`;
    case 'Public Provident Fund (PPF)':
      return `PPF Maturity Reminder: ${account.name}`;
    case 'Loan':
      return `Loan End Date Reminder: ${account.name}`;
    case 'Bonds':
      return `Bond Maturity Reminder: ${account.name}`;
    default:
      return `Account Reminder: ${account.name}`;
  }
}

// Get notification body
function getNotificationBody(account: Account, endDate: string): string {
  const daysUntil = Math.ceil(
    (new Date(endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );
  
  switch (account.type) {
    case 'Fixed Deposit (FD)':
      return `Your Fixed Deposit "${account.name}" will mature in ${daysUntil} days (${new Date(endDate).toLocaleDateString('en-IN')}).`;
    case 'Recurring Deposit (RD)':
      return `Your Recurring Deposit "${account.name}" will mature in ${daysUntil} days (${new Date(endDate).toLocaleDateString('en-IN')}).`;
    case 'Public Provident Fund (PPF)':
      return `Your PPF account "${account.name}" will mature in ${daysUntil} days (${new Date(endDate).toLocaleDateString('en-IN')}).`;
    case 'Loan':
      return `Your loan "${account.name}" will end in ${daysUntil} days (${new Date(endDate).toLocaleDateString('en-IN')}).`;
    case 'Bonds':
      return `Your bond "${account.name}" will mature in ${daysUntil} days (${new Date(endDate).toLocaleDateString('en-IN')}).`;
    default:
      return `Your account "${account.name}" has an important date in ${daysUntil} days (${new Date(endDate).toLocaleDateString('en-IN')}).`;
  }
}

// Get end date notification body
function getEndDateNotificationBody(account: Account, endDate: string): string {
  switch (account.type) {
    case 'Fixed Deposit (FD)':
      return `Your Fixed Deposit "${account.name}" matures today! Check your bank for maturity amount.`;
    case 'Recurring Deposit (RD)':
      return `Your Recurring Deposit "${account.name}" matures today! Check your bank for maturity amount.`;
    case 'Public Provident Fund (PPF)':
      return `Your PPF account "${account.name}" matures today! Consider your next steps.`;
    case 'Loan':
      return `Your loan "${account.name}" ends today! Ensure all payments are complete.`;
    case 'Bonds':
      return `Your bond "${account.name}" matures today! Check for redemption.`;
    default:
      return `Your account "${account.name}" has an important date today!`;
  }
}

// Get required fields for account type (always available, doesn't depend on notifications module)
export function getRequiredFieldsForAccountType(type: AccountType): string[] {
  switch (type) {
    case 'Fixed Deposit (FD)':
      return ['startDate', 'endDate', 'interestRate', 'principalAmount'];
    case 'Recurring Deposit (RD)':
      return ['startDate', 'endDate', 'interestRate', 'rdMonthlyAmount'];
    case 'Public Provident Fund (PPF)':
      return ['startDate', 'ppfMaturityDate', 'ppfAccountNumber'];
    case 'Monthly Income Scheme (MIS)':
      return ['startDate', 'endDate', 'interestRate', 'principalAmount'];
    case 'National Pension System (NPS)':
      return ['npsPRAN'];
    case 'Mutual Fund':
      return ['mutualFundScheme', 'mutualFundFolioNumber'];
    case 'Stocks':
      return ['stockSymbol', 'stockExchange'];
    case 'Bonds':
      return ['bondFaceValue', 'bondCouponRate', 'bondMaturityDate'];
    case 'Credit Card':
      return ['creditCardLimit', 'creditCardDueDate', 'creditCardBank'];
    case 'Loan':
      return ['loanPrincipal', 'loanInterestRate', 'loanTenure', 'loanStartDate', 'loanEndDate'];
    case 'Digital Wallet':
      return ['walletProvider'];
    case 'Savings Account':
    case 'Current Account':
      return ['accountNumber', 'bankName', 'ifscCode'];
    default:
      return [];
  }
}

// Get field labels for account type (always available, doesn't depend on notifications module)
export function getFieldLabelsForAccountType(type: AccountType): Record<string, string> {
  const commonLabels: Record<string, string> = {
    startDate: 'Start Date',
    endDate: 'End Date',
    maturityDate: 'Maturity Date',
    interestRate: 'Interest Rate (%)',
    principalAmount: 'Principal Amount',
  };

  const typeSpecificLabels: Record<AccountType, Record<string, string>> = {
    'Cash': {},
    'Digital Wallet': {
      walletProvider: 'Wallet Provider',
      walletPhoneNumber: 'Phone Number',
    },
    'Savings Account': {
      accountNumber: 'Account Number',
      bankName: 'Bank Name',
      ifscCode: 'IFSC Code',
      branchName: 'Branch Name',
    },
    'Current Account': {
      accountNumber: 'Account Number',
      bankName: 'Bank Name',
      ifscCode: 'IFSC Code',
      branchName: 'Branch Name',
    },
    'Fixed Deposit (FD)': {
      fdTenure: 'Tenure (months)',
      fdType: 'FD Type',
      principalAmount: 'Deposit Amount',
    },
    'Recurring Deposit (RD)': {
      rdMonthlyAmount: 'Monthly Deposit Amount',
      rdTenure: 'Tenure (months)',
    },
    'Public Provident Fund (PPF)': {
      ppfAccountNumber: 'PPF Account Number',
      ppfMaturityDate: 'Maturity Date',
    },
    'Monthly Income Scheme (MIS)': {
      misMonthlyIncome: 'Monthly Income Amount',
    },
    'National Pension System (NPS)': {
      npsPRAN: 'PRAN (Permanent Retirement Account Number)',
      npsTier: 'NPS Tier',
    },
    'Mutual Fund': {
      mutualFundScheme: 'Scheme Name',
      mutualFundFolioNumber: 'Folio Number',
      mutualFundNav: 'NAV (Current)',
    },
    'Stocks': {
      stockSymbol: 'Stock Symbol',
      stockExchange: 'Exchange',
      stockQuantity: 'Quantity',
      stockPurchasePrice: 'Purchase Price',
    },
    'Bonds': {
      bondFaceValue: 'Face Value',
      bondCouponRate: 'Coupon Rate (%)',
      bondMaturityDate: 'Maturity Date',
    },
    'Gold': {},
    'Credit Card': {
      creditCardNumber: 'Card Number (Last 4 digits)',
      creditCardLimit: 'Credit Limit',
      creditCardDueDate: 'Due Date (Day of month)',
      creditCardBank: 'Bank Name',
    },
    'Loan': {
      loanPrincipal: 'Loan Amount',
      loanInterestRate: 'Interest Rate (%)',
      loanTenure: 'Tenure (months)',
      loanEMI: 'EMI Amount',
      loanStartDate: 'Loan Start Date',
      loanEndDate: 'Loan End Date',
      loanType: 'Loan Type',
    },
    'Other': {},
  };

  return { ...commonLabels, ...typeSpecificLabels[type] };
}

// Budget Notifications

// Cancel all notifications for a budget
export async function cancelBudgetNotifications(budgetId: string) {
  initNotifications();
  if (!Notifications) return;
  try {
    const notifications = await Notifications.getAllScheduledNotificationsAsync();
    const budgetNotifications = notifications.filter(
      (n) => n.identifier.startsWith(`budget-${budgetId}-`)
    );
    
    for (const notification of budgetNotifications) {
      await Notifications.cancelScheduledNotificationAsync(notification.identifier);
    }
  } catch (error) {
    console.warn('Error canceling budget notifications:', error);
  }
}

// Calculate budget spending for a given period
export function calculateBudgetSpending(
  budget: Budget,
  transactions: Array<{ categoryId: string; type: string; amount: number; date: string }>
): number {
  const startDate = new Date(budget.startDate);
  const endDate = budget.endDate ? new Date(budget.endDate) : getBudgetEndDate(budget);
  
  return transactions
    .filter((t) => {
      const transactionDate = new Date(t.date);
      return (
        t.type === 'expense' &&
        (!budget.categoryId || t.categoryId === budget.categoryId) &&
        transactionDate >= startDate &&
        transactionDate <= endDate
      );
    })
    .reduce((sum, t) => sum + t.amount, 0);
}

// Get budget end date based on period
function getBudgetEndDate(budget: Budget): Date {
  const startDate = new Date(budget.startDate);
  const endDate = new Date(startDate);
  
  switch (budget.period) {
    case 'weekly':
      endDate.setDate(startDate.getDate() + 7);
      break;
    case 'monthly':
      endDate.setMonth(startDate.getMonth() + 1);
      break;
    case 'yearly':
      endDate.setFullYear(startDate.getFullYear() + 1);
      break;
  }
  
  return endDate;
}

// Schedule notifications for budget thresholds
export async function scheduleBudgetNotifications(budget: Budget): Promise<void> {
  initNotifications();
  
  if (!Notifications) {
    console.warn('Notifications module not available');
    return;
  }

  try {
    // Cancel existing notifications for this budget
    await cancelBudgetNotifications(budget.id);

    // Check if notifications are enabled
    if (budget.enableNotifications === false) {
      return;
    }

    // Get notification thresholds (default: 50%, 75%, 90%, 100%)
    const thresholds = budget.notifyAtPercentage || [50, 75, 90, 100];
    const budgetAmount = budget.amount;

    // Schedule notifications for each threshold
    // Note: These will be checked periodically or when transactions are added
    // For now, we'll schedule daily checks during the budget period
    const startDate = new Date(budget.startDate);
    const endDate = budget.endDate ? new Date(budget.endDate) : getBudgetEndDate(budget);
    
    // Schedule daily checks during the budget period
    const today = new Date();
    let checkDate = new Date(Math.max(today.getTime(), startDate.getTime()));
    
    while (checkDate <= endDate) {
      // Schedule a notification check for this date at 9 AM
      const notificationDate = new Date(checkDate);
      notificationDate.setHours(9, 0, 0, 0);
      
      if (notificationDate > new Date()) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Budget Check',
            body: `Check your budget "${budget.name}" spending progress.`,
            data: {
              budgetId: budget.id,
              budgetName: budget.name,
              type: 'budget-check',
            },
            sound: false, // Silent check notification
          },
          trigger: {
            date: notificationDate,
          },
          identifier: `budget-${budget.id}-check-${checkDate.toISOString().split('T')[0]}`,
        });
      }
      
      // Move to next day
      checkDate.setDate(checkDate.getDate() + 1);
    }
  } catch (error) {
    console.warn('Error scheduling budget notifications:', error);
  }
}

// Check and send budget threshold notifications
export async function checkBudgetThresholds(
  budget: Budget,
  currentSpending: number
): Promise<void> {
  initNotifications();
  
  if (!Notifications) {
    return;
  }

  try {
    if (budget.enableNotifications === false) {
      return;
    }

    const thresholds = budget.notifyAtPercentage || [50, 75, 90, 100];
    const budgetAmount = budget.amount;
    const percentage = (currentSpending / budgetAmount) * 100;

    // Check each threshold
    for (const threshold of thresholds) {
      const thresholdAmount = (budgetAmount * threshold) / 100;
      
      // If spending is at or above threshold, send notification
      if (currentSpending >= thresholdAmount && currentSpending < thresholdAmount + (budgetAmount * 0.01)) {
        // Check if we've already notified for this threshold today
        const today = new Date().toISOString().split('T')[0];
        const notificationId = `budget-${budget.id}-threshold-${threshold}-${today}`;
        
        const existingNotifications = await Notifications.getAllScheduledNotificationsAsync();
        const alreadyNotified = existingNotifications.some(
          (n) => n.identifier === notificationId
        );

        if (!alreadyNotified) {
          // Send notification immediately
          await Notifications.scheduleNotificationAsync({
            content: {
              title: `Budget Alert: ${budget.name}`,
              body: `You've reached ${threshold}% of your budget (${percentage.toFixed(1)}%). Spent: ₹${currentSpending.toFixed(2)}, Budget: ₹${budgetAmount.toFixed(2)}`,
              data: {
                budgetId: budget.id,
                budgetName: budget.name,
                type: 'budget-threshold',
                threshold: threshold,
                currentSpending: currentSpending,
                budgetAmount: budgetAmount,
              },
              sound: true,
            },
            trigger: {
              seconds: 1, // Send after 1 second (immediate)
            },
            identifier: notificationId,
          });
        }
      }
    }

    // Check if budget is exceeded
    if (currentSpending > budgetAmount) {
      const today = new Date().toISOString().split('T')[0];
      const notificationId = `budget-${budget.id}-exceeded-${today}`;
      
      const existingNotifications = await Notifications.getAllScheduledNotificationsAsync();
      const alreadyNotified = existingNotifications.some(
        (n) => n.identifier === notificationId
      );

      if (!alreadyNotified) {
        // Send notification immediately
        await Notifications.scheduleNotificationAsync({
          content: {
            title: `Budget Exceeded: ${budget.name}`,
            body: `You've exceeded your budget by ₹${(currentSpending - budgetAmount).toFixed(2)}. Spent: ₹${currentSpending.toFixed(2)}, Budget: ₹${budgetAmount.toFixed(2)}`,
            data: {
              budgetId: budget.id,
              budgetName: budget.name,
              type: 'budget-exceeded',
              currentSpending: currentSpending,
              budgetAmount: budgetAmount,
            },
            sound: true,
          },
          trigger: {
            seconds: 1, // Send after 1 second (immediate)
          },
          identifier: notificationId,
        });
      }
    }
  } catch (error) {
    console.warn('Error checking budget thresholds:', error);
  }
}

// Goal Notifications

// Cancel all notifications for a goal
export async function cancelGoalNotifications(goalId: string) {
  initNotifications();
  if (!Notifications) return;
  try {
    const notifications = await Notifications.getAllScheduledNotificationsAsync();
    const goalNotifications = notifications.filter(
      (n) => n.identifier.startsWith(`goal-${goalId}-`)
    );
    
    for (const notification of goalNotifications) {
      await Notifications.cancelScheduledNotificationAsync(notification.identifier);
    }
  } catch (error) {
    console.warn('Error canceling goal notifications:', error);
  }
}

// Schedule notifications for goal milestones and target date
export async function scheduleGoalNotifications(goal: Goal): Promise<void> {
  initNotifications();
  
  if (!Notifications) {
    console.warn('Notifications module not available');
    return;
  }

  try {
    // Cancel existing notifications for this goal
    await cancelGoalNotifications(goal.id);

    // Check if notifications are enabled
    if (goal.enableNotifications === false) {
      return;
    }

    const targetDate = new Date(goal.targetDate);
    const today = new Date();

    // Schedule notification before target date
    if (goal.notifyDaysBefore && goal.notifyDaysBefore > 0) {
      const reminderDate = new Date(targetDate);
      reminderDate.setDate(reminderDate.getDate() - goal.notifyDaysBefore);
      
      if (reminderDate > today) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: `Goal Reminder: ${goal.name}`,
            body: `Your goal "${goal.name}" target date is in ${goal.notifyDaysBefore} days. Current: ₹${goal.currentAmount.toFixed(2)}, Target: ₹${goal.targetAmount.toFixed(2)}`,
            data: {
              goalId: goal.id,
              goalName: goal.name,
              type: 'goal-reminder',
              targetDate: goal.targetDate,
            },
            sound: true,
          },
          trigger: {
            date: reminderDate,
          },
          identifier: `goal-${goal.id}-reminder`,
        });
      }
    }

    // Schedule notification on target date
    if (targetDate > today) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `Goal Target Date: ${goal.name}`,
          body: `Today is your target date for "${goal.name}". Check your progress!`,
          data: {
            goalId: goal.id,
            goalName: goal.name,
            type: 'goal-target-date',
            targetDate: goal.targetDate,
          },
          sound: true,
        },
        trigger: {
          date: targetDate,
        },
        identifier: `goal-${goal.id}-target-date`,
      });
    }
  } catch (error) {
    console.warn('Error scheduling goal notifications:', error);
  }
}

// Check and send goal milestone notifications
export async function checkGoalMilestones(
  goal: Goal,
  currentAmount: number
): Promise<void> {
  initNotifications();
  
  if (!Notifications) {
    return;
  }

  try {
    if (goal.enableNotifications === false) {
      return;
    }

    const thresholds = goal.notifyAtPercentage || [25, 50, 75, 90, 100];
    const targetAmount = goal.targetAmount;
    const percentage = (currentAmount / targetAmount) * 100;

    // Check each threshold
    for (const threshold of thresholds) {
      const thresholdAmount = (targetAmount * threshold) / 100;
      
      // If current amount is at or above threshold, send notification
      if (currentAmount >= thresholdAmount && currentAmount < thresholdAmount + (targetAmount * 0.01)) {
        // Check if we've already notified for this threshold today
        const today = new Date().toISOString().split('T')[0];
        const notificationId = `goal-${goal.id}-milestone-${threshold}-${today}`;
        
        const existingNotifications = await Notifications.getAllScheduledNotificationsAsync();
        const alreadyNotified = existingNotifications.some(
          (n) => n.identifier === notificationId
        );

        if (!alreadyNotified) {
          // Send notification immediately
          await Notifications.scheduleNotificationAsync({
            content: {
              title: `Goal Milestone: ${goal.name}`,
              body: `Congratulations! You've reached ${threshold}% of your goal (${percentage.toFixed(1)}%). Saved: ₹${currentAmount.toFixed(2)}, Target: ₹${targetAmount.toFixed(2)}`,
              data: {
                goalId: goal.id,
                goalName: goal.name,
                type: 'goal-milestone',
                threshold: threshold,
                currentAmount: currentAmount,
                targetAmount: targetAmount,
              },
              sound: true,
            },
            trigger: {
              seconds: 1, // Send after 1 second (immediate)
            },
            identifier: notificationId,
          });
        }
      }
    }

    // Check if goal is completed
    if (currentAmount >= targetAmount) {
      const today = new Date().toISOString().split('T')[0];
      const notificationId = `goal-${goal.id}-completed-${today}`;
      
      const existingNotifications = await Notifications.getAllScheduledNotificationsAsync();
      const alreadyNotified = existingNotifications.some(
        (n) => n.identifier === notificationId
      );

      if (!alreadyNotified) {
        // Send notification immediately
        await Notifications.scheduleNotificationAsync({
          content: {
            title: `🎉 Goal Completed: ${goal.name}`,
            body: `Congratulations! You've reached your goal of ₹${targetAmount.toFixed(2)}. You saved ₹${currentAmount.toFixed(2)}!`,
            data: {
              goalId: goal.id,
              goalName: goal.name,
              type: 'goal-completed',
              currentAmount: currentAmount,
              targetAmount: targetAmount,
            },
            sound: true,
          },
          trigger: {
            seconds: 1, // Send after 1 second (immediate)
          },
          identifier: notificationId,
        });
      }
    }
  } catch (error) {
    console.warn('Error checking goal milestones:', error);
  }
}

// Planned Transaction Notifications

// Cancel all notifications for a planned transaction
export async function cancelPlannedTransactionNotifications(plannedTransactionId: string) {
  initNotifications();
  if (!Notifications) return;
  try {
    const notifications = await Notifications.getAllScheduledNotificationsAsync();
    const plannedNotifications = notifications.filter(
      (n) => n.identifier.startsWith(`planned-${plannedTransactionId}-`)
    );
    
    for (const notification of plannedNotifications) {
      await Notifications.cancelScheduledNotificationAsync(notification.identifier);
    }
  } catch (error) {
    console.warn('Error canceling planned transaction notifications:', error);
  }
}

// Schedule notifications for planned transaction
export async function schedulePlannedTransactionNotifications(plannedTransaction: PlannedTransaction): Promise<void> {
  initNotifications();
  
  if (!Notifications) {
    console.warn('Notifications module not available');
    return;
  }

  try {
    // Cancel existing notifications for this planned transaction
    await cancelPlannedTransactionNotifications(plannedTransaction.id);

    // Check if notifications are enabled
    if (plannedTransaction.enableNotifications === false) {
      return;
    }

    const scheduledDate = new Date(plannedTransaction.nextOccurrenceDate || plannedTransaction.scheduledDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Schedule notifications for days before
    if (plannedTransaction.notifyDaysBefore && plannedTransaction.notifyDaysBefore.length > 0) {
      for (const daysBefore of plannedTransaction.notifyDaysBefore) {
        const notificationDate = new Date(scheduledDate);
        notificationDate.setDate(notificationDate.getDate() - daysBefore);
        notificationDate.setHours(9, 0, 0, 0); // 9 AM
        
        if (notificationDate > today) {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: `Upcoming Transaction: ${plannedTransaction.description}`,
              body: `Your planned ${plannedTransaction.type} of ₹${plannedTransaction.amount.toFixed(2)} is scheduled in ${daysBefore} day${daysBefore !== 1 ? 's' : ''}.`,
              data: {
                plannedTransactionId: plannedTransaction.id,
                description: plannedTransaction.description,
                type: 'planned-transaction-reminder',
                scheduledDate: plannedTransaction.scheduledDate,
                daysBefore: daysBefore,
              },
              sound: true,
            },
            trigger: {
              date: notificationDate,
            },
            identifier: `planned-${plannedTransaction.id}-reminder-${daysBefore}`,
          });
        }
      }
    }

    // Schedule notification on scheduled date
    if (plannedTransaction.notifyOnDay && scheduledDate >= today) {
      const notificationDate = new Date(scheduledDate);
      notificationDate.setHours(9, 0, 0, 0); // 9 AM
      
      if (notificationDate > today) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: `Transaction Due Today: ${plannedTransaction.description}`,
            body: `Your planned ${plannedTransaction.type} of ₹${plannedTransaction.amount.toFixed(2)} is scheduled for today.${plannedTransaction.autoCreate ? ' It will be created automatically.' : ''}`,
            data: {
              plannedTransactionId: plannedTransaction.id,
              description: plannedTransaction.description,
              type: 'planned-transaction-due',
              scheduledDate: plannedTransaction.scheduledDate,
            },
            sound: true,
          },
          trigger: {
            date: notificationDate,
          },
          identifier: `planned-${plannedTransaction.id}-due`,
        });
      }
    }
  } catch (error) {
    console.warn('Error scheduling planned transaction notifications:', error);
  }
}

// Bill Notifications

// Cancel all notifications for a bill
export async function cancelBillNotifications(billId: string) {
  initNotifications();
  if (!Notifications) return;
  try {
    const notifications = await Notifications.getAllScheduledNotificationsAsync();
    const billNotifications = notifications.filter(
      (n) => n.identifier.startsWith(`bill-${billId}-`)
    );
    
    for (const notification of billNotifications) {
      await Notifications.cancelScheduledNotificationAsync(notification.identifier);
    }
  } catch (error) {
    console.warn('Error canceling bill notifications:', error);
  }
}

// Calculate next due date for a bill
export function calculateNextDueDate(bill: Bill): string | null {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (bill.dueDateType === 'fixed' && bill.dueDate) {
    // Fixed date bill
    const dueDate = new Date(bill.dueDate);
    if (dueDate >= today) {
      return bill.dueDate;
    }
    // If past due, calculate next occurrence based on recurrence
    if (bill.recurrence === 'monthly') {
      const nextDue = new Date(dueDate);
      while (nextDue < today) {
        nextDue.setMonth(nextDue.getMonth() + 1);
      }
      return nextDue.toISOString().split('T')[0];
    } else if (bill.recurrence === 'yearly') {
      const nextDue = new Date(dueDate);
      while (nextDue < today) {
        nextDue.setFullYear(nextDue.getFullYear() + 1);
      }
      return nextDue.toISOString().split('T')[0];
    }
    return null;
  } else if (bill.dueDateType === 'recurring' && bill.dueDay) {
    // Recurring monthly bill (e.g., every 15th of month)
    const currentMonth = new Date(today.getFullYear(), today.getMonth(), bill.dueDay);
    
    if (currentMonth >= today) {
      return currentMonth.toISOString().split('T')[0];
    } else {
      // Move to next month
      const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, bill.dueDay);
      return nextMonth.toISOString().split('T')[0];
    }
  }

  return null;
}

// Schedule notifications for bill due dates
export async function scheduleBillNotifications(bill: Bill): Promise<void> {
  initNotifications();
  
  if (!Notifications) {
    console.warn('Notifications module not available');
    return;
  }

  try {
    // Cancel existing notifications for this bill
    await cancelBillNotifications(bill.id);

    // Check if notifications are enabled
    if (bill.enableNotifications === false) {
      return;
    }

    // Calculate next due date
    const nextDueDate = calculateNextDueDate(bill);
    if (!nextDueDate) {
      return;
    }

    const dueDate = new Date(nextDueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if bill has ended
    if (bill.endDate) {
      const endDate = new Date(bill.endDate);
      if (dueDate > endDate) {
        return; // Bill has ended
      }
    }

    // Schedule notifications for days before
    if (bill.notifyDaysBefore && bill.notifyDaysBefore.length > 0) {
      for (const daysBefore of bill.notifyDaysBefore) {
        const notificationDate = new Date(dueDate);
        notificationDate.setDate(notificationDate.getDate() - daysBefore);
        notificationDate.setHours(9, 0, 0, 0); // 9 AM
        
        if (notificationDate >= today) {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: `Bill Reminder: ${bill.name}`,
              body: `Your bill "${bill.name}" of ₹${bill.amount.toFixed(2)} is due in ${daysBefore} day${daysBefore !== 1 ? 's' : ''}.`,
              data: {
                billId: bill.id,
                billName: bill.name,
                type: 'bill-reminder',
                dueDate: nextDueDate,
                daysBefore: daysBefore,
              },
              sound: true,
            },
            trigger: {
              date: notificationDate,
            },
            identifier: `bill-${bill.id}-reminder-${daysBefore}`,
          });
        }
      }
    }

    // Schedule notification on due date
    if (bill.notifyOnDueDate && dueDate >= today) {
      const notificationDate = new Date(dueDate);
      notificationDate.setHours(9, 0, 0, 0); // 9 AM
      
      if (notificationDate >= today) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: `Bill Due Today: ${bill.name}`,
            body: `Your bill "${bill.name}" of ₹${bill.amount.toFixed(2)} is due today.`,
            data: {
              billId: bill.id,
              billName: bill.name,
              type: 'bill-due',
              dueDate: nextDueDate,
            },
            sound: true,
          },
          trigger: {
            date: notificationDate,
          },
          identifier: `bill-${bill.id}-due`,
        });
      }
    }

    // Schedule overdue notification (1 day after due date)
    const overdueDate = new Date(dueDate);
    overdueDate.setDate(overdueDate.getDate() + 1);
    overdueDate.setHours(9, 0, 0, 0);
    
    if (overdueDate >= today) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `Bill Overdue: ${bill.name}`,
          body: `Your bill "${bill.name}" of ₹${bill.amount.toFixed(2)} is overdue. Please pay immediately.`,
          data: {
            billId: bill.id,
            billName: bill.name,
            type: 'bill-overdue',
            dueDate: nextDueDate,
          },
          sound: true,
        },
        trigger: {
          date: overdueDate,
        },
        identifier: `bill-${bill.id}-overdue`,
      });
    }
  } catch (error) {
    console.warn('Error scheduling bill notifications:', error);
  }
}

// Update bill status based on due date
export function updateBillStatus(bill: Bill): Bill {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (bill.status === 'cancelled' || bill.status === 'paid') {
    return bill;
  }

  const nextDueDate = calculateNextDueDate(bill);
  if (!nextDueDate) {
    return { ...bill, status: 'cancelled' };
  }

  const dueDate = new Date(nextDueDate);
  
  if (dueDate < today) {
    return { ...bill, status: 'overdue', nextDueDate };
  } else {
    return { ...bill, status: 'pending', nextDueDate };
  }
}
