import React from 'react';
import { Link } from 'react-router-dom';
import { Wallet, ChevronRight, Plus } from 'lucide-react';
import { Account } from '../accounts/api/useAccounts';
import { formatINR, getAccountIcon, cn } from '../../lib/utils';

interface AccountSummaryCardProps {
  accounts: Account[];
  loading: boolean;
  onAddAccount: () => void;
}

export function AccountSummaryCard({
  accounts,
  loading,
  onAddAccount,
}: AccountSummaryCardProps) {
  const activeAccounts = accounts.filter(a => a.isActive);

  return (
    <div className="card space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <Wallet className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
              Your Accounts ({activeAccounts.length})
            </h3>
            <p className="text-xs text-slate-400">Balances across banks & cards</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onAddAccount}
            className="p-1 rounded-md text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/30 text-xs font-semibold flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Add</span>
          </button>
          <Link
            to="/accounts"
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-0.5"
          >
            All
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Account items list / horizontal scroll */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {[1, 2].map(i => (
            <div key={i} className="h-16 bg-slate-100 dark:bg-slate-700/50 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : activeAccounts.length === 0 ? (
        <div className="p-6 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 text-center">
          <p className="text-xs text-slate-400 mb-2">No accounts added yet.</p>
          <button onClick={onAddAccount} className="btn-primary text-xs py-1.5 px-3">
            <Plus className="w-3.5 h-3.5" />
            Add Account
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {activeAccounts.map(acc => {
            const isDebt = ['CREDIT_CARD', 'LOAN'].includes(acc.type);
            const balanceNum = parseFloat(acc.balance);
            return (
              <div
                key={acc.id}
                className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-700/70 hover:bg-slate-50 dark:hover:bg-slate-750/50 transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-xl shrink-0">{getAccountIcon(acc.type)}</span>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                      {acc.name}
                    </p>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider">
                      {acc.type.replace('_', ' ')}
                    </p>
                  </div>
                </div>

                <div
                  className={cn(
                    'text-xs font-bold font-mono shrink-0 text-right',
                    isDebt ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-slate-100'
                  )}
                >
                  {formatINR(balanceNum)}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
