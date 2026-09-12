import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import Decimal from 'decimal.js';
import { prisma } from '../lib/prisma';

export class TransactionController {
  static async createTransaction(req: Request, res: Response) {
    try {
      const userId = req.user.id;
      const { type, amount, date, description, notes, accountId, fromAccountId, toAccountId, categoryId } = req.body;

      const transactionAmount = new Decimal(amount);

      // Execute everything inside a Prisma Transaction to ensure atomicity
      const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        // 1. Create the Transaction Record
        const transaction = await tx.transaction.create({
          data: {
            userId,
            type,
            amount:        transactionAmount,
            date:          new Date(date),
            description:   description || null,
            notes:         notes || null,
            accountId:     type !== 'TRANSFER' ? accountId     : null,
            fromAccountId: type === 'TRANSFER' ? fromAccountId : null,
            toAccountId:   type === 'TRANSFER' ? toAccountId   : null,
            categoryId:    type !== 'TRANSFER' ? categoryId    : null,
            isDeleted:     false,
          },
          include: {
            account:     { select: { name: true, type: true } },
            category:    { select: { name: true, color: true } },
            fromAccount: { select: { name: true } },
            toAccount:   { select: { name: true } },
          },
        });

        // 2. Update Account Balances atomically
        if (type === 'INCOME') {
          await tx.account.update({
            where: { id: accountId, userId },
            data:  { balance: { increment: transactionAmount } },
          });
        } else if (type === 'EXPENSE') {
          await tx.account.update({
            where: { id: accountId, userId },
            data:  { balance: { decrement: transactionAmount } },
          });
        } else if (type === 'TRANSFER') {
          if (fromAccountId === toAccountId) {
            throw new Error('Cannot transfer to the same account');
          }
          await tx.account.update({
            where: { id: fromAccountId, userId },
            data:  { balance: { decrement: transactionAmount } },
          });
          await tx.account.update({
            where: { id: toAccountId, userId },
            data:  { balance: { increment: transactionAmount } },
          });
        }

        return transaction;
      });

