import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import Decimal from 'decimal.js';

export class AccountController {
  static async getAccounts(req: Request, res: Response) {
    try {
      const includeArchived = req.query.includeArchived === 'true';

      const accounts = await prisma.account.findMany({
        where: {
          userId: req.user.id,
          ...(includeArchived ? {} : { isActive: true }),
        },
        include: {
          _count: {
            select: {
              transactions: { where: { isDeleted: false } },
            },
          },
        },
        orderBy: [{ isActive: 'desc' }, { balance: 'desc' }],
      });

      res.status(200).json({ data: accounts });
    } catch {
      res.status(500).json({ error: 'Failed to fetch accounts' });
    }
  }

  static async getAccountById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const account = await prisma.account.findFirst({
        where: { id, userId: req.user.id },
        include: {
          _count: {
            select: {
              transactions: { where: { isDeleted: false } },
            },
          },
        },
      });

      if (!account) {
        return res.status(404).json({ error: 'Account not found' });
      }

      res.status(200).json({ data: account });
    } catch {
      res.status(500).json({ error: 'Failed to fetch account' });
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
          balance: new Decimal(balance),
          currency: currency || 'INR',
          includeInNetWorth: includeInNetWorth ?? true,
          includeInJoint: includeInJoint ?? true,
        },
      });

      res.status(201).json({ data: account });
    } catch {
      res.status(400).json({ error: 'Invalid account data' });
    }
  }

  static async updateAccount(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { name, type, balance, currency, includeInNetWorth, includeInJoint, isActive } = req.body;

      const existing = await prisma.account.findFirst({
        where: { id, userId: req.user.id },
      });

      if (!existing) {
        return res.status(404).json({ error: 'Account not found' });
      }

      const updated = await prisma.account.update({
        where: { id },
        data: {
          ...(name !== undefined ? { name } : {}),
          ...(type !== undefined ? { type } : {}),
          ...(balance !== undefined ? { balance: new Decimal(balance) } : {}),
          ...(currency !== undefined ? { currency } : {}),
          ...(includeInNetWorth !== undefined ? { includeInNetWorth } : {}),
          ...(includeInJoint !== undefined ? { includeInJoint } : {}),
          ...(isActive !== undefined ? { isActive } : {}),
        },
      });

      res.status(200).json({ data: updated });
    } catch {
      res.status(400).json({ error: 'Failed to update account' });
    }
  }

  static async deleteAccount(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const existing = await prisma.account.findFirst({
        where: { id, userId: req.user.id },
      });

      if (!existing) {
        return res.status(404).json({ error: 'Account not found' });
      }

      // Soft delete to preserve transaction history
      await prisma.account.update({
        where: { id },
        data: { isActive: false, includeInNetWorth: false },
      });

      res.status(204).send();
    } catch {
      res.status(400).json({ error: 'Failed to delete account' });
    }
  }
}
