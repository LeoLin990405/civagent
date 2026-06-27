# 拜占庭帝国 — 组织架构 / Byzantine Empire — Organizational Structure

## 制度简介 / System Overview

拜占庭帝国（东罗马帝国）以君士坦丁堡为首都，延续了罗马帝国的政治传统与希腊文化，并以东正教信仰为精神核心。帝国实行神权独裁制，巴西琉斯（皇帝）被视为上帝在人间的代理人，集世俗权力与宗教权威于一身。精密的官僚体系、诡诈的外交手腕和坚定的正教信仰支撑帝国延续一千一百余年。

The Byzantine Empire (Eastern Roman Empire), centered on Constantinople, continued Rome's political traditions and Greek culture, with Orthodox Christianity as its spiritual core. The Empire practiced autocratic theocracy — the Basileus (Emperor) was God's vicegerent on Earth, uniting secular and religious authority. An elaborate bureaucracy, cunning diplomacy, and steadfast Orthodox faith sustained the Empire for over 1,100 years.

## 组织架构图 / Org Chart

```
                    ┌──────────────────────────────┐
                    │     巴西琉斯 (Basileus)        │
                    │  独裁君主 / Autokrator         │
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
| 大牧首 / Ecumenical Patriarch | `patriarch` | review — 教义与即位合法性审查：教义正统、加冕授权、道德危机时的异议（非日常行政否决） | opus |
| 外交大臣 / Logothete of the Dromos | `logothete-dromos` | research — 外交沟通：对外联络、情报分析、策略谈判 | sonnet |
| 财务大臣 / Logothete of the Genikon | `logothete-genikon` | data — 财务运营：税收管理、预算分析、经济政策 | sonnet |
| 军事统帅 / Domestic of the Schools | `domestikos` | devops — 安全防御：系统安全、威胁评估、防御策略 | sonnet |
| 城市长官 / Eparch of Constantinople | `eparch` | management — 运维管理：日常运营、市场监管、公共服务 | haiku |
| 文书长 / Protoasecretis | `protoasecretis` | content — 文档管理：记录保存、文书起草、档案维护 | haiku |

## 决策流程 / Decision Flow

1. **basileus** 接到请愿或边境急报，作出初步判断
2. **basileus** 将事务分派至对口大臣处理
3. **logothete-dromos** 情报分析并起草外交策略，**logothete-genikon** 评估财政影响，**domestikos** 评估军事风险——三者并行
4. 仅当议题触及教义正统、加冕合法性或重大道德争议（如皇帝再婚、迫害教派）时，**patriarch** 方介入，可在该范围内提出异议乃至诉诸绝罚（[VETO]）；日常行政不经其审核
5. **basileus** 汇总各方意见，签发最终诏令
6. **eparch** 与 **protoasecretis** 分别执行城市层面落地与文书归档

## 制度特点 / Characteristics

- **皇权-教权"和谐"（symphonia）**：拜占庭理想非西方所谓"凯撒教皇主义"，而是皇帝与教会的协同；皇帝主导大牧首的任免与施政，大牧首则握有加冕合法性与教义权威，二者通常一致、危机时方生张力
- **军区制（Theme）**：地方军政合一，将领兼管辖区防务与行政，提高边疆响应速度
- **外交优先于战争**：以贿赂、联姻、离间等手段分化敌人，外交开支常高于军费
- **宦官参政**：宦官可担任高级官职甚至军事统帅，形成独特的忠诚通道
- **奢华威慑**：通过仪式、建筑与外交展演制造心理优势，弥补人口与资源劣势

## Pattern 映射

> **Orchestration pattern**: `theocratic`

## 历史参考 / Historical Sources

- 《论帝国行政》(*De Administrando Imperio*)，君士坦丁七世，约950年——治国与外交手册
- 《秘史》(*Anekdota / Secret History*)，普罗柯比，约550年——查士丁尼朝的批判性记述
- 《民法大全》(*Corpus Juris Civilis*)，查士丁尼一世，534年
- Alexander Kazhdan (ed.), *The Oxford Dictionary of Byzantium* (1991)——官职名实与年代权威
- Cyril Mango, *Byzantium: The Empire of New Rome* (1980)——皇权理念与 symphonia
- J. B. Bury, *The Imperial Administrative System in the Ninth Century* (1911)
