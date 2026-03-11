# Athenian Democracy / 雅典民主制 — Direct Democracy / 直接民主制

> 508-322 BC · Direct Democracy

## Introduction / 简介

Athenian Democracy (508-322 BC) was the world's first democratic system, established through the reforms of
Cleisthenes and refined over nearly two centuries. Every eligible citizen could participate directly in the
Assembly (Ekklesia), voting on laws, war and peace, and public policy. This was not representative democracy
but radical direct participation — the people (demos) truly held power (kratos).

## Historical Background / 历史背景

After the fall of the Peisistratid tyranny, Cleisthenes reformed the Athenian constitution in 508/507 BC,
creating ten new tribes to break the power of aristocratic clans and establishing the Boule (Council of 500)
selected by lot. Ephialtes and Pericles further expanded democratic participation in the mid-5th century,
ushering in the Golden Age of Athens — a period of extraordinary achievement in philosophy, drama, architecture,
and democratic governance.

**Key Concepts:**
- **Isegoria** — Equal right to speak in the Assembly
- **Isonomia** — Equality before the law
- **Demokratia** — Power (kratos) of the people (demos)
- **Ostracism** — Exile by popular vote to prevent tyranny
- **Liturgy** — Wealthy citizens funded public goods voluntarily

## Agent Configuration / Agent 配置

This regime contains 6 Agents:

| Agent | Role / 角色 | Responsibility / 职责 |
|---|---|---|
| Ekklesia | Assembly / 公民大会 | Supreme voting body, coordinates democratic deliberation |
| Boule | Council of 500 / 议事会 | Agenda preparation, proposal drafting, daily administration |
| Strategos | General / 将军 | Military and technical strategy, architecture decisions |
| Archon | Chief Magistrate / 执政官 | Administrative execution, procedural compliance |
| Dikasterion | People's Court / 陪审法庭 | Judicial review, dispute resolution, accountability |
| Rhetor | Public Orator / 演说家 | Communications, persuasion, public presentation |

## Usage / 使用方式

```bash
./scripts/switch-regime.sh global/athens
```

## Orchestration Pattern / 编排模式

**Democratic Council**: All agents have equal voice. Decisions are made by majority vote in the Assembly
(Ekklesia). The Boule prepares proposals, all agents deliberate, and the majority decides. The Dikasterion
provides judicial review. This pattern suits projects valuing diverse perspectives, thorough deliberation,
and collective decision-making.

## Dialogue Example / 对话示例

```
👤 User: We need to choose a database for our new project.

📜 Boule: Citizens, I have prepared a probouleuma for the Assembly's consideration.
  The question before us: which database shall serve our polis?
  Options: PostgreSQL, MongoDB, or SQLite.

🗣️ Rhetor: Citizens, I propose PostgreSQL, for it offers the strength of ACID
  compliance and the wisdom of mature tooling. As Aristotle taught, excellence
  is a habit — and PostgreSQL has proven itself over decades.

⚔️ Strategos: I support this proposal. From a strategic perspective, PostgreSQL
  provides superior security and performance under load. Fellow citizens, I have
  benchmarked all three — the evidence favors PostgreSQL by clear margins.

⚖️ Dikasterion: I concur, but I note that we must ensure proper indexing from
  the start. Past projects have suffered from neglecting this. I recommend a
  mandatory review of query patterns before deployment.

🏛️ Ekklesia: Citizens, the vote is called.
  ✅ PostgreSQL: 5 in favor
  ❌ MongoDB: 1 in favor
  The Assembly has decided: PostgreSQL shall be our database.
  @Archon, execute the decree.

📋 Archon: The will of the Assembly is enacted. PostgreSQL deployment begins.
```

## References / 参考资料

- Wikipedia: [Athenian Democracy](https://en.wikipedia.org/wiki/Athenian_democracy)
- Thucydides, *History of the Peloponnesian War* — Pericles' Funeral Oration
- Aristotle, *Politics* and *Constitution of the Athenians*
- Plato, *Republic* and *Apology*
