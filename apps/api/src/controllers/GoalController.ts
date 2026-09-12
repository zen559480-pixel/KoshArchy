import { Request, Response } from 'express';
import { Prisma, GoalStatus, Priority } from '@prisma/client';
import Decimal from 'decimal.js';
import { prisma } from '../lib/prisma';

export class GoalController {
  /**
   * Helper to estimate monthly savings rate based on recent months surplus
   */
  private static async getAverageMonthlySavings(userId: string): Promise<Decimal> {
    const today = new Date();
    const threeMonthsAgo = new Date(today);
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const aggregations = await prisma.transaction.groupBy({
      by: ['type'],
      where: {
        userId,
        isDeleted: false,
        date: { gte: threeMonthsAgo, lte: today },
        type: { in: ['INCOME', 'EXPENSE'] },
      },
      _sum: { amount: true },
    });

    let totalIncome = new Decimal(0);
    let totalExpense = new Decimal(0);

    aggregations.forEach(agg => {
      const amount = new Decimal(String(agg._sum.amount ?? '0'));
      if (agg.type === 'INCOME') totalIncome = amount;
      if (agg.type === 'EXPENSE') totalExpense = amount;
    });

    const netThreeMonthSurplus = totalIncome.minus(totalExpense);
    if (netThreeMonthSurplus.greaterThan(0)) {
      return netThreeMonthSurplus.dividedBy(3);
    }
    return new Decimal(0);
  }

  static async getGoals(req: Request, res: Response) {
    try {
      const userId = req.user.id;
      const { status, priority } = req.query as { status?: string; priority?: string };

      const where: Prisma.GoalWhereInput = { userId };

      if (status && status !== 'ALL') {
        where.status = status as GoalStatus;
      }
      if (priority && ['ESSENTIAL', 'HIGH', 'MEDIUM', 'LOW'].includes(priority)) {
        where.priority = priority as Priority;
      }

      const [goals, avgSavings] = await Promise.all([
        prisma.goal.findMany({
          where,
          include: {
            account: { select: { id: true, name: true, type: true, balance: true } },
            transactions: {
              where: { isDeleted: false },
              select: { id: true, amount: true, date: true, description: true },
            },
          },
          orderBy: [
            { status: 'asc' },
            { priority: 'asc' },
            { targetDate: 'asc' },
          ],
        }),
        GoalController.getAverageMonthlySavings(userId),
      ]);

      const today = new Date();

      const enrichedGoals = goals.map(goal => {
        const target = new Decimal(goal.targetAmount.toString());
        const saved  = new Decimal(goal.savedAmount.toString());
        const remaining = Decimal.max(0, target.minus(saved));
        const progressPercent = target.greaterThan(0)
          ? Math.min(100, saved.dividedBy(target).times(100).toDecimalPlaces(1).toNumber())
          : 0;

        let estimatedMonthsLeft: number | null = null;
        let estimatedDate: Date | null = null;

        if (remaining.greaterThan(0) && avgSavings.greaterThan(0)) {
          estimatedMonthsLeft = Math.ceil(remaining.dividedBy(avgSavings).toNumber());
          const targetEta = new Date();
          targetEta.setMonth(targetEta.getMonth() + estimatedMonthsLeft);
          estimatedDate = targetEta;
        }

        const isOverdue = goal.targetDate
          ? new Date(goal.targetDate) < today && goal.status === 'ACTIVE'
          : false;

        return {
          ...goal,
          progressPercent,
          remainingAmount: remaining.toString(),
          estimatedMonthsLeft,
          estimatedDate,
          isOverdue,
        };
      });

      res.status(200).json({
        data: enrichedGoals,
        meta: {
          avgMonthlySavings: avgSavings.toString(),
        },
      });
    } catch (error) {
      console.error('[getGoals] error:', error);
      res.status(500).json({ error: 'Failed to fetch goals' });
    }
  }

