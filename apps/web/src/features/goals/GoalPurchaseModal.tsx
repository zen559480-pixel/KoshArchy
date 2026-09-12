import React, { useState, FormEvent } from 'react';
import { X, ShoppingBag, Sparkles } from 'lucide-react';
import { Goal, PurchaseGoalInput } from './api/useGoals';
import { Account } from '../accounts/api/useAccounts';
import { Category } from '../categories/api/useCategories';
import { AmountInput } from '../../components/ui/AmountInput';
import { DatePicker } from '../../components/ui/DatePicker';
import { toDateInputValue, formatINR } from '../../lib/utils';

interface GoalPurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  goal: Goal | null;
  accounts: Account[];
  categories: Category[];
  onPurchase: (goalId: string, data: PurchaseGoalInput) => Promise<any>;
}

export function GoalPurchaseModal({
  isOpen,
  onClose,
  goal,
  accounts,
  categories,
  onPurchase,
}: GoalPurchaseModalProps) {
  const [purchaseAmount, setPurchaseAmount] = useState(
    goal ? (parseFloat(goal.savedAmount) > 0 ? goal.savedAmount : goal.targetAmount) : ''
  );
  const [accountId, setAccountId]           = useState(goal?.accountId || '');
  const [categoryId, setCategoryId]         = useState('');
  const [date, setDate]                     = useState(toDateInputValue(new Date()));
  const [description, setDescription]       = useState(goal ? `Purchased: ${goal.name}` : '');
  const [notes, setNotes]                   = useState('');
  const [loading, setLoading]               = useState(false);
  const [error, setError]                   = useState('');

  if (!isOpen || !goal) return null;

  const expenseCategories = categories.filter(c => c.type === 'EXPENSE');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!accountId) {
      setError('Please select an account to pay from');
      return;
    }
    if (!purchaseAmount || parseFloat(purchaseAmount) <= 0) {
      setError('Please enter a valid purchase amount');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await onPurchase(goal.id, {
        purchaseAmount,
        accountId,
        categoryId: categoryId || null,
        date: new Date(date).toISOString(),
        description: description.trim() || undefined,
        notes: notes.trim() || null,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Purchase failed');
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

      <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 max-w-lg w-full p-6 animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <span>Complete Goal Purchase</span>
                <Sparkles className="w-4 h-4 text-amber-500" />
              </h3>
              <p className="text-xs text-slate-400 truncate max-w-[240px]">{goal.name}</p>
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
          {/* Purchase Amount */}
          <div>
            <label className="label">Total Purchase Amount *</label>
            <AmountInput
              value={purchaseAmount}
              onChange={setPurchaseAmount}
              placeholder={goal.targetAmount}
              required
            />
            <p className="text-xs text-slate-400 mt-1">
              Target was {formatINR(parseFloat(goal.targetAmount))}
            </p>
          </div>

          {/* Paid from Account */}
          <div>
            <label className="label">Paid From Account *</label>
            <select
              value={accountId}
              onChange={e => setAccountId(e.target.value)}
              required
              className="input"
            >
              <option value="" disabled>Select account to pay from</option>
              {accounts.map(acc => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} ({acc.type}) — Balance: {formatINR(parseFloat(acc.balance))}
                </option>
              ))}
            </select>
          </div>

          {/* Category */}
          <div>
            <label className="label">Expense Category</label>
            <select
              value={categoryId}
              onChange={e => setCategoryId(e.target.value)}
              className="input"
            >
              <option value="">Uncategorized</option>
              {expenseCategories.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date */}
          <div>
            <label className="label">Purchase Date *</label>
            <DatePicker
              value={date}
              onChange={setDate}
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="label">Description</label>
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="input"
            />
          </div>

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
              className="btn-primary bg-indigo-600 hover:bg-indigo-700"
            >
              {loading ? 'Processing...' : 'Confirm & Buy Goal 🎉'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
