[English Version](./README_EN.md) | [原始项目 Original Project](https://github.com/wanikua/boluobobo-ai-court-tutorial) | [🌐 在线浏览 Live Demo](https://leolin990405.github.io/civagent/)

<p align="center">
  <img src="./images/civagent-banner.svg" alt="CivAgent Banner" width="100%" />
</p>

# 🎮 CivAgent — 选择你的文明，指挥你的 AI 团队

### 人类 5000 年治国智慧 × AI 多 Agent 协作 | 57 种政体 · 纯配置切换 · 零代码 · 基于 OpenClaw

<p align="center">
  <img src="https://img.shields.io/badge/文明-57种-gold?style=for-the-badge" />
  <img src="https://img.shields.io/badge/中华朝代-20个-red?style=for-the-badge" />
  <img src="https://img.shields.io/badge/世界帝国-37个-blue?style=for-the-badge" />
  <img src="https://img.shields.io/badge/编排模式-6种-purple?style=for-the-badge" />
  <img src="https://img.shields.io/badge/框架-OpenClaw-green?style=for-the-badge" />
  <img src="https://img.shields.io/badge/代码修改-零-orange?style=for-the-badge" />
</p>

<div align="center">

> *「世界历史可以这样总结：当国家强大时，它们并不总是公正的；*
> *而当它们希望做到公正时，它们往往已不再强大。」*
> *— 温斯顿·丘吉尔*

</div>

---

<div align="center">

### 🏛️ 选择你的文明，一键部署

```bash
# 🐉 秦始皇的中央集权 — 令行禁止，效率至上
./scripts/switch-regime.sh china/qin

# 🏛️ 雅典直接民主 — 所有 Agent 平等投票
./scripts/switch-regime.sh global/athens

# ⚖️ 美国三权分立 — 立法、行政、司法互相制衡
./scripts/switch-regime.sh global/us-federal

# 🗡️ 斯巴达双王制 — 双主节点冗余保障
./scripts/switch-regime.sh global/sparta

# 📜 查看全部 57 种文明
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

白天我是一条数据狗——写 SQL、跑 ETL、盯仪表盘；晚上我是一个在线兼职历史学本科在读生，同时也是一个 AI 编程爱好者。

### 一切的起点：钱穆与政治制度的「设计模式」

这学期我在上**世界政治史**的课程，从雅典的直接民主到罗马的元老院，从波斯的总督制到蒙古的忽里勒台，不同文明在不同时代都在尝试回答同一个问题：**如何组织一群人（或一群 Agent）高效地协作？** 作为数据人，我天然地对「系统如何运转」这类问题着迷——一个政体的组织架构，本质上就是一套分布式系统的拓扑设计。

同时，我在读钱穆先生的**《中国历代政治得失》**。这本书改变了我对制度史的认知。钱穆先生系统地分析了汉、唐、宋、明、清五代的政治制度——不是简单地评价好坏，而是去理解每一套制度在它的历史语境下为什么是那样设计的、解决了什么问题、又留下了什么隐患。他有一个核心观点：**每一代的制度都是对上一代制度弊端的回应**。汉代的三公九卿权力过于集中，所以唐代用三省来分权制衡；唐代的门下省封驳权过大，所以宋代削弱相权、设立二府三司；宋代文官制衡导致效率低下，所以明代创设内阁来提速——但又怕内阁坐大，于是用司礼监来制衡内阁。

这种**「问题→制度回应→新问题→新制度」的迭代逻辑**，在我看来跟软件工程里的架构演进一模一样。

### 制度设计 ≈ 分布式系统架构

读这本书的时候，我脑子里不断冒出一个想法：**这些制度设计的逻辑，跟现代软件架构里的 Agent 编排模式惊人地相似。** 它们面对的核心问题是一样的——信息不对称、委托-代理困境、权力制衡与执行效率的平衡：

| 古代政治制度 | 分布式系统 / Agent 编排 | 共同解决的问题 |
|------------|----------------------|-------------|
| 秦朝三公九卿：丞相统管百官 | 中央集权层级调度：单 main agent | 快速决策、一致性保障 |
| 唐朝三省六部：中书起草→门下审核→尚书执行 | Checks & balances：多 agent 交叉审核 | 防止单点错误、质量把控 |
| 明朝内阁+司礼监：票拟→批红 | Dual power：双 main agent 交叉审批 | 权力制衡与决策效率的平衡 |
| 周朝宗法分封：天子→诸侯→大夫 | 联邦自治：独立 agent 组 | 大规模并行、减少中心瓶颈 |
| 雅典公民大会：一人一票 | 民主议会：等权 agent 投票 | 集体智慧、防止独裁 |
| 商朝神权政治：巫祝代天决策 | 神权模式：绝对权威 main agent | 危机时的快速统一行动 |

这不是牵强附会的比喻。亨利·明茨伯格 (Henry Mintzberg) 在 1979 年的经典著作《组织的结构》中提出了五种基本的组织形态——简单结构 (Simple Structure)、机械官僚制 (Machine Bureaucracy)、专业官僚制 (Professional Bureaucracy)、事业部制 (Divisionalized Form)、临时体制 (Adhocracy)——这与本项目的六种编排模式在结构上高度同构。政治制度、组织理论、分布式系统，本质上是**同一类问题在不同领域的不同表达**。

赫伯特·西蒙 (Herbert Simon) 在《管理行为》(1947) 中提出的「有限理性」(bounded rationality) 概念可以完美解释为什么不同的政体在不同情境下各有优劣——没有一个 agent（或人类决策者）能够获得完全信息并做出最优决策，因此制度设计的核心就是**在信息不完全的约束下，设计出最有效的决策流程**。秦朝的集权适合信息流动快、决策紧急的场景；唐朝的制衡适合信息复杂、需要多角度审核的场景；周朝的联邦适合信息分散、各区域差异大的场景。

### 从「AI 朝廷」到 CivAgent

然后我刷到了 wanikua 的 [AI 朝廷](https://github.com/wanikua/boluobobo-ai-court-tutorial) 项目——**它已经把这个想法的第一步做出来了！** 用唐朝三省六部制来编排 AI Agent，真的太妙了。

于是我在想：既然唐朝可以，**为什么不把人类历史上所有的经典政体都做出来？** 就像《文明》游戏让你选择不同文明来体验不同的科技树和治国策略——CivAgent 让你选择不同政体来体验不同的 AI 编排模式。从夏朝到太平天国，从苏美尔到欧盟，每一种政体都是前人用千百年的实践检验过的组织架构方案。

弗朗西斯·福山 (Francis Fukuyama) 在《政治秩序的起源》中提出，有效的政治秩序需要三个维度：**国家能力 (state capacity)、法治 (rule of law)、民主问责 (democratic accountability)**。不同政体在这三个维度上的取舍，恰好对应了 AI 编排中的三个核心权衡：

- **执行效率** ↔ 国家能力：集权模式（秦、苏联）将这个维度推到极致
- **错误预防** ↔ 法治：制衡模式（唐、美国）通过制度化的审核流程来保障质量
- **参与度** ↔ 民主问责：民主模式（雅典、维京）让所有 agent 参与决策

这三者不可能同时最大化——这正是亨廷顿 (Samuel Huntington) 在《变化社会中的政治秩序》(1968) 中反复强调的核心张力。CivAgent 的 57 种政体，就是人类历史上对这个「不可能三角」的 57 种不同回答。

### 这个项目不是在评判历史

这个项目不是在评价哪种制度好哪种制度坏。正如钱穆先生所说：「任何一个制度之建立，必有其当时的需要，亦必有其当时的用意。我们不能用后代的眼光来批评前代的制度。」CivAgent 的目的是**把每种制度的设计逻辑提取出来，变成可复用的 AI 协作模式**。

从更深层来看，道格拉斯·诺斯 (Douglass North) 在《制度、制度变迁与经济绩效》(1990) 中指出：**制度是人类设计的约束，用来塑造人际互动。** 在 CivAgent 中，SOUL.md 定义了行为约束（相当于文化规范），IDENTITY.md 定义了角色权限（相当于正式制度），openclaw.json 定义了通信规则（相当于制度的执行机制）。每一种政体，就是一套完整的「制度设计方案」。

不同的组织架构模式，在不同的任务场景下，会带来怎样不同的协作效果？中央集权适合快速执行，制衡体制适合质量把控，联邦自治适合多团队并行……这些古人用血与泪验证过的经验，或许真的能帮到今天的 AI 编排。

**历史不只是过去的事，它是组织智慧的活化石。**

---

## 这个项目是什么？

**CivAgent (AI 文明)** 将人类历史上 57 种经典政体——从夏朝的家族制到美国的三权分立，从苏美尔的神庙经济到欧盟的超国家治理——映射为 AI 多 Agent 协作的组织架构。每种政体是一个纯配置模块（JSON + Markdown），切换政体不需要改任何代码。

**核心理念：** 古代治国的智慧 = 现代管理 AI 团队的最佳实践。

这不是一个简单的「换皮」项目。每种政体的 Agent 编排都经过了对应历史制度的仔细研究，在信息流向、决策权限、审核机制、容错设计上都忠实反映了该政体的核心制度逻辑。比如，唐朝三省六部的「中书起草→门下审核→尚书执行」被映射为三个 top-level agent 之间的 `sessions_send` 审核链；明朝的「内阁票拟→司礼监批红」被映射为两个 main agent 的交叉审批流程。S.N. 艾森施塔特 (S.N. Eisenstadt) 在《帝国的政治体系》(1963) 中系统比较了人类历史上主要帝国的政治结构，CivAgent 可以看作是这种比较政治学方法在 AI 系统设计领域的一次实验性应用。

### 为什么叫 CivAgent？

CivAgent 的命名致敬了 Sid Meier 的《文明》(Civilization) 系列——游戏史上最经典的策略游戏之一。《文明》的核心魅力在于：**你选择的文明决定了你的治国方式，而治国方式决定了你的文明走向。** CivAgent 把这个理念移植到了 AI 多 Agent 编排领域：

| 《文明》游戏 | CivAgent | 背后的设计思考 |
|-------------|----------|--------------|
| 选择一个文明 | 选择一种政体 | 不同的起点决定不同的发展路径 |
| 每个文明有独特的科技树 | 每种政体有独特的 Agent 编排模式 | 技术路径依赖 (path dependence) |
| 不同文明有不同的特殊能力 | 不同政体有不同的协作优势 | 制度比较优势 (comparative institutional advantage) |
| 建造奇观提升能力 | 配置 SOUL.md 定义行为准则 | 文化规范对行为的约束力 |
| 选择政策卡牌组合 | 组合 Agent 角色与权限 | 制度设计的模块化与可组合性 |
| 外交、贸易、战争策略 | Agent 间的通信、审核、竞争机制 | 博弈论与机制设计 |

**CivAgent = Civilization + Agent。** 用文明的智慧，编排 Agent 的协作。

但 CivAgent 和《文明》有一个根本区别：《文明》追求的是「赢」——统治胜利、科技胜利、文化胜利；而 CivAgent 追求的是**「适」**——没有最好的政体，只有最适合当前任务场景的政体。这恰好回到了亚里士多德在《政治学》中的核心洞见：**最好的政体取决于具体的情境和目的 (the best constitution depends on circumstances)**。

---

## 文明图鉴

### 🐉 中华朝代（20）

> *从部落联盟到中央集权，从贵族政治到文官体制——中华五千年，每个朝代都是一次制度实验。*

| # | ID | 朝代 | 时代 | 制度 | Agent 编排模式 | Agent 数 |
|---|-----|------|------|------|---------------|---------|
| 1 | `china/xia` | [夏](./regimes/china/xia/README.md) | c.2070-1600 BC | 分封制/家族制 | 族长集权 + 松散部落 | 5 |
| 2 | `china/shang` | [商](./regimes/china/shang/README.md) | c.1600-1046 BC | 神权贵族制 | 神权决策 + 贵族执行 | 6 |
| 3 | `china/zhou` | [周](./regimes/china/zhou/README.md) | c.1046-256 BC | 宗法分封制 | 联邦自治 | 8 |
| 4 | `china/qin` | [秦](./regimes/china/qin/README.md) | 221-206 BC | 郡县制·三公九卿 | 严格中央集权 | 7 |
| 5 | `china/han` | [汉](./regimes/china/han/README.md) | 206 BC-220 AD | 三公九卿制 | 三公分权 + 九卿专职 | 10 |
| 6 | `china/three-kingdoms` | [三国](./regimes/china/three-kingdoms/README.md) | 220-280 | 三国并立 | 3 独立朝廷竞争协作 | 9 |
| 7 | `china/jin` | [晋](./regimes/china/jin/README.md) | 266-420 | 九品中正制 | 弱中央 + 强地方 | 6 |
| 8 | `china/north-south` | [南北朝](./regimes/china/north-south/README.md) | 420-589 | 门阀士族制 | 家族派系自治 | 6 |
| 9 | `china/sui` | [隋](./regimes/china/sui/README.md) | 581-618 | 三省六部制(初创) | 三省制衡(原型) | 7 |
| 10 | `china/tang` | [**唐** ⭐](./regimes/china/tang/README.md) | 618-907 | **三省六部制(完善)** | **原版 ORIGINAL** | 7 |
| 11 | `china/five-dynasties` | [五代十国](./regimes/china/five-dynasties/README.md) | 907-960 | 分裂军阀制 | 竞争体 | 5 |
| 12 | `china/song` | [宋](./regimes/china/song/README.md) | 960-1279 | 二府三司制 | 文官制衡 + 轮岗 | 8 |
| 13 | `china/yuan` | [元](./regimes/china/yuan/README.md) | 1271-1368 | 行省制 | 蒙古集权 + 行省代理 | 7 |
| 14 | `china/ming` | [明](./regimes/china/ming/README.md) | 1368-1644 | 内阁制+司礼监 | 双轨决策 | 8 |
| 15 | `china/qing` | [清](./regimes/china/qing/README.md) | 1644-1912 | 军机处+满汉合作 | 精英小组快速决策 | 8 |
| 16 | `china/roc` | [中华民国](./regimes/china/roc/README.md) | 1912-1949 | 五权分立 | 五院互制 | 7 |
| 17 | `china/liao` | [辽](./regimes/china/liao/README.md) | 907-1125 | 双重行政制 | 南北双轨并行 | 6 |
| 18 | `china/jin-jurchen` | [金](./regimes/china/jin-jurchen/README.md) | 1115-1234 | 女真汉分治 | 民族分工协作 | 6 |
| 19 | `china/western-xia` | [西夏](./regimes/china/western-xia/README.md) | 1038-1227 | 多民族州郡制 | 军事优先 + 宗教辅助 | 5 |
| 20 | `china/taiping` | [太平天国](./regimes/china/taiping/README.md) | 1851-1864 | 神权专制/天王制 | 天王绝对集权 | 7 |

### 🌍 世界帝国（37）

> *从尼罗河畔的法老到日内瓦的联邦委员会，从两河流域的苏美尔到南非的祖鲁——每个文明都在用自己的方式回答同一个问题。*

#### 古代文明 (Ancient Civilizations)

| # | ID | 帝国 | 时代 | 制度 | Agent 模式 | Agent 数 |
|---|-----|------|------|------|-----------|---------|
| 1 | `global/sumeria` | [苏美尔城邦](./regimes/global/sumeria/README.md) | c.4500-1900 BC | 神庙经济制 | 神权 + 王权双轨 | 6 |
| 2 | `global/egypt` | [古埃及](./regimes/global/egypt/README.md) | 3100-30 BC | 法老神权制 | 神王 + 维齐尔代理 | 6 |
| 3 | `global/athens` | [雅典民主](./regimes/global/athens/README.md) | 508-322 BC | 直接民主制 | 全体 Agent 投票 | 6 |
| 4 | `global/sparta` | [斯巴达](./regimes/global/sparta/README.md) | 900-192 BC | 双王制 | 双王协调 + 监察官监督 | 6 |
| 5 | `global/persian` | [波斯帝国](./regimes/global/persian/README.md) | 550-330 BC | 总督制 | 万王之王 + 自治总督 | 7 |
| 6 | `global/carthage` | [迦太基共和国](./regimes/global/carthage/README.md) | 814-146 BC | 商业寡头制 | 双苏非特 + 元老院 | 7 |
| 7 | `global/maurya` | [孔雀王朝](./regimes/global/maurya/README.md) | 322-185 BC | 政事论制 | 皇帝 + 谍报网 | 7 |

#### 古典帝国 (Classical Empires)

| # | ID | 帝国 | 时代 | 制度 | Agent 模式 | Agent 数 |
|---|-----|------|------|------|-----------|---------|
| 8 | `global/roman-republic` | [罗马共和国](./regimes/global/roman-republic/README.md) | 509-27 BC | 元老院 + 执政官 | 双执政官 + 元老院投票 | 8 |
| 9 | `global/roman-empire` | [罗马帝国](./regimes/global/roman-empire/README.md) | 27 BC-476 AD | 帝制官僚 | 皇帝 + 行省长官层级 | 7 |
| 10 | `global/byzantine` | [拜占庭帝国](./regimes/global/byzantine/README.md) | 330-1453 | 神权独裁制 | 皇帝-上帝代理人 + 大臣 | 7 |

#### 中世纪政权 (Medieval Powers)

| # | ID | 帝国 | 时代 | 制度 | Agent 模式 | Agent 数 |
|---|-----|------|------|------|-----------|---------|
| 11 | `global/caliphate` | [阿拔斯哈里发国](./regimes/global/caliphate/README.md) | 750-1258 | 哈里发-维齐尔制 | 知识增强型集权 | 7 |
| 12 | `global/viking` | [维京庭议制](./regimes/global/viking/README.md) | 800-1100 | 庭议民主制 | 全体庭议投票 | 5 |
| 13 | `global/hre` | [神圣罗马帝国](./regimes/global/hre/README.md) | 962-1806 | 选帝侯制 | 选帝侯选举 + 诸侯自治 | 7 |
| 14 | `global/mongol` | [蒙古帝国](./regimes/global/mongol/README.md) | 1206-1368 | 汗国-忽里勒台 | 大汗 + 忽里勒台议事 | 6 |
| 15 | `global/venice` | [威尼斯共和国](./regimes/global/venice/README.md) | 697-1797 | 总督+大议会 | 反腐制衡体系 | 7 |
| 16 | `global/mali` | [马里帝国](./regimes/global/mali/README.md) | 1235-1600 | 曼萨制 | 口传传统 + 贸易网 | 6 |
| 17 | `global/khmer` | [高棉帝国](./regimes/global/khmer/README.md) | 802-1431 | 神王制 | 神王绝对 + 水利 | 6 |

#### 近世帝国 (Early Modern Empires)

| # | ID | 帝国 | 时代 | 制度 | Agent 模式 | Agent 数 |
|---|-----|------|------|------|-----------|---------|
| 18 | `global/ottoman` | [奥斯曼帝国](./regimes/global/ottoman/README.md) | 1299-1922 | 苏丹-迪万制 | 大维齐尔调度 | 7 |
| 19 | `global/safavid` | [萨法维帝国](./regimes/global/safavid/README.md) | 1501-1736 | 什叶派神权君主制 | 沙阿 + 宗教权威 | 7 |
| 20 | `global/mughal` | [莫卧儿帝国](./regimes/global/mughal/README.md) | 1526-1857 | 曼萨布达尔制 | 皇帝 + 品级官僚 | 7 |
| 21 | `global/joseon` | [朝鲜王朝](./regimes/global/joseon/README.md) | 1392-1897 | 新儒学官僚制 | 三司言谏制衡 | 7 |
| 22 | `global/shogunate` | [日本幕府制](./regimes/global/shogunate/README.md) | 1603-1868 | 幕府制 | 将军实权，天皇象征 | 7 |
| 23 | `global/polish` | [波兰立陶宛联邦](./regimes/global/polish/README.md) | 1569-1795 | 选举君主制 | 自由否决权 + 议会 | 6 |

#### 绝对主义与革命时代 (Age of Absolutism & Revolution)

| # | ID | 帝国 | 时代 | 制度 | Agent 模式 | Agent 数 |
|---|-----|------|------|------|-----------|---------|
| 24 | `global/french` | [法国绝对君主制](./regimes/global/french/README.md) | 1643-1789 | 朕即国家 | 太阳王绝对权力 | 7 |
| 25 | `global/british` | [英国议会制](./regimes/global/british/README.md) | 1689-至今 | 君主立宪制 | 首相执政，君主象征 | 8 |
| 26 | `global/russian` | [俄罗斯沙皇制](./regimes/global/russian/README.md) | 1547-1917 | 专制 + 贵族杜马 | 沙皇专制 + 参政院 | 7 |
| 27 | `global/habsburg` | [哈布斯堡·奥匈帝国](./regimes/global/habsburg/README.md) | 1867-1918 | 二元君主制 | 双轨议会并行 | 7 |
| 28 | `global/prussia` | [普鲁士王国](./regimes/global/prussia/README.md) | 1701-1918 | 军事官僚制 | 总参谋部体系 | 6 |
| 29 | `global/napoleon` | [拿破仑帝国](./regimes/global/napoleon/README.md) | 1804-1815 | 功绩制中央集权 | 能力至上 + 法典 | 7 |

#### 近现代体制 (Modern Systems)

| # | ID | 帝国 | 时代 | 制度 | Agent 模式 | Agent 数 |
|---|-----|------|------|------|-----------|---------|
| 30 | `global/us-federal` | [美国联邦制](./regimes/global/us-federal/README.md) | 1789-至今 | 三权分立 | 立法/行政/司法分权 | 7 |
| 31 | `global/meiji` | [明治日本](./regimes/global/meiji/README.md) | 1868-1912 | 立宪君主制 | 元老非正式集权 | 7 |
| 32 | `global/soviet` | [苏联](./regimes/global/soviet/README.md) | 1922-1991 | 政治局制 | 总书记 + 政治局委员会 | 7 |
| 33 | `global/eu` | [欧盟](./regimes/global/eu/README.md) | 1993-至今 | 超国家治理 | 三方共决民主 | 7 |
| 34 | `global/swiss` | [瑞士联邦](./regimes/global/swiss/README.md) | 1291-至今 | 直接民主制 | 公投 + 合议制 | 6 |

#### 非洲与美洲 (Africa & Americas)

| # | ID | 帝国 | 时代 | 制度 | Agent 模式 | Agent 数 |
|---|-----|------|------|------|-----------|---------|
| 35 | `global/inca` | [印加帝国](./regimes/global/inca/README.md) | 1438-1533 | 萨帕·印卡四方制 | 太阳之子 + 四方总督 | 6 |
| 36 | `global/aztec` | [阿兹特克三方联盟](./regimes/global/aztec/README.md) | 1428-1521 | 三方联盟制 | 三城邦议事会 | 6 |
| 37 | `global/zulu` | [祖鲁王国](./regimes/global/zulu/README.md) | 1816-1897 | 军事团制 | 国王 + 军团层级 | 5 |

---

## 6 种编排模式 — 你的「治国科技树」

就像《文明》中的科技树决定了你的发展路线，CivAgent 的 6 种编排模式决定了 AI 团队的协作方式。这 6 种模式并非我凭空发明——它们是对亚里士多德以来 2400 年政体分类学传统的提炼，同时也与明茨伯格的组织形态理论、Wooldridge & Jennings 的多 Agent 系统分类高度吻合。每种模式在「决策速度 vs 决策质量 vs 参与广度」这个不可能三角中占据不同的位置：

```
                        ┌──────────────┐
                        │   神权模式    │ 商·太平天国·埃及·拜占庭
                        │  (Theocratic) │ 绝对权威，不容置疑
                        └──────┬───────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
     ┌────────▼────────┐ ┌────▼─────┐ ┌────────▼────────┐
     │  中央集权模式     │ │ 双轨模式  │ │  联邦自治模式     │
     │ (Centralized)   │ │(Dual     │ │ (Federated)     │
     │ 秦·元·法国·苏联  │ │ Power)   │ │ 周·三国·HRE·波斯 │
     │ 一元化指挥       │ │ 明·斯巴达 │ │ 分散自治         │
     └────────┬────────┘ │ ·辽      │ └────────┬────────┘
              │          │ 双重审批  │          │
              │          └────┬─────┘          │
              │               │                │
              └───────────────┼────────────────┘
                              │
              ┌───────────────┼───────────────┐
              │                               │
     ┌────────▼────────┐             ┌────────▼────────┐
     │  制衡模式        │             │  民主议会模式     │
     │ (Checks &       │             │ (Democratic      │
     │  Balances)       │             │  Council)        │
     │ 唐·宋·美国·隋   │             │ 雅典·蒙古·维京   │
     │ 互相审核         │             │ 平等投票         │
     └─────────────────┘             └─────────────────┘
```

### 模式详解

| 模式 | 代表文明 | 核心特点 | OpenClaw 实现 | 最佳场景 |
|------|---------|---------|--------------|---------|
| **中央集权** (Centralized) | 秦、元、古埃及、法国绝对制、苏联、拿破仑、普鲁士、孔雀王朝 | 单一 main agent 统管所有 subagent，命令链清晰，执行迅速 | 单 `main` + `subagents.allowAgents` | 紧急任务、需要快速一致决策 |
| **制衡** (Checks & Balances) | 唐、宋、隋、罗马共和国、美国联邦、威尼斯、朝鲜、迦太基 | 多个顶层 agent 互相审核，防止单点错误 | 多 top-level agent + `sessions_send` 审核 | 高质量要求、防错场景 |
| **双轨** (Dual Power) | 明(内阁+司礼监)、斯巴达(双王)、辽(南北面)、哈布斯堡(二元制) | 两个 main 级 agent 各管一条线，交叉审批 | 双 `main` + 重叠 subagents | 需要双重审批、两条产品线 |
| **联邦** (Federated) | 周、三国、五代、神圣罗马帝国、波斯、波兰联邦 | 独立 agent 组自治运行，最小化跨组协调 | 独立 agent 组 + 最少通信 | 多团队并行、微服务架构 |
| **民主议会** (Democratic) | 雅典、蒙古忽里勒台、维京庭议、瑞士、欧盟 | 所有 agent 平等参与，投票决策 | 等级 agent + 投票 `sessions_send` | 头脑风暴、集体决策 |
| **神权** (Theocratic) | 商、太平天国、古埃及、拜占庭、萨法维、高棉 | 最高 agent 拥有绝对权威，其他 agent 完全服从 | 绝对权威 `main` + 服从性 subagents | 强力领导、紧急危机处理 |

### 模式背后的理论逻辑

这六种模式不是随意归纳的分类，它们对应着政治学和组织理论中反复出现的核心权衡：

**1. 中央集权 vs 分权：永恒的效率-质量悖论**

查尔斯·蒂利 (Charles Tilly) 在《强制、资本与欧洲国家》中指出，国家形态的演变本质上是**强制力集中程度与社会复杂度之间的博弈**。在 Agent 编排中，这对应着一个基本权衡：集中控制（单 main agent）能保证一致性和速度，但会成为瓶颈；分散控制（多 top-level agent）能提高并行度和容错，但需要额外的协调成本。秦朝用极致的中央集权统一了六国，但也因为缺乏纠错机制而二世而亡——这对于 AI 系统的启示是：**纯集权模式适合短期紧急任务，但长期运行需要某种制衡机制。**

**2. 制衡模式的「transaction cost」**

制衡模式（唐朝三省、美国三权分立）的优势在于质量保障，但代价是**显著的交互成本**。这与罗纳德·科斯 (Ronald Coase) 的交易成本理论完全一致：制衡越多，审核越严格，每个决策的「交易成本」就越高。宋朝的二府三司制是制衡的极致——文官互相牵制到了「冗官冗兵」的地步，以至于王安石变法的核心诉求之一就是减少制衡、提高效率。在 AI 编排中，这意味着制衡模式适合「宁可慢也不能错」的高风险场景（如代码审查、金融合规），但不适合需要快速迭代的场景。

**3. 联邦与自治：CAP 定理的古代版本**

分布式系统中的 CAP 定理（一致性、可用性、分区容错不可兼得）在古代政治中有一个完美的对应物：**中央控制力、地方灵活性、通信效率**不可能同时最大化。周朝的分封制选择了「高地方灵活性 + 低中央控制力」，代价是最终的春秋战国分裂。波斯帝国的总督制 (satrapy) 是一个折中方案——总督拥有极大自治权，但通过「王道」(Royal Road) 和「王之耳目」(King's Eyes and Ears) 来维持最低限度的一致性。这个设计智慧在今天的微服务架构中依然适用。

**4. 民主模式的阿罗不可能定理**

阿罗不可能定理 (Arrow's Impossibility Theorem) 证明了：在三个或以上选项之间，不存在同时满足所有公平性条件的投票规则。雅典民主、蒙古忽里勒台、维京庭议都面对过这个问题，并用不同的方式来缓解（抽签、共识决、否决权）。在 AI 编排中，民主模式的主要价值不在于「投票」本身，而在于**强制所有 agent 表达观点**——这类似于 ensemble learning 的思路：多个弱分类器的组合往往优于单个强分类器。

### 按需选择文明

| 你的需求 | 推荐文明 | 原因 |
|---------|---------|------|
| ⚡ 快速执行，不需讨论 | 秦（中央集权）/ 拿破仑 | 命令直达，效率第一 |
| 🔍 质量审核，防止出错 | 唐（制衡）/ 美国（三权分立）/ 威尼斯 | 多方互审，层层把关 |
| 🏁 多团队竞争并行 | 三国（联邦）/ 波斯 | 各自独立，竞争出最优方案 |
| 🗳️ 集体讨论民主决策 | 雅典 / 维京 / 瑞士 | 所有 Agent 平等投票 |
| 🔐 双重审批流程 | 明（双轨）/ 哈布斯堡 | 内阁票拟 + 司礼监批红 |
| 💪 强力领导快速推进 | 苏联 / 古埃及（神权） | 最高权威不容挑战 |
| 🧠 知识密集型任务 | 阿拔斯哈里发 / 朝鲜 | 知识增强 + 儒学审谏 |
| 🛡️ 军事化项目管理 | 普鲁士 / 祖鲁 | 总参谋部式精确执行 |
| 🌐 跨团队多方协商 | 欧盟 / 蒙古 | 多方共决 + 松散联盟 |

---

## 快速开始

<p align="center">
  <img src="./images/demo-terminal.svg" alt="CivAgent Demo" width="100%" />
</p>

### 1. 安装 OpenClaw

```bash
# Linux
bash <(curl -fsSL https://raw.githubusercontent.com/wanikua/boluobobo-ai-court-tutorial/main/install.sh)

# macOS
bash <(curl -fsSL https://raw.githubusercontent.com/wanikua/boluobobo-ai-court-tutorial/main/install-mac.sh)
```

### 2. 克隆 CivAgent

```bash
git clone https://github.com/LeoLin990405/civagent.git civagent
cd civagent
```

### 3. 选择你的文明

```bash
# 列出所有可用文明
./scripts/list-regimes.sh

# 切换到你想要的文明（例如秦朝中央集权）
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

## 切换文明

```bash
# 查看当前文明
cat ~/.openclaw/.active-regime

# 切换到新文明（自动备份旧配置）
./scripts/switch-regime.sh global/athens

# 重启生效
openclaw gateway restart
```

切换时会自动：
1. 备份当前的 SOUL.md / IDENTITY.md / openclaw.json
2. 部署新文明的配置文件
3. 保留你的 API Key 和 Bot Token

---

## 创建自定义文明

```bash
# 从模板创建新文明
./scripts/create-regime.sh global/your-empire

# 编辑 5 个配置文件
# 验证配置
./scripts/validate-regime.sh global/your-empire
```

详见 [政体设计指南](./docs/regime-design-guide.md)。

---

## 项目结构

```
civagent/
├── CREDITS.md                 # 致谢原作者 @wanikua
├── regimes/                   # 核心：57 种文明配置
│   ├── _template/             # 文明模板（5 个文件）
│   ├── china/                 # 20 个中华朝代
│   │   ├── tang/              # ⭐ 原版（保留不动）
│   │   ├── qin/               # 秦·三公九卿
│   │   ├── han/               # 汉·三公九卿
│   │   └── ...
│   └── global/                # 37 个世界帝国
│       ├── athens/            # 雅典·直接民主
│       ├── roman-republic/    # 罗马·元老院
│       ├── sumeria/           # 苏美尔·神庙经济
│       ├── venice/            # 威尼斯·反腐制衡
│       └── ...
├── scripts/                   # 文明管理工具
│   ├── switch-regime.sh       # 切换文明
│   ├── list-regimes.sh        # 列出所有文明
│   ├── validate-regime.sh     # 验证配置
│   └── create-regime.sh       # 创建新文明
├── docs/
│   └── regime-design-guide.md # 文明设计指南
├── install.sh                 # 安装脚本（原版）
├── gui/                       # Web 管理界面（原版）
└── skills/                    # OpenClaw Skills（原版）
```

每种文明包含 5 个文件：

| 文件 | 作用 | 《文明》类比 |
|------|------|------------|
| `metadata.json` | 机器可读的元数据（名称、时代、标签等） | 文明信息卡 |
| `openclaw.json.template` | OpenClaw Agent 配置模板 | 单位和建筑定义 |
| `SOUL.md` | 时代主题的行为准则（语言风格、禁忌） | 文明特性 |
| `IDENTITY.md` | 组织架构图 + 角色映射表 | 科技树 + 政策卡 |
| `README.md` | 说明文档 + 历史背景 + 使用示例 | 文明百科 |

---

## 常见问题

**Q: 和原始 AI 朝廷项目有什么关系？**
CivAgent 是 [AI 朝廷](https://github.com/wanikua/boluobobo-ai-court-tutorial) 的扩展 fork。原始的唐朝三省六部制配置完整保留在 `regimes/china/tang/`，我们在此基础上增加了 56 种新政体。原始项目的所有功能（安装脚本、GUI、Skills 等）均保持不变。

**Q: 切换文明需要改代码吗？**
不需要。每种文明是纯配置文件（JSON + Markdown），运行 `switch-regime.sh` 即可切换——就像《文明》里选择文明一样简单。这也是这个项目的核心设计哲学：**架构决策应该是配置问题，而非代码问题。** 正如诺斯所说，制度变迁的成本越低，适应性就越强。

**Q: 我可以创建自己的文明吗？**
可以。运行 `create-regime.sh` 从模板创建，然后填写 5 个配置文件即可。欢迎 PR 贡献新文明！创建你自己的「MOD」吧。事实上，人类历史上的政体远不止 57 种——吴哥王朝内部的不同时期、奥斯曼帝国的坦志麦特改革前后、日本从律令制到幕府制的转变……每一次制度变革都可以成为一个新的 CivAgent 配置。

**Q: 和《文明》游戏有什么关系？**
没有官方关系。但灵感确实来自《文明》系列——不同文明有不同的科技树和治国策略，CivAgent 则是不同政体有不同的 Agent 编排模式。核心理念一样：**文明的选择决定了你的治理方式。** 不同之处在于，《文明》是竞争性的（追求胜利），CivAgent 是探索性的（追求适配）。

**Q: 这些政体的历史内容准确吗？**
我尽力保证了历史准确性（毕竟我是历史专业的），每种政体的设计都有对应的学术文献支撑（见下方参考文献）。我的方法论是：首先阅读该政体的核心学术著作（如研究秦制就看林剑鸣、睡虎地秦简和 Mark Edward Lewis），提取制度的核心结构（信息流向、决策层级、制衡机制），然后映射到 OpenClaw 的 agent 配置。这个过程必然涉及简化和抽象——一个真实的唐朝三省六部制远比 7 个 agent 复杂得多——但我力求保留每种制度最核心的组织逻辑。如果你发现任何历史错误，非常欢迎提 Issue 或 PR 纠正！

**Q: 这个项目对实际的 AI 编排有参考价值吗？**
我认为有。多 Agent 系统 (MAS) 研究中一个长期的挑战是：**如何设计 agent 之间的通信拓扑和决策协议？** 大多数 MAS 论文要么假设中央协调，要么假设完全分布式——而真实的组织架构远比这两个极端丰富。CivAgent 提供了 57 种经过历史检验的组织拓扑，每一种都有明确的设计意图和已知的优劣势。即使不用于生产，它也是一份很好的「组织架构模式参考手册」。

---

## 灵感来源 & 参考文献

### 直接灵感

| 来源 | 说明 |
|------|------|
| [AI 朝廷](https://github.com/wanikua/boluobobo-ai-court-tutorial) by [@wanikua](https://github.com/wanikua) | 原始创意和唐朝实现，点燃了整个项目 |
| [OpenClaw](https://github.com/openclaw/openclaw) | 底层多 Agent 框架 |
| Sid Meier's *Civilization* 系列 | 「选择文明 → 体验不同治国策略」的核心交互理念 |

### 中国政治制度史·通论

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

### 各文明·帝国专题参考

每个文明模块的设计都有对应的学术支撑。以下按项目中的文明分组列出核心参考：

#### 中华朝代

| 文明 | 核心参考文献 |
|------|------------|
| **夏** `china/xia` | 许宏《最早的中国》· 李学勤《夏商周年代学札记》· 刘莉 & 陈星灿《中国考古学：旧石器时代晚期到早期青铜时代》(*The Archaeology of China*, Cambridge, 2012) |
| **商** `china/shang` | 陈梦家《殷虚卜辞综述》· 宋镇豪 主编《商代史》(11 卷) · David Keightley, *Sources of Shang History: The Oracle-Bone Inscriptions of Bronze Age China* (1978) |
| **周** `china/zhou` | 许倬云《西周史》·《春秋左传注》(杨伯峻) · 李峰 *Bureaucracy and the State in Early China* (Cambridge, 2008) · 赵鼎新《东周战争与儒法国家的诞生》 |
| **秦** `china/qin` | 林剑鸣《秦汉史》· 睡虎地秦简整理小组《睡虎地秦墓竹简》· 鹤间和幸《始皇帝的遗产：秦汉帝国》· Mark Edward Lewis, *The Early Chinese Empires: Qin and Han* (Harvard, 2007) |
| **汉** `china/han` | 钱穆《秦汉史》· 陈苏镇《汉代政治与〈春秋〉学》· Michael Loewe, *The Government of the Qin and Han Empires* (Hackett, 2006) · 安作璋 & 熊铁基《秦汉官制史稿》 |
| **三国** `china/three-kingdoms` | 田余庆《秦汉魏晋史探微》· 陈寿《三国志》(裴松之注) · Rafe de Crespigny, *Generals of the South* (1990) & *A Biographical Dictionary of Later Han to the Three Kingdoms* |
| **晋** `china/jin` | 田余庆《东晋门阀政治》· 阎步克《品位与职位》· 唐长孺《魏晋南北朝史论丛》 |
| **南北朝** `china/north-south` | 唐长孺《魏晋南北朝史论丛》(续编) · 川胜义雄《六朝贵族制社会研究》· 陈寅恪《隋唐制度渊源略论稿》 |
| **隋** `china/sui` | 韩昇《隋文帝传》· 陈寅恪《隋唐制度渊源略论稿》· Arthur Wright, *The Sui Dynasty* (1978) |
| **唐** ⭐ `china/tang` | 陈寅恪《唐代政治史述论稿》· 吴宗国《唐代科举制度研究》· Denis Twitchett (ed.), *The Cambridge History of China, Vol. 3: Sui and T'ang China* (1979) · 黄永年《唐史十二讲》 |
| **五代十国** `china/five-dynasties` | 薛居正 等《旧五代史》· 欧阳修《新五代史》· 王赓武 *The Structure of Power in North China during the Five Dynasties* (1963) |
| **宋** `china/song` | 邓小南《祖宗之法：北宋前期政治述略》· 邓广铭《北宋政治改革家王安石》· Dieter Kuhn, *The Age of Confucian Rule: The Song Transformation of China* (Harvard, 2009) |
| **辽** `china/liao` | 刘浦江《辽金史论》· 岛田正郎《辽朝官制の研究》· Karl Wittfogel & 冯家昇, *History of Chinese Society: Liao (907–1125)* (1949) |
| **金** `china/jin-jurchen` | 张博泉《金代经济史略》· 刘浦江《辽金史论》· Herbert Franke & Denis Twitchett (eds.), *The Cambridge History of China, Vol. 6: Alien Regimes and Border States* (1994) |
| **西夏** `china/western-xia` | 史金波《西夏社会》·《天盛改旧新定律令》研究 · Ruth Dunnell, *The Great State of White and High: Buddhism and State Formation in Eleventh-Century Xia* (1996) |
| **元** `china/yuan` | 萧启庆《蒙元史新研》· 姚大力《蒙元制度与政治文化》· David Morgan, *The Mongols* (2nd ed., 2007) · 陈高华 & 史卫民《元上都》 |
| **明** `china/ming` | 黄仁宇《万历十五年》· 方志远《明代国家权力结构及运行机制》· Timothy Brook, *The Troubled Empire: China in the Yuan and Ming Dynasties* (Harvard, 2010) · 谢国桢《明代社会经济史论丛》 |
| **清** `china/qing` | 戴逸 主编《简明清史》· 茅海建《天朝的崩溃》· William Rowe, *China's Last Empire: The Great Qing* (Harvard, 2009) · 孔飞力《叫魂》(*Soulstealers*, 1990) |
| **太平天国** `china/taiping` | 罗尔纲《太平天国史》· 史景迁 *God's Chinese Son* (1996) · 茅家琦 主编《太平天国通史》 |
| **中华民国** `china/roc` | 张玉法《中华民国史稿》· 费正清《剑桥中华民国史》(*Cambridge History of China, Vols. 12–13*) · 王奇生《党员、党权与党争：1924–1949 年中国国民党的组织形态》 |

#### 世界帝国

| 文明 | 核心参考文献 |
|------|------------|
| **苏美尔** `global/sumeria` | Samuel Noah Kramer, *The Sumerians: Their History, Culture, and Character* (1963) · Marc Van De Mieroop, *The Ancient Mesopotamian City* (1997) · Harriet Crawford, *Sumer and the Sumerians* (2nd ed., 2004) |
| **古埃及** `global/egypt` | Ian Shaw (ed.), *The Oxford History of Ancient Egypt* (2000) · Barry Kemp, *Ancient Egypt: Anatomy of a Civilization* (3rd ed., 2018) · Toby Wilkinson, *The Rise and Fall of Ancient Egypt* (2010) |
| **雅典民主** `global/athens` | Josiah Ober, *Mass and Elite in Democratic Athens* (1989) · Mogens Hansen, *The Athenian Democracy in the Age of Demosthenes* (1991) · Donald Kagan, *Pericles of Athens and the Birth of Democracy* (1991) |
| **斯巴达** `global/sparta` | Paul Cartledge, *Sparta and Lakonia* (2nd ed., 2002) & *The Spartans* (2003) · W.G. Forrest, *A History of Sparta 950–192 BC* (1968) |
| **波斯帝国** `global/persian` | Pierre Briant, *From Cyrus to Alexander: A History of the Persian Empire* (2002) · Amélie Kuhrt, *The Persian Empire* (2007) · Josef Wiesehöfer, *Ancient Persia* (2001) |
| **迦太基** `global/carthage` | Serge Lancel, *Carthage: A History* (1995) · Richard Miles, *Carthage Must Be Destroyed* (2010) · Dexter Hoyos, *The Carthaginians* (2010) |
| **孔雀王朝** `global/maurya` | Romila Thapar, *Aśoka and the Decline of the Mauryas* (3rd ed., 2012) · Kautilya, *Arthashastra* (R.P. Kangle ed., 1965) · Upinder Singh, *A History of Ancient and Early Medieval India* (2008) |
| **罗马共和国** `global/roman-republic` | Mary Beard, *SPQR: A History of Ancient Rome* (2015) · Harriet Flower (ed.), *The Cambridge Companion to the Roman Republic* (2nd ed., 2014) · Ronald Syme, *The Roman Revolution* (1939) |
| **罗马帝国** `global/roman-empire` | Edward Gibbon, *The Decline and Fall of the Roman Empire* (经典) · Peter Heather, *The Fall of the Roman Empire* (2006) · Fergus Millar, *The Emperor in the Roman World* (1977) |
| **拜占庭** `global/byzantine` | Cyril Mango (ed.), *The Oxford History of Byzantium* (2002) · John Haldon, *Byzantium in the Seventh Century* (1990) · Judith Herrin, *Byzantium: The Surprising Life of a Medieval Empire* (2007) |
| **阿拔斯哈里发** `global/caliphate` | Hugh Kennedy, *The Prophet and the Age of the Caliphates* (3rd ed., 2016) · Dimitri Gutas, *Greek Thought, Arabic Culture* (1998) · Tayeb El-Hibri, *Reinterpreting Islamic Historiography* (1999) |
| **维京** `global/viking` | Jesse Byock, *Viking Age Iceland* (2001) · Else Roesdahl, *The Vikings* (3rd ed., 2016) · Neil Price, *Children of Ash and Elm: A History of the Vikings* (2020) |
| **神圣罗马帝国** `global/hre` | Peter Wilson, *Heart of Europe: A History of the Holy Roman Empire* (2016) · Joachim Whaley, *Germany and the Holy Roman Empire* (2 vols., Oxford, 2012) |
| **蒙古帝国** `global/mongol` | Jack Weatherford, *Genghis Khan and the Making of the Modern World* (2004) · David Morgan, *The Mongols* (2nd ed., 2007) · Timothy May, *The Mongol Empire* (Edinburgh, 2018) |
| **威尼斯** `global/venice` | John Julius Norwich, *A History of Venice* (1982) · Frederic Lane, *Venice: A Maritime Republic* (1973) · Robert Finlay, *Politics in Renaissance Venice* (1980) |
| **马里帝国** `global/mali` | Nehemia Levtzion, *Ancient Ghana and Mali* (1973) · D.T. Niane, *Sundiata: An Epic of Old Mali* (1965) · Michael Gomez, *African Dominion: A New History of Empire in Early and Medieval West Africa* (2018) |
| **高棉帝国** `global/khmer` | David Chandler, *A History of Cambodia* (4th ed., 2008) · Michael Coe, *Angkor and the Khmer Civilization* (2003) · Charles Higham, *The Civilization of Angkor* (2001) |
| **奥斯曼帝国** `global/ottoman` | Halil İnalcık, *The Ottoman Empire: The Classical Age 1300–1600* (1973) · Caroline Finkel, *Osman's Dream: The Story of the Ottoman Empire* (2005) · Suraiya Faroqhi, *The Ottoman Empire and the World Around It* (2004) |
| **萨法维帝国** `global/safavid` | Andrew Newman, *Safavid Iran: Rebirth of a Persian Empire* (2006) · Rudi Matthee, *Persia in Crisis: Safavid Decline and the Fall of Isfahan* (2012) · Roger Savory, *Iran under the Safavids* (1980) |
| **莫卧儿帝国** `global/mughal` | John Richards, *The Mughal Empire* (*New Cambridge History of India*, 1993) · Abraham Eraly, *The Mughal Throne* (2003) · Ruby Lal, *Empress: The Astonishing Reign of Nur Jahan* (2018) |
| **朝鲜王朝** `global/joseon` | JaHyun Kim Haboush, *The Confucian Kingship in Korea* (1988) · Michael Seth, *A History of Korea* (2nd ed., 2016) · Martina Deuchler, *The Confucian Transformation of Korea* (1992) |
| **日本幕府制** `global/shogunate` | Conrad Totman, *Tokugawa Ieyasu: Shogun* (1983) & *Early Modern Japan* (1993) · Marius Jansen, *The Making of Modern Japan* (2000) · 朝尾直弘 等《岩波日本史》 |
| **波兰联邦** `global/polish` | Norman Davies, *God's Playground: A History of Poland* (2 vols., 2005) · Robert Frost, *The Oxford History of Poland-Lithuania, Vol. 1* (2015) · Daniel Stone, *The Polish-Lithuanian State, 1386–1795* (2001) |
| **法国绝对制** `global/french` | John Lynn, *The Wars of Louis XIV* (1999) · Peter Burke, *The Fabrication of Louis XIV* (1992) · William Beik, *Absolutism and Society in Seventeenth-Century France* (1985) |
| **英国议会制** `global/british` | Robert Tombs, *The English and Their History* (2014) · David Starkey, *Crown and Country: A History of England through the Monarchy* (2010) · A.V. Dicey, *Introduction to the Study of the Law of the Constitution* (1885, 经典) |
| **俄罗斯沙皇制** `global/russian` | Orlando Figes, *A People's Tragedy: The Russian Revolution* (1996) · Geoffrey Hosking, *Russia: People and Empire 1552–1917* (1997) · Richard Pipes, *Russia under the Old Regime* (1974) |
| **哈布斯堡** `global/habsburg` | A.J.P. Taylor, *The Habsburg Monarchy 1809–1918* (1948) · Pieter Judson, *The Habsburg Empire: A New History* (2016) · Robin Okey, *The Habsburg Monarchy c.1765–1918* (2001) |
| **普鲁士** `global/prussia` | Christopher Clark, *Iron Kingdom: The Rise and Downfall of Prussia* (2006) · Peter Paret, *Yorck and the Era of Prussian Reform* (1966) · Hans Rosenberg, *Bureaucracy, Aristocracy, and Autocracy: The Prussian Experience* (1958) |
| **拿破仑** `global/napoleon` | Andrew Roberts, *Napoleon: A Life* (2014) · Michael Broers, *Napoleon: Soldier of Destiny* (2014) · Jean Tulard, *Napoleon: The Myth of the Saviour* (1984) |
| **美国联邦制** `global/us-federal` | Alexander Hamilton, James Madison & John Jay, *The Federalist Papers* (1788, 经典) · Robert Dahl, *How Democratic Is the American Constitution?* (2001) · Akhil Reed Amar, *America's Constitution: A Biography* (2005) |
| **明治日本** `global/meiji` | Andrew Gordon, *A Modern History of Japan* (4th ed., 2019) · Marius Jansen, *The Making of Modern Japan* (2000) · W.G. Beasley, *The Rise of Modern Japan* (3rd ed., 1999) |
| **苏联** `global/soviet` | Sheila Fitzpatrick, *The Russian Revolution* (4th ed., 2017) · Robert Service, *A History of Modern Russia* (3rd ed., 2009) · Stephen Kotkin, *Stalin: Paradoxes of Power* (2014) |
| **欧盟** `global/eu` | Desmond Dinan, *Europe Recast: A History of European Union* (2nd ed., 2014) · Mark Gilbert, *European Integration: A Concise History* (2012) · Tony Judt, *Postwar: A History of Europe Since 1945* (2005) |
| **瑞士联邦** `global/swiss` | Jonathan Steinberg, *Why Switzerland?* (3rd ed., 2015) · Clive Church & Randolph Head, *A Concise History of Switzerland* (2013) · Wolf Linder, *Swiss Democracy* (3rd ed., 2010) |
| **印加帝国** `global/inca` | Terence D'Altroy, *The Incas* (2nd ed., 2015) · Brian Bauer, *The Development of the Inca State* (1992) · Gary Urton, *Inka History in Knots* (2017) |
| **阿兹特克** `global/aztec` | Michael Smith, *The Aztecs* (3rd ed., 2012) · Ross Hassig, *Aztec Warfare* (1988) · David Carrasco, *The Aztecs: A Very Short Introduction* (2012) |
| **祖鲁** `global/zulu` | John Laband, *The Rise and Fall of the Zulu Nation* (1997) · Carolyn Hamilton, *Terrific Majesty: The Powers of Shaka Zulu* (1998) · Jeff Guy, *The Destruction of the Zulu Kingdom* (1979) |

### 西方政治理论 & 比较政治学

不同文明对同一个问题给出了截然不同的答案，这些比较视角帮助我设计全球帝国的 Agent 编排：

- **亚里士多德《政治学》** (*Aristotle, Politics*) — 最早的政体分类学：君主制、贵族制、共和制及其变体。本项目的 6 种编排模式在某种意义上是亚里士多德分类的 AI 版本
- **孟德斯鸠《论法的精神》** (*Montesquieu, The Spirit of the Laws*, 1748) — 三权分立理论的奠基之作，直接对应了 US Federal 和 checks-and-balances 模式的设计
- **马克斯·韦伯「官僚制理论」** (*Max Weber, Economy and Society*, 1922) — 理性官僚制的经典分析：层级、专业化、规则导向
- **S.N. 艾森施塔特《帝国的政治体系》** (*S.N. Eisenstadt, The Political Systems of Empires*, 1963) — 系统比较了人类历史上主要帝国的政治结构
- **弗朗西斯·福山《政治秩序的起源》** (*Francis Fukuyama, The Origins of Political Order*, 2011) — 国家建构、法治、问责三维度
- **查尔斯·蒂利《强制、资本与欧洲国家》** (*Charles Tilly, Coercion, Capital, and European States*, 1990) — 欧洲国家形态的多样性
- **塞缪尔·亨廷顿《变化社会中的政治秩序》** (*Samuel Huntington, Political Order in Changing Societies*, 1968) — 政治制度化理论
- **道格拉斯·诺斯《制度、制度变迁与经济绩效》** (*Douglass North, Institutions, Institutional Change and Economic Performance*, 1990) — 制度如何约束和激励行为——SOUL.md 和 IDENTITY.md 在做的事
- **曼瑟·奥尔森《集体行动的逻辑》** (*Mancur Olson, The Logic of Collective Action*, 1965) — 民主议会模式为何需要激励机制
- **卡尔·魏特夫《东方专制主义》** (*Karl Wittfogel, Oriental Despotism*, 1957) — 水利帝国与集权关系
- **佩里·安德森《绝对主义国家的系谱》** (*Perry Anderson, Lineages of the Absolutist State*, 1974) — 东西方绝对主义的比较

### 组织理论 & 多 Agent 系统

古代政治制度和现代组织/AI 架构之间的桥梁：

- **赫伯特·西蒙《管理行为》** (*Herbert Simon, Administrative Behavior*, 1947) — 有限理性和层级组织理论
- **Wooldridge & Jennings, "Intelligent Agents: Theory and Practice"** (*The Knowledge Engineering Review*, 1995) — 多 Agent 系统经典综述
- **Dorri, Kanhere & Jurdak, "Multi-Agent Systems: A Survey"** (*IEEE Access*, 2018) — 现代 MAS 架构分类
- **亨利·明茨伯格《组织的结构》** (*Henry Mintzberg, The Structuring of Organizations*, 1979) — 组织结构五种基本形态与本项目六种编排模式高度契合

### 公开课 & MOOC

| 课程 | 平台 | 讲师 | 与本项目的关联 |
|------|------|------|-------------|
| **Ancient Greek History** | [Yale Open Courses](https://oyc.yale.edu/classics/clcv-205) | Donald Kagan | 雅典民主 · 斯巴达双王制的第一手课堂讲解 |
| **Introduction to Political Philosophy** | [Yale Open Courses](https://oyc.yale.edu/political-science/plsc-114) | Steven B. Smith | 从柏拉图到洛克的政体理论，直接启发了六种编排模式的分类 |
| **China's First Empires and the Rise of Buddhism** (ChinaX Part 2) | [edX / HarvardX](https://www.edx.org/learn/history/harvard-university-china-history) | Peter K. Bol | 秦汉帝国制度的英文学术讲解 |
| **中国古代史** | [中国大学 MOOC / 北京大学](https://www.icourse163.org/) | 阎步克、邓小南 | 阎步克讲品位与职位、邓小南讲宋代祖宗之法 |
| **全球史** | [中国大学 MOOC / 北京大学](https://www.icourse163.org/) | 钱乘旦 等 | 比较视野下的全球帝国制度 |
| **The Fall and Rise of China** | [The Great Courses](https://www.thegreatcourses.com/) | Richard Baum | 从清末到当代的制度变迁，覆盖清、太平天国、民国 |
| **The Early Middle Ages, 284–1000** | [Yale Open Courses](https://oyc.yale.edu/history/hist-210) | Paul Freedman | 罗马帝国晚期、拜占庭、法兰克帝国制度 |
| **European Civilization, 1648–1945** | [Yale Open Courses](https://oyc.yale.edu/history/hist-202) | John Merriman | 法国绝对君主制、英国议会制、俄罗斯沙皇制 |

### 纪录片

| 纪录片 | 制作方 | 与本项目的关联 |
|--------|--------|-------------|
| **The Story of China** (中华的故事, 2016) | BBC · Michael Wood 主持 | 6 集覆盖从商周到当代，是串联中华朝代的最佳英语纪录片 |
| **中国通史** (2016) | CCTV/FILM · 100 集 | 从远古到清末的全景式制度史，每集 45 分钟深入一个时期 |
| **大明王朝 1566** (2007) | 湖南卫视 · 张黎 导演 | 虽然是电视剧，但对嘉靖朝内阁-司礼监双轨制的刻画极为精准 |
| **从秦始皇到汉武帝** (2016) | CCTV | 秦汉制度变迁：从郡县制到三公九卿制的详细还原 |
| **河西走廊** (2015) | CCTV | 多民族帝国治理视角，理解辽金西夏元的「因俗而治」 |
| **Empires** 系列 | PBS | 分集覆盖罗马帝国、奥斯曼帝国、拿破仑帝国等 |
| **Ancient Egypt: Life and Death in the Valley of the Kings** (2013) | BBC · Joann Fletcher | 法老神权制度与维齐尔官僚体系 |
| **Japan: Memoirs of a Secret Empire** (2004) | PBS | 德川幕府制度的运作：将军、大名、天皇的三角关系 |
| **The Ottomans: Europe's Muslim Emperors** (2013) | BBC · Rageh Omaar | 苏丹-迪万制度、德夫希尔梅制（devshirme）与近卫军 |
| **Civilization** (2018) | BBC/PBS · Simon Schama 等 | 跨文明的艺术-政治互动，提供了文明比较的视觉化视角 |
| **Extra History** 系列 | YouTube · Extra Credits | 高质量动画历史系列，覆盖从苏美尔到二战的多个帝国 |

---

## 相关链接

- 🏛️ [原始项目 AI 朝廷](https://github.com/wanikua/boluobobo-ai-court-tutorial) — by [@wanikua](https://github.com/wanikua)
- 🏢 [Become CEO — 企业版](https://github.com/wanikua/become-ceo) — 同一架构的现代企业版
- 🔧 [OpenClaw 框架](https://github.com/openclaw/openclaw)
- 📖 [OpenClaw 文档](https://docs.openclaw.ai)
- 📕 [《中国历代政治得失》](https://book.douban.com/subject/1003479/) — 钱穆
- 🎮 [Sid Meier's Civilization](https://civilization.com/) — 「选择文明」理念的灵感来源

---

MIT License | 基于 [AI 朝廷](https://github.com/wanikua/boluobobo-ai-court-tutorial) by [@wanikua](https://github.com/wanikua)
