import { Request, Response } from 'express';
import { format } from 'date-fns';
import { prisma } from '../lib/prisma';
import { AnalyticsEngine } from '../engines/AnalyticsEngine';
import { TransactionType } from '@prisma/client';

function escapeCsv(val: string | number | null | undefined): string {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export class ExportController {
  static async exportTransactions(req: Request, res: Response) {
    try {
      const userId = req.user.id;
      const { dateFrom, dateTo, type, categoryId, accountId } = req.query;

      const whereClause: Record<string, unknown> = {
        userId,
        isDeleted: false,
      };

      if (dateFrom || dateTo) {
        const dateFilter: Record<string, Date> = {};
        if (dateFrom) dateFilter.gte = new Date(dateFrom as string);
        if (dateTo) {
          const to = new Date(dateTo as string);
          to.setHours(23, 59, 59, 999);
          dateFilter.lte = to;
        }
        whereClause.date = dateFilter;
      }

      if (type && type !== 'ALL') {
        whereClause.type = type as TransactionType;
      }

      if (categoryId) {
        whereClause.categoryId = categoryId as string;
      }

      if (accountId) {
        whereClause.OR = [
          { accountId: accountId as string },
          { fromAccountId: accountId as string },
          { toAccountId: accountId as string },
        ];
      }

      const transactions = await prisma.transaction.findMany({
        where: whereClause,
        include: {
          category: { select: { name: true } },
          account: { select: { name: true } },
          fromAccount: { select: { name: true } },
          toAccount: { select: { name: true } },
          goal: { select: { name: true } },
        },
        orderBy: { date: 'desc' },
      });

      // CSV Header
      const header = [
        'Transaction ID',
        'Date',
        'Type',
        'Description',
        'Amount',
        'Category',
        'Account',
        'From Account (Transfer)',
        'To Account (Transfer)',
        'Linked Goal',
        'Created At',
      ].join(',');

      // CSV Rows
      const rows = transactions.map((t) => {
        return [
          escapeCsv(t.id),
          escapeCsv(format(new Date(t.date), 'yyyy-MM-dd HH:mm:ss')),
          escapeCsv(t.type),
          escapeCsv(t.description || ''),
          escapeCsv(t.amount.toString()),
          escapeCsv(t.category?.name || 'Uncategorized'),
          escapeCsv(t.account?.name || ''),
          escapeCsv(t.fromAccount?.name || ''),
          escapeCsv(t.toAccount?.name || ''),
          escapeCsv(t.goal?.name || ''),
          escapeCsv(format(new Date(t.createdAt), 'yyyy-MM-dd HH:mm:ss')),
        ].join(',');
      });

      const csvContent = [header, ...rows].join('\r\n');
      const filename = `kosharchy-transactions-${format(new Date(), 'yyyyMMdd-HHmmss')}.csv`;

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.status(200).send(csvContent);
    } catch (error) {
      console.error('ExportController.exportTransactions error:', error);
      res.status(500).json({ error: 'Failed to export transactions' });
    }
  }

  static async exportAnnualReport(req: Request, res: Response) {
    try {
      const userId = req.user.id;
      const year = req.query.year
        ? parseInt(req.query.year as string, 10)
        : new Date().getFullYear();

      const annual = await AnalyticsEngine.getAnnualSummary(userId, year);

      const lines: string[] = [];

      // Section 1: Title & Key Totals
      lines.push(`KoshArchy Annual Financial Report - Year ${year}`);
      lines.push(`Generated On,${format(new Date(), 'yyyy-MM-dd HH:mm:ss')}`);
      lines.push('');
      lines.push('ANNUAL OVERVIEW SUMMARY');
      lines.push('Metric,Value');
      lines.push(`Total Annual Income,${annual.totalIncome}`);
      lines.push(`Total Annual Expenses,${annual.totalExpenses}`);
      lines.push(`Total Annual Surplus,${annual.totalSurplus}`);
      lines.push(`Overall Savings Rate,${annual.overallSavingsRate}%`);
      lines.push(`Average Monthly Income,${annual.averageMonthlyIncome}`);
      lines.push(`Average Monthly Expenses,${annual.averageMonthlyExpenses}`);
      lines.push(`Average Monthly Surplus,${annual.averageMonthlySurplus}`);
      lines.push('');

      // Section 2: 12-Month Table
      lines.push('MONTHLY BREAKDOWN');
      lines.push('Month,Label,Income,Expenses,Surplus,Savings Rate (%)');
      annual.monthlyBreakdown.forEach((m) => {
        lines.push(
          [
            escapeCsv(m.month),
            escapeCsv(m.label),
            escapeCsv(m.income),
            escapeCsv(m.expenses),
            escapeCsv(m.surplus),
            escapeCsv(`${m.savingsRate}%`),
          ].join(',')
        );
      });
      lines.push('');

      // Section 3: Category Breakdown
      lines.push('CATEGORY SPENDING BREAKDOWN');
      lines.push('Category,Total Spent,Share of Total (%)');
      annual.categoryBreakdown.forEach((c) => {
        lines.push(
          [
            escapeCsv(c.name),
            escapeCsv(c.total),
            escapeCsv(`${c.percentage}%`),
          ].join(',')
        );
      });

      const csvContent = lines.join('\r\n');
      const filename = `kosharchy-annual-report-${year}.csv`;

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.status(200).send(csvContent);
    } catch (error) {
      console.error('ExportController.exportAnnualReport error:', error);
      res.status(500).json({ error: 'Failed to export annual report' });
    }
  }
}
