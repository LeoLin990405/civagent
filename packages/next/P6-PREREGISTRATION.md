# P6 Preregistration — Live Causal Pilot (frozen design)

**Status:** FROZEN. Any change to this design is a new design revision and a
new `instrumentVersion` semantic class (plan §2 invariant 9).
**Epoch:** `native-next-v1` (pilot instrument `native-next-v1-p6pilot`)
**Baselines:** legacy `1460441`, harness `47f9438`
**Date:** 2026-08-14

This document freezes the P6 causal pilot design (plan §19) for the
machinery-validation run. The live lane (real provider credentials) executes
this design with direct provider adapters; the scripted pilot in
`runtime/p6-pilot.mjs` validates the machinery deterministically.

## 1. Design (factorial, preregistered)

| Factor | Levels | Notes |
|---|---|---|
| Runtime | `native-next-v1` (pilot); `legacy-cc-v5` (confirmatory lane from the frozen corpus, separate) | Epochs never pool |
| Provider stratum | `cn:doubao`, `cn:glm`, `cn:qwen`, `cn:minimax` | E3 strata blocks; explicit per cell |
| Topology | `historical` (china/tang), `random` (_baseline/tang-random) | flat/solo are native-only cells in the confirmatory run |
| Task | border-city-autonomy, regional-militarization, plague-response | from the frozen corpus task set |
| Seed | 1 (pilot), more replications in the confirmatory run | deterministic per cell |

**Pilot cell matrix:** 4 strata × 2 topologies × 3 tasks × 1 seed = **24 cells**.

**Blocking:** block = (task, seed). Within a block, execution order is a
deterministic seeded permutation of the 8 arms (LCG from the block seed) —
randomization is seeded, never ambient (plan §18.1).

**Pairing:** within a block, per stratum, the historical arm is paired with
the random arm; each pair is judged twice by the blind judge (presentation
swap), scored on the anchored rubric (legality/feasibility/resilience, 1–4).

## 2. Estimands

1. Topology main effect: mean(historical) − mean(random) over strata × tasks
   (paired per block).
2. Provider-stratified topology effects (4 separate estimates; strata never
   pooled without a stratum label).
3. Judge swap agreement: proportion of pairs where both passes pick the same
   winner (per-pair consistency).
4. Cost accounting: per-cell summed input+output usage from every model call
   (planner + judge); reported per stratum and per topology.
5. Participation completeness per cell: invoked/started/contributed/settled
   from the orchestration ledger.

## 3. Exclusions and missingness

- Every admitted cell remains in the denominator. A cell that fails (timeout,
  budget overflow, error) is retained as `status: failed` with its evidence;
  it never enters the score analysis but is reported in the missingness table.
- Budget per cell: preregistered cap (tokens). Exceeded → cell fails closed
  (never partial scores, never silent truncation).
- Missing usage → the affected cell's cost row is `unavailable`, the score row
  stands only if judging inputs are reconstructible from raw evidence.

## 4. Power and sample size (confirmatory run)

Pilot variance feeds the confirmatory power calculation: primary effects
require ≥80% power at the preregistered minimum effect size; reported provider
strata require ≥30 matched blocks; thresholds pass only on the conservative
95% confidence bound (plan §20.1). The pilot itself is a machinery run, not a
powered inference.

## 5. Budget and stop rules

- Pilot budget: 24 cells × (cell cap) — scripted providers record usage
  without spending.
- Live lane: budgeted direct-provider calls; a live cell that exceeds its cap
  fails closed.
- Stop rules: plan §21 hard stops; if the scripted pilot cannot reproduce its
  analysis deterministically, the live lane does not start.

## 6. Reproducibility contract

- The assignments manifest (all cells with stratum/topology/task/seed/order)
  is digest-pinned before any run.
- Every cell's evidence (manifest digest, request/response digests, event
  count, surface hash) is recorded; analysis recomputes from the pinned
  evidence, never from presentation strings.
- Independent review can reproduce assignments, exclusions, projections, and
  analyses from the committed artifacts.

## 7. Sign-off

Design frozen at `1460441` (legacy) / `47f9438` (harness). Scientific-control
score evaluated only at confirmatory GA (plan §17 P0). This pilot validates
machinery; it produces no scientific inference claim.
