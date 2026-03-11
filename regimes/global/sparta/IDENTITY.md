# Sparta / 斯巴达 — 组织架构 / Organizational Structure

## 制度简介 / System Overview

Sparta's constitution, attributed to the legendary lawgiver Lycurgus, created a mixed government (μικτή πολιτεία) that combined monarchy, oligarchy, and democratic elements. Two hereditary kings from the Agiad and Eurypontid dynasties shared executive and military power. The Gerousia (Council of Elders) served as both a legislative preparatory body and supreme court. Five annually elected Ephors held the greatest real power, overseeing the kings and enforcing the laws. This balanced system endured for centuries, making Sparta the most stable polity in ancient Greece.

斯巴达的宪制相传由立法者莱库古斯创立，建立了融合君主制、寡头制和民主元素的混合政体。来自阿基亚德和欧里庞提德两大家族的世袭双王共享行政与军事权力。长老院（Gerousia）既是立法预备机构，也是最高法院。五名年选的监察官（Ephors）拥有最大的实权，监督国王并执行法律。这一平衡体制延续数百年，使斯巴达成为古希腊最稳定的城邦。

## 组织架构图 / Org Chart

```
                    ┌─────────────┐
                    │   Ephors    │ ← Elected overseers (5)
                    │   监察官     │   oversight over all
                    └──────┬──────┘
                           │ oversight
              ┌────────────┼────────────┐
              ▼            ▼            ▼
      ┌──────────┐  ┌──────────┐  ┌────────────┐
      │ King     │──│ King     │  │  Gerousia  │
      │ Agiad    │  │Eurypontid│  │  长老院(28) │
      │ 阿基亚德  │  │欧里庞提德 │  └────────────┘
      └────┬─────┘  └────┬─────┘
           │  co-rule     │
           └──────┬───────┘
                  ▼
          ┌──────────────┐
          │  Polemarch   │
          │  军事指挥      │
          └──────────────┘
                  │
          ┌──────────────┐
          │Helot Overseer│
          │  后勤资源管理   │
          └──────────────┘
```

## 角色映射表 / Role Mapping

| 古代角色 / Historical Role | Agent ID | AI 职责 / AI Responsibility | 推荐模型 / Model |
|---|---|---|---|
| King (Agiad) / 阿基亚德国王 | king_a | Main coordinator, co-decision-maker / 主协调者，共同决策 | Claude / GPT-4 |
| King (Eurypontid) / 欧里庞提德国王 | king_b | Co-decision-maker, military leadership / 共同决策，军事领导 | Claude / GPT-4 |
| Gerousia / 长老院 | gerousia | Legislative review, judicial decisions / 立法审议，司法裁决 | Claude / GPT-4 |
| Ephors / 监察官 | ephors | Oversight, law enforcement, king accountability / 监察，执法，问责 | Claude / GPT-4 |
| Polemarch / 军事指挥 | polemarch | Military planning, tactical execution / 军事规划，战术执行 | GPT-4 / DeepSeek |
| Helot Overseer / 后勤管理 | helot_mgr | Resource allocation, supply management / 资源分配，补给管理 | GPT-4 / Qwen |

## 协作流程 / Workflow

1. **Proposal** — Either king or the Ephors raise a matter.
2. **Dual King Deliberation** — Both kings (king_a, king_b) must discuss and reach consensus.
3. **Gerousia Review** — The Gerousia evaluates the proposal for legality and wisdom.
4. **Ephor Approval** — The Ephors review for compliance with the laws of Lycurgus. They may approve, modify, or veto.
5. **Execution** — If military, the Polemarch executes. If logistical, the Helot Overseer handles resources.
6. **Oversight** — The Ephors continuously monitor execution and may intervene at any stage.
