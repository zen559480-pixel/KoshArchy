# WealthOS — API Reference

**Base URL:** `http://localhost:3001/api`  
**Auth:** All routes except `/auth/login` require `Authorization: Bearer <JWT_TOKEN>` header  
**Content-Type:** `application/json`

---

## Authentication

### `POST /api/auth/login`
Validates credentials against the seeded user, returns JWT and user profile.

**Request body:**
```json
{
  "email": "admin@wealthos.local",
  "password": "changeme123"
}
```

**Response 200:**
```json
{
  "token": "eyJhbGciOi...",
  "user": {
    "id": "uuid",
    "email": "admin@wealthos.local",
    "name": "Admin",
    "currency": "INR"
  }
}
```

### `GET /api/auth/me`
Returns the authenticated user details.

---

## Accounts

### `GET /api/accounts`
Returns all accounts for the user (default: active only).
- Query params: `includeArchived=true` (optional)

### `GET /api/accounts/:id`
Returns single account details with transaction count.

### `POST /api/accounts`
Creates a new account.
```json
{
  "name": "HDFC Savings",
  "type": "BANK",
  "balance": 85000,
  "currency": "INR",
  "includeInNetWorth": true,
  "includeInJoint": true
}
```

### `PATCH /api/accounts/:id`
Updates account details or adjusts balance.

### `DELETE /api/accounts/:id`
Soft-deletes account (`isActive: false, includeInNetWorth: false`). Historical transactions preserved.

---

## Categories

### `GET /api/categories`
Returns all categories for user.
- Query params: `type=INCOME|EXPENSE`, `includeArchived=true`

### `POST /api/categories`
Creates a new category.
```json
{
  "name": "Freelance",
  "type": "INCOME",
  "color": "#10B981"
}
```

### `PATCH /api/categories/:id`
Updates category name, type, color, icon, or archive status.

### `DELETE /api/categories/:id`
Soft-archives category (`isArchived: true`).

---

## Transactions

### `GET /api/transactions`
Returns paginated list of transactions matching active filter criteria.

**Query Parameters:**
| Param | Type | Description |
|---|---|---|
| `page` | number | Page number (default 1) |
| `limit` | number | Results per page (default 20, max 100) |
| `type` | string | `INCOME`, `EXPENSE`, or `TRANSFER` |
| `accountId` | UUID | Filter by involved account |
| `categoryId` | UUID | Filter by category |
| `dateFrom` | ISO date | Lower bound on transaction date |
| `dateTo` | ISO date | Upper bound on transaction date |
| `search` | string | Case-insensitive search on description and notes |

**Response 200:**
```json
{
  "data": [
    {
      "id": "uuid",
      "type": "EXPENSE",
      "amount": "1500",
      "date": "2026-09-12T10:00:00.000Z",
      "description": "Course subscription",
      "notes": null,
      "account": { "id": "uuid", "name": "HDFC", "type": "BANK" },
      "category": { "id": "uuid", "name": "Education", "color": "#3B82F6" },
      "fromAccount": null,
      "toAccount": null
    }
  ],
  "pagination": {
    "total": 42,
    "page": 1,
    "limit": 20,
    "totalPages": 3
  }
}
```

### `GET /api/transactions/:id`
Returns a single transaction by ID.

### `POST /api/transactions`
Creates a transaction and atomically updates account balances.
- **For INCOME / EXPENSE:** Requires `type`, `amount`, `date`, `accountId`. Optional `categoryId`, `description`, `notes`.
- **For TRANSFER:** Requires `type: "TRANSFER"`, `amount`, `date`, `fromAccountId`, `toAccountId`.

### `PATCH /api/transactions/:id`
Updates transaction fields. Atomically reconciles and adjusts account balances if amount, account, or transfer targets change.

### `DELETE /api/transactions/:id`
Soft-deletes transaction (`isDeleted: true`). Atomically reverts previous balance effect on the linked account(s).

---

## Dashboard & Analytics

### `GET /api/dashboard/fluid-money`
Returns Fluid Money breakdown (`totalAssets`, `totalLiabilities`, `reservedForGoals`, `upcomingExpenses`, `fluidMoney`).

### `GET /api/dashboard/forecast?days=90`
Returns projected cashflow balance array.

### `GET /api/dashboard/upcoming?days=14`
Returns recurring scheduled bills due in next N days.

### `GET /api/analytics/dashboard?month=9&year=2026`
Returns monthly income, expense, surplus, savings rate, and category spending breakdown.

### `GET /api/analytics/trends?months=6`
Returns array of last N months (`months` = 1 to 24, default 6) with `{ month, year, label, shortLabel, income, expenses, surplus, savingsRate }`.

### `GET /api/analytics/annual?year=2026`
Returns full annual summary for the specified year: `{ year, totalIncome, totalExpenses, totalSurplus, overallSavingsRate, averageMonthlyIncome, averageMonthlyExpenses, averageMonthlySurplus, monthlyBreakdown: [...12 months], categoryBreakdown: [{ name, color, total, percentage }] }`.

---


## Goals

