import { useState, useEffect, useCallback } from 'react';
import { api, buildQuery } from '../../../lib/api';
import { useToast } from '../../../components/ui/Toast';

export type AccountType = 'BANK' | 'CREDIT_CARD' | 'CASH' | 'WALLET' | 'INVESTMENT' | 'LOAN' | 'OTHER';

export interface Account {
  id: string;
  userId: string;
  name: string;
  type: AccountType;
  balance: string;
  currency: string;
  includeInNetWorth: boolean;
  includeInJoint: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: { transactions: number };
}

export interface CreateAccountInput {
  name: string;
  type: AccountType;
  balance: string | number;
  currency?: string;
  includeInNetWorth?: boolean;
  includeInJoint?: boolean;
}

export interface UpdateAccountInput {
  name?: string;
  type?: AccountType;
  balance?: string | number;
  currency?: string;
  includeInNetWorth?: boolean;
  includeInJoint?: boolean;
  isActive?: boolean;
}

export function useAccounts() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const toast = useToast();

  const fetchAccounts = useCallback(async (includeArchived = false) => {
    try {
      setLoading(true);
      setError(null);
      const query = buildQuery({ includeArchived: includeArchived ? 'true' : undefined });
      const res = await api.get<{ data: Account[] }>(`/accounts${query}`);
      setAccounts(res.data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load accounts';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const createAccount = async (input: CreateAccountInput) => {
    try {
      const res = await api.post<{ data: Account }>('/accounts', input);
      setAccounts(prev => [res.data, ...prev]);
      toast.success(`Account "${res.data.name}" created successfully`);
      return res.data;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to create account';
      toast.error(msg);
      throw err;
    }
  };

  const updateAccount = async (id: string, input: UpdateAccountInput) => {
    try {
      const res = await api.patch<{ data: Account }>(`/accounts/${id}`, input);
      setAccounts(prev => prev.map(a => (a.id === id ? res.data : a)));
      toast.success(`Account updated successfully`);
      return res.data;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to update account';
      toast.error(msg);
      throw err;
    }
  };

  const deleteAccount = async (id: string) => {
    try {
      await api.delete(`/accounts/${id}`);
      setAccounts(prev => prev.filter(a => a.id !== id));
      toast.success('Account removed');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to delete account';
      toast.error(msg);
      throw err;
    }
  };

  return {
    accounts,
    loading,
    error,
    fetchAccounts,
    createAccount,
    updateAccount,
    deleteAccount,
  };
}
