# Sparta / 斯巴达

> 公元前900年-公元前192年 · 双王制 / 900-192 BC · Dual Kingship

## 简介 / Introduction

Sparta was ancient Greece's preeminent military power, renowned for its unique dual kingship, austere social system, and the legendary discipline of its warriors. The Spartan constitution balanced royal, oligarchic, and democratic power in a system so stable that it lasted over seven centuries with minimal constitutional change.

斯巴达是古希腊首屈一指的军事强权，以独特的双王制、简朴的社会制度和传奇的战士纪律闻名。斯巴达宪制在王权、寡头和民主之间实现平衡，体制稳定延续逾七百年，宪制几乎未变。

## 历史背景 / Historical Background

The Spartan constitution (Great Rhetra) was traditionally attributed to Lycurgus. Sparta dominated the Peloponnese through the Peloponnesian League, defeated Athens in the Peloponnesian War (431-404 BC), and was considered the supreme land power of Greece until its defeat by Thebes at Leuctra (371 BC). The agoge training system, the crypteia secret police, and the helot serf system were defining institutions. Sparta's influence on political thought — as a model of military virtue, mixed government, and constitutional stability — endured long after the city's decline.

## Agent 配置 / Agent Configuration

本政体包含 6 个 Agent：

| Agent | 角色 | 职责 |
|---|---|---|
| King_Agiad (king_a) | King from Agiad line / 阿基亚德国王 | Main coordinator, co-ruler, military command |
| King_Eurypontid (king_b) | King from Eurypontid line / 欧里庞提德国王 | Co-ruler, shared military and religious duties |
| Gerousia (gerousia) | Council of Elders / 长老院 | Legislative preparation, supreme court |
| Ephors (ephors) | Overseers / 监察官 | Executive oversight, law enforcement |
| Polemarch (polemarch) | War Commander / 军事指挥 | Military planning and tactical execution |
| Helot_Overseer (helot_mgr) | Resource Management / 后勤管理 | Supply chain, helot labor management |

## 使用方式 / Usage

```bash
# Switch to this regime
./scripts/switch-regime.sh global/sparta
```

## 编排模式 / Orchestration Pattern

**dual-power**: Two co-equal leaders (kings) must reach consensus, checked by an oversight body (Ephors) with veto power. The Gerousia provides legislative and judicial review. This creates a multi-layered checks-and-balances system where no single agent holds absolute authority.

## 参考资料 / References

- Plutarch, *Life of Lycurgus*
- Xenophon, *Constitution of the Lacedaemonians*
- Thucydides, *History of the Peloponnesian War*
- Herodotus, *Histories* (Books 1, 5-9)
- Paul Cartledge, *Sparta and Lakonia: A Regional History* (2002)
