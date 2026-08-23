import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class AccountController {
  static async getAccounts(req: Request, res: Response) {
    try {
      const accounts = await prisma.account.findMany({
        where: { userId: req.user.id, isActive: true },
        orderBy: { balance: 'desc' }
      });
      res.status(200).json({ data: accounts });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch accounts' });
    }
  }

  static async createAccount(req: Request, res: Response) {
    try {
      const { name, type, balance, currency, includeInNetWorth, includeInJoint } = req.body;

      const account = await prisma.account.create({
        data: {
          userId: req.user.id,
          name,
          type,
          balance, // Prisma handles string/number to Decimal conversion automatically
          currency: currency || 'INR',
          includeInNetWorth,
          includeInJoint
        }
      });

      res.status(201).json({ data: account });
    } catch (error) {
      res.status(400).json({ error: 'Invalid account data' });
    }
  }

  static async deleteAccount(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      // Soft delete to preserve transaction history
      await prisma.account.update({
        where: { id, userId: req.user.id }, // Scoped to user!
        data: { isActive: false, includeInNetWorth: false }
      });

      res.status(204).send();
    } catch (error) {
      res.status(404).json({ error: 'Account not found' });
    }
  }
}