import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import {
  TrendingUp,
  AlertTriangle,
  Target,
  ArrowDownRight,
  ShieldCheck,
} from 'lucide-react';
import { ForecastPoint, GoalMilestone } from './api/useAnalytics';
import { formatINR, formatDate } from '../../lib/utils';

interface ForecastChartProps {
  forecast: ForecastPoint[];
  goals: GoalMilestone[];
  forecastDays: number;
  onForecastDaysChange: (days: number) => void;
}

export function ForecastChart({
  forecast,
  goals,
  forecastDays,
  onForecastDaysChange,
}: ForecastChartProps) {
  if (!forecast || forecast.length === 0) {
    return (
      <div className="card flex flex-col items-center justify-center py-16 text-center">
        <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mb-3">
          <TrendingUp className="w-6 h-6" />
        </div>
        <p className="font-semibold text-slate-700 dark:text-slate-200 text-sm">
          No Forecast Available
        </p>
        <p className="text-xs text-slate-400 mt-1 max-w-xs">
          Ensure liquid accounts are configured to project future cash flows.
        </p>
      </div>
    );
  }

  // Format data for chart
  const chartData = forecast.map((pt) => ({
    date: pt.date,
    dateDisplay: formatDate(pt.date, { relative: false }),
    balance: parseFloat(String(pt.closingBalance)),
    income: parseFloat(String(pt.expectedIncome)),
    expense: parseFloat(String(pt.expectedExpenses)),
    purchases: parseFloat(String(pt.plannedPurchases)),
  }));

  // Insights
  const balances = chartData.map((d) => d.balance);
  const currentBalance = balances[0] ?? 0;
  const lowestBalance = Math.min(...balances);
  const lowestPoint = chartData.find((d) => d.balance === lowestBalance);
  const hasNegativeBalance = lowestBalance < 0;
  const netDelta = (balances[balances.length - 1] ?? 0) - currentBalance;

  // Map goals with target dates within forecast window
  const forecastEndDate = new Date(chartData[chartData.length - 1]?.date || '');
  const upcomingGoalsInRange = goals.filter((g) => {
    if (!g.targetDate) return false;
    const gDate = new Date(g.targetDate);
    return gDate <= forecastEndDate && gDate >= new Date();
  });

  return (
    <div className="card space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-brand-600 dark:text-brand-400" />
              90-Day Cash Flow Projection
            </h3>
            {hasNegativeBalance ? (
              <span className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 font-semibold border border-rose-200 dark:border-rose-900">
                <AlertTriangle className="w-3 h-3" />
                Negative Dip
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 font-semibold border border-emerald-200 dark:border-emerald-900">
                <ShieldCheck className="w-3 h-3" />
                Healthy Solvency
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Forward simulation tracking recurring bills, income schedules, and target goal purchases
          </p>
        </div>

        {/* Range Selector */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold self-start sm:self-auto">
          {[30, 60, 90].map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => onForecastDaysChange(d)}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                forecastDays === d
                  ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-400 shadow-sm font-bold'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {d} Days
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/50">
          <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
            Current Fluid Balance
          </p>
          <p className="text-sm font-bold font-mono text-slate-900 dark:text-white mt-0.5">
            {formatINR(currentBalance)}
          </p>
        </div>

        <div
          className={`p-3 rounded-xl border ${
            hasNegativeBalance
              ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/50'
              : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200/60 dark:border-slate-700/50'
          }`}
        >
          <div className="flex items-center justify-between">
            <p
              className={`text-[11px] font-medium ${
                hasNegativeBalance
                  ? 'text-rose-600 dark:text-rose-400'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              Lowest Projected Point
            </p>
            {hasNegativeBalance && <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />}
          </div>
          <p
            className={`text-sm font-bold font-mono mt-0.5 ${
              hasNegativeBalance
                ? 'text-rose-600 dark:text-rose-400'
                : 'text-slate-900 dark:text-white'
            }`}
          >
            {formatINR(lowestBalance)}
          </p>
          {lowestPoint && (
            <p className="text-[10px] text-slate-400 mt-0.5">
              Projected on {lowestPoint.dateDisplay}
            </p>
          )}
        </div>

        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/50">
          <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
            Net Projected Flow
          </p>
          <p
            className={`text-sm font-bold font-mono mt-0.5 ${
              netDelta >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {netDelta >= 0 ? '+' : ''}
            {formatINR(netDelta)}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">Over next {forecastDays} days</p>
        </div>
      </div>

      {/* Upcoming Goal Milestones Warning/Info */}
      {upcomingGoalsInRange.length > 0 && (
        <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 flex flex-wrap items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5 font-semibold text-indigo-700 dark:text-indigo-300">
            <Target className="w-3.5 h-3.5" />
            <span>Target Goal Milestones in Range:</span>
          </div>
          {upcomingGoalsInRange.map((g) => (
            <span
              key={g.id}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-800 text-slate-800 dark:text-slate-200 text-[11px]"
            >
              <span className="font-medium">{g.name}</span>
              <span className="text-slate-400">({formatDate(g.targetDate, { relative: false })})</span>
            </span>
          ))}
        </div>
      )}

      {/* Chart */}
      <div className="h-72 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 15, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="forecastGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#4F46E5" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.6} />

            <XAxis
              dataKey="dateDisplay"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              interval={forecastDays === 90 ? 14 : forecastDays === 60 ? 9 : 5}
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
                  const data = payload[0].payload;
                  return (
                    <div className="bg-slate-900 text-white p-3.5 rounded-xl shadow-xl border border-slate-700 text-xs space-y-1.5 min-w-[170px]">
                      <p className="font-semibold text-slate-300 border-b border-slate-700 pb-1">
                        {data.dateDisplay}
                      </p>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Closing Balance:</span>
                        <span
                          className={`font-bold font-mono ${
                            data.balance >= 0 ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {formatINR(data.balance)}
                        </span>
                      </div>
                      {data.income > 0 && (
                        <p className="text-emerald-300 text-[11px]">
                          + Income: {formatINR(data.income)}
                        </p>
                      )}
                      {data.expense > 0 && (
                        <p className="text-rose-300 text-[11px]">
                          - Expense: {formatINR(data.expense)}
                        </p>
                      )}
                      {data.purchases > 0 && (
                        <p className="text-amber-300 text-[11px]">
                          - Planned Purchase: {formatINR(data.purchases)}
                        </p>
                      )}
                    </div>
                  );
                }
                return null;
              }}
            />

            {/* Zero reference line */}
            <ReferenceLine y={0} stroke="#EF4444" strokeDasharray="3 3" strokeWidth={1} />

            {/* Upcoming Goals Markers */}
            {upcomingGoalsInRange.map((g) => {
              const formattedDate = formatDate(g.targetDate, { relative: false });
              return (
                <ReferenceLine
                  key={g.id}
                  x={formattedDate}
                  stroke="#F59E0B"
                  strokeDasharray="2 2"
                  label={{
                    value: g.name,
                    position: 'insideTop',
                    fill: '#F59E0B',
                    fontSize: 9,
                  }}
                />
              );
            })}

            <Area
              type="monotone"
              dataKey="balance"
              stroke="#4F46E5"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#forecastGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
