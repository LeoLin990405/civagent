# CivAgent Iteration Plan

> Updated: 2026-07-31
> Hard rule: Gemini is forbidden in every execution, judge and audit path.

## Current repository state

| Line | State | What is actually there |
|---|---|---|
| `main` | `bdcca25` | PRs #29 and #30 are merged: v6 hardening plus R5 modularization, frontend tests, skill stats and the 40-scenario library. |
| PR #31, `r6/integration → main` | open | Regime write API/editor and historical revision. This branch is separate from `r7/validity` and is not in the current R10/R11 working tree. |
| PR #32, `r7/validity → main` | open, GitHub checks green | R7 experimental controls/judge calibration, R8 graph/CI/persistence hardening, E1, full transcript capture and R9 office-level runtime reconstruction. |
| `r7/validity` | `1c94e12` + uncommitted R11 work | R10, five E1 random controls, and the 2026-07-30 E1-control results are committed through `1c94e12`. R11 measurement instruments are integrated in this working tree for review, without commit or push. |

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
| R10-2 causality | Design completed but not implemented. `caused_by_span_id` alone is insufficient, and partial handoff capture cannot make the whole graph comparable. | Design an explicit handoff event and a completeness/capability contract before coding. |
| R10-3 E1 control arm | Ran on 2026-07-30 with five seed-42 random controls, anonymized/order-swapped judging, and `cn:doubao`. C1 was not supported: historical wiring won 0 resolved pairs; one pair went to the control. The dominant uncontrolled variable was whether an arm delegated (13/30 did not). | n=1 per cell, one seed, and the rubric ceiling remain unresolved. |
| R10-4 office actor UI | History Explorer and Live Court display the office badge and retain regime context; legacy actors are unchanged. | Full CI and rollback evidence. |
| R10-5 API | No endpoint now. Existing events already support participation UI; the typed topology diff is still incomparable. | Revisit only after direct-edge events exist. |
| R10-6 docs | CHANGELOG and this plan describe branch/PR state and measurement limits. README intentionally untouched. | Final integration report. |

## R11 acceptance state

R11 builds instruments rather than selecting a winning topology.

| Item | Integrated behavior | Honest boundary |
|---|---|---|
| R11-1 participation state | `topologyParticipation` / `topology_participation` carries `participation_observed`, `not_observed`, or `unknown`, plus dispatch/turn counts and invoked office IDs. It appears in match metadata, tournament manifests, CLI output, and History Explorer. | A single dispatch proves participation only. Negative evidence requires the new capture-capability marker and a complete match. There is no continuous execution ratio. |
| R11-2 voluntary plan | A tools-disabled call records a structured plan before enforcement; execution resumes the same coordinator session. Parse failure is not an empty plan, and plan events are excluded from judge/skill inputs. | Provider-wrapper same-session behavior is contract-tested with a fake backend but was not smoke-tested against a real CN provider in this round. |
| R11-3 roster enforcement | Default-off `--enforce-dispatch` derives required offices only from each arm's incoming-edge targets, appends the requirement after the plan, checks real execution dispatch tokens once, and records pass/failure without retry. | This equalizes a topology-derived roster, not typed edge execution. Failed arms remain in raw results and make the pair ineligible for A's per-protocol view. |
| R11-4 plan comparison | Reports planned order as description, node membership/omission, undeclared offices, and duplicates. | No coverage ratio, composite score, directed-edge match, edge-kind match, multiedge coverage, or execution claim. |
| R11-5 E2 preregistration | Three E1 scenarios × five repeats × ten arms = 150 arms; same source/control pairs, anonymization, no-skill mode, and explicit engine enforcement. Launcher defaults to dry-run. | Pilot variance estimation, not a powered confirmation. No E2 model experiment ran. |
| R11-6 frontend | History Explorer renders observed / not observed / data-insufficient badges from the exact backend field. | Legacy and malformed data become unknown, never a false negative and never “topology invalid.” |

### What R11 still cannot claim

- Typed office→office edges are still not directly observable; coordinator
  dispatch order is not an edge path.
- A passed enforcement check is not evidence that `command`, `review`, `info`,
  or `veto` wiring fired.
- Since the control keeps the same office IDs, B's node-set facts may not
  distinguish adoption of historical from rewired edge structure.
- E2 n=5 is not a power claim, and the production rubric ceiling remains.

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

### 2. E1 control arm result and next use

The E1 control arm ran on 2026-07-30
(`docs/experiments/E1-control-results.md`). It did not support C1 and revealed
scenario-driven non-delegation as the main uncontrolled variable. R11 therefore
records a pre-force plan and optionally enforces each arm's own topology-derived
dispatch roster before any larger rerun. Future executions still require an
operator AFP estimate; CivAgent does not measure provider usage.

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
