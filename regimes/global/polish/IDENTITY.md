# 波兰立陶宛联邦 (Polish-Lithuanian Commonwealth) — 选举君主制

## 制度简介 (System Overview)
波兰立陶宛联邦（1569-1795）是欧洲近代早期最大的选举君主制国家，其实质是以“黄金自由”为核心的贵族共和国。国家主权归于由贵族（Szlachta）组成的瑟姆议会，国王权力受限并实行自由否决权制度。
The Polish-Lithuanian Commonwealth (1569-1795) was Europe's largest elective monarchy, a noble republic governed by "Golden Liberty." Sovereignty resided in the Sejm (parliament) where the king's power was strictly limited and any noble could invoke the Liberum Veto.

## 组织架构图 (Organization Chart)
```
                    ┌────────────────────────┐
                    │  选任国王 Elected King  │
                    └───────────┬────────────┘
                                │ 提案 / 执行
                ┌───────────────┼───────────────┐
                ▼               ▼               ▼
        [元老院 Senate]   [瑟姆议会 Sejm]   [大统领 Hetman]
          咨询与监督        最高立法机关       军事统帅
                │               │               │
        ┌───────┴──────┐        ▼               ▼
        ▼              ▼   [瑟姆元帅 Marshal]   [军队]
  [大法官 Chancellor]  [内阁]      │
    司法与外交         Ministers   ▼
                             [贵族 Szlachta]
                             (自由否决权 Veto)
```

## 角色映射表 (Role Mapping Table)
| 历史角色 | Agent ID | AI 职责 | 推荐模型 |
|---|---|---|---|
| 选任国王 (King) | elected-king | coordinator | sonnet |
| 瑟姆议会 (Sejm) | sejm-council | management | opus |
| 大法官 (Chancellor) | grand-chancellor | legal | opus |
| 瑟姆元帅 (Marshal) | sejm-marshal | review | sonnet |
| 大统领 (Hetman) | grand-hetman | devops | sonnet |
| 贵族代表 (Deputy) | noble-deputy | research | haiku |

## 决策流程 (Decision Flow)
1. **elected-king** 向 **sejm-marshal** 提交议案或召集瑟姆会议进行国家事务磋商
2. **noble-deputy** 代表各地方议会（Sejmiks）参与辩论，审视议案是否损害地方贵族权益
3. 若无任何 **noble-deputy** 行使“自由否决权”，议案由 **sejm-council** 进行最终集体表决
4. **grand-chancellor** 确保通过的法令符合宪制传统并加盖国玺以颁布实施
5. **grand-hetman** 根据议会批准的预算动员军事力量，执行边界防御或战争任务
6. **elected-king** 负责日常行政协调，并代表国家处理对外礼仪与外交联络

## 制度特点 (Characteristics)
- **黄金自由 (Golden Liberty)**：确保全体贵族在法律面前平等，君权受《亨利条款》严格约束。
  Ensures legal equality for all szlachta and strictly limits royal power via the Henrician Articles.
- **自由否决权 (Liberum Veto)**：单一议员的反对即可终止议会当前议程，体现了极端的全体一致原则。
  A single deputy's opposition could nullify an entire Sejm session, enforcing a principle of total unanimity.
- **君主选举制 (Elective Monarchy)**：国王由全体贵族直接选举产生，而非通过世袭继承，防止权力固化。
  Kings were elected by the nobility in person (viritim) rather than inheriting the throne.
- **瑟姆至上权 (Sejm Supremacy)**：国家的立法、税收和战争宣告权均被议会牢牢掌控，削弱了集权可能。
  The Sejm held exclusive authority over legislation, taxation, and war, preventing centralized tyranny.
- **行政官员终身制 (Distributed Executive)**：主要行政官员（如大统领和大法官）为终身制，国王无权随意撤换。
  Key high offices were lifetime appointments, ensuring executive power was not concentrated in the crown.

## Pattern 映射
> **Orchestration pattern**: `democratic`

## 历史参考 (Historical Sources)
- 《卢布林联合条约》（Union of Lublin, 1569）
- Norman Davies, *God's Playground: A History of Poland* (1981)
- Robert I. Frost, *The Oxford History of Poland-Lithuania* (2015)
- Adam Zamoyski, *The Polish Way: A Thousand-Year History of the Poles and Their Culture* (1987)
