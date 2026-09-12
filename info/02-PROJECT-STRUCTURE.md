# WealthOS — Full Project Structure

## Monorepo Layout

```
wealthos-finance-app/
├── .gitignore
├── docker-compose.yml              # ✅ PostgreSQL 16 local docker service
├── package.json                    # ✅ Monorepo root with workspaces
├── info/                           # ✅ Agent context documentation
│   ├── 01-PROJECT-SUMMARY.md
│   ├── 02-PROJECT-STRUCTURE.md
│   ├── 03-DATABASE-SCHEMA.md
│   ├── 04-BACKEND-LOGIC.md
│   ├── 05-API-REFERENCE.md
│   ├── 06-FRONTEND-ARCHITECTURE.md
│   ├── 07-DATA-FLOW.md
│   ├── 08-GAPS-AND-TODOS.md
│   ├── implementation-plan.md
│   └── README.md
│
└── apps/
    ├── api/                        # Express.js Backend (Phase 0 Complete)
    │   ├── .env                    # ✅ Configured with local Postgres & JWT keys
    │   ├── .env.example            # ✅ Template configuration
    │   ├── package.json            # ✅ API dependencies & scripts
    │   ├── tsconfig.json           # ✅ TypeScript strict configuration
    │   ├── prisma/
    │   │   └── schema.prisma       # ✅ Formatted Prisma schema
    │   └── src/
    │       ├── server.ts           # ✅ Express server entry + auto-seeding
    │       ├── lib/
    │       │   └── prisma.ts       # ✅ Singleton PrismaClient instance
    │       ├── types/
    │       │   └── express.d.ts    # ✅ Express Request user type augmentation
    │       ├── middleware/
    │       │   ├── auth.ts         # ✅ JWT authentication guard
    │       │   └── validate.ts     # ✅ Zod validation middleware
    │       ├── routes/
    │       │   ├── auth.ts         # ✅ Login, logout, me routes
    │       │   └── index.ts        # ✅ Main API router
    │       ├── controllers/
    │       │   ├── AccountController.ts     # ✅ Account endpoints
    │       │   ├── TransactionController.ts # ✅ Transaction endpoints
    │       │   ├── DashboardController.ts   # ✅ Fluid money + forecast endpoints
    │       │   └── AnalyticsController.ts   # ✅ Monthly analytics endpoint
    │       ├── engines/
    │       │   ├── FluidMoneyEngine.ts      # ✅ Fluid money calculation engine
    │       │   ├── ForecastEngine.ts        # ✅ Cashflow forecast engine
    │       │   └── AnalyticsEngine.ts       # ✅ Monthly aggregations & category splits
    │       └── schemas/
    │           ├── financial.schema.ts      # ✅ Account & Transaction Zod schemas
    │           └── analytics.schema.ts      # ✅ Analytics query schema
    │
    └── web/                        # React + Vite Frontend (Phase 0 Complete)
        ├── .env                    # ✅ Development & production env setup
        ├── package.json            # ✅ React 18, Vite, Tailwind, Lucide, Recharts
        ├── tsconfig.json           # ✅ Vite/React TypeScript config
        ├── tsconfig.node.json      # ✅ Node/Vite build config
        ├── vite.config.ts          # ✅ Vite config with /api dev proxy
        ├── tailwind.config.js      # ✅ Tailwind custom theme & colors
        ├── postcss.config.js       # ✅ PostCSS setup
        ├── index.html              # ✅ HTML5 root shell with fonts & branding
        └── src/
            ├── main.tsx            # ✅ React root mounting
            ├── App.tsx             # ✅ Router with ProtectedLayout & PublicRoute
            ├── index.css           # ✅ Tailwind layers & reusable UI classes
            ├── lib/
            │   ├── api.ts          # ✅ Typed API client with auto-auth & 401 handling
            │   ├── auth.ts         # ✅ JWT token & user persistence
            │   └── utils.ts        # ✅ INR formatting, date helpers, color helpers
            ├── components/
            │   └── layout/
            │       └── AppShell.tsx # ✅ Responsive shell (desktop sidebar + mobile drawer)
            ├── routes/
            │   ├── LoginPage.tsx       # ✅ Styled authentication page
            │   ├── DashboardPage.tsx   # 🔄 Phase 2 target (preview placeholder)
            │   ├── TransactionsPage.tsx# 🔄 Phase 1 target (preview placeholder)
            │   ├── BudgetPage.tsx      # 🔄 Phase 4 target (preview placeholder)
            │   └── GoalsPage.tsx       # 🔄 Phase 3 target (preview placeholder)
            └── features/
                ├── dashboard/
                │   ├── ForecastWidget.tsx
                │   └── api/useDashboard.ts
                └── transactions/
                    ├── TransactionModal.tsx
                    └── api/useTransactions.ts
```
