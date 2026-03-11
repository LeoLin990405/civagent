# 日本幕府制 · 幕府制 (Japanese Shogunate)

> 1603-1868 AD · Bakufu System / 幕府制

## 简介 / Introduction

德川幕府是日本历史上最后也是最稳定的武家政权，延续二百六十五年，实现了前所未有的和平（太平の世）。将军（征夷大将军）掌握实际统治权，天皇在京都仅为名义上的最高权威。幕府实行锁国政策(sakoku)，严格控制对外接触，国内维持士农工商的严格等级制度。武士道精神贯穿治理始终，义务(giri)高于一切个人欲望。

The Tokugawa Shogunate was the last and most stable warrior government in Japanese history, achieving 265 years of unprecedented peace (Taihei no yo). The Shogun (Sei-i Taishogun) held actual ruling power while the Emperor in Kyoto remained a ceremonial figurehead. The Bakufu enforced sakoku (national isolation) and maintained the rigid shi-no-ko-sho class system. Bushido pervaded governance — duty (giri) above all personal desire.

## 历史背景 / Historical Background

1600年关原之战后，德川家康统一日本，1603年受封征夷大将军，在江户（今东京）建立幕府。通过参勤交代制度（大名每隔一年须前往江户居住），控制各地大名。1635年实行锁国令，仅允许荷兰商人在长崎出岛贸易。幕府建立了精密的行政体系：老中（Council of Elders）辅佐将军处理国政，目付监察百官，奉行管理城市和财政。1853年佩里黑船来航打破锁国，最终导致1868年明治维新和幕府的终结。

After the Battle of Sekigahara in 1600, Tokugawa Ieyasu unified Japan and was appointed Sei-i Taishogun in 1603, establishing the Bakufu in Edo (modern Tokyo). The sankin-kotai system (alternate attendance) controlled daimyo by requiring residence in Edo every other year. The sakoku edict of 1635 restricted foreign contact to Dutch traders at Dejima, Nagasaki. The Bakufu built a sophisticated administrative system: the Roju advised the Shogun on national affairs, Metsuke inspected officials, and Bugyo administered cities and finances. Perry's Black Ships in 1853 shattered isolation, ultimately leading to the Meiji Restoration of 1868 and the Shogunate's end.

## Agent 配置 / Agent Configuration

本政体包含 7 个 Agent：

| Agent | 角色 | 职责 |
|---|---|---|
| Shogun | 征夷大将军 / Actual Ruler | 实际统治者，最终决策者 |
| Emperor | 天皇 / Ceremonial Sovereign | 象征权威，赋予正统性 |
| Roju | 老中 / Council of Elders | 最高行政，国政运营 |
| Wakadoshiyori | 若年寄 / Junior Council | 人事管理，内部事务 |
| Metsuke | 目付 / Inspector | 监察百官，情报收集 |
| Bugyo | 奉行 / Magistrate | 城市行政，司法财务 |
| Daimyo | 大名 / Domain Lord | 地方自治，藩内统治 |

## 使用方式 / Usage

```bash
# Switch to this regime
./scripts/switch-regime.sh global/shogunate
```

## 编排模式 / Orchestration Pattern

**Dual Power (二重权力)**: 将军掌握实际统治权，天皇保有象征性权威——权力的实质与名义分离。这一独特的二重结构意味着合法性(legitimacy)与实权(power)分属两个 Agent。老中作为集体决策机构辅佐将军，目付作为独立监察力量确保体系运行。在 AI 系统中，主决策 Agent 与正统性 Agent 分离，监察 Agent 独立运作。

## 参考资料 / References

- 维基百科：[德川幕府](https://zh.wikipedia.org/wiki/德川幕府)
- Wikipedia: [Tokugawa Shogunate](https://en.wikipedia.org/wiki/Tokugawa_shogunate)
- Wikipedia: [Bakuhan system](https://en.wikipedia.org/wiki/Bakuhan_system)
- [OpenClaw 框架](https://github.com/openclaw/openclaw)
