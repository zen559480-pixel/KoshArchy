import React, { useState, useEffect, FormEvent } from 'react';
import { X, PieChart, Plus } from 'lucide-react';
import { BudgetItemEnriched } from './api/useBudget';
import { Category } from '../categories/api/useCategories';
import { AmountInput } from '../../components/ui/AmountInput';

interface AddBudgetItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  item?: BudgetItemEnriched | null; // If passed, edit mode
  existingCategoryIds: string[];
  categories: Category[];
  onSubmit: (data: { categoryId: string; expectedAmount: string | number; isFixed: boolean }) => Promise<void>;
}

export function AddBudgetItemModal({
  isOpen,
  onClose,
  item,
  existingCategoryIds,
  categories,
  onSubmit,
}: AddBudgetItemModalProps) {
  const isEdit = !!item;

  const [categoryId, setCategoryId]         = useState('');
  const [expectedAmount, setExpectedAmount] = useState('');
  const [isFixed, setIsFixed]               = useState(false);
  const [loading, setLoading]               = useState(false);
  const [error, setError]                   = useState('');

  // Available categories: Expense categories not already budgeted (unless editing current item)
  const availableCategories = categories.filter(
    c => c.type === 'EXPENSE' && (!existingCategoryIds.includes(c.id) || (item && item.categoryId === c.id))
  );

  useEffect(() => {
    if (item) {
      setCategoryId(item.categoryId);
      setExpectedAmount(item.expectedAmount.toString());
      setIsFixed(item.isFixed);
    } else {
      setCategoryId(availableCategories[0]?.id || '');
      setExpectedAmount('');
      setIsFixed(false);
    }
    setError('');
  }, [item, isOpen, categories]);

  if (!isOpen) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!categoryId) {
      setError('Please select a category');
      return;
    }
    if (!expectedAmount || parseFloat(expectedAmount) <= 0) {
      setError('Please enter a valid budget limit');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await onSubmit({
        categoryId,
        expectedAmount,
        isFixed,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Operation failed');
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
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-brand-50 dark:bg-brand-900/40 text-brand-600 dark:text-brand-400 flex items-center justify-center">
              <PieChart className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                {isEdit ? 'Edit Budget Limit' : 'Add Category Limit'}
              </h3>
              <p className="text-xs text-slate-400">Set monthly spending allowance</p>
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
          {/* Category selection */}
          <div>
            <label className="label">Category *</label>
            <select
              value={categoryId}
              disabled={isEdit}
              onChange={e => setCategoryId(e.target.value)}
              required
              className="input"
            >
              <option value="" disabled>Select category</option>
              {availableCategories.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Expected Amount */}
          <div>
            <label className="label">Monthly Spending Limit *</label>
            <AmountInput
              value={expectedAmount}
              onChange={setExpectedAmount}
              placeholder="e.g. 10000"
              autoFocus
              required
            />
          </div>

          {/* Fixed Expense Toggle */}
          <label className="flex items-center gap-2.5 cursor-pointer text-xs text-slate-600 dark:text-slate-300 pt-1">
            <input
              type="checkbox"
              checked={isFixed}
              onChange={e => setIsFixed(e.target.checked)}
              className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500"
            />
            <div>
              <span className="font-semibold text-slate-700 dark:text-slate-200">Fixed Monthly Commitment</span>
              <p className="text-[11px] text-slate-400">e.g. Rent, EMI, WiFi, Housekeeping</p>
            </div>
          </label>

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
              {loading ? 'Saving...' : isEdit ? 'Update Limit' : 'Save Limit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
