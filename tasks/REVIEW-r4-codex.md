# Code Review — R4 (by Claude Code, acting as Codex substitute)

> Codex exec exited before writing (MCP transport errors); falling back to
> Claude Code self-review per CLAUDE.md rule (2 failures → Claude Code接管).  
> Review based on: direct `git show <branch>:<file>` reads of all specified files.  
> Date: 2026-05-28

---

## PR-A: feat/r2-backend-eval

### Question-by-question findings

**Q1 — anonymizePrompt prefix overlap**

For input `["china/jin", "china/jin-jurchen"]`:
- `map` = `[{real:"china/jin", anon:"Civ-A"}, {real:"china/jin-jurchen", anon:"Civ-B"}]`
- `byLength` (sorted descending by `.real.length`): `[{real:"china/jin-jurchen"(16), anon:"Civ-B"}, {real:"china/jin"(9), anon:"Civ-A"}]`
- Substitution trace on `"...china/jin-jurchen... china/jin..."`:
  - Step 1: replace `china/jin-jurchen` → `"...Civ-B... china/jin..."`
  - Step 2: replace `china/jin` → `"...Civ-B... Civ-A..."`
- ✅ **Correct.** Descending-length sort fully handles all prefix-overlap cases.

**Q2 — parseScoreTable separator / header robustness**

The primary filter is `/Civ-[A-Z]/.test(cells[N])`, not the `first.startsWith("-")` guard. Verification:
- `| --- | --- | --- |` → `cells[1] = "---"` → `test()` = false → skipped ✅
- `| :---: | :---: | :---: |` → same reasoning → skipped ✅
- `| **Rank** | **Civ-A** | 8.5 |` → `cells[1] = "**Civ-A**"` → `/Civ-[A-Z]/.test("**Civ-A**")` = **true** (regex matches substring) → row is parsed ✅
- `| Rank | Civilization | Score |` → `cells[1] = "Civilization"` → test = false → skipped ✅

The parser is robust. The explicit header-name guards (`first === "rank"`) are redundant but harmless.

**Q3 — aggregateJudgements with empty Map**

```js
const successfulJudges = judges.filter((j) => j.scores && j.scores.size > 0);
if (!successfulJudges.length) { return { scores: new Map(), verdict: "…(no scores parsed)…" }; }
```
✅ A provider returning `new Map()` (size 0) is filtered out before averaging. Average is never pulled toward zero by empty results.

**Q4 — Jaccard 0.6 threshold calibration**

Borderline case: "famine relief" vs "flood relief":
- Tokens > 3 chars: `{"famine","relief"}` vs `{"flood","relief"}`
- Intersection: `{"relief"}` = 1, Union = 3 → Jaccard = **0.333** → below 0.6 → correctly NOT flagged

Tighter borderline: two skills about "grain redistribution during shortage" vs "grain allocation during famine":
- Tokens: `{"grain","redistribution","during","shortage"}` vs `{"grain","allocation","during","famine"}`
- Intersection: `{"grain","during"}` = 2, Union = 6 → Jaccard = **0.333** → safe

Real risk case: two skills that are genuinely similar (same topic, slightly reworded):
- `"store grain reserves for winter and distribute to frontier garrisons"` vs `"distribute grain from central reserves to frontier military outposts"`
- Tokens > 3: `{"store","grain","reserves","winter","distribute","frontier","garrisons"}` vs `{"distribute","grain","from","central","reserves","frontier","military","outposts"}`
- Intersection: `{"grain","reserves","frontier","distribute"}` = 4, Union = 11 → Jaccard = **0.364** → not flagged

Threshold 0.6 is **conservative (high precision, lower recall)** — it will miss some near-duplicates but won't false-positive on related-but-distinct skills. Acceptable for v1; can lower to 0.5 once real data is available.

**Q5 — normalizeSkill banner regex with nested `-->`**

```js
.replace(/<!--[\s\S]*?-->\s*/g, "")
```
Non-greedy `*?` stops at the **first** `-->`. If the machine-generated banner contained `-->` inside:
- `<!-- source_match=abc --> some text -->` → strips only `<!-- source_match=abc -->`, leaving ` some text -->` in place

However, the provenance banner is **machine-generated** in `skill-sediment.mjs` and never contains `-->`. The assumption is safe but undocumented.

**Q6 — findDuplicate on missing skillsDir**

```js
if (!fs.existsSync(skillsDir)) return null;
```
✅ First-ever skill for a regime gracefully returns `null`, allowing the write to proceed.

