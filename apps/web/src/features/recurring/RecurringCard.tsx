import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  Wallet,
  Tag,
  CheckCircle2,
  Edit2,
  Power,
  Trash2,
  AlertCircle,
  Repeat,
  ArrowUpRight,
  ArrowDownLeft,
} from 'lucide-react';
import { RecurringTransaction } from './api/useRecurring';
import { formatINR, formatDate } from '../../lib/utils';

interface RecurringCardProps {
  recurring: RecurringTransaction;
  onMarkPaid: (recurring: RecurringTransaction) => void;
  onEdit: (recurring: RecurringTransaction) => void;
  onDeactivate: (id: string) => void;
  onDelete: (id: string) => void;
}

export function RecurringCard({
  recurring,
  onMarkPaid,
  onEdit,
  onDeactivate,
  onDelete,
}: RecurringCardProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  const isIncome = recurring.type === 'INCOME';
  const amountNum = parseFloat(String(recurring.amount));
  const hasEnded = recurring.endDate ? new Date(recurring.endDate) < new Date() : false;
  const hasTransactions = (recurring._count?.transactions ?? 0) > 0;

  // Calculate days until next occurrence
  const nextDate = new Date(recurring.nextOccurrence);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffTime = nextDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  let dueBadgeText = '';
  let dueBadgeClass = 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300';

  if (hasEnded) {
    dueBadgeText = 'Deactivated';
    dueBadgeClass = 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400';
  } else if (diffDays < 0) {
    dueBadgeText = `Overdue by ${Math.abs(diffDays)}d`;
    dueBadgeClass = 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 font-semibold';
  } else if (diffDays === 0) {
    dueBadgeText = 'Due Today';
    dueBadgeClass = 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 font-bold';
  } else if (diffDays === 1) {
    dueBadgeText = 'Due Tomorrow';
    dueBadgeClass = 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-300 font-medium';
  } else if (diffDays <= 7) {
    dueBadgeText = `In ${diffDays} days`;
    dueBadgeClass = 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300';
  } else {
    dueBadgeText = formatDate(recurring.nextOccurrence, { relative: false });
  }

  return (
    <div
      className={`card flex flex-col justify-between transition-all duration-200 hover:shadow-md ${
        hasEnded ? 'opacity-75 bg-slate-50/50 dark:bg-slate-850/40' : ''
      }`}
    >
      <div className="space-y-4">
        {/* Top Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm ${
                isIncome
                  ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400'
                  : 'bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400'
              }`}
            >
              {isIncome ? (
                <ArrowDownLeft className="w-4 h-4" />
              ) : (
                <ArrowUpRight className="w-4 h-4" />
              )}
            </div>
            <div>
              <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm leading-tight">
                {recurring.description}
              </h4>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <Repeat className="w-3 h-3" />
                  {recurring.frequency}
                </span>
                {hasEnded && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-medium">
                    Inactive
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Amount */}
          <div className="text-right">
            <p
              className={`font-mono font-bold text-base ${
                isIncome
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {isIncome ? '+' : '-'}
              {formatINR(amountNum)}
            </p>
          </div>
        </div>

        {/* Schedule & Metadata Pills */}
        <div className="space-y-2 pt-1 text-xs">
          {/* Next Occurrence */}
          <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-750">
            <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5 text-[11px]">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              Next Scheduled
            </span>
            <span className={`text-[11px] px-2 py-0.5 rounded-full ${dueBadgeClass}`}>
              {dueBadgeText}
            </span>
          </div>

          {/* Account & Category Details */}
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 truncate">
              <Wallet className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              <span className="truncate">{recurring.account?.name || 'No account'}</span>
            </div>

            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 justify-end truncate">
              <Tag className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              <span className="truncate">{recurring.category?.name || 'Uncategorized'}</span>
            </div>
          </div>

          {/* Payment Count Indicator */}
          {hasTransactions && (
            <p className="text-[10px] text-slate-400 text-right">
              {recurring._count?.transactions} recorded payments
            </p>
          )}
        </div>
      </div>

      {/* Action Footer */}
      <div className="pt-4 mt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
        {/* Left Action Buttons */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onEdit(recurring)}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Edit Rule"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>

          {!hasEnded && (
            <button
              type="button"
              onClick={() => onDeactivate(recurring.id)}
              className="p-1.5 text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Deactivate Schedule"
            >
              <Power className="w-3.5 h-3.5" />
            </button>
          )}

          {!hasTransactions && (
            confirmDelete ? (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => onDelete(recurring.id)}
                  className="px-2 py-0.5 text-[10px] bg-rose-600 text-white rounded font-bold hover:bg-rose-700"
                >
                  Confirm
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="px-1.5 py-0.5 text-[10px] text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Delete Rule"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )
          )}
        </div>

        {/* Primary Action: Mark as Paid */}
        {!hasEnded && (
          <button
            type="button"
            onClick={() => onMarkPaid(recurring)}
            className="btn-primary flex items-center gap-1.5 text-xs py-1.5 px-3 rounded-lg font-bold"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Mark as Paid
          </button>
        )}
      </div>
    </div>
  );
}
