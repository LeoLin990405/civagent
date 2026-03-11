# Mali Empire / 马里帝国
## Mansa System / 曼萨制 (1235-1600)

> *"Salt comes from the north, gold from the south, and silver from the country of the white men; but the word of God and the treasures of wisdom are only to be found in Timbuktu."* — Sudanese proverb

---

## 1. Historical Background / 历史背景

The Mali Empire (Manden Kurufaba) was one of the largest and wealthiest empires in African history, founded by Sundiata Keita after his victory at the Battle of Kirina in 1235. At its height under Mansa Musa (r. 1312-1337), it controlled an area roughly the size of Western Europe and commanded the trans-Saharan gold-salt trade.

马里帝国是非洲历史上最大和最富有的帝国之一，由松迪亚塔·凯塔在1235年基里纳战役胜利后建立。在曼萨穆萨统治时期达到鼎盛，控制面积约相当于西欧，掌控跨撒哈拉黄金-食盐贸易。

**Key features:**
- **Mansa Musa's pilgrimage** to Mecca in 1324 distributed so much gold that it depressed gold prices in Egypt for a decade, earning him the title of the richest person in history.
- The **Manden Charter** (Kouroukan Fouga), proclaimed at the founding assembly, is considered one of the earliest declarations of human rights, addressing slavery, women's rights, and environmental protection.
- **Timbuktu** became one of the world's great centers of Islamic learning, with the University of Sankore attracting scholars from across the Muslim world. Its libraries held hundreds of thousands of manuscripts.
- The **griot** (jeli) tradition served as a living archive — oral historians who memorized genealogies, laws, and precedents spanning generations.
- The **Dyula** merchant networks created a sophisticated trade infrastructure spanning thousands of miles across the Sahara.

**核心特征：**
- 曼萨穆萨1324年朝觐麦加，沿途散发的黄金导致埃及金价下跌十年，被誉为史上最富有的人。
- 曼登宪章被认为是最早的人权宣言之一，涉及奴隶制、妇女权利和环境保护。
- 廷巴克图成为世界伊斯兰学术中心，桑科尔大学吸引穆斯林世界各地学者。
- 格里奥口述传统作为活的档案，记忆跨越世代的谱系、法律和先例。

---

## 2. System Design / 制度设计

### Organizational Structure / 组织架构

```
                    ┌─────────────────────┐
                    │      MANSA          │
                    │   曼萨 (Supreme)     │
                    └────────┬────────────┘
                             │
         ┌───────────────────┼───────────────────┐
         │                   │                   │
    ┌────▼────┐       ┌─────▼─────┐       ┌─────▼──────┐
    │  GRIOT  │       │   HOJA    │       │ MANSA-JIGI │
    │ 格里奥   │       │   霍贾    │       │ 曼萨-吉吉   │
    │[Memory] │       │ [Ethics]  │       │ [Deputy]   │
    └─────────┘       └───────────┘       └─────┬──────┘
                                                │
                                    ┌───────────┼───────────┐
                                    │                       │
                               ┌────▼────┐            ┌────▼────┐
                               │  FARIN  │            │  DYULA  │
                               │  法林    │            │  迪乌拉  │
                               │[Governor│            │[Merchant│
                               └─────────┘            └─────────┘
```

### Agent Mapping / 代理映射

| Agent | Historical Role | AI Function | Recommended Model |
|-------|----------------|-------------|-------------------|
| **Mansa** | Mansa / 皇帝 | Supreme decision-maker, resource allocation, diplomacy | Claude Opus 4.6 |
| **Griot** | Griot / 格里奥 | Institutional memory, precedent lookup, advisory | GPT-5.4 |
| **Farin** | Farin / 省长 | Provincial execution, local administration, tax collection | GPT-5.3 Instant |
| **Dyula** | Dyula / 商人 | Trade operations, market intelligence, commercial networking | Kimi K2.5 |
| **Mansa-jigi** | Crown Prince / 太子 | Deputy coordination, inter-provincial management, regency | GPT-5.4 Pro |
| **Hoja** | Islamic Scholar / 霍贾 | Ethical review, legal interpretation, education oversight | DeepSeek R2 |

