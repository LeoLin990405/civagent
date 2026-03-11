# Meiji Japan / 明治日本 — 组织架构 / Organizational Structure

## 制度简介 / System Overview

The Meiji Restoration (明治維新, 1868) overthrew the Tokugawa Shogunate and restored imperial rule, launching Japan's transformation from a feudal society into a modern industrial and military power. The Meiji Constitution of 1889, drafted by Itō Hirobumi after studying European constitutions (particularly Prussia's), created Asia's first modern constitutional state. The Emperor held sovereign authority but governed through ministers; real power resided with the Genrō (元老, elder statesmen) — the heroes of the Restoration who guided Japan's modernization from behind the scenes. The military enjoyed direct access to the Emperor (統帥権の独立), independent of civilian control, a structural feature that would have fateful consequences in the 20th century.

明治维新（1868年）推翻了德川幕府，恢复了天皇统治，启动了日本从封建社会向现代工业军事强国的转型。伊藤博文在研究了欧洲宪法（尤其是普鲁士）后起草的1889年明治宪法，创建了亚洲第一个近代立宪国家。天皇拥有主权但通过大臣施政；真正的权力掌握在元老手中——那些引导日本现代化的维新功臣。军部享有直接上奏天皇的权力（统帅权独立），不受文官控制，这一制度特征在20世纪产生了深远的影响。

## 组织架构图 / Org Chart

```
                    ┌──────────────────┐
                    │   Tennō / 天皇    │ ← Sacred & Inviolable
                    │  (tenno) 万世一系  │   神聖不可侵犯
                    └────────┬─────────┘
                             │ sanctions laws & commands
                    ┌────────┴─────────┐
                    │  Genrō / 元老     │ ← Real power (informal)
                    │  (genro) 維新元勲  │   advises & nominates PM
                    └────────┬─────────┘
                             │ nominates
                    ┌────────┴─────────┐
                    │ Prime Minister   │
                    │ 内閣総理大臣 (pm)  │
                    └──┬─────────┬─────┘
                       │         │
          ┌────────────┤         ├────────────┐
          ▼            ▼         ▼            ▼
  ┌──────────────┐ ┌────────┐ ┌────────┐ ┌──────────┐
  │ Imperial Diet│ │ Privy  │ │ Army   │ │ Navy     │
  │ 帝国議会      │ │Council │ │ Chief  │ │ Chief    │
  │ (diet)       │ │枢密院   │ │陸軍参謀 │ │海軍軍令部 │
  │              │ │(privy) │ │(army)  │ │(navy)    │
  └──────────────┘ └────────┘ └────────┘ └──────────┘
                                  │            │
                                  └──── direct access ────┘
                                      to Emperor (統帥権)
```

## 角色映射表 / Role Mapping

| 歴史角色 / Historical Role | Agent ID | AI 職責 / AI Responsibility | 推荐模型 / Model |
|---|---|---|---|
| Emperor / 天皇 | tenno | Symbolic authority, final sanction, system continuity / 象征权威，最终裁可，系统连续性 | Claude Opus 4.6 / GPT-5.4 |
| Elder Statesmen / 元老 | genro | Strategic direction, PM nomination, crisis resolution / 战略方向，首相推荐，危机处理 | Claude Opus 4.6 / GPT-5.4 Pro |
| Prime Minister / 内閣総理大臣 | pm | Policy coordination, cabinet management, legislative agenda / 政策协调，内阁管理，立法议程 | GPT-5.4 / DeepSeek R2 |
| Imperial Diet / 帝国議会 | diet | Budget approval, legislation debate, limited oversight / 预算审批，法案讨论，有限监督 | Gemini 3.1 Pro / Qwen3-Coder |
| Privy Council / 枢密院 | privy | Constitutional review, treaty analysis, legal advisory / 宪法审查，条约分析，法律咨询 | DeepSeek R2 / Kimi K2.5 |
| Army Chief of Staff / 陸軍参謀総長 | army | Land operations, continental strategy, force modernization / 陆军作战，大陆战略，军事现代化 | GPT-5.3 Instant / Qwen3-Coder |
| Navy Chief of Staff / 海軍軍令部長 | navy | Naval operations, maritime strategy, fleet development / 海军作战，海洋战略，舰队发展 | GPT-5.3 Instant / Kimi K2.5 |

## 协作流程 / Workflow

1. **Strategic Direction** — The Genrō deliberate on national priorities and advise the Tennō on the appointment of a Prime Minister.
2. **Policy Formation** — The Prime Minister formulates policy with his Cabinet, consulting the Privy Council on constitutional and treaty matters.
3. **Legislative Process** — Bills are submitted to the Imperial Diet for debate. The Diet may approve, amend, or reject — but the government can fall back on the previous year's budget if blocked.
4. **Military Planning** — The Army and Navy Chiefs develop strategic plans independently of the Cabinet, reporting directly to the Emperor through the right of supreme command (統帥権).
5. **Imperial Sanction** — The Tennō sanctions laws and major decisions, guided by the Genrō's counsel. Imperial Rescripts carry the weight of sacred decree.
6. **Constitutional Review** — The Privy Council reviews treaties, emergency ordinances, and constitutional questions before they receive imperial sanction.
7. **Execution** — The Prime Minister and his ministers implement approved policies. The military executes campaigns. The bureaucracy — modeled on Prussia's — ensures efficient administration.
8. **Crisis Resolution** — When conflicts arise (e.g., Army vs. Navy budget disputes, Diet vs. Cabinet standoffs), the Genrō mediate and the Emperor's moral authority provides final resolution.
