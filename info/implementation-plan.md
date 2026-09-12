# WealthOS — Complete Implementation Plan

> **Context:** Personal finance app for single user. Deploy target: Vercel (frontend) + Render (backend) + Neon (PostgreSQL). Currency: INR. Built with Express + Prisma + React + Tailwind.

---

## 2-Year Usage Simulation & Gap Analysis

Before defining phases, here is a simulated journey of using WealthOS over 2 years — revealing every gap and improvement needed.

### Month 1 — Onboarding
- User logs in for the first time (needs: simple single-user auth, login page)
- Adds bank accounts: HDFC Savings ₹95,000 / HDFC Credit Card -₹12,000 / Cash ₹3,000
- Logs first salary: ₹85,000 INCOME
- Adds recurring: Rent ₹20,000/month, Netflix ₹649/month, Phone ₹999/month
- **GAPS FOUND:** No auth endpoints. No recurring transaction CRUD UI. No category seeding (default categories needed). No account edit (typo in name).

### Month 2-3 — Daily Use
- Logs 40-60 transactions per month (food, fuel, shopping)
- Wants to search "swiggy" in transactions. **GAP:** No search/filter.
- Wants to see only this month's expenses. **GAP:** No date filter on transaction list.
- Forgets a ₹5,000 transaction was logged — wants to edit amount. **GAP:** No transaction edit.
- Double-logs a transaction accidentally. **GAP:** No transaction delete.
- Wants to assign a transaction to a category after creation. **GAP:** No edit.

### Month 3 — Budgeting Starts
- Sets a monthly budget: Food ₹8,000 / Transport ₹3,000 / Entertainment ₹2,000
- Wants to see: "I've spent ₹6,200 of my ₹8,000 food budget." **GAP:** No budget vs. actual UI.
- Carries budget to next month. **GAP:** No budget copy-forward feature.
- Wants to mark some expenses as "fixed" (rent, EMI). **GAP:** Budget item `isFixed` flag UI missing.

### Month 4 — Goals
- Sets Goal: "Goa Trip" ₹35,000 by March 2027, Priority: HIGH
- Sets Goal: "MacBook Pro" ₹1,65,000 by Dec 2027, Priority: MEDIUM
- Sets Goal: "Emergency Fund" ₹2,50,000, No deadline, Priority: ESSENTIAL
- Wants to increase Emergency Fund target. **GAP:** No goal edit.
- Cancels Goa trip, wants to remove goal. **GAP:** No goal delete/cancel.
- Wants to add savings manually: "Saved ₹10,000 toward MacBook". **GAP:** No way to update savedAmount.
- Wants to see which account holds goal money. **GAP:** Goal-to-account linking UI missing.
- Wants to see: "At this rate I'll hit my MacBook goal in 8 months." **GAP:** Goal ETA calculation missing.

### Month 5-6 — Pattern Recognition
- Wants to see last 3 months' spending side-by-side. **GAP:** No multi-month chart.
- Notices spending spikes in December (festivals). **GAP:** No year-over-year view.
- Wants to see net worth trend over time. **GAP:** No net worth history (no snapshot model).
- Wants to export transactions to Excel for CA. **GAP:** No export feature.
- Forecast shows balance going negative in Dec. Wants to know WHY. **GAP:** Forecast doesn't show breakdown tooltip.

### Month 7-9 — Recurring Issues
- Netflix raised price. Wants to edit recurring amount. **GAP:** No recurring edit.
- EMI ended. Wants to stop a recurring transaction. **GAP:** No recurring delete/deactivate.
- Salary comes on 1st, but sometimes on 2nd. Recurring not triggering. **GAP:** ForecastEngine only checks `nextOccurrence` exact date — not projecting forward by frequency.
- Wants to mark "Rent paid this month" to advance nextOccurrence. **GAP:** No recurring "mark as paid" flow.

### Month 10-12 — Year-End Review
- Wants annual income vs. expenses summary. **GAP:** Analytics only monthly, no yearly view.
- Wants to see savings rate trend: "Did I improve month over month?" **GAP:** No trend charts.
- Wants to see biggest expense categories of the year. **GAP:** No annual analytics.
- Tax season: wants ITR-ready income summary. **GAP:** No export / category filtering on reports.

