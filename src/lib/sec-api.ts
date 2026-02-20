import axios from 'axios';
import * as cheerio from 'cheerio';
import { Company, InsiderTransaction, TransactionType } from '@/types';

const SEC_USER_AGENT = 'InsiderTracker contact@example.com';
const COMPANY_TICKERS_URL = 'https://www.sec.gov/files/company_tickers.json';

// Constants for parsing OpenInsider table
const TABLE_CELL_INDICES = {
  FILING_DATE: 1,
  TRADE_DATE: 2,
  TICKER: 3,
  INSIDER_NAME: 4,
  TITLE: 5,
  TRADE_TYPE: 6,
  PRICE: 7,
  QUANTITY: 8,
  OWNED: 9,
  CHANGE: 10,
  VALUE: 11,
  MIN_COLUMNS: 12,
} as const;

// Constants for sentiment analysis
const SENTIMENT_THRESHOLDS = {
  BULLISH_RATIO: 1.5,
  BEARISH_RATIO: 0.5,
  BULLISH_NET_VALUE: 500000,
  BEARISH_NET_VALUE: -500000,
} as const;

const SEARCH_RESULT_LIMIT = 10;

interface CompanyTicker {
  cik_str: number;
  ticker: string;
  title: string;
}

// Cache for company tickers
let tickerCache: Map<string, CompanyTicker> | null = null;
let nameCache: Map<string, CompanyTicker> | null = null;

// Load and cache ticker mapping
export async function loadTickerMap(): Promise<{
  byTicker: Map<string, CompanyTicker>;
  byName: Map<string, CompanyTicker>;
}> {
  if (tickerCache && nameCache) {
    return { byTicker: tickerCache, byName: nameCache };
  }

  const response = await axios.get(COMPANY_TICKERS_URL, {
    headers: { 'User-Agent': SEC_USER_AGENT },
  });

  tickerCache = new Map();
  nameCache = new Map();
  const data = response.data as Record<string, CompanyTicker>;

  for (const key of Object.keys(data)) {
    const company = data[key];
    tickerCache.set(company.ticker.toUpperCase(), company);
    nameCache.set(company.title.toLowerCase(), company);
  }

  return { byTicker: tickerCache, byName: nameCache };
}

// Search companies by ticker or name
export async function searchCompanies(query: string): Promise<Company[]> {
  const { byTicker, byName } = await loadTickerMap();
  const results: Company[] = [];
  const queryUpper = query.toUpperCase();
  const queryLower = query.toLowerCase();

  // Exact ticker match
  if (byTicker.has(queryUpper)) {
    const company = byTicker.get(queryUpper)!;
    results.push({
      ticker: company.ticker,
      name: company.title,
      cik: company.cik_str.toString().padStart(10, '0'),
    });
  }

  // Fuzzy name search
  for (const [name, company] of byName.entries()) {
    if (name.includes(queryLower) && !results.some(r => r.ticker === company.ticker)) {
      results.push({
        ticker: company.ticker,
        name: company.title,
        cik: company.cik_str.toString().padStart(10, '0'),
      });
    }
    if (results.length >= SEARCH_RESULT_LIMIT) break;
  }

  // Fuzzy ticker search
  for (const [ticker, company] of byTicker.entries()) {
    if (ticker.includes(queryUpper) && !results.some(r => r.ticker === company.ticker)) {
      results.push({
        ticker: company.ticker,
        name: company.title,
        cik: company.cik_str.toString().padStart(10, '0'),
      });
    }
    if (results.length >= SEARCH_RESULT_LIMIT) break;
  }

  return results.slice(0, SEARCH_RESULT_LIMIT);
}

// Get company by ticker
export async function getCompanyByTicker(ticker: string): Promise<Company | null> {
  const { byTicker } = await loadTickerMap();
  const company = byTicker.get(ticker.toUpperCase());

  if (!company) return null;

  return {
    ticker: company.ticker,
    name: company.title,
    cik: company.cik_str.toString().padStart(10, '0'),
  };
}

// Helper functions for parsing table cells
function parseNumericValue(text: string): number {
  const cleaned = text.replace(/[$,+\-]/g, '');
  return parseFloat(cleaned) || 0;
}

function parseIntegerValue(text: string): number {
  const cleaned = text.replace(/[,+]/g, '');
  return parseInt(cleaned) || 0;
}

