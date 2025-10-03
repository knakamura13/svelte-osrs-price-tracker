## Roadmap

### Foundations

-   [x] Define shared types: `ItemMapping`, `LatestPrice`, `PriceRow`
-   [x] Create server endpoints (proxy + cache): `/api/mapping`, `/api/latest`
-   [x] Add server module for in‑memory TTL cache
-   [x] Join mapping + latest on the server

### Table UI (All Items)

-   [x] Implement table columns: name, buy limit, buy price, sell price, most recent buy, most recent sell, margin, daily volume
-   [x] Search input with debounce
-   [x] Column sorting and page size selector
-   [x] Pagination controls
-   [x] Compute derived: `margin` and `dailyVolume`
-   [x] Time formatting for `highTime`/`lowTime`
-   [x] Advanced filtering (numeric ranges + time duration filters)
-   [x] Column visibility toggles with persistence

### Favourites (post-MVP)

-   [ ] Store favourites in a Svelte store backed by `localStorage`
-   [ ] `/favourites` route to show saved items

### Refresh & Resilience

-   [x] Manual refresh button
-   [x] Auto‑refresh toggle with configurable delay (seconds)
-   [x] Backoff on failures; show last updated time
-   [x] Exponential backoff with retry countdown display
-   [x] Auto-disable after 5 consecutive failures

### Phase 2

-   [ ] `/api/volume-1d` server aggregation using `/1h` (or `/5m`) endpoints
-   [ ] Margin × volume column when available
-   [ ] Item detail drawer with small 24h chart via `/timeseries`

### DevOps

-   [x] `.env` with `USER_AGENT` and `PUBLIC_REFRESH_MS`
-   [x] Unit testing with Vitest (21 tests passing)
-   [ ] CI typecheck + lint; deploy to Vercel/Netlify

---

### Next Steps (MVP polish priorities)

1. ~~Handle fetch failures with retry/backoff and user-facing error state on `/api/rows` load.~~ ✅ **DONE**
2. ~~Expose `PUBLIC_REFRESH_MS` and wire default auto‑refresh period from env; document `.env`.~~ ✅ **DONE**
3. ~~Implement server aggregation for daily volume (optional for MVP) or hide column until available.~~ ✅ **DONE** (using /api/24h)
4. ~~Add minimal accessibility/ARIA on table controls and inputs.~~ ✅ **DONE** (error alerts, tooltips)
5. ~~Add basic unit tests for `secondsAgoFromUnix` and the `/api/rows` join logic.~~ ✅ **DONE** (21 tests total)
