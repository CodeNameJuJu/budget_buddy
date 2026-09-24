# Bêre Bietjie

A full-stack budgeting application built with **Go** (chi + bun ORM) and **React** (Vite + TailwindCSS).

## Project structure

```
budgetBuddy/
├── core/
│   ├── api_endpoints.go        # Route definitions
│   ├── context/                # DB connection management
│   ├── db/                     # Database queries (db_*.go)
│   ├── functions/              # Business logic by domain
│   │   ├── accounts/
│   │   ├── budgets/
│   │   ├── categories/
│   │   ├── dashboard/
│   │   └── transactions/
│   └── helpers/                # Shared HTTP helpers
├── utils/types/                # Type definitions (types_*.go)
├── backend/migrations/         # SQL migration files
├── main.go                     # Entrypoint
├── go.mod
├── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/             # Reusable UI components
│   │   ├── lib/                    # API client & utilities
│   │   ├── pages/                  # Page components
│   │   ├── App.tsx                 # Router setup
│   │   └── main.tsx                # Entrypoint
│   ├── package.json
│   └── vite.config.ts
└── README.md
```

## Prerequisites

- **Go** 1.23+
- **Node.js** 20+
- **PostgreSQL** 14+

## Getting started

### 1. Set up the database

Create a PostgreSQL database and run the migration:

```bash
createdb budget_buddy
psql -d budget_buddy -f backend/migrations/001_initial_schema.sql
```

### 2. Configure the backend

```bash
cp .env.example .env
# Edit .env with your database credentials
```

### 3. Start the backend

```bash
go run main.go
```

The API will be available at `http://localhost:8080`.

### 4. Start the frontend

```bash
cd frontend
npm install
npm run dev
```

The UI will be available at `http://localhost:5173`. API requests are proxied to the backend automatically.

## API endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/accounts` | List accounts |
| `POST` | `/api/accounts` | Create account |
| `PATCH` | `/api/accounts/:id` | Update account |
| `GET` | `/api/categories` | List categories |
| `POST` | `/api/categories` | Create category |
| `PATCH` | `/api/categories/:id` | Update category |
| `DELETE` | `/api/categories/:id` | Delete category |
| `GET` | `/api/transactions` | List transactions |
| `POST` | `/api/transactions` | Create transaction |
| `PATCH` | `/api/transactions/:id` | Update transaction |
| `DELETE` | `/api/transactions/:id` | Delete transaction |
| `GET` | `/api/budgets` | List budgets |
| `POST` | `/api/budgets` | Create budget |
| `PATCH` | `/api/budgets/:id` | Update budget |
| `DELETE` | `/api/budgets/:id` | Delete budget |
| `GET` | `/api/budgets/:id/transactions` | Transactions counted against the budget this period |
| `POST` | `/api/budgets/:id/trigger-recurring` | Capture all recurring items still due this period |
| `GET` | `/api/recurring-transactions` | List recurring templates (`budget_id`, `active_only` filters) |
| `POST` | `/api/recurring-transactions` | Create recurring template |
| `PATCH` | `/api/recurring-transactions/:id` | Update recurring template |
| `DELETE` | `/api/recurring-transactions/:id` | Delete recurring template |
| `POST` | `/api/recurring-transactions/:id/trigger` | Capture this period's transaction for one template |
| `GET` | `/api/dashboard/summary` | Dashboard summary |

All list endpoints require `account_id` as a query parameter.

## Architecture

The backend follows the same patterns as the ShipLogic backend:

- **API-first** — routes defined centrally in `api_endpoints.go`
- **Handler naming** — `{METHOD}{Resource}` (e.g. `GETTransactions`, `POSTBudget`)
- **bun ORM** — for all database queries and relations
- **Domain-organised functions** — each domain (transactions, budgets, etc.) in its own package
- **DB layer** — `core/db/db_*.go` files with query functions
- **Types** — `utils/types/types_*.go` files with struct definitions
- **Soft deletes** — records are never hard-deleted; `deleted_date` is set instead

## Budgets and recurring transactions

A budget's `spent` amount for the current period counts expense transactions that are either
explicitly linked to it (`transactions.budget_id`) or unlinked but in the budget's category. A
transaction linked to a different budget is never counted, even if it shares the category. The
`/api/budgets/:id/transactions` endpoint uses the same rule and period window, so the list shown
when clicking a budget card always reconciles with its progress bar.

Recurring transactions are templates stored against a budget. They are never created automatically:
the budget card shows how many are still due this period and triggering one (or all) inserts a real
transaction with `budget_id` and `recurring_transaction_id` set. A template counts as captured for
the period when such a transaction exists inside the budget's current period window.
