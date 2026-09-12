import React, { useState, useEffect, FormEvent } from 'react';
import { X, Target } from 'lucide-react';
import { Goal, Priority, GoalStatus, CreateGoalInput, UpdateGoalInput } from './api/useGoals';
import { Account } from '../accounts/api/useAccounts';
import { AmountInput } from '../../components/ui/AmountInput';
import { DatePicker } from '../../components/ui/DatePicker';
import { toDateInputValue } from '../../lib/utils';

interface GoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  goal?: Goal | null;
  accounts: Account[];
  onSubmit: (data: CreateGoalInput | UpdateGoalInput) => Promise<void>;
}

const PRIORITIES: { priority: Priority; label: string; desc: string }[] = [
  { priority: 'ESSENTIAL', label: 'Essential', desc: 'Emergency, critical debt' },
  { priority: 'HIGH',      label: 'High',      desc: 'Major life events, car' },
  { priority: 'MEDIUM',    label: 'Medium',    desc: 'Gadgets, vacation, lifestyle' },
  { priority: 'LOW',       label: 'Low',       desc: 'Nice-to-have dreams' },
];

export function GoalModal({
  isOpen,
  onClose,
  goal,
  accounts,
  onSubmit,
}: GoalModalProps) {
  const isEdit = !!goal;

  const [name, setName]                 = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [savedAmount, setSavedAmount]   = useState('0');
  const [targetDate, setTargetDate]     = useState('');
  const [priority, setPriority]         = useState<Priority>('MEDIUM');
  const [status, setStatus]             = useState<GoalStatus>('ACTIVE');
  const [accountId, setAccountId]       = useState('');
  const [notes, setNotes]               = useState('');
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState('');

  useEffect(() => {
    if (goal) {
      setName(goal.name);
      setTargetAmount(goal.targetAmount.toString());
      setSavedAmount(goal.savedAmount.toString());
      setTargetDate(goal.targetDate ? toDateInputValue(goal.targetDate) : '');
      setPriority(goal.priority);
      setStatus(goal.status);
      setAccountId(goal.accountId || '');
      setNotes(goal.notes || '');
    } else {
      setName('');
      setTargetAmount('');
      setSavedAmount('0');
      setTargetDate('');
      setPriority('MEDIUM');
      setStatus('ACTIVE');
      const firstActive = accounts.find(a => a.isActive);
      setAccountId(firstActive ? firstActive.id : '');
      setNotes('');
    }
    setError('');
  }, [goal, isOpen, accounts]);

  if (!isOpen) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Goal name is required');
      return;
    }
    if (!targetAmount || parseFloat(targetAmount) <= 0) {
      setError('Target amount must be greater than 0');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const isoTargetDate = targetDate ? new Date(targetDate).toISOString() : null;

      if (isEdit) {
        await onSubmit({
          name: name.trim(),
          targetAmount,
          savedAmount,
          targetDate: isoTargetDate,
          priority,
          status,
          accountId: accountId || null,
          notes: notes.trim() || null,
        } as UpdateGoalInput);
      } else {
        await onSubmit({
          name: name.trim(),
          targetAmount,
          savedAmount: savedAmount || 0,
          targetDate: isoTargetDate,
          priority,
          status,
          accountId: accountId || null,
          notes: notes.trim() || undefined,
        } as CreateGoalInput);
      }

      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 max-w-lg w-full p-6 animate-slide-up max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-50 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 flex items-center justify-center">
              <Target className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {isEdit ? 'Edit Goal' : 'Create Savings Goal'}
              </h3>
              <p className="text-xs text-slate-400">
                {isEdit ? 'Update targets or priority' : 'Set a target for vacation, emergency fund or gadgets'}
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

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto pr-1 py-4 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400 text-sm">
              {error}
            </div>
          )}

          {/* Goal Name */}
          <div>
            <label className="label">Goal Name *</label>
            <input
              type="text"
              required
              autoFocus
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Emergency Fund, MacBook Pro, Goa Holiday"
              className="input"
            />
          </div>

          {/* Target and Initial Saved Amount */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="label">Target Amount *</label>
              <AmountInput
                value={targetAmount}
                onChange={setTargetAmount}
                placeholder="50000"
                required
              />
            </div>

            <div>
              <label className="label">Already Saved</label>
              <AmountInput
                value={savedAmount}
                onChange={setSavedAmount}
                placeholder="0"
              />
            </div>
          </div>

          {/* Priority selector */}
          <div>
            <label className="label">Priority *</label>
            <div className="grid grid-cols-2 gap-2">
              {PRIORITIES.map(p => (
                <button
                  type="button"
                  key={p.priority}
                  onClick={() => setPriority(p.priority)}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    priority === p.priority
                      ? 'border-brand-600 bg-brand-50/80 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 ring-1 ring-brand-600'
                      : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <p className="font-bold text-xs">{p.label}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{p.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Target Date */}
          <div>
            <label className="label">Expected Target Date (Optional)</label>
            <DatePicker
              value={targetDate}
              onChange={setTargetDate}
            />
            <p className="text-xs text-slate-400 mt-1">
              Used to forecast balances and show deadline alerts.
            </p>
          </div>

          {/* Linked Account */}
          <div>
            <label className="label">Holding Account (Optional)</label>
            <select
              value={accountId}
              onChange={e => setAccountId(e.target.value)}
              className="input"
            >
              <option value="">No specific account</option>
              {accounts.map(acc => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} ({acc.type})
                </option>
              ))}
            </select>
            <p className="text-xs text-slate-400 mt-1">
              The account where savings for this goal are kept.
            </p>
          </div>

          {/* Notes */}
          <div>
            <label className="label">Notes / Links (Optional)</label>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. Flight booking deadline, model specs..."
              className="input resize-none"
            />
          </div>

          {/* Actions */}
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
              {loading ? 'Saving...' : isEdit ? 'Update Goal' : 'Create Goal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
