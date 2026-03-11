# Roman Empire / 罗马帝国 — Organizational Structure / 组织架构

## System Overview / 制度简介

The Roman Empire (27 BC - 476 AD) was established when Augustus transformed the Republic into a centralized
imperial state while maintaining the facade of republican institutions. The Emperor (Imperator/Augustus/Caesar)
held supreme authority over military, legislative, and judicial affairs. Below him, a professional bureaucracy
managed the vast empire spanning from Britain to Mesopotamia.

During the later Empire (Dominate period), the administration was reorganized into a sophisticated hierarchy:
the Praetorian Prefect became chief minister, the Master of Offices controlled communications and intelligence,
and specialized financial and legal officers managed their domains with professional efficiency.

**Core Characteristics:** Absolute imperial authority, professional civil service, standardized legal system
(Roman Law), infrastructure excellence (roads, aqueducts), and the Pax Romana — two centuries of relative
peace and prosperity.

## Org Chart / 组织架构图

```
                    ┌─────────────────────┐
                    │   Imperator (You)   │
                    │  Augustus · Caesar  │
                    │  Supreme Authority  │
                    └──────────┬──────────┘
                               │ Imperial Edict
              ┌────────────────┼────────────────┐
              ▼                ▼                ▼
       ┌────────────┐  ┌────────────┐  ┌────────────┐
       │ Praetorian │  │  Magister  │  │  Magister  │
       │  Prefect   │  │  Militum   │  │ Officiorum │
       │  (main)    │  │  Military  │  │   Comms    │
       │ Chief Min. │  │  Security  │  │  Routing   │
       └─────┬──────┘  └────────────┘  └────────────┘
             │
    ┌────────┼────────┬────────┐
    ▼        ▼        ▼        ▼
┌────────┐┌────────┐┌────────┐
│ Urban  ││ Comes  ││Quaestor│
│Prefect ││Largesse││ Sacri  │
│City Adm││Treasury││ Legal  │
└────────┘└────────┘└────────┘
```

## Role Mapping / 角色映射表

| Historical Role | Agent ID | AI Responsibility | Recommended Model |
|---|---|---|---|
| Imperator / 皇帝 | `imperator` | Emperor: supreme authority, final decisions, strategic vision | Strong Model |
| Praetorian Prefect / 近卫军长官 | `praetorian` | Chief Minister: daily operations, coordination, executive management | Strong Model |
| Prefect of the City / 城市行政长官 | `urban_prefect` | City Admin: local operations, public services, day-to-day management | Fast Model |
| Master of Offices / 行政总管 | `magister` | Communications: message routing, scheduling, inter-office coordination | Strong Model |
| Count of Sacred Largesse / 财务大臣 | `comes` | Treasury: budgets, resource allocation, financial reporting | Fast Model |
| Quaestor Sacri Palatii / 法务官 | `quaestor` | Legal: legislation drafting, compliance, regulatory affairs | Strong Model |
| Magister Militum / 军事长官 | `magister_militum` | Military: security, architecture, performance, threat assessment | Strong Model |

## Workflow / 协作流程

```
Emperor decrees → Praetorian Prefect receives → Dispatches to offices
              → Master of Offices routes communications
              → Quaestor reviews for legal compliance
Offices execute → Report to Praetorian Prefect → Prefect consolidates for Emperor
```

1. **Imperial Edict** — The user (Emperor) issues a decree
2. **Praetorian Coordination** — The Praetorian Prefect analyzes and assigns to the appropriate offices
3. **Master Routes** — The Master of Offices ensures communications flow properly between offices
4. **Offices Execute** — Each office works within its defined jurisdiction
5. **Legal Review** — The Quaestor reviews actions for legal compliance
6. **Prefect Reports** — The Praetorian Prefect consolidates results and reports to the Emperor
