import { z } from 'zod';

const frequencyEnum = z.enum([
  'ONE_TIME',
  'WEEKLY',
  'BIWEEKLY',
  'MONTHLY',
  'QUARTERLY',
  'YEARLY',
]);

const dateString = z
  .string()
  .refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid date string',
  });

export const createRecurringSchema = z.object({
  body: z.object({
    type: z.enum(['INCOME', 'EXPENSE']),
    amount: z.union([
      z.number().positive('Amount must be positive'),
      z.string().regex(/^\d+(\.\d{1,2})?$/, 'Amount must be a valid currency value'),
    ]),
    description: z.string().min(1, 'Description is required').max(200),
    frequency: frequencyEnum,
    startDate: dateString,
    endDate: dateString.optional().nullable(),
    accountId: z.string().uuid('Invalid account ID').optional().nullable(),
    categoryId: z.string().uuid('Invalid category ID').optional().nullable(),
  }),
});

export const updateRecurringSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid recurring transaction ID'),
  }),
  body: z.object({
    type: z.enum(['INCOME', 'EXPENSE']).optional(),
    amount: z
      .union([
        z.number().positive('Amount must be positive'),
        z.string().regex(/^\d+(\.\d{1,2})?$/, 'Amount must be a valid currency value'),
      ])
      .optional(),
    description: z.string().min(1).max(200).optional(),
    frequency: frequencyEnum.optional(),
    startDate: dateString.optional(),
    endDate: dateString.optional().nullable(),
    nextOccurrence: dateString.optional(),
    accountId: z.string().uuid('Invalid account ID').optional().nullable(),
    categoryId: z.string().uuid('Invalid category ID').optional().nullable(),
  }),
});

export const markPaidSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid recurring transaction ID'),
  }),
  body: z
    .object({
      date: dateString.optional(),
      accountId: z.string().uuid('Invalid account ID').optional().nullable(),
      amount: z
        .union([
          z.number().positive('Amount must be positive'),
          z.string().regex(/^\d+(\.\d{1,2})?$/, 'Amount must be a valid currency value'),
        ])
        .optional(),
    })
    .optional(),
});

export const recurringIdParamSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid recurring transaction ID'),
  }),
});