### Year 2 — Power User Needs
- 500+ transactions now. List is slow to scroll. **GAP:** No pagination (hardcoded 50).
- Wants to filter: "Show only HDFC Credit Card transactions in August." **GAP:** No account filter on transactions.
- Wants to filter: "Show only Food category expenses." **GAP:** No category filter.
- Achieved MacBook goal — marks it as PURCHASED and links the transaction. **GAP:** Goal purchase flow not implemented.
- Starts tracking investments. Wants INVESTMENT account to show growth. **GAP:** Investment account type exists but no P&L tracking.
- Wants to set a spending limit alert: "Warn me when Food > ₹7,000." **IMPROVEMENT:** Budget alert system.
- Wants dark mode. **IMPROVEMENT:** Dark mode toggle.
- Opens app on phone. Navigation is broken. **GAP:** Mobile responsiveness.
- App crashes once and loses a day of data. Wants: "When did I last sync?" **IMPROVEMENT:** Last updated timestamp on dashboard.
- Wants to understand the Fluid Money formula — what does "reserved for goals" mean? **IMPROVEMENT:** Contextual help / tooltips.

---

## Comprehensive Improvement List

### 🔴 Critical (App Doesn't Work Without These)
1. `server.ts` — Express app bootstrap
2. `auth.ts` middleware — JWT verification
3. Auth endpoints — Login (single-user: hardcoded email or env-based credentials)
4. `tsconfig.json` — API TypeScript config
5. All web config files (package.json, vite.config, tailwind, index.html)
6. Web entry point (`main.tsx`, `App.tsx`)
7. `lib/api.ts` — HTTP client with auth headers

### 🟠 High Priority (Core Feature Completeness)
8. Default category seeding on first login (Food, Transport, Salary, Utilities, Entertainment, Health, Shopping, Other)
9. Transaction: edit amount, date, description, category, account
10. Transaction: soft delete (keep in DB, mark deleted)
11. Transaction: search by description
12. Transaction: filter by date range, type (income/expense/transfer), category, account
13. Transaction: pagination (infinite scroll or page buttons)
14. Category: full CRUD with color assignment
15. Goal: full CRUD (create, edit, delete/cancel)
16. Goal: manual savings deposit (update savedAmount + create linked transaction)
17. Goal: ETA calculation (at current savings rate, X months to target)
18. Goal: purchase flow (mark PURCHASED + create expense transaction)
19. Recurring: full CRUD (create, edit, deactivate)
20. Recurring: "Mark as paid" to advance nextOccurrence
21. Budget: create monthly budget per category
22. Budget: view actual vs. planned (live progress bars)
23. Budget: copy last month's budget forward
24. Account: edit name, type, balance correction
25. Analytics route registration in `routes/index.ts`
26. ForecastEngine: fix recurring frequency projection (WEEKLY, MONTHLY, YEARLY)

### 🟡 Medium Priority (Quality of Life)
27. Dashboard: net worth summary card (assets - liabilities)
28. Dashboard: recent 5 transactions quick view
29. Dashboard: month's income vs expense mini summary
30. Dashboard: budget health indicator (on track / over budget)
31. Dashboard: upcoming payments list (next 7 days)
32. Dashboard: "last updated" timestamp
33. Analytics: multi-month bar chart (6-month income vs expense trend)
34. Analytics: savings rate trend line chart
35. Analytics: annual view (full year summary)
36. Analytics: top 5 spending categories year-to-date
37. Forecast: hover tooltip showing that day's transactions
38. Forecast: negative balance warning highlight (red zone)
39. Goals: progress ring / progress bar per goal
40. Goals: sort by priority, deadline, progress
41. Goals: account linkage display
42. Budget: month/year selector to view past budgets
43. Transactions: month/year quick filter (dropdown selector)
44. Transactions: amount range filter
45. Transactions: bulk delete
46. Export: transactions to CSV (with date range selector)
47. Export: monthly analytics report to PDF (stretch goal)
48. Settings page: change app PIN/password, currency display, default account

### 🟢 Nice to Have (Polish & UX)
49. Dark mode toggle (persist in localStorage)
50. Mobile-responsive layout (hamburger menu for AppShell)
51. Contextual help tooltips on Fluid Money, Forecast, Savings Rate
52. Empty states with helpful CTAs (e.g., "No accounts yet → Add Account")
53. Success/error toast notifications (not browser alerts)
54. Keyboard shortcut: `Ctrl+N` to open Add Transaction modal
55. Transaction list: color coding (green=income, red=expense, blue=transfer)
56. Goal cards: color by priority (Essential=red, High=orange, Medium=yellow, Low=green)
57. Budget progress bars: color by usage (< 75% green, 75-90% yellow, > 90% red)
58. Floating "Quick Add" button on all pages
59. Dashboard: greeting with user name and current date
60. Number animations (count-up on load for big numbers)
61. Net Worth snapshot history (monthly snapshot → trend chart)
62. Recurring: visual calendar showing upcoming payments

---

## Implementation Phases

---

## Phase 0 — Make It Run (Foundation) ✅ COMPLETE
**Goal:** API starts. Frontend loads. Auth works. No features yet — just infrastructure.  
**Estimated effort:** 1 session

