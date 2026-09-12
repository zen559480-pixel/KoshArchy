import { useState, useEffect, useCallback } from 'react';
import { api, buildQuery } from '../../../lib/api';
import { useToast } from '../../../components/ui/Toast';

export type TransactionType = 'INCOME' | 'EXPENSE' | 'TRANSFER';

export interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  amount: string;
  date: string;
  description: string | null;
  notes: string | null;
  accountId: string | null;
  categoryId: string | null;
  fromAccountId: string | null;
  toAccountId: string | null;
  account?: { id: string; name: string; type: string } | null;
  category?: { id: string; name: string; color: string | null } | null;
  fromAccount?: { id: string; name: string } | null;
  toAccount?: { id: string; name: string } | null;
  createdAt: string;
}

export interface TransactionFilterParams {
  type?: TransactionType | '';
  accountId?: string;
  categoryId?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateTransactionInput {
  type: TransactionType;
  amount: number | string;
  date: string;
  description?: string;
  notes?: string;
  accountId?: string;
  categoryId?: string;
  fromAccountId?: string;
  toAccountId?: string;
}

export interface UpdateTransactionInput {
  amount?: number | string;
  date?: string;
  description?: string | null;
  notes?: string | null;
  categoryId?: string | null;
  accountId?: string | null;
  fromAccountId?: string | null;
  toAccountId?: string | null;
}

export function useTransactions(initialFilters: TransactionFilterParams = {}) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [pagination, setPagination]     = useState<PaginationInfo>({
    total: 0,
    page: initialFilters.page || 1,
    limit: initialFilters.limit || 20,
    totalPages: 1,
  });
  const [filters, setFilters]           = useState<TransactionFilterParams>(initialFilters);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState<string | null>(null);
  const toast = useToast();

  const fetchTransactions = useCallback(async (customFilters?: TransactionFilterParams) => {
    try {
      setLoading(true);
      setError(null);

      const active = customFilters || filters;
      const query = buildQuery({
        type:       active.type || undefined,
        accountId:  active.accountId || undefined,
        categoryId: active.categoryId || undefined,
        dateFrom:   active.dateFrom || undefined,
        dateTo:     active.dateTo || undefined,
        search:     active.search || undefined,
        page:       active.page || 1,
        limit:      active.limit || 20,
      });

      const res = await api.get<{
        data: Transaction[];
        pagination: PaginationInfo;
      }>(`/transactions${query}`);

      setTransactions(res.data);
      setPagination(res.pagination);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch transactions';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [filters, toast]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const updateFilters = (newFilters: Partial<TransactionFilterParams>) => {
    setFilters(prev => {
      const updated = { ...prev, ...newFilters };
      // Reset to page 1 if changing search/filters other than page
      if (newFilters.page === undefined) {
        updated.page = 1;
      }
      return updated;
    });
  };

  const createTransaction = async (input: CreateTransactionInput) => {
    try {
      const res = await api.post<{ data: Transaction }>('/transactions', input);
      toast.success('Transaction recorded successfully');
      fetchTransactions();
      return res.data;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to record transaction';
      toast.error(msg);
      throw err;
    }
  };

  const updateTransaction = async (id: string, input: UpdateTransactionInput) => {
    try {
      const res = await api.patch<{ data: Transaction }>(`/transactions/${id}`, input);
      toast.success('Transaction updated');
      fetchTransactions();
      return res.data;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to update transaction';
      toast.error(msg);
      throw err;
    }
  };

  const deleteTransaction = async (id: string) => {
    try {
      await api.delete(`/transactions/${id}`);
      toast.success('Transaction deleted');
      fetchTransactions();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to delete transaction';
      toast.error(msg);
      throw err;
    }
  };

  return {
    transactions,
    pagination,
    filters,
    loading,
    error,
    updateFilters,
    fetchTransactions,
    createTransaction,
    updateTransaction,
    deleteTransaction,
  };
}
