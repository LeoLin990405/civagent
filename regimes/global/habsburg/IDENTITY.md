# 哈布斯堡奥匈帝国二元制 — 组织架构

## 制度简介 (System Overview)
1867年“奥匈折中”确立了奥地利帝国与匈牙利王国的二元君主制，双方共享君主、外交、军事与财政，但在内政上完全独立。
The 1867 Ausgleich established a Dual Monarchy where the Austrian Empire and the Kingdom of Hungary shared a monarch, foreign policy, military, and finance while remaining internally independent.

## 组织架构图
                        ┌──────────────┐
                        │ Kaiser-König │
                        │   (共同君主)   │
                        └──────┬───────┘
                               │
                ┌──────────────┼──────────────┐
                ▼              ▼              ▼
          [共同事务部]    [奥地利内阁]   [匈牙利内阁]
          (外/军/财)     (Cisleithania) (Transleithania)
                │              │              │
                ▼              ▼              ▼
          [联合代表团]    [奥地利议会]   [匈牙利议会]
          (Delegation)   (Reichsrat)   (Diet)

## 角色映射表
| 历史角色 | Agent ID | AI 职责 | 推荐模型 |
|---|---|---|---|
| 共同君主 | kaiser-koenig | coordinator | opus |
| 共同外交大臣 | joint-foreign | management | sonnet |
| 共同战争大臣 | joint-war | devops | sonnet |
| 共同财政大臣 | joint-finance | data | haiku |
| 奥地利首相 | austrian-pm | engineering | sonnet |
| 匈牙利首相 | hungarian-pm | engineering | sonnet |
| 联合代表团 | joint-delegation | review | opus |

## 决策流程
1. **joint-foreign** 或 **joint-war** 提出涉及全帝国的共同事务提案。
2. **joint-finance** 核算预算需求，并根据约定的配额（Quota）向两方内阁分摊成本。
3. **kaiser-koenig** 对提案进行最高决策权审阅并签署。
4. **joint-delegation** 负责审议共同预算，并通过两方议会的互动达成共识。
5. **austrian-pm** 与 **hungarian-pm** 分别在各自领土内执行不相隶属的内政管理逻辑。

## 制度特点
- **主权分并**：外交与国防高度集中，而内政、司法、教育则完全剥离至两个独立的主权实体。
- **配额财政**：帝国运行成本由双方按比例（如70:30）分担，该配额每十年重新协商一次以维持平衡。
- **代表平衡**：通过各派60名代表组成联合代表团，解决了两个平等实体在共有立法权上的真空。
- **二元纽带**：共同君主是维持两套平行政治系统法律统一与领土完整的唯一核心节点。

## Pattern 映射
> **Orchestration pattern**: `dual-track`

## 历史参考
- 《1867年奥匈折中方案》(The Ausgleich of 1867)
- A.J.P. Taylor, *The Habsburg Monarchy 1809–1918*
- Pieter M. Judson, *The Habsburg Empire: A New History*
- Robert A. Kann, *A History of the Habsburg Empire, 1526–1918*
