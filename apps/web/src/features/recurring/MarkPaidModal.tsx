import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, Calendar, Wallet, AlertCircle } from 'lucide-react';
import { RecurringTransaction, MarkPaidInput } from './api/useRecurring';
import { useAccounts } from '../accounts/api/useAccounts';
import { formatINR } from '../../lib/utils';

interface MarkPaidModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (id: string, input: MarkPaidInput) => Promise<void>;
  recurring: RecurringTransaction | null;
}

export function MarkPaidModal({
  isOpen,
  onClose,
  onConfirm,
  recurring,
}: MarkPaidModalProps) {
  const { accounts } = useAccounts();

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [amount, setAmount] = useState('');
  const [accountId, setAccountId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (recurring) {
      setAmount(String(recurring.amount));
      setDate(new Date().toISOString().split('T')[0]);
      setAccountId(recurring.accountId || accounts[0]?.id || '');
      setError(null);
    }
  }, [recurring, accounts, isOpen]);

  if (!isOpen || !recurring) return null;

  const isIncome = recurring.type === 'INCOME';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please enter a valid positive amount.');
      return;
    }

    try {
      setSubmitting(true);
      await onConfirm(recurring.id, {
        date: new Date(date).toISOString(),
        amount: parsedAmount,
        accountId: accountId || null,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to record payment');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="card w-full max-w-md shadow-2xl p-6 relative animate-in fade-in zoom-in-95 duration-150">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              isIncome
                ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400'
                : 'bg-rose-50 text-rose-600 dark:text-rose-950/60 dark:text-rose-400'
            }`}
          >
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">
              Mark Payment as Completed
            </h3>
            <p className="text-xs text-slate-400">
              {recurring.description} • {recurring.frequency}
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 text-xs font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Amount */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Actual Amount {isIncome ? 'Received' : 'Paid'} (₹) *
            </label>
            <input
              type="number"
              step="0.01"
              required
              min="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="input font-mono text-sm"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Scheduled amount was {formatINR(parseFloat(String(recurring.amount)))}. Adjust if bill varied.
            </p>
          </div>

          {/* Payment Date */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              Transaction Date *
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="input text-xs"
            />
          </div>

          {/* Account */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
              <Wallet className="w-3.5 h-3.5" />
              {isIncome ? 'Deposit Into Account' : 'Paid From Account'}
            </label>
            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="input text-xs"
            >
              <option value="">-- No Account Adjustment --</option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} (Balance: {formatINR(parseFloat(String(acc.balance)))})
                </option>
              ))}
            </select>
          </div>

          {/* Explanation Info */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/50 text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
            <p className="font-semibold text-slate-700 dark:text-slate-300">
              ⚡ Action Summary:
            </p>
            <ul className="list-disc list-inside space-y-0.5">
              <li>Creates a real {recurring.type.toLowerCase()} transaction</li>
              <li>Updates selected account balance atomically</li>
              <li>Advances recurring schedule to next occurrence</li>
            </ul>
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
              disabled={submitting}
              className="btn-primary text-xs py-2 px-5 font-bold"
            >
              {submitting ? 'Recording...' : 'Confirm & Record'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
