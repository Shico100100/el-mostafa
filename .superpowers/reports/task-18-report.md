# Task 18: Multi-Currency Support

**Status:** ✅ Complete

**Commit:** `36450e8e35005dfe54a30c6a8013db8af19c009a`

## Summary

Created the Currency module under `backend/src/currency/` with:

- **Entity:** `Currency` — stores currency code (unique), name, decimal places
- **Entity:** `ExchangeRate` — stores from/to currency pairs with unique constraint, rate as decimal(10,6)
- **Service:** `CurrencyService` — provides `findAll()`, `getExchangeRate()`, `convert()`
- **Controller:** `CurrencyController` — exposes `GET /currencies` (list all) and `GET /currencies/convert/:amount/:from/:to` (conversion)
- **Module:** `CurrencyModule` — registered with TypeOrm for both entities, exports `CurrencyService` for reuse

Registered `CurrencyModule` in `AppModule` (imports array).
TypeScript compilation (`tsc --noEmit`) passes without errors.
