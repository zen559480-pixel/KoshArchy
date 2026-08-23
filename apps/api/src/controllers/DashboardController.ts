import { Request, Response } from 'express';
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
}