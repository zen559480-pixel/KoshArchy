import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createAccountSchema, createTransactionSchema } from '../schemas/financial.schema';

import { DashboardController } from '../controllers/DashboardController';
import { AccountController } from '../controllers/AccountController';
import { TransactionController } from '../controllers/TransactionController';

const router = Router();

router.use(requireAuth);

// Dashboard
router.get('/dashboard/fluid-money', DashboardController.getFluidMoney);
router.get('/dashboard/forecast', DashboardController.getForecast);

// Accounts
router.get('/accounts', AccountController.getAccounts);
router.post(
  '/accounts', 
  validate(createAccountSchema), // <-- Zod Intercepts Here
  AccountController.createAccount
);
router.delete('/accounts/:id', AccountController.deleteAccount);

// Transactions
router.get('/transactions', TransactionController.getTransactions);
router.post(
  '/transactions', 
  validate(createTransactionSchema), // <-- Enforces strict Transfer/Standard shapes
  TransactionController.createTransaction
);

export default router;