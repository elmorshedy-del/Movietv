# Live TV architecture

The MovieTV frontend never knows provider stream ids and never reads the full IPTV catalog.

## The three layers

1. `content.ts` — product configuration. This is the only file normally edited to add/remove/reorder channels and home rows.
2. `catalog.ts` — provider adapter. It fetches the live KoraZero IPTV Lab catalog, caches it, resolves curated channel identities against changing provider names, and mints playback URLs only when a viewer opens a channel.
3. `service.ts` — assembles product-facing home/section/playback responses. Routes in `server/routes/tv.ts` stay thin.

## Add a channel

1. Add one `CHANNELS` entry with a stable product id, label, and one or more provider-name aliases.
2. Add that id to any `HOME_ROWS` or `SECTIONS` list where it should appear.
3. Run `pnpm test` and `pnpm typecheck`.

Do **not** copy a current provider `streamId` into configuration. The upstream catalog can rebuild those ids. The resolver deliberately matches identity from names and rejects excluded near-misses instead.

## Add a home row

Add one object to `HOME_ROWS`:

- `kind: "channels"` + `channelIds` for a live-channel shelf.
- `kind: "categories"` + `items` for editorial navigation cards.

`client/components/tv/HomeRow.tsx` renders both generically; no homepage JSX rewrite is needed.

## Playback

`GET /api/tv/channel/:channelId` resolves the current best same-channel variant and asks the existing KoraZero IPTV Lab backend for short-lived playback URLs. The browser prefers MPEG-TS when supported and falls back to HLS. If a feed fails, the watch page requests the next ranked **same-channel** variant. It never falls sideways into a different channel.

## Environment

`IPTV_UPSTREAM_ORIGIN` optionally overrides the upstream origin. It defaults to `https://korazero.com`.

No IPTV credentials belong in this repository.
