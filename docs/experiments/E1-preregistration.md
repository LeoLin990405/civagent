# E1 — Pilot: does the governance-topology ranking depend on the scenario?

**Registered 2026-07-30, before any match was run.** Written first on purpose: with
five regimes and three scenarios there are enough degrees of freedom to narrate
almost any result afterwards. Committing the predictions in advance is what makes
the outcome informative rather than decorative.

## Question

Prior tournaments ranked regimes on a single scenario. That cannot distinguish
two very different worlds:

- **A — topology matters and is task-dependent.** Different wiring suits different
  governance problems, so the ranking reorders across scenarios.
- **B — the harness is measuring something else.** If one regime wins every
  scenario by a similar margin, the likeliest explanation is not that its
  topology is universally superior but that the judge is rewarding a stable
  property of its output — length, register, structure — that has nothing to do
  with wiring.

**A ranking that is identical across all three scenarios is evidence against the
project's core proposition, not for it.**

## Design

Five regimes, chosen to span five of the six canonical orchestration patterns.
All run on the **same backend** (`cn:doubao`) so the model is not a confound.

| Civ | Pattern | Agents |
|---|---|---|
| `china/qin` | centralized | 7 |
| `china/tang` | checks-and-balances | 9 |
| `global/athens` | democratic | 6 |
| `china/zhou` | federation | 8 |
| `china/ming` | dual-track | 8 |

Three scenarios from `engine/prompts/governance-scenarios.json`, chosen because
the patterns' documented strengths (`engine/modes/*.md`, README §2.2) predict a
*different* winner in each:

| # | Scenario | Governance demand | Predicted advantage |
|---|---|---|---|
| S1 | `plague-response-01` | speed under time pressure; error cost is delay | **centralized** (`china/qin`) — "speed of decision takes priority over deliberation" |
| S2 | `regional-militarization-01` | low reversibility; error cost is a civil war | **checks-and-balances** (`china/tang`) — "low reversibility, high cost of error" |
| S3 | `border-city-autonomy-01` | heterogeneous local conditions, autonomy bargaining | **federation** (`china/zhou`) — "highly heterogeneous domains, local autonomy" |

Judging: default harness settings — anonymized transcripts, anchored 4-point
rubric (legality / feasibility / resilience), order-swapped double pass, shared
verbosity budget, `biasReport` retained.

## Pre-registered predictions

1. **P1 (primary).** The winner differs across at least two of the three
   scenarios. *If the same regime wins all three, world B is the better
   explanation and the ranking machinery should not be trusted until the cause
   is found.*
2. **P2.** For each scenario, the predicted pattern places in the top two.
3. **P3.** Score spread within a scenario exceeds the pass-to-pass position
   effect reported in `biasReport`. *If the spread is smaller than the noise the
   judge shows between its own two passes, no ranking is being measured at all.*

## What this pilot deliberately does **not** establish

- **No control arm.** Baseline controls (`_baseline/*-random`) are not in this
  run, so it cannot say whether a real topology beats a scrambled one — only how
  five real topologies order against each other.
- **n = 1 per cell.** One match per (regime, scenario). Variance between repeat
  runs of the same cell is unmeasured, so a small score gap means nothing.
- **Declared topology only.** Whether the declared edges were exercised is not
  verified; see README §9.6.

## Recording

Results, including outcomes that contradict the predictions above, go in
`docs/experiments/E1-results.md`. Tournament ids and raw manifests are the
record of what was actually run.
