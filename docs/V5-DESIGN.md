# CivAgent v5 — Learning Loop (Hermes-Inspired)

## Goal
v4 is fully stateless per match. v5 introduces a **cross-match learning loop** so a
civilization accumulates governance experience over successive matches.

Inspiration: three core ideas from NousResearch/hermes-agent
1. Autonomous skill creation (experience sediments into reusable skills)
2. Agent-curated memory (per-civilization memory isolation)
3. Cross-session recall (drawing on historical wisdom across matches)

## New modules (engine/v5/)

### 1. `civ-memory.mjs` — per-civilization memory isolation
- Each regime owns its HOME: `~/.civagent/envs/{region}-{id}/`
- Containing a `.claude/` subtree → each civilization has its own CLAUDE.md, skills, memory
- Cross-match persistence: the HOME survives match end and is reused by the next match of the same civilization
- Contrast with v4: all regimes shared the current `$HOME` and contaminated each other

### 2. `skill-sediment.mjs` — experience sedimentation
After a match:
```
main CC → read the transcript (structured event stream events.jsonl)
       → call codex exec to extract "governance lessons"
       → injection guard + frontmatter gate (deterministic, before audit)
       → independent audit via judge.mjs (opencode reviewer → codex fallback, never gemini)
       → write regimes/<civ>/skills/learned-<YYYY-MM-DD>-<topic>-<matchId>.md
```
Skill file format (compatible with the agentskills.io convention):
```yaml
---
name: tang-secretariat-chancellery-draft-arbitration
type: learned
civ: china/tang
source_match: 2026-04-14-001
description: A three-round rebuttal template for when a Secretariat (Zhongshu) draft conflicts with Chancellery (Menxia) review
---
```

### 3. `run-v5.mjs` — new entry point
Wraps v4's `regime-to-cc.mjs` output; before launching CC it:
1. Sets `HOME=~/.civagent/envs/<regime>/`
2. Loads `regimes/<civ>/skills/*.md` into CC's skill list
3. Writes every match message to the structured event stream `~/.civagent/matches/<match-id>/events.jsonl` (plus `meta.json`; schema in `schemas/match-event.schema.json`)
4. Triggers `skill-sediment.mjs` on exit

## MVP scope (validate the loop first)
Four contrasting civilizations:
- `china/tang` — checks-and-balances (Opus drafter + Codex reviewer)
- `china/qin` — centralized (single Opus, no review)
- `global/athens` — democratic (3 models voting in parallel: Opus/Codex/MiMo)
- `global/roman-republic` — checks-and-balances (a foil for Tang)

Validation metric: run the same prompt 5 times and observe whether `skills/learned-*.md`
shows recurring governance patterns, and the trend in the judge's (Codex via judge.mjs)
"governance quality" scores.

## Agent Teams orchestration
Create team `civagent-v5`:
- `team-lead` (sonnet) — judge + prompt-setter
- `civ-tang` (opus) — Tang coordinator, sediments skills to china/tang
- `civ-qin` (cc-doubao) — Qin coordinator
- `civ-athens` (cc-glm) — Athens coordinator (gemini removed per project policy; GLM supplies a third model family)
- `civ-rome` (codex) — Rome coordinator

team-lead dispatches the same prompt to the 4 civs via the inbox; each runs to completion
in its isolated HOME and reports back.

## CLI changes
```bash
civagent run --v5 "prompt..."        # enable the learning loop
civagent skills <regime>             # view the skills a civilization has accumulated
civagent match-log                   # list past matches
civagent tournament --civs a,b,c,d   # launch an Agent Team match
```

## Compatibility with v4
v5 is **opt-in** (the `--v5` flag). Without the flag, v4 behavior is fully preserved.
The `regimes/` layout is unchanged; only an optional `regimes/<civ>/skills/` subdirectory is added.

## Known design limitations (from the Kimi review)
1. **Institutional-complexity compression**: mapping a whole dynasty/polity onto a single
   agent's system prompt is inherently lossy. The institutional tension of the Tang Three
   Departments and Six Ministries was, historically, multi-person, multi-department, and
   multi-period; `SOUL.md` can only approximate it. The MVP accepts this simplification; a
   future multi-agent pattern (one sub-agent per department) could ease it.
2. **Missing temporal dimension**: `regimes/` places ancient dynasties alongside modern
   nation-states (e.g. `china/tang` next to `usa/federal`) with no chronological check.
   Cross-era comparison is a feature, not a bug, but should be stated plainly in the
   paper/README.
3. **First-seed lock-in**: fixed in v5.1 (re-seed by mtime), but only for SOUL/IDENTITY
   markdown text updates — not for a philosophical re-architecture of a regime, which should
   instead be renamed (e.g. `tang-v2`).

## Roadmap
- [x] Design doc (this file)
- [ ] `engine/v5/civ-memory.mjs`
- [ ] `engine/v5/skill-sediment.mjs`
- [ ] `engine/v5/run-v5.mjs`
- [ ] `bin/civagent` gains `--v5` / `skills` / `match-log` / `tournament`
- [ ] Agent Team `civagent-v5` configuration
- [ ] MVP 5-match test + judge scoring
- [ ] Cross-review (Codex + opencode; gemini removed)
- [ ] PR to fork main
