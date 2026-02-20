'use client';

import { useState } from 'react';
import { ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import { InsiderTransaction } from '@/types';
import { 
  formatCurrency, 
  formatNumber, 
  formatPercent, 
  formatDate,
  getTransactionLabel,
  getTransactionColor,
  getTransactionBgColor 
} from '@/lib/utils';

interface TransactionTableProps {
  transactions: InsiderTransaction[];
}

type SortKey = 'tradeDate' | 'insiderName' | 'totalValue' | 'shares';
type SortOrder = 'asc' | 'desc';

export function TransactionTable({ transactions }: TransactionTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('tradeDate');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [filter, setFilter] = useState<'all' | 'buy' | 'sell'>('all');

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('desc');
    }
  };

  const filteredTransactions = transactions.filter((t) => {
    if (filter === 'buy') return t.transactionType === 'P';
    if (filter === 'sell') return t.transactionType === 'S' || t.transactionType === 'F';
    return true;
  });

  const sortedTransactions = [...filteredTransactions].sort((a, b) => {
    let comparison = 0;
    switch (sortKey) {
      case 'tradeDate':
        comparison = new Date(a.tradeDate).getTime() - new Date(b.tradeDate).getTime();
        break;
      case 'insiderName':
        comparison = a.insiderName.localeCompare(b.insiderName);
        break;
      case 'totalValue':
        comparison = Math.abs(a.totalValue) - Math.abs(b.totalValue);
        break;
      case 'shares':
        comparison = Math.abs(a.shares) - Math.abs(b.shares);
        break;
    }
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const SortIcon = ({ column }: { column: SortKey }) => {
    if (sortKey !== column) return null;
    return sortOrder === 'asc' ? (
      <ChevronUp className="w-4 h-4" />
    ) : (
      <ChevronDown className="w-4 h-4" />
    );
  };

  return (
    <div className="bg-bg-surface/50 rounded-2xl border border-border-strong/50 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border-strong/50 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-text-primary">Transaction History</h3>
        <div className="flex gap-2">
          {(['all', 'buy', 'sell'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                filter === f
                  ? f === 'buy'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : f === 'sell'
                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    : 'bg-violet-500/20 text-violet-400 border border-violet-500/30'
                  : 'bg-bg-elevated text-text-muted border border-transparent hover:border-border-strong'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-text-muted text-sm border-b border-border-strong/50">
              <th
                onClick={() => handleSort('tradeDate')}
                className="text-left px-6 py-3 font-medium cursor-pointer hover:text-text-primary transition-colors"
              >
                <div className="flex items-center gap-1">
                  Date
                  <SortIcon column="tradeDate" />
                </div>
              </th>
              <th
                onClick={() => handleSort('insiderName')}
                className="text-left px-6 py-3 font-medium cursor-pointer hover:text-text-primary transition-colors"
              >
                <div className="flex items-center gap-1">
                  Insider
                  <SortIcon column="insiderName" />
                </div>
              </th>
              <th className="text-left px-6 py-3 font-medium">Title</th>
              <th className="text-center px-6 py-3 font-medium">Type</th>
              <th
                onClick={() => handleSort('shares')}
                className="text-right px-6 py-3 font-medium cursor-pointer hover:text-text-primary transition-colors"
              >
                <div className="flex items-center justify-end gap-1">
                  Shares
                  <SortIcon column="shares" />
                </div>
              </th>
              <th className="text-right px-6 py-3 font-medium">Price</th>
              <th
                onClick={() => handleSort('totalValue')}
                className="text-right px-6 py-3 font-medium cursor-pointer hover:text-text-primary transition-colors"
              >
                <div className="flex items-center justify-end gap-1">
                  Value
                  <SortIcon column="totalValue" />
                </div>
              </th>
              <th className="text-right px-6 py-3 font-medium">Δ Own</th>
              <th className="text-center px-6 py-3 font-medium">SEC</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle/50">
            {sortedTransactions.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-6 py-12 text-center text-text-faint">
                  No transactions found
                </td>
              </tr>
            ) : (
              sortedTransactions.map((tx) => (
                <tr
                  key={tx.id}
                  className="hover:bg-bg-elevated/30 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="text-text-primary text-sm">{formatDate(tx.tradeDate)}</div>
                    <div className="text-text-faint text-xs">
                      Filed: {formatDate(tx.filingDate)}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-text-primary font-medium">{tx.insiderName}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-text-muted text-sm truncate max-w-[150px]">
                      {tx.insiderTitle}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span
                      className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-bold ${getTransactionColor(
                        tx.transactionType
                      )} ${getTransactionBgColor(tx.transactionType)}`}
                    >
                      {getTransactionLabel(tx.transactionType)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className={tx.shares >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                      {tx.shares >= 0 ? '+' : ''}
                      {formatNumber(tx.shares)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right text-text-secondary">
                    ${tx.pricePerShare.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className={tx.totalValue >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                      {formatCurrency(tx.totalValue)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span
                      className={
                        tx.ownershipChangePercent >= 0
                          ? 'text-emerald-400'
                          : 'text-rose-400'
                      }
                    >
                      {formatPercent(tx.ownershipChangePercent)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <a
                      href={tx.secFilingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-bg-elevated hover:bg-bg-muted text-text-muted hover:text-text-primary transition-all"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="px-6 py-3 border-t border-border-strong/50 text-sm text-text-faint">
        Showing {sortedTransactions.length} of {transactions.length} transactions
      </div>
    </div>
  );
}
