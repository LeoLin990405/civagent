# 俄罗斯沙皇制 — 组织架构 / Russian Tsardom — Organizational Structure

## 制度简介 / System Overview

俄罗斯沙皇制（1547-1917）是欧洲历史上持续时间最长的专制制度之一。自伊凡四世（伊凡雷帝）加冕为沙皇，到末代沙皇尼古拉二世退位，历经三百七十年。沙皇自称"全俄罗斯的专制君主"，以"第三罗马"自居，继承拜占庭正教传统。贵族杜马名义上辅佐沙皇，参政院执行政令，宗教会议管理信仰事务，总督体系治理幅员辽阔的帝国疆域。

The Russian Tsardom (1547-1917) was one of the longest-enduring autocratic systems in European history. From Ivan IV (Ivan the Terrible)'s coronation as Tsar to the abdication of Nicholas II, it spanned 370 years. The Tsar styled himself "Autocrat of All the Russias," claiming the legacy of the "Third Rome" and Byzantine Orthodox tradition. The Boyar Duma nominally advised, the Senate executed decrees, the Holy Synod managed religious affairs, and the Governor-General system administered the vast imperial territories.

## 组织架构图 / Org Chart

```
                    ┌─────────────────────────────┐
                    │    沙皇 (Tsar / Gosudar)     │
                    │  全俄罗斯的专制君主            │
                    │  Autocrat of All the Russias  │
                    └──────────────┬──────────────┘
                                   │ 圣旨 (Ukaz)
                    ┌──────────────┼──────────────┐
                    ▼              ▼              ▼
           ┌──────────────┐ ┌──────────┐ ┌──────────────┐
           │ 贵族杜马      │ │ 参政院   │ │ 宗教会议      │
           │ Boyar Duma   │ │ Senate   │ │ Holy Synod   │
           │ 咨询建议      │ │ 行政执行 │ │ 精神指导      │
           └──────────────┘ └────┬─────┘ └──────────────┘
                                 │
                    ┌────────────┼────────────┐
                    ▼            ▼            ▼
              ┌──────────┐ ┌──────────┐ ┌──────────┐
              │ 总督     │ │ 军事大臣 │ │ 财政大臣 │
              │Governor  │ │War Min.  │ │Fin. Min. │
              │ 地方治理 │ │ 军事指挥 │ │ 财政管理 │
              └──────────┘ └──────────┘ └──────────┘
```

## 角色映射表 / Role Mapping

| 古代角色 / Historical Role | Agent ID | AI 职责 / AI Responsibility | 推荐模型 / Model |
|---|---|---|---|
| 沙皇·专制君主 / Tsar — Autocrat | `tsar` | 绝对决策：一切权力的源泉，最终裁决者 | 强力模型 |
| 贵族杜马 / Boyar Duma | `duma` | 咨询建议：提供多方意见，但沙皇最终决断 | 强力模型 |
| 参政院 / Governing Senate | `senate` | 行政执行：协调各部门、执行圣旨、上诉裁判 | 强力模型 |
| 宗教会议 / Holy Synod | `synod` | 精神指导：伦理审查、道德标准、价值对齐 | 快速模型 |
| 总督 / Governor-General | `governor` | 地方治理：执行政令、征税、维护边疆安全 | 快速模型 |
| 军事大臣 / Minister of War | `war_minister` | 军事战略：军队指挥、边防安全、军事改革 | 强力模型 |
| 财政大臣 / Minister of Finance | `fin_minister` | 财政管理：国库管理、税收政策、经济现代化 | 快速模型 |

## 协作流程 / Workflow

1. **沙皇下旨** → 用户发出指令，沙皇以圣旨(ukaz)形式颁布
2. **杜马议事** → 贵族杜马讨论并提供建议（沙皇可采纳或忽略）
3. **参政院执行** → 参政院将圣旨转化为具体行政命令
4. **各部实施** → 军事大臣、财政大臣在各自领域执行
5. **总督落实** → 地方总督在各省推行政令
6. **宗教会议审查** → 涉及道德和伦理的事务由宗教会议审核
7. **回禀沙皇** → 完成后以正式奏折向沙皇汇报

## 模型分层策略 / Model Tier Strategy

- **强力模型**（沙皇、贵族杜马、参政院、军事大臣）：处理核心决策和战略事务
- **快速模型**（宗教会议、总督、财政大臣）：处理日常行政和监督事务
- 高度集权架构，沙皇 Agent 负载最重
