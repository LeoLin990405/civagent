[中文版](./README.md) | [🏢 Corporate Edition: Become CEO](https://github.com/wanikua/become-ceo)

<!-- SEO Keywords: Three Departments and Six Ministries, Ming Dynasty, Six Ministries System, Zhongshu Province, Menxia Province, Shangshu Province, Directorate of Ceremonial, Grand Secretariat, Censorate, Hanlin Academy, AI Court, AI Agent, Multi-Agent Collaboration, AI Management, Ancient China Governance, Modern Management, Organization Architecture, OpenClaw, multi-agent, ancient-china -->

# 🏛️ Three Departments & Six Ministries ✖️ OpenClaw — How Many Steps to Become Emperor? One-Click Deploy Your AI Imperial Court

### 30-Minute Setup · Multi-Agent Collaboration · Zero Code · Ancient Governance Wisdom × Modern AI Management

> **Modeled after the Ming Dynasty's Three Departments and Six Ministries (三省六部制), built on the [OpenClaw](https://github.com/openclaw/openclaw) framework.**
> One server + OpenClaw = A 24/7 AI imperial court at your command.

<p align="center">
  <img src="https://img.shields.io/badge/Inspired_By-Six_Ministries_System-gold?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Framework-OpenClaw-blue?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Agents-10+-green?style=for-the-badge" />
  <img src="https://img.shields.io/badge/OpenClaw_Skill_Ecosystem-60+-orange?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Deploy-5_min-red?style=for-the-badge" />
</p>

<div align="center">

### 👑 Become Emperor in One Click

```bash
bash <(curl -fsSL https://raw.githubusercontent.com/wanikua/boluobobo-ai-court-tutorial/main/install.sh)
```

**One command. 5 minutes. You are the Emperor.** [→ Full Install Guide](#quick-start)

</div>

<p align="center">
  <img src="./images/flow-architecture.png" alt="System Architecture Flow" width="80%" />
</p>

<p align="center">
  <img src="./images/discord-architecture.png" alt="Discord Court Architecture" width="80%" />
</p>

---

## Table of Contents

| Section | Description |
|---------|-------------|
| 📜 [What Is This?](#what-is-this) | Project overview, design philosophy, core capabilities |
| 🆚 [Why This Setup?](#why-this-setup) | Comparison with ChatGPT / AutoGPT / CrewAI |
| 🏗️ [Architecture](#architecture) | Three Departments & Six Ministries mapping |
| 🎬 [Demo](#demo-discord-conversations) | Real Discord conversation examples |
| 🚀 [**Quick Start**](#quick-start) | **← Start installing here** |
| ├─ [Linux Server Install](#step-1-one-line-deployment-5-minutes) | One-line script, 5 minutes |
| ├─ [macOS Local Install](#step-1-one-line-deployment-5-minutes) | Homebrew auto-install |
| ├─ [Lite Install (existing OpenClaw)](#step-1-one-line-deployment-5-minutes) | Config-only initialization |
| ├─ [Add Keys & Go Live](#step-2-add-your-keys-10-minutes) | API Key + Discord Bot Token |
| └─ [Full Six Ministries](#step-3-full-six-ministries--automation-15-minutes) | Test + configure automation |
| 🍍 [Real-World Case: Boluo Dynasty](#real-world-case-boluo-dynasty) | 14-Agent production architecture |
| 🏛️ [Court Architecture Deep Dive](#court-architecture--the-three-departments-and-six-ministries) | Historical context, role mapping, multi-model mixing |
| ⚙️ [Core Capabilities](#core-capabilities) | Collaboration, memory, Skills, Cron, sandbox |
| 🖥️ [GUI Management](#gui-management-interface) | Web Dashboard + Discord + Notion |
| ❓ [FAQ](#faq) | Basic + Technical FAQ |
| 🏢 [Corporate Edition: Become CEO](#prefer-a-corporate-edition) | Same architecture, English corporate version |
| 🔗 [Links & Community](#join-the-court) | Xiaohongshu, WeChat, community group |

---

## What Is This?

**AI Court** is a ready-to-use multi-AI-agent collaboration system that maps China's ancient **Three Departments and Six Ministries** (中书省 Zhongshu · 门下省 Menxia · 尚书省 Shangshu → 吏部 Personnel · 户部 Revenue · 礼部 Rites · 兵部 War · 刑部 Justice · 工部 Works) plus **Grand Secretariat · Censorate · Hanlin Academy** onto a modern AI agent organization.

**In plain terms:** You are the Emperor 👑, and AI agents are your ministers. Each minister has a clear role — one writes code, one manages finances, one handles marketing, one runs DevOps — all you do is issue an "imperial decree" (@mention an agent in Discord), and they execute immediately.

### Why an Ancient Court Architecture?

The Three Departments and Six Ministries system was one of the longest-running organizational frameworks in human history (Sui/Tang to Qing dynasty, over 1,300 years). Its core design principles:

- **Clear Separation of Duties** — Each ministry handles its own domain, no overstepping (= each AI Agent has its specialty)
- **Standardized Processes** — Memorial submission and imperial review systems (= Prompt templates + SOUL.md persona injection)
- **Checks and Balances** — Three Departments cross-verify (= Agent cross-review, multi-step confirmation)
- **Record Keeping** — Court diaries and historical records (= Memory persistence, Notion auto-archival)

These concepts map perfectly to modern multi-agent system design needs. **Ancient governance wisdom is the best practice for modern AI team management.**

### Core Capabilities at a Glance

| Capability | Description |
|-----------|-------------|
| **Multi-Agent Collaboration** | 10 independent AI Agents (Six Ministries + Directorate of Ceremonial + Grand Secretariat + Censorate + Hanlin Academy), each specialized, working in concert |
| **Independent Memory** | Each agent has its own workspace and memory files — the more you use it, the better it knows you |
| **60+ Skill Ecosystem** | Built on OpenClaw's 60+ Skills — GitHub, Notion, Browser, Cron, TTS and more, ready out of the box |
| **Automated Tasks** | Cron scheduling + heartbeat self-checks, 24/7 unattended operation |
| **Sandbox Isolation** | Docker container isolation, agent code runs independently |
| **Multi-Platform Support** | Discord / Feishu (Lark) / Slack / Telegram etc., invoke via @mention |
| **Web Dashboard** | React + TypeScript dashboard for visual management |
| **OpenClaw Ecosystem** | Built on [OpenClaw](https://github.com/openclaw/openclaw), access the [OpenClaw Skill Ecosystem](https://github.com/openclaw/openclaw) Skill ecosystem |

### Prefer a Corporate Edition?

If you're more familiar with modern corporate management concepts, we have an **English corporate version**:

👉 **[Become CEO](https://github.com/wanikua/become-ceo)** — Same architecture, using CEO / CTO / CFO / CMO roles instead of imperial ministries

| 🏛️ Court Role | 🏢 Corporate Role | Responsibility |
|:---:|:---:|:---:|
| Emperor 👑 | CEO | Ultimate decision maker |
| 司礼监 Directorate of Ceremonial | COO / Chief Operating Officer | Daily coordination, task delegation |
| 内阁 Grand Secretariat | CSO / VP Strategy | Strategic planning, proposal review |
| 都察院 Censorate | QA VP / Audit Director | Oversight, code review, quality control |
| 兵部 War Ministry | CTO / VP Engineering | Software engineering, architecture |
| 户部 Revenue Ministry | CFO / VP Finance | Financial analysis, cost management |
| 礼部 Rites Ministry | CMO / VP Marketing | Brand marketing, content strategy |
| 工部 Works Ministry | VP Infra / SRE | DevOps, infrastructure |
| 吏部 Personnel Ministry | VP Product / PMO | Project management, team coordination |
| 刑部 Justice Ministry | General Counsel | Legal compliance, contract review |
| 翰林院 Hanlin Academy | CKO / Chief Knowledge Officer | Academic research, documentation, technical investigation |

> 💡 Both projects are built on the same [OpenClaw](https://github.com/openclaw/openclaw) framework with identical architecture — only the role names and cultural context differ. Pick the style you prefer!

---

## Why This Setup?

| | ChatGPT & Web UIs | AutoGPT / CrewAI / MetaGPT | **AI Court (This Project)** |
|---|---|---|---|
| Multi-agent collaboration | ❌ Single generalist | ✅ Requires Python orchestration | ✅ Config files only, zero code |
| Persistent memory | ⚠️ Single shared memory | ⚠️ BYO vector database | ✅ Each agent has its own workspace + memory files |
| Tool integrations | ⚠️ Limited plugins | ⚠️ Build your own | ✅ OpenClaw 60+ Skill ecosystem (GitHub / Notion / Browser / Cron …) |
| Interface | Web | CLI / Self-hosted UI | ✅ Native Discord (works on phone & desktop) |
| Deployment difficulty | No deployment needed | Docker + coding required | ✅ One-line script, up in 5 minutes |
| 24h availability | ❌ Manual conversations only | ✅ | ✅ Cron jobs + heartbeat self-checks |
| Organizational metaphor | ❌ None | ❌ None | ✅ Six Ministries system, clear separation of duties |
| Framework ecosystem | Closed | Build your own | ✅ OpenClaw Hub Skill ecosystem |

**The key advantage: it's not a framework — it's a finished product.** Run a script, start chatting in Discord by @mentioning your agents.

---

<details>
<summary><h2>🏗️ Architecture</h2></summary>

```
                          ┌─────────────────────┐
                          │   Emperor (You) 👑   │
                          │  Discord / Web UI    │
                          └──────────┬──────────┘
                                     │ Imperial Decree (@mention / DM)
                                     ▼
                      ┌──────────────────────────────┐
                      │      OpenClaw Gateway         │
                      │      Node.js Daemon           │
                      │                              │
                      │  ┌─────────────────────────┐ │
                      │  │ Message Routing (Bindings)│ │
                      │  │ channel + accountId      │ │
                      │  │ → agentId match → dispatch│ │
                      │  │ Session isolation · Cron  │ │
                      │  └─────────────────────────┘ │
                      └──┬───┬───┬───┬───┬───┬───┬───┘
                         │   │   │   │   │   │   │
           ┌─────────────┘   │   │   │   │   │   └─────────────┐
           ▼           ▼     ▼   ▼   ▼   ▼   ▼                ▼
     ┌──────────┐  ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐  ┌──────────┐
     │Directorate│ │War │ │Rev.│ │Pers│ │Rite│ │Works│  │ Justice  │
     │of Cerem. │  │兵部│ │户部│ │吏部│ │礼部│ │工部 │  │  刑部    │
     │Scheduler │  │Code│ │ $$ │ │Mgmt│ │Mktg│ │Ops │  │  Legal   │
     └──────────┘  └────┘ └────┘ └────┘ └────┘ └────┘  └──────────┘
           │          │      │      │      │      │          │
           ▼          ▼      ▼      ▼      ▼      ▼          ▼
     ┌───────────────────────────────────────────────────────────┐
     │          Skill Layer (OpenClaw 60+ Ecosystem)              │
     │  GitHub · Notion · Browser · Cron · TTS · Screenshot     │
     │  sessions_spawn (cross-Agent task delegation)             │
     │  sessions_send (cross-Agent messaging)                    │
     │  OpenClaw Hub community Skills                            │
     └───────────────────────────────────────────────────────────┘
```

Each Agent is bound to a Discord Bot account, all managed by a single Gateway process:
- **Independent sessions**: Each agent has its own session storage (`~/.openclaw/agents/<agentId>/sessions`), fully isolated
- **Independent models**: Use power models for heavy tasks, fast models for light work — save money without sacrificing quality
- **Independent sandbox**: Configurable Docker sandbox isolation, each agent in its own container
- **Identity injection**: Gateway automatically assembles SOUL.md + IDENTITY.md + workspace files into the system prompt
- **Message routing**: The `bindings` config maps `(channel, accountId)` to `agentId` — most specific match wins

</details>

---

## Demo: Discord Conversations

```
👑 Emperor: @bingbu Write me a user login REST API with Node.js + Express

🏛️ War Ministry: As Your Majesty commands. I'll get right on it.
  📁 Created auth-api/ project structure
  ✅ POST /api/login — JWT authentication
  ✅ POST /api/register — User registration
  ✅ middleware/auth.js — Token verification middleware
  ✅ Pushed to GitHub: wanikua/auth-api#1
  The work is done. Please review, Your Majesty.

👑 Emperor: @hubu How much did we spend on APIs this month?

🏛️ Revenue Ministry: Your Majesty, here is this month's API expenditure:
  💰 Total: $23.47
  ├── War Ministry (Power Model): $15.20 (142 coding tasks)
  ├── Rites Ministry (Fast Model): $3.80 (89 copywriting tasks)
  ├── Directorate of Ceremonial (Fast Model): $2.12 (203 daily conversations)
  └── Others: $2.35
  📊 Down 12% month-over-month, mainly due to War Ministry optimizing prompt length.

👑 Emperor: @libu Write a Xiaohongshu post recommending AI tool setups

🏛️ Rites Ministry: As you wish! Here's the copy:
  📝 Title: "Regular People Can Be AI Emperors? I Manage My Whole Team with 6 AIs"
  Body: Still chatting with AI one conversation at a time? I built an entire AI court...
  🏷️ #AITools #Productivity #MultiAgent #AICourt #SixMinistries

👑 Emperor: @everyone Meeting tomorrow at 3 PM — all departments prepare weekly reports

🏛️ Directorate of Ceremonial: As commanded. Meeting scheduled.
🏛️ War Ministry: Acknowledged. Will compile this week's code output.
🏛️ Revenue Ministry: Acknowledged. Will prepare financial statements.
🏛️ Rites Ministry: Acknowledged. Will summarize marketing metrics.
🏛️ Works Ministry: Acknowledged. Will prepare server status report.
```

---

## Use Cases

| Scenario | Description | Departments Involved |
|----------|-------------|---------------------|
| **Solo Developer** | One person, complete tech team — coding + DevOps + marketing covered | War + Works + Rites |
| **Student Learning** | AI tutor team — different subjects, different agents, each with memory | All customizable |
| **Startup Team** | Low-cost AI assistant matrix covering product, tech, and operations | All Six Ministries |
| **Content Creator** | Content creation + data analytics + finance management all-in-one | Rites + Revenue |
| **Research Project** | Literature search + code experiments + paper writing | War + Rites |
| **AI Experiments** | Agent-to-agent conversations, simulated court sessions | All Six Ministries |

---

## Quick Start

### Step 1: One-Line Deployment (5 minutes)

Grab a Linux server and SSH in. Choose the installation method that fits:

> 🔴 **Beginners: use a cloud server, not your personal computer!** Agents have full read/write and command execution access within their workspace. On a cloud server you can rebuild anytime; on a personal computer you risk accidentally deleting files. See [Security Guide](#%EF%B8%8F-security-guide-must-read-for-beginners).

#### Recommended Server Providers

| Provider | Recommended Config | Cost | Notes |
|----------|-------------------|------|-------|
| **Alibaba Cloud** | ECS 2C4G / ARM | Free trial / from ¥40/mo | [Free Trial](https://free.aliyun.com/) |
| **Tencent Cloud** | Lighthouse 2C4G | Free trial / from ¥40/mo | [Free Trial](https://cloud.tencent.com/act/free) |
| **Huawei Cloud** | HECS 2C4G | Free trial | [Free Trial](https://activity.huaweicloud.com/free_test/) |
| **AWS** | t4g.medium (ARM) | Free Tier 12 months | [Free Tier](https://aws.amazon.com/free/) |
| **GCP** | e2-medium | Free Trial 90 days | [Free Trial](https://cloud.google.com/free) |
| **Oracle Cloud** | ARM 4C24G | **Always Free** | [Always Free](https://www.oracle.com/cloud/free/) |
| **Local Mac** | M1/M2/M3/M4 | No server needed | See Mac install below |

> 💡 ARM architecture + 4 GB RAM or more recommended. If you're only running the Directorate of Ceremonial (single agent), 2 GB is sufficient.

#### Linux One-Line Install

```bash
bash <(curl -fsSL https://raw.githubusercontent.com/wanikua/boluobobo-ai-court-tutorial/main/install.sh)
```

The script automatically handles:
- ✅ System updates + firewall configuration (auto-detects Alibaba Cloud / Tencent Cloud / Oracle etc.)
- ✅ 4 GB Swap (prevents OOM kills)
- ✅ Node.js 22 + GitHub CLI + Chromium
- ✅ Global OpenClaw installation
- ✅ Workspace initialization (SOUL.md / IDENTITY.md / USER.md / openclaw.json multi-agent template)
- ✅ Gateway systemd service (auto-starts on boot)

The install script features color-coded output with progress indicators and ✓ success markers for each step.

> 💡 **Already have OpenClaw/Clawdbot installed?** Use the lite script — skips system dependencies, only initializes workspace and config templates:
> ```bash
> bash <(curl -fsSL https://raw.githubusercontent.com/wanikua/boluobobo-ai-court-tutorial/main/install-lite.sh)
> ```
> Supports two modes: Discord multi-Bot mode or pure WebUI mode (no Discord needed).

> 🍎 **macOS user?** Use the Mac-specific script — installs all dependencies via Homebrew:
> ```bash
> bash <(curl -fsSL https://raw.githubusercontent.com/wanikua/boluobobo-ai-court-tutorial/main/install-mac.sh)
> ```
> Supports both Intel and Apple Silicon (M1/M2/M3/M4), auto-detects architecture.

> 🐳 **Docker user?** One command to launch — no system pollution:
> ```bash
> # 1. Clone the project
> git clone https://github.com/wanikua/boluobobo-ai-court-tutorial.git
> cd boluobobo-ai-court-tutorial
>
> # 2. Prepare config (copy template, fill in API Key and Bot Token)
> cp openclaw.example.json openclaw.json
> nano openclaw.json
>
> # 3. Launch
> docker compose up -d
>
> # View logs
> docker compose logs -f
>
> # Stop
> docker compose down
> ```
> The container comes pre-loaded with OpenClaw + Chromium + GitHub CLI + Python. Workspace and config are persisted via volumes — upgrade with `docker compose pull && docker compose up -d`.
>
> **Docker Port Reference:**
> | Port | Purpose |
> |------|---------|
> | 18789 | Gateway Dashboard |
> | 18795 | Boluo GUI (optional) |

### Step 2: Add Your Keys (10 minutes)

After the script finishes, you just need two things:

1. **LLM API Key** → From your LLM provider's dashboard
2. **Discord Bot Token** (one per department) → [discord.com/developers](https://discord.com/developers/applications)

```bash
# Edit config — fill in API Key and Bot Tokens
# Path depends on the package: openclaw uses ~/.openclaw/openclaw.json; clawdbot uses ~/.clawdbot/clawdbot.json
nano ~/.openclaw/openclaw.json

# Start the court
systemctl --user start openclaw-gateway

# Verify
systemctl --user status openclaw-gateway
```

@mention your Bot in Discord and say something. If it replies, you're live.

### Step 3: Full Six Ministries + Automation (15 minutes)

```
@bingbu Write me a user login API
→ War Ministry (Power Model): Complete code + architecture suggestions, large tasks auto-spawn Threads

@hubu How much did we spend on APIs this month?
→ Revenue Ministry (Power Model): Cost breakdown + optimization recommendations

@libu Write a Xiaohongshu post about AI tool recommendations
→ Rites Ministry (Fast Model): Copy + hashtag suggestions

@everyone Tomorrow's meeting at 3 PM — all departments prepare weekly reports
→ All agents acknowledge individually
```

Set up automated daily reports:
```bash
# Get the Gateway Token
openclaw gateway token

# Auto-generate daily report at 22:00 Beijing time
openclaw cron add \
  --name "Daily Report" --agent main \
  --cron "0 22 * * *" --tz "Asia/Shanghai" \
  --message "Generate today's daily report, write to Notion and post to Discord" \
  --session isolated --token <your-token>
```

---

## Real-World Case: Boluo Dynasty

> Below is a **real, running AI court** built on this project — the Boluo Dynasty (菠萝王朝), showcasing 14 agents working in concert.

### Boluo Dynasty Organizational Chart

```
                           ┌──────────────────────┐
                           │  Pineapple Emperor 🍍 │
                           │  Discord + Multi-push  │
                           └──────────┬───────────┘
                                      │
                 ┌────────────────────┼────────────────────┐
                 ▼                    ▼                    ▼
        ┌────────────────┐  ┌────────────────┐  ┌────────────────┐
        │  Directorate   │  │ Grand          │  │  Censorate     │
        │  of Ceremonial │  │ Secretariat    │  │  都察院         │
        │  Dispatch &    │  │ Strategy &     │  │  Oversight &   │
        │  Coordination  │  │ Deliberation   │  │  Quality Ctrl  │
        └───────┬────────┘  └────────────────┘  └────────────────┘
                │
    ┌───────────┼───────────────────────────────────┐
    │           │           │           │           │
    ▼           ▼           ▼           ▼           ▼
┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐
│  War   │ │Revenue │ │ Rites  │ │ Works  │ │Justice │ │Personl │
│Software│ │Finance │ │Brand & │ │Infra & │ │Legal & │ │Project │
│  Eng.  │ │Budgets │ │  Mktg  │ │ DevOps │ │Complnce│ │  Mgmt  │
└────────┘ └────────┘ └────────┘ └────────┘ └────────┘ └────────┘

    ┌───────────────────────────────────────────────┐
    │            🏛️ Auxiliary Offices                │
    ├────────┬────────┬────────┬────────┬───────────┤
    │Imperial│ Hanlin │Imperial│ Inner  │ Imperial  │
    │Academy │Academy │Medical │Househld│  Kitchen  │
    │Education│Research│Health  │Calendar│ Cuisine   │
    │Knowledge│Papers │Wellness│Logistic│ Recipes   │
    └────────┴────────┴────────┴────────┴───────────┘
```

### Boluo Dynasty in Action

**14 Agents, each with a dedicated Discord Bot, running 24/7:**

| Institution | Agent | Daily Work Examples |
|-------------|-------|---------------------|
| Directorate of Ceremonial | Chief Steward | Receive decrees, delegate tasks, coordinate departments, Cron scheduling |
| Grand Secretariat | Grand Secretary | Business strategy analysis, competitive research, global decision advisory |
| Censorate | Chief Censor | Code review, quality gate-keeping, correcting departmental errors |
| War Ministry | Minister | Full-stack development, GitHub PRs, system architecture, bug fixes |
| Revenue Ministry | Minister | Market data analysis, API cost tracking, financial reports |
| Rites Ministry | Minister | Social media operations, copywriting, brand promotion |
| Works Ministry | Minister | Server ops, CI/CD, infrastructure inspections |
| Justice Ministry | Minister | Open-source compliance, IP protection, contract review |
| Personnel Ministry | Minister | Project management, startup incubation, performance reviews |
| Imperial Academy | Chancellor | Course tutoring, learning plans, knowledge organization |
| Hanlin Academy | Scholar | Paper writing, reading notes, technical documentation |
| Imperial Medical Office | Director | Health reminders, dietary advice, exercise plans |
| Inner Household | Steward | Calendar management, weather checks, travel reminders |
| Imperial Kitchen | Chef | Food recommendations, recipe research, takeout picks |

### Automated Cron Tasks (Actually Running)

| Task | Frequency | Description |
|------|-----------|-------------|
| Morning Briefing | Daily 08:00 | Auto-aggregates GitHub activity, weather, TODOs — pushes to phone |
| Pre-Market Analysis | Weekdays 09:15 | Revenue Ministry pulls market data, generates report, multi-channel push |
| Court Diary | Daily 22:30 | Historian auto-records the day's events into Notion diary database |
| Rites Daily Report | Daily 14:00 | Rites Ministry reports social media operations data |

### Notion "Imperial Archives" Knowledge Base

The Boluo Dynasty uses Notion as its "National History Office," archiving every decision and data point:

```
🏯 Boluo Dynasty
├── Annals (Timeline)
│   ├── Court Diary (Daily)       ← Auto-written daily
│   ├── Biweekly Record (Weekly)  ← Auto-summarized weekly
│   ├── Chronicle (Monthly)       ← Auto-summarized monthly
│   └── Major Events              ← Milestone events
├── Tables (Data Dashboards)
│   ├── Revenue Ledger (Finance)  ← Managed by Revenue Ministry
│   ├── Public Sentiment (Social) ← Managed by Rites Ministry
│   ├── Officials Registry (CRM)  ← Managed by Personnel Ministry
│   └── Inventory (Tools)         ← Managed by Works Ministry
├── Treatises (Knowledge Base)
│   ├── Technology Treatise        ← War / Works Ministry
│   ├── Operations Treatise        ← Rites Ministry
│   ├── Scholarship Treatise       ← Imperial Academy
│   └── Regulations (SOPs)         ← Cross-department processes
└── Biographies (Project Archives)
    └── 11 project files           ← Full lifecycle management
```

> 💡 **This is not a demo — it's a production system in daily use.** The Boluo Dynasty has been running steadily for weeks, handling hundreds of real tasks — from code development to content operations, data analysis to project management.

---

## Court Architecture — The Three Departments and Six Ministries

### Historical Background

The Three Departments and Six Ministries (三省六部制) was the central government system of imperial China:
- **中书省 Zhongshu Province**: Drafting imperial edicts (= receiving user commands, generating plans)
- **门下省 Menxia Province**: Review and rejection (= message routing, permission verification)
- **尚书省 Shangshu Province**: Execution and implementation (= Skill tool layer, actual execution)

Under Shangshu Province were the **Six Ministries**, each managing its own domain. In this project, OpenClaw Gateway plays the role of the Three Departments, while AI Agents correspond to the Ministries and advisory bodies:

| Department | Historical Role | AI Role | Recommended Model | Typical Use Cases |
|------------|----------------|---------|-------------------|-------------------|
| **司礼监 Directorate of Ceremonial** | Emperor's attendant, imperial review | Central coordination | Fast Model | Daily chat, task delegation, automated reporting |
| **兵部 War Ministry** | Military affairs | Software engineering | Power Model | Coding, architecture design, code review, debugging |
| **户部 Revenue Ministry** | Census & taxation | Finance & operations | Power Model | Cost analysis, budgeting, e-commerce operations |
| **礼部 Rites Ministry** | Ceremonies & diplomacy | Brand & marketing | Fast Model | Copywriting, social media, content strategy |
| **工部 Works Ministry** | Engineering & construction | Infrastructure | Fast Model | DevOps, CI/CD, server management |
| **吏部 Personnel Ministry** | Official selection | Project management | Fast Model | Startup incubation, task tracking, team coordination |
| **刑部 Justice Ministry** | Law & punishment | Legal & compliance | Fast Model | Contract review, intellectual property, compliance checks |

> 💡 Model tiering strategy: Use power models for heavy tasks (coding/analysis), fast models for light tasks (copywriting/management) — saves roughly 5× on costs. You can also plug in economy models for further savings.

### Multi-Provider Mixing (Optional)

The default template uses a single provider, but you can connect multiple providers and assign different models to different departments:

```json5
// openclaw.json — models.providers supports multiple entries
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

Then assign per agent in `agents.list`:

```json5
{ "id": "bingbu", "model": { "primary": "anthropic/claude-sonnet-4-5" } },  // Heavy lifting with Claude
{ "id": "libu",   "model": { "primary": "deepseek/deepseek-chat" } }        // Save money with DeepSeek
```

> Format: `providerName/modelId`. Supports any OpenAI API-compatible provider (Ollama, Tongyi Qianwen, Gemini, etc.) — see [OpenClaw Model Configuration Docs](https://docs.openclaw.ai/concepts/models).

---

## Core Capabilities

### Multi-Agent Collaboration
Each department is its own Bot. @mention one and it responds; @everyone triggers all of them. Large tasks automatically spawn Threads to keep channels tidy.

**Built-in Approval Workflow:**
When the Directorate of Ceremonial dispatches tasks, it automatically triggers a review chain — code tasks are sent to the Censorate for review upon completion, and major decisions are escalated to the Grand Secretariat for deliberation. The Censorate can reject and send back for revision; the Grand Secretariat has veto power.

```
Emperor → @Directorate: Refactor the user system
              │
              ├── spawn War Ministry: Code implementation
              │       │
              │       └── On completion → spawn Censorate: Code review
              │                               │
              │                               ├── ✅ Approved → Merge
              │                               └── ❌ Rejected → Send back to War Ministry
              │
              └── Architecture change involved → spawn Grand Secretariat: Deliberation
                                                  │
                                                  ├── ✅ Approved → Proceed
                                                  └── ❌ Vetoed → Report to Emperor for reconsideration
```

> ⚠️ To enable Bot-to-Bot interactions (e.g., word chain games, multi-Bot discussions), add `"allowBots": true` in the `channels.discord` section of `openclaw.json`. Without this, Bots ignore messages from other Bots by default. Each account also needs `"groupPolicy": "open"`, otherwise group messages will be silently dropped.

### Independent Memory System
Each agent has its own workspace and `memory/` directory. Project knowledge accumulated through conversations is persisted to files and retained across sessions. The more you use an agent, the better it understands your project.

### 60+ Skill Ecosystem (Powered by OpenClaw Framework)
It's not just a chatbot — the OpenClaw framework includes 60+ built-in Skills covering the entire development lifecycle, extendable via [OpenClaw Skill Ecosystem](https://github.com/openclaw/openclaw):

| Category | Skills |
|----------|--------|
| Development | GitHub (Issues/PRs/CI), Coding Agent (code generation & refactoring) |
| Documentation | Notion (databases/pages/automated reporting) |
| Information | Browser automation, Web search, Web scraping, Hacker News |
| Automation | Cron scheduled tasks, Heartbeat self-checks |
| Media | TTS voice, Screenshots, Video frame extraction |
| Operations | tmux remote control, Shell command execution, Weather |
| Communication | Discord, Slack, Feishu (Lark), Telegram, WhatsApp, Signal… |
| Extensions | OpenClaw Hub community Skills, Custom Skills |

#### 📦 Pre-installed Skills (in `skills/` directory)

| Skill | Description | API Key Required |
|-------|-------------|:---:|
| `weather` | Weather via wttr.in / Open-Meteo | ❌ |
| `github` | GitHub operations via gh CLI | ❌ (need `gh auth login`) |
| `notion` | Notion page/database management | ✅ |
| `hacker-news` | Hacker News browsing & search | ❌ |
| `browser-use` | Browser automation, social media management | ❌ |
| `quadrants` | Eisenhower matrix task management | ✅ |
| `openviking` | Vector knowledge base (Volcengine open-source) | ✅ |

> 💡 These are just the starter pack. Install more from the community anytime with `openclaw skill install <skill-name>`.

### Scheduled Tasks (Cron)
Built-in Cron scheduler lets agents run tasks on autopilot:
- Auto-generate daily reports, post to Discord + save to Notion
- Weekly summary roll-ups
- Scheduled health checks and code backups
- Any custom recurring task you can think of

### Team Collaboration
Invite friends to your Discord server — everyone can @mention department Bots to issue commands. No interference between users, and results are visible to all.

### Sandbox Isolation
Agents can run inside Docker sandboxes with isolated code execution. Supports configurable isolation levels for networking, filesystem, and environment variables.

---

<details>
<summary><h2>🖥️ GUI Management Interface</h2></summary>

Beyond Discord command-line interaction, the AI Court also offers multiple graphical interface (GUI) management options:

### Web Dashboard (Boluo Dynasty Dashboard)

This project includes a built-in Web management dashboard (in the `gui/` directory), built with React + TypeScript + Vite:

<p align="center">
  <img src="./images/gui-court.png" alt="Court Overview — all departments at a glance" width="90%" />
  <br/>
  <em>Court Overview — Throne, Six Ministries, and Auxiliary Offices with live status</em>
</p>

<p align="center">
  <img src="./images/gui-sessions.png" alt="Session Management — token consumption and message stats" width="90%" />
  <br/>
  <em>Session Management — 88 sessions, 9008 messages, 87.34M tokens tracked in real-time</em>
</p>

Features include:
- **Dashboard**: Real-time view of department status, token consumption, system load
- **Court Hall**: Chat directly with department Bots from the web interface
- **Session Management**: Browse all historical sessions, message details, token stats
- **Cron Jobs**: Visual management of scheduled tasks (enable/disable/manual trigger)
- **Token Analytics**: Token consumption breakdown by department and date
- **System Health**: CPU/memory/disk monitoring, Gateway status

**How to start:**
```bash
# 1. Clone the tutorial repo (if you haven't already)
git clone https://github.com/wanikua/boluobobo-ai-court-tutorial.git
cd boluobobo-ai-court-tutorial

# 2. Build the frontend
cd gui && npm install && npm run build

# 3. Install backend dependencies and start (set login password)
cd server && npm install
BOLUO_AUTH_TOKEN=your-password node index.js
```

> ⚠️ **Login password note**: Set the login password via the `BOLUO_AUTH_TOKEN` environment variable when starting the backend. Use this password to log in on the web page. To disable authentication, modify the `authMiddleware` in `server/index.js`.

Access at: `http://your-server-ip:18795`

> 💡 For production, use Nginx reverse proxy + HTTPS instead of exposing the port directly. For long-running processes, use `pm2` or `screen`: `BOLUO_AUTH_TOKEN=your-password pm2 start server/index.js --name boluo-gui`

### Discord as GUI

Discord itself is the best GUI management interface:
- **Phone + Desktop** sync — manage from anywhere
- **Channel categories** naturally map to departments (War, Revenue, Rites…)
- **Message history** permanently saved with built-in search
- **Permission management** with fine-grained control over who sees and does what
- **@mention** any agent to invoke it — zero learning curve

### Notion as Data Visualization

Through OpenClaw's Notion Skill integration, court data auto-syncs to Notion:
- **Court Diary (Daily)** and **Biweekly Record (Weekly)** auto-generated
- **Revenue Ledger (Finance)** automatically records API consumption
- **Biographies (Projects)** track progress across all projects
- Notion's kanban, calendar, and table views provide rich data visualization

> 💡 Three-tier GUI: **Web Dashboard** for system status → **Discord** for issuing commands → **Notion** for reports and historical data.

</details>

---

<details>
<summary><h2>📖 Detailed Tutorials</h2></summary>

For the basics (server provisioning → installation → configuration → first run) and advanced topics (tmux, GitHub, Notion, Cron, Discord, prompt engineering tips), check out the Xiaohongshu tutorial series.

</details>

---

<details>
<summary><h2>📱 Connecting Feishu (Lark)</h2></summary>

Besides Discord, the AI Court also supports Feishu (Lark) as an interaction interface. The Feishu plugin is built into newer versions of OpenClaw — no extra installation needed.

### Step 1: Create a Feishu App

1. Visit [Feishu Open Platform](https://open.feishu.cn/app), log in, and click **Create Custom App**
2. Fill in the app name and description, choose an icon
3. On the **Credentials & Basic Info** page, copy the **App ID** (format `cli_xxx`) and **App Secret**

### Step 2: Configure Permissions and Capabilities

1. **Add permissions**: Go to **Permission Management**, click **Batch Import**, and paste:
```json
{
  "scopes": {
    "tenant": [
      "im:message",
      "im:message.group_at_msg:readonly",
      "im:message.p2p_msg:readonly",
      "im:message:readonly",
      "im:message:send_as_bot",
      "im:resource",
      "im:chat.members:bot_access",
      "im:chat.access_event.bot_p2p_chat:read",
      "contact:user.employee_id:readonly"
    ],
    "user": [
      "im:chat.access_event.bot_p2p_chat:read"
    ]
  }
}
```

2. **Enable Bot capability**: Go to **App Capabilities > Bot**, enable it and set the bot name

3. **Configure event subscriptions**: Go to **Event Subscriptions**, select **Receive events via long connection (WebSocket)**, add event `im.message.receive_v1`

> ⚠️ Before configuring event subscriptions, you need to complete Step 3 below and start the Gateway first — otherwise the WebSocket long connection may fail to save.

4. **Publish the app**: In **Version Management & Publishing**, create a version and submit for review

### Step 3: Configure OpenClaw

**Option A: Command-line wizard (recommended)**
```bash
openclaw channels add
# Select Feishu, enter App ID and App Secret
```

**Option B: Manual config edit**
```json5
{
  "channels": {
    "feishu": {
      "enabled": true,
      "dmPolicy": "open",          // DM policy: open=direct chat, pairing=requires approval
      "groupPolicy": "open",       // Group policy: must be "open" to receive group messages
      "accounts": {
        "silijian": {
          "appId": "cli_xxx",
          "appSecret": "your-App-Secret"
        }
      }
    }
  }
}
```
> ⚠️ The account key must match the `accountId` in your `bindings`. This project uses `silijian` for Feishu mode.
> 💡 `dmPolicy: "pairing"` requires running `openclaw pairing approve` before DMs work — good for high-security setups. Beginners should use `"open"`.

### Step 4: Start and Test

```bash
# Start/restart Gateway
openclaw gateway restart

# Check status to confirm Feishu connection
openclaw gateway status
```

With `dmPolicy: "open"` (recommended), just send your bot a message in Feishu to start chatting.

With `dmPolicy: "pairing"`, the first DM triggers a pairing code — approve it on the server:
```bash
openclaw pairing approve feishu <pairing-code>
```

In group chats, @mention the bot to trigger a response (unless `groupPolicy: "open"` is set).

> 💡 Feishu uses WebSocket long connections — **no public IP or domain required**. Works even with local deployments.
>
> 📖 **Detailed Feishu guide in this project**: [飞书配置指南.md](./飞书配置指南.md) (Chinese, covers multi-Bot setup, full config examples, diagnostics)
>
> 📖 OpenClaw official Feishu docs: [docs.openclaw.ai/channels/feishu](https://docs.openclaw.ai/channels/feishu)

### Feishu / Lark Troubleshooting

Bot not responding when @mentioned? Check in this order:

**① Event Subscriptions (most common cause)**
Feishu Open Platform → Your App → Events & Callbacks:
- Subscription method: **WebSocket** (not HTTP)
- Event added: `im.message.receive_v1` (receive messages)
- Status shows **Enabled**

> ⚠️ Start the Gateway before configuring event subscriptions — otherwise the WebSocket long connection may fail to save.

**② Permission Check**
App Management → Permission Management — confirm these are enabled (at least the first 6):

| Permission | Purpose | Required |
|-----------|---------|:---:|
| `im:message` | Read & send messages | ✅ |
| `im:message:send_as_bot` | Send messages as bot | ✅ |
| `im:message:readonly` | Read messages | ✅ |
| `im:message.p2p_msg:readonly` | Read DM messages | ✅ |
| `im:message.group_at_msg:readonly` | Read group @messages | ✅ |
| `im:resource` | Access message resources | ✅ |
| `im:chat.members:bot_access` | Get group member info | Recommended |
| `im:chat.access_event.bot_p2p_chat:read` | Get DM events | Recommended |
| `contact:user.employee_id:readonly` | Get user employee ID | Recommended |

**③ Config File Check**
```json5
// openclaw.json must contain (account key must match accountId in bindings):
"channels": {
  "feishu": {
    "enabled": true,
    "dmPolicy": "open",
    "groupPolicy": "open",
    "accounts": {
      "silijian": {
        "appId": "cli_your-AppID",
        "appSecret": "your-AppSecret"
      }
    }
  }
}
```
> ⚠️ Use `silijian` as the account key (matching install.sh output), not `main`. Mismatched keys cause message routing failures.

**④ Bot Capability**
Feishu Open Platform → App Capabilities → Confirm **Bot** capability is enabled and the bot has been added to the target group chat.

**⑤ @mention Method**
In Feishu, you must select the bot from the popup suggestion list — typing "@xxx" manually won't work.

**⑥ Check Logs**
```bash
# See if Gateway is receiving Feishu messages
journalctl --user -u openclaw-gateway --since "5 min ago" | grep -i "feishu\|lark"

# Common errors:
# "feishu: not connected" → appId/appSecret is wrong
# "feishu: event not received" → event subscription not configured
# No feishu logs at all → channels.feishu not enabled
```

**⑦ Pairing Confirmation (only with `dmPolicy: "pairing"`)**
If using `dmPolicy: "pairing"`, the first DM requires server-side approval:
```bash
openclaw pairing approve feishu <pairing-code>
```

> 💡 90% of Feishu connection issues come from event subscriptions and permission configuration. Checking steps ①→② usually resolves the problem.

</details>

---

<details>
<summary><h2>📝 Connecting Notion (Auto-Archival)</h2></summary>

The AI Court can use the Notion Skill to automatically write daily reports, archive data, and manage knowledge bases. Setup takes just 3 steps.

### Step 1: Create a Notion Integration

1. Visit [Notion Integrations](https://www.notion.so/profile/integrations)
2. Click **New integration**
3. Fill in a name (e.g., "AI Court"), select the associated Workspace
4. After creation, copy the **Internal Integration Secret** (format `ntn_xxx` or `secret_xxx`)

### Step 2: Store the API Key

```bash
# Create config directory and save the key
mkdir -p ~/.config/notion
echo "ntn_your-token" > ~/.config/notion/api_key
```

### Step 3: Authorize Pages / Databases

This step is **critical** — skip it and the API will return 404:

1. Open the Notion page or database you want the AI to access
2. Click the **`···`** menu (top right) → **Connect to**
3. Select the Integration you just created
4. Sub-pages automatically inherit permissions

> ⚠️ **Each top-level page/database must be manually authorized once** — the Integration does not automatically gain access to your entire Workspace.

### Verify

```bash
# Test that the API is connected
NOTION_KEY=$(cat ~/.config/notion/api_key)
curl -s "https://api.notion.com/v1/users/me" \
  -H "Authorization: Bearer $NOTION_KEY" \
  -H "Notion-Version: 2025-09-03" | head -c 200
```

If the returned JSON includes your Integration's name, you're all set.

### Usage Examples

Once configured, just ask your agents in Discord:

```
@silijian Summarize today's work and write it to the Notion daily report
@hubu Create a new finance database with columns: Date, Income, Expenses, Notes
@libu Update this week's social media stats in the Notion sentiment table
```

> 💡 Notion is ideal for **persistent archival** (daily/weekly reports, knowledge bases), while Discord is best for **real-time interaction**. They complement each other perfectly.
>
> 📖 Notion API documentation: [developers.notion.com](https://developers.notion.com)

</details>

---

<details>
<summary><h2>🏥 Configuration Diagnostics (doctor.sh)</h2></summary>

Having trouble? Run one command for an automatic health check:

```bash
bash <(curl -fsSL https://raw.githubusercontent.com/wanikua/boluobobo-ai-court-tutorial/main/doctor.sh)
```

Diagnostics include:
- ✅ OpenClaw / Node.js installation check
- ✅ Config file format and API Key validation
- ✅ Discord Bot Token, allowBots, groupPolicy check
- ✅ Agent and Binding route matching verification
- ✅ Workspace files (SOUL.md / USER.md / memory/) check
- ✅ Optional integrations (Notion, etc.) check
- ✅ **Full troubleshooting checklist for @everyone not triggering**

### @everyone Not Triggering Bot Responses?

This is the most common issue. Usually the cause is **Discord Developer Portal Intents not enabled**:

1. Open [Discord Developer Portal](https://discord.com/developers/applications)
2. Select your Bot → **Bot** page on the left
3. Scroll down to **Privileged Gateway Intents** and enable:
   - ✅ **Message Content Intent** (required)
   - ✅ **Server Members Intent** (required)
   - ✅ **Presence Intent** (optional)
4. **Enable these for every Bot** — not just one!
5. Confirm each Bot's role in the server has **View Channels** permission
6. Confirm `channels.discord.groupPolicy` and each account's `groupPolicy` are set to `"open"` in your config file

> ⚠️ After changing Intents, you must **restart the Gateway**: `openclaw gateway restart` or `systemctl --user restart openclaw-gateway`

</details>

---

<details>
<summary><h2>❓ FAQ</h2></summary>

### Basics

**Q: Do I need to know how to code?**
No. The one-line install script handles setup, and configuration is just filling in a few keys. All interaction happens through natural language in Discord.

**Q: How is this different from just using ChatGPT?**
ChatGPT is a single generalist that forgets everything when you close the tab. This system gives you multiple specialists — each agent has its own domain expertise, persistent memory, and tool permissions. They can automatically commit code to GitHub, write docs to Notion, and run tasks on a schedule.

**Q: Can I use other models?**
Yes. OpenClaw supports Anthropic, OpenAI, Google Gemini, and any other provider compatible with the OpenAI API format. Just change the model config in `openclaw.json`. Different departments can use different models.

**Q: How much does the API cost per month?**
Depends on usage intensity. Light usage: $10–15/month, moderate: $20–30/month. Cost-saving tip: use power models for heavy tasks, fast models for light tasks (roughly 5× cheaper), and plug in economy models for simple tasks to save even more.

**Q: What's the relationship with Become CEO?**
[Become CEO](https://github.com/wanikua/become-ceo) is the English corporate edition of this project, using the same OpenClaw framework and architecture but with modern corporate roles (CTO, CFO, etc.) instead of imperial court titles. Prefer ancient Chinese aesthetics? Choose AI Court. Prefer modern corporate style? Choose Become CEO.

### Technical

**Q: @everyone doesn't trigger agent responses?**
In the Discord Developer Portal, each Bot needs **Message Content Intent** and **Server Members Intent** enabled. The Bot's role in the server also needs View Channels permission. OpenClaw treats @everyone as an explicit mention for every Bot — once permissions are set correctly, it will trigger responses.

**Q: Agent reports permission errors after enabling sandbox?**
Sandbox mode set to `all` runs the agent inside a Docker container with a read-only filesystem, no network access, and no inherited environment variables by default. Fix:

```json
"sandbox": {
  "mode": "all",
  "workspaceAccess": "rw",
  "docker": {
    "network": "bridge",
    "env": { "LLM_API_KEY": "your-LLM-API-KEY" }
  }
}
```
- `workspaceAccess: "rw"` — Allows the sandbox to read/write the working directory
- `docker.network: "bridge"` — Enables network access
- `docker.env` — Passes in API keys (sandbox doesn't inherit host environment variables)

**Q: Will multiple users @mentioning the same agent cause conflicts?**
No. OpenClaw maintains independent sessions for each user × agent combination. Multiple people can @mention the War Ministry simultaneously — their conversations won't interfere with each other.

**Q: Can agents call each other?**
Yes. Agents can use `sessions_spawn` to delegate sub-tasks to other agents, or `sessions_send` to message another agent's session. For example, the Directorate of Ceremonial can assign coding tasks to the War Ministry.

**Q: How do I create custom Skills?**
OpenClaw has a built-in Skill Creator tool for creating custom Skills. Each Skill is a directory containing `SKILL.md` (instructions) + scripts + resources. Place it in the `skills/` directory of your workspace, and agents can use it immediately. You can also find community-shared Skills on [OpenClaw Skill Ecosystem](https://github.com/openclaw/openclaw).

**Q: How do I connect private models (Ollama, etc.)?**
Add an OpenAI API-compatible provider in the `models.providers` section of `openclaw.json`, pointing `baseUrl` to your Ollama address. Local Ollama models have zero API costs.

**Q: How do I troubleshoot Gateway startup failures?**
```bash
# Check detailed logs
journalctl --user -u openclaw-gateway --since today --no-pager

# Run diagnostics
openclaw doctor

# Common causes: missing API Key, malformed JSON, invalid Bot Token
```

**Q: Getting a "config invalid" error?**
Newer versions of OpenClaw removed some deprecated fields (like `runTimeoutSeconds`, `subagents.maxConcurrent`). If your config still contains these, you'll get a validation error. Fix:
```bash
# Auto-fix config
openclaw doctor --fix
```
Manual check: Make sure the `api` field in `models.providers` is a valid format (e.g., `"openai"`, `"anthropic"`) and not a placeholder.

**Q: Does it work on Windows?**
Yes! Via WSL2 (Windows Subsystem for Linux). See the [Windows WSL2 Installation Guide](./docs/windows-wsl.md).

</details>

---

## 🏛️ Join the Court

| Xiaohongshu (小红书) | WeChat Official: 菠言菠语 | WeChat Group: OpenClaw Emperors |
|:---:|:---:|:---:|
| <a href="https://www.xiaohongshu.com/user/profile/5a169df34eacab2bc9a7a22d"><img src="./images/avatar-xiaohongshu.png" width="180" style="border-radius:50%"/></a> | <img src="./images/qr-wechat-official.jpg" width="180"/> | <img src="./images/qr-wechat-group.png" width="180"/> |
| [@菠萝菠菠🍍](https://www.xiaohongshu.com/user/profile/5a169df34eacab2bc9a7a22d) | Follow for tutorials & updates | If QR expired, follow the official account for latest link |

---

## 🤝 Recommendations

- 🎁 [MiniMax Coding Plan](https://platform.minimaxi.com/subscribe/coding-plan?code=CIeSxc2iq2&source=link) — Exclusive 12% discount + Builder benefits

## Related Links

- 🏢 [Become CEO — Corporate Edition](https://github.com/wanikua/become-ceo) — Same architecture, modern corporate roles
- 🎭 [AI Court Skill — Chinese](https://github.com/wanikua/ai-court-skill)
- 🔧 [OpenClaw Framework](https://github.com/openclaw/openclaw) — The underlying framework for this project
- 📖 [OpenClaw Official Documentation](https://docs.openclaw.ai)

---

## ⚠️ Originality & Rights Notice

This project was first published on **February 22, 2026** ([Xiaohongshu promotional posts as early as February 20](https://www.xiaohongshu.com/discovery/item/6998638f000000000d0092fe?source=webshare)), and is the original creator of the "Three Departments & Six Ministries × AI Multi-Agent" concept. We discovered that a project created 21 hours later replicated 15/15 core design decisions without attribution. Full evidence chain: [GitHub Issue](https://github.com/cft0808/edict/issues/55) | [Rights Article (Chinese)](https://mp.weixin.qq.com/s/erVkoANrpZQFawMCNn6p9g). We welcome forks and derivatives — just give credit where it's due.

> 📌 **About Originality** — This project was first committed on **2026-02-22** ([commit history](https://github.com/wanikua/boluobobo-ai-court-tutorial/commits/main)) and represents the original implementation of the concept "modeling AI multi-agent collaboration after China's imperial court system." We noticed that [cft0808/edict](https://github.com/cft0808/edict) (first committed 2026-02-23, approximately 21 hours later) shares striking similarities in framework selection, SOUL.md persona files, deployment approach, and competitor comparison tables — see [Issue #55](https://github.com/cft0808/edict/issues/55) for details.
>
> **Reposts welcome — please credit the source.**
>
> 📕 Original Xiaohongshu series: [Day 3 of Being an AI Emperor — I'm Already Hooked](https://www.xiaohongshu.com/discovery/item/6998638f000000000d0092fe) | [Life of a Cyber Emperor: Give Orders Before Bed, AI Cranks Out Code Overnight](https://www.xiaohongshu.com/discovery/item/69a95dc3000000002801e886)

---

## 🛡️ Security Guide (Must-Read for Beginners)

### ⚠️ Don't Install on Your Personal Computer

**We strongly recommend using a cloud server — do not run agents on your personal machine:**

| | Cloud Server | Personal Computer |
|---|---|---|
| Files agents can access | Only the server workspace | **All your personal files** |
| If something breaks | Rebuild the server in 5 minutes | Personal files may be lost |
| API Key leak risk | Isolated on the server | Exposed in personal environment |
| 24/7 uptime | ✅ Server stays on | ❌ Shuts down when you close your laptop |

> 🔴 **Important**: Agents have **full read/write access** within their workspace, including command execution. If you set the workspace to `$HOME`, the agent can theoretically read and write all your files. On a cloud server this isn't an issue (the server exists for the agent); on a personal computer it's a security risk.

### 🔒 Workspace Permission Configuration (Important)

The `workspace` is the agent's "territory" — it can only read/write within this directory. Configuration principles:

```
✅ Recommended: Dedicated directory
"workspace": "/home/ubuntu/clawd"        ← Agent can only touch this directory

❌ Risky: Home directory
"workspace": "/home/ubuntu"              ← Agent can touch all your files

❌ Never do this: Root directory
"workspace": "/"                         ← Equivalent to giving the agent root access
```

**Sandbox Configuration Recommendations:**

| Mode | Description | Recommended For |
|------|-------------|----------------|
| `"mode": "all"` | Docker container isolation, most secure | Running untrusted code (War Ministry etc.) |
| `"mode": "non-main"` | Sandbox everything except the main agent | Default recommendation |
| `"mode": "off"` | No isolation, full system access | Directorate of Ceremonial / agents needing full access only |

```json
// Recommended: Enable sandbox in defaults, disable only for the Directorate
"agents": {
  "defaults": {
    "workspace": "/home/ubuntu/clawd",
    "sandbox": { "mode": "non-main" }
  },
  "list": [
    { "id": "silijian", "sandbox": { "mode": "off" } },
    { "id": "bingbu", "sandbox": { "mode": "all", "scope": "agent" } }
  ]
}
```

### 🔑 API Key Security

- **Don't** commit config files containing API Keys to public GitHub repos
- **Don't** share API Keys in group chats
- **Do** set usage limits on API Keys (in your LLM provider's dashboard)
- **Do** rotate keys periodically

---

## Disclaimer

This project is provided "as is" without any warranties, express or implied.

**Please note before use:**

1. **AI-generated content is for reference only**
   - Code, copy, suggestions, etc. generated by AI may contain errors or inaccuracies
   - Please review and verify before using in production
   - Human review is required for financial or security-sensitive operations

2. **Code Security**
   - Review AI-generated code before merging
   - Human review is mandatory for financial and security-sensitive operations

3. **API Key Security**
   - Keep your API keys safe
   - Don't commit config files with keys to public repos

4. **Server Costs**
   - Free-tier servers have usage limits
   - Excess usage may incur charges — watch your bills

5. **Data Backup**
   - Regularly backup your workspace and data
   - This project provides no data guarantees

---

v3.5.1 | MIT License

> 📜 This project is licensed under MIT. If you create derivative works or projects inspired by this architecture, please credit the original: [boluobobo-ai-court-tutorial](https://github.com/wanikua/boluobobo-ai-court-tutorial) by [@wanikua](https://github.com/wanikua)
