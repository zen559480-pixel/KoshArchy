import { RecurringTransaction, Goal } from '@prisma/client';
import Decimal from 'decimal.js';
import { addDays, startOfDay, isSameDay } from 'date-fns';
import { prisma } from '../lib/prisma';
import { FluidMoneyEngine } from './FluidMoneyEngine';

export interface ForecastPoint {
  date:             Date;
  openingBalance:   Decimal;
  expectedIncome:   Decimal;
  expectedExpenses: Decimal;
  plannedPurchases: Decimal;
  closingBalance:   Decimal;
}

export class ForecastEngine {
  /**
   * Calculates future occurrences for a recurring transaction within [rangeStart, rangeEnd].
   */
  private static getOccurrencesInRange(
    txn: RecurringTransaction,
    rangeStart: Date,
    rangeEnd: Date
  ): Date[] {
    const occurrences: Date[] = [];
    let current = startOfDay(new Date(txn.nextOccurrence));
    const finalEnd = txn.endDate ? startOfDay(new Date(txn.endDate)) : rangeEnd;
    const effectiveEnd = finalEnd < rangeEnd ? finalEnd : rangeEnd;

    if (txn.frequency === 'ONE_TIME') {
      if (current >= rangeStart && current <= effectiveEnd) {
        occurrences.push(current);
      }
      return occurrences;
    }

    // Advance until reaching rangeStart
    while (current < rangeStart) {
      current = ForecastEngine.advanceDate(current, txn.frequency);
    }

    // Collect all occurrences within range
    while (current <= effectiveEnd) {
      occurrences.push(new Date(current));
      const next = ForecastEngine.advanceDate(current, txn.frequency);
      if (next <= current) break; // Prevent infinite loop
      current = next;
    }

    return occurrences;
  }

  private static advanceDate(d: Date, frequency: string): Date {
    const next = new Date(d);
    switch (frequency) {
      case 'WEEKLY':
        next.setDate(next.getDate() + 7);
        break;
      case 'BIWEEKLY':
        next.setDate(next.getDate() + 14);
        break;
      case 'MONTHLY':
        next.setMonth(next.getMonth() + 1);
        break;
      case 'QUARTERLY':
        next.setMonth(next.getMonth() + 3);
        break;
      case 'YEARLY':
        next.setFullYear(next.getFullYear() + 1);
        break;
      default:
        next.setMonth(next.getMonth() + 1);
        break;
    }
    return next;
  }

  /**
   * Generates a day-by-day forecasted balance array over a specified range.
   * Accurately projects recurring income/expenses forward based on recurrence schedules.
   */
  static async generateForecast(userId: string, daysToForecast = 90): Promise<ForecastPoint[]> {
    const today = startOfDay(new Date());
    const rangeEnd = addDays(today, daysToForecast);
    const forecast: ForecastPoint[] = [];

    // 1. Current liquid balance position (Assets - Liabilities)
    const currentStatus = await FluidMoneyEngine.calculate(userId);
    let runningBalance = currentStatus.totalAssets.minus(currentStatus.totalLiabilities);

    // 2. Fetch recurring transactions
    const recurringTxns = await prisma.recurringTransaction.findMany({
      where: {
        userId,
        OR: [{ endDate: null }, { endDate: { gte: today } }],
      },
    });

    // 3. Pre-map recurring transactions to dates
    const dailyTxnsMap = new Map<string, { income: Decimal; expense: Decimal }>();

    recurringTxns.forEach(txn => {
      const dates = ForecastEngine.getOccurrencesInRange(txn, today, rangeEnd);
      const amount = new Decimal(txn.amount.toString());

      dates.forEach(occDate => {
        const key = occDate.toISOString().slice(0, 10);
        if (!dailyTxnsMap.has(key)) {
          dailyTxnsMap.set(key, { income: new Decimal(0), expense: new Decimal(0) });
        }
        const bucket = dailyTxnsMap.get(key)!;
        if (txn.type === 'INCOME') {
          bucket.income = bucket.income.plus(amount);
        } else if (txn.type === 'EXPENSE') {
          bucket.expense = bucket.expense.plus(amount);
        }
      });
    });

    // 4. Fetch goals with target dates (planned purchases)
    const plannedGoals = await prisma.goal.findMany({
      where: {
        userId,
        status: 'ACTIVE',
        targetDate: { gte: today, lte: rangeEnd },
      },
    });

    const goalsMap = new Map<string, Decimal>();
    plannedGoals.forEach(goal => {
      if (goal.targetDate) {
        const key = startOfDay(new Date(goal.targetDate)).toISOString().slice(0, 10);
        const amount = new Decimal(goal.targetAmount.toString());
        goalsMap.set(key, (goalsMap.get(key) || new Decimal(0)).plus(amount));
      }
    });

    // 5. Day-by-day simulation
    for (let i = 0; i < daysToForecast; i++) {
      const currentDate = addDays(today, i);
      const key = currentDate.toISOString().slice(0, 10);

      const recurringData = dailyTxnsMap.get(key) || {
        income: new Decimal(0),
        expense: new Decimal(0),
      };
      const dailyPlannedPurchases = goalsMap.get(key) || new Decimal(0);

      const openingBalance = new Decimal(runningBalance);
      const closingBalance = openingBalance
        .plus(recurringData.income)
        .minus(recurringData.expense)
        .minus(dailyPlannedPurchases);

      forecast.push({
        date:             currentDate,
        openingBalance,
        expectedIncome:   recurringData.income,
        expectedExpenses: recurringData.expense,
        plannedPurchases: dailyPlannedPurchases,
        closingBalance,
      });

      runningBalance = closingBalance;
    }

    return forecast;
  }
}
