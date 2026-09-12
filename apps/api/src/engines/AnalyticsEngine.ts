import { Transaction } from '@prisma/client';
import Decimal from 'decimal.js';
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns';
import { prisma } from '../lib/prisma';

export interface MonthlyTrendItem {
  month: number;
  year: number;
  label: string;
  shortLabel: string;
  income: number;
  expenses: number;
  surplus: number;
  savingsRate: number;
}

export interface AnnualSummary {
  year: number;
  totalIncome: number;
  totalExpenses: number;
  totalSurplus: number;
  overallSavingsRate: number;
  averageMonthlyIncome: number;
  averageMonthlyExpenses: number;
  averageMonthlySurplus: number;
  monthlyBreakdown: MonthlyTrendItem[];
  categoryBreakdown: {
    name: string;
    color: string | null;
    total: number;
    percentage: number;
  }[];
}

export class AnalyticsEngine {
  /**
   * Calculates total income, expenses, surplus, and savings rate for a given month.
   */
  static async getMonthlySummary(userId: string, targetDate: Date) {
    const startDate = startOfMonth(targetDate);
    const endDate = endOfMonth(targetDate);

    const aggregations = await prisma.transaction.groupBy({
      by: ['type'],
      where: {
        userId,
        isDeleted: false,
        date: { gte: startDate, lte: endDate },
        type: { in: ['INCOME', 'EXPENSE'] }, // Exclude TRANSFER
      },
      _sum: { amount: true },
    });

    let totalIncome = new Decimal(0);
    let totalExpense = new Decimal(0);

    aggregations.forEach((agg: { type: string; _sum: { amount: unknown } }) => {
      const amount = new Decimal(String(agg._sum.amount ?? '0'));
      if (agg.type === 'INCOME') totalIncome = amount;
      if (agg.type === 'EXPENSE') totalExpense = amount;
    });

    const surplus = totalIncome.minus(totalExpense);

    let savingsRate = new Decimal(0);
    if (totalIncome.greaterThan(0)) {
      savingsRate = surplus.dividedBy(totalIncome).times(100);
    }

    return {
      period: { start: startDate, end: endDate },
      income: totalIncome.toNumber(),
      expenses: totalExpense.toNumber(),
      surplus: surplus.toNumber(),
      savingsRate: savingsRate.toDecimalPlaces(1).toNumber(),
    };
  }

  /**
   * Aggregates expenses by category for charting (Recharts Donut).
   * Returns array sorted largest-to-smallest with percentage.
   */
  static async getSpendingByCategory(userId: string, targetDate: Date) {
    const startDate = startOfMonth(targetDate);
    const endDate = endOfMonth(targetDate);

    const expenses = await prisma.transaction.findMany({
      where: {
        userId,
        isDeleted: false,
        type: 'EXPENSE',
        date: { gte: startDate, lte: endDate },
        categoryId: { not: null },
      },
      include: { category: true },
    });

    const categoryMap = new Map<string, { name: string; color: string | null; total: Decimal }>();
    let totalExpenses = new Decimal(0);

    expenses.forEach((txn: Transaction & { category: { name: string; color: string | null } | null }) => {
      const catId = txn.categoryId!;
      const amount = new Decimal(txn.amount.toString());

      if (!categoryMap.has(catId)) {
        categoryMap.set(catId, {
          name: txn.category?.name ?? 'Uncategorized',
          color: txn.category?.color ?? null,
          total: new Decimal(0),
        });
      }

      const current = categoryMap.get(catId)!;
      current.total = current.total.plus(amount);
      totalExpenses = totalExpenses.plus(amount);
    });

    return Array.from(categoryMap.values())
      .map((cat) => ({
        name: cat.name,
        color: cat.color,
        value: cat.total.toNumber(),
        percentage: totalExpenses.greaterThan(0)
          ? cat.total.dividedBy(totalExpenses).times(100).toDecimalPlaces(1).toNumber()
          : 0,
      }))
      .sort((a, b) => b.value - a.value);
  }

  /**
   * Returns last N months income/expense/surplus/savingsRate trend array.
   */
  static async getMonthlyTrend(
    userId: string,
    months: number = 6,
    referenceDate: Date = new Date()
  ): Promise<MonthlyTrendItem[]> {
    const monthsCount = Math.max(1, Math.min(months, 24));
    const targetMonths: { start: Date; end: Date; date: Date }[] = [];

    for (let i = monthsCount - 1; i >= 0; i--) {
      const d = subMonths(referenceDate, i);
      targetMonths.push({
        start: startOfMonth(d),
        end: endOfMonth(d),
        date: d,
      });
    }

    const rangeStart = targetMonths[0].start;
    const rangeEnd = targetMonths[targetMonths.length - 1].end;

    const transactions = await prisma.transaction.findMany({
      where: {
        userId,
        isDeleted: false,
        type: { in: ['INCOME', 'EXPENSE'] },
        date: { gte: rangeStart, lte: rangeEnd },
      },
      select: {
        amount: true,
        type: true,
        date: true,
      },
    });

    return targetMonths.map(({ start, end, date }) => {
      let income = new Decimal(0);
      let expenses = new Decimal(0);

      for (const txn of transactions) {
        if (txn.date >= start && txn.date <= end) {
          const amt = new Decimal(txn.amount.toString());
          if (txn.type === 'INCOME') income = income.plus(amt);
          if (txn.type === 'EXPENSE') expenses = expenses.plus(amt);
        }
      }

      const surplus = income.minus(expenses);
      let savingsRate = new Decimal(0);
      if (income.greaterThan(0)) {
        savingsRate = surplus.dividedBy(income).times(100);
      }

      return {
        month: date.getMonth() + 1,
        year: date.getFullYear(),
        label: format(date, 'MMM yyyy'),
        shortLabel: format(date, 'MMM'),
        income: income.toNumber(),
        expenses: expenses.toNumber(),
        surplus: surplus.toNumber(),
        savingsRate: savingsRate.toDecimalPlaces(1).toNumber(),
      };
    });
  }

