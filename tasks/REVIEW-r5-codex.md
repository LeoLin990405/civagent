## PR #29 review conclusion

### P0 (must fix before merging)

None found.

### P1 (recommended fix, within this round)

1. `engine/v5/judge.mjs:61-80`, `engine/v5/tournament.mjs:370-380`, `regimes/china/tang/IDENTITY.md:33-47` — `--anon-civs` still leaks regime identity through agent IDs and role names inside transcripts. Trigger: run a blinded tournament with `china/tang` and any other civ, and let the Tang transcript mention `zhongshu`, `menxia`, `shangshu`, `libu_ritual`, or the corresponding office labels. `anonymizeCivs()` only replaces regime id, slug, and metadata display names; `transcriptSection()` then passes the remaining role-specific text to the judge. Impact: blind judging is materially weakened because the judge can map those agent IDs/office names back to Tang/Ming/Song-style regimes. Fix: extend anonymization variants from each regime's Agent ID table and topology node ids/labels, or replace all speaker/role labels with neutral per-civ role labels before building judge prompts.

2. `server/routes/tournaments.mjs:17-18`, `server/routes/tournaments.mjs:66-82`, `server/routes/tournaments.mjs:95-99`, `engine/v5/backends.mjs:12-24` — write API accepts syntactically valid but unknown backends. Trigger: `POST /api/tournaments` with `{"civs":["china/tang"],"backend":"notreal","task":"x"}` or `{"civs":["china/tang#notreal"],"task":"x"}`. `BACKEND_RE`/`CIV_RE` pass, the route returns `202`, and only the detached child later fails in `resolveBackend()`. Impact: the advertised hard validation is not true; clients get an accepted tournament id for a run that cannot execute, with the failure hidden in background logs. Fix: validate both shared `backend` and per-civ `#backend` with `isKnownBackend()`/`BACKEND_COMMANDS` before spawning.

3. `engine/v5/events.mjs:62-74`, `engine/v5/replay.mjs:53-63` — replay lineage IDs are not path-safe. Trigger: create a damaged `meta.json` whose `replayOf` is `../../../../tmp/civagent-replay-root`, with `/tmp/civagent-replay-root/meta.json` present, then replay the damaged match; or invoke `civagent replay ../../../../tmp/civagent-replay-root` directly. `readMatchMeta()` reaches `metaPath()`, which uses `path.join(ROOT, "matches", matchId)` and `matchDir()` creates that path before reading. Impact: the `seen` set prevents infinite loops, but a corrupted lineage can read meta outside `~/.civagent/matches` and drive a replay from attacker-chosen metadata. Fix: validate match IDs and `replayOf` with the same safe segment rules used by the server, and split read paths from mkdir-on-write paths.

### P2 (handle next round)

1. `engine/v5/skill-sediment.mjs:163-178` — duplicate detection runs before injection scanning. Trigger: an extracted skill that is near-duplicate of an existing benign skill but adds `ignore previous instructions` is rejected at `findDuplicate()` and never reaches `scanSkillText()`. Impact: this is fail-closed for persistence, so I do not consider it a supply-chain bypass, but scan telemetry/diagnostics will not record the injection attempt. Fix: run the static scan before duplicate rejection, or attach scan findings to duplicate rejections.

Checked, no issue found: `engine/v5/tournament.mjs:429-484` plus `aggregateJudgePasses()` at `engine/v5/tournament.mjs:180-208` are pass-weighted, not provider-slot-weighted. If one provider succeeds for only one swap pass and another succeeds for two, the failed provider contributes exactly one completed pass; empty/unparseable passes do not add scores. This matches the in-code "all passes pool into one aggregate" contract.

Checked, no issue found: `server/routes/tournaments.mjs:95-99` passes `--civs` and `task` as argv entries to `spawn()`, not through a shell, and the civ/backend regexes reject commas and path separators, so I found no argv-escape path through comma-join itself.

Checked, no issue found: `regimes/china/tang/topology.json:5-31` matches the `IDENTITY.md:43-49` flow: Zhongshu drafts, Menxia reviews/vetoes, Shangshu dispatches to the six ministries, and ministry results report back to Shangshu.

### Conclusion: REQUEST_CHANGES

## PR #30 review conclusion

### P0 (must fix before merging)

None found.

