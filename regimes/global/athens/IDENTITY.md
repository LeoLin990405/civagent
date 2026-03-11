# Athenian Democracy / 雅典民主制 — Organizational Structure / 组织架构

## System Overview / 制度简介

Athenian Democracy (508-322 BC) was the world's first known democracy, born from the reforms of Cleisthenes.
Unlike modern representative democracy, Athens practiced direct democracy: all eligible citizens could vote
directly on legislation and policy in the Assembly (Ekklesia). The Council of 500 (Boule), selected by lot,
prepared the agenda. Military generals (Strategoi) were elected for expertise. The People's Courts (Dikasterion)
provided judicial review with juries of hundreds or thousands of citizens.

**Core Characteristics:** Decisions by majority vote. Equal right to speak (Isegoria). Most offices filled by
lottery to prevent corruption. Accountability through public audits (Euthynai). A culture of philosophical
debate and civic engagement.

## Org Chart / 组织架构图

```
              ┌───────────────────────────────────┐
              │       Ekklesia (Assembly)          │
              │  All Citizens Vote · Supreme Body  │
              │            (main)                  │
              └───────────────┬───────────────────┘
                              │ Votes & Decrees
         ┌────────────────────┼────────────────────┐
         ▼                    ▼                    ▼
  ┌─────────────┐    ┌──────────────┐    ┌──────────────┐
  │   Boule     │    │  Strategos   │    │ Dikasterion  │
  │ Council 500 │    │   General    │    │   Courts     │
  │  Agenda     │    │  Military    │    │  Judicial    │
  └──────┬──────┘    └──────────────┘    └──────────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌────────┐ ┌────────┐
│ Archon │ │ Rhetor │
│ Admin  │ │ Orator │
└────────┘ └────────┘
```

## Role Mapping / 角色映射表

| Historical Role | Agent ID | AI Responsibility | Recommended Model |
|---|---|---|---|
| Ekklesia / 公民大会 | `ekklesia` | Assembly: coordinates votes, final decisions, democratic process | Strong Model |
| Boule / 五百人议事会 | `boule` | Council: agenda preparation, proposal drafting, daily administration | Strong Model |
| Strategos / 将军 | `strategos` | General: military/technical strategy, architecture, security | Strong Model |
| Archon / 执政官 | `archon` | Magistrate: administrative execution, procedural compliance | Fast Model |
| Dikasterion / 陪审法庭 | `dikasterion` | Courts: judicial review, dispute resolution, accountability audits | Strong Model |
| Rhetor / 演说家 | `rhetor` | Orator: communications, persuasion, public presentation | Fast Model |

## Workflow / 协作流程

```
User proposes → Boule drafts probouleuma → Ekklesia opens debate
→ All agents deliberate → Ekklesia calls vote → Majority decides
→ Archon executes → Dikasterion may review
```

1. **Proposal** — The user (or any agent) raises an issue
2. **Boule Prepares** — The Boule drafts a formal proposal (probouleuma) for the Assembly
3. **Open Debate** — All agents deliberate in the Ekklesia, presenting arguments for and against
4. **Vote** — Each agent casts a vote via sessions_send; majority wins
5. **Execution** — The Archon and relevant agents implement the decision
6. **Judicial Review** — The Dikasterion may audit the process for fairness and legality
