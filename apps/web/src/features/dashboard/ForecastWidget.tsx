import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { LineChart, AlertTriangle } from 'lucide-react';
import { ForecastPoint } from './api/useDashboard';
import { formatINR, formatDate } from '../../lib/utils';

interface ForecastWidgetProps {
  forecast: ForecastPoint[];
  forecastDays: number;
  onDaysChange: (days: number) => void;
  loading: boolean;
}

export function ForecastWidget({
  forecast,
  forecastDays,
  onDaysChange,
  loading,
}: ForecastWidgetProps) {
  if (loading && forecast.length === 0) {
    return (
      <div className="card h-72 animate-pulse bg-slate-100 dark:bg-slate-800" />
    );
  }

  // Format data for Recharts
  const chartData = forecast.map(pt => ({
    date: pt.date,
    dateDisplay: formatDate(pt.date, { relative: false }),
    balance: parseFloat(pt.closingBalance),
    income: parseFloat(pt.expectedIncome),
    expense: parseFloat(pt.expectedExpenses),
    purchases: parseFloat(pt.plannedPurchases),
  }));

  const hasNegativeBalance = chartData.some(d => d.balance < 0);

  return (
    <div className="card space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <LineChart className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2">
              <span>Cash Flow Forecast</span>
              {hasNegativeBalance && (
                <span className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 font-semibold border border-rose-200">
                  <AlertTriangle className="w-3 h-3" />
                  Dip Warning
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-400">
              Projected balance considering scheduled bills and planned goals
            </p>
          </div>
        </div>

        {/* 30d vs 90d selector */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-[#14141c] p-1 rounded-xl text-xs font-semibold self-start sm:self-auto border border-transparent dark:border-[#20202c]">
          <button
            type="button"
            onClick={() => onDaysChange(30)}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              forecastDays === 30
                ? 'bg-white dark:bg-[#222230] text-brand-600 dark:text-red-400 shadow-sm font-bold'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            30 Days
          </button>
          <button
            type="button"
            onClick={() => onDaysChange(90)}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              forecastDays === 90
                ? 'bg-white dark:bg-[#222230] text-brand-600 dark:text-red-400 shadow-sm font-bold'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            90 Days
          </button>
        </div>
      </div>

      {/* Chart */}
      <div className="h-64 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366F1" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#6366F1" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.6} />

            <XAxis
              dataKey="dateDisplay"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              interval={forecastDays === 90 ? 14 : 5}
            />

            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              tickFormatter={val => formatINR(val, { compact: true })}
            />

            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl border border-slate-700 text-xs space-y-1">
                      <p className="font-semibold text-slate-300">{data.dateDisplay}</p>
                      <p className="text-sm font-bold font-mono text-emerald-400">
                        {formatINR(data.balance)}
                      </p>
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
                          - Goal Purchase: {formatINR(data.purchases)}
                        </p>
                      )}
                    </div>
                  );
                }
                return null;
              }}
            />

            <Area
              type="monotone"
              dataKey="balance"
              stroke="#4F46E5"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#balanceGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
