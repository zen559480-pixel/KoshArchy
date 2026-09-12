import { useState, useEffect, useCallback } from 'react';
import { api } from '../../../lib/api';
import { useToast } from '../../../components/ui/Toast';

export interface MonthlySummary {
  period: { start: string; end: string };
  income: number;
  expenses: number;
  surplus: number;
  savingsRate: number;
}

export interface CategorySpending {
  name: string;
  color: string | null;
  value: number;
  percentage: number;
}

export interface MonthlyTrendItem {
  month: number;
  year: number;
  label: string;
  shortLabel: string;
  income: number;
  expenses: number;
  surplus: number;
  savingsRate: number;
}

export interface AnnualSummary {
  year: number;
  totalIncome: number;
  totalExpenses: number;
  totalSurplus: number;
  overallSavingsRate: number;
  averageMonthlyIncome: number;
  averageMonthlyExpenses: number;
  averageMonthlySurplus: number;
  monthlyBreakdown: MonthlyTrendItem[];
  categoryBreakdown: {
    name: string;
    color: string | null;
    total: number;
    percentage: number;
  }[];
}

export interface ForecastPoint {
  date: string;
  openingBalance: string | number;
  expectedIncome: string | number;
  expectedExpenses: string | number;
  plannedPurchases: string | number;
  closingBalance: string | number;
}

export interface GoalMilestone {
  id: string;
  name: string;
  targetAmount: string | number;
  currentAmount: string | number;
  targetDate: string;
  status: string;
  category?: { name: string; color: string | null } | null;
}

export function useAnalytics() {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());
  const [trendMonths, setTrendMonths] = useState<number>(6);
  const [annualYear, setAnnualYear] = useState<number>(now.getFullYear());
  const [forecastDays, setForecastDays] = useState<number>(90);

  const [monthlySummary, setMonthlySummary] = useState<MonthlySummary | null>(null);
  const [categorySpending, setCategorySpending] = useState<CategorySpending[]>([]);
  const [trends, setTrends] = useState<MonthlyTrendItem[]>([]);
  const [annual, setAnnual] = useState<AnnualSummary | null>(null);
  const [forecast, setForecast] = useState<ForecastPoint[]>([]);
  const [goals, setGoals] = useState<GoalMilestone[]>([]);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const toast = useToast();

  // 1. Fetch Monthly Analytics (Summary + Spending by Category)
  const fetchMonthlyData = useCallback(async (month: number, year: number) => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get<{
        data: {
          summary: {
            period: { start: string; end: string };
            income: number | string;
            expenses: number | string;
            surplus: number | string;
            savingsRate: number;
          };
          categorySpending: {
            name: string;
            color: string | null;
            value: number | string;
            percentage: number;
          }[];
        };
      }>(`/analytics/dashboard?month=${month}&year=${year}`);

      const s = res.data.summary;
      setMonthlySummary({
        period: s.period,
        income: Number(s.income) || 0,
        expenses: Number(s.expenses) || 0,
        surplus: Number(s.surplus) || 0,
        savingsRate: Number(s.savingsRate) || 0,
      });

      const cats = (res.data.categorySpending || []).map((c) => ({
        name: c.name,
        color: c.color,
        value: Number(c.value) || 0,
        percentage: Number(c.percentage) || 0,
      }));
      setCategorySpending(cats);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load monthly analytics';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // 2. Fetch Trends Analytics (6, 12, or 24 months)
  const fetchTrendsData = useCallback(async (months: number) => {
    try {
      const res = await api.get<{
        data: {
          trends: {
            month: number;
            year: number;
            label: string;
            shortLabel: string;
            income: number | string;
            expenses: number | string;
            surplus: number | string;
            savingsRate: number;
          }[];
        };
      }>(`/analytics/trends?months=${months}`);

      const formatted = (res.data.trends || []).map((t) => ({
        ...t,
        income: Number(t.income) || 0,
        expenses: Number(t.expenses) || 0,
        surplus: Number(t.surplus) || 0,
        savingsRate: Number(t.savingsRate) || 0,
      }));
      setTrends(formatted);
    } catch (err) {
      console.error('Failed to load trend data:', err);
    }
  }, []);

  // 3. Fetch Annual Overview
  const fetchAnnualData = useCallback(async (year: number) => {
    try {
      const res = await api.get<{
        data: {
          annual: AnnualSummary;
        };
      }>(`/analytics/annual?year=${year}`);

      setAnnual(res.data.annual);
    } catch (err) {
      console.error('Failed to load annual summary:', err);
    }
  }, []);

  // 4. Fetch Forecast & Goals
  const fetchForecastData = useCallback(async (days: number) => {
    try {
      const [forecastRes, goalsRes] = await Promise.all([
        api.get<{ data: ForecastPoint[] }>(`/dashboard/forecast?days=${days}`),
        api.get<{ data: GoalMilestone[] }>('/goals'),
      ]);

      setForecast(forecastRes.data || []);
      const activeGoals = (goalsRes.data || []).filter(
        (g) => g.status === 'IN_PROGRESS' && g.targetDate
      );
      setGoals(activeGoals);
    } catch (err) {
      console.error('Failed to load forecast data:', err);
    }
  }, []);

  // Load on change
  useEffect(() => {
    fetchMonthlyData(selectedMonth, selectedYear);
  }, [selectedMonth, selectedYear, fetchMonthlyData]);

  useEffect(() => {
    fetchTrendsData(trendMonths);
  }, [trendMonths, fetchTrendsData]);

  useEffect(() => {
    fetchAnnualData(annualYear);
  }, [annualYear, fetchAnnualData]);

  useEffect(() => {
    fetchForecastData(forecastDays);
  }, [forecastDays, fetchForecastData]);

  const refreshAll = useCallback(() => {
    fetchMonthlyData(selectedMonth, selectedYear);
    fetchTrendsData(trendMonths);
    fetchAnnualData(annualYear);
    fetchForecastData(forecastDays);
  }, [
    selectedMonth,
    selectedYear,
    trendMonths,
    annualYear,
    forecastDays,
    fetchMonthlyData,
    fetchTrendsData,
    fetchAnnualData,
    fetchForecastData,
  ]);

  return {
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
    error,
    refreshAll,
    fetchMonthlyData,
    fetchTrendsData,
    fetchAnnualData,
    fetchForecastData,
  };
}
