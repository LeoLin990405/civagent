# Roman Empire / 罗马帝国 - Imperial Bureaucracy / 帝制官僚

## 制度简介 (System Overview)
罗马帝国（公元前27年-公元476年西罗马灭亡）由奥古斯都建立，将军权、财政权与最高司法权集中于皇帝，同时保留共和国名义以维持合法性； the Roman Empire (27 BC-AD 476, ending with the Western Empire in 476) was founded by Augustus, concentrating military, fiscal, and supreme judicial authority in the emperor while preserving republican forms for legitimacy.  
帝制后期，行政体系进一步职业化，形成以近卫军长官、城市行政长官、行政总管、财务大臣、法务官和军事长官为核心的官僚网络； in the later Empire, administration became highly professionalized into a bureaucracy centered on the praetorian prefect, urban prefect, master of offices, count of sacred largesse, quaestor, and master of soldiers.  
这一制度在西部延续近五百年，支撑了横跨欧亚非的治理、成文法的统一执行与罗马和平（Pax Romana）所代表的长期稳定。 This system lasted nearly five centuries in the West and sustained governance across Europe, Asia, and Africa, the uniform execution of written law, and the long stability associated with the Pax Romana.

## 组织架构图 (Organization Chart)
>                               ┌──────────────┐
>                               │ 皇帝 /       │
>                               │ Imperator    │
>                               └──────┬───────┘
>                                      │
>                     ┌────────────────▼────────────────┐
>                     │近卫军长官 / Praetorian Prefect  │
>                     │         chief minister          │
>                     └───┬─────────┬─────────┬──────────┘
>                         │         │         │
>            ┌────────────▼┐ ┌──────▼──────┐ ┌▼──────────────┐
>            │城市行政长官  │ │行政总管     │ │财务大臣       │
>            │Urban Prefect │ │Master of    │ │Count of Sacred│
>            │Rome          │ │Offices      │ │Largesse       │
>            └──────────────┘ └──────┬──────┘ └──────┬───────┘
>                                   │                │
>                            ┌──────▼──────┐   ┌─────▼────────┐
>                            │法务官        │   │军事长官      │
>                            │Quaestor      │   │Master of     │
>                            │Sacri Palatii │   │Soldiers      │
>                            └──────────────┘   └──────────────┘

## 角色映射表 (Role Mapping Table)
| 历史角色 | Agent ID | AI 职责 | 推荐模型 |
|---|---|---|---|
| 皇帝 / Imperator (Augustus, Caesar) | `imperator` | coordinator | opus |
| 近卫军长官 / Praetorian Prefect (Praefectus Praetorio) | `praetorian-prefect` | management | opus |
| 城市行政长官 / Prefect of the City (Praefectus Urbi) | `urban-prefect` | management | sonnet |
| 行政总管 / Master of Offices (Magister Officiorum) | `master-of-offices` | coordinator | sonnet |
| 财务大臣 / Count of Sacred Largesse (Comes Sacrarum Largitionum) | `count-sacred-largesse` | data | haiku |
| 法务官 / Quaestor of the Sacred Palace (Quaestor Sacri Palatii) | `quaestor-sacri-palatii` | legal | opus |
| 军事长官 / Master of Soldiers (Magister Militum) | `master-of-soldiers` | devops | opus |

## 决策流程 (Decision Flow)
1. `imperator` 接到全局命令并确定战略优先级 (sets the imperial directive and strategic priority).
2. `praetorian-prefect` 将命令拆解为行政任务，协调各官署并处理冲突 (decomposes the edict and resolves cross-office conflicts).
3. `master-of-offices` 负责文书、驿传与宫廷通信路由 (routes dispatches, courier traffic, and palace communications).
4. `quaestor-sacri-palatii`, `count-sacred-largesse`, and `master-of-soldiers` 并行处理法令起草、预算复核与军令准备 (law, funding, and military readiness in parallel).
5. `urban-prefect` 在首都受影响时处理罗马城秩序、粮食与治安 (handles Rome's order, grain, and policing) when the capital is affected.
6. `praetorian-prefect` 汇总回报并把未决事项上呈 `imperator` 终裁 (consolidates reports and escalates unresolved issues).

## 制度特点 (Characteristics)
- 皇帝敕令是唯一最高权威，法律、任官与军令都通过中央下行，形成单点决策链（single-point command）。
- `praetorian-prefect` 作为首席大臣负责跨部门协调和执行督导，而不是取代专业官署（chief-minister coordination, not replacement）。
- `master-of-offices` 控制宫廷出入、`cursus publicus` 和文书路由，使信息流成为可控资源。
- `count-sacred-largesse` 将税赋、关税、帝产与拨款分账处理，形成独立的财政通道和审计链（separate fiscal and audit chain）。
- `quaestor-sacri-palatii` 把政策转写为敕令和法令文本，确保帝国各地使用统一法源（uniform written law）。
- `master-of-soldiers` 与 `urban-prefect` 分别处理军团机动和罗马城秩序，降低军政混杂风险（military/civic separation）。

## Pattern 映射
> **Orchestration pattern**: `centralized`

## 历史参考 (Historical Sources)
- 《奥古斯都功业录》（Res Gestae Divi Augusti）
- 卡西乌斯·狄奥《罗马史》（Cassius Dio, Roman History）
- 《官职表》（Notitia Dignitatum）
- 《狄奥多西法典》（Codex Theodosianus）
