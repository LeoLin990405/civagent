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

# 📜 查看全部 57 种文明
civagent list
```

</div>

---

## 🔄 为什么从 OpenClaw 迁移到 Claude Code？

<table>
<tr>
<td width="50%">

### v3 时代：OpenClaw + Discord

CivAgent v1–v3 基于 [OpenClaw](https://github.com/wanikua/danghuangshang) 框架，每个 Agent 是一个 Discord 机器人。它验证了核心假说——历史治理模式确实能指导多 Agent 协作。

**但我们撞到了天花板：**

- 🔧 **编码能力受限** — OpenClaw 的 sandbox 只能执行简单 shell 命令，无法真正写代码、操作 git、管理文件
- 💬 **聊天 ≠ 执行** — Agent 在 Discord 频道里「讨论」工作，但很少「完成」工作
- 🎯 **单一模型** — 所有 Agent 用同一个 OpenAI-compatible API，无法发挥不同模型的专长
- 🐳 **重基础设施** — Docker + 10 个 Discord Bot Token + React GUI = 部署门槛太高

</td>
<td width="50%">

### v4 时代：Claude Code Runtime

Claude Code 天生就是一个**执行型 Agent**——它不只是聊天，它能真正干活：编辑文件、运行测试、操作 git、调用 CLI。

**v4 的质变：**

- 🚀 **真正的编码能力** — 兵部（工程）现在能直接写代码、创建 PR、运行测试
- 🧠 **10 个模型协作** — Opus 做推理、Codex 做代码审查、Gemini 做长文本、6 个国产模型覆盖中文场景
- ⚡ **零基础设施** — 不需要 Docker、Discord Token、GUI 服务器。一个 `civagent run` 就够了
- 🔀 **真正的编排** — worktree 隔离、并行 subagent、结构化审查反馈——这些在 Discord 里做不到
- 🎭 **灵魂不变** — 57 个 regime 的 SOUL.md 和 IDENTITY.md 原封不动保留，治理智慧完整传承

</td>
</tr>
</table>

> **总结：OpenClaw 时代的 CivAgent 是一个「聊天模拟器」——Agent 们在频道里扮演角色讨论。Claude Code 时代的 CivAgent 是一个「执行引擎」——Agent 们按照治理模式的指令真正地编码、审查、部署、协作。**

---

## 🏗️ 架构

<p align="center">
  <img src="./images/architecture-v4.svg" alt="CivAgent v4 Architecture" width="100%" />
</p>

```
civagent switch china/tang
     │
     ├── 读取 regimes/china/tang/{metadata.json, IDENTITY.md, SOUL.md}
     ├── 生成 ~/.civagent/agents.json    (CC --agents 格式)
     └── 生成 ~/.civagent/CLAUDE.md      (系统提示词)

civagent run "重构这个模块"
     │
     └── claude --agents agents.json --system-prompt-file CLAUDE.md
              │
              ├── 司礼监 (Sonnet)        ← 总管调度
              ├── 兵部   (Opus/Codex)    ← 编码开发
              ├── 都察院 (Codex review)  ← 代码审查
              ├── 户部   (cn:qwen)       ← 数据/SQL
              ├── 翰林院 (Gemini)        ← 研究文档
              ├── 工部   (Sonnet+Bash)   ← 运维部署
              ├── 礼部   (cn:doubao)     ← 内容创作
              ├── 刑部   (Sonnet)        ← 法务合规
              └── 吏部   (Sonnet)        ← 项目管理
```

---

## ⚖️ 6 种编排模式

每种编排模式对应真实的历史治理智慧，在 Claude Code 中有对应的执行策略：

| 模式 | 历史原型 | CC 实现 | 适用场景 |
|------|---------|---------|---------|
| 🐉 **centralized**<br>中央集权 | 秦朝、元朝、拿破仑 | 单 Agent 直接执行，无审查 | 紧急修复、简单任务 |
| ⚖️ **checks-balances**<br>三权制衡 | 唐朝、威尼斯、美国 | 起草(Opus) → 审查(Codex) → 执行<br>驳回带结构化反馈，最多3轮 | 需要质量保证的代码 |
| 🔄 **dual-track**<br>双轨验证 | 明朝、斯巴达、辽 | 两条独立链(Opus+Codex)并行处理<br>比对结果，分歧则上报 | 安全关键代码 |
| 🌐 **federation**<br>联邦自治 | 周朝、神圣罗马、波斯 | 各 Agent 在独立 worktree 中工作<br>Coordinator 只负责合并 | 大型并行任务 |
| 🗳️ **democratic**<br>民主表决 | 雅典、蒙古、维京 | Opus+Codex+Gemini 并行生成<br>多数表决，平局则辩论重投 | 困难问题、需要多视角 |
| 👑 **theocratic**<br>神权独裁 | 商朝、古埃及 | 单一最强模型(Opus max effort)<br>零开销直接执行 | 紧急事件、简单问答 |

```bash
# 默认使用 regime 自带的编排模式
civagent run "设计数据库 schema"

