# P2 Evidence — typed multi-agent orchestration on a real regime

**Epoch:** `native-next-v1` (instrument `native-next-v1-p2slice`)
**Baselines:** legacy `1460441`, harness `47f9438`
**Date:** 2026-08-14

Status of the P2 gate: real regime artifacts compile into immutable `RegimeIR`;
the declared graph executes end-to-end in all three orchestration modes with
typed handoffs, durable compound inbox records, policy enforcement, and
mode-tagged participation metrics that never pool.

---

## 1. RegimeIR compiler (`packages/next/domain/regime-ir.mjs`)

Compiles existing regime artifacts (read-only inputs) into immutable IR:

| Regime | Treatment | Agents | Edges | IR digest |
|---|---|---|---|---|
| `regimes/china/tang` | historical | 9 | 15 | `83f1b605…` |
| `regimes/_baseline/tang-random` | random | 9 | 15 | `0a04a3a2…` |
| `regimes/_baseline/tang-flat` | flat | 9 | 0 | `e693b4e6…` |
| `regimes/_baseline/tang-solo` | solo | 1 | 0 | `99b867be…` |

**Correction to the P0 declared gap:** flat and solo topology **artifacts do
exist** (`_baseline/tang-flat`, `_baseline/tang-solo`) — only *traces* were
never run with them. All four §19 topology treatments can therefore be compiled
from real regime artifacts for native fixtures. The frozen corpus gap stands
(the legacy corpus itself has no flat/solo traces).

Compiler guarantees:

- `agentCount` from `metadata.json` must equal the IDENTITY.md role-table count
  (AGENTS.md hard rule 3) — enforced with a hard error.
- The role table parser mirrors the legacy `engine/regime-to-cc.mjs`
  `parseIdentityTable` semantics (AGENTS.md hard rule 2).
- Legacy edge kinds map losslessly onto the canonical enum:
  `command→command`, `info→information`, `veto→review` (legacyKind preserved).
- IR digest covers metadata + IDENTITY + SOUL + topology; compile is
  deterministic (same source → same digest, tested).

## 2. Typed handoff domain (`domain/handoff.mjs`, `graph.mjs`, `policy.mjs`)

- `validateHandoffRequest` — contract check: 12 required fields, edgeKind/mode/
  context/joinPolicy enums; violations fail **before enqueue**.
- `GraphDispatcher` — validates source/target/kind against the declared graph;
  in `graph_enforced` an undeclared edge, wrong kind, or wrong endpoint is
  rejected (evidence: `e99-unknown` → rejected, `vote` on a `command` edge →
  rejected, reversed endpoints → rejected). In `observational` the same request
  is recorded as an observed-unknown edge (topology report `unknownObserved=1`).
- `PolicyEngine` — typed authorization against the concrete actor office, edge,
  kind, and mechanism grant; denied actions throw `PolicyDeniedError` before
  enqueue. **Printed markers never grant authority**: `[VETO]` marker text is
  always denied (`authorizeMarkerText` → granted:false, evidence in the report).
- `Handoff` state machine — PROPOSED → ACCEPTED → CLAIMED → RUNNING →
  CONTRIBUTED → SETTLED, with REJECTED / FAILED / CANCEL_REQUESTED paths and
  `CLAIMED → SETTLED` for notify-at-claim (information edges).

## 3. Orchestration modes and participation (domain/orchestration.mjs)

| Mode | Enforcement claim | This run |
|---|---|---|
| `observational` | Observe only; undeclared edges recorded, policy recorded-not-enforced | 9 offices, 15 exercised, 1 unknown observed |
| `roster_enforced` | Roster completeness of participation | 9 offices, complete: true |
| `graph_enforced` | Handoffs must follow typed authorized edges | 9 offices, 15/15 declared exercised, 0 unknown |

Participation metrics stay distinct: invoked (handoff accepted) / started
(claimed) / contributed (artifact published) / settled (terminal compound
record) — tested independently, one never stands in for another. Roster
completeness counts participation (the entry office has no incoming handoff).
Every mode row carries its own `mode` tag; pooling across modes is tested to
fail (`new Set(modes).size === 3`).

## 4. Durable compound inbox records (`runtime/inbox.mjs`)

- `handoff/accepted_and_target_enqueued` — ONE physical record per acceptance
  (committedLength delta 1, tested).
- `handoff/terminal_and_parent_enqueued` — ONE physical record containing the
  child terminal classification, output refs, ownership release, **and the
  complete parent notice envelope** (tested: `rec.childTerminal` and
  `rec.parentNotice` in the same event).
- FIFO claim pops the durable head; `handoff/claimed` is itself committed;
  replay rebuilds the queue from committed events (tested with a read-only
  replay of the segment file).

## 5. Fork (runtime/fork.mjs)

Deterministic `forkHash` over the balanced completed prefix (ends at the last
committed `surface.revision`); in-flight exchanges are never copied (tested:
5 events → prefix of 3); pins directParentSessionId / rootSessionId / source
surface revision / copied digests; any pinned-input change alters the hash.

## 6. End-to-end evidence

`packages/next/runtime/reports/p2-slice-evidence.json` — 3 mode runs × 96
canonical events each on the real tang graph; every event validates against
`civ.event/1`, single epoch, single instrument, ID discipline enforced.

## 7. Tests

`npm run test:next` — **49/49 pass** (10 contracts + 13 domain + 26 runtime).
`npm run lint:backend` — clean. Corpus verify — PASSED.

## 8. P2 acceptance status

| P2 acceptance | Status |
|---|---|
| Handoff oracle mapping >=99%, unknown edge <1% | **PASS (structural)** — 0 unknown edges in graph_enforced; oracle fixtures for native handoffs defined; >=99% mapping for legacy handled in P0 |
| Invalid actor/office/edge/kind/mechanism fail before enqueue | ✅ rejected at schema/graph/policy stages with committed REJECTED records |
| Printed markers never grant authority | ✅ `[VETO]` marker → granted:false (evidence) |
| invoked/started/contributed/settled independently correct | ✅ per-office ledger, tested distinct |
| Child terminal + parent notice commit atomically | ✅ single compound physical record |
| Fork hash + balanced prefix deterministic | ✅ tested |
| Modes cannot pool | ✅ mode-tagged, tested |

## 9. Next steps (P3+)

- P3 strong durability: SIGKILL matrix (100 trials/boundary) on the segment
  freeze/seal path, cancellation top-down / release bottom-up, projection
  rebuild, outcome-unknown conservatism at scale.
- RegimeIR → RuntimeManifest pinning (IR digest into manifest) and
  harness-adapter wiring for the DeepSeek engineering smoke.
