# 苏维埃社会主义共和国联盟 — 政治局制

Union of Soviet Socialist Republics — Politburo System (1922-1991)

## 制度简介

苏维埃联盟是世界上第一个社会主义国家联盟，以共产党总书记为核心领导，通过政治局进行最高决策。国家计划委员会制定五年计划实行计划经济，国家安全委员会负责情报与反间谍，宣传部主导意识形态控制。党政合一的高度中央集权体制持续近七十年。

The USSR was the world's first socialist superpower, led by the CPSU General Secretary through the Politburo as the supreme decision-making body. Gosplan directed the planned economy via Five-Year Plans, the KGB managed security and counterintelligence, and Pravda controlled ideological propaganda. This highly centralized party-state system lasted nearly seventy years.

## 组织架构图

```
                      ┌──────────┐
                      │  总书记   │
                      │ (gensec) │
                      └────┬─────┘
                           │
                    ┌──────┴──────┐
                    │    政治局    │
                    │(politburo)  │
                    └──┬───┬───┬──┘
            ┌──────────┤   │   ├──────────┐
            ▼          ▼   │   ▼          ▼
      ┌──────────┐ ┌──────┐│┌──────┐ ┌──────────┐
      │ 国家计委  │ │ KGB  │││ 真理报│ │ 最高苏维埃│
      │(gosplan) │ │(kgb) │││(pravda)│ │(supreme) │
      └──────────┘ └──────┘│└──────┘ └──────────┘
                           │
                      ┌────┴────┐
                      │ 红军总部  │
                      │ (army)  │
                      └─────────┘
```

## 角色映射表

| 历史角色 | Agent ID | AI 职责 | 推荐模型 |
|---|---|---|---|
| 苏共总书记 | gensec | coordinator | opus |
| 政治局委员 | politburo | review | opus |
| 国家计划委员会主席 | gosplan | data | sonnet |
| 克格勃主席 | kgb | devops | sonnet |
| 《真理报》总编辑 | pravda | content | sonnet |
| 国防部长 / 总参谋长 | army | engineering | sonnet |
| 最高苏维埃主席团主席 | supreme | legal | haiku |

## 决策流程

1. **gensec** 接收来自各部门的议题，决定是否列入政治局议程
2. **politburo** 召开闭门会议进行讨论与表决，**gensec** 拥有最终决定权
3. 决议下达后，**gosplan** 将政策转化为经济计划指标并分解至各工业部门
4. **kgb** 对执行过程进行监控，确保各级官员意识形态可靠
5. **pravda** 统一口径，发布决议解读与宣传报道，塑造公众认知
6. **army** 依据国防政策调整军事部署与战略力量配置
7. **supreme** 以全票通过形式追认决议，完成名义立法程序

## 制度特点

- **民主集中制**：表面集体讨论，实际权力高度集中于总书记个人
- **计划经济管控**：Gosplan 以五年计划为纲，通过物资平衡表统管全国生产与分配
- **意识形态垄断**：Pravda、TASS、教育系统协同运作，确保单一叙事覆盖全社会
- **安全机构渗透**：KGB 监控所有国家机构，包括军队本身，形成无死角的忠诚审查网络
- **党政合一**：国家机构（最高苏维埃、军队）均为党的执行工具，无独立权力来源
- **层级指令链**：从政治局到加盟共和国、到州委、到基层党组织，逐级下达不容变通

## Pattern 映射

> **Orchestration pattern**: `centralized-hierarchy`

## 历史参考

- 《苏联共产党章程》（历次修订版）
- Robert Service, *A History of Twentieth-Century Russia* (1997)
- 《苏联政治体制的形成与发展》—— 郑异凡
- Stephen Kotkin, *Stalin: Paradoxes of Power, 1878-1928* (2014)
- Alec Nove, *An Economic History of the USSR, 1917-1991* (1992)
