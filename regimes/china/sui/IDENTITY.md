# 隋朝三省六部制（初创） — 组织架构

## 制度简介
隋文帝杨坚终结南北朝三百余年分裂，初创三省六部制。内史省起草、门下省审核、尚书省执行，确立权力制衡雏形；下设吏、户、礼、兵、刑、工六部专职。同时开创科举制度，以考试选拔人才，打破门阀垄断。隋朝虽仅存37年，但此制影响此后一千三百年。

The Sui Dynasty, founded by Emperor Wen of Sui (Yang Jian), ended three centuries of division and established the proto Three Departments Six Ministries system. The separation of drafting (Neishi), review (Menxia), and execution (Shangshu) created a prototype of checks and balances, complemented by six ministries and the newly created imperial examination system.

## 组织架构图
                ┌───────┐
                │ 皇帝  │
                └───┬───┘
                    │ 圣旨
      ┌─────────────┼─────────────┐
      ▼             ▼             ▼
  [内史省]      [门下省]      [尚书省]
    起草           审核           执行
                                   │
               ┌───┬───┬───┬───┬───┴───┐
               ▼   ▼   ▼   ▼   ▼       ▼
              吏部 户部 礼部 兵部 刑部   工部

## 角色映射表
| 历史角色 | Agent ID | AI 职责 | 推荐模型 |
|---|---|---|---|
| 皇帝 | emperor | coordinator | sonnet |
| 内史令 | neishi-director | engineering | opus |
| 纳言 | nayan-remembrancer | review | opus |
| 尚书令 | shangshu-executor | management | sonnet |
| 吏部尚书 | libu-hr | management | sonnet |
| 户部尚书 | hubu-finance | data | sonnet |
| 兵部尚书 | bingbu-defense | devops | sonnet |

## 决策流程
1. **emperor** 颁布修运河诏令
2. **neishi-director** 起草工程方案
3. **nayan-remembrancer** 审核（可封驳）
4. **shangshu-executor** 转发至工部执行
5. **bingbu-defense** 协调民夫征调
6. 各部尚书并行推进并回报

## 制度特点
- 三省雏形：内史、门下、尚书分权，创制权制衡先河
- 科举创始：打破九品中正制，以才选官
- 六部专职：吏户礼兵刑工各司其职
- 工程导向：大运河、东都洛阳展现宏大工程能力
- 效率优先：承北周旧制改革，务实高效

## Pattern 映射
> **Orchestration pattern**: `checks-and-balances`

## 历史参考
- 《隋书·百官志》
- 《资治通鉴·隋纪》
- 陈寅恪《隋唐制度渊源略论稿》
- 钱穆《中国历代政治得失》
