# 奥斯曼帝国苏丹-迪万制 — 组织架构 / Ottoman Sultan-Divan System — Organization

## 制度简介 / System Overview

奥斯曼帝国（1299-1922年）横跨欧亚非三洲，延续逾六世纪，是伊斯兰世界最持久的帝国。苏丹以"安拉世间之影"之名行使绝对权力，通过大维齐尔（Grand Vizier）主持的御前会议（Divan-i Hümayun）治理国政。德夫希尔梅制度从基督教臣民中征募少年，培养为忠于苏丹的行政精英与近卫军，形成独特的非世袭精英体系。米勒特制度允许各宗教社群在民事与宗教事务上高度自治。

The Ottoman Empire (1299-1922) spanned three continents for over six centuries, the most enduring empire in the Islamic world. The Sultan exercised absolute authority as the "Shadow of God on Earth," governing through the Imperial Council (Divan-i Hümayun) chaired by the Grand Vizier. The devshirme system recruited Christian boys into a loyal non-hereditary elite of administrators and Janissaries. The millet system granted religious communities broad self-governance in civil and religious affairs.

## 组织架构图 / Organization Chart

```
                         ┌─────────────┐
                         │   Sultan    │
                         │   苏 丹     │
                         └──────┬──────┘
                                │
                    ┌───────────┴───────────┐
                    ▼                       ▼
            ┌──────────────┐       ┌───────────────┐
            │ Grand Vizier │       │ Janissary Aga │
            │  大维齐尔     │       │  近卫军统领     │
            └──────┬───────┘       └───────────────┘
                   │               (direct to Sultan)
          ┌────────┼────────┬──────────┐
          ▼        ▼        ▼          ▼
    ┌──────────┐┌────────┐┌────────┐┌──────────────┐
    │ Kazasker ││Defter- ││ Nişancı││ Kapudan Pasha│
    │ 军事法官  ││  dar   ││ 大法官  ││  海军司令     │
    │          ││财务总管 ││        ││              │
    └──────────┘└────────┘└────────┘└──────────────┘
```

## 角色映射表 / Role Mapping Table

| 历史角色 / Historical Role | Agent ID | AI 职责 / AI Responsibility | 推荐模型 / Model |
|---|---|---|---|
| Sultan / 苏丹 | sultan | coordinator | opus |
| Grand Vizier / 大维齐尔 | grand-vizier | management | opus |
| Kazasker / 军事法官 | kazasker | legal | sonnet |
| Defterdar / 财务总管 | defterdar | data | sonnet |
| Nişancı / 大法官 | nisanci | review | opus |
| Kapudan Pasha / 海军司令 | kapudan-pasha | devops | sonnet |
| Janissary Aga / 近卫军统领 | janissary-aga | engineering | haiku |

## 决策流程 / Decision Flow

1. **sultan** 发布敕令（ferman），或 **grand-vizier** 在御前会议中提出议题
2. **grand-vizier** 主持迪万会议，召集各部门审议
3. **kazasker** 审查敕令是否符合沙里亚法与卡农法（kanun）
4. **defterdar** 评估财政可行性并编制预算
5. **nisanci** 以苏丹花押（tughra）认证文件合法性
6. **grand-vizier** 下达执行指令，**kapudan-pasha** 处理海上事务，**janissary-aga** 负责安全与军事行动
7. **defterdar** 记录支出并回报执行结果

## 制度特点 / Characteristics

- **德夫希尔梅精英制**：从基督教臣民中征募少年，经严格训练后成为忠于苏丹的行政官和近卫军，打破世袭垄断，形成非血统精英阶层
- **米勒特自治制**：东正教、亚美尼亚、犹太等宗教社群在民事与宗教事务上享有高度自治，以宗教身份而非民族身份组织社会
- **苏丹花押认证**：所有重大法令须经 Nişancı 加盖苏丹花押（tughra）方具法律效力，实现文件层面的权力集中
- **军事-行政双轨**：近卫军统领直属苏丹、独立于大维齐尔体系，形成军事力量对行政体系的制衡
- **御前会议决策**：大维齐尔主持的迪万并非橡皮图章，各专职官员有实质审议权，苏丹通过格栅窗幕后观察

## Pattern 映射

> **Orchestration pattern**: `centralized`

## 历史参考 / Historical Sources

- İnalcık, Halil. *The Ottoman Empire: The Classical Age, 1300-1600*. London: Weidenfeld & Nicolson, 1973.
- İpşirli, Mehmet. "Divan-i Hümayun." *Encyclopedia of Islam*, 2nd ed.
- Imber, Colin. *The Ottoman Empire, 1300-1650: The Structure of Power*. Basingstoke: Palgrave Macmillan, 2002.
- 《奥斯曼帝国：一个世界帝国的崛起》（帕特里克·贝尔福）
- Peirce, Leslie P. *The Imperial Harem: Women and Sovereignty in the Ottoman Empire*. Oxford University Press, 1993.
