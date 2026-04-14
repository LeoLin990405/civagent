# 斯巴达双王制 — 组织架构

## 制度简介
斯巴达实行独特的双王制（Dual Kingship），两位国王分别来自阿基亚德（Agiad）与欧里庞提德（Eurypontid）两大家族，共享军事与宗教权力。五名监察官（Ephors）每年选举产生，拥有制衡王权、监督国家运转的实权。长老院（Gerousia）由28名60岁以上贵族与两位国王组成，掌握立法预审与最高司法权。这套混合政体维系了斯巴达约700年的强盛（公元前900年—公元前192年）。

Sparta's dual kingship featured two hereditary kings from the Agiad and Eurypontid dynasties sharing military and religious duties. Five annually elected Ephors held effective power to check the kings and oversee the state. The Gerousia (28 elders over 60 plus both kings) controlled legislative review and supreme judiciary. This mixed constitution sustained Sparta's hegemony for roughly 700 years (900-192 BC).

## 组织架构图
                ┌─────────────────┐
                │   Five Ephors   │
                │    监察官(5)     │ ← 最高实权 / Supreme power
                └────────┬────────┘
                         │ 监督 / Oversight
        ┌────────────────┼────────────────┐
        ▼                ▼                ▼
  ┌───────────┐    ┌───────────┐    ┌─────────────┐
  │ King Agiad│    │King Eury- │    │  Gerousia   │
  │ 阿基亚德国王│    │ pontid    │    │ 长老院(28+2)│ ← 立法审议 / Legislation
  │           │    │欧里庞提德国王│    └──────┬──────┘
  └─────┬─────┘    └─────┬─────┘           │
        │ 共治          │ 共治              │ 司法终审
        └───────┬───────┘           ┌─────▼─────┐
                ▼                   │   Assembly│
          ┌──────────┐              │  公民大会  │
          │Polemarch │              └───────────┘
          │ 军事指挥  │
          └────┬─────┘
               │
          ┌──────────┐
          │ Helot    │
          │ Overseer │
          │ 后勤总管  │

## 角色映射表
| 历史角色 | Agent ID | AI 职责 | 推荐模型 |
|---|---|---|---|
| 监察官（五人会议主席） | ephor-prōtos | coordinator | opus |
| 阿基亚德国王 | king-agiad | coordinator | opus |
| 欧里庞提德国王 | king-eurypontid | coordinator | opus |
| 长老院首席长老 | gerousia-eldest | review | opus |
| 军事指挥（Polemarch） | polemarch | devops | sonnet |
| 希波格列特（皇家卫队长） | hippagretes | management | sonnet |

## 决策流程
1. **ephor-prōtos** 召集五监察官会议，提出动议
2. **king-agiad** 与 **king-eurypontid** 在军事议题上协商一致（宗教事务可独立行动）
3. **gerousia-eldest** 召集长老院审议，可否决提案
4. 通过审议的提案提交 **公民大会** 表决（暗投石子）
5. **ephor-prōtos** 与全体监察官最终批准，法案生效
6. **polemarch** 执行军事命令，**hippagretes** 协调卫队与资源

## 制度特点
- 双王分立：两王同时出征时，一人留守以防政变
- 监察官制衡：五监察官可废立国王、审判长老院成员
- 岁计考察： Ephors每年审查各官厅账目与绩效
- 阿哥ogo体系：全体公民自幼接受严格军事化训练与集体生活
- 希洛特管控：公共土地由国有奴隶（Helots）耕种，由专门官员监督

## Pattern 映射
> **Orchestration pattern**: `dual-power`

## 历史参考
- 普鲁塔克《希腊罗马名人传·莱库古传》
- 色诺芬《斯巴达政制》（Ξενοφῶν, Λακεδαιμονίων πολιτεία）
- 修昔底德《伯罗奔尼撒战争史》
- 亚里士多德《政治学》对斯巴达政体的评析
- Mogens Herman Hansen, *The Sovereignty of the People's Assembly in Classical Sparta* (2022)
