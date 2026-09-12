import { useState, useEffect, useCallback } from 'react';
import { api, buildQuery } from '../../../lib/api';
import { getToken } from '../../../lib/auth';
import { useToast } from '../../../components/ui/Toast';

export interface UserSettings {
  id: string;
  email: string;
  name: string | null;
  currency: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateSettingsInput {
  name?: string;
  currency?: string;
  currentPassword?: string;
  newPassword?: string;
}

export interface ExportTransactionsFilter {
  dateFrom?: string;
  dateTo?: string;
  type?: string;
  categoryId?: string;
  accountId?: string;
}

const BASE_URL = import.meta.env.VITE_API_URL ?? '/api';

export function useSettings() {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState<boolean>(false);

  const toast = useToast();

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get<{ data: UserSettings }>('/settings');
      setSettings(res.data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch settings';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const updateSettings = async (input: UpdateSettingsInput) => {
    try {
      const res = await api.patch<{ message: string; data: UserSettings }>('/settings', input);
      setSettings(res.data);
      toast.success(res.message || 'Settings updated successfully');
      return res.data;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to update settings';
      toast.error(msg);
      throw err;
    }
  };

  const resetData = async (confirmation: string, password: string) => {
    try {
      const res = await api.post<{ message: string }>('/settings/reset-data', {
        confirmation,
        password,
      });
      toast.success(res.message || 'Financial data reset successfully');
      return res;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to reset financial data';
      toast.error(msg);
      throw err;
    }
  };

  const downloadTransactionsCsv = async (filter: ExportTransactionsFilter = {}) => {
    try {
      setExporting(true);
      const query = buildQuery({
        dateFrom: filter.dateFrom,
        dateTo: filter.dateTo,
        type: filter.type && filter.type !== 'ALL' ? filter.type : undefined,
        categoryId: filter.categoryId,
        accountId: filter.accountId,
      });

      const token = getToken();
      const res = await fetch(`${BASE_URL}/export/transactions${query}`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!res.ok) {
        throw new Error('Failed to generate transactions export');
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `kosharchy-transactions-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      toast.success('Transactions CSV downloaded');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Export download failed';
      toast.error(msg);
    } finally {
      setExporting(false);
    }
  };

  const downloadAnnualCsv = async (year: number) => {
    try {
      setExporting(true);
      const token = getToken();
      const res = await fetch(`${BASE_URL}/export/annual?year=${year}`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!res.ok) {
        throw new Error('Failed to generate annual report export');
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `kosharchy-annual-report-${year}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      toast.success(`Annual Report (${year}) CSV downloaded`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Export download failed';
      toast.error(msg);
    } finally {
      setExporting(false);
    }
  };

  return {
    settings,
    loading,
    error,
    exporting,
    refresh: fetchSettings,
    updateSettings,
    resetData,
    downloadTransactionsCsv,
    downloadAnnualCsv,
  };
}
