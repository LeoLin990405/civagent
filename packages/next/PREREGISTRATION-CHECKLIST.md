# P0 Preregistration-Completeness Checklist

**Status:** SIGNED OFF (each item frozen; the final scientific-control score is
evaluated only in P6, per plan §17 P0).
**Instrument:** `legacy-cc-v5` / target `native-next-v1`
**Baselines:** legacy `1460441`, harness `47f9438`
**Date:** 2026-08-14

Every item is frozen at P0. Changes after this signature require a new design
revision and a new `instrumentVersion` semantic class (plan §2 invariant 9).

| # | Item | Frozen decision | Source |
|---|---|---|---|
| 1 | **Inputs** | Frozen corpus: 105 legacy traces + 3 tournaments (SHA-256 ledger, `corpus/MANIFEST.json`). Four E3 provider strata (doubao/glm/qwen/minimax) + kimi/native/mimo breadth. Regime artifacts at `regimes/**`, `schemas/**`, judge rubric, existing runtime-graph artifacts, all read-only. | plan §17 P0, corpus manifest |
| 2 | **Estimands** | Primary: topology main effect, runtime main effect, runtime×topology interaction, provider-stratified estimates, participation completeness (invoked/started/contributed/settled), judge agreement/swap sensitivity, cost and failure outcomes. Runtime vs legacy claims are runtime claims, never topology claims. | plan §19 |
| 3 | **Contrasts** | Factorial: Runtime {legacy-cc-v5, native-next-v1} × Topology {historical, random, flat, solo}. Block by task, provider, seed, roster; randomized execution order within block; paired blind multi-judge with A/B swap. NOTE: legacy corpus contains only historical + random (declared gap §1.3); flat/solo cells exist only in the native epoch — the four-level factorial completes in P6 with native-produced cells. | plan §19, corpus ledger |
| 4 | **Exclusions** | Admitted-run denominator never shrinks: timeout/cancel/failure retained, latency censored at deadline, partial artifacts count, missing usage fails the affected gate. Eligibility rules and one-sided pair exclusion apply to pools, not to the denominator. Epoch mixing, instrument mixing, and mimo-in-E3 are excluded by definition. | plan §20.1, §2, E3 freeze commit `f2279f9` |
| 5 | **Missingness** | Missing usage/cancel/tool evidence fails closed for the affected claim; missing usage makes the gate fail rather than disappear. Unobservable legacy logical edges are labelled `unavailable` and never counted in a handoff denominator (importer enforces this: 0 observable handoffs, 4,263 unavailable session observations). | plan §12.2, §17 P0, mapping report |
| 6 | **Sample size / power method** | Power computed from pilot variance before the confirmatory run; primary tests >=80% power at the preregistered minimum effect size; otherwise exploratory/inconclusive. Reported provider strata >=30 matched blocks. Thresholds pass only on the conservative 95% confidence bound. | plan §19, §20.1 |
| 7 | **Cost accounting** | Tokens = summed input+output usage of every planner/office/judge/extractor/auditor/retry/summary call per admitted match; artifact bytes = all sealed raw/canonical/surface/projection artifacts per match; descriptive cross-epoch contrasts only, never pooled ranks. | plan §20.1 |
| 8 | **Stop rules** | 12 hard stops (plan §21), per-phase stop/rollback in §17, >20 weeks / >38 engineer-weeks triggers a new decision review, and GA thresholds in §20 (score >=75/100, scientific control >=4/5, all hard quantitative gates). | plan §17, §20, §21 |
| 9 | **Gate evidence linkage** | Every category score 0–5 maps to linked raw evidence (corpus digests, mapping report, crash matrix, behavior scripts); missing evidence is zero. Reproducible-anchor rubric in plan §20.2. | plan §20.2 |
| 10 | **Epoch/instrument separation** | Executable tests enforce no pooling (`npm run test:next`): mixed-epoch stream rejected, per-match single epoch/instrument, ID discipline, canonical schema. Ranks/pools epoch-scoped. | plan §2, contracts test suite |

**Signature conditions**

- All items above are frozen at the pinned baselines.
- The scientific-control **score** (0–5) is evaluated only at P6, per plan §17 P0.
- Any revision to items 1–10 is a new design revision and invalidates pooling with
  earlier `instrumentVersion` classes.

**Open P0 items not gated by this checklist**

- Harness build-from-source at `47f9438` (npm lacks `0.1.0-rc.5`) — a P1
  engineering step; the structural exports check passes (P0-EVIDENCE §2).
- Synthetic typed handoff fixtures for the >=99%/<1% oracle — P2 scope, defined
  against the canonical contracts in `contracts/`.
