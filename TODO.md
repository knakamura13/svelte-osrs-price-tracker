## Roadmap

### Foundations

- [x] Define shared types: `ItemMapping`, `LatestPrice`, `PriceRow`
- [x] Create server endpoints (proxy + cache): `/api/mapping`, `/api/latest`
- [x] Add server module for in‑memory TTL cache
- [x] Join mapping + latest on the server

### Table UI (All Items)

- [x] Implement table columns: name, buy limit, insta-buy price, insta-sell price, most recent buy, most recent sell, margin, daily volume
- [x] Search input with debounce
- [x] Column sorting and page size selector
- [x] Pagination controls
- [x] Compute derived: `margin` and `dailyVolume`
- [x] Time formatting for `highTime`/`lowTime`
- [x] Advanced filtering (numeric ranges + time duration filters)
- [x] Column visibility toggles with persistence

### Favourites (post-MVP)

- [ ] Store favourites in a Svelte store backed by `localStorage`
- [ ] `/favourites` route to show saved items

### Refresh & Resilience

- [x] Manual refresh button
- [x] Auto‑refresh toggle with configurable delay (seconds)
- [x] Backoff on failures; show last updated time
- [x] Exponential backoff with retry countdown display
- [x] Auto-disable after 5 consecutive failures

### Phase 2

- [x] ~~Item detail page with 24h price chart via `/timeseries`~~ ✅ **DONE**
- [x] ~~Margin × volume displayed on item detail page~~ ✅ **DONE**
- [ ] Add margin × volume as sortable column in main table

### Svelte 5 Migration

**Note**: The codebase contains Svelte 4 syntax that needs to be migrated to Svelte 5. The following files require updates:

#### Files Requiring Migration:

1. **src/lib/components/SearchBar.svelte**
    - Convert `export let` props to `$props()` rune
    - Convert `onDestroy` lifecycle to `$effect` with cleanup

2. **src/routes/+page.svelte**
    - Convert `export let` props to `$props()` rune
    - Convert `onMount`/`onDestroy` lifecycles to `$effect`
    - Convert `$:` reactive statements to `$derived`/`$effect`

3. **src/lib/components/PriceChart.svelte**
    - Convert `export let` props to `$props()` rune
    - Convert `$:` reactive statements to `$derived`

4. **src/routes/+layout.svelte**
    - Convert `<slot />` to children prop pattern

5. **src/routes/item/[id]/+page.svelte**
    - Convert `export let` props to `$props()` rune

6. **Remaining Components** (need $props() migration):
    - src/lib/components/ColumnsToggle.svelte
    - src/lib/components/PriceTable.svelte
    - src/lib/components/ChartTooltip.svelte
    - src/lib/components/FiltersPanel.svelte
    - src/lib/components/Toast.svelte
    - src/lib/components/LoadingSkeleton.svelte
    - src/lib/components/HeaderControls.svelte
    - src/lib/components/ErrorAlert.svelte
    - src/lib/components/PaginationControls.svelte
    - src/lib/components/AppHeader.svelte

**Note**: VolumeChart.svelte already uses Svelte 5 syntax and doesn't need migration.

### DevOps

- [x] `.env` with `USER_AGENT` and `PUBLIC_REFRESH_MS`
- [x] Unit testing with Vitest (21 tests passing)
- [ ] CI typecheck + lint; deploy to Vercel/Netlify

---

## ✅ MVP Complete

All core features and polish priorities completed!

### UI/UX Polish ✅

- [x] Smooth fade-in animations for table rows
- [x] Zebra striping for better table readability
- [x] Enhanced row hover effects with elevation
- [x] Improved empty state with icon and helpful message
- [x] Loading skeleton with animated pulse
- [x] Toast notification system (success/info/warning/error)
- [x] Smooth scroll to top on page change
- [x] Animated collapse/expand for filters and columns

### Item Detail Page ✅

- [x] Dynamic route `/item/[id]` with server-side data loading
- [x] Time-series price chart (pure SVG, no library dependencies)
- [x] Insta-buy/sell price visualization with 5-minute intervals
- [x] Item metadata panel (buy limit, examine text, members status)
- [x] Price statistics (margin, daily volume, ROI)
- [x] Profit analytics (post-tax profit, margin × volume)
- [x] Low volume warning banner
- [x] Clickable item names in main table
- [x] Navigation back to main table
- [x] Links to OSRS Wiki and GEDB

### Interactive Chart Features ✅

- [x] Time range selector (24h / 7d / 30d buttons)
- [x] Circular markers at each data point on both lines
- [x] Custom tooltip component (no ugly title attributes)
- [x] Hover tooltips showing both insta-buy/sell prices at same timestamp
- [x] Crosshair lines (vertical + 2 horizontal dashed lines)
- [x] Nearest point detection with mouse tracking
- [x] Highlighted hover states with larger circles
- [x] Smooth animations and transitions
- [x] Dark mode support for all interactive elements

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
