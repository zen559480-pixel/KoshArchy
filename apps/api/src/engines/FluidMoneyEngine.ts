import { PrismaClient } from '@prisma/client';
import Decimal from 'decimal.js';
import { endOfMonth, startOfDay } from 'date-fns';

const prisma = new PrismaClient();

export interface FluidMoneyBreakdown {
  totalAssets: Decimal;
  totalLiabilities: Decimal;
  reservedForGoals: Decimal;
  upcomingExpenses: Decimal;
  fluidMoney: Decimal;
}

export class FluidMoneyEngine {
  /**
   * Calculates the Fluid Money for a given user.
   */
  static async calculate(userId: string): Promise<FluidMoneyBreakdown> {
    const today = startOfDay(new Date());
    const endOfCurrentMonth = endOfMonth(today);

    // 1. Fetch all accounts
    const accounts = await prisma.account.findMany({
      where: { userId, isActive: true, includeInNetWorth: true }
    });

    let totalAssets = new Decimal(0);
    let totalLiabilities = new Decimal(0);

    accounts.forEach(account => {
      const balance = new Decimal(account.balance.toString());
      if (['BANK', 'CASH', 'WALLET', 'INVESTMENT'].includes(account.type)) {
        totalAssets = totalAssets.plus(balance);
      } else if (['CREDIT_CARD', 'LOAN'].includes(account.type)) {
        // Assuming liabilities are stored as positive numbers representing debt
        totalLiabilities = totalLiabilities.plus(balance);
      }
    });

    // 2. Calculate Reserved Goal Amounts (Money actively saved/locked for goals)
    const activeGoals = await prisma.goal.findMany({
      where: { userId, status: 'ACTIVE' }
    });

    const reservedForGoals = activeGoals.reduce((sum, goal) => {
      return sum.plus(new Decimal(goal.savedAmount.toString()));
    }, new Decimal(0));

    // 3. Calculate Upcoming Expected/Recurring Expenses (for the rest of the month)
    // Note: In a production app, we'd check if these have already been paid this month.
    const upcomingRecurring = await prisma.recurringTransaction.findMany({
      where: {
        userId,
        type: 'EXPENSE',
        nextOccurrence: {
          gte: today,
          lte: endOfCurrentMonth
        }
      }
    });

    const upcomingExpenses = upcomingRecurring.reduce((sum, txn) => {
      return sum.plus(new Decimal(txn.amount.toString()));
    }, new Decimal(0));

    // 4. Base Formula: Assets - Liabilities - Reserved Goals - Upcoming Expenses
    const fluidMoney = totalAssets
      .minus(totalLiabilities)
      .minus(reservedForGoals)
      .minus(upcomingExpenses);

    return {
      totalAssets,
      totalLiabilities,
      reservedForGoals,
      upcomingExpenses,
      fluidMoney
    };
  }
}