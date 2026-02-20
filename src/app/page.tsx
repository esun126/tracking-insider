'use client';

import { useState } from 'react';
import { Loader2, RefreshCw, Building2, TrendingUp } from 'lucide-react';
import { SearchBar, SummaryCards, TransactionTable, InsiderBreakdown, InsiderList } from '@/components';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Company, InsiderTransaction } from '@/types';

interface InsiderData {
  company: Company;
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
  transactions: InsiderTransaction[];
  byInsider: Record<string, {
    name: string;
    title: string;
    transactions: InsiderTransaction[];
    netShares: number;
    netValue: number;
    lastTradeDate: string;
  }>;
  period: {
    days: number;
    startDate: string;
    endDate: string;
  };
}

export default function Home() {
  const [data, setData] = useState<InsiderData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState(90);

  const fetchData = async (ticker: string, periodDays: number = days) => {
    setLoading(true);
    setError(null);
    
    try {
      const res = await fetch(`/api/insider/${ticker}?days=${periodDays}`);
      
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to fetch data');
      }
      
      const result = await res.json();
      setData(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'An error occurred');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleCompanySelect = (company: Company) => {
    fetchData(company.ticker);
  };

  const handleDaysChange = (newDays: number) => {
    setDays(newDays);
    if (data?.company) {
      fetchData(data.company.ticker, newDays);
    }
  };

  return (
    <div className="min-h-screen bg-bg-base text-text-primary">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative border-b border-border-subtle backdrop-blur-xl bg-bg-base/50">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-cyan-500 shadow-lg shadow-violet-500/25">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-text-primary to-text-muted bg-clip-text text-transparent">
                  Insider Trading Tracker
                </h1>
                <p className="text-sm text-text-faint">
                  Track SEC Form 4 filings in real-time
                </p>
              </div>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative max-w-7xl mx-auto px-6 py-8">
        {/* Search Section */}
        <section className="mb-12">
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-text-primary via-text-secondary to-text-muted bg-clip-text text-transparent">
              Discover Insider Activity
            </h2>
            <p className="text-text-muted max-w-2xl mx-auto">
              Search any US publicly traded company to view insider buying and selling patterns
            </p>
          </div>
          <SearchBar onSelect={handleCompanySelect} isLoading={loading} />
        </section>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-12 h-12 text-violet-500 animate-spin mb-4" />
            <p className="text-text-muted">Fetching insider trading data...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-6 text-center">
            <p className="text-rose-400">{error}</p>
            <p className="text-sm text-text-faint mt-2">
              Please check the ticker symbol and try again
            </p>
          </div>
        )}

        {/* Data Display */}
        {data && !loading && (
          <div className="space-y-8">
            {/* Company Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-bg-surface/50 rounded-2xl border border-border-strong/50">
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-bg-elevated border border-border-strong">
                  <Building2 className="w-7 h-7 text-text-secondary" />
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold text-cyan-400 font-mono">
                      {data.company.ticker}
                    </span>
                    <span className="px-2 py-0.5 text-xs bg-bg-elevated text-text-muted rounded-lg">
                      CIK: {data.company.cik}
                    </span>
                  </div>
                  <h2 className="text-lg text-text-secondary">{data.company.name}</h2>
                </div>
              </div>

              {/* Period Selector & Refresh */}
              <div className="flex items-center gap-3">
                <select
                  value={days}
                  onChange={(e) => handleDaysChange(Number(e.target.value))}
                  className="px-4 py-2 bg-bg-elevated border border-border-strong rounded-xl text-text-primary focus:outline-none focus:border-violet-500 transition-colors"
                >
                  <option value={30}>Last 30 days</option>
                  <option value={90}>Last 90 days</option>
                  <option value={180}>Last 180 days</option>
                  <option value={365}>Last 1 year</option>
                </select>
                <button
                  onClick={() => fetchData(data.company.ticker)}
                  className="p-2.5 bg-bg-elevated border border-border-strong rounded-xl hover:bg-bg-muted hover:border-border-strong transition-all"
                >
                  <RefreshCw className="w-5 h-5 text-text-muted" />
                </button>
              </div>
            </div>

            {/* Summary Cards */}
            <SummaryCards summary={data.summary} days={days} />

            {/* Insider List */}
            <InsiderList byInsider={data.byInsider} />

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Transaction Table - 2 columns */}
              <div className="lg:col-span-2">
                <TransactionTable transactions={data.transactions} />
              </div>

              {/* Insider Breakdown - 1 column */}
              <div className="lg:col-span-1">
                <InsiderBreakdown byInsider={data.byInsider} />
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!data && !loading && !error && (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-bg-surface/50 border border-border-strong/50 mb-6">
              <TrendingUp className="w-10 h-10 text-text-faint" />
            </div>
            <h3 className="text-xl font-semibold text-text-muted mb-2">
              Search for a company to get started
            </h3>
            <p className="text-text-faint max-w-md mx-auto">
              Enter a stock ticker symbol like AAPL, TSLA, or MSFT, or search by company name
            </p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="relative border-t border-border-subtle mt-20">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-text-faint text-sm">
              Data sourced from SEC EDGAR and OpenInsider
            </p>
            <div className="flex items-center gap-6 text-sm text-text-faint">
              <a href="https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&type=4" target="_blank" rel="noopener noreferrer" className="hover:text-text-primary transition-colors">
                SEC EDGAR
              </a>
              <a href="http://openinsider.com" target="_blank" rel="noopener noreferrer" className="hover:text-text-primary transition-colors">
                OpenInsider
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
