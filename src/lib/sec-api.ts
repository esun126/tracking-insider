import axios from 'axios';
import * as cheerio from 'cheerio';
import { Company, InsiderTransaction, TransactionType } from '@/types';

const SEC_USER_AGENT = 'InsiderTracker contact@example.com';
const COMPANY_TICKERS_URL = 'https://www.sec.gov/files/company_tickers.json';

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
    if (results.length >= 10) break;
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
    if (results.length >= 10) break;
  }

  return results.slice(0, 10);
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

    // Parse the main table
    $('table.tinytable tbody tr').each((index, row) => {
      const cells = $(row).find('td');
      
      if (cells.length < 12) return;

      try {
        const filingDateCell = $(cells[1]);
        const filingDate = filingDateCell.text().trim().split(' ')[0];
        const secUrl = filingDateCell.find('a').attr('href') || '';
        
        const tradeDate = $(cells[2]).text().trim();
        const tickerText = $(cells[3]).text().trim();
        const insiderName = $(cells[4]).text().trim();
        const title = $(cells[5]).text().trim();
        const tradeTypeRaw = $(cells[6]).text().trim();
        
        // Parse trade type
        const tradeType = tradeTypeRaw.split(' ')[0].charAt(0) as TransactionType;
        
        // Parse price
        const priceText = $(cells[7]).text().trim().replace('$', '').replace(',', '');
        const price = parseFloat(priceText) || 0;
        
        // Parse quantity
        const qtyText = $(cells[8]).text().trim().replace(',', '').replace('+', '');
        const qty = parseInt(qtyText) || 0;
        
        // Parse owned shares
        const ownedText = $(cells[9]).text().trim().replace(',', '');
        const owned = parseInt(ownedText) || 0;
        
        // Parse ownership change
        const changeText = $(cells[10]).text().trim().replace('%', '').replace('+', '');
        const change = parseFloat(changeText) || 0;
        
        // Parse value
        const valueText = $(cells[11]).text().trim().replace('$', '').replace(',', '').replace('+', '').replace('-', '');
        const value = parseFloat(valueText) || 0;
        const signedValue = tradeType === 'S' || tradeType === 'F' ? -value : value;

        if (insiderName && tradeDate) {
          transactions.push({
            id: `${tickerText}-${filingDate}-${index}`,
            filingDate,
            tradeDate,
            ticker: tickerText || ticker.toUpperCase(),
            insiderName,
            insiderTitle: title,
            transactionType: tradeType,
            transactionCode: tradeTypeRaw,
            shares: tradeType === 'S' || tradeType === 'F' ? -Math.abs(qty) : Math.abs(qty),
            pricePerShare: price,
            totalValue: signedValue,
            sharesOwnedAfter: owned,
            ownershipChangePercent: change,
            directOrIndirect: 'D',
            is10b51Plan: false,
            secFilingUrl: secUrl.startsWith('http') ? secUrl : `https://www.sec.gov${secUrl}`,
          });
        }
      } catch (e) {
        // Skip malformed rows
        console.error('Error parsing row:', e);
      }
    });

    return transactions;
  } catch (error) {
    console.error('Error fetching from OpenInsider:', error);
    throw new Error('Failed to fetch insider trading data');
  }
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
  }>;
} {
  // Filter by date range
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  const filtered = transactions.filter(t => {
    const tradeDate = new Date(t.tradeDate);
    return tradeDate >= cutoffDate;
  });

  // Calculate basic stats
  const buyTx = filtered.filter(t => t.transactionType === 'P');
  const sellTx = filtered.filter(t => t.transactionType === 'S' || t.transactionType === 'F');
  
  const totalBuyValue = buyTx.reduce((sum, t) => sum + Math.abs(t.totalValue), 0);
  const totalSellValue = sellTx.reduce((sum, t) => sum + Math.abs(t.totalValue), 0);
  
  // Group by insider
  const byInsider: Record<string, {
    name: string;
    title: string;
    transactions: InsiderTransaction[];
    netShares: number;
    netValue: number;
  }> = {};

  const insidersSet = new Set<string>();
  const buyersSet = new Set<string>();
  const sellersSet = new Set<string>();

  for (const t of filtered) {
    insidersSet.add(t.insiderName);
    
    if (t.transactionType === 'P') {
      buyersSet.add(t.insiderName);
    } else if (t.transactionType === 'S' || t.transactionType === 'F') {
      sellersSet.add(t.insiderName);
    }

    if (!byInsider[t.insiderName]) {
      byInsider[t.insiderName] = {
        name: t.insiderName,
        title: t.insiderTitle,
        transactions: [],
        netShares: 0,
        netValue: 0,
      };
    }
    
    byInsider[t.insiderName].transactions.push(t);
    byInsider[t.insiderName].netShares += t.shares;
    byInsider[t.insiderName].netValue += t.totalValue;
  }

  // Calculate sentiment
  const netValue = totalBuyValue - totalSellValue;
  const ratio = buyTx.length / (sellTx.length || 1);
  
  let sentiment: 'Bullish' | 'Bearish' | 'Neutral' = 'Neutral';
  if (ratio > 1.5 || netValue > 500000) {
    sentiment = 'Bullish';
  } else if (ratio < 0.5 || netValue < -500000) {
    sentiment = 'Bearish';
  }

  return {
    summary: {
      totalTransactions: filtered.length,
      buyTransactions: buyTx.length,
      sellTransactions: sellTx.length,
      totalBuyValue,
      totalSellValue,
      netValue,
      activeInsiders: insidersSet.size,
      insidersBuying: buyersSet.size,
      insidersSelling: sellersSet.size,
      buyToSellRatio: ratio,
      sentiment,
    },
    byInsider,
  };
}
