import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import bcrypt from 'bcryptjs';
import { prisma } from './lib/prisma';
import authRouter from './routes/auth';
import apiRouter from './routes/index';

// ─── Validate required environment variables ───────────────────
const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET', 'ADMIN_EMAIL', 'ADMIN_PASSWORD'];
const missingEnvVars = requiredEnvVars.filter(key => !process.env[key]);
if (missingEnvVars.length > 0) {
  console.error(`\n❌ Missing required environment variables:\n  ${missingEnvVars.join(', ')}`);
  console.error('Copy apps/api/.env.example to apps/api/.env and fill in the values.\n');
  process.exit(1);
}

const PORT = process.env.PORT || 3001;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// ─── Express App Setup ─────────────────────────────────────────
const app = express();

app.use(helmet());

app.use(
  cors({
    origin: [CLIENT_URL, 'http://localhost:5173'],
    credentials: true,
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Health Check ──────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── Routes ───────────────────────────────────────────────────
app.use('/api/auth', authRouter);
app.use('/api', apiRouter);

// ─── 404 Handler ──────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ─── Global Error Handler ─────────────────────────────────────
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[Server Error]', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ─── Default Categories (seeded once) ─────────────────────────
const DEFAULT_CATEGORIES = [
  // Income
  { name: 'Salary', type: 'INCOME' as const, color: '#10B981' },
  { name: 'Freelance', type: 'INCOME' as const, color: '#34D399' },
  { name: 'Investments', type: 'INCOME' as const, color: '#6EE7B7' },
  { name: 'Other Income', type: 'INCOME' as const, color: '#A7F3D0' },
  // Expense
  { name: 'Food & Dining', type: 'EXPENSE' as const, color: '#EF4444' },
  { name: 'Transport', type: 'EXPENSE' as const, color: '#F97316' },
  { name: 'Rent & Housing', type: 'EXPENSE' as const, color: '#F59E0B' },
  { name: 'Utilities', type: 'EXPENSE' as const, color: '#EAB308' },
  { name: 'Health', type: 'EXPENSE' as const, color: '#EC4899' },
  { name: 'Entertainment', type: 'EXPENSE' as const, color: '#8B5CF6' },
  { name: 'Shopping', type: 'EXPENSE' as const, color: '#06B6D4' },
  { name: 'Education', type: 'EXPENSE' as const, color: '#3B82F6' },
  { name: 'Subscriptions', type: 'EXPENSE' as const, color: '#6366F1' },
  { name: 'Personal Care', type: 'EXPENSE' as const, color: '#D946EF' },
  { name: 'Investments', type: 'EXPENSE' as const, color: '#14B8A6' },
  { name: 'Other Expense', type: 'EXPENSE' as const, color: '#94A3B8' },
];

// ─── Bootstrap: Seed admin user + default categories ──────────
async function bootstrap() {
  try {
    await prisma.$connect();
    console.log('✅ Database connected');

    // Check if admin user already exists
    const existingUser = await prisma.user.findFirst();

    if (!existingUser) {
      console.log('📦 No user found — seeding admin account...');

      const passwordHash = await bcrypt.hash(process.env.ADMIN_PASSWORD!, 12);

      const user = await prisma.user.create({
        data: {
          email: process.env.ADMIN_EMAIL!,
          passwordHash,
          name: process.env.ADMIN_NAME || 'Admin',
          currency: 'INR',
        },
      });

      console.log(`✅ Admin user created: ${user.email}`);

      // Seed default categories for this user
      await prisma.category.createMany({
        data: DEFAULT_CATEGORIES.map(cat => ({
          ...cat,
          userId: user.id,
        })),
      });

      console.log(`✅ ${DEFAULT_CATEGORIES.length} default categories seeded`);
      console.log('');
      console.log('╔══════════════════════════════════════════════╗');
      console.log('║  KoshArchy is ready! You can now log in:    ║');
      console.log(`║  Email:    ${process.env.ADMIN_EMAIL!.padEnd(34)}║`);
      console.log('║  Password: (from your .env ADMIN_PASSWORD)   ║');
      console.log('╚══════════════════════════════════════════════╝');
      console.log('');
      console.log('💡 Tip: After first login, you can remove ADMIN_PASSWORD from .env');
    } else {
      console.log(`✅ User found: ${existingUser.email}`);
    }
  } catch (error) {
    console.error('❌ Bootstrap failed:', error);
    process.exit(1);
  }
}

// ─── Start Server ─────────────────────────────────────────────
bootstrap().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 KoshArchy API running on http://localhost:${PORT}`);
    console.log(`   Health: http://localhost:${PORT}/health`);
    console.log(`   CORS:   ${CLIENT_URL}`);
  });
});

// ─── Graceful Shutdown ────────────────────────────────────────
process.on('SIGTERM', async () => {
  console.log('\n⚡ SIGTERM received — shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('\n⚡ SIGINT received — shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});
