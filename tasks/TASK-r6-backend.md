# TASK-r6-backend: regime-editing write API + fact-review loop + skill-management API

Status: PENDING
Priority: P0
Owner: Claude Code
Depends on: PR #30 merged (skills stats service + route-factory layout on main)

## Context

R5 delivered the read side plus one write path (`POST /api/tournaments`). R6
extends the write surface to regimes and skills, following the same blueprint:
strict validation before any state change, atomic writes, hermetic tests.
Read `AGENTS.md` first — rules 2 (IDENTITY table), 3 (agentCount sync), 5
(safeResolve), and 8 (English surface) gate every acceptance check.

## §1 Regime-editing write API (R6-1)

**Endpoint**: `PUT /api/regimes/:region/:id` — updates `metadata.json`,
`IDENTITY.md`, `SOUL.md` under `regimes/<region>/<id>/`. Edits only; regime
creation/deletion is deliberately out of scope.

**Pre-commit validation chain** (all must pass before any byte is written):
1. `region`/`id` whitelist — same shape as `bin/lib/common.sh::validate_regime`
   (`^(china|global)/[a-z0-9][a-z0-9-]*$`); path built via `safeResolve`
   (`server/utils.mjs`), no `..` / dot segments.
2. `parseIdentityTable` (`engine/regime-to-cc.mjs`) over the proposed
   IDENTITY.md must yield ≥ 1 agent — rejects the prose-rewrite hazard.
3. `metadata.json.agentCount` is auto-resynced to the compiled agent count
   (never trusted from the payload).
4. If the regime dir has a `topology.json`, `engine/topology/validate.mjs`
   must pass against the proposed IDENTITY.md.

**Write semantics**: temp file + atomic rename per file; a failed multi-file
write must not leave a half-updated regime. Response: `200` with the
re-compiled summary (agents, validation results).

**Tests**: new `test/routes-regimes-write.test.mjs`, hermetic (temp regimes
root, injectable like the R5 route tests). Cover: happy round-trip; prose
IDENTITY rejected; bad id rejected; traversal rejected; agentCount drift
corrected; topology mismatch rejected; atomicity on partial failure.

**Acceptance**:
```bash
npm run ci          # lint:syntax + lint:backend + test + validate:regimes
```

## §2 Historical-fact review loop (R6-2)

**Endpoint**: `POST /api/regimes/:region/:id/review`.

- **Synchronous part**: the §1 mechanical chain, returning structured
  findings `{ ok, errors: [...], warnings: [...] }`.
- **Optional judge-backed part** (`?deep=1`): a fact-check pass over
  `metadata.json` + `SOUL.md` historical claims via `engine/v5/judge.mjs`
  (codex → opencode reviewer → cc-glm; never Gemini). Judge calls are slow →
  async tournament-style: `202 {reviewId}` + result file, never block the
  response (AGENTS.md rule 6).

**Tests**: mechanical pass/fail cases; fake-judge async round-trip (fake the
judge binary per `test/integration-event-contract.test.mjs` patterns).

**Acceptance**: `npm run ci` green.

## §3 Skill-management API (R6-4 backend)

**Endpoints**:
- `GET /api/skills/staged` — staging entries across all regimes (mirror of
  `civagent skills pending`).
- `POST /api/skills/:region/:id/approve` — promote one staged skill (bare
  basename guard, exactly `civagent skills approve` semantics), with the
  `engine/v5/skill-sediment.mjs` injection scan run *before* promotion
  (addresses R5 review P2 ordering while we are here).

**Tests**: hermetic `test/routes-skills-write.test.mjs` — traversal rejected,
dotfile rejected, injection payload rejected pre-promotion, happy path moves
the file.

**Acceptance**: `npm run ci` green.

## Output

Leave a completion note (endpoints shipped, test count delta) at the bottom of
this file, per the collaboration convention.
