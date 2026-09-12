import { useState, useEffect, useCallback } from 'react';
import { api, buildQuery } from '../../../lib/api';
import { useToast } from '../../../components/ui/Toast';

export type GoalStatus = 'ACTIVE' | 'ACHIEVED' | 'PURCHASED' | 'CANCELLED';
export type Priority   = 'ESSENTIAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface Goal {
  id: string;
  userId: string;
  name: string;
  targetAmount: string;
  savedAmount: string;
  targetDate: string | null;
  status: GoalStatus;
  priority: Priority;
  notes: string | null;
  accountId: string | null;
  account?: { id: string; name: string; type: string; balance?: string } | null;
  transactions?: Array<{ id: string; amount: string; date: string; description: string | null }>;
  progressPercent: number;
  remainingAmount: string;
  estimatedMonthsLeft: number | null;
  estimatedDate: string | null;
  isOverdue: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateGoalInput {
  name: string;
  targetAmount: number | string;
  savedAmount?: number | string;
  targetDate?: string | null;
  priority?: Priority;
  status?: GoalStatus;
  accountId?: string | null;
  notes?: string | null;
}

export interface UpdateGoalInput {
  name?: string;
  targetAmount?: number | string;
  savedAmount?: number | string;
  targetDate?: string | null;
  priority?: Priority;
  status?: GoalStatus;
  accountId?: string | null;
  notes?: string | null;
}

export interface DepositGoalInput {
  amount: number | string;
  accountId?: string | null;
  createTransaction?: boolean;
  date?: string;
  notes?: string | null;
}

export interface PurchaseGoalInput {
  purchaseAmount?: number | string;
  accountId: string;
  categoryId?: string | null;
  date?: string;
  description?: string | null;
  notes?: string | null;
}

export function useGoals(statusFilter?: string) {
  const [goals, setGoals]     = useState<Goal[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError]     = useState<string | null>(null);
  const toast = useToast();

  const fetchGoals = useCallback(async (customStatus = statusFilter) => {
    try {
      setLoading(true);
      setError(null);
      const query = buildQuery({ status: customStatus && customStatus !== 'ALL' ? customStatus : undefined });
      const res = await api.get<{ data: Goal[] }>(`/goals${query}`);
      setGoals(res.data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load goals';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, toast]);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  const createGoal = async (input: CreateGoalInput) => {
    try {
      const res = await api.post<{ data: Goal }>('/goals', input);
      toast.success(`Goal "${res.data.name}" created! 🎯`);
      fetchGoals();
      return res.data;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to create goal';
      toast.error(msg);
      throw err;
    }
  };

  const updateGoal = async (id: string, input: UpdateGoalInput) => {
    try {
      const res = await api.patch<{ data: Goal }>(`/goals/${id}`, input);
      toast.success(`Goal "${res.data.name}" updated`);
      fetchGoals();
      return res.data;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to update goal';
      toast.error(msg);
      throw err;
    }
  };

  const depositGoal = async (id: string, input: DepositGoalInput) => {
    try {
      const res = await api.post<{ data: Goal }>(`/goals/${id}/deposit`, input);
      toast.success(`Added savings towards "${res.data.name}"! 💰`);
      fetchGoals();
      return res.data;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Deposit failed';
      toast.error(msg);
      throw err;
    }
  };

  const purchaseGoal = async (id: string, input: PurchaseGoalInput) => {
    try {
      const res = await api.post<{ data: { goal: Goal } }>(`/goals/${id}/purchase`, input);
      toast.success(`Congratulations on achieving and purchasing your goal! 🎉🥳`);
      fetchGoals();
      return res.data.goal;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Purchase failed';
      toast.error(msg);
      throw err;
    }
  };

  const cancelGoal = async (id: string) => {
    try {
      await api.patch(`/goals/${id}/cancel`, {});
      toast.info('Goal cancelled');
      fetchGoals();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to cancel goal';
      toast.error(msg);
      throw err;
    }
  };

  const deleteGoal = async (id: string) => {
    try {
      await api.delete(`/goals/${id}`);
      toast.success('Goal removed');
      fetchGoals();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to delete goal';
      toast.error(msg);
      throw err;
    }
  };

  return {
    goals,
    loading,
    error,
    fetchGoals,
    createGoal,
    updateGoal,
    depositGoal,
    purchaseGoal,
    cancelGoal,
    deleteGoal,
  };
}
