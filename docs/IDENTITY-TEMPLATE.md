# Canonical IDENTITY.md Template

All 57 regimes conform to this structure. The validator (`npm run validate:regimes`) enforces presence of each H2 section.

## Rationale

v4 IDENTITY.md files ranged from 49 to 106 lines with inconsistent sections — some had org charts, others lacked role mapping tables. The runtime (`engine/regime-to-cc.mjs`) parses the role mapping table; regimes without it fall back to defaults, losing governance authenticity.

v5 canonicalizes the structure so the Agent Team reliably mirrors each civilization's actual governance architecture.

## Required structure

```markdown
# <Chinese name> — <Governance System Name>

> ⚠️ Attribution block (preserved from upstream when applicable).

## 制度简介 / System Overview

2–4 sentences on the governance system's era, duration, historical significance.
Both Chinese and English should appear when the regime is non-Chinese.

## 组织架构图 / Organization Chart

ASCII diagram showing the decision hierarchy. Must include:
- A top authority (emperor / assembly / consul / etc.)
- 3–10 distinct organs/offices with names in the original language
- Arrows indicating command / review / report flow

Example (Tang):
\```
              ┌──────────┐
              │  皇帝    │
              └────┬─────┘
                   │ 圣旨
      ┌────────────┼────────────┐
      ▼            ▼            ▼
  [中书省]    [门下省]    [尚书省]
   起草        审核        执行
                              │
            ┌───┬───┬───┬───┬─┴─┬───┐
            ▼   ▼   ▼   ▼   ▼   ▼
          吏部 户部 礼部 兵部 刑部 工部
\```

## 角色映射表 / Role Mapping Table

Required columns, parsed by `engine/regime-to-cc.mjs`:

| 历史角色 / Historical Role | Agent ID | AI 职责 / AI Responsibility | 推荐模型 / Recommended Model |
|---|---|---|---|
| 皇帝 | emperor | coordinator | sonnet |
| 中书舍人 | zhongshu-drafter | engineering (draft code/policy) | opus |
| 门下给事中 | menxia-reviewer | review | opus |
| ... | ... | ... | ... |

Each row must have a non-empty `Agent ID` (lowercase kebab-case) and one of the canonical AI roles:
**coordinator, engineering, review, research, data, devops, content, legal, management**

## 决策流程 / Decision Flow

3–7 step narrative describing how a typical governance decision moves through the org chart. Reference the Agent IDs from the mapping table.

Example:
1. **emperor** receives a petition about frontier famine.
2. **emperor** issues an edict to **zhongshu-drafter**.
3. **zhongshu-drafter** produces a draft plan.
4. **menxia-reviewer** rejects or amends the draft (iteration allowed).
5. On approval, **shangshu-executor** dispatches to the 6 ministries in parallel.
6. Each ministry reports back with concrete measurable outputs.

## 制度特点 / Characteristics

Bullet list of 3–6 defining features. Each feature should be a specific mechanism, not a platitude:
- "Three-stage checks-and-balances: drafting, reviewing, and executing are strictly separated" ✓
- "Good governance" ✗

## Pattern 映射

Single line naming the orchestration pattern from `engine/modes/`:

> **Orchestration pattern**: `checks-and-balances`

One of: `centralized`, `checks-and-balances`, `democratic`, `dual-track`, `federation`, `theocratic`
(aliases accepted: see `engine/regime-to-cc.mjs` PATTERN_ALIASES).

## 历史参考 / Historical Sources

3–5 primary or authoritative references. Shortest acceptable form:
- 《旧唐书·职官志》
- Tang Liu Dian (唐六典), ed. Li Linfu (733 CE)
- Wang Gungwu, *The Structure of Power in North China during the Five Dynasties*

---

## Checklist for new / rewritten regimes

- [ ] System Overview section ≥ 2 sentences
- [ ] Org chart with labeled hierarchy
- [ ] Role mapping table ≥ 5 rows with valid Agent IDs
- [ ] Decision flow references Agent IDs
- [ ] Characteristics are mechanism-level, not vague
- [ ] Orchestration pattern is one of 6 canonical (or documented alias)
- [ ] ≥ 3 historical sources
- [ ] Passes `npm run validate:regimes`
