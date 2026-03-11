# Roman Republic / 罗马共和国 — Organizational Structure / 组织架构

## System Overview / 制度简介

The Roman Republic (509-27 BC) was one of antiquity's most sophisticated systems of governance. After overthrowing
the last king (Tarquinius Superbus), the Romans developed a constitutional system built on the principle that
power must never be concentrated in a single person. Two Consuls shared executive power, each able to veto the
other. The Senate — a body of experienced former magistrates — provided strategic counsel. Tribunes of the Plebs
wielded sacrosanct veto power to protect the common people.

**Core Characteristics:** Dual executive (collegiality), senatorial advice, tribunician veto, annual magistracies,
cursus honorum (career ladder), and a deep cultural commitment to civic virtue (virtus, dignitas, pietas, fides).

## Org Chart / 组织架构图

```
                    ┌─────────────────────┐
                    │     User (You)      │
                    │  Populus Romanus     │
                    └──────────┬──────────┘
                               │ Mandate
              ┌────────────────┼────────────────┐
              ▼                ▼                ▼
       ┌────────────┐  ┌────────────┐  ┌────────────┐
       │ Consul A   │  │ Consul B   │  │  Tribune   │
       │  (main)    │◄─┤  Co-Equal  │  │  Veto Power│
       │ Executive  │  │ Executive  │  │  People's  │
       └─────┬──────┘  └────────────┘  └────────────┘
             │
    ┌────────┼────────────────────┐
    ▼        ▼                    ▼
┌────────┐┌────────┐        ┌────────┐
│ Senate ││ Censor │        │Praetor │
│Advisory││Quality │        │Justice │
└────────┘└────────┘        └────────┘
                    ┌────────┬────────┐
                    ▼        ▼        ▼
              ┌────────┐┌────────┐
              │Quaestor││ Aedile │
              │Treasury││ Infra  │
              └────────┘└────────┘
```

## Role Mapping / 角色映射表

| Historical Role | Agent ID | AI Responsibility | Recommended Model |
|---|---|---|---|
| Consul A / 执政官A | `consul_a` | Co-Executive: leads operations, shares power with Consul B | Strong Model |
| Consul B / 执政官B | `consul_b` | Co-Executive: checks Consul A, provides alternative perspective | Strong Model |
| Senate / 元老院 | `senate` | Advisory Council: strategic guidance, collective wisdom, policy review | Strong Model |
| Tribune / 护民官 | `tribune` | People's Voice: veto power, user advocacy, accessibility champion | Strong Model |
| Praetor / 裁判官 | `praetor` | Chief Justice: legal compliance, dispute resolution, interpretation | Fast Model |
| Censor / 监察官 | `censor` | Standards Guardian: code quality review, best practices, audits | Strong Model |
| Quaestor / 财务官 | `quaestor` | Treasurer: resource management, cost tracking, budget analysis | Fast Model |
| Aedile / 营造官 | `aedile` | Infrastructure: build systems, CI/CD, maintenance, operations | Fast Model |

## Workflow / 协作流程

```
User mandates → Consul A proposes → Consul B concurs or vetoes
             → Senate advises on strategy
             → Tribune may veto if harmful to users
             → Praetor ensures legality
Agents execute → Censor reviews quality → Consuls report to User
```

1. **User Mandate** — The user issues a request to the Consuls
2. **Consular Deliberation** — Consul A proposes a plan; Consul B must concur or invoke intercessio
3. **Senate Consultation** — For strategic matters, the Senate is consulted for its collective wisdom
4. **Tribune Review** — The Tribune may veto any action deemed harmful to end users or the common good
5. **Task Assignment** — Work is assigned to the appropriate magistrates (Praetor, Quaestor, Aedile)
6. **Censor Audit** — The Censor reviews work product for quality and adherence to standards
7. **Consular Report** — Both Consuls present the consolidated result to the user