  /**
   * Returns comprehensive annual summary for a given year.
   */
  static async getAnnualSummary(userId: string, year: number): Promise<AnnualSummary> {
    const yearStart = new Date(year, 0, 1, 0, 0, 0, 0);
    const yearEnd = new Date(year, 11, 31, 23, 59, 59, 999);

    const transactions = await prisma.transaction.findMany({
      where: {
        userId,
        isDeleted: false,
        type: { in: ['INCOME', 'EXPENSE'] },
        date: { gte: yearStart, lte: yearEnd },
      },
      include: {
        category: true,
      },
    });

    let totalIncome = new Decimal(0);
    let totalExpenses = new Decimal(0);
    const categoryMap = new Map<string, { name: string; color: string | null; total: Decimal }>();

    // 12 months array
    const monthlyBreakdown: MonthlyTrendItem[] = [];

    for (let m = 0; m < 12; m++) {
      const mDate = new Date(year, m, 1);
      const mStart = startOfMonth(mDate);
      const mEnd = endOfMonth(mDate);

      let mIncome = new Decimal(0);
      let mExpenses = new Decimal(0);

      for (const txn of transactions) {
        if (txn.date >= mStart && txn.date <= mEnd) {
          const amt = new Decimal(txn.amount.toString());
          if (txn.type === 'INCOME') {
            mIncome = mIncome.plus(amt);
          } else if (txn.type === 'EXPENSE') {
            mExpenses = mExpenses.plus(amt);
          }
        }
      }

      const mSurplus = mIncome.minus(mExpenses);
      let mSavingsRate = new Decimal(0);
      if (mIncome.greaterThan(0)) {
        mSavingsRate = mSurplus.dividedBy(mIncome).times(100);
      }

      monthlyBreakdown.push({
        month: m + 1,
        year,
        label: format(mDate, 'MMM yyyy'),
        shortLabel: format(mDate, 'MMM'),
        income: mIncome.toNumber(),
        expenses: mExpenses.toNumber(),
        surplus: mSurplus.toNumber(),
        savingsRate: mSavingsRate.toDecimalPlaces(1).toNumber(),
      });
    }

    // Aggregate overall annual stats and category breakdown
    for (const txn of transactions) {
      const amt = new Decimal(txn.amount.toString());
      if (txn.type === 'INCOME') {
        totalIncome = totalIncome.plus(amt);
      } else if (txn.type === 'EXPENSE') {
        totalExpenses = totalExpenses.plus(amt);

        const catId = txn.categoryId ?? 'uncategorized';
        const catName = txn.category?.name ?? 'Uncategorized';
        const catColor = txn.category?.color ?? null;

        if (!categoryMap.has(catId)) {
          categoryMap.set(catId, { name: catName, color: catColor, total: new Decimal(0) });
        }
        const c = categoryMap.get(catId)!;
        c.total = c.total.plus(amt);
      }
    }

    const totalSurplus = totalIncome.minus(totalExpenses);
    let overallSavingsRate = new Decimal(0);
    if (totalIncome.greaterThan(0)) {
      overallSavingsRate = totalSurplus.dividedBy(totalIncome).times(100);
    }

    const categoryBreakdown = Array.from(categoryMap.values())
      .map((cat) => ({
        name: cat.name,
        color: cat.color,
        total: cat.total.toNumber(),
        percentage: totalExpenses.greaterThan(0)
          ? cat.total.dividedBy(totalExpenses).times(100).toDecimalPlaces(1).toNumber()
          : 0,
      }))
      .sort((a, b) => b.total - a.total);

    return {
      year,
      totalIncome: totalIncome.toNumber(),
      totalExpenses: totalExpenses.toNumber(),
      totalSurplus: totalSurplus.toNumber(),
      overallSavingsRate: overallSavingsRate.toDecimalPlaces(1).toNumber(),
      averageMonthlyIncome: totalIncome.dividedBy(12).toDecimalPlaces(2).toNumber(),
      averageMonthlyExpenses: totalExpenses.dividedBy(12).toDecimalPlaces(2).toNumber(),
      averageMonthlySurplus: totalSurplus.dividedBy(12).toDecimalPlaces(2).toNumber(),
      monthlyBreakdown,
      categoryBreakdown,
    };
  }

  /**
   * Helper for savings rate trend (defaults to 12 months)
   */
  static async getSavingsRateTrend(userId: string, months: number = 12) {
    const trend = await AnalyticsEngine.getMonthlyTrend(userId, months);
    return trend.map((t) => ({
      month: t.month,
      year: t.year,
      label: t.label,
      shortLabel: t.shortLabel,
      savingsRate: t.savingsRate,
      surplus: t.surplus,
      income: t.income,
      expenses: t.expenses,
    }));
  }
}
