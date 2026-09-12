import React from 'react';
import {
  Calendar,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Percent,
  Layers,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { AnnualSummary } from './api/useAnalytics';
import { formatINR } from '../../lib/utils';

interface AnnualOverviewProps {
  data: AnnualSummary | null;
  annualYear: number;
  onYearChange: (year: number) => void;
}

export function AnnualOverview({
  data,
  annualYear,
  onYearChange,
}: AnnualOverviewProps) {
  if (!data) {
    return (
      <div className="card flex flex-col items-center justify-center py-16 text-center">
        <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mb-3">
          <Calendar className="w-6 h-6" />
        </div>
        <p className="font-semibold text-slate-700 dark:text-slate-200 text-sm">
          No Annual Data Found
        </p>
        <p className="text-xs text-slate-400 mt-1 max-w-xs">
          Select another year or log transactions for {annualYear}.
        </p>
      </div>
    );
  }

  const {
    totalIncome,
    totalExpenses,
    totalSurplus,
    overallSavingsRate,
    averageMonthlyIncome,
    averageMonthlyExpenses,
    averageMonthlySurplus,
    monthlyBreakdown,
    categoryBreakdown,
  } = data;

  const currentYear = new Date().getFullYear();

  return (
    <div className="space-y-6">
      {/* Year Picker Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-slate-900 dark:text-slate-100 text-lg">
            Annual Financial Summary
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Full 12-month consolidated overview and category distribution for {annualYear}
          </p>
        </div>

        {/* Year Navigator */}
        <div className="flex items-center gap-2 self-start sm:self-auto bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => onYearChange(annualYear - 1)}
            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-750 transition-all"
            title="Previous Year"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="font-bold text-sm px-3 text-slate-900 dark:text-slate-100">
            {annualYear}
          </span>
          <button
            type="button"
            disabled={annualYear >= currentYear + 2}
            onClick={() => onYearChange(annualYear + 1)}
            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-750 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            title="Next Year"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 4 Big Annual Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Annual Income */}
        <div className="card p-4 space-y-2 border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Total Income</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
            {formatINR(totalIncome)}
          </p>
          <p className="text-[11px] text-slate-400">
            Avg: <span className="font-mono font-medium text-slate-600 dark:text-slate-300">{formatINR(averageMonthlyIncome)}</span> / mo
          </p>
        </div>

        {/* Total Annual Expenses */}
        <div className="card p-4 space-y-2 border-l-4 border-l-rose-500">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Total Expenses</span>
            <TrendingDown className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-xl font-bold font-mono text-rose-600 dark:text-rose-400">
            {formatINR(totalExpenses)}
          </p>
          <p className="text-[11px] text-slate-400">
            Avg: <span className="font-mono font-medium text-slate-600 dark:text-slate-300">{formatINR(averageMonthlyExpenses)}</span> / mo
          </p>
        </div>

        {/* Net Annual Savings */}
        <div className="card p-4 space-y-2 border-l-4 border-l-brand-500">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Net Annual Surplus</span>
            <PiggyBank className="w-4 h-4 text-brand-500" />
          </div>
          <p
            className={`text-xl font-bold font-mono ${
              totalSurplus >= 0
                ? 'text-brand-600 dark:text-brand-400'
                : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {formatINR(totalSurplus)}
          </p>
          <p className="text-[11px] text-slate-400">
            Avg: <span className="font-mono font-medium text-slate-600 dark:text-slate-300">{formatINR(averageMonthlySurplus)}</span> / mo
          </p>
        </div>

        {/* Overall Savings Rate */}
        <div className="card p-4 space-y-2 border-l-4 border-l-amber-500">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Overall Savings Rate</span>
            <Percent className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-xl font-bold font-mono text-amber-600 dark:text-amber-400">
            {overallSavingsRate}%
          </p>
          <p className="text-[11px] text-slate-400">
            Target benchmark: <span className="font-semibold text-slate-600 dark:text-slate-300">20%</span>
          </p>
        </div>
      </div>

      {/* Grid: 12-Month Table + Annual Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 12-Month Table */}
        <div className="card lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
              12-Month Cash Flow Breakdown
            </h4>
            <span className="text-xs text-slate-400">{annualYear}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400">
                  <th className="pb-2.5 font-semibold">Month</th>
                  <th className="pb-2.5 font-semibold text-right">Income</th>
                  <th className="pb-2.5 font-semibold text-right">Expenses</th>
                  <th className="pb-2.5 font-semibold text-right">Surplus</th>
                  <th className="pb-2.5 font-semibold text-right">Savings Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                {monthlyBreakdown.map((m) => {
                  const hasData = m.income > 0 || m.expenses > 0;
                  const isPositive = m.surplus >= 0;

                  return (
                    <tr
                      key={m.month}
                      className="hover:bg-slate-50 dark:hover:bg-slate-850/60 transition-colors"
                    >
                      <td className="py-2.5 font-sans font-medium text-slate-800 dark:text-slate-200">
                        {m.shortLabel}
                      </td>
                      <td className="py-2.5 text-right text-emerald-600 dark:text-emerald-400 font-medium">
                        {hasData ? formatINR(m.income) : '—'}
                      </td>
                      <td className="py-2.5 text-right text-rose-600 dark:text-rose-400 font-medium">
                        {hasData ? formatINR(m.expenses) : '—'}
                      </td>
                      <td
                        className={`py-2.5 text-right font-semibold ${
                          hasData
                            ? isPositive
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-rose-600 dark:text-rose-400'
                            : 'text-slate-400'
                        }`}
                      >
                        {hasData ? formatINR(m.surplus) : '—'}
                      </td>
                      <td className="py-2.5 text-right font-sans">
                        {hasData ? (
                          <span
                            className={`inline-block px-1.5 py-0.5 rounded text-[11px] font-semibold ${
                              m.savingsRate >= 20
                                ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                                : m.savingsRate > 0
                                ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                                : 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                            }`}
                          >
                            {m.savingsRate}%
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Annual Spending Categories */}
        <div className="card lg:col-span-4 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2">
              <Layers className="w-4 h-4 text-brand-600 dark:text-brand-400" />
              Annual Categories
            </h4>
            <span className="text-xs text-slate-400">
              {categoryBreakdown.length} Categories
            </span>
          </div>

          {categoryBreakdown.length === 0 ? (
            <p className="text-xs text-slate-400 py-8 text-center">
              No category expense records found for {annualYear}.
            </p>
          ) : (
            <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
              {categoryBreakdown.map((cat) => (
                <div key={cat.name} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {cat.name}
                    </span>
                    <span className="font-bold font-mono text-slate-900 dark:text-white">
                      {formatINR(cat.total)}
                    </span>
                  </div>

                  {/* Percentage bar */}
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.min(cat.percentage, 100)}%`,
                          backgroundColor: cat.color || '#6366F1',
                        }}
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono w-8 text-right">
                      {cat.percentage}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
