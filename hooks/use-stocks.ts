/**
 * Hook for fetching and managing stock prices
 */

import { calculateStockValue, fetchStockPrice, StockQuote } from '@/services/stocks';
import { Account } from '@/types';
import { useCallback, useEffect, useState } from 'react';

export interface StockAccountData {
  quote?: StockQuote;
  currentValue: number;
  totalCost: number;
  gainLoss: number;
  gainLossPercent: number;
  loading: boolean;
  error?: string;
}

export function useStocks(accounts: Account[]) {
  const [stockData, setStockData] = useState<Record<string, StockAccountData>>({});
  const [loading, setLoading] = useState(false);

  const fetchStockData = useCallback(async (account: Account) => {
    if (account.type !== 'Stocks' || !account.details?.stockSymbol) {
      return;
    }

    const accountKey = account.id;
    
    // Set loading state
    setStockData((prev) => ({
      ...prev,
      [accountKey]: { ...prev[accountKey], loading: true },
    }));

    try {
      const response = await fetchStockPrice(
        account.details.stockSymbol,
        account.details.stockExchange
      );

      if (response.success && response.data && account.details.stockQuantity && account.details.stockPurchasePrice) {
        const { currentValue, totalCost, gainLoss, gainLossPercent } = calculateStockValue(
          account.details.stockQuantity,
          account.details.stockPurchasePrice,
          response.data.price
        );

        setStockData((prev) => ({
          ...prev,
          [accountKey]: {
            quote: response.data,
            currentValue,
            totalCost,
            gainLoss,
            gainLossPercent,
            loading: false,
          },
        }));
      } else {
        setStockData((prev) => ({
          ...prev,
          [accountKey]: {
            ...prev[accountKey],
            loading: false,
            error: response.error || 'Failed to fetch stock price',
          },
        }));
      }
    } catch (error: any) {
      setStockData((prev) => ({
        ...prev,
        [accountKey]: {
          ...prev[accountKey],
          loading: false,
          error: error.message || 'Failed to fetch stock price',
        },
      }));
    }
  }, []);

  const refreshAllStocks = useCallback(async () => {
    const stockAccounts = accounts.filter((acc) => acc.type === 'Stocks' && acc.details?.stockSymbol);
    
    if (stockAccounts.length === 0) {
      return;
    }

    setLoading(true);
    
    // Fetch all stock prices in parallel
    await Promise.all(stockAccounts.map((account) => fetchStockData(account)));
    
    setLoading(false);
  }, [accounts, fetchStockData]);

  // Auto-fetch stock prices when accounts change
  useEffect(() => {
    refreshAllStocks();
  }, [refreshAllStocks]);

  const getStockData = useCallback(
    (accountId: string): StockAccountData | undefined => {
      return stockData[accountId];
    },
    [stockData]
  );

  const getStockBalance = useCallback(
    (account: Account): number => {
      if (account.type !== 'Stocks') {
        return account.balance;
      }

      const data = stockData[account.id];
      if (data?.currentValue !== undefined) {
        return data.currentValue;
      }

      // Fallback to stored balance if stock data not available
      return account.balance;
    },
    [stockData]
  );

  return {
    stockData,
    loading,
    refreshAllStocks,
    fetchStockData,
    getStockData,
    getStockBalance,
  };
}
