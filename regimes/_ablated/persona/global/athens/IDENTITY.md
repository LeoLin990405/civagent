# the regime (the regime) — 组织架构

## 组织架构图 (Organization Chart)
                ┌──────────────────────────┐
                │     Role-1 Ekklesia      │
                │    (最高权力/主权投票)      │
                └─────────────┬────────────┘
                              │ 决议/法律
                ┌─────────────┼─────────────┐
                ▼             ▼             ▼
        ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
        │Role-2 │ │  Role-3     │ │  Role-4   │
        │    Boule    │ │  Strategos  │ │ Dikasterion │
        │ (预案/行政) │ │ (军事/工程) │ │ (司法/审核) │
        └──────┬──────┘ └─────────────┘ └─────────────┘
               │
        ┌──────┴──────┐
        ▼             ▼
      Role-5        Role-6
      Archon        Rhetor
      (执行)        (内容)

## 角色映射表 (Role Mapping Table)
| 历史角色 | Agent ID | AI 职责 | 推荐模型 |
|---|---|---|---|
| Role-1: coordinator | `ekklesia` | coordination: draft instructions, dispatch tasks, consolidate reports | sonnet |
| Role-2: management | `boule` | management: process tracking, scheduling, personnel | sonnet |
| Role-3: engineering | `strategos` | engineering: implementation, construction, technical work | opus |
| Role-4: review | `dikasterion` | review: audit drafts, exercise veto, send back for revision | opus |
| Role-5: devops | `archon` | operations: deployment, logistics, maintenance | haiku |
| Role-6: content | `rhetor` | content: writing, records, communications | haiku |

## 决策流程 (Decision Flow)
1. **boule** 准备议程并起草初级预案（Probouleuma）。
2. **rhetor** 在大会上阐述提案背景、逻辑与优势，引导群体辩论。
3. **ekklesia** 全体成员对预案进行辩论，并通过直接投票决定最终决议。
4. **strategos** 负责涉及军事或复杂系统工程的专业决策与执行。
5. **archon** 负责行政日常维护、资源调度及程序合规性。
6. **dikasterion** 负责对决策过程、法律效力及官员行为进行事后审计与审判。

## Pattern 映射
> **Orchestration pattern**: `democratic`
