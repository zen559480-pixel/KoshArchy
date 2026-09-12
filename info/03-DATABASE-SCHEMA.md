# WealthOS — Database Schema Reference

**ORM:** Prisma v5  
**Database:** PostgreSQL  
**Schema file:** `apps/api/prisma/schema.prisma`

---

## Models Overview

```
User ──────┬──── Account[] ───────── Transaction[] (via AccountTransactions)
           │                    ├─── Transaction[] (via TransferFrom)
           │                    └─── Transaction[] (via TransferTo)
           │
           ├──── Transaction[]
           ├──── Category[] ──────── Transaction[]
           │                    └─── BudgetItem[]
           ├──── Goal[] ─────────── Transaction[] (goal-linked purchases)
           ├──── Budget[] ────────── BudgetItem[]
           └──── RecurringTransaction[]
```

---

## Model Definitions

### `User`
The root entity. All other models belong to a User.

| Field | Type | Notes |
|---|---|---|
| `id` | String (UUID) | PK, auto-generated |
| `email` | String | Unique |
| `passwordHash` | String | bcrypt hash |
| `name` | String? | Optional display name |
| `currency` | String | Default: `"INR"` |
| `createdAt` | DateTime | Auto |
| `updatedAt` | DateTime | Auto |

---

### `Account`
Represents a financial account (bank, credit card, cash wallet, etc.).

| Field | Type | Notes |
|---|---|---|
| `id` | String (UUID) | PK |
| `userId` | String | FK → User |
| `name` | String | e.g., "HDFC Savings" |
| `type` | AccountType enum | BANK, CREDIT_CARD, CASH, WALLET, INVESTMENT, LOAN, OTHER |
| `balance` | Decimal(15,2) | Current actual balance (live, updated on every transaction) |
| `currency` | String | Default: `"INR"` |
| `includeInNetWorth` | Boolean | Default: true |
| `includeInJoint` | Boolean | Default: true (for joint household views) |
| `isActive` | Boolean | Default: true. Set false on soft-delete |
| `createdAt` | DateTime | Auto |
| `updatedAt` | DateTime | Auto |

**Relations:**
- `transactions` — Standard income/expense transactions
- `transfersFrom` — Transactions where money left this account
- `transfersTo` — Transactions where money arrived at this account
- `goals` — Goals where saved funds are conceptually reserved here

---

### `Category`
User-defined labels for income/expense classification.

| Field | Type | Notes |
|---|---|---|
| `id` | String (UUID) | PK |
| `userId` | String | FK → User |
| `name` | String | e.g., "Food", "Salary" |
| `type` | CategoryType enum | INCOME or EXPENSE |
| `isArchived` | Boolean | Default: false |

---

### `Transaction`
Core financial event record. Handles 3 types with different field semantics.

| Field | Type | Notes |
|---|---|---|
| `id` | String (UUID) | PK |
| `userId` | String | FK → User |
| `type` | TransactionType enum | INCOME, EXPENSE, TRANSFER |
| `amount` | Decimal(15,2) | Always positive. Direction determined by type |
| `date` | DateTime | When transaction occurred |
| `description` | String? | Short label |
| `notes` | String? | Long-form notes |
| `accountId` | String? | FK → Account (used for INCOME/EXPENSE only) |
| `categoryId` | String? | FK → Category (used for INCOME/EXPENSE only) |
| `fromAccountId` | String? | FK → Account (used for TRANSFER only) |
| `toAccountId` | String? | FK → Account (used for TRANSFER only) |
| `goalId` | String? | FK → Goal (optional: links expense to a goal purchase) |
| `createdAt` | DateTime | Auto |
| `updatedAt` | DateTime | Auto |

**Field usage by type:**
| Field | INCOME | EXPENSE | TRANSFER |
|---|---|---|---|
| `accountId` | ✅ Required | ✅ Required | ❌ null |
| `categoryId` | Optional | Optional | ❌ null |
| `fromAccountId` | ❌ null | ❌ null | ✅ Required |
| `toAccountId` | ❌ null | ❌ null | ✅ Required |

---

### `Goal`
A savings target the user is working toward.

| Field | Type | Notes |
|---|---|---|
| `id` | String (UUID) | PK |
| `userId` | String | FK → User |
| `name` | String | e.g., "MacBook Pro" |
| `targetAmount` | Decimal(15,2) | Full purchase price |
| `savedAmount` | Decimal(15,2) | How much has been saved so far (default: 0) |
| `targetDate` | DateTime? | Optional deadline |
| `status` | GoalStatus enum | ACTIVE, ACHIEVED, PURCHASED, CANCELLED |
| `priority` | Priority enum | ESSENTIAL, HIGH, MEDIUM, LOW |
| `notes` | String? | Optional notes |
| `accountId` | String? | FK → Account (where saved funds are held) |

**Goal lifecycle:** ACTIVE → ACHIEVED (savedAmount ≥ targetAmount) → PURCHASED (linked transaction created) or CANCELLED

---

### `Budget`
A monthly spending plan. One budget per user per calendar month.

| Field | Type | Notes |
|---|---|---|
| `id` | String (UUID) | PK |
| `userId` | String | FK → User |
| `month` | Int | 1–12 |
| `year` | Int | e.g., 2026 |

**Unique constraint:** `[userId, month, year]` — one budget per month per user.

---

### `BudgetItem`
A line item within a Budget, linking a Category to an expected spend.

| Field | Type | Notes |
|---|---|---|
| `id` | String (UUID) | PK |
| `budgetId` | String | FK → Budget |
| `categoryId` | String | FK → Category |
| `expectedAmount` | Decimal(15,2) | Planned spend for this category |
| `isFixed` | Boolean | Default: false (true = fixed bill like rent) |

---

### `RecurringTransaction`
Scheduled repeating income or expense (e.g., salary, rent, subscriptions).

| Field | Type | Notes |
|---|---|---|
| `id` | String (UUID) | PK |
| `userId` | String | FK → User |
| `type` | TransactionType | INCOME or EXPENSE |
| `amount` | Decimal(15,2) | Amount per occurrence |
| `description` | String | e.g., "Netflix subscription" |
| `frequency` | Frequency enum | WEEKLY, MONTHLY, etc. |
| `startDate` | DateTime | When it first started |
| `endDate` | DateTime? | Optional end date |
| `nextOccurrence` | DateTime | Next scheduled date (used by engines for querying) |

---

## Enums

| Enum | Values |
|---|---|
| `AccountType` | BANK, CREDIT_CARD, CASH, WALLET, INVESTMENT, LOAN, OTHER |
| `TransactionType` | INCOME, EXPENSE, TRANSFER |
| `CategoryType` | INCOME, EXPENSE |
| `GoalStatus` | ACTIVE, ACHIEVED, PURCHASED, CANCELLED |
| `Priority` | ESSENTIAL, HIGH, MEDIUM, LOW |
| `Frequency` | ONE_TIME, WEEKLY, BIWEEKLY, MONTHLY, QUARTERLY, YEARLY, CUSTOM |

---

## Key Design Notes

- **All balances use `Decimal(15,2)`** — supports amounts up to ₹999 trillion. Precision prevents floating-point drift.
- **Transfers prevent double counting** — A transfer has type=TRANSFER and uses `from/toAccountId`. Analytics queries explicitly exclude `type: 'TRANSFER'` from income/expense sums.
- **`nextOccurrence` on RecurringTransaction** — The engines query this field directly. It must be kept updated as transactions are "triggered" (not yet implemented in controllers).
- **`savedAmount` on Goal** — Currently a stored field. In a future implementation, it could be derived by summing linked transactions, but storing it allows fast reads.
