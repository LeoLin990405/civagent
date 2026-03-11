# Swiss Confederation / 瑞士联邦 — 组织架构 / Organizational Structure

## 制度简介 / System Overview

The Swiss Confederation (Confoederatio Helvetica) traces its origin to 1291, when three forest cantons — Uri, Schwyz, and Unterwalden — formed a defensive alliance against Habsburg domination. Over seven centuries, this alliance grew into a 26-canton federation with one of the world's most stable and participatory political systems. Switzerland's unique direct democracy allows citizens to vote on any federal law (optional referendum) and propose constitutional amendments (popular initiative). The Federal Council is a seven-member collective executive with no prime minister — the Federal President is merely first among equals, rotating annually. Four official languages (German, French, Italian, Romansh) coexist. Armed neutrality has been maintained since the Congress of Vienna (1815).

瑞士联邦的起源可追溯至1291年，当时乌里、施维茨和下瓦尔登三个森林州结成防御同盟以抵抗哈布斯堡统治。七百余年来，这一联盟发展为拥有26个州的联邦，建立了世界上最稳定、最具参与性的政治制度之一。瑞士独特的直接民主允许公民对任何联邦法律进行公投（任择性公投），并提出宪法修正案（公民动议）。联邦委员会是七人集体行政机构，没有总理——联邦主席仅为同等者中的第一人，逐年轮换。四种官方语言（德语、法语、意大利语、罗曼什语）共存。自1815年维也纳会议以来，瑞士一直保持武装中立。

## 组织架构图 / Org Chart

```
  ┌────────────────────────────────────────────────┐
  │         Cantonal Assembly / 州民大会             │ ← Direct Democracy
  │         (landsgemeinde) 公民直接参与              │   Referendums & Initiatives
  └────────────────────┬───────────────────────────┘
                       │ popular initiatives / referendums
  ┌────────────────────┼───────────────────────────┐
  │           Federal Assembly / 联邦议会            │
  │  ┌──────────────────┐  ┌──────────────────┐    │
  │  │ National Council  │  │ Council of States│    │
  │  │ 国民院 (nationalrat)│  │ 联邦院 (staenderat)│    │
  │  │ 200 members       │  │ 46 members       │    │
  │  └────────┬─────────┘  └────────┬─────────┘    │
  │           └──── equal power ────┘               │
  └────────────────────┬───────────────────────────┘
                       │ elects
              ┌────────┴─────────┐
              │  Federal Council │ ← Collective executive
              │  联邦委员会        │   7 equal members
              │  (bundesrat)     │   rotating president
              └────────┬─────────┘
                       │
              ┌────────┴─────────┐
              │Federal Chancellor│ ← Administration
              │联邦总理 (kanzler)  │   "8th Councillor"
              └──────────────────┘

              ┌──────────────────┐
              │Federal Supreme   │ ← Judicial authority
              │Court 联邦最高法院  │   (Lausanne)
              │(bundesgericht)   │
              └──────────────────┘
```

## 角色映射表 / Role Mapping

| 制度角色 / Institutional Role | Agent ID | AI 职责 / AI Responsibility | 推荐模型 / Model |
|---|---|---|---|
| Federal Council / 联邦委员会 | bundesrat | Collective decision-making, policy consensus, executive coordination / 集体决策，政策共识 | Claude Opus 4.6 / GPT-5.4 |
| National Council / 国民院 | nationalrat | Proportional representation, co-legislation, budget approval / 比例代表，共同立法 | GPT-5.4 / DeepSeek R2 |
| Council of States / 联邦院 | staenderat | Cantonal representation, co-legislation, federal balance / 州代表，共同立法，联邦平衡 | Gemini 3.1 Pro / Kimi K2.5 |
| Federal Supreme Court / 联邦最高法院 | bundesgericht | Legal interpretation, cantonal law review, rights protection / 法律解释，州法审查 | DeepSeek R2 / Qwen3-Coder |
| Cantonal Assembly / 州民大会 | landsgemeinde | Direct democracy, referendums, popular initiatives, citizen voice / 直接民主，公投，公民动议 | GPT-5.4 Pro / Claude Opus 4.6 |
| Federal Chancellor / 联邦总理 | kanzler | Administrative coordination, election management, procedural oversight / 行政协调，选举管理 | GPT-5.3 Instant / Qwen3-Coder |

## 协作流程 / Workflow

1. **Agenda Setting** — Issues arise from the Federal Council's policy agenda, parliamentary motions, or popular initiatives (100,000 citizen signatures proposing a constitutional amendment).
2. **Federal Council Deliberation** — The seven-member Federal Council discusses the issue collectively and reaches consensus. The Federal Chancellor prepares materials and coordinates.
3. **Legislative Drafting** — The Federal Council drafts legislation and submits it to both chambers of the Federal Assembly simultaneously.
4. **Bicameral Process** — The National Council and Council of States debate, amend, and vote on the proposal independently. Both chambers must agree on identical text (navette system with reconciliation conference if needed).
5. **Referendum Check** — After passage, the law is subject to an optional referendum if 50,000 citizens demand one within 100 days. Constitutional amendments require a mandatory referendum.
6. **Popular Vote** — If a referendum is triggered, the Cantonal Assembly (representing direct democracy) organizes the vote. A double majority (people + cantons) is required for constitutional changes.
7. **Judicial Application** — The Federal Supreme Court applies federal law and reviews cantonal legislation for compliance, but cannot strike down federal laws — the people's will is supreme.
8. **Implementation** — The Federal Council implements the law through the relevant departments. Cantons retain broad autonomy in execution within their competences.
