import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../lib/prisma';

const router = Router();

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

/**
 * POST /api/auth/login
 * Single-user auth: validates email + password against the
 * seeded admin user record, returns a signed JWT on success.
 */
router.post('/login', async (req: Request, res: Response) => {
  // Validate request body
  const result = loginSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({
      error: 'Validation failed',
      details: result.error.errors.map(e => ({ field: e.path.join('.'), message: e.message })),
    });
  }

  const { email, password } = result.data;

  try {
    // Find the user (there should only be one)
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      // Generic message — don't reveal whether email or password is wrong
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Sign JWT
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET!,
      { expiresIn: (process.env.JWT_EXPIRES_IN || '30d') as any }
    );

    return res.status(200).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        currency: user.currency,
      },
    });
  } catch (error) {
    console.error('[Auth] Login error:', error);
    return res.status(500).json({ error: 'Login failed, please try again' });
  }
});

/**
 * POST /api/auth/logout
 * Stateless JWT — logout is handled client-side by removing the token.
 * This endpoint exists for completeness / future token blacklisting.
 */
router.post('/logout', (_req: Request, res: Response) => {
  return res.status(200).json({ message: 'Logged out successfully' });
});

/**
 * GET /api/auth/me
 * Returns current user info. Useful for the frontend to validate
 * the stored token is still good and fetch fresh user data.
 */
router.get('/me', async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const payload = jwt.verify(
      authHeader.slice(7),
      process.env.JWT_SECRET!
    ) as { id: string; email: string };

    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      select: { id: true, email: true, name: true, currency: true },
    });

    if (!user) return res.status(404).json({ error: 'User not found' });
    return res.status(200).json({ user });
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
});

export default router;
