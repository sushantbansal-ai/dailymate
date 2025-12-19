/**
 * Formatting utilities for consistent display across the app
 */

/**
 * Format a number as Indian Rupee currency
 * @param amount - The amount to format
 * @param options - Optional formatting options
 * @returns Formatted currency string (e.g., "₹1,23,456")
 */
export function formatCurrency(
  amount: number,
  options?: {
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
    showSymbol?: boolean;
  }
): string {
  const {
    minimumFractionDigits = 0,
    maximumFractionDigits = 2,
    showSymbol = true,
  } = options || {};

  return new Intl.NumberFormat('en-IN', {
    style: showSymbol ? 'currency' : 'decimal',
    currency: 'INR',
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(amount);
}

/**
 * Format a date string to a readable format
 * @param dateString - ISO date string or Date object
 * @param format - Format type: 'short' (day month), 'medium' (day month year), 'full' (full date with time)
 * @returns Formatted date string
 */
export function formatDate(
  dateString: string | Date,
  format: 'short' | 'medium' | 'full' = 'medium'
): string {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;

  if (isNaN(date.getTime())) {
    return 'Invalid Date';
  }

  const options: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'short',
  };

  if (format === 'medium' || format === 'full') {
    options.year = 'numeric';
  }

  if (format === 'full') {
    options.hour = '2-digit';
    options.minute = '2-digit';
  }

  return date.toLocaleDateString('en-IN', options);
}

/**
 * Format a date for input fields (YYYY-MM-DD)
 * @param date - Date object or date string
 * @returns Formatted date string in YYYY-MM-DD format
 */
export function formatDateForInput(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) {
    return '';
  }

  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

/**
 * Parse a date string from input format (YYYY-MM-DD)
 * @param dateString - Date string in YYYY-MM-DD format
 * @returns Date object or null if invalid
 */
export function parseDateFromInput(dateString: string): Date | null {
  if (!dateString || dateString.length !== 10) {
    return null;
  }

  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return null;
  }

  return date;
}
