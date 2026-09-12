import { z } from 'zod';

// ─── Account Schemas ──────────────────────────────────────────────
export const createAccountSchema = z.object({
  body: z.object({
    name:             z.string().min(1, 'Account name is required').max(100),
    type:             z.enum(['BANK', 'CREDIT_CARD', 'CASH', 'WALLET', 'INVESTMENT', 'LOAN', 'OTHER']),
    balance:          z.union([z.string(), z.number()]).refine(
                        val => !isNaN(Number(val)),
                        { message: 'Balance must be a valid number' }
                      ),
    currency:         z.string().length(3).default('INR'),
    includeInNetWorth: z.boolean().default(true),
    includeInJoint:    z.boolean().default(true),
  }),
});

export const updateAccountSchema = z.object({
  body: z.object({
    name:             z.string().min(1).max(100).optional(),
    type:             z.enum(['BANK', 'CREDIT_CARD', 'CASH', 'WALLET', 'INVESTMENT', 'LOAN', 'OTHER']).optional(),
    balance:          z.union([z.string(), z.number()]).refine(
                        val => !isNaN(Number(val)),
                        { message: 'Balance must be a valid number' }
                      ).optional(),
    currency:         z.string().length(3).optional(),
    includeInNetWorth: z.boolean().optional(),
    includeInJoint:    z.boolean().optional(),
    isActive:         z.boolean().optional(),
  }),
});

// ─── Transaction Schemas ──────────────────────────────────────────
const positiveAmount = z
  .union([z.string(), z.number()])
  .refine(val => Number(val) > 0, { message: 'Amount must be greater than 0' });

const isoDate = z.string().datetime({ message: 'Date must be an ISO 8601 string' });

// Standard Income / Expense shape
const standardTransactionBody = z.object({
  type:        z.enum(['INCOME', 'EXPENSE']),
  amount:      positiveAmount,
  date:        isoDate,
  accountId:   z.string().uuid('Invalid Account ID'),
  categoryId:  z.string().uuid('Invalid Category ID').optional().nullable(),
  description: z.string().max(255).optional().nullable(),
  notes:       z.string().max(1000).optional().nullable(),
});

// Transfer shape
const transferTransactionBody = z.object({
  type:          z.literal('TRANSFER'),
  amount:        positiveAmount,
  date:          isoDate,
  fromAccountId: z.string().uuid('Invalid Source Account ID'),
  toAccountId:   z.string().uuid('Invalid Destination Account ID'),
  description:   z.string().max(255).optional().nullable(),
  notes:         z.string().max(1000).optional().nullable(),
});

export const createTransactionSchema = z.object({
  body: z.discriminatedUnion('type', [
    standardTransactionBody,
    transferTransactionBody,
  ]),
});

export const updateTransactionSchema = z.object({
  body: z.object({
    amount:        positiveAmount.optional(),
    date:          isoDate.optional(),
    description:   z.string().max(255).optional().nullable(),
    notes:         z.string().max(1000).optional().nullable(),
    categoryId:    z.string().uuid('Invalid Category ID').optional().nullable(),
    accountId:     z.string().uuid('Invalid Account ID').optional().nullable(),
    fromAccountId: z.string().uuid('Invalid Source Account ID').optional().nullable(),
    toAccountId:   z.string().uuid('Invalid Destination Account ID').optional().nullable(),
  }),
});

export const getTransactionsQuerySchema = z.object({
  query: z.object({
    type:       z.enum(['INCOME', 'EXPENSE', 'TRANSFER']).optional(),
    accountId:  z.string().uuid().optional(),
    categoryId: z.string().uuid().optional(),
    dateFrom:   z.string().optional(),
    dateTo:     z.string().optional(),
    search:     z.string().optional(),
    page:       z.string().regex(/^\d+$/).optional(),
    limit:      z.string().regex(/^\d+$/).optional(),
  }),
});
