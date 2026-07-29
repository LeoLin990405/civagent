# the regime · 三公九卿制 — 组织架构

## 组织架构图
```
                    ┌───────────┐
                    │   Role-1    │
                    └─────┬─────┘
                          │ 诏
        ┌─────────────────┼─────────────────┐
        ▼                 ▼                 ▼
   ┌─────────┐      ┌─────────┐      ┌───────────┐
   │ Role-2    │      │ Role-3    │      │ Role-4  │
   │ 行政首脑 │      │ 军事统帅 │      │ 监察首长  │
   └────┬────┘      └─────────┘      └───────────┘
        │
   ┌────┼───────┬───────────┬───────────┐
   ▼    ▼       ▼           ▼           ▼
┌─────┐┌─────┐┌─────┐   ┌─────┐    ┌─────┐
│Role-5 ││治粟 ││Role-7 │   │奉常 │    │郎中 │
│司法 ││财政 ││宫廷 │   │礼仪 │    │侍卫 │
└─────┘└─────┘└─────┘   └─────┘    └─────┘
```

## 角色映射表
| 历史角色 | Agent ID | AI 职责 | 推荐模型 |
|---|---|---|---|
| Role-1: coordinator | `emperor` | coordination: draft instructions, dispatch tasks, consolidate reports | opus |
| Role-2: management | `chengxiang` | management: process tracking, scheduling, personnel | sonnet |
| Role-3: engineering | `taiwei` | engineering: implementation, construction, technical work | sonnet |
| Role-4: review | `yushi-censor` | review: audit drafts, exercise veto, send back for revision | opus |
| Role-5: legal | `tingwei-justice` | legal: compliance checks, rule interpretation | haiku |
| Role-6: data | `zhisu-finance` | data: budgets, accounting, quantitative analysis | haiku |
| Role-7: devops | `shaofu-works` | operations: deployment, logistics, maintenance | haiku |

## 决策流程
1. **emperor** 下达the instruction（如：修筑长城）
2. **chengxiang** 接收the instruction，分解任务并分派至相关卿
3. **taiwei** 规划军事防御工程，**tingwei-justice** 审核律令依据
4. **zhisu-finance** 核算粮草预算，**shaofu-works** 组织工匠物料
5. 各卿并行执行，定期向Role-2汇报进度
6. **yushi-censor** 全程监察，可直接向Role-1弹劾失职官员

## Pattern 映射
> **Orchestration pattern**: `centralized`
