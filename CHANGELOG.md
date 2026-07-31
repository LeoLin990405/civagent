# 📜 Changelog

## v6.3.0 (unreleased) — Measurement Instruments (R11)

R11 follows the negative E1-control result: the dominant uncontrolled variable
was whether a regime delegated at all. This release adds instruments that
separate voluntary planning from an optional, topology-derived dispatch-roster
requirement while retaining the runtime graph's observability limits. The
changes are currently uncommitted in the `r7/validity` working tree.

### Added

- **Office-participation state:** completed, instrumented streams are classified
  as `participation_observed` or `not_observed`; incomplete and legacy-negative
  streams remain `unknown`. Counts and office IDs are surfaced in match metadata,
  tournament manifests, the runtime-graph CLI, and History Explorer. This is a
  categorical participation observation, not a topology execution rate.
- **Pre-enforcement dispatch plan:** the coordinator first records a structured
  plan with tools disabled, then execution resumes the same coordinator session.
  The neutral prompt explicitly permits zero or fewer offices.
  `parsed_nonempty`, `parsed_empty`, and `parse_failed` remain distinct. The plan
  event is stored in `events.jsonl` but excluded from judge and skill transcripts.
- **Symmetric roster enforcement:** `--enforce-dispatch` is default-off and
  requires each office with an incoming edge in that arm's own topology to
  receive an execution-phase subagent dispatch. The same function handles
  historical and rewired controls. Compliance is checked once and recorded as
  `not_requested`, `enforcement_passed`, or `enforcement_failed`; failures are
  not retried, dropped, or converted into a different process exit code.
- **Plan-versus-topology facts:** `runtime-graph --diff` now reports the planned
  office sequence, declared planned/omitted offices, undeclared offices, and
  duplicates. It emits no coverage ratio or composite deviation score. Directed
  edge alignment, edge kind, multiedge coverage, and edge exercise are explicit
  unsupported dimensions.
- **E2 pre-registration:** `docs/experiments/E2-preregistration.md` and a
  dry-run-by-default launcher freeze three scenarios, five repeats per cell,
  ten arms per tournament (15 jobs / 150 arms), the E1 source/control pairs,
  anonymization, no-skill mode, and engine-level dispatch enforcement.
  No E2 model experiment was run.

### Measurement limits retained

- Claude Code subagents do not call one another. Runtime events directly expose
  coordinator→office dispatches and office-attributed turns, not typed
  office→office `command` / `review` / `info` / `veto` edges.
- A passed enforcement check proves only that the topology-derived office roster
  was dispatched. It does not prove declared wiring executed.
- Because source and seed-42 control topologies preserve office IDs, node-set
  plan comparisons may be unable to distinguish adoption of historical versus
  rewired edge structure.

---

## v6.2.0 (unreleased) — Measurement Validity and Control Arms

Development status as of 2026-07-31: R7–R9 are on `r7/validity` in open PR
#32. R10 and the E1-control result are committed through `1c94e12`. E1-control
ran on 2026-07-30: historical wiring won no resolved pair, one pair went to the
control, and 13/30 arms never delegated. PR #31 (`r6/integration`) remains a
separate open branch and is not an ancestor of `r7/validity`; its write
API/editor work is therefore not listed as shipped here.

### Added

- **Experimental nulls**: reproducible `solo`, `flat-N` and seeded `random-N`
  topology controls under `regimes/_baseline/`. Controls preserve source
  offices and persona while changing the coordination flow.
- **Judge calibration telemetry**: multi-pass provider statistics,
  same-family/cross-family gap, presentation-order effect and honest
  per-transcript verbosity logs are persisted with tournament results.
- **Governance-graph typing**: topology nodes can describe agent, gate,
  checkpoint and router roles; metrics and validation understand the expanded
  node model.
- **Runtime graph CLI**: `civagent runtime-graph <matchId> [--diff] [--json]`
  reconstructs actor/span activity. Office-attributed events now expose office
  turn counts plus coordinator dispatch order/counts.
- **E1 validity experiment**: a pre-registration and pilot report document that
  the original run was invalidated by missing subagent transcripts. The report
  retains the negative result instead of interpreting unsupported rankings.
