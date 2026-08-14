# Research GUI — browser control plane (plan §14.3)

**Epoch:** `native-next-v1` · **Date:** 2026-08-14

The P5 remainder is now delivered: a real browser research GUI on the scoped
`civ.events` WebSocket transport, sharing the exact client oracle logic with
the CLI, plus headless RFC 6455 contract tests.

---

## 1. WebSocket transport (`host/ws.mjs`)

- Minimal **RFC 6455** server (handshake, masked-frame decode, ping/pong,
  close) bridging the **same RPC dispatch** as the Unix-socket transport
  (`dispatchRpc` extracted into `rpc.mjs` — one contract, two transports).
- Serves the GUI statically: `http://127.0.0.1:<port>/` → `index.html`,
  `/civ-client.mjs` (single source from `host/`, shared with the CLI).
- Publishes live events to every connected subscriber and drains frames.

## 2. Research GUI (`ui/index.html`)

Zero-dependency vanilla JS + browser WebSocket:

- **`civ.describe` panel** — protocol versions, capabilities, feed generation.
- **Subscribe form** — match id + scope token; `SCOPE_DENIED` shown on refusal.
- **State badge** — SUBSCRIBING / SNAPSHOT / LIVE / GAP / REPAIR / EXPIRED /
  RECONNECTED / DENIED, with explicit gap/expiry notices (staleness is never
  hidden).
- **Event timeline** — canonical contracts only (`[gen:offset] seq type
  eventId digest`); **bounded DOM** (200-row virtual tail window) and bounded
  client tail (`tailLimit 200`) — no unbounded replay/render.
- **Per-type lanes** — a swimlane-style projection of the observed type
  distribution; rendered from canonical event types, never text-inferred
  identity or topology.
- Live stats: applied / deduplicated / gaps / repairs / tail length.
- Uses the **same `CivClient` oracle** as the CLI — dedupe, gap repair,
  cursor expiry, generation-change re-snapshot all apply identically in the
  browser.

## 3. Headless tests (`host/test/ws.test.mjs`, 4/4)

| Test | Result |
|---|---|
| Handshake + civ.describe + static GUI serving | ✅ 101 upgrade, describe schema, index.html + civ-client.mjs served |
| Subscribe snapshot + live → browser oracle | ✅ snapshot frames exactly the committed events; live frame strictly after the snapshot head; feeding every frame through `CivClient` reproduces the store oracle event-for-event |
| Scope denial | ✅ `SCOPE_DENIED`, zero frames leaked to an unauthorized subscriber |
| Generation change (restart) | ✅ browser oracle detects generation 2 → `resnapshot` → RECONNECTED |

## 4. Run it

```bash
# start a feed server with the GUI (node):
#   (see host/ws.mjs — WsServer({port, feed}); feed from an EventStore-backed
#    eventSource + allowedScopes)
node --input-type=module -e "…"   # or wire into the host boot in P6
# then open http://127.0.0.1:<port>/ in a browser
```

## 5. Status vs plan

| P5 acceptance | Status |
|---|---|
| Browser oracle exact through disconnect/duplicate/gap/generation/restart/expiry | ✅ client oracle shared CLI/GUI; WS contract tests + previous 11 host tests |
| Stale/gap/reconnect state visible | ✅ state badge + notices in the GUI, state transitions surfaced |
| Tail memory and DOM size bounded | ✅ 200-row window, `tailLimit` client window, bounded server queues |
| RPC and domain IDs distinct | ✅ (P5 suite) |
| Unauthorized subscribers cannot receive another match's feed | ✅ scope token enforced on both transports |
| GUI renders only canonical/projection contracts | ✅ timeline/lanes from canonical event fields only |

## 6. Tests

`npm run test:next` — **98/98 pass** (94 + 4 WS). Both lints clean.

## 7. Next steps

- Live lane: broker with a real key → one budgeted call through the vertical
  slice → the GUI shows real events.
- Wire `WsServer` into a `host` boot entry (CLI `serve` command) once the live
  lane has a real feed source.
