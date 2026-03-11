# British Parliamentary System / 英国议会制 — 组织架构 / Organizational Structure

## 制度简介 / System Overview

The British Parliamentary System, rooted in the Glorious Revolution of 1688-89 and the resulting Bill of Rights, is the archetype of constitutional monarchy and parliamentary democracy. The uncodified constitution distributes power among the Crown (ceremonial head of state), Parliament (sovereign legislature of Commons and Lords), the Prime Minister and Cabinet (executive drawn from the legislature), and an independent judiciary upholding the common law. This system has evolved continuously over centuries through convention, statute, and precedent, influencing democratic development worldwide.

英国议会制根植于1688-89年光荣革命及其产生的《权利法案》，是君主立宪和议会民主的典范。不成文宪法将权力分配给王室（礼仪性国家元首）、议会（由下议院和上议院组成的主权立法机构）、首相和内阁（从立法机构中产生的行政机构）以及维护普通法的独立司法机构。这一制度经过数百年的惯例、成文法和先例不断演进，影响了全球民主发展。

## 组织架构图 / Org Chart

```
                    ┌───────────────┐
                    │    Crown      │ ← ceremonial
                    │  君主 (crown)  │   Royal Assent
                    └───────┬───────┘
                            │ appoints
                    ┌───────┴───────┐
                    │Prime Minister │
                    │  首相 (pm)     │
                    └───────┬───────┘
                            │
          ┌─────────────────┼─────────────────┐
          ▼                 ▼                 ▼
  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
  │ Chancellor   │  │  Foreign     │  │    Home      │
  │ of Exchequer │  │  Secretary   │  │  Secretary   │
  │ 财政大臣      │  │  外交大臣     │  │  内政大臣     │
  └──────────────┘  └──────────────┘  └──────────────┘

  ┌──────────────────────────────────────────────────┐
  │                  Parliament                       │
  │  ┌───────────────┐        ┌───────────────┐      │
  │  │House of       │ ←───→  │House of       │      │
  │  │Commons 下议院  │ bills  │Lords 上议院    │      │
  │  └───────────────┘        └───────────────┘      │
  └──────────────────────────────────────────────────┘

          ┌──────────────────┐
          │ Lord Chancellor  │ ← judicial independence
          │ 大法官 (chancellor)│
          └──────────────────┘
```

## 角色映射表 / Role Mapping

| 古代角色 / Historical Role | Agent ID | AI 职责 / AI Responsibility | 推荐模型 / Model |
|---|---|---|---|
| Sovereign / 君主 | crown | Ceremonial head, constitutional continuity / 礼仪元首，宪政延续 | Claude / GPT-4 |
| Prime Minister / 首相 | pm | Policy direction, executive leadership / 政策方向，行政领导 | Claude / GPT-4 |
| House of Commons / 下议院 | commons | Legislation, government accountability / 立法，政府问责 | Claude / GPT-4 |
| House of Lords / 上议院 | lords | Legislative revision, expert scrutiny / 立法修订，专业审查 | GPT-4 / DeepSeek |
| Lord Chancellor / 大法官 | chancellor | Judicial independence, rule of law / 司法独立，法治 | Claude / GPT-4 |
| Chancellor of Exchequer / 财政大臣 | exchequer | Economic policy, budget / 经济政策，预算 | GPT-4 / Qwen |
| Foreign Secretary / 外交大臣 | foreign | Diplomacy, international relations / 外交，国际关系 | GPT-4 / Claude |
| Home Secretary / 内政大臣 | home | Domestic security, immigration / 国内安全，移民 | GPT-4 / Qwen |

## 协作流程 / Workflow

1. **Government Policy** — The Prime Minister and Cabinet (Exchequer, Foreign, Home) formulate policy.
2. **Bill Introduction** — The government introduces bills in the House of Commons (or occasionally Lords).
3. **Commons Debate** — The House of Commons debates, amends, and votes. Question Time holds the government accountable.
4. **Lords Scrutiny** — The House of Lords reviews, revises, and returns bills with amendments. "Ping-pong" between chambers until agreement.
5. **Legal Review** — The Lord Chancellor ensures compliance with the rule of law and judicial precedent.
6. **Royal Assent** — The Crown grants Royal Assent (a formality since 1708), and the bill becomes an Act of Parliament.
7. **Executive Implementation** — The relevant Secretary of State implements the new law through their department.
8. **Parliamentary Oversight** — Select committees, Question Time, and debates provide ongoing scrutiny of government actions.
