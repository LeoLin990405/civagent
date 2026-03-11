[中文版](./README.md) | [Original Project](https://github.com/wanikua/boluobobo-ai-court-tutorial)

# 🏛️ AI Governance — Manage Your AI Team with 39 Historical Government Systems

### 20 Chinese Dynasties + 19 Global Empires · Pure Config Switching · Zero Code · Built on OpenClaw

<p align="center">
  <img src="https://img.shields.io/badge/Regimes-39-gold?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Chinese_Dynasties-20-red?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Global_Empires-19-blue?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Framework-OpenClaw-green?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Code_Changes-Zero-orange?style=for-the-badge" />
</p>

<div align="center">

### 👑 Choose Your Government, Switch Instantly

```bash
# Qin Dynasty's centralized autocracy
./scripts/switch-regime.sh china/qin

# Athenian direct democracy
./scripts/switch-regime.sh global/athens

# US separation of powers
./scripts/switch-regime.sh global/us-federal

# View all 39 regimes
./scripts/list-regimes.sh
```

</div>

---

## Acknowledgments

> **This project is built upon [@wanikua](https://github.com/wanikua)'s [AI 朝廷 (AI Court)](https://github.com/wanikua/boluobobo-ai-court-tutorial).**

Without wanikua's original idea — mapping ancient Chinese governmental structures to AI multi-agent collaboration — this project would not exist. "AI Court" was first published on February 22, 2026, pioneering the combination of the Tang Dynasty's Three Departments and Six Ministries system with the OpenClaw multi-agent framework, enabling anyone to build their own "AI Imperial Court" with a single command.

**The original Tang Dynasty configuration is preserved unchanged in `regimes/china/tang/`.**

My deepest gratitude to wanikua for this brilliantly creative and inspiring open-source contribution.

See [CREDITS.md](./CREDITS.md) for full attribution.

---

## About the Author & How This Project Came to Be

I'm an undergraduate history major and an AI programming enthusiast.

This semester I've been studying **World Political History** — from Athenian direct democracy to the Roman Senate, from Persian satrapies to the Mongol Kurultai. Different civilizations across different eras have all been trying to answer the same fundamental question: **How do you organize a group of people (or a group of agents) to collaborate effectively?**

At the same time, I've been reading **"Political Gains and Losses Across Chinese Dynasties"** (《中国历代政治得失》) by **Qian Mu**, one of the most influential historians of modern China. Qian Mu systematically analyzed the political systems of five dynasties — Han, Tang, Song, Ming, and Qing — not simply judging them as good or bad, but seeking to understand why each system was designed the way it was in its historical context, what problems it solved, and what pitfalls it left behind. While reading, a thought kept surfacing: **The design logic behind these political systems is strikingly similar to modern agent orchestration patterns in software architecture.**

- Qin's Three Lords and Nine Ministers = strict centralized hierarchical scheduling
- Tang's Three Departments and Six Ministries = multi-node checks & balances
- Ming's Grand Secretariat + Directorate of Ceremonial = dual-track approval (dual power)
- Zhou's feudal enfeoffment = loosely federated autonomous units
- Athenian citizens' assembly = equal-node democratic voting

Then I came across wanikua's [AI Court](https://github.com/wanikua/boluobobo-ai-court-tutorial) project — **and it had already built the first step of this idea!** Using the Tang Dynasty's Three Departments and Six Ministries to orchestrate AI agents — genuinely brilliant.

So I thought: if Tang works, **why not implement every classic government system in human history?** From the Xia Dynasty to the Taiping Heavenly Kingdom, from Ancient Egypt to the Soviet Union — every system is an organizational architecture that was battle-tested by our predecessors over centuries. Turn them all into pure configuration modules, let everyone switch between them with a single command — and that's how **AI Governance** was born.

This project isn't about judging which system is better or worse. It's about exploring: **how do different organizational patterns produce different collaboration outcomes in different scenarios?** Centralized hierarchy excels at rapid execution. Checks and balances ensure quality control. Federated autonomy enables parallel teamwork... These lessons, validated by our ancestors through blood and tears, might genuinely help with today's AI orchestration challenges.

**History isn't just the past — it's a living fossil of organizational wisdom.**

---

## What Is This Project?

**AI Governance** maps 39 classic government systems from human history — from the Xia Dynasty's clan system to the US separation of powers — onto AI multi-agent collaboration architectures. Each regime is a pure configuration module (JSON + Markdown). Switching regimes requires zero code changes.

**Core idea:** Ancient governance wisdom = modern AI team management best practices.

---

## Regime Catalog

### Chinese Dynasties (20)

| # | ID | Dynasty | Era | System | Agent Pattern | Agents |
|---|-----|---------|-----|--------|--------------|--------|
| 1 | `china/xia` | Xia | c.2070-1600 BC | Clan Enfeoffment | Patriarch + loose tribes | 5 |
| 2 | `china/shang` | Shang | c.1600-1046 BC | Theocratic Aristocracy | Divine decision + noble execution | 6 |
| 3 | `china/zhou` | Zhou | c.1046-256 BC | Patriarchal Enfeoffment | Federated autonomy | 8 |
| 4 | `china/qin` | Qin | 221-206 BC | Three Lords Nine Ministers | Strict centralized hierarchy | 7 |
| 5 | `china/han` | Han | 206 BC-220 AD | Three Lords Nine Ministers | Tripartite division + specialized ministers | 10 |
| 6 | `china/three-kingdoms` | Three Kingdoms | 220-280 | Three Rival States | 3 independent courts competing | 9 |
| 7 | `china/jin` | Jin | 266-420 | Nine-Rank System | Weak center + strong regions | 6 |
| 8 | `china/north-south` | N&S Dynasties | 420-589 | Aristocratic Clans | Clan faction autonomy | 6 |
| 9 | `china/sui` | Sui | 581-618 | Three Depts Six Min (proto) | Checks & balances (prototype) | 7 |
| 10 | `china/tang` | **Tang** ⭐ | 618-907 | **Three Depts Six Min (perfected)** | **ORIGINAL by @wanikua** | 7 |
| 11 | `china/five-dynasties` | Five Dynasties | 907-960 | Fragmented Warlords | Competing units | 5 |
| 12 | `china/song` | Song | 960-1279 | Two Offices Three Commissions | Civilian checks + rotation | 8 |
| 13 | `china/yuan` | Yuan | 1271-1368 | Provincial System | Mongol centralization + provincial agents | 7 |
| 14 | `china/ming` | Ming | 1368-1644 | Grand Secretariat + Eunuch Dir. | Dual-track decision-making | 8 |
| 15 | `china/qing` | Qing | 1644-1912 | Grand Council | Elite council rapid decisions | 8 |
| 16 | `china/roc` | Republic of China | 1912-1949 | Five-Power Constitution | Five Yuans mutual oversight | 7 |
| 17 | `china/liao` | Liao | 907-1125 | Dual Administration | North-South dual tracks | 6 |
| 18 | `china/jin-jurchen` | Jin (Jurchen) | 1115-1234 | Jurchen-Han Divided Gov. | Ethnic division of labor | 6 |
| 19 | `china/western-xia` | Western Xia | 1038-1227 | Multi-ethnic Prefectures | Military-first + religious support | 5 |
| 20 | `china/taiping` | Taiping Kingdom | 1851-1864 | Theocratic Autocracy | Heavenly King absolute power | 7 |

### Global Empires (19)

| # | ID | Empire | Era | System | Agent Pattern | Agents |
|---|-----|--------|-----|--------|--------------|--------|
| 1 | `global/egypt` | Ancient Egypt | 3100-30 BC | Pharaoh Theocracy | God-King + Vizier delegation | 6 |
| 2 | `global/athens` | Athenian Democracy | 508-322 BC | Direct Democracy | All agents vote, no single leader | 6 |
| 3 | `global/sparta` | Sparta | 900-192 BC | Dual Kingship | Two co-leaders + Ephors oversight | 6 |
| 4 | `global/roman-republic` | Roman Republic | 509-27 BC | Senate + Consuls | Dual consuls + Senate voting | 8 |
| 5 | `global/roman-empire` | Roman Empire | 27 BC-476 AD | Imperial Bureaucracy | Emperor + Prefects hierarchy | 7 |
| 6 | `global/byzantine` | Byzantine Empire | 330-1453 | Autocratic Theocracy | Basileus + Logothetes | 7 |
| 7 | `global/persian` | Persian Achaemenid | 550-330 BC | Satrap System | King of Kings + autonomous Satraps | 7 |
| 8 | `global/ottoman` | Ottoman Empire | 1299-1922 | Sultan + Divan | Grand Vizier dispatches | 7 |
| 9 | `global/mongol` | Mongol Empire | 1206-1368 | Khanate Kurultai | Great Khan + Kurultai council | 6 |
| 10 | `global/hre` | Holy Roman Empire | 962-1806 | Electoral System | Electors + autonomous Princes | 7 |
| 11 | `global/british` | British Parliament | 1689-present | Constitutional Monarchy | PM governs, Crown ceremonial | 8 |
| 12 | `global/french` | French Absolutism | 1643-1789 | L'etat c'est moi | Sun King absolute | 7 |
| 13 | `global/russian` | Russian Tsardom | 1547-1917 | Autocracy + Council | Tsar absolute + Senate advisory | 7 |
| 14 | `global/shogunate` | Japanese Shogunate | 1603-1868 | Bakufu System | Shogun rules, Emperor ceremonial | 7 |
| 15 | `global/mughal` | Mughal India | 1526-1857 | Mansabdar System | Emperor + ranked officials | 7 |
| 16 | `global/us-federal` | US Federal System | 1789-present | Three Branches | Separation of powers | 7 |
| 17 | `global/soviet` | Soviet Union | 1922-1991 | Politburo System | General Secretary + Politburo | 7 |
| 18 | `global/inca` | Inca Empire | 1438-1533 | Sapa Inca + Quarters | Sapa Inca + 4 Suyus | 6 |
| 19 | `global/aztec` | Aztec Triple Alliance | 1428-1521 | Triple Alliance | 3 city-states council | 6 |

---

## 6 Orchestration Patterns

Each regime maps to one of six agent orchestration patterns:

| Pattern | Representative Regimes | Characteristics | Best For |
|---------|----------------------|-----------------|----------|
| **Centralized Hierarchy** | Qin, Yuan, Egypt, French, Soviet | Single main agent controls all subagents | Rapid decision & execution |
| **Checks & Balances** | Tang, Song, Sui, Roman Republic, US | Multiple top-level agents cross-review | Quality control |
| **Dual Power** | Ming (Cabinet + Eunuchs), Sparta, Liao | Two main-level agents share authority | Dual approval workflows |
| **Federated Autonomy** | Zhou, Three Kingdoms, HRE, Persian | Independent agent groups, minimal coordination | Parallel multi-team work |
| **Democratic Council** | Athens, Mongol Kurultai | Equal-rank agents, voting mechanism | Collective wisdom |
| **Theocratic** | Shang, Taiping, Egypt, Byzantine | Supreme agent with absolute authority | Strong leadership |

---

## Quick Start

### 1. Install OpenClaw

```bash
# Linux
bash <(curl -fsSL https://raw.githubusercontent.com/wanikua/boluobobo-ai-court-tutorial/main/install.sh)

# macOS
bash <(curl -fsSL https://raw.githubusercontent.com/wanikua/boluobobo-ai-court-tutorial/main/install-mac.sh)
```

### 2. Clone This Project

```bash
git clone https://github.com/LeoLin990405/boluobobo-ai-court-tutorial.git ai-governance
cd ai-governance
```

### 3. Choose a Regime

```bash
# List all available regimes
./scripts/list-regimes.sh

# Switch to your chosen regime (e.g., Qin centralized hierarchy)
./scripts/switch-regime.sh china/qin
```

### 4. Configure API Keys & Launch

```bash
# Edit config — add your API Key and Bot Token
nano ~/.openclaw/openclaw.json

# Start
openclaw gateway restart
```

---

## Switching Regimes

```bash
# View current regime
cat ~/.openclaw/.active-regime

# Switch to a new regime (auto-backs up current config)
./scripts/switch-regime.sh global/athens

# Restart to take effect
openclaw gateway restart
```

The switch automatically:
1. Backs up your current SOUL.md / IDENTITY.md / openclaw.json
2. Deploys the new regime's configuration files
3. Preserves your API Keys and Bot Tokens

---

## Creating Custom Regimes

```bash
# Scaffold a new regime from template
./scripts/create-regime.sh global/your-empire

# Edit the 5 config files
# Validate
./scripts/validate-regime.sh global/your-empire
```

See the [Regime Design Guide](./docs/regime-design-guide.md) for details.

---

## Project Structure

```
ai-governance/
├── CREDITS.md                 # Attribution to @wanikua
├── regimes/                   # Core: all regime configurations
│   ├── _template/             # Regime scaffold (5 files)
│   ├── china/                 # 20 Chinese dynasties
│   │   ├── tang/              # ⭐ Original (preserved unchanged)
│   │   ├── qin/               # Qin · Three Lords Nine Ministers
│   │   ├── han/               # Han · Three Lords Nine Ministers
│   │   └── ...
│   └── global/                # 19 global empires
│       ├── athens/            # Athens · Direct Democracy
│       ├── roman-republic/    # Rome · Senate + Consuls
│       └── ...
├── scripts/                   # Regime management tools
│   ├── switch-regime.sh       # Switch active regime
│   ├── list-regimes.sh        # List all regimes
│   ├── validate-regime.sh     # Validate regime config
│   └── create-regime.sh       # Scaffold new regime
├── docs/
│   └── regime-design-guide.md # How to design new regimes
├── install.sh                 # Install script (original)
├── gui/                       # Web dashboard (original)
└── skills/                    # OpenClaw Skills (original)
```

Each regime contains 5 files:

| File | Purpose |
|------|---------|
| `metadata.json` | Machine-readable metadata (name, era, tags, etc.) |
| `openclaw.json.template` | OpenClaw agent config template (agent definitions, bindings, model assignments) |
| `SOUL.md` | Era-themed behavioral rules (language style, interaction norms, taboos) |
| `IDENTITY.md` | Org chart + role mapping table + collaboration workflow |
| `README.md` | Description + historical background + usage examples |

---

## FAQ

**Q: What's the relationship to the original AI Court project?**
AI Governance is an extended fork of [AI Court](https://github.com/wanikua/boluobobo-ai-court-tutorial). The original Tang Dynasty configuration is fully preserved in `regimes/china/tang/`. We've added 38 new regimes on top. All original features (install scripts, GUI, Skills) remain unchanged.

**Q: Do I need to change code to switch regimes?**
No. Each regime is a pure config module (JSON + Markdown). Just run `switch-regime.sh`.

**Q: Can I create my own regime?**
Absolutely. Run `create-regime.sh` to scaffold from the template, fill in the 5 config files, and you're done. PRs for new regimes are welcome!

**Q: Which regime is best for me?**

| Your Need | Recommended Regime | Why |
|-----------|-------------------|-----|
| Fast execution, no discussion needed | Qin (centralized) | Chancellor controls everything, commands go straight through |
| Quality review, error prevention | Tang (checks) / US (three branches) | Multi-party cross-review, layered oversight |
| Multiple teams competing in parallel | Three Kingdoms (federated) | Wei, Shu, Wu each independent, competition yields best results |
| Collective discussion, democratic decisions | Athens (democratic council) | All agents vote as equals |
| Dual approval process | Ming (dual power) | Cabinet drafts + Eunuch Directorate approves |
| Strong leadership, fast push | Soviet (centralized) | General Secretary + Politburo efficient decisions |

**Q: Is the historical content accurate?**
I've done my best to ensure historical accuracy (I am a history major, after all), but this project's core purpose is AI agent orchestration, not an academic paper. If you spot any historical errors, Issues and PRs are very welcome!

---

## Inspirations & References

### Direct Inspirations

- [AI 朝廷 (AI Court)](https://github.com/wanikua/boluobobo-ai-court-tutorial) by [@wanikua](https://github.com/wanikua) — the original concept and Tang Dynasty implementation that sparked this entire project
- [OpenClaw](https://github.com/openclaw/openclaw) — the underlying multi-agent framework

### Chinese Political Institutional History

These works helped me understand the design logic behind each dynasty's system — not simple good-vs-bad judgments, but rational choices under specific historical conditions:

- **Qian Mu, *Political Gains and Losses Across Chinese Dynasties*** (《中国历代政治得失》) — The core inspiration for this project. Qian Mu's comparative analysis of Han, Tang, Song, Ming, and Qing institutions revealed the design logic behind "three-department checks," "Grand Secretariat drafting," and "Grand Council rapid decisions"
- **Qian Mu, *Outline of National History*** (《国史大纲》) — Institutional evolution from a general history perspective; understanding why each dynasty reformed the way it did
- **Lü Simian, *History of Chinese Institutions*** (《中国制度史》) — Systematic thematic survey of official, military, legal, and fiscal systems — key reference for designing agent roles across dynasties
- **Bai Gang (ed.), *History of Chinese Political Institutions*** (《中国政治制度史》) — Comprehensive institutional history from pre-Qin to modern era, covering all 20 Chinese dynasties in this project
- **Yan Buke, *Rank and Office: The Bureaucratic Ranking System from Qin-Han to Wei-Jin-Southern & Northern Dynasties*** (《品位与职位》) — Deep analysis of how the Nine-Rank system shaped bureaucratic selection; directly inspired the Jin and N&S Dynasties agent designs
- **Tian Yuqing, *Aristocratic Politics in the Eastern Jin*** (《东晋门阀政治》) — How aristocratic clans hollowed out imperial authority to create a "weak center + strong regions" pattern; inspired the federated autonomy model
- **Ray Huang, *1587, A Year of No Significance*** (《万历十五年》) — Micro-level view of how the Ming dual-track system (Grand Secretariat + Eunuch Directorate) operated and malfunctioned; directly shaped the Ming dual-power design
- **Yang Kuan, *History of the Warring States*** (《战国史》) — Understanding the institutional transition from enfeoffment to commandery-county, inspiring the Zhou→Qin orchestration pattern shift
- **Yao Dali, *The Wisdom of Reading History*** (《读史的智慧》) — Governance logic of multi-ethnic empires (Yuan, Qing); understanding the "govern by local customs" approach of the Liao-Jin-Yuan-Qing models

### Western Political Theory & Comparative Politics

Different civilizations gave radically different answers to the same question. These comparative perspectives helped me design the global empires' agent orchestration:

- **Aristotle, *Politics*** — The earliest systematic classification of regimes: monarchy, aristocracy, polity and their corrupted forms. This project's 6 orchestration patterns are, in a sense, Aristotle's taxonomy rewritten for AI
- **Montesquieu, *The Spirit of the Laws*** (1748) — Foundation of separation of powers theory; directly maps to the US Federal and checks-and-balances pattern designs
- **Max Weber, *Economy and Society*** (1922) — Classic analysis of rational bureaucracy: hierarchy, specialization, rule-orientation. Weber's comparison of Chinese traditional bureaucracy vs. Western legal-rational authority helped me understand agent hierarchy design across regimes
- **S.N. Eisenstadt, *The Political Systems of Empires*** (1963) — Systematic comparison of political structures across history's major empires; the theoretical framework for designing global empire orchestration patterns
- **Francis Fukuyama, *The Origins of Political Order*** (2011) — Analyzing political development through state-building, rule of law, and accountability; helps explain why some regimes tend toward centralization while others toward checks and balances
- **Charles Tilly, *Coercion, Capital, and European States*** (1990) — Explains the diversity of European state forms (from city-states to empires); inspired differentiated designs for the HRE and British parliamentary system
- **Samuel Huntington, *Political Order in Changing Societies*** (1968) — Theory of political institutionalization; explains why some regimes are stable while others collapse
- **Douglass North, *Institutions, Institutional Change and Economic Performance*** (1990) — Foundational work of new institutional economics; how institutions constrain and incentivize behavior — which is precisely what SOUL.md and IDENTITY.md do
- **Mancur Olson, *The Logic of Collective Action*** (1965) — Why democratic council patterns (Athens, Kurultai) need special incentive mechanisms to function effectively
- **Karl Wittfogel, *Oriental Despotism*** (1957) — Controversial, but his thesis on hydraulic empires and centralized institutions remains a useful reference for understanding Qin-Han, Egyptian, and Inca centralized regimes

### Organizational Theory & Multi-Agent Systems

The bridge between ancient political institutions and modern organizational/AI architecture:

- **Herbert Simon, *Administrative Behavior*** (1947) — Bounded rationality and hierarchical organization theory; explains why centralized hierarchy can actually be efficient under limited information
- **Wooldridge & Jennings, "Intelligent Agents: Theory and Practice"** (*The Knowledge Engineering Review*, 1995) — Classic survey of multi-agent systems; agent properties (autonomy, social ability, reactivity) map onto ancient bureaucratic role characteristics
- **Dorri, Kanhere & Jurdak, "Multi-Agent Systems: A Survey"** (*IEEE Access*, 2018) — Modern MAS architecture taxonomy; hierarchical, flat, and hybrid categories correspond closely to this project's 6 orchestration patterns

### Courses & General

- World Political History coursework — A systematic look at institutional design wisdom from Ancient Egypt to the Cold War
- [Crash Course: World History](https://www.youtube.com/playlist?list=PLBDA2E52FB1EF80C9) by John Green — Introductory but uniquely cross-civilizational perspective that inspired many comparative insights

---

## Links

- 🏛️ [Original Project: AI Court](https://github.com/wanikua/boluobobo-ai-court-tutorial) — by [@wanikua](https://github.com/wanikua)
- 🏢 [Become CEO — Corporate Edition](https://github.com/wanikua/become-ceo) — same architecture, modern corporate roles
- 🔧 [OpenClaw Framework](https://github.com/openclaw/openclaw)
- 📖 [OpenClaw Documentation](https://docs.openclaw.ai)
- 📕 [《中国历代政治得失》by Qian Mu](https://book.douban.com/subject/1003479/)

---

MIT License | Based on [AI 朝廷](https://github.com/wanikua/boluobobo-ai-court-tutorial) by [@wanikua](https://github.com/wanikua)
