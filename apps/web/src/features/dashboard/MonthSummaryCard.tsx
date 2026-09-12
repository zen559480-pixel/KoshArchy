import React from 'react';
import { Calendar, ArrowDownLeft, ArrowUpRight, PiggyBank } from 'lucide-react';
import { MonthlySummary, CategorySpending } from './api/useDashboard';
import { formatINR, formatMonthYear, formatPercent, cn } from '../../lib/utils';
import { CategoryBadge } from '../../components/ui/CategoryBadge';

interface MonthSummaryCardProps {
  summary: MonthlySummary | null;
  categories: CategorySpending[];
  loading: boolean;
}

export function MonthSummaryCard({ summary, categories, loading }: MonthSummaryCardProps) {
  const now = new Date();
  const currentMonthYear = formatMonthYear(now.getMonth() + 1, now.getFullYear());

  if (loading || !summary) {
    return (
      <div className="card h-64 animate-pulse bg-slate-100 dark:bg-slate-800" />
    );
  }

  const incomeVal   = parseFloat(summary.income) || 0;
  const expenseVal  = parseFloat(summary.expenses) || 0;
  const surplusVal  = parseFloat(summary.surplus) || 0;
  const savingsRate = summary.savingsRate || 0;

  return (
    <div className="card flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand-50 dark:bg-red-950/40 text-brand-600 dark:text-red-400 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                This Month's Cash Flow
              </h3>
              <p className="text-xs text-slate-400">{currentMonthYear}</p>
            </div>
          </div>

          <div
            className={cn(
              'px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1 border',
              savingsRate >= 20
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/40 text-emerald-700 dark:text-emerald-400'
                : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/40 text-amber-700 dark:text-amber-400'
            )}
          >
            <PiggyBank className="w-3.5 h-3.5" />
            {formatPercent(savingsRate)} Saved
          </div>
        </div>

        {/* Income / Expense / Surplus Grid */}
        <div className="grid grid-cols-3 gap-2.5 my-3 p-3 bg-slate-50 dark:bg-[#13131b] rounded-xl border border-slate-100 dark:border-[#20202c]">
          <div>
            <div className="text-[11px] font-medium text-slate-400 flex items-center gap-1 mb-0.5">
              <ArrowDownLeft className="w-3 h-3 text-emerald-500" />
              Income
            </div>
            <div className="text-sm sm:text-base font-bold font-mono text-emerald-600 dark:text-emerald-400 truncate">
              {formatINR(incomeVal)}
            </div>
          </div>

          <div>
            <div className="text-[11px] font-medium text-slate-400 flex items-center gap-1 mb-0.5">
              <ArrowUpRight className="w-3 h-3 text-rose-500" />
              Expenses
            </div>
            <div className="text-sm sm:text-base font-bold font-mono text-rose-600 dark:text-rose-400 truncate">
              {formatINR(expenseVal)}
            </div>
          </div>

          <div>
            <div className="text-[11px] font-medium text-slate-400 mb-0.5">
              Net Surplus
            </div>
            <div
              className={cn(
                'text-sm sm:text-base font-bold font-mono truncate',
                surplusVal >= 0
                  ? 'text-slate-900 dark:text-slate-100'
                  : 'text-rose-600 dark:text-rose-400'
              )}
            >
              {formatINR(surplusVal)}
            </div>
          </div>
        </div>

        {/* Top Spending Categories preview */}
        {categories.length > 0 && (
          <div className="mt-3.5">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Top Expenses This Month
            </div>
            <div className="flex flex-wrap gap-1.5">
              {categories.slice(0, 3).map(cat => (
                <div
                  key={cat.name}
                  className="flex items-center gap-1.5 px-2.5 py-1 bg-white dark:bg-[#13131b] rounded-lg border border-slate-200 dark:border-[#20202c] text-xs text-slate-700 dark:text-slate-200"
                >
                  <CategoryBadge name={cat.name} color={cat.color} />
                  <span className="font-mono font-bold text-[11px]">
                    {formatINR(parseFloat(cat.value))}
                  </span>
                  <span className="text-[10px] text-slate-400">({cat.percentage}%)</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="pt-3 border-t border-slate-100 dark:border-[#1e1e28] text-xs text-slate-400 mt-2">
        {surplusVal > 0
          ? `You have a surplus of ${formatINR(surplusVal)} this month.`
          : expenseVal === 0
          ? 'No expenses logged this month yet.'
          : `Deficit of ${formatINR(Math.abs(surplusVal))} this month.`}
      </div>
    </div>
  );
}
