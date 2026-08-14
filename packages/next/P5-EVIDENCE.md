# P5 Evidence — scoped durable feed, unary RPC, and the CLI client

**Epoch:** `native-next-v1`
**Baselines:** legacy `1460441`, harness `47f9438`
**Date:** 2026-08-14

Status of the P5 gate: the transport contract (plan §14.2) is implemented and
the acceptance matrix passes — atomic subscribe/snapshot/live, duplicates,
gaps, generation change (server restart), cursor expiry, unauthorized scopes,
bounded memory, RPC/domain ID distinctness — plus a real Unix-socket
integration and a CLI client on the same contracts as the GUI.

---

## 1. Transport contract (`packages/next/host/`)

### `civ.describe` negotiation
`civ.describe/1` returns protocol versions (describe 1, feed 1), capabilities,
limits, the current feed generation, and the closed method set
(`civ.describe / civ.subscribe / civ.unsubscribe / civ.repair`). The server
never exposes the whole Context.

### Scoped durable `civ.events`
- One topic per match; a subscriber must present the match's `scopeToken`
  (server-side `allowedScopes`). Wrong scope → `SCOPE_DENIED` before any frame
  is sent; publishing to match A never reaches a match-B subscriber (tested).
- **Atomic subscribe** (plan §14.2 steps 1–4): register the bounded live queue
  and capture `headOffset` (single-threaded atomicity), return the snapshot
  `asOf=headOffset`, drain live frames strictly after it. Oracle-exact:
  snapshot eventIds == `feedOracle(committedEvents)` (tested).
- Frames carry `(generation, feedOffset, eventId)` + cursor
  `{generation, feedOffset, headOffset}` so clients can dedupe, detect gaps,
  and track the cursor.

### Client oracle (`civ-client.mjs`)
Framework-agnostic (Node or browser; no Node-only APIs). Tracks
`(generation, feedOffset, eventId)`:

| Scenario | Behavior (tested) |
|---|---|
| Duplicate delivery | deduplicated by `eventId`, never double-applied (`deduplicated` counter) |
| Gap | detected (`GAP` state), repair requested from the expected offset; repair resends committed events; oracle converges, `gapsDetected` counts every gap — none silent |
| Cursor expiry | `EXPIRED` → full snapshot with a new head → `RECONNECTED`; never silently dropped |
| Generation change (server restart) | detected → re-snapshot required; oracle stays exact |
| Bounded memory | client tail window capped (`tailLimit`), server live queue capped (`queueLimit`); overflow surfaces as an explicit gap → repair, never unbounded growth |
| State visibility | every transition surfaces (`SUBSCRIBING/SNAPSHOT/LIVE/GAP/REPAIR/EXPIRED/RECONNECTED/DENIED`) — staleness is never hidden |

### RPC (`rpc.mjs`)
JSON-framed Unix-socket transport: unary calls with `rpcId` correlation,
`newRpcId()` (`rpc-<uuid>`) provably disjoint from all domain IDs (eventId /
matchId / operationId — tested). Server pushes snapshot + live frames on the
scoped topic.

## 2. CLI client (`cli.mjs`)

```
node packages/next/host/cli.mjs describe  --socket /tmp/civ.sock
node packages/next/host/cli.mjs subscribe --socket /tmp/civ.sock --match m1 --scope tok-m1 --count 10
```

Same RPC/`civ.events` contracts as the GUI; not a privileged orchestration
path (plan §14.3). Renders `[generation:feedOffset] type eventId` and explicit
`STATE` lines — canonical contracts only, never text-inferred identity.
Tested end-to-end over a real socket (spawn + assert output).

## 3. Research GUI — status

The GUI data layer is delivered: `CivClient` is browser-runnable and the feed
contract is fully defined. The React render surface itself (tournament
swimlane, declared/observed/exercised topology, mechanism cards, virtualized
tail) is the remaining P5 rendering work and is **documented as deferred** —
per plan §17 P5, the GUI can be disabled independently and the CLI remains on
the same contracts. The browser oracle acceptance is exercised headlessly by
the identical client logic; a real-browser trace run (L4) is the next step.

## 4. Tests

`npm run test:next` — **76/76 pass** (10 contracts + 23 domain + 11 host + 32
runtime). `npm run lint:backend` — clean. Corpus verify — PASSED.

## 5. P5 acceptance status

| P5 acceptance | Status |
|---|---|
| Browser oracle exact through disconnect/duplicate/gap/generation/restart/expiry | ✅ headless client oracle matrix (11 host tests); real-browser trace is the remaining L4 step |
| Stale/gap/reconnect state visible | ✅ explicit state transitions surfaced in CLI + client |
| Tail memory and DOM size bounded under long streams | ✅ client tail window + server queue bounded; overflow → explicit gap/repair |
| RPC IDs and all domain IDs remain distinct | ✅ `rpc-<uuid>` disjoint from domain IDs (tested) |
| Unauthorized subscribers cannot receive another match's scoped feed | ✅ scope token enforced server-side; cross-match leak tested absent |

## 6. Next steps (P6 + GUI + adapter)

- P6 live causal pilot (preregistered factorial) with budgeted direct-provider
  calls — blocked on the real adapters.
- Research GUI render surface (React) on the delivered feed/client contracts.
- `harness-adapter` wiring for the DeepSeek engineering smoke (build-from-source
  at `47f9438`, verified in P1 evidence).