### Backend Tasks
- [ ] `apps/api/tsconfig.json` — Node.js TypeScript config
- [ ] `apps/api/.env` — fill DATABASE_URL, JWT_SECRET, PORT, CLIENT_URL
- [ ] `apps/api/src/server.ts` — Express setup, CORS, helmet, JSON, route mount
- [ ] `apps/api/src/middleware/auth.ts` — JWT verify, req.user attach
- [ ] `apps/api/src/types/express.d.ts` — Extend Request with `user: { id, email }`
- [ ] `apps/api/src/routes/auth.ts` — Login endpoint (single user: credentials from env)
- [ ] Register analytics route in `apps/api/src/routes/index.ts`

**Single-User Auth Strategy:**
Since this is personal use, no registration flow needed. Credentials stored in `.env`:
```
ADMIN_EMAIL=you@email.com
ADMIN_PASSWORD_HASH=<bcrypt hash>
```
Login endpoint verifies against env vars, returns JWT with a synthetic userId. One user is pre-seeded in the database on first run.

### Frontend Tasks
- [ ] `apps/web/package.json` — React 18, React Router 6, Recharts, Axios/Fetch
- [ ] `apps/web/tsconfig.json` — TypeScript config
- [ ] `apps/web/vite.config.ts` — Proxy `/api` to backend, React plugin
- [ ] `apps/web/tailwind.config.js` — Content paths, custom colors (WealthOS brand)
- [ ] `apps/web/postcss.config.js` — Tailwind + autoprefixer
- [ ] `apps/web/index.html` — Meta tags, favicon, root div
- [ ] `apps/web/src/main.tsx` — ReactDOM.createRoot, StrictMode
- [ ] `apps/web/src/App.tsx` — Router, auth-protected routes, redirect to /login
- [ ] `apps/web/src/lib/api.ts` — Base fetch client, token from localStorage, 401 handler
- [ ] `apps/web/src/lib/utils.ts` — `formatINR(amount)`, `formatDate(date)`, `formatPercent(n)`
- [ ] `apps/web/src/lib/auth.ts` — `login()`, `logout()`, `getToken()`, `isLoggedIn()`
- [ ] `apps/web/src/routes/LoginPage.tsx` — Login form (email + password)
- [ ] `apps/web/src/components/layout/AppShell.tsx` — Sidebar nav (Dashboard, Transactions, Budget, Goals, Analytics, Settings)

**Deliverable:** `npm run dev` works. Login page loads. Dashboard route (empty) renders inside AppShell.

---

## Phase 1 — Accounts & Transactions (Core Loop) ✅ COMPLETE
**Goal:** User can manage accounts and log all types of transactions. The fundamental data entry flow is complete.  
**Delivered:** Full Accounts CRUD with balance adjustments, Categories CRUD with colors, Transactions CRUD with filter bar, search, pagination, and atomic balance reconciliation.

### Backend Tasks
- [x] `AccountController`: add `updateAccount` (PATCH `/accounts/:id`) — name, type, balance correction
- [x] `AccountController`: add `getAccountById` (GET `/accounts/:id`) — for edit pre-fill
- [x] `TransactionController`: add `updateTransaction` (PATCH `/transactions/:id`) — amount, date, description, category, notes (with balance reconciliation)
- [x] `TransactionController`: add `deleteTransaction` (DELETE `/transactions/:id`) — soft delete (`isDeleted: true`, with balance revert)
- [x] `TransactionController`: enhance `getTransactions` — add query filters: `type`, `accountId`, `categoryId`, `dateFrom`, `dateTo`, `search` (description/notes insensitive), `page`, `limit`
- [x] Add `CategoryController` — full CRUD: GET all, POST create, PATCH update, DELETE (soft archive)
- [x] Schema update: add `isDeleted Boolean @default(false)` to Transaction; add `color String?` to Category
- [x] Seed default categories on first login check

### New Zod Schemas
- [x] `updateAccountSchema` — partial account fields
- [x] `updateTransactionSchema` — partial transaction fields
- [x] `createCategorySchema`, `updateCategorySchema`
- [x] `getTransactionsQuerySchema` — filters, pagination

### Frontend Tasks

**Accounts**
- [x] `AccountsPage.tsx` (route `/accounts`) — card grid of all accounts, net worth KPI banner, filter tabs
- [x] `AccountCard.tsx` — balance display, account type icon, edit/delete buttons, net worth badge
- [x] `AccountModal.tsx` — create/edit form (name, type, opening balance, currency, net worth toggle)
- [x] `features/accounts/api/useAccounts.ts` — CRUD hooks

**Categories**
- [x] `CategoriesModal.tsx` — list + CRUD + color palette selector
- [x] `CategoryBadge.tsx` — colored pill component (reused everywhere)
- [x] `features/categories/api/useCategories.ts` — CRUD hooks

