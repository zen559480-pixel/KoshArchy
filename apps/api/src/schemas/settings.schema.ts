import { z } from 'zod';

export const updateSettingsSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100).optional(),
    currency: z.string().min(1).max(10).optional(),
    currentPassword: z.string().optional(),
    newPassword: z.string().min(6, 'New password must be at least 6 characters').optional(),
  }),
});

export const resetDataSchema = z.object({
  body: z.object({
    confirmation: z.literal('RESET DATA', {
      errorMap: () => ({ message: 'Confirmation text must be exactly "RESET DATA"' }),
    }),
    password: z.string().min(1, 'Password is required to confirm data reset'),
  }),
});

export const exportTransactionsQuerySchema = z.object({
  query: z.object({
    dateFrom: z.string().optional(),
    dateTo: z.string().optional(),
    type: z.enum(['INCOME', 'EXPENSE', 'TRANSFER', 'ALL']).optional(),
    categoryId: z.string().uuid().optional(),
    accountId: z.string().uuid().optional(),
  }),
});

export const exportAnnualQuerySchema = z.object({
  query: z.object({
    year: z.string().regex(/^20\d{2}$/, 'Year must be a valid 4-digit year').optional(),
  }),
});
