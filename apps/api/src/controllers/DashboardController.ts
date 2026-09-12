import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { FluidMoneyEngine } from '../engines/FluidMoneyEngine';
import { ForecastEngine } from '../engines/ForecastEngine';

export class DashboardController {
  static async getFluidMoney(req: Request, res: Response) {
    try {
      const userId = req.user.id;
      const breakdown = await FluidMoneyEngine.calculate(userId);
      
      res.status(200).json({
        status: 'success',
        data: breakdown
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to calculate fluid money' });
    }
  }

  static async getForecast(req: Request, res: Response) {
    try {
      const userId = req.user.id;
      const days = parseInt(req.query.days as string) || 90;
      
      const forecast = await ForecastEngine.generateForecast(userId, days);
      
      res.status(200).json({
        status: 'success',
        data: forecast
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to generate forecast' });
    }
  }

  static async getUpcoming(req: Request, res: Response) {
    try {
      const userId = req.user.id;
      const days = parseInt(req.query.days as string) || 14;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const future = new Date(today);
      future.setDate(future.getDate() + days);
      future.setHours(23, 59, 59, 999);

      const upcoming = await prisma.recurringTransaction.findMany({
        where: {
          userId,
          nextOccurrence: { gte: today, lte: future },
          OR: [{ endDate: null }, { endDate: { gte: today } }],
        },
        include: {
          account: {
            select: { id: true, name: true, type: true },
          },
          category: {
            select: { id: true, name: true, color: true, icon: true },
          },
        },
        orderBy: { nextOccurrence: 'asc' },
      });

      res.status(200).json({
        status: 'success',
        data: upcoming,
      });

    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch upcoming payments' });
    }
  }
}