function parseTransactionType(tradeTypeRaw: string): TransactionType {
  return tradeTypeRaw.split(' ')[0].charAt(0) as TransactionType;
}

function parseSecUrl(href: string | undefined): string {
  if (!href) return '';
  return href.startsWith('http') ? href : `https://www.sec.gov${href}`;
}

function calculateSignedValue(value: number, tradeType: TransactionType): number {
  return (tradeType === 'S' || tradeType === 'F') ? -value : value;
}

function parseTableRow(
  row: cheerio.Element,
  $: cheerio.Root,
  ticker: string,
  index: number
): InsiderTransaction | null {
  const cells = $(row).find('td');

  if (cells.length < TABLE_CELL_INDICES.MIN_COLUMNS) {
    return null;
  }

  try {
    // Extract cell data using constants
    const filingDateCell = $(cells[TABLE_CELL_INDICES.FILING_DATE]);
    const filingDate = filingDateCell.text().trim().split(' ')[0];
    const secUrl = parseSecUrl(filingDateCell.find('a').attr('href'));

    const tradeDate = $(cells[TABLE_CELL_INDICES.TRADE_DATE]).text().trim();
    const tickerText = $(cells[TABLE_CELL_INDICES.TICKER]).text().trim();
    const insiderName = $(cells[TABLE_CELL_INDICES.INSIDER_NAME]).text().trim();
    const title = $(cells[TABLE_CELL_INDICES.TITLE]).text().trim();
    const tradeTypeRaw = $(cells[TABLE_CELL_INDICES.TRADE_TYPE]).text().trim();

    // Parse transaction type
    const tradeType = parseTransactionType(tradeTypeRaw);

    // Parse numeric values
    const price = parseNumericValue($(cells[TABLE_CELL_INDICES.PRICE]).text().trim());
    const qty = parseIntegerValue($(cells[TABLE_CELL_INDICES.QUANTITY]).text().trim());
    const owned = parseIntegerValue($(cells[TABLE_CELL_INDICES.OWNED]).text().trim());
    const change = parseNumericValue($(cells[TABLE_CELL_INDICES.CHANGE]).text().trim().replace('%', ''));

    // Parse and sign the value based on transaction type
    const value = parseNumericValue($(cells[TABLE_CELL_INDICES.VALUE]).text().trim());
    const signedValue = calculateSignedValue(value, tradeType);
    const signedShares = calculateSignedValue(Math.abs(qty), tradeType);

    // Validate required fields
    if (!insiderName || !tradeDate) {
      return null;
    }

    return {
      id: `${tickerText}-${filingDate}-${index}`,
      filingDate,
      tradeDate,
      ticker: tickerText || ticker.toUpperCase(),
      insiderName,
      insiderTitle: title,
      transactionType: tradeType,
      transactionCode: tradeTypeRaw,
      shares: signedShares,
      pricePerShare: price,
      totalValue: signedValue,
      sharesOwnedAfter: owned,
      ownershipChangePercent: change,
      directOrIndirect: 'D',
      is10b51Plan: false,
      secFilingUrl: secUrl,
    };
  } catch (e) {
    console.error('Error parsing row:', e);
    return null;
  }
}

// Fetch insider transactions from OpenInsider
export async function fetchInsiderTransactions(
  ticker: string
): Promise<InsiderTransaction[]> {
  const url = `http://openinsider.com/${ticker.toUpperCase()}`;

  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      timeout: 15000,
    });

    const $ = cheerio.load(response.data);
    const transactions: InsiderTransaction[] = [];

    // Parse each row in the main table
    $('table.tinytable tbody tr').each((index, row) => {
      const transaction = parseTableRow(row, $, ticker, index);
      if (transaction) {
        transactions.push(transaction);
      }
    });

    return transactions;
  } catch (error) {
    console.error('Error fetching from OpenInsider:', error);
    throw new Error('Failed to fetch insider trading data');
  }
}

// Helper functions for summary calculation
function filterTransactionsByDateRange(
  transactions: InsiderTransaction[],
  days: number
): InsiderTransaction[] {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  return transactions.filter(t => {
    const tradeDate = new Date(t.tradeDate);
    return tradeDate >= cutoffDate;
  });
}

function separateTransactionsByType(transactions: InsiderTransaction[]) {
  const buyTransactions = transactions.filter(t => t.transactionType === 'P');
  const sellTransactions = transactions.filter(t =>
    t.transactionType === 'S' || t.transactionType === 'F'
  );

  return { buyTransactions, sellTransactions };
}

