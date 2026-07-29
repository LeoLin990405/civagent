# the regime宗法分封制 — 组织架构

## 组织架构图
```
                        ┌───────────────┐
                        │    Role-1       │
                        │  (天下共主)   │
                        └───────┬───────┘
                                │ the instruction
              ┌─────────────────┼─────────────────┐
              ▼                 ▼                 ▼
         ┌─────────┐       ┌─────────┐       ┌─────────┐
         │  Role-2   │       │  Role-3   │       │  Role-4   │
         │ 行政   │       │ 军事   │       │ 教育   │
         └────┬────┘       └────┬────┘       └────┬────┘
              │                 │                 │
              └─────────────────┼─────────────────┘
                                │
              ┌─────────────────┼─────────────────┐
              ▼                 ▼                 ▼
         ┌─────────┐       ┌─────────┐       ┌─────────┐
         │ Role-5 A  │       │ Role-5 B  │       │ Role-5 C  │
         │ 自治领 │       │ 自治领 │       │ 自治领 │
         └────┬────┘       └────┬────┘       └────┬────┘
              │                 │                 │
              └─────────────────┼─────────────────┘
                                ▼
                          ┌─────────┐
                          │  Role-7   │
                          │ 司法   │
                          └─────────┘
```

## 角色映射表
| 历史角色 | Agent ID | AI 职责 | 推荐模型 |
|---|---|---|---|
| Role-1: coordinator | `tianzi` | coordination: draft instructions, dispatch tasks, consolidate reports | sonnet |
| Role-2: management | `taizai` | management: process tracking, scheduling, personnel | sonnet |
| Role-3: engineering | `taishi` | engineering: implementation, construction, technical work | opus |
| Role-4: content | `taibao` | content: writing, records, communications | haiku |
| Role-5: management | `zhuhou` | management: process tracking, scheduling, personnel | sonnet |
| Role-6: engineering | `qingdafu` | engineering: implementation, construction, technical work | haiku |
| Role-7: legal | `sikou` | legal: compliance checks, rule interpretation | opus |
| Role-8: research | `xingren` | research: information gathering, analysis, documentation | haiku |

## 决策流程
1. **tianzi** 接收天下事务（如外敌入侵、Role-5争端）
2. **taizai** 拟定应对方案，呈报Role-1裁夺
3. **taishi** 评估军事/技术可行性，**sikou** 审查合规性
4. **tianzi** 颁布the instruction，分封相关**zhuhou**执行
5. **zhuhou** 在封国内自主调度**qingdafu**落实
6. **xingren** 巡行各国，协调跨Role-5事务并回报Role-1

## Pattern 映射
> **Orchestration pattern**: `federation`
