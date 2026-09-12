import React from 'react';
import { ArrowRight, ArrowDownLeft, ArrowUpRight, ArrowLeftRight, Edit2, Trash2, Calendar } from 'lucide-react';
import { Transaction } from './api/useTransactions';
import { CategoryBadge } from '../../components/ui/CategoryBadge';
import { formatINR, formatDate, cn } from '../../lib/utils';

interface TransactionTableProps {
  transactions: Transaction[];
  loading: boolean;
  onEdit: (transaction: Transaction) => void;
  onDelete: (transaction: Transaction) => void;
}

export function TransactionTable({
  transactions,
  loading,
  onEdit,
  onDelete,
}: TransactionTableProps) {
  if (loading && transactions.length === 0) {
    return (
      <div className="card p-6 space-y-3">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="h-12 bg-slate-100 dark:bg-slate-700/50 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="card p-0 overflow-hidden border border-slate-200 dark:border-[#1e1e28] shadow-sm bg-white dark:bg-[#0d0d12]">
      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-[#14141c] border-b border-slate-200 dark:border-[#1e1e28] text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              <th className="py-3 px-4">Date</th>
              <th className="py-3 px-4">Description</th>
              <th className="py-3 px-4">Category</th>
              <th className="py-3 px-4">Account / Flow</th>
              <th className="py-3 px-4 text-right">Amount</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-[#1e1e28]">
            {transactions.map(txn => {
              const amountNum = parseFloat(txn.amount);
              return (
                <tr
                  key={txn.id}
                  className="hover:bg-slate-50/80 dark:hover:bg-[#14141c] transition-colors group"
                >
                  {/* Date */}
                  <td className="py-3.5 px-4 whitespace-nowrap text-xs text-slate-500 font-medium">
                    {formatDate(txn.date)}
                  </td>

                  {/* Description & Notes */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={cn(
                          'w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs',
                          txn.type === 'INCOME' && 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600',
                          txn.type === 'EXPENSE' && 'bg-rose-100 dark:bg-rose-950/60 text-rose-600',
                          txn.type === 'TRANSFER' && 'bg-blue-100 dark:bg-blue-950/60 text-blue-600'
                        )}
                      >
                        {txn.type === 'INCOME' && <ArrowDownLeft className="w-3.5 h-3.5" />}
                        {txn.type === 'EXPENSE' && <ArrowUpRight className="w-3.5 h-3.5" />}
                        {txn.type === 'TRANSFER' && <ArrowLeftRight className="w-3.5 h-3.5" />}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
                          {txn.description || (txn.type === 'TRANSFER' ? 'Transfer' : 'Untitled')}
                        </div>
                        {txn.notes && (
                          <div className="text-xs text-slate-400 dark:text-slate-500 truncate max-w-xs">
                            {txn.notes}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Category */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    {txn.category ? (
                      <CategoryBadge name={txn.category.name} color={txn.category.color} />
                    ) : txn.type === 'TRANSFER' ? (
                      <span className="text-xs text-slate-400 italic">Transfer</span>
                    ) : (
                      <span className="text-xs text-slate-400">Uncategorized</span>
                    )}
                  </td>

                  {/* Account / Flow */}
                  <td className="py-3.5 px-4 whitespace-nowrap text-xs text-slate-600 dark:text-slate-300">
                    {txn.type === 'TRANSFER' ? (
                      <div className="flex items-center gap-1.5 font-medium">
                        <span className="text-slate-700 dark:text-slate-200">{txn.fromAccount?.name}</span>
                        <ArrowRight className="w-3 h-3 text-slate-400" />
                        <span className="text-slate-700 dark:text-slate-200">{txn.toAccount?.name}</span>
                      </div>
                    ) : (
                      <span className="font-medium">{txn.account?.name || '—'}</span>
                    )}
                  </td>

                  {/* Amount */}
                  <td className="py-3.5 px-4 whitespace-nowrap text-right">
                    <span
                      className={cn(
                        'font-mono font-bold text-sm',
                        txn.type === 'INCOME' && 'text-emerald-600 dark:text-emerald-400',
                        txn.type === 'EXPENSE' && 'text-rose-600 dark:text-rose-400',
                        txn.type === 'TRANSFER' && 'text-blue-600 dark:text-blue-400'
                      )}
                    >
                      {txn.type === 'INCOME' ? `+${formatINR(amountNum)}` : txn.type === 'EXPENSE' ? `-${formatINR(amountNum)}` : formatINR(amountNum)}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => onEdit(txn)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-md hover:bg-slate-100 dark:hover:bg-[#1f1f2c]"
                        title="Edit transaction"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDelete(txn)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/40"
                        title="Delete transaction"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Card List View */}
      <div className="md:hidden divide-y divide-slate-100 dark:divide-[#1e1e28]">
        {transactions.map(txn => {
          const amountNum = parseFloat(txn.amount);
          return (
            <div key={txn.id} className="p-4 space-y-2.5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
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
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
                      {txn.description || (txn.type === 'TRANSFER' ? 'Transfer' : 'Untitled')}
                    </div>
                    <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                      <Calendar className="w-3 h-3" />
                      {formatDate(txn.date)}
                    </div>
                  </div>
                </div>

                <div
                  className={cn(
                    'font-mono font-bold text-sm',
                    txn.type === 'INCOME' && 'text-emerald-600 dark:text-emerald-400',
                    txn.type === 'EXPENSE' && 'text-rose-600 dark:text-rose-400',
                    txn.type === 'TRANSFER' && 'text-blue-600 dark:text-blue-400'
                  )}
                >
                  {txn.type === 'INCOME' ? `+${formatINR(amountNum)}` : txn.type === 'EXPENSE' ? `-${formatINR(amountNum)}` : formatINR(amountNum)}
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                <div className="flex items-center gap-2">
                  {txn.category && (
                    <CategoryBadge name={txn.category.name} color={txn.category.color} />
                  )}
                  <span>
                    {txn.type === 'TRANSFER'
                      ? `${txn.fromAccount?.name} → ${txn.toAccount?.name}`
                      : txn.account?.name}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button onClick={() => onEdit(txn)} className="p-1 text-slate-400 hover:text-slate-700">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => onDelete(txn)} className="p-1 text-slate-400 hover:text-rose-600">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
