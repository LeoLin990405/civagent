# 🏛️ 朝廷架构详解

> ← [返回 README](../README.md) | [部署指南 →](./README.md)

---

## 技术架构

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
     │(silijian)│  │    │ │    │ │    │ │    │ │    │  │          │
     └──────────┘  └────┘ └────┘ └────┘ └────┘ └────┘  └──────────┘
           │          │      │      │      │      │          │
           ▼          ▼      ▼      ▼      ▼      ▼          ▼
     ┌───────────────────────────────────────────────────────────┐
     │           Skill 工具层（基于 OpenClaw 60+ 生态）            │
     │  GitHub · Notion · 浏览器 · Cron · TTS · 截图             │
     │  sessions_spawn（跨 Agent 派活）                           │
     │  sessions_send（跨 Agent 通信）                            │
     │  OpenClaw Hub 社区扩展 Skill                              │
     └───────────────────────────────────────────────────────────┘
```

<p align="center">
  <img src="../images/discord-architecture.png" alt="Discord 朝廷架构图" width="80%" />
</p>

每个 Agent 绑定一个 Discord Bot 账号，由同一个 Gateway 进程统一管理：
- **独立会话**：每个 Agent 有独立的会话存储，互不干扰
- **独立模型**：重活用强力模型，轻活用快速模型，省钱又高效
- **独立沙箱**：可配置 Docker 沙箱隔离，每个 Agent 独立容器
- **身份注入**：Gateway 自动将 SOUL.md + IDENTITY.md + 工作区文件组装为系统提示
- **消息路由**：通过 `bindings` 配置将 `(channel, accountId)` 映射到 `agentId`，最具体的匹配优先

---

## 三省六部——历史背景

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

> 💡 模型分层策略：重活（编码/分析）用强力模型，轻活（文案/管理）用快速模型，能省 5 倍成本。

---

## 多 Provider 混搭

默认模板用单一 Provider，但你可以同时接入多家，给不同部门分配不同模型：

```json5
// openclaw.json 中的 models.providers 支持多个
{
  "models": {
    "providers": {
      "anthropic": {
        "baseUrl": "https://api.anthropic.com",
        "apiKey": "sk-ant-xxx",
        "api": "anthropic-messages",
        "models": [
          { "id": "claude-sonnet-4-5", "name": "Claude Sonnet 4.5", "input": ["text", "image"], "contextWindow": 200000, "maxTokens": 8192 }
        ]
      },
      "deepseek": {
        "baseUrl": "https://api.deepseek.com/v1",
        "apiKey": "sk-xxx",
        "api": "openai-completions",
        "models": [
          { "id": "deepseek-chat", "name": "DeepSeek V3", "input": ["text"], "contextWindow": 128000, "maxTokens": 8192 }
        ]
      }
    }
  }
}
```

然后在 `agents.list` 里按需分配：

```json5
{ "id": "bingbu", "model": { "primary": "anthropic/claude-sonnet-4-5" } },  // 重活用 Claude
{ "id": "libu",   "model": { "primary": "deepseek/deepseek-chat" } }        // 轻活用 DeepSeek 省钱
```

> 格式：`provider名/模型id`。支持任何兼容 OpenAI API 格式的服务商（Ollama、通义千问、Gemini 等），详见 [OpenClaw 模型配置文档](https://docs.openclaw.ai/concepts/models)。

---

## 核心能力详解

### 多 Agent 协作

每个部门是独立 Bot，@谁谁回复，@everyone 全员响应。大任务自动新建 Thread 保持频道整洁。

**内置审批流程：**

```
皇帝 → @司礼监 重构用户系统
          │
          ├── spawn 兵部：编码实现
          │       │
          │       └── 完成后 → spawn 都察院：代码审查
          │                       │
          │                       ├── ✅ 通过 → 合并
          │                       └── ❌ 驳回 → 打回兵部修改
          │
          └── 涉及架构变更 → spawn 内阁：审议
                              │
                              ├── ✅ 批准 → 继续执行
                              └── ❌ 否决 → 汇报皇帝另议
```

> ⚠️ 想让 Bot 之间互相触发，需在 `openclaw.json` 的 `channels.discord` 中加上 `"allowBots": true`，同时每个 account 设置 `"groupPolicy": "open"`。

### 独立记忆系统

每个 Agent 有独立的工作区和 `memory/` 目录。对话积累的项目知识会持久化到文件，跨会话保留。Agent 越用越懂你的项目。

### 60+ Skill 生态

基于 OpenClaw 框架内置 60+ Skill：

| 类别 | Skill |
|------|-------|
| 开发 | GitHub（Issue/PR/CI）、Coding Agent（代码生成与重构） |
| 文档 | Notion（数据库/页面/自动汇报） |
| 信息 | 浏览器自动化、Web 搜索、Web 抓取、Hacker News |
| 自动化 | Cron 定时任务、心跳自检 |
| 媒体 | TTS 语音、截图、视频帧提取 |
| 运维 | tmux 远程控制、Shell 命令执行、天气查询 |
| 通信 | Discord、Slack、飞书（Lark）、Telegram、WhatsApp、Signal… |
| 扩展 | OpenClaw Hub 社区 Skill、自定义 Skill |

#### 📦 本项目预装 Skill

| Skill | 说明 | 需要 API Key |
|-------|------|:---:|
| `weather` | 天气查询（wttr.in / Open-Meteo） | ❌ |
| `github` | GitHub 操作（gh CLI） | ❌（需 `gh auth login`） |
| `notion` | Notion 页面/数据库管理 | ✅ |
| `hacker-news` | Hacker News 浏览和搜索 | ❌ |
| `browser-use` | 浏览器自动化 | ❌ |
| `quadrants` | 四象限任务管理 | ✅ |
| `openviking` | 向量知识库 | ✅ |

> 💡 通过 `openclaw skill install <skill名>` 可以随时从社区获取更多 Skill。

### 定时任务（Cron）

内置 Cron 调度器，让 Agent 定时自动执行：
- 每天自动写日报，发到 Discord + 存到 Notion
- 每周汇总周报
- 定时健康检查、代码备份
- 自定义任意定时任务

### 沙箱隔离

Agent 可以运行在 Docker 沙箱中，代码执行互不干扰。详见 [安全须知](./security.md)。

---

← [返回 README](../README.md)
