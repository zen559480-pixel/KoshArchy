import React from 'react';
import { Edit2, Trash2, Pin } from 'lucide-react';
import { BudgetItemEnriched } from './api/useBudget';
import { CategoryBadge } from '../../components/ui/CategoryBadge';
import { formatINR, cn } from '../../lib/utils';

interface BudgetProgressRowProps {
  item: BudgetItemEnriched;
  onEdit: (item: BudgetItemEnriched) => void;
  onDelete: (item: BudgetItemEnriched) => void;
}

export function BudgetProgressRow({
  item,
  onEdit,
  onDelete,
}: BudgetProgressRowProps) {
  const expectedNum  = parseFloat(item.expectedAmount) || 0;
  const actualNum    = parseFloat(item.actualAmount) || 0;
  const remainingNum = parseFloat(item.remainingAmount) || 0;
  const percent      = Math.min(150, item.percentUsed); // Cap visual bar at 150%
  const isOver       = item.status === 'OVER';
  const isWarning    = item.status === 'WARNING';

  return (
    <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-700/70 hover:bg-slate-50 dark:hover:bg-slate-750/50 transition-colors group">
      {/* Top row: Category name, badges, amounts, and actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-2 flex-wrap">
          <CategoryBadge name={item.category.name} color={item.category.color} />
          {item.isFixed && (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300">
              <Pin className="w-2.5 h-2.5" />
              Fixed
            </span>
          )}
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-3">
          <div className="text-right">
            <span className="font-mono font-bold text-sm text-slate-900 dark:text-slate-100">
              {formatINR(actualNum)}
            </span>
            <span className="text-xs font-mono text-slate-400">
              {' '}/ {formatINR(expectedNum)}
            </span>
          </div>

          <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onEdit(item)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700"
              title="Edit budget limit"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onDelete(item)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20"
              title="Remove budget item"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1.5">
        <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-500',
              isOver
                ? 'bg-rose-500'
                : isWarning
                ? 'bg-amber-500'
                : 'bg-emerald-500'
            )}
            style={{ width: `${Math.min(100, percent)}%` }}
          />
        </div>

        {/* Status Label and Remaining / Over amount */}
        <div className="flex items-center justify-between text-xs font-medium">
          <span
            className={cn(
              'text-[11px]',
              isOver ? 'text-rose-600 dark:text-rose-400 font-bold' : isWarning ? 'text-amber-600 dark:text-amber-400' : 'text-slate-500 dark:text-slate-400'
            )}
          >
            {item.percentUsed}% used
          </span>

          <span
            className={cn(
              'text-[11px] font-mono',
              isOver ? 'text-rose-600 dark:text-rose-400 font-bold' : 'text-slate-500 dark:text-slate-400'
            )}
          >
            {isOver
              ? `${formatINR(Math.abs(remainingNum))} OVER BUDGET`
              : `${formatINR(remainingNum)} left`}
          </span>
        </div>
      </div>
    </div>
  );
}
