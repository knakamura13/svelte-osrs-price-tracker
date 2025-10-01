## Roadmap

### Foundations
- [ ] Define shared types: `ItemMapping`, `LatestPrice`, `PriceRow`
- [ ] Create server endpoints (proxy + cache): `/api/mapping`, `/api/latest`
- [ ] Add server module for in‑memory TTL cache
- [ ] Join mapping + latest on the server

### Table UI (All Items)
- [ ] Search input with debounce
- [ ] Column sorting and page size selector
- [ ] Pagination controls
- [ ] Compute derived: `margin`, `potentialProfit`, `marginTimesVolume`
- [ ] Time formatting for `highTime`/`lowTime`
- [ ] Row favourite toggle (persist in `localStorage`)

### Favourites
- [ ] Store favourites in a Svelte store backed by `localStorage`
- [ ] `/favourites` route to show saved items

### Refresh & Resilience
- [ ] Manual refresh and auto‑refresh toggle
- [ ] Backoff on failures; show last updated time

### Phase 2
- [ ] `/api/volume-1d` server aggregation using `/1h` (or `/5m`) endpoints
- [ ] Margin × volume column when available
- [ ] Item detail drawer with small 24h chart via `/timeseries`

### DevOps
- [ ] `.env` with `USER_AGENT` and `PUBLIC_REFRESH_MS`
- [ ] CI typecheck + lint; deploy to Vercel/Netlify