**Transactions**
- [x] `TransactionsPage.tsx` — full implementation: filter bar + paginated list + modals
- [x] `TransactionTable.tsx` — sortable responsive table and mobile cards with type-color coding
- [x] `TransactionModal.tsx` — create/edit form, handles all 3 types (INCOME/EXPENSE/TRANSFER), account + category dropdowns
- [x] `FilterBar.tsx` — dropdowns: type, account, category; date presets (This Month, Last Month, This Year, Custom) + date picker; search input; reset filters
- [x] `Pagination.tsx` — prev/next, page indicator, total count
- [x] `features/transactions/api/useTransactions.ts` — list (with filters), create, update, delete

**Shared Components**
- [x] `ConfirmDialog.tsx` — reusable "Are you sure?" modal for deletes
- [x] `Toast.tsx` — toast notification system (top-right, auto-dismiss, with ToastProvider)
- [x] `AmountInput.tsx` — currency-aware input (₹ prefix, decimal formatting)
- [x] `DatePicker.tsx` — native `<input type="date">` styled picker
- [x] `EmptyState.tsx` — clean empty state with action button

**Deliverable:** Can add accounts, add transactions (all 3 types), edit/delete transactions, filter and search transaction history.

---

## Phase 2 — Dashboard (The Main View) ✅ COMPLETE
**Goal:** Dashboard shows all key financial health metrics. Fluid Money is live and meaningful.  
**Delivered:** Live financial command center with Fluid Money hero card, Net Worth ratio, Month cash flow & savings rate, 30/90 days Recharts Area forecast, accounts preview, upcoming recurring bills, and recent activity with quick modal triggers.

### Backend Tasks
- [x] Backend routes: `/api/dashboard/fluid-money`, `/api/dashboard/forecast`, `/api/dashboard/upcoming`, `/api/analytics/dashboard`

### Frontend Tasks
- [x] `FluidMoneyCard.tsx` — Hero card with spendable balance, health badge, 4-pillar breakdown, and formula explainer
- [x] `NetWorthSummary.tsx` — Assets vs Liabilities comparison, visual ratio bar, and link to accounts
- [x] `AccountSummaryCard.tsx` — Mini card grid per account with types, balances, and quick add shortcut
- [x] `MonthSummaryCard.tsx` — Income / Expense / Surplus / Savings Rate for current month + top category pills
- [x] `UpcomingPaymentsList.tsx` — Next 14 days scheduled recurring expenses with amounts and frequency
- [x] `RecentTransactionsList.tsx` — Last 5 transactions with type indicator, category badge, and quick add trigger
- [x] `ForecastWidget.tsx` — Recharts AreaChart plotting 30/90 days cash flow with interactive tooltip and dip warning
- [x] `features/dashboard/api/useDashboard.ts` — Unified hook fetching fluid money, forecast, month summary, upcoming bills, recent activity, and accounts
- [x] `DashboardPage.tsx` — Composes all cards, handles refresh and quick action modals

**Deliverable:** Dashboard is the app's home screen. All numbers are live. Gives instant financial snapshot.

---

## Phase 3 — Goals (Savings Tracking) ✅ COMPLETE
**Goal:** Full goal lifecycle management — create, save toward, achieve, purchase.  
**Delivered:** Complete Goal lifecycle management with live progress tracking, 3-month savings rate ETA projection, deposit modal with optional transaction creation, purchase flow with linked expense logging, and filterable priority/status views.

### Backend Tasks
- [x] `GoalController` — full CRUD:
  - GET `/goals` — list all with progress %, remaining amount, and estimated ETA calculated
  - POST `/goals` — create with targetAmount, targetDate, priority, accountId
  - PATCH `/goals/:id` — edit any field
  - POST `/goals/:id/deposit` — add savedAmount + optionally create linked expense transaction and deduct balance
  - POST `/goals/:id/purchase` — mark PURCHASED, atomically create linked EXPENSE transaction and adjust account balance
  - PATCH `/goals/:id/cancel` — set status to CANCELLED
  - DELETE `/goals/:id` — delete if unlinked, else soft-cancel to preserve transaction history
- [x] Computed field logic: `progressPercent`, `remainingAmount`, `estimatedMonthsLeft`, `estimatedDate`, `isOverdue`
- [x] ETA calculation: `remainingAmount / avgMonthlySavings` based on 3-month rolling surplus

### New Zod Schemas
- [x] `createGoalSchema`, `updateGoalSchema`, `depositGoalSchema`, `purchaseGoalSchema`

