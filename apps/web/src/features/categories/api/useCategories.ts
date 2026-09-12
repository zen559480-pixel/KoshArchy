import { useState, useEffect, useCallback } from 'react';
import { api, buildQuery } from '../../../lib/api';
import { useToast } from '../../../components/ui/Toast';

export type CategoryType = 'INCOME' | 'EXPENSE';

export interface Category {
  id: string;
  userId: string;
  name: string;
  type: CategoryType;
  color: string | null;
  icon: string | null;
  isArchived: boolean;
  _count?: { transactions: number };
}

export interface CreateCategoryInput {
  name: string;
  type: CategoryType;
  color?: string | null;
  icon?: string | null;
}

export interface UpdateCategoryInput {
  name?: string;
  type?: CategoryType;
  color?: string | null;
  icon?: string | null;
  isArchived?: boolean;
}

export function useCategories(typeFilter?: CategoryType) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const toast = useToast();

  const fetchCategories = useCallback(async (includeArchived = false) => {
    try {
      setLoading(true);
      setError(null);
      const query = buildQuery({
        type: typeFilter,
        includeArchived: includeArchived ? 'true' : undefined,
      });
      const res = await api.get<{ data: Category[] }>(`/categories${query}`);
      setCategories(res.data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load categories';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [typeFilter, toast]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const createCategory = async (input: CreateCategoryInput) => {
    try {
      const res = await api.post<{ data: Category }>('/categories', input);
      setCategories(prev => [...prev, res.data].sort((a, b) => a.name.localeCompare(b.name)));
      toast.success(`Category "${res.data.name}" added`);
      return res.data;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to create category';
      toast.error(msg);
      throw err;
    }
  };

  const updateCategory = async (id: string, input: UpdateCategoryInput) => {
    try {
      const res = await api.patch<{ data: Category }>(`/categories/${id}`, input);
      setCategories(prev => prev.map(c => (c.id === id ? res.data : c)));
      toast.success('Category updated');
      return res.data;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to update category';
      toast.error(msg);
      throw err;
    }
  };

  const deleteCategory = async (id: string) => {
    try {
      await api.delete(`/categories/${id}`);
      setCategories(prev => prev.filter(c => c.id !== id));
      toast.success('Category archived');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to archive category';
      toast.error(msg);
      throw err;
    }
  };

  return {
    categories,
    loading,
    error,
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
  };
}
