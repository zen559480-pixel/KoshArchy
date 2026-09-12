import { Request, Response } from 'express';
import { AnalyticsEngine } from '../engines/AnalyticsEngine';

export class AnalyticsController {
  static async getDashboardSummary(req: Request, res: Response) {
    try {
      const userId = req.user.id;
      const { month, year } = req.query;

      // Default to current date if params are missing
      const targetDate =
        month && year
          ? new Date(Number(year), Number(month) - 1, 1)
          : new Date();

      const [summary, categorySpending] = await Promise.all([
        AnalyticsEngine.getMonthlySummary(userId, targetDate),
        AnalyticsEngine.getSpendingByCategory(userId, targetDate),
      ]);

      res.status(200).json({
        status: 'success',
        data: {
          summary,
          categorySpending,
        },
      });
    } catch (error) {
      console.error('AnalyticsController.getDashboardSummary error:', error);
      res.status(500).json({ error: 'Failed to generate analytics' });
    }
  }

  static async getTrends(req: Request, res: Response) {
    try {
      const userId = req.user.id;
      const months = req.query.months ? parseInt(req.query.months as string, 10) : 6;

      const trends = await AnalyticsEngine.getMonthlyTrend(userId, months);

      res.status(200).json({
        status: 'success',
        data: {
          trends,
        },
      });
    } catch (error) {
      console.error('AnalyticsController.getTrends error:', error);
      res.status(500).json({ error: 'Failed to generate trend analytics' });
    }
  }

  static async getAnnual(req: Request, res: Response) {
    try {
      const userId = req.user.id;
      const year = req.query.year
        ? parseInt(req.query.year as string, 10)
        : new Date().getFullYear();

      const annual = await AnalyticsEngine.getAnnualSummary(userId, year);

      res.status(200).json({
        status: 'success',
        data: {
          annual,
        },
      });
    } catch (error) {
      console.error('AnalyticsController.getAnnual error:', error);
      res.status(500).json({ error: 'Failed to generate annual summary' });
    }
  }

  static async getNetWorthHistory(req: Request, res: Response) {
    try {
      const userId = req.user.id;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 12;
      const history = await AnalyticsEngine.getNetWorthHistory(userId, limit);

      res.status(200).json({
        status: 'success',
        data: {
          history,
        },
      });
    } catch (error) {
      console.error('AnalyticsController.getNetWorthHistory error:', error);
      res.status(500).json({ error: 'Failed to retrieve net worth history' });
    }
  }

  static async takeNetWorthSnapshot(req: Request, res: Response) {
    try {
      const userId = req.user.id;
      const snapshot = await AnalyticsEngine.recordNetWorthSnapshot(userId);

      res.status(201).json({
        status: 'success',
        data: {
          snapshot,
        },
      });
    } catch (error) {
      console.error('AnalyticsController.takeNetWorthSnapshot error:', error);
      res.status(500).json({ error: 'Failed to record net worth snapshot' });
    }
  }
}