# TASK-r6-codex: adversarial review of the R6 PRs

Status: PENDING
Priority: P0
Owner: Codex
Depends on: R6 backend PRs open (R6-1/R6-2/R6-4), then the frontend PR (R6-3)

## Scope

Review each R6 PR against `AGENTS.md` hard rules and the pre-seeded risk list
below. Output goes to `tasks/REVIEW-r6-codex.md` in the established format
(P0 / P1 / P2 + "checked, no issue found" notes + verdict).

## Pre-seeded risk list (highest risk first)

1. **Path traversal in regime writes** — `PUT /api/regimes/:region/:id`
   constructs paths from user input. Verify every segment goes through
   `safeResolve` (`server/utils.mjs`) and the id whitelist; hunt for
   write-anywhere primitives (temp file location, rename targets).
2. **IDENTITY prose-rewrite hazard** — any accepted payload that makes
   `parseIdentityTable` return 0 agents bricks the regime (AGENTS.md rule 2).
   Check server-side enforcement, not just UI shape.
3. **agentCount drift** — the payload must never set `agentCount`; it must be
   recomputed (rule 3). Check both the write route and any partial-update path.
4. **Concurrent edit vs. running tournament** — a regime's files and
   `skills/` can mutate while a match sediments skills into the same dir
   (atomic temp+rename on both sides? TOCTOU between validation and write?).
5. **Skill-approve scan ordering** — injection scan must run *before*
   promotion (closes R5 review P2); verify a scan failure cannot promote.
6. **Review-loop TOCTOU** — `POST .../review` (R6-2) findings vs. the eventual
   apply: can a regime change between review and write so the approval covers
   different content?
7. **Multi-file atomicity** — a failed `metadata.json` + `IDENTITY.md` +
   `SOUL.md` update must not leave a half-written regime.
8. **Judge chain purity** — the R6-2 fact-check path must route through
   `engine/v5/judge.mjs` with Gemini structurally excluded; no new provider
   chain may bypass it.

## Frontend review (R6-3, second pass)

- The IDENTITY editor cannot produce prose — verify the emitted markdown
  always parses (test with `parseIdentityTable` directly).
- No new `any`; server validation errors are surfaced, not swallowed.

## Verdict format

End with `### Conclusion: APPROVE` or `### Conclusion: REQUEST_CHANGES` per
PR, as in `tasks/REVIEW-r5-codex.md`. Claude Code fixes P0/P1 findings
directly; P2s get filed into the next round.
