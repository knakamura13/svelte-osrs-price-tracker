## Svelte OSRS Price Tracker

A SvelteKit clone of the OSRS Wiki "All Items" real‑time prices page.

- **Reference UI**: https://prices.runescape.wiki/osrs/all-items
- **Primary API**: https://prices.runescape.wiki/api/v1/osrs (docs: https://oldschool.runescape.wiki/w/RuneScape:Real-time_Prices)
- **Alternate API**: https://api.weirdgloop.org/ (docs: https://api.weirdgloop.org/#/exchange/)

### MVP

- Search bar filtering
- Paginated, sortable table with columns: name, buy limit, members, buy/sell prices, recent times, margin, potential profit, favourites
- Auto‑refresh toggle
- Favourites view

### Local development

```
yarn install
yarn dev
```

### Environment variables

Create a `.env` file (server‑only header for upstream requests):

```
USER_AGENT="svelte-osrs-price-tracker – yourname@example.com"
PUBLIC_REFRESH_MS=60000
```

### Notes

- Respect the wiki API acceptable‑use guidelines (set a descriptive User‑Agent).
- We will proxy/caché upstream endpoints through SvelteKit endpoints to avoid CORS and centralize throttling.

### License

MIT
