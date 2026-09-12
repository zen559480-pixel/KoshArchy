import { z } from 'zod';

const positiveAmount = z
  .union([z.string(), z.number()])
  .refine(val => Number(val) > 0, { message: 'Amount must be greater than 0' });

export const getBudgetQuerySchema = z.object({
  query: z.object({
    month: z.string().regex(/^(1[0-2]|[1-9])$/, 'Month must be between 1 and 12').optional(),
    year:  z.string().regex(/^\d{4}$/, 'Year must be a 4-digit number').optional(),
  }),
});

export const createBudgetSchema = z.object({
  body: z.object({
    month: z.number().int().min(1).max(12),
    year:  z.number().int().min(2020).max(2099),
    items: z.array(
      z.object({
        categoryId:     z.string().uuid('Invalid Category ID'),
        expectedAmount: positiveAmount,
        isFixed:        z.boolean().optional().default(false),
      })
    ).optional().default([]),
  }),
});

export const upsertBudgetItemSchema = z.object({
  body: z.object({
    categoryId:     z.string().uuid('Invalid Category ID'),
    expectedAmount: positiveAmount,
    isFixed:        z.boolean().optional().default(false),
  }),
});

export const copyBudgetSchema = z.object({
  body: z.object({
    fromMonth: z.number().int().min(1).max(12),
    fromYear:  z.number().int().min(2020).max(2099),
    toMonth:   z.number().int().min(1).max(12),
    toYear:    z.number().int().min(2020).max(2099),
  }),
});
