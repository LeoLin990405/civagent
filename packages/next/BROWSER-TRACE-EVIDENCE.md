# Real-Browser Trace Evidence — L4 via opencli

**Epoch:** `native-next-v1` · **Date:** 2026-08-14

The plan's L4 acceptance ("Browser projection equals event-ID oracle", §18.2)
is now verified in a **real browser driven by `opencli`** (the local
AI-powered website CLI) against the live research GUI and the scoped
`civ.events` WebSocket.

---

## 1. Setup

- Scratch Next EventStore with 8 committed events (match.admitted →
  turn.observed → model.raw_chunk → turn.observed → model.response →
  surface.revision → turn.observed → match.terminal).
- `host/serve.mjs` on `http://127.0.0.1:19999/` (scope token `tok-oc`).
- `opencli browser gui open http://127.0.0.1:19999/` — opencli launched a real
  Chrome session (page `FA2EC58C…`) and reported the DOM state.

## 2. Interaction (via opencli)

| Step | Result |
|---|---|
| `browser state` | Full GUI structure: `#wsurl` [1], `#match` [2], `#scope` [3], `#connect` [4] |
| `fill 1 ws://127.0.0.1:19999/` | filled + verified |
| `fill 3 tok-oc` | filled + verified |
| `click 4` (Connect + subscribe) | clicked, exact match |
| `state` after 1.5 s | **`#state = LIVE`**; `#stats = applied 8 · dup 0 · gaps 0 · repairs 0 · tail 8`; `#describe` shows the `civ.describe/1` negotiation result |
| `eval` timeline rows | 8 rows, IDs `ev-oc-0..7`, types exactly the store oracle |
| `screenshot` | saved (`ui/gui-evidence.png`), independently described by a vision model: LIVE badge, applied 8, full canonical timeline |

## 3. Oracle equality (plan §15 "Is the feed repairable?")

Browser projection == event-ID oracle, event for event:

```
1:0 match.admitted   ev-oc-0   1:1 turn.observed    ev-oc-1
1:2 model.raw_chunk  ev-oc-2   1:3 turn.observed    ev-oc-3
1:4 model.response   ev-oc-4   1:5 surface.revision ev-oc-5
1:6 turn.observed    ev-oc-6   1:7 match.terminal   ev-oc-7
```

Zero duplicates, zero gaps, zero repairs needed — the atomic
subscribe/snapshot/live delivery held in a real browser over a real
WebSocket.

## 4. What was verified end-to-end

- RFC 6455 WebSocket transport (handshake → describe → subscribe → frames).
- Atomic snapshot + live delivery with the shared `CivClient` oracle running
  **in the browser**.
- Scope-token authorization path (the GUI's subscribe call carries the token;
  wrong tokens were already covered by the headless WS tests).
- GUI rendering contracts: canonical event fields only; bounded DOM; state
  visibility (LIVE badge + stats).

## 5. Artifacts

- `packages/next/host/browser-trace.mjs` — optional Playwright-driven repeat
  of the same trace (skips when Playwright is absent).
- `packages/next/ui/gui-evidence.png` — screenshot of the live GUI.
- Headless WS contract tests: `host/test/ws.test.mjs` (4/4).

## 6. Status vs plan

| Item | Status |
|---|---|
| §17 P5: browser oracle exact through the acceptance matrix | ✅ headless matrix + this real-browser trace |
| §18.2 L4: real browser | ✅ via opencli-driven Chrome |
| §15 "Is the feed repairable?" acceptance (100% projection equality) | ✅ snapshot+live equality; gap/repair/expiry covered headlessly |
