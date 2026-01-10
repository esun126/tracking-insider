// Format currency
export function formatCurrency(value: number): string {
  const absValue = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  
  if (absValue >= 1e9) {
    return `${sign}$${(absValue / 1e9).toFixed(2)}B`;
  } else if (absValue >= 1e6) {
    return `${sign}$${(absValue / 1e6).toFixed(2)}M`;
  } else if (absValue >= 1e3) {
    return `${sign}$${(absValue / 1e3).toFixed(1)}K`;
  }
  return `${sign}$${absValue.toFixed(0)}`;
}

// Format number with commas
export function formatNumber(value: number): string {
  return value.toLocaleString('en-US');
}

// Format percentage
export function formatPercent(value: number): string {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
}

// Format date
export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

// Parse transaction type to readable label
export function getTransactionLabel(type: string): string {
  const labels: Record<string, string> = {
    'P': 'Buy',
    'S': 'Sell',
    'A': 'Grant',
    'D': 'Dispose',
    'F': 'Tax',
    'M': 'Exercise',
    'G': 'Gift',
    'W': 'Inherit',
    'C': 'Convert',
    'X': 'Exercise',
  };
  return labels[type] || type;
}

// Get transaction type color
export function getTransactionColor(type: string): string {
  if (type === 'P') return 'text-emerald-400';
  if (type === 'S' || type === 'F') return 'text-rose-400';
  return 'text-slate-400';
}

// Get transaction background color
export function getTransactionBgColor(type: string): string {
  if (type === 'P') return 'bg-emerald-500/10';
  if (type === 'S' || type === 'F') return 'bg-rose-500/10';
  return 'bg-slate-500/10';
}
