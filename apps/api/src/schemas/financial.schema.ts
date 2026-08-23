import { z } from 'zod';

// --- Account Schemas ---
export const createAccountSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Account name is required').max(100),
    type: z.enum(['BANK', 'CREDIT_CARD', 'CASH', 'WALLET', 'INVESTMENT', 'LOAN', 'OTHER']),
    // Accept strings or numbers, but ensure it's a valid numerical value
    balance: z.union([z.string(), z.number()]).refine((val) => !isNaN(Number(val)), {
      message: 'Balance must be a valid number'
    }),
    currency: z.string().length(3).default('INR'),
    includeInNetWorth: z.boolean().default(true),
    includeInJoint: z.boolean().default(true)
  })
});

// --- Transaction Schemas ---
const baseTransaction = {
  // Amount must be positive. Decrements are handled by the controller based on type.
  amount: z.union([z.string(), z.number()]).refine((val) => Number(val) > 0, {
    message: 'Amount must be strictly greater than 0'
  }),
  date: z.string().datetime({ message: 'Invalid date format. Must be ISO 8601 string.' }),
  description: z.string().max(255).optional(),
  notes: z.string().max(1000).optional()
};

// Shape for Income & Expense
const standardTransaction = z.object({
  ...baseTransaction,
  type: z.enum(['INCOME', 'EXPENSE']),
  accountId: z.string().uuid('Invalid Account ID format'),
  categoryId: z.string().uuid('Invalid Category ID format').optional(),
});

// Shape for Transfers
const transferTransaction = z.object({
  ...baseTransaction,
  type: z.literal('TRANSFER'),
  fromAccountId: z.string().uuid('Invalid Source Account ID format'),
  toAccountId: z.string().uuid('Invalid Destination Account ID format'),
}).refine(data => data.fromAccountId !== data.toAccountId, {
  message: 'Transfer source and destination accounts must be different',
  path: ['body', 'toAccountId'] // Points the error to the correct field
});

// The exported schema routes validation based on the "type" field
export const createTransactionSchema = z.object({
  body: z.discriminatedUnion('type', [
    standardTransaction,
    transferTransaction
  ])
});