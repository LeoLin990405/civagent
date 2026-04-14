# 孔雀王朝 / Maurya Empire — 政事论制

## 制度简介
孔雀王朝（公元前322-185年）是印度首个大一统帝国，由旃陀罗笈多与考底利耶建立并依据《政事论》（Arthashastra）治理。该制度以中央集权为核心，建立覆盖全境的密探网络（Guptchar），推行达摩伦理（Dhamma），并区分七类财政收入与支出。帝国鼎盛时疆域涵盖南亚次大陆大部，阿育王时期达到巅峰。

The Maurya Empire (322-185 BC) was the first pan-Indian empire, founded by Chandragupta and Chanakya and governed by the Arthashastra. It featured centralized authority, an empire-wide spy network (Guptchar), Ashoka's dharma policy, and seven-fold revenue classification. At its peak under Ashoka, it dominated most of the Indian subcontinent.

## 组织架构图
                ┌──────────────┐
                │  Samrat      │
                │  皇帝·转轮王  │
                │ Chakravartin │
                └──────┬───────┘
                       │ 御诏
            ┌──────────┴──────────┐
            │    Mantri           │
            │    首相·大维齐尔      │
            │ Chief Minister     │
            └──────────┬──────────┘
                       │ 政令
        ┌──────┬───────┼───────┬──────┬───────┐
        │      │       │       │      │
    ┌───┴───┐┌┴───┐ ┌┴───┐ ┌───┴───┐┌┴──────┐
    │Senapati││Gupt│ │Sama│ │Sanni- ││Dharma│
    │ 军事统帅 ││char│ │harta│ │dhata  ││maham-│
    │Commander││ 密探│ │ 税收│ │ 国库   ││atra  │
    │        ││Intel│ │Rev. │ │Treas. ││ 督察  │
    └────────┘└────┘ └────┘ └───────┘└───────┘

## 角色映射表
| 历史角色 | Agent ID | AI 职责 | 推荐模型 |
|---|---|---|---|
| 皇帝 / Samrat | samrat | coordinator | opus |
| 首相 / Mantri | mantri | management | opus |
| 军事统帅 / Senapati | senapati | devops | sonnet |
| 密探长 / Guptchar | guptchar | research | haiku |
| 税务官 / Samaharta | samaharta | data | sonnet |
| 国库令 / Sannidhata | sannidhata | engineering | sonnet |
| 法度督察 / Dharmamahamtra | dharmamahamtra | review | sonnet |

## 决策流程
1. **guptchar** 向 **mantri** 汇报密探网络情报（内情/外情）
2. **mantri** 汇总情报并咨询 **samaharta**（财政数据）、**senapati**（军情）、**sannidhata**（国库状况）
3. **mantri** 起草政策方案并呈交 **samrat**
4. **samrat** 决策（批准/驳回/修改），诏令送达 **dharmamahamtra** 进行达摩合规审查
5. **dharmamahamtra** 审核通过后，政令分发至执行部门
6. **senapati**、**samaharta**、**sannidhata** 并行执行并回报
7. **guptchar** 持续监察官员表现与政策效果，反馈闭环

## 制度特点
- 中央集权：Samrat-Mantri 二元核心，政令自中央直达行省
- 密探体系：两重密探网络（外部敌人、内部官员），"信任但要核实"
- 七类财源：农业、采矿、贸易、盐税、关税、赌博、罚款，分别登记入册
- 国库分立：Sannidhata 掌管国库，Senapati 掌管军库，Samaharta 掌管税库，三库分立制约
- 达摩审计：Dharmamahamtra 可绕过 Mantri 直接向 Samrat 报告伦理违规
- 季节性治理：按季制定预算与政策，农业周期驱动决策节奏

## Pattern 映射
> **Orchestration pattern**: `centralized`

## 历史参考
- 《政事论 / Arthashastra》（考底利耶著，约公元前3世纪成书）
- 阿育王敕令 / Ashoka Edicts（石柱敕令与崖版敕令）
- Megasthenes《印度志 / Indica》（希腊使节见闻）
- Romila Thapar《早期印度史》（Early India: From the Origins to AD 1300）
- 《往世书 / Puranas》中的孔雀王朝世系记载
