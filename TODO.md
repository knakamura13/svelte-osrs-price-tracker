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

-   [x] ~~Item detail page with 24h price chart via `/timeseries`~~ ✅ **DONE**
-   [x] ~~Margin × volume displayed on item detail page~~ ✅ **DONE**
-   [ ] Add margin × volume as sortable column in main table

### DevOps

-   [x] `.env` with `USER_AGENT` and `PUBLIC_REFRESH_MS`
-   [x] Unit testing with Vitest (21 tests passing)
-   [ ] CI typecheck + lint; deploy to Vercel/Netlify

---

## ✅ MVP Complete

All core features and polish priorities completed!

### UI/UX Polish ✅

-   [x] Smooth fade-in animations for table rows
-   [x] Zebra striping for better table readability
-   [x] Enhanced row hover effects with elevation
-   [x] Improved empty state with icon and helpful message
-   [x] Loading skeleton with animated pulse
-   [x] Toast notification system (success/info/warning/error)
-   [x] Smooth scroll to top on page change
-   [x] Animated collapse/expand for filters and columns

### Item Detail Page ✅

-   [x] Dynamic route `/item/[id]` with server-side data loading
-   [x] Time-series price chart (pure SVG, no library dependencies)
-   [x] Buy/sell price visualization with 5-minute intervals
-   [x] Item metadata panel (buy limit, examine text, members status)
-   [x] Price statistics (margin, daily volume, ROI)
-   [x] Profit analytics (post-tax profit, margin × volume)
-   [x] Low volume warning banner
-   [x] Clickable item names in main table
-   [x] Navigation back to main table
-   [x] Links to OSRS Wiki and GEDB

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

-   CI/CD pipeline with GitHub Actions
-   Deploy to Vercel/Netlify
-   Environment variables in hosting platform
-   Monitoring/analytics
