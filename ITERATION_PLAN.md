# CivAgent Iteration Plan

> Updated: 2026-07-31
> Hard rule: Gemini is forbidden in every execution, judge and audit path.

## Current repository state

| Line | State | What is actually there |
|---|---|---|
| `main` | `bdcca25` | PRs #29 and #30 are merged: v6 hardening plus R5 modularization, frontend tests, skill stats and the 40-scenario library. |
| PR #31, `r6/integration → main` | open | Regime write API/editor and historical revision. This branch is separate from `r7/validity` and is not in the current R10 working tree. |
| PR #32, `r7/validity → main` | open, GitHub checks green | R7 experimental controls/judge calibration, R8 graph/CI/persistence hardening, E1, full transcript capture and R9 office-level runtime reconstruction. |
| R10 working tree | uncommitted, not pushed | Fair judge transcript sampling, five E1 random controls, dry-run experiment launcher, office-aware frontend and documentation. |

PR #31 and PR #32 diverge from `main`; neither should be described as merged.
Their integration order and conflict resolution remain a maintainer decision.

## Completed on `r7/validity` before R10

### R7 — test whether a ranking is a measurement

- Added solo, flat-N and seeded random-N topology controls.
- Preserved persona and office identities in controls so the intervention is
  wiring rather than "historical agent versus blank agent".
- Added judge provider, position, same-family and verbosity telemetry.
- Repaired episodic retrieval and stamped downstream tournament outcomes onto
  newly learned skills.

### R8 — harden graph and persistence contracts

- Typed governance-graph nodes and extended topology validation/metrics.
- Added runtime graph reconstruction and declared/runtime diff CLI.
- Made history writes idempotent without deleting legitimate repeated events.
- Added Node 20/22 backend CI, frontend CI, regime validation and smoke.
- Closed PR #32 review findings with regression tests.

### E1 and R9 — follow the negative result

- Pre-registered and ran the original E1 pilot.
- Reported that transcript capture, transcript length and judge noise prevented
  a topology claim; did not reinterpret invalid S3 rankings.
- Captured full Claude Code stream-JSON office deliberation.
- Restricted constitutional mechanisms to bracketed protocol markers.
- Reconstructed office participation and coordinator dispatches in
  `runtime-graph`.
- Kept typed office-to-office `unexercised_ratio` at `null`: coordinator fan-out
  is not evidence of a declared directed edge.

## R10 acceptance state

| Item | Decision / implementation | Remaining gate |
|---|---|---|
| R10-1 transcript sampling | Actor-stratified first/middle/last turns, explicit dispatches and final turn under one 6,000-character cap; manifest records the cut. | Full CI and rollback evidence. |
| R10-2 causality | Design rejected for implementation this round. `caused_by_span_id` alone is insufficient, and partial handoff capture cannot make the whole graph comparable. | Design an explicit handoff event and a completeness/capability contract before coding. |
| R10-3 E1 control arm | Five seed-42 random controls plus a dry-run launcher. Execution requires explicit model-cost opt-in and an operator AFP estimate. Production rubric unchanged; shadow calibration proposed. | Leo chooses repeats, AFP estimate and run time. No experiment has run. |
| R10-4 office actor UI | History Explorer and Live Court display the office badge and retain regime context; legacy actors are unchanged. | Full CI and rollback evidence. |
| R10-5 API | No endpoint now. Existing events already support participation UI; the typed topology diff is still incomparable. | Revisit only after direct-edge events exist. |
| R10-6 docs | CHANGELOG and this plan describe branch/PR state and measurement limits. README intentionally untouched. | Final integration report. |

## Next measurement work

### 1. Define an observable logical handoff

A future event must distinguish the physical coordinator call from the logical
governance relation. A viable contract needs, at minimum:

- `source_office` and `target_office`;
- `edge_kind` separate from the event envelope's `kind`;
- `artifact_id` or an equivalent immutable payload identity;
- causal linkage to the source production span;
- outcome/status for review or veto;
- an explicit capture-capability declaration that says which edge kinds and
  time range were completely observed.

One observed handoff must not make absent edges count as unexercised. Numeric
coverage is legal only inside a declared complete observation scope. Old and
partial streams remain incomparable.

### 2. Run the E1 control arm only after operator choices

Use `scripts/e1-control-experiment.mjs` first in its default dry-run mode.
Before `--execute`, freeze:

- repeat count;
- the provider-derived AFP estimate per tournament;
- concurrency, batch size and cooldown;
- analysis of paired source-minus-control outcomes;
- treatment of cells whose score gap is within judge movement.

The launcher limits an operator-supplied AFP estimate. CivAgent does not measure
provider AFP, so provider telemetry remains the source of truth.

### 3. Calibrate, do not silently replace, the rubric

Keep the current rubric as the confirmatory E1 series. Test more granular
anchors and forced pairwise judgments only as a separately versioned shadow
instrument on the same transcripts. Compare saturation, ties, order
sensitivity and repeat agreement under criteria registered before viewing
shadow scores. Never numerically convert or splice the old and new series.

### 4. Integrate open branches deliberately

Resolve PR #31/#32 ancestry and conflicts before either is called mainline.
After R10 review, commit and push only with maintainer approval, then rerun the
GitHub matrix. This working session intentionally leaves all changes
uncommitted and unpushed.
