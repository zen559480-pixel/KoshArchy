import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeftRight, ChevronRight, Plus, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { Transaction } from '../transactions/api/useTransactions';
import { CategoryBadge } from '../../components/ui/CategoryBadge';
import { formatINR, formatDate, cn } from '../../lib/utils';

interface RecentTransactionsListProps {
  transactions: Transaction[];
  loading: boolean;
  onAddTransaction: () => void;
}

export function RecentTransactionsList({
  transactions,
  loading,
  onAddTransaction,
}: RecentTransactionsListProps) {
  return (
    <div className="card space-y-3.5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <ArrowLeftRight className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
              Recent Transactions
            </h3>
            <p className="text-xs text-slate-400">Latest financial activities</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onAddTransaction}
            className="p-1 rounded-md text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/30 text-xs font-semibold flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Add</span>
          </button>
          <Link
            to="/transactions"
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-0.5"
          >
            View All
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Transactions list */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-12 bg-slate-100 dark:bg-slate-700/50 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : transactions.length === 0 ? (
        <div className="p-6 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 text-center">
          <p className="text-xs text-slate-400 mb-2">No transactions recorded yet.</p>
          <button onClick={onAddTransaction} className="btn-primary text-xs py-1.5 px-3">
            <Plus className="w-3.5 h-3.5" />
            Add Transaction
          </button>
        </div>
      ) : (
        <div className="space-y-1.5">
          {transactions.map(txn => {
            const amountNum = parseFloat(txn.amount);
            return (
              <div
                key={txn.id}
                className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 dark:border-slate-700/70 hover:bg-slate-50 dark:hover:bg-slate-750/50 transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={cn(
                      'w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs',
                      txn.type === 'INCOME' && 'bg-emerald-100 text-emerald-600',
                      txn.type === 'EXPENSE' && 'bg-rose-100 text-rose-600',
                      txn.type === 'TRANSFER' && 'bg-blue-100 text-blue-600'
                    )}
                  >
                    {txn.type === 'INCOME' && <ArrowDownLeft className="w-3.5 h-3.5" />}
                    {txn.type === 'EXPENSE' && <ArrowUpRight className="w-3.5 h-3.5" />}
                    {txn.type === 'TRANSFER' && <ArrowLeftRight className="w-3.5 h-3.5" />}
                  </div>

                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                      {txn.description || (txn.type === 'TRANSFER' ? 'Transfer' : 'Transaction')}
                    </p>
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-0.5">
                      <span>{formatDate(txn.date)}</span>
                      {txn.category && (
                        <>
                          <span>•</span>
                          <span className="truncate">{txn.category.name}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div
                  className={cn(
                    'text-xs font-bold font-mono shrink-0 text-right',
                    txn.type === 'INCOME' && 'text-emerald-600 dark:text-emerald-400',
                    txn.type === 'EXPENSE' && 'text-rose-600 dark:text-rose-400',
                    txn.type === 'TRANSFER' && 'text-blue-600 dark:text-blue-400'
                  )}
                >
                  {txn.type === 'INCOME' ? `+${formatINR(amountNum)}` : txn.type === 'EXPENSE' ? `-${formatINR(amountNum)}` : formatINR(amountNum)}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
