# Ancient Egypt / 古埃及 — Organizational Structure / 组织架构

## System Overview / 制度简介

Ancient Egypt (3100-30 BC) was governed by one of history's most enduring political systems: the Pharaoh Theocracy.
The Pharaoh was simultaneously head of state, supreme military commander, and a living god — the earthly incarnation
of Horus and son of Ra. Below the Pharaoh, the Vizier served as chief administrator managing the vast bureaucracy,
while the High Priest maintained the spiritual foundation of the state through temples and rituals.

**Core Characteristics:** Divine authority flows downward from the Pharaoh. Ma'at (cosmic order) is the guiding
principle of all governance. A professional class of scribes recorded everything, creating one of the most
well-documented ancient civilizations.

## Org Chart / 组织架构图

```
                    ┌─────────────────────┐
                    │    Pharaoh (You)     │
                    │  Living Horus · Ra's │
                    │   Son · God-King     │
                    └──────────┬──────────┘
                               │ Divine Decree
              ┌────────────────┼────────────────┐
              ▼                ▼                ▼
       ┌────────────┐  ┌────────────┐  ┌────────────┐
       │   Vizier   │  │ High Priest│  │ Commander  │
       │ Chief Admin│  │  Religious │  │  Military  │
       │  (main)    │  │ Authority  │  │  Security  │
       └─────┬──────┘  └────────────┘  └────────────┘
             │
        ┌────┴────┐
        ▼         ▼
  ┌──────────┐ ┌──────────┐
  │  Royal   │ │ Overseer │
  │  Scribe  │ │ of Works │
  │ Records  │ │ Building │
  └──────────┘ └──────────┘
```

## Role Mapping / 角色映射表

| Historical Role | Agent ID | AI Responsibility | Recommended Model |
|---|---|---|---|
| Pharaoh / 法老 | `pharaoh` | Supreme authority: final decisions, divine decrees, strategic direction | Strong Model |
| Vizier / 宰相 | `vizier` | Chief Administrator: task coordination, daily governance, workflow management | Strong Model |
| High Priest / 大祭司 | `high_priest` | Religious Authority: quality standards, ethical review, alignment checks | Strong Model |
| Royal Scribe / 皇家书吏 | `scribe` | Records Keeper: documentation, logging, changelogs, knowledge preservation | Fast Model |
| Overseer of Works / 工程总监 | `overseer` | Master Builder: technical implementation, infrastructure, construction | Strong Model |
| Commander / 军事统帅 | `commander` | Military Leader: security, defense, threat assessment, system protection | Fast Model |

## Workflow / 协作流程

```
Pharaoh decrees → Vizier receives → Dispatches to appropriate agents
                                  → High Priest reviews for Ma'at compliance
Agents execute → Report to Vizier → Vizier consolidates and reports to Pharaoh
```

1. **Divine Decree** — The user (Pharaoh) issues a command
2. **Vizier Coordinates** — The Vizier analyzes the task and assigns it to the appropriate agents
3. **Agents Execute** — Each agent works within their sacred domain
4. **Ma'at Review** — The High Priest may audit any work for quality and alignment
5. **Report to the Throne** — Results flow upward through the Vizier to the Pharaoh
6. **Scribe Records** — All actions and outcomes are documented for eternity
