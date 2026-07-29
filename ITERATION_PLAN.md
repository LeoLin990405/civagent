# CivAgent Iteration Plan (Tripartite Collaboration)

> Updated: 2026-07-30 · Current line: PR #30 (`refactor/r5-modularization` → `refactor/backend-arg-contract`), stacked on PR #29 (`refactor/backend-arg-contract` → `main`)
> Division of labor: **Backend / merges / fixes = Claude Code** · **Frontend = Antigravity** · **Review = Codex** · **Content / long reasoning = Trae (MiMo)**
> Prohibition rule: invoking Gemini is strictly forbidden in any scenario (including judge, sediment, and agent backend).

---

## Current Status (2026-07-30)

| Area | State |
|---|---|
| **Mainline** | Unchanged since the last update: main carries P1–P6 (#19–#28): topology graphs, BT stats pipeline, skill supply-chain gate, ablation variants, hill-climbing loop, T3 deterministic scoring, anchored blind-judge rubric. No R5 work has merged to main yet — it all lives on the two open PRs below. |
| **PR #29 (open)** | The v6 hardening line: constitutional mechanism engine, Express API server (read + write), history-db episodic memory, 14-regime historical audit, English-only engineering surface. Codex review concluded REQUEST_CHANGES with 3 P1 findings (blind-judge role-name leak, write-API unknown backends, replay lineage path escape); all three fixed on the branch (`1080428`) with regression tests. CI green per integration layer; awaiting Codex re-review, then merge. |
| **PR #30 (open, stacked on #29)** | R5 Batch 1 + Batch 2 (see below), plus the PR #30 review P1 (regime cache staleness) fixed in `9426a8c`. Local gate green at `42889fe`: **287 backend tests**, `lint:backend` clean, 57 regimes validated. CI green per integration layer; awaiting Codex re-review. |
| **R5 Batch 3 (in progress)** | Frontend test infrastructure (branch `r5b3/fe3`) and episodic-memory-layer test coverage (branch `r5b3/hist3`) are being built by parallel workers. Nothing from Batch 3 has landed on `refactor/r5-modularization` yet. |

### What landed since the last plan update (`b70e4ee..42889fe`)

**Batch 1 — engineering refactor (PR #30):**
- Server: route files rewritten as factories with injectable deps, unified error/status helpers in `server/http.mjs`, shared cached regime catalog service in `server/services/regimes.mjs`; hermetic route tests added (`test/routes-regimes.test.mjs`, `test/routes-matches.test.mjs`, `test/routes-history.test.mjs`).
- Engine: `engine/v5/tournament.mjs` cut 710 → 462 lines; blind-judge rubric extracted to `engine/v5/judge-rubric.mjs`, T3 deterministic grading to `engine/v5/deterministic-grading.mjs` (symbols re-exported — export surface unchanged).
- Frontend: four orphan components retired (`CodexBrowser`, `JudgeLeaderboard`, `RegimeBrowser`, `TerminalPanel`, −1226 lines); match history revived as the `MatchArchive.tsx` tab.
- CLI: shared helpers extracted to `bin/lib/common.sh`; `civagent list` spawns one `python3` per regime instead of four (228 → 57 processes, ~4.1s → ~1.2s).

**Batch 2 — feature expansion:**
- `GET /api/skills/:region/:id/stats` (`server/routes/skills.mjs` + `server/services/skills.mjs`, tests in `test/routes-skills.test.mjs`).
- Governance scenario library expanded 10 → 40 (`engine/prompts/governance-scenarios.json`).
- Frontend Tournament Launcher + Skill Library tabs (`TournamentLauncher.tsx`, `SkillLibrary.tsx`).

**Codex review follow-up:** the 3 P1s on PR #29 and the 1 P1 on PR #30 are fixed with regression tests (`test/judge-anon-multi.test.mjs`, `test/replay.test.mjs`, `test/tournaments-write-api.test.mjs` extensions, `test/services-regimes-cache.test.mjs`). Backend suite 252 → 287. The two P2 items from `tasks/REVIEW-r5-codex.md` (scan-before-dedup telemetry, summary-mode cold-cache I/O) are deferred to a later round.

### Superseded documents

- `tasks/TASK-r4-*.md` and `tasks/REVIEW-r4-codex.md` are historical (note: the
  R4 Antigravity task cites port 4242 — the server listens on **3001**).
- `tasks/TASK-r5-*.md` are now historical too — all three are marked DONE; their
  review output lives in `tasks/REVIEW-r5-codex.md`. Active work is tracked in
  `tasks/TASK-r6-*.md`.

---

## Round 5 — final status

**Overall goal (achieved on the integration branch, merges pending)**: PR #29
reviewed; the UI can launch and watch a real tournament end-to-end; the
scenario library reached 40 entries.

| Task | File | Outcome |
|---|---|---|
| ① Codex review of PR #29 / #30 | `tasks/TASK-r5-codex.md` → `tasks/REVIEW-r5-codex.md` | ✅ Done. REQUEST_CHANGES: 3 P1s (#29) + 1 P1 (#30) + 2 deferred P2s. |
| ② Fix findings, keep branches green | — | ✅ Done by Claude Code directly (`1080428`, `9426a8c`) with regression tests (252 → 287). |
| ③ Launcher + SkillLibrary + orphan cleanup | `tasks/TASK-r5-antigravity.md` | ✅ Landed (`e1b2175`, `4e99a40`). |
| ④ Scenarios 10 → 40 | `tasks/TASK-r5-trae.md` | ✅ Landed (`adbccfa`); file verified to contain exactly 40 entries. |
| ⑤ Integration / merge | — | ⏳ Open: both PRs await Codex re-review, then merge to main (owned by the integration layer). |

---

## Round 6 — "Online Regime Editing · Skill Management · Fact-Check Loop"

**Overall goal**: regimes become editable through the UI with server-side
mechanical validation; staged skills can be approved/rejected from the UI; the
top 20 regimes pass a historical-fact revision pass. Completion marker: a full
management console — edit → validate → review → ship, all from the UI.

### Capabilities R6 builds on (already in the tree)

- **Write-API blueprint**: `POST /api/tournaments` — validate → `202 {id}` → detached background run, logs in `~/.civagent/server-logs/` (`server/routes/tournaments.mjs`).
- **Mechanical validators**: `test/regime-validator.mjs` (behind `npm run validate:regimes`), `parseIdentityTable` in `engine/regime-to-cc.mjs` (AGENTS.md rule 2: the IDENTITY.md role table is the source of truth — prose rewrites parse to 0 agents), `agentCount` sync invariant (rule 3), `engine/topology/validate.mjs` (schema + IDENTITY cross-check).
- **Skill pipeline**: per-regime `skills/staging/` dirs, `civagent skills pending|approve` (CLI-only today), stats service `server/services/skills.mjs`, injection scanning in `engine/v5/skill-sediment.mjs`.
- **Judge provider chain** (structurally Gemini-free): `engine/v5/judge.mjs` — reusable as the historical-fact reviewer.

### Per-party tasks (details in `tasks/TASK-r6-<party>.md`)

**R6-1 — Claude Code: regime-editing write API**
- Scope: `PUT /api/regimes/:region/:id` updating `metadata.json`, `IDENTITY.md`, `SOUL.md` under `regimes/<region>/<id>/`. Pre-commit validation chain: regime-id whitelist (same shape as `bin/lib/common.sh::validate_regime`), `safeResolve`-style path construction (`server/utils.mjs`), `parseIdentityTable` must yield ≥ 1 agent, `agentCount` auto-resynced to the compiled count, `engine/topology/validate.mjs` must pass when `topology.json` exists. Writes via temp file + atomic rename.
- Out of scope: the editor UI (R6-3), judge-backed fact checks (R6-2), regime creation/deletion (deliberately deferred — edits only).
- Acceptance: `npm run ci` green; new hermetic `test/routes-regimes-write.test.mjs` (temp regimes root, no writes to the real tree); `npm run validate:regimes` green after an edit round-trip.

**R6-2 — Claude Code: historical-fact review loop**
- Scope: `POST /api/regimes/:region/:id/review`. Synchronous part: the R6-1 mechanical chain, returning structured findings. Optional judge-backed part: a fact-check pass over `metadata.json` + `SOUL.md` historical claims via `engine/v5/judge.mjs` (codex → opencode → cc-glm, never Gemini), async tournament-style (`202` + result file) since judge calls are slow.
- Acceptance: tests cover mechanical pass/fail and a fake-judge async round-trip; `npm run ci` green.

**R6-3 — Antigravity: online regime editor**
- Scope: new "Editor" tab — metadata form, an IDENTITY.md agent-table editor that emits exactly the markdown table format `parseIdentityTable` accepts (never freeform prose), a SOUL.md textarea; save calls the R6-1 API; server validation errors rendered per field; post-save preview of compiled agents via the existing regime endpoint.
- Depends on: R6-1 on the integration branch.
- Acceptance: `npm run build:frontend` passes and `npm run lint:frontend` has 0 errors; edit round-trip demonstrated against the dev server; no new `any`.

**R6-4 — Claude Code (API) + Antigravity (UI): skill management**
- Backend scope: `GET /api/skills/staged` (staging list across regimes) and `POST /api/skills/:region/:id/approve` mirroring `civagent skills approve` semantics (bare-basename guard, staging → active move), with the `engine/v5/skill-sediment.mjs` injection scan run *before* promotion.
- Frontend scope: SkillLibrary gains a "Staged" section with approve/reject actions.
- Acceptance: hermetic route tests; `npm run ci` and frontend build/lint green.

**R6-5 — Trae (MiMo): top-20 historical-fact revision**
- Scope: 20 regimes (10 Chinese + 10 global, prioritizing tournament staples); fact-check `metadata.json` era/system/description and IDENTITY role titles (Hucker official-title standard, AGENTS.md rule 8) with long reasoning; per-regime revision notes under `tasks/r6-revisions/` plus edits on a content branch. The bilingual `name.zh`/`name.en` convention stays.
- Acceptance: `npm run validate:regimes` green; Codex review pass over the content diff.

**R6-6 — Codex: adversarial review of the R6 PRs**
- Pre-seeded risk list: path traversal in regime writes; IDENTITY prose-rewrite → 0 agents; `agentCount` drift; concurrent edit vs. a running tournament (regime files/skills mutating mid-match); skill-approve scan ordering (R5 P2: scan before dedup); TOCTOU between review and apply; atomicity of multi-file regime edits.

### Execution order (dependency chain)

```
① R6-1 regime write API (Claude Code)
        ↓
② R6-2 review loop (Claude Code)
③ R6-3 editor UI (Antigravity, needs ①)                     ─┐ parallel
④ R6-4 skill management (backend then UI, needs only the     │
   Batch-2 skills service)                                    ─┘
⑤ R6-5 content revision (Trae) — parallel with everything (touches regimes/** only)
⑥ Codex reviews each backend PR (R6-6); integration layer merges, watches CI
```

---

## Technical constraints (all rounds)

| Rule | Description |
|---|---|
| No Gemini | Any scenario, any provider chain (enforced structurally in `engine/v5/judge.mjs` and `engine/v5/backends.mjs`). |
| Git workflow | `git fetch` + rebase/merge before push; watch CI to green after every push. |
| Test threshold | `npm run ci` green before merging — baseline **287** backend tests, may only grow; new modules ship with tests; `npm run validate:regimes` must stay green for all 57 regimes. |
| Path safety | All user-input path segments go through `safeResolve` (`server/utils.mjs`); regime ids are whitelist-validated (CLI: `bin/lib/common.sh::validate_regime`). |
| IDENTITY + agentCount | The IDENTITY.md role-mapping table is the source of truth for agents; `metadata.json.agentCount` must equal the compiled count (AGENTS.md rules 2–3). |
| Frontend typing | TypeScript strict, no new `any`; `npm run build:frontend` and frontend lint errors are blocking. |
| Write API shape | Long-running work answers with the id immediately and runs detached; fast validated file writes (R6 regime edits) may be synchronous but must be atomic (temp file + rename). |
| English surface | Engineering surface in English; `regimes/**` and historical terms stay intentionally bilingual (AGENTS.md rule 8). |
| Review order | Merging requires a Codex APPROVE; Claude Code patches findings directly (no bounce-back to the original implementer). |

---

## Milestones

| Round | Backend | Frontend | Content | Completion marker |
|---|---|---|---|---|
| **R4** ✅ | Express API server (read) + engine hardening | v6 shell with real data | — | Landed across main P1–P6 + PR #29 |
| **R5** ✅ (PRs open) | Batch 1 modularization + Batch 2 skill stats + 4 review fixes | Launcher + Skill Library tabs; orphans retired | 40 scenarios | All work on PR #29/#30 (CI green, Codex re-review pending); Batch 3 (frontend test infra, episodic-memory tests) in progress |
| **R6** ← current | Regime-editing write API + fact-review loop + skill-management API | Online regime editor + skill staging UI | Top-20 regime fact revision | Full management console |

---

_Single source of truth for the tripartite collaboration. Each party reads this
file before starting and leaves its review conclusion or output path in
`tasks/` upon completion._
