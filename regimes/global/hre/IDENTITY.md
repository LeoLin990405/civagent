# 神圣罗马帝国选帝侯制 — 组织架构 / Holy Roman Empire — Electoral System

## 制度简介 (System Overview)
神圣罗马帝国（962–1806）是欧洲历史上延续时间最长的政治实体之一，以高度分权的联邦体系和选举君主制为特征。其权力核心由七位选帝侯（Prince-electors）掌握，通过《1356年金玺诏书》确立了法律框架。
The Holy Roman Empire (962–1806) was a decentralized feudal federation characterized by an elective monarchy. Its power centered on the Prince-electors, with the Golden Bull of 1356 establishing a constitutional framework that balanced the Emperor's authority with princely autonomy.

## 组织架构图 (Organization Chart)
                ┌────────────────┐
                │ 神圣罗马皇帝    │
                │ (Emperor)      │
                └───────┬────────┘
                        │ 协调与象征
        ┌───────────────┼───────────────┐
        ▼               ▼               ▼
  ┌───────────┐   ┌───────────┐   ┌───────────┐
  │ 选帝侯团  │   │ 帝国议会  │   │ 帝国法院  │
  │ (Electors)│   │ (Diet)    │   │ (Court)   │
  └─────┬─────┘   └─────┬─────┘   └─────┬─────┘
        │               │               │
  ┌─────┴─────┬─────────┴───────┬───────┴─────┐
  ▼           ▼                 ▼             ▼
[美因茨]    [世俗诸侯]        [自由城市]    [帝国圈]
(Mainz)     (Princes)         (Cities)      (Circles)

## 角色映射表 (Role Mapping Table)
| 历史角色 | Agent ID | AI 职责 | 推荐模型 |
|---|---|---|---|
| 神圣罗马皇帝 | emperor | coordinator | sonnet |
| 美因茨大主教 (首席选帝侯) | arch-chancellor | management | sonnet |
| 选帝侯会议 | electoral-college | review | opus |
| 帝国议会 (Reichstag) | imperial-diet | research | haiku |
| 帝国高等法院 | chamber-court | legal | opus |
| 帝国圈 (Reichskreise) | regional-circles | devops | sonnet |
| 自由城市代表 | free-cities | data | haiku |

## 决策流程 (Decision Flow)
1. **arch-chancellor** 接收外部请求或议案，评估其对帝国宪制的影响。
2. **electoral-college** 进行闭门磋商，针对重大政策或皇位选举达成初步共识。
3. **emperor** 将议案正式提交至 **imperial-diet**，由选帝侯、诸侯及城市三院进行分层辩论。
4. **chamber-court** 审查决议是否违反帝国法律或既有的封建契约。
5. **regional-circles** 负责在分散的各邦国内部落实最终的帝国法令（Recess）。

## 制度特点 (Characteristics)
- **选举契约化**：皇帝并非世袭，必须通过选帝侯投票产生，并签署《选举特许状》承诺尊重地方自治。
- **三重否决机制**：帝国议会的三院（选帝侯院、诸侯院、城市院）必须达成一致方能通过重大法规。
- **司法纠纷解决**：通过帝国高等法院而非武力解决成员间的领土与权利争端。
- **执行职能外包**：帝国中央不设常备军，军事与税务执行权下放到十个“帝国圈”区域协调组织。

## Pattern 映射
> **Orchestration pattern**: `federation`

## 历史参考 (Historical Sources)
- 《1356年金玺诏书》(The Golden Bull of 1356)
- Peter H. Wilson, *The Holy Roman Empire: A Thousand Years of Europe's History*
- 伏尔泰《论各民族的风俗与精神》 (Voltaire, *Essai sur les mœurs*)
- 《威斯特伐利亚和约》(Treaty of Westphalia, 1648)