- **E1 control arm (R10)**: seed-42 random-wiring controls for Qin, Tang,
  Athens, Zhou and Ming, plus a dry-run-by-default experiment launcher with
  resumable batches and an explicitly estimated AFP window. The arm ran on
  2026-07-30; C1 was not supported and scenario-driven non-delegation became
  the principal measurement finding.
- **Actor-stratified judge transcript selection (R10)**: long event streams are
  sampled by each observed actor's first/middle/last turn, explicit dispatch
  turns and the final turn, under the same 6,000-character budget for every
  civ. Selection strategy, original/selected lengths, turns and actors are
  retained in the manifest.
- **Office-aware match UI (R10)**: History Explorer and Live Court split
  `<regime>#<office>` actors at the first `#`, display the office as the role
  badge and preserve the regime as context. Legacy actors remain unchanged.

### Changed

- **Full subagent transcript capture**: Claude Code runs with verbose
  stream-JSON output, so office deliberation enters `events.jsonl` instead of
  only the coordinator's closing message.
- **Constitutional markers are explicit**: veto, edict and impeachment
  mechanisms require bracketed protocol markers; ordinary historical prose no
  longer triggers a mechanism or grants veto immunity.
- **History and skill feedback**: episodic retrieval ranks across the full
  practical history with stable tie-breaking and filtered keywords; tournament
  outcomes are stamped onto newly sedimented skills after judging.
- **CI and persistence hardening**: Node 20/22 backend jobs, a blocking frontend
  suite, regime validation and smoke checks run in CI; repeated tournament
  recording is idempotent without dropping legitimate repeated events.

### Measurement limits retained deliberately

- Coordinator fan-out proves office participation and dispatch, not a typed
  office-to-office edge. `unexercised_ratio` therefore remains `null` under
  `coordinator_to_office_only` observability even when office ids overlap.
- `caused_by_span_id` alone cannot supply source office, target office, edge
  kind, artifact identity or proof that capture was complete. R10 did not add
  this field or promote the runtime diff to direct-edge comparability.
- The runtime graph was not added to the HTTP API: the useful participation
  view is already derivable from match events, while the declared-edge diff is
  still incomparable.
- The production four-level rubric is unchanged. A separately versioned shadow
  calibration is proposed for the S3 ceiling effect; old and new score series
  must not be spliced or converted.

---

## v6.1.0 (unreleased) — Reconciliation, Write API, R2 Revival 🔀

