# Task 15: Notifications System

**Status:** ✅ Done

**Commit:** `bbd27c9`

## Summary

The notifications module was already well-implemented (entity, service with cron jobs/WebSocket gateway, controller, module). Added the missing pieces:

### Created/Modified
- **`backend/src/notifications/notifications.service.ts`** — Added `getUnreadCount()` method querying `isRead: false`
- **`backend/src/notifications/notifications.controller.ts`** — Added `GET /notifications/unread-count` endpoint returning `{ count }`
- **`backend/src/dashboard/dashboard.module.ts`** — Imported `NotificationsModule`
- **`backend/src/dashboard/dashboard.service.ts`** — Injected `NotificationsService`, added `unreadNotifications` to `Promise.all` (query #13) and to the returned result object

### Pre-existing (not modified)
- `notification.entity.ts` — Already created with `id, title, message, isRead, userId, actionType, actionData, createdAt`
- `notifications.gateway.ts` — WebSocket gateway for real-time push
- `notifications.module.ts` — Registers all entities, controllers, providers
- `app.module.ts` — Already imports `NotificationsModule`

## Test Notes
- `tsc --noEmit` passes with zero errors
- Service uses `isRead` field (existing entity schema) for unread count query
- Dashboard `getStats()` runs all 13 queries in parallel via `Promise.all`
- Cached result now includes `unreadNotifications` field
