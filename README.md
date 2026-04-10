[原始项目 Original Project](https://github.com/wanikua/danghuangshang) | [CREDITS](./CREDITS.md) | [CHANGELOG](./CHANGELOG.md)

<p align="center">
  <img src="./images/civagent-v4-banner.svg" alt="CivAgent v4 Banner" width="100%" />
</p>

# 🎮 CivAgent v4 — 选择你的文明，指挥你的 AI 团队

### 人类 5000 年治国智慧 × AI 多 Agent 协作 | 57 种政体 · 6 种编排模式 · 10 个模型 · Claude Code 驱动

<p align="center">
  <img src="https://img.shields.io/badge/文明-57种-gold?style=for-the-badge" />
  <img src="https://img.shields.io/badge/中华朝代-20个-red?style=for-the-badge" />
  <img src="https://img.shields.io/badge/世界帝国-37个-blue?style=for-the-badge" />
  <img src="https://img.shields.io/badge/编排模式-6种-purple?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Runtime-Claude_Code-blueviolet?style=for-the-badge" />
  <img src="https://img.shields.io/badge/模型-10个-orange?style=for-the-badge" />
</p>

<div align="center">

> *「每一代的制度都是对上一代制度弊端的回应。」*
> *— 钱穆《中国历代政治得失》*

</div>

---

## 📖 目录

- [一键切换文明](#-一键切换文明立即开始)
- [为什么迁移到 Claude Code？](#-为什么从-openclaw-迁移到-claude-code)
- [设计哲学](#-设计哲学政治制度即设计模式)
- [架构](#️-架构)
- [6 种编排模式（详解）](#️-6-种编排模式详解)
- [10 模型协作](#-10-模型协作)
- [快速开始](#-快速开始)
- [CLI 完整参考](#-cli-完整参考)
- [57 种文明完整目录](#-57-种文明完整目录)
- [Regime 配置文件详解](#-regime-配置文件详解)
- [引擎内部原理](#-引擎内部原理)
- [实际使用场景](#-实际使用场景)
- [项目结构](#-项目结构)
- [从 v3 迁移](#-从-v3-迁移)
- [致谢](#-致谢)

---

<div align="center">

### 🏛️ 一键切换文明，立即开始

```bash
# 🐉 唐朝三省六部 — 起草→审核→执行，权力制衡
civagent switch china/tang

# ⚔️ 秦朝中央集权 — 令行禁止，效率至上
civagent switch china/qin

# 🏛️ 雅典民主议会 — 三模型并行，多数表决
civagent switch global/athens

# 🏰 明朝双轨验证 — 内阁+司礼监，双链校验
civagent switch china/ming

# 🌐 波斯总督制 — 联邦自治，最终一致
civagent switch global/persia

# 📜 查看全部 57 种文明
civagent list
```

</div>

---

## 🔄 为什么从 OpenClaw 迁移到 Claude Code？

### 背景

CivAgent v1–v3 基于 [OpenClaw](https://github.com/wanikua/danghuangshang) 框架运行。OpenClaw 是一个优秀的多 Agent 框架——它让我们能够在 Discord 上部署 10 个角色机器人，通过频道 @mention 互相派活、协作。正是在这个框架上，我们验证了核心假说：**历史治理模式确实能指导 AI 多 Agent 协作。**

但随着项目从 10 个 Agent 扩展到 57 种文明、从「角色扮演演示」走向「实际工作执行」，我们撞到了 OpenClaw 架构的天花板。

### 逐项对比

<table>
<tr>
<th width="15%">维度</th>
<th width="42%">v3：OpenClaw + Discord</th>
<th width="43%">v4：Claude Code Runtime</th>
</tr>

<tr>
<td><b>🔧 编码能力</b></td>
<td>OpenClaw sandbox 只能执行简单 shell 命令。兵部（工程 Agent）被要求写代码时，只能在聊天窗口里「贴代码片段」，无法真正创建文件、运行测试、操作 git。<br><br>就像让一个工程师在白板上写代码——能讨论，不能交付。</td>
<td>Claude Code 原生支持 <code>Edit</code>、<code>Write</code>、<code>Bash</code>、<code>Git</code> 工具。兵部现在能直接创建文件、写代码、运行测试、提交 PR。<br><br><code>Agent(isolation="worktree")</code> 让每个 Agent 在独立 git 分支上工作，互不干扰。</td>
</tr>

<tr>
<td><b>🧠 模型多样性</b></td>
<td>所有 Agent 共享同一个 OpenAI-compatible API。无论司礼监（调度）还是兵部（编码），底层都是同一个模型。<br><br>好比让全朝文武百官都是同一个人的分身——没有真正的「不同视角」。</td>
<td>10 个不同模型各司其职：<br>• <b>Opus</b> 处理推理和编码<br>• <b>Codex (GPT-5.4)</b> 做代码审查<br>• <b>Gemini</b> 分析 1M token 长文档<br>• <b>6 个国产模型</b>（Kimi/Qwen/GLM/Doubao/StepFun/MiniMax）覆盖中文场景<br><br>真正实现了「不同模型家族的交叉审查」——这是消除系统性偏差的关键。</td>
</tr>

<tr>
<td><b>🔀 编排能力</b></td>
<td>Agent 间通过 Discord @mention 传递消息。没有结构化的「起草→审查→执行」流程，没有「驳回原因必须附带字段」的约束，没有「并行执行后多数表决」的机制。<br><br>编排逻辑全靠 Agent 的 prompt 自律——实际效果参差不齐。</td>
<td>Claude Code 内置：<br>• <code>Agent()</code> tool — 启动 subagent，可并行<br>• <code>isolation="worktree"</code> — git 分支隔离<br>• <code>SendMessage()</code> — 结构化 Agent 间通信<br>• <code>codex:adversarial-review</code> — 标准化代码审查<br><br>6 种编排模式不再是 prompt 里的「建议」，而是引擎级别的执行保证。</td>
</tr>

<tr>
<td><b>🐳 部署成本</b></td>
<td>需要：<br>• Docker 容器 7×24 运行<br>• 10 个 Discord Bot Token<br>• React GUI 前端服务<br>• Node.js + Chromium + Python<br>• 飞书/Discord 频道配置<br><br>仅搭建环境就需要 30+ 分钟。</td>
<td>需要：<br>• <code>claude</code> CLI（已安装）<br>• <code>node</code>（已安装）<br>• 可选：<code>codex</code>、<code>gemini</code>、<code>cc-*</code><br><br>一行命令启动：<code>civagent run</code><br>不需要 Docker、不需要 Bot Token、不需要前端服务。</td>
</tr>

<tr>
<td><b>👁️ 可观察性</b></td>
<td>Discord 频道本身就是「可视化工作流」——所有人都能看到 Agent 间的对话。这是 v3 最大的优势。<br><br>React GUI 提供 dashboard、token 统计、会话历史。</td>
<td>CC 使用 tmux panes 分屏显示多个 Agent 的并行工作。<code>agent-teams</code> skill 提供任务共享和消息传递。<br><br>不如 Discord 直观，但 Agent 现在是在「干活」而不是「聊天」——你看到的是真实的代码diff，不是讨论记录。</td>
</tr>

<tr>
<td><b>🎭 灵魂传承</b></td>
<td>SOUL.md 通过 OpenClaw 的 <code>identity.theme</code> 字段注入到每个 Agent 的 system prompt。</td>
<td>SOUL.md 通过 CC 的 <code>--system-prompt-file</code> 注入。每个 Agent 的 <code>prompt</code> 字段包含完整的 SOUL 行为准则。<br><br><b>57 个 regime 的全部配置文件（metadata.json、IDENTITY.md、SOUL.md）100% 原封保留。</b>治理智慧的「宪法文本」没有改动一个字。</td>
</tr>
</table>

### 一句话总结

> **v3 的 CivAgent 是一部「治国模拟器」——Agent 们在 Discord 频道里扮演角色、讨论方案、生成文本。**
>
> **v4 的 CivAgent 是一台「治国执行引擎」——Agent 们按照治理模式的指令，真正地写代码、审查 PR、运行测试、部署服务。**

钱穆先生说：「制度不是抄来的，是在具体问题中生长出来的。」v4 的迁移不是为了追新，而是因为我们的问题变了——从「证明治理模式能映射到 Agent」，变成了「让 Agent 按照治理模式真正地工作」。Claude Code 是当下最适合回答后一个问题的 runtime。

---

## 💡 设计哲学：政治制度即设计模式

CivAgent 的核心洞察来自一个跨学科类比：

| 政治制度概念 | 软件工程对应 |
|-------------|-------------|
| 国家 | 多 Agent 系统 |
| 官员 | 专业化 Agent |
| 三省六部（唐） | 编译器流水线：前端(解析) → 中端(验证) → 后端(生成) |
| 内阁+司礼监（明） | N-Version Programming：两条独立链处理同一输入 |
| 直接民主（雅典） | 集成学习：多个模型独立预测 → 多数投票 |
| 总督制（波斯） | 微服务架构：自治节点 + 最终一致 |
| 中央集权（秦） | 单体架构：一个进程处理一切 |

**关键发现：不同的任务特征需要不同的编排模式。**

| 任务特征 | 最优模式 | 历史证据 | 理论支撑 |
|---------|---------|---------|---------|
| 集中、紧急 | 中央集权（秦） | 秦统一六国 | Tilly 的战争与国家形成 |
| 复杂、需多轮审查 | 三权制衡（唐） | 唐朝三省流转 | Coase 交易成本理论 |
| 分散、高方差 | 联邦自治（波斯） | 波斯总督制 | Hayek 本地知识论 |
| 需聚合多方意见 | 民主表决（雅典） | 雅典陪审团 | Condorcet 陪审团定理 |
| 需双重验证 | 双轨制（明） | 明朝内阁+司礼监 | Avizienis N-Version Programming |
| 资源稀缺、需快速行动 | 神权独裁（商） | 商朝甲骨占卜 | 决策随机化（避免可预测性） |

这不是一个玩具——这是 5500 年的人类组织实验数据，转化为可执行的 AI 协作配置。

---

## 🏗️ 架构

<p align="center">
  <img src="./images/architecture-v4.svg" alt="CivAgent v4 Architecture" width="100%" />
</p>

### 数据流

```
┌──────────────────────────────────────────────────────────────────┐
│  regimes/china/tang/                                             │
│  ├── metadata.json    → { orchestrationPattern, agentCount }     │
│  ├── IDENTITY.md      → 角色映射表、组织架构图                    │
│  ├── SOUL.md          → 行为准则、语言风格、禁忌                  │
│  └── openclaw.json    → Agent 列表 + 模型分配（兼容层）           │
└──────────────────────┬───────────────────────────────────────────┘
                       │  engine/regime-to-cc.mjs
                       ▼
┌──────────────────────────────────────────────────────────────────┐
│  ~/.civagent/                                                     │
│  ├── agents.json      → CC --agents 格式（每个 Agent 有独立 prompt）│
│  ├── CLAUDE.md        → 系统提示词（SOUL + IDENTITY + 编排模式）   │
│  └── .active-regime   → "china/tang"                              │
└──────────────────────┬───────────────────────────────────────────┘
                       │  civagent run
                       ▼
┌──────────────────────────────────────────────────────────────────┐
│  claude --agents agents.json --system-prompt-file CLAUDE.md       │
│                                                                   │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐            │
│  │ 司礼监   │  │  兵部   │  │ 都察院   │  │ 翰林院  │  ...       │
│  │ Sonnet  │  │ Opus    │  │ Codex   │  │ Gemini  │            │
│  │ 调度    │  │ 编码    │  │ 审查    │  │ 研究    │            │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘            │
│                                                                   │
│  Model Layer:                                                     │
│  CC(Opus/Sonnet) + Codex(GPT-5.4) + Gemini + 6×CN backends      │
└──────────────────────────────────────────────────────────────────┘
```

### 核心设计决策

**「宪法 vs 代码」分离**：参照 Douglass North 的制度经济学，改代码是「政变」（高风险），改配置是「改革」（可控）。CivAgent 的 engine 是「宪法解释器」，regime 配置是「宪法文本」。切换文明只改配置，不改一行引擎代码。

---

## ⚖️ 6 种编排模式（详解）

### 🐉 centralized — 中央集权

> 历史原型：秦朝三公九卿、元朝一省制、拿破仑帝国、苏维埃政治局

**核心原则**：一个中心节点（皇帝/总书记/主 Agent）直接控制所有下级，没有制衡机构。信息单向流动（自上而下），决策速度极快，但无容错。

**CC 实现**：
```
User → 主 CC 会话 (Opus)
         ├── Agent(model="sonnet") → 子任务 A
         ├── Agent(model="sonnet") → 子任务 B
         └── 收集结果 → 直接返回给用户
```

**适用场景**：
- 生产事故紧急修复（没时间走审查流程）
- 简单、定义明确的任务（不值得多 Agent 开销）
- 信任单一模型的输出质量

**历史教训**：秦二世而亡——中央集权的效率极高，但没有纠错机制，一旦顶层决策失误，整个系统崩溃。在 AI 场景中：如果 Opus 产生了幻觉，没有任何 Agent 会提出质疑。

---

### ⚖️ checks-balances — 三权制衡

> 历史原型：唐朝三省六部、罗马共和国、威尼斯共和国（1100 年）、美国三权分立

**核心原则**：起草者 ≠ 审查者 ≠ 执行者。孟德斯鸠的分权思想：任何权力都需要另一种权力来制约。

**CC 实现**：
```
User → Coordinator (Sonnet)
         │
         ├─ Stage 1 — 起草 (Draft)
         │   Agent(model="opus") 或 codex:rescue
         │   产出初步方案
         │
         ├─ Stage 2 — 审查 (Review)
         │   Agent(model="opus") 或 codex:adversarial-review
         │   评估方案质量
         │   ├─ PASS → 进入执行阶段
         │   └─ REJECT → 必须附带结构化驳回原因：
         │       { legality, feasibility, consistency }
         │       返回起草阶段修改（最多 3 轮）
         │
         └─ Stage 3 — 执行 (Execute)
             主 CC 会话应用通过审查的方案
```

**关键设计**：
- **交叉模型审查**：Claude 起草的代码由 Codex 审查，反之亦然。不同模型家族的系统性偏差不相关，交叉审查能捕获单一模型链无法发现的问题。
- **结构化驳回**：唐朝门下省封驳必须写明原因，起草的中书省必须逐条回应。在 CC 中，reviewer 必须指定 `{legality, feasibility, consistency}` 三个维度的评分。
- **有限轮次**：最多 3 轮审查。宋朝的教训——过度制衡导致「冗官冗兵」，效率崩溃。

**适用场景**：代码 PR、架构设计、任何错误代价高昂的决策。

---

### 🔄 dual-track — 双轨验证

> 历史原型：明朝内阁+司礼监、斯巴达双王制、辽朝南北面官

**核心原则**：两条完全独立的决策链处理同一个输入。结果一致 = 高置信度；结果分歧 = 需要人工介入。本质上是 Avizienis 的 N-Version Programming。

**CC 实现**：
```
User → Coordinator
         │
         ├─ Track A: Agent(model="opus", isolation="worktree")
         │   独立产出方案 A
         │
         ├─ Track B: codex:rescue 或 gemini -p
         │   独立产出方案 B（不同模型家族！）
         │
         └─ Compare:
              ├─ 两者一致 → 高置信度，接受方案
              ├─ 小差异 → 合并两者最佳部分
              └─ 根本分歧 → 上报用户或启动第三方仲裁
```

**关键设计**：
- **模型家族隔离**：Track A 用 Claude (Anthropic)，Track B 用 Codex (OpenAI) 或 Gemini (Google)。三家公司的训练数据、RLHF、系统性偏差完全不相关。
- **万历缺位韧性**：明朝万历皇帝 20 年不上朝（1588–1620），帝国照常运转——因为内阁和司礼监两条链各自独立工作。这就是双轨制的容错优势。

**适用场景**：安全关键代码、金融计算、任何需要「双重确认」的场景。

---

### 🌐 federation — 联邦自治

> 历史原型：周朝分封、神圣罗马帝国、波斯总督制、波兰立陶宛联邦

**核心原则**：各诸侯/总督/联邦成员在自己的领地内完全自治，中央只在跨域问题上介入。Hayek 的「本地知识论」：最重要的知识是「特定时间和地点的具体情况」——让知识在产生的地方被使用，而不是强行聚合到中央。

**CC 实现**：
```
User → Coordinator (轻量级，只做任务拆分)
         │
         ├─ Domain A: Agent(isolation="worktree") — 前端模块
         ├─ Domain B: Agent(isolation="worktree") — 后端模块
         ├─ Domain C: Agent(isolation="worktree") — 数据层
         │
         └─ 全部完成后 → Coordinator 合并 worktrees
              处理冲突，整合最终结果
```

**关键设计**：
- **接口契约**：波斯帝国治下，希腊城邦、埃及神庙、巴比伦商会各自保留自己的治理方式，帝国只规定输出格式（贡赋金额+征兵人数）。在 CC 中：每个 Agent 只需要知道输入/输出格式，不需要了解其他 Agent 的内部实现。
- **最终一致**：波斯皇家驿道（7天 vs 90天）+ 王之耳目（随机审计）+ 年度贡赋（心跳检查）= 高通信成本环境下的最终一致方案。

**适用场景**：大型任务分解为独立子问题、多模块并行开发、monorepo 中不同 package 的同时修改。

---

### 🗳️ democratic — 民主表决

> 历史原型：雅典直接民主、蒙古忽里勒台、维京议事会、瑞士联邦

**核心原则**：多个 Agent 独立生成方案，通过投票确定最终答案。Condorcet 陪审团定理：如果每个 Agent 的准确率 > 50%，多数投票的整体准确率随人数增加趋近 100%。

**CC 实现**：
```
User → Coordinator
         │
         ├─ Agent A (Opus):   独立生成方案
         ├─ Agent B (Codex):  独立生成方案  ← 全部并行
         ├─ Agent C (Gemini): 独立生成方案
         │
         └─ Vote:
              ├─ 多数一致 (≥2/3) → 接受多数方案
              ├─ 平局 → 各 Agent 互相批评对方方案 → 重新投票
              └─ 仍无共识 → Coordinator (Opus) 最终裁决
```

**关键设计**：
- **抽签制（Sortition）**：雅典五百人会议成员通过抽签产生（10 部落各 50 人），消除操纵。在 AI 中，使用不同模型家族本身就是一种「天然抽签」——它们的偏差不相关。
- **蒙古案例**：历史上扩张速度最快的帝国，军事决策用忽里勒台（民主讨论），战术执行用十进制指挥链（中央集权）。证明民主和效率可以共存——战略层面用 democratic，执行层面用 centralized。

**适用场景**：困难问题（不确定哪个模型会给出最好答案）、架构设计（需要多视角）、调试（多个假设并行验证）。

---

### 👑 theocratic — 神权独裁

> 历史原型：商朝神权政治、古埃及法老制、太平天国

**核心原则**：最高权威的 Agent 拥有绝对权力，没有审查、没有投票。零开销，最快速度。适用范围最窄。

**CC 实现**：
```
User → 单一 Agent (Opus, --effort max)
         └── 直接执行，不派生子任务
```

**适用场景**：生产紧急事故、简单问答、已经确认方案只需执行的任务。

**历史教训**：商朝通过甲骨占卜决策——本质上是决策随机化，在信息极度匮乏时避免可预测性被对手利用。在 AI 场景中：当所有审查流程的耗时 > 问题本身的影响时，直接执行是正确选择。

---

## 🧠 10 模型协作

CivAgent v4 的核心突破：**让不同模型做它们最擅长的事。**

### 主力模型（4 个）

| 模型 | 提供商 | 核心能力 | CivAgent 中的角色 |
|------|--------|---------|------------------|
| **Claude Opus** | Anthropic | 最强推理、代码生成、长上下文 | 兵部（编码）、都察院（审查）、内阁（决策） |
| **Claude Sonnet** | Anthropic | 快速、成本低、质量足够 | 司礼监（调度）、工部/礼部/刑部/吏部（轻量任务） |
| **Codex (GPT-5.4)** | OpenAI | 代码专精、adversarial review | 交叉审查（消除 Claude 盲点）、rescue 任务 |
| **Gemini 2.5 Pro** | Google | 1M token 上下文 | 翰林院（超长文档分析）、全局架构审查 |

### 国产模型后端（6 个）

通过 [cn-cc 插件](https://github.com/LeoLin990405/cn-cc) 接入，每个模型运行在独立的 Claude Code 实例中：

| 模型 | 提供商 | 核心能力 | CivAgent 中的角色 |
|------|--------|---------|------------------|
| **Doubao** (doubao-seed-code-pro) | 字节跳动 | 通用中文编码 | 默认中文任务、礼部（内容创作） |
| **Qwen** (qwen3.5-plus) | 阿里巴巴 | SQL、阿里生态 | 户部（数据分析/SQL）、阿里云相关 |
| **Kimi** (kimi-k2.5) | 月之暗面 | 128K 超长上下文 | 翰林院备选（长文档分析） |
| **GLM** (glm-4.7) | 智谱 AI | 中文深度推理 | 需要深度中文理解的任务 |
| **StepFun** (step-3.5-flash) | 阶跃星辰 | 数学/逻辑推理 | 数学证明、优化问题 |
| **MiniMax** (M2.7-highspeed) | MiniMax | 最低延迟 | 高速轻量任务 |

### 交叉审查矩阵

不同模型家族的交叉审查是 CivAgent 质量保证的核心：

| 谁起草 | 谁审查 | 为什么 |
|--------|--------|--------|
| Claude (Opus) | Codex (GPT-5.4) | 不同训练数据 → 不同盲点 |
| Codex (GPT-5.4) | Claude (Opus) | 反向交叉，双重保障 |
| 任何主力模型 | Gemini (1M ctx) | 超长上下文全局审查 |
| 国产模型 | Claude 或 Codex | 中文输出由英文模型审查逻辑 |

---

## 🚀 快速开始

### 前置条件

| 工具 | 是否必须 | 安装方式 | 说明 |
|------|---------|---------|------|
| Claude Code | **必须** | `npm i -g @anthropic-ai/claude-code` | 核心运行时 |
| Node.js 18+ | **必须** | `brew install node` | 引擎运行 |
| Codex CLI | 推荐 | `npm i -g @openai/codex` | 交叉审查、rescue |
| Gemini CLI | 推荐 | `brew install gemini` | 1M 上下文分析 |
| cn-cc 后端 | 可选 | `~/bin/cc-{doubao,qwen,kimi,glm,stepfun,minimax}` | 国产模型 |

### 安装

```bash
# Clone
git clone https://github.com/LeoLin990405/civagent.git ~/Projects/civagent-v4
cd ~/Projects/civagent-v4

# 添加到 PATH（建议写入 ~/.zshrc）
export PATH="$HOME/Projects/civagent-v4/bin:$PATH"

# 检查工具链
civagent setup
```

### 第一次使用

```bash
# 1. 浏览文明
civagent list

# 2. 选择唐朝（最经典的 checks-balances 模式）
civagent switch china/tang

# 3. 查看生成的 Agent 配置
civagent agents

# 4. 启动交互式 CC 会话
civagent run

# 5. 或者直接执行单次任务
civagent run "帮我重构 src/auth 模块，拆分成 login、register、token 三个文件"
```

---

## 📋 CLI 完整参考

```bash
civagent list                      # 列出全部 57 种文明（标记当前活跃的）
civagent info <regime>             # 显示文明详情（名称、年代、制度、Agent 数）
civagent switch <regime>           # 切换活跃文明（生成 agents.json + CLAUDE.md）
civagent run [prompt]              # 启动 CC 会话（交互式或单次任务）
civagent run --mode <mode> [prompt]  # 使用指定编排模式
civagent run -p [prompt]           # 非交互模式（print & exit）
civagent agents                    # 查看当前文明的 CC agents 配置
civagent modes                     # 列出 6 种编排模式
civagent setup                     # 检查工具链（CC、Codex、Gemini、cn-cc）
```

**Regime 路径格式**：`<region>/<id>`，例如 `china/tang`、`global/athens`、`global/roman-empire`。

---

## 🌏 57 种文明完整目录

### 🐉 中华朝代 (20)

| 朝代 | 年代 | 制度 | 编排模式 | Agent 数 | 标签 |
|------|------|------|---------|---------|------|
| 夏 | ~2070–1600 BC | 禅让制→��袭制 | theocratic | 5 | 原始国家 |
| 商 | ~1600–1046 BC | 神权政治 | theocratic | 6 | 甲骨占卜 |
| 周 | ~1046–256 BC | 分封制 | federation | 8 | 礼乐制度 |
| 秦 | 221–207 BC | 三公九卿 | centralized | 7 | 统一度量衡 |
| 汉 | 202 BC–220 AD | 三公九卿（改良） | centralized | 8 | 儒法结合 |
| 三国 | 220–280 | 军事割据 | federation | 6 | 三足鼎立 |
| 晋 | 265–420 | 九品中正 | centralized | 6 | 门阀政治 |
| 南北朝 | 420–589 | 门阀士族 | federation | 7 | 民族融合 |
| 隋 | 581–618 | 三省六部（初创） | checks-balances | 7 | 科举开端 |
| **唐** | **618–907** | **三省六部（完善）** | **checks-balances** | **7** | **贞观之治** |
| 五代 | 907–960 | 军阀轮替 | centralized | 5 | 藩镇割据 |
| 宋 | 960–1279 | 二府三司 | checks-balances | 8 | 文官治国 |
| 辽 | 916–1125 | 南北面官 | dual-track | 7 | 因俗而治 |
| 西夏 | 1038–1227 | 蕃汉并行 | dual-track | 6 | 双语治理 |
| 金 | 1115–1234 | 猛安谋克 | federation | 6 | 军政合一 |
| 元 | 1271–1368 | 一省制 | centralized | 7 | 四等人制 |
| **明** | **1368–1644** | **内阁+司礼监** | **dual-track** | **8** | **万历韧性** |
| 清 | 1644–1912 | 军机处 | centralized | 8 | 密折制度 |
| 太平天国 | 1851–1864 | 天朝田亩制 | theocratic | 6 | 宗教动员 |
| 中华民国 | 1912–1949 | 五权宪法 | checks-balances | 8 | 孙中山设计 |

### 🌍 世界帝国 (37)

| 帝国 | 年代 | 制度 | 编排模式 | Agent 数 |
|------|------|------|---------|---------|
| Sumer 苏美尔 | ~3500–2000 BC | 城邦联盟 | federation | 5 |
| Egypt 古埃及 | ~3100–30 BC | 法老神权 | theocratic | 6 |
| Athens 雅典 | 508–322 BC | 直接民主 | democratic | 7 |
| Sparta 斯巴达 | ~900–371 BC | 双王制 | dual-track | 6 |
| Persia 波斯 | 550–330 BC | 总督制 | federation | 7 |
| Carthage 迦太基 | ~650–146 BC | 商人共和 | democratic | 6 |
| Maurya 孔雀 | 322–185 BC | 中央集权 | centralized | 6 |
| Roman Republic 罗马共和 | 509–27 BC | 元老院+执政官 | checks-balances | 8 |
| Roman Empire 罗马帝国 | 27 BC–476 AD | 帝制官僚 | centralized | 7 |
| Byzantine 拜占庭 | 330–1453 | 皇帝+教会 | centralized | 7 |
| Caliphate 哈里发 | 632–1258 | 哈里发制 | theocratic | 6 |
| Viking 维京 | 793–1066 | 议事会 | democratic | 5 |
| HRE 神圣罗马 | 962–1806 | 选帝侯 | federation | 8 |
| Mongol 蒙古 | 1206–1368 | 忽里勒台 | democratic | 7 |
| Mali 马里 | 1235–1600 | 曼萨制 | centralized | 5 |
| Venice 威尼斯 | 697–1797 | 总督+十人团 | checks-balances | 7 |
| Aztec 阿兹特克 | 1428–1521 | 三城联盟 | federation | 6 |
| Inca 印加 | 1438–1533 | 四方制 | centralized | 6 |
| Ottoman 奥斯曼 | 1299–1922 | 苏丹官僚 | centralized | 8 |
| Safavid 萨法维 | 1501–1736 | 沙阿制 | centralized | 6 |
| Mughal 莫卧儿 | 1526–1857 | 曼萨卜制 | centralized | 7 |
| Joseon 朝鲜 | 1392–1897 | 六曹制 | checks-balances | 7 |
| Shogunate 幕府 | 1185–1868 | 将军制 | federation | 7 |
| Meiji 明治 | 1868–1912 | 立宪君主 | checks-balances | 7 |
| Khmer 高棉 | 802–1431 | 神王制 | theocratic | 5 |
| Zulu 祖鲁 | 1816–1897 | 军事联盟 | centralized | 5 |
| British 英国 | 1707–present | 君主立宪 | checks-balances | 8 |
| French 法国 | 1792–present | 共和制 | checks-balances | 7 |
| Prussian 普鲁士 | 1701–1918 | 军事官僚 | centralized | 7 |
| Russian 俄罗斯 | 1721–1917 | 沙皇专制 | centralized | 7 |
| Habsburg 哈布斯堡 | 1282–1918 | 联合君主 | federation | 7 |
| Napoleon 拿破仑 | 1804–1815 | 军事集权 | centralized | 6 |
| US Federal 美国 | 1789–present | 三权分立 | checks-balances | 8 |
| Swiss 瑞士 | 1291–present | 直接民主 | democratic | 6 |
| Soviet 苏联 | 1922–1991 | 民主集中 | centralized | 7 |
| EU 欧盟 | 1993–present | 超国家联盟 | federation | 8 |
| Polo 波兰立陶宛 | 1569–1795 | 贵族共和 | democratic | 6 |

---

## 📄 Regime 配置文件详解

每种文明由 5 个文件定义：

### `metadata.json` — 机器可读元数据

```json
{
  "id": "tang",
  "name": { "zh": "唐朝", "en": "Tang Dynasty" },
  "era": { "zh": "618年-907年", "en": "618-907 AD" },
  "region": "china",
  "system": { "zh": "三省六部制（完善）", "en": "Three Departments and Six Ministries" },
  "description": { "zh": "...", "en": "..." },
  "agentCount": 7,
  "tags": ["checks-and-balances", "confucian", "meritocratic"],
  "orchestrationPattern": "checks-and-balances"
}
```

### `IDENTITY.md` — 组织架构

定义 Agent 的层级关系、角色映射（历史角色→AI职责）、模型分层策略（强力/快速）、协作流程。包含 ASCII 组织架构图。

### `SOUL.md` — 行为准则

定义 Agent 的语言风格（「遵旨，臣即刻办理」）、交互规范（收到任务→确认→执行→汇报）、禁忌（不得越权、不得隐瞒）。这是 CivAgent 的「灵魂」——不同文明的 Agent 说话方式、行为模式完全不同。

### `openclaw.json.template` — 遗留兼容

v3 的 OpenClaw 配置文件，保留作为参考和向后兼容。`engine/regime-to-cc.mjs` 可以从这个文件中提取 Agent 定义。

### `README.md` — 历史背景

这个文明的历史背景、制度设计原理、以及为什么它的编排模式是这样选择的。

---

## ⚙️ 引擎内部原理

### `engine/regime-to-cc.mjs` — 转换器

这是 CivAgent v4 的核心脚本（~200 行）。它做三件事：

1. **读取 regime 配置**：解析 `metadata.json`、`IDENTITY.md`（提取角色映射表）、`SOUL.md`、`openclaw.json.template`（提取 Agent 列表）
2. **角色检测**：通过关键词匹配（中/英双语）将每个 Agent 映射到功能角色（coordinator/engineering/review/...），进而确定推荐模型
3. **生成 CC 配置**：输出 `--agents` JSON（每个 Agent 有独立的 description + prompt + model）和 `CLAUDE.md`（系统提示词）

### `engine/modes/*.md` — 编排模式

6 个 Markdown 文件，每个定义一种编排模式的：
- 历史原型和核心原则
- CC 执行流程（用什么工具、怎么编排 Agent）
- 适用场景和反模式

当用户运行 `civagent run --mode democratic` 时，对应的 mode 文件会被追加到系统提示词中。

### `engine/models/providers.json` — 模型路由

定义 10 个可用模型及其角色映射。当 `regime-to-cc.mjs` 检测到一个 Agent 的功能角色是 `engineering` 时，查表得到推荐模型 `opus`，备选 `codex`。

---

## 💼 实际使用场景

### 场景 1：日常编码（唐朝制衡模式）

```bash
civagent switch china/tang
civagent run "重构 src/auth 模块，拆分成 login、register、token-refresh 三个文件"
```

兵部(Opus) 写代码 → 都察院(Codex) 审查 → 通过后司礼监(Sonnet) 整合提交。

### 场景 2：紧急修复（秦朝集权模式）

```bash
civagent switch china/qin
civagent run "生产环境 500 错误，立即修复 src/api/orders.ts 的空指针"
```

单一 Opus 直接执行，不走审查流程。

### 场景 3：架构设计（雅典民主模式）

```bash
civagent switch global/athens
civagent run --mode democratic "设计一个支持 10 万 QPS 的消息队列架构"
```

Opus + Codex + Gemini 各自独立设计 → 比较三套方案 → 多数表决或综合最优。

### 场景 4：安全审计（明朝双轨模式）

```bash
civagent switch china/ming
civagent run "审计 src/payment/ 目录的安全漏洞"
```

Track A (Claude Opus) + Track B (Codex GPT-5.4) 独立审计 → 比对发现 → 分歧处上报。

### 场景 5：大型重构（周朝联邦模式）

```bash
civagent switch china/zhou
civagent run --mode federation "将 monolith 拆分为 auth、billing、notification 三个微服务"
```

三个 Agent 分别在独立 worktree 中工作 → 各自完成后合并。

---

## 📁 项目结构

```
civagent-v4/
├── bin/
│   └── civagent                   # CLI 入口（~250 行 Bash）
├── engine/
│   ├── regime-to-cc.mjs           # 核心：regime → CC agents 转换器（~200 行）
│   ├── modes/                     # 6 种编排模式定义
│   │   ├── centralized.md         #   🐉 秦/元/拿破仑 — 中央集权
│   │   ├── checks-balances.md     #   ⚖️ 唐/威尼斯/美国 — 三权制衡
│   │   ├── dual-track.md          #   🔄 明/斯巴达/辽 — 双轨验证
│   │   ├── federation.md          #   🌐 周/波斯/HRE — 联邦自治
│   │   ├── democratic.md          #   🗳️ 雅典/蒙古/维京 — 民主表决
│   │   └── theocratic.md          #   👑 商/埃及/太平天国 — 神权独裁
│   └── models/
│       └── providers.json         # 10 模型路由配置
├── regimes/
│   ├── _template/                 # 新文明脚手架模板
│   ├── china/ (20 directories)    # 中华朝代
│   │   ├── tang/                  #   每个目录包含 5 个文件：
│   │   │   ├── metadata.json      #     机器元数据
│   │   │   ├── IDENTITY.md        #     组织架构
│   │   │   ├── SOUL.md            #     行为准则
│   │   │   ├── openclaw.json.template  # 遗留配置
│   │   │   └── README.md          #     历史背景
│   │   ├── qin/
│   │   ├── ming/
│   │   └── ...
│   └── global/ (37 directories)   # 世界帝国
│       ├── athens/
│       ├── roman-empire/
│       ├── persia/
│       └── ...
├── images/
│   ├── civagent-v4-banner.svg     # 项目 banner
│   └── architecture-v4.svg        # 架构图
├── CREDITS.md                     # 致谢（含完整学术参考）
├── CHANGELOG.md                   # 版本历史
└── LICENSE                        # MIT
```

---

## 🔄 从 v3 迁移

如果你之前使用 CivAgent v3（OpenClaw + Discord）：

| v3 组件 | v4 对应 | 状态 |
|---------|---------|------|
| `openclaw.json` | `~/.civagent/agents.json`（自动生成） | 自动转换 |
| Discord Bot Tokens | 不再需要 | 删除 |
| React GUI | tmux panes / agent-teams | 替代 |
| Docker 部署 | `civagent run` | 替代 |
| `scripts/switch-regime.sh` | `civagent switch` | 替代 |
| `scripts/list-regimes.sh` | `civagent list` | 替代 |
| SOUL.md / IDENTITY.md | **100% 保留，原封不动** | ✅ |
| 57 个 regime 目录 | **100% 保留，原封不动** | ✅ |

**核心原则：治理智慧的「宪法文本」一个字都没改。变的只是「宪法解释器」——从 OpenClaw 换成了 Claude Code。**

---

## 🙏 致谢

> **本项目基于 [@wanikua](https://github.com/wanikua)（菠萝菠菠）的 [AI 朝廷](https://github.com/wanikua/danghuangshang) 项目。**

没有 wanikua 的原始创意——把中国古代官制映射到 AI 多 Agent 协作——就不会有这个项目。「AI 朝廷」首发于 2026 年 2 月 22 日，开创性地将唐朝三省六部制与 OpenClaw 多 Agent 框架结合，让每个人都能用一行命令搭建自己的「AI 朝廷」。

**原始的唐朝三省六部制配置完整保留在 `regimes/china/tang/`，未做任何修改。**

v4 的 Claude Code 插件架构受 [openai/codex-plugin-cc](https://github.com/openai/codex-plugin-cc) 启发——它的 commands + agents + skills + companion scripts 模式，让多模型委托在 Claude Code 中成为可能。

详见 [CREDITS.md](./CREDITS.md)，其中包含完整的学术参考文献（钱穆、North、Hayek、Condorcet、Avizienis 等）。

---

<div align="center">

> *「世界历史可以这样总结：当国家强大时，它们并不总是公正的；*
> *而当它们希望做到公正时，它们往往已不再强大。」*
> *— 温斯顿·丘吉尔*

---

**CivAgent v4** — *历史不只是关于过去，它是组织智慧的活化石。*

```bash
civagent switch china/tang && civagent run
```

<sub>57 regimes · 6 modes · 10 models · 5500 years of institutional experimentation · 1 command</sub>

</div>
