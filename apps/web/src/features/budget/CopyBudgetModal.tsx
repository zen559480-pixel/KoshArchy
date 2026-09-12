import React, { useState, FormEvent } from 'react';
import { X, Copy } from 'lucide-react';
import { CopyBudgetInput } from './api/useBudget';
import { formatMonthYear } from '../../lib/utils';

interface CopyBudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetMonth: number;
  targetYear: number;
  onCopy: (data: CopyBudgetInput) => Promise<void>;
}

export function CopyBudgetModal({
  isOpen,
  onClose,
  targetMonth,
  targetYear,
  onCopy,
}: CopyBudgetModalProps) {
  // Default source month = previous month
  const prevMonthNum = targetMonth === 1 ? 12 : targetMonth - 1;
  const prevYearNum  = targetMonth === 1 ? targetYear - 1 : targetYear;

  const [fromMonth, setFromMonth] = useState(prevMonthNum);
  const [fromYear, setFromYear]   = useState(prevYearNum);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      await onCopy({
        fromMonth,
        fromYear,
        toMonth: targetMonth,
        toYear: targetYear,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Copying budget failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 max-w-md w-full p-6 animate-slide-up">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-brand-50 dark:bg-brand-900/40 text-brand-600 dark:text-brand-400 flex items-center justify-center">
              <Copy className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Copy Budget Limits
              </h3>
              <p className="text-xs text-slate-400">
                Clone categories and limits into {formatMonthYear(targetMonth, targetYear)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 my-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 my-4">
          <div className="p-3.5 bg-slate-50 dark:bg-slate-750 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300">
            Copying from: <span className="font-bold text-slate-900 dark:text-slate-100">{formatMonthYear(fromMonth, fromYear)}</span> → Target: <span className="font-bold text-brand-600 dark:text-brand-400">{formatMonthYear(targetMonth, targetYear)}</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Source Month</label>
              <select
                value={fromMonth}
                onChange={e => setFromMonth(parseInt(e.target.value, 10))}
                className="input"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                  <option key={m} value={m}>
                    {new Date(2000, m - 1).toLocaleString('default', { month: 'long' })}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Source Year</label>
              <input
                type="number"
                value={fromYear}
                onChange={e => setFromYear(parseInt(e.target.value, 10))}
                className="input font-mono"
              />
            </div>
          </div>

          <p className="text-[11px] text-slate-400">
            Categories already present in {formatMonthYear(targetMonth, targetYear)} will not be overwritten.
          </p>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-700">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
            >
              {loading ? 'Copying...' : 'Copy Limits'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
