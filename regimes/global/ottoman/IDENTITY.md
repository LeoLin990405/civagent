# 奥斯曼帝国苏丹-迪万制 — 组织架构 / Ottoman Sultan-Divan System — Organization

## 制度简介 / System Overview

奥斯曼帝国（1299-1922年）横跨欧亚非三洲，延续逾六世纪，是伊斯兰世界最持久的帝国。苏丹以"安拉世间之影"之名行使绝对权力，通过大维齐尔（Grand Vizier）主持的御前会议（Divan-i Hümayun）治理国政。司法与教法事务由两位军事大法官（Kazasker）执掌；枢密掌玺大臣（Nişancı）主管文书、起草敕令并守护卡农法（kanun）；而立于迪万之外的伊斯兰长老（Şeyhülislam）则以教法裁决（fetva）为重大决策赋予或撤销合法性。德夫希尔梅制度从基督教臣民中征募少年，培养为忠于苏丹的行政精英与近卫军。米勒特制度允许各宗教社群在民事与宗教事务上高度自治。

The Ottoman Empire (1299-1922) spanned three continents for over six centuries, the most enduring empire in the Islamic world. The Sultan exercised absolute authority as the "Shadow of God on Earth," governing through the Imperial Council (Divan-i Hümayun) chaired by the Grand Vizier. Judicial and religious-legal affairs were held by the two chief military judges (Kazasker); the chancellor and keeper of the seal (Nişancı) ran the chancery, drafted edicts and guarded the kanun; while the Şeyhülislam, head of the learned hierarchy standing outside the Divan, lent or withdrew legitimacy on major decisions through the fetva. The devshirme system recruited Christian boys into a loyal non-hereditary elite of administrators and Janissaries. The millet system granted religious communities broad self-governance.

## 组织架构图 / Organization Chart

```
                          ┌─────────────┐  fetva   ┌────────────────────┐
                          │   Sultan    │◄────────►│ Şeyhülislam         │
                          │   苏 丹     │  教法裁决  │ 伊斯兰长老 (教法权威) │
                          └──────┬──────┘          └────────────────────┘
                                 │                  (ulema, outside the Divan)
                  ┌──────────────┴────────────┐
                  ▼                           ▼
          ┌──────────────┐           ┌───────────────┐
          │ Grand Vizier │           │ Janissary Aga │
          │  大维齐尔     │           │  近卫军统领     │
          └──────┬───────┘           └───────────────┘
                 │ presides over Divan (direct to Sultan)
        ┌────────┼─────────┬────────────────┐
        ▼        ▼         ▼                ▼
  ┌──────────┐┌────────┐┌──────────────┐┌──────────────┐
  │ Kazasker ││Defter- ││  Nişancı     ││ Kapudan Pasha│
  │ 军事大法官 ││  dar   ││ 枢密掌玺大臣   ││  海军司令     │
  │(chief    ││财务总管 ││(chancellor,  ││              │
  │ judge)   ││        ││ kanun & tuğra)││              │
  └──────────┘└────────┘└──────────────┘└──────────────┘
```

## 角色映射表 / Role Mapping Table

| 历史角色 / Historical Role | Agent ID | AI 职责 / AI Responsibility | 推荐模型 / Model |
|---|---|---|---|
| Sultan / 苏丹 | sultan | coordinator | opus |
| Grand Vizier / 大维齐尔 | grand-vizier | management | opus |
| Şeyhülislam / 伊斯兰长老（教法权威） | seyhulislam | review | opus |
| Kazasker / 军事大法官 | kazasker | legal | sonnet |
| Defterdar / 财务总管 | defterdar | data | sonnet |
| Nişancı / 枢密掌玺大臣 | nisanci | content | opus |
| Kapudan Pasha / 海军司令 | kapudan-pasha | devops | sonnet |
| Janissary Aga / 近卫军统领 | janissary-aga | engineering | haiku |

## 决策流程 / Decision Flow

1. **sultan** 发布敕令（ferman），或 **grand-vizier** 在御前会议（Divan）中提出议题
2. **grand-vizier** 主持迪万会议，召集各部门审议
3. **kazasker** 依沙里亚法（şeriat）审查司法与教法争讼；**nisanci** 核对议案是否符合卡农法（kanun）并准备文书
4. 涉及宣战、镇压叛乱或废黜等重大事项时，**grand-vizier** 请 **seyhulislam** 出具教法裁决（fetva）以赋予合法性；危机中 fetva 亦可撤销合法性（可触发 [VETO]）
5. **defterdar** 评估财政可行性并编制预算
6. **nisanci** 以苏丹花押（tuğra）认证最终文件，使敕令正式生效
7. **grand-vizier** 下达执行指令，**kapudan-pasha** 处理海上事务，**janissary-aga** 负责安全与军事行动（直属苏丹）
8. **defterdar** 记录支出并回报执行结果

## 制度特点 / Characteristics

- **德夫希尔梅精英制**：从基督教臣民中征募少年，经严格训练后成为忠于苏丹的行政官和近卫军，打破世袭垄断，形成非血统精英阶层
- **米勒特自治制**：东正教、亚美尼亚、犹太等宗教社群在民事与宗教事务上享有高度自治，以宗教身份而非民族身份组织社会
- **司法与文书分立**：司法归两位军事大法官（Kazasker，掌帝国教法-司法并任免全境卡迪与教授）；枢密掌玺大臣（Nişancı）则是文书与卡农法的编纂、守护者（有"卡农之穆夫提"之称）并以苏丹花押认证敕令——二者职能不可混同
- **教法合法化通道（ulema）**：伊斯兰长老（Şeyhülislam）居学者等级（ilmiye）之首，立于迪万之外，通过 fetva 为政策（尤其宣战与废黜苏丹）赋予或撤销合法性；但苏丹可任免、流放甚至处死之，故其多为合法化机制而非常设行政否决权
- **军事-行政双轨**：近卫军统领直属苏丹、独立于大维齐尔体系（其迪万席位视是否具维齐尔衔而定），形成军事力量对行政体系的制衡
- **御前会议决策**：大维齐尔主持的迪万并非橡皮图章，各专职官员有实质审议权，苏丹通过格栅窗幕后观察

## Pattern 映射

> **Orchestration pattern**: `centralized`

## 历史参考 / Historical Sources

- İnalcık, Halil. *The Ottoman Empire: The Classical Age, 1300-1600*. London: Weidenfeld & Nicolson, 1973.（迪万构成、Nişancı 与卡农、kanun-şeriat 二元）
- Imber, Colin. *The Ottoman Empire, 1300-1650: The Structure of Power*. Basingstoke: Palgrave Macmillan, 2002.（迪万成员、Şeyhülislam 居迪万之外、fetva 的作用与限度）
- Imber, Colin. *Ebu's-su'ud: The Islamic Legal Tradition*. Edinburgh University Press, 1997.（卡农与沙里亚的调和、教法裁决合法化政策）
- Findley, Carter V. *Ottoman Civil Officialdom: A Social History*. Princeton University Press, 1989.（枢密/文书体系与官僚机构）
- İpşirli, Mehmet. "Divan-i Hümayun." *Encyclopedia of Islam*, 2nd ed.
