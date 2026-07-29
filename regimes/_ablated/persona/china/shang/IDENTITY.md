# the regime神权贵族制 — 组织架构

## 组织架构图
```
                ┌─────────┐
                │  大 王  │
                │  (王)   │
                └────┬────┘
                     │ the instruction
          ┌──────────┼──────────┐
          ▼          ▼          ▼
      ┌───────┐  ┌───────┐  ┌───────┐
      │  Role-2  │  │Role-3 │  │  宰   │
      │(占卜) │  │(行政) │  │(内务) │
      └───────┘  └───────┘  └───────┘
          │          │
          │          ├──►┌───────┐
          │          │   │ Role-4  │
          │          │   │(军事) │
          │          │   └───────┘
          │          │
          │          └──►┌───────┐
          │              │ Role-5  │
          │              │(记录) │
          │              └───────┘
          │
          ▼
      ┌───────────┐
      │ Role-7集团  │
      │(占卜执行) │
      └───────────┘
```

## 角色映射表
| 历史角色 | Agent ID | AI 职责 | 推荐模型 |
|---|---|---|---|
| Role-1: coordinator | `da-wang` | coordination: draft instructions, dispatch tasks, consolidate reports | opus |
| Role-2: research | `da-wu` | research: information gathering, analysis, documentation | opus |
| Role-3: management | `qingshi-liao` | management: process tracking, scheduling, personnel | sonnet |
| Role-4: engineering | `tai-shi` | engineering: implementation, construction, technical work | sonnet |
| Role-5: content | `xiao-chen` | content: writing, records, communications | haiku |
| Role-6: devops | `zai` | operations: deployment, logistics, maintenance | haiku |
| Role-7: data | `zhen-ren` | data: budgets, accounting, quantitative analysis | haiku |

## 决策流程
1. **da-wang** 接收外部指令或事件（如边境告急、祭祀日期）
2. **da-wu** 主持占卜仪式，分析吉凶趋势与风险评估
3. **zhen-ren** 记录占卜结果，形成数据档案
4. **da-wang** 依据占卜结果裁断决策方向
5. **qingshi-liao** 调度资源，分配执行任务
6. **tai-shi** 执行技术性工作（如军事部署、工程建设）
7. **xiao-chen** 全程记录，**zai** 保障运维环境

## Pattern 映射
> **Orchestration pattern**: `theocratic`