### P1 (recommended fix, within this round)

1. `server/services/regimes.mjs:77-98`, `server/services/regimes.mjs:103-110`, `test/routes-regimes.test.mjs:153-176` — the regime catalog cache is invalidated only by the top-level `regimes/` directory mtime, not by the files it serves. Trigger: request `GET /api/regimes` once, then edit `regimes/china/tang/metadata.json`, `IDENTITY.md`, `SOUL.md`, or add/remove `regimes/china/tang/skills/*.md`, then request `GET /api/regimes` again in the same server process. The root directory mtime does not change for nested file edits, so stale data is served indefinitely until process restart or manual `invalidateRegimeCache()`. Impact: this breaks the "behavior zero changes" claim for live regime/skill edits and can make the launcher/browser show stale metadata, identity, soul, and learned skills. Fix: key the cache by a recursive fingerprint over served files and skill directories (mtimeMs + size is enough), or cache per regime and invalidate on known write paths; do not rely on root mtime.

### P2 (handle next round)

1. `server/services/regimes.mjs:93-95`, `server/services/regimes.mjs:103-110` — `?summary=1` is response-light but not cold-cache I/O-light. Trigger: first request after process start is `GET /api/regimes?summary=1`; `cacheEntry()` still calls `readRegimeTree()`, which reads every `IDENTITY.md`, `SOUL.md`, and `skills/*.md`, then maps them away. Impact: the endpoint reduces payload size but not first-hit latency or disk load, which is the main stated reason for adding summary mode. Fix: add a separate summary tree reader that reads only `metadata.json`, or lazily fill `full` only when the full endpoint is requested.

Checked, no issue found: `engine/v5/tournament.mjs:21-46` preserves the exported tournament API by re-exporting moved rubric/grading symbols, and the moved `judge-rubric.mjs` / `deterministic-grading.mjs` implementations match the PR #29 behavior I inspected.

Checked, no issue found: `server/routes/matches.mjs:47-122` and `server/routes/history.mjs:16-87` preserve the inspected status codes and `{ error }` response shape while adding injectable `rootDir`; I did not find a non-happy-path response regression there.

Checked, no issue found: the cache itself has no in-process data race because all reads and cache replacement are synchronous in one Node event loop. The relevant concurrency/multi-process problem is stale independent process-local caches, covered by the P1 invalidation issue.

### Conclusion: REQUEST_CHANGES

---

## Re-review (round 2)

## PR #29 review conclusion

### P0 (must fix before merging)

None found.

### P1 (recommended fix, within this round)

None remaining. The three prior P1s are closed:

1. Closed: `engine/v5/judge.mjs:77-118`, `test/judge-anon-multi.test.mjs:45-78` now blind topology node ids, topology labels, bare parenthetical-stripped labels, and Agent IDs from `IDENTITY.md`. Trigger from the prior review (`zhongshu`, `menxia`, `shangshu`, `libu_*`, `shoufu`, `silijian`) no longer survives `anonymizeCivs()`. Impact: the direct role-name leak is fixed while one actor still maps to one stable `Civ-A-Rn` slot.

2. Closed: `server/routes/tournaments.mjs:70-93` now rejects unknown shared and pinned backends before spawning. Empty `#`, multiple `#`, and `#` with no backend are rejected by `CIV_RE` at `server/routes/tournaments.mjs:18`; no comma or shell escape reaches `--civs` because spawn receives argv entries directly at `server/routes/tournaments.mjs:113-118`.

3. Closed: `engine/v5/replay.mjs:23-31`, `engine/v5/replay.mjs:87-93` validate both caller ids and disk-read `replayOf` ids before `metaPath()`. `"."`, `".."`, `"..."`, slash, backslash, and any id containing `".."` are rejected. `newReplayId()` at `engine/v5/replay.mjs:41-46` starts with `replay-` and replaces unsafe original-id prefix chars, so generated ids satisfy the safe-id contract.

### P2 (handle next round)

1. Existing P2 remains: `engine/v5/skill-sediment.mjs:163-178` still runs duplicate detection before injection scanning. This is fail-closed for persistence, but telemetry still misses near-duplicate injection attempts.

