'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { Company } from '@/types';

interface SearchBarProps {
  onSelect: (company: Company) => void;
  isLoading?: boolean;
}

export function SearchBar({ onSelect, isLoading }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Company[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searching, setSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        !inputRef.current?.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (query.length < 1) {
      setResults([]);
      setShowDropdown(false);
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data.companies || []);
        setShowDropdown(true);
      } catch (e) {
        console.error('Search failed:', e);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (company: Company) => {
    setQuery(company.ticker);
    setShowDropdown(false);
    onSelect(company);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && query.length > 0) {
      if (results.length > 0) {
        handleSelect(results[0]);
      } else {
        // Try direct ticker search
        onSelect({ ticker: query.toUpperCase(), name: '', cik: '' });
      }
    }
  };

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      <div className="relative group">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-violet-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300 opacity-50" />
        <div className="relative flex items-center bg-slate-900/80 border border-slate-700/50 rounded-2xl overflow-hidden backdrop-blur-xl">
          <div className="pl-5 pr-3 text-slate-400">
            {searching || isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Search className="w-5 h-5" />
            )}
          </div>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => query.length > 0 && results.length > 0 && setShowDropdown(true)}
            placeholder="Enter ticker or company name (e.g., AAPL, Tesla)"
            className="flex-1 py-4 pr-4 bg-transparent text-white placeholder-slate-500 focus:outline-none text-lg"
          />
          {query && (
            <button
              onClick={() => {
                setQuery('');
                setResults([]);
                inputRef.current?.focus();
              }}
              className="pr-5 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Dropdown */}
      {showDropdown && results.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-2 bg-slate-900/95 border border-slate-700/50 rounded-xl overflow-hidden backdrop-blur-xl shadow-2xl z-50"
        >
          {results.map((company) => (
            <button
              key={company.cik || company.ticker}
              onClick={() => handleSelect(company)}
              className="w-full px-5 py-3 flex items-center gap-4 hover:bg-slate-800/50 transition-colors text-left"
            >
              <span className="font-mono font-bold text-cyan-400 text-lg min-w-[80px]">
                {company.ticker}
              </span>
              <span className="text-slate-300 truncate">{company.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
