# 蒙古帝国 — 汗国忽里勒台制 / Mongol Empire — Khanate-Kurultai System

## 制度简介 / System Overview

蒙古帝国（1206-1368年）是人类历史上最大的连续陆地帝国，由成吉思汗统一蒙古诸部后建立。忽里勒台（大忽里勒台）作为最高权力机构选举大汗，那颜凭军功而非血统获得权力；雅萨法典确立统一秩序，驿站制度连接万里疆域。

The Mongol Empire (1206–1368) was the largest contiguous land empire in human history, founded by Genghis Khan after unifying the Mongol tribes. The Kurultai (grand assembly) elected the Great Khan, noyans earned power through military merit rather than bloodline, and the Yasa code imposed a uniform legal order across a domain connected by the yam postal relay system.

## 组织架构图 / Organization Chart

```
                    ┌─────────────┐
                    │  Kurultai   │
                    │  忽里勒台    │ ← elects
                    └──────┬──────┘
                           ▼
                    ┌─────────────┐
                    │ Great Khan  │
                    │   大汗      │
                    └──────┬──────┘
                           │
          ┌────────┬───────┼───────┬────────┐
          ▼        ▼       ▼       ▼        ▼
     ┌─────────┐┌──────┐┌──────┐┌──────┐┌────────┐
     │ Noyan   ││Noyan ││Noyan ││Noyan ││Jarghuchi│
     │ West    ││East  ││North ││South ││断事官   │
     │ 西路统帅 ││东路   ││北路  ││南路  ││司法/雅萨│
     └─────────┘└──────┘└──────┘└──────┘└────────┘
                             │
                      ┌──────┴──────┐
                      ▼             ▼
               ┌───────────┐ ┌───────────┐
               │Darughachi │ │ Yam Master│
               │达鲁花赤    │ │ 站赤官    │
               │行政/户籍   │ │ 驿站/通信  │
               └───────────┘ └───────────┘
```

## 角色映射表 / Role Mapping Table

| 历史角色 / Historical Role | Agent ID | AI 职责 / AI Responsibility | 推荐模型 / Model |
|---|---|---|---|
| Great Khan / 大汗 | khan | coordinator — 最高战略决策、跨汗国协调 | opus |
| Kurultai / 忽里勒台 | kurultai | coordinator — 集体议事、继承选举、重大政策表决 | opus |
| Noyan / 那颜（统帅） | noyan-commander | engineering — 军事行动规划、战术执行 | sonnet |
| Jarghuchi / 断事官 | jarghuchi | legal — 雅萨法典解释、纠纷裁决、纪律监察 | opus |
| Darughachi / 达鲁花赤 | darughachi | management — 民政治理、户籍普查、税收征管 | sonnet |
| Yam Master / 站赤官 | yam-master | devops — 驿站运维、通信中继、后勤协调 | haiku |

## 决策流程 / Decision Flow

1. **kurultai** 召集忽里勒台大会，各路那颜就重大议题（征伐、继承、立法）辩论表决
2. **khan** 依据大会共识签发诏令，援引腾格里（长生天）之命
3. **noyan-commander** 接受作战部署，四路并进，各自在战区内享有充分自主权
4. **darughachi** 随军进入新征服地区，建立户籍、驿站、税收体系，实施民政治理
5. **jarghuchi** 依雅萨法典巡回裁决，确保帝国法律统一执行
6. **yam-master** 通过驿站体系传递军报与政令，实现万里疆域的实时通信闭环

## 制度特点 / Characteristics

- **军功授爵**：那颜的权力完全取决于战功，九十五千户制度打破部落血缘壁垒
- **雅萨法治**：成吉思汗颁布的大法典覆盖军事、民事、宗教，以统一法典取代部落习惯法
- **宗教宽容**：帝国不强制信仰，各教派平等纳税即可，吸引各族群人才
- **驿站网络**：站赤制度每数十里设驿站，配备马匹和给养，政令军报日行数百里
- **四汗分封**：大汗直辖中路，分封术赤、察合台、窝阔台、拖雷四系，形成联邦式治理

## Pattern 映射

> **Orchestration pattern**: `democratic`

## 历史参考 / Historical Sources

- 《元朝秘史》（《蒙古秘史》，约1240年）
- 志费尼《世界征服者史》（Tarikh-i-Jahangushay，约1260年）
- 拉施特《史集》（Jami' al-Tawarikh，约1310年）
- 杰克·威泽弗德《成吉思汗与现代世界的形成》（Jack Weatherford, *Genghis Khan and the Making of the Modern World*, 2004）
