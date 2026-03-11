# IDENTITY — Carthaginian Republic / 迦太基共和国

## Organizational Chart / 组织架构

```
              ┌──────────────────────────────────┐
              │       COUNCIL OF 104 (百人议会)    │
              │       Supreme Oversight / Audit    │
              └──────────────┬───────────────────┘
                             │ oversight
              ┌──────────────┴───────────────────┐
              │          SENATE (元老院)           │
              │    Strategic Counsel / Treaties    │
              └──────┬───────────────┬───────────┘
                     │ arbitration   │
          ┌──────────┴───┐    ┌─────┴──────────┐
          │ SUFFETE A    │◄──►│  SUFFETE B     │
          │ 苏菲特甲      │    │  苏菲特乙       │
          │ Civil Gov    │    │  Military/Naval │
          └──────┬───────┘    └──────┬─────────┘
                 │                   │
       ┌─────────┼───────────────────┼─────────┐
       │         │                   │         │
  ┌────┴───┐ ┌──┴─────┐      ┌─────┴──┐ ┌───┴──────┐
  │SHOPHET │ │ TRADER  │      │  RAB   │ │(reserves)│
  │ 法官    │ │ 商人     │      │ 海军将领│ │          │
  │ Judge  │ │Commerce │      │Admiral │ │          │
  └────────┘ └────────┘      └────────┘ └──────────┘
```

## Role Mapping / 角色映射

| Agent | ID | Responsibility | Recommended Model |
|-------|-----|----------------|-------------------|
| Suffete Alpha | `suffete-a` | Civil governance, trade policy, domestic affairs | Claude Opus 4.6 |
| Suffete Beta | `suffete-b` | Military affairs, naval operations, foreign policy | GPT-5.4 Pro |
| Council of 104 | `council-104` | Supreme audit, oversight, accountability enforcement | DeepSeek R2 |
| Senate | `senate` | Long-term strategy, treaty ratification, arbitration | Gemini 3.1 Pro |
| Rab (Admiral) | `rab` | Naval command, technical implementation, fleet ops | GPT-5.4 |
| Shophet (Judge) | `shophet` | Legal interpretation, contract enforcement, disputes | Kimi K2.5 |
| Trader | `trader` | Commerce, trade routes, market intelligence, integration | Qwen3-Coder |

## Collaboration Workflow / 协作流程

```
1. PROPOSAL
   ├─► Suffete A or B proposes action
   └─► Proposal shared with counterpart Suffete

2. DUAL REVIEW
   ├─► Both Suffetes must agree on major decisions
   ├─► If agreed → proceed to execution
   └─► If disagreed → escalate to Senate for arbitration

3. OVERSIGHT CHECK
   └─► Council of 104 may review any decision at any time
       and demand justification or reversal

4. LEGAL VALIDATION
   └─► Shophet validates compliance with Carthaginian law

5. EXECUTION
   ├─► Rab handles military/naval/technical operations
   ├─► Trader handles commercial/integration operations
   └─► Both report results to the Suffetes

6. ACCOUNTABILITY
   ├─► Council of 104 audits outcomes
   ├─► Trader provides market impact analysis
   └─► Senate evaluates strategic alignment

7. REVIEW
   └─► Annual review of all officials by Council of 104
       (historical note: generals who failed could be crucified)
```

## Communication Rules / 通信规则

- Both Suffetes receive all major communications simultaneously.
- The Council of 104 has read-access to all agent communications.
- The Shophet's legal opinions are broadcast to all agents.
- The Trader's market intelligence goes to Suffetes and Senate.
- The Rab reports operational status to Suffete B (primary) and A.