### Frontend Tasks
- [x] `GoalsPage.tsx` — Grid of goal cards, status tabs (All, In Progress, Ready, Purchased, Cancelled), priority filters, and KPI summary banner
- [x] `GoalCard.tsx` — Priority badges, progress bar with percentage and remaining balance, ETA display, holding account badge, and action buttons
- [x] `GoalModal.tsx` — Create/edit form: name, target amount, current saved, target date, priority, holding account, notes
- [x] `GoalDepositModal.tsx` — "Add savings" form with real-time progress preview and account deduction toggle
- [x] `GoalPurchaseModal.tsx` — "Complete Purchase 🎉" form: account, category, amount, creates linked expense
- [x] Priority sorting + status filter tabs
- [x] `features/goals/api/useGoals.ts` — full CRUD & action hooks

**Deliverable:** Full goal lifecycle. Can save toward goals. ETA is shown. Can mark goals as purchased.

---

## Phase 4 — Budget (Monthly Planning) ✅ COMPLETE
**Goal:** Create monthly budgets, track actual vs. planned in real time.  
**Delivered:** Live monthly budget planning with actual vs planned comparison, multi-state progress bars, fixed vs variable expense grouping, unbudgeted category alerts, and cross-month budget cloning.

### Backend Tasks
- [x] `BudgetController`:
  - GET `/budgets?month=&year=` — get budget for specific month with actuals computed
  - POST `/budgets` — create month budget with category allowances
  - PATCH `/budgets/:id/items` — add/update budget items
  - DELETE `/budgets/items/:itemId` — remove budget item
  - POST `/budgets/copy` — copy previous month's budget to current
- [x] Enhanced `BudgetController` joining actual transaction spending per category for selected month
- [x] `BudgetItem` response includes: `expectedAmount`, `actualAmount`, `remainingAmount`, `percentUsed`, `status`

### New Zod Schemas
- [x] `getBudgetQuerySchema`, `createBudgetSchema`, `upsertBudgetItemSchema`, `copyBudgetSchema`

### Frontend Tasks
- [x] `BudgetPage.tsx` — Month/year selector at top, summary KPI banner, variable & fixed sections, unbudgeted alert
- [x] `BudgetProgressRow.tsx` — Category name, expected vs actual amounts, tri-color progress bar (green/yellow/red), left/over status
- [x] `AddBudgetItemModal.tsx` — pick category, set expected monthly allowance, mark as fixed commitment
- [x] `CopyBudgetModal.tsx` — "Copy from another month" flow
- [x] Summary KPI section: Total Budgeted vs. Spent in Budget vs. Remaining Allowance + Health Badge
- [x] `features/budget/api/useBudget.ts` — full CRUD & navigation hooks

**Deliverable:** Monthly budget planning with live actual vs. planned comparison.

---

## Phase 5 — Analytics & Forecast (Insights) — COMPLETE
**Goal:** Charts that give real financial insights. Fix ForecastEngine to actually project recurring transactions forward.  
**Estimated effort:** 2 sessions (Completed)

### Backend Tasks (Bug Fixes)
- [x] **Fix ForecastEngine** — Replace `isSameDay(nextOccurrence, currentDate)` with proper frequency projection:
  ```
  function getOccurrencesInRange(txn, start, end):
    WEEKLY: every 7 days from startDate
    BIWEEKLY: every 14 days
    MONTHLY: same day-of-month each month
    QUARTERLY: same day every 3 months
    YEARLY: same date each year
    ONE_TIME: only on nextOccurrence
  ```
- [x] **AnalyticsEngine**: add `getMonthlyTrend(userId, months=6)` — returns last N months summary array for bar chart
- [x] **AnalyticsEngine**: add `getAnnualSummary(userId, year)` — full year breakdown
- [x] **AnalyticsEngine**: add `getSavingsRateTrend(userId, months=12)` — monthly savings rate array
- [x] **AnalyticsController**: add `getTrends`, `getAnnual` and validation schemas

### Frontend Tasks
- [x] `AnalyticsPage.tsx` (new route `/analytics`) — tabbed: Monthly / Annual / Trends
- [x] `CategoryDonutChart.tsx` — Recharts PieChart with legend, interactive hover & breakdown
- [x] `MonthlyBarChart.tsx` — Recharts BarChart (income=green, expense=red, side by side, 6/12 months)
- [x] `SavingsRateLineChart.tsx` — Recharts LineChart, 12-month savings rate trend with 20% benchmark line
- [x] `ForecastChart.tsx` — Recharts AreaChart with:
  - Closing balance over 30/60/90 days
  - Red shading & warning when balance < 0
  - Hover tooltip showing that day's income/expenses/purchases
  - Vertical lines marking upcoming goal target dates
- [x] Month/year selector for analytics
- [x] Annual view: big summary cards, 12-month table, and annual category breakdown
- [x] `features/analytics/api/useAnalytics.ts`

