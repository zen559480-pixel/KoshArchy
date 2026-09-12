import React from 'react';
import { Target, CheckCircle2, ShoppingBag, XCircle, Calendar, Clock, Edit2, Trash2, Plus, Sparkles } from 'lucide-react';
import { Goal } from './api/useGoals';
import { formatINR, formatDate, getPriorityColor, cn } from '../../lib/utils';

interface GoalCardProps {
  goal: Goal;
  onEdit: (goal: Goal) => void;
  onDeposit: (goal: Goal) => void;
  onPurchase: (goal: Goal) => void;
  onDelete: (goal: Goal) => void;
}

export function GoalCard({
  goal,
  onEdit,
  onDeposit,
  onPurchase,
  onDelete,
}: GoalCardProps) {
  const targetVal    = parseFloat(goal.targetAmount) || 0;
  const savedVal     = parseFloat(goal.savedAmount) || 0;
  const remainingVal = parseFloat(goal.remainingAmount) || 0;
  const percent      = Math.min(100, goal.progressPercent);

  const isAchieved  = goal.status === 'ACHIEVED';
  const isPurchased = goal.status === 'PURCHASED';
  const isCancelled = goal.status === 'CANCELLED';
  const isActive    = goal.status === 'ACTIVE';

  return (
    <div
      className={cn(
        'card relative flex flex-col justify-between transition-all duration-200 hover:shadow-md group',
        isPurchased && 'bg-slate-50/80 dark:bg-slate-800/40 border-emerald-200/50 dark:border-emerald-800/30',
        isCancelled && 'opacity-60 bg-slate-50 dark:bg-slate-800/30'
      )}
    >
      <div>
        {/* Top row: Priority badge + Status + Quick actions */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className={cn(
                'text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full',
                getPriorityColor(goal.priority)
              )}
            >
              {goal.priority}
            </span>

            {isAchieved && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200">
                <CheckCircle2 className="w-3 h-3" />
                Target Reached
              </span>
            )}

            {isPurchased && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-400 border border-indigo-200">
                <ShoppingBag className="w-3 h-3" />
                Purchased
              </span>
            )}

            {isCancelled && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400">
                <XCircle className="w-3 h-3" />
                Cancelled
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 opacity-80 sm:opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onEdit(goal)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
              title="Edit goal"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onDelete(goal)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20"
              title="Remove goal"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Goal Name */}
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 leading-snug group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
          {goal.name}
        </h3>

        {/* Target vs Saved Numbers */}
        <div className="flex items-baseline justify-between mt-3 mb-1">
          <div className="text-xl sm:text-2xl font-bold font-mono text-slate-900 dark:text-slate-100">
            {formatINR(savedVal)}
          </div>
          <div className="text-xs font-mono text-slate-400">
            of {formatINR(targetVal)}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5 my-2.5">
          <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-500',
                isPurchased
                  ? 'bg-indigo-500'
                  : percent >= 100
                  ? 'bg-emerald-500'
                  : percent >= 50
                  ? 'bg-brand-500'
                  : 'bg-amber-500'
              )}
              style={{ width: `${percent}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
            <span>{percent}% saved</span>
            {remainingVal > 0 && !isPurchased && (
              <span>{formatINR(remainingVal)} remaining</span>
            )}
          </div>
        </div>

        {/* Target Date / ETA Badges */}
        <div className="space-y-1 my-3 text-xs text-slate-500 dark:text-slate-400">
          {goal.targetDate && (
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className={goal.isOverdue ? 'text-rose-500 font-semibold' : ''}>
                Target: {formatDate(goal.targetDate)}
                {goal.isOverdue && ' (Overdue)'}
              </span>
            </div>
          )}

          {goal.estimatedMonthsLeft && remainingVal > 0 && (
            <div className="flex items-center gap-1.5 text-brand-600 dark:text-brand-400 font-medium">
              <Clock className="w-3.5 h-3.5 shrink-0" />
              <span>
                ETA: ~{goal.estimatedMonthsLeft} mos ({formatDate(goal.estimatedDate!)})
              </span>
            </div>
          )}

          {goal.account && (
            <div className="text-[11px] text-slate-400 truncate">
              Reserved in: <span className="text-slate-600 dark:text-slate-300 font-medium">{goal.account.name}</span>
            </div>
          )}
        </div>
      </div>

      {/* Action Footer */}
      <div className="pt-3.5 mt-2 border-t border-slate-100 dark:border-slate-700/80 flex items-center justify-between gap-2">
        {isActive && (
          <>
            <button
              onClick={() => onDeposit(goal)}
              className="btn-secondary text-xs py-1.5 px-3 flex-1 justify-center"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Savings
            </button>

            <button
              onClick={() => onPurchase(goal)}
              className="btn-primary text-xs py-1.5 px-3 justify-center"
              title="Mark as purchased"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              Buy
            </button>
          </>
        )}

        {isAchieved && (
          <button
            onClick={() => onPurchase(goal)}
            className="btn-primary text-xs py-2 w-full justify-center bg-emerald-600 hover:bg-emerald-700"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Complete Purchase 🎉
          </button>
        )}

        {(isPurchased || isCancelled) && (
          <div className="text-xs text-slate-400 italic py-1">
            {isPurchased ? 'Goal fulfilled and recorded.' : 'Goal was cancelled.'}
          </div>
        )}
      </div>
    </div>
  );
}
