import { PrismaClient } from '@prisma/client';
import Decimal from 'decimal.js';
import { startOfMonth, endOfMonth } from 'date-fns';

const prisma = new PrismaClient();

export class AnalyticsEngine {
  
  /**
   * Calculates total income, expenses, surplus, and savings rate for a given period.
   */
  static async getMonthlySummary(userId: string, targetDate: Date) {
    const startDate = startOfMonth(targetDate);
    const endDate = endOfMonth(targetDate);

    // Prisma aggregation for fast sum computation
    const aggregations = await prisma.transaction.groupBy({
      by: ['type'],
      where: {
        userId,
        date: { gte: startDate, lte: endDate },
        type: { in: ['INCOME', 'EXPENSE'] } // Explicitly ignore TRANSFER
      },
      _sum: { amount: true }
    });

    let totalIncome = new Decimal(0);
    let totalExpense = new Decimal(0);

    aggregations.forEach(agg => {
      const amount = new Decimal(agg._sum.amount?.toString() || '0');
      if (agg.type === 'INCOME') totalIncome = amount;
      if (agg.type === 'EXPENSE') totalExpense = amount;
    });

    const surplus = totalIncome.minus(totalExpense);
    
    // Calculate Savings Rate (Surplus / Income * 100)
    let savingsRate = new Decimal(0);
    if (totalIncome.greaterThan(0)) {
      savingsRate = surplus.dividedBy(totalIncome).times(100);
    } else if (totalIncome.isZero() && totalExpense.greaterThan(0)) {
      // If there's spending but no income, savings rate is effectively -100% of expenses 
      // (or however you prefer to represent it. 0 is safest for UI).
      savingsRate = new Decimal(0); 
    }

    return {
      period: { start: startDate, end: endDate },
      income: totalIncome,
      expenses: totalExpense,
      surplus: surplus,
      savingsRate: savingsRate.toDecimalPlaces(1).toNumber(), // e.g., 45.5
    };
  }

  /**
   * Aggregates expenses by category for charting (e.g., Recharts Donut Chart)
   */
  static async getSpendingByCategory(userId: string, targetDate: Date) {
    const startDate = startOfMonth(targetDate);
    const endDate = endOfMonth(targetDate);

    // Fetch transactions with their category relationships
    // We do this in-memory instead of groupBy so we get the category names easily
    const expenses = await prisma.transaction.findMany({
      where: {
        userId,
        type: 'EXPENSE',
        date: { gte: startDate, lte: endDate },
        categoryId: { not: null }
      },
      include: { category: true }
    });

    const categoryMap = new Map<string, { name: string, total: Decimal }>();
    let totalExpenses = new Decimal(0);

    expenses.forEach(txn => {
      const catId = txn.categoryId!;
      const amount = new Decimal(txn.amount.toString());
      
      if (!categoryMap.has(catId)) {
        categoryMap.set(catId, { name: txn.category!.name, total: new Decimal(0) });
      }
      
      const current = categoryMap.get(catId)!;
      current.total = current.total.plus(amount);
      totalExpenses = totalExpenses.plus(amount);
    });

    // Format for frontend charts: { name: "Food", value: 5000, percentage: 28.5 }
    const chartData = Array.from(categoryMap.values())
      .map(cat => ({
        name: cat.name,
        value: cat.total, // frontend can format to ₹
        percentage: totalExpenses.greaterThan(0) 
          ? cat.total.dividedBy(totalExpenses).times(100).toDecimalPlaces(1).toNumber() 
          : 0
      }))
      .sort((a, b) => b.value.comparedTo(a.value)); // Sort largest to smallest

    return chartData;
  }
}