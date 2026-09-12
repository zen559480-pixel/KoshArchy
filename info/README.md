# KoshArchy — Agent Context Documentation

This `info/` folder contains comprehensive documentation of the KoshArchy Finance App project, designed to give AI agents full context to work efficiently without re-reading the source code every session.

## Files in this Folder

| File | Contents |
|---|---|
| [01-PROJECT-SUMMARY.md](./01-PROJECT-SUMMARY.md) | Overview, tech stack, implementation status, key design decisions |
| [02-PROJECT-STRUCTURE.md](./02-PROJECT-STRUCTURE.md) | Full annotated file tree with status (implemented vs stub) |
| [03-DATABASE-SCHEMA.md](./03-DATABASE-SCHEMA.md) | All Prisma models, fields, relations, enums, and design notes |
| [04-BACKEND-LOGIC.md](./04-BACKEND-LOGIC.md) | Deep dive into middleware, controllers, and all 3 business engines |
| [05-API-REFERENCE.md](./05-API-REFERENCE.md) | Full REST API reference with request/response shapes |
| [06-FRONTEND-ARCHITECTURE.md](./06-FRONTEND-ARCHITECTURE.md) | Frontend structure, routing plan, expected component patterns |
| [07-DATA-FLOW.md](./07-DATA-FLOW.md) | Step-by-step data flows for all major operations |
| [08-GAPS-AND-TODOS.md](./08-GAPS-AND-TODOS.md) | Phase 0 completion summary and future phase roadmap |
| [implementation-plan.md](./implementation-plan.md) | 2-year simulation, comprehensive gap analysis & 10-phase master plan |

## Quick Context for Agents

- **Language:** TypeScript (both API and frontend)
- **Backend:** Express.js + Prisma ORM + PostgreSQL 16 (Docker) (at `apps/api/`)
- **Frontend:** React 18 + Vite + Tailwind CSS (at `apps/web/`)
- **Signature Feature:** "Fluid Money" — user's true spendable balance after deducting goal reserves and upcoming expenses
- **Current State:** **Phase 0 is complete.** The database is dockerized and synced, the Express API runs with JWT auth & seed logic, and the React frontend builds and runs with a complete AppShell and login flow.
- **Next Step:** Proceed to **Phase 1** (Accounts & Transactions full CRUD + filters).
