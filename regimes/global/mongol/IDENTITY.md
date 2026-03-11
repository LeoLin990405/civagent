# Mongol Empire / 蒙古帝国 — 组织架构 / Organizational Structure

## 制度简介 / System Overview

The Mongol Empire (1206-1368) was the largest contiguous land empire in history, stretching from Korea to Hungary at its peak. Founded by Temujin (Genghis Khan) after unifying the Mongol tribes, it was governed through a unique blend of steppe democracy (Kurultai), absolute military discipline (the decimal system), and codified law (the Yasa). The empire practiced religious tolerance, meritocratic promotion, and sophisticated logistics (the yam postal system). After Genghis Khan's death, the empire divided into four khanates but maintained a nominal unity under the Great Khan.

蒙古帝国（1206-1368年）是历史上最大的连续陆地帝国，鼎盛时期疆域从朝鲜半岛延伸至匈牙利。由铁木真（成吉思汗）统一蒙古诸部后建立，通过草原民主（忽里勒台）、绝对军事纪律（十进制编制）和成文法（雅萨）的独特结合进行治理。帝国实行宗教宽容、唯才是举和精密后勤（驿站制度）。成吉思汗去世后，帝国分为四大汗国，但在大汗名义下维持统一。

## 组织架构图 / Org Chart

```
            ┌──────────────┐
            │  Kurultai    │ ← elects
            │ 忽里勒台      │
            └──────┬───────┘
                   ▼
            ┌──────────────┐
            │  Great Khan  │
            │  大汗 (khan)  │
            └──────┬───────┘
                   │
      ┌────────┬───┴───┬──────────┐
      ▼        ▼       ▼          ▼
┌──────────┐┌──────┐┌──────────┐┌──────────┐
│ Noyan W  ││Noyan ││Darughachi││Jarghuchi │
│ 西路统帅  ││E     ││达鲁花赤   ││ 断事官    │
│          ││东路统帅││ 行政     ││ 司法     │
└──────────┘└──────┘└──────────┘└──────────┘
```

## 角色映射表 / Role Mapping

| 古代角色 / Historical Role | Agent ID | AI 职责 / AI Responsibility | 推荐模型 / Model |
|---|---|---|---|
| Great Khan / 大汗 | khan | Supreme command, strategic direction / 最高统帅，战略方向 | Claude / GPT-4 |
| Kurultai / 忽里勒台 | kurultai | Collective deliberation, succession / 集体议事，继承决策 | Claude / GPT-4 |
| Western Noyan / 西路统帅 | noyan_w | Western theater operations / 西线军事行动 | GPT-4 / DeepSeek |
| Eastern Noyan / 东路统帅 | noyan_e | Eastern theater operations / 东线军事行动 | GPT-4 / DeepSeek |
| Darughachi / 达鲁花赤 | darughachi | Civil administration, census, taxation / 民政，户籍，税收 | GPT-4 / Qwen |
| Jarghuchi / 断事官 | jarghuchi | Judicial enforcement, Yasa interpretation / 司法执行，雅萨解释 | Claude / GPT-4 |

## 协作流程 / Workflow

1. **Kurultai Assembly** — For major decisions (succession, grand campaigns, law changes), the Kurultai convenes. All senior noyans must attend.
2. **Khan's Decree** — The Great Khan issues commands after deliberation, invoking the mandate of Tengri.
3. **Theater Deployment** — Noyans West and East receive operational orders and execute with wide autonomy in their zones.
4. **Administrative Integration** — The Darughachi establishes governance in conquered territories: census, taxation, yam stations, and local recruitment.
5. **Judicial Oversight** — The Jarghuchi enforces the Yasa across the empire, adjudicating disputes and punishing violations.
6. **Yam Communications** — All reporting and coordination flows through the yam postal relay system, ensuring rapid communication across vast distances.
