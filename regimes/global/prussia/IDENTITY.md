# 普鲁士王国 — 腓特烈时代军事官僚制

## 制度简介 / System Overview

普鲁士王国在腓特烈·威廉一世与腓特烈大帝治下（约1723–1786）锻造出"带有国家的军队"——以 1723 年设立的总执行部（Generaldirektorium）为枢纽，省级军政-王领厅（Kriegs- und Domänenkammern）为执行臂膀，容克贵族垄断军官团，国王则通过内阁谕令（Kabinettsordre）凌驾于合议机构之上亲政。这一开明专制下的合议-内阁体制，是普鲁士军事官僚机器的成型期，也是现代官僚国家的经典原型。（俾斯麦的帝国宰相制属 19 世纪另一套体系，宜单列。）

In the reigns of Frederick William I and Frederick the Great (c. 1723–1786) the Kingdom of Prussia forged "an army with a state." Its hub was the General Directory (Generaldirektorium, est. 1723); its executive arms were the provincial War-and-Domains Chambers (Kriegs- und Domänenkammern); the Junker nobility monopolized the officer corps; and the king ruled personally through cabinet orders (Kabinettsordre) issued above the collegial boards. This collegial-cum-cabinet system of enlightened absolutism is the formative phase of the Prussian military-bureaucratic machine. (Bismarck's chancellor system is a distinct 19th-c. order, best modeled separately.)

## 组织架构图 / Organization Chart

```
                      ┌─────────────────────┐
                      │   König / 国王        │
                      │  亲政 + 最高统帅       │
                      └──────────┬──────────┘
                                 │ Kabinettsordre 内阁谕令
                      ┌──────────▼──────────┐
                      │  Kabinett 内阁机要    │
                      │ (drafts royal orders)│
                      └──────────┬──────────┘
          ┌──────────────────────┼──────────────────────┐
          ▼                      ▼                       ▼
 ┌──────────────────┐ ┌──────────────────┐  ┌──────────────────┐
 │ Generaldirektorium│ │ Justiz/Großkanzler│  │ Offizierkorps     │
 │ 总执行部(财政·军务·│ │ 司法大臣(邦法编纂) │  │ 容克军官团(指挥)   │
 │ 王领合议院,1723)   │ └──────────────────┘  │  + Generalstab(萌芽)│
 └────────┬─────────┘                        └──────────────────┘
          ▼
 ┌──────────────────┐
 │ Kriegs- u.       │
 │ Domänenkammer    │
 │ 省级军政-王领厅    │
 │ (征兵·税收·王领)   │
 └──────────────────┘
```

## 角色映射表 / Role Mapping Table

| 历史角色 / Historical Role | Agent ID | AI 职责 / AI Responsibility | 推荐模型 / Model |
|---|---|---|---|
| 国王 / König | koenig | coordinator | opus |
| 内阁机要 / Kabinett (Kabinettssekretär) | kabinett | content | sonnet |
| 总执行部 / Generaldirektorium | generaldirektorium | management | opus |
| 省级军政-王领厅 / Kriegs- und Domänenkammer | domaenenkammer | devops | haiku |
| 司法大臣 / Justizminister (Großkanzler) | justizminister | legal | sonnet |
| 容克军官团 / Offizierkorps (Junker) | offizierkorps | engineering | sonnet |
| 总参谋部(萌芽) / Generalstab (nascent) | generalstab | research | opus |

## 决策流程 / Decision Flow

1. **koenig** 设定国家战略目标（战争/外交/内政），亲自裁断
2. **kabinett** 将国王意志拟为内阁谕令（Kabinettsordre），绕过合议机构直达各部
3. **generalstab** 制定作战与动员的技术方案，**generaldirektorium** 评估财政与王领资源可行性
4. **justizminister** 审核措施是否合于普鲁士邦法（Allgemeines Landrecht 编纂传统）
5. **generaldirektorium** 下达行政指令，**domaenenkammer** 在各省执行征兵、税收与王领管理
6. **offizierkorps** 统领军队执行作战，参谋军官在野战部队与参谋部间轮岗反馈
7. **koenig** 在关键节点裁决争议并签发最终谕令

## 制度特点 / Characteristics

- **合议-内阁双层**：总执行部（Generaldirektorium）为合议制中枢，但国王以内阁谕令（Kabinettsordre）于其上亲政，形成"开明专制"特有的决策捷径
- **总执行部统财军**：1723 年合并总军务委员会与总财政部，集财政、军务、王领管理于一院，下辖各省军政-王领厅垂直执行
- **容克军官垄断**：Junker 贵族阶层世袭占有军官与高级文官职位，形成军政合一精英集团；"社会军事化"是其底层逻辑
- **参谋雏形**：18 世纪的参谋机构尚属萌芽，成熟的大总参谋部（Großer Generalstab）是 19 世纪沙恩霍斯特—毛奇的发展，此处仅为前身
- **法典化治理**：Cocceji 司法改革与《普鲁士普通邦法》（Allgemeines Landrecht）编纂，使官僚行政有成文法依据
- **省级垂直管理**：Kriegs- und Domänenkammer 由中央直辖，是军事征发与税收的执行节点

## Pattern 映射

> **Orchestration pattern**: `centralized`

## 历史参考 / Historical Sources

- Clark, Christopher. *Iron Kingdom: The Rise and Downfall of Prussia, 1600–1947* (2006) — 制度分期，腓特烈体制与俾斯麦体制之别
- Rosenberg, Hans. *Bureaucracy, Aristocracy and Autocracy: The Prussian Experience 1660–1815* (1958) — 总执行部与容克-官僚融合
- Johnson, Hubert C. *Frederick the Great and His Officials* (1975) — 总执行部、省级厅与内阁政府的实际运作
- Büsch, Otto. *Militärsystem und Sozialleben im alten Preußen* (1962) — 容克军官团与社会军事化
- *Allgemeines Landrecht für die Preußischen Staaten* (1794) — 普鲁士成文邦法
