# 朝鲜王朝新儒学官僚制 — 组织架构

## 制度简介 (System Overview)
朝鲜王朝（1392-1897）建立了以新儒学为核心的官僚制度，强调权力的制衡与士大夫的道德谏议。通过科举选拔的两班阶层在议政府和六曹体系下运作，并受三司（司宪府、司谏院、弘文馆）的严厉监督，形成了独特且持久的文人政治。
The Joseon Dynasty (1392-1897) established a Neo-Confucian bureaucracy emphasizing power checks and moral remonstrance. The yangban class, selected via civil exams, operated within the State Council and Six Ministries, overseen by the Three Censors (Samsi).

## 组织架构图 (Organization Chart)
                ┌─────────┐
                │   国王   │
                │  (Wang)  │
                └────┬────┘
          ┌──────────┼──────────┐
          ▼          ▼          ▼
      [议政府]    [承政院]     [三司]
   (State Council) (Secretariat) (Censorate)
          │          │          │
    ┌─────┴──┐   ┌───┴───┐  ┌───┼───┐
    ▼        ▼   ▼       ▼  ▼   ▼   ▼
  [六曹]   [八道] 王命传达 记录 司宪 司谏 弘文
(Six Min.) (Prov.)          府   院   馆

## 角色映射表 (Role Mapping Table)
| 历史角色 | Agent ID | AI 职责 | 推荐模型 |
|---|---|---|---|
| 国王 (Wang) | king | coordinator | sonnet |
| 领议政 (Yeonguijeong) | chief-councillor | management | sonnet |
| 司宪府大司宪 (Saheonbu) | inspector-general | review | opus |
| 司谏院大司谏 (Saganwon) | remonstrator | review | opus |
| 弘文馆 (Hongmungwan) | academic-researcher | research | sonnet |
| 承政院都承旨 (Seungjeongwon) | royal-secretary | data | haiku |
| 六曹尚书 (Yukjo) | ministry-executor | engineering | sonnet |

## 决策流程 (Decision Flow)
1. **academic-researcher** 基于《经国大典》和儒家经典提供政策背景分析。
2. **chief-councillor** 在议政府会议中汇总各部意见并提交方案。
3. **king** 审阅方案并下达初步裁决。
4. **remonstrator** 对裁决进行道德审查，行使封驳权要求重议。
5. **royal-secretary** 负责正式王命的起草、记录与下达。
6. **ministry-executor** 按职能（吏户礼兵刑工）具体执行任务。
7. **inspector-general** 对执行过程和官员行为进行审计与弹劾监察。

## 制度特点 (Characteristics)
- **三司言谏 (The Censorate)**：司宪府、司谏院、弘文馆构成强大的监察系统，可纠弹百官甚至谏诤王室行为。
- **经筵制度 (Royal Lecture)**：通过国王与士大夫的学术研讨，确立儒家道统对政权治理的指导地位。
- **文官优位 (Civilian Supremacy)**：强调以经学入仕的两班文人治理，行政与监察系统严格节制武官权力。
- **法典治国 (Rule of Code)**：以《经国大典》为根本法，确保政令的连续性与行政过程的可预见性。

## Pattern 映射
> **Orchestration pattern**: `checks-and-balances`

## 历史参考 (Historical Sources)
- 《经国大典》(Gyeongguk Daejeon, 1485)
- 《朝鲜王朝实录》(Veritable Records of the Joseon Dynasty)
- 郑道传《朝鲜经国典》(Joseon Gyeonggukjeon)
- 钱穆《中国历代政治得失》（比较视野）
