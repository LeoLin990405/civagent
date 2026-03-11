[English Version](./README_EN.md) | [原始项目 Original Project](https://github.com/wanikua/boluobobo-ai-court-tutorial)

# 🏛️ AI 治理天下 — 以古今中外 39 种政体治理你的 AI 团队

### 20 个中华朝代 + 19 个世界帝国 · 纯配置切换 · 零代码 · 基于 OpenClaw

<p align="center">
  <img src="https://img.shields.io/badge/政体-39种-gold?style=for-the-badge" />
  <img src="https://img.shields.io/badge/中华朝代-20个-red?style=for-the-badge" />
  <img src="https://img.shields.io/badge/世界帝国-19个-blue?style=for-the-badge" />
  <img src="https://img.shields.io/badge/框架-OpenClaw-green?style=for-the-badge" />
  <img src="https://img.shields.io/badge/代码修改-零-orange?style=for-the-badge" />
</p>

<div align="center">

### 👑 选择你的政体，一键切换

```bash
# 秦始皇的中央集权
./scripts/switch-regime.sh china/qin

# 雅典直接民主
./scripts/switch-regime.sh global/athens

# 美国三权分立
./scripts/switch-regime.sh global/us-federal

# 查看全部 39 种政体
./scripts/list-regimes.sh
```

</div>

---

## 致谢

> **本项目基于 [@wanikua](https://github.com/wanikua)（菠萝菠菠）的 [AI 朝廷](https://github.com/wanikua/boluobobo-ai-court-tutorial) 项目。**

没有 wanikua 的原始创意——把中国古代官制映射到 AI 多 Agent 协作——就不会有这个项目。「AI 朝廷」首发于 2026 年 2 月 22 日，开创性地将唐朝三省六部制与 OpenClaw 多 Agent 框架结合，让每个人都能用一行命令搭建自己的「AI 朝廷」。

**原始的唐朝三省六部制配置完整保留在 `regimes/china/tang/`，未做任何修改。**

在此向 wanikua 表达最诚挚的感谢。这是一个极具想象力和启发性的开源贡献。

详见 [CREDITS.md](./CREDITS.md)。

---

## 关于作者 & 这个项目的由来

我是一个在读的历史本科生，同时也是一个 AI 编程爱好者。

这学期我在学**世界政治史**，从雅典的直接民主到罗马的元老院，从波斯的总督制到蒙古的忽里勒台，不同文明在不同时代都在尝试回答同一个问题：**如何组织一群人（或一群 Agent）高效地协作？**

同时，我最近在读钱穆先生的**《中国历代政治得失》**。钱穆先生系统地分析了汉、唐、宋、明、清五代的政治制度——不是简单地评价好坏，而是去理解每一套制度在它的历史语境下为什么是那样设计的、解决了什么问题、又留下了什么隐患。读这本书的时候，我脑子里不断冒出一个想法：**这些制度设计的逻辑，跟现代软件架构里的 Agent 编排模式惊人地相似。**

- 秦朝的三公九卿 = 严格的中央集权层级调度
- 唐朝的三省六部 = 多节点的 checks & balances
- 明朝的内阁+司礼监 = 双轨审批的 dual power
- 周朝的分封制 = 松散联邦的自治体
- 雅典的公民大会 = 平等节点的民主投票

然后我刷到了 wanikua 的 [AI 朝廷](https://github.com/wanikua/boluobobo-ai-court-tutorial) 项目——**它已经把这个想法的第一步做出来了！** 用唐朝三省六部制来编排 AI Agent，真的太妙了。

于是我在想：既然唐朝可以，**为什么不把人类历史上所有的经典政体都做出来？** 从夏朝到太平天国，从古埃及到苏联，每一种政体都是前人用千百年的实践检验过的组织架构方案。把它们变成纯配置模块，让所有人都能一键切换体验——这就是 **AI 治理天下** 的由来。

这个项目不是在评价哪种制度好哪种制度坏，而是在探索：**不同的组织架构模式，在不同的任务场景下，会带来怎样不同的协作效果？** 中央集权适合快速执行，制衡体制适合质量把控，联邦自治适合多团队并行……这些古人用血与泪验证过的经验，或许真的能帮到今天的 AI 编排。

**历史不只是过去的事，它是组织智慧的活化石。**

---

## 这个项目是什么？

**AI 治理天下**将人类历史上 39 种经典政体——从夏朝的家族制到美国的三权分立——映射为 AI 多 Agent 协作的组织架构。每种政体是一个纯配置模块（JSON + Markdown），切换政体不需要改任何代码。

**核心理念：** 古代治国的智慧 = 现代管理 AI 团队的最佳实践。

---

## 政体目录

### 中华朝代（20）

| # | ID | 朝代 | 时代 | 制度 | Agent 模式 | Agent 数 |
|---|-----|------|------|------|-----------|---------|
| 1 | `china/xia` | 夏 | c.2070-1600 BC | 分封制/家族制 | 族长集权 + 松散部落 | 5 |
| 2 | `china/shang` | 商 | c.1600-1046 BC | 神权贵族制 | 神权决策 + 贵族执行 | 6 |
| 3 | `china/zhou` | 周 | c.1046-256 BC | 宗法分封制 | 联邦自治 | 8 |
| 4 | `china/qin` | 秦 | 221-206 BC | 郡县制·三公九卿 | 严格中央集权 | 7 |
| 5 | `china/han` | 汉 | 206 BC-220 AD | 三公九卿制 | 三公分权 + 九卿专职 | 10 |
| 6 | `china/three-kingdoms` | 三国 | 220-280 | 三国并立 | 3 独立朝廷竞争协作 | 9 |
| 7 | `china/jin` | 晋 | 266-420 | 九品中正制 | 弱中央 + 强地方 | 6 |
| 8 | `china/north-south` | 南北朝 | 420-589 | 门阀士族制 | 家族派系自治 | 6 |
| 9 | `china/sui` | 隋 | 581-618 | 三省六部制(初创) | 三省制衡(原型) | 7 |
| 10 | `china/tang` | **唐** ⭐ | 618-907 | **三省六部制(完善)** | **原版 ORIGINAL** | 7 |
| 11 | `china/five-dynasties` | 五代十国 | 907-960 | 分裂军阀制 | 竞争体 | 5 |
| 12 | `china/song` | 宋 | 960-1279 | 二府三司制 | 文官制衡 + 轮岗 | 8 |
| 13 | `china/yuan` | 元 | 1271-1368 | 行省制 | 蒙古集权 + 行省代理 | 7 |
| 14 | `china/ming` | 明 | 1368-1644 | 内阁制+司礼监 | 双轨决策 | 8 |
| 15 | `china/qing` | 清 | 1644-1912 | 军机处+满汉合作 | 精英小组快速决策 | 8 |
| 16 | `china/roc` | 中华民国 | 1912-1949 | 五权分立 | 五院互制 | 7 |
| 17 | `china/liao` | 辽 | 907-1125 | 双重行政制 | 南北双轨并行 | 6 |
| 18 | `china/jin-jurchen` | 金 | 1115-1234 | 女真汉分治 | 民族分工协作 | 6 |
| 19 | `china/western-xia` | 西夏 | 1038-1227 | 多民族州郡制 | 军事优先 + 宗教辅助 | 5 |
| 20 | `china/taiping` | 太平天国 | 1851-1864 | 神权专制/天王制 | 天王绝对集权 | 7 |

### 世界帝国（19）

| # | ID | 帝国 | 时代 | 制度 | Agent 模式 | Agent 数 |
|---|-----|------|------|------|-----------|---------|
| 1 | `global/egypt` | 古埃及 | 3100-30 BC | 法老神权制 | 神王 + 维齐尔代理 | 6 |
| 2 | `global/athens` | 雅典民主 | 508-322 BC | 直接民主制 | 全体 Agent 投票 | 6 |
| 3 | `global/sparta` | 斯巴达 | 900-192 BC | 双王制 | 双王协调 + 监察官监督 | 6 |
| 4 | `global/roman-republic` | 罗马共和国 | 509-27 BC | 元老院 + 执政官 | 双执政官 + 元老院投票 | 8 |
| 5 | `global/roman-empire` | 罗马帝国 | 27 BC-476 AD | 帝制官僚 | 皇帝 + 行省长官层级 | 7 |
| 6 | `global/byzantine` | 拜占庭帝国 | 330-1453 | 神权独裁制 | 皇帝-上帝代理人 + 大臣 | 7 |
| 7 | `global/persian` | 波斯帝国 | 550-330 BC | 总督制 | 万王之王 + 自治总督 | 7 |
| 8 | `global/ottoman` | 奥斯曼帝国 | 1299-1922 | 苏丹-迪万制 | 大维齐尔调度 | 7 |
| 9 | `global/mongol` | 蒙古帝国 | 1206-1368 | 汗国-忽里勒台 | 大汗 + 忽里勒台议事 | 6 |
| 10 | `global/hre` | 神圣罗马帝国 | 962-1806 | 选帝侯制 | 选帝侯选举 + 诸侯自治 | 7 |
| 11 | `global/british` | 英国议会制 | 1689-至今 | 君主立宪制 | 首相执政，君主象征 | 8 |
| 12 | `global/french` | 法国绝对君主制 | 1643-1789 | 朕即国家 | 太阳王绝对权力 | 7 |
| 13 | `global/russian` | 俄罗斯沙皇制 | 1547-1917 | 专制 + 贵族杜马 | 沙皇专制 + 参政院 | 7 |
| 14 | `global/shogunate` | 日本幕府制 | 1603-1868 | 幕府制 | 将军实权，天皇象征 | 7 |
| 15 | `global/mughal` | 莫卧儿帝国 | 1526-1857 | 曼萨布达尔制 | 皇帝 + 品级官僚 | 7 |
| 16 | `global/us-federal` | 美国联邦制 | 1789-至今 | 三权分立 | 立法/行政/司法分权 | 7 |
| 17 | `global/soviet` | 苏联 | 1922-1991 | 政治局制 | 总书记 + 政治局委员会 | 7 |
| 18 | `global/inca` | 印加帝国 | 1438-1533 | 萨帕·印卡四方制 | 太阳之子 + 四方总督 | 6 |
| 19 | `global/aztec` | 阿兹特克三方联盟 | 1428-1521 | 三方联盟制 | 三城邦议事会 | 6 |

---

## 6 种编排模式

每种政体对应一种 Agent 编排模式：

| 模式 | 代表政体 | 特点 | 适用场景 |
|------|---------|------|---------|
| **中央集权** | 秦、元、古埃及、法国、苏联 | 单一 main agent 统管所有 subagent | 需要快速决策和执行 |
| **制衡** | 唐、宋、隋、罗马共和国、美国 | 多个顶层 agent 互相审核 | 需要质量把控 |
| **双轨** | 明(内阁+司礼监)、斯巴达、辽 | 两个 main 级 agent 分庭抗礼 | 需要双重审批 |
| **联邦** | 周、三国、五代、神圣罗马帝国、波斯 | 独立 agent 组，最小化协调 | 多团队并行 |
| **民主议会** | 雅典、蒙古忽里勒台 | 平等 agent，投票决策 | 需要集体智慧 |
| **神权** | 商、太平天国、古埃及、拜占庭 | 最高 agent 拥有绝对权威 | 需要强力领导 |

---

## 快速开始

### 1. 安装 OpenClaw

```bash
# Linux
bash <(curl -fsSL https://raw.githubusercontent.com/wanikua/boluobobo-ai-court-tutorial/main/install.sh)

# macOS
bash <(curl -fsSL https://raw.githubusercontent.com/wanikua/boluobobo-ai-court-tutorial/main/install-mac.sh)
```

### 2. 克隆本项目

```bash
git clone https://github.com/LeoLin990405/boluobobo-ai-court-tutorial.git ai-governance
cd ai-governance
```

### 3. 选择政体

```bash
# 列出所有可用政体
./scripts/list-regimes.sh

# 切换到你想要的政体（例如秦朝中央集权）
./scripts/switch-regime.sh china/qin
```

### 4. 配置 API Key 并启动

```bash
# 编辑配置，填入 API Key 和 Bot Token
nano ~/.openclaw/openclaw.json

# 启动
openclaw gateway restart
```

---

## 如何切换政体

```bash
# 查看当前政体
cat ~/.openclaw/.active-regime

# 切换到新政体（自动备份旧配置）
./scripts/switch-regime.sh global/athens

# 重启生效
openclaw gateway restart
```

切换时会自动：
1. 备份当前的 SOUL.md / IDENTITY.md / openclaw.json
2. 部署新政体的配置文件
3. 保留你的 API Key 和 Bot Token

---

## 如何创建自定义政体

```bash
# 从模板创建新政体
./scripts/create-regime.sh global/your-empire

# 编辑 5 个配置文件
# 验证配置
./scripts/validate-regime.sh global/your-empire
```

详见 [政体设计指南](./docs/regime-design-guide.md)。

---

## 项目结构

```
ai-governance/
├── CREDITS.md                 # 致谢原作者 @wanikua
├── regimes/                   # 核心：所有政体配置
│   ├── _template/             # 政体模板（5 个文件）
│   ├── china/                 # 20 个中华朝代
│   │   ├── tang/              # ⭐ 原版（保留不动）
│   │   ├── qin/               # 秦·三公九卿
│   │   ├── han/               # 汉·三公九卿
│   │   └── ...
│   └── global/                # 19 个世界帝国
│       ├── athens/            # 雅典·直接民主
│       ├── roman-republic/    # 罗马·元老院
│       └── ...
├── scripts/                   # 政体管理工具
│   ├── switch-regime.sh       # 切换政体
│   ├── list-regimes.sh        # 列出所有政体
│   ├── validate-regime.sh     # 验证配置
│   └── create-regime.sh       # 创建新政体
├── docs/
│   └── regime-design-guide.md # 政体设计指南
├── install.sh                 # 安装脚本（原版）
├── gui/                       # Web 管理界面（原版）
└── skills/                    # OpenClaw Skills（原版）
```

每个政体包含 5 个文件：

| 文件 | 作用 |
|------|------|
| `metadata.json` | 机器可读的元数据（名称、时代、标签等） |
| `openclaw.json.template` | OpenClaw Agent 配置模板（Agent 定义、绑定、模型分配） |
| `SOUL.md` | 时代主题的行为准则（语言风格、交互规范、禁忌） |
| `IDENTITY.md` | 组织架构图 + 角色映射表 + 协作流程 |
| `README.md` | 说明文档 + 历史背景 + 使用示例 |

---

## 常见问题

**Q: 和原始 AI 朝廷项目有什么关系？**
AI 治理天下是 [AI 朝廷](https://github.com/wanikua/boluobobo-ai-court-tutorial) 的扩展 fork。原始的唐朝三省六部制配置完整保留在 `regimes/china/tang/`，我们在此基础上增加了 38 种新政体。原始项目的所有功能（安装脚本、GUI、Skills 等）均保持不变。

**Q: 切换政体需要改代码吗？**
不需要。每种政体是纯配置文件（JSON + Markdown），运行 `switch-regime.sh` 即可切换。

**Q: 我可以创建自己的政体吗？**
可以。运行 `create-regime.sh` 从模板创建，然后填写 5 个配置文件即可。欢迎 PR 贡献新政体！

**Q: 哪种政体最适合我？**

| 你的需求 | 推荐政体 | 原因 |
|---------|---------|------|
| 快速执行，不需要讨论 | 秦（中央集权） | 丞相统管一切，命令直达 |
| 质量审核，防止出错 | 唐（制衡）/ 美国（三权分立） | 多方互审，层层把关 |
| 多团队并行竞争 | 三国（联邦） | 魏蜀吴各自独立，竞争出最优方案 |
| 集体讨论民主决策 | 雅典（民主议会） | 所有 Agent 平等投票 |
| 双重审批流程 | 明（双轨） | 内阁票拟 + 司礼监批红 |
| 强力领导快速推进 | 苏联（中央集权） | 总书记 + 政治局高效决策 |

**Q: 这些政体的历史内容准确吗？**
我尽力保证了历史准确性（毕竟我是历史专业的），但这个项目的核心目的是 AI Agent 编排，而不是学术论文。如果你发现任何历史错误，非常欢迎提 Issue 或 PR 纠正！

---

## 灵感来源 & 参考文献

### 直接灵感

- [AI 朝廷](https://github.com/wanikua/boluobobo-ai-court-tutorial) by [@wanikua](https://github.com/wanikua) — 原始创意和唐朝实现，点燃了整个项目
- [OpenClaw](https://github.com/openclaw/openclaw) — 底层多 Agent 框架

### 中国政治制度史

这些著作帮助我理解了每个朝代制度设计背后的逻辑——不是简单的好坏，而是特定历史条件下的理性选择：

- **钱穆《中国历代政治得失》** — 本项目最核心的灵感来源。钱穆先生对汉、唐、宋、明、清五代制度的对比分析，让我看到了「三省制衡」「内阁票拟」「军机处速决」等不同模式的设计逻辑
- **钱穆《国史大纲》** — 通史视角下的制度演变脉络，理解每个朝代为什么在前朝基础上做了那样的改革
- **吕思勉《中国制度史》** — 按专题系统梳理了官制、兵制、刑法、财政等制度的演变，是设计各朝代 Agent 角色时的重要参考
- **白钢 主编《中国政治制度史》** — 从先秦到近代的全面制度史，覆盖了本项目所有 20 个中华朝代
- **阎步克《品位与职位：秦汉魏晋南北朝官阶制度研究》** — 深入分析了九品中正制等品位制度如何影响官僚选拔，直接启发了晋朝和南北朝的 Agent 设计
- **田余庆《东晋门阀政治》** — 门阀士族如何架空皇权形成「弱中央+强地方」格局，启发了晋朝和南北朝的联邦自治模式
- **黄仁宇《万历十五年》** (*1587, A Year of No Significance*) — 从微观视角展示了明朝内阁与司礼监的双轨制如何运作（和失灵），直接影响了明朝 dual-power 模式的设计
- **杨宽《战国史》** — 理解从分封到郡县的制度转型，启发了周→秦的编排模式差异
- **姚大力《读史的智慧》** — 蒙元和清代多民族帝国的治理逻辑，帮助理解「因俗而治」的辽金元清模式

### 西方政治理论 & 比较政治学

不同文明对同一个问题给出了截然不同的答案，这些比较视角帮助我设计全球帝国的 Agent 编排：

- **亚里士多德《政治学》** (*Aristotle, Politics*) — 最早的政体分类学：君主制、贵族制、共和制及其变体。本项目的 6 种编排模式在某种意义上是亚里士多德分类的 AI 版本
- **孟德斯鸠《论法的精神》** (*Montesquieu, The Spirit of the Laws*, 1748) — 三权分立理论的奠基之作，直接对应了 US Federal 和 checks-and-balances 模式的设计
- **马克斯·韦伯「官僚制理论」** (*Max Weber, Economy and Society*, 1922) — 理性官僚制的经典分析：层级、专业化、规则导向。韦伯对中国传统官僚制和西方法理型权威的对比，帮助我理解不同政体的 Agent 层级设计
- **S.N. 艾森施塔特《帝国的政治体系》** (*S.N. Eisenstadt, The Political Systems of Empires*, 1963) — 系统比较了人类历史上主要帝国的政治结构，是设计全球帝国编排模式的理论框架
- **弗朗西斯·福山《政治秩序的起源》** (*Francis Fukuyama, The Origins of Political Order*, 2011) — 从国家建构、法治、问责三个维度分析政治发展，帮助理解为什么有些政体倾向集权，有些倾向制衡
- **查尔斯·蒂利《强制、资本与欧洲国家》** (*Charles Tilly, Coercion, Capital, and European States*, 1990) — 解释了欧洲国家形态的多样性（从城邦到帝国），启发了神圣罗马帝国和英国议会制等差异化设计
- **塞缪尔·亨廷顿《变化社会中的政治秩序》** (*Samuel Huntington, Political Order in Changing Societies*, 1968) — 政治制度化理论，解释了为什么有些政体稳定而有些崩溃
- **道格拉斯·诺斯《制度、制度变迁与经济绩效》** (*Douglass North, Institutions, Institutional Change and Economic Performance*, 1990) — 新制度经济学的奠基作品，制度如何约束和激励行为——这恰恰就是 SOUL.md 和 IDENTITY.md 在做的事
- **曼瑟·奥尔森《集体行动的逻辑》** (*Mancur Olson, The Logic of Collective Action*, 1965) — 为什么民主议会模式（雅典、忽里勒台）需要特殊的激励机制才能有效运作
- **卡尔·魏特夫《东方专制主义》** (*Karl Wittfogel, Oriental Despotism*, 1957) — 虽然争议很大，但他关于水利帝国和集权制度关系的论述，对理解秦汉-埃及-印加等集权政体仍有参考价值

### 组织理论 & 多 Agent 系统

古代政治制度和现代组织/AI 架构之间的桥梁：

- **赫伯特·西蒙《管理行为》** (*Herbert Simon, Administrative Behavior*, 1947) — 有限理性和层级组织理论，解释了为什么中央集权模式在信息有限时反而高效
- **Wooldridge & Jennings, "Intelligent Agents: Theory and Practice"** (*The Knowledge Engineering Review*, 1995) — 多 Agent 系统的经典综述，Agent 的自主性、社会性、反应性映射到古代官僚的角色特征
- **Dorri, Kanhere & Jurdak, "Multi-Agent Systems: A Survey"** (*IEEE Access*, 2018) — 现代多 Agent 系统架构分类，其中的层级式、扁平式、混合式与本项目的 6 种编排模式高度对应

### 课程 & 通识

- 世界政治史课程 — 让我系统地看到了从古埃及到冷战时期，不同文明的制度设计智慧
- [Crash Course: World History](https://www.youtube.com/playlist?list=PLBDA2E52FB1EF80C9) — John Green 的世界史系列，虽然是入门级但视角独特，启发了不少跨文明对比的想法

---

## 相关链接

- 🏛️ [原始项目 AI 朝廷](https://github.com/wanikua/boluobobo-ai-court-tutorial) — by [@wanikua](https://github.com/wanikua)
- 🏢 [Become CEO — 企业版](https://github.com/wanikua/become-ceo) — 同一架构的现代企业版
- 🔧 [OpenClaw 框架](https://github.com/openclaw/openclaw)
- 📖 [OpenClaw 文档](https://docs.openclaw.ai)
- 📕 [《中国历代政治得失》](https://book.douban.com/subject/1003479/) — 钱穆

---

MIT License | 基于 [AI 朝廷](https://github.com/wanikua/boluobobo-ai-court-tutorial) by [@wanikua](https://github.com/wanikua)
