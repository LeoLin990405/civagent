# E2 preregistration — voluntary adoption before equal roster enforcement

Registered 2026-07-31 before any E2 `--execute` invocation. This round builds
and tests the instrument only; it does not run a model experiment.

## Questions and the measurement boundary

E1-control found 14/30 arms with one actor and no office delegation. It could
not separate:

- **A — quality under an equal dispatch requirement:** when each arm is
  required to call the offices that are targets of incoming edges in its own
  declared topology, does historical wiring outperform its seeded rewiring?
- **B — voluntary adoption before that requirement:** before seeing the
  enforcement instruction, which offices does the coordinator say it would
  call, in what order, and for what responsibilities?

The pre-enforcement plan is B's dependent variable. Enforcement compliance is
an instrument check and A-eligibility condition; it is not B.

The current Claude Code architecture exposes coordinator→office dispatches,
not office→office calls. Therefore E2 does **not** claim that a passed
enforcement check proves `command`, `review`, `info`, or `veto` edges executed.
A is consequently titled “quality under an equal topology-derived roster
requirement,” not “causal effect of executed typed wiring.”

## Fixed cells

The five E1 source/control pairs are retained:

| Source | Seed-42 rewiring |
|---|---|
| `china/qin` | `_baseline/qin-random` |
| `china/tang` | `_baseline/tang-random` |
| `global/athens` | `_baseline/athens-random` |
| `china/zhou` | `_baseline/zhou-random` |
| `china/ming` | `_baseline/ming-random` |

All three E1 scenarios are retained:

- `plague-response-01` (E1: voluntary delegation in 10/10 arms);
- `border-city-autonomy-01` (6/10 arms never delegated);
- `regional-militarization-01` (8/10 arms never delegated).

Using only plague would improve compliance but restrict A to tasks already
inclined to delegate and erase the strongest scenario contrast needed for B.
Keeping all three makes enforcement failure more likely, but lets B distinguish
scenario-induced adoption from source/control differences. Results must be
stratified by scenario; pooling alone is not an answer.

Backend is fixed at `cn:doubao`. Every tournament uses `--anon-civs`,
order-swapped judging, `--no-skill`, and `--enforce-dispatch`. Source and
control arms run the exact same code against their own topology; there is no
branch on “historical” versus “control.”

## Fixed n

`n = 5` repeats per source/control × scenario cell:

- 3 scenarios × 5 repeats = 15 ten-arm tournament jobs;
- 5 pairs × 2 arms × 3 scenarios × 5 repeats = 150 arms.

E1 observed a judge position movement as large as 3.33 while most paired gaps
were 1–2. At n=1 there is no within-cell variance estimate. Five repeats give
four degrees of freedom for a pilot variance estimate and make failures
repeatable rather than anecdotal. This is **not** a power claim: if noise stays
near 3 points, n=5 can still be inconclusive. E2 is an instrument-validation
pilot; a later confirmatory n must be chosen from E2 variance without reusing
E2 as its confirmation set.

## Intervention and temporal order

For every arm:

1. The coordinator receives the task and office descriptions with tools
   disabled. A neutral prompt says zero, fewer, or more offices are valid and
   asks for one structured plan.
2. The plan event is written with `parsed_nonempty`, `parsed_empty`, or
   `parse_failed`. Parse failure is never converted to an empty plan.
3. The same coordinator session resumes.
4. Only now, in the enforced condition, the execution prompt requires at least
   one real subagent dispatch to every node with an incoming edge in that arm's
   own topology.
5. Compliance is checked once from execution-phase `[→ office]` tokens. There
   is no hidden retry. Failure is retained as `enforcement_failed`.

The plan event is stored for analysis but excluded from judge and skill
transcripts. Otherwise B's measurement text would contaminate A's output.

## Outcomes

### B: pre-enforcement adoption

Report, by scenario and source/control arm:

- plan state (`parsed_nonempty`, `parsed_empty`, `parse_failed`);
- planned office sequence and responsibilities;
- declared planned, declared omitted, undeclared, and duplicate office sets.

Do not compute an office “coverage rate” or composite deviation score. These
discrete node-set facts are supported. Directed edge alignment, edge kinds,
parallel-edge coverage, and execution are not supported by the plan format.
Because the controls preserve office IDs, node-set adoption alone may be
identical in meaning for source and control; E2 cannot treat it as adoption of
the rewired edge structure.

### A: quality under the roster requirement

