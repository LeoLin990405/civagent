[English Version](./README_EN.md) | [Original Project 原始项目](https://github.com/wanikua/boluobobo-ai-court-tutorial)

# 🏛️ AI 治理天下 — 以古今中外 39 种政体治理你的 AI 团队

### 20 个中华朝代 + 19 个世界帝国 · 纯配置切换 · 零代码 · 基于 OpenClaw

> **基于 [@wanikua](https://github.com/wanikua) 的 [AI 朝廷](https://github.com/wanikua/boluobobo-ai-court-tutorial) 项目扩展。**
> 原始的唐朝三省六部制配置完整保留，未做任何修改。详见 [CREDITS.md](./CREDITS.md)。

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

## 致谢 / Credits

> **本项目基于 [@wanikua](https://github.com/wanikua)（菠萝菠菠）的 [AI 朝廷](https://github.com/wanikua/boluobobo-ai-court-tutorial) 项目。**
> 原创概念：将中国古代官制映射到 AI 多 Agent 协作。首发于 2026年2月22日。
> 唐朝（三省六部制）配置位于 `regimes/china/tang/`，为原作者作品，完整保留。
> 详见 [CREDITS.md](./CREDITS.md)。

---

## 这个项目是什么？

**AI 治理天下**将人类历史上 39 种经典政体——从夏朝的家族制到美国的三权分立——映射为 AI 多 Agent 协作的组织架构。每种政体是一个纯配置模块（JSON + Markdown），切换政体不需要改任何代码。

**核心理念：** 古代治国的智慧 = 现代管理 AI 团队的最佳实践。

---

## 政体目录 / Regime Catalog

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

| # | ID | Empire | Era | System | Agent Pattern | Agents |
|---|-----|--------|-----|--------|--------------|--------|
| 1 | `global/egypt` | Ancient Egypt | 3100-30 BC | Pharaoh Theocracy | God-King + Vizier | 6 |
| 2 | `global/athens` | Athenian Democracy | 508-322 BC | Direct Democracy | All agents vote | 6 |
| 3 | `global/sparta` | Sparta | 900-192 BC | Dual Kingship | Two co-leaders + Ephors | 6 |
| 4 | `global/roman-republic` | Roman Republic | 509-27 BC | Senate + Consuls | Dual consuls + Senate | 8 |
| 5 | `global/roman-empire` | Roman Empire | 27 BC-476 AD | Imperial Bureaucracy | Emperor + Prefects | 7 |
| 6 | `global/byzantine` | Byzantine Empire | 330-1453 | Autocratic Theocracy | Basileus + Logothetes | 7 |
| 7 | `global/persian` | Persian Achaemenid | 550-330 BC | Satrap System | King of Kings + Satraps | 7 |
| 8 | `global/ottoman` | Ottoman Empire | 1299-1922 | Sultan + Divan | Grand Vizier dispatches | 7 |
| 9 | `global/mongol` | Mongol Empire | 1206-1368 | Khanate Kurultai | Great Khan + Kurultai | 6 |
| 10 | `global/hre` | Holy Roman Empire | 962-1806 | Electoral System | Electors + Princes | 7 |
| 11 | `global/british` | British Parliament | 1689-present | Constitutional Monarchy | PM governs, Crown ceremonial | 8 |
| 12 | `global/french` | French Absolutism | 1643-1789 | L'état c'est moi | Sun King absolute | 7 |
| 13 | `global/russian` | Russian Tsardom | 1547-1917 | Autocracy + Council | Tsar absolute + Senate | 7 |
| 14 | `global/shogunate` | Japanese Shogunate | 1603-1868 | Bakufu System | Shogun rules, Emperor ceremonial | 7 |
| 15 | `global/mughal` | Mughal India | 1526-1857 | Mansabdar System | Emperor + ranked officials | 7 |
| 16 | `global/us-federal` | US Federal System | 1789-present | Three Branches | Separation of powers | 7 |
| 17 | `global/soviet` | Soviet Union | 1922-1991 | Politburo System | General Secretary + Politburo | 7 |
| 18 | `global/inca` | Inca Empire | 1438-1533 | Sapa Inca + Quarters | Sapa Inca + 4 Suyus | 6 |
| 19 | `global/aztec` | Aztec Triple Alliance | 1428-1521 | Triple Alliance | 3 city-states council | 6 |

---

## 6 种编排模式 / Orchestration Patterns

每种政体对应一种 Agent 编排模式：

| 模式 | 代表政体 | 特点 |
|------|---------|------|
| **中央集权** Centralized Hierarchy | 秦、元、Egypt、French、Soviet | 单一 main agent 统管所有 subagent |
| **制衡** Checks & Balances | 唐、宋、隋、Roman Republic、US Federal | 多个顶层 agent 互相审核 |
| **双轨** Dual Power | 明(内阁+司礼监)、Sparta、辽 | 两个 main 级 agent 分庭抗礼 |
| **联邦** Federated Autonomy | 周、三国、五代、HRE、Persian | 独立 agent 组，最小化协调 |
| **民主议会** Democratic Council | Athens、Mongol Kurultai | 平等 agent，投票决策 |
| **神权** Theocratic | 商、太平天国、Egypt、Byzantine | 最高 agent 拥有绝对权威 |

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

# 切换到你想要的政体
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
│   ├── _template/             # 政体模板
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
├── install.sh                 # 安装脚本
├── gui/                       # Web 管理界面
└── skills/                    # OpenClaw Skills
```

每个政体包含 5 个文件：

| 文件 | 作用 |
|------|------|
| `metadata.json` | 机器可读的元数据 |
| `openclaw.json.template` | OpenClaw Agent 配置模板 |
| `SOUL.md` | 时代主题的行为准则 |
| `IDENTITY.md` | 组织架构图 + 角色映射 |
| `README.md` | 说明文档 + 历史背景 |

---

## 常见问题

**Q: 和原始 AI 朝廷项目有什么关系？**
AI 治理天下是 AI 朝廷的扩展 fork。原始的唐朝三省六部制配置完整保留在 `regimes/china/tang/`，我们在此基础上增加了 38 种新政体。

**Q: 切换政体需要改代码吗？**
不需要。每种政体是纯配置文件，运行 `switch-regime.sh` 即可切换。

**Q: 我可以创建自己的政体吗？**
可以。运行 `create-regime.sh` 从模板创建，然后填写 5 个配置文件即可。

**Q: 哪种政体最适合我？**
- 需要快速执行 → 秦（中央集权）
- 需要质量审核 → 唐（制衡）/ US Federal（三权分立）
- 多团队竞争 → 三国（联邦）
- 民主决策 → 雅典（民主议会）
- 双重审批 → 明（双轨）

---

## 相关链接

- 🏛️ [原始项目 AI 朝廷](https://github.com/wanikua/boluobobo-ai-court-tutorial) — by [@wanikua](https://github.com/wanikua)
- 🏢 [Become CEO — 企业版](https://github.com/wanikua/become-ceo)
- 🔧 [OpenClaw 框架](https://github.com/openclaw/openclaw)
- 📖 [OpenClaw 文档](https://docs.openclaw.ai)

---

MIT License | Based on [AI 朝廷](https://github.com/wanikua/boluobobo-ai-court-tutorial) by [@wanikua](https://github.com/wanikua)
