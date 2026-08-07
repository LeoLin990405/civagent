# E3 — results

Run 2026-08-04 02:19 → 2026-08-05 17:53 CST. Pre-registration:
[E3-preregistration.md](./E3-preregistration.md), frozen and committed before
`--execute` was invoked once.

**60 tournaments, 600 arms.** Four backends × three scenarios × five repeats,
run as four parallel strata. Analysis: `scripts/e3-analyze.mjs`.

| Stratum | cells | log |
|---|---|---|
| `cn:doubao` | 15/15 | `e3-cn-doubao-*` |
| `cn:glm` | 15/15 | `e3-cn-glm-*` |
| `cn:minimax` | 15/15 | `e3-cn-minimax-*` |
| `cn:qwen` | 15/15 | `e3-cn-qwen-*` |

The instrument was frozen before the run. Every file that shapes a match —
`dispatch-plan.mjs`, `run-v5.mjs`, `tournament.mjs`, `events.mjs`,
`baseline.mjs` — has a last-modified time earlier than the run's start, and the
working tree was clean throughout. This is the condition the aborted 2026-08-03
run failed.

## D1 — the primary prediction. Supported, with one large qualifier.

Per-tournament noise floor (see "the threshold that decides this" below):

| backend | source wins | control wins | unresolved | excluded | source share of resolved |
|---|---|---|---|---|---|
| `cn:doubao` | 25 | 1 | 32 | 17 | 25/26 — **96%** |
| `cn:glm` | 28 | 4 | 37 | 6 | 28/32 — **88%** |
| `cn:minimax` | 16 | 4 | 51 | 4 | 16/20 — **80%** |
| `cn:qwen` | 19 | 3 | 48 | 5 | 19/22 — **86%** |

**The effect appears in 4 of 4 strata.** D1 required at least three. This is
the first run in this project's history in which the historical wiring beats
its own scrambled control.

The direction is consistent below the level D1 scores at, which matters more
than the win counts because it does not depend on any threshold:

| backend | eligible pairs | mean Δ | median Δ | Δ>0 | Δ=0 | Δ<0 |
|---|---|---|---|---|---|---|
| `cn:doubao` | 58 | +1.35 | +1.7 | 43 | 7 | 8 |
| `cn:glm` | 69 | +1.27 | +1.7 | 53 | 7 | 9 |
| `cn:minimax` | 71 | +0.56 | +0.5 | 42 | 5 | 24 |
| `cn:qwen` | 70 | +0.93 | +0.9 | 50 | 7 | 13 |

And it is not carried by one regime or one scenario. Every cell of both
breakdowns is positive:

| regime | n | mean Δ | Δ>0 | | scenario | n | mean Δ | Δ>0 |
|---|---|---|---|---|---|---|---|---|
| `china/ming` | 56 | +1.49 | 47/56 | | plague | 89 | +1.41 | 71/89 |
| `china/tang` | 45 | +1.29 | 32/45 | | militarization | 92 | +0.94 | 64/92 |
| `global/athens` | 55 | +0.89 | 36/55 | | border city | 87 | +0.68 | 53/87 |
| `china/qin` | 56 | +0.84 | 40/56 | | | | | |
| `china/zhou` | 56 | +0.61 | 33/56 | | | | | |

### The threshold that decides this

D2 says a pair is unresolved unless its gap exceeds "that backend's own judge
position effect (`biasReport.positionEffect.maxAbsDelta`)". **That sentence
admits two readings and the registration did not disambiguate it.** The named
field exists per tournament, not per backend. Both are reported here, and the
choice was not made after seeing which was kinder:

| backend | pooled floor | source | control | unresolved |
|---|---|---|---|---|
| `cn:doubao` | 2.50 | 8 | 0 | 50 |
| `cn:glm` | 2.50 | 12 | 2 | 55 |
| `cn:minimax` | 4.167 | **0** | **1** | 70 |
| `cn:qwen` | 4.167 | 2 | 0 | 68 |

Under the stricter pooled reading — every pair in a stratum judged against the
worst position effect any of that stratum's fifteen tournaments produced —
**minimax's effect disappears entirely** (0 source, 1 control) and qwen's
survives on two resolved pairs. That is 3 of 4, which still clears D1's bar,
but "3 of 4 with one stratum at n=2" is a much weaker sentence than "4 of 4".

The pooled floors are driven by a handful of badly behaved cells: minimax and
qwen each had tournaments where the same judge moved a civ 4.167 points between
its forward and swapped passes. Applying one stratum's worst cell to all
fifteen is defensible and conservative; it is also close to unfalsifiable at a
4.167-point threshold on a 10-point scale. The per-tournament reading is the
primary result because it is the field the registration named.

## Verbosity, the confound that killed E1, is ruled out here

E1 found score tracking transcript length at ρ = +1.00 in one scenario. In E3
the source arms produce **1.4× to 2.5× more raw transcript** than their
controls, so the obvious reading is that this is E1's verbosity effect wearing
a new hat.

It is not, and the reason is measurable rather than argued:

| backend | raw source : control | judge read (source) | judge read (control) | source arms at cap | control arms at cap |
|---|---|---|---|---|---|
| `cn:doubao` | 1.40× | 6,000 | 5,956 | 58/58 | 59/60 |
| `cn:glm` | 2.52× | 6,000 | 6,000 | 70/70 | 74/74 |
| `cn:minimax` | 1.47× | 6,000 | 6,000 | 71/71 | 75/75 |
| `cn:qwen` | 1.80× | 6,000 | 5,981 | 71/71 | 71/74 |

