import { Request, Response } from 'express';
import Decimal from 'decimal.js';
import { prisma } from '../lib/prisma';

export class BudgetController {
  static async getBudget(req: Request, res: Response) {
    try {
      const userId = req.user.id;
      const now = new Date();
      const month = parseInt(req.query.month as string, 10) || (now.getMonth() + 1);
      const year  = parseInt(req.query.year as string, 10)  || now.getFullYear();

      // Month date boundaries
      const startDate = new Date(year, month - 1, 1, 0, 0, 0, 0);
      const endDate   = new Date(year, month, 0, 23, 59, 59, 999);

      // 1. Fetch budget record with its items
      const budget = await prisma.budget.findUnique({
        where: {
          userId_month_year: { userId, month, year },
        },
        include: {
          items: {
            include: {
              category: { select: { id: true, name: true, color: true, icon: true } },
            },
          },
        },
      });

      // 2. Fetch all actual expense transactions in this month
      const expenses = await prisma.transaction.findMany({
        where: {
          userId,
          type: 'EXPENSE',
          isDeleted: false,
          date: { gte: startDate, lte: endDate },
        },
        include: {
          category: { select: { id: true, name: true, color: true } },
        },
      });

      // 3. Aggregate actual spent per categoryId
      const actualsByCat = new Map<string, { total: Decimal; categoryName: string; color: string | null }>();
      let totalActualExpense = new Decimal(0);

      expenses.forEach(txn => {
        const catId = txn.categoryId || 'uncategorized';
        const amount = new Decimal(txn.amount.toString());
        totalActualExpense = totalActualExpense.plus(amount);

        if (!actualsByCat.has(catId)) {
          actualsByCat.set(catId, {
            total: new Decimal(0),
            categoryName: txn.category?.name || 'Uncategorized',
            color: txn.category?.color || null,
          });
        }
        const existing = actualsByCat.get(catId)!;
        existing.total = existing.total.plus(amount);
      });

      // 4. Enrich budget items with actuals and progress calculations
      const budgetedCategoryIds = new Set<string>();
      let totalBudgeted = new Decimal(0);
      let totalSpentInBudget = new Decimal(0);

      const enrichedItems = (budget?.items || []).map(item => {
        budgetedCategoryIds.add(item.categoryId);
        const expected = new Decimal(item.expectedAmount.toString());
        totalBudgeted = totalBudgeted.plus(expected);

        const actualData = actualsByCat.get(item.categoryId);
        const actual = actualData ? actualData.total : new Decimal(0);
        totalSpentInBudget = totalSpentInBudget.plus(actual);

        const remaining = expected.minus(actual);
        const percentUsed = expected.greaterThan(0)
          ? actual.dividedBy(expected).times(100).toDecimalPlaces(1).toNumber()
          : 0;

        let status: 'OK' | 'WARNING' | 'OVER' = 'OK';
        if (percentUsed >= 100) status = 'OVER';
        else if (percentUsed >= 80) status = 'WARNING';

        return {
          id: item.id,
          budgetId: item.budgetId,
          categoryId: item.categoryId,
          category: item.category,
          expectedAmount: expected.toString(),
          actualAmount: actual.toString(),
          remainingAmount: remaining.toString(),
          percentUsed,
          status,
          isFixed: item.isFixed,
        };
      });

      // 5. Unbudgeted expenses (categories spent on this month that are not in budget)
      const unbudgetedItems: Array<{
        categoryId: string;
        categoryName: string;
        color: string | null;
        actualAmount: string;
      }> = [];
      let totalUnbudgetedSpent = new Decimal(0);

      actualsByCat.forEach((val, catId) => {
        if (!budgetedCategoryIds.has(catId)) {
          totalUnbudgetedSpent = totalUnbudgetedSpent.plus(val.total);
          unbudgetedItems.push({
            categoryId: catId,
            categoryName: val.categoryName,
            color: val.color,
            actualAmount: val.total.toString(),
          });
        }
      });

      // Overall health
      const overallPercent = totalBudgeted.greaterThan(0)
        ? totalSpentInBudget.dividedBy(totalBudgeted).times(100).toDecimalPlaces(1).toNumber()
        : 0;

      const remainingBudget = totalBudgeted.minus(totalSpentInBudget);

      res.status(200).json({
        data: {
          budget: budget
            ? {
                id: budget.id,
                month: budget.month,
                year: budget.year,
              }
            : null,
          items: enrichedItems,
          unbudgetedItems,
          summary: {
            totalBudgeted: totalBudgeted.toString(),
            totalSpentInBudget: totalSpentInBudget.toString(),
            totalUnbudgetedSpent: totalUnbudgetedSpent.toString(),
            totalSpentOverall: totalActualExpense.toString(),
            remainingBudget: remainingBudget.toString(),
            overallPercent,
          },
        },
      });
    } catch (error) {
      console.error('[getBudget] error:', error);
      res.status(500).json({ error: 'Failed to fetch budget' });
    }
  }

