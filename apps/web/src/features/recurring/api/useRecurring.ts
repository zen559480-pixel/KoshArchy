import { useState, useEffect, useCallback } from 'react';
import { api, buildQuery } from '../../../lib/api';
import { useToast } from '../../../components/ui/Toast';

export type FrequencyType =
  | 'ONE_TIME'
  | 'WEEKLY'
  | 'BIWEEKLY'
  | 'MONTHLY'
  | 'QUARTERLY'
  | 'YEARLY';

export interface RecurringTransaction {
  id: string;
  userId: string;
  type: 'INCOME' | 'EXPENSE';
  amount: string | number;
  description: string;
  frequency: FrequencyType;
  startDate: string;
  endDate: string | null;
  nextOccurrence: string;
  accountId: string | null;
  account?: {
    id: string;
    name: string;
    type: string;
    balance: string | number;
  } | null;
  categoryId: string | null;
  category?: {
    id: string;
    name: string;
    color: string | null;
    icon: string | null;
  } | null;
  _count?: {
    transactions: number;
  };
}

export interface CreateRecurringInput {
  type: 'INCOME' | 'EXPENSE';
  amount: number;
  description: string;
  frequency: FrequencyType;
  startDate: string;
  endDate?: string | null;
  accountId?: string | null;
  categoryId?: string | null;
}

export interface UpdateRecurringInput {
  type?: 'INCOME' | 'EXPENSE';
  amount?: number;
  description?: string;
  frequency?: FrequencyType;
  startDate?: string;
  endDate?: string | null;
  nextOccurrence?: string;
  accountId?: string | null;
  categoryId?: string | null;
}

export interface MarkPaidInput {
  date?: string;
  accountId?: string | null;
  amount?: number;
}

export function useRecurring() {
  const [recurringList, setRecurringList] = useState<RecurringTransaction[]>([]);
  const [filterType, setFilterType] = useState<'ALL' | 'INCOME' | 'EXPENSE'>('ALL');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ACTIVE');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const toast = useToast();

  const fetchRecurring = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const query = buildQuery({
        type: filterType !== 'ALL' ? filterType : undefined,
        status: filterStatus !== 'ALL' ? filterStatus : undefined,
      });

      const res = await api.get<{ data: RecurringTransaction[] }>(`/recurring${query}`);
      setRecurringList(res.data || []);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch recurring transactions';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [filterType, filterStatus, toast]);

  useEffect(() => {
    fetchRecurring();
  }, [fetchRecurring]);

  const createRecurring = async (input: CreateRecurringInput) => {
    try {
      const res = await api.post<{ data: RecurringTransaction }>('/recurring', input);
      toast.success('Recurring rule created successfully');
      await fetchRecurring();
      return res.data;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to create recurring rule';
      toast.error(msg);
      throw err;
    }
  };

  const updateRecurring = async (id: string, input: UpdateRecurringInput) => {
    try {
      const res = await api.patch<{ data: RecurringTransaction }>(`/recurring/${id}`, input);
      toast.success('Recurring rule updated successfully');
      await fetchRecurring();
      return res.data;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to update recurring rule';
      toast.error(msg);
      throw err;
    }
  };

  const markPaid = async (id: string, input?: MarkPaidInput) => {
    try {
      const res = await api.post<{
        message: string;
        data: {
          transaction: unknown;
          recurring: RecurringTransaction;
        };
      }>(`/recurring/${id}/mark-paid`, input || {});

      toast.success('Payment recorded and schedule advanced!');
      await fetchRecurring();
      return res.data;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to record payment';
      toast.error(msg);
      throw err;
    }
  };

  const deactivateRecurring = async (id: string) => {
    try {
      await api.patch(`/recurring/${id}/deactivate`, {});
      toast.success('Recurring schedule deactivated');
      await fetchRecurring();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to deactivate schedule';
      toast.error(msg);
      throw err;
    }
  };

  const deleteRecurring = async (id: string) => {
    try {
      await api.delete(`/recurring/${id}`);
      toast.success('Recurring rule deleted successfully');
      await fetchRecurring();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to delete recurring rule';
      toast.error(msg);
      throw err;
    }
  };

  // Filter list by searchQuery
  const filteredList = recurringList.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.description.toLowerCase().includes(q) ||
      item.account?.name.toLowerCase().includes(q) ||
      item.category?.name.toLowerCase().includes(q) ||
      item.frequency.toLowerCase().includes(q)
    );
  });

  return {
    recurringList: filteredList,
    totalCount: recurringList.length,
    loading,
    error,
    filterType,
    setFilterType,
    filterStatus,
    setFilterStatus,
    searchQuery,
    setSearchQuery,
    refresh: fetchRecurring,
    createRecurring,
    updateRecurring,
    markPaid,
    deactivateRecurring,
    deleteRecurring,
  };
}
