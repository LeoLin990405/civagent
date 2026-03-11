# 神圣罗马帝国 · 选帝侯制 (Holy Roman Empire)

> 962-1806 AD · Electoral System / 选帝侯制

## 简介 / Introduction

"既不神圣，也不罗马，更不是帝国"——伏尔泰如此评价，但这个独特的政治实体却延续了整整844年。神圣罗马帝国是欧洲中世纪至近代最复杂的政治结构之一：皇帝由选帝侯选举产生，权力受到诸侯、帝国议会和帝国法院的多重制约。数百个邦国、自由城市和教会领地各自为政，形成了一个松散但有韧性的联邦体系。

"Neither Holy, nor Roman, nor an Empire" — so Voltaire judged, yet this unique political entity endured 844 years. The Holy Roman Empire was one of the most complex political structures in European history: the Emperor was elected by Prince-Electors, constrained by princes, the Imperial Diet, and the Imperial Court. Hundreds of principalities, free cities, and ecclesiastical territories governed themselves, forming a loose but resilient federal system.

## 历史背景 / Historical Background

神圣罗马帝国始于962年奥托一世加冕，终于1806年弗朗茨二世在拿破仑压力下退位。1356年的《金玺诏书》确立了七位选帝侯的选举制度。帝国议会（Reichstag）是各等级协商的平台，帝国法院（Reichskammergericht）独立于皇帝进行司法裁判。三十年战争（1618-1648）后的《威斯特伐利亚和约》进一步确认了诸侯的主权，使帝国更加分权化。

The HRE began with Otto I's coronation in 962 and ended in 1806 when Francis II abdicated under Napoleonic pressure. The Golden Bull of 1356 formalized the system of seven Prince-Electors. The Imperial Diet (Reichstag) served as a forum for deliberation among estates, and the Imperial Chamber Court (Reichskammergericht) exercised judicial authority independent of the Emperor. The Peace of Westphalia (1648) after the Thirty Years' War further confirmed princely sovereignty, deepening decentralization.

## Agent 配置 / Agent Configuration

本政体包含 7 个 Agent：

| Agent | 角色 | 职责 |
|---|---|---|
| Emperor | 选帝皇帝 / Elected Emperor | 首席之尊，主持帝国事务 |
| Elector of Mainz | 大主教-首席选帝侯 / Archbishop-Chancellor | 召集选举，桥梁宗教与世俗 |
| Elector of Saxony | 世俗选帝侯 / Secular Elector | 北方世俗诸侯代表 |
| Elector of Brandenburg | 世俗选帝侯 / Secular Elector | 东部新兴力量代表 |
| Imperial Diet | 帝国议会 / Parliament | 立法协商，各等级发言 |
| Imperial Chamber Court | 帝国法院 / Judiciary | 独立司法，裁决争端 |
| Free Imperial City | 自由城市 / Autonomous City | 城市自治，商业贸易 |

## 使用方式 / Usage

```bash
# Switch to this regime
./scripts/switch-regime.sh global/hre
```

## 编排模式 / Orchestration Pattern

**Federated Autonomy (联邦自治)**: 皇帝是协调者而非独裁者，各 Agent 拥有高度自治权。决策通过帝国议会的辩论和协商达成，而非自上而下的命令。帝国法院独立运作，裁决Agent之间的争端。此模式适合需要多方协商、分散决策的场景。

## 参考资料 / References

- 维基百科：[神圣罗马帝国](https://zh.wikipedia.org/wiki/神圣罗马帝国)
- Wikipedia: [Holy Roman Empire](https://en.wikipedia.org/wiki/Holy_Roman_Empire)
- Wikipedia: [Golden Bull of 1356](https://en.wikipedia.org/wiki/Golden_Bull_of_1356)
- [OpenClaw 框架](https://github.com/openclaw/openclaw)
