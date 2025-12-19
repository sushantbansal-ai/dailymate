/**
 * Stocks Service
 * Fetches stock prices from Yahoo Finance API
 * Note: Google Finance API is deprecated, using Yahoo Finance as alternative
 */

export interface StockQuote {
  symbol: string;
  exchange: string;
  price: number;
  change: number;
  changePercent: number;
  currency: string;
  name?: string;
}

export interface StockPriceResponse {
  success: boolean;
  data?: StockQuote;
  error?: string;
}

/**
 * Convert stock symbol to Yahoo Finance format
 * For Indian stocks: RELIANCE.NS, TCS.NS, etc.
 * For US stocks: AAPL, GOOGL, etc.
 */
function formatSymbolForYahoo(symbol: string, exchange?: string): string {
  const upperSymbol = symbol.toUpperCase();
  
  // Indian exchanges
  if (exchange === 'NSE' || exchange === 'BSE') {
    return `${upperSymbol}.NS`; // NSE stocks use .NS suffix
  }
  
  // If exchange is not specified, assume it's already formatted or US stock
  // Check if it already has a suffix
  if (upperSymbol.includes('.')) {
    return upperSymbol;
  }
  
  // Default to US market
  return upperSymbol;
}

/**
 * Fetch stock price from Yahoo Finance API
 * Uses the yahoo-finance API endpoint (public, no API key required)
 */
export async function fetchStockPrice(
  symbol: string,
  exchange?: string
): Promise<StockPriceResponse> {
  try {
    const formattedSymbol = formatSymbolForYahoo(symbol, exchange);
    
    // Using Yahoo Finance API (free, no API key required)
    // Alternative endpoint: https://query1.finance.yahoo.com/v8/finance/chart/{symbol}
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${formattedSymbol}?interval=1d&range=1d`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch stock price: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data.chart || !data.chart.result || data.chart.result.length === 0) {
      throw new Error('Invalid stock symbol or data not available');
    }
    
    const result = data.chart.result[0];
    const meta = result.meta;
    const quote = result.indicators?.quote?.[0];
    
    if (!meta || !quote) {
      throw new Error('Stock data format error');
    }
    
    const currentPrice = meta.regularMarketPrice || meta.previousClose || 0;
    const previousClose = meta.previousClose || currentPrice;
    const change = currentPrice - previousClose;
    const changePercent = previousClose !== 0 ? (change / previousClose) * 100 : 0;
    
    return {
      success: true,
      data: {
        symbol: meta.symbol || formattedSymbol,
        exchange: exchange || 'Unknown',
        price: currentPrice,
        change: change,
        changePercent: changePercent,
        currency: meta.currency || 'USD',
        name: meta.longName || meta.shortName || symbol,
      },
    };
  } catch (error: any) {
    console.error('Error fetching stock price:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch stock price',
    };
  }
}

/**
 * Fetch multiple stock prices at once
 */
export async function fetchMultipleStockPrices(
  symbols: Array<{ symbol: string; exchange?: string }>
): Promise<Record<string, StockPriceResponse>> {
  const results: Record<string, StockPriceResponse> = {};
  
  // Fetch all prices in parallel
  const promises = symbols.map(async ({ symbol, exchange }) => {
    const result = await fetchStockPrice(symbol, exchange);
    const key = exchange ? `${symbol}.${exchange}` : symbol;
    results[key] = result;
  });
  
  await Promise.all(promises);
  return results;
}

/**
 * Calculate current value of stock holdings
 */
export function calculateStockValue(
  quantity: number,
  purchasePrice: number,
  currentPrice: number
): {
  currentValue: number;
  totalCost: number;
  gainLoss: number;
  gainLossPercent: number;
} {
  const totalCost = quantity * purchasePrice;
  const currentValue = quantity * currentPrice;
  const gainLoss = currentValue - totalCost;
  const gainLossPercent = totalCost !== 0 ? (gainLoss / totalCost) * 100 : 0;
  
  return {
    currentValue,
    totalCost,
    gainLoss,
    gainLossPercent,
  };
}
