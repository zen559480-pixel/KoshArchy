import { Request, Response } from 'express';
import Decimal from 'decimal.js';
import { prisma } from '../lib/prisma';
import { Frequency, TransactionType } from '@prisma/client';

export function advanceDate(d: Date, frequency: Frequency | string): Date {
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
      next.setDate(next.getDate() + 1);
  }
  return next;
}

export class RecurringController {
  static async getRecurring(req: Request, res: Response) {
    try {
      const userId = req.user.id;
      const { type, status } = req.query;

      const whereClause: Record<string, unknown> = { userId };

      if (type && type !== 'ALL') {
        whereClause.type = type as TransactionType;
      }

      const now = new Date();
      if (status === 'ACTIVE') {
        whereClause.OR = [
          { endDate: null },
          { endDate: { gte: now } },
        ];
      } else if (status === 'INACTIVE') {
        whereClause.endDate = { lt: now };
      }

      const recurring = await prisma.recurringTransaction.findMany({
        where: whereClause,
        include: {
          account: {
            select: { id: true, name: true, type: true, balance: true },
          },
          category: {
            select: { id: true, name: true, color: true, icon: true },
          },
          _count: {
            select: { transactions: true },
          },
        },
        orderBy: { nextOccurrence: 'asc' },
      });

      res.status(200).json({
        status: 'success',
        data: recurring,
      });
    } catch (error) {
      console.error('RecurringController.getRecurring error:', error);
      res.status(500).json({ error: 'Failed to fetch recurring transactions' });
    }
  }

