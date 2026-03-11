# Ottoman Empire / 奥斯曼帝国

> 1299年-1922年 · 苏丹-迪万制 / 1299-1922 · Sultan-Divan System

## 简介 / Introduction

The Ottoman Empire was one of the largest and longest-lasting empires in world history, bridging the medieval and modern eras across three continents. Its sophisticated governance combined absolute sultanic authority with meritocratic recruitment (devshirme), religious pluralism (millet system), and a powerful imperial council (Divan).

奥斯曼帝国是世界历史上最大、最持久的帝国之一，横跨中世纪与近代，版图遍及三大洲。其精密治理将苏丹绝对权力与唯才是举（德夫希尔梅）、宗教多元（米勒特制度）以及强大的御前会议（迪万）相结合。

## 历史背景 / Historical Background

Founded by Osman I in 1299 as a small Anatolian beylik, the empire conquered Constantinople in 1453 under Mehmed II, ending the Byzantine Empire. It reached its zenith under Suleiman the Magnificent (r. 1520-1566), when it controlled southeastern Europe, the Middle East, and North Africa. The Divan-i Humayun functioned as a cabinet meeting presided over by the Grand Vizier, with the Sultan observing from behind a screened window. The devshirme system — forcibly recruiting Christian boys to be trained as loyal Muslim administrators and soldiers — produced many of the empire's greatest statesmen and generals. The millet system recognized Orthodox Christians, Armenian Christians, and Jews as self-governing communities. The empire's slow decline through the 18th-19th centuries led to the Tanzimat reforms and eventually to dissolution after World War I.

## Agent 配置 / Agent Configuration

本政体包含 7 个 Agent：

| Agent | 角色 | 职责 |
|---|---|---|
| Sultan (sultan) | Supreme Authority / 至高统治者 | Absolute power, final decisions |
| Grand_Vizier (grand_vizier) | Chief Minister / 大维齐尔 | Executive coordination, Divan chair |
| Kazasker (kazasker) | Military Judge / 军事法官 | Legal compliance, Sharia and kanun |
| Defterdar (defterdar) | Treasury / 财务总管 | Imperial finances, timar system |
| Nisanci (nisanci) | Chancellor / 大法官 | Document authentication, tughra |
| Kapudan_Pasha (kapudan) | Navy / 海军司令 | Maritime operations, technology |
| Janissary_Aga (janissary) | Elite Guard / 近卫军统领 | Security, elite military operations |

## 使用方式 / Usage

```bash
# Switch to this regime
./scripts/switch-regime.sh global/ottoman
```

## 编排模式 / Orchestration Pattern

**centralized-hierarchy**: A single supreme authority (Sultan) delegates executive power to a chief minister (Grand Vizier) who coordinates specialized ministers in a formal council (Divan). A parallel security channel (Janissary Aga) reports directly to the top, bypassing the regular hierarchy. All documents require formal authentication (tughra).

## 参考资料 / References

- Halil Inalcik, *The Ottoman Empire: The Classical Age, 1300-1600* (1973)
- Colin Imber, *The Ottoman Empire, 1300-1650* (2009)
- Caroline Finkel, *Osman's Dream: The Story of the Ottoman Empire* (2005)
- Cemal Kafadar, *Between Two Worlds: The Construction of the Ottoman State* (1995)
- Stanford Shaw, *History of the Ottoman Empire and Modern Turkey* (1976)