**Model Rationale / 模型选择理由：**
- The Mansa requires broad, wise judgment spanning all domains (Claude Opus 4.6).
- The Griot needs deep memory and contextual recall (GPT-5.4).
- The Farin handles high-volume administrative tasks efficiently (GPT-5.3 Instant).
- The Dyula requires fast commercial analysis and networking (Kimi K2.5).
- The Mansa-jigi needs strong executive reasoning for coordination (GPT-5.4 Pro).
- The Hoja requires meticulous ethical and legal reasoning (DeepSeek R2).

---

## 3. Orchestration Pattern / 编排模式

**Pattern: Centralized Hierarchy / 中央集权等级制**

The Mansa sits at the apex of a strict hierarchy. All major decisions flow through the emperor, but are informed by specialized advisors.

曼萨位于严格等级制度的顶端。所有重大决策都经由皇帝，但由专业顾问提供信息。

### Decision Pipeline
```
Griot (precedent) + Hoja (ethics) -> Mansa (decree)
                                        │
                                   Mansa-jigi (coordinate)
                                     │          │
                                  Farin       Dyula
                                (execute)   (trade)
```

### Key Mechanisms
1. **Mandatory counsel**: The Mansa must consult the Griot and Hoja before major decisions.
2. **Oral ledger**: The Griot records all decisions, creating an immutable institutional memory.
3. **Delegated authority**: The Mansa-jigi coordinates day-to-day operations across provinces.
4. **Revenue accountability**: Farins must account for all taxes collected.
5. **Trade intelligence**: Dyula merchants provide real-time market data to inform policy.
6. **Ethical guardrails**: The Hoja can raise ethical objections that the Mansa must address on record.

---

## 4. Comparison with Other Regimes / 与其他制度对比

| Dimension | Mali Empire | Song Dynasty | Ottoman Empire |
|-----------|------------|-------------|----------------|
| Head of State | Mansa (hereditary) | Emperor (hereditary) | Sultan (hereditary) |
| Advisory | Griot (oral tradition) | Confucian scholars | Divan (council) |
| Provinces | Farins (appointed) | Prefects (exam-based) | Pashas (appointed) |
| Trade | Dyula merchants | Maritime trade guilds | Guilds + state monopolies |
| Ethics | Hoja (Islamic + Charter) | Confucian censors | Ulema (Islamic scholars) |
| Memory System | Oral (griot) | Written (bureaucratic) | Written (bureaucratic) |
| Duration | ~365 years | ~320 years | ~624 years |

---

## 5. Use Cases / 应用场景

### 5.1 Knowledge Management System / 知识管理系统
- The Griot agent maintains organizational memory and retrieves precedent
- Ideal for organizations needing strong institutional memory
- Oral-to-text knowledge capture and retrieval

### 5.2 Trade Route Optimization / 贸易路线优化
- Dyula agents monitor multiple trade channels and report intelligence
- Farin agents manage regional operations and logistics
- Mansa coordinates resource allocation based on aggregated data

### 5.3 Ethical AI Governance / AI伦理治理
- The Hoja provides an ethics review layer for AI decisions
- The Manden Charter principles serve as constitutional constraints
- Every decision is logged by the Griot for accountability

### 5.4 Distributed Team Coordination / 分布式团队协调
- Mansa-jigi coordinates geographically distributed teams (Farins)
- Griot preserves institutional knowledge across team rotations
- Dyula agents handle external partnerships and procurement

### 5.5 Educational Platform / 教育平台
- Hoja manages curriculum and scholarly standards (Timbuktu model)
- Griot provides historical context and cultural education
- Mansa allocates educational resources across provinces

---

## 6. Dialogue Example / 对话示例

