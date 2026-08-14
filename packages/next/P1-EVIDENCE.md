# P1 Evidence — harness build verification and the first vertical slice

**Epoch:** `native-next-v1` (slice runs in this epoch)
**Baselines:** legacy `1460441`, harness `47f9438`
**Date:** 2026-08-14

Status of the P1 gate: the first vertical slice (plan §16) is implemented,
tested, and its ten evidence items are produced. The DeepSeek seam packages
build and resolve from public exports at the pinned commit.

---

## 1. Harness pin build verification (P0 gate now fully closed)

Earlier rounds verified that all 12 seam `package.json` files at `47f9438`
declare `exports` maps, but the built `lib/` outputs do not exist in the
repository at the pin. This round closed the loop:

1. **Cloned** `deepseek-ai/deepseek-harness` at `47f943859bef60e4160492346772ded9b24f765a`
   (80 MB working tree, `pnpm@11.7.0` monorepo).
2. **Built** with `pnpm install --frozen-lockfile` + `pnpm build:lib` — succeeded;
   `packages/llm/llm/lib/index.js` and `packages/core/session/lib/index.js`
   produced.
3. **Resolved all 12 seams through their exports maps** by importing the built
   packages from a neutral `node_modules` layout:

| Package | Exports resolution | First exports |
|---|---|---|
| `@deepseek-ai/cordis` | ✅ | `Context`, `Fiber`, `EventsService`, `DisposableList` |
| `@deepseek-ai/dsh-llm` | ✅ | `BlockAssembler`, `CallId`, ... |
| `@deepseek-ai/dsh-llm-deepseek` | ✅ | `DeepSeekAdapter`, `DEFAULT_STREAM_IDLE_TIMEOUT_MS`, ... |
| `@deepseek-ai/dsh-agent` | ✅ | `AgentRegistry`, `Inbox`, `agentEvents`, ... |
| `@deepseek-ai/dsh-agent-loop` | ✅ | `AgentLoop`, `AGENT_LOOP_SETTINGS_SCHEMA`, ... |
| `@deepseek-ai/dsh-session` | ✅ | `Session`, `SessionId`, `SessionForkError` |
| `@deepseek-ai/dsh-session/surface` | ✅ | `SurfaceManager`, `foldSurface`, ... |
| `@deepseek-ai/dsh-system-prompt` | ✅ | `SystemPrompt`, `PERSONA_SECTION`, ... |
| `@deepseek-ai/dsh-tools` | ✅ | `RUN_CODE_NAME`, `TOOL_ABORTED`, ... |
| `@deepseek-ai/dsh-tools/presentation` | ✅ | (client bundle) |
| `@deepseek-ai/dsh-credentials` | ✅ | `CredentialProvider`, `credentialRef` |
| `@deepseek-ai/dsh-typert-protocol` | ✅ | `Remote`, `TypertRemoteService`, ... |
| `@deepseek-ai/dsh-typert-registry/client` | ✅ resolves, browser-only | loads, then `window is not defined` in Node (expected client entry) |
| `@deepseek-ai/dsh-client-connection` | ✅ | `HostConnectionService`, `MUX_EVENTS_PATH`, ... |

**Conclusion:** the plan's dependency rule (§4.2 — import only package
`exports`, never internal paths) is satisfiable; the adapter strategy is
build-from-source at the pin (npm lacks `0.1.0-rc.5`). No fork, no private
import, no core/session schema change — all hard stops (§21) avoided.

## 2. First vertical slice (plan §16)

```
RuntimeManifest -> CAS -> single-writer immutable segment -> one direct provider
operation -> raw response artifact -> model-visible surface append -> pure replay
```

**Packages (new):**
- `packages/next/evidence/` — `cas.mjs` (immutable content-addressed store,
  process-crash durability, fd-clean), `segment.mjs` (single-writer JSONL
  segment: checksummed records, committedLength, trailer, crash-freeze +
  content-addressed SegmentSeal, generation N+1 linking), `eventstore.mjs`.
- `packages/next/providers/` — `behavior-script.mjs` (one request / one
  behavior, `assertConsumed` teardown gate; 10 behavior kinds),
  `fake-provider.mjs` (first admitted provider per §17 P1 order),
  `gateway.mjs` (canonical request → start-intent-before-transport → per-chunk
  CAS spill → canonical response/usage; fails closed; never orchestrates).
