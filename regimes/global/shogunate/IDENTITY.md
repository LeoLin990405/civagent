# 日本幕府制 — 组织架构 / Japanese Shogunate — Organizational Structure

## 制度简介 / System Overview

德川幕府（1603-1868）是日本历史上最稳定的武家政权。将军（征夷大将军）掌握实际统治权，天皇在京都保有名义上的最高权威但不参与政务。幕府实行锁国政策(sakoku)，严格控制对外接触；国内维持士农工商的严格等级制度。老中作为最高行政机构辅佐将军，目付负责监察百官，奉行管理城市行政，各地大名在领内享有相当自治权但须遵守参勤交代制度。

The Tokugawa Shogunate (1603-1868) was the most stable warrior government in Japanese history. The Shogun (Sei-i Taishogun) held actual ruling power while the Emperor in Kyoto retained nominal supreme authority without participating in governance. The Bakufu enforced sakoku (national isolation) and maintained the rigid shi-no-ko-sho class system. The Roju (Council of Elders) served as the supreme administrative body, Metsuke inspected officials, Bugyo administered cities, and Daimyo governed their domains autonomously under the sankin-kotai (alternate attendance) system.

## 组织架构图 / Org Chart

```
       ┌──────────────────┐          ┌──────────────────┐
       │ 天皇 (Emperor)   │ ← 名義 → │ 将軍 (Shogun)    │
       │ 京都·象征权威     │  legitimacy │ 江戸·実際統治    │
       │ Kyoto · Symbol   │          │ Edo · Actual Rule │
       └──────────────────┘          └────────┬─────────┘
                                              │ 御命令 / Order
                              ┌───────────────┼───────────────┐
                              ▼               ▼               ▼
                     ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
                     │ 老中 (Roju)  │ │若年寄         │ │ 目付         │
                     │ Council of   │ │Wakadoshiyori │ │ Metsuke      │
                     │ Elders       │ │Junior Council│ │ Inspector    │
                     │ 最高行政     │ │ 人事管理     │ │ 監察         │
                     └──────┬───────┘ └──────────────┘ └──────────────┘
                            │
                   ┌────────┼────────┐
                   ▼                 ▼
            ┌──────────────┐ ┌──────────────┐
            │ 奉行 (Bugyo) │ │ 大名 (Daimyo)│
            │ Magistrate   │ │ Domain Lord  │
            │ 都市行政     │ │ 藩自治       │
            └──────────────┘ └──────────────┘
```

## 角色映射表 / Role Mapping

| 古代角色 / Historical Role | Agent ID | AI 職責 / AI Responsibility | 推奨模型 / Model |
|---|---|---|---|
| 征夷大将軍 / Shogun | `shogun` | 実際の統治者：全局決策、命令発布、幕府統括 | 強力模型 |
| 天皇 / Emperor (Tenno) | `tenno` | 象徴的権威：正統性付与、伝統文化保護、儀礼 | 快速模型 |
| 老中 / Roju — Council of Elders | `roju` | 最高行政：国政運営、大名監督、外交管理 | 強力模型 |
| 若年寄 / Wakadoshiyori — Junior Council | `wakadoshiyori` | 人事管理：旗本管理、内部事務、人材育成 | 快速模型 |
| 目付 / Metsuke — Inspector | `metsuke` | 監察：官吏監視、法令遵守確認、情報収集 | 快速模型 |
| 奉行 / Bugyo — Magistrate | `bugyo` | 都市行政：司法裁判、財務管理、寺社管理 | 快速模型 |
| 大名 / Daimyo — Domain Lord | `daimyo` | 地方自治：藩内統治、税収、地域開発 | 強力模型 |

## 協作流程 / Workflow

1. **将軍下令** → 用户発出指令，将軍以御命令形式頒布
2. **老中審議** → 老中合議制で審議し、将軍に建議を提出
3. **各奉行執行** → 町奉行・勘定奉行・寺社奉行が各担当分野で実行
4. **目付監察** → 目付が執行過程を監視し、不正を上報
5. **大名落実** → 各藩の大名が領内で政策を実施
6. **天皇認可** → 重大事項は天皇の形式的認可を得て正統性を確保
7. **将軍回報** → 完了後、将軍に正式報告

## 模型分層策略 / Model Tier Strategy

- **強力模型**（将軍、老中、大名）：核心決策と戦略的判断
- **快速模型**（天皇、若年寄、目付、奉行）：儀礼、監察、日常行政
- 二重権力構造により、将軍と天皇の間のバランスが重要
