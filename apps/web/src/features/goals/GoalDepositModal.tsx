import React, { useState, FormEvent } from 'react';
import { X, PiggyBank, Plus } from 'lucide-react';
import { Goal, DepositGoalInput } from './api/useGoals';
import { Account } from '../accounts/api/useAccounts';
import { AmountInput } from '../../components/ui/AmountInput';
import { formatINR } from '../../lib/utils';

interface GoalDepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  goal: Goal | null;
  accounts: Account[];
  onDeposit: (goalId: string, data: DepositGoalInput) => Promise<any>;
}

export function GoalDepositModal({
  isOpen,
  onClose,
  goal,
  accounts,
  onDeposit,
}: GoalDepositModalProps) {
  const [amount, setAmount]                         = useState('');
  const [accountId, setAccountId]                   = useState(goal?.accountId || '');
  const [createTransaction, setCreateTransaction]   = useState(true);
  const [loading, setLoading]                       = useState(false);
  const [error, setError]                           = useState('');

  if (!isOpen || !goal) return null;

  const currentSaved = parseFloat(goal.savedAmount) || 0;
  const target       = parseFloat(goal.targetAmount) || 0;
  const depositNum   = parseFloat(amount) || 0;
  const projected    = currentSaved + depositNum;
  const projectedPercent = target > 0 ? Math.min(100, Math.round((projected / target) * 100)) : 0;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!amount || depositNum <= 0) {
      setError('Please enter a valid deposit amount');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await onDeposit(goal.id, {
        amount,
        accountId: accountId || null,
        createTransaction: createTransaction && !!accountId,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Deposit failed');
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
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <PiggyBank className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Add Savings to Goal
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
          <div className="p-3 my-3 rounded-lg bg-rose-50 dark:bg-rose-900/20 border border-rose-200 text-rose-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 my-4">
          {/* Amount input */}
          <div>
            <label className="label">Deposit Amount *</label>
            <AmountInput
              value={amount}
              onChange={setAmount}
              placeholder="e.g. 5000"
              autoFocus
              required
            />
          </div>

          {/* Source Account */}
          <div>
            <label className="label">Fund from Account</label>
            <select
              value={accountId}
              onChange={e => setAccountId(e.target.value)}
              className="input"
            >
              <option value="">No account (manual balance increment only)</option>
              {accounts.map(acc => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} ({acc.type}) — {formatINR(parseFloat(acc.balance))}
                </option>
              ))}
            </select>
          </div>

          {/* Checkbox */}
          {accountId && (
            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-600 dark:text-slate-300">
              <input
                type="checkbox"
                checked={createTransaction}
                onChange={e => setCreateTransaction(e.target.checked)}
                className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500"
              />
              <span>Deduct from account balance and log as expense transaction</span>
            </label>
          )}

          {/* Live Progress Preview */}
          {depositNum > 0 && (
            <div className="p-3 bg-emerald-50/60 dark:bg-emerald-950/30 rounded-xl border border-emerald-200/60 dark:border-emerald-800/40 text-xs space-y-1 animate-fade-in">
              <div className="flex justify-between font-semibold text-emerald-900 dark:text-emerald-300">
                <span>New Progress Preview</span>
                <span>{projectedPercent}%</span>
              </div>
              <p className="text-emerald-700 dark:text-emerald-400">
                {formatINR(currentSaved)} + {formatINR(depositNum)} = <span className="font-bold">{formatINR(projected)}</span> of {formatINR(target)}
              </p>
            </div>
          )}

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
              disabled={loading || depositNum <= 0}
              className="btn-primary"
            >
              <Plus className="w-3.5 h-3.5" />
              {loading ? 'Depositing...' : 'Add Savings'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
