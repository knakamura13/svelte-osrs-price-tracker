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

## ✅ MVP Complete

All core features and polish priorities completed!

### Next Steps (Post-MVP Enhancement Priorities)

**For Localhost Development:**

1. **⭐ Favourites System** (High Value)
   - Add star icon to each row for quick favoriting
   - Store favourites in localStorage with Svelte store
   - Create `/favourites` route showing only saved items
   - Add badge showing favorite count in header

2. **📊 Margin × Volume Column** (Quick Win)
   - Calculate `(margin × dailyVolume)` to show profit potential
   - Add to table with toggle visibility
   - Helps identify high-opportunity items

3. **📈 Item Detail Drawer** (Rich Feature)
   - Click row → open slide-out drawer
   - Show 24h price chart using existing `/api/24h` data
   - Display item examine text, wiki link, history
   - Close with overlay click or ESC key

**For Production Later:**
- CI/CD pipeline with GitHub Actions
- Deploy to Vercel/Netlify
- Environment variables in hosting platform
- Monitoring/analytics
