import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { BarChart3, TrendingUp, TrendingDown } from 'lucide-react';
import { MonthlyTrendItem } from './api/useAnalytics';
import { formatINR } from '../../lib/utils';

interface MonthlyBarChartProps {
  data: MonthlyTrendItem[];
  trendMonths: number;
  onTrendMonthsChange: (months: number) => void;
}

export function MonthlyBarChart({
  data,
  trendMonths,
  onTrendMonthsChange,
}: MonthlyBarChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="card flex flex-col items-center justify-center py-16 text-center">
        <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mb-3">
          <BarChart3 className="w-6 h-6" />
        </div>
        <p className="font-semibold text-slate-700 dark:text-slate-200 text-sm">
          No Trend Data Available
        </p>
        <p className="text-xs text-slate-400 mt-1 max-w-xs">
          Record transactions across multiple months to visualize trends.
        </p>
      </div>
    );
  }

  // Calculate summary metrics
  const totalIncome = data.reduce((acc, curr) => acc + curr.income, 0);
  const totalExpenses = data.reduce((acc, curr) => acc + curr.expenses, 0);
  const avgIncome = Math.round(totalIncome / data.length);
  const avgExpenses = Math.round(totalExpenses / data.length);

  return (
    <div className="card space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-brand-600 dark:text-brand-400" />
            Income vs Expense Comparison
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Side-by-side cash flow history over the last {trendMonths} months
          </p>
        </div>

        {/* Range Selector */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold self-start sm:self-auto">
          {[6, 12].map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => onTrendMonthsChange(m)}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                trendMonths === m
                  ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-400 shadow-sm font-bold'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {m} Months
            </button>
          ))}
        </div>
      </div>

      {/* Summary Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-2 gap-3 pt-1">
        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
              Avg Monthly Income
            </p>
            <p className="text-sm font-bold font-mono text-emerald-900 dark:text-emerald-200">
              {formatINR(avgIncome)}
            </p>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/50 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
            <TrendingDown className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-rose-700 dark:text-rose-400">
              Avg Monthly Expense
            </p>
            <p className="text-sm font-bold font-mono text-rose-900 dark:text-rose-200">
              {formatINR(avgExpenses)}
            </p>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="h-72 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
            barGap={6}
            barCategoryGap="25%"
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.6} />

            <XAxis
              dataKey="shortLabel"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: '#94a3b8' }}
            />

            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              tickFormatter={(val) => formatINR(val, { compact: true })}
            />

            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const item = payload[0].payload as MonthlyTrendItem;
                  const isSurplusPositive = item.surplus >= 0;

                  return (
                    <div className="bg-slate-900 text-white p-3.5 rounded-xl shadow-xl border border-slate-700 text-xs space-y-2 min-w-[170px]">
                      <p className="font-semibold text-slate-300 border-b border-slate-700 pb-1">
                        {item.label}
                      </p>
                      <div className="space-y-1">
                        <div className="flex justify-between items-center gap-3">
                          <span className="text-emerald-400 font-medium">Income:</span>
                          <span className="font-bold font-mono">{formatINR(item.income)}</span>
                        </div>
                        <div className="flex justify-between items-center gap-3">
                          <span className="text-rose-400 font-medium">Expenses:</span>
                          <span className="font-bold font-mono">{formatINR(item.expenses)}</span>
                        </div>
                        <div className="flex justify-between items-center gap-3 pt-1 border-t border-slate-800">
                          <span className="text-slate-400">Net Surplus:</span>
                          <span
                            className={`font-bold font-mono ${
                              isSurplusPositive ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                          >
                            {formatINR(item.surplus)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center gap-3 text-[11px] text-slate-400">
                          <span>Savings Rate:</span>
                          <span className="font-semibold text-indigo-300">
                            {item.savingsRate}%
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />

            <Legend
              verticalAlign="top"
              align="right"
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ paddingBottom: '12px', fontSize: '12px' }}
            />

            <Bar
              name="Income"
              dataKey="income"
              fill="#10B981"
              radius={[5, 5, 0, 0]}
              maxBarSize={38}
            />

            <Bar
              name="Expenses"
              dataKey="expenses"
              fill="#EF4444"
              radius={[5, 5, 0, 0]}
              maxBarSize={38}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
