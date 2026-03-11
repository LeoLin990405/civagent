# Ottoman Empire / 奥斯曼帝国 — 组织架构 / Organizational Structure

## 制度简介 / System Overview

The Ottoman Empire (1299-1922) was one of history's longest-lived empires, governing a vast multi-ethnic, multi-religious domain from southeastern Europe to North Africa and the Middle East. The Sultan held absolute power, exercised through the Divan-i Humayun (Imperial Council) led by the Grand Vizier. The devshirme system — recruiting Christian boys to become administrators and Janissary soldiers — created a unique meritocratic elite loyal to the throne rather than to hereditary aristocracy. The millet system granted religious minorities substantial self-governance in civil and religious matters.

奥斯曼帝国（1299-1922年）是历史上最长寿的帝国之一，统治着从东南欧到北非和中东的广大多民族、多宗教领域。苏丹拥有绝对权力，通过大维齐尔领导的御前会议（Divan-i Humayun）行使。德夫希尔梅制度——从基督教臣民中征募少年培养为行政官员和近卫军——创造了忠于王座而非世袭贵族的独特精英阶层。米勒特制度赋予宗教少数群体在民事和宗教事务上的广泛自治。

## 组织架构图 / Org Chart

```
                    ┌───────────────┐
                    │    Sultan     │
                    │  苏丹 (sultan) │
                    └───────┬───────┘
                            │
                ┌───────────┼──────────────┐
                ▼           │              ▼
        ┌──────────────┐    │      ┌──────────────┐
        │ Grand Vizier │    │      │Janissary Aga │
        │ 大维齐尔       │    │      │ 近卫军统领     │
        └──────┬───────┘    │      └──────────────┘
               │            │         (direct to Sultan)
    ┌──────┬───┴───┬────────┘
    ▼      ▼       ▼        ▼
┌────────┐┌──────┐┌───────┐┌────────────┐
│Kazasker││Defter││Nisanci││Kapudan     │
│军事法官 ││dar   ││大法官  ││Pasha       │
│        ││财务总管││      ││海军司令      │
└────────┘└──────┘└───────┘└────────────┘
```

## 角色映射表 / Role Mapping

| 古代角色 / Historical Role | Agent ID | AI 职责 / AI Responsibility | 推荐模型 / Model |
|---|---|---|---|
| Sultan / 苏丹 | sultan | Supreme authority, final decisions / 最高权力，最终决策 | Claude / GPT-4 |
| Grand Vizier / 大维齐尔 | grand_vizier | Executive coordination, Divan chair / 行政协调，迪万主席 | Claude / GPT-4 |
| Kazasker / 军事法官 | kazasker | Legal compliance, judicial review / 法律合规，司法审查 | GPT-4 / DeepSeek |
| Defterdar / 财务总管 | defterdar | Financial management, budget / 财务管理，预算 | GPT-4 / Qwen |
| Nisanci / 大法官 | nisanci | Document authentication, records / 文件认证，档案 | GPT-4 / Qwen |
| Kapudan Pasha / 海军司令 | kapudan | Naval operations, maritime tech / 海军行动，海事技术 | GPT-4 / DeepSeek |
| Janissary Aga / 近卫军统领 | janissary | Security, elite operations / 安全，精锐行动 | Claude / GPT-4 |

## 协作流程 / Workflow

1. **Sultan's Will** — The Sultan expresses a directive or the Grand Vizier identifies a matter requiring attention.
2. **Divan Deliberation** — The Grand Vizier convenes the Divan. The Kazasker advises on legal aspects, the Defterdar on financial feasibility, the Nisanci on proper form.
3. **Sultan's Decision** — In the classical period, the Sultan observes Divan proceedings from behind a latticed window. He approves, modifies, or rejects.
4. **Tughra Authentication** — The Nisanci applies the Sultan's tughra to official documents, making them legally binding.
5. **Execution** — The Grand Vizier distributes orders. Naval matters go to the Kapudan Pasha. Security matters go to the Janissary Aga.
6. **Financial Clearance** — The Defterdar ensures funding and records expenditures.
7. **Legal Oversight** — The Kazasker monitors compliance with Sharia and kanun throughout execution.
