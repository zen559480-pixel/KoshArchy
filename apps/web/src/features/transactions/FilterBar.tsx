import React, { useState } from 'react';
import { Search, Filter, RotateCcw, Calendar } from 'lucide-react';
import { TransactionFilterParams, TransactionType } from './api/useTransactions';
import { Account } from '../accounts/api/useAccounts';
import { Category } from '../categories/api/useCategories';
import { DatePicker } from '../../components/ui/DatePicker';

interface FilterBarProps {
  filters: TransactionFilterParams;
  accounts: Account[];
  categories: Category[];
  onFilterChange: (filters: Partial<TransactionFilterParams>) => void;
}

export function FilterBar({
  filters,
  accounts,
  categories,
  onFilterChange,
}: FilterBarProps) {
  const [customDateOpen, setCustomDateOpen] = useState(!!filters.dateFrom || !!filters.dateTo);

  const hasActiveFilters =
    !!filters.type ||
    !!filters.accountId ||
    !!filters.categoryId ||
    !!filters.dateFrom ||
    !!filters.dateTo ||
    !!filters.search;

  const handleClearFilters = () => {
    setCustomDateOpen(false);
    onFilterChange({
      type: '',
      accountId: '',
      categoryId: '',
      dateFrom: '',
      dateTo: '',
      search: '',
      page: 1,
    });
  };

  const handleDatePreset = (preset: string) => {
    const now = new Date();
    if (preset === 'ALL') {
      setCustomDateOpen(false);
      onFilterChange({ dateFrom: '', dateTo: '', page: 1 });
    } else if (preset === 'THIS_MONTH') {
      setCustomDateOpen(false);
      const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
      const end   = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);
      onFilterChange({ dateFrom: start, dateTo: end, page: 1 });
    } else if (preset === 'LAST_MONTH') {
      setCustomDateOpen(false);
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().slice(0, 10);
      const end   = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().slice(0, 10);
      onFilterChange({ dateFrom: start, dateTo: end, page: 1 });
    } else if (preset === 'THIS_YEAR') {
      setCustomDateOpen(false);
      const start = new Date(now.getFullYear(), 0, 1).toISOString().slice(0, 10);
      const end   = new Date(now.getFullYear(), 11, 31).toISOString().slice(0, 10);
      onFilterChange({ dateFrom: start, dateTo: end, page: 1 });
    } else if (preset === 'CUSTOM') {
      setCustomDateOpen(true);
    }
  };

  return (
    <div className="card p-4 space-y-3.5">
      {/* Row 1: Search & Type Buttons */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={filters.search || ''}
            onChange={e => onFilterChange({ search: e.target.value })}
            placeholder="Search by description or notes..."
            className="input pl-9 text-sm"
          />
        </div>

        {/* Type pills */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-[#14141c] p-1 rounded-xl shrink-0 text-xs font-semibold border border-transparent dark:border-[#20202c]">
          {[
            { id: '',         label: 'All Types' },
            { id: 'EXPENSE',  label: 'Expenses', color: 'text-rose-600' },
            { id: 'INCOME',   label: 'Income',   color: 'text-emerald-600' },
            { id: 'TRANSFER', label: 'Transfers',color: 'text-blue-600' },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => onFilterChange({ type: t.id as TransactionType | '' })}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                filters.type === t.id
                  ? 'bg-white dark:bg-[#222230] text-slate-900 dark:text-white shadow-sm font-bold'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Row 2: Selectors for Account, Category, and Date Presets */}
      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-[#1e1e28] text-xs">
        {/* Account filter */}
        <select
          value={filters.accountId || ''}
          onChange={e => onFilterChange({ accountId: e.target.value })}
          className="input py-1.5 px-2.5 text-xs w-auto max-w-[180px]"
        >
          <option value="">All Accounts</option>
          {accounts.map(acc => (
            <option key={acc.id} value={acc.id}>
              {acc.name}
            </option>
          ))}
        </select>

        {/* Category filter */}
        <select
          value={filters.categoryId || ''}
          onChange={e => onFilterChange({ categoryId: e.target.value })}
          className="input py-1.5 px-2.5 text-xs w-auto max-w-[180px]"
        >
          <option value="">All Categories</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>
              {cat.name} ({cat.type})
            </option>
          ))}
        </select>

        {/* Date presets */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-[#14141c] p-0.5 rounded-lg border border-transparent dark:border-[#20202c]">
          <button
            type="button"
            onClick={() => handleDatePreset('THIS_MONTH')}
            className="px-2.5 py-1 rounded hover:bg-white dark:hover:bg-[#222230] text-slate-600 dark:text-slate-300 transition-colors"
          >
            This Month
          </button>
          <button
            type="button"
            onClick={() => handleDatePreset('LAST_MONTH')}
            className="px-2.5 py-1 rounded hover:bg-white dark:hover:bg-[#222230] text-slate-600 dark:text-slate-300 transition-colors"
          >
            Last Month
          </button>
          <button
            type="button"
            onClick={() => handleDatePreset('THIS_YEAR')}
            className="px-2.5 py-1 rounded hover:bg-white dark:hover:bg-[#222230] text-slate-600 dark:text-slate-300 transition-colors"
          >
            This Year
          </button>
          <button
            type="button"
            onClick={() => handleDatePreset('CUSTOM')}
            className={`px-2.5 py-1 rounded flex items-center gap-1 transition-colors ${
              customDateOpen ? 'bg-white dark:bg-[#222230] text-red-500 font-semibold shadow-xs' : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            <Calendar className="w-3 h-3" />
            Custom
          </button>
        </div>

        {/* Clear filters button */}
        {hasActiveFilters && (
          <button
            onClick={handleClearFilters}
            className="flex items-center gap-1 px-2 py-1 text-slate-500 hover:text-rose-600 ml-auto transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            Reset filters
          </button>
        )}
      </div>

      {/* Row 3: Custom Date Pickers (if Custom opened) */}
      {customDateOpen && (
        <div className="flex items-center gap-2 pt-2 animate-fade-in text-xs">
          <span className="text-slate-400">From:</span>
          <DatePicker
            value={filters.dateFrom || ''}
            onChange={dateFrom => onFilterChange({ dateFrom })}
            className="py-1 text-xs"
          />
          <span className="text-slate-400">To:</span>
          <DatePicker
            value={filters.dateTo || ''}
            onChange={dateTo => onFilterChange({ dateTo })}
            className="py-1 text-xs"
          />
        </div>
      )}
    </div>
  );
}
