# 高棉帝国神王制 (Devaraja System) — 组织架构

## 制度简介
神王制（Devaraja）是高棉帝国（802-1431）的统治核心，君主被视为湿婆或毗湿奴在人间的化身。这一政教合一的制度将宗教权威、巨型石窟建筑与高度发达的水利灌溉系统（Baray）融为一体，创造了东南亚古典文明的巅峰。
The Devaraja system was the foundation of the Khmer Empire, where the monarch was worshipped as a divine incarnation. This theocratic-hydraulic state integrated religious authority with massive irrigation projects and monumental temple construction.

## 组织架构图
                ┌──────────────┐
                │   DEVARAJA   │
                │   神王 (君主)  │
                └──────┬───────┘
                       │
        ┌──────────────┼──────────────┐
        ▼              ▼              ▼
  [PUROHITA]      [VRAH GURU]      [KHLON]
    王室祭司         王室导师         监察官
  (神权/法律)      (知识/技术)      (审计/监督)
        │              │              │
        └──────┬───────┴──────┬───────┘
               ▼              ▼
           [AMATYA]       [TAMRVAC]
            中央大臣        行省总督
           (资源调配)      (地方执行)

## 角色映射表
| 历史角色 | Agent ID | AI 职责 | 推荐模型 |
|---|---|---|---|
| 神王 (Devaraja) | devaraja | coordinator | sonnet |
| 王室祭司 (Purohita) | purohita | review | opus |
| 王室导师 (Vrah Guru) | vrah-guru | research | opus |
| 大臣 (Amatya) | amatya | management | sonnet |
| 监察官 (Khlon) | khlon | legal | sonnet |
| 总督 (Tamrvac) | tamrvac | devops | haiku |

## 决策流程
1. **vrah-guru** 根据星象历法或水利需求提供专业的研究分析建议。
2. **purohita** 审核该建议是否符合神圣法律（Dharma）及帝国传统。
3. **devaraja** 作为最高意志做出最终决策，颁布带有神性的圣旨。
4. **amatya** 将最高决策细化为劳动力分配、物资调拨等管理指令。
5. **tamrvac** 在地方行省具体落地执行（如开凿运河或建设寺庙）。
6. **khlon** 全程对资源消耗和工程质量进行审计，并向 **devaraja** 独立汇报。

## 制度特点
- **神格王权**：君主是宇宙中心（须弥山）的化身，统治合法性源于神授权力。
- **水利政治**：通过对大规模蓄水池（Baray）的管理，实现对农业生产与人口的严密控制。
- **祭司制衡**：世袭的婆罗门祭司家族（Purohita）掌握宗教仪式权，在精神层面引导王政。
- **层级效忠**：地方总督通过复杂的宣誓仪式与神王建立契约，负责征集劳役与税收。
- **建筑导向**：大规模的寺庙建设不仅是宗教行为，也是帝国资源调配能力的终极展示。

## Pattern 映射
> **Orchestration pattern**: `theocratic`

## 历史参考
- 周达观《真腊风土记》（1296 CE）
- David P. Chandler, *A History of Cambodia*
- George Cœdès, *The Indianized States of Southeast Asia*
- 《巴肯山石碑铭文》（Bakong Inscriptions）