function calculateTransactionValues(
  buyTransactions: InsiderTransaction[],
  sellTransactions: InsiderTransaction[]
) {
  const totalBuyValue = buyTransactions.reduce(
    (sum, t) => sum + Math.abs(t.totalValue),
    0
  );
  const totalSellValue = sellTransactions.reduce(
    (sum, t) => sum + Math.abs(t.totalValue),
    0
  );

  return { totalBuyValue, totalSellValue };
}

function groupTransactionsByInsider(transactions: InsiderTransaction[]) {
  const byInsider: Record<string, {
    name: string;
    title: string;
    transactions: InsiderTransaction[];
    netShares: number;
    netValue: number;
    lastTradeDate: string;
  }> = {};

  const insidersSet = new Set<string>();
  const buyersSet = new Set<string>();
  const sellersSet = new Set<string>();

  for (const transaction of transactions) {
    const { insiderName, transactionType, shares, totalValue, insiderTitle } = transaction;

    insidersSet.add(insiderName);

    // Track buyers and sellers
    if (transactionType === 'P') {
      buyersSet.add(insiderName);
    } else if (transactionType === 'S' || transactionType === 'F') {
      sellersSet.add(insiderName);
    }

    // Initialize insider record if needed
    if (!byInsider[insiderName]) {
      byInsider[insiderName] = {
        name: insiderName,
        title: insiderTitle,
        transactions: [],
        netShares: 0,
        netValue: 0,
        lastTradeDate: transaction.tradeDate,
      };
    }

    // Accumulate data
    byInsider[insiderName].transactions.push(transaction);
    byInsider[insiderName].netShares += shares;
    byInsider[insiderName].netValue += totalValue;

    // Track the most recent trade date
    if (transaction.tradeDate > (byInsider[insiderName].lastTradeDate ?? '')) {
      byInsider[insiderName].lastTradeDate = transaction.tradeDate;
    }
  }

  return {
    byInsider,
    insidersCount: insidersSet.size,
    buyersCount: buyersSet.size,
    sellersCount: sellersSet.size,
  };
}

function calculateSentiment(
  buyCount: number,
  sellCount: number,
  netValue: number
): 'Bullish' | 'Bearish' | 'Neutral' {
  const ratio = buyCount / (sellCount || 1);

  if (ratio > SENTIMENT_THRESHOLDS.BULLISH_RATIO ||
      netValue > SENTIMENT_THRESHOLDS.BULLISH_NET_VALUE) {
    return 'Bullish';
  }

  if (ratio < SENTIMENT_THRESHOLDS.BEARISH_RATIO ||
      netValue < SENTIMENT_THRESHOLDS.BEARISH_NET_VALUE) {
    return 'Bearish';
  }

  return 'Neutral';
}

// Calculate summary statistics
export function calculateSummary(
  company: Company,
  transactions: InsiderTransaction[],
  days: number = 90
): {
  summary: {
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
  };
  byInsider: Record<string, {
    name: string;
    title: string;
    transactions: InsiderTransaction[];
    netShares: number;
    netValue: number;
    lastTradeDate: string;
  }>;
} {
  // Filter transactions by date range
  const filteredTransactions = filterTransactionsByDateRange(transactions, days);

  // Separate buy and sell transactions
  const { buyTransactions, sellTransactions } = separateTransactionsByType(filteredTransactions);

  // Calculate transaction values
  const { totalBuyValue, totalSellValue } = calculateTransactionValues(
    buyTransactions,
    sellTransactions
  );

  // Group transactions by insider
  const {
    byInsider,
    insidersCount,
    buyersCount,
    sellersCount,
  } = groupTransactionsByInsider(filteredTransactions);

  // Calculate metrics
  const netValue = totalBuyValue - totalSellValue;
  const buyToSellRatio = buyTransactions.length / (sellTransactions.length || 1);
  const sentiment = calculateSentiment(buyTransactions.length, sellTransactions.length, netValue);

  return {
    summary: {
      totalTransactions: filteredTransactions.length,
      buyTransactions: buyTransactions.length,
      sellTransactions: sellTransactions.length,
      totalBuyValue,
      totalSellValue,
      netValue,
      activeInsiders: insidersCount,
      insidersBuying: buyersCount,
      insidersSelling: sellersCount,
      buyToSellRatio,
      sentiment,
    },
    byInsider,
  };
}