  static async createBudget(req: Request, res: Response) {
    try {
      const userId = req.user.id;
      const { month, year, items = [] } = req.body;

      const budget = await prisma.budget.upsert({
        where: {
          userId_month_year: { userId, month, year },
        },
        create: {
          userId,
          month,
          year,
          items: {
            create: items.map((i: any) => ({
              categoryId: i.categoryId,
              expectedAmount: new Decimal(i.expectedAmount),
              isFixed: i.isFixed || false,
            })),
          },
        },
        update: {},
        include: {
          items: { include: { category: true } },
        },
      });

      res.status(201).json({ data: budget });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Failed to create budget';
      res.status(400).json({ error: msg });
    }
  }

  static async upsertBudgetItem(req: Request, res: Response) {
    try {
      const userId = req.user.id;
      const { budgetId } = req.params;
      const { categoryId, expectedAmount, isFixed } = req.body;

      // Verify budget belongs to user
      const budget = await prisma.budget.findFirst({
        where: { id: budgetId, userId },
      });

      if (!budget) {
        return res.status(404).json({ error: 'Budget not found' });
      }

      const expectedVal = new Decimal(expectedAmount);

      // Check if item for this category already exists in this budget
      const existingItem = await prisma.budgetItem.findFirst({
        where: { budgetId, categoryId },
      });

      let item;
      if (existingItem) {
        item = await prisma.budgetItem.update({
          where: { id: existingItem.id },
          data: {
            expectedAmount: expectedVal,
            isFixed: isFixed !== undefined ? isFixed : existingItem.isFixed,
          },
          include: { category: true },
        });
      } else {
        item = await prisma.budgetItem.create({
          data: {
            budgetId,
            categoryId,
            expectedAmount: expectedVal,
            isFixed: isFixed || false,
          },
          include: { category: true },
        });
      }

      res.status(200).json({ data: item });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Failed to save budget item';
      res.status(400).json({ error: msg });
    }
  }

  static async deleteBudgetItem(req: Request, res: Response) {
    try {
      const userId = req.user.id;
      const { itemId } = req.params;

      const item = await prisma.budgetItem.findFirst({
        where: { id: itemId, budget: { userId } },
      });

      if (!item) {
        return res.status(404).json({ error: 'Budget item not found' });
      }

      await prisma.budgetItem.delete({ where: { id: itemId } });
      res.status(204).send();
    } catch {
      res.status(400).json({ error: 'Failed to delete budget item' });
    }
  }

  static async copyBudget(req: Request, res: Response) {
    try {
      const userId = req.user.id;
      const { fromMonth, fromYear, toMonth, toYear } = req.body;

      // Fetch source budget
      const sourceBudget = await prisma.budget.findUnique({
        where: {
          userId_month_year: { userId, month: fromMonth, year: fromYear },
        },
        include: { items: true },
      });

      if (!sourceBudget || sourceBudget.items.length === 0) {
        return res.status(404).json({
          error: `No budget items found for ${fromMonth}/${fromYear} to copy from.`,
        });
      }

      // Upsert target budget
      const targetBudget = await prisma.budget.upsert({
        where: {
          userId_month_year: { userId, month: toMonth, year: toYear },
        },
        create: { userId, month: toMonth, year: toYear },
        update: {},
      });

      // Copy each item if not already in target budget
      await prisma.$transaction(async tx => {
        for (const item of sourceBudget.items) {
          const existing = await tx.budgetItem.findFirst({
            where: { budgetId: targetBudget.id, categoryId: item.categoryId },
          });
          if (!existing) {
            await tx.budgetItem.create({
              data: {
                budgetId: targetBudget.id,
                categoryId: item.categoryId,
                expectedAmount: item.expectedAmount,
                isFixed: item.isFixed,
              },
            });
          }
        }
      });

      res.status(200).json({
        status: 'success',
        message: `Successfully copied ${sourceBudget.items.length} budget items to ${toMonth}/${toYear}`,
      });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Failed to copy budget';
      res.status(400).json({ error: msg });
    }
  }
}
