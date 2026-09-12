import React, { useState, useEffect } from 'react';
import { X, Repeat, Calendar, Wallet, Tag } from 'lucide-react';
import {
  RecurringTransaction,
  CreateRecurringInput,
  UpdateRecurringInput,
  FrequencyType,
} from './api/useRecurring';
import { useAccounts } from '../accounts/api/useAccounts';
import { useCategories } from '../categories/api/useCategories';

interface RecurringModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (input: CreateRecurringInput | UpdateRecurringInput) => Promise<void>;
  initialData?: RecurringTransaction | null;
}

const FREQUENCIES: { label: string; value: FrequencyType }[] = [
  { label: 'Monthly', value: 'MONTHLY' },
  { label: 'Weekly', value: 'WEEKLY' },
  { label: 'Bi-Weekly (14 Days)', value: 'BIWEEKLY' },
  { label: 'Quarterly (3 Months)', value: 'QUARTERLY' },
  { label: 'Yearly', value: 'YEARLY' },
  { label: 'One Time Scheduled', value: 'ONE_TIME' },
];

export function RecurringModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}: RecurringModalProps) {
  const { accounts } = useAccounts();
  const { categories } = useCategories();

  const [description, setDescription] = useState('');
  const [type, setType] = useState<'EXPENSE' | 'INCOME'>('EXPENSE');
  const [amount, setAmount] = useState('');
  const [frequency, setFrequency] = useState<FrequencyType>('MONTHLY');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [hasEndDate, setHasEndDate] = useState(false);
  const [endDate, setEndDate] = useState('');
  const [accountId, setAccountId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setDescription(initialData.description);
      setType(initialData.type);
      setAmount(String(initialData.amount));
      setFrequency(initialData.frequency);
      setStartDate(new Date(initialData.startDate).toISOString().split('T')[0]);
      if (initialData.endDate) {
        setHasEndDate(true);
        setEndDate(new Date(initialData.endDate).toISOString().split('T')[0]);
      } else {
        setHasEndDate(false);
        setEndDate('');
      }
      setAccountId(initialData.accountId || '');
      setCategoryId(initialData.categoryId || '');
    } else {
      setDescription('');
      setType('EXPENSE');
      setAmount('');
      setFrequency('MONTHLY');
      setStartDate(new Date().toISOString().split('T')[0]);
      setHasEndDate(false);
      setEndDate('');
      setAccountId(accounts[0]?.id || '');
      setCategoryId('');
    }
    setError(null);
  }, [initialData, isOpen, accounts]);

  if (!isOpen) return null;

  const filteredCategories = categories.filter((c) => c.type === type);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsedAmount = parseFloat(amount);
    if (!description.trim()) {
      setError('Please provide a description.');
      return;
    }
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please enter a valid positive amount.');
      return;
    }

    try {
      setSubmitting(true);
      const payload: CreateRecurringInput = {
        description: description.trim(),
        type,
        amount: parsedAmount,
        frequency,
        startDate: new Date(startDate).toISOString(),
        endDate: hasEndDate && endDate ? new Date(endDate).toISOString() : null,
        accountId: accountId || null,
        categoryId: categoryId || null,
      };

      await onSubmit(payload);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="card w-full max-w-lg shadow-2xl p-6 relative animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 flex items-center justify-center">
            <Repeat className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-lg">
              {initialData ? 'Edit Recurring Rule' : 'New Recurring Rule'}
            </h3>
            <p className="text-xs text-slate-400">
              Automate scheduled salaries, fixed bills, and subscriptions
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 text-xs font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Income vs Expense Toggle */}
          <div className="grid grid-cols-2 gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => {
                setType('EXPENSE');
                setCategoryId('');
              }}
              className={`py-2 rounded-lg text-xs font-bold transition-all ${
                type === 'EXPENSE'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Expense (Bill / Subscription)
            </button>
            <button
              type="button"
              onClick={() => {
                setType('INCOME');
                setCategoryId('');
              }}
              className={`py-2 rounded-lg text-xs font-bold transition-all ${
                type === 'INCOME'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Income (Salary / Interest)
            </button>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Description *
            </label>
            <input
              type="text"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Netflix Subscription, Apartment Rent, Monthly Salary"
              className="input text-xs"
            />
          </div>

          {/* Amount & Frequency Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Amount (₹) *
              </label>
              <input
                type="number"
                step="0.01"
                required
                min="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="₹ 0.00"
                className="input font-mono text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Frequency *
              </label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as FrequencyType)}
                className="input text-xs"
              >
                {FREQUENCIES.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Start Date & End Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                First Occurrence / Start Date *
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="input text-xs"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  End Date (Optional)
                </label>
                <label className="flex items-center gap-1.5 text-[11px] text-slate-500 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasEndDate}
                    onChange={(e) => setHasEndDate(e.target.checked)}
                    className="rounded border-slate-300 text-brand-600 focus:ring-brand-500 w-3.5 h-3.5"
                  />
                  Has End
                </label>
              </div>
              <input
                type="date"
                disabled={!hasEndDate}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="input text-xs disabled:opacity-40 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          {/* Account & Category Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                <Wallet className="w-3.5 h-3.5" />
                Associated Account
              </label>
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="input text-xs"
              >
                <option value="">-- None / Select Later --</option>
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} ({acc.type})
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
                <option value="">-- None / Uncategorized --</option>
                {filteredCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Actions */}
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
              disabled={submitting}
              className="btn-primary text-xs py-2 px-5 font-bold"
            >
              {submitting ? 'Saving...' : initialData ? 'Save Changes' : 'Create Recurring Rule'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
