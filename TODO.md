## Roadmap

### Foundations

-   [x] Define shared types: `ItemMapping`, `LatestPrice`, `PriceRow`
-   [x] Create server endpoints (proxy + cache): `/api/mapping`, `/api/latest`
-   [x] Add server module for in‑memory TTL cache
-   [x] Join mapping + latest on the server

### Table UI (All Items)

-   [x] Implement table columns: name, buy limit, buy price, sell price, most recent buy, most recent sell, margin, daily volume (partial: daily volume pending API)
-   [x] Search input with debounce
-   [x] Column sorting and page size selector
-   [x] Pagination controls
-   [x] Compute derived: `margin` and `dailyVolume` (daily volume deferred)
-   [x] Time formatting for `highTime`/`lowTime`

### Favourites (post-MVP)

-   [ ] Store favourites in a Svelte store backed by `localStorage`
-   [ ] `/favourites` route to show saved items

### Refresh & Resilience

-   [x] Manual refresh button
-   [x] Auto‑refresh toggle with configurable delay (seconds)
-   [ ] Backoff on failures; show last updated time (partial: last updated shown, backoff TBD)

### Phase 2

-   [ ] `/api/volume-1d` server aggregation using `/1h` (or `/5m`) endpoints
-   [ ] Margin × volume column when available
-   [ ] Item detail drawer with small 24h chart via `/timeseries`

### DevOps

-   [ ] `.env` with `USER_AGENT` and `PUBLIC_REFRESH_MS`
-   [ ] CI typecheck + lint; deploy to Vercel/Netlify

---

### Next Steps (MVP polish priorities)

1. Handle fetch failures with retry/backoff and user-facing error state on `/api/rows` load.
2. Expose `PUBLIC_REFRESH_MS` and wire default auto‑refresh period from env; document `.env`.
3. Implement server aggregation for daily volume (optional for MVP) or hide column until available.
4. Add minimal accessibility/ARIA on table controls and inputs.
5. Add basic unit tests for `secondsAgoFromUnix` and the `/api/rows` join logic.
