# Zulu Kingdom / 祖鲁王国 — 组织架构 / Organizational Structure

## 制度简介 / System Overview

The Zulu Kingdom (1816–1897) was forged by Shaka Zulu through revolutionary military reforms: the ibutho (age-regiment) system, ikanda military kraals, and the "horns of the buffalo" encirclement tactic. This centralized military-administrative system transformed a small Nguni clan into southern Africa's dominant power in a decade, defeating British forces at Isandlwana (1879). Conquered peoples were assimilated into amabutho regiments, replacing clan loyalty with national military identity.

祖鲁王国（1816–1897）由沙卡·祖鲁创建，通过年龄团制度（ibutho）、军事营地（ikanda）、近战战术等军事改革，在十余年内将一个小型恩古尼氏族扩张为东南非洲最强大的帝国。被征服民族被吸纳融合而非消灭，以年龄团取代氏族忠诚，创造了超越血缘的国家认同。

## 组织架构图 / Organization Chart
```
                    ┌──────────────┐
                    │  Inkosi      │
                    │  国王/沙卡     │ ← Absolute authority
                    └──────┬───────┘
                           │ Commands
              ┌────────────┼────────────┐
              ▼            │            ▼
    ┌─────────────────┐   │   ┌──────────────────┐
    │  Induna Enkulu  │   │   │   Izangoma       │
    │  大首领/军事总指挥 │   │   │   占卜师/情报官    │
    │ (chief cmdr)    │   │   │ (diviner/spy)    │
    └────────┬────────┘   │   └──────────────────┘
             │            │
        Strategy       Intelligence
        & Orders       & Rituals
             │            │
             ▼            ▼
    ┌────────────────────────────┐
    │    Izinduna / 团指挥官       │
    │ (regimental commanders)    │
    │                            │
    │  ┌────┐  ┌────┐  ┌────┐   │
    │  │ uD│  │ uF│  │ uM│   │
    │  │ lb│  │ F │  │ MD│   │
    │  └────┘  └────┘  └────┘   │
    │  (Left) (Right) (Chest)   │
    └────────────────────────────┘
             │
             ▼
    ┌─────────────────┐
    │ Umnumzane / 村落首领 │
    │ (kraal heads)   │
    │ Local admin &   │
    │   logistics     │
    └─────────────────┘
```

## 角色映射表 / Role Mapping

| 历史角色 / Historical Role | Agent ID | AI 职责 / AI Responsibility | 推荐模型 / Model |
|---|---|---|---|
| Inkosi / 国王 (沙卡) | inkosi | coordinator | opus |
| Induna Enkulu / 大首领 (军事总指挥) | induna-enkulu | management | sonnet |
| Izinduna / 团指挥官 ( regiments) | izinduna | engineering | haiku |
| Izangoma / 占卜师 (情报/灵性) | izangoma | research | opus |
| Umnumzane / 村落首领 (地方行政) | umnumzane | data | haiku |

## 决策流程 / Decision Flow

1. **inkosi** 收到边境警报或战略机会，召集 **izangoma** 进行占卜
2. **izangoma** 汇报灵性指示与情报分析，**inkosi** 做出战略决断
3. **inkosi** 命令 **induna-enkulu** 制定作战计划
4. **induna-enkulu** 向 **izinduna** 下达动员令，**umnumzane** 征调兵员与粮草
5. **izinduna** 在 ikanda 整编 amabutho，执行"水牛角"战术部署
6. 战后 **izinduna** 汇报战果，**izangoma** 进行战后仪式，**umnumzane** 接收战利品与被征服者

## 制度特点 / Characteristics

- 绝对集权：inkosi 拥有军事、行政、司法绝对权威，权力无分立
- 年龄团制：ibutho 以年龄取代氏族构成军事单位，打破传统血缘忠诚
- 水牛角战术：izimpondo（左右翼）包抄 + isifuba（胸）正面 + umuva（后备）补位
- 军社合一：ikanda 既是兵营也是行政单位，战士即公民
- 占卜主导：重大决策必须经过 izangoma 灵性验证方可执行
-  assimilation 同化：被征服族群青年纳入 amabutho， cattle 战利品由国王分配

## Pattern 映射
> **Orchestration pattern**: `centralized-hierarchy`

## 历史参考 / Historical Sources
- Bryant, A. T. *The Zulu People in Pre-European Times* (1949) — 基于祖鲁口述史的系统整理
- Laband, John. *Rope of Sand: The Rise and Fall of the Zulu Kingdom* (1995) — 军事行政体制分析
- Knight, Ian. *Zulu 1816–1906* (1995) — 军事编制与战术详解
- Greaves, Ian. *Isandlwana 1879: The Great Zulu Victory* (2001) — 战役体现的指挥体系
- Wright, John. *The Colossal Zulu in the Age of Shaka* (1989) — 沙卡改革原始资料汇编
