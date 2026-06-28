# CivAgent Iteration Plan (Tripartite Collaboration)

> Updated: 2026-05-28 · Current mainline: `main` @ 78ea10e  
> Tripartite division of labor: **Backend = Claude Code** · **Frontend = antigravity** · **Review = Codex** · **Content / long reasoning = Trae (MiMo)**  
> Prohibition rule: invoking Gemini is strictly forbidden in any scenario (including judge, sediment, and agent backend)

---

## Current Status Overview (2026-06-26)

| Status | Details |
|---|---|
| **Core architecture** | The V6 engine is fully deployed, introducing the constitutional engine `[VETO]`, `[IMPEACH]`, `[EDICT]`. Backend and frontend are unified at v6.0.0. |
| **Global multi-agent topology** | Fully expanded to 57 regimes (20 Chinese dynasties + 37 global empires); all data structures, metadata, and IDENTITY prompts have completed their iteration. |
| **Testing and validation** | `test/regime-validator.mjs` upgraded with added mechanism validation. `test/mechanisms.test.mjs` achieves 100% test coverage. |
| **Frontend experience** | The zero-dependency Glassmorphism UI has landed; added RegimeBrowser to browse all regimes; integrated the Live Court real-time court-deliberation dashboard. |

### Completed Feature Checklist

- ✅ **R1 engine**: removed Gemini, fixed concurrency lock, multi-backend routing (backends.mjs), structured event stream (events.mjs), skill sedimentation
- ✅ **R1 frontend**: Dashboard spectating (TerminalPanel + JudgeLeaderboard) + RegimeBrowser + HistoryExplorer + CodexBrowser
- ✅ **R2 engine** (on `feat/r2-backend-eval`): `multi-judge.mjs` (blind-scoring anonymization + multi-provider aggregation), `skill-quality.mjs` (SHA-256 + Jaccard deduplication), `replay.mjs`, `governance-scenarios.json` (10 scenarios)
- ✅ **R3 event contract**: `skill` events structured, structured judge fields in the tournament manifest, integration tests fully isolated (no real CLI invocation)

### Core Gaps

1. **R2 + R3 not yet merged to main** — both the write API and the frontend real-data work depend on these landing first
2. **No write API**: the frontend cannot initiate real matches/tournaments (currently runs sandboxed simulated data)
3. **The governance scenario library has only 10 entries**, lacking scenarios dedicated to Chinese regimes
4. **The `tasks/` directory** is the landing location for each party's R4 task files / review conclusions

---

## R1–R3 Completion Status

| Task | Status | Notes |
|---|---|---|
| B1 Remove Gemini | ✅ | judge.mjs + sediment, no gemini in the full chain |
| B2 Concurrency bug | ✅ | tournament spawns run-v5 directly, no global switch |
| B3 Multi-backend routing | ✅ | backends.mjs, fail-fast design |
| B4 Structured event stream | ✅ | events.jsonl + meta.json + tournament manifest |
| B5 Orchestration-layer tests | ✅ | 51 integration tests, fully isolated |
| B6 Error handling | ✅ | judge retry + sediment failures recorded to meta |
| R2 Multi-judge blind scoring | ✅ (r2 branch) | anonymizePrompt + aggregateJudgements |
| R2 Skill deduplication | ✅ (r2 branch) | SHA-256 + Jaccard 0.6 |
| R2 Match replay | ✅ (r2 branch) | replay.mjs + replayOf lineage |
| R2 prompt-bank | ✅ (r2 branch) | 10 scenarios, pending expansion |
| R3 Event isolation tests | ✅ (r3 branch) | no ~/.civagent contamination, no real CLI |
| Frontend form ① | ✅ | Dashboard + RegimeBrowser + History |
| Frontend forms ②③ | 🚧 | real data not connected, no launch UI |

---

## Round 4 — "Connect · Write API · Content Expansion"

**Overall goal**: upgrade from a demo system to a system that can truly run — the frontend can initiate real tournaments, see real transcript streams, and manage the skill library; the scenario library is expanded to 40+.

### Execution Order (Dependency Chain)

```
① Codex reviews feat/r2-backend-eval          ─┐
② Codex reviews feat/r3-engine-event-contract  ─┤→ outputs tasks/REVIEW-r4-codex.md
                                             ↓
③ Claude Code: cherry-pick both branches → main ─┐
④ Claude Code: write API server               ─┤
                                            ↓ API available
⑤ Antigravity: connect real data + Launch UI   ─┤  (parallel)
⑥ Trae (MiMo): expand governance-scenarios     ─┘
```

---

## Each Party's Tasks (R4)

> See the corresponding files under the `tasks/` directory for detailed prompts.

---

### Codex Task (tasks/TASK-r4-codex.md)

