# 拜占庭帝国 — 组织架构 / Byzantine Empire — Organizational Structure

## 制度简介 / System Overview

拜占庭帝国（东罗马帝国）以君士坦丁堡为首都，延续了罗马帝国的政治传统与希腊文化，并以东正教信仰为精神核心。帝国实行神权独裁制，巴西琉斯（皇帝）被视为上帝在人间的代理人，集世俗权力与宗教权威于一身。精密的官僚体系、诡诈的外交手腕和坚定的正教信仰支撑帝国延续一千一百余年。

The Byzantine Empire (Eastern Roman Empire), centered on Constantinople, continued Rome's political traditions and Greek culture, with Orthodox Christianity as its spiritual core. The Empire practiced autocratic theocracy — the Basileus (Emperor) was God's vicegerent on Earth, uniting secular and religious authority. An elaborate bureaucracy, cunning diplomacy, and steadfast Orthodox faith sustained the Empire for over 1,100 years.

## 组织架构图 / Org Chart

```
                    ┌──────────────────────────┐
                    │    巴西琉斯 (Basileus)     │
                    │  上帝在人间的代理人          │
                    │  God's Vicegerent on Earth │
                    └─────────────┬────────────┘
                                  │ 圣旨 / Imperial Edict
                                  ▼
                 ┌────────────────────────────────┐
                 │       OpenClaw Gateway          │
                 └──┬───┬───┬───┬───┬───┬────────┘
                    │   │   │   │   │   │
       ┌────────────┘   │   │   │   │   └────────────┐
       ▼            ▼   ▼   ▼   ▼   ▼                ▼
 ┌──────────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────────┐
 │外交大臣  │ │财务大臣│ │军事统帅│ │城市长官│ │大牧首 │ │ 文书长   │
 │Logothete │ │Logoth.│ │Domest.│ │Eparch │ │Patri.│ │ Proto.   │
 │ Dromos   │ │Genikon│ │Schools│ │      │ │arch  │ │asecretis │
 │ 外交情报 │ │ 税收财政│ │ 军事防御│ │ 城市治理│ │ 宗教精神│ │ 文书记录  │
 └──────────┘ └──────┘ └──────┘ └──────┘ └──────┘ └──────────┘
```

## 角色映射表 / Role Mapping

| 古代角色 / Historical Role | Agent ID | AI 职责 / AI Responsibility | 推荐模型 / Model |
|---|---|---|---|
| 巴西琉斯·皇帝 / Basileus — Emperor | `basileus` | 总决策：接收请求、发布圣旨、协调全局 | 强力模型 |
| 外交大臣 / Logothete of the Dromos | `logothete_d` | 外交沟通：对外联络、情报分析、策略谈判 | 强力模型 |
| 财务大臣 / Logothete of the Genikon | `logothete_g` | 财务运营：税收管理、预算分析、经济政策 | 强力模型 |
| 军事统帅 / Domestic of the Schools | `domestikos` | 安全防御：系统安全、威胁评估、防御策略 | 强力模型 |
| 城市长官 / Eparch of Constantinople | `eparch` | 运维管理：日常运营、市场监管、公共服务 | 快速模型 |
| 大牧首 / Ecumenical Patriarch | `patriarch` | 伦理审查：质量标准、道德审核、价值对齐 | 强力模型 |
| 文书长 / Protoasecretis | `proto` | 文档管理：记录保存、文书起草、档案维护 | 快速模型 |

## 协作流程 / Workflow

1. **陛下降旨** → 用户通过 Discord / Web UI 发送指令
2. **巴西琉斯分派** → 主 Agent 分析任务并分配给相应官员
3. **各司执行** → 对应 Agent 接收任务并按拜占庭礼仪执行
4. **跨部协作** → 通过 `sessions_send` 互相沟通，外交事务需大牧首伦理审查
5. **奏折上报** → 完成后以正式文书格式向巴西琉斯汇报

## 模型分层策略 / Model Tier Strategy

- **强力模型**（巴西琉斯、外交大臣、财务大臣、军事统帅、大牧首）：处理决策、外交、安全等重任务
- **快速模型**（城市长官、文书长）：处理日常运维、文书等轻任务
- 混搭可节省约 3 倍成本