      res.status(201).json({ data: result });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Transaction failed';
      res.status(400).json({ error: message });
    }
  }

  static async getTransactions(req: Request, res: Response) {
    try {
      const userId = req.user.id;
      const {
        type,
        accountId,
        categoryId,
        dateFrom,
        dateTo,
        search,
        page = '1',
        limit = '20',
      } = req.query as Record<string, string | undefined>;

      const pageNum  = Math.max(1, parseInt(page, 10) || 1);
      const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
      const skip     = (pageNum - 1) * limitNum;

      // Construct where clauses
      const where: Prisma.TransactionWhereInput = {
        userId,
        isDeleted: false,
      };

      if (type && ['INCOME', 'EXPENSE', 'TRANSFER'].includes(type)) {
        where.type = type as 'INCOME' | 'EXPENSE' | 'TRANSFER';
      }

      if (accountId) {
        where.OR = [
          { accountId },
          { fromAccountId: accountId },
          { toAccountId: accountId },
        ];
      }

      if (categoryId) {
        where.categoryId = categoryId;
      }

      if (dateFrom || dateTo) {
        where.date = {};
        if (dateFrom) where.date.gte = new Date(dateFrom);
        if (dateTo) {
          const to = new Date(dateTo);
          // Set to end of day if only date is passed
          if (dateTo.length === 10) {
            to.setHours(23, 59, 59, 999);
          }
          where.date.lte = to;
        }
      }

      if (search && search.trim()) {
        const query = search.trim();
        const searchConditions = [
          { description: { contains: query, mode: 'insensitive' as Prisma.QueryMode } },
          { notes:       { contains: query, mode: 'insensitive' as Prisma.QueryMode } },
        ];
        if (where.OR) {
          where.AND = [{ OR: where.OR }, { OR: searchConditions }];
          delete where.OR;
        } else {
          where.OR = searchConditions;
        }
      }

      const [total, transactions] = await Promise.all([
        prisma.transaction.count({ where }),
        prisma.transaction.findMany({
          where,
          orderBy: { date: 'desc' },
          skip,
          take: limitNum,
          include: {
            account:     { select: { id: true, name: true, type: true } },
            category:    { select: { id: true, name: true, color: true } },
            fromAccount: { select: { id: true, name: true } },
            toAccount:   { select: { id: true, name: true } },
          },
        }),
      ]);

      res.status(200).json({
        data: transactions,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum),
        },
      });
    } catch (error) {
      console.error('[getTransactions] error:', error);
      res.status(500).json({ error: 'Failed to fetch transactions' });
    }
  }

  static async getTransactionById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const transaction = await prisma.transaction.findFirst({
        where: { id, userId: req.user.id, isDeleted: false },
        include: {
          account:     { select: { id: true, name: true, type: true } },
          category:    { select: { id: true, name: true, color: true } },
          fromAccount: { select: { id: true, name: true } },
          toAccount:   { select: { id: true, name: true } },
        },
      });

      if (!transaction) {
        return res.status(404).json({ error: 'Transaction not found' });
      }

      res.status(200).json({ data: transaction });
    } catch {
      res.status(500).json({ error: 'Failed to fetch transaction' });
    }
  }

  static async updateTransaction(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const { amount, date, description, notes, categoryId, accountId, fromAccountId, toAccountId } = req.body;

      const updated = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        const oldTxn = await tx.transaction.findFirst({
          where: { id, userId, isDeleted: false },
        });

        if (!oldTxn) {
          throw new Error('Transaction not found');
        }

        const oldAmount = new Decimal(oldTxn.amount.toString());
        const newAmount = amount !== undefined ? new Decimal(amount) : oldAmount;

        const targetAccountId     = accountId !== undefined ? accountId : oldTxn.accountId;
        const targetFromAccountId = fromAccountId !== undefined ? fromAccountId : oldTxn.fromAccountId;
        const targetToAccountId   = toAccountId !== undefined ? toAccountId : oldTxn.toAccountId;

        // 1. Revert effect of old transaction
        if (oldTxn.type === 'INCOME' && oldTxn.accountId) {
          await tx.account.update({
            where: { id: oldTxn.accountId, userId },
            data:  { balance: { decrement: oldAmount } },
          });
        } else if (oldTxn.type === 'EXPENSE' && oldTxn.accountId) {
          await tx.account.update({
            where: { id: oldTxn.accountId, userId },
            data:  { balance: { increment: oldAmount } },
          });
        } else if (oldTxn.type === 'TRANSFER' && oldTxn.fromAccountId && oldTxn.toAccountId) {
          await tx.account.update({
            where: { id: oldTxn.fromAccountId, userId },
            data:  { balance: { increment: oldAmount } },
          });
          await tx.account.update({
            where: { id: oldTxn.toAccountId, userId },
            data:  { balance: { decrement: oldAmount } },
          });
        }

        // 2. Apply effect of updated transaction
        if (oldTxn.type === 'INCOME' && targetAccountId) {
          await tx.account.update({
            where: { id: targetAccountId, userId },
            data:  { balance: { increment: newAmount } },
          });
        } else if (oldTxn.type === 'EXPENSE' && targetAccountId) {
          await tx.account.update({
            where: { id: targetAccountId, userId },
            data:  { balance: { decrement: newAmount } },
          });
        } else if (oldTxn.type === 'TRANSFER' && targetFromAccountId && targetToAccountId) {
          if (targetFromAccountId === targetToAccountId) {
            throw new Error('Source and destination accounts must be different');
          }
          await tx.account.update({
            where: { id: targetFromAccountId, userId },
            data:  { balance: { decrement: newAmount } },
          });
          await tx.account.update({
            where: { id: targetToAccountId, userId },
            data:  { balance: { increment: newAmount } },
          });
        }

        // 3. Update transaction record
        const record = await tx.transaction.update({
          where: { id },
          data: {
            amount:        newAmount,
            date:          date ? new Date(date) : undefined,
            description:   description !== undefined ? description : oldTxn.description,
            notes:         notes !== undefined ? notes : oldTxn.notes,
            categoryId:    oldTxn.type !== 'TRANSFER' ? (categoryId !== undefined ? categoryId : oldTxn.categoryId) : null,
            accountId:     oldTxn.type !== 'TRANSFER' ? targetAccountId : null,
            fromAccountId: oldTxn.type === 'TRANSFER' ? targetFromAccountId : null,
            toAccountId:   oldTxn.type === 'TRANSFER' ? targetToAccountId : null,
          },
          include: {
            account:     { select: { id: true, name: true, type: true } },
            category:    { select: { id: true, name: true, color: true } },
            fromAccount: { select: { id: true, name: true } },
            toAccount:   { select: { id: true, name: true } },
          },
        });

        return record;
      });

      res.status(200).json({ data: updated });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Update transaction failed';
      res.status(400).json({ error: message });
    }
  }

  static async deleteTransaction(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        const txn = await tx.transaction.findFirst({
          where: { id, userId, isDeleted: false },
        });

        if (!txn) {
          throw new Error('Transaction not found');
        }

        const amount = new Decimal(txn.amount.toString());

        // Revert balance effects
        if (txn.type === 'INCOME' && txn.accountId) {
          await tx.account.update({
            where: { id: txn.accountId, userId },
            data:  { balance: { decrement: amount } },
          });
        } else if (txn.type === 'EXPENSE' && txn.accountId) {
          await tx.account.update({
            where: { id: txn.accountId, userId },
            data:  { balance: { increment: amount } },
          });
        } else if (txn.type === 'TRANSFER' && txn.fromAccountId && txn.toAccountId) {
          await tx.account.update({
            where: { id: txn.fromAccountId, userId },
            data:  { balance: { increment: amount } },
          });
          await tx.account.update({
            where: { id: txn.toAccountId, userId },
            data:  { balance: { decrement: amount } },
          });
        }

        // Soft delete
        await tx.transaction.update({
          where: { id },
          data:  { isDeleted: true },
        });
      });

      res.status(204).send();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Delete failed';
      res.status(400).json({ error: message });
    }
  }
}
