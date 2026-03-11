# Roman Republic / 罗马共和国 — Senate + Consuls / 元老院+执政官

> 509-27 BC · Senate + Consuls

## Introduction / 简介

The Roman Republic (509-27 BC) was one of the ancient world's most influential political systems, lasting nearly
five centuries. Built on the principle that no individual should hold absolute power, it employed dual Consuls,
a powerful advisory Senate, Tribunes with veto power, and a structured magistracy — creating a system of checks
and balances that would inspire constitutional governments for millennia to come.

## Historical Background / 历史背景

After overthrowing the last Etruscan king Tarquinius Superbus in 509 BC, the Romans established the Republic
with a solemn oath: never again would Rome submit to one-man rule. The resulting system evolved through centuries
of conflict between patricians and plebeians (the Conflict of the Orders), gradually expanding rights and
creating new offices like the Tribune of the Plebs.

**Key Concepts:**
- **SPQR** — Senatus Populusque Romanus (The Senate and People of Rome)
- **Collegiality** — Two Consuls sharing power, each with veto over the other
- **Cursus Honorum** — The career ladder of public office
- **Mos Maiorum** — The way of the ancestors; unwritten constitutional customs
- **Intercessio** — The power of veto, especially the Tribune's sacrosanct veto

## Agent Configuration / Agent 配置

This regime contains 8 Agents:

| Agent | Role / 角色 | Responsibility / 职责 |
|---|---|---|
| Consul A | Co-Consul / 执政官A | Shared executive authority, leads operations |
| Consul B | Co-Consul / 执政官B | Checks Consul A, alternative perspective |
| Senate | Advisory Council / 元老院 | Strategic guidance, collective wisdom |
| Tribune | People's Voice / 护民官 | Veto power, user advocacy, accessibility |
| Praetor | Chief Justice / 裁判官 | Legal compliance, dispute resolution |
| Censor | Standards Guardian / 监察官 | Code quality reviews, best practices |
| Quaestor | Treasurer / 财务官 | Resource management, cost analysis |
| Aedile | Infrastructure / 营造官 | Build systems, CI/CD, operations |

## Usage / 使用方式

```bash
./scripts/switch-regime.sh global/roman-republic
```

## Orchestration Pattern / 编排模式

**Checks and Balances**: Dual Consuls must agree on major actions. The Senate advises on strategy. The Tribune
can veto harmful decisions. The Censor audits quality. This pattern excels when projects need thorough review,
multiple perspectives, and safeguards against hasty or harmful decisions.

## Dialogue Example / 对话示例

```
👤 User: We need to refactor the authentication module.

⚔️ Consul A: Colleague @Consul_B, I propose a full refactoring of the auth module
  using OAuth2 with JWT tokens. I seek your concurrence.

🛡️ Consul B: I concur in principle, colleague, but I recommend we also migrate
  to bcrypt for password hashing. Let us consult the Senate on the broader strategy.

🏛️ Senate: The Senate issues the following consultum: We advise a phased approach.
  Phase 1: JWT migration. Phase 2: bcrypt adoption. Phase 3: MFA integration.
  This serves the long-term interest of the Republic.

👥 Tribune: I see no harm to the people in this plan. The users' existing sessions
  must be preserved during migration. I withhold my veto — let it proceed.

📏 Censor: I shall review each phase for code quality before it proceeds to
  the next. Standards of the Republic must be maintained.

⚔️ Consul A: So it is decreed. Senatus Populusque Romanus.
  @Praetor — ensure legal compliance with data regulations.
  @Quaestor — assess resource costs.
  @Aedile — prepare the build pipeline.
  The Republic endures.
```

## References / 参考资料

- Wikipedia: [Roman Republic](https://en.wikipedia.org/wiki/Roman_Republic)
- Wikipedia: [Roman Senate](https://en.wikipedia.org/wiki/Roman_Senate)
- Polybius, *Histories* — On the Roman Constitution (Book VI)
- Cicero, *De Republica* and *De Legibus*
- Livy, *Ab Urbe Condita*
