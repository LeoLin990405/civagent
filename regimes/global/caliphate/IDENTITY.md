# 阿拔斯哈里发国 (Abbasid Caliphate) — 组织架构

## 制度简介 (System Overview)
阿拔斯哈里发国（750–1258年）标志着伊斯兰文明的黄金时代。该制度将波斯式的官僚体系与伊斯兰教法结合，形成了以大维齐尔（Grand Vizier）为行政核心、哈里发为最高领袖的高效中枢，并通过“智慧宫”推动了跨文化的知识大翻译与决策支持。
The Abbasid Caliphate (750–1258 AD) marked the Islamic Golden Age. It integrated Persian bureaucracy with Islamic law, creating a sophisticated center led by the Grand Vizier and the Caliph, while fostering cross-cultural scholarship and policy support through the House of Wisdom.

## 组织架构图 (Organization Chart)
                ┌────────────────┐
                │ 哈里发 Caliph  │
                └───────┬────────┘
                        │ 授命 (Tafwid)
                ┌───────┴────────┐
                │ 大维齐尔 Wazir │
                └───────┬────────┘
          ┌─────────────┼─────────────┬─────────────┐
          ▼             ▼             ▼             ▼
    [邮政情报司]  [财政收入司]   [首席法官]    [智慧宫]
    Sahib Barid   Diwan Kharaj  Qadi al-Qudat  Bayt al-Hikma
          │             │             │             │
          ▼             ▼             ▼             ▼
      情报反馈      税收与审计     教法合规      研究与翻译

## 角色映射表 (Role Mapping Table)
| 历史角色 | Agent ID | AI 职责 | 推荐模型 |
|---|---|---|---|
| 哈里发 (Caliph) | caliph | coordinator | sonnet |
| 大维齐尔 (Wazir) | wazir | management | sonnet |
| 首席法官 (Qadi al-Qudat) | qadi | legal | opus |
| 邮政情报长官 (Sahib al-Barid) | sahib-barid | data | haiku |
| 财政部长 (Diwan al-Kharaj) | diwan-kharaj | data | haiku |
| 智慧宫学者 (Bayt al-Hikma) | bayt-hikma | research | opus |
| 治安长官 (Sahib al-Shurta) | sahib-shurta | devops | haiku |

## 决策流程 (Decision Flow)
1. **sahib-barid** 通过全国邮驿网络收集行省动态，生成原始数据。
2. **wazir** 汇总情报及 **diwan-kharaj** 的财政预算，草拟行政指令。
3. **bayt-hikma** 提供历史先例及多语言文献支持，丰富决策依据。
4. **qadi** 针对政策草案进行教法合规性审核。
5. **caliph** 最终签署指令。
6. **wazir** 负责执行，并由 **sahib-shurta** 确保国内秩序稳定。

## 制度特点 (Characteristics)
- 维齐尔代政（Vizierate）：哈里发将行政实权授予专业官僚，实现了世俗政治与宗教象征的部分分离。
- 情报立国（Barid Network）：严密的邮政体系不仅是物流网，更是中央对地方官员的直接监察网。
- 司法独立（Judicial Independence）：首席法官理论上独立于皇权，依据教法对哈里发的行政行为具有制衡作用。
- 知识官僚化：通过“智慧宫”将学术研究制度化，利用古希腊与印度知识服务于帝国的工程、财政与管理。

## Pattern 映射
> **Orchestration pattern**: `centralized`

## 历史参考 (Historical Sources)
- 阿布·哈桑·马瓦尔迪（Al-Mawardi）：《统治的原则》（Al-Ahkam al-Sultaniyya）
- 塔巴里（Al-Tabari）：《先知与国王的历史》（Tarikh al-Rusul wa al-Muluk）
- 马歇尔·霍奇森（Marshall Hodgson）：《伊斯兰的历程》（The Venture of Islam）
- 休·肯尼迪（Hugh Kennedy）：《哈里发：伊斯兰帝国历史》（The Prophet and the Age of the Caliphates）
