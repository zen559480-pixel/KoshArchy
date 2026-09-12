# WealthOS — Frontend Architecture

## Overview

**Status:** All frontend files are **empty stubs**. The file tree and folder structure define the intended architecture. This document captures the design intent based on the structure and naming conventions.

**Stack:**
- React + TypeScript
- Vite (build tool + dev server)
- Tailwind CSS (styling)
- React Router (routing — inferred from page structure)
- Custom hooks per feature (data fetching)

---

## Directory Structure & Intent

```
apps/web/src/
├── main.tsx                    # ReactDOM.createRoot entry point
├── App.tsx                     # React Router <Routes> setup
├── index.css                   # Tailwind base styles import
│
├── components/                 # Shared/reusable components
│   └── layout/
│       └── AppShell.tsx        # Main layout: sidebar nav + content area
│
├── routes/                     # Page-level components (one per route)
│   ├── DashboardPage.tsx       # "/" — Main dashboard
│   ├── TransactionsPage.tsx    # "/transactions"
│   ├── BudgetPage.tsx          # "/budget"
│   └── GoalsPage.tsx           # "/goals"
│
├── features/                   # Feature modules (self-contained)
│   ├── dashboard/
│   │   ├── ForecastWidget.tsx          # Chart component for forecast data
│   │   └── api/
│   │       └── useDashboard.ts         # Hook: fetches fluid money + forecast
│   └── transactions/
│       ├── TransactionModal.tsx        # Modal form to add transaction
│       └── api/
│           └── useTransactions.ts      # Hook: fetches + creates transactions
│
└── lib/
    ├── api.ts                  # Base HTTP client (fetch/axios wrapper + auth headers)
    └── utils.ts                # Utility functions (currency formatting, date helpers)
```

---

## Routing Plan

| Route | Page Component | Description |
|---|---|---|
| `/` | `DashboardPage` | Fluid Money, Forecast chart, account summary |
| `/transactions` | `TransactionsPage` | Transaction list + add modal |
| `/budget` | `BudgetPage` | Monthly budget vs actual |
| `/goals` | `GoalsPage` | Savings goals progress |

All routes should be wrapped by `AppShell` to render the navigation.

---

## Expected `App.tsx` Pattern

```tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AppShell from './components/layout/AppShell';
import DashboardPage from './routes/DashboardPage';
import TransactionsPage from './routes/TransactionsPage';
import BudgetPage from './routes/BudgetPage';
import GoalsPage from './routes/GoalsPage';

export default function App() {
  return (
    <BrowserRouter>
      <AppShell>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/transactions" element={<TransactionsPage />} />
          <Route path="/budget" element={<BudgetPage />} />
          <Route path="/goals" element={<GoalsPage />} />
        </Routes>
      </AppShell>
    </BrowserRouter>
  );
}
```

---

## Expected `lib/api.ts` Pattern

The API client should:
1. Read `VITE_API_URL` from env for base URL
2. Attach `Authorization: Bearer <token>` from localStorage/cookie
3. Handle 401 responses (redirect to login)

```typescript
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const apiFetch = async (path: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('token');
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

export const api = {
  get: (path: string) => apiFetch(path),
  post: (path: string, body: unknown) =>
    apiFetch(path, { method: 'POST', body: JSON.stringify(body) }),
  delete: (path: string) => apiFetch(path, { method: 'DELETE' }),
};
```

---

## Feature Module Pattern

Each feature follows this pattern:

```
features/[feature]/
├── [FeatureComponent].tsx      # UI component
└── api/
    └── use[Feature].ts         # Data fetching hook
```

### Expected `useDashboard.ts` Hook

```typescript
import { useState, useEffect } from 'react';
import { api } from '../../lib/api';

export function useDashboard() {
  const [fluidMoney, setFluidMoney] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/dashboard/fluid-money'),
      api.get('/dashboard/forecast?days=90'),
    ]).then(([fluidData, forecastData]) => {
      setFluidMoney(fluidData.data);
      setForecast(forecastData.data);
    }).finally(() => setLoading(false));
  }, []);

  return { fluidMoney, forecast, loading };
}
```

### Expected `useTransactions.ts` Hook

```typescript
import { useState, useEffect } from 'react';
import { api } from '../../lib/api';

export function useTransactions() {
  const [transactions, setTransactions] = useState([]);

  const fetchTransactions = () =>
    api.get('/transactions').then(res => setTransactions(res.data));

  const createTransaction = async (data: unknown) => {
    await api.post('/transactions', data);
    await fetchTransactions(); // Refresh list
  };

  useEffect(() => { fetchTransactions(); }, []);

  return { transactions, createTransaction };
}
```

---

## Dashboard Page Intent

The `DashboardPage` should display:

1. **Fluid Money Card** — Big number showing spendable balance with breakdown:
   - Total Assets: ₹X
   - − Liabilities: ₹X
   - − Reserved for Goals: ₹X
   - − Upcoming Expenses: ₹X
   - = **Fluid Money: ₹X** (highlighted)

2. **Forecast Chart** (`ForecastWidget`) — A line chart (Recharts/Chart.js) plotting `closingBalance` over the next 90 days. Shows when balance dips (due to planned purchases or recurring expenses).

3. **Account Summary Cards** — List of accounts with balances.

---

## Environment Variables Needed

```
# apps/web/.env
VITE_API_URL=http://localhost:3001/api
```

---

## Missing Dependencies (web/package.json is empty)

Expected dependencies for `apps/web/package.json`:
```json
{
  "dependencies": {
    "react": "^18.x",
    "react-dom": "^18.x",
    "react-router-dom": "^6.x",
    "recharts": "^2.x"
  },
  "devDependencies": {
    "@types/react": "^18.x",
    "@types/react-dom": "^18.x",
    "typescript": "^5.x",
    "vite": "^5.x",
    "@vitejs/plugin-react": "^4.x",
    "tailwindcss": "^3.x",
    "postcss": "^8.x",
    "autoprefixer": "^10.x"
  }
}
```