  static async getGoalById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const goal = await prisma.goal.findFirst({
        where: { id, userId },
        include: {
          account: { select: { id: true, name: true, type: true, balance: true } },
          transactions: {
            where: { isDeleted: false },
            select: { id: true, amount: true, date: true, description: true },
          },
        },
      });

      if (!goal) {
        return res.status(404).json({ error: 'Goal not found' });
      }

      const target = new Decimal(goal.targetAmount.toString());
      const saved  = new Decimal(goal.savedAmount.toString());
      const remaining = Decimal.max(0, target.minus(saved));
      const progressPercent = target.greaterThan(0)
        ? Math.min(100, saved.dividedBy(target).times(100).toDecimalPlaces(1).toNumber())
        : 0;

      res.status(200).json({
        data: {
          ...goal,
          progressPercent,
          remainingAmount: remaining.toString(),
        },
      });
    } catch {
      res.status(500).json({ error: 'Failed to fetch goal' });
    }
  }

  static async createGoal(req: Request, res: Response) {
    try {
      const userId = req.user.id;
      const { name, targetAmount, savedAmount, targetDate, priority, status, accountId, notes } = req.body;

      const targetVal = new Decimal(targetAmount);
      const savedVal  = new Decimal(savedAmount || 0);

      let initialStatus: GoalStatus = status || 'ACTIVE';
      if (savedVal.greaterThanOrEqualTo(targetVal)) {
        initialStatus = 'ACHIEVED';
      }

      const goal = await prisma.goal.create({
        data: {
          userId,
          name: name.trim(),
          targetAmount: targetVal,
          savedAmount:  savedVal,
          targetDate:   targetDate ? new Date(targetDate) : null,
          priority:     priority || 'MEDIUM',
          status:       initialStatus,
          accountId:    accountId || null,
          notes:        notes || null,
        },
        include: {
          account: { select: { id: true, name: true, type: true } },
        },
      });

      res.status(201).json({ data: goal });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Failed to create goal';
      res.status(400).json({ error: msg });
    }
  }

  static async updateGoal(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const { name, targetAmount, savedAmount, targetDate, priority, status, accountId, notes } = req.body;

      const existing = await prisma.goal.findFirst({ where: { id, userId } });
      if (!existing) {
        return res.status(404).json({ error: 'Goal not found' });
      }

      const targetVal = targetAmount !== undefined ? new Decimal(targetAmount) : new Decimal(existing.targetAmount.toString());
      const savedVal  = savedAmount !== undefined ? new Decimal(savedAmount) : new Decimal(existing.savedAmount.toString());

      let updatedStatus = status !== undefined ? status : existing.status;
      if (savedVal.greaterThanOrEqualTo(targetVal) && updatedStatus === 'ACTIVE') {
        updatedStatus = 'ACHIEVED';
      }

      const updated = await prisma.goal.update({
        where: { id },
        data: {
          name:         name !== undefined ? name.trim() : undefined,
          targetAmount: targetAmount !== undefined ? targetVal : undefined,
          savedAmount:  savedAmount !== undefined ? savedVal : undefined,
          targetDate:   targetDate !== undefined ? (targetDate ? new Date(targetDate) : null) : undefined,
          priority:     priority !== undefined ? priority : undefined,
          status:       updatedStatus,
          accountId:    accountId !== undefined ? accountId : undefined,
          notes:        notes !== undefined ? notes : undefined,
        },
        include: {
          account: { select: { id: true, name: true, type: true } },
        },
      });

      res.status(200).json({ data: updated });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Failed to update goal';
      res.status(400).json({ error: msg });
    }
  }

  static async depositToGoal(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const { amount, accountId, createTransaction, date, notes } = req.body;

      const depositAmount = new Decimal(amount);

      const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        const goal = await tx.goal.findFirst({ where: { id, userId } });
        if (!goal) {
          throw new Error('Goal not found');
        }

        const newSavedAmount = new Decimal(goal.savedAmount.toString()).plus(depositAmount);
        const targetAmount   = new Decimal(goal.targetAmount.toString());

        let newStatus = goal.status;
        if (newSavedAmount.greaterThanOrEqualTo(targetAmount) && goal.status === 'ACTIVE') {
          newStatus = 'ACHIEVED';
        }

        // Optionally deduct from account and record an expense transaction
        if (createTransaction && accountId) {
          await tx.account.update({
            where: { id: accountId, userId },
            data:  { balance: { decrement: depositAmount } },
          });

          await tx.transaction.create({
            data: {
              userId,
              type:        'EXPENSE',
              amount:      depositAmount,
              date:        date ? new Date(date) : new Date(),
              description: `Saved towards goal: ${goal.name}`,
              notes:       notes || null,
              accountId,
              goalId:      goal.id,
              isDeleted:   false,
            },
          });
        }

        const updatedGoal = await tx.goal.update({
          where: { id },
          data: {
            savedAmount: newSavedAmount,
            status:      newStatus,
          },
          include: {
            account: { select: { id: true, name: true, type: true } },
          },
        });

        return updatedGoal;
      });

      res.status(200).json({ data: result });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Deposit failed';
      res.status(400).json({ error: msg });
    }
  }

  static async purchaseGoal(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const { purchaseAmount, accountId, categoryId, date, description, notes } = req.body;

      const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        const goal = await tx.goal.findFirst({ where: { id, userId } });
        if (!goal) {
          throw new Error('Goal not found');
        }

        const amountToDeduct = purchaseAmount
          ? new Decimal(purchaseAmount)
          : new Decimal(goal.targetAmount.toString());

        // 1. Create linked expense transaction
        const txn = await tx.transaction.create({
          data: {
            userId,
            type:        'EXPENSE',
            amount:      amountToDeduct,
            date:        date ? new Date(date) : new Date(),
            description: description || `Purchased Goal: ${goal.name}`,
            notes:       notes || null,
            accountId,
            categoryId:  categoryId || null,
            goalId:      goal.id,
            isDeleted:   false,
          },
        });

        // 2. Decrement account balance
        await tx.account.update({
          where: { id: accountId, userId },
          data:  { balance: { decrement: amountToDeduct } },
        });

        // 3. Mark goal as PURCHASED
        const updatedGoal = await tx.goal.update({
          where: { id },
          data: {
            status: 'PURCHASED',
            savedAmount: amountToDeduct, // Final spent amount
          },
          include: {
            account: { select: { id: true, name: true, type: true } },
          },
        });

        return { goal: updatedGoal, transaction: txn };
      });

      res.status(200).json({ data: result });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Purchase completion failed';
      res.status(400).json({ error: msg });
    }
  }

  static async cancelGoal(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const existing = await prisma.goal.findFirst({ where: { id, userId } });
      if (!existing) {
        return res.status(404).json({ error: 'Goal not found' });
      }

      const updated = await prisma.goal.update({
        where: { id },
        data:  { status: 'CANCELLED' },
      });

      res.status(200).json({ data: updated });
    } catch {
      res.status(400).json({ error: 'Failed to cancel goal' });
    }
  }

  static async deleteGoal(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const goal = await prisma.goal.findFirst({
        where: { id, userId },
        include: { _count: { select: { transactions: true } } },
      });

      if (!goal) {
        return res.status(404).json({ error: 'Goal not found' });
      }

      if (goal._count.transactions > 0) {
        // Soft cancel if transactions are linked to protect audit trail
        await prisma.goal.update({
          where: { id },
          data:  { status: 'CANCELLED' },
        });
      } else {
        await prisma.goal.delete({ where: { id } });
      }

      res.status(204).send();
    } catch {
      res.status(400).json({ error: 'Failed to delete goal' });
    }
  }
}
