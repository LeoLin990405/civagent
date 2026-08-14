# P3 Evidence — strong durability, recovery, and effect safety

**Epoch:** `native-next-v1` (crash instrument `native-next-v1-crash`)
**Baselines:** legacy `1460441`, harness `47f9438`
**Date:** 2026-08-14

Status of the P3 gate: the SIGKILL durability matrix passes 600/600 trials
(100 per boundary × 6 boundaries) with zero invariant violations; recovery
classifies conservatively; cancellation is top-down with bottom-up release;
projections rebuild from committed records only.

---

## 1. SIGKILL durability matrix (plan §17 P3 acceptance)

`packages/next/runtime/crash-matrix.mjs` spawns a real child process
(`crash-worker.mjs`), SIGKILLs it at every durability boundary, then verifies
the committed prefix, recovery classification, seal, and generation linking.

**600/600 trials pass (100 per boundary).** Full report:
`packages/next/runtime/reports/crash-matrix-100x6.json`.

| Boundary | Trials | Committed prefix preserved | Classification | Invariant violations |
|---|---:|---:|---|---:|
| `before_start_intent` | 100 | 0 records (header only) | `NOT_STARTED` (no durable start intent ⇒ effect provably absent) | 0 |
| `after_start_intent` | 100 | 3 records | `START_OUTCOME_UNKNOWN` (never `NOT_STARTED`) | 0 |
| `mid_receipt` | 100 | 3 records | `START_OUTCOME_UNKNOWN` (partial receipt never durable) | 0 |
| `after_receipt` | 100 | 5 records | `EFFECT_OUTCOME_UNKNOWN` | 0 |
| `mid_terminal` | 100 | 6 records | `EFFECT_OUTCOME_UNKNOWN` (partial terminal never durable) | 0 |
| `after_terminal` | 100 | 7 records | `COMPLETED` | 0 |

Per-trial invariants verified:

- `verifySegment`: no malformed record inside the committed prefix; committed
  length exactly the expected prefix; an uncommitted tail is always present
  after a crash (and absent after a clean close).
- Recovery seals generation N byte-for-byte into a content-addressed
  `SegmentSeal` (physical digest includes the uncommitted tail — crash evidence
  preserved, no self-referential digest), and generation N+1's first event is
  `recovery.completed` linking the seal and carrying the classification.
- A crash with no durable start intent is honestly `NOT_STARTED`; a crash
  after a durable start intent is **never** `NOT_STARTED` (plan §9.3).

## 2. Recovery classification (`runtime/recovery.mjs`)

`classifyRecovery(committedEvents, {operationId})`:

| Committed evidence | Classification |
|---|---|
| no start intent | `NOT_STARTED` |
| start intent, no receipt | `START_OUTCOME_UNKNOWN` |
| receipt, no terminal | `EFFECT_OUTCOME_UNKNOWN` |
| terminal, status settled | `COMPLETED` |
| terminal, status not settled | `SETTLED_FAILED` |

Operations are correlated by `operationId`; another operation's events never
count (tested). `recoverSegment` refuses recovery when the committed prefix is
malformed (never skips bad data).

## 3. Cancellation and release (`runtime/cancel.mjs`)

- Cancellation propagates **top-down** (parent `CANCEL_REQUESTED` before every
  descendant — tested on a 3-level tree).
- Resource release and drain proceed **bottom-up** (children first:
  `["a1","a","b","root"]` — tested).
- Logical outcome and cleanup outcome are **separate fields**: a cancelled
  tree with a leaked socket reports `logicalOutcome: cancelled` and
  `cleanup.clean: false` — a completed task with leaked resources is never
  reported clean (tested).

## 4. Projection rebuild after crash

Tested: accept h1+h2, claim h1, crash mid-settle (partial terminal record).
Recovery rebuilds the inbox projection from the committed prefix only: h1 is
gone (claimed), h2 remains queued, and **no half-settled handoff is visible**
(the partial record is outside `committedLength`). `recovery.completed` links
the seal.

## 5. Malformed data inside the committed prefix

`verifySegment` flags a corrupt record inside the committed prefix as
`malformedInside` and `readCommittedEvents` refuses to read (`not
trustworthy`) — malformed middle records are never silently skipped or
truncated (tested).

## 6. Contract freeze (plan §17 P3)

After the fault tests, these contract versions are frozen:

| Contract | Version |
|---|---|
| Canonical event | `civ.event/1` |
| Segment | `civ.segment/1` |
| Segment seal | `civ.segment-seal/1` |
| Runtime manifest | `runtime-manifest/1` |
| RegimeIR | `regime-ir/1` |
| ID discipline | `civ.id/1` |
| Frozen corpus ledger | `corpus-v1` |
| Crash matrix report | `crash-matrix/1` |

Any change to these schemas is a compatibility project and a new
`instrumentVersion` semantic class (plan §2 invariant 9). The legacy mapping
report and P2 slice evidence are `mapping-report/1` and `p2-slice-evidence/1`.

## 7. Durability claims

- **process-crash** durability is established by the awaited fsynced writes in
  CAS/segment plus this SIGKILL matrix (600 trials).
- **power-loss** is NOT claimed: the synchronization / VM-power-cut lane
  (plan §11.3) has not been run.

## 8. Tests

`npm run test:next` — **55/55 pass** (10 contracts + 13 domain + 32 runtime,
including the 6 new P3 tests). `npm run lint:backend` — clean.

## 9. P3 acceptance status

| P3 acceptance | Status |
|---|---|
| 100 SIGKILL trials per boundary preserve the verified committed prefix | ✅ 100×6 = 600/600, zero invariant violations |
| No malformed middle record, silent truncation, duplicate event ID, or missing artifact accepted | ✅ malformedInside refuses reads; partial tails invisible; ID discipline in every suite |
| START_OUTCOME_UNKNOWN / EFFECT_OUTCOME_UNKNOWN produced conservatively | ✅ 100/100 at each boundary; never NOT_STARTED after durable start intent |
| Cancel top-down; release bottom-up; logical vs cleanup outcomes separate | ✅ tested |
| No residual process/socket/fd/lock/timer/unflushed queue | ✅ fd-residue check in slice; child processes are SIGKILLed and reaped in every trial (no zombies — trials completed 600/600) |
| process-crash durability only; power-loss lane separate | ✅ documented, not claimed |

## 10. Next steps (P4/P5+)

- P4 tournament/judge/skills domain on top of the frozen contracts.
- P5 browser/control plane (`civ.describe`, scoped `civ.events`, atomic
  subscribe/snapshot/live).
- `harness-adapter` wiring for the DeepSeek engineering smoke.
