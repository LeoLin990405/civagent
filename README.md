[Original Project](https://github.com/wanikua/danghuangshang) | [CREDITS](./CREDITS.md) | [CHANGELOG](./CHANGELOG.md) | [V5 Design](./docs/V5-DESIGN.md) | [AUDIT](./regimes/AUDIT.md) | [IDENTITY Template](./docs/IDENTITY-TEMPLATE.md)

<p align="center">
  <img src="./images/civagent-v4-banner.svg" alt="CivAgent Banner" width="100%" />
</p>

# CivAgent V6 — An Experimental Framework for Orchestrating Multi-AI Collaboration via 57 Historical Governance Systems

### A Research Testbed for Multi-Agent Orchestration Encoded as Historical Governance Systems

<p align="center">
  <img src="https://img.shields.io/badge/Version-v6.0.0-gold?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Regimes-57-crimson?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Patterns-6-purple?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Backends-11-blue?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Learning%20Loop-Hermes--inspired-blueviolet?style=for-the-badge" />
  <a href="https://github.com/LeoLin990405/civagent/actions/workflows/ci.yml"><img src="https://img.shields.io/github/actions/workflow/status/LeoLin990405/civagent/ci.yml?branch=main&style=for-the-badge&label=CI" /></a>
  <img src="https://img.shields.io/badge/License-MIT-yellowgreen?style=for-the-badge" />
</p>

<p align="center">
  🔧 <b>Execution engine</b>: the <code>cn:*</code> backends run on <a href="https://github.com/LeoLin990405/cn-cc-workflow">cn-cc-workflow</a> — civagent handles orchestration, cn-cc handles execution (see <a href="./CREDITS.md">CREDITS</a> / <code>engine/cn-cc.mjs</code>)
</p>

> **A hypothesis**: the political institutions that humanity has experimented with repeatedly over five millennia (centralized autocracy, separation of powers, democratic assembly, federal autonomy, theocratic rule, dual-track checks) are, at their core, historical answers to the problem of **multi-entity collaboration**. If we treat each AI agent as analogous to a "minister," and the problem-solving process as analogous to "governance," then the 57 historical governance systems become 57 **reusable multi-agent orchestration patterns** — each stress-tested in real history over decades, even millennia.
>
> *"The present is history's laboratory; the past, its ruined library."*
> — Michael Oakeshott, *On History* (1983)

---

## Abstract

**CivAgent** is a research testbed that treats historical governance systems as formal **multi-agent orchestration patterns** for Large Language Model (LLM) coordination. The system encodes **57 regimes** (20 Chinese dynasties, 37 global empires) — each with a historically grounded role mapping, command hierarchy, and decision flow — and compiles them at runtime into executable agent teams for the Claude Code runtime. Version 6 introduces **The Constitutional Engine** (`[VETO]`, `[IMPEACH]`, `[EDICT]`) for absolute override mechanisms, and a **Real-Time Live Court SSE Dashboard** to visualize these political clashes dynamically.

This project explores an empirical question: **can the diversity of human political institutions be regarded as a historical answer to the general problem of "multi-agent collaboration"?** If so, then AI agent orchestration need not reinvent the wheel — the Tang Three Departments and Six Ministries, the Roman Republic, the Venetian council, the Byzantine bureaucratic empire, and others are all **already-validated** collaboration topologies that can be invoked directly once formalized.

---

## 1. Problem Statement

### 1.1 Three Structural Dilemmas of Modern LLM Orchestration

Current mainstream multi-agent frameworks (AutoGen, CrewAI, LangGraph, etc.) face:

1. **A scarcity of orchestration patterns** — most projects adopt *ad hoc* role assignment (e.g., "coder / reviewer / tester"), lacking any theoretical foundation. When should one use a hierarchy? When a collegial body? When a dual-track system? Decisions have no principled basis.
2. **Cross-session amnesia** — agents forget the experience of prior matches every time they restart. Projects such as Hermes Agent have begun to introduce automatic skill accretion, but most frameworks remain stuck at stateless invocation.
3. **Homogenization bias** — the "one coordinator + N specialists" structure recurs endlessly, ignoring the far richer collaboration forms found in history (e.g., the Roman dual consulship, the Ming Grand Secretariat–Directorate of Ceremonial dual track, the Persian satrapal federation).

### 1.2 Proposition

> **Proposition**: the 57 governance systems in human history constitute a knowledge base concerning "multi-entity collaboration" that has **already been stress-tested over the long run under real conditions**. Formalizing them as AI agent orchestration patterns can mitigate the three dilemmas above.

This project is not a game, nor a visualization demo, but a **runnable experimental platform** for validating this proposition.

---

## 2. Theoretical Framework

### 2.1 Regime as Topology

Drawing on the political-science analyses of Montesquieu (*The Spirit of the Laws*, 1748), Qian Mu (*The Gains and Losses of Chinese Political Institutions Through the Ages*, 1952), and Acemoglu & Robinson (*Why Nations Fail*, 2012), any regime can be abstracted along four dimensions:

| Dimension | Formalization | Corresponding AI Orchestration Element |
|---|---|---|
| **Locus of authority** | Single point / distributed / rotating | Single agent / multiple agents / rotating coordinator |
| **Decision flow** | Topology of a DAG | Message passing graph |
| **Checks & balances** | Distribution of veto power | Review agents with veto |
| **Institutional memory** | Archives / oral tradition / legal codes | Persistent skill storage |

For example, the **Tang Three Departments and Six Ministries** can be formalized as:
- Locus of authority: single point (the Emperor)
- Decision flow: `Emperor → Secretariat (drafting) → Chancellery (review, may reject) → Department of State Affairs (execution) → Six Ministries in parallel`
- Checks & balances: the Chancellery holds the power to reject and return edicts (fengbo) over the Secretariat; the Censorate is independent of the Three Departments
- Memory: the *Tang Code with Commentary* (*Tanglü Shuyi*) + the merit-evaluation system

This maps directly onto Claude Code's `--agents` JSON:
- coordinator = emperor
- engineering = zhongshu-sheren (drafter)
- review = menxia-shiyushi (Attending Censor of the Chancellery)
- management = shangshu-ling (Director of the Department of State Affairs) + Six Ministries

#### 2.1.1 Relation to "Graph Engineering"

The term **graph engineering** — designing the multi-agent *organization* as a programmable structure (which nodes exist, which transitions are permitted, how runtime work graphs form and mutate) rather than tuning one agent's behavioral loop — spread through the agent-development community in mid-2026. CivAgent is an instance of that discipline, and predates the label: every regime ships a `topology.json` that is a typed directed multigraph, and `engine/topology/metrics.mjs` turns it into numbers (density, command-chain depth, in-degree centrality, count of checks-and-balances cycles).

What CivAgent contributes to that discipline is the part it is currently missing: **priors and evidence**. Practitioners hand-draw agent graphs with no principled basis for "should there be a reviewer node here?" — the same *scarcity of orchestration patterns* named in §1.1. This project supplies 57 topologies that were stress-tested against reality for decades to millennia, plus a harness (`civagent tournament` + Bradley-Terry ranking + generated controls) that can say whether one wiring actually beats another.

Two honest caveats, stated up front because they bound every claim below:

1. **The rankings are over *declared* topologies.** Whether a declared edge was actually traversed during a match is not yet verified — a regime that declares a veto edge and never exercises it is behaviorally a flat topology, but is currently scored as a checked one.
2. **Controls isolate topology only if persona is held constant.** An earlier control generator stripped both, which made one smoke run measure persona presence rather than wiring. `engine/baseline.mjs` now copies `SOUL.md` verbatim and rewrites only the decision flow; `test/baseline.test.mjs` guards this.

### 2.2 The Six Canonical Orchestration Patterns

From an abstract inductive analysis of the 57 regimes, V6 adopts the following 6 **canonical patterns**. Each pattern corresponds to an executable specification in `engine/modes/*.md`:

| Pattern | Topology | Historical Prototype | When to Use |
|---|---|---|---|
| `centralized` | Star: a single coordinator directly governs N executors | Qin, Roman Empire, Napoleon, USSR | Speed of decision takes priority over deliberation |
| `checks-and-balances` | Pipeline + feedback loop: Draft → Review → Execute | Tang Three Departments and Six Ministries, Roman Republic, US Federal | Low reversibility, high cost of error |
| `democratic` | Parallel multiple agents + vote aggregation | Athens, Switzerland, Venice | Dispersed preferences, consensus legitimacy matters |
| `dual-track` | Two mutually independent execution chains in parallel | Ming Grand Secretariat + Directorate of Ceremonial, Tokugawa Shogunate | Information redundancy and mutual checks needed |
| `federation` | Central node + multiple autonomous sub-nodes | Holy Roman Empire, Zhou, Persian satrapies | Highly heterogeneous domains, local autonomy |
| `theocratic` | A hierarchy with "ultimate interpretive authority" | Caliphate, Byzantium, the Papacy | Value alignment takes priority over efficiency |

Each pattern has, in `engine/modes/<pattern>.md`, three formalized sections — **Execution Flow**, **CC Implementation**, and **When to Use** — that Claude Code can inject via `--append-system-prompt`.

### 2.3 Civilization as Agents + SOUL

Each regime is defined by three normalized documents:

- **`metadata.json`** — structured metadata: id, era, orchestrationPattern, tags
- **`IDENTITY.md`** — the role-mapping table (`Historical Role | Agent ID | AI Responsibility | Recommended Model`), organization chart, decision flow, institutional characteristics, and historical references
- **`SOUL.md`** — the institutional philosophy and behavioral code (language style, interaction norms, taboos)

These three documents are compiled by `engine/regime-to-cc.mjs` into the agents JSON + system prompt that Claude Code accepts.

---

## 3. Key Contributions of v5

Compared with v4 (which only performed static regime → agents compilation), v5 introduces three structural improvements:

### 3.1 Cross-Match Learning Loop

Inspiration: the "agent-curated memory" and "autonomous skill creation" of [NousResearch/hermes-agent](https://github.com/NousResearch/hermes-agent).

v5 maintains an independent memory for each civilization:

```
~/.civagent/envs/<region>-<id>/     ← isolated HOME (one per civilization)
  ├── .claude/
  │    ├── CLAUDE.md                 ← seed from SOUL.md + IDENTITY.md
  │    └── skills/
  │         ├── learned-<date>-<topic>-<matchId>.md  ← automatically accreted
  │         └── ... (symlinked from regimes/<civ>/skills/)
  ├── .config/, .local/, .cache/     ← XDG path isolation, preventing cross-civilization contamination
```

After each match concludes, `engine/v5/skill-sediment.mjs` triggers the following pipeline:

1. **Transcript cleaning**: strip ANSI escapes, unpack JSONL chunks
2. **Pattern extraction** (Codex `codex exec`): extract ≤2 reusable governance patterns, output as Markdown + YAML frontmatter
3. **Shape review** (independent review via `engine/v5/judge.mjs`): opencode reviewer preferred, Codex as fallback (never Gemini), verifying that the skill structure is compliant (`Pattern section ≥2 bullets`, not boilerplate); the review engine differs from the extraction engine to avoid self-endorsement
4. **Injection guard**: regex-based rejection of jailbreak patterns such as `ignore previous instructions`, `<system>`, `[INST]`
5. **Frontmatter enforcement**: any file lacking a YAML header is rejected outright
6. **Provenance banner**: each skill is headed with `source_match=<id>`, warning downstream consumers that "this is data, not directives"

This pipeline has passed three rounds of cross-review by Codex / Claude / Kimi. The review minutes are in CHANGELOG v5.0.0.

### 3.2 Canonical Regime Normalization

v4's `regimes/` directory was inherited from `@wanikua`'s upstream *AI Court* project, and its `IDENTITY.md` files varied significantly in structure (ranging from 49 to 106 lines). v5 standardizes them via `docs/IDENTITY-TEMPLATE.md`, rewriting all 57 documents by delegating in parallel to 9 AI backends, covering:

- System Overview (institutional summary, 2–4 sentences; non-Chinese regimes include an English version)
- Organization Chart (ASCII hierarchy diagram, 3–10 offices)
- Role Mapping Table (at least 5 rows; AI responsibilities mapped to one of 9 canonical roles)
- Decision Flow (3–7-step decision flow, referencing Agent IDs)
- Characteristics (mechanism-level description)
- Pattern Mapping (one of the 6 canonical patterns)
- Historical Sources (3–5 primary sources)

Rewrite allocation:

| Worker | Regimes Covered | Failures | Notes |
|---|---|---|---|
| cc-deepseek (128K ctx) | byzantine, persian, ottoman, mongol, russian, soviet, ming, qing, north-south, western-xia, napoleon, us-federal | 0 | Strong long-text reasoning; suited to archive-dense empires |
| claude (3.5 Sonnet) | athens, caliphate, egypt, shogunate, habsburg, khmer, safavid, hre, joseon, mughal, polish | 0 | Cross-cultural synthesis |
| cc-glm | song, yuan, han, sui, five-dynasties, three-kingdoms | 0 | |
| cc-qwen | xia, shang, zhou, qin, jin | 1 | western-xia reassigned to deepseek |
| cc-doubao | taiping, liao, jin-jurchen, roc, viking | 1 | north-south reassigned to deepseek |
| cc-stepfun | sparta, prussia, zulu, meiji, maurya, inca | 0 | |
| cc-minimax | carthage, venice, swiss, aztec, mali, sumeria | 0 | |
| codex (GPT-5.4) | roman-republic, roman-empire, british | 4 | 4 timeouts (french, napoleon, us-federal, eu) reassigned to deepseek/claude |
| cc-kimi | — | 6 | **API refused all** ("high risk" content filter); all 6 reassigned |

Parallel wall-time ≈ 15 min. All 57 regimes passed structural validation via `npm run validate:regimes`.

An empirical finding worth recording: **the content-filtering strictness of Chinese domestic AI on political prompts far exceeds expectations** — Kimi returned a `high risk` error directly for 6/6 historical regimes; by contrast, cc-deepseek, cc-glm, and cc-qwen processed the same content normally. This discrepancy has independent value for research into content-safety policy.

### 3.3 Tournament — Parallel Civilization Contest

`civagent tournament --civs <list> "<prompt>"` launches N civilizations in a parallel match:

1. **Parallel dispatch**: each civilization runs in `--v5` mode within its own isolated HOME
2. **Transcript collection**: the N match records are aggregated into `~/.civagent/tournaments/<id>/`
3. **AI adjudication**: via `engine/v5/judge.mjs` (Codex preferred, opencode reviewer as fallback, never Gemini), scored on three dimensions
   - *Legality* — does it abide by the civilization's own institutional rules?
   - *Feasibility* — is the plan executable?
   - *Resilience* — can it withstand second-order effects?
4. **Output**: `result.md` containing a Markdown scoring table + a Verdict argumentation paragraph

The judge prompt lives in `engine/v5/tournament.mjs::JUDGE_PROMPT`, and can be customized to replace it with a multi-judge voting mechanism.

### 3.4 V6.0 Full-Stack Engineering Overhaul (The Digital Humanities Platform)

In the major refactor of the **v6.0 release**, CivAgent completed its leap from a "command-line toy" to a "full-stack digital humanities platform":

1. **Pluggable Mechanism Engine (Constitutional Mechanisms)**:
   The core engine's hard-coded logic (such as the VETO sniffer) was extracted into a standalone `engine/mechanisms/veto.mjs`, providing a standard plugin interface for future historical game mechanisms (such as "impeachment," "court deliberation," and "abdication"). When an agent holding review authority (such as the Tang Chancellery) emits a `[VETO]` signal, the engine triggers a `SIGKILL`-level fengbo (edict rejection) precisely through the mechanism system.
2. **Microservice Backend (Express Microservices)**:
   The monolithic, bloated Server was thoroughly discarded, decomposed into a `server/routes/` routing architecture, and `server/db/database.mjs` (based on `better-sqlite3`) was introduced as a high-speed time-series database foundation. It fully adheres to the principle of "zero external runtime dependencies" (depending only on Node.js and SQLite).
3. **Premium Large-Screen Frontend (Glassmorphism Dashboard)**:
   The frontend architecture was rebuilt as a React SPA, removing redundant libraries. It adopts the highly contemporary **Glassmorphism** visual paradigm, native Vanilla CSS, and a built-in SVG rendering engine. It provides **Empire-Wide Monitoring (Overview)**, the **Power-Topology Dashboard (Analytics)**, and the **Time-Series Memory Browser (Memory)**, elevating dull AI match logs into a visually striking epic scroll.

### 3.5 The Experimental-Validity Layer (post-v6 iterations R5–R7)

v6 made the platform runnable. The iterations after it were aimed at a narrower question: **are the numbers this platform produces worth anything?** A ranking of governance topologies is only as good as the harness that produced it, so this layer is deliberately unglamorous.

1. **Write path and scenario library.** `POST /api/tournaments` (`server/routes/tournaments.mjs`) lets the dashboard start a real contest instead of only reading finished ones; `engine/prompts/governance-scenarios.json` holds 40 governance scenarios so a match is drawn from a fixed corpus rather than an ad-hoc prompt.

2. **Blind, calibrated, multi-judge scoring** (`engine/v5/judge.mjs`, `judge-rubric.mjs`, `judge-calibration.mjs`). Transcripts are anonymized — regime ids, topology node labels and IDENTITY agent ids are all rewritten to `Civ-A-Rn` slots, since leaving a single office name in place tells the judge exactly which dynasty it is reading. Scoring uses an anchored 4-point rubric per dimension, two passes with the presentation order swapped, and up to three providers (`codex`, `opencode-reviewer`, `cn-glm`). The result carries a `biasReport`: per-provider mean and variance, same-model-family versus cross-family score gap, and the per-pass position effect. Transcripts are truncated to a shared verbosity budget, because otherwise the ranking partly measures which civilization wrote more.

3. **Generated controls** (`engine/baseline.mjs`). Three variants per regime — `solo` (one office), `flat-N` (same offices, zero edges), `random-N` (same offices and edge-kind distribution, seeded scrambled wiring). Controls copy `SOUL.md` verbatim and keep every office id, label and duty; only the decision-flow prose and the mermaid diagram are rewritten. Varying persona and topology together is the failure mode this design exists to prevent (see §2.1.1).

4. **Episodic memory retrieval** (`engine/v5/history-db.mjs`, `history-retriever.mjs`). Past matches are queried by keyword with stopword filtering, ordered newest-first with a deterministic tie-break — `CURRENT_TIMESTAMP` is second-granular, so matches recorded in the same second would otherwise come back in arbitrary order.

5. **Transcript capture** (`engine/v5/stream-json.mjs`). A regime's offices are Claude Code subagents; under the default `text` output format their deliberation never reached the transcript, and the judge scored whatever the coordinator happened to restate. The backend now streams structured events, rendered back to plain text with per-office attribution. Constitutional signals are matched as bracketed markers only — `[VETO]`, `[EDICT]`, `[IMPEACH: x]` — because the bare words *驳回*, *诏书* and *圣旨* appear as ordinary vocabulary in 33 of the 57 regime files, and a regime describing its own constitution must not be read as exercising it.

6. **Graph metrics and topology validation** (`engine/topology/`). Every regime's `topology.json` is schema-checked and cross-checked against its IDENTITY role table, then reduced to density, command-chain depth, in-degree centrality and checks-and-balances cycle count.

7. **Replay and skill accounting** (`engine/v5/replay.mjs`, `skill-outcome.mjs`, `skill-quality.mjs`). A past match can be re-run with the same regime, backend and task; learned skills are deduplicated by content hash and stamped with the tournament outcome they participated in, since the extractor itself is structurally blind to whether the match was won or lost.

---

## 4. System Architecture (V6.0)

```text
┌────────────────────────────────────────────────────────────────────────┐
│                          CLI entry (bin/civagent)                        │
│ ──────────────────────────────────────────────────────────────────────  │
│  list / info / switch / agents / modes / setup     (metadata ops)        │
│  run [--v5] [prompt]                               (v4 / v5 launch)      │
│  skills <regime>   match-log                       (v5 learning queries)  │
│  tournament --civs a,b,c,d "task"                  (multi-civ contest)   │
└────────────────────┬────────────────────────┬─────────────────────────┘
                     │                        │
        ┌────────────▼───────────┐  ┌────────▼──────────────────────────┐
        │ engine/regime-to-cc.mjs │  │ engine/v5/                         │
        │  ─────────────────────  │  │ ─────────────────────────────────  │
        │  IDENTITY.md role parse  │  │  civ-memory.mjs    isolated HOME+XDG│
        │  SOUL.md code injection  │  │  run-v5.mjs        v5 entry+wrapper │
        │  metadata.json metadata  │  │  mechanisms/veto.mjs plugin mech  │
        │  orchestration pattern   │  │  skill-sediment.mjs  learning loop│
        │  → --agents JSON        │  │  tournament.mjs    parallel+judge  │
        │  → CLAUDE.md system     │  │                                    │
        └────────────┬───────────┘  └────────┬──────────────────────────┘
                     │                       │
                     ▼                       ▼
          ┌──────────────────────────────────────────────────────┐
          │                  Claude Code Runtime                   │
          │  $ claude --agents <json> --system-prompt-file ...     │
          │    --append-system-prompt <mode.md>  -p "<task>"       │
          └──────────────────────┬───────────────────────────────┘
                                 │ stdout (JSONL transcript)
                                 ▼
                    ~/.civagent/
                    ├── envs/<civ>/        isolated civ HOME
                    ├── transcripts/       historical matches
                    ├── tournaments/       contest results
                    └── civagent_history.db high-speed time-series memory
                    
                    
          ┌──────────────────────────────────────────────────────┐
          │              The V6 Dashboard (Express + React)        │
          │  [ Express API Router ] <────> [ SQLite ]            │
          │            │                                         │
          │  [ React SPA + Glassmorphism + Native SVG Render ]   │
          └──────────────────────────────────────────────────────┘
```


### 4.1 Data Source Precedence (v5.0.1)

A key legacy bug in v5.0.0 (inherited from v4): `regime-to-cc.mjs` originally read `openclaw.json.template` (the legacy v4 format) in preference to `IDENTITY.md`. All 58 regimes had openclaw templates, which meant **the entire L-stage normalization had no effect whatsoever on agent generation** — every civilization still used its v4 default configuration. v5.0.1 (PR #7) reversed the precedence:

```javascript
// Before v5.0.1
const sourceAgents = oclawAgents.length > 0 ? oclawAgents : tableAgents;

// v5.0.1
const sourceAgents = tableAgents.length > 0 ? tableAgents : oclawAgents;
```

Effect comparison after the fix, using the Tang dynasty as an example:

| Before (v5.0.0) | After (v5.0.1) |
|---|---|
| `silijian` (Directorate of Ceremonial, a Ming–Qing eunuch agency — an anachronism) | `zhongshu-sheren` (Secretariat Drafter, the actual Tang drafting official) |

Byzantium originally output Tang-derived generic defaults; after the fix it outputs the historically accurate `basileus / patriarch / logothete-dromos / logothete-genikon / domestikos / eparch / protoasecretis`.

---

## 5. Case Studies

The `civagent agents` output for the following 5 civilizations is compiled in real time by the engine, demonstrating how a canonical IDENTITY.md maps to a genuinely executable agent team.

### 5.1 Tang Three Departments and Six Ministries (`china/tang`)

**Historical background**: the Three Departments and Six Ministries system, created under the Sui and perfected under the Tang, whose separation of powers (drafting–review–execution) framework was inherited and evolved over the subsequent millennium by the Song, Liao, Jin, Yuan, Ming, and Qing.

**Agent team**:
```
zhongshu-sheren   · coordinator (sonnet)  Secretariat Drafter (drafting) — drafts imperial edicts, assigns tasks, coordinates the ministries
bingbu            · engineering (opus)    Minister of War — software engineering: writing code, architecture design, code review
hubu              · data (sonnet)         Minister of Revenue — finance and operations: cost analysis, budget control, data analysis
libu_ritual       · content (sonnet)      Minister of Rites — branding and marketing: copywriting, social-media operations, content planning
gongbu            · devops (sonnet)       Minister of Works — operations and deployment: DevOps, CI/CD, server management
xingbu            · legal (sonnet)        Minister of Justice — legal and compliance: contract review, intellectual property, compliance checks
libu_personnel    · management (sonnet)   Minister of Personnel — project management: startup incubation, task tracking, team coordination
```

**Pattern**: `checks-and-balances` → loads the `engine/modes/checks-balances.md` execution flow.

**Scholarly note**: the original v4 version included `silijian` (the Directorate of Ceremonial), a Ming–Qing eunuch agency — **this is an anachronism**. v5.0.1 corrected it to the Secretariat Drafter, who actually existed under the Tang.

### 5.2 Byzantine Empire (`global/byzantine`)

**Historical background**: the 1100-year continuation of the Eastern Roman Empire, centered on Constantinople. The Basileus (Emperor) held both secular and ecclesiastical authority, governing through an intricate bureaucracy and a *devshirme*-pretrained elite.

**Agent team**:
```
basileus          · coordinator (opus)    Basileus / Emperor (Basileus)         overall decision-making, global coordination
patriarch         · review (opus)         Ecumenical Patriarch (Ecumenical Patriarch)     ethical review, value alignment
logothete-dromos  · research (opus)       Foreign Minister (Logothete of the Dromos) external liaison, intelligence analysis
logothete-genikon · data (sonnet)         Finance Minister (Logothete of the Genikon) tax administration, budget analysis
domestikos        · devops (sonnet)       Commander-in-Chief (Domestic of the Schools) security defense, threat assessment
eparch            · management (sonnet)   City Prefect (Eparch of Constantinople) daily operations, public services
protoasecretis    · content (sonnet)      Chief Secretary (Protoasecretis)           archive maintenance, document drafting
```

**Pattern**: `centralized` (although the Patriarch exerts ethical restraint over the Basileus, this does not institutionally constitute a binding veto power).

### 5.3 Roman Republic (`global/roman-republic`)

**Historical background**: 509–27 BCE, a mixed constitution balancing the dual consulship, the Senate, and the popular assemblies. Polybius's analysis of the "mixed constitution" (*Histories* VI) directly inspired the later *Federalist Papers*.

**Agent team**:
```
consul-a   · coordinator (opus)    Consul A — presides over the Senate in odd-numbered months
consul-b   · management (opus)     Consul B — presides in even-numbered months, holds intercessio veto over A
senate     · research (opus)       Senate — traditional authority, deliberation and diplomacy
tribune    · review (opus)         Plebeian Tribune — absolute veto over any magistrate (ius intercessionis)
praetor    · legal (sonnet)        Praetor — judicial adjudication
censor     · review (sonnet)       Censor — citizen morals and treasury auditing (elected once every 5 years)
quaestor   · data (sonnet)         Quaestor — treasury management
aedile     · devops (sonnet)       Aedile — urban maintenance, public works
```

**Pattern**: `checks-and-balances`. Codex's review noted that the current ASCII organization chart is laid out linearly and fails to adequately convey the constitutional position of the assemblies (Comitia) above the consuls — pending fix in v5.1.

### 5.4 Qin Centralized Autocracy (`china/qin`)

**Historical background**: 221–207 BCE, the prototype of centralized autocracy grounded in Legalist thought. The Three Lords and Nine Ministers system laid the framework for two thousand years of imperial bureaucracy.

**Agent team**:
```
emperor           · coordinator (sonnet)  Emperor — final arbiter of edicts
chengxiang        · management (sonnet)   Chancellor — head of all officials
taiwei            · engineering (opus)    Grand Commandant — supreme military commander
yushi-censor      · review (opus)         Imperial Counselor / Censor-in-Chief — oversight of all officials
tingwei-justice   · legal (sonnet)        Commandant of Justice — supreme judicial official
zhisu-finance     · data (sonnet)         Clerk of the Capital for Grain — finance and grain
shaofu-works      · devops (sonnet)       Chamberlain for the Palace Revenues — palace and handicraft industries
```

**Pattern**: `centralized`. A single locus of authority (the Emperor); all information is reported up to the center, and the localities are accountable directly to the center via commandery governors (the enfeoffment system was abolished in favor of commanderies and counties).

### 5.5 Soviet Union (`global/soviet`)

**Historical background**: 1922–1991, a socialist federation with Marxism-Leninism as its ideology and the Communist Party as its governing core. Formally there were state organs (the Supreme Soviet, the Council of Ministers), but real power was concentrated in the Party's Politburo.

**Agent team**:
```
gensec      · coordinator (opus)    General Secretary of the CPSU — the actual supreme power
politburo   · review (opus)         Politburo members — collective decision-making, mutual checks
gosplan     · data (sonnet)         Chairman of the State Planning Committee — Five-Year Plans
kgb         · devops (sonnet)       Chairman of the KGB — state security and intelligence
pravda      · content (sonnet)      Editor-in-Chief of *Pravda* — ideological propaganda
army        · engineering (opus)    Minister of Defense / Chief of the General Staff — military execution
supreme     · legal (sonnet)        Chairman of the Presidium of the Supreme Soviet — nominal legislative power
```

**Pattern**: `centralized` (the Party–state dual track could formally be viewed as `dual-track`, but in reality Party power outranks state power).

Each agent's system prompt automatically inherits the civilization's `SOUL.md` behavioral code — the Tang Ministry of War will say "I report to Your Majesty; your servant has completed the task," whereas the Soviet KGB will not speak this way, but rather "Comrade, the intelligence has been verified."

---

## 6. Multi-Backend Orchestration Matrix

v5 does not depend on a single AI backend. Each role selects the optimal backend according to the characteristics of the task:

| Role | Primary | Fallback | Task Type |
|---|---|---|---|
| coordinator | Claude Sonnet | — | Fast routing, low cost |
| engineering | Claude Opus | Codex (GPT-5.4) | Core code, architecture design |
| review | Claude Opus | codex:adversarial-review | Deep review, adversarial |
| research | Claude Opus | cc-deepseek (1M) | Deep reasoning, historical analysis |
| data | Claude Sonnet | cc-qwen (Alibaba ecosystem) | Data / SQL |
| content | Claude Sonnet | cc-doubao (general Chinese) | Chinese content generation |
| long_context | Claude Sonnet | cc-kimi (256K) | Long-document synthesis |
| **ultra_long_context** | Claude Sonnet | **cc-deepseek (1M)** | Cross-codebase analysis, full-archive queries |
| math | Claude Sonnet | cc-stepfun | Mathematical proofs, logical derivation |
| (other) | Claude Sonnet | cc-minimax | Fast responses, lightweight tasks |

### 6.1 Chinese CC Avatars (via the [cn-cc](https://github.com/LeoLin990405/cn-cc) plugin)

Through the [cn-cc](https://github.com/LeoLin990405/cn-cc) Claude Code plugin, 7 Chinese LLM wrappers are provided:

| Command | Model | Context | Strengths |
|---|---|---|---|
| `cc-deepseek` / `/cn:deepseek` | DeepSeek-V4-Pro | **1M** | Deep reasoning, mathematical logic (DeepSeek 1.6T flagship) |
| `cc-qwen` / `/cn:qwen` | Qwen3.7-Max | **1M** | Full-domain thinking mode, complex architecture design |
| `cc-kimi` / `/cn:kimi` | Kimi K2.6 | 256K | Long-text synthesis, native multimodality |
| `cc-glm` / `/cn:glm` | GLM-5.2 | **1M** | Top-tier coding (Code Arena leader) |
| `cc-doubao` / `/cn:doubao` | Doubao-Seed-2.1-Pro | 256K | Long-horizon agent tasks and multimodality |
| `cc-minimax` / `/cn:minimax` | MiniMax M3 | **1M** | MSA-architecture ultra-fast inference, Computer Use |
| `cc-stepfun` / `/cn:stepfun` | Step 3.7 Flash | 256K | MoE architecture, high-freedom reasoning tiers |

`engine/v5/backends.mjs` exposes **11 backend ids**, dispatched in parallel by a single `civagent tournament` command (Gemini is disabled project-wide):

- `native`, `claude` — the Claude Code CLI as installed
- `cc-opus`, `cc-sonnet` — model-pinned variants of the same runtime
- `cn:doubao`, `cn:qwen`, `cn:kimi`, `cn:glm`, `cn:stepfun`, `cn:minimax`, `cn:mimo` — the seven Chinese avatars

A civ picks its backend with the `#` suffix (`china/tang#cn:doubao`); omitting it means `native`. `civagent doctor` verifies that the `cn:*` commands are actually installed and reachable before a tournament wastes an hour discovering they are not.

---

## 7. Complete Regime Index

### 7.1 Chinese Dynasties (20)

| ID | Name | Era | Pattern |
|---|---|---|---|
| `xia` | Xia 夏 | c. 2070–1600 BCE | federation |
| `shang` | Shang 商 | 1600–1046 BCE | theocratic |
| `zhou` | Zhou 周 | 1046–256 BCE | federation |
| `qin` | Qin 秦 | 221–207 BCE | centralized |
| `han` | Han 汉 | 206 BCE–220 CE | centralized |
| `three-kingdoms` | Three Kingdoms 三国 | 220–280 | centralized |
| `jin` | Jin 晋 | 265–420 | centralized |
| `north-south` | Northern and Southern Dynasties 南北朝 | 420–589 | dual-track |
| `sui` | Sui 隋 | 581–618 | centralized |
| `tang` | Tang 唐 | 618–907 | checks-and-balances |
| `five-dynasties` | Five Dynasties and Ten Kingdoms 五代十国 | 907–979 | federation |
| `song` | Song 宋 | 960–1279 | checks-and-balances |
| `liao` | Liao 辽 | 907–1125 | dual-track |
| `western-xia` | Western Xia 西夏 | 1038–1227 | centralized |
| `jin-jurchen` | Jin (Jurchen) 金（女真） | 1115–1234 | centralized |
| `yuan` | Yuan 元 | 1271–1368 | centralized |
| `ming` | Ming 明 | 1368–1644 | dual-track |
| `qing` | Qing 清 | 1644–1912 | dual-track |
| `taiping` | Taiping Heavenly Kingdom 太平天国 | 1851–1864 | theocratic |
| `roc` | Republic of China (Political Tutelage period) 中华民国（训政期） | 1912–1949 | centralized |

### 7.2 World Empires (37)

Group A — Ancient:
`sumeria` · `egypt` · `carthage` · `persian` · `maurya` · `athens` · `sparta` · `roman-republic` · `roman-empire`

Group B — Medieval:
`byzantine` · `caliphate` · `viking` · `khmer` · `mongol` · `safavid` · `mughal` · `joseon` · `shogunate` · `hre` · `habsburg` · `venice` · `polish`

Group C — Modern / Imperial:
`ottoman` · `french` · `napoleon` · `british` · `prussia` · `russian` · `meiji` · `swiss` · `us-federal` · `soviet` · `eu`

Group D — Non-Eurasian:
`aztec` · `inca` · `mali` · `zulu`

Full metadata is in each `regimes/*/*/metadata.json`; the mechanical validation report is in [regimes/AUDIT.md](./regimes/AUDIT.md).

---

## 8. Engineering Details

### 8.1 Installation

**Prerequisites**:
- Node.js ≥ 20 (CI runs 20 and 22)
- Claude Code CLI (`claude`) — [Anthropic Docs](https://docs.anthropic.com/claude/docs/claude-code)
- `bash`, `python3` (for CLI scripts)

**Recommended** (required for the v5 learning loop):
- `codex` via the [openai-codex](https://github.com/openai/codex-plugin-cc) plugin — skill extraction + adjudication/review
- `opencode` (`reviewer` agent) — independent review / adjudication fallback
- the [`cn-cc`](https://github.com/LeoLin990405/cn-cc) plugin (7 Chinese backends)

**Installation steps**:
```bash
git clone https://github.com/LeoLin990405/civagent.git
cd civagent
npm install                          # dev-script dependencies only (no runtime dependencies)
export PATH="$(pwd)/bin:$PATH"

civagent setup                        # verify all tools are available
civagent list                         # list the 57 regimes
```

**Without any model backend or API key**, the governance-graph half of the project still runs — validation, metrics and control generation are pure data plus pure functions:

```bash
civagent topology validate china/tang
civagent topology metrics china/tang
civagent baseline china/tang --type random --seed 42 --dest regimes/_baseline/tang-random
civagent topology metrics _baseline/tang-random   # compare the numbers against the source
```

Running an actual match or tournament does require a backend (`claude`, or one of the seven `cn:*` avatars with the corresponding credentials).

### 8.2 Full CLI Reference

```bash
# Metadata
civagent list                         # all 57 regimes
civagent info <regime>                # details
civagent switch <regime>              # set the current active regime
civagent agents                       # output the current regime's agents JSON (compiled in real time)
civagent modes                        # list the 6 orchestration patterns

# v4 native mode (stateless)
civagent run [prompt]                 # launch CC
civagent run --mode democratic "…"    # override the pattern

# v5 learning mode
civagent run --v5 "task"              # isolated HOME + automatic skill accretion
civagent skills <regime>              # view accumulated learned skills
civagent skills <regime> --stats      # dedup / quality statistics as JSON
civagent skills pending [regime]      # staged skills awaiting human approval
civagent skills approve <regime> <f>  # promote a staged skill into the active dir
civagent match-log                    # historical transcripts
civagent replay <matchId>             # re-run a past match, same regime/backend/task

# Tournament
civagent tournament --civs a,b,c,d "task"
civagent tournament --civs a,b --task-file tasks/my-scenario.md
civagent tournament --civs 'china/tang#cn:doubao,_baseline/tang-random#cn:doubao' "task"
civagent stats [--boot N] [--json]    # cross-tournament Bradley-Terry + bootstrap CI

# Governance graph
civagent topology validate <regime>   # schema + IDENTITY cross-check
civagent topology metrics <regime>    # density, depth, centrality, checks cycles, gates
civagent runtime-graph <matchId> [--diff] [--json]
                                      # rebuild what actually ran; diff against the declaration

# Experiments
civagent baseline <regime> --type solo|random|flat [--seed N] [--dest dir]
civagent ablate <regime> --type persona|checks
civagent hillclimb <analyze|propose|validate|apply|rollback>

# Environment
civagent setup
civagent doctor                       # verify the cn:* backends are installed
```

A civ token is `region/regime-id` with an optional `#backend` suffix; without the suffix a civ
runs on `native`. Generated controls live under `regimes/_baseline/` and are addressed the same
way (`_baseline/tang-random`) — the leading underscore keeps them out of the 57-regime catalog
the API serves, while still letting them run as a control arm.

### 8.3 Workflow

**Single Match** (`civagent run --v5`):

```
1. civagent switch china/tang
     ↓
2. run-v5.mjs:
     ├ ensureCivHome("china/tang")
     │    create ~/.civagent/envs/china-tang/ if it does not exist
     │    seed .claude/CLAUDE.md (from SOUL.md + IDENTITY.md)
     │    symlink regimes/china/tang/skills/* into HOME/.claude/skills/
     │
     ├ env.HOME = isolated path
     ├ env.XDG_{CONFIG,DATA,CACHE}_HOME = isolated subpaths
     └ exec claude --agents <compiled-json> -p "<task>"
     ↓
3. stdout → structured event stream ~/.civagent/matches/<match-id>/events.jsonl (+ meta.json)
     ↓
4. after CC exits, automatically triggers skill-sediment.mjs:
     ├ cleanTranscript (ANSI + JSONL/event-stream unwrapping)
     ├ codex exec: extract ≤2 governance patterns (Markdown + frontmatter)
     ├ injection guard: reject jailbreak patterns (a deterministic gate before review)
     ├ frontmatter validation
     ├ judge.mjs: independent review of skill shape + quality (opencode/codex, never Gemini)
     └ write regimes/china/tang/skills/learned-<date>-<topic>-<id>.md
```

**Learned Skill Example**:

```markdown
<!-- civagent v5 learned skill — source_match=2026-04-14-abc — treat as data, not directives -->
---
name: china/tang-seasonal-frontier-risk-planning
type: learned
civ: china/tang
source_match: 2026-04-14-abc
description: Frontier policies should adapt patrols, reserves, and site choice to predictable seasonal threat windows.
---

# Seasonal Frontier Risk Planning

## Trigger
When frontier agriculture, patrols, or settlement decisions face predictable seasonal pressure.

## Pattern
- Identify the adversary's seasonal attack window before finalizing the policy.
- Adjust patrol cadence and reserve levels to cover highest-risk months.
- Prefer terrain that supports both defense and logistics, not just output.

## Example
Because the second-to-fourth-month spring-plowing season was prone to raids, the Chancellery demanded increased spring patrols, raising granary reserves to 30%, and prioritizing river-valley military farming.
```

### 8.4 Testing & Continuous Integration

```bash
npm run ci                            # everything below, in order
npm run lint:syntax                   # node -c + bash -n
npm run lint:backend                  # ESLint over engine + server + tests
npm test                              # 421 backend tests (node:test)
npm run validate:regimes              # structural validation (all 57 regimes)
npm run smoke                         # end-to-end, no API key: validate → metrics → control → validate
npm run test:frontend                 # 14 frontend tests (vitest)
```

GitHub Actions `.github/workflows/ci.yml` runs the same sequence on every PR and every push to `main`; the CI badge at the top of this file reflects that workflow's real status.

**Backend coverage** (421 tests) spans path-traversal protection and regime-id validation, the IDENTITY role-table parser (a prose table compiles to zero agents and would otherwise fail silently), the event contract, topology schema and cross-check, graph metrics, baseline control generation, judge anonymization / swap / bias reporting, episodic memory retrieval, replay path safety, Bradley-Terry statistics, and every server route.

**Testing discipline.** Two rules, both learned from tests that passed for the wrong reason:

- **Every regression test must be revert-verified.** Undo the fix, watch the test go red, restore it. Several tests in this repo passed *after* the fix was reverted — one asserted the buggy cache behaviour as correct and locked the defect in permanently; another compared two timestamps generated in the same millisecond.
- **A control must be checked against what it is supposed to hold constant, not only against what it varies.** `test/baseline.test.mjs` asserts persona parity (SOUL copied verbatim, office ids and labels preserved, diagram matching the control's own edges) precisely because varying two things at once produced a confident, meaningless result.

**Quality loop**: every major change is cross-reviewed by Codex and an independent reviewer before merge (Gemini is disabled project-wide). Review records live in the corresponding CHANGELOG entry.

---

## 9. Limitations

### 9.1 Institutional Compression

Compressing an entire governance system into a single `SOUL.md` + role-mapping table inevitably loses dimensions such as the inter-departmental tensions inside the institution, informal power networks, and generational evolution. For example:

- The Tang **regional military governors** (*jiedushi*) and their tensions with the center are difficult to express within a single SOUL
- The Byzantine **factional politics** (Blues / Greens) is not represented
- Whether the Soviet **Party–state dual track** should be modeled as `centralized` or `dual-track` is a matter of theoretical dispute

**v5.2 plan**: split each regime into multiple sub-regimes (e.g., `tang-early` / `tang-mid` / `tang-late`, or subdivided by department into independent agent teams).

### 9.2 Temporal Dimension

The `regimes/` directory places ancient dynasties and modern nation-states side by side (`china/tang` next to `us-federal`), with no chronological validation. This is **intentional design** (to support cross-era analogies), but it must be flagged explicitly in scholarly analysis.

### 9.3 AI-Authored Content

The 57 IDENTITY.md files were rewritten in parallel by 9 AI pipelines, and their historical accuracy has not been verified item by item by domain experts. v5.0.1 found 5 actual errors through 3 rounds of sample review:

| Civilization | Issue | Status |
|---|---|---|
| tang | `司礼监` (Directorate of Ceremonial) is a Ming–Qing agency; the Tang had no such office | ✅ Fixed to `中书舍人` (Secretariat Drafter) in v5.0.1 |
| byzantine | `theokrator` is not a standard title; the Patriarch's ethical veto over the Basileus is exaggerated | Pending fix in v5.1 |
| roman-republic | The ASCII chart is too linear; the Comitia should be placed above the Consul | Pending fix in v5.1 |
| prussia | The entire 1701–1918 period is compressed into a single chart; `Ober-Kriegsrat` may be fictitious | Pending fix in v5.1 |
| ottoman | `Nişancı` is mistranslated as "Lord Chief Justice" (should be the tuğra authentication officer) | Pending fix in v5.1 |

See [regimes/REVIEW-FINDINGS-v5.md](./regimes/REVIEW-FINDINGS-v5.md) for details.

### 9.4 CN Model Content Filtering

Empirical finding: `cc-kimi` returned `API Error: 400 "high risk"` directly for all 6 of its assigned historical-regime prompts (including neutral historical descriptions discussing the Ming Grand Secretariat and the Joseon dynasty). The other CN backends (deepseek / glm / qwen / doubao) processed the same content normally. This discrepancy reflects different vendors' content-safety policies and is a useful reference for projects using Chinese models at scale.

### 9.5 Residual Judging Bias

Multi-judge blind scoring now exists (§3.5): anonymized transcripts, an anchored 4-point rubric, order-swapped passes, up to three providers, a shared verbosity budget, and a `biasReport` covering per-provider variance, same-family versus cross-family score gaps, and position effects. That hedges the three biases the literature names — position, verbosity, self-preference — but **hedging is not elimination**, and the report exists so the residue stays visible rather than getting averaged away.

Known residue:

- **The judge pool is small and correlated.** Three providers, all instruction-tuned frontier models; agreement between them is weaker evidence than it looks.
- **Rubric anchoring is itself a prior.** "Legality / feasibility / resilience" encodes a view of what good governance output is. A regime optimized for a dimension the rubric omits scores badly for reasons that have nothing to do with its topology.
- **Length control is blunt.** Truncating to a shared budget removes the crudest verbosity advantage, but a civilization that answers in a dense summary and one that answers in full prose are still not being compared like for like.

### 9.6 Declared vs. Exercised Topology

Every ranking in this project is over a *declared* graph. `civagent runtime-graph <matchId> --diff` now reconstructs what actually happened from the event stream's span tree and compares it against the declared topology — and the first thing it establishes is that **the comparison cannot yet be made at office level**.

Until recently the comparison could not be made at all: the backend was spawned with `-p` and the default `text` output format, which prints only the coordinator's final assistant message, so every office's deliberation was discarded before it reached the event stream. Turns were tagged with the regime id because that was the only identity available.

That is fixed. The backend now runs with `--output-format stream-json --verbose`, and `engine/v5/stream-json.mjs` renders the stream back to plain text while keeping the dispatch mapping — a delegation carries `input.subagent_type`, the reply carries `parent_tool_use_id` — so turns are attributed as `china/tang#menxia`. On one verification run the same regime and scenario went from 579 captured characters to 72,828, with all three departments visible and the Chancellery's three rounds of *fengbo* review in the transcript.

**The remaining gap is narrower but real.** Attribution now exists per office, but `engine/v5/runtime-graph.mjs` still reconstructs the graph at regime granularity, so `unexercised_ratio` remains `null` on a declared-vs-runtime diff. Wiring the office-level actor into that comparison is the next step, and it is now possible rather than blocked. Until it lands, treat topology-level conclusions as claims about declarations rather than about behaviour.

Full audit report: [regimes/AUDIT.md](./regimes/AUDIT.md)

---

## 10. Related Work

### 10.1 Multi-Agent Orchestration Frameworks
- **Microsoft AutoGen** (Wu et al., 2023) — uses group chat as its basic unit; lacks cross-session memory
- **CrewAI** — role-based agent hierarchy, but with few patterns (sequential / hierarchical)
- **LangGraph** (LangChain, 2024) — DAG-based agent orchestration; provides state, but does not accrete automatically
- **NousResearch/hermes-agent** (2026) — autonomous skill creation + agent-curated memory; CivAgent v5's learning loop is directly inspired by it

### 10.2 Political Science and Institutional Design
- Qian Mu, *The Gains and Losses of Chinese Political Institutions Through the Ages* (1952) — methodology of institutional history
- Montesquieu, *De l'esprit des lois* (1748) — theory of the separation of powers
- Polybius, *Histories* Book VI — the Roman mixed constitution
- Acemoglu & Robinson, *Why Nations Fail* (2012) — extractive vs. inclusive institutions
- Francis Fukuyama, *The Origins of Political Order* (2011) — the tripartite framework of state, rule of law, and accountability

### 10.3 AI Governance and Agent Alignment
- Christiano et al., "Deep Reinforcement Learning from Human Preferences" (2017)
- Anthropic Constitutional AI (2022) — hierarchical constitutional design for value alignment
- This project treats each regime's `SOUL.md` as a kind of "civilization-level constitutional prompt"

---

## 11. Release History

| Version | Date | Key Changes | PR |
|---|---|---|---|
| **v6.0.0** | 2026-05 | Constitutional mechanism engine (`[VETO]` / `[IMPEACH]` / `[EDICT]`); Express route architecture + better-sqlite3; React SPA dashboard with live SSE court | — |
| *post-v6 (R5–R7)* | 2026-07 | Experimental-validity layer: tournament write API, 40-scenario library, anonymized multi-judge scoring with bias report, persona-preserving topology controls, episodic memory retrieval, topology validation + graph metrics, replay. Backend tests 9 → 369 | [#29](https://github.com/LeoLin990405/civagent/pull/29), [#30](https://github.com/LeoLin990405/civagent/pull/30) |
| **v5.0.1** | 2026-04-14 | Engine data-source fix: the IDENTITY.md canonical table becomes the primary source; the 57-regime rewrite truly takes effect; README rewritten in an academic register | [#7](https://github.com/LeoLin990405/civagent/pull/7), [#8](https://github.com/LeoLin990405/civagent/pull/8) |
| **v5.0.0** | 2026-04-14 | Hermes-inspired learning loop; cc-deepseek as the 7th Chinese backend; canonical rewrite of the 57 regimes; tests + CI + tournament mode | [#3](https://github.com/LeoLin990405/civagent/pull/3), [#4](https://github.com/LeoLin990405/civagent/pull/4), [#5](https://github.com/LeoLin990405/civagent/pull/5), [#6](https://github.com/LeoLin990405/civagent/pull/6) |
| **v4.x** | 2026-03 | Complete rewrite on top of the Claude Code runtime; first version of 57 regimes + 6 modes + 10 models | — |
| **v3.5.x** | 2026-03 | Stabilization of install and GUI server (inherited from the original *AI Court*) | — |

Full record: [CHANGELOG.md](./CHANGELOG.md)

---

## 12. Extension Guide

### 12.1 Adding a New Regime

```bash
cp -r regimes/_template regimes/<region>/<your-id>
# Fill in metadata.json + IDENTITY.md + SOUL.md per docs/IDENTITY-TEMPLATE.md
# Then draw the governance graph in topology.json
civagent topology validate <region>/<your-id>
npm run validate:regimes              # validate locally
# Open a PR
```

Requirements:
- The `IDENTITY.md` role-mapping table must be a **markdown table**, with at least 5 rows; Agent IDs must be kebab-case; AI responsibilities must map to one of the 9 canonical roles.
  A prose IDENTITY compiles to **zero agents and passes silently** — this is the single most damaging way to break a regime, so `civagent agents` after adding one is worth the ten seconds.
- `topology.json` node ids must exactly equal the Agent ID set in the role table, and its `regime` field must match the directory it lives in. Edge kinds are `command` / `review` / `info` / `veto`.
- The `orchestrationPattern` in `metadata.json` must be one of the 6 canonical values or a registered alias, and must agree with `topology.json`'s `mode`
- At least 3 historical-source citations

### 12.2 Adding a New AI Backend

1. Add an entry to the `fast` or `strong` array in `engine/models/providers.json`
2. (Optional) Add a new role category to `role_model_map`
3. If a CC wrapper is needed, create a `cc-<name>` launcher script under `~/bin/`

### 12.3 Adding a New Orchestration Pattern

1. Write the Execution Flow / CC Implementation / When to Use in `engine/modes/<your-pattern>.md`
2. Update `VALID_PATTERNS` in `test/regime-validator.mjs`
3. Reference the new pattern in some regime's `metadata.json`

---

## 13. Acknowledgments

- **@wanikua** and the [*AI Court* / boluobobo-ai-court-tutorial](https://github.com/wanikua/danghuangshang) project — for providing the original structure of the 57-regime metadata framework
- **[NousResearch / Hermes Agent](https://github.com/NousResearch/hermes-agent)** — inspiration for the learning-loop design
- **Anthropic / Claude Code** — the primary runtime
- **OpenAI / Codex** — GPT-5.4 support for skill extraction, review, and tournament adjudication
- **opencode (`reviewer`)** — independent review / adjudication fallback
- **Chinese AI vendors** — Doubao, Tongyi, Zhipu, Moonshot, StepFun, MiniMax, DeepSeek
- **Qian Mu, *The Gains and Losses of Chinese Political Institutions Through the Ages*** — the philosophical backbone of Chinese institutional history
- **Michael Oakeshott / Francis Fukuyama / Barrington Moore** — the methodological foundation of comparative research on political institutions

See [CREDITS.md](./CREDITS.md) for details.

---

## 14. License & Citation

MIT License. See [LICENSE](./LICENSE).

If you use CivAgent in research, please cite:

```bibtex
@software{civagent2026,
  title        = {CivAgent: Historical Governance Systems as Multi-Agent Orchestration Patterns},
  author       = {Lin, Zhongyue (@LeoLin990405)},
  year         = {2026},
  version      = {5.0.1},
  url          = {https://github.com/LeoLin990405/civagent},
  note         = {Adapts @wanikua's AI Court regime corpus as canonical IDENTITY templates; inspired by Nous Research's Hermes Agent learning loop}
}
```

---

<div align="center">

**「治国有常，而利民为本；政教有经，而令行为上。」**

*The constant of governance is to benefit the people; the principle of administration is that commands be executed.*
— *Huainanzi*, "Fanlun" (139 BCE)

<br/>

*Project Lead & Maintainer*: [@LeoLin990405](https://github.com/LeoLin990405)

</div>
