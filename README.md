## Svelte OSRS Price Tracker

A SvelteKit clone of the OSRS Wiki "All Items" real‑time prices page.

-   **Reference UI**: https://prices.runescape.wiki/osrs/all-items
-   **Primary API**: https://prices.runescape.wiki/api/v1/osrs (docs: https://oldschool.runescape.wiki/w/RuneScape:Real-time_Prices)
-   **Alternate API**: https://api.weirdgloop.org/ (docs: https://api.weirdgloop.org/#/exchange/)

### MVP

-   Paginated, sortable table with columns: name, buy limit, buy price, sell price, most recent buy, most recent sell, margin, daily volume
-   Search bar filtering
-   Auto‑refresh toggle with configurable refresh delay in seconds

### Local development

```
yarn install
yarn dev
```

### Environment variables

Create a `.env` file (server‑only header for upstream requests):

```
USER_AGENT="svelte-osrs-price-tracker – kylenakamura12@gmail.com"
PUBLIC_REFRESH_MS=60000
```

### Notes

-   Respect the wiki API acceptable‑use guidelines (set a descriptive User‑Agent).
-   We will proxy/caché upstream endpoints through SvelteKit endpoints to avoid CORS and centralize throttling.

### License

MIT
