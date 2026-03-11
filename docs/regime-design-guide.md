# Regime Design Guide / 政体设计指南

## Overview

Each regime in AI 治理天下 is a pure-configuration module consisting of 5 files.
No code changes are needed to add a new regime.

## File Structure

```
regimes/{region}/{id}/
├── metadata.json           # Machine-readable metadata
├── openclaw.json.template  # OpenClaw agent/binding config template
├── SOUL.md                 # Era-themed behavioral rules
├── IDENTITY.md             # Org chart + role mapping
└── README.md               # Description + usage + history
```

## Step-by-Step Guide

### 1. Create the Directory

```bash
./scripts/create-regime.sh {region}/{id}
```

### 2. Fill in metadata.json

Required fields:
- `id`: Unique regime identifier (lowercase, hyphens)
- `name`: Bilingual name object `{ "zh": "...", "en": "..." }`
- `era`: Time period `{ "zh": "...", "en": "..." }`
- `region`: Either `"china"` or `"global"`
- `system`: Governance system name
- `agentCount`: Number of agents
- `tags`: Array of descriptive tags
- `orchestrationPattern`: One of the 6 patterns below

### 3. Design Agent Architecture

Choose an orchestration pattern:

| Pattern | Description | Use When |
|---------|-------------|----------|
| `centralized-hierarchy` | Single leader, strict chain of command | Strong central authority |
| `checks-and-balances` | Multiple top-level agents reviewing each other | Distributed power |
| `dual-power` | Two co-equal leaders with overlapping domains | Dual authority |
| `federated-autonomy` | Independent groups, minimal coordination | Loose confederation |
| `democratic-council` | Equal-rank agents, voting mechanism | Democratic systems |
| `theocratic` | Supreme authority with divine mandate theme | Religious authority |

### 4. Write SOUL.md

The SOUL.md file defines the personality and behavioral rules. Key considerations:
- Use historically appropriate language
- Define interaction protocols (how agents address each other)
- Set decision-making rules
- Define taboos and restrictions

### 5. Write IDENTITY.md

The IDENTITY.md file defines the organizational structure:
- Draw an ASCII org chart
- Map each historical role to an AI agent
- Define the workflow between agents
- Specify model recommendations

### 6. Configure openclaw.json.template

Map your agents to OpenClaw configuration:
- Define `agents.main` (the primary coordinator)
- List all agents with their models
- Set up `bindings` for channel routing
- Configure `subagents.allowAgents` for delegation

### 7. Validate

```bash
./scripts/validate-regime.sh {region}/{id}
```

## Agent Design Patterns (详解)

### Centralized Hierarchy (中央集权)
```
Emperor/Leader → Minister A → Sub-agent 1
                            → Sub-agent 2
              → Minister B → Sub-agent 3
```
OpenClaw: Single `main` agent, all others as subagents via `allowAgents`.

### Checks & Balances (制衡)
```
Agent A ←→ Agent B ←→ Agent C
  ↕            ↕          ↕
Review      Review     Review
```
OpenClaw: Multiple agents with `sessions_send` for cross-review.

### Dual Power (双轨)
```
Leader A ──┬── Shared Agent 1
           ├── Shared Agent 2
Leader B ──┘
```
OpenClaw: Two main-level agents with overlapping `subagents.allowAgents`.

### Federated Autonomy (联邦)
```
Group A (independent)    Group B (independent)
  Agent 1                  Agent 4
  Agent 2                  Agent 5
  Agent 3                  Agent 6
        └── minimal coordination ──┘
```
OpenClaw: Separate agent groups with limited `sessions_send`.

### Democratic Council (民主)
```
Agent 1 ═══ Agent 2 ═══ Agent 3
  ║            ║           ║
  ╚════════ VOTE ══════════╝
```
OpenClaw: Equal-rank agents, voting via `sessions_send` aggregation.

### Theocratic (神权)
```
Supreme Divine Authority
        │ (absolute)
  ┌─────┼─────┐
  ▼     ▼     ▼
Priest  Priest  Priest
(subservient)
```
OpenClaw: Single main with divine-authority themed SOUL, strict subagent control.

## Tips

- Start with an existing regime as reference
- Keep agent count between 5-10 for manageability
- Use bilingual content (zh/en) for wider accessibility
- Test with `validate-regime.sh` before committing
