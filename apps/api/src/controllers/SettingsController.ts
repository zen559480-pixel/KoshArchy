import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma';

export class SettingsController {
  static async getSettings(req: Request, res: Response) {
    try {
      const userId = req.user.id;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          currency: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.status(200).json({
        status: 'success',
        data: user,
      });
    } catch (error) {
      console.error('SettingsController.getSettings error:', error);
      res.status(500).json({ error: 'Failed to fetch settings' });
    }
  }

  static async updateSettings(req: Request, res: Response) {
    try {
      const userId = req.user.id;
      const { name, currency, currentPassword, newPassword } = req.body;

      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const updatePayload: Record<string, unknown> = {};

      if (name !== undefined) updatePayload.name = name.trim();
      if (currency !== undefined) updatePayload.currency = currency.trim().toUpperCase();

      // Password update handling
      if (newPassword) {
        if (!currentPassword) {
          return res.status(400).json({
            error: 'Current password is required to change password',
          });
        }

        const matches = await bcrypt.compare(currentPassword, user.passwordHash);
        if (!matches) {
          return res.status(400).json({
            error: 'Current password does not match our records',
          });
        }

        const newHash = await bcrypt.hash(newPassword, 10);
        updatePayload.passwordHash = newHash;
      }

      const updated = await prisma.user.update({
        where: { id: userId },
        data: updatePayload,
        select: {
          id: true,
          email: true,
          name: true,
          currency: true,
          updatedAt: true,
        },
      });

      res.status(200).json({
        status: 'success',
        message: 'Settings updated successfully',
        data: updated,
      });
    } catch (error) {
      console.error('SettingsController.updateSettings error:', error);
      res.status(500).json({ error: 'Failed to update settings' });
    }
  }

  static async resetData(req: Request, res: Response) {
    try {
      const userId = req.user.id;
      const { confirmation, password } = req.body;

      if (confirmation !== 'RESET DATA') {
        return res.status(400).json({
          error: 'Please type "RESET DATA" exactly to confirm data reset',
        });
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const matches = await bcrypt.compare(password, user.passwordHash);
      if (!matches) {
        return res.status(401).json({
          error: 'Incorrect password. Data reset cancelled.',
        });
      }

      // Execute complete wipe of financial records in an atomic transaction
      await prisma.$transaction(async (tx) => {
        // 1. Delete all transactions
        await tx.transaction.deleteMany({
          where: { userId },
        });

        // 2. Delete all budget items and budgets
        const budgets = await tx.budget.findMany({
          where: { userId },
          select: { id: true },
        });
        const budgetIds = budgets.map((b) => b.id);
        if (budgetIds.length > 0) {
          await tx.budgetItem.deleteMany({
            where: { budgetId: { in: budgetIds } },
          });
          await tx.budget.deleteMany({
            where: { userId },
          });
        }

        // 3. Delete all recurring schedules
        await tx.recurringTransaction.deleteMany({
          where: { userId },
        });

        // 4. Delete all goals
        await tx.goal.deleteMany({
          where: { userId },
        });

        // 5. Reset all account balances to 0
        await tx.account.updateMany({
          where: { userId },
          data: { balance: 0 },
        });
      });

      res.status(200).json({
        status: 'success',
        message:
          'All transaction history, budgets, recurring rules, and goals have been reset. Account balances set to 0.',
      });
    } catch (error) {
      console.error('SettingsController.resetData error:', error);
      res.status(500).json({ error: 'Failed to reset financial data' });
    }
  }
}
