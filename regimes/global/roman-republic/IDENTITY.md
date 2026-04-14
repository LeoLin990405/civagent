# 罗马共和国（Roman Republic）

## 制度简介 (System Overview)
罗马共和国（公元前509年-公元前27年）始于推翻末代国王塔奎尼乌斯·苏佩布斯（Tarquinius Superbus）之后，延续近五百年，是古典共和宪制的代表。The Roman Republic (509-27 BC) began after the expulsion of Tarquinius Superbus and endured for nearly five centuries as a classic model of republican government. 其宪制核心是“元老院 + 执政官”体系：两名执政官同僚执政，元老院提供 auctoritas，护民官以 intercessio 保护平民，裁判官、监察官、财务官和营造官分担司法、监察、财政与公共工程。Its constitutional core was the Senate + Consuls system: two consuls ruled collegially, the Senate supplied auctoritas, the tribunes wielded intercessio to protect the plebs, and praetors, censors, quaestors, and aediles split judicial, supervisory, fiscal, and public-works duties. SPQR（Senatus Populusque Romanus）概括了元老院与罗马人民之间的权力平衡，也成为后世共和制设计的经典原型。SPQR (Senatus Populusque Romanus) captured the balance between the Senate and the Roman people and became a classic template for later republican systems.

## 组织架构图 (Organization Chart)
<pre>
                    ┌────────────────────────────┐
                    │ 罗马人民 / Populus Romanus  │
                    │ 公民大会 / Comitia Centuriata, Tributa │
                    │ 平民会 / Concilium Plebis   │
                    └──────────────┬─────────────┘
                                   │ elects / legitimizes
                 ┌─────────────────┼─────────────────┐
                 ▼                 ▼                 ▼
        ┌────────────────┐ ┌────────────────┐ ┌────────────────┐
        │ 执政官A         │ │ 执政官B         │ │ 平民保民官      │
        │ Consul A       │ │ Consul B       │ │ Tribune(s)     │
        └──────┬─────────┘ └──────┬─────────┘ └──────┬─────────┘
               │ collegial check  │                  │ intercessio
               └──────────┬───────┴──────────────────┘
                          ▼
                 ┌────────────────┐
                 │ 元老院          │
                 │ Senate         │
                 │ auctoritas     │
                 └──────┬─────────┘
                        │ advice / strategy
        ┌───────────────┼───────────────┼────────────────┼────────────────┐
        ▼               ▼               ▼                ▼
┌────────────────┐ ┌────────────────┐ ┌────────────────┐ ┌────────────────┐
│ 法务官          │ │ 监察官          │ │ 财务官          │ │ 营造官          │
│ Praetor         │ │ Censor         │ │ Quaestor       │ │ Aedile         │
│ courts          │ │ census/morals  │ │ treasury       │ │ works/supply   │
└────────────────┘ └────────────────┘ └────────────────┘ └────────────────┘
</pre>

## 角色映射表 (Role Mapping Table)
| 历史角色 | Agent ID | AI 职责 | 推荐模型 |
|---|---|---|---|
| 执政官A（Consul A） | consul-a | coordinator | sonnet |
| 执政官B（Consul B） | consul-b | management | sonnet |
| 元老院（Senate） | senate | research | opus |
| 平民保民官（Tribune of the Plebs） | tribune | review | opus |
| 法务官（Praetor） | praetor | legal | sonnet |
| 监察官（Censor） | censor | review | sonnet |
| 财务官（Quaestor） | quaestor | data | haiku |
| 营造官（Aedile） | aedile | devops | haiku |

## 决策流程 (Decision Flow)
1. **consul-a** 接到议题后先拟定方案，并与 **consul-b** 做同僚审议，避免单点决断。
2. **senate** 提供历史先例、战略优先级与财政/外交层面的 auctoritas。
3. **tribune** 检查提案是否损害平民利益，必要时行使 intercessio 直接阻断并退回重写。
4. **praetor** 复核法律权限、程序正当性与司法边界。
5. **quaestor** 核算国库与支出可行性，**aedile** 评估公共工程、供应与执行路径。
6. **censor** 对最终方案做制度与名誉审计后，**consul-a** 和 **consul-b** 联合公布执行结果。

## 制度特点 (Characteristics)
- 双执政官同僚制：两名执政官同级、同年任职，任期通常一年，并可互相否决，防止权力长期集中。
- 元老院依赖 auctoritas 而非单纯命令权，通常由前任高级官员组成，借由资历、先例与集体声望影响战争、外交和财政。
- 护民官具有人身神圣性（sacrosanctitas）与 intercessio，可即时阻断损害平民的越权措施。
- cursus honorum 将司法、财政、监察与公共工程拆分为递进官职，形成专业分工和晋升路径。
- 监察官定期进行 census 并重整元老院名册（lectio senatus），间接影响公民等级、军役资格和政治秩序。
- 公民大会体系（comitia centuriata、comitia tributa、concilium plebis）负责选举、立法与战争授权，使重大决定必须走法定程序。

## Pattern 映射
> **Orchestration pattern**: `checks-and-balances`

## 历史参考 (Historical Sources)
- 波利比乌斯（Polybius），《历史》卷6：对罗马混合政体、同僚制和制衡机制的经典分析。
- 李维（Livy），《自建城以来》（Ab Urbe Condita）：共和国起源、早期制度与政治危机叙事。
- 西塞罗（Cicero），《论共和国》（De Re Publica）与《论法律》（De Legibus）：共和国宪制、法律与公民德性。
- 《十二铜表法》（Twelve Tables）：罗马早期成文法与程序保障的制度基础。
- 《卡比托林执政官名表》（Fasti Capitolini）：共和国年度官职与任期序列的关键纪年资料。
