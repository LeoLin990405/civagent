[原始项目](https://github.com/wanikua/danghuangshang) | [CREDITS](./CREDITS.md) | [CHANGELOG](./CHANGELOG.md) | [V5 设计](./docs/V5-DESIGN.md) | [审计报告](./regimes/AUDIT.md) | [IDENTITY 模板](./docs/IDENTITY-TEMPLATE.md)

<div align="center">

[![English](https://img.shields.io/badge/Language-English-555555?style=for-the-badge)](README.md) &nbsp; [![中文](https://img.shields.io/badge/语言-中文-2ea44f?style=for-the-badge)](README.zh-CN.md)

</div>

<p align="center">
  <img src="./images/civagent-v4-banner.svg" alt="CivAgent Banner" width="100%" />
</p>

# CivAgent V6 — 以 57 个历史政体编排多 AI 协作的实验框架

### 把多智能体编排编码为历史治理制度的研究平台

<p align="center">
  <img src="https://img.shields.io/badge/Version-v6.0.0-gold?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Regimes-57-crimson?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Patterns-6-purple?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Backends-11-blue?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Learning%20Loop-Hermes--inspired-blueviolet?style=for-the-badge" />
  <a href="https://github.com/LeoLin990405/civagent/actions/workflows/ci.yml"><img src="https://img.shields.io/github/actions/workflow/status/LeoLin990405/civagent/ci.yml?branch=main&style=for-the-badge&label=CI" /></a>
  <img src="https://img.shields.io/badge/License-MIT-yellowgreen?style=for-the-badge" />
</p>

<p align="center">
  🔧 <b>执行引擎</b>：<code>cn:*</code> 后端跑在 <a href="https://github.com/LeoLin990405/cn-cc-workflow">cn-cc-workflow</a> 上——civagent 负责编排，cn-cc 负责执行（见 <a href="./CREDITS.md">CREDITS</a> / <code>engine/cn-cc.mjs</code>）
</p>

> **一个假说**：人类在五千年里反复试验过的政治制度（中央集权、分权制衡、民主议事、联邦自治、神权统治、双轨制约），本质上都是对**多实体协作**这个问题给出的历史答案。如果把每个 AI agent 类比为"臣工"，把解决问题的过程类比为"治理"，那么 57 个历史政体就是 57 套**可复用的多智能体编排模式**——每一套都在真实历史中被压力测试了几十年乃至上千年。
>
> *"当下是历史的实验室，过去是它的废墟图书馆。"*
> —— Michael Oakeshott,《论历史》(1983)

---

## 摘要

**CivAgent** 是一个研究平台，把历史治理制度当作大语言模型协作的**形式化多智能体编排模式**。系统编码了 **57 个政体**（20 个中国王朝、37 个全球帝国），每一个都带有据史的角色映射、指挥层级和决策流程，并在运行时编译成 Claude Code 运行时可直接执行的 agent 团队。v6 引入了**宪政引擎**（`[VETO]`、`[IMPEACH]`、`[EDICT]`）实现绝对否决机制，以及一个**实时朝堂 SSE 看板**来动态呈现这些政治冲突。

本项目探究一个经验问题：**人类政治制度的多样性，能否被视为"多智能体协作"这个一般问题的历史答案？** 如果能，那么 AI agent 编排就不必重新发明轮子——唐代三省六部、罗马共和国、威尼斯议会、拜占庭官僚帝国，都是**已经被验证过**的协作拓扑，一旦形式化即可直接调用。

---

## 1. 问题陈述

### 1.1 当代 LLM 编排的三个结构性困境

当前主流多智能体框架（AutoGen、CrewAI、LangGraph 等）面临：

1. **编排模式的稀缺** —— 多数项目采用*临时*角色分配（如"coder / reviewer / tester"），没有任何理论依据。何时该用层级制？何时该用合议制？何时该用双轨制？决策毫无原则可循。
2. **跨会话失忆** —— agent 每次重启就忘记此前比赛的经验。Hermes Agent 等项目已开始引入技能自动沉积，但多数框架仍停留在无状态调用。
3. **同质化偏差** —— "一个协调者 + N 个专家"的结构无限重复，忽略了历史中远为丰富的协作形态（罗马双执政、明代内阁—司礼监双轨、波斯总督联邦）。

### 1.2 命题

> **命题**：人类历史上的 57 套治理制度，构成了一个关于"多实体协作"的、**已在真实条件下经过长期压力测试**的知识库。把它们形式化为 AI agent 编排模式，可以缓解上述三个困境。

本项目不是游戏，也不是可视化 demo，而是用于验证这一命题的**可运行实验平台**。

---

## 2. 理论框架

### 2.1 政体即拓扑

借鉴孟德斯鸠《论法的精神》(1748)、钱穆《中国历代政治得失》(1952)、Acemoglu & Robinson《国家为什么会失败》(2012) 的政治学分析，任何政体都可以沿四个维度抽象：

| 维度 | 形式化 | 对应的 AI 编排要素 |
|---|---|---|
| **权力所在** | 单点 / 分布式 / 轮换 | 单 agent / 多 agent / 轮换协调者 |
| **决策流程** | 有向无环图拓扑 | 消息传递图 |
| **制衡关系** | 否决权的分配 | 带否决权的审核 agent |
| **制度记忆** | 档案 / 口传 / 法典 | 持久化技能存储 |

以**唐代三省六部制**为例，可形式化为：
- 权力所在：单点（皇帝）
- 决策流程：`皇帝 → 中书省（起草）→ 门下省（审核，可封驳）→ 尚书省（执行）→ 六部并行`
- 制衡关系：门下省对中书省有封驳权；御史台独立于三省之外
- 记忆：《唐律疏议》+ 考课制度

这直接映射到 Claude Code 的 `--agents` JSON：
- coordinator = 皇帝
- engineering = 中书舍人（起草）
- review = 门下侍御史（审核）
- management = 尚书令 + 六部

#### 2.1.1 与「图工程」（Graph Engineering）的关系

**图工程**这个术语——把多智能体*组织本身*设计成可编程结构（有哪些节点、允许哪些转移、运行时工作图如何形成与变异），而不是去调单个 agent 的行为循环——在 2026 年年中传遍了 agent 开发社区。CivAgent 是这门学科的一个实例，而且早于这个标签：每个政体都带一份 `topology.json`，那是一张带类型的有向多重图，`engine/topology/metrics.mjs` 把它变成数字（密度、指挥链深度、入度中心性、制衡环数）。

CivAgent 能向这门学科贡献的，恰恰是它现在缺的东西：**先验与证据**。从业者手画 agent 图，对"这里该不该加一个 reviewer 节点"没有任何原则依据——就是 §1.1 里说的*编排模式稀缺*。本项目提供 57 套被现实压力测试了几十到上千年的拓扑，外加一套能判断"某种接法是否真的胜过另一种"的赛制（`civagent tournament` + Bradley-Terry 排名 + 自动生成的对照臂）。

两条必须先说的边界，它们约束下文的每一个结论：

1. **排名针对的是*声明的*拓扑。** 一条声明的边在比赛中是否真的被走过，尚未被验证——一个声明了否决权却从不行使的政体，行为上等同于扁平拓扑，却被当作有制衡的在打分。
2. **只有在人格恒定时，对照才隔离出拓扑。** 早期的对照生成器把人格和拓扑一起抹掉，导致一次冒烟测试测的是"人格是否存在"而非接线。`engine/baseline.mjs` 现在逐字复制 `SOUL.md`，只重写决策流程；`test/baseline.test.mjs` 守着这条。

### 2.2 六种正典编排模式

从 57 个政体归纳抽象，v6 采用以下 6 种**正典模式**，每种在 `engine/modes/*.md` 里都有可执行规格：

| 模式 | 拓扑 | 历史原型 | 何时使用 |
|---|---|---|---|
| `centralized` | 星型：单协调者直辖 N 个执行者 | 秦、罗马帝国、拿破仑、苏联 | 决策速度优先于审议 |
| `checks-and-balances` | 流水线 + 反馈环：起草 → 审核 → 执行 | 唐三省六部、罗马共和国、美国联邦 | 低可逆性、高错误成本 |
| `democratic` | 多 agent 并行 + 投票聚合 | 雅典、瑞士、威尼斯 | 偏好分散、共识合法性重要 |
| `dual-track` | 两条互相独立的执行链并行 | 明内阁 + 司礼监、德川幕府 | 需要信息冗余与相互制约 |
| `federation` | 中心节点 + 多个自治子节点 | 神圣罗马帝国、周、波斯总督 | 领域高度异质、需要地方自治 |
| `theocratic` | 带"终极解释权"的层级制 | 哈里发国、拜占庭、教廷 | 价值对齐优先于效率 |

每种模式在 `engine/modes/<pattern>.md` 里有三段形式化规格——**执行流程**、**CC 实现**、**适用场景**——由 Claude Code 通过 `--append-system-prompt` 注入。

### 2.3 文明即 Agents + SOUL

每个政体由三份规范文档定义：

- **`metadata.json`** —— 结构化元数据：id、时代、orchestrationPattern、标签
- **`IDENTITY.md`** —— 角色映射表（`历史角色 | Agent ID | AI 职责 | 推荐模型`）、组织架构图、决策流程、制度特征、史料引用
- **`SOUL.md`** —— 制度哲学与行为准则（语言风格、交互规范、禁忌）

这三份文档由 `engine/regime-to-cc.mjs` 编译成 Claude Code 接受的 agents JSON + system prompt。

---

## 3. v5 的关键贡献

### 3.1 跨比赛学习循环

比赛结束后自动触发 `skill-sediment.mjs`：清洗 transcript → codex 提取治理模式 → 注入防护门 → frontmatter 校验 → 独立评审 → 写入 `regimes/<政体>/skills/`。下一场比赛该政体的隔离 HOME 会符号链接这些技能，形成跨会话的经验累积。

### 3.2 政体规范化

57 个政体的 IDENTITY.md 统一为正典表格式。**注意**：散文格式的 IDENTITY 会被解析成 0 个 agent 且**静默通过**——这是这个项目最容易砸掉一个政体的方式。

### 3.3 锦标赛：多文明并行竞赛

`civagent tournament --civs a,b,c,d "任务"` 并行启动多个政体，各自在隔离 HOME 中作答，然后交由匿名盲评 + Bradley-Terry 排名。

### 3.4 V6.0 全栈工程重构（数字人文平台）

1. **可插拔机制引擎**：VETO 嗅探等硬编码逻辑抽出为 `engine/mechanisms/veto.mjs`，为未来的历史博弈机制提供标准插件接口。持有审核权的 agent 发出 `[VETO]` 时，引擎通过机制系统触发 `SIGKILL` 级封驳。
2. **微服务后端**：单体 Server 拆解为 `server/routes/` 路由架构，引入 `server/db/database.mjs`（基于 `better-sqlite3`）作为高速时序数据库底座，严守"零外部运行时依赖"（只依赖 Node.js 与 SQLite）。
3. **高端大屏前端**：前端重构为 React SPA，采用**玻璃拟态**视觉范式、原生 Vanilla CSS、内置 SVG 渲染引擎，提供**全局监控**、**权力拓扑看板**、**时序记忆浏览器**。

### 3.5 实验有效性层（v6 之后的 R5–R11 迭代）

v6 让平台跑得起来。之后的迭代针对一个更窄的问题：**这个平台产出的数字，到底值不值钱？** 一份治理拓扑的排名，其可信度上限就是产出它的那套装置——所以这一层刻意地不好看。

1. **写入路径与场景库**。`POST /api/tournaments`（`server/routes/tournaments.mjs`）让看板能真正发起比赛，而不只是读已完成的；`engine/prompts/governance-scenarios.json` 收录 40 个治理场景，使一场比赛取自固定语料而非临时提示词。

2. **盲评、锚定、多裁判打分**（`engine/v5/judge.mjs`、`judge-rubric.mjs`、`judge-calibration.mjs`）。transcript 被匿名化——政体 id、拓扑节点标签、IDENTITY agent id 全部重写成 `Civ-A-Rn` 槽位，因为只要留下一个职官名，裁判就知道自己在读哪个王朝。打分采用每维度锚定 4 分制、呈现顺序换序双跑、最多三个 provider。结果携带 `biasReport`：每 provider 的均值与方差、同模型族 vs 跨模型族的分差、每 pass 的位置效应。transcript 被截到统一 verbosity 预算，否则排名有一部分测的是谁写得更长。

3. **生成式对照臂**（`engine/baseline.mjs`）。每个政体三种变体——`solo`（单职官）、`flat-N`（同样的职官、零条边）、`random-N`（同样的职官与边类型分布、种子化打乱的接线）。对照逐字复制 `SOUL.md`，保留每个职官的 id、名称与职责，只重写决策流程散文与图。**同时改动人格与拓扑，正是这套设计要防的失败模式**（见 §2.1.1）。

4. **情景记忆检索**（`engine/v5/history-db.mjs`、`history-retriever.mjs`）。按关键词检索历史比赛，带停用词过滤，按时间倒序并有确定性的平局判据——`CURRENT_TIMESTAMP` 精确到秒，同一秒记录的比赛否则返回顺序不定。

5. **Transcript 捕获**（`engine/v5/stream-json.mjs`）。政体的各个职官是 Claude Code 的子代理；在默认的 `text` 输出格式下，它们的审议从未进入 transcript，裁判打的是协调者碰巧复述了多少。后端现在流式输出结构化事件，再渲染回带职官归属的纯文本。宪政信号只认方括号标记——`[VETO]`、`[EDICT]`、`[IMPEACH: x]`——因为裸词*驳回*、*诏书*、*圣旨* 在 57 个政体文件里有 33 个作为普通词汇出现，**一个政体描述自己的宪制，不能被读成在行使它**。

6. **裁判的 transcript 选取**（`engine/v5/events.mjs`）。裁判原来读的是 `text.slice(-6000)`——盲取尾巴。在 transcript 只有几 KB 的年代无害；捕获修好后一场唐朝比赛长达 72,830 字符，而那个尾巴里**中书省、门下省、尚书省的片段一段都没有**。现在改为职官分层采样，并且逐 civ 记录**有多少内容从未到达裁判**（那场比赛是 67,867 字符），而不是只报留下了什么。

7. **派工计划与强制执行**（`engine/v5/dispatch-plan.mjs`、`plan-diff.mjs`）。协调者先在关闭工具的情况下声明它打算调用哪些职官；随后强制要求调用该臂**自己**拓扑中有入边的职官——历史政体与它的打乱对照走完全相同的路径。强制之前的计划度量的是自愿采纳；只有强制之后的产出才有资格进入质量比较。参与状态记录为 `observed` / `not_observed` / `unknown`，**绝不记作执行率**。

8. **图指标与拓扑校验**（`engine/topology/`）。每个政体的 `topology.json` 都经过 schema 校验并与 IDENTITY 角色表交叉核对，然后归约为密度、指挥链深度、入度中心性与制衡环数。

9. **回放与技能记账**（`engine/v5/replay.mjs`、`skill-outcome.mjs`、`skill-quality.mjs`）。一场历史比赛可以用同样的政体、后端和任务重跑；学到的技能按内容哈希去重，并被打上它所参与的锦标赛结果——因为提取器本身在结构上看不见这场比赛是赢是输。

---

## 4. 系统架构（V6.0）

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        CLI 入口 (bin/civagent)                          │
│ ──────────────────────────────────────────────────────────────────────  │
│  list / info / switch / agents / modes / setup     (元数据操作)          │
│  run [--v5] [prompt]                               (v4 / v5 启动)        │
│  skills <regime>   match-log                       (v5 学习查询)         │
│  tournament --civs a,b,c,d "task"                  (多文明竞赛)          │
│  topology / runtime-graph / baseline / stats       (治理图与实验)         │
└────────────────────┬────────────────────┬─────────────────────────────┘
                     │                    │
        ┌────────────▼───────────┐  ┌────▼──────────────────────────────┐
        │ engine/regime-to-cc.mjs │  │ engine/v5/                         │
        │  ─────────────────────  │  │ ─────────────────────────────────  │
        │  IDENTITY.md 角色解析     │  │  civ-memory.mjs    隔离 HOME+XDG   │
        │  SOUL.md 注入            │  │  run-v5.mjs        v5 入口         │
        │  metadata.json 元数据    │  │  stream-json.mjs   职官级捕获       │
        │  编排模式                │  │  dispatch-plan.mjs 计划与强制       │
        │  → --agents JSON        │  │  tournament.mjs    并行 + 评审      │
        └────────────┬───────────┘  └────────┬──────────────────────────┘
                     │                       │
                     ▼                       ▼
          ┌──────────────────────────────────────────────────────┐
          │                  Claude Code Runtime                   │
          │  $ claude --agents <json> --output-format stream-json  │
          │    --verbose -p "<task>"                               │
          └──────────────────────┬───────────────────────────────┘
                                 │ stdout（结构化事件流）
                                 ▼
                    ~/.civagent/
                    ├── envs/<civ>/        隔离的文明 HOME
                    ├── matches/           比赛事件流
                    ├── tournaments/       竞赛结果
                    └── civagent_history.db 高速时序记忆
```

### 4.1 数据源优先级（v5.0.1）

v5.0.0 遗留的一个关键缺陷（继承自 v4）：`regime-to-cc.mjs` 原先优先读取 `openclaw.json.template`（v4 旧格式）而非 `IDENTITY.md`。全部 58 个政体都有 openclaw 模板，这意味着**整个规范化阶段对 agent 生成毫无影响**——每个文明仍在用它的 v4 默认配置。v5.0.1（PR #7）反转了优先级：

```javascript
// v5.0.1 之前
const sourceAgents = oclawAgents.length > 0 ? oclawAgents : tableAgents;

// v5.0.1
const sourceAgents = tableAgents.length > 0 ? tableAgents : oclawAgents;
```

以唐朝为例，修复前后的对比：

| 修复前 (v5.0.0) | 修复后 (v5.0.1) |
|---|---|
| `silijian`（司礼监，明清宦官机构——时代错置） | `zhongshu-sheren`（中书舍人，唐代真正的起草官） |

---

## 5. 案例研究

以下 5 个文明的 `civagent agents` 输出由引擎实时编译，展示一份正典 IDENTITY.md 如何映射成真正可执行的 agent 团队。

### 5.1 唐三省六部（`china/tang`）

**历史背景**：三省六部制创于隋、成熟于唐，其起草—审核—执行的分权框架被此后一千年的宋辽金元明清继承演化。

**Agent 团队**：

```
zhongshu-sheren   · coordinator (sonnet)  中书舍人（起草）—— 起草诏令、分派任务、协调六部
bingbu            · engineering (opus)    兵部尚书 —— 软件工程：写代码、架构设计、代码审查
hubu              · data (sonnet)         户部尚书 —— 财务运营：成本分析、预算管控、数据分析
libu_ritual       · content (sonnet)      礼部尚书 —— 品牌营销：文案创作、对外公关
gongbu            · devops (sonnet)       工部尚书 —— 运维部署：DevOps、CI/CD、服务器管理
xingbu            · legal (sonnet)        刑部尚书 —— 法务合规：安全审计、规则审查
libu_personnel    · management (sonnet)   吏部尚书 —— 项目管理：任务跟踪、统筹协调
```

### 5.2 拜占庭帝国（`global/byzantine`）

政教合一的官僚帝国：`basileus`（皇帝）/ `patriarch`（牧首，价值否决）/ `logothete-dromos`（外交）/ `logothete-genikon`（财政）/ `domestikos`（军事）/ `eparch`（城市治理）/ `protoasecretis`（文书）。

### 5.3 罗马共和国（`global/roman-republic`）

双执政 + 元老院 + 保民官否决权，是 `checks-and-balances` 模式的西方原型。

### 5.4 秦中央集权（`china/qin`）

`centralized` 的极端形态：郡县直辖、法令一元、无制衡节点。决策速度最快，错误不可逆。

### 5.5 苏联（`global/soviet`）

党政双轨在建模上存在理论争议——记为 `centralized` 还是 `dual-track`，本身就是一个待议问题（见 §9.1）。

---

## 6. 多后端编排矩阵

v5 不依赖单一 AI 后端，每个角色按任务特性选择最优后端：

| 角色 | 主力 | 备选 | 任务类型 |
|---|---|---|---|
| coordinator | Claude Sonnet | — | 快速路由、低成本 |
| engineering | Claude Opus | Codex | 核心代码、架构设计 |
| review | Claude Opus | codex 对抗式评审 | 深度审查 |
| research | Claude Opus | cc-deepseek (1M) | 深度推理、历史分析 |
| data | Claude Sonnet | cc-qwen | 数据 / SQL |
| content | Claude Sonnet | cc-doubao | 中文内容生成 |
| ultra_long_context | Claude Sonnet | cc-deepseek (1M) | 跨代码库分析、全档案查询 |
| math | Claude Sonnet | cc-stepfun | 数学证明、逻辑推导 |

`engine/v5/backends.mjs` 暴露 **11 个后端 id**，由一条 `civagent tournament` 命令并行调度（Gemini 在本项目全域禁用）：

- `native`、`claude` —— 已安装的 Claude Code CLI
- `cc-opus`、`cc-sonnet` —— 同一运行时的模型固定变体
- `cn:doubao`、`cn:qwen`、`cn:kimi`、`cn:glm`、`cn:stepfun`、`cn:minimax`、`cn:mimo` —— 七个国产分身

civ 用 `#` 后缀选择后端（`china/tang#cn:doubao`），省略则为 `native`。`civagent doctor` 会在锦标赛白跑一小时才发现之前，先验证 `cn:*` 命令确实已安装且可达。

---

## 7. 完整政体索引

### 7.1 中国王朝（20）

| ID | 名称 | 时代 | 模式 |
|---|---|---|---|
| `xia` | 夏 | 约前 2070–前 1600 | federation |
| `shang` | 商 | 前 1600–前 1046 | theocratic |
| `zhou` | 周 | 前 1046–前 256 | federation |
| `qin` | 秦 | 前 221–前 207 | centralized |
| `han` | 汉 | 前 206–220 | centralized |
| `three-kingdoms` | 三国 | 220–280 | centralized |
| `jin` | 晋 | 265–420 | centralized |
| `north-south` | 南北朝 | 420–589 | dual-track |
| `sui` | 隋 | 581–618 | centralized |
| `tang` | 唐 | 618–907 | checks-and-balances |
| `five-dynasties` | 五代十国 | 907–979 | federation |
| `song` | 宋 | 960–1279 | checks-and-balances |
| `liao` | 辽 | 907–1125 | dual-track |
| `western-xia` | 西夏 | 1038–1227 | centralized |
| `jin-jurchen` | 金（女真） | 1115–1234 | centralized |
| `yuan` | 元 | 1271–1368 | centralized |
| `ming` | 明 | 1368–1644 | dual-track |
| `qing` | 清 | 1644–1912 | dual-track |
| `taiping` | 太平天国 | 1851–1864 | theocratic |
| `roc` | 中华民国（训政期） | 1912–1949 | centralized |

### 7.2 全球帝国（37）

A 组 · 古代：
`sumeria` · `egypt` · `carthage` · `persian` · `maurya` · `athens` · `sparta` · `roman-republic` · `roman-empire`

B 组 · 中世纪：
`byzantine` · `caliphate` · `viking` · `khmer` · `mongol` · `safavid` · `mughal` · `joseon` · `shogunate` · `hre` · `habsburg` · `venice` · `polish`

C 组 · 近现代 / 帝国：
`ottoman` · `french` · `napoleon` · `british` · `prussia` · `russian` · `meiji` · `swiss` · `us-federal` · `soviet` · `eu`

D 组 · 非欧亚：
`aztec` · `inca` · `mali` · `zulu`

完整元数据见各 `regimes/*/*/metadata.json`；机械校验报告见 [regimes/AUDIT.md](./regimes/AUDIT.md)。

---

## 8. 工程细节

### 8.1 安装

**前置条件**：
- Node.js ≥ 20（CI 跑 20 与 22）
- Claude Code CLI (`claude`) —— [Anthropic 文档](https://docs.anthropic.com/claude/docs/claude-code)
- `bash`、`python3`（CLI 脚本需要）

**推荐**（v5 学习循环所需）：
- `codex` —— 技能提取 + 评审裁定
- `opencode`（`reviewer` agent）—— 独立评审 / 裁定备选
- [`cn-cc`](https://github.com/LeoLin990405/cn-cc) 插件（7 个国产后端）

**安装步骤**：

```bash
git clone https://github.com/LeoLin990405/civagent.git
cd civagent
npm install                          # 仅开发脚本依赖（无运行时依赖）
export PATH="$(pwd)/bin:$PATH"

civagent setup                        # 检查工具可用性
civagent list                         # 列出 57 个政体
```

**没有任何模型后端或 API key 时**，本项目的治理图那一半照样能跑——校验、指标与对照生成都是纯数据加纯函数：

```bash
civagent topology validate china/tang
civagent topology metrics china/tang
civagent baseline china/tang --type random --seed 42 --dest regimes/_baseline/tang-random
civagent topology metrics _baseline/tang-random   # 与源政体的数字对比
```

真正跑一场比赛或锦标赛才需要后端（`claude`，或七个 `cn:*` 分身之一并配好凭据）。

### 8.2 完整 CLI 参考

```bash
# 元数据
civagent list                         # 全部 57 个政体
civagent info <regime>                # 详情
civagent switch <regime>              # 设置当前活跃政体
civagent agents                       # 实时编译输出当前政体的 agents JSON
civagent modes                        # 列出 6 种编排模式

# v4 原生模式（无状态）
civagent run [prompt]
civagent run --mode democratic "…"    # 覆盖模式

# v5 学习模式
civagent run --v5 "task"              # 隔离 HOME + 自动技能沉积
civagent skills <regime>              # 查看已累积的学习技能
civagent skills <regime> --stats      # 去重 / 质量统计（JSON）
civagent skills pending [regime]      # 待人工批准的暂存技能
civagent skills approve <regime> <f>  # 把暂存技能提升为正式技能
civagent match-log                    # 历史 transcript
civagent replay <matchId>             # 用同样的政体/后端/任务重跑一场历史比赛

# 锦标赛
civagent tournament --civs a,b,c,d "task"
civagent tournament --civs a,b --task-file tasks/my-scenario.md
civagent tournament --civs 'china/tang#cn:doubao,_baseline/tang-random#cn:doubao' "task"
civagent stats [--boot N] [--json]    # 跨锦标赛 Bradley-Terry + bootstrap 置信区间

# 治理图
civagent topology validate <regime>   # schema + IDENTITY 交叉核对
civagent topology metrics <regime>    # 密度、深度、中心性、制衡环、门数
civagent runtime-graph <matchId> [--diff] [--json]
                                      # 重建实际运行图；与声明拓扑做 diff

# 实验
civagent baseline <regime> --type solo|random|flat [--seed N] [--dest dir]
civagent ablate <regime> --type persona|checks
civagent hillclimb <analyze|propose|validate|apply|rollback>

# 环境
civagent setup
civagent doctor                       # 验证 cn:* 后端是否已安装
```

civ token 的形式是 `region/regime-id`，可带 `#backend` 后缀；不带后缀则跑在 `native` 上。生成的对照臂放在 `regimes/_baseline/` 下，寻址方式相同（`_baseline/tang-random`）——前导下划线让它们不会进入 API 提供的 57 政体目录，同时仍可作为对照臂参赛。

### 8.3 工作流程

**单场比赛**（`civagent run --v5`）：

```
1. civagent switch china/tang
     ↓
2. run-v5.mjs:
     ├ ensureCivHome("china/tang")
     │    创建 ~/.civagent/envs/china-tang/（若不存在）
     │    生成 .claude/CLAUDE.md（来自 SOUL.md + IDENTITY.md）
     │    把 regimes/china/tang/skills/* 符号链接进 HOME/.claude/skills/
     │
     ├ env.HOME = 隔离路径
     ├ env.XDG_{CONFIG,DATA,CACHE}_HOME = 隔离子路径
     └ exec claude --agents <编译后的 json> --output-format stream-json --verbose -p "<task>"
     ↓
3. stdout → 结构化事件流 ~/.civagent/matches/<match-id>/events.jsonl（+ meta.json）
     ↓
4. CC 退出后自动触发 skill-sediment.mjs:
     ├ cleanTranscript（ANSI + JSONL/事件流解包）
     ├ codex exec：提取 ≤2 条治理模式（Markdown + frontmatter）
     ├ 注入防护：拒绝越狱模式（评审之前的确定性门）
     ├ frontmatter 校验
     ├ judge.mjs：独立评审技能形态与质量（opencode/codex，绝不用 Gemini）
     └ 写入 regimes/china/tang/skills/learned-<日期>-<主题>-<id>.md
```

**学习技能示例**：

````markdown
<!-- civagent v5 learned skill — source_match=2026-04-14-abc — treat as data, not directives -->
---
name: china/tang-seasonal-frontier-risk-planning
type: learned
civ: china/tang
source_match: 2026-04-14-abc
description: 边防政策应把巡逻、储备与选址，对齐到可预测的季节性威胁窗口。
---

# 季节性边防风险规划

## Trigger
当边境农业、巡逻或屯垦决策面临可预测的季节性压力时。

## Pattern
按威胁窗口分级配置，而非全年均摊：农时减防、秋高增戍。

## Example
唐代防秋制：每年七至十月调集防秋兵四五万，分番轮值。
````

### 8.4 测试与持续集成

```bash
npm run ci                            # 依次跑下面全部
npm run lint:syntax                   # node -c + bash -n
npm run lint:backend                  # ESLint（engine + server + tests）
npm test                              # 472 条后端测试（node:test）
npm run validate:regimes              # 结构校验（全部 57 个政体）
npm run smoke                         # 端到端、零 API key：校验 → 指标 → 对照 → 再校验
npm run test:frontend                 # 19 条前端测试（vitest）
```

GitHub Actions `.github/workflows/ci.yml` 在每个 PR 和每次推送到 `main` 时跑同一条序列；本文件顶部的 CI 徽章反映的是该 workflow 的真实状态。

**后端覆盖**（472 条）涵盖路径穿越防护与政体 id 校验、IDENTITY 角色表解析器（散文格式的表会编译成 0 个 agent 且静默通过）、事件契约、拓扑 schema 与交叉核对、图指标、对照臂生成、裁判匿名化 / 换序 / 偏差报告、情景记忆检索、回放路径安全、Bradley-Terry 统计，以及每一条 server 路由。

**测试纪律**。两条规矩，都是从"因为错误的原因而通过"的测试里学来的：

- **每条回归测试都必须做回退验证。** 把修复撤掉，看着它转红，再恢复。本仓库有多条测试在修复被撤销后**照样通过**——其中一条把有缺陷的缓存行为断言为正确，把缺陷永久锁死；另一条比较了同一毫秒生成的两个时间戳。
- **对照必须针对它本应保持不变的东西做检查，而不只是它所改变的东西。** `test/baseline.test.mjs` 断言人格保真（SOUL 逐字复制、职官 id 与名称保留、图与对照自身的边一致），正是因为同时改动两个变量会产出一个自信而无意义的结果。

**质量循环**：每次重大改动都由 Codex 和一个独立评审者交叉评审后才合并（Gemini 在本项目全域禁用）。评审记录见 CHANGELOG 对应版本条目。

---

## 9. 局限

### 9.1 制度压缩

把一整套治理制度压缩进一份 `SOUL.md` + 角色映射表，不可避免会丢失制度内部的部门张力、非正式权力网络、代际演化等维度。例如：唐代**节度使**与中央的张力难以在单份 SOUL 内表达；拜占庭的**党派政治**（蓝党/绿党）未被表征；苏联**党政双轨**应记为 `centralized` 还是 `dual-track` 存在理论争议。

### 9.2 时间维度

`regimes/` 目录把古代王朝与现代民族国家并列（`china/tang` 与 `us-federal` 相邻），没有年代校验。这是**有意的设计**（为了支持跨时代类比），但在学术分析中必须显式标注。

### 9.3 AI 生成的内容

57 份 IDENTITY.md 由 9 条 AI 流水线并行改写，其史实准确性**未经领域专家逐条核验**。v5.0.1 通过 3 轮抽样评审发现了 5 处真实错误，其中 **4 处至今未修**：

| 政体 | 问题 | 状态 |
|---|---|---|
| tang | `司礼监` 是明清宦官机构，唐代并无此官 | ✅ v5.0.1 已改为 `中书舍人` |
| byzantine | `theokrator` 不是标准头衔；牧首对巴西琉斯的伦理否决权被夸大 | ⚠️ 待修（v5.1） |
| roman-republic | ASCII 图过于线性；公民大会应置于执政官之上 | ⚠️ 待修（v5.1） |
| prussia | 1701–1918 全期被压缩进一张图；`Ober-Kriegsrat` 可能是虚构的 | ⚠️ 待修（v5.1） |
| ottoman | `Nişancı` 被误译为"大法官"（应为图格拉花押认证官） | ⚠️ 待修（v5.1） |

详见 [regimes/REVIEW-FINDINGS-v5.md](./regimes/REVIEW-FINDINGS-v5.md)。

### 9.4 国产模型的内容过滤

实测发现：`cc-kimi` 对其分配到的 6 个历史政体提示词全部直接返回 `API Error: 400 "high risk"`（包括讨论明代内阁与朝鲜王朝的中性历史描述）。其他国产后端（deepseek / glm / qwen / doubao）处理相同内容正常。这一差异反映了各厂商内容安全策略的不同，对大规模使用国产模型的项目有参考价值。

### 9.5 残留的评审偏差

多裁判盲评已经存在（§3.5）：匿名 transcript、锚定 4 分制、换序双跑、最多三个 provider、统一 verbosity 预算，以及覆盖 provider 方差、同族/跨族分差与位置效应的 `biasReport`。这对冲了文献指出的三类偏差——位置、长度、自我偏好——但**对冲不等于消除**，报告的存在是为了让残差保持可见，而不是被平均掉。

已知残差：

- **裁判池小且相关。** 三个 provider 都是指令微调的前沿模型，它们之间的一致性作为证据比看上去弱。
- **rubric 锚定本身就是一种先验。** "合法性 / 可行性 / 韧性"编码了一种关于"什么是好的治理产出"的观点。一个为 rubric 未覆盖维度优化的政体会得低分，而原因与它的拓扑无关。
- **长度控制是粗糙的。** 截到统一预算消除了最粗暴的长度优势，但"用密集摘要作答"和"用完整散文作答"仍然不是同类比较。

### 9.6 声明的拓扑 vs 实际执行的拓扑

本项目的每一个排名都是针对*声明的*图。`civagent runtime-graph <matchId> --diff` 现在能在职官级别重建实际发生了什么，并报告真正可观测的东西：哪些职官发言了、发言几次、协调者的派工序列。

它仍然**无法**观测的，恰恰是声明拓扑真正指定的东西——两个职官之间*带类型的有向边*。Claude Code 的子代理互不调用，协调者中继每一次交接，因此 `menxia → zhongshu [veto]` 这条边在物理上与"协调者→menxia、协调者→zhongshu"无法区分。要闭合这个洞，需要事件流记录每次交接的**逻辑产出方**，而不只是物理调用方。

所以 `unexercised_ratio` 保持 `null`，并且——这点很重要——`total_unexercised` 与 `edge_exercise_counts` 同样为 `null`。"未被行使"是一个关于**行为**的断言，而在用于验证的那场比赛里，门下省**确实**审核了中书省的草案三次：那些边被行使了，只是不可见。把它们报成"未被行使"是假的，所以同一份清单以 `unobservable_edges` 的名义发布。**请把拓扑层面的结论当作关于声明的主张，而不是关于行为的主张。**

### 9.7 实验实际上显示了什么

已经跑过两轮先导实验，全部记录在 `docs/experiments/`，**包括对本项目自身命题不利的结果**。

**E1**（5 政体 × 3 场景，无对照臂）无法解释：在唯一分差超过裁判噪声的场景里，分数与 transcript 长度的 Spearman ρ = +1.00，而得分最低的三格恰恰是 transcript 丢失了大部分工作内容的三格。该轮已作废——它早于捕获修复。

**E1-control**（5 组源/对照配对 × 3 场景）按预注册规则计分：历史接线赢下 **0** 组 resolved 配对，种子化随机重连赢 1 组，5 组落在裁判自身噪声内，9 组被剔除。**被剔除的那些才是发现**：**30 个臂里有 14 个政体从未调用过任何职官**，因此两种拓扑都没有被执行。派不派工由场景决定（瘟疫 10/10 派工，军阀化 2/10），而非由宪制决定；源臂与对照臂未派工的比例完全相同——各 7/15。

所以诚实的现状是：**尚无证据支持"治理拓扑影响多智能体表现"，也尚无证据支持其反面。** 障碍从"装置丢弃了审议内容"（已修复）移动到了"政体经常根本不审议"，而 §3.5 的派工计划与强制执行正是为分离这一点而存在。E2 已设计并预注册于 `docs/experiments/E2-preregistration.md`，尚未运行。

---

## 10. 相关工作

### 10.1 多智能体编排框架
- **Microsoft AutoGen** (Wu et al., 2023) —— 以群聊为基本单元，缺乏跨会话记忆
- **CrewAI** —— 基于角色的 agent 层级，但模式很少（sequential / hierarchical）
- **LangGraph** (LangChain, 2024) —— 基于 DAG 的 agent 编排，提供状态但不自动沉积
- **NousResearch/hermes-agent** (2026) —— 自主技能创建 + agent 策展记忆；CivAgent v5 的学习循环直接受其启发

### 10.2 政治学与制度设计
- 钱穆《中国历代政治得失》(1952) —— 制度史方法论
- 孟德斯鸠《论法的精神》(1748) —— 分权理论
- 波利比乌斯《历史》第六卷 —— 罗马混合政体
- Acemoglu & Robinson《国家为什么会失败》(2012) —— 汲取性 vs 包容性制度
- Francis Fukuyama《政治秩序的起源》(2011) —— 国家、法治、问责三元框架

### 10.3 AI 治理与 agent 对齐
- Christiano et al., "Deep Reinforcement Learning from Human Preferences" (2017)
- Anthropic Constitutional AI (2022) —— 价值对齐的层级化宪法设计
- 本项目把每个政体的 `SOUL.md` 视为一种"文明级宪法提示词"

---

## 11. 版本历史

| 版本 | 日期 | 关键变更 | PR |
|---|---|---|---|
| **v6.0.0** | 2026-05 | 宪政机制引擎（`[VETO]` / `[IMPEACH]` / `[EDICT]`）；Express 路由架构 + better-sqlite3；带实时 SSE 朝堂的 React SPA 看板 | — |
| *post-v6 (R5–R7)* | 2026-07 | 实验有效性层：锦标赛写 API、40 条场景库、带偏差报告的匿名多裁判打分、人格保真的拓扑对照、情景记忆检索、拓扑校验 + 图指标、回放。后端测试 9 → 369 | [#29](https://github.com/LeoLin990405/civagent/pull/29)、[#30](https://github.com/LeoLin990405/civagent/pull/30) |
| *post-v6 (R8–R11)* | 2026-07-30 | 治理图节点类型化；运行时图重建与声明/实际 diff；带可跑示例与端到端 smoke 的 CI；幂等的锦标赛记录；**stream-json transcript 捕获**（一场唐朝比赛捕获量从 579 → 72,830 字符）；裁判的职官分层 transcript 选取；派工计划 + 同等名单强制。后端测试 369 → 472 | [#32](https://github.com/LeoLin990405/civagent/pull/32) |
| **v5.0.1** | 2026-04-14 | 引擎数据源修复：IDENTITY.md 正典表成为主源，57 政体改写真正生效；README 改写为学术语体 | [#7](https://github.com/LeoLin990405/civagent/pull/7)、[#8](https://github.com/LeoLin990405/civagent/pull/8) |
| **v5.0.0** | 2026-04-14 | Hermes 启发的学习循环；cc-deepseek 作为第 7 个国产后端；57 政体正典改写；测试 + CI + 锦标赛模式 | [#3](https://github.com/LeoLin990405/civagent/pull/3)–[#6](https://github.com/LeoLin990405/civagent/pull/6) |
| **v4.x** | 2026-03 | 基于 Claude Code 运行时完全重写；57 政体 + 6 模式 + 10 模型的第一版 | — |
| **v3.5.x** | 2026-03 | 安装与 GUI server 稳定化（继承自原始 *AI Court*） | — |

完整记录见 [CHANGELOG.md](./CHANGELOG.md)。

---

## 12. 扩展指南

### 12.1 新增一个政体

```bash
cp -r regimes/_template regimes/<region>/<your-id>
# 按 docs/IDENTITY-TEMPLATE.md 填写 metadata.json + IDENTITY.md + SOUL.md
# 然后在 topology.json 里画出治理图
civagent topology validate <region>/<your-id>
npm run validate:regimes              # 本地校验
# 提 PR
```

要求：
- `IDENTITY.md` 的角色映射表必须是 **markdown 表格**，至少 5 行；Agent ID 用 kebab-case；AI 职责必须映射到 9 种正典角色之一。
  **散文格式的 IDENTITY 会编译成 0 个 agent 且静默通过**——这是砸掉一个政体最狠的方式，所以新增后花十秒跑一下 `civagent agents` 是值得的。
- `topology.json` 的节点 id 必须与角色表的 Agent ID 集合完全一致，`regime` 字段必须与它所在的目录一致。边类型为 `command` / `review` / `info` / `veto`。
- `metadata.json` 的 `orchestrationPattern` 必须是 6 种正典值之一或已注册别名，且必须与 `topology.json` 的 `mode` 一致。
- 至少 3 条史料引用。

### 12.2 新增一个 AI 后端

1. 在 `engine/models/providers.json` 的 `fast` 或 `strong` 数组中加入条目
2. （可选）在 `role_model_map` 中新增角色类别
3. 如需 CC 包装器，在 `~/bin/` 下创建 `cc-<name>` 启动脚本

### 12.3 新增一种编排模式

在 `engine/modes/` 下新增 `<pattern>.md`，包含执行流程、CC 实现、适用场景三段，并在 schema 的 mode 枚举中注册。

---

## 13. 致谢

- **@wanikua** 与 [*AI 法庭* / boluobobo-ai-court-tutorial](https://github.com/wanikua/danghuangshang) 项目 —— 提供了 57 政体元数据框架的原始结构
- **[NousResearch / Hermes Agent](https://github.com/NousResearch/hermes-agent)** —— 学习循环设计的灵感来源
- **Anthropic / Claude Code** —— 主运行时
- **OpenAI / Codex** —— 技能提取、评审与锦标赛裁定的 GPT-5.4 支持
- **opencode（`reviewer`）** —— 独立评审 / 裁定备选
- **国产 AI 厂商** —— 豆包、通义、智谱、月之暗面、阶跃星辰、MiniMax、DeepSeek
- **钱穆《中国历代政治得失》** —— 中国制度史的哲学骨架
- **Michael Oakeshott / Francis Fukuyama / Barrington Moore** —— 政治制度比较研究的方法论基础

详见 [CREDITS.md](./CREDITS.md)。

---

## 14. 许可与引用

MIT License，见 [LICENSE](./LICENSE)。

若在研究中使用 CivAgent，请引用：

```bibtex
@software{civagent2026,
  title        = {CivAgent: Historical Governance Systems as Multi-Agent Orchestration Patterns},
  author       = {Lin, Zhongyue (@LeoLin990405)},
  year         = {2026},
  version      = {6.0.0},
  url          = {https://github.com/LeoLin990405/civagent},
  note         = {Adapts @wanikua's AI Court regime corpus as canonical IDENTITY templates; inspired by Nous Research's Hermes Agent learning loop}
}
```

---

<div align="center">

**CivAgent** · 把五千年的制度试验，变成可运行、可证伪的编排实验

[English](README.md) · [CHANGELOG](./CHANGELOG.md) · [CREDITS](./CREDITS.md)

</div>