```
[Dyula]: Market intelligence report: Gold prices at the northern terminus
         have risen 15%. Salt supply from Taghaza is stable. A new
         competitor caravan from Songhai has been observed.
         市场情报报告：北部终点黄金价格上涨15%。塔加扎食盐供应稳定。
         发现来自桑海的新竞争商队。

[Griot]: The Mansa should note that in the time of Mansa Sakura, a similar
         competitive threat was addressed by offering preferential trade
         terms to loyal Dyula networks. The precedent suggests diplomacy
         over confrontation.
         曼萨请注意，在曼萨·萨库拉时期，类似的竞争威胁通过向忠诚的
         迪乌拉商网提供优惠贸易条件来应对。先例建议外交优于对抗。

[Hoja]: From the perspective of the Manden Charter, Article 16 states that
        trade competition should be met with fair dealing, not restriction.
        I advise open markets with strengthened quality standards.
        根据曼登宪章第16条，贸易竞争应以公平交易应对，而非限制。
        我建议开放市场，同时加强质量标准。

[Mansa]: I have heard the counsel of the Griot and the Hoja. I decree:
         1. Offer 10% tax reduction to established Dyula networks for
            the next quarter.
         2. Open negotiations with the Songhai caravan for mutual benefit.
         3. Increase quality inspections at the Niani trade post.
         已听取格里奥和霍贾的意见。我颁布法令：
         1. 对现有迪乌拉商网下季减税10%。
         2. 与桑海商队开启互利谈判。
         3. 增加尼亚尼贸易站质量检查。

[Mansa-jigi]: Decree received. Coordinating with the Farin of Niani province
              for quality inspection implementation. Dispatching diplomatic
              envoy to Songhai. Tax adjustment will take effect next market day.
              法令已收。正在与尼亚尼省法林协调质量检查实施。
              派遣外交使节前往桑海。税收调整将于下一个集市日生效。

[Farin]: Niani province acknowledges. Quality inspection team assembled.
         Revenue projection adjusted for the tax reduction: estimated 8%
         short-term revenue decrease, offset by projected 20% volume increase.
         尼亚尼省确认。质量检查团队已组建。税收减免后收入预测调整：
         短期收入预计下降8%，但预计交易量增长20%可抵消。

[Griot]: Decree ML-1324-089 recorded. Precedent filed under: Trade Competition
         Response — Diplomatic Approach. Cross-referenced with Mansa Sakura
         precedent ML-1298-043.
         法令 ML-1324-089 已记录。先例归档：贸易竞争回应——外交方式。
         交叉引用曼萨·萨库拉先例 ML-1298-043。
```

---

## 7. Academic References / 学术参考

1. **Levtzion, N.** (1973). *Ancient Ghana and Mali*. Methuen Publishing.
   - Foundational study of West African medieval empires.

2. **Niane, D.T.** (1965). *Sundiata: An Epic of Old Mali*. Longman.
   - The griot oral tradition translated; the founding epic of Mali.

3. **Austen, R.A.** (2010). *Trans-Saharan Africa in World History*. Oxford University Press.
   - Trade networks connecting Mali to the Mediterranean world.

4. **Conrad, D.C.** (2005). *Empires of Medieval West Africa: Ghana, Mali, and Songhay*. Facts on File.
   - Comparative study of West African state systems.

5. **Gomez, M.A.** (2018). *African Dominion: A New History of Empire in Early and Medieval West Africa*. Princeton University Press.
   - Reassessment of Mali's political and economic institutions.

6. **Hunwick, J.O.** (1999). *Timbuktu and the Songhay Empire*. Brill.
   - Timbuktu as intellectual center; manuscript traditions.

7. **Green, T.** (2019). *A Fistful of Shells: West Africa from the Rise of the Slave Trade to the Age of Revolution*. University of Chicago Press.
   - Economic systems and trade networks of West African empires.

8. **Jansen, J.** (2001). *Epopee, histoire, societe: Le cas de Soundjata*. Karthala.
   - The Manden Charter and its constitutional significance.

9. **de Villiers, M. & Hirtle, S.** (2007). *Timbuktu: The Sahara's Fabled City of Gold*. Walker & Company.
   - Timbuktu's role as a center of learning and trade.

10. **Ly-Tall, M.** (1984). *The Decline of the Mali Empire*. In UNESCO General History of Africa, Vol. IV.
    - Analysis of institutional factors in Mali's decline.

---

*From the banks of the Niger to the sands of the Sahara — where memory is law and generosity is power.*

*从尼日尔河畔到撒哈拉沙漠 —— 记忆即法律，慷慨即权力。*
