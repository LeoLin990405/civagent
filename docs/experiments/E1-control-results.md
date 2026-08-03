# E1 control arm — results

Run 2026-07-30, 07:27–08:19 CST. Pre-registration:
[E1-control-arm.md](./E1-control-arm.md), predictions committed at `495fadd`
before `--execute` was run once.

Three tournaments, ten civs each (five source/control pairs), `cn:doubao` for
every arm, `--no-skill` everywhere, anonymized and order-swapped judging.

| Scenario | Tournament id |
|---|---|
| `plague-response-01` | `e1c-plague-response-01-r01` |
| `regional-militarization-01` | `e1c-regional-militarization-01-r01` |
| `border-city-autonomy-01` | `e1c-border-city-autonomy-01-r01` |

The AFP figure passed to the orchestrator (2500/job) was an operator estimate,
not telemetry. It gated batching only; it is not a measurement of anything.

## Result against the pre-registered rules

**C1 is not supported.**

| | count |
|---|---|
| Historical wiring wins | **0** |
| Random rewiring wins | **1** |
| Unresolved (gap ≤ the judge's own position effect, C2) | 5 |
| Excluded (C3, see below) | 9 |

Every apparent source win in the raw table came from a pair in which at least
one arm **never delegated to any office**. Once those are excluded, the
historical wiring does not win a single resolved pair.

### Full table

`noise` is the larger of the two arms' own forward-vs-swapped movement, from the
manifest `biasReport.positionEffect`. `actors` is how many distinct speakers the
transcript contained.

| Scenario | Pair | Source | Control | Δ | noise | actors | Verdict |
|---|---|---|---|---|---|---|---|
| border-city | qin | 8.3 | 8.8 | −0.5 | 3.33 | 5 v 2 | unresolved |
| border-city | tang | 8.8 | 7.5 | +1.3 | 0.83 | 1 v 1 | **excluded** |
| border-city | athens | 9.2 | 8.3 | +0.9 | 1.67 | 5 v 1 | **excluded** |
| border-city | zhou | 7.5 | 5.4 | +2.1 | 0.83 | 1 v 3 | **excluded** |
| border-city | ming | 7.9 | 8.3 | −0.4 | 0.83 | 1 v 1 | **excluded** |
| plague | qin | 5.8 | 5.8 | 0.0 | 1.67 | 7 v 7 | unresolved |
| plague | tang | 8.3 | 8.3 | 0.0 | 0.00 | 5 v 10 | unresolved |
| plague | athens | 6.7 | 7.5 | −0.8 | 1.67 | 4 v 7 | unresolved |
| plague | zhou | 9.6 | 8.8 | +0.8 | 0.83 | 6 v 5 | unresolved |
| plague | ming | 4.6 | 7.9 | **−3.3** | 0.83 | 8 v 9 | **control wins** |
| militarization | qin | 7.9 | 5.8 | +2.1 | 1.67 | 1 v 1 | **excluded** |
| militarization | tang | 8.3 | 9.2 | −0.9 | 1.67 | 1 v 3 | **excluded** |
| militarization | athens | 6.7 | 5.4 | +1.3 | 0.83 | 8 v 1 | **excluded** |
| militarization | zhou | 7.1 | 5.8 | +1.3 | 0.83 | 1 v 1 | **excluded** |
| militarization | ming | 7.9 | 6.7 | +1.2 | 0.83 | 1 v 1 | **excluded** |

## The finding that outranks the scoreboard

**In 14 of 30 arms the regime never delegated to a single office.** The
coordinator answered the task itself, so no topology — historical or scrambled —
was exercised at all. This is not a capture problem: C3's raw-log fallback
count is 0/30 and every arm used actor-stratified selection. The offices simply
were not invoked.

Delegation is strongly scenario-dependent, and that is the loudest signal in the
whole dataset:

| Scenario | arms that never delegated |
|---|---|
| `plague-response-01` | **0 / 10** |
| `border-city-autonomy-01` | 6 / 10 |
| `regional-militarization-01` | **8 / 10** |

The plague scenario reliably induced multi-office deliberation; the other two
usually did not. Whether a regime runs its own constitution therefore depends
on the task text, not on the constitution.

This reframes the exclusion rule. C3 was written to exclude arms whose
transcript degraded to a raw-log tail. The arms excluded here degraded in a
different and worse way: they were captured perfectly and contained no
governance process to capture.

Two supporting observations:

- Single-actor arms averaged **7.37**, multi-actor arms **7.56** (n = 14 / 16).
  Not delegating costs almost nothing under this rubric — which is a plausible
  reason the models often don't bother.
- Transcript length ranged from **2,321 to 441,914 characters, a 190× spread**,
  median 16,209. Arms of the same regime on different scenarios differ by two
  orders of magnitude in how much work they do.

## What this run does and does not establish

**Does:**

- The historical wiring did not beat its seeded random rewiring on any resolved
  pair in this run. One pair went to the control by a clear margin (ming under
  plague, −3.3 against a noise floor of 0.83).
- Most pairs are inside the judge's own noise even when both arms delegated.
- The dominant uncontrolled variable is not topology but **whether the regime
  invoked its offices at all**, and that is driven by the scenario.

**Does not:**

- Show that topology is irrelevant. Nine of fifteen pairs never tested topology,
  and the remaining five are mostly unresolved at n = 1 per cell.
- Generalise beyond one seeded rewiring per regime (seed 42) and these five
  regimes.
- Say anything about a design where delegation is enforced rather than optional.

## What has to change before this is run again

1. **Make delegation a measured precondition, not an accident.** An arm where
   the coordinator never dispatched has not exercised a topology and should be
   detected and reported at run time, not discovered in post-hoc analysis. The
   dispatch count is already in `runtime-graph`'s `observed` block.
2. **Decide whether delegation should be enforced.** If a regime is allowed to
   collapse to one agent, the experiment is measuring "does this model feel like
   delegating today". If it is forced, the experiment measures topology but no
   longer measures whether the topology is *adopted* — both are legitimate
   questions and they need separate designs.
3. **Repeat cells.** n = 1 with a noise floor that reaches 3.33 on one arm
   cannot resolve gaps of 1–2 points.
4. **Revisit the rubric ceiling** (carried over from E1): scores cluster in
   7–9 and the 4-point scale cannot separate competent answers.

## Status of the proposition

Still unresolved, and now for a sharper reason. The earlier obstacle was that
the harness discarded the deliberation. That is fixed. The obstacle now is that
**the regimes frequently do not deliberate at all**, and nothing in the design
noticed until the pairs were tallied. No claim that governance topology affects
multi-agent performance is supported by this run, and no claim that it does not
is supported either.
