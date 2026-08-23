import { Request, Response } from 'express';
import { AnalyticsEngine } from '../engines/AnalyticsEngine';

export class AnalyticsController {
  static async getDashboardSummary(req: Request, res: Response) {
    try {
      const userId = req.user.id;
      const { month, year } = req.query;

      // Default to current date if params are missing
      const targetDate = (month && year) 
        ? new Date(Number(year), Number(month) - 1, 1) 
        : new Date();

      const [summary, categorySpending] = await Promise.all([
        AnalyticsEngine.getMonthlySummary(userId, targetDate),
        AnalyticsEngine.getSpendingByCategory(userId, targetDate)
      ]);

      res.status(200).json({
        status: 'success',
        data: {
          summary,
          categorySpending
        }
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to generate analytics' });
    }
  }
}