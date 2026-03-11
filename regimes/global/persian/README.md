# Persian Achaemenid Empire / 波斯阿契美尼德帝国

> 公元前550年-公元前330年 · 总督制 / 550-330 BC · Satrap System

## 简介 / Introduction

The Achaemenid Empire was the first superpower, uniting diverse peoples from the Nile to the Indus under a system of remarkable tolerance and administrative sophistication. The satrap system allowed local autonomy within imperial unity, while the Royal Eye ensured accountability without crushing independence.

阿契美尼德帝国是第一个超级大国，以非凡的宽容和精密的行政制度将从尼罗河到印度河的多元民族统一起来。总督制在帝国统一的框架下允许地方自治，皇帝之眼在不压制独立性的前提下确保问责。

## 历史背景 / Historical Background

Founded by Cyrus the Great in 550 BC after conquering the Median, Lydian, and Neo-Babylonian empires, the Achaemenid dynasty reached its zenith under Darius I (r. 522-486 BC), who organized the empire into 20+ satrapies, built the Royal Road from Sardis to Susa, standardized weights and coinage (the daric), and carved the Behistun Inscription proclaiming his legitimacy. The empire's religious tolerance — exemplified by Cyrus's liberation of the Babylonian Jews — was unprecedented. The empire fell to Alexander the Great in 330 BC but its administrative innovations influenced every subsequent Middle Eastern empire.

## Agent 配置 / Agent Configuration

本政体包含 7 个 Agent：

| Agent | 角色 | 职责 |
|---|---|---|
| Shahanshah (shah) | King of Kings / 万王之王 | Supreme authority, policy direction |
| Hazarapatis (hazarapatis) | Grand Vizier / 宰相 | Court coordination, access to throne |
| Satrap_West (satrap_w) | Western Satrap / 西部总督 | Western provincial governance |
| Satrap_East (satrap_e) | Eastern Satrap / 东部总督 | Eastern provincial governance |
| Spahbed (spahbed) | Military Commander / 军事统帅 | Armed forces command |
| Royal_Eye (eye) | Inspector / 皇帝之眼 | Secret inspection and loyalty monitoring |
| Royal_Scribe (scribe) | Records / 文书官 | Imperial archives and communications |

## 使用方式 / Usage

```bash
# Switch to this regime
./scripts/switch-regime.sh global/persian
```

## 编排模式 / Orchestration Pattern

**federated-autonomy**: A supreme center (Shahanshah) delegates extensive authority to semi-autonomous provincial agents (Satraps), maintained through a secret oversight mechanism (Royal Eye) and centralized military command. Local adaptation is encouraged; disloyalty is not tolerated.

## 参考资料 / References

- Herodotus, *Histories* (Books 1, 3, 7)
- Xenophon, *Cyropaedia*
- The Behistun Inscription (Darius I)
- The Cyrus Cylinder
- Pierre Briant, *From Cyrus to Alexander: A History of the Persian Empire* (2002)
- Amelie Kuhrt, *The Persian Empire: A Corpus of Sources* (2007)
