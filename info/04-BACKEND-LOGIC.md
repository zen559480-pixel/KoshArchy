# WealthOS — Backend Logic Deep Dive

## Architecture Overview

```
HTTP Request
     │
     ▼
[requireAuth middleware]  ← Verifies JWT, attaches req.user
     │
     ▼
[validate middleware]     ← Zod schema parses req.body/query/params
     │
     ▼
[Controller]              ← Handles request, calls engines/Prisma
     │
     ▼
[Engine (if complex)]     ← Pure business logic, returns structured data
     │
     ▼
[Prisma ORM]              ← Database queries to PostgreSQL
     │
     ▼
HTTP Response (JSON)
```

---

## Middleware

### `validate.ts` — Zod Validation Middleware
**Location:** `apps/api/src/middleware/validate.ts`

A generic higher-order function that wraps any Zod schema into an Express middleware.

```
validate(schema) → async (req, res, next) => {
  schema.parseAsync({ body: req.body, query: req.query, params: req.params })
  ✅ → next()
  ❌ ZodError → 400 { status, message, errors: [{ field, message }] }
}
```

Accepts `AnyZodObject | ZodEffects` — supports both plain objects and discriminated unions / refined schemas.

### `auth.ts` — JWT Auth Middleware  
**Status: EMPTY STUB** — Needs to be implemented.  
Expected behavior:
1. Extract `Authorization: Bearer <token>` from headers
2. Verify with `jsonwebtoken.verify(token, JWT_SECRET)`
3. Attach decoded payload to `req.user`
4. Call `next()` or return `401`

---

## Zod Schemas

### `financial.schema.ts`

**`createAccountSchema`**
```
body: {
  name: string (1–100 chars)
  type: AccountType enum
  balance: string | number (must be valid number)
  currency: string (3 chars, default "INR")
  includeInNetWorth: boolean (default true)
  includeInJoint: boolean (default true)
}
```

**`createTransactionSchema`** — Discriminated union on `type` field:

| If `type` is... | Required fields |
|---|---|
| `INCOME` or `EXPENSE` | `amount`, `date`, `accountId`, optional `categoryId`, `description`, `notes` |
| `TRANSFER` | `amount`, `date`, `fromAccountId`, `toAccountId` (must differ) |

The `.refine()` on transfer also rejects same-account transfers at schema level (before controller even runs).

### `analytics.schema.ts`
```
query: {
  month?: string (regex: 1–12)
  year?: string (regex: 20XX)
}
```

---

## Controllers

### `AccountController`
**Location:** `apps/api/src/controllers/AccountController.ts`

| Method | Operation | Notes |
|---|---|---|
| `getAccounts` | `findMany({ userId, isActive: true })` ordered by balance desc | Returns active accounts only |
| `createAccount` | `create({...})` | Prisma handles Decimal coercion from string/number |
| `deleteAccount` | `update({ isActive: false, includeInNetWorth: false })` | **Soft delete only** — preserves history |

All queries are **user-scoped** via `userId: req.user.id` — no cross-user data leaks possible.

### `TransactionController`
**Location:** `apps/api/src/controllers/TransactionController.ts`

**`createTransaction`** — The most complex operation:
```
prisma.$transaction(async (tx) => {
  1. Create Transaction record
     - accountId set only for INCOME/EXPENSE
     - fromAccountId/toAccountId set only for TRANSFER
     - categoryId set only for INCOME/EXPENSE

  2. Update Account balances atomically:
     INCOME  → account.balance += amount
     EXPENSE → account.balance -= amount
     TRANSFER → fromAccount.balance -= amount
              → toAccount.balance += amount
})
```
Uses `decimal.js` for the amount and Prisma's `{ increment }` / `{ decrement }` operators for safe concurrent updates.

**`getTransactions`** — Returns last 50 transactions with joined account and category names. Pagination is noted as a TODO.

### `DashboardController`
**Location:** `apps/api/src/controllers/DashboardController.ts`

| Method | Delegates To | Query param |
|---|---|---|
| `getFluidMoney` | `FluidMoneyEngine.calculate(userId)` | none |
| `getForecast` | `ForecastEngine.generateForecast(userId, days)` | `?days=90` (default 90) |

### `AnalyticsController`
**Location:** `apps/api/src/controllers/AnalyticsController.ts`

Calls both `getMonthlySummary` and `getSpendingByCategory` in parallel via `Promise.all()`. Accepts optional `?month=&year=` query params (defaults to current date).

---

## Business Engines

### `FluidMoneyEngine`
**Location:** `apps/api/src/engines/FluidMoneyEngine.ts`  
**Purpose:** Calculate the user's true "spendable" money right now.

