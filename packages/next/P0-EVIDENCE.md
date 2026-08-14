# P0 Evidence — legacy corpus freeze and Harness pin verification

**Instrument:** `legacy-cc-v5` (frozen)
**Legacy baseline:** `1460441528069465dca7263dba3e9ac01b18c78a`
**Harness baseline:** `47f943859bef60e4160492346772ded9b24f765a` (`0.1.0-rc.5` source)
**Date:** 2026-08-14

This document records P0 evidence gathered during the first implementation round of
the [DeepSeek Harness adoption research plan](../../docs/DEEPSEEK-HARNESS-ADOPTION-RESEARCH-PLAN.md).

---

## 1. Frozen legacy corpus — deliverable 3 of §23

**Location:** `packages/next/legacy-importer/corpus/`
**Tooling:** `freeze-corpus.mjs` (stratified deterministic sampling + SHA-256 ledger),
`verify-corpus.mjs` (immutability re-hash + coverage summary).

### 1.1 Source pool inventory

Local CivAgent data root (`~/.civagent`):

| Pool | Count |
|---|---|
| Match dirs with `meta.json` | 795 |
| Match dirs with `events.jsonl` | 905 |
| Total events (all matches) | 50,578 (avg 64/match) |
| Tournaments | 113 |
| Backends | doubao 247, glm 151, qwen 151, minimax 150, kimi 46, native 25, mimo 23 |
| Status | done 770, running 11, vetoed 14 |
| Regimes | 13 distinct: `china/{tang,qin,ming,zhou,shang}`, `global/{athens,roman-republic}`, `_baseline/{tang,qin,ming,zhou,athens}-random`, `baseline/tang-random` |
| Typed mechanism matches (by backend) | doubao 25, glm 13, mimo 13, minimax 11; qwen 0, kimi 0, native 0 |
| Skill events | `skill_commit` 1,379 + `skill` 13 |

### 1.2 Frozen sample

| Stratum | Traces | Historical | Random | Abnormal | Mechanism | Skill |
|---|---:|---:|---:|---:|---:|---:|
| cn:doubao | 24 | 16 | 8 | 2 | 6 | 24 |
| cn:glm | 24 | 10 | 14 | 1 | 6 | 24 |
| cn:qwen | 24 | 4 | 20 | 0* | 0* | 24 |
| cn:minimax | 24 | 8 | 16 | 3 | 6 | 24 |
| cn:kimi | 3 | 3 | 0 | 3 | 0 | 0 |
| native | 3 | 3 | 0 | 3 | 0 | 0 |
| cn:mimo | 3 | 1 | 2 | 0 | 3 | 3 |
| **Total** | **105** | 45 | 60 | 12 | 21 | 99 |

\* qwen zeroes reflect the full pool: the legacy corpus contains no qwen vetoed/running
match and no qwen typed mechanism event. This is pool composition, not sampling loss.

Plus 3 smallest tournaments (`result.md` + `manifest.json` + civ logs) for the judging
dimension.

**Selection rule (deterministic, recorded in MANIFEST.json):** mechanism runs first
(capped at max(4, count/4) per stratum), abnormal runs second, then smallest files
(12.76 MB total, kept git-friendly), matchId tiebreak. No randomness; re-running
against the same source reproduces the same corpus.

**Immutability:** every file has a SHA-256 in `MANIFEST.json`; `verify-corpus.mjs`
re-hashes all 216 files and fails on missing/extra files or digest mismatch.

```
CORPUS VERIFY PASSED
  traces: 105 (>=100 required: PASS)
  files checked: 216, bytes checked: 12,763,371
  manifest digest: 88da968f0a006039d8be495938178c0d11eca9161e439b4acc53d496f28df7a8
```

### 1.3 Declared coverage gaps (in the ledger, not hidden)

1. **Topology treatments `flat` and `solo` do not exist in the legacy corpus** (all 13
   regimes are historical or `*_random`). They are native-epoch-only treatments; the
   plan's §19 four-level topology factorial can be fully executed only after native
   fixtures exist (P2+). The frozen corpus covers historical + random only.
2. **npm registry lacks `@deepseek-ai/dsh-*@0.1.0-rc.5`** (see §2) — the
   `harness-adapter` must build seam packages from the pinned source, not install the
   exact pinned version from npm.
3. **mimo** traces exist but E3 froze the instrument without mimo
   (commit `f2279f9`); mimo entries here are non-E3 breadth samples.
4. **Mechanism markers in `turn` text**: 73 glm turn events contain mechanism
   keywords inside assistant output while only typed mechanism events
   (`veto_triggered`/`impeach_triggered`/`edict_triggered`) count as mechanism use.
   The ledger counts typed events only; marker-text occurrences are legacy
   observations for the importer's declared/observed separation, not authority.

