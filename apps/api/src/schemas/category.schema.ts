import { z } from 'zod';

export const createCategorySchema = z.object({
  body: z.object({
    name:  z.string().min(1, 'Category name is required').max(50),
    type:  z.enum(['INCOME', 'EXPENSE']),
    color: z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'Invalid hex color format').optional().nullable(),
    icon:  z.string().max(50).optional().nullable(),
  }),
});

export const updateCategorySchema = z.object({
  body: z.object({
    name:       z.string().min(1).max(50).optional(),
    type:       z.enum(['INCOME', 'EXPENSE']).optional(),
    color:      z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'Invalid hex color format').optional().nullable(),
    icon:       z.string().max(50).optional().nullable(),
    isArchived: z.boolean().optional(),
  }),
});
