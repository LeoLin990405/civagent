# 俄罗斯莫斯科沙皇国 — 组织架构 / Muscovite Tsardom — Organizational Structure

## 制度简介 / System Overview

莫斯科沙皇国（约1547-1682）自伊凡四世（伊凡雷帝）加冕"全俄罗斯沙皇"始，至彼得大帝改革前夕，是俄罗斯专制制度的成型期。沙皇自称"全俄罗斯的专制君主"，以"第三罗马"自居，继承拜占庭正教传统。贵族杜马（Боярская дума）以"沙皇圣裁、波雅尔议定"（государь указал, бояре приговорили）的形式合议；诸衙门（приказы）按职能分理外交、军役与财政；莫斯科牧首（1589年设）以正教权威与皇权"和谐"（симфония）共治；各城督军（воевода）代表中央治理地方。（彼得大帝后的参政院、东正教最高会议与各部制属18世纪另一套帝国体制，宜单列。）

The Muscovite Tsardom (c. 1547–1682), from Ivan IV (the Terrible)'s coronation as "Tsar of All Rus'" to the eve of Peter the Great's reforms, was the formative phase of Russian autocracy. The Tsar styled himself "Autocrat of All the Russias," claiming the mantle of the "Third Rome" and the Byzantine Orthodox legacy. The Boyar Duma deliberated under the formula "the sovereign decreed and the boyars affirmed"; the chancelleries (prikazy) handled foreign affairs, military service, and finance by function; the Patriarch of Moscow (est. 1589) co-governed in Orthodox "symphony" (simfoniya) with the crown; and provincial military governors (voevody) administered the localities. (The post-Petrine Senate, Holy Synod, and ministries form a distinct 18th-c. imperial order, best modeled separately.)

## 组织架构图 / Org Chart

```
                    ┌──────────────────────────────────┐
                    │      沙皇 (Царь / Gosudar)        │  симфония  ┌─────────────────┐
                    │   全俄罗斯的专制君主               │◄─────────►│  莫斯科牧首       │
                    │  Autocrat of All the Russias      │  (1589–)   │  Patriarch       │
                    └───────────────┬──────────────────┘            └─────────────────┘
                                    │ 谕令 (Указ / Ukaz)
                ┌───────────────────┼───────────────────┐
                ▼                   ▼                   ▼
      ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
      │   贵族杜马       │ │   诸衙门         │ │   军役登记衙门    │
      │  Boyar Duma     │ │  Prikazy        │ │  Razryadny      │
      │  (合议/咨政)     │ │ (外交·财政)      │ │  Prikaz (军役)   │
      └─────────────────┘ └────────┬────────┘ └─────────────────┘
                                   │
                          ┌────────┴────────┐
                          ▼                 ▼
                   ┌──────────────┐  ┌──────────────┐
                   │ 大国库衙门    │  │   督军        │
                   │ Bolshaya     │  │   Voevoda    │
                   │ Kazna (财政)  │  │  (地方治理)   │
                   └──────────────┘  └──────────────┘
```

## 角色映射表 / Role Mapping

| 历史角色 / Historical Role | Agent ID | AI 职责 / AI Responsibility | 推荐模型 / Model |
|---|---|---|---|
| 沙皇·专制君主 / Tsar — Autocrat | `tsar` | coordinator | opus |
| 贵族杜马 / Boyar Duma (Боярская дума) | `boyar-duma` | research | sonnet |
| 莫斯科牧首 / Patriarch of Moscow (Патриарх) | `patriarch` | review | haiku |
| 使节衙门 / Posolsky Prikaz (Посольский приказ) | `posolsky-prikaz` | management | sonnet |
| 军役登记衙门 / Razryadny Prikaz (Разрядный приказ) | `razryadny-prikaz` | engineering | sonnet |
| 大国库衙门 / Treasury (Приказ Большой казны) | `kazna-prikaz` | data | sonnet |
| 督军 / Voevoda (Воевода) | `voevoda` | devops | haiku |

## 决策流程 / Decision Flow

1. **tsar** 接到帝国急报或提出决断，以谕令（ukaz）形式颁布
2. **boyar-duma** 以"沙皇圣裁、波雅尔议定"形式合议，提供贵族意见（沙皇可采纳或忽略）
3. **posolsky-prikaz** 统筹对外交涉并协调诸衙门将谕令落为具体行政
4. **razryadny-prikaz** 调度军役贵族（служилые люди）与军事部署，**kazna-prikaz** 核算国库与征敛
5. **voevoda** 在各城与边区执行征发、税收与治安
6. 涉及信仰、伦理与王朝合法性时，**patriarch** 依正教传统提出意见（симфония，危机时可道义抗辩，如腓力普二世之于伊凡雷帝）
7. **tsar** 听取回禀，必要时再降谕令修正或加强

## 制度特点 / Characteristics

- **专制（Самодержавие）**：沙皇拥有不受限制的最高权力，贵族杜马仅具咨议性质，定式为"沙皇圣裁、波雅尔议定"
- **第三罗马与牧首制**：以拜占庭继承者自居，1589年设莫斯科牧首区，皇权与教权以"和谐"（симфония）共治而非教会自治
- **衙门（приказы）行政**：诸衙门按职能（外交、军役、财政、刑名）分理政务，权限交叠、因事而设，是莫斯科官僚制的骨架
- **门第制（местничество）**：贵族任职依门第资历排序，制约任能，至1682年方废
- **军役地与农奴**：以采邑（поместье）供养服役贵族；1649年《会议法典》正式确立农奴制，将农民束于土地
- **督军治地方**：边区与新拓土地由中央委派督军（воевода）统军政、征赋税

## Pattern 映射

> **Orchestration pattern**: `centralized`

## 历史参考 / Historical Sources

- 《1649年会议法典》（Соборное уложение 1649 г.）— 农奴制与社会等级的法律基石
- 瓦西里·克柳切夫斯基，《俄国历史教程》（В. О. Ключевский, *Курс русской истории*）
- Richard Pipes, *Russia Under the Old Regime* (1974) — 莫斯科专制的结构分析
- Robert O. Crummey, *The Formation of Muscovy 1304–1613* (1987)
- Nancy Shields Kollmann, *Kinship and Politics: The Making of the Muscovite Political System, 1345–1547* (1987) — 杜马与门第制
