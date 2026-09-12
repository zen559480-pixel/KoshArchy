# KoshArchy Finance App — Project Summary

## Overview

**KoshArchy** is a personal finance management web application built for the Indian market (default currency: INR). It helps users track accounts, record transactions, set savings goals, plan budgets, and forecast their financial future with smart analytical engines.

The project is a **full-stack TypeScript monorepo**. 
- **Phase 0 (Foundation) is complete**: Backend API server bootstrap, JWT authentication, database connection with Docker PostgreSQL, Prisma migrations/client, React frontend app shell with Tailwind CSS and routing, and full authentication flow are fully implemented and verified.
- **Subsequent Phases**: Core feature CRUDs and domain modules (Accounts, Transactions, Dashboard, Goals, Budget, Analytics, Recurring) will be built out phase-by-phase.

---

## Tech Stack

### Backend — `apps/api`
| Layer | Technology |
|---|---|
| Runtime | Node.js + TypeScript |
| Framework | Express.js v4 |
| Database | PostgreSQL 16 (Docker / Neon) via Prisma ORM v5 |
| Validation | Zod v3 (discriminated unions) |
| Auth | JWT (jsonwebtoken) + bcryptjs |
| Finance Math | decimal.js (arbitrary precision) |
| Date Logic | date-fns v3 |
| Security | helmet, cors |
| Dev Tools | nodemon, ts-node |

### Frontend — `apps/web`
| Layer | Technology |
|---|---|
| Framework | React 18 (Vite + TypeScript) |
| Routing | React Router v6 |
| Styling | Tailwind CSS |
| Icons | Lucide React |
| Charts | Recharts |
| Build Tool | Vite |
| API Layer | Feature-based custom hooks + typed fetch client |

---

## Implementation Status (Phase 0 Complete)

| Area | Status | Notes |
|---|---|---|
| Database Schema (Prisma) | ✅ Complete | 7 models, 6 enums, Category color & icon |
| Dockerized DB | ✅ Complete | PostgreSQL 16 container running via docker-compose |
| API Server Entry (`server.ts`) | ✅ Complete | Express, Helmet, CORS, Auto-seed admin user & default categories |
| Auth Middleware (`auth.ts`) | ✅ Complete | JWT verification, Request type augmentation |
| Auth Endpoints (`/api/auth`) | ✅ Complete | `/login`, `/logout`, `/me` endpoints implemented |
| API Routes | ✅ Complete | Auth, Dashboard, Analytics, Accounts, Transactions |
| Controllers (4) | ✅ Complete | Account, Transaction, Dashboard, Analytics |
| Business Engines (3) | ✅ Complete | FluidMoney, Forecast, Analytics |
| Zod Validation Schemas | ✅ Complete | Financial + Analytics validation |
| Frontend App Shell | ✅ Complete | AppShell (Desktop & Mobile drawer), Navigation, User status |
| Frontend Auth & Routing | ✅ Complete | ProtectedLayout, PublicRoute, LoginPage, Token storage |
| Frontend Build & Config | ✅ Complete | Vite, Tailwind, PostCSS, TypeScript compile cleanly |
| Feature Pages | 🔄 Phase 1-6 | Informative placeholders styled; full CRUDs in upcoming phases |

---

## Key Design Decisions

1. **Fluid Money Concept** — The app's signature metric: Liquid Assets − Liabilities − Reserved Goals − Upcoming Recurring Expenses.
2. **Single-User Admin Auto-Seed** — Automatically initializes the admin account and 16 predefined Indian categories on first startup.
3. **Decimal Precision** — All financial math uses `decimal.js` to prevent floating-point inaccuracies.
4. **Atomic Transactions** — Writes affecting multiple tables use Prisma `$transaction()`.
5. **Transfer Anti-Double-Counting** — Transfers use `fromAccountId`/`toAccountId` with null category/amount mappings for income/expense exclusions.
6. **Soft Deletes** — Accounts and records preserve transaction audit trails.
7. **Discriminated Union Validation** — Transaction shapes (standard vs. transfer) are strictly validated at the API boundary.
