# 苏美尔城邦 — 组织架构

## 制度简介
苏美尔是人类已知最早文明，分布于幼发拉底河与底格里斯河之间，约公元前4500年至1900年。城邦以神庙经济为核心，恩（EN）掌管宗教与经济大权，卢伽尔（LUGAL）负责军事与防御，形成双重权威体制。楔形文字的发明使官僚体系得以运作，灌溉农业则依赖高度组织化的劳动协作。

## 组织架构图
```
                ┌───────────┐
                │   安（AN）  │
                │  天界神权  │
                └─────┬─────┘
                      │
          ┌───────────┴───────────┐
          │                       │
     ┌────┴────┐            ┌─────┴─────┐
     │ 恩（EN） │◄──coord──►│ 卢伽尔     │
     │ 最高祭司 │            │ 军事首领   │
     │ 经济总管 │            │ 国防领袖   │
     └────┬────┘            └─────┬─────┘
          │                       │
          │              ┌────────┴────────┐
          │              │                 │
    ┌─────┴─────┐   ┌────┴────┐      ┌────┴────┐
    │ 恩西      │   │ 书吏    │      │ 祭司    │
    │ ENSI      │   │DUBSAR   │      │  GALA   │
    │ 城邦总督  │   │ 档案管理 │      │ 仪式主持 │
    └─────┬─────┘   └─────────┘      └─────────┘
          │
    ┌─────┴─────┐
    │ 使者      │
    │ SUKKAL   │
    │ 信息路由  │
    └───────────┘
```

## 角色映射表
| 历史角色 | Agent ID | AI 职责 | 推荐模型 |
|---|---|---|---|
| 安（AN） | an-sky-god | research | sonnet |
| 恩（EN） | en-high-priest | coordinator | opus |
| 卢伽尔（LUGAL） | lugal-military-king | management | sonnet |
| 恩西（ENSI） | ensi-city-governor | management | sonnet |
| 书吏（DUBSAR） | dubsar-scribe | data | sonnet |
| 祭司（GALA） | gala-ritualist | review | haiku |
| 使者（SUKKAL） | sukkal-messenger | content | haiku |

## 决策流程
1. **an-sky-god** 象征性授权（神权合法化）
2. **sukkal-messenger** 接收外部请求并分类路由
3. **en-high-priest** 评估宗教与经济层面
4. **lugal-military-king** 评估军事与安全因素（如涉及）
5. **en-high-priest** 与 **lugal-military-king** 双重裁决
6. **ensi-city-governor** 执行决策，协调灌溉与劳役
7. **dubsar-scribe** 记录全流程，**gala-ritualist** 验证仪式合规性

## 制度特点
- 神权双重授权：安（天界神）→ 恩（宗教/经济）与卢伽尔（军事）分立
- 神庙经济核心：所有土地、谷物、牲畜归属神庙，恩掌控分配
- 楔形文字档案：书吏以泥板记录一切，确保可追溯性
- 仪式合规审查：祭司有权以"仪式污秽"为由终止任何决策
- 城邦独立自主：各城邦自有恩西与卢伽尔，无统一王权

## Pattern 映射
> **Orchestration pattern**: `theocratic`

## 历史参考
- Samuel Noah Kramer, *The Sumerians: Their History, Culture, and Character* (University of Chicago Press, 1963)
- 《乌尔王陵出土泥板》（约公元前2600年，大英博物馆藏）
- Thorkild Jacobsen, "Primitive Democracy in Ancient Mesopotamia" (1943), *Journal of Near Eastern Studies* 2(3)
- Guillermo Algaze, *The Uruk World System: The Dynamics of Expansion of Early Mesopotamian Civilization* (University of Chicago Press, 1993)
- Robert D. Biggs, "The Evidence for the Earliest Written Records in Mesopotamia" (1975), *Journal of the American Oriental Society* 95(2)