Raw anonymized/order-swapped scores are reported for every arm (intention to
treat). The primary per-protocol paired comparison is eligible only if **both**
arms have `enforcement_passed` and observed office participation. A failed arm
is not discarded or rerun: the pair is marked ineligible and the failure stays
in the denominator of instrument compliance.

Within eligible pairs, report source-minus-control scores by scenario/repeat,
the judge's measured position effect, and resolved/unresolved status using the
same E1 rule. Do not describe an advantage as evidence that typed edges fired.

### Enforcement diagnostics

Report required, dispatched, and missing office sets; pass/fail; and the single
attempt. Compliance is neither a quality score nor B's outcome.

## Falsifiable predictions

- **B1:** scenario is the largest visible divider in pre-force nonempty-plan
  frequency: plague > border-city and militarization. If the three scenarios
  are similar, E1's scenario pattern does not replicate at the planning stage.
- **B2:** within each scenario, historical and rewired arms do not show a
  consistent advantage in planned node sets. A stable historical advantage
  would support easier voluntary roster adoption, though still not edge
  adoption.
- **B3 (project-unfriendly):** plan node-set comparisons cannot distinguish
  source from control because their node IDs are preserved. If so, the current
  B instrument is insufficient for the project's wiring-adoption claim.
- **A1:** among eligible resolved pairs, historical wiring wins a majority.
- **A2 (null/adverse):** if rewired arms win or tie as often, the historical
  wiring proposition is unsupported under this intervention.
- **A3 (adverse):** enforcement lowers quality or raises variance, showing that
  compelled delegation imposes a coordination cost.
- **Instrument failure:** if enforcement failures are frequent, A is not
  rescued by excluding them; E2 concludes that prompt-level roster enforcement
  is unreliable and reports the resulting loss of eligible pairs.

Thresholds and n are not changed after results are visible.

## Rubric ceiling

E2 keeps the E1 rubric so old and new results remain comparable. Scores
clustered around 7–9, so this may preserve a ceiling. Before a later
confirmatory experiment, calibrate a more discriminating rubric on a held-out
set and freeze it before scoring. E2 itself reports raw dimension scores,
position effects, ties, and unresolved pairs rather than silently changing the
scale.

## The plan question is itself an intervention

Registered before any E2 run, because it bounds what B can claim.

Asking the coordinator "which offices would you call" raises the salience of
delegation. The prompt says the answer is a measurement of unforced intent and
that choosing zero offices is valid, but the act of asking is a force. B
therefore measures **stated intent when asked**, not spontaneous behaviour.

Three consequences, all of which must be honoured when the results are read:

1. **E2's plan-stage adoption rate is not comparable to E1-control's 14/30
   single-actor arms.** That baseline was collected with no plan question. Any
   comparison across the two is confounded by the question itself.
2. **The source-versus-control contrast inside E2 is unaffected.** Both arms
   receive the identical plan prompt with their own office list, so the nudge is
   constant across the comparison B actually scores. B's paired claim survives;
   only its absolute level is inflated by an unknown amount.
3. **The gap between the two is itself reportable.** E1-control's rates are the
   no-question baseline for the same five regimes and three scenarios. If E2's
   plan-stage adoption is markedly higher, that difference is a lower bound on
   the observer effect and should be stated as such — not quietly treated as
   evidence that regimes adopt their topologies more often than E1 suggested.

Removing the confound entirely would require a no-plan control arm, which
doubles the cell count. That is deliberately **not** in E2's scope; it is
recorded here so the decision is visible rather than implicit.

## What E2 cannot answer

- whether any typed office→office edge executed;
- whether plan order is an edge path;
- whether one rewiring seed represents random graphs generally;
- whether a quality difference comes from direction, edge kind, prose
  instructions, or some interaction;
- whether the planning call changes later behavior merely by asking for a plan;
- whether the same-session flags behave identically in every CN wrapper until
  a separately authorized smoke run is performed;
- whether n=5 is powered for the observed effect;
- whether an improved rubric would reverse close rankings.

## Reproducible launcher

Default dry run (15 jobs / 150 arms, no model calls):

```bash
node scripts/e2-experiment.mjs
```

Smaller machine-readable dry run:

```bash
node scripts/e2-experiment.mjs --repeats 1 --json
```

Execution remains gated and was not run in this implementation round:

```bash
node scripts/e2-experiment.mjs \
  --execute \
  --estimated-afp-per-job <provider-telemetry-estimate> \
  --concurrency 1 \
  --batch-size 1 \
  --cooldown-ms <operator-choice>
```
