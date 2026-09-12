import React from 'react';
import { Edit2, Trash2, Shield, EyeOff } from 'lucide-react';
import { Account } from './api/useAccounts';
import { formatINR, getAccountIcon, cn } from '../../lib/utils';

interface AccountCardProps {
  account: Account;
  onEdit: (account: Account) => void;
  onDelete: (account: Account) => void;
}

export function AccountCard({ account, onEdit, onDelete }: AccountCardProps) {
  const isDebt = ['CREDIT_CARD', 'LOAN'].includes(account.type);
  const balanceNum = parseFloat(account.balance);

  return (
    <div
      className={cn(
        'card relative flex flex-col justify-between transition-all duration-200 hover:shadow-md group',
        !account.isActive && 'opacity-60 bg-slate-50 dark:bg-slate-800/50'
      )}
    >
      <div>
        {/* Top bar: icon + type badge + actions */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-700/80 flex items-center justify-center text-2xl shadow-inner shrink-0">
              {getAccountIcon(account.type)}
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-base leading-tight group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                {account.name}
              </h3>
              <span className="text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                {account.type.replace('_', ' ')}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 opacity-80 sm:opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onEdit(account)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
              title="Edit account"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(account)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20"
              title="Delete account"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Balance Display */}
        <div className="my-2">
          <div className="text-xs text-slate-400 dark:text-slate-500 font-medium mb-1">
            Current Balance
          </div>
          <div
            className={cn(
              'text-2xl font-bold font-mono tracking-tight',
              isDebt
                ? 'text-rose-600 dark:text-rose-400'
                : 'text-slate-900 dark:text-slate-100'
            )}
          >
            {formatINR(balanceNum)}
          </div>
        </div>
      </div>

      {/* Footer metadata */}
      <div className="mt-5 pt-3.5 border-t border-slate-100 dark:border-slate-700/80 flex items-center justify-between text-xs text-slate-400 dark:text-slate-500">
        <div className="flex items-center gap-3">
          {account.includeInNetWorth ? (
            <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400" title="Included in Net Worth">
              <Shield className="w-3.5 h-3.5 text-emerald-500" />
              Net Worth
            </span>
          ) : (
            <span className="flex items-center gap-1 text-slate-400" title="Excluded from Net Worth">
              <EyeOff className="w-3.5 h-3.5" />
              Excluded
            </span>
          )}
        </div>

        <div>
          {account._count?.transactions || 0} txn{account._count?.transactions === 1 ? '' : 's'}
        </div>
      </div>
    </div>
  );
}
