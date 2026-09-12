import { useState, useEffect, useCallback } from 'react';
import { api, buildQuery } from '../../../lib/api';
import { useToast } from '../../../components/ui/Toast';
import { Account } from '../../accounts/api/useAccounts';
import { Transaction } from '../../transactions/api/useTransactions';

export interface FluidMoneyData {
  totalAssets: string;
  totalLiabilities: string;
  reservedForGoals: string;
  upcomingExpenses: string;
  fluidMoney: string;
}

export interface ForecastPoint {
  date: string;
  openingBalance: string;
  expectedIncome: string;
  expectedExpenses: string;
  plannedPurchases: string;
  closingBalance: string;
}

export interface MonthlySummary {
  period: { start: string; end: string };
  income: string;
  expenses: string;
  surplus: string;
  savingsRate: number;
}

export interface CategorySpending {
  name: string;
  color: string | null;
  value: string;
  percentage: number;
}

export interface UpcomingPayment {
  id: string;
  type: 'INCOME' | 'EXPENSE';
  amount: string;
  description: string;
  frequency: string;
  nextOccurrence: string;
}

export function useDashboard() {
  const [fluidMoney, setFluidMoney]               = useState<FluidMoneyData | null>(null);
  const [forecast, setForecast]                   = useState<ForecastPoint[]>([]);
  const [summary, setSummary]                     = useState<MonthlySummary | null>(null);
  const [categorySpending, setCategorySpending]   = useState<CategorySpending[]>([]);
  const [upcomingPayments, setUpcomingPayments]   = useState<UpcomingPayment[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts]                   = useState<Account[]>([]);
  const [forecastDays, setForecastDays]           = useState<number>(30);
  const [loading, setLoading]                     = useState<boolean>(true);
  const [error, setError]                         = useState<string | null>(null);

  const toast = useToast();

  const fetchDashboardData = useCallback(async (days = forecastDays) => {
    try {
      setLoading(true);
      setError(null);

      const now = new Date();
      const currentMonth = now.getMonth() + 1;
      const currentYear  = now.getFullYear();

      const [
        fluidRes,
        forecastRes,
        analyticsRes,
        upcomingRes,
        txnsRes,
        accountsRes,
      ] = await Promise.all([
        api.get<{ data: FluidMoneyData }>('/dashboard/fluid-money'),
        api.get<{ data: ForecastPoint[] }>(`/dashboard/forecast?days=${days}`),
        api.get<{ data: { summary: MonthlySummary; categorySpending: CategorySpending[] } }>(
          `/analytics/dashboard?month=${currentMonth}&year=${currentYear}`
        ),
        api.get<{ data: UpcomingPayment[] }>('/dashboard/upcoming?days=14'),
        api.get<{ data: Transaction[] }>('/transactions?limit=5'),
        api.get<{ data: Account[] }>('/accounts'),
      ]);

      setFluidMoney(fluidRes.data);
      setForecast(forecastRes.data);
      setSummary(analyticsRes.data.summary);
      setCategorySpending(analyticsRes.data.categorySpending);
      setUpcomingPayments(upcomingRes.data);
      setRecentTransactions(txnsRes.data);
      setAccounts(accountsRes.data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load dashboard data';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [forecastDays, toast]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const changeForecastDays = (days: number) => {
    setForecastDays(days);
    fetchDashboardData(days);
  };

  return {
    fluidMoney,
    forecast,
    summary,
    categorySpending,
    upcomingPayments,
    recentTransactions,
    accounts,
    forecastDays,
    loading,
    error,
    refresh: fetchDashboardData,
    changeForecastDays,
  };
}
