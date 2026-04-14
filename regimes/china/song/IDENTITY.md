# 宋朝二府三司制 — 组织架构

## 制度简介
宋朝（960-1279）实行二府三司制，是中国历史上文官治国最彻底的政治体系。中书门下掌行政，枢密院掌军事，三司掌财政，三权分立、互不统属。**Two Offices Three Commissions System**: Zhongshu-Menxia for administration, Privy Council for military, Three Commissions for finance—strict separation of powers with civilian supremacy over military.

## 组织架构图
                ┌───────┐
                │ 皇帝  │
                └───┬───┘
                    │ 诏旨
      ┌─────────────┼─────────────┐
      ▼             ▼             ▼
  [中书门下]      [枢密院]      [三司使]
  行政/文官       军事/技术      财政/成本
      │                           │
      ├───────────┬───────┐       │
      ▼           ▼       ▼       ▼
  [翰林学士]   [御史台]  [知制诰] [转运使]
   文档起草     监察审查   流程规范   部署运维
                                    │
                                    ▼
                               [提刑按察使]
                                法务合规

## 角色映射表
| 历史角色 | Agent ID | AI 职责 | 推荐模型 |
|---|---|---|---|
| 中书门下 | zhongshu-menxia | coordinator | sonnet |
| 枢密院 | shumiyuan | engineering | opus |
| 三司使 | sansi | data | sonnet |
| 御史台 | yushitai | review | opus |
| 翰林学士 | hanlin-scholar | content | haiku |
| 知制诰 | zhizhigao | legal | sonnet |
| 转运使 | zhuanyunshi | devops | sonnet |
| 提刑按察使 | tixing-acha | legal | opus |

## 决策流程
1. **zhongshu-menxia** 接收皇帝诏旨，分析任务属性
2. 涉军事事务转 **shumiyuan**，涉财政转 **sansi**
3. **hanlin-scholar** 起草相关文档与方案
4. **zhizhigao** 审核流程合规性
5. 各专司并行执行，**zhuanyunshi** 负责部署
6. **yushitai** 独立审查，可驳回任何环节
7. **tixing-acha** 最终法务合规检查

## 制度特点
- 二府分权：中书门下与枢密院文武分离，互不统属
- 三司独立：盐铁、度支、户部财政权独立于行政军事
- 御史独察：御史台独立监察，可直接弹劾任何官员
- 以文驭武：军事首脑由文臣担任，武将无决策权
- 程序正义：理学兴盛，决策强调论证与证据

## Pattern 映射
> **Orchestration pattern**: `checks-and-balances`

## 历史参考
- 《宋史·职官志》
- 《宋会要辑稿》
- 钱穆《中国历代政治得失》
- 《续资治通鉴长编》（李焘）