  static async getRecurringById(req: Request, res: Response) {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      const recurring = await prisma.recurringTransaction.findFirst({
        where: { id, userId },
        include: {
          account: true,
          category: true,
          transactions: {
            where: { isDeleted: false },
            orderBy: { date: 'desc' },
            take: 20,
          },
          _count: {
            select: { transactions: true },
          },
        },
      });

      if (!recurring) {
        return res.status(404).json({ error: 'Recurring transaction not found' });
      }

      res.status(200).json({
        status: 'success',
        data: recurring,
      });
    } catch (error) {
      console.error('RecurringController.getRecurringById error:', error);
      res.status(500).json({ error: 'Failed to fetch recurring transaction details' });
    }
  }

  static async createRecurring(req: Request, res: Response) {
    try {
      const userId = req.user.id;
      const {
        type,
        amount,
        description,
        frequency,
        startDate,
        endDate,
        accountId,
        categoryId,
      } = req.body;

      // Validate account if provided
      if (accountId) {
        const acc = await prisma.account.findFirst({
          where: { id: accountId, userId },
        });
        if (!acc) {
          return res.status(400).json({ error: 'Account not found' });
        }
      }

      // Validate category if provided
      if (categoryId) {
        const cat = await prisma.category.findFirst({
          where: { id: categoryId, userId },
        });
        if (!cat) {
          return res.status(400).json({ error: 'Category not found' });
        }
      }

      const parsedStart = new Date(startDate);
      const parsedEnd = endDate ? new Date(endDate) : null;

      const created = await prisma.recurringTransaction.create({
        data: {
          userId,
          type: type as TransactionType,
          amount: new Decimal(amount.toString()),
          description: description.trim(),
          frequency: frequency as Frequency,
          startDate: parsedStart,
          endDate: parsedEnd,
          nextOccurrence: parsedStart,
          accountId: accountId || null,
          categoryId: categoryId || null,
        },
        include: {
          account: {
            select: { id: true, name: true, type: true, balance: true },
          },
          category: {
            select: { id: true, name: true, color: true, icon: true },
          },
          _count: {
            select: { transactions: true },
          },
        },
      });

      res.status(201).json({
        status: 'success',
        data: created,
      });
    } catch (error) {
      console.error('RecurringController.createRecurring error:', error);
      res.status(500).json({ error: 'Failed to create recurring transaction' });
    }
  }

  static async updateRecurring(req: Request, res: Response) {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      const existing = await prisma.recurringTransaction.findFirst({
        where: { id, userId },
      });

      if (!existing) {
        return res.status(404).json({ error: 'Recurring transaction not found' });
      }

      const {
        type,
        amount,
        description,
        frequency,
        startDate,
        endDate,
        nextOccurrence,
        accountId,
        categoryId,
      } = req.body;

      const updateData: Record<string, unknown> = {};

      if (type !== undefined) updateData.type = type as TransactionType;
      if (amount !== undefined) updateData.amount = new Decimal(amount.toString());
      if (description !== undefined) updateData.description = description.trim();
      if (frequency !== undefined) updateData.frequency = frequency as Frequency;
      if (startDate !== undefined) updateData.startDate = new Date(startDate);
      if (endDate !== undefined) updateData.endDate = endDate ? new Date(endDate) : null;
      if (nextOccurrence !== undefined) updateData.nextOccurrence = new Date(nextOccurrence);

      if (accountId !== undefined) {
        if (accountId) {
          const acc = await prisma.account.findFirst({
            where: { id: accountId, userId },
          });
          if (!acc) return res.status(400).json({ error: 'Account not found' });
          updateData.accountId = accountId;
        } else {
          updateData.accountId = null;
        }
      }

      if (categoryId !== undefined) {
        if (categoryId) {
          const cat = await prisma.category.findFirst({
            where: { id: categoryId, userId },
          });
          if (!cat) return res.status(400).json({ error: 'Category not found' });
          updateData.categoryId = categoryId;
        } else {
          updateData.categoryId = null;
        }
      }

      const updated = await prisma.recurringTransaction.update({
        where: { id },
        data: updateData,
        include: {
          account: {
            select: { id: true, name: true, type: true, balance: true },
          },
          category: {
            select: { id: true, name: true, color: true, icon: true },
          },
          _count: {
            select: { transactions: true },
          },
        },
      });

      res.status(200).json({
        status: 'success',
        data: updated,
      });
    } catch (error) {
      console.error('RecurringController.updateRecurring error:', error);
      res.status(500).json({ error: 'Failed to update recurring transaction' });
    }
  }

  static async markPaid(req: Request, res: Response) {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      const recurring = await prisma.recurringTransaction.findFirst({
        where: { id, userId },
        include: { account: true, category: true },
      });

      if (!recurring) {
        return res.status(404).json({ error: 'Recurring transaction not found' });
      }

      const txDate = req.body?.date
        ? new Date(req.body.date)
        : new Date(recurring.nextOccurrence);

      const txAmount = req.body?.amount
        ? new Decimal(req.body.amount.toString())
        : new Decimal(recurring.amount.toString());

      const targetAccountId = req.body?.accountId ?? recurring.accountId;

      // Validate account if specified
      if (targetAccountId) {
        const acc = await prisma.account.findFirst({
          where: { id: targetAccountId, userId },
        });
        if (!acc) {
          return res.status(400).json({ error: 'Specified account not found' });
        }
      }

      // Calculate next occurrence date
      const nextDate = advanceDate(new Date(recurring.nextOccurrence), recurring.frequency);
      const isOneTime = recurring.frequency === 'ONE_TIME';
      const isExceeded = recurring.endDate && nextDate > recurring.endDate;

      // Execute transaction creation + account balance adjustment + recurrence update in atomic transaction
      const result = await prisma.$transaction(async (tx) => {
        // 1. Create real transaction
        const transaction = await tx.transaction.create({
          data: {
            userId,
            type: recurring.type,
            amount: txAmount,
            date: txDate,
            description: `${recurring.description} (Scheduled payment)`,
            accountId: targetAccountId || null,
            categoryId: recurring.categoryId || null,
            recurringTransactionId: recurring.id,
          },
          include: {
            account: true,
            category: true,
          },
        });

        // 2. Adjust account balance if accountId is linked
        if (targetAccountId) {
          const balanceDelta =
            recurring.type === 'INCOME' ? txAmount : txAmount.negated();

          await tx.account.update({
            where: { id: targetAccountId },
            data: {
              balance: {
                increment: balanceDelta,
              },
            },
          });
        }

        // 3. Update recurring transaction schedule
        const updatePayload: Record<string, unknown> = {
          nextOccurrence: nextDate,
        };

        if (isOneTime || isExceeded) {
          updatePayload.endDate = new Date();
        }

        const updatedRecurring = await tx.recurringTransaction.update({
          where: { id: recurring.id },
          data: updatePayload,
          include: {
            account: {
              select: { id: true, name: true, type: true, balance: true },
            },
            category: {
              select: { id: true, name: true, color: true, icon: true },
            },
            _count: {
              select: { transactions: true },
            },
          },
        });

        return { transaction, recurring: updatedRecurring };
      });

      res.status(200).json({
        status: 'success',
        message: 'Payment recorded and schedule advanced successfully',
        data: result,
      });
    } catch (error) {
      console.error('RecurringController.markPaid error:', error);
      res.status(500).json({ error: 'Failed to mark recurring payment as paid' });
    }
  }

  static async deactivate(req: Request, res: Response) {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      const existing = await prisma.recurringTransaction.findFirst({
        where: { id, userId },
      });

      if (!existing) {
        return res.status(404).json({ error: 'Recurring transaction not found' });
      }

      const updated = await prisma.recurringTransaction.update({
        where: { id },
        data: {
          endDate: new Date(),
        },
        include: {
          account: true,
          category: true,
          _count: { select: { transactions: true } },
        },
      });

      res.status(200).json({
        status: 'success',
        message: 'Recurring schedule deactivated',
        data: updated,
      });
    } catch (error) {
      console.error('RecurringController.deactivate error:', error);
      res.status(500).json({ error: 'Failed to deactivate recurring transaction' });
    }
  }

  static async deleteRecurring(req: Request, res: Response) {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      const existing = await prisma.recurringTransaction.findFirst({
        where: { id, userId },
        include: {
          _count: { select: { transactions: true } },
        },
      });

      if (!existing) {
        return res.status(404).json({ error: 'Recurring transaction not found' });
      }

      if (existing._count.transactions > 0) {
        return res.status(400).json({
          error:
            'Cannot delete recurring schedule with recorded payment history. Deactivate it instead to keep transaction records intact.',
        });
      }

      await prisma.recurringTransaction.delete({
        where: { id },
      });

      res.status(200).json({
        status: 'success',
        message: 'Recurring schedule deleted successfully',
      });
    } catch (error) {
      console.error('RecurringController.deleteRecurring error:', error);
      res.status(500).json({ error: 'Failed to delete recurring transaction' });
    }
  }
}
