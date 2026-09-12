import React, { useState } from 'react';
import { X, Download, FileSpreadsheet, Calendar, Filter, Wallet, Tag } from 'lucide-react';
import { ExportTransactionsFilter } from './api/useSettings';
import { useAccounts } from '../accounts/api/useAccounts';
import { useCategories } from '../categories/api/useCategories';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (filter: ExportTransactionsFilter) => Promise<void>;
  exporting: boolean;
}

export function ExportModal({
  isOpen,
  onClose,
  onExport,
  exporting,
}: ExportModalProps) {
  const { accounts } = useAccounts();
  const { categories } = useCategories();

  const [preset, setPreset] = useState<'all' | 'year' | 'month' | 'custom'>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [type, setType] = useState<string>('ALL');
  const [accountId, setAccountId] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('');

  if (!isOpen) return null;

  const handlePreset = (p: 'all' | 'year' | 'month') => {
    setPreset(p);
    const now = new Date();
    if (p === 'all') {
      setDateFrom('');
      setDateTo('');
    } else if (p === 'year') {
      setDateFrom(`${now.getFullYear()}-01-01`);
      setDateTo(`${now.getFullYear()}-12-31`);
    } else if (p === 'month') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
      setDateFrom(start);
      setDateTo(end);
    }
  };

  const handleDownload = async (e: React.FormEvent) => {
    e.preventDefault();
    await onExport({
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      type: type !== 'ALL' ? type : undefined,
      accountId: accountId || undefined,
      categoryId: categoryId || undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="card w-full max-w-lg shadow-2xl p-6 relative animate-in fade-in zoom-in-95 duration-150">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-lg">
              Export Transactions to CSV
            </h3>
            <p className="text-xs text-slate-400">
              Filter data or download full transaction records for spreadsheet analysis
            </p>
          </div>
        </div>

        <form onSubmit={handleDownload} className="space-y-4">
          {/* Quick Date Range Presets */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Date Range Preset
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handlePreset('all')}
                className={`py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  preset === 'all'
                    ? 'bg-brand-600 text-white shadow-sm font-bold'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                All Time
              </button>
              <button
                type="button"
                onClick={() => handlePreset('year')}
                className={`py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  preset === 'year'
                    ? 'bg-brand-600 text-white shadow-sm font-bold'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                This Year
              </button>
              <button
                type="button"
                onClick={() => handlePreset('month')}
                className={`py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  preset === 'month'
                    ? 'bg-brand-600 text-white shadow-sm font-bold'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                This Month
              </button>
            </div>
          </div>

          {/* Custom Date Range */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                From Date
              </label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => {
                  setPreset('custom');
                  setDateFrom(e.target.value);
                }}
                className="input text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                To Date
              </label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => {
                  setPreset('custom');
                  setDateTo(e.target.value);
                }}
                className="input text-xs"
              />
            </div>
          </div>

          {/* Type Filter */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" />
              Transaction Type
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="input text-xs"
            >
              <option value="ALL">All Types (Income, Expense, Transfers)</option>
              <option value="EXPENSE">Expenses Only</option>
              <option value="INCOME">Income Only</option>
              <option value="TRANSFER">Transfers Only</option>
            </select>
          </div>

          {/* Account and Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                <Wallet className="w-3.5 h-3.5" />
                Account
              </label>
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="input text-xs"
              >
                <option value="">All Accounts</option>
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                <Tag className="w-3.5 h-3.5" />
                Category
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="input text-xs"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name} ({cat.type})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary text-xs py-2 px-4"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={exporting}
              className="btn-primary text-xs py-2 px-5 font-bold flex items-center gap-2"
            >
              <Download className={`w-3.5 h-3.5 ${exporting ? 'animate-bounce' : ''}`} />
              {exporting ? 'Generating CSV...' : 'Download CSV'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
