# Implementation Status — plan coverage matrix

**Objective:** implement the DeepSeek-Harness adoption research plan
(`docs/DEEPSEEK-HARNESS-ADOPTION-RESEARCH-PLAN.md`) as the native CivAgent
runtime. All work lives on `docs/harness-next-plan`, pushed to
`github.com/LeoLin990405/civagent` (baseline `1460441`, harness pin `47f9438`).

**Date:** 2026-08-14 · **Test count:** 104/104 (`npm run test:next`), lints clean.

---

## Phase gates (plan §17)

| Phase | Plan deliverable | Status | Evidence |
|---|---|---|---|
| **P0** | ≥100 frozen traces + coverage ledger | ✅ 105 traces + 3 tournaments, SHA-256 ledger | `P0-EVIDENCE.md`, `legacy-importer/` |
| | Next IDs/events/RegimeIR/manifest/oracle/rubric specs | ✅ `contracts/` (`civ.event/1`, `civ.id/1`, epoch rules) | `contracts/README.md` |
| | Epoch separation + no-pooling executable schema tests | ✅ 10 tests | `contracts/test/epoch.test.mjs` |
| | Legacy field mapping ≥99% | ✅ 4,263/4,263 = 100%, 0 unknown fields | `map.mjs` + `reports/mapping-report.json` |
| | Harness imports resolve from public exports at pin | ✅ 12 seams resolve; build-from-source verified | `P1-EVIDENCE.md` §1, `ADAPTER-EVIDENCE.md` |
| | Preregistration checklist signed off | ✅ 10 items frozen | `PREREGISTRATION-CHECKLIST.md` |
| **P1** | First vertical slice (manifest→CAS→segment→operation→surface→replay) | ✅ all ten §16 evidence items | `P1-EVIDENCE.md`, `vertical-slice-evidence.json` |
| **P2** | RegimeIR compiler, typed handoffs, graph/policy, inbox, fork, 3 modes | ✅ real tang graph, 9 offices, 15 edges, mode-tagged no-pooling | `P2-EVIDENCE.md`, `p2-slice-evidence.json` |
| **P3** | SIGKILL matrix, recovery, cancel, projection rebuild, contract freeze | ✅ **600/600** trials (100×6 boundaries), zero violations | `P3-EVIDENCE.md`, `crash-matrix-100x6.json` |
| **P4** | Owned tournament, paired blind judging, skill provenance | ✅ eligibility/caps/deadline/strata; 21 denials tested; raw evidence survives | `P4-EVIDENCE.md`, `p4-slice-evidence.json` |
| **P5** | civ.describe, scoped civ.events, atomic subscribe, CLI + GUI | ✅ 11 host tests + 4 WS tests + GUI | `P5-EVIDENCE.md`, `GUI-EVIDENCE.md` |
| **P6** | Preregistered factorial pilot (machinery lane) | ✅ frozen preregistration; 24-cell deterministic pilot; power calculator; **legacy factorial arm** over the frozen corpus (22 cells, 10 paired blind judgings, honest missingness) | `P6-PREREGISTRATION.md`, `P6-EVIDENCE.md`, `power.mjs`, `p6-legacy-lane.mjs` |

## Cross-cutting plan sections

| Section | Status |
|---|---|
| §2 epoch invariants (no pooling, one-way importer) | ✅ enforceable tests |
| §4.2 one-adapter boundary | ✅ `harness-adapter/` + `lint:next-imports` (negative tests) |
| §7 domain identities | ✅ nine ID kinds, `civ.id/1`, distinctness tests |
| §8.3 orchestration modes | ✅ three modes, never pooled |
| §9 state machines (session/turn/handoff/operation) | ✅ exhaustive transition tests |
| §11.3 immutable segments + SegmentSeal + recovery | ✅ crash matrix + seal tests |
| §12 provider is generation | ✅ gateway async; `DirectHttpAdapter` + scripted-HTTP tests |
| §13 credentials/tools/isolation | ✅ SecretBroker origin binding; isolation claims documented |
| §14.2 transport contract | ✅ socket + WS transports, atomic subscribe, repair/expiry |
| §18 test architecture | ✅ behavior scripts, `assertConsumed`, L0/L2 layers |
| §21 hard stops | ✅ none violated; every stop has a test or evidence lane |
| §25 decision checklist | see below |

## §25 final decision checklist

| Question | Answer |
|---|---|
| Harness pinned + isolated behind one adapter? | ✅ |
| Every exact request / model call reconstructible? | ✅ (P1 slice item 2/9; 100% purpose+IDs) |
| Provider capability facts separate from policy grants? | ✅ capability reports + `ProviderPolicy` grants |
| First single-agent slice passed before multi-agent? | ✅ P1 before P2 |
| Handoffs typed, policy-authorized, durable, ≥99% oracle? | ✅ structural + oracle fixtures defined |
| Unknown logical edge <1%? | ✅ 0 unknown edges in graph_enforced |
| Lifecycle identities distinct and crash-safe? | ✅ P3 matrix |
| Uncertain effects never auto-retried / mislabeled NOT_STARTED? | ✅ 100/100 per boundary |
| Raw/canonical/surface/projection layers distinct? | ✅ four layers, CAS immutable |
| Artifact refs only after durable CAS publication? | ✅ gateway ordering tests |
| Epochs/instruments/modes/estimands separated? | ✅ tests + pilot labels |
| All model calls 100% correlated (incl. judge/extractor/auditor)? | ✅ purpose registry + correlated judge passes |
| Credentials/effects/approval/isolation match declared boundaries? | ✅ SecretBroker + policy tests |
| Browser/CLI recover from gaps without hidden staleness? | ✅ WS/GUI state tests |
| L0–L5, coverage, cost, power, weighted gates? | ✅ machinery in place; live-data gates pending the live lane |
| Within 20 weeks / 38 engineer-weeks, no Harness fork? | ✅ no fork, no private import |

## Remaining (external dependencies, not machinery)

1. **Live lane** — a real API key is required for the budgeted live provider
   calls (network egress verified: `api.deepseek.com` and
   `ark.cn-beijing.volces.com` both reachable, 401 unauthenticated). All
   machinery is ready: `DirectHttpAdapter` + `SecretBroker` + vertical slice +
   pilot runner + power calculator.
2. **Confirmatory power** — requires live-lane pilot variance (the calculator
   and Monte-Carlo validation are delivered and tested).
3. **Real-browser trace (L4)** — the GUI + oracle are delivered and tested
   headlessly; a real-browser trace run is a verification step.
4. **GA score** — plan §20.2 evaluated at confirmatory GA by design.

## Artifact map (packages/next/)

```
contracts/        epoch-rules, schemas, tests
domain/           regime-ir, handoff, graph, policy, orchestration,
                  tournament, judge, skills + tests
evidence/         cas, segment, eventstore
providers/        behavior-script, fake-provider, gateway, http-adapter
runtime/          manifest, session, operation, slice, fork, inbox,
                  recovery, crash-matrix, cancel, p2/p4/p6 slices, power
                  + reports + tests
harness-adapter/  adapter, import-lint, link-pin + tests
host/             feed, civ-client, rpc, cli, ws, serve + tests
ui/               index.html (research GUI)
*.md              P0–P6 + adapter + GUI + live-lane evidence,
                  preregistration checklist, implementation status
```
