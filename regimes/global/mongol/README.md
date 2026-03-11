# Mongol Empire / 蒙古帝国

> 1206年-1368年 · 汗国-忽里勒台 / 1206-1368 · Khanate-Kurultai

## 简介 / Introduction

The Mongol Empire was the largest contiguous land empire in human history, revolutionizing warfare, trade, and cross-cultural exchange across Eurasia. Its governance combined steppe democratic traditions (Kurultai) with meritocratic military organization and codified law (the Yasa), creating a uniquely effective system of imperial administration.

蒙古帝国是人类历史上最大的连续陆地帝国，彻底改变了欧亚大陆的战争、贸易和跨文化交流。其治理将草原民主传统（忽里勒台）与唯才是举的军事组织和成文法典（雅萨）相结合，创造了独特高效的帝国行政体系。

## 历史背景 / Historical Background

In 1206, a Kurultai of Mongol tribes proclaimed Temujin as Genghis Khan ("Universal Ruler"). Over the next two decades, his armies conquered northern China, Central Asia, Persia, and Russia. His military innovations — the decimal system (arban-zuun-mingghan-tumen), feigned retreats, psychological warfare, and the integration of siege engineers from conquered peoples — made the Mongol army the most effective fighting force of its era. The Yasa codified laws governing everything from military discipline to trade and religious freedom. The yam postal system enabled communication across an empire spanning 24 million square kilometers. After Genghis Khan's death in 1227, the empire was divided among his sons and grandsons into four khanates: the Yuan (China), Chagatai (Central Asia), Ilkhanate (Persia), and Golden Horde (Russia). The Pax Mongolica facilitated unprecedented trade along the Silk Road.

## Agent 配置 / Agent Configuration

本政体包含 6 个 Agent：

| Agent | 角色 | 职责 |
|---|---|---|
| Great_Khan (khan) | Great Khan / 大汗 | Supreme authority, strategic command |
| Kurultai (kurultai) | Council of Chiefs / 忽里勒台 | Collective deliberation, Khan election |
| Noyan_West (noyan_w) | Western Commander / 西路统帅 | Western theater military operations |
| Noyan_East (noyan_e) | Eastern Commander / 东路统帅 | Eastern theater military operations |
| Darughachi (darughachi) | Governor / 达鲁花赤 | Civil administration, taxation, census |
| Jarghuchi (jarghuchi) | Judge / 断事官 | Judicial enforcement, Yasa interpretation |

## 使用方式 / Usage

```bash
# Switch to this regime
./scripts/switch-regime.sh global/mongol
```

## 编排模式 / Orchestration Pattern

**democratic-council**: The leader (Great Khan) is elected by a council of peers (Kurultai) rather than inheriting power automatically. Once elected, the Khan holds supreme command but remains bound by the Yasa (supreme law). Regional commanders operate with high autonomy, while a centralized judicial officer (Jarghuchi) ensures legal consistency across the empire.

## 参考资料 / References

- *The Secret History of the Mongols* (c. 1240)
- Rashid al-Din, *Jami' al-Tawarikh* (Compendium of Chronicles)
- Jack Weatherford, *Genghis Khan and the Making of the Modern World* (2004)
- Timothy May, *The Mongol Empire* (2018)
- David Morgan, *The Mongols* (2007)
