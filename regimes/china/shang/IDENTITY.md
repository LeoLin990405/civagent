# 商朝神权贵族制 — 组织架构

## 制度简介
商朝（约公元前 1600 年 - 前 1046 年）是中国第一个有直接文字记载的王朝。实行神权贵族制，王权与神权高度统一，商王既是政治领袖也是最高祭司。甲骨占卜构成核心决策机制，凡军国大事必先问天。

The Shang Dynasty (c. 1600-1046 BC) was China's first dynasty with direct textual evidence. It operated as a theocratic aristocracy where royal and divine authority merged. Oracle bone divination formed the core decision-making system for all state affairs.

## 组织架构图
```
                ┌─────────┐
                │  大 王  │
                │  (王)   │
                └────┬────┘
                     │ 王命
          ┌──────────┼──────────┐
          ▼          ▼          ▼
      ┌───────┐  ┌───────┐  ┌───────┐
      │  大巫  │  │卿事寮 │  │  宰   │
      │(占卜) │  │(行政) │  │(内务) │
      └───────┘  └───────┘  └───────┘
          │          │
          │          ├──►┌───────┐
          │          │   │ 太师  │
          │          │   │(军事) │
          │          │   └───────┘
          │          │
          │          └──►┌───────┐
          │              │ 小臣  │
          │              │(记录) │
          │              └───────┘
          │
          ▼
      ┌───────────┐
      │ 贞人集团  │
      │(占卜执行) │
      └───────────┘
```

## 角色映射表
| 历史角色 | Agent ID | AI 职责 | 推荐模型 |
|---|---|---|---|
| 大王 | da-wang | coordinator | opus |
| 大巫 | da-wu | research | opus |
| 卿事寮 | qingshi-liao | management | sonnet |
| 太师 | tai-shi | engineering | sonnet |
| 小臣 | xiao-chen | content | haiku |
| 宰 | zai | devops | haiku |
| 贞人 | zhen-ren | data | haiku |

## 决策流程
1. **da-wang** 接收外部指令或事件（如边境告急、祭祀日期）
2. **da-wu** 主持占卜仪式，分析吉凶趋势与风险评估
3. **zhen-ren** 记录占卜结果，形成数据档案
4. **da-wang** 依据占卜结果裁断决策方向
5. **qingshi-liao** 调度资源，分配执行任务
6. **tai-shi** 执行技术性工作（如军事部署、工程建设）
7. **xiao-chen** 全程记录，**zai** 保障运维环境

## 制度特点
- 神权决策：占卜是法定前置程序，不可跳过
- 王巫合一：商王兼任最高祭司，垄断通天权
- 贞人专职：专业占卜集团负责执行与记录
- 血缘贵族：权力按宗法血缘等级分配
- 内外服制：内服王畿与外服诸侯分层治理

## Pattern 映射
> **Orchestration pattern**: `theocratic`

## 历史参考
- 《史记·殷本纪》（司马迁）
- 甲骨文合集（郭沫若编）
- 张光直《美术、神话与祭祀》
- 李学勤《殷墟甲骨断代工程》
- 陈梦家《殷墟卜辞综述》
