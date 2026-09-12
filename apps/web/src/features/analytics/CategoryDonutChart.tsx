import React, { useState } from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from 'recharts';
import { PieChart as PieChartIcon } from 'lucide-react';
import { CategorySpending } from './api/useAnalytics';
import { formatINR } from '../../lib/utils';

interface CategoryDonutChartProps {
  data: CategorySpending[];
  totalExpenses: number;
}

const PALETTE = [
  '#6366F1', // Indigo
  '#EC4899', // Pink
  '#F59E0B', // Amber
  '#10B981', // Emerald
  '#3B82F6', // Blue
  '#8B5CF6', // Purple
  '#06B6D4', // Cyan
  '#EF4444', // Rose
  '#14B8A6', // Teal
  '#F97316', // Orange
];

export function CategoryDonutChart({ data, totalExpenses }: CategoryDonutChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="card flex flex-col items-center justify-center py-16 text-center">
        <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mb-3">
          <PieChartIcon className="w-6 h-6" />
        </div>
        <p className="font-semibold text-slate-700 dark:text-slate-200 text-sm">
          No Spending Recorded
        </p>
        <p className="text-xs text-slate-400 mt-1 max-w-xs">
          There are no expense transactions logged for this selected period.
        </p>
      </div>
    );
  }

  const activeCategory = activeIndex !== null ? data[activeIndex] : null;

  return (
    <div className="card space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base flex items-center gap-2">
            <PieChartIcon className="w-4 h-4 text-brand-600 dark:text-brand-400" />
            Spending by Category
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Expense distribution across categories for the period
          </p>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
          {data.length} {data.length === 1 ? 'Category' : 'Categories'}
        </span>
      </div>

      {/* Grid: Donut + Legend */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Donut Container with Center Label */}
        <div className="lg:col-span-6 relative flex items-center justify-center h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                innerRadius={68}
                outerRadius={95}
                paddingAngle={3}
                onMouseEnter={(_, index) => setActiveIndex(index)}
                onMouseLeave={() => setActiveIndex(null)}
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${entry.name}-${index}`}
                    fill={entry.color || PALETTE[index % PALETTE.length]}
                    className="transition-all duration-200 cursor-pointer outline-none"
                    strokeWidth={activeIndex === index ? 3 : 1}
                    stroke={activeIndex === index ? '#ffffff' : 'transparent'}
                  />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const item = payload[0].payload as CategorySpending;
                    return (
                      <div className="bg-slate-900 text-white px-3 py-2 rounded-xl shadow-xl border border-slate-700 text-xs space-y-1">
                        <p className="font-semibold text-slate-200">{item.name}</p>
                        <p className="text-sm font-bold text-emerald-400 font-mono">
                          {formatINR(item.value)}
                        </p>
                        <p className="text-[11px] text-slate-400">{item.percentage}% of total</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
            </PieChart>
          </ResponsiveContainer>

          {/* Center Callout */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
              {activeCategory ? activeCategory.name : 'Total Spent'}
            </span>
            <span className="text-base font-bold font-mono text-slate-900 dark:text-white mt-0.5">
              {formatINR(activeCategory ? activeCategory.value : totalExpenses)}
            </span>
            <span className="text-[10px] text-slate-400 mt-0.5">
              {activeCategory ? `${activeCategory.percentage}%` : '100%'}
            </span>
          </div>
        </div>

        {/* Legend / Category Breakdown Table */}
        <div className="lg:col-span-6 space-y-3 max-h-64 overflow-y-auto pr-1">
          {data.map((cat, index) => {
            const color = cat.color || PALETTE[index % PALETTE.length];
            const isHovered = activeIndex === index;

            return (
              <div
                key={cat.name}
                onMouseEnter={() => setActiveIndex(index)}
                onMouseLeave={() => setActiveIndex(null)}
                className={`flex items-center justify-between p-2 rounded-xl transition-all cursor-pointer ${
                  isHovered
                    ? 'bg-slate-100 dark:bg-slate-800'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-850'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                    {cat.name}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-right flex-shrink-0">
                  <div className="text-right">
                    <p className="text-xs font-bold font-mono text-slate-900 dark:text-slate-100">
                      {formatINR(cat.value)}
                    </p>
                    <p className="text-[10px] text-slate-400">{cat.percentage}%</p>
                  </div>

                  {/* Micro Progress Bar */}
                  <div className="w-12 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden hidden sm:block">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.min(cat.percentage, 100)}%`,
                        backgroundColor: color,
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