2. Non-blocking contract mismatch: `server/routes/tournaments.mjs:70-93` validates backends with exact `BACKEND_COMMANDS` keys, while `engine/v5/backends.mjs:43-49` accepts case-insensitive backend ids via `toLowerCase()`. Trigger: `POST /api/tournaments` with `backend:"NATIVE"` or `civs:["china/tang#CN:GLM"]` returns 400 even though the engine resolver would accept it. Impact: stricter API than engine, not an escape or security issue. Fix: either document canonical lowercase-only API ids or reuse `isKnownBackend()`/normalization from `engine/v5/backends.mjs`.

Checked, no issue found: `engine/v5/tournament.mjs:429-484` plus `aggregateJudgePasses()` at `engine/v5/tournament.mjs:180-208` still pool completed passes only. A provider that succeeds one swapped pass and fails the next contributes exactly one completed pass; failed/unparsed passes do not add scores or denominator weight.

Checked, no issue found: the role-slot `Civ-A-R10` / `Civ-A-R1` prefix concern does not corrupt scoring because transform variants are sorted longest-first at `engine/v5/judge.mjs:120-126`. `detransform()` at `engine/v5/judge.mjs:129-133` can render role labels in verdict prose as `china/tang-Rn`, but that is post-parse human text and not a scoring leak.

Checked, no issue found: semantic fingerprints such as SOUL wording, mode names, tags, and agent counts are not directly injected into the judge header by `transcriptSection()` at `engine/v5/tournament.mjs:370-380`; only transcript/log content remains, which cannot be fully blinded without removing the governance behavior being judged.

### Conclusion: APPROVE

## PR #30 review conclusion

### P0 (must fix before merging)

None found.

### P1 (recommended fix, within this round)

None remaining. The prior cache P1 is closed: `server/services/regimes.mjs:63-99` fingerprints served files recursively using path, `mtimeMs`, and size; `server/services/regimes.mjs:145-164` rebuilds summary/full cache entries when that fingerprint changes. The tests at `test/services-regimes-cache.test.mjs:44-84` cover nested body edits, metadata edits, skill add/remove, and new regimes; `test/services-regimes-cache.test.mjs:98-117` also closes the prior summary cold-read P2 by asserting markdown bodies are not read for `?summary=1`.

### P2 (handle next round)

1. `frontend/src/components/TournamentLauncher.tsx:31-35`, `frontend/src/components/TournamentLauncher.tsx:167-190`, `server/services/regimes.mjs:125-128`, `test/routes-regimes.test.mjs:99-102` - Launcher treats `/api/regimes?summary=1` rows as `RegimeMetadata[]`, but the endpoint contract is `{ id, metadata }[]`. Trigger: open Tournament Launcher; `r.id` works, so selection and POST `civs` are correct, but `r.name` is undefined, so the primary label falls back to `china/tang` and the secondary line also shows `china/tang` instead of `Tang Dynasty` plus id. Impact: display regression only, not a launch correctness bug. Fix: introduce the same `RegimeSummary` shape used by `SkillLibrary.tsx` and read `r.metadata.name`.

2. Documented cache blind spot remains: `server/services/regimes.mjs:80-97` cannot detect a deliberate same-size rewrite whose `mtimeMs` is restored to the old value, for example with `fs.utimesSync()`. Impact is stale catalog until the next detectable change or `invalidateRegimeCache()`. This is not a normal editor/write-path failure and is acceptable as P2.

Checked, no issue found: `server/routes/skills.mjs:21-25` and `server/services/skills.mjs:75-120` use `safeResolve()` for `region/id`, reuse `analyzeSkillsDir()`, normalize missing date stats to null/0, and preserve 200+empty for regimes with no `skills/` dir. The tests at `test/routes-skills.test.mjs:66-188` cover happy path, empty skills, 404, traversal/bad ids, duplicate groups, and missing metadata fields.

Checked, no issue found: `frontend/src/components/SkillLibrary.tsx:20-73` consumes the summary endpoint with the correct `{ id, metadata }` shape. Real metadata files include `region`, for example `regimes/china/tang/metadata.json:5` and `regimes/global/athens/metadata.json:5`, so the China/Global grouping is populated.

Checked, no issue found: the service cache has no in-process race in the inspected code path because directory scan, fingerprinting, reads, and cache replacement are synchronous in one Node event loop. Multi-process servers keep independent caches, but each process recomputes the recursive fingerprint on request.

### Conclusion: APPROVE
