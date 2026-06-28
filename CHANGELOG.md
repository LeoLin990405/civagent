# 📜 Changelog

## v5.2.0 (unreleased) — R3 Engine Event Contract 📡

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

## v5.1.0 (unreleased) — R1 Engine Robustness 🔧

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

## [v6.0.0] - 2026-06-26

### Major Architecture Upgrade (CivAgent V6)
- **Zero-Dependency Refactor:** Completely purged TailwindCSS in favor of Vanilla CSS and Glassmorphism design principles across the frontend.
- **The Constitutional Engine:** Introduced absolute override mechanisms for agent orchestration: `[VETO]`, `[IMPEACH]`, and `[EDICT]`.
- **Live Court Dashboard:** Implemented a new Real-Time SSE (Server-Sent Events) streaming component (`LiveCourt.tsx`) to visualize multi-agent debates and mechanism triggers live.
- **The Dynasty & Global Swarm:** Fully iterated and upgraded all 57 historical regimes (20 Chinese Dynasties + 37 Global Empires) to the new V6 architecture, complete with detailed `IDENTITY.md` and `SOUL.md` prompt directives.

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
