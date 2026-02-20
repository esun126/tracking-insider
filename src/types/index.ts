// Company information
export interface Company {
  ticker: string;
  name: string;
  cik: string;
  sector?: string;
  industry?: string;
}

// Insider information
export interface Insider {
  name: string;
  title: string;
  relationship: string[];
  totalShares?: number;
  lastTradeDate?: string;
}

// Transaction types
export type TransactionType = 
  | 'P'   // Purchase
  | 'S'   // Sale
  | 'A'   // Grant/Award
  | 'D'   // Sale to Issuer
  | 'F'   // Tax Payment
  | 'M'   // Option Exercise
  | 'G'   // Gift
  | 'W'   // Inherited
  | 'C'   // Conversion
  | 'X';  // Option Exercise and Sale

// Individual transaction record
export interface InsiderTransaction {
  id: string;
  filingDate: string;
  tradeDate: string;
  ticker: string;
  insiderName: string;
  insiderTitle: string;
  transactionType: TransactionType;
  transactionCode: string;
  shares: number;
  pricePerShare: number;
  totalValue: number;
  sharesOwnedAfter: number;
  ownershipChangePercent: number;
  directOrIndirect: 'D' | 'I';
  is10b51Plan: boolean;
  secFilingUrl: string;
}

// Summary statistics
export interface InsiderTradingSummary {
  company: Company;
  period: {
    startDate: string;
    endDate: string;
    days: number;
  };
  totalTransactions: number;
  buyTransactions: number;
  sellTransactions: number;
  totalBuyValue: number;
  totalSellValue: number;
  netValue: number;
  activeInsiders: number;
  insidersBuying: number;
  insidersSelling: number;
  buyToSellRatio: number;
  sentiment: 'Bullish' | 'Bearish' | 'Neutral';
  transactions: InsiderTransaction[];
  byInsider: Record<string, {
    info: Insider;
    transactions: InsiderTransaction[];
    netShares: number;
    netValue: number;
  }>;
}

// API response types
export interface SearchResult {
  companies: Company[];
}

export interface InsiderTradingResponse {
  summary: InsiderTradingSummary;
  transactions: InsiderTransaction[];
}

// Transaction type labels
export const TRANSACTION_TYPE_LABELS: Record<string, string> = {
  'P': 'Purchase',
  'S': 'Sale',
  'A': 'Grant/Award',
  'D': 'Sale to Issuer',
  'F': 'Tax Payment',
  'M': 'Option Exercise',
  'G': 'Gift',
  'W': 'Inherited',
  'C': 'Conversion',
  'X': 'Option Ex & Sale',
};

// Sentiment colors
export const SENTIMENT_COLORS = {
  Bullish: '#22c55e',
  Bearish: '#ef4444',
  Neutral: '#6b7280',
};
