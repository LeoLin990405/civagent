# P4 Evidence — owned tournament, paired blind judging, skill provenance

**Epoch:** `native-next-v1` (instrument `native-next-v1-p4slice`)
**Baselines:** legacy `1460441`, harness `47f9438`
**Date:** 2026-08-14

Status of the P4 gate: an owned tournament schedules, admits (eligibility +
caps + deadline + strata blocks), runs, judges (paired blind with swap
balance), ranks (epoch-scoped), and manages skill provenance — end-to-end on
two real regimes — with raw evidence proven to survive every projection.

---

## 1. Tournament domain (`domain/tournament.mjs`)

- **Owned scheduling**: every match belongs to exactly one tournament
  (`assertOwned` rejects detached runs; tested). No uncapped fan-out: global /
  per-regime / per-office caps bound admission and are enforced at admit time
  (tested: global cap 2 → third admission throws `EligibilityError`).
- **Eligibility** (`checkEligibility`): compiled RegimeIR required; provider
  required; seed required; a comparison-pool entry needs its pair completed —
  **one-sided pairs cannot enter the pool** (only an explicit `solo`
  declaration may enter unpaired). Denied at admission, never at settlement.
- **Deadline**: admission closes when the deadline passes; late matches throw
  (`closedForAdmission` latches; tested).
- **Four E3 strata are explicit blocks**: `cn:doubao / cn:glm / cn:qwen /
  cn:minimax`; unknown strata are rejected (tested); a match row declares its
  stratum and the snapshot carries it — no silent provider insertion.
- **Join**: the tournament joins only when every admitted match reached
  TERMINAL or CANCELLED (tested).

## 2. Paired blind judging (`domain/judge.mjs`)

- **Blind input**: `blindPresentation` anonymizes arms to "Civ A"/"Civ B" and
  carries **only** `surfaceText` — no regime, backend, model, or provider
  metadata can leak into the judge prompt (tested: `Object.keys(p.A) ===
  ["surfaceText"]`).
- **Swap balance**: every pair is judged twice — once in each presentation
  order; the reported score is the swap-consistent deterministic mean over the
  anchored dimensions (tested: two passes, `passes[0].swap !== passes[1].swap`,
  aggregation deterministic and un-swaps correctly).
- **Anchored rubric** (ported from `engine/v5/judge-rubric.mjs`): dimensions
  `legality / feasibility / resilience` on an anchored 1–4 integer scale
  (tested per dimension in the slice).
- **Judge calls are purpose-labelled and 100% correlated**: every judge pass
  is a `ModelGateway` operation with `purpose: "judge"` and its own
  `operationId`, committed as `judge.observed` events (tested in the slice).
- **Eligibility**: judge inputs must be reconstructible from raw evidence
  digests; identical arms (one-sided pair) are rejected (tested).

## 3. Skill provenance (`domain/skills.mjs`)

- State machine `PROPOSED -> AUDITED -> PROMOTED -> REVOKED` (and
  `AUDITED -> REJECTED`), illegal transitions throw (tested: promote without an
  approving audit throws).
- Every skill pins an immutable `contentHash` and causal lineage
  (`authorMatchId`, `extractorCallId`); promotion requires an approval
  identity (supply-chain gate) and records `effectiveTime`.
- A match pins exactly one **skill-set digest** over its promoted skills —
  revoked/rejected skills never enter the digest (tested: digest with
  [revoked, rejected, promoted] equals digest with [promoted] alone).
- No live symlinks, mutable shared HOME, or silent self-modification (plan
  §11.5) — provenance is event/state-based only.

## 4. End-to-end slice (`runtime/p4-slice.mjs`)

`regimes/china/tang` + `regimes/china/qin` → tournament (task, caps, deadline,
strata) → 2 owned matches (scripted planner turns) → 2 blind judge passes
(swap-balanced) → deterministic aggregation → ranking; plus skill
propose/audit/promote/reject and skill-set pinning. Evidence:

| Item | Result |
|---|---|
| One-sided pair admission | denied |
| Unknown stratum admission | denied |
| Missing seed admission | denied |
| Global-cap admission | denied |
| Judge passes | 2, swap-balanced, purpose `judge`, correlated |
| Aggregate | A (tang) 8 / B (qin) 7 — deterministic |
| Skills | skill-1 PROMOTED, skill-2 REJECTED, set digest pinned |
| Raw evidence survives all projections | ✅ CAS inventory digest identical before/after ranking + snapshot |
| Tournament join | ✅ (cap-filler matches cancelled, never detached) |
| Committed events | all validate `civ.event/1`, single epoch, ID discipline |

Report: `packages/next/runtime/reports/p4-slice-evidence.json`.

## 5. Tests

`npm run test:next` — **65/65 pass** (10 contracts + 23 domain + 32 runtime).
`npm run lint:backend` — clean. Corpus verify — PASSED.

## 6. P4 acceptance status

| P4 acceptance | Status |
|---|---|
| No detached run or uncapped fan-out | ✅ owned matches, caps enforced, `assertOwned` |
| Ineligible or one-sided pairs cannot enter the pool | ✅ denied at admission (tested) |
| Judge calls blind, swap-balanced, purpose-labelled, 100% correlated | ✅ tested + slice evidence |
| All four provider strata remain explicit blocks | ✅ `E3_STRATA_BLOCKS`, unknown stratum denied |
| Skill provenance + per-match skill-set digest | ✅ state machine + pinned digest |
| Raw evidence survives all surface/projection operations | ✅ CAS digest equality before/after |

## 7. Next steps (P5/P6)

- P5 browser/control plane: `civ.describe`, unary RPC, scoped durable
  `civ.events`, atomic subscribe/snapshot/live, CLI + research GUI.
- P6 live causal pilot (preregistered factorial) + `harness-adapter`
  DeepSeek engineering smoke.
