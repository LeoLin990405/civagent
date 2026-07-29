# CivAgent Iteration Plan (Tripartite Collaboration)

> Updated: 2026-07-29 · Current line: PR #29 (`refactor/backend-arg-contract` → `main`)
> Division of labor: **Backend / merges / fixes = Claude Code** · **Frontend = Antigravity** · **Review = Codex** · **Content / long reasoning = Trae (MiMo)**
> Prohibition rule: invoking Gemini is strictly forbidden in any scenario (including judge, sediment, and agent backend).

---

## Current Status (2026-07-29)

| Area | State |
|---|---|
| **Mainline** | main carries P1–P6 (#19–#28): topology graphs, BT stats pipeline, skill supply-chain gate, ablation variants, hill-climbing loop, T3 deterministic scoring, anchored blind-judge rubric. |
| **PR #29 (open)** | The v6 hardening line, fully reconciled with main: constitutional mechanism engine, Express API server (read + write), history-db episodic memory, 14-regime historical audit, English-only engineering surface, CLI injection fix. CI green (252 backend tests, 57 regimes validated, frontend tsc/lint/build clean). |
| **Write API** | `POST /api/tournaments` lands in PR #29 — the frontend can finally launch real tournaments. |
| **R2 capabilities** | Revived on the v6 architecture in PR #29: multi-provider judging (`--judges N`), full civ anonymization (`--anon-civs`), skill dedup gate + stats, match replay with lineage, 10-scenario prompt bank at `GET /api/scenarios`. The old `feat/r2-*` branches are historical reference only — do not merge them. |
| **Frontend** | v6 glassmorphism shell (Sidebar: overview / regimes / analytics / memory / veto / live / rankings). Launcher + skill library still missing; 5 orphan components pending cleanup. |

### Superseded documents

- `tasks/TASK-r4-*.md` and `tasks/REVIEW-r4-codex.md` are historical (note: the
  R4 Antigravity task cites port 4242 — the server listens on **3001**).
- All R4 goals are either landed in PR #29 or rolled into the R5 tasks below.

---

## Round 5 — "Merge · Launch UI · Content Expansion"

**Overall goal**: PR #29 reviewed and merged; the UI can launch and watch a
real tournament end-to-end; the scenario library reaches 40 entries.

### Execution order (dependency chain)

```
① Codex reviews PR #29 (tasks/TASK-r5-codex.md) → tasks/REVIEW-r5-codex.md
② Claude Code fixes any P0/P1 findings directly (no re-throw), merge to main
        ↓ write API on main
③ Antigravity: TournamentLauncher + SkillLibrary + orphan cleanup
   (tasks/TASK-r5-antigravity.md)                                  ─┐ parallel
④ Trae (MiMo): scenarios 10 → 40 (tasks/TASK-r5-trae.md)           ─┘
⑤ Claude Code integrates, final e2e acceptance
```

### Per-party tasks

Detailed prompts live in `tasks/TASK-r5-<party>.md`. Summary:

- **Codex** — adversarial review of PR #29; risk list is pre-seeded in the
  task file (judge pass-pooling weights, anonymization leak surface, write-API
  validators, replay lineage guard, dedup-gate ordering vs injection scan,
  tang topology semantics).
- **Claude Code** — apply review fixes, merge PR #29, then (backend backlog):
  `GET /api/skills/:region/:id/stats` endpoint if the frontend requests it,
  route tests for matches/history, wiring `judgesN`/`anonCivs` defaults into
  config if usage shows they should be on.
- **Antigravity** — `TournamentLauncher.tsx`, `SkillLibrary.tsx`, orphan
  component cleanup. Depends on ② (write API on main).
- **Trae** — 30 new governance scenarios (10 Chinese-regime-inspired + 20
  global), format rules in the task file.

---

## Technical constraints (all rounds)

| Rule | Description |
|---|---|
| No Gemini | Any scenario, any provider chain (enforced structurally in `judge.mjs`). |
| Git workflow | `git fetch` + rebase/merge before push; watch CI to green after every push. |
| Test threshold | `npm run ci` green before merging; new modules ship with tests. |
| Path safety | All user-input path segments go through `safeResolve`; ids are whitelist-validated. |
| Frontend typing | TypeScript strict, no `any` in new code; frontend lint errors are blocking. |
| Async write API | POST answers with the id immediately; the run is a detached background process. |
| Review order | Merging requires a Codex APPROVE; Claude Code patches findings directly (no bounce-back to the original implementer). |

---

## Milestones

| Round | Backend | Frontend | Content | Completion marker |
|---|---|---|---|---|
| **R4** ✅ | Express API server (read) + engine hardening | v6 shell with real data | — | Landed across main P1–P6 + PR #29 |
| **R5** ← current | PR #29 merged + write API live | Launcher + Skill Library | 40 scenarios | UI can run a real tournament end-to-end |
| **R6** | Regime-editing API + historical-fact review loop | Online regime editing + skill management | Historical-fact revision of the top 20 regimes | Full management console |

---

_Single source of truth for the tripartite collaboration. Each party reads this
file before starting and leaves its review conclusion or output path in
`tasks/` upon completion._
