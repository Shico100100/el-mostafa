# Peachtree Sync — Review & Audit Design

Date: 2026-08-15
Status: Approved

## Problem

The current full sync deletes existing Peachtree-synced orders (`notes` like
`[PQ-%`) and re-imports everything. It also auto-updates existing customers
and suppliers. The user does not want data deleted or silently overwritten.
Instead they want:

1. No deletion of old data.
2. New records imported automatically.
3. A differences report comparing Peachtree data against the database.
4. Per-difference user decision: accept the change or keep as-is.
5. A persistent log of what happened in every run (an audit trail).

## Scope

All six synced entities:

- customers
- suppliers
- products
- sales_invoices
- purchase_invoices
- invoice_line_items

## Behavior

### Classification during preview

For each entity, pull rows from Peachtree (existing query code), map them, and
compare against the database:

| Situation | Action |
|---|---|
| Record not in DB | Auto-insert immediately (no review). Log `inserted`. |
| Record in DB, values identical | Skip. Log `skipped`. |
| Record in DB, values differ | Create review row `update` (pending). Log `different`. |
| Record in DB, missing in Peachtree | Create review row `missing` (informational). Never auto-delete. Log `missing`. |

### Review workflow

- User opens the "تقرير الفروقات" section and clicks **معاينة الفروقات**.
- Preview auto-imports new records and writes pending review rows.
- The report lists review rows with field-level diffs (`old → new`).
- Per row: **قبول** / **تجاهل**. Bulk: **قبول الكل** / **تجاهل الكل**.
- **تطبيق المحدد** applies only accepted rows (update the DB record, mark
  `accepted`). Skipped rows are marked `skipped`.
- `missing` rows are informational only; they can be dismissed without effect.

### No deletions

The deletion of `[PQ-...]` orders in full-sync mode is removed permanently.
Auto-updates of existing customers/suppliers/products are also removed: any
difference becomes a pending review row instead.

### Relationship between run and preview

The existing `/run` and `/run-incremental` endpoints keep working but their
behavior changes to match the new model: new records are imported, existing
records are compared, differences become pending review rows, and nothing is
deleted. `POST /peachtree-sync/preview` is the same import pass with a report
returned to the frontend; it does not run twice. In practice the preview
button is the primary flow going forward.

## Data Model

### `peachtree_sync_review`

One row per differing record.

| Column | Type | Notes |
|---|---|---|
| id | PK serial | |
| entity | enum | one of the six entities |
| record_key | text | match key (customer/supplier name, product sku/name, invoice number + PQ key) |
| change_type | enum | `update` \| `missing` |
| db_record_id | int nullable | existing DB record id (for `update`) |
| old_values | jsonb | snapshot of current DB values |
| new_values | jsonb | snapshot of Peachtree values |
| status | enum | `pending` \| `accepted` \| `skipped` |
| created_at | timestamp | |
| decided_at | timestamp nullable | |

### `peachtree_sync_log`

One row per event. Persistent audit trail.

| Column | Type | Notes |
|---|---|---|
| id | PK serial | |
| run_id | text | groups all events of one run |
| triggered_by | text | `manual` / `preview` / `apply` / `skip` |
| entity | enum | one of the six entities |
| action | enum | `inserted` \| `different` \| `skipped` \| `missing` \| `updated` \| `skipped_review` |
| record_key | text | |
| changes | jsonb nullable | field diffs `{field: [old, new]}` for updates |
| created_at | timestamp | |

## Backend API

| Method | Path | Purpose |
|---|---|---|
| POST | `/peachtree-sync/preview` | Pull, classify, auto-insert new, write pending review rows, log events. Returns summary counts + latest run_id. |
| GET | `/peachtree-sync/review` | Latest pending review rows (paginated, filterable by entity/status). |
| POST | `/peachtree-sync/review/apply` | Body `{ ids: number[] }`. Applies each `update` row (DB update), marks `accepted`, logs `updated`. |
| POST | `/peachtree-sync/review/skip` | Body `{ ids: number[] }`. Marks rows `skipped`, logs `skipped_review`. |
| GET | `/peachtree-sync/log` | Audit log, paginated, filterable by run_id/entity. |

## Frontend

In `frontend/app/peachtree-sync/page.tsx`, add two sections:

### 1. تقرير الفروقات

- Button **معاينة الفروقات**.
- Paginated table of review rows grouped by entity, each row expandable to
  show field diffs (`القديم ← الجديد`).
- Per-row **قبول** / **تجاهل**, bulk **قبول الكل** / **تجاهل الكل**,
  and **تطبيق المحدد**.

### 2. سجل العمليات

- List of recent runs (from `peachtree_sync_log`), expandable per run to show
  the events that happened in it (what was inserted, updated, skipped).

## Error Handling

- If one entity fails during preview, log it as failed (like current sync) and
  continue with the others. Review rows for successful entities are still
  produced.
- Applying a review row that fails is recorded in the response `errors` and
  does not stop the other rows.
- Preview/apply run in the background like current sync, with progress polling
  via the existing `/peachtree-sync/progress` mechanism.

## Testing

- Backend unit tests:
  - Classification: new / different / identical / missing per entity.
  - Apply: update applied, status flipped, log written; failure isolated.
  - Skip: status flipped, log written.
  - No-deletion regression: full-sync no longer removes `[PQ-...]` orders.
- Frontend hook tests for the new preview/review/apply/log functions.
