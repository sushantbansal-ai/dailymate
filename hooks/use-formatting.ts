/**
 * Custom hook for formatting utilities
 * Provides consistent formatting functions throughout the app
 */

import { formatCurrency, formatDate, formatDateForInput, parseDateFromInput } from '@/utils/formatters';

export function useFormatting() {
  return {
    formatCurrency,
    formatDate,
    formatDateForInput,
    parseDateFromInput,
  };
}
