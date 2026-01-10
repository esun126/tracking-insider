'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, User } from 'lucide-react';
import { InsiderTransaction } from '@/types';
import { formatCurrency, formatNumber, formatDate, getTransactionLabel, getTransactionColor } from '@/lib/utils';

interface InsiderBreakdownProps {
  byInsider: Record<string, {
    name: string;
    title: string;
    transactions: InsiderTransaction[];
    netShares: number;
    netValue: number;
  }>;
}

export function InsiderBreakdown({ byInsider }: InsiderBreakdownProps) {
  const [expandedInsiders, setExpandedInsiders] = useState<Set<string>>(new Set());

  const toggleInsider = (name: string) => {
    const newExpanded = new Set(expandedInsiders);
    if (newExpanded.has(name)) {
      newExpanded.delete(name);
    } else {
      newExpanded.add(name);
    }
    setExpandedInsiders(newExpanded);
  };

  const insiders = Object.values(byInsider).sort(
    (a, b) => Math.abs(b.netValue) - Math.abs(a.netValue)
  );

  if (insiders.length === 0) {
    return (
      <div className="bg-slate-900/50 rounded-2xl border border-slate-700/50 p-8 text-center text-slate-500">
        No insider activity found
      </div>
    );
  }

  return (
    <div className="bg-slate-900/50 rounded-2xl border border-slate-700/50 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-700/50">
        <h3 className="text-lg font-semibold text-white">By Insider</h3>
      </div>

      <div className="divide-y divide-slate-800/50">
        {insiders.map((insider) => {
          const isExpanded = expandedInsiders.has(insider.name);
          
          return (
            <div key={insider.name}>
              {/* Insider Header */}
              <button
                onClick={() => toggleInsider(insider.name)}
                className="w-full px-6 py-4 flex items-center gap-4 hover:bg-slate-800/30 transition-colors"
              >
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-cyan-500/20 border border-violet-500/30">
                  <User className="w-5 h-5 text-violet-400" />
                </div>
                
                <div className="flex-1 text-left">
                  <div className="font-semibold text-white">{insider.name}</div>
                  <div className="text-sm text-slate-400">{insider.title}</div>
                </div>

                <div className="text-right mr-4">
                  <div className={`font-bold ${insider.netValue >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {formatCurrency(insider.netValue)}
                  </div>
                  <div className="text-sm text-slate-400">
                    {insider.transactions.length} transaction{insider.transactions.length !== 1 ? 's' : ''}
                  </div>
                </div>

                <div className="text-slate-400">
                  {isExpanded ? (
                    <ChevronDown className="w-5 h-5" />
                  ) : (
                    <ChevronRight className="w-5 h-5" />
                  )}
                </div>
              </button>

              {/* Expanded Transactions */}
              {isExpanded && (
                <div className="bg-slate-950/50 border-t border-slate-800/50">
                  <div className="px-6 py-2">
                    <table className="w-full">
                      <thead>
                        <tr className="text-slate-500 text-xs">
                          <th className="text-left py-2 font-medium">Date</th>
                          <th className="text-center py-2 font-medium">Type</th>
                          <th className="text-right py-2 font-medium">Shares</th>
                          <th className="text-right py-2 font-medium">Price</th>
                          <th className="text-right py-2 font-medium">Value</th>
                        </tr>
                      </thead>
                      <tbody className="text-sm">
                        {insider.transactions.map((tx) => (
                          <tr key={tx.id} className="border-t border-slate-800/30">
                            <td className="py-2 text-slate-300">
                              {formatDate(tx.tradeDate)}
                            </td>
                            <td className="py-2 text-center">
                              <span className={`${getTransactionColor(tx.transactionType)}`}>
                                {getTransactionLabel(tx.transactionType)}
                              </span>
                            </td>
                            <td className={`py-2 text-right ${tx.shares >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                              {tx.shares >= 0 ? '+' : ''}{formatNumber(tx.shares)}
                            </td>
                            <td className="py-2 text-right text-slate-300">
                              ${tx.pricePerShare.toFixed(2)}
                            </td>
                            <td className={`py-2 text-right ${tx.totalValue >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                              {formatCurrency(tx.totalValue)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="border-t border-slate-700/50 font-semibold">
                          <td colSpan={2} className="py-2 text-slate-400">Total</td>
                          <td className={`py-2 text-right ${insider.netShares >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {insider.netShares >= 0 ? '+' : ''}{formatNumber(insider.netShares)}
                          </td>
                          <td></td>
                          <td className={`py-2 text-right ${insider.netValue >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {formatCurrency(insider.netValue)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
