import { PrismaClient } from '@prisma/client';
import Decimal from 'decimal.js';
import { addDays, isSameDay, startOfDay } from 'date-fns';
import { FluidMoneyEngine } from './FluidMoneyEngine';

const prisma = new PrismaClient();

export interface ForecastPoint {
  date: Date;
  openingBalance: Decimal;
  expectedIncome: Decimal;
  expectedExpenses: Decimal;
  plannedPurchases: Decimal; // Goal fulfillments
  closingBalance: Decimal;
}

export class ForecastEngine {
  /**
   * Generates a date-aware forecasted balance array over a specified range.
   */
  static async generateForecast(userId: string, daysToForecast: number = 90): Promise<ForecastPoint[]> {
    const today = startOfDay(new Date());
    const forecast: ForecastPoint[] = [];
    
    // 1. Get current baseline (Net Position)
    // For forecasting, we use Total Assets - Total Liabilities as the starting balance
    const currentStatus = await FluidMoneyEngine.calculate(userId);
    let runningBalance = currentStatus.totalAssets.minus(currentStatus.totalLiabilities);

    // 2. Fetch future recurring transactions
    const recurringTxns = await prisma.recurringTransaction.findMany({
      where: {
        userId,
        nextOccurrence: { gte: today },
        OR: [ { endDate: null }, { endDate: { gte: today } } ]
      }
    });

    // 3. Fetch goals with target dates (Planned Purchases)
    const plannedGoals = await prisma.goal.findMany({
      where: {
        userId,
        status: 'ACTIVE',
        targetDate: { gte: today }
      }
    });

    // 4. Simulate day-by-day
    for (let i = 0; i < daysToForecast; i++) {
      const currentDate = addDays(today, i);
      
      let dailyIncome = new Decimal(0);
      let dailyExpenses = new Decimal(0);
      let dailyPlannedPurchases = new Decimal(0);

      const openingBalance = new Decimal(runningBalance);

      // Simulate recurring transactions matching this date
      // Note: A robust implementation would project recurring dates mathematically
      // based on frequency (Weekly, Monthly) if 'nextOccurrence' requires looping.
      recurringTxns.forEach(txn => {
        // Simplified check: Does this transaction trigger today?
        // In full production, we calculate occurrences based on frequency enum.
        if (isSameDay(txn.nextOccurrence, currentDate)) {
          const amount = new Decimal(txn.amount.toString());
          if (txn.type === 'INCOME') dailyIncome = dailyIncome.plus(amount);
          if (txn.type === 'EXPENSE') dailyExpenses = dailyExpenses.plus(amount);
        }
      });

      // Simulate planned goal purchases
      plannedGoals.forEach(goal => {
        if (goal.targetDate && isSameDay(goal.targetDate, currentDate)) {
          // If the item is fully bought, we subtract the target price
          dailyPlannedPurchases = dailyPlannedPurchases.plus(new Decimal(goal.targetAmount.toString()));
        }
      });

      // Calculate Closing Balance
      const closingBalance = openingBalance
        .plus(dailyIncome)
        .minus(dailyExpenses)
        .minus(dailyPlannedPurchases);

      forecast.push({
        date: currentDate,
        openingBalance,
        expectedIncome: dailyIncome,
        expectedExpenses: dailyExpenses,
        plannedPurchases: dailyPlannedPurchases,
        closingBalance
      });

      // Carry over to next day
      runningBalance = closingBalance;
    }

    return forecast;
  }
}