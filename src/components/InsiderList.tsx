'use client';

import { useState } from 'react';
import { Users, ArrowUpDown, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface InsiderRecord {
  name: string;
  title: string;
  transactions: { tradeDate: string }[];
  netShares: number;
  netValue: number;
  lastTradeDate: string;
}

interface InsiderListProps {
  byInsider: Record<string, InsiderRecord>;
}

type SortKey = 'name' | 'netValue' | 'transactions' | 'lastTradeDate';
type SortDir = 'asc' | 'desc';

function formatCurrency(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) {
    return `${value < 0 ? '-' : ''}$${(abs / 1_000_000).toFixed(2)}M`;
  }
  if (abs >= 1_000) {
    return `${value < 0 ? '-' : ''}$${(abs / 1_000).toFixed(1)}K`;
  }
  return `${value < 0 ? '-' : ''}$${abs.toFixed(0)}`;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function InsiderList({ byInsider }: InsiderListProps) {
  const [sortKey, setSortKey] = useState<SortKey>('netValue');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const insiders = Object.values(byInsider);

  if (insiders.length === 0) {
    return null;
  }

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const sorted = [...insiders].sort((a, b) => {
    let cmp = 0;
    switch (sortKey) {
      case 'name':
        cmp = a.name.localeCompare(b.name);
        break;
      case 'netValue':
        cmp = a.netValue - b.netValue;
        break;
      case 'transactions':
        cmp = a.transactions.length - b.transactions.length;
        break;
      case 'lastTradeDate':
        cmp = (a.lastTradeDate ?? '').localeCompare(b.lastTradeDate ?? '');
        break;
    }
    return sortDir === 'asc' ? cmp : -cmp;
  });

  const SortButton = ({ col, label }: { col: SortKey; label: string }) => (
    <button
      onClick={() => handleSort(col)}
      className="flex items-center gap-1 text-xs font-medium text-text-muted hover:text-text-primary transition-colors group"
    >
      {label}
      <ArrowUpDown
        className={`w-3 h-3 transition-colors ${
          sortKey === col ? 'text-violet-400' : 'text-text-faint group-hover:text-text-muted'
        }`}
      />
    </button>
  );

  return (
    <section className="bg-bg-surface/50 rounded-2xl border border-border-strong/50 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-border-strong/50">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-violet-500/15">
          <Users className="w-4 h-4 text-violet-400" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-text-primary">Insiders</h3>
          <p className="text-xs text-text-faint">{insiders.length} insider{insiders.length !== 1 ? 's' : ''} active in this period</p>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-subtle">
              <th className="text-left px-6 py-3">
                <SortButton col="name" label="Name / Role" />
              </th>
              <th className="text-center px-4 py-3">
                <SortButton col="transactions" label="Txns" />
              </th>
              <th className="text-right px-4 py-3">
                <SortButton col="netValue" label="Net Value" />
              </th>
              <th className="text-right px-6 py-3">
                <SortButton col="lastTradeDate" label="Last Trade" />
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((insider, idx) => {
              const isPositive = insider.netValue > 0;
              const isNegative = insider.netValue < 0;

              return (
                <tr
                  key={insider.name}
                  className={`border-b border-border-subtle/50 hover:bg-bg-elevated/30 transition-colors ${
                    idx === sorted.length - 1 ? 'border-b-0' : ''
                  }`}
                >
                  {/* Name + Role */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex items-center justify-center w-8 h-8 rounded-full flex-shrink-0 text-xs font-bold ${
                          isPositive
                            ? 'bg-emerald-500/15 text-emerald-400'
                            : isNegative
                            ? 'bg-rose-500/15 text-rose-400'
                            : 'bg-bg-elevated text-text-muted'
                        }`}
                      >
                        {insider.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-text-primary leading-tight">{insider.name}</p>
                        <p className="text-xs text-text-faint mt-0.5 leading-tight">
                          {insider.title || 'Unknown Role'}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Transaction count */}
                  <td className="text-center px-4 py-4">
                    <span className="inline-flex items-center justify-center min-w-6 h-6 px-2 rounded-md bg-bg-elevated text-text-secondary text-xs font-medium tabular-nums">
                      {insider.transactions.length}
                    </span>
                  </td>

                  {/* Net value */}
                  <td className="text-right px-4 py-4">
                    <div className="flex items-center justify-end gap-1.5">
                      {isPositive ? (
                        <TrendingUp className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                      ) : isNegative ? (
                        <TrendingDown className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
                      ) : (
                        <Minus className="w-3.5 h-3.5 text-text-faint flex-shrink-0" />
                      )}
                      <span
                        className={`font-medium tabular-nums ${
                          isPositive
                            ? 'text-emerald-400'
                            : isNegative
                            ? 'text-rose-400'
                            : 'text-text-muted'
                        }`}
                      >
                        {formatCurrency(insider.netValue)}
                      </span>
                    </div>
                  </td>

                  {/* Last trade date */}
                  <td className="text-right px-6 py-4">
                    <span className="text-text-muted text-xs tabular-nums">
                      {formatDate(insider.lastTradeDate)}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
