# 雅典民主制 (Athenian Democracy) — 组织架构

## 制度简介 (System Overview)
雅典民主制（公元前508年-公元前322年）是人类历史上第一个民主政体，由克里斯提尼改革奠定。公民通过公民大会直接投票决策，开创了“主权在民”的先河。
Athenian Democracy (508-322 BC) was the world's first democratic system, established by the reforms of Cleisthenes. It pioneered "popular sovereignty" through direct voting in the Assembly.

## 组织架构图 (Organization Chart)
                ┌──────────────────────────┐
                │     公民大会 Ekklesia      │
                │    (最高权力/主权投票)      │
                └─────────────┬────────────┘
                              │ 决议/法律
                ┌─────────────┼─────────────┐
                ▼             ▼             ▼
        ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
        │五百人议事会 │ │  十将军     │ │  陪审法庭   │
        │    Boule    │ │  Strategos  │ │ Dikasterion │
        │ (预案/行政) │ │ (军事/工程) │ │ (司法/审核) │
        └──────┬──────┘ └─────────────┘ └─────────────┘
               │
        ┌──────┴──────┐
        ▼             ▼
      执政官        演说家
      Archon        Rhetor
      (执行)        (内容)

## 角色映射表 (Role Mapping Table)
| 历史角色 | Agent ID | AI 职责 | 推荐模型 |
|---|---|---|---|
| 公民大会 | ekklesia | coordinator | sonnet |
| 五百人议事会 | boule | management | sonnet |
| 十将军 | strategos | engineering | opus |
| 陪审法庭 | dikasterion | review | opus |
| 执政官 | archon | devops | haiku |
| 演说家 | rhetor | content | haiku |

## 决策流程 (Decision Flow)
1. **boule** 准备议程并起草初级预案（Probouleuma）。
2. **rhetor** 在大会上阐述提案背景、逻辑与优势，引导群体辩论。
3. **ekklesia** 全体成员对预案进行辩论，并通过直接投票决定最终决议。
4. **strategos** 负责涉及军事或复杂系统工程的专业决策与执行。
5. **archon** 负责行政日常维护、资源调度及程序合规性。
6. **dikasterion** 负责对决策过程、法律效力及官员行为进行事后审计与审判。

## 制度特点 (Characteristics)
- 直接民主：公民直接参与决策而非通过代表，确保 Agent 群体意图的直接表达。
- 抽签与选举并行：日常行政职能通过随机性（抽签）防止垄断，专业职能（将军）通过选举保障能力。
- 预审机制（Probouleumatic）：通过议事会预审机制平衡大会的自发性，确保决策有据可依。
- 轮值制度：主席团定期轮换，确立了权力在不同节点间流动的动态平衡。

## Pattern 映射
> **Orchestration pattern**: `democratic`

## 历史参考 (Historical Sources)
- 亚里士多德《雅典政制》（The Athenian Constitution）
- 修昔底德《伯罗奔尼撒战争史》（History of the Peloponnesian War）
- 钱穆《政学私议》
- Mogens Herman Hansen, *The Athenian Democracy in the Age of Demosthenes*
