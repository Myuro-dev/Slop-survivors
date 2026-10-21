# Till Dawn leaderboard server

This is a Cloudflare Worker with a D1 database. It stores submitted runs and serves the four boards (fastest banish, damage, moths, level). The game talks to it through `LB_URL` in `index.html`.

## One-time setup

```bash
cd server
npx wrangler login                    # opens your browser once
```

Put your D1 database's name and id in `wrangler.toml`. You can find them on the Cloudflare dashboard under D1, or by running `npx wrangler d1 list`. Then create the table:

```bash
npx wrangler d1 execute <DB_NAME> --remote --file schema.sql
npx wrangler secret put ADMIN_KEY      # choose a long random string; needed to delete entries
npx wrangler deploy                    # prints the URL, e.g. https://till-dawn-lb.<you>.workers.dev
```

Copy that URL into `LB_URL` near the top of the Leaderboards section in `index.html`, then push to GitHub Pages.

## Test locally

```bash
npx wrangler d1 execute <DB_NAME> --local --file schema.sql
npx wrangler dev                       # http://localhost:8787
curl -X POST http://localhost:8787/runs -H "Content-Type: application/json" -d "{\"name\":\"Tester\",\"version\":\"2026.10\",\"banished\":false,\"banish_t\":null,\"dmg\":500000,\"kills\":4000,\"lv\":60,\"survived\":600,\"clock\":900,\"rifts\":3,\"relic\":\"bay\",\"build\":\"{}\"}"
curl "http://localhost:8787/top?board=damage&version=2026.10"
```

## Moderation

```bash
curl -X DELETE https://till-dawn-lb.<you>.workers.dev/runs/<id> -H "X-Admin-Key: <your ADMIN_KEY>"
```

Each row's `id` is shown by `GET /top` (or browse the table in the D1 dashboard).

## New season

Bump `GAME_VERSION` in `index.html`, for example `'2026.11'`. The boards show only the current version, so old scores stay in the database but drop off the boards.
