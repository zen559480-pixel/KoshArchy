import { z } from 'zod';

export const dashboardSummarySchema = z.object({
  query: z.object({
    month: z.string().regex(/^(1[0-2]|[1-9])$/, 'Month must be 1-12').optional(),
    year: z.string().regex(/^20\d{2}$/, 'Year must be a valid 4-digit year').optional(),
  }),
});

export const trendsQuerySchema = z.object({
  query: z.object({
    months: z.string().regex(/^([1-9]|1[0-9]|2[0-4])$/, 'Months must be 1-24').optional(),
  }),
});

export const annualQuerySchema = z.object({
  query: z.object({
    year: z.string().regex(/^20\d{2}$/, 'Year must be a valid 4-digit year').optional(),
  }),
});