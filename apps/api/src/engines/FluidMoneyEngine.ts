import { PrismaClient, Account, Goal, RecurringTransaction } from '@prisma/client';
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
   * Formula: Assets - Liabilities - Reserved Goals - Upcoming Expenses
   */
  static async calculate(userId: string): Promise<FluidMoneyBreakdown> {
    const today = startOfDay(new Date());
    const endOfCurrentMonth = endOfMonth(today);

    // 1. Fetch all active accounts included in net worth
    const accounts = await prisma.account.findMany({
      where: { userId, isActive: true, includeInNetWorth: true },
    });

    let totalAssets = new Decimal(0);
    let totalLiabilities = new Decimal(0);

    accounts.forEach((account: Account) => {
      const balance = new Decimal(account.balance.toString());
      if (['BANK', 'CASH', 'WALLET', 'INVESTMENT'].includes(account.type)) {
        totalAssets = totalAssets.plus(balance);
      } else if (['CREDIT_CARD', 'LOAN'].includes(account.type)) {
        totalLiabilities = totalLiabilities.plus(balance);
      }
    });

    // 2. Reserved Goal Amounts (money actively saved toward goals)
    const activeGoals = await prisma.goal.findMany({
      where: { userId, status: 'ACTIVE' },
    });

    const reservedForGoals = activeGoals.reduce(
      (sum: Decimal, goal: Goal) => sum.plus(new Decimal(goal.savedAmount.toString())),
      new Decimal(0)
    );

    // 3. Upcoming Recurring Expenses for the rest of the current month
    const upcomingRecurring = await prisma.recurringTransaction.findMany({
      where: {
        userId,
        type: 'EXPENSE',
        nextOccurrence: { gte: today, lte: endOfCurrentMonth },
      },
    });

    const upcomingExpenses = upcomingRecurring.reduce(
      (sum: Decimal, txn: RecurringTransaction) => sum.plus(new Decimal(txn.amount.toString())),
      new Decimal(0)
    );

    // 4. Formula
    const fluidMoney = totalAssets
      .minus(totalLiabilities)
      .minus(reservedForGoals)
      .minus(upcomingExpenses);

    return { totalAssets, totalLiabilities, reservedForGoals, upcomingExpenses, fluidMoney };
  }
}