**Formula:**
```
Fluid Money = Total Assets - Total Liabilities - Reserved for Goals - Upcoming Expenses (rest of month)
```

**Step-by-step calculation:**
1. Fetch all active accounts where `includeInNetWorth = true`
2. Classify balances:
   - **Assets:** BANK, CASH, WALLET, INVESTMENT → add to `totalAssets`
   - **Liabilities:** CREDIT_CARD, LOAN → add to `totalLiabilities`
3. Sum `savedAmount` from all `ACTIVE` goals → `reservedForGoals`
4. Sum recurring `EXPENSE` transactions where `nextOccurrence` is between today and end-of-month → `upcomingExpenses`
5. Return all 5 figures: `{ totalAssets, totalLiabilities, reservedForGoals, upcomingExpenses, fluidMoney }`

**Interface returned:**
```typescript
interface FluidMoneyBreakdown {
  totalAssets: Decimal;
  totalLiabilities: Decimal;
  reservedForGoals: Decimal;
  upcomingExpenses: Decimal;
  fluidMoney: Decimal;
}
```

---

### `ForecastEngine`
**Location:** `apps/api/src/engines/ForecastEngine.ts`  
**Purpose:** Simulate day-by-day balance changes over N days using recurring transactions and planned goal purchases.

**Algorithm:**
1. Get current net position: `FluidMoneyEngine.calculate(userId)` → baseline = `totalAssets - totalLiabilities`
2. Fetch all future recurring transactions (`nextOccurrence >= today`)
3. Fetch all ACTIVE goals with a `targetDate >= today`
4. Loop day-by-day for `daysToForecast` (default 90):
   - For each day, check which recurring transactions hit on that day (using `isSameDay`)
   - Add income, subtract expenses
   - If a goal's `targetDate` falls on this day, subtract `targetAmount` as a planned purchase
   - Record `ForecastPoint { date, openingBalance, expectedIncome, expectedExpenses, plannedPurchases, closingBalance }`
   - Carry `closingBalance` forward as next day's `openingBalance`

**Known limitation (documented in code):** The current `isSameDay(txn.nextOccurrence, currentDate)` check only works for transactions hitting on their `nextOccurrence` date. For a complete implementation, recurring transactions would need to be mathematically projected forward based on `frequency` enum (e.g., every 30 days for MONTHLY).

**Interface returned:**
```typescript
interface ForecastPoint {
  date: Date;
  openingBalance: Decimal;
  expectedIncome: Decimal;
  expectedExpenses: Decimal;
  plannedPurchases: Decimal;
  closingBalance: Decimal;
}
```

---

### `AnalyticsEngine`
**Location:** `apps/api/src/engines/AnalyticsEngine.ts`  
**Purpose:** Monthly income/expense summary and category-level spending breakdown for charts.

**`getMonthlySummary(userId, targetDate)`**
- Uses Prisma `groupBy` aggregation (efficient DB-level sum)
- Explicitly excludes TRANSFER type from aggregation
- Calculates:
  - `income` — total INCOME for the month
  - `expenses` — total EXPENSE for the month
  - `surplus` — income - expenses
  - `savingsRate` — (surplus / income) × 100, rounded to 1 decimal
  - Edge case: if income = 0 and expense > 0, savingsRate = 0 (safe for UI)

**`getSpendingByCategory(userId, targetDate)`**
- Fetches EXPENSE transactions with categories joined (in-memory grouping for easy name access)
- Builds a `Map<categoryId, { name, total }>` 
- Outputs sorted array (largest spend first):
  ```json
  [
    { "name": "Food", "value": 5000, "percentage": 28.5 },
    { "name": "Transport", "value": 2000, "percentage": 11.4 }
  ]
  ```
- Ready for Recharts Donut/Pie chart consumption

---

## Security Model

- All API routes are behind `requireAuth` middleware (applied at router level with `router.use(requireAuth)`)
- All database queries are scoped to `userId: req.user.id` — prevents horizontal privilege escalation
- Delete operations include both `id` AND `userId` in the WHERE clause for double protection
- Passwords hashed with `bcryptjs` (bcrypt not yet used in controllers — auth flow not yet implemented)
- `helmet` protects against common HTTP security vulnerabilities
- `cors` restricts cross-origin requests

---

## Decimal Safety

Every financial calculation chains through `decimal.js`:
```typescript
// Never: amount1 + amount2 (float)
// Always:
const amount = new Decimal(account.balance.toString());
totalAssets = totalAssets.plus(amount);
```

Prisma returns Decimal fields as `Prisma.Decimal` objects. They are always converted via `.toString()` before passing to `decimal.js` constructor to prevent type mixing.
