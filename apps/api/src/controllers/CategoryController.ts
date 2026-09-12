import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

export class CategoryController {
  static async getCategories(req: Request, res: Response) {
    try {
      const userId = req.user.id;
      const { type, includeArchived } = req.query as { type?: string; includeArchived?: string };

      const categories = await prisma.category.findMany({
        where: {
          userId,
          ...(type && ['INCOME', 'EXPENSE'].includes(type) ? { type: type as 'INCOME' | 'EXPENSE' } : {}),
          ...(includeArchived === 'true' ? {} : { isArchived: false }),
        },
        include: {
          _count: {
            select: {
              transactions: { where: { isDeleted: false } },
            },
          },
        },
        orderBy: [{ isArchived: 'asc' }, { name: 'asc' }],
      });

      res.status(200).json({ data: categories });
    } catch {
      res.status(500).json({ error: 'Failed to fetch categories' });
    }
  }

  static async createCategory(req: Request, res: Response) {
    try {
      const userId = req.user.id;
      const { name, type, color, icon } = req.body;

      // Check duplicate category name for same type and user
      const existing = await prisma.category.findFirst({
        where: { userId, name: { equals: name.trim(), mode: 'insensitive' }, type },
      });

      if (existing) {
        return res.status(400).json({ error: `Category '${name}' already exists for ${type.toLowerCase()}` });
      }

      const category = await prisma.category.create({
        data: {
          userId,
          name: name.trim(),
          type,
          color: color || '#6366F1',
          icon: icon || null,
          isArchived: false,
        },
      });

      res.status(201).json({ data: category });
    } catch {
      res.status(400).json({ error: 'Failed to create category' });
    }
  }

  static async updateCategory(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const { name, type, color, icon, isArchived } = req.body;

      const existing = await prisma.category.findFirst({
        where: { id, userId },
      });

      if (!existing) {
        return res.status(404).json({ error: 'Category not found' });
      }

      const updated = await prisma.category.update({
        where: { id },
        data: {
          ...(name !== undefined ? { name: name.trim() } : {}),
          ...(type !== undefined ? { type } : {}),
          ...(color !== undefined ? { color } : {}),
          ...(icon !== undefined ? { icon } : {}),
          ...(isArchived !== undefined ? { isArchived } : {}),
        },
      });

      res.status(200).json({ data: updated });
    } catch {
      res.status(400).json({ error: 'Failed to update category' });
    }
  }

  static async deleteCategory(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const existing = await prisma.category.findFirst({
        where: { id, userId },
      });

      if (!existing) {
        return res.status(404).json({ error: 'Category not found' });
      }

      // Soft archive
      await prisma.category.update({
        where: { id },
        data: { isArchived: true },
      });

      res.status(204).send();
    } catch {
      res.status(400).json({ error: 'Failed to delete category' });
    }
  }
}
