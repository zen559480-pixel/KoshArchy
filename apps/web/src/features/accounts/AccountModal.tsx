import React, { useState, useEffect, FormEvent } from 'react';
import { X, Wallet } from 'lucide-react';
import { Account, AccountType, CreateAccountInput, UpdateAccountInput } from './api/useAccounts';
import { AmountInput } from '../../components/ui/AmountInput';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  account?: Account | null; // If provided, edit mode
  onSubmit: (data: CreateAccountInput | UpdateAccountInput) => Promise<void>;
}

const ACCOUNT_TYPES: { type: AccountType; label: string; icon: string }[] = [
  { type: 'BANK',        label: 'Bank Account',   icon: '🏦' },
  { type: 'CREDIT_CARD', label: 'Credit Card',    icon: '💳' },
  { type: 'CASH',        label: 'Cash in Hand',   icon: '💵' },
  { type: 'WALLET',      label: 'Digital Wallet', icon: '👛' },
  { type: 'INVESTMENT',  label: 'Investment',     icon: '📈' },
  { type: 'LOAN',        label: 'Loan / Debt',    icon: '🏠' },
  { type: 'OTHER',       label: 'Other',          icon: '📂' },
];

export function AccountModal({
  isOpen,
  onClose,
  account,
  onSubmit,
}: AccountModalProps) {
  const [name, setName]                           = useState('');
  const [type, setType]                           = useState<AccountType>('BANK');
  const [balance, setBalance]                     = useState('');
  const [currency, setCurrency]                   = useState('INR');
  const [includeInNetWorth, setIncludeInNetWorth] = useState(true);
  const [includeInJoint, setIncludeInJoint]       = useState(true);
  const [loading, setLoading]                     = useState(false);
  const [error, setError]                         = useState('');

  const isEdit = !!account;

  useEffect(() => {
    if (account) {
      setName(account.name);
      setType(account.type);
      setBalance(account.balance.toString());
      setCurrency(account.currency || 'INR');
      setIncludeInNetWorth(account.includeInNetWorth);
      setIncludeInJoint(account.includeInJoint);
    } else {
      setName('');
      setType('BANK');
      setBalance('');
      setCurrency('INR');
      setIncludeInNetWorth(true);
      setIncludeInJoint(true);
    }
    setError('');
  }, [account, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Account name is required');
      return;
    }
    if (balance === '') {
      setError('Balance is required');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await onSubmit({
        name: name.trim(),
        type,
        balance,
        currency,
        includeInNetWorth,
        includeInJoint,
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
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 max-w-lg w-full p-6 animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 flex items-center justify-center">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {isEdit ? 'Edit Account' : 'Add New Account'}
              </h3>
              <p className="text-xs text-slate-400">
                {isEdit ? 'Update account details or adjust balance' : 'Track a bank, card, wallet or investment'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 mb-4 rounded-lg bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400 text-sm">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Account Name */}
          <div>
            <label className="label" htmlFor="accName">
              Account Name *
            </label>
            <input
              id="accName"
              type="text"
              required
              autoFocus
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. HDFC Salary, ICICI Amazon Pay, Cash Wallet"
              className="input"
            />
          </div>

          {/* Account Type Selector */}
          <div>
            <label className="label">Account Type *</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {ACCOUNT_TYPES.map(item => (
                <button
                  type="button"
                  key={item.type}
                  onClick={() => setType(item.type)}
                  className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-medium transition-all text-left ${
                    type === item.type
                      ? 'border-brand-600 bg-brand-50/80 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 ring-1 ring-brand-600'
                      : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <span className="text-base">{item.icon}</span>
                  <span className="truncate">{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Balance */}
          <div>
            <label className="label" htmlFor="accBalance">
              {isEdit ? 'Current Balance *' : 'Starting Balance *'}
            </label>
            <AmountInput
              value={balance}
              onChange={setBalance}
              placeholder="0.00"
              required
            />
            <p className="text-xs text-slate-400 mt-1">
              For credit cards/loans, enter the outstanding balance.
            </p>
          </div>

          {/* Checkboxes */}
          <div className="space-y-2 pt-2">
            <label className="flex items-center gap-2.5 cursor-pointer text-sm text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={includeInNetWorth}
                onChange={e => setIncludeInNetWorth(e.target.checked)}
                className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-slate-300 dark:border-slate-600"
              />
              <span>Include in Net Worth calculations</span>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer text-sm text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={includeInJoint}
                onChange={e => setIncludeInJoint(e.target.checked)}
                className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-slate-300 dark:border-slate-600"
              />
              <span>Include in Joint Household reports</span>
            </label>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
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
              {loading ? 'Saving...' : isEdit ? 'Update Account' : 'Create Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
