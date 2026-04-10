# CivAgent v4 — Claude Code Runtime

> 5000 Years of Governance Wisdom × AI Multi-Agent Orchestration

57 historical governance systems from 20 Chinese dynasties and 37 global empires, now running on **Claude Code + Codex + Gemini + 6 Chinese model backends**.

Choose your civilization. Command your AI team.

## Quick Start

```bash
# Install: add bin/ to PATH
export PATH="$HOME/Projects/civagent-v4/bin:$PATH"

# Check tools
civagent setup

# Browse 57 regimes
civagent list

# Switch to Tang Dynasty (checks & balances)
civagent switch china/tang

# Launch Claude Code with Tang Dynasty agents
civagent run

# Or with a specific prompt
civagent run "重构这个模块的代码"

# Override orchestration mode
civagent run --mode democratic "设计新的 API 接口"
```

## Architecture

```
civagent switch china/tang
     │
     ├── reads regimes/china/tang/{metadata.json, IDENTITY.md, SOUL.md}
     ├── generates ~/.civagent/agents.json (CC --agents format)
     └── generates ~/.civagent/CLAUDE.md (system prompt)

civagent run "task"
     │
     └── claude --agents <agents.json> --system-prompt-file CLAUDE.md
              │
              ├── 司礼监 (Sonnet) — coordinator
              ├── 兵部 (Opus/Codex) — engineering
              ├── 都察院 (Codex review) — code review
              ├── 户部 (cn:qwen) — data / SQL
              ├── 翰林院 (Gemini) — research
              ├── 工部 (Sonnet) — DevOps
              ├── 礼部 (Sonnet) — content
              ├── 刑部 (Sonnet) — legal
              └── 吏部 (Sonnet) — management
```

## 6 Orchestration Modes

| Mode | Historical Model | Pattern | Best For |
|------|-----------------|---------|----------|
| **centralized** | Qin, Yuan, Napoleon | Single coordinator, no review | Urgent tasks |
| **checks-balances** | Tang, Venice, US Federal | Draft → Review → Execute | Code with QA |
| **dual-track** | Ming, Sparta, Liao | Two independent chains | Security-critical |
| **federation** | Zhou, HRE, Persia | Autonomous domains | Large parallel tasks |
| **democratic** | Athens, Mongol, Viking | Majority vote | Hard problems |
| **theocratic** | Shang, Egypt | Supreme agent | Emergency fixes |

## Multi-Model Routing

| Role | Primary | Alternative |
|------|---------|-------------|
| Coordinator | Sonnet | — |
| Engineering | **Opus** | **Codex** (GPT-5.4) |
| Review | **Opus** | **Codex** adversarial-review |
| Research | **Opus** | **Gemini** (1M context) |
| Data/SQL | Sonnet | **cn:qwen** |
| Long docs | Sonnet | **cn:kimi** (128K) |
| Math | Sonnet | **cn:stepfun** |

## 57 Regimes

**Chinese Dynasties (20):** 夏 · 商 · 周 · 秦 · 汉 · 三国 · 晋 · 南北朝 · 隋 · 唐 · 五代 · 宋 · 辽 · 西夏 · 金 · 元 · 明 · 清 · 太平天国 · 中华民国

**Global Empires (37):** Athens · Sparta · Roman Republic · Roman Empire · Byzantine · Persia · Ottoman · British · French · Prussian · Russian · Habsburg · HRE · US Federal · Venice · Sumer · Egypt · Carthage · Maurya · Khmer · Mongol · Safavid · Caliphate · Aztec · Inca · Shogunate · Meiji · Joseon · Mali · Zulu · Mughal · Soviet · EU · Napoleon · Polo · Swiss · Viking

## Project Structure

```
civagent-v4/
├── bin/civagent              # CLI launcher
├── engine/
│   ├── regime-to-cc.mjs      # Regime → CC agents converter
│   ├── modes/ (6)             # Orchestration mode definitions
│   └── models/providers.json  # Multi-model routing config
├── regimes/
│   ├── china/ (20)
│   └── global/ (37)
├── CREDITS.md
└── CHANGELOG.md
```

## Credits

- **Original concept**: [AI 朝廷](https://github.com/wanikua/danghuangshang) by [@wanikua](https://github.com/wanikua)
- **Plugin architecture**: Inspired by [openai/codex-plugin-cc](https://github.com/openai/codex-plugin-cc)
- **CivAgent v4**: Claude Code runtime by [@LeoLin990405](https://github.com/LeoLin990405)

See [CREDITS.md](./CREDITS.md) for full attribution.

## License

MIT
