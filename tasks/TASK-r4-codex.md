# TASK-r4-codex — R4 Code Review

**Assigned to**: Codex  
**Project**: ~/Projects/civagent  
**Priority**: P0 (blocks all R4 merges)  
**Output**: Write your findings to `tasks/REVIEW-r4-codex.md`

---

## Context

CivAgent v5 is a multi-agent governance simulator. Two feature branches are ready for review before merging to `main`:

- `feat/r2-backend-eval` — R2 engine: blind multi-judge evaluation, skill deduplication, match replay, prompt-bank
- `feat/r3-engine-event-contract` — R3: fully isolated integration tests (no real CLI calls, no ~/.civagent writes)

Your job: read both branches, find issues, output a structured review with P0/P1/P2 findings and a merge recommendation.

**Hard rule: Gemini is permanently banned.** If you find any remaining call to `gemini` in engine/ or bin/, that is an automatic P0 blocker.

---

## PR-A: feat/r2-backend-eval

### Files to review

```
engine/v5/multi-judge.mjs         ← new: blind multi-judge aggregation
engine/v5/skill-quality.mjs       ← new: SHA-256 + Jaccard dedup
engine/v5/replay.mjs              ← new: replay past matches
engine/prompts/governance-scenarios.json  ← new: 10 governance scenarios
test/multi-judge.test.mjs         ← new: 32 test cases
test/skill-quality.test.mjs       ← new: 16 test cases
test/replay.test.mjs              ← new: 7 test cases
engine/v5/tournament.mjs          ← modified: multi-judge integration
engine/v5/skill-sediment.mjs      ← modified: dedup gate
bin/civagent                      ← modified: new CLI commands
```

### Specific questions to answer

**multi-judge.mjs**

1. `anonymizePrompt(prompt, civNames)` sorts by descending name length before substituting. Is this sufficient to handle ALL prefix overlap cases? Example: `["china/jin", "china/jin-jurchen"]`. Show a concrete substitution trace — does `jin-jurchen` get replaced before `jin`?

2. `parseScoreTable(markdown)` claims to handle three formats:
   - Format A: `Rank | Civ-X | Score /10 | Reason` (single score)
   - Format B: `Rank | Civ-X | L | F | R` (triple scores)
   - Format C: `Civ-X | L | F | R` (no rank)
   Does the parser correctly skip header rows and separator rows (`|---|---|`)? What happens if the judge outputs a different table layout?

3. `aggregateJudgements(judgementsMap)` averages scores across providers. What happens if one provider returns an empty `Map` (no parseable scores)? Is it safely excluded from the average, or does it pull the average toward zero?

**skill-quality.mjs**

4. Jaccard similarity threshold is 0.6. Is this calibrated? Two skills about "famine relief" vs "flood relief" would share many words — would they be incorrectly flagged as near-duplicates? Show a concrete example of a borderline case.

5. `normalizeSkill(content)` strips the provenance banner (`<!-- civagent v5 ... -->`) and YAML frontmatter before computing the fingerprint. Is the regex robust to multi-line banners? What if the banner contains `-->` inside it?

6. `findDuplicate(candidate, skillsDir)` reads all files in `skillsDir`. What if `skillsDir` doesn't exist yet (first ever skill for a regime)? Does it throw or gracefully return null?

**replay.mjs**

7. `replay()` reads `meta.json` from the original match and spawns `run-v5.mjs` with a new `matchId` prefixed `replay-<original>`. If someone calls `replay()` on a match that is itself a replay (i.e., `meta.matchId` already starts with `replay-`), will the `replayOf` chain grow indefinitely, or is there a cycle guard?

8. Is there a risk of `HOME` env contamination if `replay()` is called without the proper test isolation? (The original match was run with an isolated HOME; the replay uses `process.env` which may be the real HOME.)

**General**

9. Run `grep -rn "gemini" engine/ bin/ test/` mentally — do you see any remaining references to gemini as a callable provider (not just in comments or docs)?

10. Does `npm run lint:syntax` pass for all new `.mjs` files? (`node -c` each one.)

---

## PR-B: feat/r3-engine-event-contract

### Files to review

```
test/integration-event-contract.test.mjs  ← rewritten: full isolation
```

Key commit: `5697e39 test(engine): isolate v5 event contract integration tests`

### Specific questions to answer

1. `makeFakeBin()` creates `claude`, `codex`, `opencode`, `cc-glm`. Are there any other binaries the engine might call that are NOT shadowed? (Check `engine/v5/judge.mjs` for its full provider fallback chain and `engine/v5/skill-sediment.mjs` for what it actually spawns.)

2. `makeChildEnv(fakeBin, tempHome)` sets `HOME=tempHome`. On macOS (Node.js 18+), `os.homedir()` should read from `process.env.HOME`. But if any code in the spawned process calls a native addon or uses `getpwuid` directly, the isolation breaks. Is there evidence of this in the codebase?

3. The fake codex heredoc uses a quoted delimiter `'CIVAGENT_FAKE_END'` to prevent variable expansion. The body contains:
   ```
   | 1 | tang | 9.0 | decisive governance |
   ```
   Does `parseJudgeScores` in tournament.mjs correctly match `"tang"` to the regime `"china/tang"` via slug matching? Walk through the matching logic.

4. The tournament test has a 85s timeout and internally uses a 85_000ms `spawnAwait`. If the child process hangs (e.g., fake codex blocks), will the test runner kill it cleanly? Is `proc.kill()` sufficient on macOS, or should it send `SIGKILL` explicitly?

5. The `finally` blocks call `rmrf(tempHome)` and `rmrf(fakeBin)`. If the test runner crashes mid-test (OOM, SIGKILL), these cleanup calls won't run. Is this acceptable for a CI environment, or should temp dirs be registered for cleanup at process exit?

---

## Output format

Write your findings to `tasks/REVIEW-r4-codex.md`:

```markdown
# Codex Review — R4

## PR-A: feat/r2-backend-eval

### P0 — Merge blockers
- (none if clean)

### P1 — Should fix this round
- ...

### P2 — Defer to R5
- ...

### Verdict: APPROVE / REQUEST_CHANGES
Rationale: ...

---

## PR-B: feat/r3-engine-event-contract

### P0 — Merge blockers
### P1 — Should fix this round
### P2 — Defer to R5
### Verdict: APPROVE / REQUEST_CHANGES
```

If REQUEST_CHANGES, be specific: which file, which line, what to change.
