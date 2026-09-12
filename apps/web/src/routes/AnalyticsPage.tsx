import React, { useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  PieChart,
  Calendar,
  RefreshCw,
  TrendingDown,
  PiggyBank,
  Percent,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import { useAnalytics } from '../features/analytics/api/useAnalytics';
import { CategoryDonutChart } from '../features/analytics/CategoryDonutChart';
import { MonthlyBarChart } from '../features/analytics/MonthlyBarChart';
import { SavingsRateLineChart } from '../features/analytics/SavingsRateLineChart';
import { ForecastChart } from '../features/analytics/ForecastChart';
import { AnnualOverview } from '../features/analytics/AnnualOverview';
import { formatINR } from '../lib/utils';

type AnalyticsTab = 'monthly' | 'trends' | 'annual';

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState<AnalyticsTab>('monthly');

  const {
    selectedMonth,
    setSelectedMonth,
    selectedYear,
    setSelectedYear,
    trendMonths,
    setTrendMonths,
    annualYear,
    setAnnualYear,
    forecastDays,
    setForecastDays,

    monthlySummary,
    categorySpending,
    trends,
    annual,
    forecast,
    goals,

    loading,
    refreshAll,
  } = useAnalytics();

  // Navigation handlers for monthly tab
  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <BarChart3 className="w-6 h-6 text-brand-600 dark:text-brand-400" />
            Analytics & Insights
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Deep financial intelligence, savings rate trajectories, and multi-month cash flow projections
          </p>
        </div>

        <button
          type="button"
          onClick={refreshAll}
          disabled={loading}
          className="btn-secondary self-start sm:self-auto flex items-center gap-1.5 text-xs font-semibold px-3 py-2"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('monthly')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'monthly'
              ? 'bg-brand-600 text-white shadow-md shadow-brand-500/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <PieChart className="w-3.5 h-3.5" />
          Monthly Analysis
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('trends')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'trends'
              ? 'bg-brand-600 text-white shadow-md shadow-brand-500/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          Trends & Forecast
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('annual')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'annual'
              ? 'bg-brand-600 text-white shadow-md shadow-brand-500/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          Annual Overview
        </button>
      </div>

      {/* TAB 1: MONTHLY ANALYSIS */}
      {activeTab === 'monthly' && (
        <div className="space-y-6">
          {/* Month Selector Bar */}
          <div className="card p-3 flex items-center justify-between">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2">
              <span className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                {MONTH_NAMES[selectedMonth - 1]} {selectedYear}
              </span>
            </div>

            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Monthly KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Income */}
            <div className="card p-4 space-y-1.5 border-l-4 border-l-emerald-500">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-semibold">Monthly Income</span>
                <TrendingUp className="w-4 h-4 text-emerald-500" />
              </div>
              <p className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
                {formatINR(monthlySummary?.income ?? 0)}
              </p>
              <p className="text-[11px] text-slate-400">
                Recorded revenue this month
              </p>
            </div>

            {/* Expenses */}
            <div className="card p-4 space-y-1.5 border-l-4 border-l-rose-500">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-semibold">Monthly Expenses</span>
                <TrendingDown className="w-4 h-4 text-rose-500" />
              </div>
              <p className="text-xl font-bold font-mono text-rose-600 dark:text-rose-400">
                {formatINR(monthlySummary?.expenses ?? 0)}
              </p>
              <p className="text-[11px] text-slate-400">
                Total outflows across all accounts
              </p>
            </div>

            {/* Net Surplus */}
            <div className="card p-4 space-y-1.5 border-l-4 border-l-brand-500">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-semibold">Net Cash Surplus</span>
                <PiggyBank className="w-4 h-4 text-brand-500" />
              </div>
              <p
                className={`text-xl font-bold font-mono ${
                  (monthlySummary?.surplus ?? 0) >= 0
                    ? 'text-brand-600 dark:text-brand-400'
                    : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                {formatINR(monthlySummary?.surplus ?? 0)}
              </p>
              <p className="text-[11px] text-slate-400">
                {(monthlySummary?.surplus ?? 0) >= 0
                  ? 'Retained savings for goals'
                  : 'Deficit spending detected'}
              </p>
            </div>

            {/* Savings Rate */}
            <div className="card p-4 space-y-1.5 border-l-4 border-l-amber-500">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-semibold">Savings Rate</span>
                <Percent className="w-4 h-4 text-amber-500" />
              </div>
              <div className="flex items-center gap-2">
                <p className="text-xl font-bold font-mono text-amber-600 dark:text-amber-400">
                  {monthlySummary?.savingsRate ?? 0}%
                </p>
                {(monthlySummary?.savingsRate ?? 0) >= 20 ? (
                  <span className="flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-semibold">
                    <ShieldCheck className="w-3 h-3" /> Target Met
                  </span>
                ) : (
                  <span className="flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-semibold">
                    Target 20%
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400">
                Portion of income retained
              </p>
            </div>
          </div>

          {/* Category Donut Breakdown */}
          <CategoryDonutChart
            data={categorySpending}
            totalExpenses={monthlySummary?.expenses ?? 0}
          />
        </div>
      )}

      {/* TAB 2: TRENDS & FORECAST */}
      {activeTab === 'trends' && (
        <div className="space-y-6">
          {/* Income vs Expense Bar Chart */}
          <MonthlyBarChart
            data={trends}
            trendMonths={trendMonths}
            onTrendMonthsChange={setTrendMonths}
          />

          {/* Savings Rate Line Chart */}
          <SavingsRateLineChart data={trends} />

          {/* 90-Day Cash Flow Forecast */}
          <ForecastChart
            forecast={forecast}
            goals={goals}
            forecastDays={forecastDays}
            onForecastDaysChange={setForecastDays}
          />
        </div>
      )}

      {/* TAB 3: ANNUAL OVERVIEW */}
      {activeTab === 'annual' && (
        <AnnualOverview
          data={annual}
          annualYear={annualYear}
          onYearChange={setAnnualYear}
        />
      )}
    </div>
  );
}
