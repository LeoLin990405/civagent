[中文版](./README.md) | [Original Project](https://github.com/wanikua/boluobobo-ai-court-tutorial)

# 🏛️ AI Governance — Manage Your AI Team with 57 Historical Government Systems

### 20 Chinese Dynasties + 37 Global Empires · Pure Config Switching · Zero Code · Built on OpenClaw

<p align="center">
  <img src="https://img.shields.io/badge/Regimes-57-gold?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Chinese_Dynasties-20-red?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Global_Empires-37-blue?style=for-the-badge" />
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

By day I'm a data professional — writing SQL, running ETL pipelines, staring at dashboards. By night I'm an online part-time history undergraduate and an AI programming enthusiast.

This semester I've been studying **World Political History** — from Athenian direct democracy to the Roman Senate, from Persian satrapies to the Mongol Kurultai. Different civilizations across different eras have all been trying to answer the same fundamental question: **How do you organize a group of people (or a group of agents) to collaborate effectively?** As a data person, I'm naturally fascinated by "how systems work" — a government's organizational structure is essentially a distributed system's topology design.

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

**AI Governance** maps 57 classic government systems from human history — from the Xia Dynasty's clan system to the US separation of powers — onto AI multi-agent collaboration architectures. Each regime is a pure configuration module (JSON + Markdown). Switching regimes requires zero code changes.

**Core idea:** Ancient governance wisdom = modern AI team management best practices.

---

## Regime Catalog

### Chinese Dynasties (20)

| # | ID | Dynasty | Era | System | Agent Pattern | Agents |
|---|-----|---------|-----|--------|--------------|--------|
| 1 | `china/xia` | [Xia](./regimes/china/xia/README.md) | c.2070-1600 BC | Clan Enfeoffment | Patriarch + loose tribes | 5 |
| 2 | `china/shang` | [Shang](./regimes/china/shang/README.md) | c.1600-1046 BC | Theocratic Aristocracy | Divine decision + noble execution | 6 |
| 3 | `china/zhou` | [Zhou](./regimes/china/zhou/README.md) | c.1046-256 BC | Patriarchal Enfeoffment | Federated autonomy | 8 |
| 4 | `china/qin` | [Qin](./regimes/china/qin/README.md) | 221-206 BC | Three Lords Nine Ministers | Strict centralized hierarchy | 7 |
| 5 | `china/han` | [Han](./regimes/china/han/README.md) | 206 BC-220 AD | Three Lords Nine Ministers | Tripartite division + specialized ministers | 10 |
| 6 | `china/three-kingdoms` | [Three Kingdoms](./regimes/china/three-kingdoms/README.md) | 220-280 | Three Rival States | 3 independent courts competing | 9 |
| 7 | `china/jin` | [Jin](./regimes/china/jin/README.md) | 266-420 | Nine-Rank System | Weak center + strong regions | 6 |
| 8 | `china/north-south` | [N&S Dynasties](./regimes/china/north-south/README.md) | 420-589 | Aristocratic Clans | Clan faction autonomy | 6 |
| 9 | `china/sui` | [Sui](./regimes/china/sui/README.md) | 581-618 | Three Depts Six Min (proto) | Checks & balances (prototype) | 7 |
| 10 | `china/tang` | [**Tang** ⭐](./regimes/china/tang/README.md) | 618-907 | **Three Depts Six Min (perfected)** | **ORIGINAL by @wanikua** | 7 |
| 11 | `china/five-dynasties` | [Five Dynasties](./regimes/china/five-dynasties/README.md) | 907-960 | Fragmented Warlords | Competing units | 5 |
| 12 | `china/song` | [Song](./regimes/china/song/README.md) | 960-1279 | Two Offices Three Commissions | Civilian checks + rotation | 8 |
| 13 | `china/yuan` | [Yuan](./regimes/china/yuan/README.md) | 1271-1368 | Provincial System | Mongol centralization + provincial agents | 7 |
| 14 | `china/ming` | [Ming](./regimes/china/ming/README.md) | 1368-1644 | Grand Secretariat + Eunuch Dir. | Dual-track decision-making | 8 |
| 15 | `china/qing` | [Qing](./regimes/china/qing/README.md) | 1644-1912 | Grand Council | Elite council rapid decisions | 8 |
| 16 | `china/roc` | [Republic of China](./regimes/china/roc/README.md) | 1912-1949 | Five-Power Constitution | Five Yuans mutual oversight | 7 |
| 17 | `china/liao` | [Liao](./regimes/china/liao/README.md) | 907-1125 | Dual Administration | North-South dual tracks | 6 |
| 18 | `china/jin-jurchen` | [Jin (Jurchen)](./regimes/china/jin-jurchen/README.md) | 1115-1234 | Jurchen-Han Divided Gov. | Ethnic division of labor | 6 |
| 19 | `china/western-xia` | [Western Xia](./regimes/china/western-xia/README.md) | 1038-1227 | Multi-ethnic Prefectures | Military-first + religious support | 5 |
| 20 | `china/taiping` | [Taiping Kingdom](./regimes/china/taiping/README.md) | 1851-1864 | Theocratic Autocracy | Heavenly King absolute power | 7 |

### Global Empires (37)

| # | ID | Empire | Era | System | Agent Pattern | Agents |
|---|-----|--------|-----|--------|--------------|--------|
| 1 | `global/egypt` | [Ancient Egypt](./regimes/global/egypt/README.md) | 3100-30 BC | Pharaoh Theocracy | God-King + Vizier delegation | 6 |
| 2 | `global/athens` | [Athenian Democracy](./regimes/global/athens/README.md) | 508-322 BC | Direct Democracy | All agents vote, no single leader | 6 |
| 3 | `global/sparta` | [Sparta](./regimes/global/sparta/README.md) | 900-192 BC | Dual Kingship | Two co-leaders + Ephors oversight | 6 |
| 4 | `global/roman-republic` | [Roman Republic](./regimes/global/roman-republic/README.md) | 509-27 BC | Senate + Consuls | Dual consuls + Senate voting | 8 |
| 5 | `global/roman-empire` | [Roman Empire](./regimes/global/roman-empire/README.md) | 27 BC-476 AD | Imperial Bureaucracy | Emperor + Prefects hierarchy | 7 |
| 6 | `global/byzantine` | [Byzantine Empire](./regimes/global/byzantine/README.md) | 330-1453 | Autocratic Theocracy | Basileus + Logothetes | 7 |
| 7 | `global/persian` | [Persian Achaemenid](./regimes/global/persian/README.md) | 550-330 BC | Satrap System | King of Kings + autonomous Satraps | 7 |
| 8 | `global/ottoman` | [Ottoman Empire](./regimes/global/ottoman/README.md) | 1299-1922 | Sultan + Divan | Grand Vizier dispatches | 7 |
| 9 | `global/mongol` | [Mongol Empire](./regimes/global/mongol/README.md) | 1206-1368 | Khanate Kurultai | Great Khan + Kurultai council | 6 |
| 10 | `global/hre` | [Holy Roman Empire](./regimes/global/hre/README.md) | 962-1806 | Electoral System | Electors + autonomous Princes | 7 |
| 11 | `global/british` | [British Parliament](./regimes/global/british/README.md) | 1689-present | Constitutional Monarchy | PM governs, Crown ceremonial | 8 |
| 12 | `global/french` | [French Absolutism](./regimes/global/french/README.md) | 1643-1789 | L'etat c'est moi | Sun King absolute | 7 |
| 13 | `global/russian` | [Russian Tsardom](./regimes/global/russian/README.md) | 1547-1917 | Autocracy + Council | Tsar absolute + Senate advisory | 7 |
| 14 | `global/shogunate` | [Japanese Shogunate](./regimes/global/shogunate/README.md) | 1603-1868 | Bakufu System | Shogun rules, Emperor ceremonial | 7 |
| 15 | `global/mughal` | [Mughal India](./regimes/global/mughal/README.md) | 1526-1857 | Mansabdar System | Emperor + ranked officials | 7 |
| 16 | `global/us-federal` | [US Federal System](./regimes/global/us-federal/README.md) | 1789-present | Three Branches | Separation of powers | 7 |
| 17 | `global/soviet` | [Soviet Union](./regimes/global/soviet/README.md) | 1922-1991 | Politburo System | General Secretary + Politburo | 7 |
| 18 | `global/inca` | [Inca Empire](./regimes/global/inca/README.md) | 1438-1533 | Sapa Inca + Quarters | Sapa Inca + 4 Suyus | 6 |
| 19 | `global/aztec` | [Aztec Triple Alliance](./regimes/global/aztec/README.md) | 1428-1521 | Triple Alliance | 3 city-states council | 6 |
| 20 | `global/sumeria` | [Sumerian City-States](./regimes/global/sumeria/README.md) | c.4500-1900 BC | Temple Economy | Dual priest-king authority | 6 |
| 21 | `global/carthage` | [Carthaginian Republic](./regimes/global/carthage/README.md) | 814-146 BC | Merchant Oligarchy | Dual Suffetes + Senate | 7 |
| 22 | `global/maurya` | [Maurya Empire](./regimes/global/maurya/README.md) | 322-185 BC | Arthashastra System | Emperor + spy network | 7 |
| 23 | `global/caliphate` | [Abbasid Caliphate](./regimes/global/caliphate/README.md) | 750-1258 | Caliphate-Vizier System | Knowledge-enhanced centralization | 7 |
| 24 | `global/viking` | [Viking Thing](./regimes/global/viking/README.md) | 800-1100 | Thing Assembly | Consensus-based assembly | 5 |
| 25 | `global/venice` | [Venetian Republic](./regimes/global/venice/README.md) | 697-1797 | Doge + Great Council | Anti-corruption checks | 7 |
| 26 | `global/mali` | [Mali Empire](./regimes/global/mali/README.md) | 1235-1600 | Mansa System | Oral tradition + trade network | 6 |
| 27 | `global/khmer` | [Khmer Empire](./regimes/global/khmer/README.md) | 802-1431 | Devaraja System | God-king + hydraulic state | 6 |
| 28 | `global/safavid` | [Safavid Empire](./regimes/global/safavid/README.md) | 1501-1736 | Shi'a Theocratic Monarchy | Shah + religious authority | 7 |
| 29 | `global/joseon` | [Joseon Korea](./regimes/global/joseon/README.md) | 1392-1897 | Neo-Confucian Bureaucracy | Three Offices censorial checks | 7 |
| 30 | `global/habsburg` | [Habsburg Austria-Hungary](./regimes/global/habsburg/README.md) | 1867-1918 | Dual Monarchy | Dual parliaments | 7 |
| 31 | `global/polish` | [Polish-Lithuanian Commonwealth](./regimes/global/polish/README.md) | 1569-1795 | Elective Monarchy | Liberum veto + Sejm | 6 |
| 32 | `global/napoleon` | [Napoleonic Empire](./regimes/global/napoleon/README.md) | 1804-1815 | Meritocratic Centralization | Merit-based + Code Napoléon | 7 |
| 33 | `global/prussia` | [Kingdom of Prussia](./regimes/global/prussia/README.md) | 1701-1918 | Military Bureaucracy | General Staff system | 6 |
| 34 | `global/meiji` | [Meiji Japan](./regimes/global/meiji/README.md) | 1868-1912 | Constitutional Monarchy | Genrō informal power | 7 |
| 35 | `global/eu` | [European Union](./regimes/global/eu/README.md) | 1993-present | Supranational Governance | Trilogue co-decision | 7 |
| 36 | `global/swiss` | [Swiss Confederation](./regimes/global/swiss/README.md) | 1291-present | Direct Democracy | Referendum + collegiality | 6 |
| 37 | `global/zulu` | [Zulu Kingdom](./regimes/global/zulu/README.md) | 1816-1897 | Military Regimental | King + regimental hierarchy | 5 |

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
AI Governance is an extended fork of [AI Court](https://github.com/wanikua/boluobobo-ai-court-tutorial). The original Tang Dynasty configuration is fully preserved in `regimes/china/tang/`. We've added 56 new regimes on top. All original features (install scripts, GUI, Skills) remain unchanged.

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

### Chinese Political Institutional History — General

These works helped me understand the design logic behind each dynasty's system — not simple good-vs-bad judgments, but rational choices under specific historical conditions:

- **Qian Mu, *Political Gains and Losses Across Chinese Dynasties*** (《中国历代政治得失》) — The core inspiration for this project
- **Qian Mu, *Outline of National History*** (《国史大纲》) — Institutional evolution from a general history perspective
- **Lü Simian, *History of Chinese Institutions*** (《中国制度史》) — Thematic survey of official, military, legal, and fiscal systems
- **Bai Gang (ed.), *History of Chinese Political Institutions*** (《中国政治制度史》) — Comprehensive institutional history covering all 20 Chinese dynasties
- **Yan Buke, *Rank and Office*** (《品位与职位》) — How the Nine-Rank system shaped bureaucratic selection; inspired Jin and N&S Dynasties agent designs
- **Tian Yuqing, *Aristocratic Politics in the Eastern Jin*** (《东晋门阀政治》) — "Weak center + strong regions" pattern; inspired federated autonomy
- **Ray Huang, *1587, A Year of No Significance*** (《万历十五年》) — The Ming dual-track system in micro-level detail; shaped the dual-power design
- **Yang Kuan, *History of the Warring States*** (《战国史》) — Institutional transition from enfeoffment to commandery-county
- **Yao Dali, *The Wisdom of Reading History*** (《读史的智慧》) — Multi-ethnic empire governance (Yuan, Qing)

### Per-Regime Academic References

Each regime module is backed by specific scholarly works. Listed by region:

#### Chinese Dynasties

| Regime | Core References |
|--------|----------------|
| **Xia** `china/xia` | Xu Hong 许宏, *The Earliest China* · Li Xueqin, *Xia-Shang-Zhou Chronology Notes* · Li Liu & Chen Xingcan, *The Archaeology of China* (Cambridge, 2012) |
| **Shang** `china/shang` | Chen Mengjia, *Comprehensive Study of Yinxu Oracle Bone Inscriptions* · Song Zhenhao (ed.), *History of the Shang Dynasty* (11 vols.) · David Keightley, *Sources of Shang History* (1978) |
| **Zhou** `china/zhou` | Xu Zhuoyun, *History of the Western Zhou* · Li Feng, *Bureaucracy and the State in Early China* (Cambridge, 2008) · Zhao Dingxin, *The Confucian-Legalist State* |
| **Qin** `china/qin` | Lin Jianming, *History of Qin and Han* · Shuihudi Qin Bamboo Texts · Mark Edward Lewis, *The Early Chinese Empires: Qin and Han* (Harvard, 2007) |
| **Han** `china/han` | Qian Mu, *History of Qin and Han* · Michael Loewe, *The Government of the Qin and Han Empires* (Hackett, 2006) · An Zuozhang & Xiong Tieji, *Draft History of Qin-Han Official System* |
| **Three Kingdoms** `china/three-kingdoms` | Tian Yuqing, *Explorations in Qin-Han and Wei-Jin History* · Chen Shou, *Records of the Three Kingdoms* (Pei Songzhi annotations) · Rafe de Crespigny, *Generals of the South* (1990) |
| **Jin** `china/jin` | Tian Yuqing, *Aristocratic Politics in the Eastern Jin* · Yan Buke, *Rank and Office* · Tang Changru, *Essays on Wei-Jin and N&S Dynasties* |
| **N&S Dynasties** `china/north-south` | Tang Changru, *Essays on Wei-Jin and N&S Dynasties* (sequel) · Kawakatsu Yoshio, *Studies on Six Dynasties Aristocratic Society* · Chen Yinke, *Origins of Sui-Tang Institutions* |
| **Sui** `china/sui` | Han Sheng, *Biography of Emperor Wen of Sui* · Chen Yinke, *Origins of Sui-Tang Institutions* · Arthur Wright, *The Sui Dynasty* (1978) |
| **Tang** ⭐ `china/tang` | Chen Yinke, *Political History of the Tang Dynasty* · Denis Twitchett (ed.), *Cambridge History of China, Vol. 3* (1979) · Huang Yongnian, *Twelve Lectures on Tang History* |
| **Five Dynasties** `china/five-dynasties` | Wang Gungwu, *The Structure of Power in North China during the Five Dynasties* (1963) · Ouyang Xiu, *New History of the Five Dynasties* |
| **Song** `china/song` | Deng Xiaonan, *Ancestral Law* (祖宗之法) · Deng Guangming, *Wang Anshi* · Dieter Kuhn, *The Age of Confucian Rule* (Harvard, 2009) |
| **Liao** `china/liao` | Liu Pujiang, *Essays on Liao and Jin History* · Karl Wittfogel & Feng Jiasheng, *History of Chinese Society: Liao* (1949) |
| **Jin (Jurchen)** `china/jin-jurchen` | Liu Pujiang, *Essays on Liao and Jin History* · Herbert Franke & Denis Twitchett (eds.), *Cambridge History of China, Vol. 6* (1994) |
| **Western Xia** `china/western-xia` | Shi Jinbo, *Tangut Society* · Ruth Dunnell, *The Great State of White and High* (1996) |
| **Yuan** `china/yuan` | Xiao Qiqing, *New Studies on Mongol-Yuan History* · David Morgan, *The Mongols* (2nd ed., 2007) · Yao Dali, *Mongol-Yuan Institutions and Political Culture* |
| **Ming** `china/ming` | Ray Huang, *1587, A Year of No Significance* · Timothy Brook, *The Troubled Empire* (Harvard, 2010) · Fang Zhiyuan, *Ming State Power Structure* |
| **Qing** `china/qing` | William Rowe, *China's Last Empire: The Great Qing* (Harvard, 2009) · Philip Kuhn, *Soulstealers* (1990) · Mao Haijian, *The Collapse of the Heavenly Dynasty* |
| **Taiping** `china/taiping` | Luo Ergang, *History of the Taiping Heavenly Kingdom* · Jonathan Spence, *God's Chinese Son* (1996) |
| **ROC** `china/roc` | John King Fairbank (ed.), *Cambridge History of China, Vols. 12–13* · Wang Qisheng, *Party Members, Party Power, and Party Struggles: 1924–1949* |

#### Global Empires

| Regime | Core References |
|--------|----------------|
| **Ancient Egypt** `global/egypt` | Ian Shaw (ed.), *The Oxford History of Ancient Egypt* (2000) · Barry Kemp, *Ancient Egypt: Anatomy of a Civilization* (3rd ed., 2018) · Toby Wilkinson, *The Rise and Fall of Ancient Egypt* (2010) |
| **Athenian Democracy** `global/athens` | Josiah Ober, *Mass and Elite in Democratic Athens* (1989) · Mogens Hansen, *The Athenian Democracy in the Age of Demosthenes* (1991) · Donald Kagan, *Pericles of Athens* (1991) |
| **Sparta** `global/sparta` | Paul Cartledge, *Sparta and Lakonia* (2nd ed., 2002) & *The Spartans* (2003) · W.G. Forrest, *A History of Sparta 950–192 BC* (1968) |
| **Roman Republic** `global/roman-republic` | Mary Beard, *SPQR* (2015) · Harriet Flower (ed.), *Cambridge Companion to the Roman Republic* (2014) · Ronald Syme, *The Roman Revolution* (1939) |
| **Roman Empire** `global/roman-empire` | Peter Heather, *The Fall of the Roman Empire* (2006) · Fergus Millar, *The Emperor in the Roman World* (1977) · Edward Gibbon, *The Decline and Fall* (classic) |
| **Byzantine** `global/byzantine` | Cyril Mango (ed.), *Oxford History of Byzantium* (2002) · John Haldon, *Byzantium in the Seventh Century* (1990) · Judith Herrin, *Byzantium* (2007) |
| **Persian Achaemenid** `global/persian` | Pierre Briant, *From Cyrus to Alexander* (2002) · Amélie Kuhrt, *The Persian Empire* (2007) · Josef Wiesehöfer, *Ancient Persia* (2001) |
| **Ottoman** `global/ottoman` | Halil İnalcık, *The Ottoman Empire: The Classical Age* (1973) · Caroline Finkel, *Osman's Dream* (2005) · Suraiya Faroqhi, *The Ottoman Empire and the World Around It* (2004) |
| **Mongol** `global/mongol` | Jack Weatherford, *Genghis Khan and the Making of the Modern World* (2004) · David Morgan, *The Mongols* (2007) · Timothy May, *The Mongol Empire* (2018) |
| **Holy Roman Empire** `global/hre` | Peter Wilson, *Heart of Europe* (2016) · Joachim Whaley, *Germany and the Holy Roman Empire* (2 vols., 2012) |
| **British Parliament** `global/british` | Robert Tombs, *The English and Their History* (2014) · David Starkey, *Crown and Country* (2010) · A.V. Dicey, *Introduction to the Study of the Law of the Constitution* (1885) |
| **French Absolutism** `global/french` | John Lynn, *The Wars of Louis XIV* (1999) · Peter Burke, *The Fabrication of Louis XIV* (1992) · William Beik, *Absolutism and Society in 17th-Century France* (1985) |
| **Russian Tsardom** `global/russian` | Orlando Figes, *A People's Tragedy* (1996) · Geoffrey Hosking, *Russia: People and Empire* (1997) · Richard Pipes, *Russia under the Old Regime* (1974) |
| **Japanese Shogunate** `global/shogunate` | Conrad Totman, *Tokugawa Ieyasu: Shogun* (1983) · Marius Jansen, *The Making of Modern Japan* (2000) · 朝尾直弘 et al., *Iwanami Japanese History* |
| **Mughal India** `global/mughal` | John Richards, *The Mughal Empire* (New Cambridge History of India, 1993) · Abraham Eraly, *The Mughal Throne* (2003) · Ruby Lal, *Empress* (2018) |
| **US Federal** `global/us-federal` | Hamilton, Madison & Jay, *The Federalist Papers* (1788) · Robert Dahl, *How Democratic Is the American Constitution?* (2001) · Akhil Reed Amar, *America's Constitution* (2005) |
| **Soviet Union** `global/soviet` | Sheila Fitzpatrick, *The Russian Revolution* (4th ed., 2017) · Robert Service, *A History of Modern Russia* (2009) · Stephen Kotkin, *Stalin: Paradoxes of Power* (2014) |
| **Inca Empire** `global/inca` | Terence D'Altroy, *The Incas* (2nd ed., 2015) · Brian Bauer, *The Development of the Inca State* (1992) · Gary Urton, *Inka History in Knots* (2017) |
| **Aztec Triple Alliance** `global/aztec` | Michael Smith, *The Aztecs* (3rd ed., 2012) · Ross Hassig, *Aztec Warfare* (1988) · David Carrasco, *The Aztecs: A Very Short Introduction* (2012) |

### Western Political Theory & Comparative Politics

- **Aristotle, *Politics*** — The earliest regime taxonomy; this project's 6 patterns are Aristotle's classification rewritten for AI
- **Montesquieu, *The Spirit of the Laws*** (1748) — Separation of powers; maps to US Federal and checks-and-balances designs
- **Max Weber, *Economy and Society*** (1922) — Rational bureaucracy: hierarchy, specialization, rule-orientation
- **S.N. Eisenstadt, *The Political Systems of Empires*** (1963) — Comparative political structures across history's empires
- **Francis Fukuyama, *The Origins of Political Order*** (2011) — State-building, rule of law, and accountability
- **Charles Tilly, *Coercion, Capital, and European States*** (1990) — Diversity of European state forms
- **Samuel Huntington, *Political Order in Changing Societies*** (1968) — Political institutionalization theory
- **Douglass North, *Institutions, Institutional Change and Economic Performance*** (1990) — How institutions constrain and incentivize behavior — precisely what SOUL.md and IDENTITY.md do
- **Mancur Olson, *The Logic of Collective Action*** (1965) — Why democratic council patterns need incentive mechanisms
- **Karl Wittfogel, *Oriental Despotism*** (1957) — Hydraulic empires and centralization
- **Perry Anderson, *Lineages of the Absolutist State*** (1974) — Comparing Eastern and Western absolutism

### Organizational Theory & Multi-Agent Systems

- **Herbert Simon, *Administrative Behavior*** (1947) — Bounded rationality and hierarchical organization
- **Wooldridge & Jennings, "Intelligent Agents: Theory and Practice"** (*The Knowledge Engineering Review*, 1995) — Classic MAS survey
- **Dorri, Kanhere & Jurdak, "Multi-Agent Systems: A Survey"** (*IEEE Access*, 2018) — Modern MAS architecture taxonomy
- **Henry Mintzberg, *The Structuring of Organizations*** (1979) — Five basic organizational forms closely match this project's six orchestration patterns

### Courses & MOOCs

| Course | Platform | Instructor | Relevance |
|--------|----------|------------|-----------|
| **Ancient Greek History** | [Yale Open Courses](https://oyc.yale.edu/classics/clcv-205) | Donald Kagan | Athenian democracy & Spartan dual kingship firsthand lectures |
| **Intro to Political Philosophy** | [Yale Open Courses](https://oyc.yale.edu/political-science/plsc-114) | Steven B. Smith | Regime theory from Plato to Locke; inspired the 6 pattern taxonomy |
| **ChinaX** (China's First Empires) | [edX / HarvardX](https://www.edx.org/learn/history/harvard-university-china-history) | Peter K. Bol | Qin-Han imperial institutions in English |
| **Chinese Ancient History** | [MOOC China / Peking Univ.](https://www.icourse163.org/) | Yan Buke, Deng Xiaonan | Rank & Office; Song Ancestral Law |
| **Global History** | [MOOC China / Peking Univ.](https://www.icourse163.org/) | Qian Chengdan et al. | Comparative global empire institutions |
| **The Fall and Rise of China** | [The Great Courses](https://www.thegreatcourses.com/) | Richard Baum | Qing, Taiping, ROC institutional transitions |
| **The Early Middle Ages** | [Yale Open Courses](https://oyc.yale.edu/history/hist-210) | Paul Freedman | Late Roman Empire, Byzantine, Frankish institutions |
| **European Civilization, 1648–1945** | [Yale Open Courses](https://oyc.yale.edu/history/hist-202) | John Merriman | French absolutism, British parliamentarism, Russian autocracy |

### Documentaries

| Title | Producer | Relevance |
|-------|----------|-----------|
| **The Story of China** (2016) | BBC · Michael Wood | 6 episodes spanning Shang to modern era — best English-language Chinese dynasty overview |
| **中国通史** (2016) | CCTV · 100 episodes | Panoramic institutional history from antiquity to Qing |
| **大明王朝 1566** (2007) | Hunan TV · Dir. Zhang Li | Drama, but exceptionally precise depiction of Ming Cabinet-Eunuch dual-track system |
| **从秦始皇到汉武帝** (2016) | CCTV | Qin-Han institutional transitions in detail |
| **河西走廊** (2015) | CCTV | Multi-ethnic empire governance — Liao, Jin, Western Xia, Yuan perspectives |
| **Empires** series | PBS | Covers Roman Empire, Ottoman Empire, Napoleon, etc. |
| **Ancient Egypt: Life and Death** (2013) | BBC · Joann Fletcher | Pharaoh theocracy and Vizier bureaucratic system |
| **Japan: Memoirs of a Secret Empire** (2004) | PBS | Tokugawa Bakufu: Shogun, Daimyo, Emperor triangle |
| **The Ottomans: Europe's Muslim Emperors** (2013) | BBC · Rageh Omaar | Sultan-Divan system, devshirme, Janissaries |
| **Civilization** (2018) | BBC/PBS · Simon Schama et al. | Cross-civilizational art-politics interaction |
| **Extra History** series | YouTube · Extra Credits | High-quality animated history covering multiple empires |

---

## Links

- 🏛️ [Original Project: AI Court](https://github.com/wanikua/boluobobo-ai-court-tutorial) — by [@wanikua](https://github.com/wanikua)
- 🏢 [Become CEO — Corporate Edition](https://github.com/wanikua/become-ceo) — same architecture, modern corporate roles
- 🔧 [OpenClaw Framework](https://github.com/openclaw/openclaw)
- 📖 [OpenClaw Documentation](https://docs.openclaw.ai)
- 📕 [《中国历代政治得失》by Qian Mu](https://book.douban.com/subject/1003479/)

---

MIT License | Based on [AI 朝廷](https://github.com/wanikua/boluobobo-ai-court-tutorial) by [@wanikua](https://github.com/wanikua)
