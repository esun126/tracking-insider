'use client';

import { TrendingUp, TrendingDown, Users, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface SummaryCardsProps {
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
    sentiment: 'Bullish' | 'Bearish' | 'Neutral';
  };
  days: number;
}

export function SummaryCards({ summary, days }: SummaryCardsProps) {
  const getSentimentIcon = () => {
    switch (summary.sentiment) {
      case 'Bullish':
        return <TrendingUp className="w-6 h-6" />;
      case 'Bearish':
        return <TrendingDown className="w-6 h-6" />;
      default:
        return <Minus className="w-6 h-6" />;
    }
  };

  const getSentimentColor = () => {
    switch (summary.sentiment) {
      case 'Bullish':
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
      case 'Bearish':
        return 'text-rose-400 bg-rose-500/10 border-rose-500/30';
      default:
        return 'text-slate-400 bg-slate-500/10 border-slate-500/30';
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Sentiment Card */}
      <div className={`p-5 rounded-2xl border backdrop-blur-xl ${getSentimentColor()}`}>
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium opacity-80">Sentiment ({days}d)</span>
          {getSentimentIcon()}
        </div>
        <div className="text-2xl font-bold">{summary.sentiment}</div>
        <div className="mt-2 text-sm opacity-70">
          Based on {summary.totalTransactions} transactions
        </div>
      </div>

      {/* Net Value Card */}
      <div className="p-5 rounded-2xl bg-slate-800/50 border border-slate-700/50 backdrop-blur-xl">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-slate-400">Net Flow</span>
          {summary.netValue >= 0 ? (
            <ArrowUpRight className="w-5 h-5 text-emerald-400" />
          ) : (
            <ArrowDownRight className="w-5 h-5 text-rose-400" />
          )}
        </div>
        <div className={`text-2xl font-bold ${summary.netValue >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
          {formatCurrency(summary.netValue)}
        </div>
        <div className="mt-2 flex gap-4 text-sm">
          <span className="text-emerald-400">
            +{formatCurrency(summary.totalBuyValue)}
          </span>
          <span className="text-rose-400">
            -{formatCurrency(summary.totalSellValue)}
          </span>
        </div>
      </div>

      {/* Transactions Card */}
      <div className="p-5 rounded-2xl bg-slate-800/50 border border-slate-700/50 backdrop-blur-xl">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-slate-400">Transactions</span>
          <div className="text-xs px-2 py-1 rounded-full bg-slate-700 text-slate-300">
            {days}d
          </div>
        </div>
        <div className="text-2xl font-bold text-white">
          {summary.totalTransactions}
        </div>
        <div className="mt-2 flex gap-4 text-sm">
          <span className="text-emerald-400 flex items-center gap-1">
            <ArrowUpRight className="w-3 h-3" />
            {summary.buyTransactions} buys
          </span>
          <span className="text-rose-400 flex items-center gap-1">
            <ArrowDownRight className="w-3 h-3" />
            {summary.sellTransactions} sells
          </span>
        </div>
      </div>

      {/* Active Insiders Card */}
      <div className="p-5 rounded-2xl bg-slate-800/50 border border-slate-700/50 backdrop-blur-xl">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-slate-400">Active Insiders</span>
          <Users className="w-5 h-5 text-violet-400" />
        </div>
        <div className="text-2xl font-bold text-white">
          {summary.activeInsiders}
        </div>
        <div className="mt-2 flex gap-4 text-sm">
          <span className="text-emerald-400">
            {summary.insidersBuying} buying
          </span>
          <span className="text-rose-400">
            {summary.insidersSelling} selling
          </span>
        </div>
      </div>
    </div>
  );
}