Review feat/r2-backend-eval and feat/r3-engine-event-contract, and issue a merge permit.

**PR-A: feat/r2-backend-eval** (R2 engine) — focus on:
1. `anonymizePrompt`: prefix-overlap safety (is `jin-jurchen` vs `jin` truncated correctly; replace in descending order of length)
2. `parseScoreTable`: are all three table formats (single score / three-dimensional score / no Rank column) fully covered, and are boundary rows (separator lines) skipped?
3. `aggregateJudgements`: defensive logic when providers / scores are empty
4. `skill-quality.mjs`: is the Jaccard threshold 0.6 too low (it may falsely kill substantially different skills); does `normalizeSkill` strip the provenance banner?
5. `replay.mjs`: does the `replayOf` field prevent replay loops (what happens if you replay consecutively)?
6. Repo-wide `grep -ri gemini engine/ bin/ test/` — confirm there are no residual invocations

**PR-B: feat/r3-engine-event-contract** (test isolation) — focus on:
1. `makeFakeBin`: does it cover all real CLIs (claude/codex/opencode/cc-glm)? Any omissions?
2. HOME isolation: does `os.homedir()` read `process.env.HOME` on macOS (it should on Node.js 18+), or does it go through `getpwuid`?
3. Deterministic tournament assertions (`j.provider === "codex"`, `j.scores[0].score ≈ 9.0`): these depend on the fake codex heredoc format — could heredoc variable expansion break the table?
4. Cleanup logic: does the `finally` block cover all failure paths (especially the timeout case)?

**Output format** (written to `tasks/REVIEW-r4-codex.md`):
```markdown
## PR-A (r2-backend-eval) review conclusion
### P0 (must fix before merging)
### P1 (recommended fix, within this round)
### P2 (handle next round)
### Conclusion: APPROVE / REQUEST_CHANGES

## PR-B (r3-engine-event-contract) review conclusion
(same format as above)
```

---

### Claude Code Task (Backend R4)

**Step 1: Merge the R2 engine into main** (after Codex APPROVE)

Cherry-pick the following files (engine only, excluding the frontend-rollback diff):
```
engine/v5/multi-judge.mjs
engine/v5/skill-quality.mjs
engine/v5/replay.mjs
engine/prompts/governance-scenarios.json
test/multi-judge.test.mjs
test/skill-quality.test.mjs
test/replay.test.mjs
bin/civagent  (the newly added --multi-judge / --prompt-bank / replay / skills --stats parts)
```
Acceptance: `npm test` all green, target ≥ 90 tests.

**Step 2: Merge the R3 test isolation into main**

Cherry-pick `test/integration-event-contract.test.mjs` (from 5697e39).

**Step 3: Write the API server** (`server/index.mjs`, Node built-in http, zero external dependencies)

Endpoint list:
```
GET  /api/regimes                    → list of 57 regimes (id / name / metadata)
GET  /api/regimes/:id                → single regime details
GET  /api/matches                    → summary of the most recent 50 meta.json
GET  /api/matches/:id/events         → events.jsonl → JSON array
GET  /api/matches/:id/meta           → meta.json
GET  /api/tournaments                → manifest list
GET  /api/tournaments/:id/manifest   → single manifest.json
POST /api/tournament                 → {civs, task, backend?, multiJudge?, judgesN?}
                                        → returns {tournamentId} immediately (async spawn)
GET  /api/skills/:regime             → skill list + analyzeSkillsDir statistics
GET  /api/scenarios                  → governance-scenarios.json
```

Security requirements:
- All path parameters go through `safeResolve` (reuse the SAFE_ID logic from `engine/v5/events.mjs`)
- POST body size cap of 32 KB; civs list of at most 8; task at most 2000 characters
- POST /api/tournament spawns tournament.mjs in the background, without waiting for it to finish

**Step 4: Update package.json**
```json
"serve":   "node server/index.mjs",
"dev:all": "concurrently \"npm run serve\" \"npm run dev\""
```
(if concurrently is not present, run `npm i -D concurrently`)

Acceptance: `npm run serve` starts; curl can hit all GET endpoints; POST /api/tournament returns a tournamentId and genuinely runs in the background.

---

### Antigravity Task (tasks/TASK-r4-antigravity.md)

**Prerequisite**: the API server (Step 3) is available, and vite.config has proxied `/api → http://localhost:4242`.

**Task 1: Connect real data**
- `App.tsx`: on mount, `GET /api/regimes`; on receiving data → real mode, on failure → DEMO sandbox mode (a prominent "DEMO" badge added to the UI)
- `HistoryExplorer`: poll `GET /api/matches`; click into each entry to call `GET /api/matches/:id/events`

