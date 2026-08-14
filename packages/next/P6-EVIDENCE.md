# P6 Evidence — preregistered causal pilot machinery

**Epoch:** `native-next-v1` (pilot instrument `native-next-v1-p6pilot`)
**Baselines:** legacy `1460441`, harness `47f9438`
**Date:** 2026-08-14

Status of the P6 gate (machinery lane): the frozen preregistration exists, the
factorial pilot runner executes the full 24-cell design with budget caps,
blocking, seeded randomization, paired blind judging, and a deterministic
analysis — all digest-pinned and reproducible. The live lane (real provider
credentials) runs the same machinery behind direct adapters; the scripted
pilot proves the pipeline with zero spend.

---

## 1. Preregistration (`P6-PREREGISTRATION.md`, frozen)

Design frozen: Runtime {native pilot; legacy lane separate} × Provider stratum
{cn:doubao, cn:glm, cn:qwen, cn:minimax} × Topology {historical, random}
(flat/solo are confirmatory native-only cells) × Task {border-city-autonomy,
regional-militarization, plague-response} × Seed {1} = **24 cells**; blocked by
(task, seed) with seeded execution order; paired blind judging per
block/stratum with presentation swap; budget per cell with fail-closed
semantics; exclusions/missingness/power/stop rules frozen.

## 2. Pilot runner (`runtime/p6-pilot.mjs`)

| Property | Evidence |
|---|---|
| Cell matrix complete | 24 cells (4×2×3×1), all admitted cells stay in the denominator |
| Seeded randomization | `seededPermutation(n, seed)` — deterministic, seed-sensitive, covers all arms (tested) |
| Determinism (plan §18.1) | deterministic per-cell IDs (no ambient randomness): two full pilot runs produce **identical** assignments digest, per-cell evidence digests, and analysis digest (tested) |
| Budget caps | cell usage 35 tokens; `--budget 30` fails all 24 cells closed (`budget_overflow`), every failure recorded in missingness, failed cells stay in the denominator, no judging pairs from failed cells (tested) |
| Strata isolation | per-stratum analysis rows (6 cells each); runtime label `native-next-v1-p6pilot`; legacy epoch never enters (tested) |
| Pairing | 12 (stratum × task) pairs, 2 swap-balanced blind passes each; judge calls purpose-labelled and operationId-correlated |
| Reproducibility | analysis is a pure function of pinned cells + judging (recomputed identically — tested); assignments manifest digest-pinned before the run |

Analysis estimands (deterministic): topology effect (paired historical −
random mean over 12 pairs), per-stratum cost rows, judge swap agreement,
total token cost (cell + judge calls). Report:
`packages/next/runtime/reports/p6-pilot-evidence.json`.

## 3. Status vs plan

| P6 acceptance | Status (machinery lane) |
|---|---|
| 80% power for preregistered primary effects | **Deferred to confirmatory** — power calc needs pilot variance (machinery produces it) |
| All GA quality/causal/provider/safety/cost gates pass | Machinery gates pass; live-provider gates need the live lane |
| Scientific control >=4/5, total >=75/100 | **Evaluated only at confirmatory GA** (plan §17 P0) |
| Independent review can reproduce assignments/exclusions/projections/analyses | ✅ digest-pinned assignments + deterministic analysis, pure-function recompute test |

## 4. What the live lane still needs

- Direct provider adapters for the four strata (credentialed) behind the
  `ModelGateway` contract — the scripted pilot replaces them with
  stratum-labeled scripts today.
- The DeepSeek engineering smoke (`harness-adapter`) already proves the seam
  constructs and resolves models; wiring it as a gateway transport is the
  first live step.
- Confirmatory replication count from pilot variance; ≥30 matched blocks per
  reported stratum.

## 5. Tests

`npm run test:next` — **90/90 pass** (10 contracts + 23 domain + 8 adapter +
11 host + 38 runtime incl. 6 P6). `npm run lint:backend` — clean.
`npm run lint:next-imports` — PASSED.

## 6. Next steps

- Live lane: adapter transport wiring + budgeted calls with credentials.
- Confirmatory power calculation from this pilot's variance.
- GUI render surface (P5 remainder) on the feed/client contracts.
