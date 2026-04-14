# 南北朝门阀士族制 — 组织架构

## 制度简介

南北朝（420-589 AD）是中国历史上长达近一百七十年的南北对峙时期。南朝（宋齐梁陈）以门阀士族为核心把持朝政，文化昌盛但军力孱弱；北朝（北魏、东魏西魏、北齐北周）由鲜卑等族建立，尚武务实并推行汉化改革。南北文化碰撞融合，佛教空前兴盛，深刻重塑了政治与社会结构。

The Northern and Southern Dynasties (420–589 AD) witnessed nearly 170 years of parallel rule. The south was dominated by aristocratic clans emphasizing literary culture; the north, founded by Xianbei and other peoples, prized martial strength and gradual sinicization. Buddhism flourished on both sides, becoming a unifying cultural force.

## 组织架构图

```
                    ┌─────────────────────┐
                    │    陛下 / 用户       │
                    └──────────┬──────────┘
                               │
              ┌────────────────┼────────────────┐
              ▼                                 ▼
    ┌─────────────────┐               ┌─────────────────┐
    │    南朝天子      │               │    北朝天子      │
    │  nan-tianzi     │               │  bei-tianzi     │
    └────────┬────────┘               └────────┬────────┘
             │                                 │
             ▼                                 ▼
    ┌─────────────────┐               ┌─────────────────┐
    │    南朝尚书      │               │    北朝六官      │
    │  nan-shangshu   │               │  bei-liuguan    │
    └────────┬────────┘               └────────┬────────┘
             │                                 │
             ▼                                 ▼
    ┌─────────────────┐               ┌─────────────────┐
    │    门阀士族      │               │    军府都督      │
    │  menfa-shizu    │               │  junfu-dudu     │
    └────────┬────────┘               └────────┬────────┘
             │                                 │
             └────────────┬────────────────────┘
                          ▼
                ┌─────────────────┐
                │    僧统 / 寺院   │
                │   sengtong      │
                └─────────────────┘
```

## 角色映射表

| 历史角色 | Agent ID | AI 职责 | 推荐模型 |
|---|---|---|---|
| 南朝天子 | nan-tianzi | coordinator | sonnet |
| 北朝天子 | bei-tianzi | coordinator | sonnet |
| 南朝尚书令 | nan-shangshu | engineering | opus |
| 北周六官大冢宰 | bei-liuguan | engineering | opus |
| 门阀士族 | menfa-shizu | management | sonnet |
| 军府都督 | junfu-dudu | devops | sonnet |
| 僧统 | sengtong | research | haiku |

## 决策流程

1. **nan-tianzi** / **bei-tianzi** 接收用户任务，判定归属（文治归南、武功归北）
2. **menfa-shizu** 评估资源与可行性，提供战略建议
3. 南方任务由 **nan-shangshu** 起草方案；北方任务由 **bei-liuguan** 制定军政计划
4. **junfu-dudu** 负责部署执行与运维保障
5. 涉及跨域知识或佛理难题时，**sengtong** 从知识库中检索启发
6. **nan-tianzi** / **bei-tianzi** 汇总结果，向用户奏报

## 制度特点

- **南北分治**：文武分途，南方侧重文化与行政，北方侧重军事与实务，各有独立协调体系
- **门阀垄断**：士族把持选官（九品中正制），家族资源决定政治走向，寒门难以上升
- **汉化融合**：北朝从鲜卑旧制逐步吸收中原制度（孝文帝改革），南北最终趋向统一
- **佛教介入政治**：寺院经济与僧官体系形成平行权力结构，影响国家财政与决策
- **频繁更迭**：南朝四代更替、北朝政权分裂，制度在动荡中不断演化适应

## Pattern 映射

> **Orchestration pattern**: `federation`

## 历史参考

- 《宋书》《南齐书》《梁书》《陈书》（南朝四史）
- 《魏书》《北齐书》《周书》《北史》（北朝正史）
- 田余庆《东晋门阀政治》
- 陈寅恪《魏晋南北朝史讲演录》（万绳楠整理）
- 汤用彤《汉魏两晋南北朝佛教史》
