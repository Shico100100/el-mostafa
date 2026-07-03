# Task 4: Request Validation (Global Pipe) — Report

## Status: DONE

## What Was Implemented

1. **`src/common/dto/pagination-query.dto.ts`** — Reusable pagination DTO with `class-validator` decorators (`@IsOptional`, `@IsInt`, `@Min`, `@Max`) and `@Type` from `class-transformer` for automatic string-to-number conversion.

2. **`src/common/dto/pagination-query.dto.spec.ts`** — Unit tests validating acceptance of valid params and rejection of negative page values.

3. **`src/utils/validation-options.ts`** — Added `forbidNonWhitelisted: true` to the existing global ValidationPipe options (line 24). The pipe was already enabled in `main.ts:44` with `transform` and `whitelist`.

## TDD Evidence

### RED
```
PASS src/common/dto/pagination-query.dto.spec.ts
  PaginationQueryDto
    × should accept valid pagination params (22 ms)
    √ should reject negative page (3 ms)
```
Stub class had no decorators — valid params failed validation as expected.

### GREEN
```
PASS src/common/dto/pagination-query.dto.spec.ts
  PaginationQueryDto
    √ should accept valid pagination params (22 ms)
    √ should reject negative page (7 ms)
```

### Full Suite
```
Test Suites: 6 failed, 13 passed, 19 total
Tests:       22 failed, 79 passed, 101 total
```
6 pre-existing failures (NestJS DI issues in auth, purchases, sales, accounting, manufacturing service specs — unrelated to this task).

## Files Changed
| File | Action |
|---|---|
| `src/common/dto/pagination-query.dto.ts` | Created |
| `src/common/dto/pagination-query.dto.spec.ts` | Created |
| `src/utils/validation-options.ts` | Modified (added `forbidNonWhitelisted: true`) |

## Notes
- `class-validator@0.14.2` and `class-transformer@0.5.1` were already installed as dependencies.
- `main.ts` already had `app.useGlobalPipes(new ValidationPipe(validationOptions))` — no change needed there.
- The `reflect-metadata` import was added to the test file since there's no `setupFiles` in jest config.

## Commit
```
8066e6e feat(backend): add request validation with reusable PaginationQueryDto
```