**Deliverable:** Recharts-powered charts. Fixed forecast that actually projects recurring transactions. Route `/analytics` active in AppShell and App router.


---

## Phase 6 — Recurring Transactions (Scheduled Payments) — COMPLETE
**Goal:** Full recurring transaction management. Mark-as-paid advances nextOccurrence.  
**Estimated effort:** 1 session (Completed)

### Backend Tasks
- [x] `RecurringController`:
  - GET `/recurring` — list all recurring transactions (supports filtering by type and active status)
  - GET `/recurring/:id` — fetch details, account, category, and past transactions
  - POST `/recurring` — create new recurring transaction
  - PATCH `/recurring/:id` — edit amount, frequency, description, dates, account, category
  - POST/PATCH `/recurring/:id/mark-paid` — creates actual transaction + advances `nextOccurrence` + updates balance atomically
  - PATCH `/recurring/:id/deactivate` — sets `endDate = today`, stops future projections
  - DELETE `/recurring/:id` — guarded: only if no linked transactions
- [x] `nextOccurrence` advancement logic per frequency:
  - WEEKLY: +7 days
  - BIWEEKLY: +14 days
  - MONTHLY: +1 month (same day)
  - QUARTERLY: +3 months
  - YEARLY: +1 year
- [x] Prisma relations: `RecurringTransaction.accountId`, `RecurringTransaction.categoryId`, and `Transaction.recurringTransactionId`

### New Zod Schemas
- [x] `createRecurringSchema`, `updateRecurringSchema`, `markPaidSchema`, `recurringIdParamSchema`

### Frontend Tasks
- [x] `RecurringPage.tsx` (route `/recurring`) — overview with KPI summary, search, and type/status filters
- [x] `RecurringCard.tsx` — shows next occurrence countdown, amount, frequency badge, account, category, and action buttons
- [x] `RecurringModal.tsx` — create/edit: description, type (INCOME/EXPENSE), amount, frequency, startDate, endDate, account, category
- [x] `MarkPaidModal.tsx` — quick payment confirmation allowing customizable date, payment amount, and target account
- [x] Upcoming recurring payments widget linked to `/recurring` on Dashboard
- [x] `features/recurring/api/useRecurring.ts`

**Deliverable:** Recurring payments are manageable. "Mark as Paid" creates real transactions and advances the schedule. ForecastEngine reads correctly projected dates. Route `/recurring` integrated into App router and AppShell.


---

## Phase 7 — Export & Settings — COMPLETE
**Goal:** Data portability and user preferences.  
**Estimated effort:** 1 session (Completed)

### Backend Tasks
- [x] GET `/export/transactions?dateFrom=&dateTo=&type=&categoryId=&accountId=` → returns CSV stream with escaped values
- [x] GET `/export/annual?year=` → returns annual report CSV with totals, 12-month table, and category shares
- [x] PATCH `/settings` — update user name, default currency, and change password with bcrypt validation
- [x] POST `/settings/reset-data` — destructive data wipe with password and text confirmation

### Frontend Tasks
- [x] `SettingsPage.tsx` — route `/settings`
  - Change password section with confirmation
  - Display name and administrative email info
  - Default currency picker (INR, USD, EUR, GBP)
  - Export section: Quick Export All + Filtered Export + Annual Report Download
  - Danger zone: "Reset all data" (with modal, password, and `"RESET DATA"` phrase confirmation)
- [x] `ExportModal.tsx` — filter selection for export (quick presets, dates, type, account, category)
- [x] Download CSV via authenticated fetch and dynamic blob `<a download>`
- [x] `features/settings/api/useSettings.ts`

**Deliverable:** Can export transaction history. Can change settings and password. Can perform filtered or annual CSV exports. Route `/settings` active in navigation.


---

## Phase 8 — UI Polish & Responsiveness — COMPLETE
**Goal:** App looks great and works on mobile.  
**Estimated effort:** 1-2 sessions (Completed)

