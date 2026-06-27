# AGENTS.md — Contributor & Coding-Agent Guide

Cross-tool guidance for any coding agent (Claude Code, Codex, Cursor, opencode, …)
working in this repo. Read this first. Keep changes minimal and verified.

CivAgent is a research testbed that encodes 57 historical governance systems
(20 Chinese dynasties + 37 global empires) as executable multi-agent
orchestration topologies on the Claude Code runtime.

## Commands

```bash
npm ci                     # install (better-sqlite3 is a native module — required before tests)
npm run lint:syntax        # node -c on every engine file + bash -n on bin/civagent
npm test                   # node --test test/*.test.mjs  (must stay 100% green)
npm run validate:regimes   # mechanical validation of all 57 regimes (CI-gating)
npm run start:server       # Express API on :3001 (server/index.mjs)
npm run dev                # server + Vite frontend concurrently
```

A change is not done until `npm run lint:syntax`, `npm test`, and
`npm run validate:regimes` all pass. CI (`.github/workflows/ci.yml`) runs all three.

## Hard rules (violating these breaks the build or the design)

1. **Never use Gemini** — in any provider chain (judge, sediment audit, agent
   backend). It is structurally excluded in `engine/v5/judge.mjs` and
   `engine/v5/backends.mjs`; do not reintroduce it via config or fallback.
2. **IDENTITY.md role-mapping table is the source of truth for agents.** The
   engine compiles agents by parsing the markdown table whose header contains
   `Agent ID` (see `engine/regime-to-cc.mjs::parseIdentityTable`). Do NOT rewrite
   a regime's IDENTITY.md into prose (`### Agent N:` bullet lists) — that parses
   to **0 agents** and the regime can no longer run.
3. **Keep `metadata.json.agentCount` in sync with the compiled count.** The
   validator enforces `agentCount === Object.keys(convertRegime(dir).agents).length`.
   If you change a regime's role table, update `agentCount` to match.
4. **Register every new event type in `engine/v5/events.mjs::EVENT_TYPES`** (and
   `schemas/match-event.schema.json`). `EventLog.emit` throws on an unknown type,
   which crashes the whole match. This is how mechanism events
   (`veto_triggered` / `impeach_triggered` / `edict_triggered`) are wired.
5. **All user-supplied path segments go through `safeResolve`** (`server/utils.mjs`)
   — no `..` traversal, no dot segments.
6. **The write API is async**: `POST` endpoints return an id immediately and spawn
   work in the background; never block the HTTP response on a match/tournament.
7. **New modules need tests.** Tests must be hermetic — fake every external CLI
   and point `HOME` at a temp dir (see `test/integration-event-contract.test.mjs`).

## Architecture map

| Area | Path | Notes |
|---|---|---|
| CLI | `bin/civagent` | `list / info / run --v5 / tournament / setup / doctor` |
| Regime → agents compiler | `engine/regime-to-cc.mjs` | parses IDENTITY.md table → `--agents` JSON |
| V5 match runner | `engine/v5/run-v5.mjs` | isolated HOME, line-buffered mechanism detection, sedimentation |
| Tournament | `engine/v5/tournament.mjs` | spawns N civs in parallel, judges, ranks |
| Skill sedimentation | `engine/v5/skill-sediment.mjs` | extract → inject-guard → independent audit → atomic write |
| Constitutional mechanisms | `engine/mechanisms/*.mjs` | `MechanismEngine`: `[VETO]` `[IMPEACH]` `[EDICT]` |
| Event contract | `engine/v5/events.mjs` + `schemas/match-event.schema.json` | stable JSONL the frontend consumes |
| History DB | `engine/v5/history-db.mjs` | **lazy** SQLite open; tolerant of concurrent access |
| API server | `server/index.mjs`, `server/routes/*` | Express, better-sqlite3 |
| Frontend | `frontend/src/` | React + TS (strict, no `any`) + Vite |
| Regime data | `regimes/{china,global}/<id>/` | `metadata.json` + `IDENTITY.md` + `SOUL.md` |

## Concurrency notes (a tournament spawns many processes against shared state)

- The shared history DB (`~/.civagent/civagent_history.db`) is opened **lazily**
  with a busy timeout; WAL is best-effort and never fatal. Don't move DB open
  back to module-import time.
- Civs write into a regime's `skills/` dir that is symlinked into live HOMEs —
  skill files are written via temp-file + atomic rename. Preserve that.
- Always attach an `error` handler to a spawned child whose promise resolves on
  `close`, or a spawn failure (ENOENT/EMFILE) hangs `Promise.all` forever.
- Pass `maxBuffer` to `spawnSync` for judge/extractor calls — transcripts exceed
  the 1 MB default.

## Review workflow

Substantial changes get an independent review pass (Codex or opencode reviewer —
never Gemini) before merge. PRs must `git fetch` + rebase onto the base branch
first. See `ITERATION_PLAN.md` for the multi-party roles.
