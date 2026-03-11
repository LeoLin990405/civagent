# 拜占庭帝国 · 神权独裁制 (Byzantine Empire)

> 330-1453 AD · Autocratic Theocracy / 神权独裁制

## 简介 / Introduction

拜占庭帝国（东罗马帝国）是罗马帝国的东部延续，以君士坦丁堡为首都，历时一千一百余年。巴西琉斯（皇帝）被视为上帝在人间的代理人，集世俗权力与宗教权威于一身。帝国以精密的官僚体系、拜占庭式的外交手腕（cunning diplomacy）和坚定的东正教信仰为三大支柱，在东西方文明的交汇处缔造了辉煌灿烂的文化。

The Byzantine Empire (Eastern Roman Empire) was the eastern continuation of Rome, centered on Constantinople, lasting over 1,100 years. The Basileus (Emperor) was regarded as God's vicegerent on Earth, uniting secular and religious authority. The empire rested on three pillars: an elaborate bureaucracy, cunning diplomacy, and unwavering Orthodox Christian faith, creating a brilliant civilization at the crossroads of East and West.

## 历史背景 / Historical Background

拜占庭帝国始于330年君士坦丁大帝迁都拜占庭（改名君士坦丁堡），终于1453年奥斯曼帝国攻陷君士坦丁堡。在长达千年的历史中，帝国经历了查士丁尼大帝的辉煌复兴、圣像破坏运动、马其顿王朝的文艺复兴和十字军的劫掠。帝国的法律体系（查士丁尼法典）、宗教传统（东正教）和行政制度对后世影响深远。

Founded when Constantine the Great moved the capital to Byzantium (renamed Constantinople) in 330 AD, the empire endured until the Ottoman conquest of Constantinople in 1453. Through its millennium-long history, it witnessed Justinian's magnificent restoration, the Iconoclast controversy, the Macedonian Renaissance, and the devastation of the Fourth Crusade. Its legal system (Justinianic Code), religious tradition (Orthodoxy), and administrative institutions profoundly influenced successor civilizations.

## Agent 配置 / Agent Configuration

本政体包含 7 个 Agent：

| Agent | 角色 | 职责 |
|---|---|---|
| Basileus | 皇帝 / Emperor | 上帝的代理人，最高决策者 |
| Logothete of the Dromos | 外交大臣 / Foreign Affairs | 外交、情报、战略谈判 |
| Logothete of the Genikon | 财务大臣 / Finance | 税收、国库、经济政策 |
| Domestic of the Schools | 军事统帅 / Military Commander | 军事指挥、防御、安全 |
| Eparch | 城市长官 / City Prefect | 城市治理、市场监管、公共服务 |
| Patriarch | 大牧首 / Religious Authority | 宗教事务、伦理审查、精神指导 |
| Protoasecretis | 文书长 / Head of Chancery | 文档管理、记录保存、文书起草 |

## 使用方式 / Usage

```bash
# Switch to this regime
./scripts/switch-regime.sh global/byzantine
```

## 编排模式 / Orchestration Pattern

**Theocratic (神权制)**: 巴西琉斯作为上帝的代理人拥有最高权威，一切决策以正教信仰和罗马法律为准绳。大牧首提供精神指导和伦理审查，形成政教合一的治理模式。在 AI 系统中，主 Agent 掌握最终决策权，宗教 Agent 提供价值对齐和伦理审查。

## 参考资料 / References

- 维基百科：[拜占庭帝国](https://zh.wikipedia.org/wiki/拜占庭帝国)
- Wikipedia: [Byzantine Empire](https://en.wikipedia.org/wiki/Byzantine_Empire)
- Wikipedia: [Byzantine bureaucracy](https://en.wikipedia.org/wiki/Byzantine_bureaucracy_and_aristocracy)
- [OpenClaw 框架](https://github.com/openclaw/openclaw)
