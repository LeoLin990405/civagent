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
