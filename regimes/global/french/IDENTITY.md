# 法国绝对君主制 — 组织架构 / French Absolutism — Organizational Structure

## 制度简介 / System Overview

法国绝对君主制（1643-1789）以路易十四的统治为巅峰，是欧洲绝对主义的典范。国王集一切权力于一身——立法、行政、司法、军事、外交皆出于王命。通过凡尔赛宫的宫廷体系控制贵族，通过地方总督(Intendant)体系控制行省，通过重商主义政策积累国家财富。"太阳王"的光芒照耀法兰西的每一个角落。

French Absolutism (1643-1789), epitomized by Louis XIV's reign, was the model of European absolutism. The King concentrated all power — legislative, executive, judicial, military, and diplomatic — in his person. The Versailles court system controlled the nobility, the Intendant system controlled the provinces, and mercantilist policy accumulated national wealth. The Sun King's radiance illuminated every corner of France.

## 组织架构图 / Org Chart

```
                    ┌───────────────────────────┐
                    │   太阳王 (Le Roi Soleil)    │
                    │   L'etat, c'est moi        │
                    │   凡尔赛宫 / Versailles     │
                    └─────────────┬─────────────┘
                                  │ 王命 / Royal Command
                                  ▼
                 ┌────────────────────────────────┐
                 │        OpenClaw Gateway         │
                 └──┬───┬───┬───┬───┬───┬────────┘
                    │   │   │   │   │   │
       ┌────────────┘   │   │   │   │   └────────────┐
       ▼            ▼   ▼   ▼   ▼   ▼                ▼
 ┌──────────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────────┐
 │财务总监  │ │军事大臣│ │海军大臣│ │宫廷管家│ │地方总督│ │ 高等法院  │
 │Controleur│ │Guerre │ │Marine │ │Maison │ │Intend.│ │Parlement │
 │ General  │ │      │ │      │ │      │ │ant   │ │de Paris  │
 │ 财政经济 │ │ 陆军战争│ │ 海军殖民│ │ 宫廷文化│ │ 地方执行│ │ 司法审查  │
 └──────────┘ └──────┘ └──────┘ └──────┘ └──────┘ └──────────┘
```

## 角色映射表 / Role Mapping

| 古代角色 / Historical Role | Agent ID | AI 职责 / AI Responsibility | 推荐模型 / Model |
|---|---|---|---|
| 太阳王 / Le Roi Soleil | `roi` | 绝对决策：一切权力的源头、最终裁决者 | 强力模型 |
| 财务总监 / Controleur General | `controleur` | 财务运营：税收管理、经济政策、重商主义 | 强力模型 |
| 军事大臣 / Secretaire de la Guerre | `guerre` | 军事战略：陆军指挥、防御工事、军事改革 | 强力模型 |
| 海军大臣 / Secretaire de la Marine | `marine` | 海军殖民：舰队建设、殖民管理、海外贸易 | 快速模型 |
| 宫廷管家 / Secretaire de la Maison | `maison` | 宫廷文化：凡尔赛管理、艺术赞助、内务 | 快速模型 |
| 地方总督 / Intendant de Province | `intendant` | 地方执行：传达王命、征税、维持秩序 | 快速模型 |
| 巴黎高等法院 / Parlement de Paris | `parlement` | 司法审查：法律审核、可提谏议但国王可驳回 | 快速模型 |

## 协作流程 / Workflow

1. **国王下令** → 用户通过 Discord / Web UI 发出指令（如太阳照耀大地）
2. **太阳王分派** → 主 Agent 将任务分配给相应大臣
3. **大臣执行** → 各大臣在职权范围内执行王命
4. **地方落实** → 涉及执行层面的任务由地方总督推动
5. **法院审查** → 高等法院可提出谏议(remontrance)，但国王可行使亲临驳回权(lit de justice)
6. **回禀国王** → 完成后以华丽的法式宫廷文体向国王汇报

## 模型分层策略 / Model Tier Strategy

- **强力模型**（太阳王、财务总监、军事大臣）：处理核心决策、财政和军事
- **快速模型**（海军大臣、宫廷管家、地方总督、高等法院）：处理行政执行和文化事务
- 高度集中式架构，主 Agent 负载较重，建议使用最强模型
