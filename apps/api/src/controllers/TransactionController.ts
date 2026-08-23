import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import Decimal from 'decimal.js';

const prisma = new PrismaClient();

export class TransactionController {
  static async createTransaction(req: Request, res: Response) {
    try {
      const userId = req.user.id;
      const { type, amount, date, description, accountId, fromAccountId, toAccountId, categoryId } = req.body;

      const transactionAmount = new Decimal(amount);

      // Execute everything inside a Prisma Transaction to ensure atomicity
      const result = await prisma.$transaction(async (tx) => {
        
        // 1. Create the Transaction Record
        const transaction = await tx.transaction.create({
          data: {
            userId, type, amount: transactionAmount, date: new Date(date), description,
            accountId: type !== 'TRANSFER' ? accountId : null,
            fromAccountId: type === 'TRANSFER' ? fromAccountId : null,
            toAccountId: type === 'TRANSFER' ? toAccountId : null,
            categoryId: type !== 'TRANSFER' ? categoryId : null,
          }
        });

        // 2. Safely Update Account Balances
        if (type === 'INCOME') {
          await tx.account.update({
            where: { id: accountId, userId },
            data: { balance: { increment: transactionAmount } }
          });
        } 
        else if (type === 'EXPENSE') {
          await tx.account.update({
            where: { id: accountId, userId },
            data: { balance: { decrement: transactionAmount } } // decrement safely subtracts
          });
        } 
        else if (type === 'TRANSFER') {
          if (fromAccountId === toAccountId) {
            throw new Error('Cannot transfer to the same account');
          }
          // Deduct from sender
          await tx.account.update({
            where: { id: fromAccountId, userId },
            data: { balance: { decrement: transactionAmount } }
          });
          // Add to receiver
          await tx.account.update({
            where: { id: toAccountId, userId },
            data: { balance: { increment: transactionAmount } }
          });
        }

        return transaction;
      });

      res.status(201).json({ data: result });
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Transaction failed' });
    }
  }

  static async getTransactions(req: Request, res: Response) {
    try {
      const transactions = await prisma.transaction.findMany({
        where: { userId: req.user.id },
        orderBy: { date: 'desc' },
        take: 50, // Pagination would be implemented here
        include: {
          account: { select: { name: true } },
          category: { select: { name: true } },
          fromAccount: { select: { name: true } },
          toAccount: { select: { name: true } }
        }
      });
      
      res.status(200).json({ data: transactions });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch transactions' });
    }
  }
}