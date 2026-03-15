[English Version](./README_EN.md) | [🏢 企业版 Become CEO (English)](https://github.com/wanikua/become-ceo) | [📚 完整文档](./docs/README.md)

<!-- SEO 关键词 / Keywords：三省六部、明朝、六部制、中书省、门下省、尚书省、司礼监、内阁、都察院、翰林院、兵部、户部、礼部、工部、刑部、吏部、AI朝廷、AI Agent、多Agent协作、人工智能管理、古代治国、现代管理、组织架构、OpenClaw、multi-agent、ancient-china -->

<p align="center">
  <img src="./images/boluobobo-mascot.png" alt="菠萝菠菠 mascot" width="120" />
</p>

# 🏛️ 三省六部 ✖️ OpenClaw

### 一行命令起王朝，三省六部皆AI。千里之外调百官，万事不劳御驾亲。

> **以明朝六部制为蓝本，用 [OpenClaw](https://github.com/openclaw/openclaw) 框架构建的多 Agent 协作系统。**
> 一台服务器 + OpenClaw = 一支 7×24 在线的 AI 朝廷。

<p align="center">
  <img src="https://img.shields.io/badge/架构灵感-三省六部制-gold?style=for-the-badge" />
  <img src="https://img.shields.io/badge/框架-OpenClaw-blue?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Agent数-14-green?style=for-the-badge" />
  <img src="https://img.shields.io/badge/OpenClaw_Skill生态-60+-orange?style=for-the-badge" />
  <img src="https://img.shields.io/badge/部署-5分钟-red?style=for-the-badge" />
</p>

<div align="center">

### 👑 一键当皇帝

```bash
bash <(curl -fsSL https://raw.githubusercontent.com/wanikua/danghuangshang/main/install.sh)
```

**一行命令，5 分钟，你就是皇上。** [→ 快速开始](#快速开始三步登基)

🏥 **安装遇到问题？** `bash <(curl -fsSL https://raw.githubusercontent.com/wanikua/danghuangshang/main/doctor.sh)` — [诊断工具文档](./docs/doctor.md)

🤖 **不想看文档？** 把 [这段 Prompt](./docs/install-prompt.md) 丢给你的 AI 助手（Claude / ChatGPT / DeepSeek），让它一步步带你装。

</div>

<p align="center">
  <img src="./images/flow-architecture.png" alt="系统架构流程图" width="80%" />
</p>

<p align="center">
  <img src="./images/discord-architecture.png" alt="Discord 朝廷架构图" width="80%" />
</p>

---

## 目录

| 章节 | 说明 |
|------|------|
| 📜 [这个项目是什么？](#这个项目是什么) | 项目介绍、设计理念、核心能力 |
| 🆚 [为什么选这套方案？](#为什么选这套方案) | 与 ChatGPT / AutoGPT / CrewAI 对比 |
| 🏗️ [技术架构](#技术架构) | 三省六部映射、架构图 |
| 🎬 [效果展示](#效果展示) | Discord / 飞书 对话示例 |
| 🚀 [**快速开始**](#快速开始三步登基) | **← 从这里开始安装** |
| 🍍 [实战案例：菠萝王朝](#实战案例菠萝王朝) | 14 Agent 真实运行架构 |
| 🏛️ [朝廷架构详解](#朝廷架构三省六部制) | 历史背景、角色对照、多模型混搭 |
| 📝 [翰林院 — AI 小说创作](#翰林院--ai-小说创作) | 5 Agent 协作写小说，自动写作+审核+归档 |
| ⚙️ [核心能力详解](#核心能力) | 协作、记忆、Skill、Cron、沙箱 |
| 🖥️ [GUI 管理界面](#gui-管理界面) | Web Dashboard + Discord + Notion |
| ❓ [常见问题](#常见问题) | 基础 + 技术 FAQ |
| 🏢 [企业版 Become CEO](#企业版become-ceo) | 同架构的英文企业版 |
| 🔗 [相关链接 & 社区](#加入朝会) | 小红书、公众号、微信群 |

---

## 这个项目是什么？

**AI 朝廷**是一个开箱即用的多 AI Agent 协作系统。你是皇帝，AI 是你的大臣——每位大臣各司其职：写代码的、管财务的、搞营销的、做运维的——你只需要在 Discord 或飞书里下一道「圣旨」（@某个 Agent），大臣们就会立刻执行。

古代三省六部制运行超过 1300 年，是人类历史上最久经考验的组织架构之一。它的核心设计——**职责分明、流程标准化、权力制衡、档案留存**——完美映射到现代多 Agent 系统。**古代治国的智慧，就是管理 AI 团队的最佳实践。**

### 核心能力

| 能力 | 描述 |
|------|------|
| **多 Agent 协作** | 14+ 独立 AI Agent（六部 + 司礼监 + 内阁 + 都察院 + 翰林院 + 辅助机构），各有专长，协同工作 |
| **独立记忆** | 每个 Agent 有独立工作区和 memory 文件，越用越懂你 |
| **60+ Skill 生态** | GitHub、Notion、浏览器、Cron、TTS 等开箱即用 |
| **自动化任务** | Cron 定时任务 + 心跳自检，7×24 无人值守 |
| **多平台支持** | Discord / 飞书 / Slack / Telegram / 纯 WebUI |
| **沙箱隔离** | Docker 容器隔离，Agent 代码执行互不干扰 |
| **Web 管理后台** | React + TypeScript 构建的 Dashboard，可视化管理 |
| **OpenClaw 生态** | 基于 [OpenClaw](https://github.com/openclaw/openclaw) 框架，可使用 [OpenClaw Hub](https://github.com/openclaw/openclaw) 的 Skill 生态 |

> 📖 **深入了解** → [架构详解](./docs/architecture.md) | [与 ChatGPT/AutoGPT/CrewAI 对比](./docs/architecture.md)

### 想要企业版？

如果你更熟悉现代企业管理概念，我们有**英文企业版**：

👉 **[Become CEO](https://github.com/wanikua/become-ceo)** — 同一套架构，用 CEO / CTO / CFO / CMO 等企业角色代替朝廷六部

| 朝廷角色 | 企业角色 | 职责 |
|:---:|:---:|:---:|
| 皇帝 | CEO | 最高决策者 |
| 司礼监 | COO / 首席运营官 | 日常调度、任务分配 |
| 内阁 | CSO / 战略VP | 战略决策、方案审议 |
| 都察院 | QA VP / 审计总监 | 监察审计、代码审查、质量把控 |
| 兵部 | CTO / 工程VP | 软件工程、技术架构 |
| 户部 | CFO / 财务VP | 财务分析、成本管控 |
| 礼部 | CMO / 营销VP | 品牌营销、内容策划 |
| 工部 | VP Infra / SRE | DevOps、基础设施 |
| 吏部 | VP Product / PMO | 项目管理、团队协调 |
| 刑部 | General Counsel | 法务合规、合同审查 |
| 翰林院 | 首席知识官 CKO | 学术研究、文档撰写、技术调研 |

> 💡 两个项目基于相同的 [OpenClaw](https://github.com/openclaw/openclaw) 框架，架构完全一致，只是角色命名和文化背景不同。选你喜欢的风格即可！

---

## 为什么选这套方案？

| | ChatGPT 等网页版 | AutoGPT / CrewAI / MetaGPT | **AI 朝廷（本方案）** |
|---|---|---|---|
| 多 Agent 协作 | ❌ 单个通才 | ✅ 需写 Python 编排 | ✅ 配置文件搞定，零代码 |
| 独立记忆 | ⚠️ 单一通用记忆 | ⚠️ 需自己接向量库 | ✅ 每个 Agent 独立工作区 + memory 文件 |
| 工具集成 | ⚠️ 有限插件 | ⚠️ 需自己开发 | ✅ 60+ 内置 Skill（GitHub / Notion / 浏览器 / Cron …） |
| 界面 | 网页 | 命令行 / 自建 UI | ✅ Discord 原生（手机电脑都能用） |
| 部署难度 | 无需部署 | 需 Docker + 编码 | ✅ 一键脚本，5 分钟跑起来 |
| 24h 在线 | ❌ 需手动对话 | ✅ | ✅ 定时任务 + 心跳自检 |
| 组织架构隐喻 | 无 | 无 | **三省六部制，职责分明** |
| 框架生态 | 封闭 | 自建 | ✅ OpenClaw Hub Skill 生态 |

**核心优势：不是框架，是成品。** 跑个脚本就能用，在 Discord 里 @谁谁回复。

---

<a id="技术架构"></a>
<details>
<summary><h2>🏗️ 技术架构</h2></summary>

```
                          ┌─────────────────────┐
                          │      皇帝（你）      │
                          │  Discord / Web UI    │
                          └──────────┬──────────┘
                                     │ 圣旨（@mention / DM）
                                     ▼
                      ┌──────────────────────────────┐
                      │      OpenClaw Gateway         │
                      │      Node.js 守护进程          │
                      │                              │
                      │  ┌─────────────────────────┐ │
                      │  │ 消息路由 (Bindings)       │ │
                      │  │ channel + accountId      │ │
                      │  │ → agentId 匹配 → 分发    │ │
                      │  │ 会话隔离 · Cron · 心跳    │ │
                      │  └─────────────────────────┘ │
                      └──┬───┬───┬───┬───┬───┬───┬───┘
                         │   │   │   │   │   │   │
           ┌─────────────┘   │   │   │   │   │   └─────────────┐
           ▼           ▼     ▼   ▼   ▼   ▼   ▼                ▼
     ┌──────────┐  ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐  ┌──────────┐
     │ 司礼监   │  │兵部│ │户部│ │吏部│ │礼部│ │工部│  │  刑部    │
     │ 总管调度 │  │编码│ │财务│ │管理│ │营销│ │运维│  │  法务    │
     │ (main)   │  │    │ │    │ │    │ │    │ │    │  │          │
     └──────────┘  └────┘ └────┘ └────┘ └────┘ └────┘  └──────────┘
           │          │      │      │      │      │          │
           ▼          ▼      ▼      ▼      ▼      ▼          ▼
     ┌───────────────────────────────────────────────────────────┐
     │                Skill 工具层（60+ 内置）                    │
     │  GitHub · Notion · 浏览器 · Cron · TTS · 截图             │
     │  sessions_spawn（跨 Agent 派活）                           │
     │  sessions_send（跨 Agent 通信）                            │
     │  OpenClaw Hub 社区扩展 Skill                              │
     └───────────────────────────────────────────────────────────┘
```

每个 Agent 绑定一个 Discord Bot 账号，由同一个 Gateway 进程统一管理：
- **独立会话**：每个 Agent 有独立的会话存储（`~/.openclaw/agents/<agentId>/sessions`），互不干扰
- **独立模型**：重活用强力模型，轻活用快速模型，省钱又高效
- **独立沙箱**：可配置 Docker 沙箱隔离，每个 Agent 独立容器
- **身份注入**：Gateway 自动将 SOUL.md + IDENTITY.md + 工作区文件组装为系统提示
- **消息路由**：通过 `bindings` 配置将 `(channel, accountId)` 映射到 `agentId`，最具体的匹配优先

</details>

---

## 效果展示

### Discord 模式 — 频道内公开派活

```
👑 皇帝：@司礼监 帮朕写个用户登录 API，再查一下这个月花了多少钱

🏛️ 司礼监：遵旨！臣安排各部：
  → @兵部 编写用户登录 REST API（Node.js + Express），完成后提交 GitHub
  → @户部 统计本月 API 支出明细，给出优化建议

🏛️ 兵部：臣领旨。
  📁 已创建 auth-api/ 项目结构
  ✅ POST /api/login — JWT 认证
  ✅ POST /api/register — 用户注册
  ✅ 已提交至 GitHub：wanikua/auth-api#1
  臣已完工，请陛下御览。

🏛️ 户部：臣领旨。本月 API 总计 $23.47
  ├── 兵部（强力模型）：$15.20
  ├── 礼部（快速模型）：$3.80
  └── 其他：$4.47  📊 环比 -12%
  建议：兵部可优化 Prompt 长度，预计再省 15%。
```

> 💡 Discord 模式下，司礼监在频道里 @各部门派活，各部门独立回复，全过程公开可见。

### 飞书模式 — 司礼监后台调度

```
👤 你：帮我写个用户登录 API，再查一下这个月花了多少钱

🏛️ 司礼监：遵旨，臣已在后台安排兵部和户部处理。

  ……（兵部、户部在后台执行，用户无感）

🏛️ 司礼监：陛下，两项任务均已办妥：

  📌 兵部完成编码：
  ✅ auth-api/ 已创建，含登录 + 注册接口
  ✅ 已提交 GitHub：wanikua/auth-api#1

  📌 户部财务报告：
  💰 本月 API 总计 $23.47，环比 -12%
  建议优化兵部 Prompt 长度，预计再省 15%。
```

> 💡 飞书模式下，用户只和司礼监对话，司礼监通过 `sessions_spawn` 后台派活，汇总结果后统一回复。

---

<a id="实战案例菠萝王朝"></a>

> 以下是基于本项目搭建的**真实运行中的 AI 朝廷**——菠萝王朝，展示 14 个 Agent 协同运作的完整架构。

<a id="快速开始三步登基"></a>

> 🔴 **新手请用云服务器**，不要在个人电脑上安装。详见 [安全须知](./docs/security.md)。

### 📍 第零步：已安装 OpenClaw？

> 已经在跑 OpenClaw 的老用户，不需要重新安装，用精简版脚本直接初始化朝廷工作区和配置模板：
> ```bash
> bash <(curl -fsSL https://raw.githubusercontent.com/wanikua/danghuangshang/main/install-lite.sh)
> ```
> 跑完后跳到第三步填 Key 即可。**新用户请忽略，从第一步开始。**

### 📍 第一步：有服务器吗？

| 情况 | 操作 |
|------|------|
| ✅ 已有 Linux 服务器 | 直接进入第二步 |
| ✅ 已有 Mac | 直接进入第二步 |
| ❌ 没有服务器 | → [**领一台云服务器**](./docs/server-setup.md)（Oracle Cloud / 阿里云 / 腾讯云 / AWS 均可） |

### 📍 第二步：选平台

```
                           ┌──────────────────────┐
                           │    菠萝皇帝（你）     │
                           │   Discord + 多端推送   │
                           └──────────┬───────────┘
                                      │
                 ┌────────────────────┼────────────────────┐
                 ▼                    ▼                    ▼
        ┌────────────────┐  ┌────────────────┐  ┌────────────────┐
        │   司礼监        │  │   内阁首辅      │  │   都察院        │
        │  大内总管       │  │  战略谋划       │  │  左都御史       │
        │  批红·调度·统领 │  │  票拟·直谏     │  │  纠劾·审查·质控 │
        └───────┬────────┘  └────────────────┘  └────────────────┘
                │
    ┌───────────┼───────────────────────────────────┐
    │           │           │           │           │
    ▼           ▼           ▼           ▼           ▼
┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐
│ 兵部   │ │ 户部   │ │ 礼部   │ │ 工部   │ │ 刑部   │ │ 吏部   │
│软件工程│ │财务预算│ │品牌营销│ │基础设施│ │法务合规│ │人事考核│
│架构部署│ │成本管控│ │社媒公关│ │DevOps │ │风控审查│ │团队管理│
└────────┘ └────────┘ └────────┘ └────────┘ └────────┘ └────────┘

    ┌───────────────────────────────────────────────┐
    │              🏛️ 辅助机构                       │
    ├────────┬────────┬────────┬────────┬────────────┤
    │ 国子监 │ 翰林院 │ 太医院 │ 内务府 │ 御膳房   │
    │教育培训 │文书起草 │健康管理 │日程后勤 │膳食推荐    │
    │知识管理 │论文研究 │营养规划 │起居安排 │食谱研究    │
    └────────┴────────┴────────┴────────┴────────────┘
```

### 菠萝王朝运作实况

**14 个 Agent，各有专属 Discord Bot，24/7 在线运转：**

| 机构 | Agent | 日常工作示例 |
|------|-------|-------------|
| 司礼监 | 大内总管 | 接收圣旨、分派任务、协调各部、Cron 调度 |
| 内阁 | 首辅大学士 | 商业战略分析、竞品研究、全局决策建议 |
| 都察院 | 左都御史 | 代码审查、质量把关、纠正各部错误 |
| 兵部 | 尚书 | 全栈开发、GitHub PR、系统架构、Bug 修复 |
| 户部 | 尚书 | 市场数据分析、API 成本追踪、财务报表 |
| 礼部 | 尚书 | 社媒运营、文案创作、品牌推广 |
| 工部 | 尚书 | 服务器运维、CI/CD、基础设施巡检 |
| 刑部 | 尚书 | 开源合规、知识产权维权、合同审查 |
| 吏部 | 尚书 | 项目管理、创业孵化、人事考核 |
| 国子监 | 祭酒 | 课程学习辅导、学习规划、知识整理 |
| 翰林院 | 学士 | 论文写作、读书笔记、技术文档 |
| 太医院 | 院使 | 健康提醒、饮食建议、运动计划 |
| 内务府 | 总管 | 日程管理、天气查询、出行提醒 |
| 御膳房 | 总管 | 美食推荐、食谱研究、外卖选择 |

### 自动化 Cron 任务（实际运行中）

```bash
# 1️⃣ 一键安装（Linux 示例，其他路径见对应文档）
bash <(curl -fsSL https://raw.githubusercontent.com/wanikua/danghuangshang/main/install.sh)

### Notion 史记式知识库

菠萝王朝使用 Notion 作为「国史馆」，完整存档所有决策和数据：

```
🏯 菠萝王朝
├── 本纪（时间线）
│   ├── 起居注（日报）    ← 每日自动写入
│   ├── 朔望录（周报）    ← 每周自动汇总
│   ├── 编年纪（月报）    ← 每月自动总结
│   └── 大事记            ← 里程碑事件
├── 表（数据看板）
│   ├── 食货表（财务）    ← 户部管理
│   ├── 舆情表（社媒）    ← 礼部管理
│   ├── 臣工表（人脉）    ← 吏部管理
│   └── 器用表（工具）    ← 工部管理
├── 志（知识库）
│   ├── 天工志（技术）    ← 兵部/工部
│   ├── 宣化志（运营）    ← 礼部
│   ├── 经籍志（学业）    ← 国子监
│   └── 典章志（SOP）     ← 各部流程
└── 列传（项目档案）
    └── 11个项目独立档案  ← 全生命周期管理
```

> 💡 **这不是 demo，是每天在用的生产系统。** 菠萝王朝已稳定运行数周，处理过数百个实际任务——从代码开发到内容运营，从数据分析到项目管理。

> 📖 **完整案例** → [菠萝王朝详解](./docs/pineapple-dynasty.md)

---

<a id="朝廷架构三省六部制"></a>

## 朝廷架构——三省六部制

### 历史背景

三省六部制是中国古代的中央官制体系：
- **中书省**：起草诏令（= 接收用户指令、生成计划）
- **门下省**：审核驳回（= 消息路由、权限校验）
- **尚书省**：执行落实（= Skill 工具层、实际执行）

尚书省下设**六部**，各管一摊。在本项目中，OpenClaw Gateway 扮演三省的角色，六个 AI Agent 对应六部：

| 部门 | 古代职责 | AI 职责 | 推荐模型 | 典型场景 |
|------|----------|---------|----------|----------|
| **司礼监** | 皇帝近侍、批红 | 总管调度 | 快速模型 | 日常对话、任务分配、自动汇报 |
| **兵部** | 军事武备 | 软件工程 | 强力模型 | 写代码、架构设计、代码审查、Bug 调试 |
| **户部** | 户籍财税 | 财务运营 | 强力模型 | 成本分析、预算管控、电商运营 |
| **礼部** | 礼仪外交 | 品牌营销 | 快速模型 | 文案创作、社媒运营、内容策划 |
| **工部** | 工程营造 | 运维部署 | 快速模型 | DevOps、CI/CD、服务器管理 |
| **吏部** | 官员选拔 | 项目管理 | 快速模型 | 创业孵化、任务追踪、团队协调 |
| **刑部** | 司法刑狱 | 法务合规 | 快速模型 | 合同审查、知识产权、合规检查 |

> 💡 **模型分层策略**：不同部门按需分配模型，重活用贵的、轻活用便宜的，能省 5 倍成本：
>
> | 层级 | 适用部门 | 推荐模型举例 | 特点 |
> |------|----------|-------------|------|
> | **强力模型** | 兵部（编码）、户部（分析） | Claude Sonnet 4.5、GPT-4o | 推理强，适合复杂任务 |
> | **快速模型** | 司礼监、礼部、工部、吏部、刑部 | Claude Haiku、GPT-4o-mini、DeepSeek V3 | 响应快、成本低 |
> | **经济模型** | 都察院（审查）、翰林院·检讨 | DeepSeek V3、Qwen | 极低成本，适合批量审核 |
>
> 在 `openclaw.json` 的 `models.providers` 中可接入多家服务商（Anthropic、OpenAI、DeepSeek、Ollama 等），然后在各 Agent 的 `model.primary` 中指定 `provider名/模型id`。详见 [OpenClaw 模型配置文档](https://docs.openclaw.ai/concepts/models)。

---

## 翰林院 — AI 小说创作

翰林院是朝廷新增的**文学创作部门**，由 5 个 Agent 组成，专门负责 AI 小说创作的全流程：从需求拆解、架构设计、逐章写作、审核校对到归档管理。

### 翰林院架构

```
用户: "帮我写一部修仙小说"
  │
  └→ 掌院学士（接旨·总编排）
       │
       ├─ spawn 修撰 → 设计大纲 + 世界观 + 人物档案
       │    └─ spawn 庶吉士 → 检索参考素材
       │
       ├─ 掌院学士审批大纲 ✅
       │
       ├─ spawn 编修 → 按大纲逐章写作（每章 ≥ 10,000 字）
       │    ├─ spawn 庶吉士 → 查前文确保一致
       │    └─ 写完一章 → 归档到 novel/{书名}/
       │
       ├─ spawn 检讨 → 审核该章（7 维度 + 三级问题分级）
       │    └─ 发现问题 → 上报掌院学士
       │
       ├─ 掌院学士决策：退回编修修改 or 通过
       │
       └─ 循环直到全书完成 → 掌院学士全书终审
```

### 翰林院角色表

| Agent ID | 角色 | 品级 | 模型 | 职责 |
|----------|------|------|------|------|
| `hanlin_zhang` | 掌院学士 | 从二品 | strong | 总编排：接需求、拆任务、协调全院、全书终审 |
| `hanlin_xiuzhuan` | 修撰 | 从六品 | strong | 架构师：大纲、世界观、人物档案、多线叙事规划 |
| `hanlin_bianxiu` | 编修 | 正七品 | strong | 执笔者：逐章写作、分段创作法、归档 |
| `hanlin_jiantao` | 检讨 | 从七品 | fast | 审核官：文笔/逻辑/一致性审核，三级问题上报 |
| `hanlin_shujishi` | 庶吉士 | 无品 | fast | 检索员：搜索前文、查阅参考库、外部资料检索 |

### Spawn 权限链

- **司礼监** → 掌院学士
- **掌院学士** → 修撰、编修、检讨、庶吉士
- **修撰** → 庶吉士
- **编修** → 庶吉士
- **检讨、庶吉士** → 不可 spawn

### 翰林院专属 Skill

| Skill | 说明 | 使用者 |
|-------|------|--------|
| `novel-worldbuilding` | 小说架构设计：大纲、人物档案、世界观模板 | 修撰 |
| `novel-prose` | 小说写作技法：分段写作法、叙事规范、字数纪律 | 编修 |
| `novel-review` | 小说审核标准：7 维度评估、三级问题分级、报告模板 | 检讨、掌院学士 |
| `novel-archiving` | 章节归档：摘要生成、记忆更新、状态报告 | 编修 |
| `novel-research` | 深度调研：真实细节检索、逻辑推演、风格参考 | 庶吉士 |
| `novel-memory` | 记忆系统操作指南：基于文件的记忆管理，可通过 OpenViking 插件增强 | 全员 |

### OpenViking 增强（可选插件）

翰林院的小说记忆系统默认使用基于文件的记忆管理。如需更强大的持久化记忆能力，可安装 [OpenViking](https://github.com/openviking) 可选插件：

```bash
openclaw plugins install ./extensions/novel-openviking
```

安装后，OpenViking 作为 MCP server 提供三维记忆增强：

| OpenViking 模块 | 功能 | 使用场景 |
|----------------|------|---------|
| Memories | 静态知识 + 动态日志 | 章节摘要、角色状态、伏笔追踪 |
| Resources | 参考素材库 | 参考小说库、风格范本 |
| Skills | 结构化知识图谱 | 人物关系、世界设定 |

> 💡 OpenViking 是可选增强，不安装也能正常使用翰林院的小说创作功能。`skills/novel-memory/` 中提供详细的使用指南。

---

## 核心能力

### 多 Agent 协作
每个部门是独立 Bot，@谁谁回复，@everyone 全员响应。大任务自动新建 Thread 保持频道整洁。
> ⚠️ 想让 Bot 之间互相触发（如成语接龙、多 Bot 讨论），需在 `openclaw.json` 的 `channels.discord` 中加上 `"allowBots": true`。不加的话 Bot 默认忽略其他 Bot 的消息。同时每个 account 都要设置 `"groupPolicy": "open"`，否则群聊消息会被静默丢弃。

### 独立记忆系统
每个 Agent 有独立的工作区和 `memory/` 目录。对话积累的项目知识会持久化到文件，跨会话保留。Agent 越用越懂你的项目。

### 60+ 内置 Skill（基于 OpenClaw 生态）
不只是聊天——内置的工具覆盖开发全流程，且可通过 [OpenClaw Hub](https://github.com/openclaw/openclaw) 扩展更多 Skill：

| 类别 | Skill |
|------|-------|
| 开发 | GitHub（Issue/PR/CI）、Coding Agent（代码生成与重构） |
| 文档 | Notion（数据库/页面/自动汇报） |
| 信息 | 浏览器自动化、Web 搜索、Web 抓取 |
| 自动化 | Cron 定时任务、心跳自检 |
| 媒体 | TTS 语音、截图、视频帧提取 |
| 运维 | tmux 远程控制、Shell 命令执行 |
| 通信 | Discord、Slack、飞书（Lark）、Telegram、WhatsApp、Signal… |
| 扩展 | OpenClaw Hub 社区 Skill、自定义 Skill |

### 定时任务（Cron）
内置 Cron 调度器，让 Agent 定时自动执行：
- 每天自动写日报，发到 Discord + 存到 Notion
- 每周汇总周报
- 定时健康检查、代码备份
- 自定义任意定时任务

### 好友协作
邀请朋友进 Discord 服务器，所有人都能 @各部门 Bot 下达指令。互不干扰，结果大家都能看到。

### 沙箱隔离
Agent 可以运行在 Docker 沙箱中，代码执行互不干扰。支持配置网络、文件系统、环境变量的隔离级别。

---

<a id="gui-管理界面"></a>
<details>
<summary><h2>🖥️ GUI 管理界面</h2></summary>

除了 Discord 命令行交互，AI 朝廷还提供多种图形界面（GUI）管理方式：

### Web 管理后台（菠萝王朝 Dashboard）

本项目内置了一套 Web 管理后台（`gui/` 目录），基于 React + TypeScript + Vite 构建：

<p align="center">
  <img src="./images/gui-court.png" alt="朝堂总览 — 各部门状态一目了然" width="90%" />
  <br/>
  <em>朝堂总览 — 御座、六部、诸院，在线状态一目了然</em>
</p>

<p align="center">
  <img src="./images/gui-sessions.png" alt="会话管理 — Token 消耗、消息统计" width="90%" />
  <br/>
  <em>会话管理 — 88 个会话、9008 条消息、87.34M Token 消耗实时追踪</em>
</p>

功能包括：
- **仪表盘**：实时查看各部门状态、Token 消耗、系统负载
- **朝堂**：直接在 Web 端与各部门 Bot 对话
- **会话管理**：查看所有历史会话、消息详情、Token 统计
- **定时任务**：可视化管理 Cron 任务（启用/禁用/手动触发）
- **Token 统计**：按部门、按日期的 Token 消耗分析
- **系统健康**：CPU/内存/磁盘监控、Gateway 状态

**启动方式：**
```bash
# 1. 先 clone 教程仓库（如果还没有）
git clone https://github.com/wanikua/danghuangshang.git
cd danghuangshang

# 2. 构建前端
cd gui && npm install && npm run build

# 3. 安装后端依赖并启动（设置登录密码）
cd server && npm install
BOLUO_AUTH_TOKEN=你的密码 node index.js
```

> ⚠️ **登录密码说明**：启动后端时通过环境变量 `BOLUO_AUTH_TOKEN` 设置登录密码。打开页面后用这个密码登录。如果不想要密码验证，需要修改 `server/index.js` 中的 `authMiddleware`。

访问地址：`http://你的服务器IP:18795`

> 💡 生产环境建议通过 Nginx 反向代理 + HTTPS 访问，不要直接暴露端口。长期运行建议用 `pm2` 或 `screen`：`BOLUO_AUTH_TOKEN=你的密码 pm2 start server/index.js --name boluo-gui`

### Discord 作为 GUI

Discord 本身就是最佳的 GUI 管理界面：
- **手机 + 电脑**同步，随时随地管理
- **频道分类**天然对应各部门（兵部、户部、礼部…）
- **消息历史**永久保存，自带搜索
- **权限管理**精细控制谁能看什么、谁能操作什么
- **@mention** 即可调用任意 Agent，零学习成本

### Notion 作为数据可视化补充

通过 OpenClaw 的 Notion Skill 集成，朝廷的数据可以自动同步到 Notion：
- **起居注（日报）**、**朔望录（周报）**自动生成
- **食货表（财务）**自动记录 API 消耗
- **列传（项目）**追踪各项目进展
- Notion 的看板、日历、表格视图提供丰富的数据可视化

> 💡 三层 GUI 配合使用：**Web Dashboard** 看系统状态 → **Discord** 下达指令 → **Notion** 查看报表和历史数据。

</details>

---

<details>
<summary><h2>📖 详细教程</h2></summary>

基础篇（服务器申请→安装→配置→跑起来）和进阶篇（tmux、GitHub、Notion、Cron、Discord、Prompt 技巧）见小红书系列笔记。

</details>

---

<details>
<summary><h2>📱 接入飞书（Feishu/Lark）</h2></summary>

除了 Discord，AI 朝廷也支持飞书作为交互界面。飞书插件已内置在新版 OpenClaw 中，无需额外安装。

### 第一步：创建飞书应用

1. 访问 [飞书开放平台](https://open.feishu.cn/app)，登录后点击 **创建企业自建应用**
2. 填写应用名称和描述，选择图标
3. 在 **凭证与基础信息** 页面，复制 **App ID**（格式 `cli_xxx`）和 **App Secret**

### 第二步：配置权限和能力

1. **添加权限**：进入 **权限管理**，点击 **批量导入**，粘贴以下内容：
```json
{
  "scopes": {
    "tenant": [
      "im:message", "im:message:send_as_bot", "im:message:readonly",
      "im:message.p2p_msg:readonly", "im:message.group_at_msg:readonly",
      "im:resource", "im:chat.members:bot_access",
      "im:chat.access_event.bot_p2p_chat:read"
    ]
  }
}
```

2. **开启机器人能力**：进入 **应用能力 > 机器人**，启用并设置机器人名称

3. **配置事件订阅**：进入 **事件订阅**，选择 **使用长连接接收事件（WebSocket）**，添加事件 `im.message.receive_v1`

> ⚠️ 配置事件订阅前，需要先完成下面第三步并启动 Gateway，否则长连接可能保存失败。

4. **发布应用**：在 **版本管理与发布** 中创建版本，提交审核发布

### 第三步：配置 OpenClaw

**方式一：命令行向导（推荐）**
```bash
openclaw channels add
# 选择 Feishu，输入 App ID 和 App Secret
```

**方式二：手动编辑配置文件**
```json5
{
  "channels": {
    "feishu": {
      "enabled": true,
      "dmPolicy": "pairing",
      "accounts": {
        "main": {
          "appId": "cli_xxx",
          "appSecret": "你的App Secret"
        }
      }
    }
  }
}
```

### 第四步：启动并测试

```bash
# 启动/重启 Gateway
openclaw gateway restart

# 在飞书里找到你的机器人，发一条消息
# 首次会收到配对码，执行以下命令批准：
openclaw pairing approve feishu <配对码>
```

批准后即可正常聊天。群聊中需要 @机器人 才会触发回复。

> 💡 飞书使用 WebSocket 长连接，**不需要公网IP或域名**，本地部署也能用。
>
> 📖 完整飞书文档：[docs.openclaw.ai/channels/feishu](https://docs.openclaw.ai/channels/feishu)

</details>

---

<details>
<summary><h2>📝 接入 Notion（自动归档）</h2></summary>

AI 朝廷可以通过 Notion Skill 自动写日报、归档数据、管理知识库。配置只需 3 步。

### 第一步：创建 Notion Integration

1. 访问 [Notion Integrations](https://www.notion.so/profile/integrations)
2. 点击 **New integration**（新建集成）
3. 填写名称（如「AI 朝廷」），选择关联的 Workspace
4. 创建后复制 **Internal Integration Secret**（格式 `ntn_xxx` 或 `secret_xxx`）

### 第二步：存储 API Key

```bash
# 创建配置目录并保存 Key
mkdir -p ~/.config/notion
echo "ntn_你的token" > ~/.config/notion/api_key
```

### 第三步：授权页面/数据库

这一步**很关键**，不做的话 API 会返回 404：

1. 打开你想让 AI 访问的 Notion 页面或数据库
2. 点击右上角 **`···`** → **Connect to**（连接到）
3. 选择你刚创建的 Integration 名称
4. 子页面会自动继承权限

> ⚠️ **每个要访问的顶级页面/数据库都需要手动授权一次**，Integration 不会自动获得整个 Workspace 的权限。

### 验证

```bash
# 测试 API 是否通了
NOTION_KEY=$(cat ~/.config/notion/api_key)
curl -s "https://api.notion.com/v1/users/me" \
  -H "Authorization: Bearer $NOTION_KEY" \
  -H "Notion-Version: 2025-09-03" | head -c 200
```

看到返回的 JSON 包含你的 Integration 名称就说明配置成功了。

### 使用示例

配好后就可以在 Discord 里让 Agent 操作 Notion：

```
@司礼监 把今天的工作总结写到 Notion 日报里
@户部 创建一个新的财务数据库，字段包含日期、收入、支出、备注
@礼部 把这周的社媒数据更新到 Notion 舆情表
```

> 💡 Notion 适合做**持久化存档**（日报/周报/知识库），Discord 适合做**实时交互**，两者配合效果最佳。
>
> 📖 Notion API 文档：[developers.notion.com](https://developers.notion.com)

</details>

---

<details>
<summary><h2>🏥 配置诊断（doctor.sh）</h2></summary>

遇到问题？跑一行命令自动检查配置：

```bash
bash <(curl -fsSL https://raw.githubusercontent.com/wanikua/danghuangshang/main/doctor.sh)
```

诊断内容包括：
- ✅ OpenClaw/Node.js 安装检查
- ✅ 配置文件格式和 API Key 检查
- ✅ Discord Bot Token、allowBots、groupPolicy 检查
- ✅ Agent 和 Binding 路由匹配检查
- ✅ 工作区文件（SOUL.md / USER.md / memory/）检查
- ✅ Notion 等可选集成检查
- ✅ **@everyone 不触发的完整排查清单**

### @everyone 不触发 Bot 回复？

这是最常见的问题，通常原因是 **Discord Developer Portal 的 Intent 没开**：

1. 打开 [Discord Developer Portal](https://discord.com/developers/applications)
2. 选择你的 Bot → 左侧 **Bot** 页面
3. 往下翻到 **Privileged Gateway Intents**，开启以下三项：
   - ✅ **Message Content Intent**（必须）
   - ✅ **Server Members Intent**（必须）
   - ✅ **Presence Intent**（可选）
4. **每个 Bot 都要开**，不是只开一个！
5. 确认服务器里每个 Bot 的角色有 **View Channels** 权限
6. 确认配置文件里 `channels.discord.groupPolicy` 和每个 account 的 `groupPolicy` 都是 `"open"`

> ⚠️ 改完 Intent 后需要**重启 Gateway**：`openclaw gateway restart` 或 `systemctl --user restart openclaw-gateway`

**Q: 能用其他模型吗？**
→ 能。OpenClaw 支持 Anthropic、OpenAI、Google Gemini 等主流服务商，也可接入其他兼容 OpenAI API 格式的服务商。在 `openclaw.json` 里改 model 配置就行。不同部门可以用不同模型。

**Q: 每月 API 费用大概多少？**
→ 看使用强度。轻度使用 $10-15/月，中度 $20-30/月。省钱技巧：重活用强力模型，轻活用快速模型（便宜约 5 倍），简单任务可接入经济模型进一步降本。

**Q: 和 Become CEO 项目有什么关系？**
→ [Become CEO](https://github.com/wanikua/become-ceo) 是本项目的英文企业版，使用相同的 OpenClaw 框架和架构，只是将朝廷角色换成了现代企业角色（CTO、CFO 等）。

**Q: @everyone 不触发回复？**
→ 每个 Bot 要开 Message Content Intent + Server Members Intent。详见 [诊断工具](./docs/doctor.md)。

**Q: Agent 报「只读文件系统」？**
→ sandbox mode 导致的。不跑代码的部门设 `"sandbox": { "mode": "off" }`。详见 [安全须知](./docs/security.md)。

<a id="常见问题"></a>

> 📖 **完整 FAQ** → [常见问题](./docs/faq.md)

---

<a id="企业版become-ceo"></a>

## 企业版：Become CEO

喜欢现代企业风格？同一架构，用 CEO/CTO/CFO 代替朝廷六部：

👉 **[Become CEO](https://github.com/wanikua/become-ceo)** — 同框架，企业角色，英文版

---

## 加入朝会

| 小红书「菠萝菠菠🍍」 | 公众号「菠言菠语」 | 微信群 |
|:---:|:---:|:---:|
| <a href="https://www.xiaohongshu.com/user/profile/5a169df34eacab2bc9a7a22d"><img src="./images/avatar-xiaohongshu.png" width="150" style="border-radius:50%"/></a> | <img src="./images/qr-wechat-official.jpg" width="150"/> | <img src="./images/qr-wechat-group.png" width="150"/> |
| [@菠萝菠菠🍍](https://www.xiaohongshu.com/user/profile/5a169df34eacab2bc9a7a22d) | 关注获取最新教程 | 群二维码过期请关注公众号 |

## 🤝 推荐

- 🎁 [MiniMax Coding Plan](https://platform.minimaxi.com/subscribe/coding-plan?code=CIeSxc2iq2&source=link) — 88折专属优惠 + Builder 权益

## 相关链接

- 🏢 [Become CEO — 企业版（English）](https://github.com/wanikua/become-ceo)
- 🎭 [AI 朝廷 Skill — 中文版](https://github.com/wanikua/ai-court-skill)
- 🔧 [OpenClaw 框架](https://github.com/openclaw/openclaw)
- 📖 [OpenClaw 官方文档](https://docs.openclaw.ai)
- 📚 [完整文档目录](./docs/README.md)

---

## ⚠️ 维权声明

本项目于 **2026年2月22日** 首发（[小红书推广帖更早于2月20日](https://www.xiaohongshu.com/discovery/item/6998638f000000000d0092fe?source=webshare)），是「三省六部制 × AI 多智能体」概念的原创项目。完整证据链见 [GitHub Issue](https://github.com/cft0808/edict/issues/55) | [维权文章](https://mp.weixin.qq.com/s/erVkoANrpZQFawMCNn6p9g)。欢迎 fork 和二次开发，请尊重开源精神，注明出处。

> 📕 小红书原创系列：[用AI当上皇帝的第3天](https://www.xiaohongshu.com/discovery/item/6998638f000000000d0092fe) | [赛博皇帝的日常](https://www.xiaohongshu.com/discovery/item/69a95dc3000000002801e886)

---

## 🛡️ 安全须知

> 详细配置见 [安全须知文档](./docs/security.md)

- 🔴 **不要在个人电脑上安装**——用云服务器，出问题随时重建
- 🔴 **workspace 设专用目录**（如 `/home/ubuntu/clawd`），不要设成家目录
- 🔴 **API Key 不要提交到公开仓库**

---

## 免责声明

本项目按"原样"提供，不承担任何直接或间接责任。AI 生成内容仅供参考，使用前请自行审核。涉及财务、安全敏感操作请务必人工复核。详见 [安全须知](./docs/security.md)。

---

## 🔄 已安装？一键更新

> 💡 放心跑，不会覆盖你的 SOUL.md、USER.md、IDENTITY.md 和 openclaw.json 等已有配置。

```bash
# 重跑安装脚本（自动保留你的配置）
bash <(curl -fsSL https://raw.githubusercontent.com/wanikua/danghuangshang/main/install.sh)

# Docker 用户
docker pull boluobobo/ai-court:latest && docker compose up -d

# 手动更新
npm update -g openclaw && systemctl --user restart openclaw-gateway
```

---

v3.5.2 | MIT License | [User Agreement](./docs/user-agreement.md) | [Privacy Policy](./docs/privacy-policy.md)

> 📜 Licensed under MIT. Derivative works please credit: [danghuangshang](https://github.com/wanikua/danghuangshang) by [@wanikua](https://github.com/wanikua)
