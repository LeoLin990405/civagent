# 威尼斯共和国 — 组织架构

## 制度简介
威尼斯共和国，又称"至尊共和国"（La Serenissima），自697年至1797年统治亚得里亚海沿岸逾千年。总督（Doge）虽终身当选，却受大议会和十人委员会严格制衡；贵族寡头制通过精密的选举与弹劾机制维持稳定。独特的反贪防腐设计使其成为中世纪商业共和国的典范。

## 组织架构图
```
                    ┌─────────────────────┐
                    │   GREAT COUNCIL     │
                    │   大议会              │
                    │   (立法/选举总督)      │
                    └──────────┬──────────┘
                               │ 选举/立法
              ┌────────────────┼────────────────┐
              ▼                ▼                ▼
        [元老院]          [总督 Doge]       [十人委员会]
         参议决策           礼仪元首           安全监察
              │                │                │
              │                │                ▼
              │         ┌──────┴──────┐   [检察官]
              │         │  Committee  │    法律审计
              │         │   Chairs    │
              │         │   委员会主席  │
              │         └──────┬──────┘
              │                │
              ▼                ▼
        [军械库 Arsenal]  [海关 Customs]
           造舰/军备         贸易监管
```

## 角色映射表
| 历史角色 | Agent ID | AI 职责 | 推荐模型 |
|---|---|---|---|
| 总督 | doge | coordinator | sonnet |
| 大议会 | great-council | management | haiku |
| 十人委员会 | council-of-ten | review | sonnet |
| 元老院 | senate | engineering | sonnet |
| 检察官 | avogadori | legal | sonnet |
| 委员会主席 | savio | coordinator | haiku |
| 军械库总监 | arsenal | devops | haiku |

## 决策流程
1. **savio** 准备议题并协调各委员会
2. **senate** 辩论政策细节，起草法案
3. **great-council** 投票表决（须达到法定人数）
4. **doge** 颁布法令（礼仪性，不能拒绝合法通过的法案）
5. **arsenal** 执行造舰与军备后勤

监督流程：1. **avogadori** 审计所有机构合法性；2. **council-of-ten** 调查安全威胁与腐败；3. **avogadori** 审查十人委员会是否越权

## 制度特点
- 多重选举：总督由大议会间接秘密投票选出，防止派系垄断
- 十人委员会：独立于元老院，直接向大议会负责，可弹劾总督
- 检察官制：avogadori 拥有对所有机构的公诉权，含对十人委员会的复审权
- 禁止私交：总督不得与外国使节单独会面，须有官员在场
- 权力分散：行政、立法、司法职能分属不同机构，互相制衡

## Pattern 映射
> **Orchestration pattern**: `checks-and-balances`

## 历史参考
- Robert C. Davis, *Shipbuilders of the Venetian Arsenal* (1991)
- James S. Grubb, *When Myths Lose Power: Four Decades of Venetian Historiography* (1986)
- William J. R. Curtis, *Venice: The City of Canals* (1987)
- 《威尼斯史》（Gioconda 光荣的千年共和）
