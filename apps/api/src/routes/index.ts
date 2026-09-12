import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
  createAccountSchema,
  updateAccountSchema,
  createTransactionSchema,
  updateTransactionSchema,
  getTransactionsQuerySchema,
} from '../schemas/financial.schema';
import {
  createCategorySchema,
  updateCategorySchema,
} from '../schemas/category.schema';
import {
  createGoalSchema,
  updateGoalSchema,
  depositGoalSchema,
  purchaseGoalSchema,
} from '../schemas/goal.schema';
import {
  getBudgetQuerySchema,
  createBudgetSchema,
  upsertBudgetItemSchema,
  copyBudgetSchema,
} from '../schemas/budget.schema';
import {
  dashboardSummarySchema,
  trendsQuerySchema,
  annualQuerySchema,
} from '../schemas/analytics.schema';
import {
  createRecurringSchema,
  updateRecurringSchema,
  markPaidSchema,
  recurringIdParamSchema,
} from '../schemas/recurring.schema';
import {
  updateSettingsSchema,
  resetDataSchema,
  exportTransactionsQuerySchema,
  exportAnnualQuerySchema,
} from '../schemas/settings.schema';

import { DashboardController } from '../controllers/DashboardController';
import { AccountController } from '../controllers/AccountController';
import { TransactionController } from '../controllers/TransactionController';
import { AnalyticsController } from '../controllers/AnalyticsController';
import { CategoryController } from '../controllers/CategoryController';
import { GoalController } from '../controllers/GoalController';
import { BudgetController } from '../controllers/BudgetController';
import { RecurringController } from '../controllers/RecurringController';
import { ExportController } from '../controllers/ExportController';
import { SettingsController } from '../controllers/SettingsController';

const router = Router();


// All routes below require a valid JWT
router.use(requireAuth);


// ── Dashboard ─────────────────────────────────────────────────
router.get('/dashboard/fluid-money', DashboardController.getFluidMoney);
router.get('/dashboard/forecast', DashboardController.getForecast);
router.get('/dashboard/upcoming', DashboardController.getUpcoming);

// ── Analytics ─────────────────────────────────────────────────
router.get(
  '/analytics/dashboard',
  validate(dashboardSummarySchema),
  AnalyticsController.getDashboardSummary
);
router.get(
  '/analytics/trends',
  validate(trendsQuerySchema),
  AnalyticsController.getTrends
);
router.get(
  '/analytics/annual',
  validate(annualQuerySchema),
  AnalyticsController.getAnnual
);
router.get(
  '/analytics/net-worth-history',
  AnalyticsController.getNetWorthHistory
);
router.post(
  '/analytics/net-worth-snapshot',
  AnalyticsController.takeNetWorthSnapshot
);


// ── Accounts ──────────────────────────────────────────────────
router.get('/accounts', AccountController.getAccounts);
router.get('/accounts/:id', AccountController.getAccountById);
router.post('/accounts', validate(createAccountSchema), AccountController.createAccount);
router.patch('/accounts/:id', validate(updateAccountSchema), AccountController.updateAccount);
router.delete('/accounts/:id', AccountController.deleteAccount);

// ── Categories ────────────────────────────────────────────────
router.get('/categories', CategoryController.getCategories);
router.post('/categories', validate(createCategorySchema), CategoryController.createCategory);
router.patch('/categories/:id', validate(updateCategorySchema), CategoryController.updateCategory);
router.delete('/categories/:id', CategoryController.deleteCategory);

// ── Transactions ──────────────────────────────────────────────
router.get('/transactions', validate(getTransactionsQuerySchema), TransactionController.getTransactions);
router.get('/transactions/:id', TransactionController.getTransactionById);
router.post('/transactions', validate(createTransactionSchema), TransactionController.createTransaction);
router.patch('/transactions/:id', validate(updateTransactionSchema), TransactionController.updateTransaction);
router.delete('/transactions/:id', TransactionController.deleteTransaction);

// ── Goals ─────────────────────────────────────────────────────
router.get('/goals', GoalController.getGoals);
router.get('/goals/:id', GoalController.getGoalById);
router.post('/goals', validate(createGoalSchema), GoalController.createGoal);
router.patch('/goals/:id', validate(updateGoalSchema), GoalController.updateGoal);
router.post('/goals/:id/deposit', validate(depositGoalSchema), GoalController.depositToGoal);
router.post('/goals/:id/purchase', validate(purchaseGoalSchema), GoalController.purchaseGoal);
router.patch('/goals/:id/cancel', GoalController.cancelGoal);
router.delete('/goals/:id', GoalController.deleteGoal);

// ── Budgets ───────────────────────────────────────────────────
router.get('/budgets', validate(getBudgetQuerySchema), BudgetController.getBudget);
router.post('/budgets', validate(createBudgetSchema), BudgetController.createBudget);
router.patch('/budgets/:budgetId/items', validate(upsertBudgetItemSchema), BudgetController.upsertBudgetItem);
router.delete('/budgets/items/:itemId', BudgetController.deleteBudgetItem);
router.post('/budgets/copy', validate(copyBudgetSchema), BudgetController.copyBudget);

// ── Recurring Transactions ────────────────────────────────────
router.get('/recurring', RecurringController.getRecurring);
router.get('/recurring/:id', validate(recurringIdParamSchema), RecurringController.getRecurringById);
router.post('/recurring', validate(createRecurringSchema), RecurringController.createRecurring);
router.patch('/recurring/:id', validate(updateRecurringSchema), RecurringController.updateRecurring);
router.post('/recurring/:id/mark-paid', validate(markPaidSchema), RecurringController.markPaid);
router.patch('/recurring/:id/mark-paid', validate(markPaidSchema), RecurringController.markPaid);
router.patch('/recurring/:id/deactivate', validate(recurringIdParamSchema), RecurringController.deactivate);
router.delete('/recurring/:id', validate(recurringIdParamSchema), RecurringController.deleteRecurring);

// ── Data Export ───────────────────────────────────────────────
router.get('/export/transactions', validate(exportTransactionsQuerySchema), ExportController.exportTransactions);
router.get('/export/annual', validate(exportAnnualQuerySchema), ExportController.exportAnnualReport);

// ── Settings ──────────────────────────────────────────────────
router.get('/settings', SettingsController.getSettings);
router.patch('/settings', validate(updateSettingsSchema), SettingsController.updateSettings);
router.post('/settings/reset-data', validate(resetDataSchema), SettingsController.resetData);

export default router;