- `packages/next/runtime/` — `manifest.mjs` (content-hashed RuntimeManifest;
  `instrumentVersion` derived from digest; deterministic canonical JSON),
  `session.mjs` (AgentSession FIFO inbox, at-most-one claimed turn,
  Activation, Turn state machines), `operation.mjs` (start-intent/receipt/
  outcome-unknown state machine; no auto-retry; retry = new operationId +
  `retryOfOperationId`), `slice.mjs` (vertical-slice runner + evidence).

### The ten evidence items

| # | Evidence item | Result |
|---|---|---|
| 1 | Canonical manifest bytes and digest | ✅ `850e3f28…` (64 hex), 1.4 KB artifact |
| 2 | Exact system/tool/request artifacts | ✅ request digest reproduces byte-for-byte from the same inputs |
| 3 | Start intent before HTTP | ✅ `model.start_intent` committed before any `model.raw_chunk` (structural in gateway) |
| 4 | Raw streamed chunks spilled to CAS | ✅ every chunk has a `sha256:` artifact that `cas.exists` |
| 5 | Canonical response and provider usage | ✅ `civ.response/1` artifact + usage (42/37 tokens) |
| 6 | Completed surface revision | ✅ `surface.revision` event, revision 1 |
| 7 | Analytical replay → same surface hash | ✅ `d4459b3b…` == replayed hash (pure replay over committed events) |
| 8 | Crash classifications at every boundary | ✅ a: `START_INTENT_DURABLE → START_OUTCOME_UNKNOWN` (never NOT_STARTED); b: `EFFECT_OUTCOME_UNKNOWN`; c: explicit retry = new operationId |
| 9 | Zero hidden outbound requests | ✅ exactly 1 request, `assertConsumed` enforced; unconsumed scripts fail the run closed |
| 10 | Zero resource residue | ✅ fd count unchanged after the run (one real leak found and fixed: CAS dir-fsync fd) |

Full report: `packages/next/runtime/reports/vertical-slice-evidence.json`.

## 3. Tests

`npm run test:next` — **29/29 pass** (10 contracts + 19 runtime L0):

- contracts: corpus immutability, no-pooling, canonical schema, ID discipline,
  legacy mapping gates, unobservable edges.
- runtime: state machines (FIFO claim order, at-most-one claimed turn, illegal
  transitions, operation lifecycle, outcome-unknown defaults, no auto-retry);
  segment (roundtrip, tamper detection, incomplete-tail recovery, SegmentSeal +
  generation N+1); slice (all ten evidence items, hidden-call protection,
  unexpected-request failure, 6 failure behaviors incl. rate limit / eof early /
  malformed / overflow / cancel-before / cancel-after, manifest determinism).

`npm run lint:backend` — clean (0 problems). `verify-corpus.mjs` — PASSED.

## 4. P1 acceptance status

| P1 acceptance | Status |
|---|---|
| Exact model-visible request and completed surface reconstruct byte-for-byte | ✅ slice item 2 + 7 |
| 100% of outbound model requests have purpose and causal IDs | ✅ every request/event carries purpose + matchId/sessionId/turnId/operationId; gateway test enforces |
| No hidden retry/title/compaction/routing call | ✅ `assertConsumed` + empty-script failure; retryPolicy `none` in manifest |
| Each admitted provider capability has passing contract evidence; missing capability fails closed | ✅ fake adapter capability report; malformed/overflow/rate-limit fail closed (native tool-call + cancellation scripts ready) |
| One session never has two claimed/running turns | ✅ state-machine test |
| Crash at request boundaries never misclassified as NOT_STARTED | ✅ slice item 8a |

## 5. Next steps (P2+)

- `harness-adapter`: real dependency wiring against the built seams (agent-loop,
  session surface, llm-deepseek) — the P1 engineering smoke adapter.
- P2 typed multi-agent: RegimeIR compiler, GraphDispatcher, PolicyEngine, typed
  handoffs, durable inbox, fork/resume.
- L3 SIGKILL matrix (100 trials per boundary) reuses `segment.mjs` freeze/seal.
