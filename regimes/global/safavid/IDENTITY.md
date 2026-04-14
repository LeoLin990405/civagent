# 萨法维帝国 (Safavid Empire) — 组织架构

## 制度简介
萨法维帝国（1501-1736）将什叶派确立为波斯国教，实现了宗教权威与君主集权的深度融合。The Safavid Empire established Shi'a Islam as the state religion of Persia, merging religious authority with monarchical power. 帝国通过中央集权改革与奇兹尔巴什（Qizilbash）军事组织，构建了近代早期中东最强大的神权政治体制。Through centralization and the Qizilbash military structure, it built a potent early modern theocratic system in the Middle East.

## 组织架构图
                ┌───────────────┐
                │      Shah     │
                │     (沙阿)     │
                └───────┬───────┘
                        │
        ┌───────────────┼───────────────┐
        ▼               ▼               ▼
  [Grand Vizier]     [Sadr]      [Qizilbash Cmd]
   (大维齐尔)       (萨德尔)      (奇兹尔巴什)
        │               │               │
  ┌─────┴─────┐   ┌─────┴─────┐   ┌─────▼─────┐
  ▼           ▼   ▼           ▼   ▼           ▼
[Mostowfi] [Nazir] [Mujtahid] [Shaykh] [Military Units]
 (财政)     (管家)   (教法)     (教长)     (作战部队)

## 角色映射表
| 历史角色 | Agent ID | AI 职责 | 推荐模型 |
|---|---|---|---|
| 沙阿 (Shah) | shah | coordinator | sonnet |
| 大维齐尔 (Grand Vizier) | grand-vizier | management | sonnet |
| 萨德尔 (Sadr) | sadr | review | opus |
| 奇兹尔巴什首领 | qizilbash-commander | devops | sonnet |
| 财政大臣 (Mostowfi) | mostowfi-finance | data | haiku |
| 穆智台希德 (Mujtahid) | mujtahid-jurist | legal | opus |
| 王室总管 (Nazir) | nazir-steward | engineering | haiku |

## 决策流程
1. **mujtahid-jurist** 依据什叶派教法对当前议案提供法理建议（Fatwa）。
2. **sadr** 审核该建议与宗教官僚体系及国家政策的兼容性。
3. **grand-vizier** 进行行政可行性评估，并协调各部门预算。
4. **shah** 听取各方陈述后，下达最终御令（Farman）。
5. **qizilbash-commander** 负责军事动员，**nazir-steward** 负责王室资源调度。
6. **mostowfi-finance** 全程跟踪资金流向并完成最终审计。

## 制度特点
- 神王合一：沙阿既是波斯“万王之王”，也被视为什叶派精神领袖的世俗代表。
- 奇兹尔巴什核心：一种结合了部落忠诚、宗教狂热与采邑（Tiul）制度的军事-政治精英阶层。
- 双重宗教权威：通过萨德尔管理宗教财产，通过穆智台希德群体掌握教法解释权，确保意识形态统一。
- 垂直集权：阿巴斯大帝改革后，将大量省份转为皇室直辖领地（Khassa），强化中央财政控制。

## Pattern 映射
> **Orchestration pattern**: `theocratic`

## 历史参考
- Roger Savory, *Iran under the Safavids* (Cambridge University Press)
- Willem Floor, *Safavid Government Institutions* (Mazda Publishers)
- 《萨法维王朝史》（[波斯] 伊斯坎达尔·贝格·蒙希 著）
- 钱穆《世界局势阿拔斯大帝改革考》