## 2. Harness pin verification — P0 acceptance "all imports resolve from public exports at 47f9438"

All 12 seam `package.json` files at the pin were fetched and inspected:

| Seam package | Version at pin | `exports` map | Published on npm |
|---|---:|---|---|
| `@deepseek-ai/cordis` | 4.0.1 | ✓ | ✓ 4.0.1 |
| `@deepseek-ai/dsh-llm` | 0.1.0-rc.5 | ✓ (invariant/types/brand/message) | ✗ rc.5 absent (rc.6 latest) |
| `@deepseek-ai/dsh-llm-deepseek` | 0.1.0-rc.5 | ✓ | ✗ |
| `@deepseek-ai/dsh-agent` | 0.1.0-rc.5 | ✓ (types) | ✗ |
| `@deepseek-ai/dsh-agent-loop` | 0.1.0-rc.5 | ✓ | ✗ |
| `@deepseek-ai/dsh-session` | 0.1.0-rc.5 | ✓ (types/surface) | ✗ |
| `@deepseek-ai/dsh-system-prompt` | 0.1.0-rc.5 | ✓ | ✗ |
| `@deepseek-ai/dsh-tools` | 0.1.0-rc.5 | ✓ (types/presentation) | ✗ |
| `@deepseek-ai/dsh-credentials` | 0.1.0-rc.5 | ✓ (types) | ✗ |
| `@deepseek-ai/dsh-typert-protocol` | 0.1.0-rc.5 | ✓ (types) | ✗ |
| `@deepseek-ai/dsh-typert-registry` | 0.1.0-rc.5 | ✓ (client/types) | ✗ |
| `@deepseek-ai/dsh-client-connection` | 0.1.0-rc.5 | ✓ (client) | ✗ |

**Findings:**

1. **Public-exports constraint is structurally satisfiable**: every seam declares a
   real `exports` map with `types` + `default` entries; no internal source-path import
   is forced by the package surface. §4.2's "import only package `exports`" rule holds.
2. **Built `lib/` output does not exist at the pin** (e.g.
   `packages/llm/llm/lib/index.js` → 404 at `47f9438`). The exports entries point at
   build output, so a harness build at the pin is required before imports resolve.
   This is a build step, not a fork or private import — allowed by §4.2.
3. **npm `0.1.0-rc.5` was never published** (published: `0.1.0-rc.2/3/6`; cordis
   `4.0.1` is published). The adapter must therefore either (a) build from the pinned
   source, or (b) treat rc.6 as a separately approved seam version. Option (a) is the
   faithful default and is recorded as the resolution strategy; the plan's hard stop
   "floating dependency updates" is respected either way.
4. Pin commit `47f9438` is the merge of `feat/npm-public` (#2519) — the exports maps
   are new at this commit, matching the plan's assumption that it is the right seam
   baseline.

## 3. Status against P0 acceptance

| P0 acceptance item | Status |
|---|---|
| Corpus >=100 immutable traces with coverage ledger | **PASS** — 105 + 3 tournaments, SHA-256 ledger, verify tool |
| Four providers covered | **PASS** — doubao/glm/qwen/minimax × 24 |
| Four topology treatments | **PARTIAL** — historical + random frozen; flat/solo do not exist in legacy (declared gap, native-epoch-only) |
| Normal and failed runs | **PASS** — 12 abnormal (vetoed/running) traces |
| Mechanism use | **PASS** — 21 typed-mechanism matches |
| Plan/dispatch | **PASS** — every E3 meta carries `dispatchPlan` + `dispatchObservability` |
| Judging | **PASS** — 3 tournament result sets frozen |
| Skill lifecycle | **PASS** — 99 traces with `skill_commit` events |
| Harness imports resolve from public exports at `47f9438` | **PASS (structural)** — exports verified for 12 seams; build-from-source required (recorded) |
| Epoch separation / no-pooling executable schema tests | **NEXT** — contracts package not yet started |
| Legacy field mapping >=99% within frozen corpus | **NEXT** — legacy-importer mapping step not yet started |
| Handoff oracle fixtures | **NEXT** — defined against synthetic fixtures in contracts |
| Preregistration completeness checklist | **NEXT** — to be authored in contracts/domain |

## 4. Immediate next steps (next round)

1. `packages/next/contracts` — Next ID/event/schema spec (JSON Schema), epoch rules
   and no-pooling executable tests, handoff oracle fixture definitions.
2. `legacy-importer` mapping pass — map observable legacy fields to canonical Next
   events over the frozen corpus, measure the >=99% mapping rate, label
   unobservable logical edges `unavailable`.
3. P0 preregistration-completeness checklist document.