# 强制指定编排模式
civagent run --mode democratic "这个 bug 应该怎么修？"
civagent run --mode dual-track "重构认证模块"
```

---

## 🧠 10 模型协作

CivAgent v4 的核心突破：**让不同模型做它们最擅长的事。**

| 角色 | 首选模型 | 备选模型 | 为什么 |
|------|---------|---------|--------|
| 🎯 调度 | **Sonnet** | — | 快速路由，成本低 |
| 💻 编码 | **Opus** | **Codex** (GPT-5.4) | 最强代码质量 |
| 🔍 审查 | **Opus** | **Codex** adversarial | 交叉审查消除盲点 |
| 📚 研究 | **Opus** | **Gemini** (1M 上下文) | 长文本深度分析 |
| 📊 数据/SQL | Sonnet | **cn:qwen** (阿里通义) | 阿里生态原生 |
| 📖 长文档 | Sonnet | **cn:kimi** (128K) | 超长上下文 |
| 🔢 数学 | Sonnet | **cn:stepfun** | 数学逻辑专长 |
| ✍️ 中文内容 | Sonnet | **cn:doubao** (字节) | 通用中文编码 |
| ⚡ 高速 | Sonnet | **cn:minimax** | 最低延迟 |
| 🧪 推理 | Sonnet | **cn:glm** (智谱) | 中文深度理解 |

---

## 🚀 快速开始

### 1. 检查工具

```bash
civagent setup
```

```
CivAgent v4 Tool Check

  ✓ Claude Code    2.1.98 (Claude Code)
  ✓ Codex CLI      codex-cli 0.118.0
  ✓ Gemini CLI     available

  CN Model Backends:
    ✓ cc-doubao
    ✓ cc-qwen
    ✓ cc-kimi
    ✓ cc-glm
    ✓ cc-stepfun
    ✓ cc-minimax

  ✓ Node.js        v25.9.0
```

### 2. 选择文明

```bash
civagent list        # 浏览 57 种文明
civagent info china/tang  # 查看唐朝详情
civagent switch china/tang  # 切换到唐朝
```

### 3. 启动

```bash
civagent run                              # 交互模式
civagent run "帮我重构这段代码"            # 单次任务
civagent run --mode democratic "设计 API"  # 指定编排模式
```

---

## 🌏 57 种文明

### 🐉 中华朝代 (20)

| 朝代 | 制度 | 编排模式 | Agent 数 |
|------|------|---------|---------|
| 夏 | 禅让制→世袭制 | theocratic | 5 |
| 商 | 神权政治 | theocratic | 6 |
| 周 | 分封制 | federation | 8 |
| 秦 | 三公九卿 | centralized | 7 |
| 汉 | 三公九卿（改良） | centralized | 8 |
| 三国 | 军事割据 | federation | 6 |
| 晋 | 九品中正 | centralized | 6 |
| 南北朝 | 门阀政治 | federation | 7 |
| 隋 | 三省六部（初创） | checks-balances | 7 |
| **唐** | **三省六部（完善）** | **checks-balances** | **7** |
| 五代 | 军阀轮替 | centralized | 5 |
| 宋 | 二府三司 | checks-balances | 8 |
| 辽 | 南北面官 | dual-track | 7 |
| 西夏 | 蕃汉并行 | dual-track | 6 |
| 金 | 猛安谋克 | federation | 6 |
| 元 | 一省制 | centralized | 7 |
| **明** | **内阁+司礼监** | **dual-track** | **8** |
| 清 | 军机处 | centralized | 8 |
| 太平天国 | 天朝田亩制 | theocratic | 6 |
| 中华民国 | 五权宪法 | checks-balances | 8 |

### 🌍 世界帝国 (37)

**Athens** · Sparta · Roman Republic · **Roman Empire** · Byzantine · **Persia** · Ottoman · **British** · French · Prussian · Russian · Habsburg · HRE · **US Federal** · **Venice** · Sumer · Egypt · Carthage · Maurya · Khmer · **Mongol** · Safavid · Caliphate · Aztec · Inca · Shogunate · Meiji · Joseon · Mali · Zulu · Mughal · Soviet · EU · Napoleon · Polo · **Swiss** · **Viking**

每种文明包含 5 个配置文件：
- `metadata.json` — 机器可读的元数据（模式、Agent 数、标签）
- `IDENTITY.md` — 组织架构图、角色映射表、模型分配策略
- `SOUL.md` — 行为准则、语言风格、交互规范、禁忌
- `openclaw.json.template` — 遗留 OpenClaw 配置（保留作参考）
- `README.md` — 历史背景与设计原理

---

## 📁 项目结构

```
civagent-v4/
├── bin/
│   └── civagent              # CLI 入口：list/switch/run/setup/modes/agents
├── engine/
│   ├── regime-to-cc.mjs      # 核心：regime 配置 → CC --agents JSON
│   ├── modes/                 # 6 种编排模式定义
│   │   ├── centralized.md     #   秦/元 — 中央集权
│   │   ├── checks-balances.md #   唐/威尼斯 — 三权制衡
│   │   ├── dual-track.md      #   明/斯巴达 — 双轨验证
│   │   ├── federation.md      #   周/波斯 — 联邦自治
│   │   ├── democratic.md      #   雅典/蒙古 — 民主表决
│   │   └── theocratic.md      #   商/埃及 — 神权独裁
│   └── models/
│       └── providers.json     # 10 模型路由配置
├── regimes/
│   ├── _template/             # 新文明脚手架
│   ├── china/ (20)            # 中华朝代
│   └── global/ (37)           # 世界帝国
├── CREDITS.md                 # 致谢
├── CHANGELOG.md               # 版本记录
└── LICENSE
```

---

## 🙏 致谢

> **本项目基于 [@wanikua](https://github.com/wanikua)（菠萝菠菠）的 [AI 朝廷](https://github.com/wanikua/danghuangshang) 项目。**

没有 wanikua 的原始创意——把中国古代官制映射到 AI 多 Agent 协作——就不会有这个项目。原始的唐朝三省六部制配置完整保留在 `regimes/china/tang/`，未做任何修改。

v4 的 Claude Code 插件架构受 [openai/codex-plugin-cc](https://github.com/openai/codex-plugin-cc) 启发。

详见 [CREDITS.md](./CREDITS.md)。

---

<div align="center">

**CivAgent v4** — *历史不只是关于过去，它是组织智慧的活化石。*

`civagent switch china/tang && civagent run`

</div>
