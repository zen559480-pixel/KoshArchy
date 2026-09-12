/// <reference types="vite/client" />
import { getToken, logout } from './auth';

const BASE_URL = import.meta.env.VITE_API_URL ?? '/api';

// ─── Types ────────────────────────────────────────────────────────
export interface ApiError {
  error: string;
  details?: Array<{ field: string; message: string }>;
}

// ─── Core fetch wrapper ───────────────────────────────────────────
async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string>),
  };

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  // Auto-logout on 401
  if (res.status === 401) {
    logout();
    throw new Error('Session expired. Please log in again.');
  }

  // Handle empty body (204 No Content, 201 with no body, etc.)
  const contentType = res.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    if (!res.ok) throw new Error(`Request failed: ${res.status} ${res.statusText}`);
    return undefined as unknown as T;
  }

  const data = await res.json();

  if (!res.ok) {
    const err = data as ApiError;
    throw new Error(err.error || `Request failed: ${res.status}`);
  }

  return data as T;
}

// ─── HTTP Methods ─────────────────────────────────────────────────
export const api = {
  get: <T>(path: string) =>
    apiFetch<T>(path),

  post: <T>(path: string, body: unknown) =>
    apiFetch<T>(path, {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  patch: <T>(path: string, body: unknown) =>
    apiFetch<T>(path, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),

  put: <T>(path: string, body: unknown) =>
    apiFetch<T>(path, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),

  delete: <T>(path: string) =>
    apiFetch<T>(path, { method: 'DELETE' }),
};

// ─── Query string builder ─────────────────────────────────────────
/**
 * Builds a query string from an object, omitting undefined/null values.
 * e.g. buildQuery({ month: 9, year: 2026 }) → "?month=9&year=2026"
 */
export function buildQuery(params: Record<string, string | number | boolean | undefined | null>): string {
  const entries = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== null && v !== ''
  );
  if (entries.length === 0) return '';
  return '?' + new URLSearchParams(entries.map(([k, v]) => [k, String(v)])).toString();
}