### `GET /api/goals`
Returns all goals for user with computed metrics (`progressPercent`, `remainingAmount`, `estimatedMonthsLeft`, `estimatedDate`, `isOverdue`).
- Query params: `status` ('ACTIVE', 'ACHIEVED', 'PURCHASED', 'CANCELLED', 'ALL'), `priority` ('ESSENTIAL', 'HIGH', 'MEDIUM', 'LOW').

### `GET /api/goals/:id`
Returns single goal with metrics, account details, and linked purchase transactions.

### `POST /api/goals`
Creates a goal:
```json
{
  "name": "Emergency Fund",
  "targetAmount": 250000,
  "savedAmount": 50000,
  "targetDate": "2027-06-30T00:00:00.000Z",
  "priority": "ESSENTIAL",
  "accountId": "uuid"
}
```

### `PATCH /api/goals/:id`
Updates goal details. Automatically transitions status to `ACHIEVED` when `savedAmount >= targetAmount`.

### `POST /api/goals/:id/deposit`
Adds savings towards a goal:
```json
{
  "amount": 10000,
  "accountId": "uuid",
  "createTransaction": true
}
```
If `createTransaction` is true, automatically creates an EXPENSE transaction and decrements the account balance.

### `POST /api/goals/:id/purchase`
Marks goal as purchased:
```json
{
  "purchaseAmount": 165000,
  "accountId": "uuid",
  "categoryId": "uuid",
  "description": "MacBook Pro M4"
}
```
Atomically creates an EXPENSE transaction, decrements account balance, and sets goal status to `PURCHASED`.

### `PATCH /api/goals/:id/cancel`
Sets goal status to `CANCELLED`.

### `DELETE /api/goals/:id`
Hard-deletes goal if no linked transactions exist; soft-cancels if transactions are attached.

---

## Budgets

### `GET /api/budgets?month=9&year=2026`
Returns monthly budget with enriched category actuals, unbudgeted expenses, and overall budget health.

### `POST /api/budgets`
Creates or initializes a monthly budget with an array of category limits:
```json
{
  "month": 9,
  "year": 2026,
  "items": [
    {
      "categoryId": "uuid",
      "expectedAmount": 8000,
      "isFixed": false
    }
  ]
}
```

### `PATCH /api/budgets/:budgetId/items`
Upserts a category spending limit in the specified budget:
```json
{
  "categoryId": "uuid",
  "expectedAmount": 12000,
  "isFixed": true
}
```

### `DELETE /api/budgets/items/:itemId`
Deletes a category limit from the budget.

### `POST /api/budgets/copy`
Copies all category limits from a previous month to a target month:
```json
{
  "fromMonth": 8,
  "fromYear": 2026,
  "toMonth": 9,
  "toYear": 2026
}
```

---

## Recurring Transactions

### `GET /api/recurring`
Returns list of all recurring transaction rules with account and category details, and linked transaction count.
- Query params: `type` ('INCOME', 'EXPENSE', 'ALL'), `status` ('ACTIVE', 'INACTIVE', 'ALL').

### `GET /api/recurring/:id`
Returns single recurring transaction with recent linked transactions.

### `POST /api/recurring`
Creates a recurring transaction rule:
```json
{
  "description": "Netflix Subscription",
  "type": "EXPENSE",
  "amount": 649,
  "frequency": "MONTHLY",
  "startDate": "2026-09-15T00:00:00.000Z",
  "endDate": null,
  "accountId": "uuid",
  "categoryId": "uuid"
}
```

### `PATCH /api/recurring/:id`
Updates recurring rule (amount, frequency, description, dates, account, category).

### `POST /api/recurring/:id/mark-paid`
Records an actual `Transaction` linked to this recurring rule, adjusts the account balance atomically, and advances `nextOccurrence` by one cycle according to frequency.
```json
{
  "amount": 649,
  "date": "2026-09-15T00:00:00.000Z",
  "accountId": "uuid"
}
```

### `PATCH /api/recurring/:id/deactivate`
Sets `endDate = now()`, immediately deactivating the rule and stopping future projections.

### `DELETE /api/recurring/:id`
Deletes the recurring rule. Guarded: rejects deletion if recorded payments exist linked to this rule (advises deactivating instead).

---

## Data Export

### `GET /api/export/transactions`
Streams a CSV file containing transaction records formatted for spreadsheets.
- Query parameters:
  - `dateFrom`: string (YYYY-MM-DD)
  - `dateTo`: string (YYYY-MM-DD)
  - `type`: 'INCOME' | 'EXPENSE' | 'TRANSFER' | 'ALL'
  - `accountId`: uuid
  - `categoryId`: uuid

### `GET /api/export/annual?year=YYYY`
Streams a comprehensive annual report CSV file containing key financial totals, 12-month breakdown table, and category distribution.

---

## User Settings & Maintenance

### `GET /api/settings`
Returns current user profile (`id`, `email`, `name`, `currency`, `createdAt`).

### `PATCH /api/settings`
Updates user profile settings and/or password:
```json
{
  "name": "Zen Master",
  "currency": "INR",
  "currentPassword": "oldPassword123",
  "newPassword": "newPassword456"
}
```

### `POST /api/settings/reset-data`
Destructive administrative action. Wipes all transactions, budgets, recurring rules, and goals, and resets account balances to 0:
```json
{
  "confirmation": "RESET DATA",
  "password": "userPassword123"
}
```


