# Codex Review — R4

## PR-A: feat/r2-backend-eval

### P0 — Merge blockers
- (none) I found no remaining callable `gemini` path in `engine/`, `bin/`, or `test/`. The remaining hits are policy comments, explicit rejection logic, and tests asserting that `gemini` is filtered/rejected.

### P1 — Should fix this round
- `bin/civagent:325-330` embeds the user-provided replay match id directly into a JavaScript heredoc: `replayMatch('$match_id')`. A match id containing a single quote, newline, or JS syntax can break the snippet or inject code. Pass the value through env/argv instead, for example `MATCH_ID="$match_id" node --input-type=module <<'EOF' ... replayMatch(process.env.MATCH_ID)`, or JSON-escape it before interpolation.
- `engine/v5/replay.mjs:55-58` spawns the replay child with `{ ...process.env, CIVAGENT_MATCH_ID: newMatchId }`. If `replayMatch()` is called from a non-isolated process, the child inherits the real `HOME`/XDG env and can write to the real `~/.civagent` rather than the intended isolated state. Add an injectable `env` option and cover replay with a temp-`HOME` child-process test.
- `engine/v5/multi-judge.mjs:152-153` anonymizes only the full regime ids from `civResults`, while `engine/v5/tournament.mjs:84-95` includes raw transcript text. If a transcript says "Tang", "Qin", "Athens", etc., the blind judge still sees civ identity. Either anonymize known display names/slugs with case-aware word boundaries, or downgrade the "blind" claim to "headers anonymized".

### P2 — Defer to R5
- `engine/v5/replay.mjs:18-19` uses `metaPath(originalMatchId)` to check for an existing match. `metaPath()` calls `matchDir()`, which creates the directory, so a typo like `civagent replay nope` leaves an empty match directory before throwing. Use a non-creating path for read-only lookup.
- `engine/v5/replay.mjs:37-43` has no replay-of-replay guard. Replaying `replay-...` creates another replay whose `replayOf` points to the replay parent. This is not a cycle because ids are unique, but the lineage chain can grow indefinitely; consider storing `rootReplayOf` or refusing replay-of-replay.
- `engine/v5/skill-quality.mjs:50-59` uses an uncalibrated word-set Jaccard threshold of `0.6`. A famine-relief and flood-relief template with identical operational structure but only the hazard word changed scored `44/46 = 0.956`, so it will be flagged as a near-duplicate. That may be desirable for template duplicates, but it can also suppress distinct disaster-specific variants unless headings/boilerplate are down-weighted.
- `engine/v5/skill-quality.mjs:18-21` strips multi-line HTML comments correctly with `/<!--[\s\S]*?-->/`, but an invalid banner containing `-->` terminates the match early and leaves the rest in the fingerprint. Since the banner is generated, this is low risk; sanitize `matchId`/auditor before writing the banner if those can be externally supplied.
- `engine/v5/multi-judge.mjs:17-28` handles the requested prefix case correctly. Trace for `["china/jin", "china/jin-jurchen"]`: labels are assigned `Civ-A` and `Civ-B`, the replacement order is `china/jin-jurchen` then `china/jin`, so the prompt becomes `... china/jin ... Civ-B ...` and then `... Civ-A ... Civ-B ...`. No `Civ-A-jurchen` corruption occurs. The remaining edge is scale: labels after 26 civs become non-letters and will not match `/Civ-[A-Z]/`.

### Verdict: REQUEST_CHANGES
Rationale: The parser skips standard header/separator rows and returns `null` for unsupported layouts; empty judge `Map`s are excluded from aggregation; missing skill directories return `null`; and branch syntax checks plus targeted tests passed. However, replay env contamination and CLI interpolation are concrete correctness/security issues, and the current anonymizer does not fully support the advertised blind evaluation.

---

## PR-B: feat/r3-engine-event-contract

### P0 — Merge blockers
- (none) No callable `gemini` provider/backend is present. `judge.mjs` filters it, `backends.mjs` rejects it, and the remaining mentions are policy/test coverage.

### P1 — Should fix this round
- `test/integration-event-contract.test.mjs:41-79` does not shadow every model CLI the engine can spawn. It creates fakes for `claude`, `codex`, `opencode`, and `cc-glm`, but `engine/v5/backends.mjs` can also resolve to `cc-doubao`, `cc-qwen`, `cc-kimi`, `cc-stepfun`, `cc-minimax`, and `cc-mimo`. Because `makeChildEnv()` prepends `fakeBin` but keeps the real `PATH` at `test/integration-event-contract.test.mjs:99`, an accidental route to one of those backends could invoke a real local CLI. Add failing stubs for every `BACKEND_COMMANDS` command and every `JUDGE_PROVIDERS` command, or derive the fake list from the source constants.

### P2 — Defer to R5
- `test/integration-event-contract.test.mjs:109-112` uses `proc.kill()` on timeout, which sends `SIGTERM` to the direct child. That is enough for these simple fake scripts, but a hung shell or child process can survive on macOS. Prefer `SIGKILL` escalation after a short grace period, and consider process-group cleanup for spawned shells.
- `test/integration-event-contract.test.mjs:307-310`, `377-380`, and `475-478` clean temp dirs in `finally`, which is fine for ordinary failures. OOM/SIGKILL will still leak OS-temp directories; acceptable for CI, but an `after()`/`process.on("exit")` cleanup registry would reduce residue on normal interruption.
- `engine/v5/tournament.mjs:44-46` slug matching handles the fake table row `| 1 | tang | 9.0 | ... |`: `nameCell` is `tang`, the regime slug for `china/tang` is `tang`, and `nameCell.includes(slug)` matches. This also means broader strings like `tangut` could match `china/tang`; token/exact normalized matching would be safer if judge output becomes less controlled.

### Verdict: REQUEST_CHANGES
Rationale: The rewritten integration test genuinely isolates `HOME` for the exercised native/codex paths, and I found no evidence of native addons or direct `getpwuid` calls that would bypass `process.env.HOME`. Syntax checks passed, and the isolated integration test passed 19/19. The remaining blocker is the incomplete fake-bin coverage versus the engine's full backend command set.

