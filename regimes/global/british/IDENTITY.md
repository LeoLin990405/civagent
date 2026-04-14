# 英国议会制 / British Parliamentary System — 组织架构 / Organizational Structure

## 制度简介 (System Overview)
英国议会制定型于1689年《权利法案》之后，并在18世纪内阁政府形成、19世纪责任内阁成熟的过程中稳定下来，至今已连续运行三百余年。  
The system's core significance is that the Crown reigns but does not govern, while the Prime Minister and Cabinet must retain the confidence of the House of Commons and act through Parliament.  
普通法、成文法与宪制惯例共同构成其“不成文宪法”，并使这一模式在英联邦及其他议会民主国家中产生了广泛影响。

## 组织架构图 (Organization Chart)
> Crown / 君主  
> └─ appoints PM / Royal Assent  
>    └─ Prime Minister / 首相  
>       └─ Cabinet / 内阁  
>          ├─ Parliament / 议会  
>          │  ├─ House of Commons / 下议院 (confidence)  
>          │  └─ House of Lords / 上议院 (revision)  
>          ├─ Departments / 各部  
>          └─ Judiciary / 司法系统 (independent)

## 角色映射表 (Role Mapping Table)
| 历史角色 | Agent ID | AI 职责 | 推荐模型 |
|---|---|---|---|
| 君主 / Sovereign | crown | coordinator | haiku |
| 首相 / Prime Minister | prime-minister | management | opus |
| 下议院 / House of Commons | house-of-commons | review | opus |
| 上议院 / House of Lords | house-of-lords | review | sonnet |
| 大法官 / Lord Chancellor | lord-chancellor | legal | opus |
| 财政大臣 / Chancellor of the Exchequer | exchequer | data | sonnet |
| 外交大臣 / Foreign Secretary | foreign-secretary | research | opus |
| 内政大臣 / Home Secretary | home-secretary | management | sonnet |

## 决策流程 (Decision Flow)
1. `crown` 按惯例任命最可能获得下议院信任的 `prime-minister`。  
2. `prime-minister` 协调 `exchequer`、`foreign-secretary` 与 `home-secretary`，把施政纲领转成预算、外交和内政方案。  
3. `house-of-commons` 进行辩论、修正与表决；若失去 confidence 或 supply，政府必须重组或辞职。  
4. `house-of-lords` 对法案进行二院审查，提出修正并在两院之间往返协商。  
5. `lord-chancellor` 检查法案与普通法、成文法及宪制惯例的兼容性。  
6. `crown` 给予 Royal Assent，之后相关部门按责任内阁体系执行。

## 制度特点 (Characteristics)
- 议会主权：成文法一经议会通过即成为最高政治法源，行政命令只能在授权范围内运作。  
- 责任内阁：政府成员从议会产生，并必须持续维持下议院信任；信任案、供给案与预算案直接决定政府存续。  
- 两院不对称：下议院掌握财政与最终政治授权，上议院主要负责修订、延迟与专家审查，其否决权受 Parliament Acts 限制。  
- 君主礼仪化：任命、御准、解散等权力以王室名义存在，但实际按宪制惯例由大臣建议驱动，形成 “Crown in Parliament”。  
- 程序化问责：Question Time、select committees、反对党权利与党鞭纪律把监督、修法与政党竞争嵌入日常流程。  
- 不成文宪法：普通法判例、议会法令与宪制惯例共同定义边界，规则通过 precedent 持续演化。  

## Pattern 映射
> **Orchestration pattern**: `checks-and-balances`

## 历史参考 (Historical Sources)
- 《权利法案》Bill of Rights 1689  
- 《王位继承法》Act of Settlement 1701  
- 《1911年国会法》与《1949年国会法》Parliament Acts  
- UK Cabinet Office, Cabinet Manual