**Task 2: Tournament Launcher** (new component `TournamentLauncher.tsx`)
- Multi-select civs: loaded from `GET /api/regimes`, at most 6
- Select task: text input OR click "Random" to pick one at random from `GET /api/scenarios`
- Select backend: dropdown (`native` / `cn:doubao` / `cn:glm`)
- Toggle: Multi-Judge (toggle, N = 2)
- Submit → `POST /api/tournament` → obtain tournamentId → switch to Dashboard, begin polling
- Error handling: display a clear message when the server is unavailable, without crashing

**Task 3: Real-time event stream**
- Change `TerminalPanel` to poll `GET /api/matches/:id/events` every 1.5s
- Append new events (seq > lastSeq) to local state
- On a `match_end` event → stop polling, display "Completed"
- On a `skill` event → display a skill sedimentation badge at the bottom of the terminal

**Task 4: Skill Library tab** (new component `SkillLibrary.tsx`)
- Left column: regime list
- Right column: `GET /api/skills/:regime`
  - Each skill: filename, frontmatter name, time, size
  - Duplicate groups marked ⚠️ Duplicate
  - Top stats badge: total / unique / dup-groups

**Constraints**:
- TypeScript strict, no `any` in new code
- loading / error states are both indispensable
- Do not change the internal logic of CodexBrowser / RegimeBrowser

**Acceptance**: `npm run dev:all` starts; manually run one 2-civilization match; the frontend's full flow (select civs → Submit → view transcript → view leaderboard) is navigable, with no console errors.

---

### Trae (MiMo) Task (tasks/TASK-r4-trae.md)

**Goal**: expand `engine/prompts/governance-scenarios.json` from 10 entries to 40, adding 30 new high-quality scenarios.

**Distribution requirements**:
- **Chinese-regime-specific × 10** (one entry for each of the following topics):
  Silk Road trade disruption, disputes over civil-examination reform, collapse of the grain-transport system, regional military separatism and loss of central control, eunuch-faction interference in government, Yellow River breaches and disaster relief, crisis of the frontier-market and tributary system, corruption in the salt-and-iron state monopoly, power struggle between the military aristocracy and the civil-official bloc, ritual-law conflicts over imperial succession
- **Global-regime general × 20**:
  War-financing crisis, colonial independence movement, religious-institution reform, instability during the transition to slavery abolition, federal dissolution and fragmentation, currency devaluation and inflation, gender disputes in inheritance law, autonomy rights of border trade cities, naval blockade and diplomatic pressure, industrialization's shock to traditional handicrafts, internal and external pressures of a grain-export ban, refugee-influx policy, espionage defection and intelligence crisis, resistance to education-system reform, contention over water resources and cross-provincial conflict, legitimacy reconstruction after a military coup, debt default and foreign-debt negotiation, resistance to cultural-assimilation policy, urban poverty and class tension, blame attribution after a natural disaster

**Format requirements**:
```json
{
  "id": "silk-road-01",
  "category": "economic",
  "prompt": "The primary overland trade route has been severed by a hostile coalition..."
}
```
- `id`: `<kebab-case-topic>-01`, all lowercase, hyphenated
- `category`: one of `military` / `political` / `economic` / `social` / `crisis` / `diplomacy` / `internal` / `innovation`
- `prompt`: English, 60–150 words, **does not mention specific dynasties/place names**, general enough for any regime to respond
- After merging, the JSON array totals 40 entries, in valid format (`JSON.parse` does not error)

**Output**: directly overwrite `engine/prompts/governance-scenarios.json`.

---

## Technical Constraints (Common to All Rounds)

| Rule | Description |
|---|---|
| Disable Gemini | Any scenario, any provider chain |
| Git workflow | Before a PR, you must `git fetch + rebase` then push, to avoid divergence |
| Test threshold | `npm test` must be all green before merging; new modules must have accompanying tests |
| Path safety | All user-input paths go through `safeResolve`; `..` traversal is forbidden |
| Frontend typing | TypeScript strict, no `any` in new code |
| Async write API | POST returns the id immediately, spawns in the background, and does not block the HTTP response |
| Review order | Merging requires a Codex APPROVE; non-compliant work is bounced back, at most 2 rounds |

---

## Milestones

| Round | Backend | Frontend | Content | Completion Marker |
|---|---|---|---|---|
| **R4** ← current | Merge R2/R3 + write API server | Real data + Launch UI + Skill library | 40 scenarios | UI full flow can run a real tournament |
| **R5** | Regime-editing API + historical-fact review in the loop | Online regime editing + skill management | Historical-fact revision of the top 20 regimes | Full-featured management console |

---

_Single source of truth for the tripartite collaboration. Each party reads this file before starting, and leaves a review conclusion or output path in `tasks/` upon completion._
