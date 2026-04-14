# 明治日本 — 组织架构

## 制度简介
明治维新（1868-1912）推翻了德川幕府，建立亚洲第一个近代立宪国家。1889年《大日本帝国宪法》以普鲁士宪法为蓝本，确立了天皇主权与议会制度相结合的政治体制。实际权力由维新元老（genrō）和内阁掌握，军部则享有统帅权独立的特殊地位，这一制度设计深刻影响了日本后续的扩张道路。

The Meiji Restoration (1868-1912) overthrew the Tokugawa Shogunate and established Asia's first modern constitutional state. The Meiji Constitution of 1889, modeled on Prussia's, combined imperial sovereignty with parliamentary institutions. Real power resided with the Genrō (elder statesmen) and cabinet, while the military enjoyed independent command authority (統帥権), a structural feature that profoundly shaped Japan's subsequent expansion.

## 组织架构图
                ┌────────────┐
                │  天皇 Tennō │ ← 神聖不可侵犯 / Sacred & Inviolable
                └─────┬──────┘
           ┌──────────┴──────────┐
           │  敕令 / Imperial    │
           │  任命 / Appointment │
           ▼                     ▼
    ┌───────────┐        ┌───────────┐
    │  元老 Genrō│◄──────►│ 内阁总理大臣│
    │  ( informal│        │   (Prime  │
    │  advisor) │        │  Minister)│
    └─────┬─────┘        └─────┬─────┘
          │ 提名/ advises       │ 行政指挥 / Executive
          │                     │
    ┌─────┴───────────────┐     │
    ▼                     ▼     ▼
┌──────────┐      ┌──────────┐ ┌─────────┐ ┌──────────┐
│帝国议会  │      │ 枢密院   │ │ 陆军省  │ │ 海军省   │
│Diet      │      │ Privy    │ │ Army    │ │ Navy     │
│(立法监督) │      │ Council  │ │ Ministry│ │ Ministry │
└──────────┘      └──────────┘ └─────────┘ └──────────┘
                                           │
                                     ┌─────┴──────┐
                                     ▼           ▼
                               ┌─────────┐ ┌─────────┐
                               │ 陆军参谋 │ │ 海军军令│
                               │ General  │ │ Admiral │
                               │ Staff    │ │ Staff   │
                               └─────────┘ └─────────┘
                                     │           │
                                     └─────┬─────┘
                                           │
                                     ┌─────┴─────┐
                                     │ 统帅权独立│
                                     │ Supreme  │
                                     │ Command  │
                                     └──────────┘

## 角色映射表
| 历史角色 / Historical Role | Agent ID | AI 职责 | 推荐模型 |
|---|---|---|---|
| 天皇 / Emperor | tenno | coordinator | sonnet |
| 元老 / Elder Statesmen | genro | management | opus |
| 内阁总理大臣 / Prime Minister | pm | management | sonnet |
| 帝国议会 / Imperial Diet | diet | review | haiku |
| 枢密院 / Privy Council | privy | review | opus |
| 陆军大臣 / Army Minister | army | devops | sonnet |
| 海军大臣 / Navy Minister | navy | devops | sonnet |

## 决策流程
1. **genro** 协商国策方向，决定首相人选
2. **pm** 组建内阁，制定施政纲领
3. **pm** 将法案提交 **diet** 审议
4. **diet** 审议法案并表决（预算需优先通过）
5. **privy** 对宪法及条约问题提供咨询意见
6. **army / navy** 独立制定军备计划，直接上奏 **tenno**
7. **tenno** 在元老辅弼下裁可重大决策并任命军官
8. **pm / 各大臣** 执行政策，**diet** 进行监督

## 制度特点
- 元老主导：维新功臣组成的非正式决策圈实际掌握首相提名与国策制定权
- 统帅权独立：军令系统独立于内阁，陆海军参谋本部可直接上奏天皇
- 预算优先制：议会无法通过预算时可沿用上年度预算，内阁仍可施政
- 枢密院复审：重要条约、紧急敕令需经枢密院宪法审查
- 官僚普鲁士化：精英官僚集团通过文官考试选拔，效忠天皇而非政党
- 万世一系：天皇作为神裔的不可侵犯性构成一切权力的最终源头

## Pattern 映射
> **Orchestration pattern**: `centralized`

## 历史参考
- 伊藤博文《大日本帝国宪法》（1889年颁布）
- 宫本又次《明治政治史》
- 信夫淳平《明治政治史》
- 约翰·霍尔《明治维新》（Marius B. Jansen, The Making of Modern Japan）
