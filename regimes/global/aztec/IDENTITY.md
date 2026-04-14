# 阿兹特克三方联盟 — 组织架构

## 制度简介
阿兹特克三方联盟（Aztec Triple Alliance）由特诺奇蒂特兰（Tenochtitlan）、特斯科科（Texcoco）和特拉科潘（Tlacopan）三个城邦于 1428 年组成，是中美洲历史上最强大的政治联盟。大议长（Huey Tlatoani）为联盟最高领袖，蛇女神（Cihuacoatl）共掌内政。三城保留高度自治，联合指挥军事行动并分配贡赋，情报与贸易网络由商人间谍（Pochteca）维持。该制度运行约 93 年，直至 1521 年被西班牙征服终结。

## 组织架构图
```
                    ┌─────────────┐
                    │ Huey Tlatoani │
                    │   大议长     │
                    │ (特诺奇蒂特兰) │
                    └──────┬──────┘
                           │ 最高决策
           ┌───────────────┼───────────────┐
           │               │               │
    ┌──────┴─────┐  ┌───────┴────┐  ┌───────┴────┐
    │ Cihuacoatl │  │  Texcoco   │  │  Tlacopan  │
    │  内政总管  │  │ 特斯科科王  │  │ 特拉科潘王  │
    │ (行政司法) │  │ (法律文化)  │  │ (军事协调) │
    └────────────┘  └────────────┘  └────────────┘
           │                               │
           │                         ┌────┴────┐
           │                         │Tlacochcalcatl│
           │                         │ 最高武士 │
           │                         └────┬────┘
           │                              │
           ▼                              ▼
    ┌─────────────┐              ┌─────────────┐
    │  Calpulli   │              │  Warrior    │
    │  (基层社区) │              │  Orders     │
    └─────────────┘              │(鹰骑士/豹骑士)│
                                 └─────────────┘
                                       ▲
                                       │
                               ┌───────┴───────┐
                               │  Pochteca     │
                               │  商人间谍     │
                               │ (情报贸易网络) │
                               └───────────────┘
```

## 角色映射表
| 历史角色 | Agent ID | AI 职责 | 推荐模型 |
|---|---|---|---|
| 大议长 | tlatoani | coordinator | sonnet |
| 内政总管（蛇女神） | cihuacoatl | data | sonnet |
| 特斯科科王 | texcoco | legal | opus |
| 特拉科潘王 | tlacopan | management | sonnet |
| 最高武士 | warrior | devops | sonnet |
| 商人间谍 | pochteca | research | opus |

## 决策流程
1. **pochteca** 收集情报并向 **tlatoani** 汇报（敌情、贸易、贡赋）
2. **tlatoani** 召集三城 Tlatoque 会议（**texcoco**、**tlacopan**）共同商议
3. **cihuacoatl** 评估内政影响与资源调配
4. **warrior** 制定军事行动计划
5. **tlatoani** 结合内政评估与军事计划作出最终决策
6. 三城联动执行，**warrior** 指挥作战，**cihuacoatl** 监控后勤

## 制度特点
- 三城共治：大议长虽为联盟之首，特斯科科与特拉科潘保留实质自治权
- 贡赋分成：特诺奇蒂特兰取 2/5，特斯科科取 2/5，特拉科潘取 1/5
- 商战一体：Pochteca 同时负担情报收集与战略贸易，战前提供敌方部署
- 内政分工：大议长主外（战争、外交），蛇女神主内（司法、税收、社区）
- 武士晋升与贡赋系统联动，俘虏数量决定社会地位

## Pattern 映射
> **Orchestration pattern**: `democratic-council`

## 历史参考
- 《墨西哥古代史》（Ancient History of Mexico，Manrique 主编）
- 《阿兹特克帝国：中心与边陲》（The Aztec Empire: Center and Periphery，Berlo et al. 编辑）
- Nezahualcoyotl《诗选》（Flor y Canto de Nezahualcoyotl）
- 《阿兹特克税法与贡赋文献》（Codex Mendoza，1541 年编）
- 西班牙征服者贝尔纳尔·迪亚斯·德尔·卡斯蒂略《征服新西班牙的真实故事》（The True History of the Conquest of New Spain，1568 年）
