# ELMostafa — Frontend

Next.js 16 + React 19 + TypeScript 5 + TailwindCSS 4

Factory management UI: inventory, sales, purchases, manufacturing, accounting, HR, QC.

## Getting Started

```bash
npm install
npm run dev        # http://localhost:3000
npm run lint       # ESLint check
npm run build      # Production build
npx cypress run    # E2E tests
```

## Env

Copy `frontend/.env.local.example` to `frontend/.env.local` and set:

```
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## Structure

```
app/              # Next.js App Router pages
  assembly/       # Assembly (accessories, plastic, packaging, production)
  dashboard/      # Dashboard + Control Tower
  hr/             # Employees + Payroll
  inventory/      # Products, stock, semi-finished
  manufacturing/  # Daily production, machines, molds, raw-materials, BOM, MRP, QC, schedule, traceability
  purchases/      # Purchase orders, returns, containers, currencies
  sales/          # Sales orders, returns, customers
  accounting/     # Chart of accounts, journal entries
  reports/        # Sales, profit/loss, inventory reports
  settings/       # App settings
lib/              # API client, utilities, hooks
components/       # Shared UI components (GlassPanel, ExcelActions, etc.)
cypress/          # E2E test specs
```
