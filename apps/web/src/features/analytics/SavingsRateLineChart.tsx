import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import { Percent, Award, Target, Zap } from 'lucide-react';
import { MonthlyTrendItem } from './api/useAnalytics';
import { formatINR } from '../../lib/utils';

interface SavingsRateLineChartProps {
  data: MonthlyTrendItem[];
}

export function SavingsRateLineChart({ data }: SavingsRateLineChartProps) {
  if (!data || data.length === 0) {
    return null;
  }

  // Savings rate stats
  const rates = data.map((d) => d.savingsRate);
  const currentRate = rates[rates.length - 1] ?? 0;
  const avgRate = Math.round((rates.reduce((a, b) => a + b, 0) / rates.length) * 10) / 10;
  const peakRate = Math.max(...rates);

  return (
    <div className="card space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base flex items-center gap-2">
            <Percent className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            Savings Rate Trajectory
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Percentage of income saved over time compared against the 20% benchmark
          </p>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/50 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              Latest Month
            </p>
            <p className="text-sm font-bold font-mono text-slate-900 dark:text-white">
              {currentRate}%
            </p>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/50 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Target className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              Period Average
            </p>
            <p className="text-sm font-bold font-mono text-slate-900 dark:text-white">
              {avgRate}%
            </p>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/50 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <Award className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              Peak Month
            </p>
            <p className="text-sm font-bold font-mono text-amber-600 dark:text-amber-400">
              {peakRate}%
            </p>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="h-64 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 10, right: 15, left: -15, bottom: 0 }}
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
              tickFormatter={(val) => `${val}%`}
            />

            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const item = payload[0].payload as MonthlyTrendItem;
                  return (
                    <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl border border-slate-700 text-xs space-y-1.5 min-w-[150px]">
                      <p className="font-semibold text-slate-300 border-b border-slate-700 pb-1">
                        {item.label}
                      </p>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Savings Rate:</span>
                        <span className="font-bold text-indigo-400 font-mono">
                          {item.savingsRate}%
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-slate-400">Surplus:</span>
                        <span className="font-mono text-emerald-300">{formatINR(item.surplus)}</span>
                      </div>
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-slate-400">Income:</span>
                        <span className="font-mono text-slate-300">{formatINR(item.income)}</span>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />

            {/* Benchmark 20% Line */}
            <ReferenceLine
              y={20}
              stroke="#F59E0B"
              strokeDasharray="4 4"
              label={{
                value: '20% Target',
                position: 'insideTopRight',
                fill: '#F59E0B',
                fontSize: 10,
                fontWeight: 600,
              }}
            />

            <Line
              type="monotone"
              dataKey="savingsRate"
              stroke="#6366F1"
              strokeWidth={3}
              dot={{ r: 4, fill: '#6366F1', strokeWidth: 2, stroke: '#ffffff' }}
              activeDot={{ r: 6, fill: '#4F46E5', strokeWidth: 2, stroke: '#ffffff' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
