# Polling & count endpoints: system design and optimizations

This doc summarizes how we keep badge counts (pending users, new leads) up to date without wasting DB or network resources.

## What we implemented

### 1. **Backend: TTL cache + invalidation** (`app/utils/count_cache.py`)

- **`get_cached(key, fetcher, ttl=5)`**  
  - If `key` is present and younger than `ttl` seconds → return cached value, **no DB query**.
  - Else `await fetcher()`, store result, return it.

- **`invalidate(key)`**  
  - Must be called on every mutation that changes a count so the next request recomputes.

**Effect:** Many polls (or multiple tabs) within 5 seconds share one DB query. After approve/reject/signup/create_lead/status-change, the next poll sees fresh data.

**Cache keys:**
- `pending_users` — invalidated on: approve, reject, signup.
- `new_leads` — invalidated on: create_lead, update_lead_status. Used only for admin (non-admin path is uncached).

### 2. **Backend: cheaper queries**

- **Pending count:** Uses `COUNT(*)` via `count_pending_users()` instead of `len(list_pending_users())`, so we no longer load all pending rows.
- **New-leads count:** Keeps `COUNT(*)`; for admins the result is cached.

### 3. **Frontend: adaptive polling**

- **Backoff when unchanged:** If the count is the same for 2 consecutive polls → interval increases from 15s to 30s. Cuts requests when nothing is changing.
- **Reset on tab focus:** On `visibilitychange` to `visible`, we set the interval back to 15s and fetch once immediately.

---

## Alternative / future designs

### Server-Sent Events (SSE)

- **Idea:** One long-lived HTTP connection; server pushes `{ pendingCount, newLeadsCount }` only when something changes.
- **Pros:** No polling; DB is only hit on real changes (and on connect). Very efficient at scale.
- **Cons:** Needs a way to “notify” from mutation handlers (e.g. in-memory pub/sub or Redis pub/sub for multi-worker). FastAPI supports `StreamingResponse` and `EventSourceResponse`.

### WebSockets

- Similar to SSE but bidirectional. Unnecessary for simple count pushes; SSE is simpler.

### ETag / `If-None-Match`

- Endpoint returns `ETag: "count=5"` and supports `If-None-Match`. If count unchanged → `304 Not Modified`, no body.
- **Saves:** bandwidth and client work. **Does not** by itself avoid the DB query; pair with a cache so we often serve 304 from memory.

### Maintained counters (DB-level)

- A `counters` or `stats` table with `(key, value)` updated by triggers or application code on insert/delete/status-change.
- Count endpoints become a single row read. Best when counts are very hot and tables large.

### Redis (or similar) for multi-worker

- `count_cache` is in-process. With several FastAPI workers, each has its own cache.
- For a shared cache: store counts (or invalidation flags) in Redis; mutations invalidate there; `get_cached` reads from Redis with a short TTL.

---

## Where invalidation is called

| Mutation | Cache key invalidated |
|----------|------------------------|
| `POST /admin/pending-users/{id}/approve` | `pending_users` |
| `DELETE /admin/pending-users/{id}/reject` | `pending_users` |
| `POST /auth/signup` | `pending_users` |
| `POST /leads` (create_lead) | `new_leads` |
| `PATCH /v1/leads/{id}/status` | `new_leads` |

---

## Summary

- **Backend:** TTL cache + invalidation on mutations, and `COUNT(*)` for pending users, reduce repeated work from polling.
- **Frontend:** Adaptive polling (back off when unchanged, reset on focus) reduces how often we hit the server when nothing is changing.
- **Next steps** (if you need more): SSE for push-based updates; Redis for shared cache across workers; or maintained DB counters for very high load.
