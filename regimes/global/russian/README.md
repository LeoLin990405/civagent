# 俄罗斯沙皇制 · 专制+贵族杜马 (Russian Tsardom)

> 1547-1917 AD · Autocracy + Boyar Council / 专制+贵族杜马

## 简介 / Introduction

俄罗斯沙皇制自伊凡四世加冕为沙皇始，历经三百七十年，直至1917年二月革命终结。沙皇自称"全俄罗斯的专制君主"，以"第三罗马"自居——继承拜占庭东正教传统和罗马帝国的政治遗产。幅员辽阔的帝国横跨欧亚大陆，从波罗的海到太平洋，唯有强大的中央集权才能维系。贵族杜马名义上辅佐沙皇，但最终决策权始终在沙皇一人。

The Russian Tsardom began with Ivan IV's coronation and endured 370 years until the February Revolution of 1917. The Tsar styled himself "Autocrat of All the Russias," claiming the mantle of the "Third Rome" — inheriting Byzantine Orthodox tradition and Roman imperial legacy. The vast empire spanning Eurasia, from the Baltic to the Pacific, could only be held together by a powerful central authority. The Boyar Duma nominally advised, but final authority always rested with the Tsar alone.

## 历史背景 / Historical Background

1547年伊凡四世（伊凡雷帝）正式加冕为沙皇，标志着俄罗斯沙皇制的开端。经历动荡时期后，罗曼诺夫王朝于1613年建立。彼得大帝（1682-1725）推行西化改革，建立参政院，将俄罗斯推向欧洲舞台。叶卡捷琳娜二世扩张领土，亚历山大一世击败拿破仑。然而亚历山大三世和尼古拉二世时期的反动政策最终导致1917年革命，结束了沙皇专制。

Ivan IV (Ivan the Terrible) was formally crowned Tsar in 1547, marking the beginning of the Tsardom. After the Time of Troubles, the Romanov dynasty was established in 1613. Peter the Great (1682-1725) implemented westernizing reforms, created the Governing Senate, and brought Russia onto the European stage. Catherine the Great expanded the empire, Alexander I defeated Napoleon. However, the reactionary policies of Alexander III and Nicholas II ultimately led to the 1917 Revolution, ending the Tsarist autocracy.

## Agent 配置 / Agent Configuration

本政体包含 7 个 Agent：

| Agent | 角色 | 职责 |
|---|---|---|
| Tsar | 沙皇-专制君主 / Autocrat | 绝对权力的源泉，最终决策者 |
| Boyar Duma | 贵族杜马 / Advisory Council | 咨询建议，提供多方意见 |
| Senate | 参政院 / Administrative Body | 行政执行，协调各部门 |
| Holy Synod | 宗教会议 / Religious Authority | 精神指导，伦理审查 |
| Governor-General | 总督 / Provincial Admin | 地方治理，边疆安全 |
| Minister of War | 军事大臣 / Military | 军事指挥，边防安全 |
| Minister of Finance | 财政大臣 / Finance | 国库管理，经济政策 |

## 使用方式 / Usage

```bash
# Switch to this regime
./scripts/switch-regime.sh global/russian
```

## 编排模式 / Orchestration Pattern

**Centralized Hierarchy (中央集权)**: 沙皇拥有绝对权威，一切权力自上而下。贵族杜马提供建议但沙皇最终裁决。参政院是执行机构，确保圣旨在帝国各处得到落实。"第三罗马"意识形态和东正教信仰为统治提供精神支撑。在 AI 系统中，主 Agent 掌握绝对决策权，咨询 Agent 提供多角度建议。

## 参考资料 / References

- 维基百科：[俄罗斯沙皇国](https://zh.wikipedia.org/wiki/俄罗斯沙皇国)
- Wikipedia: [Tsardom of Russia](https://en.wikipedia.org/wiki/Tsardom_of_Russia)
- Wikipedia: [Russian Empire](https://en.wikipedia.org/wiki/Russian_Empire)
- [OpenClaw 框架](https://github.com/openclaw/openclaw)
