<div align="center">

<img src="apps/web/public/logo.png" alt="KoshArchy Logo" width="160" />

# KoshArchy
### Personal Finance Command Center

*Sovereign Wealth Management, True Spendable Balance & Cash Flow Forecasting*

[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-61dafb?logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Express](https://img.shields.io/badge/Express-4.19-black?logo=express&logoColor=white)](https://expressjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-5.20-2D3748?logo=prisma&logoColor=white)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Tests](https://img.shields.io/badge/Tests-82%2F82%20Passing%20(100%25)-success?logo=checkmarx&logoColor=white)](#automated-testing--2-year-simulation)
[![License](https://img.shields.io/badge/License-MIT-purple.svg)](LICENSE)

</div>

---

## 📖 Overview

**KoshArchy** (derived from *Kosh* [कोष — treasury/wealth] and *Archy* [governance & sovereignty]) is a privacy-first, self-hostable personal finance command center designed for individuals who want complete clarity over their money.

Unlike traditional budget trackers that only record where money *went*, KoshArchy computes **what is truly safe to spend right now** and **where your cash flow is headed over the next 90 days**.

Built with an **Obsidian Dragon dark aesthetic** (`#070709` deep black with fiery crimson and molten gold accents), KoshArchy offers desktop and mobile responsiveness, high-precision mathematical balance reconciliation, and zero third-party telemetry.

---

## ⚡ The Signature Innovation: Fluid Money Engine

Most financial anxiety comes from the **"Illusion of Balance"** — your bank account shows ₹1,50,000, but ₹40,000 is needed for rent in 5 days, ₹25,000 is credit card debt, and ₹50,000 is reserved for your emergency fund. You actually only have ₹35,000 of spendable money.

KoshArchy solves this through the **Fluid Money Formula**:

$$\mathbf{Fluid\ Money} = \mathbf{Liquid\ Assets} - \mathbf{Liabilities} - \mathbf{Goal\ Reserves} - \mathbf{Upcoming\ Bills\ (14d)}$$

| Component | Source | Description |
|---|---|---|
| **Liquid Assets** | Active Bank, Cash & Wallet accounts | Readily spendable funds (excludes loans/investments). |
| **Current Liabilities** | Credit card negative balances & unpaid debts | Outstanding short-term debt that must be settled. |
| **Goal Reserves** | Savings accumulated in active Goals | Money earmarked for specific targets (never double-counted). |
| **Upcoming Bills** | Recurring payments due within 14 days | Essential scheduled commitments to guarantee solvency. |

---

## 🚀 Key Features

### 1. 📊 Executive Command Center (Dashboard)
- **Fluid Money Hero Card**: Real-time spendable calculation with health status indicator (`HEALTHY`, `CAUTION`, `CRITICAL`) and mathematical breakdown explainer.
- **Net Worth & Solvency**: Asset-to-liability equity ratio with visual distribution bar.
- **Monthly Cash Flow**: Income, expenses, monthly surplus, and real-time savings rate.
- **Cash Flow Forecast Widget**: 30-to-90-day interactive Recharts AreaChart projecting future bank balances with automated negative dip warnings.
- **Scheduled Payments Preview**: Next 14 days of recurring commitments and bills.
- **Recent Activity Feed**: Quick transaction list with inline category tags and instant modal triggers.

### 2. 🏦 Accounts & Liquidity Management
- Supports **Bank Accounts, Credit Cards, Cash, Digital Wallets, Investment Portfolios, and Loans**.
- Toggle accounts to be included or excluded from Net Worth calculations.
- Atomic balance adjustment and reconciliation on manual balance corrections.

### 3. 💳 Multi-Type Transactions Engine
- Full support for **Income**, **Expenses**, and **Transfers** (inter-account transfers adjust both balances without double-counting revenue or spend).
- Atomic balance updates on creation, edit, and deletion (soft delete with ledger restoration).
- Multidimensional filtering by Type, Account, Category, Date Presets (*This Month, Last Month, Year-to-Date*), Custom Date Range, and full-text search.
- Server-side pagination with custom page limits.

### 4. 🎯 Savings Goals & Milestones
- Target amount, target date, priority tiers (*Essential, High, Medium, Low*), and holding account linkage.
- **Dynamic ETA Projection**: Automatically estimates time to achievement based on your rolling 3-month average savings surplus.
- **Deposit Flow**: Move savings into goals with optional automatic ledger expense creation and account deduction.
- **Goal Purchase Flow**: Mark goals as `PURCHASED` upon completion, automatically logging linked expense transactions.

### 5. 📅 Dynamic Monthly Budgeting
- Category-level monthly spending limits.
- Real-time aggregation of actual expenditures vs. budgeted limits.
- Separate grouping for **Fixed Commitments** (rent, EMI, insurance) vs. **Variable Expenses** (dining, shopping).
- **Cross-Month Budget Cloning**: Copy budgets across months with one click.
- Unbudgeted category spending alerts.

### 6. 🔄 Recurring Schedules & Bill Reminders
- Schedule recurring income and bills across frequencies: *Weekly, Bi-Weekly, Monthly, Quarterly, Yearly*.
- **Mark as Paid**: One-click settlement that creates real ledger transactions, adjusts account balances, and advances `nextOccurrence` automatically.
- Feed active recurring commitments directly into the 90-day Forecast Engine.

### 7. 📈 Analytics & Annual Review
- 6-month and 12-month Income vs. Expense comparative bar charts.
- Category distribution donut chart with interactive legend and percentage breakdown.
- 12-month Savings Rate trend line chart with 20% benchmark guidance.
- Full **Annual Consolidated Financial Statement** with 12-month breakdown table and yearly category shares.

### 8. 🛡️ Data Sovereignty & Portability
- **CSV Export**: Export all transactions or apply granular filters (by date, type, category, account).
- **Annual CSV Report**: Formatted annual report ready for tax filing and accountants.
- **Secure Data Wipe**: Multi-step password and text-confirmation guard for fresh starts.

### 9. 🎨 UX & Polish
- **Obsidian Dragon Theme**: Deep black (`#070709`) and charcoal (`#0c0c10`) with crimson red accents and gold highlights.
- **Mobile Responsive**: Dedicated mobile bottom navigation bar and responsive drawer navigation.
- **Accessibility & Speed**: `Ctrl+N` / `Cmd+N` shortcut to quickly log transactions anywhere, floating action button (FAB), animated count-up numbers, and instant toast notifications.

---

## 🛠️ Architecture & Tech Stack

```
kosharchy-finance-app/
├── apps/
│   ├── api/                   # Express + TypeScript + Prisma Backend
│   │   ├── prisma/            # PostgreSQL Schema & Migrations
│   │   ├── src/
│   │   │   ├── controllers/   # REST Controllers (Account, Txn, Goal, Budget, Recurring, Analytics)
│   │   │   ├── engines/       # FluidMoneyEngine, ForecastEngine, AnalyticsEngine
│   │   │   ├── middleware/    # JWT Auth, Zod Validation, Helmet, CORS
│   │   │   ├── routes/        # Router mounting & endpoint guards
│   │   │   ├── schemas/       # Zod validation schemas
│   │   │   └── scripts/       # Automated 2-Year E2E Simulation test suite
│   │   └── Dockerfile         # Multi-stage production API image
│   │
│   └── web/                   # React 18 + Vite + Tailwind Frontend
│       ├── public/            # Dragon logo, icon, favicon
│       ├── src/
│       │   ├── components/    # AppShell, QuickAdd, Toasts, ConfirmDialog, UI kit
│       │   ├── features/      # Modular slices (dashboard, accounts, txns, goals, budget, etc.)
│       │   ├── lib/           # Axios/Fetch API client, Auth state, Theme manager
│       │   └── routes/        # Page routes (Dashboard, Accounts, Txns, Goals, Budget, Analytics, Settings)
│       ├── vercel.json        # Vercel SPA routing rewrite config
│       └── Dockerfile         # Multi-stage Nginx production web image
│
├── docker-compose.yml         # Local development PostgreSQL 16
├── docker-compose.prod.yml    # 1-Click production full-stack deployment
├── render.yaml                # Render Blueprint infrastructure-as-code
├── vercel.json                # Root Vercel deployment configuration
└── info/                      # Comprehensive architectural documentation
```

---

## 🚀 Quickstart & Local Setup

### Prerequisites
- **Node.js**: v20.x or higher
- **npm**: v10.x or higher
- **Docker** (recommended for local PostgreSQL)

### 1. Clone Repository
```bash
git clone https://github.com/zen559480-pixel/KoshArchy.git
cd KoshArchy
npm install
```

### 2. Start PostgreSQL Database
```bash
# Start local PostgreSQL 16 container
docker compose up -d
```

### 3. Configure Environment Variables
Copy example files:
```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```

Ensure `apps/api/.env` contains your settings:
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/wealthos?schema=public"
JWT_SECRET="generate-a-long-random-secret-key-32-chars"
JWT_EXPIRES_IN="30d"
PORT=3001
CLIENT_URL="http://localhost:5173"
ADMIN_EMAIL="admin@kosharchy.local"
ADMIN_PASSWORD="changeme123"
ADMIN_NAME="Admin"
```

### 4. Push Database Schema & Seed Defaults
```bash
npm run db:push
```
*On first startup, the server automatically seeds the admin user and 16 essential financial categories.*

### 5. Launch Development Servers
```bash
# Terminal 1: Backend API (runs on http://localhost:3001)
npm run dev:api

# Terminal 2: Frontend Web (runs on http://localhost:5173)
npm run dev:web
```

Log in with your `ADMIN_EMAIL` and `ADMIN_PASSWORD`.

---

## 🧪 Automated Testing & 2-Year Simulation

KoshArchy includes an automated in-depth end-to-end test suite and a **24-month financial simulation** that verifies 2 full years of realistic transactions, balance reconciliations, debt repayments, goal tracking, and annual reporting.

```bash
npm run e2e:simulation
```

**Results:**
```
============================================================
📊 FINAL VERIFICATION RESULTS
============================================================
Total Tests Executed: 82
Passed:               82 (100%)
Failed:               0

🎉 ALL TESTS AND 2-YEAR SIMULATION PASSED FLAWLESSLY!
```

---

## 🌐 Production Cloud Deployment

KoshArchy is designed to run seamlessly on modern serverless cloud infrastructure:
- **Database:** [Neon](https://neon.tech) (Serverless PostgreSQL 16)
- **Backend API:** [Render](https://render.com) (Node.js Web Service)
- **Frontend:** [Vercel](https://vercel.com) (Vite React Edge Deployment)

For step-by-step instructions, see the **[Production Cloud Deployment Guide](info/10-DEPLOYMENT-GUIDE.md)**.

### 🐳 1-Click Docker Self-Hosting
To deploy KoshArchy on your own VPS or home server in one command:
```bash
docker compose -f docker-compose.prod.yml up -d --build
```
Access the application at `http://your-server-ip`.

---

## 📚 Technical Documentation

Explore the `info/` directory for detailed architecture specifications:
- [01-PROJECT-SUMMARY.md](info/01-PROJECT-SUMMARY.md) — Technical overview and foundational decisions
- [03-DATABASE-SCHEMA.md](info/03-DATABASE-SCHEMA.md) — Comprehensive Prisma schema and relational models
- [04-BACKEND-LOGIC.md](info/04-BACKEND-LOGIC.md) — Engines, balance reconciliations, and algorithms
- [05-API-REFERENCE.md](info/05-API-REFERENCE.md) — Complete REST API specification
- [06-FRONTEND-ARCHITECTURE.md](info/06-FRONTEND-ARCHITECTURE.md) — UI design system and component architecture
- [09-E2E-TESTING-AND-SIMULATION.md](info/09-E2E-TESTING-AND-SIMULATION.md) — Full simulation methodology and test specs
- [10-DEPLOYMENT-GUIDE.md](info/10-DEPLOYMENT-GUIDE.md) — Step-by-step deployment guide (Neon, Render, Vercel, Docker)

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
