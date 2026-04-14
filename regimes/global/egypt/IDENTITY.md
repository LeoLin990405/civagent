# 古埃及法老神权制 — 组织架构 (Ancient Egypt Pharaoh Theocracy)

## 制度简介 (System Overview)
古埃及（公元前3100年-前30年）是高度集权的神权国家，法老被视为荷鲁斯在世的化身。该制度将宗教权威与复杂的行政官僚体系结合，围绕“玛阿特”（Ma'at）秩序高效管理尼罗河资源并兴建永恒建筑。
Ancient Egypt (3100-30 BC) was a highly centralized theocratic state where the Pharaoh was worshipped as a living god. The system integrated divine authority with complex administrative bureaucracy to manage the Nile and build eternal monuments under the principle of Ma'at.

## 组织架构图 (Organization Chart)
                        ┌──────────────┐
                        │  法老 Pharaoh │
                        │ (Living God) │
                        └──────┬───────┘
                               │ 神谕 Divine Decree
                ┌──────────────┴──────────────┐
        ┌───────┴───────┐             ┌───────┴───────┐
        │  宰相 Vizier   │             │ 大祭司 Priest │
        │ (Chief Admin) │             │ (Ma'at Audit) │
        └───────┬───────┘             └───────┬───────┘
                │                             │
        ┌───────┼───────┬───────┐             │
        ▼       ▼       ▼       ▼             ▼
    [皇家书吏] [工程总监] [军事统帅] [地方诺姆] [神庙祭司]
      Scribe   Overseer  Commander   Nomarchs   Rituals

## 角色映射表 (Role Mapping Table)
| 历史角色 | Agent ID | AI 职责 | 推荐模型 |
|---|---|---|---|
| 法老 (Pharaoh) | `pharaoh` | coordinator | sonnet |
| 宰相 (Vizier) | `vizier` | management | sonnet |
| 大祭司 (High Priest) | `high-priest` | review | opus |
| 皇家书吏 (Royal Scribe) | `royal-scribe` | data | haiku |
| 工程总监 (Overseer of Works) | `overseer-of-works` | engineering | opus |
| 军事统帅 (Commander) | `military-commander` | devops | sonnet |

## 决策流程 (Decision Flow)
1. **pharaoh** 下达神谕，确立宏观目标与战略愿景（如金字塔工程或对外远征）。
2. **vizier** 将神谕解析为具体的行政指令，统筹资源并分派至各专业 Agent。
3. **overseer-of-works** 负责工程实现，**military-commander** 执行安全保障与系统防御。
4. **high-priest** 依据“玛阿特”准则对所有阶段性产出进行对齐审核（Review），确保符合核心价值观。
5. **royal-scribe** 全程记录所有交互数据与决策日志，实现知识的数字化永存。

## 制度特点 (Characteristics)
- **神权合法性 (Divine Authority)**：法老作为最高协调者（Coordinator），其指令具备神圣不可违抗性，确保系统高执行力。
- **玛阿特校验 (Ma'at Alignment)**：引入宗教审核机制作为质量门禁，通过大祭司实现对逻辑与伦理的双重审查。
- **书吏知识管理 (Scribal Bureaucracy)**：极度重视数据记录（Data），通过书吏系统维持跨越数千年的知识连续性。
- **宰相中枢管控 (Vizier Centralization)**：单中心调度模式，宰相作为管理核心处理复杂的资源冲突与任务分发。

## Pattern 映射
> **Orchestration pattern**: `theocratic`

## 历史参考 (Historical Sources)
- Toby Wilkinson, *The Rise and Fall of Ancient Egypt*
- Barry Kemp, *Ancient Egypt: Anatomy of a Civilization*
- Mark Lehner, *The Complete Pyramids*
- 《都灵王表》(Turin King List)
- 《亡灵书》(The Book of the Dead) — 玛阿特审判部分
