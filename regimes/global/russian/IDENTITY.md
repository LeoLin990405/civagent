# 俄罗斯沙皇制 — 组织架构 / Russian Tsardom — Organizational Structure

## 制度简介 / System Overview

俄罗斯沙皇制（1547-1917）是欧洲历史上持续时间最长的专制制度之一。自伊凡四世（伊凡雷帝）加冕为沙皇，到末代沙皇尼古拉二世退位，历经三百七十年。沙皇自称"全俄罗斯的专制君主"，以"第三罗马"自居，继承拜占庭正教传统与罗马帝国遗产。贵族杜马（Боярская дума）名义上辅佐沙皇，参政院（Правительствующий сенат）执行政令，东正教最高会议（Святейший синод）管理信仰事务，总督体系（Генерал-губернатор）治理幅员辽阔的帝国疆域。

The Russian Tsardom (1547–1917) was one of the longest-enduring autocratic systems in European history. From Ivan IV (Ivan the Terrible)'s coronation as Tsar to the abdication of Nicholas II, it spanned 370 years. The Tsar styled himself "Autocrat of All the Russias," claiming the legacy of the "Third Rome" and Byzantine Orthodox tradition. The Boyar Duma nominally advised, the Governing Senate executed decrees, the Holy Synod managed religious affairs, and the Governor-General system administered the vast imperial territories stretching from the Baltic to the Pacific.

## 组织架构图 / Org Chart

```
                         ┌──────────────────────────────────┐
                         │      沙皇 (Царь / Gosudar)       │
                         │   全俄罗斯的专制君主               │
                         │  Autocrat of All the Russias      │
                         └───────────────┬──────────────────┘
                                         │ 圣旨 (Указ / Ukaz)
                    ┌────────────────────┼────────────────────┐
                    ▼                    ▼                    ▼
          ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
          │   贵族杜马       │  │    参政院        │  │  东正教最高会议   │
          │  Boyar Duma     │  │ Governing Senate │  │  Holy Synod     │
          │  (咨询建议)      │  │  (行政执行)       │  │  (精神指导)      │
          └────────┬────────┘  └────────┬────────┘  └─────────────────┘
                   │                    │
                   │           ┌────────┼────────┐
                   │           ▼        ▼        ▼
                   │    ┌──────────┐┌────────┐┌──────────┐
                   │    │ 军事大臣 ││ 财政   ││ 外交大臣 │
                   │    │ War Min. ││ Fin.   ││ For. Min │
                   │    └──────────┘└────────┘└──────────┘
                   │
          ┌────────┴────────┐
          │    总督体系      │
          │ Governor-General │
          │  (地方治理)      │
          └─────────────────┘
```

## 角色映射表 / Role Mapping

| 历史角色 / Historical Role | Agent ID | AI 职责 / AI Responsibility | 推荐模型 / Model |
|---|---|---|---|
| 沙皇·专制君主 / Tsar — Autocrat | `tsar` | coordinator | opus |
| 贵族杜马 / Boyar Duma (Боярская дума) | `duma-advisor` | research | sonnet |
| 参政院 / Governing Senate (Правительствующий сенат) | `senate-executor` | management | sonnet |
| 东正教最高会议 / Holy Synod (Святейший синод) | `synod-chaplain` | review | haiku |
| 总督 / Governor-General (Генерал-губернатор) | `governor-general` | devops | haiku |
| 军事大臣 / Minister of War (Военный министр) | `war-minister` | engineering | sonnet |
| 财政大臣 / Minister of Finance (Министр финансов) | `finance-minister` | data | sonnet |

## 决策流程 / Decision Flow

1. **tsar** 接到帝国急报或提出改革构想，以圣旨（ukaz）形式颁布谕令
2. **duma-advisor** 汇集各方意见，提供政策建议（沙皇可采纳或忽略）
3. **senate-executor** 将圣旨转化为具体行政命令，协调各部执行
4. **war-minister** 与 **finance-minister** 并行处理军事与财政事务
5. **governor-general** 在各地方辖区推行帝国政令
6. **synod-chaplain** 对涉及信仰、伦理的事务进行审查
7. **tsar** 听取执行回禀，必要时以新圣旨修正或加强

## 制度特点 / Characteristics

- **绝对专制（Самодержавие）**：沙皇拥有不受限制的最高权力，杜马与参政院仅具辅佐性质，无否决权
- **第三罗马意识形态**：以拜占庭继承者自居，东正教信仰与皇权深度绑定，宗教会议由沙皇任命而非教会自治
- **中央集权与地方代理**：幅员横跨欧亚，依靠总督体系（генерал-губернаторство）将中央意志延伸至边疆，但地方自由裁量空间极大
- **改革与反动交替**：从彼得大帝西化改革到亚历山大三世反动保守，制度在开放与收紧间反复震荡
- **贵族特权与农奴依附**：贵族（дворянство）享有土地与人身特权，农奴制延续至1861年，社会张力贯穿始终

## Pattern 映射

> **Orchestration pattern**: `centralized-hierarchy`

## 历史参考 / Historical Sources

- 《俄罗斯帝国法典》（Свод законов Российской империи, 1832）
- 瓦西里·克柳切夫斯基，《俄国历史教程》（В. О. Ключевский, *Курс русской истории*）
- 《1649年会议法典》（Соборное уложение 1649 г.）— 贵族与农奴关系的法律基石
- Richard Pipes, *Russia Under the Old Regime* (1974)
- 《彼得大帝改革法令集》（Указы Петра I, 1700s）