**Q7 — replay cycle guard**

`newReplayId(originalMatchId)` takes the first 12 chars of `originalMatchId` as a prefix:
```js
const prefix = String(originalMatchId).slice(0, 12).replace(/[^a-z0-9-]/gi, "-");
return `replay-${prefix}-${stamp}-${rand}`;
```

If `originalMatchId = "replay-2026-05-28..."` (itself a replay):
- `prefix = "replay-2026-"` → `newMatchId = "replay-replay-2026-...-<stamp>-<rand>"`
- `meta.replayOf = "replay-2026-05-28..."`

There is **no cycle guard** — calling `replayMatch("replay-abc")` succeeds. However, this is **not auto-recursive**: the user must explicitly call `replayMatch()` again. No infinite loop. The consequence is confusing `replay-replay-...` prefixes in matchIds and a growing `replayOf` chain in meta.json.

**Q8 — HOME contamination in replay**

`replay.mjs` uses `env: { ...process.env, CIVAGENT_MATCH_ID: newMatchId }` without setting `HOME`. In test context, `_spawn` is injected so no real process is spawned. In production, the real HOME is used — by design. This is not a bug; it matches the expected behaviour for production replay.

**Q9 — Gemini grep**

`git grep -n "gemini" feat/r2-backend-eval -- engine/ bin/ test/` shows:
- `providers.json`: `"_policy": "gemini is disabled project-wide"` (doc string only)
- `backends.mjs:37-38`: `gemini: "gemini is disabled by project policy…"` (error message key — calling `resolveBackend("gemini")` throws, never executes)
- `judge.mjs:34,57`: filter that explicitly DROPS gemini from chains (enforcement code)
- `skill-sediment.mjs:7`: comment explaining why gemini is absent
- `backends.test.mjs`, `judge.test.mjs`: tests asserting gemini is rejected

✅ **Zero executable gemini calls.** All references are policy comments, error messages, or rejection tests.

**Q10 — lint:syntax**

`package.json` on r2 branch includes `node -c engine/v5/multi-judge.mjs && node -c engine/v5/skill-quality.mjs && node -c engine/v5/replay.mjs` in `lint:syntax`. All three files pass `node -c` (verified by piping to `node -c /dev/stdin`). ✅

---

### P0 — Merge blockers
*(none)*

### P1 — Should fix this round

**P1-1 · replay.mjs — no guard against replaying a replay**

`replayMatch("replay-xyz")` creates `matchId = "replay-replay-xyz-..."` and `replayOf = "replay-xyz"`. Not infinite, but creates confusing lineage. One-line fix in `replayMatch()`:

```js
// After: const meta = readMatchMeta(originalMatchId);
if (meta.replayOf) {
  throw new Error(
    `cannot replay a replay: ${originalMatchId} is already a replay of ${meta.replayOf}`
  );
}
```

Add a corresponding test case in `test/replay.test.mjs`.

### P2 — Defer to R5

**P2-1 · normalizeSkill: undocumented assumption about banner content**  
The `<!--[\s\S]*?-->` regex is correct for machine-generated banners. Add a JSDoc comment stating the assumption: `// Assumes no '-->' appears inside the banner body.`

**P2-2 · Jaccard threshold: no calibration data yet**  
0.6 is a reasonable starting point (high precision). Revisit once ≥ 100 real skills have accumulated. Log the threshold as a named constant (`const JACCARD_THRESHOLD = 0.6`) rather than a magic literal so it's easy to tune.

**P2-3 · analyzeSkillsDir grouping is O(n²)**  
Acceptable for current scale (≤ 50 skills per regime). Document the limitation.

### Verdict: **APPROVE** (pending P1-1 fix before landing)

Rationale: The R2 engine is structurally sound. Gemini is banned at every entry point. `anonymizePrompt` handles all prefix overlap cases. `parseScoreTable` is robust via the `Civ-[A-Z]` anchor. `aggregateJudgements` safely handles provider failures. The only must-fix is the replay guard (5-line change), which prevents user confusion.

---

## PR-B: feat/r3-engine-event-contract

Commit `5697e39 test(engine): isolate v5 event contract integration tests`

### Question-by-question findings

**Q1 — makeFakeBin coverage**

