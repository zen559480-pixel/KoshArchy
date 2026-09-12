# WealthOS — Known Gaps, Status & Next Phases

## Phase 0 Status: ✅ COMPLETE (Foundation)
- ✅ Dockerized PostgreSQL 16 database running and synced
- ✅ Express API bootstrap with CORS, Helmet, auto-seeding
- ✅ JWT Authentication & user authorization guard
- ✅ React 18 + Vite + Tailwind shell, login flow, routing

---

## Phase 1 Status: ✅ COMPLETE (Accounts & Transactions Core Flow)
- ✅ **Accounts CRUD**: Create, read, update, soft-delete with transaction counts
- ✅ **Categories CRUD**: Category management with type separation, custom hex colors, archive
- ✅ **Transactions CRUD**: Record income, expenses, and transfers with atomic balance updates
- ✅ **Transaction Filters & Search**: Type, account, category, date presets, custom date range, search by description/notes
- ✅ **Pagination**: Full server-side pagination with limit, page numbers, and total counters
- ✅ **Balance Reversion & Reconciliation**: Soft deletes and transaction edits atomically adjust balances
- ✅ **UI Components & Pages**:
  - `AccountsPage` with Net Worth banner, account type filter tabs, and Add/Edit modals
  - `TransactionsPage` with FilterBar, TransactionTable, mobile responsive card view, pagination
  - `TransactionModal` for create and edit
  - `CategoriesModal` for category management
  - Reusable `Toast`, `ConfirmDialog`, `AmountInput`, `DatePicker`, `CategoryBadge`, `EmptyState`

---

## Phase 2 Status: ✅ COMPLETE (Dashboard Live Metrics)
- ✅ **Fluid Money Hero Card**: Live spendable balance calculation, health status badge, 4-pillar breakdown (Assets, Debt, Goal Reserves, Upcoming Bills), formula explanation modal.
- ✅ **Net Worth Summary**: Total equity across active accounts, asset-to-debt solvency bar with percentage split, link to Accounts.
- ✅ **Current Month Cash Flow**: Income, expenses, surplus/deficit, savings rate progress badge, and top 3 spending category pills.
- ✅ **Interactive Cash Flow Forecast**: 30 or 90 days Recharts AreaChart with projected balance, hover breakdown tooltip, and negative balance dip warning.
- ✅ **Account Balances Preview**: Quick grid of active accounts with type emojis, balances, and "+ Add Account" modal trigger.
- ✅ **Upcoming Payments Due**: Next 14 days recurring bills preview with frequency tags and amounts.
- ✅ **Recent Activity**: Last 5 transactions list with type indicators, category badges, and quick "Add Transaction" trigger.

---

## Phase 3 Status: ✅ COMPLETE (Savings Goals & Milestones)
- ✅ **GoalController CRUD**: Create, read, update, deposit, purchase, cancel, delete.
- ✅ **Computed Progress & ETA**: Live percentage calculation, remaining amount, and projected months left based on 3-month rolling surplus.
- ✅ **Deposit Modal**: Add savings towards any goal with optional automatic account deduction and expense transaction creation.
- ✅ **Goal Purchase Flow**: Mark goals as `PURCHASED`, creating linked transactions and updating balances atomically.
- ✅ **UI Components & Pages**:
  - `GoalsPage`: Target & Saved KPI banner, status filter tabs (All, In Progress, Ready, Purchased, Cancelled), priority filters.
  - `GoalCard`: Visual priority badges, progress bar, formatted INR, deadline & ETA indicators, holding account badges.
  - `GoalModal`, `GoalDepositModal`, `GoalPurchaseModal`, `ConfirmDialog`.

---

## Phase 4 Status: ✅ COMPLETE (Monthly Budgeting & Limits)
- ✅ **BudgetController**: Monthly budget creation, upserting category limits, joining live transaction actuals, unbudgeted category detection, and cross-month cloning.
- ✅ **Dynamic Progress & Status**: Calculates `actualAmount`, `remainingAmount`, `percentUsed`, and dynamic health status (`OK`, `WARNING`, `OVER`).
- ✅ **UI Components & Pages**:
  - `BudgetPage`: Month navigation bar, overall budget health banner, variable vs fixed expense grouping, unbudgeted spending alert.
  - `BudgetProgressRow`: Category name, dynamic tri-color progress bar, amount left or over budget badge, edit and delete buttons.
  - `AddBudgetItemModal`: Add or edit category monthly allowance, fixed commitment toggle.
  - `CopyBudgetModal`: One-click copy of budgets across months.

---

## Next Up: Feature Implementation Phases

### Phase 5 — Analytics & Forecast (Deep Insights) — COMPLETE
- [x] Fix `ForecastEngine` to project repeating schedules across future weeks/months
- [x] 6-month and 12-month income vs. expense bar charts (Recharts)
- [x] Category spending donut chart with interactive legend & percentage bars
- [x] 12-month savings rate trend line chart with 20% benchmark
- [x] 90-day cash flow forecast area chart with negative dip alerts & goal milestones
- [x] Full annual consolidated summary (12-month table & annual category distribution)
- [x] Route `/analytics` mounted and active in web navigation


### Phase 6 — Recurring Payments — COMPLETE
- [x] `RecurringController` CRUD (GET, POST, PATCH, DELETE)
- [x] "Mark as Paid" action to create real transaction, update balance atomically, and advance `nextOccurrence`
- [x] Deactivate schedule action (`endDate = now()`) and safe delete protection
- [x] `RecurringPage.tsx` with search, type/status filters, and KPI cards
- [x] `RecurringCard.tsx`, `RecurringModal.tsx`, and `MarkPaidModal.tsx`
- [x] Dashboard upcoming payments widget linked to `/recurring`
- [x] Route `/recurring` integrated into App router and AppShell navigation


### Phase 7 — Export & Settings — COMPLETE
- [x] CSV export for transactions with filters and stream generation
- [x] CSV export for comprehensive annual report
- [x] Settings page for user profile, currency display, password update
- [x] Danger zone for financial data reset with password & confirmation guard
- [x] Route `/settings` mounted in App router and AppShell navigation


### Phase 8 — UI Polish & Dark Mode — COMPLETE
- [x] Dark mode toggle with persistence and inline anti-flicker script
- [x] Mobile navigation bar and responsive hamburger menu drawer
- [x] Loading skeleton screens across dashboard, analytics, and settings
- [x] Animated count-up component for Fluid Money and Net Worth values
- [x] Contextual help tooltips for formulas
- [x] Global Floating Action Button (FAB) and `Ctrl+N` / `Cmd+N` keyboard shortcuts


### Quality Assurance: In-Depth E2E Testing & 2-Year Simulation — COMPLETE
- [x] 11 Automated test suites executed via `npm run e2e:simulation`
- [x] 82/82 tests passed (100% pass rate) with zero failures
- [x] 24-month realistic financial simulation (₹38L income, ₹14.16L expenses, ₹6L SIP)
- [x] Verified atomic balance reconciliation, soft deletes, goal transitions, budget cloning, recurring advancement, CSV exports, and Net Worth integrity
- [x] Zero TypeScript compilation errors in `apps/api` and `apps/web` (`tsc --noEmit`)
- [x] Clean production build for Vite frontend (`npm run build`)


### Phase 9 — Cloud Deployment
- [ ] Neon DB migration
- [ ] Render Web Service for Express API
- [ ] Vercel deployment for React frontend
