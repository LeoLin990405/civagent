# 日本幕府制 — 组织架构 (Japanese Shogunate — Organizational Structure)

## 制度简介 (System Overview)
德川幕府（1603-1868）是日本历史上最后的武家政权，确立了将军掌握实权、天皇保有象征权威的二元统治格局。通过“幕藩体制”和“参勤交代”，幕府实现了长达两个半世纪的社会稳定与政治封锁。
The Tokugawa Shogunate (1603-1868) was Japan's final warrior government, establishing a dual-power structure where the Shogun held actual authority while the Emperor remained a symbolic figurehead. Through the "Bakuhan" system and "Sankin-kotai," it maintained two and a half centuries of stability and isolation.

## 组织架构图 (Organization Chart)
            ┌──────────────────┐          ┌──────────────────┐
            │  天皇 (Emperor)   │ ◄─ 叙任 ─► │  将军 (Shogun)   │
            │  京都·象征权威    │  Legitimacy │  江户·实际统治   │
            └──────────────────┘          └────────┬─────────┘
                                                   │
                                    ┌──────────────┼──────────────┐
                                    ▼              ▼              ▼
                              ┌──────────┐   ┌──────────┐   ┌──────────┐
                              │ 老中 (Roju)│   │若年寄 (Waka)│   │目付(Metsuke)│
                              │ 最高行政  │   │ 旗本管理  │   │ 监察百官  │
                              └─────┬────┘   └──────────┘   └──────────┘
                                    │
                     ┌──────────────┴──────────────┐
                     ▼                             ▼
              ┌──────────┐                  ┌──────────┐
              │ 奉行 (Bugyo)│                  │ 大名 (Daimyo)│
              │ 行政/财务 │                  │ 地方藩主  │
              └──────────┘                  └──────────┘

## 角色映射表 (Role Mapping Table)
| 历史角色 / Historical Role | Agent ID | AI 职责 / AI Responsibility | 推荐模型 / Model |
|---|---|---|---|
| 征夷大将军 / Shogun | shogun | coordinator | sonnet |
| 天皇 / Emperor | emperor | content | haiku |
| 老中 / Roju | roju | management | sonnet |
| 目付 / Metsuke | metsuke | review | opus |
| 奉行 / Bugyo | bugyo | engineering | haiku |
| 大名 / Daimyo | daimyo | management | sonnet |
| 勘定奉行 / Kanjo-bugyo | kanjo-finance | data | sonnet |

## 决策流程 (Decision Flow)
1. **shogun** 发布全国性宏观政策或针对大名的重大外交、军事指令。
2. **roju** 主持合议，将其转化为具体的幕府政令并协调各部门。
3. **metsuke** 负责监督各级官吏与大名，审计政策执行过程中的偏差。
4. **kanjo-finance** 处理幕府直辖领地的财务预算、税收与经济数据。
5. **bugyo** 在江户等核心城市执行具体的司法、民政与公共工程。
6. **daimyo** 在各自领地（藩）内执行幕府法令，并维持地方高度自治。

## 制度特点 (Characteristics)
- 幕藩体制：中央幕府（公仪）与地方藩主（大名）共享权力，维持政治天平。
- 参勤交代：强制大名定期往返江户，通过高额财政消耗与人质制度削弱地方实力。
- 二元权威：利用天皇的仪式性地位为武家政权提供法理上的正统性背书。
- 合议机制：老中制度采用月番轮值和集体联署，防止出现单一权臣篡位。

## Pattern 映射
> **Orchestration pattern**: `dual-track`

## 历史参考 (Historical Sources)
- 《德川实纪》(Tokugawa Jikki)
- 《武家诸法度》(Buke Shohatto)
- 钱穆《中国历代政治得失》（中日治理对比部分）
- Conrad Totman, *Early Modern Japan* (1993)
