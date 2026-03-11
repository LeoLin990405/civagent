# 法国绝对君主制 · 朕即国家 (French Absolutism)

> 1643-1789 AD · L'etat c'est moi / 朕即国家

## 简介 / Introduction

法国绝对君主制以路易十四"太阳王"的统治为巅峰，是欧洲绝对主义的经典范例。国王以凡尔赛宫为权力中心，将一切权力——立法、行政、司法、军事、外交——集于一身。通过繁复的宫廷礼仪控制贵族，通过地方总督体系控制行省，通过重商主义政策积累国家财富。法兰西的文化、艺术和时尚辐射整个欧洲，"太阳王"的光芒无处不在。

French Absolutism, epitomized by Louis XIV the "Sun King," was the classic model of European absolutism. From the Palace of Versailles, the King concentrated all power — legislative, executive, judicial, military, and diplomatic — in his person. Elaborate court protocol controlled the nobility, the Intendant system controlled the provinces, and mercantilist policy accumulated national wealth. French culture, arts, and fashion radiated across Europe under the all-encompassing brilliance of the Sun King.

## 历史背景 / Historical Background

法国绝对君主制的形成经历了漫长的过程。路易十三时期的红衣主教黎塞留奠定了中央集权的基础。1643年路易十四即位（5岁），在马扎然枢机主教的辅佐下度过少年时代。1661年马扎然去世后，路易十四宣布亲政，声称"朕即国家"。他建造凡尔赛宫，任命科尔贝为财务总监推行重商主义，任命卢瓦侯爵为军事大臣打造欧洲最强陆军。这一体制持续至1789年法国大革命。

French Absolutism developed over generations. Cardinal Richelieu under Louis XIII laid the foundations of centralization. Louis XIV ascended the throne in 1643 (aged 5), guided by Cardinal Mazarin. After Mazarin's death in 1661, Louis XIV declared personal rule — "L'etat, c'est moi." He built Versailles, appointed Colbert as Controller-General to implement mercantilism, and the Marquis de Louvois as War Secretary to build Europe's strongest army. This system endured until the French Revolution of 1789.

## Agent 配置 / Agent Configuration

本政体包含 7 个 Agent：

| Agent | 角色 | 职责 |
|---|---|---|
| Le Roi Soleil | 太阳王 / The Sun King | 绝对权力的源泉，最终裁决者 |
| Controleur General | 财务总监 / Finance Minister | 税收、经济政策、重商主义 |
| Secretaire de la Guerre | 军事大臣 / War Secretary | 陆军、防御工事、军事改革 |
| Secretaire de la Marine | 海军大臣 / Navy Secretary | 海军、殖民地、海外贸易 |
| Secretaire de la Maison | 宫廷管家 / Royal Household | 凡尔赛管理、艺术赞助 |
| Intendant | 地方总督 / Provincial Governor | 传达王命、征税、维持秩序 |
| Parlement de Paris | 高等法院 / High Court | 法律审核、可提谏议 |

## 使用方式 / Usage

```bash
# Switch to this regime
./scripts/switch-regime.sh global/french
```

## 编排模式 / Orchestration Pattern

**Centralized Hierarchy (中央集权)**: 太阳王作为唯一的权力中心，一切命令自上而下传达。各大臣直接向国王负责，地方总督是国王意志在各省的延伸。高等法院可提出谏议但国王拥有最终否决权。在 AI 系统中，主 Agent 拥有绝对决策权，子 Agent 严格执行。

## 参考资料 / References

- 维基百科：[法国绝对君主制](https://zh.wikipedia.org/wiki/绝对君主制)
- Wikipedia: [Ancien Regime](https://en.wikipedia.org/wiki/Ancien_R%C3%A9gime)
- Wikipedia: [Louis XIV](https://en.wikipedia.org/wiki/Louis_XIV)
- [OpenClaw 框架](https://github.com/openclaw/openclaw)