The v6 hardening line rejoined main (PRs #19–#28) — see PR #29.

### Added
- **Write API**: `POST /api/tournaments` — validated launch of a real tournament in a detached background process, answering `202 {tournamentId}` immediately; launch logs in `~/.civagent/server-logs/`.
- **R2 revival on the v6 architecture**: multi-provider judging (`tournament --judges N`), full civ anonymization for blind judging (`--anon-civs`, covers ids, slugs, and metadata display names), `engine/v5/skill-quality.mjs` (SHA-256 + Jaccard dedup as a sediment gate + `civagent skills <regime> --stats`), `engine/v5/replay.mjs` (`civagent replay <matchId>`, lineage always points at the root match), and the restored `engine/prompts/governance-scenarios.json` served at `GET /api/scenarios`.
- **Endpoints ported into the Express server**: `GET /api/stats/rankings` (BT rankings + CI), `GET /api/regimes/:region/:id/topology` (validator + metrics, shared with the CLI).
- **Test hardening**: write-API tests with injected spawn, `parseIdentityTable` contract tests (incl. the prose-IDENTITY→0-agents hazard, swept across all 57 regimes), integration fake-bin list derived from `BACKEND_COMMANDS` + `JUDGE_PROVIDERS`.
- **Route test coverage** (R5 Batch 1): hermetic tests with injectable `rootDir` for the regime/match/history routes — `test/routes-regimes.test.mjs`, `test/routes-matches.test.mjs`, `test/routes-history.test.mjs`.
- **Skill stats endpoint** (R5 Batch 2): `GET /api/skills/:region/:id/stats` — per-regime dedup/quality analysis over the learned-skills dir (`server/routes/skills.mjs` + `server/services/skills.mjs`, tests in `test/routes-skills.test.mjs`).
- **Scenario library 10 → 40** (R5 Batch 2): 30 new governance scenarios in `engine/prompts/governance-scenarios.json` (served at `GET /api/scenarios`).
- **Tournament Launcher + Skill Library tabs** (R5 Batch 2): `frontend/src/components/TournamentLauncher.tsx` launches real tournaments through `POST /api/tournaments`; `frontend/src/components/SkillLibrary.tsx` browses learned skills and their stats; contracts in `frontend/src/types/api.ts`.
- **Review regression tests** (Codex R5 follow-up): `test/judge-anon-multi.test.mjs` (blind-judge role-name leak), `test/replay.test.mjs` and `test/tournaments-write-api.test.mjs` extensions (path-safe lineage, unknown-backend rejection), `test/services-regimes-cache.test.mjs` (cache staleness). Backend suite 252 → 287.

### Changed
- **Server modularization** (R5 Batch 1): route files restructured as factories with injectable deps; shared, cached regime catalog service in `server/services/regimes.mjs`; unified error/status helpers in `server/http.mjs` (`server/routes/*.mjs` rewritten on top).
- **Tournament module split** (R5 Batch 1): `engine/v5/tournament.mjs` cut 710 → 462 lines — blind-judge rubric moved to `engine/v5/judge-rubric.mjs`, T3 deterministic grading to `engine/v5/deterministic-grading.mjs`; the original module re-exports the moved symbols, so the export surface is unchanged.
- **Frontend cleanup** (R5 Batch 1): retired four orphan components (`CodexBrowser`, `JudgeLeaderboard`, `RegimeBrowser`, `TerminalPanel`, −1226 lines) and revived match history as the `frontend/src/components/MatchArchive.tsx` tab.
- **CLI de-duplication** (R5 Batch 1): shared helpers extracted to `bin/lib/common.sh` (colors, `die`, `validate_regime`, single-shot metadata reader); `civagent list` now spawns one `python3` per regime instead of four (228 → 57 processes, ~4.1s → ~1.2s).

### Fixed
- **CLI injection**: regime ids are whitelist-validated and no longer interpolated into `python -c` program strings (Codex R4 review P1a).
- **Replay env hygiene**: replay children drop inherited `CIVAGENT_*` vars (P1b); blind judging covers display names (P1c).
- **china/tang**: audited 9-agent 三省六部 structure with a matching `topology.json`.
- **Blind-judge role-name leak** (Codex R5 review, P1): anonymization now also neutralizes regime-specific agent IDs / office labels inside transcripts before judge prompts are built, so e.g. `zhongshu`/`menxia` speaker labels no longer reveal `china/tang` to the judge (`engine/v5/judge.mjs`).
- **Write API accepted unknown backends** (Codex R5 review, P1): `POST /api/tournaments` now validates the shared `backend` and per-civ `#backend` against known backends before answering `202`, instead of failing later in the detached child (`server/routes/tournaments.mjs`).
- **Replay lineage path escape** (Codex R5 review, P1): match IDs and `replayOf` lineage pointers are validated with the same safe-segment rules as the server, and read paths are split from mkdir-on-write paths, so a corrupted lineage can no longer read metadata outside `~/.civagent/matches` (`engine/v5/replay.mjs`).
- **Stale regime cache** (Codex review of PR #30, P1): the regime catalog cache is keyed on a recursive fingerprint (mtime + size) of the files it serves, not the top-level `regimes/` directory mtime — nested edits to `metadata.json` / `IDENTITY.md` / `SOUL.md` / `skills/*.md` now invalidate correctly without a server restart (`server/services/regimes.mjs`).

---

## [v6.0.0] - 2026-06-26

### Major Architecture Upgrade (CivAgent V6)
- **Zero-Dependency Refactor:** Completely purged TailwindCSS in favor of Vanilla CSS and Glassmorphism design principles across the frontend.
- **The Constitutional Engine:** Introduced absolute override mechanisms for agent orchestration: `[VETO]`, `[IMPEACH]`, and `[EDICT]`.
- **Live Court Dashboard:** Implemented a new Real-Time SSE (Server-Sent Events) streaming component (`LiveCourt.tsx`) to visualize multi-agent debates and mechanism triggers live.
- **The Dynasty & Global Swarm:** Fully iterated and upgraded all 57 historical regimes (20 Chinese Dynasties + 37 Global Empires) to the new V6 architecture, complete with detailed `IDENTITY.md` and `SOUL.md` prompt directives.

## v5.2.0 — R3 Engine Event Contract 📡 (merged into v6.0.0)

Event contract hardening (Round 3). Focus: structured skill events in the match stream and structured judge fields in the tournament manifest, verified by fake-backend integration tests.

### Changed
- **Skill events now emitted inside the match stream** (`engine/v5/run-v5.mjs`) — sedimentation runs *before* `match_end` so the `skill` event lands in `events.jsonl` with `{ status: saved|rejected|skipped|error, skillPath?, auditedBy?, reason? }`. Frontend can read skill outcome without polling `meta.json`.
- **`match_end` is guaranteed to be the final event** — the ordering contract (`match_start → turns → skill → match_end`) is now enforced and tested.
- **Tournament manifest `judge` field is now structured** (`engine/v5/tournament.mjs`) — adds `scores: [{regime, score}]` sorted descending, and `topRegime: string|null`, extracted from the judge's markdown table. `provider` and `resultPath` are preserved. Frontend no longer has to re-parse `result.md` to show a leaderboard.
- **Backend omitted from judge section header** — judge sees `### china/tang (exit 0)` not `(backend native, exit 0)`, preventing backend identity from leaking into a blind evaluation.

### Added
- **`parseJudgeScores(output, civRegimes)`** (exported from `tournament.mjs`) — lenient markdown-table parser; handles exact regime match, slug match, and returns `[]` gracefully on unparseable output.
- **`buildSkillEvent(result)`** (exported from `run-v5.mjs`) — converts a `sediment()` result into the skill event payload; truncates `reason` at 200 chars.
- **`schemas/match-event.schema.json`** — `skill` event now has defined properties: `status` (enum), `skillPath`, `auditedBy`, `reason`. Added a `skill` example event.
- **`test/integration-event-contract.test.mjs`** — 13 new tests (32 → 45): fake-backend spawning of `run-v5` and `tournament`, concurrent-civ isolation proof, `parseJudgeScores` unit tests, `buildSkillEvent` unit tests.


---

## v5.1.0 — R1 Engine Robustness 🔧 (merged into v6.0.0)

Backend robustness pass (iteration plan: [ITERATION_PLAN.md](./ITERATION_PLAN.md), Round 1). Focus: correctness, concurrency safety, and removing the hard external dependency on Gemini.

### Fixed
- **Tournament concurrency (P0)** — parallel civilizations previously shared a single global `~/.civagent/.active-regime` file (`switch` then `run`), so racing civs could all run as the same regime. `tournament.mjs` now spawns `run-v5.mjs` directly with an explicit regime + backend + match id per civ. No shared mutable state. (`engine/v5/tournament.mjs`)
- **Gemini removed end-to-end (P0)** — Gemini was hard-coded as the tournament judge and the skill auditor, and was a civ backend in the team config. All paths now route through `engine/v5/judge.mjs`, which excludes Gemini structurally (it is filtered out of any provider chain). Generated CLAUDE.md, orchestration mode docs, and `providers.json` scrubbed too.
- **Skill audit ordering** — cheap deterministic guards (injection + frontmatter) now run *before* spending an audit call; the auditor prefers a different engine than the extractor (codex) to avoid self-endorsement.

### Added
- **`engine/v5/backends.mjs`** — pluggable civ backend routing (`--backend`): maps `native`/`cn:*` ids to Claude-Code-compatible binaries. Fails fast on forbidden (gemini), incompatible (codex/opencode), or unknown backends instead of silently falling back to `claude`. Wires the previously-inert per-civ backend config into `run-v5.mjs`.
- **`engine/v5/judge.mjs`** — evaluation/review provider with retry + fallback (codex → opencode reviewer → cc-glm). Never Gemini.
- **`engine/v5/events.mjs` + `schemas/match-event.schema.json`** — structured per-match event stream (`~/.civagent/matches/<id>/events.jsonl` + `meta.json`) and tournament `manifest.json`. This is the stable contract the frontend consumes.
- **Tests** — 9 → 32: backend routing, judge provider selection + gemini-exclusion guarantee, tournament spawn contract (proves no global `switch`), `run-v5` arg parsing. `skill-sediment` test now imports the real helpers instead of hand-copied regexes.

### Notes
- Civ backends are Claude-Code-compatible CLIs only (`claude`, `cc-*`). Codex/opencode are judges, not civ backends; the team config's `civ-rome` "codex" backend is an Agent-Team delegation hint, not a `run-v5` backend.


---

## [v5.0.1] - 2026-02-14) — Engine Data Source Fix 🩹

### Critical fix
- **engine/regime-to-cc.mjs**: The v4 engine preferred `openclaw.json.template` (legacy) over `IDENTITY.md`. This made the L-stage canonical rewrite of all 57 regimes (v5.0.0) have zero effect on actual agent generation — every regime produced v4 default agents.

### Effect
After this one-line flip (PR #7), every civilization's Agent Team authentically reflects its historical governance:
- **tang**: emperor → zhongshu-sheren (中书舍人, Tang drafter) → 6 ministries (replaced anachronistic 司礼监)
- **byzantine**: basileus, patriarch, logothete-dromos/genikon, domestikos, eparch, protoasecretis
- **roman-republic**: consul-a/b (dual consulship), senate, tribune, praetor, censor, quaestor, aedile
- **soviet**: gensec, politburo, gosplan, kgb, pravda, army, supreme
- ... and 53 more

All 57 verified to generate ≥5 agents from the canonical role mapping table.

---

## v5.0.0 (2026-04-14) — Learning Loop 🧠

Inspired by [NousResearch/hermes-agent](https://github.com/NousResearch/hermes-agent). CivAgent gains a **cross-match learning loop**: civilizations now accumulate governance skills as they play.

### New
- **Civilization memory isolation** — each regime runs in its own `~/.civagent/envs/<region>-<id>/` with isolated `HOME` + `XDG_*` paths. No cross-contamination between civs.
- **Automatic skill sedimentation** — after each match, `codex` extracts reusable governance patterns from the transcript, `gemini` audits them for shape/quality, and approved skills are written to `regimes/<civ>/skills/learned-<date>-<topic>-<matchId>.md` for use in future matches.
- **Prompt-injection guard** on learned skills — rejects patterns containing role-redirection tokens, jailbreak strings, or missing frontmatter. Each skill file carries a provenance banner.
- **New CLI**: `civagent run --v5`, `civagent skills <regime>`, `civagent match-log`, `civagent tournament`.
- **Tournament mode** — spawn 4 civilizations against the same task in parallel, auto-judge governance quality.
- **package.json + unit tests + CI** — `npm test`, GitHub Actions pipeline on PR.

### Design notes
- v5 is fully opt-in via `--v5` flag; v4 behavior preserved.
- Three independent AI review passes (Codex → Gemini → Kimi) shaped the final design. See [docs/V5-DESIGN.md](./docs/V5-DESIGN.md).

### Limitations documented
- Compressing a governance system to one agent's `SOUL.md` is lossy; multi-department sub-agent splits are a v5.2 candidate.
- `regimes/` has no time-dimension; anachronistic comparisons are a feature, not a bug.

---

## v3.5.2 (2026-03-13)

### Bug Fixes
- **H-01** `install.sh` — no longer uses sudo to install global npm packages under nvm/volta/fnm environments, avoiding conflicts between the system npm and user npm paths
- **H-05** `gui/server/index.js` — the wss/sseClients/metricsBuffer references in `/api/health` changed to optional chaining, eliminating dead-code risk
- **H-06** `openclaw.example.json` — `$HOME/clawd` replaced with the `/home/YOUR_USERNAME/clawd` placeholder; the JSON no longer relies on shell variable expansion
- **H-07** `install.sh` — added null-value protection for `$HOME` in heredocs (`${HOME:-/root}`) and a warning for paths containing spaces
- **H-09** `gui/server/index.js` — `countSessionFile` changed from synchronous readSync to an asynchronous readline stream, no longer blocking the Node event loop; added a 50MB file-size cap to skip

---

## v3.5.1 (2026-03-12)

### Improvements
- **README refactor** — slimmed down to a ~400-line landing page, with detailed tutorials split into the `docs/` directory
- Fixed the Feishu permission count description (8 → 9)
- Filled in `contact:user.employee_id:readonly` in the Feishu troubleshooting permission table
- Fixed the Sandbox anchor link
- Inserted the mascot image
- Unified the OpenClaw Hub links to the OpenClaw Skill ecosystem
- Updated the `clawdhub install` command to `openclaw skill install`
- Converted the Basics/Advanced .txt files to markdown format (`docs/tutorial-basics.md`, `docs/tutorial-advanced.md`)
- Added the `docs/` documentation index and several split documents

---

## v3.5 (2026-03-12)

### New Features
- **7 preinstalled Skills** — weather / github / notion / hacker-news / browser-use / quadrants / openviking
- **Comprehensive Feishu configuration overhaul** — all examples unified on dmPolicy/groupPolicy/botName; the permission table completed to 8 items
- **Configurable GUI branding** — customize the brand name via the `VITE_BRAND_NAME` environment variable
- **install.sh automatically runs doctor.sh after installation** for a health check
- **Added CONTRIBUTING.md** contribution guide and skills/README.md index

### Bug Fixes
- The README Feishu configuration example was missing groupPolicy, and the structure was outdated (appId not inside accounts)
- The README/README_EN troubleshooting permission table completed from 3 to 8 items
- The README architecture diagram's Directorate of Ceremonial label (main) → (silijian)
- Court.tsx core agent filter did not include silijian
- openclaw.example.json was missing the Hanlin Academy's Discord account and binding
- Dockerfile `COPY skills/` path hard-coded
- docker-compose.yml removed the deprecated `version: '3.8'`
- The cloud-provider placeholder in Basics.txt replaced with the actual Oracle Cloud link

### Improvements
- doctor.sh added dmPolicy and top-level groupPolicy check items
- install.sh Feishu installation guide augmented with permission steps and documentation links
- README_EN synchronized the preinstalled-Skill section and the "60+ Skill" phrasing

---

## v3.4 (2026-03-11)

### New Features
- **Feishu configuration guide** — complete Feishu integration documentation (500+ lines)
- **doctor.sh Feishu diagnostics** — automatically detects Feishu appId/appSecret/permissions/event subscriptions
- **GUI multi-framework support** — automatically detects OpenClaw/Clawdbot CLI and config directories
- **Docker deployment** — Dockerfile + docker-compose + entrypoint initialization

### Bug Fixes
- GUI department mapping corrected (libu=Ministry of Rites, libu2=Ministry of Personnel)
- GUI compatible with both `.openclaw` and `.clawdbot` config directories
- GUI supports both the silijian and main agent ids
- Dockerfile/docker-compose paths parameterized

---

## v3.0 (2026-03-10)

### New Features
- **Three-in-one one-click install scripts** — install.sh (Linux) / install-lite.sh / install-mac.sh
- **Multiple deployment modes** — Discord multi-Bot / Feishu multi-Bot / WebUI-only
- **Web GUI** — React + TypeScript Dashboard (Court, Sessions, Token, Cron, etc.)
- **OpenViking Skill** — vector knowledge-base integration
- **Quadrants Skill** — four-quadrant task management

---

## v2.0 (2026-02-22)

### Initial Release
- The Three Departments and Six Ministries system × OpenClaw multi-Agent architecture
- 10 Agent templates (Directorate of Ceremonial + Grand Secretariat + Censorate + Six Ministries + Hanlin Academy)
- Built-in approval workflow (code → Censorate review, major decisions → Grand Secretariat deliberation)
- Discord multi-Bot mode
- Companion written scripts for the Xiaohongshu tutorial series
