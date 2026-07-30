# 雅典民主制 (Athenian Democracy) — 组织架构

## 制度简介 (System Overview)
雅典民主制（公元前508年-公元前322年）是人类历史上第一个民主政体，由克里斯提尼改革奠定。公民通过公民大会直接投票决策，开创了“主权在民”的先河。
Athenian Democracy (508-322 BC) was the world's first democratic system, established by the reforms of Cleisthenes. It pioneered "popular sovereignty" through direct voting in the Assembly.

## 组织架构图 (Organization Chart)
                ┌──────────────────────────┐
                │     公民大会 Ekklesia      │
                │    (最高权力/主权投票)      │
                └─────────────┬────────────┘
                              │ 决议/法律
                ┌─────────────┼─────────────┐
                ▼             ▼             ▼
        ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
        │五百人议事会 │ │  十将军     │ │  陪审法庭   │
        │    Boule    │ │  Strategos  │ │ Dikasterion │
        │ (预案/行政) │ │ (军事/工程) │ │ (司法/审核) │
        └──────┬──────┘ └─────────────┘ └─────────────┘
               │
        ┌──────┴──────┐
        ▼             ▼
      执政官        演说家
      Archon        Rhetor
      (执行)        (内容)

## 角色映射表 (Role Mapping Table)
| 历史角色 | Agent ID | AI 职责 | 推荐模型 |
|---|---|---|---|
| 公民大会 | ekklesia | coordinator | sonnet |
| 五百人议事会 | boule | management | sonnet |
| 十将军 | strategos | engineering | opus |
| 陪审法庭 | dikasterion | review | opus |
| 执政官 | archon | devops | haiku |
| 演说家 | rhetor | content | haiku |


## Decision Flow (experimental control — rewired)

The offices above are unchanged from the source regime. Their coordination
structure is not: this variant follows the flow below and nothing else.

Any description of the historical decision procedure earlier in this file is
background on the offices, not the procedure to follow. Where it conflicts
with the flow below, the flow below governs.

- `ekklesia` directs `boule`.
- `archon` reviews the output of `ekklesia`.
- `archon` directs `rhetor`.
- `strategos` reviews the output of `rhetor`.
- `strategos` directs `dikasterion`.
- `dikasterion` is kept informed by `archon`.
- `ekklesia` reviews the output of `strategos`.
- `ekklesia` directs `dikasterion`.
- `boule` directs `ekklesia`.
- `archon` directs `dikasterion`.

Agents: ekklesia, boule, strategos, dikasterion, archon, rhetor
