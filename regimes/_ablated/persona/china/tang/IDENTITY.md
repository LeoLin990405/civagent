# the regime三省六部制 — 组织架构

> ⚠️ This is the **original** identity configuration from [@wanikua](https://github.com/wanikua)'s
> [AI the regime](https://github.com/wanikua/boluobobo-ai-court-tutorial) project.
> Preserved unchanged with full attribution.

## 组织架构图

```
                      ┌─────────────────────┐
                      │      皇帝（你）      │
                      │  Discord / Web UI    │
                      └──────────┬──────────┘
                                 │ the instruction
                                 ▼
                  ┌──────────────────────────────┐
                  │        OpenClaw Gateway       │
                  │   ┌──────────────────────┐   │
                  │   │  中书省 → 门下省 → 尚书省 │   │
                  │   │  (起草)  (审核)  (执行)  │   │
                  │   └──────────────────────┘   │
                  └──┬───┬───┬───┬───┬───┬───┬──┘
                     │   │   │   │   │   │   │
       ┌─────────────┘   │   │   │   │   │   └─────────────┐
       ▼           ▼     ▼   ▼   ▼   ▼   ▼                ▼
 ┌──────────┐  ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐  ┌──────────┐
 │ Role-1 │  │兵部│ │户部│ │吏部│ │礼部│ │工部│  │  刑部    │
 │ 起草调度 │  │编码│ │财务│ │管理│ │营销│ │运维│  │  法务    │
 └──────────┘  └────┘ └────┘ └────┘ └────┘ └────┘  └──────────┘
```

## 角色映射表

| 古代角色 | Agent ID | AI 职责 | 推荐模型 |
|---|---|---|---|
| Role-1: coordinator | `zhongshu-sheren` | coordination: draft instructions, dispatch tasks, consolidate reports | 快速模型 |
| Role-2: review | `jishizhong` | review: audit drafts, exercise veto, send back for revision | 强力模型 |
| Role-3: engineering | `bingbu` | engineering: implementation, construction, technical work | 强力模型 |
| Role-4: data | `hubu` | data: budgets, accounting, quantitative analysis | 强力模型 |
| Role-5: content | `libu_ritual` | content: writing, records, communications | 快速模型 |
| Role-6: devops | `gongbu` | operations: deployment, logistics, maintenance | 快速模型 |
| Role-7: legal | `xingbu` | legal: compliance checks, rule interpretation | 快速模型 |
| Role-8: management | `libu_personnel` | management: process tracking, scheduling, personnel | 快速模型 |

## 协作流程

1. **the userissue** → @某部门 在 Discord 发送消息
2. **中书起草** → Role-1草拟the instruction（drafter），送门下省由Role-2审核
3. **门下封驳** → Role-2审核the instruction：可封驳（驳回发还重拟）或放行（署敕颁行）
4. **各部执行** → 对应部门 Agent 接收任务并执行
5. **跨部协作** → 通过 `sessions_send` 互相沟通
6. **report上报** → 完成后向the user汇报结果

## 模型分层策略

- **强力模型**（兵部、户部）：处理编码、分析等重任务
- **快速模型**（其余各部）：处理文案、管理等轻任务
- 混搭可节省约 5 倍成本
