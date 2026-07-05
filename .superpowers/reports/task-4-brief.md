# Task 4: Update Seed Data

## Context
Task 4 of 8. The seed system is in `backend/src/system/seed-data.ts` using raw SQL via `insertIgnore()`.

Working directory: `C:\ELMostafa\backend`

## What to do

### 1. Add all role IDs (currently only 1 and 2)
In the `insertIgnore(queryRunner, 'role', [...])` block (line 30), add the remaining roles:
```typescript
{ id: 3, name: 'manager' },
{ id: 4, name: 'accountant' },
{ id: 5, name: 'storekeeper' },
{ id: 6, name: 'worker' },
{ id: 7, name: 'viewer' },
```

### 2. Add currencies after roles
After the status seed (around line 40), add:
```typescript
await insertIgnore(queryRunner, 'currencies', [
  { id: 1, code: 'MAD', name: 'درهم مغربي', decimalPlaces: 2 },
  { id: 2, code: 'USD', name: 'دولار أمريكي', decimalPlaces: 2 },
  { id: 3, code: 'EUR', name: 'يورو', decimalPlaces: 2 },
]);
logger.log('Currencies seeded');

await insertIgnore(queryRunner, 'exchange_rates', [
  { id: 1, fromCurrency: 'USD', toCurrency: 'MAD', rate: 9.85 },
  { id: 2, fromCurrency: 'EUR', toCurrency: 'MAD', rate: 10.72 },
  { id: 3, fromCurrency: 'USD', toCurrency: 'EUR', rate: 0.92 },
  { id: 4, fromCurrency: 'EUR', toCurrency: 'USD', rate: 1.09 },
  { id: 5, fromCurrency: 'MAD', toCurrency: 'USD', rate: 0.10 },
  { id: 6, fromCurrency: 'MAD', toCurrency: 'EUR', rate: 0.093 },
]);
logger.log('Exchange rates seeded');
```

### 3. Verify typecheck
```bash
cd C:\ELMostafa\backend; npx tsc --noEmit
```

### 4. Commit
```bash
git add backend/src/system/seed-data.ts
git commit -m "feat: seed currencies and remaining roles"
```

## Global Constraints
- DATABASE_SYNCHRONIZE=false permanently
- Follow existing insertIgnore pattern exactly
- Notifications are already seeded (lines 264-268), do NOT duplicate

## Report
Write report to `C:\ELMostafa\.superpowers\reports\task-4-report.md`
