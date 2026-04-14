# 波斯阿契美尼德帝国 / Persian Achaemenid Empire — 组织架构

## 制度简介 / System Overview

The Achaemenid Empire (550-330 BC), founded by Cyrus the Great, stretched from Egypt to the Indus — history's first true world empire. Its governance genius was the satrap system: semi-autonomous provincial governors bound to the center by taxation, military levies, and the covert Royal Eye inspectorate. The King of Kings maintained unity through standardized coinage, the Royal Road postal network, and Aramaic as the administrative lingua franca, while allowing subject peoples to retain local religions and customs.

阿契美尼德帝国（公元前550-330年）由居鲁士大帝建立，疆域从埃及延伸至印度河——历史上第一个真正的世界帝国。其治理天才是总督制：半自治的省级总督通过税收、兵役和秘密监察机构（皇帝之眼）与中央维系。万王之王通过统一币制、皇家驿道邮政系统和阿拉米语行政通用语维持帝国统一，同时允许被征服民族保留本地宗教与习俗。

## 组织架构图 / Org Chart

```
                    ┌─────────────────┐
                    │   Shahanshah    │
                    │   万王之王       │
                    └────────┬────────┘
                             │
          ┌──────────────────┼──────────────────┐
          ▼                  ▼                  ▼
   ┌──────────────┐  ┌────────────┐  ┌─────────────────┐
   │ Hazarapatis  │  │  Spahbed   │  │   Royal Eye     │
   │  宰相 / 总管  │  │  军事统帅   │  │   皇帝之眼       │
   └──────┬───────┘  └─────┬──────┘  └────────┬────────┘
          │                │                   │ (covert)
    ┌─────┴─────┐    ┌─────┴─────┐       ┌────┴────┐
    ▼           ▼    ▼           ▼       ▼         ▼
┌────────┐┌────────┐   ┌────────┐┌────────┐  ┌────────┐
│Satrap W││Satrap E│   │Satrap S││Satrap N│  │Eyes    │
│西部总督 ││东部总督 │   │南部总督 ││北部总督 │  │各路暗探 │
└────────┘└────────┘   └────────┘└────────┘  └────────┘
          │
   ┌──────┴──────┐
   ▼             ▼
┌────────┐ ┌──────────┐
│Treasurer│ │Royal Scribe│
│财政官    │ │ 文书官      │
└────────┘ └──────────┘
```

## 角色映射表 / Role Mapping

| 历史角色 / Historical Role | Agent ID | AI 职责 / AI Responsibility | 推荐模型 / Model |
|---|---|---|---|
| Shahanshah / 万王之王 | shah | coordinator — supreme policy, final arbitration | opus |
| Hazarapatis / 宰相 | hazarapatis | management — court coordination, resource allocation | opus |
| Spahbed / 军事统帅 | spahbed | devops — campaign logistics, troop mobilization | sonnet |
| Satrap / 总督 | satrap | management — provincial governance with local autonomy | sonnet |
| Royal Eye / 皇帝之眼 | royal-eye | review — covert inspection, loyalty verification | opus |
| Royal Treasurer / 财政官 | treasurer | data — tribute accounting, coinage standards | sonnet |
| Royal Scribe / 文书官 | scribe | content — decrees, records, multilingual archive | haiku |

## 决策流程 / Decision Flow

1. **shah** receives a report from a satrap or the royal-eye regarding provincial affairs
2. **hazarapatis** coordinates the response — routing to **spahbed** for military matters, **treasurer** for fiscal matters, or directly to the relevant **satrap**
3. **satrap** implements the decree locally, exercising autonomous adaptation to regional customs and conditions
4. **spahbed** coordinates troop levies across multiple satraps if military action is required
5. **royal-eye** conducts covert inspection of provincial compliance and reports directly to **shah**, bypassing normal channels
6. **scribe** records all decrees, inspection findings, and tribute flows in the imperial archive
7. **shah** reviews independent reports from both **satrap** (self-report) and **royal-eye** (independent verification), then adjusts policy

## 制度特点 / Characteristics

- **Satrap Autonomy**: Governors controlled local taxation, justice, and religion — only foreign policy and military remained centralized
- **Dual Reporting**: Satraps reported their own performance; the Royal Eye reported independently — the Shah cross-checked both
- **Tribute Diversity**: Each province paid in its own produce and currency, not uniform cash — reflecting genuine cultural respect
- **Covert Inspectorate**: The Royal Eye operated outside the chain of command, answerable only to the Shah — preventing information monopoly by any official
- **Lingua Franca Pragmatism**: Aramaic was imposed for administration only; local languages persisted in daily life and worship

## Pattern 映射

> **Orchestration pattern**: `federation`

## 历史参考 / Historical Sources

- Herodotus, *Histories*, Book III (on the satrap system and Darius's reforms)
- Xenophon, *Cyropaedia* (idealized account of Cyrus's governance model)
- Pierre Briant, *From Cyrus to Alexander: A History of the Persian Empire* (2002)
- Amélie Kuhrt, *The Persian Empire: A Corpus of Sources from the Achaemenid Period* (2007)
- 《波斯帝国史》（阿卜杜勒·侯赛因·扎林库伯著）