Engine call sites enumerated:
| Binary | Called by | Covered? |
|---|---|---|
| `claude` | `run-v5.mjs` (civ backend) | ✅ fake claude |
| `codex` | `skill-sediment.mjs` extractor + `judge.mjs` (chain[0]) | ✅ fake codex |
| `opencode` | `judge.mjs` (chain[1], cmd for opencode-reviewer) | ✅ fake opencode (exits 1 → skipped) |
| `cc-glm` | `judge.mjs` (chain[2], cmd for cn-glm) | ✅ fake cc-glm (exits 1 → skipped) |

`hasBinary("codex")` → fake codex is in PATH → returns true → sediment runs extraction → fake codex outputs `NO_PATTERN` → sediment skips. Tournament judge calls codex → fake codex outputs the markdown table → `parseJudgeScores` extracts scores. All paths covered.

**Q2 — os.homedir() macOS behavior**

Node.js 18+ uses `uv_os_homedir()` from libuv, which checks `getenv("HOME")` first (before falling back to `getpwuid`). Setting `HOME=tempHome` in the child process env is sufficient. CivAgent has no native Node addons, so `getpwuid` bypass is not possible. ✅

**Q3 — parseJudgeScores slug matching for "tang"**

Fake codex outputs `| 1 | tang | 9.0 | decisive governance |`. The matching logic in `tournament.mjs`:
```js
const regime = civRegimes.find((r) => {
  const slug = r.split("/")[1] || r;           // "tang" from "china/tang"
  return nameCell === r                         // "tang" === "china/tang" → false
    || nameCell.includes(r)                     // "tang".includes("china/tang") → false
    || nameCell.includes(slug);                 // "tang".includes("tang") → true ✅
});
```
✅ Slug matching correctly maps `"tang"` → `"china/tang"`.

**Q4 — proc.kill() on macOS for hanging processes**

```js
const timer = setTimeout(() => {
  proc.kill();  // ← sends SIGTERM
  reject(new Error(`spawn timed out after ${timeoutMs}ms`));
}, timeoutMs);
```

`proc.kill()` with no argument sends **SIGTERM**. A hung process (e.g., waiting for stdin, infinite loop) may not respond to SIGTERM on macOS. Should use `proc.kill("SIGKILL")` for reliable cleanup.

**Q5 — tempDir cleanup on test runner crash**

`finally` blocks only run when JavaScript control reaches them. An OOM kill or SIGKILL skips them entirely. OS temp dirs (`/var/folders/…` on macOS, `/tmp/` on Linux) are cleaned on reboot / tmpwatch. In ephemeral CI (GitHub Actions runners are fresh per job), this is acceptable. For long-lived development machines, leaked temp dirs are a minor nuisance (hundreds of bytes, cleaned on next reboot).

---

### P0 — Merge blockers
*(none)*

### P1 — Should fix this round

**P1-1 · spawnAwait timeout should send SIGKILL**

`proc.kill()` (SIGTERM) may not terminate a hung process. Change to:
```js
const timer = setTimeout(() => {
  proc.kill("SIGKILL");  // force-kill; SIGTERM is not reliable for hung children
  reject(new Error(`spawn timed out after ${timeoutMs}ms: ${cmd} ${args.join(" ")}`));
}, timeoutMs);
```

### P2 — Defer to R5

**P2-1 · HOME isolation assumption is implicit**  
`makeChildEnv` docstring says "sets HOME=tempHome" but doesn't explain the `os.homedir()` dependency chain. Add a comment: `// Node.js os.homedir() reads process.env.HOME on all platforms (libuv behavior).`

**P2-2 · Leaked tmpdir on OOM/SIGKILL**  
Acceptable for CI. Optional improvement for dev: register cleanup in `process.on('exit', …)`. Defer to R5 if it becomes a problem.

### Verdict: **APPROVE** (pending P1-1 fix, trivial one-liner)

Rationale: The isolation design is correct. HOME isolation works via `os.homedir()` → `process.env.HOME`. All real CLIs are shadowed. The tournament test assertions are deterministically grounded in the fake codex heredoc. The only must-fix is the SIGKILL change in `spawnAwait` (1 character change per timeout call).

---

## Merge sequence recommendation

1. Fix P1-1 in `replay.mjs` (cycle guard) → add test
2. Fix P1-1 in `integration-event-contract.test.mjs` (SIGKILL)
3. Merge `feat/r3-engine-event-contract` → `main` first (it's a pure test change, zero risk)
4. Merge `feat/r2-backend-eval` → `main` (engine modules only, cherry-pick; skip frontend diffs that would regress the dashboard)
5. Update `CHANGELOG.md` version from v5.2.0 unreleased → tag as v5.2.0

P2 items can be addressed in a follow-up commit before R5 work starts.