### Tasks
- [x] **Dark mode** — Tailwind `dark:` classes, Sun/Moon toggle with localStorage persistence, pre-load inline script preventing white flash
- [x] **Mobile responsive layout** — Hamburger drawer menu, backdrop dismiss, and dedicated mobile bottom navigation bar (Home, Accounts, Txns, Budget, Goals)
- [x] **Empty states** — Custom illustrations/icons across Accounts, Transactions, Goals, Budget, Recurring, and Analytics
- [x] **Toast notifications** — Integrated Toast system across all CRUD operations with success/error alerts
- [x] **Loading skeletons** — Content-shaped skeleton cards across dashboard, analytics, transactions, and settings
- [x] **Contextual help** — Tooltips and explainers for Fluid Money calculation and financial targets
- [x] **Keyboard shortcuts** — `Ctrl+N` / `Cmd+N` = Quick Add Transaction modal from any page, `Escape` = close modal
- [x] **Color coding** — Income rows = emerald, Expense = rose, Transfer = indigo/sky
- [x] **Priority colors** — Essential = rose, High = orange, Medium = amber, Low = emerald
- [x] **Budget bar colors** — < 75% = emerald, 75–90% = amber, > 90% = orange, > 100% = rose
- [x] **Account type icons** — Bank, Credit Card, Cash, Wallet, Investment, Loan
- [x] **Favicon and app title** — "WealthOS — Personal Finance Command Center" branding and inline SVG favicon
- [x] **Number formatting** — Comprehensive `formatINR()` with ₹ symbol and Indian numbering (Lakhs/Crores)
- [x] **Animated count-up** — `AnimatedNumber` component with smooth cubic easing on Fluid Money and Net Worth numbers
- [x] **Floating Quick Add button** — Global `+` FAB on all pages to quickly log transactions

**Deliverable:** App is polished, mobile-friendly, dark-mode capable, and feels professional.


---

## Phase 9 — Deployment
**Goal:** App is live and accessible from anywhere.  
**Estimated effort:** 1 session

### Neon (Database)
- [ ] Create Neon PostgreSQL project
- [ ] Get connection string
- [ ] Run `prisma db push` against Neon
- [ ] Seed default user + default categories

### Render (Backend API)
- [ ] Create Render Web Service from `apps/api/`
- [ ] Set environment variables: `DATABASE_URL`, `JWT_SECRET`, `PORT`, `CLIENT_URL`
- [ ] Build command: `npm install && npx prisma generate && npm run build`
- [ ] Start command: `npm run start`

### Vercel (Frontend)
- [ ] Create Vercel project from `apps/web/`
- [ ] Set environment variable: `VITE_API_URL=https://your-render-api.onrender.com/api`
- [ ] Build command: `npm run build`
- [ ] Output directory: `dist`
- [ ] Update CORS in API to allow Vercel domain

### Post-Deploy
- [ ] Test full login → transaction → analytics flow on production
- [ ] Update info docs with production URLs

---

## Additional Schema Changes Required

The following changes to `schema.prisma` are needed across phases:

```prisma
model Transaction {
  // Add in Phase 1:
  isDeleted   Boolean  @default(false)
}

model Category {
  // Add in Phase 1:
  color       String?  // hex color for charts, e.g. "#EF4444"
  icon        String?  // emoji or icon name
}

// Add in Phase 9 (optional - net worth history):
model NetWorthSnapshot {
  id          String   @id @default(uuid())
  userId      String
  assets      Decimal  @db.Decimal(15,2)
  liabilities Decimal  @db.Decimal(15,2)
  netWorth    Decimal  @db.Decimal(15,2)
  snapshotDate DateTime
  
  user        User     @relation(fields: [userId], references: [id])
}
```

---

## Design System (Tailwind)

**Color Palette:**
```
Primary:      Indigo-600  (#4F46E5)  — buttons, links, active nav
Success:      Emerald-500 (#10B981)  — income, positive numbers
Danger:       Rose-500    (#F43F5E)  — expenses, negative, over-budget
Warning:      Amber-400   (#FBBF24)  — approaching limit, medium priority
Neutral:      Slate-700/100          — text, backgrounds
```

**Typography:**
```
Heading: font-bold text-2xl/3xl
Body: text-sm text-slate-600 (light) / text-slate-300 (dark)
Numbers: font-mono tabular-nums (for financial figures)
Amount: text-lg font-semibold
```

**Component Patterns:**
```
Cards: bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 p-6
Buttons Primary: bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-4 py-2
Buttons Danger: bg-rose-500 hover:bg-rose-600 text-white
Input: border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500
```

---

## Phase Summary Table

| Phase | Name | Key Deliverables | Effort |
|---|---|---|---|
| **0** | Foundation | API runs, frontend loads, login works | 1 session |
| **1** | Accounts & Transactions | Full CRUD, filters, search, pagination | 2-3 sessions |
| **2** | Dashboard | All financial health widgets live | 1-2 sessions |
| **3** | Goals | Create, save toward, purchase, ETA | 1-2 sessions |
| **4** | Budget | Monthly plan, actual vs. planned | 1-2 sessions |
| **5** | Analytics & Forecast | Charts, fix recurring projection bug | 2 sessions |
| **6** | Recurring Transactions | Full CRUD, mark-as-paid, schedule advance | 1 session |
| **7** | Export & Settings | CSV export, settings page | 1 session |
| **8** | UI Polish | Dark mode, mobile, toasts, animations | 1-2 sessions |
| **9** | Deployment | Neon + Render + Vercel | 1 session |
| | **TOTAL** | | **~15 sessions** |

---

