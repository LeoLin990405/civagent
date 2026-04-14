# Swiss Confederation / 瑞士联邦 — 组织架构

## 制度简介
瑞士联邦自1291年三个森林州结盟以来，已发展为26州的联邦直接民主体制。联邦委员会七人集体领导、轮值主席制、四种官方语言共存、永久武装中立。直接民主的核心机制——全民公投和公民动议——使公民能够对任何联邦法律发起挑战或提出宪法修正案。

## 组织架构图
```
                 ┌─────────────┐
                 │ Landsgemeinde│ 露天集会（部分州）
                 │ 公民直接参与  │
                 └──────┬──────┘
                        │ 公民动议 / 公投
        ┌───────────────┼───────────────┐
        ▼               ▼               ▼
  ┌──────────┐   ┌──────────────┐   ┌──────────┐
  │ 国民院   │   │   联邦院     │   │ 联邦最高法院│
  │National  │◄─►│ Council of  │   │Bundes-   │
  │ Council  │   │   States    │   │gericht   │
  │ 200席    │   │   46席      │   └────┬─────┘
  └────┬─────┘   └──────┬──────┘        │
       └────── equal ───┘              │
              │ 共同立法               │
       ┌──────┴──────┐                 │
       │ 联邦委员会   │                 │
       │Bundesrat   │◄───────────────┘
       │7人集体领导  │   司法审查
       │轮值主席    │
       └──────┬─────┘
              │
       ┌──────┴──────┐
       │ 联邦总理    │
       │ Kanzler    │
       │ 行政协调    │
       └────────────┘
```

## 角色映射表
| 历史角色 | Agent ID | AI 职责 | 推荐模型 |
|---|---|---|---|
| 联邦委员会 | bundesrat | coordinator | sonnet |
| 国民院 | nationalrat | legislation | sonnet |
| 联邦院 | staenderat | legislation | sonnet |
| 联邦最高法院 | bundesgericht | legal | sonnet |
| 露天集会 | landsgemeinde | research | opus |
| 联邦总理 | kanzler | management | haiku |

## 决策流程
1. **landsgemeinde** 收集公民动议（10万人签名）或 **bundesrat** 提出政策议题
2. **bundesrat** 起草法案并提交联邦议会
3. **nationalrat** 和 **staenderat** 分别审议（两院平等权力）
4. 两院若版本不一致，进入协调会议直至达成一致
5. **landsgemeinde** 发动公民公投（任择性或强制性）
6. **bundesgericht** 监督合宪性，但不享有废除联邦法律的权力
7. **kanzler** 协调执行，州保留执行自主权

## 制度特点
- 集体领导：七人联邦委员会无总理，轮值主席仅为同等者中的第一人
- 双议会对等：国民院（比例代表）与联邦院（州代表）拥有同等立法权
- 直接民主：50,000签名可触发任择性公投，100,000签名可提出宪法修正案
- 双重多数：宪法修正案须同时获得人民多数和州多数方可通过
- 司法谦抑：联邦最高法院不能废除联邦法律，公民意志高于司法审查
- 州权自治：26州在教育、卫生、警察等方面保留广泛自主权

## Pattern 映射
> **Orchestration pattern**: `democratic`

## 历史参考
- Federal Constitution of Switzerland (1874, as amended) / 瑞士联邦宪法
- William H. Riker, *The Theory of Political Coalitions* (1968)
-《瑞士宪法：政府与政治》（英瓦格纳等，1991）
- Franz N. Jenni, *Die politischen Systeme der Schweiz und der USA* (1998)
- Johannes M. B. G. van der Doe, "Consensus Democracy in Switzerland," *Swiss Political Science Review* (2004)
