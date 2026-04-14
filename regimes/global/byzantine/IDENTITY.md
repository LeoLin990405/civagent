# 拜占庭帝国 — 组织架构 / Byzantine Empire — Organizational Structure

## 制度简介 / System Overview

拜占庭帝国（东罗马帝国）以君士坦丁堡为首都，延续了罗马帝国的政治传统与希腊文化，并以东正教信仰为精神核心。帝国实行神权独裁制，巴西琉斯（皇帝）被视为上帝在人间的代理人，集世俗权力与宗教权威于一身。精密的官僚体系、诡诈的外交手腕和坚定的正教信仰支撑帝国延续一千一百余年。

The Byzantine Empire (Eastern Roman Empire), centered on Constantinople, continued Rome's political traditions and Greek culture, with Orthodox Christianity as its spiritual core. The Empire practiced autocratic theocracy — the Basileus (Emperor) was God's vicegerent on Earth, uniting secular and religious authority. An elaborate bureaucracy, cunning diplomacy, and steadfast Orthodox faith sustained the Empire for over 1,100 years.

## 组织架构图 / Org Chart

```
                    ┌──────────────────────────────┐
                    │     巴西琉斯 (Basileus)        │
                    │  上帝在人间的代理人 / Theokrator │
                    └───────────────┬──────────────┘
                                    │ 圣旨 / Imperial Edict
                                    │
              ┌─────────────────────┼─────────────────────┐
              ▼                     ▼                     ▼
       ┌─────────────┐      ┌─────────────┐      ┌─────────────┐
       │  大牧首      │      │  外交大臣    │      │  文书长      │
       │  Patriarch   │      │  Logothete   │      │  Protoasec.  │
       │  宗教/伦理   │      │  Dromos      │      │  文书/档案   │
       └──────┬──────┘      └──────┬──────┘      └─────────────┘
              │                    │
              │            ┌───────┴───────┐
              │            ▼               ▼
              │     ┌─────────────┐ ┌─────────────┐
              │     │  财务大臣    │ │  军事统帅    │
              │     │  Logothete  │ │  Domestic   │
              │     │  Genikon    │ │  of Schools │
              │     │  税收/财政   │ │  军事/防御   │
              │     └─────────────┘ └─────────────┘
              │
              ▼
       ┌─────────────┐
       │  城市长官    │
       │  Eparch of   │
       │Constantinople│
       │  城市/市场   │
       └─────────────┘
```

## 角色映射表 / Role Mapping

| 古代角色 / Historical Role | Agent ID | AI 职责 / AI Responsibility | 推荐模型 / Model |
|---|---|---|---|
| 巴西琉斯·皇帝 / Basileus — Emperor | `basileus` | coordinator — 总决策：接收请求、发布圣旨、协调全局 | opus |
| 大牧首 / Ecumenical Patriarch | `patriarch` | review — 伦理审查：质量标准、道德审核、价值对齐 | opus |
| 外交大臣 / Logothete of the Dromos | `logothete-dromos` | research — 外交沟通：对外联络、情报分析、策略谈判 | sonnet |
| 财务大臣 / Logothete of the Genikon | `logothete-genikon` | data — 财务运营：税收管理、预算分析、经济政策 | sonnet |
| 军事统帅 / Domestic of the Schools | `domestikos` | devops — 安全防御：系统安全、威胁评估、防御策略 | sonnet |
| 城市长官 / Eparch of Constantinople | `eparch` | management — 运维管理：日常运营、市场监管、公共服务 | haiku |
| 文书长 / Protoasecretis | `protoasecretis` | content — 文档管理：记录保存、文书起草、档案维护 | haiku |

## 决策流程 / Decision Flow

1. **basileus** 接到请愿或边境急报，作出初步判断
2. **basileus** 将事务分派至对口大臣，涉外事务同时知会 **patriarch** 进行伦理审查
3. **logothete-dromos** 情报分析并起草外交策略，**logothete-genikon** 评估财政影响，**domestikos** 评估军事风险——三者并行
4. **patriarch** 审核方案是否符合正教教义与帝国价值观（可驳回）
5. **basileus** 汇总各方意见，签发最终诏令
6. **eparch** 与 **protoasecretis** 分别执行城市层面落地与文书归档

## 制度特点 / Characteristics

- **神权合一**：皇帝兼具世俗与宗教最高权威，大牧首名义上独立但实际受制于皇权
- **军区制（Theme）**：地方军政合一，将领兼管辖区防务与行政，提高边疆响应速度
- **外交优先于战争**：以贿赂、联姻、离间等手段分化敌人，外交开支常高于军费
- **宦官参政**：宦官可担任高级官职甚至军事统帅，形成独特的忠诚通道
- **奢华威慑**：通过仪式、建筑与外交展演制造心理优势，弥补人口与资源劣势

## Pattern 映射

> **Orchestration pattern**: `theocratic`

## 历史参考 / Historical Sources

- 《秘史》(*De Administrando Imperio*)，君士坦丁七世，约950年
- 《拜占庭法律大全》(*Corpus Juris Civilis*)，查士丁尼一世，534年
- 《战记》(*Strategikon*)，莫里斯皇帝，约600年
- John Julius Norwich, *Byzantium: The Early Centuries* (1988)
- Cyril Mango, *The Oxford History of Byzantium* (2002)
