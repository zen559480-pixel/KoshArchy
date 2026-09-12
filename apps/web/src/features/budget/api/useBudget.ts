import { useState, useEffect, useCallback } from 'react';
import { api, buildQuery } from '../../../lib/api';
import { useToast } from '../../../components/ui/Toast';

export interface BudgetItemEnriched {
  id: string;
  budgetId: string;
  categoryId: string;
  category: {
    id: string;
    name: string;
    color: string | null;
    icon?: string | null;
  };
  expectedAmount: string;
  actualAmount: string;
  remainingAmount: string;
  percentUsed: number;
  status: 'OK' | 'WARNING' | 'OVER';
  isFixed: boolean;
}

export interface UnbudgetedItem {
  categoryId: string;
  categoryName: string;
  color: string | null;
  actualAmount: string;
}

export interface BudgetSummary {
  totalBudgeted: string;
  totalSpentInBudget: string;
  totalUnbudgetedSpent: string;
  totalSpentOverall: string;
  remainingBudget: string;
  overallPercent: number;
}

export interface BudgetData {
  budget: { id: string; month: number; year: number } | null;
  items: BudgetItemEnriched[];
  unbudgetedItems: UnbudgetedItem[];
  summary: BudgetSummary;
}

export interface CreateBudgetInput {
  month: number;
  year: number;
  items?: Array<{ categoryId: string; expectedAmount: number | string; isFixed?: boolean }>;
}

export interface UpsertBudgetItemInput {
  categoryId: string;
  expectedAmount: number | string;
  isFixed?: boolean;
}

export interface CopyBudgetInput {
  fromMonth: number;
  fromYear: number;
  toMonth: number;
  toYear: number;
}

export function useBudget(initialMonth?: number, initialYear?: number) {
  const now = new Date();
  const [month, setMonth] = useState<number>(initialMonth || (now.getMonth() + 1));
  const [year, setYear]   = useState<number>(initialYear  || now.getFullYear());

  const [data, setData]       = useState<BudgetData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError]     = useState<string | null>(null);

  const toast = useToast();

  const fetchBudget = useCallback(async (m = month, y = year) => {
    try {
      setLoading(true);
      setError(null);
      const query = buildQuery({ month: m, year: y });
      const res = await api.get<{ data: BudgetData }>(`/budgets${query}`);
      setData(res.data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load budget';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [month, year, toast]);

  useEffect(() => {
    fetchBudget(month, year);
  }, [fetchBudget, month, year]);

  const prevMonth = () => {
    if (month === 1) {
      setMonth(12);
      setYear(y => y - 1);
    } else {
      setMonth(m => m - 1);
    }
  };

  const nextMonth = () => {
    if (month === 12) {
      setMonth(1);
      setYear(y => y + 1);
    } else {
      setMonth(m => m + 1);
    }
  };

  const setMonthYear = (m: number, y: number) => {
    setMonth(m);
    setYear(y);
  };

  const createBudget = async (input: CreateBudgetInput) => {
    try {
      await api.post('/budgets', input);
      toast.success('Budget created successfully');
      fetchBudget(input.month, input.year);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to create budget';
      toast.error(msg);
      throw err;
    }
  };

  const upsertItem = async (budgetId: string, input: UpsertBudgetItemInput) => {
    try {
      await api.patch(`/budgets/${budgetId}/items`, input);
      toast.success('Budget item saved');
      fetchBudget();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to save budget item';
      toast.error(msg);
      throw err;
    }
  };

  const deleteItem = async (itemId: string) => {
    try {
      await api.delete(`/budgets/items/${itemId}`);
      toast.success('Budget item removed');
      fetchBudget();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to delete budget item';
      toast.error(msg);
      throw err;
    }
  };

  const copyBudget = async (input: CopyBudgetInput) => {
    try {
      await api.post('/budgets/copy', input);
      toast.success('Budget successfully copied!');
      fetchBudget(input.toMonth, input.toYear);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to copy budget';
      toast.error(msg);
      throw err;
    }
  };

  return {
    data,
    month,
    year,
    loading,
    error,
    prevMonth,
    nextMonth,
    setMonthYear,
    fetchBudget,
    createBudget,
    upsertItem,
    deleteItem,
    copyBudget,
  };
}
