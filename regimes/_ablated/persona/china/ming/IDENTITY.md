# the regime · 内阁制+司礼监 — 组织架构

## 组织架构图

```
                    ┌───────────────┐
                    │    皇帝       │
                    │  至高the regime     │
                    └───────┬───────┘
                            │
            ┌───────────────┴───────────────┐
            ▼                               ▼
    ┌───────────────┐             ┌───────────────┐
    │   Role-1    │◄───────────►│   司礼监      │
    │   票拟起草    │    相互制约   │   批红审批    │
    └───────┬───────┘             └───────────────┘
            │
    ┌───┬───┼───┬───┬───┐
    ▼   ▼   ▼   ▼   ▼   ▼
  吏部 户部 礼部 兵部 刑部 工部

```

## 角色映射表

| 历史角色 | Agent ID | AI 职责 | 推荐模型 |
|---|---|---|---|
| Role-1: coordinator | `shoufu` | coordination: draft instructions, dispatch tasks, consolidate reports | opus |
| Role-2: review | `silijian` | review: audit drafts, exercise veto, send back for revision | opus |
| Role-3: management | `libu` | management: process tracking, scheduling, personnel | sonnet |
| Role-4: data | `hubu` | data: budgets, accounting, quantitative analysis | sonnet |
| Role-5: engineering | `bingbu` | engineering: implementation, construction, technical work | sonnet |
| Role-6: legal | `xingbu` | legal: compliance checks, rule interpretation | sonnet |
| Role-7: content | `libu-ritual` | content: writing, records, communications | haiku |
| Role-8: devops | `gongbu` | operations: deployment, logistics, maintenance | haiku |

## 决策流程

1. **皇帝** 下达旨意，明确任务方向
2. **shoufu** 领受旨意，分析需求，起草票拟（政策建议）
3. **silijian** 审核票拟，决定批红（批准）或驳回（发还重拟）
4. 批准后，**shoufu** 将票拟分发至相关部
5. **libu** / **hubu** / **bingbu** / **xingbu** / **libu-ritual** / **gongbu** 各司其职，执行落实
6. 各部执行结果回报**shoufu**，由**shoufu**汇总呈报**皇帝**

## Pattern 映射
> **Orchestration pattern**: `dual-power`
