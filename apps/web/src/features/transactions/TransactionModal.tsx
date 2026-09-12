import React, { useState, useEffect, FormEvent } from 'react';
import { X, ArrowDownLeft, ArrowUpRight, ArrowLeftRight } from 'lucide-react';
import { Transaction, TransactionType, CreateTransactionInput, UpdateTransactionInput } from './api/useTransactions';
import { Account } from '../accounts/api/useAccounts';
import { Category } from '../categories/api/useCategories';
import { AmountInput } from '../../components/ui/AmountInput';
import { DatePicker } from '../../components/ui/DatePicker';
import { toDateInputValue } from '../../lib/utils';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction?: Transaction | null; // If passed, edit mode
  accounts: Account[];
  categories: Category[];
  onSubmit: (data: CreateTransactionInput | UpdateTransactionInput) => Promise<void>;
}

export function TransactionModal({
  isOpen,
  onClose,
  transaction,
  accounts,
  categories,
  onSubmit,
}: TransactionModalProps) {
  const isEdit = !!transaction;

  const [type, setType]                   = useState<TransactionType>('EXPENSE');
  const [amount, setAmount]               = useState('');
  const [date, setDate]                   = useState(toDateInputValue(new Date()));
  const [description, setDescription]     = useState('');
  const [notes, setNotes]                 = useState('');
  const [accountId, setAccountId]         = useState('');
  const [categoryId, setCategoryId]       = useState('');
  const [fromAccountId, setFromAccountId] = useState('');
  const [toAccountId, setToAccountId]     = useState('');
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState('');

  // Pre-fill fields on open / edit
  useEffect(() => {
    if (transaction) {
      setType(transaction.type);
      setAmount(transaction.amount.toString());
      setDate(toDateInputValue(transaction.date));
      setDescription(transaction.description || '');
      setNotes(transaction.notes || '');
      setAccountId(transaction.accountId || '');
      setCategoryId(transaction.categoryId || '');
      setFromAccountId(transaction.fromAccountId || '');
      setToAccountId(transaction.toAccountId || '');
    } else {
      setType('EXPENSE');
      setAmount('');
      setDate(toDateInputValue(new Date()));
      setDescription('');
      setNotes('');
      // Default to first active account
      const firstActive = accounts.find(a => a.isActive);
      setAccountId(firstActive ? firstActive.id : '');
      setFromAccountId(firstActive ? firstActive.id : '');
      const secondActive = accounts.filter(a => a.isActive && a.id !== firstActive?.id)[0];
      setToAccountId(secondActive ? secondActive.id : '');
      setCategoryId('');
    }
    setError('');
  }, [transaction, isOpen, accounts]);

  if (!isOpen) return null;

  // Filter categories by type
  const matchingCategories = categories.filter(c => c.type === (type === 'TRANSFER' ? 'EXPENSE' : type));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!amount || parseFloat(amount) <= 0) {
      setError('Amount must be greater than 0');
      return;
    }

    if (type !== 'TRANSFER' && !accountId) {
      setError('Please select an account');
      return;
    }

    if (type === 'TRANSFER') {
      if (!fromAccountId || !toAccountId) {
        setError('Please select both source and destination accounts');
        return;
      }
      if (fromAccountId === toAccountId) {
        setError('Transfer source and destination must be different accounts');
        return;
      }
    }

    try {
      setLoading(true);
      setError('');

      // Create or update payload
      const isoDateString = new Date(date).toISOString();

      if (isEdit) {
        await onSubmit({
          amount,
          date: isoDateString,
          description: description.trim() || null,
          notes: notes.trim() || null,
          categoryId: type !== 'TRANSFER' ? (categoryId || null) : null,
          accountId: type !== 'TRANSFER' ? accountId : null,
          fromAccountId: type === 'TRANSFER' ? fromAccountId : null,
          toAccountId: type === 'TRANSFER' ? toAccountId : null,
        } as UpdateTransactionInput);
      } else {
        await onSubmit({
          type,
          amount,
          date: isoDateString,
          description: description.trim() || undefined,
          notes: notes.trim() || undefined,
          accountId: type !== 'TRANSFER' ? accountId : undefined,
          categoryId: type !== 'TRANSFER' ? (categoryId || undefined) : undefined,
          fromAccountId: type === 'TRANSFER' ? fromAccountId : undefined,
          toAccountId: type === 'TRANSFER' ? toAccountId : undefined,
        } as CreateTransactionInput);
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

      {/* Modal Card */}
      <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 max-w-lg w-full p-6 animate-slide-up max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700 shrink-0">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              {isEdit ? 'Edit Transaction' : 'Record Transaction'}
            </h3>
            <p className="text-xs text-slate-400">
              {isEdit ? 'Update transaction details' : 'Log a new expense, income or account transfer'}
            </p>
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

          {/* Type Selector (Disabled when editing to prevent balance distortion) */}
          {!isEdit && (
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setType('EXPENSE')}
                className={`py-2 px-3 rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 border transition-all ${
                  type === 'EXPENSE'
                    ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-500 text-rose-600 dark:text-rose-400 ring-1 ring-rose-500 shadow-sm'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                }`}
              >
                <ArrowUpRight className="w-4 h-4 text-rose-500" />
                Expense
              </button>

              <button
                type="button"
                onClick={() => setType('INCOME')}
                className={`py-2 px-3 rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 border transition-all ${
                  type === 'INCOME'
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500 shadow-sm'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                }`}
              >
                <ArrowDownLeft className="w-4 h-4 text-emerald-500" />
                Income
              </button>

              <button
                type="button"
                onClick={() => setType('TRANSFER')}
                className={`py-2 px-3 rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 border transition-all ${
                  type === 'TRANSFER'
                    ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-500 text-blue-600 dark:text-blue-400 ring-1 ring-blue-500 shadow-sm'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                }`}
              >
                <ArrowLeftRight className="w-4 h-4 text-blue-500" />
                Transfer
              </button>
            </div>
          )}

          {/* Amount */}
          <div>
            <label className="label">Amount *</label>
            <AmountInput
              value={amount}
              onChange={setAmount}
              placeholder="0.00"
              autoFocus
              required
            />
          </div>

          {/* Accounts selection */}
          {type !== 'TRANSFER' ? (
            <div>
              <label className="label">Account *</label>
              <select
                value={accountId}
                onChange={e => setAccountId(e.target.value)}
                required
                className="input"
              >
                <option value="" disabled>Select account</option>
                {accounts.map(acc => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} ({acc.type})
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="label">From Account *</label>
                <select
                  value={fromAccountId}
                  onChange={e => setFromAccountId(e.target.value)}
                  required
                  className="input"
                >
                  <option value="" disabled>Source account</option>
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id} disabled={acc.id === toAccountId}>
                      {acc.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">To Account *</label>
                <select
                  value={toAccountId}
                  onChange={e => setToAccountId(e.target.value)}
                  required
                  className="input"
                >
                  <option value="" disabled>Destination account</option>
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id} disabled={acc.id === fromAccountId}>
                      {acc.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Category (for Income and Expense) */}
          {type !== 'TRANSFER' && (
            <div>
              <label className="label">Category</label>
              <select
                value={categoryId}
                onChange={e => setCategoryId(e.target.value)}
                className="input"
              >
                <option value="">Uncategorized</option>
                {matchingCategories.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Date */}
          <div>
            <label className="label">Date *</label>
            <DatePicker
              value={date}
              onChange={setDate}
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="label">Description / Title</label>
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder={type === 'TRANSFER' ? 'e.g. Credit card payment, ATM withdrawal' : 'e.g. Grocery run, Salary deposit, Fuel'}
              className="input"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="label">Notes (optional)</label>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Add extra context or receipt details..."
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
              {loading ? 'Saving...' : isEdit ? 'Update Transaction' : 'Save Transaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
