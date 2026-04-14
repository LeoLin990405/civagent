# 拿破仑帝国 — 功绩制中央集权

## 制度简介
拿破仑帝国（1804–1815）将法国大革命的平等理念以高度集权的方式制度化。《拿破仑法典》统一全境法律，省长（préfet）制度取代地方自治实现垂直管控，"才能向所有人开放"的功绩原则取代旧贵族特权，国务院（Conseil d'État）为立法提供专业咨议。这套体系深刻影响了此后两百年的现代国家建设。

Napoleon institutionalized Revolutionary ideals through extreme centralization: the Code Napoléon unified law across the empire, the prefect system replaced local autonomy with vertical control, meritocracy ("la carrière ouverte aux talents") supplanted aristocratic birthright, and the Conseil d'État provided expert legislative counsel. This model shaped modern state-building for two centuries.

## 组织架构图
```
                    ┌───────────────────────────┐
                    │    Emperor Napoleon        │
                    │    拿破仑·波拿巴 皇帝      │
                    │    最高决策权               │
                    └─────────────┬─────────────┘
                                  │
            ┌─────────────────────┼─────────────────────┐
            │                     │                     │
  ┌─────────▼──────────┐  ┌──────▼───────┐  ┌─────────▼──────────┐
  │  Conseil d'État    │  │  Ministres   │  │  Maréchaux         │
  │  国务院             │  │  各部大臣     │  │  元帅团             │
  │  立法咨议 / 法律审查 │  │  政策执行    │  │  前线指挥           │
  └────────────────────┘  └──────┬───────┘  └────────────────────┘
                                 │
        ┌────────────┬───────────┼───────────┬────────────┐
        ▼            ▼           ▼           ▼            ▼
  [Guerre / 陆军] [Intérieur / 内政] [Finances / 财政] [Justice / 司法] [Police / 警务]
                                       │
                              ┌────────▼────────┐
                              │  Préfets / 省长  │
                              │  130 省 直管     │
                              └─────────────────┘
```

## 角色映射表
| 历史角色 | Agent ID | AI 职责 | 推荐模型 |
|---|---|---|---|
| 皇帝 | emperor | coordinator | opus |
| 国务院参事 | conseil-detat | review | opus |
| 陆军大臣 | guerre-minister | devops | sonnet |
| 内政大臣 | interieur-minister | management | sonnet |
| 财政大臣 | finances-minister | data | sonnet |
| 省长 | prefet | engineering | haiku |
| 元帅 | marechal | engineering | sonnet |
| 警务大臣 | police-minister | research | sonnet |

## 决策流程
1. **emperor** 确立战略意图（军事、立法或经济政策）
2. **conseil-detat** 起草法令草案并进行法律审查
3. **emperor** 批准后分发至相关大臣
4. **interieur-minister** 通过省长体系向下传达执行指令
5. **prefet** 在各自省份落地实施，向内政大臣汇报
6. **finances-minister** 与 **police-minister** 分别监控财政合规与社会秩序
7. **marechal** 在军事事务中独立执行前线战术

## 制度特点
- **中央垂直管控**：省长由皇帝直接任命，绕过地方精英，实现"一竿子插到底"
- **法典统一**：民法、商法、刑法三法典取代旧制度下的地方习惯法拼凑
- **功绩优先**：公开考试与军功晋升取代门第出身，向所有阶层开放
- **立法专业化**：国务院以法学家为主体，立法过程从政治博弈转为技术审议
- **警察国家雏形**：富歇主导的秘密警察体系监控舆论与异见

## Pattern 映射
> **Orchestration pattern**: `centralized`

## 历史参考
- 《拿破仑法典》（Code civil des Français, 1804）
- Thierry Lentz, *Napoléon et la conquête de l'Europe, 1804–1810*, Paris: Fayard, 2002
- Jean Tulard, *Napoléon: ou, Le mythe du sauveur*, Paris: Fayard, 1987
- 《国务法院组织法令》（Loi du 28 pluviôse an VIII / 1800）
- Georges Lefebvre, *Napoléon*, Paris: PUF, 1965
