# Persian Achaemenid Empire / 波斯阿契美尼德帝国 — 组织架构 / Organizational Structure

## 制度简介 / System Overview

The Achaemenid Empire (550-330 BC), founded by Cyrus the Great, was the largest empire the ancient world had seen. Its genius lay in the satrap system: provincial governors with extensive local autonomy, bound to the center through taxation, military obligation, and the secret inspectorate (the Royal Eye). The King of Kings ruled from Persepolis, Susa, and Ecbatana, governing through a sophisticated bureaucracy that respected local customs while maintaining imperial unity through the Royal Road postal system, standardized coinage, and Aramaic as the administrative lingua franca.

阿契美尼德帝国（公元前550-330年）由居鲁士大帝建立，是古代世界最大的帝国。其治理天才在于总督制：各省总督拥有广泛的地方自治权，通过税收、兵役义务和秘密监察机构（皇帝之眼）与中央联系。万王之王从波斯波利斯、苏萨和埃克巴坦那统治，通过尊重地方习俗的精密官僚体系维持帝国统一，依靠皇家驿道邮政系统、统一币制和阿拉米语作为行政通用语。

## 组织架构图 / Org Chart

```
                ┌──────────────────┐
                │   Shahanshah     │
                │  万王之王 (shah)   │
                └────────┬─────────┘
                         │
            ┌────────────┼────────────────┐
            ▼            ▼                ▼
    ┌──────────────┐ ┌────────┐   ┌────────────┐
    │ Hazarapatis  │ │Spahbed │   │ Royal Eye  │
    │ 宰相         │ │ 军事统帅 │   │ 皇帝之眼    │
    └──────┬───────┘ └────────┘   └─────┬──────┘
           │                            │ (secret)
      ┌────┴─────┐                 ┌────┴─────┐
      ▼          ▼                 ▼          ▼
┌──────────┐┌──────────┐   ┌──────────┐┌──────────┐
│ Satrap W ││ Satrap E │   │ inspect  ││ inspect  │
│ 西部总督  ││ 东部总督  │   │  West    ││  East    │
└──────────┘└──────────┘   └──────────┘└──────────┘
                    │
            ┌───────────────┐
            │ Royal Scribe  │
            │ 文书官          │
            └───────────────┘
```

## 角色映射表 / Role Mapping

| 古代角色 / Historical Role | Agent ID | AI 职责 / AI Responsibility | 推荐模型 / Model |
|---|---|---|---|
| Shahanshah / 万王之王 | shah | Supreme decision-maker, policy direction / 最高决策，政策方向 | Claude / GPT-4 |
| Hazarapatis / 宰相 | hazarapatis | Court coordination, access control / 宫廷协调，访问控制 | Claude / GPT-4 |
| Western Satrap / 西部总督 | satrap_w | Western provincial governance / 西部省务治理 | GPT-4 / Qwen |
| Eastern Satrap / 东部总督 | satrap_e | Eastern provincial governance / 东部省务治理 | GPT-4 / Qwen |
| Spahbed / 军事统帅 | spahbed | Military strategy and coordination / 军事战略与协调 | GPT-4 / DeepSeek |
| Royal Eye / 皇帝之眼 | eye | Secret inspection, loyalty verification / 秘密巡察，忠诚核查 | Claude / GPT-4 |
| Royal Scribe / 文书官 | scribe | Records, communications, archival / 记录，通信，档案 | GPT-4 / Qwen |

## 协作流程 / Workflow

1. **Imperial Decree** — The Shahanshah issues a directive, often through the Hazarapatis.
2. **Court Distribution** — The Hazarapatis relays orders to the relevant satraps and the Spahbed.
3. **Provincial Execution** — Satraps implement with local autonomy, adapting to regional conditions.
4. **Military Coordination** — The Spahbed coordinates with satraps for troop levies and campaigns.
5. **Secret Inspection** — The Royal Eye independently verifies compliance and reports directly to the Shahanshah.
6. **Record Keeping** — The Royal Scribe documents all decisions, decrees, and reports in the imperial archive.
7. **Feedback Loop** — Satraps report results; the Royal Eye provides an independent assessment; the Shahanshah adjusts policy.
