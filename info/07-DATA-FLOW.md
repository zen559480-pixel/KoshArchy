# WealthOS — Data Flow & System Flows

## 1. Create Transaction Flow (INCOME/EXPENSE)

```
User fills TransactionModal
        │
        ▼
useTransactions.createTransaction(data)
        │
        ▼
api.post('/transactions', { type:'EXPENSE', amount, date, accountId, categoryId })
        │
        ▼
[API] validate middleware
  └─ Zod discriminatedUnion('type') → picks standardTransaction schema
  └─ Validates amount > 0, date is ISO8601, accountId is UUID
  └─ ✅ next() or ❌ 400 error
        │
        ▼
[API] TransactionController.createTransaction
        │
        ▼
prisma.$transaction(async (tx) => {
  tx.transaction.create({ ...data })
  tx.account.update({ balance: { decrement: amount } })  // for EXPENSE
})
        │
  ✅ Both succeed → commit → 201 { data: transaction }
  ❌ Either fails → rollback → 400 error
        │
        ▼
Frontend refreshes transaction list
```

---

## 2. Create Transaction Flow (TRANSFER)

```
User selects TRANSFER, picks fromAccount, toAccount, amount
        │
        ▼
api.post('/transactions', { type:'TRANSFER', fromAccountId, toAccountId, amount })
        │
        ▼
[API] Zod validate
  └─ picks transferTransaction schema
  └─ .refine(): fromAccountId !== toAccountId → ✅ or ❌ 400
        │
        ▼
prisma.$transaction(async (tx) => {
  tx.transaction.create({ fromAccountId, toAccountId, amount, type:'TRANSFER' })
  tx.account.update({ fromAccountId, balance: { decrement: amount } })
  tx.account.update({ toAccountId,   balance: { increment: amount } })
})
```

> **Key point:** Transfer records have `accountId = null` and `categoryId = null`, so they are NEVER included in income/expense sums in the AnalyticsEngine.

---

## 3. Fluid Money Calculation Flow

```
GET /api/dashboard/fluid-money
        │
        ▼
DashboardController.getFluidMoney(userId)
        │
        ▼
FluidMoneyEngine.calculate(userId)
        │
  ┌─────┴──────────────────────────────────────────┐
  │1. prisma.account.findMany(active, inNetWorth)   │
  │   → classify into assets vs liabilities         │
  │                                                 │
  │2. prisma.goal.findMany(ACTIVE)                  │
  │   → sum savedAmount → reservedForGoals          │
  │                                                 │
  │3. prisma.recurringTransaction.findMany           │
  │   (type=EXPENSE, nextOccurrence in rest-of-month)│
  │   → sum amounts → upcomingExpenses              │
  └─────────────────────────────────────────────────┘
        │
        ▼
fluidMoney = assets - liabilities - reservedForGoals - upcomingExpenses
        │
        ▼
Response: { totalAssets, totalLiabilities, reservedForGoals, upcomingExpenses, fluidMoney }
```

---

## 4. Balance Forecast Flow

```
GET /api/dashboard/forecast?days=90
        │
        ▼
ForecastEngine.generateForecast(userId, 90)
        │
  ┌─────┴──────────────────────────────────────────────┐
  │1. FluidMoneyEngine.calculate(userId)                │
  │   → baseline = totalAssets - totalLiabilities      │
  │                                                    │
  │2. prisma.recurringTransaction.findMany              │
  │   (nextOccurrence >= today, active)                │
  │                                                    │
  │3. prisma.goal.findMany                              │
  │   (ACTIVE, targetDate >= today)                    │
  └─────────────────────────────────────────────────────┘
        │
        ▼
for i = 0 to 89:
  currentDate = today + i days
  
  dailyIncome = sum(recurringTxns where nextOccurrence == currentDate AND type=INCOME)
  dailyExpenses = sum(recurringTxns where nextOccurrence == currentDate AND type=EXPENSE)
  dailyPurchases = sum(goals where targetDate == currentDate)
  
  closingBalance = openingBalance + dailyIncome - dailyExpenses - dailyPurchases
  
  push ForecastPoint to array
  openingBalance = closingBalance
        │
        ▼
Response: ForecastPoint[] (90 items)
```

---

## 5. Monthly Analytics Flow

```
GET /api/analytics/dashboard?month=9&year=2026
        │
        ▼
AnalyticsController.getDashboardSummary(userId, month=9, year=2026)
        │
        ▼
Promise.all([
  AnalyticsEngine.getMonthlySummary(userId, Sep 2026),
  AnalyticsEngine.getSpendingByCategory(userId, Sep 2026)
])
        │
  ┌─────┴──────────────────────────────────────────┐
  │ getMonthlySummary:                              │
  │  prisma.transaction.groupBy(['type'])           │
  │  where: date in [Sep1, Sep30], type IN [INCOME, EXPENSE]│
  │  _sum: { amount }                               │
  │  → income, expenses, surplus, savingsRate       │
  └─────────────────────────────────────────────────┘
        +
  ┌─────────────────────────────────────────────────┐
  │ getSpendingByCategory:                          │
  │  prisma.transaction.findMany(EXPENSE, Sep)      │
  │  include: { category }                          │
  │  → group in-memory by categoryId               │
  │  → sort desc by total                           │
  │  → add percentage of total expenses             │
  └─────────────────────────────────────────────────┘
        │
        ▼
Response: { summary, categorySpending[] }
```

---

## 6. Soft Delete Account Flow

```
DELETE /api/accounts/:id
        │
        ▼
AccountController.deleteAccount(id, userId)
        │
        ▼
prisma.account.update({
  where: { id, userId },         ← User-scoped! Cannot delete others' accounts
  data: { isActive: false, includeInNetWorth: false }
})
        │
        ▼
204 No Content

RESULT:
- Account disappears from GET /accounts (filtered by isActive: true)
- Account disappears from FluidMoneyEngine calculations (filtered by isActive: true + includeInNetWorth: true)
- Historical transactions are PRESERVED (still linked to accountId)
- Soft-deleted accounts still appear in transaction history joins
```

---

## Account Balance Update Model

Account balances are **live, denormalized** — they are updated on every transaction creation.

```
Initial: account.balance = 100,000

After INCOME of 50,000:  → 150,000
After EXPENSE of 10,000: → 140,000
After TRANSFER out of 20,000: → 120,000
After TRANSFER in of 15,000:  → 135,000
```

This is a deliberate design choice for fast reads (no need to sum all transactions to get current balance). The tradeoff: the source of truth for balance is the `balance` field, not derived from transactions. The two must stay in sync — which is enforced by using Prisma `$transaction()` for atomicity.

---

## Goal → Transaction Link

When a user "purchases" a goal item (marks it as PURCHASED):
1. A Transaction of type EXPENSE is created
2. The transaction's `goalId` field is set to the goal's ID
3. Goal status updates to PURCHASED

This creates a traceable audit trail linking the purchase expense back to the savings goal.

> ⚠️ The controller for this flow is **not yet implemented**. The schema supports it but no endpoint exists.