Essentially every arm on both sides saturates the 6,000-character verbosity
budget, so **the length difference never reaches the judge**. Actual content
characters after actor-stratified selection differ by 1–8% (e.g. 4,154 vs
3,835 on doubao), not by 40–150%. Whatever produced the score gap, it was not
the amount of text in front of the judge.

## D3 — instrument compliance, and the one asymmetry worth naming

| backend | arms | enforcement failed | participation absent |
|---|---|---|---|
| `cn:doubao` | 150 | 32 (21%) | 30 (20%) |
| `cn:glm` | 150 | 6 (4%) | 2 (1%) |
| `cn:minimax` | 150 | 4 (3%) | 0 (0%) |
| `cn:qwen` | 150 | 5 (3%) | 1 (1%) |

Doubao fails the roster five to seven times as often as the other three. Its
excluded pairs (17) are the most of any stratum, which is also why its resolved
denominator is smallest.

Exclusion is close to symmetric between the two sides — doubao 17 source arms
vs 15 control arms, glm 5 vs 1, minimax 4 vs 0, qwen 4 vs 1. It leans slightly
toward excluding *source* arms, which if anything works against D1 rather than
manufacturing it. Compare E1's control run, where the failure was catastrophic
and undetected: 14 of 30 arms never delegated at all.

## D4 — the wiring is not adopted unless it is forced

Measured on source arms only; a scrambled control has no historical topology to
deviate from.

| backend | plans | parsed | comparable | mean declared-but-unplanned offices | mean undeclared-planned | plan matches topology exactly |
|---|---|---|---|---|---|---|
| `cn:doubao` | 75 | 60 | 60 | 1.80 | 0 | 8/60 — 13% |
| `cn:glm` | 75 | 72 | 72 | 2.11 | 0 | 10/72 — 14% |
| `cn:minimax` | 75 | 73 | 73 | 1.42 | 0 | 20/73 — 27% |
| `cn:qwen` | 75 | 67 | 67 | 0.84 | 0 | 38/67 — **57%** |

Two things are stable across every model. First, **no model ever invents an
office the topology does not declare** (undeclared-planned is 0 in all 300
plans). The failure is never improvisation. Second, **every model omits
offices the topology does declare** — between 0.84 and 2.11 of them per plan on
average — and only 13–57% of plans reproduce the declared roster.

Adoption is strongly model-dependent: qwen plans the full roster four times as
often as doubao. Under the registration's own reading, that bears on the
reusable-pattern claim independently of D1. A pattern that a model silently
prunes when asked to plan is not being reused; it is being overridden.

## What this run does and does not establish

**Does:**

- Under enforced delegation, the historical wiring outscores its seeded
  scrambled control, consistently, on four independent model families, five
  regimes and three scenarios. Mean Δ is positive in all twelve
  backend×scenario combinations and all twenty backend×regime combinations.
- The result is not the verbosity artifact that invalidated E1: both arms
  saturate the judge's budget and the judge reads the same volume from each.
- Models systematically under-adopt the declared roster when planning freely,
  and how badly varies by a factor of four across models.

**Does not:**

- **Show that the effect survives a conservative noise floor.** Under the
  stricter of D2's two readings, minimax's effect vanishes and qwen's rests on
  two pairs. The headline "4 of 4" belongs to the per-tournament reading only.
- **Separate topology from prose quality.** This is the largest surviving
  threat and the design does not address it. `baseline.mjs` holds `SOUL.md`,
  office ids, names and responsibilities constant and rewrites only the
  decision-flow prose and diagram — but a *rewired* decision flow is also a
  *machine-written* decision flow, and the judge may be rewarding the coherence
  of the original text rather than the structure it encodes. Nothing in E3
  distinguishes those. A control that rewires the topology while keeping the
  prose human-authored would; building one is the obvious next experiment.
- **Say anything about spontaneous behaviour.** Every arm ran with
  `--enforce-dispatch`. E1's control run, without enforcement, produced zero
  source wins on resolved pairs. The honest joint reading of E1 and E3 is
  narrow: **the wiring helps when it is imposed, and models mostly do not
  impose it on themselves** (D4). Whether historical topologies are *adopted*
  remains a separate, unanswered question.
- **Generalise past seed 42.** One seeded rewiring per regime, five regimes.
- **Compare backends.** Absolute scores across strata are not comparable by
  design; only the within-backend paired direction is.

## Defect found by running this

**The manifest dropped D4's dependent variable.** `planDiff` was computed in
`run-v5.mjs`, persisted to the per-match `meta.json`, assigned onto the
tournament result — and then omitted from the manifest's civ projection, which
lists nine other fields. The contract test asserted `civ.dispatchPlan` and
never `civ.planDiff`. So the artifact the analysis reads silently lacked the
one field the pre-registration names for D4, and the test suite stayed green.

D4 above is computed from the per-match `meta.json`, where the data is intact;
no result changed. Both the projection and the assertion are fixed, and the
assertion was revert-verified — removing the fix makes it fail.

This is the eighth instance of the same class in this project: a value computed
correctly, and a test that guards its neighbours.

## Status of the proposition

For the first time, **supported under a stated and narrow condition**: with
delegation enforced, historical wiring beats scrambled wiring across four model
families. That is a real result and it replicates, which is more than E1 or the
E1 control arm produced.

It is not yet evidence for README §1.2 as written. §1.2 claims historical
topologies are *reusable orchestration patterns*. E3 shows they are *effective
when enforced* and D4 shows they are *not spontaneously adopted*. And the prose
confound means the measured advantage may belong to the original documents
rather than to their structure. The next experiment is the prose-controlled
rewiring, not another replication of this one.