## File Count (What Gets Built)

### New Backend Files
```
apps/api/src/
├── server.ts                         (implement)
├── middleware/auth.ts                 (implement)
├── types/express.d.ts                 (new)
├── routes/
│   ├── index.ts                      (update - add missing routes)
│   └── auth.ts                       (new)
├── controllers/
│   ├── AccountController.ts          (update - add edit)
│   ├── TransactionController.ts      (update - add edit/delete/filters)
│   ├── CategoryController.ts         (new)
│   ├── GoalController.ts             (new)
│   ├── BudgetController.ts           (new)
│   ├── RecurringController.ts        (new)
│   ├── ExportController.ts           (new)
│   └── SettingsController.ts         (new)
├── engines/
│   ├── AnalyticsEngine.ts            (update - trend + annual methods)
│   └── ForecastEngine.ts             (fix - proper frequency projection)
└── schemas/
    ├── financial.schema.ts           (update - add update schemas)
    ├── goal.schema.ts                (new)
    ├── budget.schema.ts              (new)
    ├── recurring.schema.ts           (new)
    └── export.schema.ts              (new)
```

### New Frontend Files
```
apps/web/src/
├── App.tsx                           (implement)
├── main.tsx                          (implement)
├── lib/
│   ├── api.ts                        (implement)
│   ├── utils.ts                      (implement)
│   └── auth.ts                       (new)
├── components/
│   ├── layout/AppShell.tsx           (implement)
│   ├── ui/
│   │   ├── Toast.tsx                 (new)
│   │   ├── ConfirmDialog.tsx         (new)
│   │   ├── AmountInput.tsx           (new)
│   │   ├── DatePicker.tsx            (new)
│   │   ├── Pagination.tsx            (new)
│   │   ├── EmptyState.tsx            (new)
│   │   ├── LoadingSkeleton.tsx       (new)
│   │   ├── CategoryBadge.tsx         (new)
│   │   └── Tooltip.tsx               (new)
├── routes/
│   ├── LoginPage.tsx                 (new)
│   ├── DashboardPage.tsx             (implement)
│   ├── TransactionsPage.tsx          (implement)
│   ├── AccountsPage.tsx              (new)
│   ├── GoalsPage.tsx                 (implement)
│   ├── BudgetPage.tsx                (implement)
│   ├── AnalyticsPage.tsx             (new)
│   ├── RecurringPage.tsx             (new)
│   └── SettingsPage.tsx              (new)
└── features/
    ├── dashboard/
    │   ├── FluidMoneyCard.tsx        (new)
    │   ├── NetWorthSummary.tsx       (new)
    │   ├── MonthSummaryCard.tsx      (new)
    │   ├── UpcomingPaymentsList.tsx  (new)
    │   ├── RecentTransactionsList.tsx (new)
    │   ├── ForecastWidget.tsx        (implement)
    │   └── api/useDashboard.ts       (implement)
    ├── transactions/
    │   ├── TransactionModal.tsx      (implement)
    │   ├── TransactionTable.tsx      (new)
    │   ├── FilterBar.tsx             (new)
    │   └── api/useTransactions.ts    (implement)
    ├── accounts/
    │   ├── AccountCard.tsx           (new)
    │   ├── AccountModal.tsx          (new)
    │   └── api/useAccounts.ts        (new)
    ├── goals/
    │   ├── GoalCard.tsx              (new)
    │   ├── GoalModal.tsx             (new)
    │   ├── GoalDepositModal.tsx      (new)
    │   ├── GoalPurchaseModal.tsx     (new)
    │   └── api/useGoals.ts           (new)
    ├── budget/
    │   ├── BudgetProgressRow.tsx     (new)
    │   ├── AddBudgetItemModal.tsx    (new)
    │   └── api/useBudget.ts          (new)
    ├── analytics/
    │   ├── CategoryDonutChart.tsx    (new)
    │   ├── MonthlyBarChart.tsx       (new)
    │   ├── SavingsRateLineChart.tsx  (new)
    │   └── api/useAnalytics.ts       (new)
    ├── recurring/
    │   ├── RecurringCard.tsx         (new)
    │   ├── RecurringModal.tsx        (new)
    │   └── api/useRecurring.ts       (new)
    └── categories/
        ├── CategoriesModal.tsx       (new)
        └── api/useCategories.ts      (new)
```

**Total new/modified files: ~70**

---

## Starting Point for Each Phase

When beginning a phase, always:
1. Read `info/04-BACKEND-LOGIC.md` before touching engines
2. Read `info/03-DATABASE-SCHEMA.md` before touching Prisma schema
3. Read `info/05-API-REFERENCE.md` before changing routes
4. Update `info/` docs after completing the phase
5. Run `npx prisma db push` after any schema changes

