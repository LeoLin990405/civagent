[Chinese Version](./README.md) | [Original Project](https://github.com/wanikua/boluobobo-ai-court-tutorial) | [🌐 Live Demo](https://leolin990405.github.io/civagent/)

<p align="center">
  <img src="./images/civagent-banner.svg" alt="CivAgent Banner" width="100%" />
</p>

# 🎮 CivAgent — Choose Your Civilization, Command Your AI Team

### 5,000 Years of Human Governance Wisdom x AI Multi-Agent Collaboration | 57 Civilizations · Pure Config Switching · Zero Code · Built on OpenClaw

<p align="center">
  <img src="https://img.shields.io/badge/Civilizations-57-gold?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Chinese_Dynasties-20-red?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Global_Empires-37-blue?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Orchestration_Patterns-6-purple?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Framework-OpenClaw-green?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Code_Changes-Zero-orange?style=for-the-badge" />
</p>

<div align="center">

> *"The whole history of the world is summed up in the fact that,*
> *when nations are strong, they are not always just,*
> *and when they wish to be just, they are no longer strong."*
> *— Winston Churchill*

</div>

---

<div align="center">

### 🏛️ Choose Your Civilization, Deploy in One Command

```bash
# 🐉 Qin Shi Huang's centralized autocracy — swift commands, maximum efficiency
./scripts/switch-regime.sh china/qin

# 🏛️ Athenian direct democracy — all Agents vote as equals
./scripts/switch-regime.sh global/athens

# ⚖️ US separation of powers — legislative, executive, judicial checks & balances
./scripts/switch-regime.sh global/us-federal

# 🗡️ Spartan dual kingship — dual main nodes for redundancy
./scripts/switch-regime.sh global/sparta

# 📜 Browse all 57 civilizations
./scripts/list-regimes.sh
```

</div>

---

## Acknowledgments

> **This project is built upon [@wanikua](https://github.com/wanikua)'s [AI 朝廷 (AI Court)](https://github.com/wanikua/boluobobo-ai-court-tutorial).**

Without wanikua's original idea — mapping ancient Chinese governmental structures to AI multi-agent collaboration — this project would not exist. "AI Court" was first published on February 22, 2026, pioneering the combination of the Tang Dynasty's Three Departments and Six Ministries system with the OpenClaw multi-agent framework, enabling anyone to build their own "AI Imperial Court" with a single command.

**The original Tang Dynasty Three Departments and Six Ministries configuration is preserved unchanged in `regimes/china/tang/`.**

My deepest gratitude to wanikua for this brilliantly creative and inspiring open-source contribution.

See [CREDITS.md](./CREDITS.md) for full attribution.

---

## About the Author & How This Project Came to Be

By day I'm a data professional — writing SQL, running ETL pipelines, staring at dashboards. By night I'm an online part-time history undergraduate and an AI programming enthusiast.

### The Starting Point: Qian Mu and the "Design Patterns" of Political Institutions

This semester I've been studying **World Political History** — from Athenian direct democracy to the Roman Senate, from Persian satrapies to the Mongol Kurultai. Different civilizations across different eras have all been trying to answer the same fundamental question: **How do you organize a group of people (or a group of agents) to collaborate effectively?** As a data person, I'm naturally fascinated by "how systems work" — a government's organizational structure is essentially a distributed system's topology design.

At the same time, I've been reading **"Political Gains and Losses Across Chinese Dynasties"** (《中国历代政治得失》) by **Qian Mu**. This book transformed my understanding of institutional history. Qian Mu systematically analyzed the political systems of five dynasties — Han, Tang, Song, Ming, and Qing — not simply judging them as good or bad, but seeking to understand why each system was designed the way it was in its historical context, what problems it solved, and what pitfalls it left behind. He advances a central argument: **every generation's institutions are a response to the defects of the preceding generation's institutions.** The Han Three Lords and Nine Ministers concentrated too much power, so the Tang used Three Departments to divide and check authority; the Tang Chancellery's veto power grew excessive, so the Song weakened chancellorial authority and established the Two Offices and Three Commissions; the Song civilian checks-and-balances system led to chronic inefficiency, so the Ming created the Grand Secretariat to accelerate decision-making — but then, fearing the Secretariat would grow too powerful, deployed the Directorate of Ceremonial to counterbalance it.

This **iterative logic of "problem, institutional response, new problem, new institution"** is, to my eyes, identical to the pattern of architectural evolution in software engineering.

### Institutional Design ≈ Distributed Systems Architecture

While reading this book, a thought kept surfacing: **the design logic behind these political systems is strikingly similar to modern agent orchestration patterns in software architecture.** They confront the same core problems — information asymmetry, the principal-agent dilemma, and the tension between power checks and execution efficiency:

| Ancient Political Institution | Distributed System / Agent Orchestration | Common Problem Addressed |
|------------------------------|------------------------------------------|--------------------------|
| Qin Three Lords and Nine Ministers: Chancellor directs all officials | Centralized hierarchical scheduling: single main agent | Rapid decision-making, consistency guarantees |
| Tang Three Departments and Six Ministries: Secretariat drafts, Chancellery reviews, Department of State Affairs executes | Checks & balances: multi-agent cross-review | Preventing single-point errors, quality control |
| Ming Grand Secretariat + Directorate of Ceremonial: draft proposals, imperial approval | Dual power: dual main agents with cross-approval | Balancing power checks with decision efficiency |
| Zhou Patriarchal Enfeoffment: Son of Heaven, feudal lords, ministers | Federated autonomy: independent agent groups | Large-scale parallelism, reducing central bottlenecks |
| Athenian Citizens' Assembly: one person, one vote | Democratic council: equal-authority agent voting | Collective intelligence, preventing autocracy |
| Shang Theocratic Politics: diviners decide on Heaven's behalf | Theocratic mode: absolute-authority main agent | Rapid unified action in times of crisis |

This is not a strained analogy. Henry Mintzberg, in his 1979 classic *The Structuring of Organizations*, proposed five basic organizational forms — Simple Structure, Machine Bureaucracy, Professional Bureaucracy, Divisionalized Form, and Adhocracy — which are structurally isomorphic to this project's six orchestration patterns. Political institutions, organizational theory, and distributed systems are fundamentally **the same class of problem expressed in different domains**.

Herbert Simon's concept of "bounded rationality" (*Administrative Behavior*, 1947) perfectly explains why different regimes excel in different contexts — no agent (or human decision-maker) can obtain complete information and reach an optimal decision. Therefore the core of institutional design is **devising the most effective decision-making process under the constraint of incomplete information.** Qin centralization suits scenarios where information flows rapidly and decisions are urgent; Tang checks-and-balances suit scenarios where information is complex and multi-perspective review is required; Zhou federalism suits scenarios where information is dispersed and regional variation is large.

### From "AI Court" to CivAgent

Then I came across wanikua's [AI Court](https://github.com/wanikua/boluobobo-ai-court-tutorial) project — **and it had already built the first step of this idea!** Using the Tang Dynasty's Three Departments and Six Ministries to orchestrate AI agents — genuinely brilliant.

So I thought: if Tang works, **why not implement every classic government system in human history?** Just like Sid Meier's *Civilization* lets you choose different civilizations to experience different tech trees and governance strategies — CivAgent lets you choose different regimes to experience different AI orchestration patterns. From the Xia Dynasty to the Taiping Heavenly Kingdom, from Sumeria to the European Union — every regime is an organizational architecture that our predecessors battle-tested over centuries.

Francis Fukuyama, in *The Origins of Political Order*, argues that effective political order requires three dimensions: **state capacity, rule of law, and democratic accountability.** The trade-offs different regimes make across these three dimensions map precisely to three core tensions in AI orchestration:

- **Execution efficiency** ↔ State capacity: centralized models (Qin, Soviet Union) push this dimension to its extreme
- **Error prevention** ↔ Rule of law: checks-and-balances models (Tang, United States) guarantee quality through institutionalized review processes
- **Participation** ↔ Democratic accountability: democratic models (Athens, Viking Thing) give all agents a voice in decision-making

These three cannot be simultaneously maximized — this is precisely the core tension that Samuel Huntington repeatedly emphasized in *Political Order in Changing Societies* (1968). CivAgent's 57 regimes represent 57 different historical answers to this "impossible triangle."

### This Project Is Not Passing Judgment on History

This project isn't about judging which system is better or worse. As Qian Mu wrote: "The establishment of any institution must have been driven by the needs of its time and must have served the intentions of its era. We cannot evaluate the institutions of earlier ages by the standards of later ones." CivAgent's purpose is to **extract the design logic of each institution and transform it into reusable AI collaboration patterns.**

At a deeper level, Douglass North, in *Institutions, Institutional Change and Economic Performance* (1990), observed that **institutions are humanly devised constraints that shape human interaction.** In CivAgent, SOUL.md defines behavioral constraints (analogous to cultural norms), IDENTITY.md defines role permissions (analogous to formal institutions), and openclaw.json defines communication rules (analogous to enforcement mechanisms). Each regime is a complete "institutional design blueprint."

How do different organizational architectures produce different collaboration outcomes in different task scenarios? Centralized hierarchy excels at rapid execution. Checks and balances ensure quality control. Federated autonomy enables parallel teamwork... These lessons, validated by our ancestors through blood and tears, might genuinely help with today's AI orchestration challenges.

**History isn't just the past — it's a living fossil of organizational wisdom.**

---

## What Is This Project?

**CivAgent (AI Civilization)** maps 57 classic government systems from human history — from the Xia Dynasty's clan system to the US separation of powers, from Sumerian temple economy to EU supranational governance — onto AI multi-agent collaboration architectures. Each regime is a pure configuration module (JSON + Markdown). Switching regimes requires zero code changes.

**Core idea:** Ancient governance wisdom = modern AI team management best practices.

This is not a simple "re-skinning" project. Every regime's agent orchestration has been carefully researched against its corresponding historical institution, faithfully reflecting that regime's core institutional logic in terms of information flow, decision-making authority, review mechanisms, and fault tolerance design. For example, the Tang Dynasty's "Secretariat drafts, Chancellery reviews, Department of State Affairs executes" pipeline is mapped as a `sessions_send` review chain among three top-level agents; the Ming Dynasty's "Grand Secretariat drafts proposals, Directorate of Ceremonial grants imperial approval" is mapped as a cross-approval workflow between two main agents. S.N. Eisenstadt, in *The Political Systems of Empires* (1963), systematically compared the political structures of humanity's major empires; CivAgent can be seen as an experimental application of this comparative-politics methodology to the domain of AI system design.

### Why "CivAgent"?

CivAgent's name pays homage to Sid Meier's *Civilization* series — one of the most iconic strategy games in gaming history. The core appeal of *Civilization* is that **the civilization you choose determines how you govern, and how you govern determines the trajectory of your civilization.** CivAgent transplants this philosophy into the field of AI multi-agent orchestration:

| *Civilization* (the game) | CivAgent | Design Thinking Behind It |
|---------------------------|----------|--------------------------|
| Choose a civilization | Choose a regime | Different starting points lead to different development paths |
| Each civ has a unique tech tree | Each regime has a unique Agent orchestration pattern | Technological path dependence |
| Different civs have different special abilities | Different regimes have different collaboration strengths | Comparative institutional advantage |
| Build wonders to boost capabilities | Configure SOUL.md to define behavioral rules | The constraining power of cultural norms on behavior |
| Combine policy cards | Combine Agent roles and permissions | Modularity and composability of institutional design |
| Diplomacy, trade, warfare strategies | Inter-Agent communication, review, and competition mechanisms | Game theory and mechanism design |

**CivAgent = Civilization + Agent.** Orchestrate your Agents with the wisdom of civilizations.

But CivAgent and *Civilization* differ in one fundamental respect: *Civilization* pursues "winning" — domination victory, science victory, culture victory; CivAgent pursues **"fit"** — there is no best regime, only the regime best suited to the current task scenario. This circles back to Aristotle's core insight in the *Politics*: **the best constitution depends on circumstances.**

---

## Civilization Catalog

### 🐉 Chinese Dynasties (20)

> *From tribal alliance to centralized autocracy, from aristocratic politics to civil service bureaucracy — five thousand years of Chinese history, and every dynasty was an experiment in institutional design.*

| # | ID | Dynasty | Era | System | Agent Orchestration Pattern | Agents |
|---|-----|---------|-----|--------|---------------------------|--------|
| 1 | `china/xia` | [Xia](./regimes/china/xia/README.md) | c.2070-1600 BC | Clan Enfeoffment | Patriarch centralization + loose tribes | 5 |
| 2 | `china/shang` | [Shang](./regimes/china/shang/README.md) | c.1600-1046 BC | Theocratic Aristocracy | Divine decision + noble execution | 6 |
| 3 | `china/zhou` | [Zhou](./regimes/china/zhou/README.md) | c.1046-256 BC | Patriarchal Enfeoffment | Federated autonomy | 8 |
| 4 | `china/qin` | [Qin](./regimes/china/qin/README.md) | 221-206 BC | Commandery-County · Three Lords Nine Ministers | Strict centralized hierarchy | 7 |
| 5 | `china/han` | [Han](./regimes/china/han/README.md) | 206 BC-220 AD | Three Lords Nine Ministers | Tripartite division + specialized ministers | 10 |
| 6 | `china/three-kingdoms` | [Three Kingdoms](./regimes/china/three-kingdoms/README.md) | 220-280 | Three Rival States | 3 independent courts competing & collaborating | 9 |
| 7 | `china/jin` | [Jin](./regimes/china/jin/README.md) | 266-420 | Nine-Rank System | Weak center + strong regions | 6 |
| 8 | `china/north-south` | [N&S Dynasties](./regimes/china/north-south/README.md) | 420-589 | Aristocratic Clan System | Clan faction autonomy | 6 |
| 9 | `china/sui` | [Sui](./regimes/china/sui/README.md) | 581-618 | Three Depts Six Min (proto) | Checks & balances (prototype) | 7 |
| 10 | `china/tang` | [**Tang** ⭐](./regimes/china/tang/README.md) | 618-907 | **Three Depts Six Min (perfected)** | **ORIGINAL by @wanikua** | 7 |
| 11 | `china/five-dynasties` | [Five Dynasties](./regimes/china/five-dynasties/README.md) | 907-960 | Fragmented Warlords | Competing units | 5 |
| 12 | `china/song` | [Song](./regimes/china/song/README.md) | 960-1279 | Two Offices Three Commissions | Civilian checks + rotation | 8 |
| 13 | `china/yuan` | [Yuan](./regimes/china/yuan/README.md) | 1271-1368 | Provincial System | Mongol centralization + provincial agents | 7 |
| 14 | `china/ming` | [Ming](./regimes/china/ming/README.md) | 1368-1644 | Grand Secretariat + Eunuch Directorate | Dual-track decision-making | 8 |
| 15 | `china/qing` | [Qing](./regimes/china/qing/README.md) | 1644-1912 | Grand Council + Manchu-Han Cooperation | Elite council rapid decisions | 8 |
| 16 | `china/roc` | [Republic of China](./regimes/china/roc/README.md) | 1912-1949 | Five-Power Constitution | Five Yuans mutual oversight | 7 |
| 17 | `china/liao` | [Liao](./regimes/china/liao/README.md) | 907-1125 | Dual Administration | North-South dual tracks | 6 |
| 18 | `china/jin-jurchen` | [Jin (Jurchen)](./regimes/china/jin-jurchen/README.md) | 1115-1234 | Jurchen-Han Divided Gov. | Ethnic division of labor | 6 |
| 19 | `china/western-xia` | [Western Xia](./regimes/china/western-xia/README.md) | 1038-1227 | Multi-ethnic Prefectures | Military-first + religious support | 5 |
| 20 | `china/taiping` | [Taiping Kingdom](./regimes/china/taiping/README.md) | 1851-1864 | Theocratic Autocracy | Heavenly King absolute power | 7 |

### 🌍 Global Empires (37)

> *From the Pharaohs on the Nile to Switzerland's Federal Council, from Sumeria in Mesopotamia to the Zulu of southern Africa — every civilization answered the same question in its own way.*

#### Ancient Civilizations

| # | ID | Empire | Era | System | Agent Pattern | Agents |
|---|-----|--------|-----|--------|--------------|--------|
| 1 | `global/sumeria` | [Sumerian City-States](./regimes/global/sumeria/README.md) | c.4500-1900 BC | Temple Economy | Dual priest-king authority | 6 |
| 2 | `global/egypt` | [Ancient Egypt](./regimes/global/egypt/README.md) | 3100-30 BC | Pharaoh Theocracy | God-King + Vizier delegation | 6 |
| 3 | `global/athens` | [Athenian Democracy](./regimes/global/athens/README.md) | 508-322 BC | Direct Democracy | All agents vote, no single leader | 6 |
| 4 | `global/sparta` | [Sparta](./regimes/global/sparta/README.md) | 900-192 BC | Dual Kingship | Two co-kings + Ephors oversight | 6 |
| 5 | `global/persian` | [Persian Empire](./regimes/global/persian/README.md) | 550-330 BC | Satrap System | King of Kings + autonomous Satraps | 7 |
| 6 | `global/carthage` | [Carthaginian Republic](./regimes/global/carthage/README.md) | 814-146 BC | Merchant Oligarchy | Dual Suffetes + Senate | 7 |
| 7 | `global/maurya` | [Maurya Empire](./regimes/global/maurya/README.md) | 322-185 BC | Arthashastra System | Emperor + spy network | 7 |

#### Classical Empires

| # | ID | Empire | Era | System | Agent Pattern | Agents |
|---|-----|--------|-----|--------|--------------|--------|
| 8 | `global/roman-republic` | [Roman Republic](./regimes/global/roman-republic/README.md) | 509-27 BC | Senate + Consuls | Dual consuls + Senate voting | 8 |
| 9 | `global/roman-empire` | [Roman Empire](./regimes/global/roman-empire/README.md) | 27 BC-476 AD | Imperial Bureaucracy | Emperor + Prefects hierarchy | 7 |
| 10 | `global/byzantine` | [Byzantine Empire](./regimes/global/byzantine/README.md) | 330-1453 | Autocratic Theocracy | Basileus as God's Viceroy + ministers | 7 |

#### Medieval Powers

| # | ID | Empire | Era | System | Agent Pattern | Agents |
|---|-----|--------|-----|--------|--------------|--------|
| 11 | `global/caliphate` | [Abbasid Caliphate](./regimes/global/caliphate/README.md) | 750-1258 | Caliphate-Vizier System | Knowledge-enhanced centralization | 7 |
| 12 | `global/viking` | [Viking Thing](./regimes/global/viking/README.md) | 800-1100 | Thing Assembly Democracy | Consensus-based assembly voting | 5 |
| 13 | `global/hre` | [Holy Roman Empire](./regimes/global/hre/README.md) | 962-1806 | Electoral System | Electors choose + Princes self-govern | 7 |
| 14 | `global/mongol` | [Mongol Empire](./regimes/global/mongol/README.md) | 1206-1368 | Khanate Kurultai | Great Khan + Kurultai council | 6 |
| 15 | `global/venice` | [Venetian Republic](./regimes/global/venice/README.md) | 697-1797 | Doge + Great Council | Anti-corruption checks & balances | 7 |
| 16 | `global/mali` | [Mali Empire](./regimes/global/mali/README.md) | 1235-1600 | Mansa System | Oral tradition + trade network | 6 |
| 17 | `global/khmer` | [Khmer Empire](./regimes/global/khmer/README.md) | 802-1431 | Devaraja System | God-king absolute + hydraulic state | 6 |

#### Early Modern Empires

| # | ID | Empire | Era | System | Agent Pattern | Agents |
|---|-----|--------|-----|--------|--------------|--------|
| 18 | `global/ottoman` | [Ottoman Empire](./regimes/global/ottoman/README.md) | 1299-1922 | Sultan + Divan | Grand Vizier dispatches | 7 |
| 19 | `global/safavid` | [Safavid Empire](./regimes/global/safavid/README.md) | 1501-1736 | Shi'a Theocratic Monarchy | Shah + religious authority | 7 |
| 20 | `global/mughal` | [Mughal Empire](./regimes/global/mughal/README.md) | 1526-1857 | Mansabdar System | Emperor + ranked officials | 7 |
| 21 | `global/joseon` | [Joseon Korea](./regimes/global/joseon/README.md) | 1392-1897 | Neo-Confucian Bureaucracy | Three Offices censorial checks | 7 |
| 22 | `global/shogunate` | [Japanese Shogunate](./regimes/global/shogunate/README.md) | 1603-1868 | Bakufu System | Shogun rules, Emperor ceremonial | 7 |
| 23 | `global/polish` | [Polish-Lithuanian Commonwealth](./regimes/global/polish/README.md) | 1569-1795 | Elective Monarchy | Liberum veto + Sejm | 6 |

#### Age of Absolutism & Revolution

| # | ID | Empire | Era | System | Agent Pattern | Agents |
|---|-----|--------|-----|--------|--------------|--------|
| 24 | `global/french` | [French Absolutism](./regimes/global/french/README.md) | 1643-1789 | L'etat c'est moi | Sun King absolute power | 7 |
| 25 | `global/british` | [British Parliament](./regimes/global/british/README.md) | 1689-present | Constitutional Monarchy | PM governs, Crown ceremonial | 8 |
| 26 | `global/russian` | [Russian Tsardom](./regimes/global/russian/README.md) | 1547-1917 | Autocracy + Boyar Duma | Tsar absolute + Senate advisory | 7 |
| 27 | `global/habsburg` | [Habsburg Austria-Hungary](./regimes/global/habsburg/README.md) | 1867-1918 | Dual Monarchy | Dual parliaments in parallel | 7 |
| 28 | `global/prussia` | [Kingdom of Prussia](./regimes/global/prussia/README.md) | 1701-1918 | Military Bureaucracy | General Staff system | 6 |
| 29 | `global/napoleon` | [Napoleonic Empire](./regimes/global/napoleon/README.md) | 1804-1815 | Meritocratic Centralization | Merit-based + Code Napoleon | 7 |

#### Modern Systems

| # | ID | Empire | Era | System | Agent Pattern | Agents |
|---|-----|--------|-----|--------|--------------|--------|
| 30 | `global/us-federal` | [US Federal System](./regimes/global/us-federal/README.md) | 1789-present | Three Branches | Separation of powers | 7 |
| 31 | `global/meiji` | [Meiji Japan](./regimes/global/meiji/README.md) | 1868-1912 | Constitutional Monarchy | Genro informal centralization | 7 |
| 32 | `global/soviet` | [Soviet Union](./regimes/global/soviet/README.md) | 1922-1991 | Politburo System | General Secretary + Politburo | 7 |
| 33 | `global/eu` | [European Union](./regimes/global/eu/README.md) | 1993-present | Supranational Governance | Trilogue co-decision democracy | 7 |
| 34 | `global/swiss` | [Swiss Confederation](./regimes/global/swiss/README.md) | 1291-present | Direct Democracy | Referendum + collegiality | 6 |

#### Africa & Americas

| # | ID | Empire | Era | System | Agent Pattern | Agents |
|---|-----|--------|-----|--------|--------------|--------|
| 35 | `global/inca` | [Inca Empire](./regimes/global/inca/README.md) | 1438-1533 | Sapa Inca + Four Quarters | Son of the Sun + 4 Suyu governors | 6 |
| 36 | `global/aztec` | [Aztec Triple Alliance](./regimes/global/aztec/README.md) | 1428-1521 | Triple Alliance | Three city-states council | 6 |
| 37 | `global/zulu` | [Zulu Kingdom](./regimes/global/zulu/README.md) | 1816-1897 | Military Regimental | King + regimental hierarchy | 5 |

---

## 6 Orchestration Patterns — Your "Governance Tech Tree"

Just like the tech tree in *Civilization* determines your development path, CivAgent's 6 orchestration patterns determine how your AI team collaborates. These 6 patterns are not invented out of thin air — they are a distillation of the 2,400-year tradition of regime classification dating back to Aristotle, and they also align closely with Mintzberg's organizational-form theory and Wooldridge & Jennings's multi-agent system taxonomy. Each pattern occupies a different position within the impossible triangle of "decision speed vs. decision quality vs. breadth of participation":

```
                        ┌──────────────┐
                        │  Theocratic   │ Shang · Taiping · Egypt · Byzantine
                        │    Mode       │ Absolute authority, unquestionable
                        └──────┬───────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
     ┌────────▼────────┐ ┌────▼─────┐ ┌────────▼────────┐
     │  Centralized     │ │ Dual     │ │  Federated       │
     │  Mode            │ │ Power    │ │  Mode            │
     │ Qin·Yuan·France  │ │ Mode     │ │ Zhou·3K·HRE      │
     │ ·Soviet          │ │ Ming·    │ │ ·Persia           │
     │ Unified command  │ │ Sparta   │ │ Distributed       │
     └────────┬────────┘ │ ·Liao    │ │ autonomy          │
              │          │ Dual     │ └────────┬────────┘
              │          │ approval │          │
              │          └────┬─────┘          │
              │               │                │
              └───────────────┼────────────────┘
                              │
              ┌───────────────┼───────────────┐
              │                               │
     ┌────────▼────────┐             ┌────────▼────────┐
     │  Checks &        │             │  Democratic      │
     │  Balances         │             │  Council         │
     │  Mode             │             │  Mode            │
     │ Tang·Song·US·Sui │             │ Athens·Mongol    │
     │ Cross-review      │             │ ·Viking          │
     └─────────────────┘             │ Equal voting     │
                                      └─────────────────┘
```

### Pattern Details

| Pattern | Representative Civilizations | Core Features | OpenClaw Implementation | Best Scenario |
|---------|------------------------------|--------------|------------------------|---------------|
| **Centralized** | Qin, Yuan, Ancient Egypt, French Absolutism, Soviet, Napoleon, Prussia, Maurya | Single main agent manages all subagents; clear chain of command, rapid execution | Single `main` + `subagents.allowAgents` | Urgent tasks, need for fast unified decisions |
| **Checks & Balances** | Tang, Song, Sui, Roman Republic, US Federal, Venice, Joseon, Carthage | Multiple top-level agents cross-review each other; prevents single point of failure | Multiple top-level agents + `sessions_send` review | High quality requirements, error-prevention scenarios |
| **Dual Power** | Ming (Cabinet + Eunuch Dir.), Sparta (Dual Kings), Liao (North-South), Habsburg (Dual Monarchy) | Two main-level agents each manage a track; cross-approval | Dual `main` + overlapping subagents | Dual approval workflows, two product lines |
| **Federated** | Zhou, Three Kingdoms, Five Dynasties, Holy Roman Empire, Persia, Polish-Lithuanian Commonwealth | Independent agent groups self-govern; minimal cross-group coordination | Independent agent groups + minimal communication | Multi-team parallel work, microservice architectures |
| **Democratic Council** | Athens, Mongol Kurultai, Viking Thing, Swiss, EU | All agents participate equally; decisions by vote | Equal-rank agents + voting `sessions_send` | Brainstorming, collective decision-making |
| **Theocratic** | Shang, Taiping, Ancient Egypt, Byzantine, Safavid, Khmer | Supreme agent with absolute authority; all other agents fully obey | Absolute authority `main` + obedient subagents | Strong leadership, emergency crisis response |

### Theoretical Logic Behind the Patterns

These six patterns are not arbitrary categories. They correspond to core trade-offs that recur throughout political science and organizational theory:

**1. Centralization vs. Decentralization: The Eternal Efficiency-Quality Paradox**

Charles Tilly, in *Coercion, Capital, and European States*, argued that the evolution of state forms is fundamentally **a contest between the degree of coercive concentration and the complexity of society.** In agent orchestration, this maps to a basic trade-off: centralized control (a single main agent) guarantees consistency and speed, but becomes a bottleneck; distributed control (multiple top-level agents) improves parallelism and fault tolerance, but incurs additional coordination costs. The Qin Dynasty used extreme centralization to unify the six warring states, yet collapsed after only two generations precisely because it lacked error-correction mechanisms — the lesson for AI systems being that **a purely centralized mode suits short-term urgent tasks, but sustained operation requires some form of checks and balances.**

**2. The Transaction Cost of Checks and Balances**

The strength of checks-and-balances patterns (Tang Three Departments, US separation of powers) lies in quality assurance, but the price is **significant interaction overhead.** This is entirely consistent with Ronald Coase's transaction cost theory: the more checks there are, the stricter the review, the higher the "transaction cost" of each decision. The Song Dynasty's Two Offices and Three Commissions system pushed checks to an extreme — civilian officials counter-balanced one another to the point of bureaucratic bloat and redundant armies — such that one of Wang Anshi's core reform objectives was precisely to reduce checks and improve efficiency. For AI orchestration, this means the checks-and-balances pattern suits high-stakes scenarios where "better slow than wrong" (such as code review or financial compliance), but is ill-suited to scenarios demanding rapid iteration.

**3. Federalism and Autonomy: An Ancient Version of the CAP Theorem**

The CAP theorem in distributed systems (consistency, availability, and partition tolerance cannot all be maximized simultaneously) has a perfect counterpart in ancient politics: **central control, local flexibility, and communication efficiency** cannot all be maximized at once. The Zhou Dynasty's enfeoffment system chose "high local flexibility + low central control," at the cost of the eventual fragmentation of the Spring and Autumn and Warring States periods. The Persian Empire's satrap system was a compromise — satraps enjoyed enormous autonomy, but the Royal Road and the "King's Eyes and Ears" maintained a minimum threshold of consistency. This design wisdom remains applicable in today's microservice architectures.

**4. The Democratic Pattern and Arrow's Impossibility Theorem**

Arrow's Impossibility Theorem proves that, with three or more alternatives, no voting rule can simultaneously satisfy all fairness conditions. Athenian democracy, the Mongol Kurultai, and the Viking Thing all confronted this problem and devised different mitigations (sortition, consensus decision-making, veto power). In AI orchestration, the primary value of the democratic pattern lies not in "voting" per se, but in **compelling every agent to articulate its perspective** — an approach analogous to ensemble learning, where a combination of weak classifiers often outperforms any single strong classifier.

### Choose by Need

| Your Need | Recommended Civilization | Why |
|-----------|-------------------------|-----|
| ⚡ Fast execution, no discussion needed | Qin (Centralized) / Napoleon | Commands go straight through, efficiency first |
| 🔍 Quality review, error prevention | Tang (Checks & Balances) / US (Three Branches) / Venice | Multi-party cross-review, layered oversight |
| 🏁 Multiple teams competing in parallel | Three Kingdoms (Federated) / Persia | Each group independent, competition yields best results |
| 🗳️ Collective discussion, democratic decisions | Athens / Viking / Swiss | All Agents vote as equals |
| 🔐 Dual approval workflow | Ming (Dual Power) / Habsburg | Cabinet drafts + Eunuch Directorate approves |
| 💪 Strong leadership, fast push | Soviet / Ancient Egypt (Theocratic) | Supreme authority, unquestionable |
| 🧠 Knowledge-intensive tasks | Abbasid Caliphate / Joseon | Knowledge-enhanced + Confucian censorial review |
| 🛡️ Military-style project management | Prussia / Zulu | General Staff-style precision execution |
| 🌐 Cross-team multi-party negotiation | EU / Mongol | Multi-party co-decision + loose alliance |

---

## Quick Start

<p align="center">
  <img src="./images/demo-terminal.svg" alt="CivAgent Demo" width="100%" />
</p>

### 1. Install OpenClaw

```bash
# Linux
bash <(curl -fsSL https://raw.githubusercontent.com/wanikua/boluobobo-ai-court-tutorial/main/install.sh)

# macOS
bash <(curl -fsSL https://raw.githubusercontent.com/wanikua/boluobobo-ai-court-tutorial/main/install-mac.sh)
```

### 2. Clone CivAgent

```bash
git clone https://github.com/LeoLin990405/civagent.git civagent
cd civagent
```

### 3. Choose Your Civilization

```bash
# List all available civilizations
./scripts/list-regimes.sh

# Switch to your chosen civilization (e.g., Qin centralized hierarchy)
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

## Switching Civilizations

```bash
# View current civilization
cat ~/.openclaw/.active-regime

# Switch to a new civilization (auto-backs up current config)
./scripts/switch-regime.sh global/athens

# Restart to take effect
openclaw gateway restart
```

The switch automatically:
1. Backs up your current SOUL.md / IDENTITY.md / openclaw.json
2. Deploys the new civilization's configuration files
3. Preserves your API Keys and Bot Tokens

---

## Creating Custom Civilizations

```bash
# Scaffold a new civilization from template
./scripts/create-regime.sh global/your-empire

# Edit the 5 config files
# Validate
./scripts/validate-regime.sh global/your-empire
```

See the [Regime Design Guide](./docs/regime-design-guide.md) for details.

---

## Project Structure

```
civagent/
├── CREDITS.md                 # Attribution to @wanikua
├── regimes/                   # Core: 57 civilization configs
│   ├── _template/             # Civilization template (5 files)
│   ├── china/                 # 20 Chinese dynasties
│   │   ├── tang/              # ⭐ Original (preserved unchanged)
│   │   ├── qin/               # Qin · Three Lords Nine Ministers
│   │   ├── han/               # Han · Three Lords Nine Ministers
│   │   └── ...
│   └── global/                # 37 global empires
│       ├── athens/            # Athens · Direct Democracy
│       ├── roman-republic/    # Rome · Senate + Consuls
│       ├── sumeria/           # Sumeria · Temple Economy
│       ├── venice/            # Venice · Anti-corruption Checks
│       └── ...
├── scripts/                   # Civilization management tools
│   ├── switch-regime.sh       # Switch active civilization
│   ├── list-regimes.sh        # List all civilizations
│   ├── validate-regime.sh     # Validate config
│   └── create-regime.sh       # Scaffold new civilization
├── docs/
│   └── regime-design-guide.md # Civilization design guide
├── install.sh                 # Install script (original)
├── gui/                       # Web dashboard (original)
└── skills/                    # OpenClaw Skills (original)
```

Each civilization contains 5 files:

| File | Purpose | *Civilization* Game Analogy |
|------|---------|---------------------------|
| `metadata.json` | Machine-readable metadata (name, era, tags, etc.) | Civilization info card |
| `openclaw.json.template` | OpenClaw Agent config template | Unit and building definitions |
| `SOUL.md` | Era-themed behavioral rules (language style, taboos) | Civilization traits |
| `IDENTITY.md` | Org chart + role mapping table | Tech tree + policy cards |
| `README.md` | Documentation + historical background + usage examples | Civilopedia entry |

---

## FAQ

**Q: What's the relationship to the original AI Court project?**
CivAgent is an extended fork of [AI Court](https://github.com/wanikua/boluobobo-ai-court-tutorial). The original Tang Dynasty Three Departments and Six Ministries configuration is fully preserved in `regimes/china/tang/`. We've added 56 new regimes on top. All original features (install scripts, GUI, Skills) remain unchanged.

**Q: Do I need to change code to switch civilizations?**
No. Each civilization is a pure config module (JSON + Markdown). Just run `switch-regime.sh` — as simple as choosing a civilization in *Civilization*. This is also the project's core design philosophy: **architectural decisions should be configuration problems, not code problems.** As North observed, the lower the cost of institutional change, the greater the system's adaptability.

**Q: Can I create my own civilization?**
Absolutely. Run `create-regime.sh` to scaffold from the template, fill in the 5 config files, and you're done. PRs for new civilizations are welcome! Build your own "mod." In fact, the political systems of human history number far more than 57 — the different periods within the Angkor kingdom, the Ottoman Empire before and after the Tanzimat reforms, Japan's transition from the Ritsuryo system to the Bakufu system... every institutional transformation can become a new CivAgent configuration.

**Q: What's the connection to the *Civilization* game?**
No official affiliation. But the inspiration genuinely comes from the *Civilization* series — different civilizations have different tech trees and governance strategies; CivAgent offers different regimes with different Agent orchestration patterns. The core philosophy is the same: **your choice of civilization determines your style of governance.** The key difference is that *Civilization* is competitive (pursuing victory), while CivAgent is exploratory (pursuing fit).

**Q: Is the historical content accurate?**
I've done my best to ensure historical accuracy (I am a history major, after all), and every regime's design is supported by corresponding scholarly literature (see references below). My methodology is: first, read the core academic works on a given regime (e.g., for the Qin system I consulted Lin Jianming, the Shuihudi bamboo slips, and Mark Edward Lewis); then extract the institution's core structure (information flow, decision-making hierarchy, checks-and-balances mechanisms); and finally map these onto OpenClaw's agent configuration. This process inevitably involves simplification and abstraction — a real Tang Three Departments and Six Ministries system was far more complex than 7 agents — but I have strived to preserve the core organizational logic of each institution. If you spot any historical errors, Issues and PRs are very welcome!

**Q: Does this project have practical value for AI orchestration?**
I believe it does. A longstanding challenge in multi-agent systems (MAS) research is: **how should one design the communication topology and decision protocols among agents?** Most MAS papers assume either central coordination or fully distributed operation — yet real organizational architectures are far richer than these two extremes. CivAgent provides 57 historically tested organizational topologies, each with a clear design intent and known strengths and weaknesses. Even if not used in production, it serves as a valuable "organizational architecture pattern reference manual."

---

## Inspirations & References

### Direct Inspirations

| Source | Description |
|--------|-------------|
| [AI 朝廷 (AI Court)](https://github.com/wanikua/boluobobo-ai-court-tutorial) by [@wanikua](https://github.com/wanikua) | The original concept and Tang Dynasty implementation that sparked this entire project |
| [OpenClaw](https://github.com/openclaw/openclaw) | The underlying multi-agent framework |
| Sid Meier's *Civilization* series | The "choose a civilization, experience a different governance strategy" core interaction concept |

### Chinese Political Institutional History — General

These works helped me understand the design logic behind each dynasty's system — not simple good-vs-bad judgments, but rational choices under specific historical conditions:

- **Qian Mu, *Political Gains and Losses Across Chinese Dynasties*** (《中国历代政治得失》) — The core inspiration for this project. Qian Mu's comparative analysis of five dynasties' institutions — Han, Tang, Song, Ming, and Qing — revealed the design logic behind "Three Departments checks & balances," "Cabinet draft-and-approval," "Grand Council rapid decisions," and other patterns
- **Qian Mu, *Outline of National History*** (《国史大纲》) — Institutional evolution from a general history perspective, understanding why each dynasty reformed its predecessor's system the way it did
- **Lu Simian, *History of Chinese Institutions*** (《中国制度史》) — Thematic survey of official, military, legal, and fiscal systems; a key reference for designing each dynasty's Agent roles
- **Bai Gang (ed.), *History of Chinese Political Institutions*** (《中国政治制度史》) — Comprehensive institutional history from pre-Qin to modern era, covering all 20 Chinese dynasties in this project
- **Yan Buke, *Rank and Office*** (《品位与职位：秦汉魏晋南北朝官阶制度研究》) — Deep analysis of how the Nine-Rank system shaped bureaucratic selection; directly inspired Jin and N&S Dynasties Agent designs
- **Tian Yuqing, *Aristocratic Politics in the Eastern Jin*** (《东晋门阀政治》) — How aristocratic clans hollowed out imperial authority to create a "weak center + strong regions" pattern; inspired the federated autonomy mode for Jin and N&S Dynasties
- **Ray Huang, *1587, A Year of No Significance*** (《万历十五年》) — A micro-level view of how the Ming dual-track system of Cabinet and Directorate of Ceremonial operated (and failed); directly shaped the Ming dual-power design
- **Yang Kuan, *History of the Warring States*** (《战国史》) — Understanding the institutional transition from enfeoffment to the commandery-county system; inspired the Zhou-to-Qin orchestration pattern shift
- **Yao Dali, *The Wisdom of Reading History*** (《读史的智慧》) — Multi-ethnic empire governance logic in the Yuan and Qing; helped explain the Liao, Jin, Yuan, and Qing "govern according to local custom" patterns

### Per-Civilization Academic References

Each civilization module is backed by specific scholarly works. Listed by region:

#### Chinese Dynasties

| Civilization | Core References |
|--------------|----------------|
| **Xia** `china/xia` | Xu Hong, *The Earliest China* · Li Xueqin, *Xia-Shang-Zhou Chronology Notes* · Li Liu & Chen Xingcan, *The Archaeology of China* (Cambridge, 2012) |
| **Shang** `china/shang` | Chen Mengjia, *Comprehensive Study of Yinxu Oracle Bone Inscriptions* · Song Zhenhao (ed.), *History of the Shang Dynasty* (11 vols.) · David Keightley, *Sources of Shang History* (1978) |
| **Zhou** `china/zhou` | Xu Zhuoyun, *History of the Western Zhou* · Yang Bojun (annot.), *Zuozhuan* · Li Feng, *Bureaucracy and the State in Early China* (Cambridge, 2008) · Zhao Dingxin, *The Confucian-Legalist State* |
| **Qin** `china/qin` | Lin Jianming, *History of Qin and Han* · Shuihudi Qin Bamboo Slips Research Group, *Shuihudi Qin Tomb Bamboo Slips* · Tsuruma Kazuyuki, *Legacy of the First Emperor* · Mark Edward Lewis, *The Early Chinese Empires: Qin and Han* (Harvard, 2007) |
| **Han** `china/han` | Qian Mu, *History of Qin and Han* · Chen Suzhen, *Han Politics and the Spring and Autumn Annals* · Michael Loewe, *The Government of the Qin and Han Empires* (Hackett, 2006) · An Zuozhang & Xiong Tieji, *Draft History of Qin-Han Official System* |
| **Three Kingdoms** `china/three-kingdoms` | Tian Yuqing, *Explorations in Qin-Han and Wei-Jin History* · Chen Shou, *Records of the Three Kingdoms* (Pei Songzhi annot.) · Rafe de Crespigny, *Generals of the South* (1990) & *A Biographical Dictionary of Later Han to the Three Kingdoms* |
| **Jin** `china/jin` | Tian Yuqing, *Aristocratic Politics in the Eastern Jin* · Yan Buke, *Rank and Office* · Tang Changru, *Essays on Wei-Jin and N&S Dynasties History* |
| **N&S Dynasties** `china/north-south` | Tang Changru, *Essays on Wei-Jin and N&S Dynasties History* (sequel) · Kawakatsu Yoshio, *Studies on Six Dynasties Aristocratic Society* · Chen Yinke, *Origins of Sui-Tang Institutions* |
| **Sui** `china/sui` | Han Sheng, *Biography of Emperor Wen of Sui* · Chen Yinke, *Origins of Sui-Tang Institutions* · Arthur Wright, *The Sui Dynasty* (1978) |
| **Tang** ⭐ `china/tang` | Chen Yinke, *Political History of the Tang Dynasty* · Wu Zongguo, *Studies on the Tang Examination System* · Denis Twitchett (ed.), *Cambridge History of China, Vol. 3: Sui and T'ang China* (1979) · Huang Yongnian, *Twelve Lectures on Tang History* |
| **Five Dynasties** `china/five-dynasties` | Xue Juzheng et al., *Old History of the Five Dynasties* · Ouyang Xiu, *New History of the Five Dynasties* · Wang Gungwu, *The Structure of Power in North China during the Five Dynasties* (1963) |
| **Song** `china/song` | Deng Xiaonan, *Ancestral Law: Political Discourse in the Early Northern Song* · Deng Guangming, *Wang Anshi, Political Reformer of the Northern Song* · Dieter Kuhn, *The Age of Confucian Rule: The Song Transformation of China* (Harvard, 2009) |
| **Liao** `china/liao` | Liu Pujiang, *Essays on Liao and Jin History* · Shimada Masao, *Studies on the Liao Official System* · Karl Wittfogel & Feng Jiasheng, *History of Chinese Society: Liao (907-1125)* (1949) |
| **Jin (Jurchen)** `china/jin-jurchen` | Zhang Boquan, *Economic History of the Jin Dynasty* · Liu Pujiang, *Essays on Liao and Jin History* · Herbert Franke & Denis Twitchett (eds.), *Cambridge History of China, Vol. 6: Alien Regimes and Border States* (1994) |
| **Western Xia** `china/western-xia` | Shi Jinbo, *Tangut Society* · Research on the *Revised and Newly Promulgated Code of the Heavenly Prosperity Era* · Ruth Dunnell, *The Great State of White and High: Buddhism and State Formation in Eleventh-Century Xia* (1996) |
| **Yuan** `china/yuan` | Xiao Qiqing, *New Studies on Mongol-Yuan History* · Yao Dali, *Mongol-Yuan Institutions and Political Culture* · David Morgan, *The Mongols* (2nd ed., 2007) · Chen Gaohua & Shi Weimin, *Shangdu* |
| **Ming** `china/ming` | Ray Huang, *1587, A Year of No Significance* · Fang Zhiyuan, *Ming State Power Structure and Operating Mechanisms* · Timothy Brook, *The Troubled Empire: China in the Yuan and Ming Dynasties* (Harvard, 2010) · Xie Guozhen, *Essays on Ming Socio-Economic History* |
| **Qing** `china/qing` | Dai Yi (ed.), *Concise History of the Qing Dynasty* · Mao Haijian, *The Collapse of the Heavenly Dynasty* · William Rowe, *China's Last Empire: The Great Qing* (Harvard, 2009) · Philip Kuhn, *Soulstealers* (1990) |
| **Taiping** `china/taiping` | Luo Ergang, *History of the Taiping Heavenly Kingdom* · Jonathan Spence, *God's Chinese Son* (1996) · Mao Jiaqi (ed.), *General History of the Taiping Heavenly Kingdom* |
| **ROC** `china/roc` | Zhang Yufa, *Draft History of the Republic of China* · John King Fairbank (ed.), *Cambridge History of China, Vols. 12-13* · Wang Qisheng, *Party Members, Party Power, and Party Struggles: 1924-1949* |

#### Global Empires

| Civilization | Core References |
|--------------|----------------|
| **Sumeria** `global/sumeria` | Samuel Noah Kramer, *The Sumerians: Their History, Culture, and Character* (1963) · Marc Van De Mieroop, *The Ancient Mesopotamian City* (1997) · Harriet Crawford, *Sumer and the Sumerians* (2nd ed., 2004) |
| **Ancient Egypt** `global/egypt` | Ian Shaw (ed.), *The Oxford History of Ancient Egypt* (2000) · Barry Kemp, *Ancient Egypt: Anatomy of a Civilization* (3rd ed., 2018) · Toby Wilkinson, *The Rise and Fall of Ancient Egypt* (2010) |
| **Athenian Democracy** `global/athens` | Josiah Ober, *Mass and Elite in Democratic Athens* (1989) · Mogens Hansen, *The Athenian Democracy in the Age of Demosthenes* (1991) · Donald Kagan, *Pericles of Athens and the Birth of Democracy* (1991) |
| **Sparta** `global/sparta` | Paul Cartledge, *Sparta and Lakonia* (2nd ed., 2002) & *The Spartans* (2003) · W.G. Forrest, *A History of Sparta 950-192 BC* (1968) |
| **Persian Empire** `global/persian` | Pierre Briant, *From Cyrus to Alexander: A History of the Persian Empire* (2002) · Amelie Kuhrt, *The Persian Empire* (2007) · Josef Wiesehofer, *Ancient Persia* (2001) |
| **Carthage** `global/carthage` | Serge Lancel, *Carthage: A History* (1995) · Richard Miles, *Carthage Must Be Destroyed* (2010) · Dexter Hoyos, *The Carthaginians* (2010) |
| **Maurya Empire** `global/maurya` | Romila Thapar, *Asoka and the Decline of the Mauryas* (3rd ed., 2012) · Kautilya, *Arthashastra* (R.P. Kangle ed., 1965) · Upinder Singh, *A History of Ancient and Early Medieval India* (2008) |
| **Roman Republic** `global/roman-republic` | Mary Beard, *SPQR: A History of Ancient Rome* (2015) · Harriet Flower (ed.), *Cambridge Companion to the Roman Republic* (2nd ed., 2014) · Ronald Syme, *The Roman Revolution* (1939) |
| **Roman Empire** `global/roman-empire` | Edward Gibbon, *The Decline and Fall of the Roman Empire* (classic) · Peter Heather, *The Fall of the Roman Empire* (2006) · Fergus Millar, *The Emperor in the Roman World* (1977) |
| **Byzantine** `global/byzantine` | Cyril Mango (ed.), *Oxford History of Byzantium* (2002) · John Haldon, *Byzantium in the Seventh Century* (1990) · Judith Herrin, *Byzantium: The Surprising Life of a Medieval Empire* (2007) |
| **Abbasid Caliphate** `global/caliphate` | Hugh Kennedy, *The Prophet and the Age of the Caliphates* (3rd ed., 2016) · Dimitri Gutas, *Greek Thought, Arabic Culture* (1998) · Tayeb El-Hibri, *Reinterpreting Islamic Historiography* (1999) |
| **Viking** `global/viking` | Jesse Byock, *Viking Age Iceland* (2001) · Else Roesdahl, *The Vikings* (3rd ed., 2016) · Neil Price, *Children of Ash and Elm: A History of the Vikings* (2020) |
| **Holy Roman Empire** `global/hre` | Peter Wilson, *Heart of Europe: A History of the Holy Roman Empire* (2016) · Joachim Whaley, *Germany and the Holy Roman Empire* (2 vols., Oxford, 2012) |
| **Mongol Empire** `global/mongol` | Jack Weatherford, *Genghis Khan and the Making of the Modern World* (2004) · David Morgan, *The Mongols* (2nd ed., 2007) · Timothy May, *The Mongol Empire* (Edinburgh, 2018) |
| **Venice** `global/venice` | John Julius Norwich, *A History of Venice* (1982) · Frederic Lane, *Venice: A Maritime Republic* (1973) · Robert Finlay, *Politics in Renaissance Venice* (1980) |
| **Mali Empire** `global/mali` | Nehemia Levtzion, *Ancient Ghana and Mali* (1973) · D.T. Niane, *Sundiata: An Epic of Old Mali* (1965) · Michael Gomez, *African Dominion: A New History of Empire in Early and Medieval West Africa* (2018) |
| **Khmer Empire** `global/khmer` | David Chandler, *A History of Cambodia* (4th ed., 2008) · Michael Coe, *Angkor and the Khmer Civilization* (2003) · Charles Higham, *The Civilization of Angkor* (2001) |
| **Ottoman Empire** `global/ottoman` | Halil Inalcik, *The Ottoman Empire: The Classical Age 1300-1600* (1973) · Caroline Finkel, *Osman's Dream: The Story of the Ottoman Empire* (2005) · Suraiya Faroqhi, *The Ottoman Empire and the World Around It* (2004) |
| **Safavid Empire** `global/safavid` | Andrew Newman, *Safavid Iran: Rebirth of a Persian Empire* (2006) · Rudi Matthee, *Persia in Crisis: Safavid Decline and the Fall of Isfahan* (2012) · Roger Savory, *Iran under the Safavids* (1980) |
| **Mughal Empire** `global/mughal` | John Richards, *The Mughal Empire* (*New Cambridge History of India*, 1993) · Abraham Eraly, *The Mughal Throne* (2003) · Ruby Lal, *Empress: The Astonishing Reign of Nur Jahan* (2018) |
| **Joseon Korea** `global/joseon` | JaHyun Kim Haboush, *The Confucian Kingship in Korea* (1988) · Michael Seth, *A History of Korea* (2nd ed., 2016) · Martina Deuchler, *The Confucian Transformation of Korea* (1992) |
| **Japanese Shogunate** `global/shogunate` | Conrad Totman, *Tokugawa Ieyasu: Shogun* (1983) & *Early Modern Japan* (1993) · Marius Jansen, *The Making of Modern Japan* (2000) · Asao Naohiro et al., *Iwanami Japanese History* |
| **Polish-Lithuanian Commonwealth** `global/polish` | Norman Davies, *God's Playground: A History of Poland* (2 vols., 2005) · Robert Frost, *The Oxford History of Poland-Lithuania, Vol. 1* (2015) · Daniel Stone, *The Polish-Lithuanian State, 1386-1795* (2001) |
| **French Absolutism** `global/french` | John Lynn, *The Wars of Louis XIV* (1999) · Peter Burke, *The Fabrication of Louis XIV* (1992) · William Beik, *Absolutism and Society in Seventeenth-Century France* (1985) |
| **British Parliament** `global/british` | Robert Tombs, *The English and Their History* (2014) · David Starkey, *Crown and Country: A History of England through the Monarchy* (2010) · A.V. Dicey, *Introduction to the Study of the Law of the Constitution* (1885, classic) |
| **Russian Tsardom** `global/russian` | Orlando Figes, *A People's Tragedy: The Russian Revolution* (1996) · Geoffrey Hosking, *Russia: People and Empire 1552-1917* (1997) · Richard Pipes, *Russia under the Old Regime* (1974) |
| **Habsburg** `global/habsburg` | A.J.P. Taylor, *The Habsburg Monarchy 1809-1918* (1948) · Pieter Judson, *The Habsburg Empire: A New History* (2016) · Robin Okey, *The Habsburg Monarchy c.1765-1918* (2001) |
| **Prussia** `global/prussia` | Christopher Clark, *Iron Kingdom: The Rise and Downfall of Prussia* (2006) · Peter Paret, *Yorck and the Era of Prussian Reform* (1966) · Hans Rosenberg, *Bureaucracy, Aristocracy, and Autocracy: The Prussian Experience* (1958) |
| **Napoleon** `global/napoleon` | Andrew Roberts, *Napoleon: A Life* (2014) · Michael Broers, *Napoleon: Soldier of Destiny* (2014) · Jean Tulard, *Napoleon: The Myth of the Saviour* (1984) |
| **US Federal** `global/us-federal` | Alexander Hamilton, James Madison & John Jay, *The Federalist Papers* (1788, classic) · Robert Dahl, *How Democratic Is the American Constitution?* (2001) · Akhil Reed Amar, *America's Constitution: A Biography* (2005) |
| **Meiji Japan** `global/meiji` | Andrew Gordon, *A Modern History of Japan* (4th ed., 2019) · Marius Jansen, *The Making of Modern Japan* (2000) · W.G. Beasley, *The Rise of Modern Japan* (3rd ed., 1999) |
| **Soviet Union** `global/soviet` | Sheila Fitzpatrick, *The Russian Revolution* (4th ed., 2017) · Robert Service, *A History of Modern Russia* (3rd ed., 2009) · Stephen Kotkin, *Stalin: Paradoxes of Power* (2014) |
| **European Union** `global/eu` | Desmond Dinan, *Europe Recast: A History of European Union* (2nd ed., 2014) · Mark Gilbert, *European Integration: A Concise History* (2012) · Tony Judt, *Postwar: A History of Europe Since 1945* (2005) |
| **Swiss Confederation** `global/swiss` | Jonathan Steinberg, *Why Switzerland?* (3rd ed., 2015) · Clive Church & Randolph Head, *A Concise History of Switzerland* (2013) · Wolf Linder, *Swiss Democracy* (3rd ed., 2010) |
| **Inca Empire** `global/inca` | Terence D'Altroy, *The Incas* (2nd ed., 2015) · Brian Bauer, *The Development of the Inca State* (1992) · Gary Urton, *Inka History in Knots* (2017) |
| **Aztec Triple Alliance** `global/aztec` | Michael Smith, *The Aztecs* (3rd ed., 2012) · Ross Hassig, *Aztec Warfare* (1988) · David Carrasco, *The Aztecs: A Very Short Introduction* (2012) |
| **Zulu Kingdom** `global/zulu` | John Laband, *The Rise and Fall of the Zulu Nation* (1997) · Carolyn Hamilton, *Terrific Majesty: The Powers of Shaka Zulu* (1998) · Jeff Guy, *The Destruction of the Zulu Kingdom* (1979) |

### Western Political Theory & Comparative Politics

Different civilizations gave radically different answers to the same questions. These comparative perspectives helped shape the global empire Agent orchestration designs:

- **Aristotle, *Politics*** — The earliest regime taxonomy: monarchy, aristocracy, republic, and their variants. This project's 6 orchestration patterns are, in a sense, Aristotle's classification rewritten for AI
- **Montesquieu, *The Spirit of the Laws*** (1748) — The foundational work on separation of powers; directly maps to the US Federal and checks-and-balances pattern designs
- **Max Weber, *Economy and Society*** (1922) — The classic analysis of rational bureaucracy: hierarchy, specialization, rule-orientation
- **S.N. Eisenstadt, *The Political Systems of Empires*** (1963) — Systematic comparison of political structures across history's major empires
- **Francis Fukuyama, *The Origins of Political Order*** (2011) — The three dimensions of state-building, rule of law, and accountability
- **Charles Tilly, *Coercion, Capital, and European States*** (1990) — The diversity of European state forms
- **Samuel Huntington, *Political Order in Changing Societies*** (1968) — Political institutionalization theory
- **Douglass North, *Institutions, Institutional Change and Economic Performance*** (1990) — How institutions constrain and incentivize behavior — precisely what SOUL.md and IDENTITY.md do
- **Mancur Olson, *The Logic of Collective Action*** (1965) — Why democratic council patterns need incentive mechanisms
- **Karl Wittfogel, *Oriental Despotism*** (1957) — Hydraulic empires and centralization
- **Perry Anderson, *Lineages of the Absolutist State*** (1974) — Comparing Eastern and Western absolutism

### Organizational Theory & Multi-Agent Systems

The bridge between ancient political institutions and modern organizational/AI architecture:

- **Herbert Simon, *Administrative Behavior*** (1947) — Bounded rationality and hierarchical organization theory
- **Wooldridge & Jennings, "Intelligent Agents: Theory and Practice"** (*The Knowledge Engineering Review*, 1995) — Classic multi-agent systems survey
- **Dorri, Kanhere & Jurdak, "Multi-Agent Systems: A Survey"** (*IEEE Access*, 2018) — Modern MAS architecture taxonomy
- **Henry Mintzberg, *The Structuring of Organizations*** (1979) — Five basic organizational forms that closely match this project's six orchestration patterns

### Courses & MOOCs

| Course | Platform | Instructor | Relevance |
|--------|----------|------------|-----------|
| **Ancient Greek History** | [Yale Open Courses](https://oyc.yale.edu/classics/clcv-205) | Donald Kagan | Athenian democracy & Spartan dual kingship firsthand lectures |
| **Introduction to Political Philosophy** | [Yale Open Courses](https://oyc.yale.edu/political-science/plsc-114) | Steven B. Smith | Regime theory from Plato to Locke; directly inspired the 6-pattern taxonomy |
| **China's First Empires and the Rise of Buddhism** (ChinaX Part 2) | [edX / HarvardX](https://www.edx.org/learn/history/harvard-university-china-history) | Peter K. Bol | Qin-Han imperial institutions in English academic lectures |
| **Chinese Ancient History** | [MOOC China / Peking Univ.](https://www.icourse163.org/) | Yan Buke, Deng Xiaonan | Yan Buke on Rank & Office; Deng Xiaonan on Song Ancestral Law |
| **Global History** | [MOOC China / Peking Univ.](https://www.icourse163.org/) | Qian Chengdan et al. | Comparative global empire institutions |
| **The Fall and Rise of China** | [The Great Courses](https://www.thegreatcourses.com/) | Richard Baum | Qing, Taiping, ROC institutional transitions |
| **The Early Middle Ages, 284-1000** | [Yale Open Courses](https://oyc.yale.edu/history/hist-210) | Paul Freedman | Late Roman Empire, Byzantine, Frankish institutions |
| **European Civilization, 1648-1945** | [Yale Open Courses](https://oyc.yale.edu/history/hist-202) | John Merriman | French absolutism, British parliamentarism, Russian autocracy |

### Documentaries

| Title | Producer | Relevance |
|-------|----------|-----------|
| **The Story of China** (2016) | BBC · Michael Wood | 6 episodes spanning Shang to modern era — best English-language Chinese dynasty overview |
| **中国通史** (General History of China, 2016) | CCTV · 100 episodes | Panoramic institutional history from antiquity to Qing |
| **大明王朝 1566** (Ming Dynasty 1566, 2007) | Hunan TV · Dir. Zhang Li | Drama, but exceptionally precise depiction of Ming Cabinet-Eunuch dual-track system |
| **从秦始皇到汉武帝** (From Qin Shi Huang to Emperor Wu of Han, 2016) | CCTV | Qin-Han institutional transitions in detail |
| **河西走廊** (Hexi Corridor, 2015) | CCTV | Multi-ethnic empire governance — Liao, Jin, Western Xia, Yuan perspectives |
| **Empires** series | PBS | Covers Roman Empire, Ottoman Empire, Napoleon, etc. |
| **Ancient Egypt: Life and Death in the Valley of the Kings** (2013) | BBC · Joann Fletcher | Pharaoh theocracy and Vizier bureaucratic system |
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
- 📕 [*Political Gains and Losses Across Chinese Dynasties* by Qian Mu](https://book.douban.com/subject/1003479/)
- 🎮 [Sid Meier's Civilization](https://civilization.com/) — the "choose your civilization" concept's inspiration

---

MIT License | Based on [AI 朝廷](https://github.com/wanikua/boluobobo-ai-court-tutorial) by [@wanikua](https://github.com/wanikua)
