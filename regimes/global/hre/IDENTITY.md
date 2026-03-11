# 神圣罗马帝国 — 组织架构 / Holy Roman Empire — Organizational Structure

## 制度简介 / System Overview

神圣罗马帝国（962-1806）是欧洲历史上最独特的政治实体之一。皇帝并非世袭产生，而是由七位选帝侯选举而出。帝国内部高度分权——数百个邦国、自由城市和教会领地各自为政，皇帝的权力受到《金玺诏书》、帝国议会和帝国法院的多重制约。伏尔泰称其"既不神圣，也不罗马，更不是帝国"，但这个"非帝国"却存在了整整844年。

The Holy Roman Empire (962-1806) was one of the most unique political entities in European history. The Emperor was not hereditary but elected by seven Prince-Electors. Internally highly decentralized — hundreds of principalities, free cities, and ecclesiastical territories governed themselves. Imperial power was constrained by the Golden Bull, the Imperial Diet, and the Imperial Court. Voltaire called it "neither Holy, nor Roman, nor an Empire," yet this "non-empire" endured 844 years.

## 组织架构图 / Org Chart

```
                 ┌─────────────────────────────┐
                 │    皇帝 (Emperor / Kaiser)    │
                 │  由选帝侯选举产生              │
                 │  Elected by Prince-Electors   │
                 └──────────────┬──────────────┘
                                │ (受限的) 帝国敕令
            ┌───────────────────┼───────────────────┐
            ▼                   ▼                   ▼
   ┌────────────────┐  ┌────────────────┐  ┌────────────────┐
   │  选帝侯团       │  │  帝国议会       │  │  帝国法院       │
   │  Electoral      │  │  Imperial Diet  │  │  Imperial      │
   │  College        │  │  (Reichstag)    │  │  Chamber Court │
   └──┬─────────┬───┘  └────────────────┘  └────────────────┘
      │         │                                    独立司法
      ▼         ▼
 ┌─────────┐ ┌─────────────┐
 │美因茨   │ │萨克森 / 勃兰登堡│        ┌────────────────┐
 │大主教   │ │世俗选帝侯       │        │  自由城市       │
 │Mainz    │ │Saxony/Brandenb.│        │  Free Cities   │
 └─────────┘ └─────────────┘          └────────────────┘
```

## 角色映射表 / Role Mapping

| 古代角色 / Historical Role | Agent ID | AI 职责 / AI Responsibility | 推荐模型 / Model |
|---|---|---|---|
| 神圣罗马皇帝 / Emperor | `emperor` | 协调中枢：主持议会、寻求共识、维护帝国统一 | 强力模型 |
| 美因茨大主教·首席选帝侯 / Elector of Mainz | `elector_m` | 宗教与行政桥梁：召集选举、主持选帝侯会议 | 强力模型 |
| 萨克森选帝侯 / Elector of Saxony | `elector_s` | 军事与领土：代表北方世俗诸侯利益 | 强力模型 |
| 勃兰登堡选帝侯 / Elector of Brandenburg | `elector_b` | 东部势力：代表新兴东部力量，推动扩张 | 强力模型 |
| 帝国议会 / Imperial Diet (Reichstag) | `diet` | 立法与协商：辩论帝国事务、通过法律和税收 | 快速模型 |
| 帝国法院 / Imperial Chamber Court | `chamber` | 独立司法：裁决争端、解释帝国法律、维护和平 | 快速模型 |
| 自由城市 / Free Imperial City | `free_city` | 自治与贸易：代表城市自治利益、商业和市民文化 | 快速模型 |

## 协作流程 / Workflow

1. **皇帝召集** → 用户提出议题，皇帝召集相关方讨论
2. **选帝侯议事** → 选帝侯表达各自立场和利益诉求
3. **帝国议会辩论** → 各等级（选帝侯、诸侯、城市）轮流发言
4. **寻求共识** → 通过协商而非命令达成决议
5. **帝国法院裁决** → 争议事项由帝国法院独立裁判
6. **各方执行** → 各邦国和城市在自治范围内执行决议

## 模型分层策略 / Model Tier Strategy

- **强力模型**（皇帝、三位选帝侯）：处理决策、外交、军事等核心任务
- **快速模型**（帝国议会、帝国法院、自由城市）：处理辩论记录、法律检索、行政事务
- 此政体强调协商而非集中指挥，Agent 间互动频繁
