import { z } from 'zod';

const positiveAmount = z
  .union([z.string(), z.number()])
  .refine(val => Number(val) > 0, { message: 'Amount must be greater than 0' });

const nonNegativeAmount = z
  .union([z.string(), z.number()])
  .refine(val => Number(val) >= 0, { message: 'Amount cannot be negative' });

export const createGoalSchema = z.object({
  body: z.object({
    name:         z.string().min(1, 'Goal name is required').max(100),
    targetAmount: positiveAmount,
    savedAmount:  nonNegativeAmount.optional().default(0),
    targetDate:   z.string().datetime().optional().nullable(),
    priority:     z.enum(['ESSENTIAL', 'HIGH', 'MEDIUM', 'LOW']).default('MEDIUM'),
    status:       z.enum(['ACTIVE', 'ACHIEVED', 'PURCHASED', 'CANCELLED']).default('ACTIVE'),
    accountId:    z.string().uuid('Invalid Account ID').optional().nullable(),
    notes:        z.string().max(1000).optional().nullable(),
  }),
});

export const updateGoalSchema = z.object({
  body: z.object({
    name:         z.string().min(1).max(100).optional(),
    targetAmount: positiveAmount.optional(),
    savedAmount:  nonNegativeAmount.optional(),
    targetDate:   z.string().datetime().optional().nullable(),
    priority:     z.enum(['ESSENTIAL', 'HIGH', 'MEDIUM', 'LOW']).optional(),
    status:       z.enum(['ACTIVE', 'ACHIEVED', 'PURCHASED', 'CANCELLED']).optional(),
    accountId:    z.string().uuid().optional().nullable(),
    notes:        z.string().max(1000).optional().nullable(),
  }),
});

export const depositGoalSchema = z.object({
  body: z.object({
    amount:            positiveAmount,
    accountId:         z.string().uuid().optional().nullable(),
    createTransaction: z.boolean().optional().default(false),
    date:              z.string().datetime().optional(),
    notes:             z.string().max(500).optional().nullable(),
  }),
});

export const purchaseGoalSchema = z.object({
  body: z.object({
    purchaseAmount: positiveAmount.optional(),
    accountId:      z.string().uuid('Account is required to pay for purchase'),
    categoryId:     z.string().uuid().optional().nullable(),
    date:           z.string().datetime().optional(),
    description:    z.string().max(255).optional().nullable(),
    notes:          z.string().max(1000).optional().nullable(),
  }),
});
