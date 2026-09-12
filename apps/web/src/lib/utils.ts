import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// ─── Tailwind class merging utility ──────────────────────────────
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ─── Currency Formatting ──────────────────────────────────────────
/**
 * Formats a number as Indian Rupee with ₹ symbol.
 * Uses Indian numbering system (lakhs, crores).
 * e.g. 150000 → "₹1,50,000"
 */
export function formatINR(amount: number | string, options?: { compact?: boolean }): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '₹0';

  if (options?.compact) {
    if (Math.abs(num) >= 10_000_000) {
      return `₹${(num / 10_000_000).toFixed(1)}Cr`;
    }
    if (Math.abs(num) >= 100_000) {
      return `₹${(num / 100_000).toFixed(1)}L`;
    }
    if (Math.abs(num) >= 1_000) {
      return `₹${(num / 1_000).toFixed(1)}K`;
    }
  }

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(num);
}

/**
 * Returns the sign-aware formatted amount.
 * Positive amounts show "+" prefix for income display.
 */
export function formatINRSigned(amount: number | string, type: 'INCOME' | 'EXPENSE' | 'TRANSFER'): string {
  const formatted = formatINR(amount);
  if (type === 'INCOME') return `+${formatted}`;
  if (type === 'EXPENSE') return `-${formatted}`;
  return formatted;
}

// ─── Date Formatting ──────────────────────────────────────────────
/**
 * Formats a date for display in the UI.
 * e.g. "12 Sep 2026", "Today", "Yesterday"
 */
export function formatDate(date: string | Date, options?: { relative?: boolean }): string {
  const d = typeof date === 'string' ? new Date(date) : date;

  if (options?.relative) {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (isSameDay(d, today)) return 'Today';
    if (isSameDay(d, yesterday)) return 'Yesterday';
  }

  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(d);
}

/**
 * Formats a date as ISO date string for <input type="date">
 * e.g. "2026-09-12"
 */
export function toDateInputValue(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString().slice(0, 10);
}

/**
 * Returns "September 2026" for a given month/year.
 */
export function formatMonthYear(month: number, year: number): string {
  return new Date(year, month - 1, 1).toLocaleDateString('en-IN', {
    month: 'long',
    year: 'numeric',
  });
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

// ─── Number Formatting ────────────────────────────────────────────
/**
 * Formats a percentage with 1 decimal place.
 * e.g. 45.5312 → "45.5%"
 */
export function formatPercent(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Clamps a value between min and max.
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

// ─── Color Utilities ──────────────────────────────────────────────
/** Returns a Tailwind text color class based on transaction type */
export function getAmountColor(type: 'INCOME' | 'EXPENSE' | 'TRANSFER'): string {
  return type === 'INCOME'
    ? 'text-income'
    : type === 'EXPENSE'
    ? 'text-expense'
    : 'text-slate-500 dark:text-slate-400';
}

/** Returns a priority badge color */
export function getPriorityColor(priority: 'ESSENTIAL' | 'HIGH' | 'MEDIUM' | 'LOW'): string {
  const map: Record<string, string> = {
    ESSENTIAL: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
    HIGH:      'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    MEDIUM:    'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    LOW:       'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  };
  return map[priority] ?? 'bg-slate-100 text-slate-700';
}

/** Returns account type icon emoji */
export function getAccountIcon(type: string): string {
  const map: Record<string, string> = {
    BANK:        '🏦',
    CREDIT_CARD: '💳',
    CASH:        '💵',
    WALLET:      '👛',
    INVESTMENT:  '📈',
    LOAN:        '🏠',
    OTHER:       '📂',
  };
  return map[type] ?? '📂';
}

// ─── String Utilities ─────────────────────────────────────────────
export function capitalize(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return `${str.slice(0, maxLength - 1)}…`;
}
