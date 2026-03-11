# US Federal System / 美国联邦制 — Three Branches / 三权分立

> 1789-present · Separation of Powers

## Introduction / 简介

The United States Federal System (1789-present) is the world's oldest continuously operating written
constitution, embodying the Enlightenment ideal that power must be divided to preserve liberty. Three
co-equal branches — Executive, Legislative, and Judicial — check and balance each other, ensuring
that no single entity can dominate. This system has served as a model for constitutional democracies worldwide.

## Historical Background / 历史背景

After winning independence from Britain in 1783, the former colonies struggled under the weak Articles of
Confederation. In 1787, delegates gathered in Philadelphia to draft a new Constitution. Drawing on
Montesquieu's theory of separation of powers, Locke's social contract, and the practical experience of
Roman republicanism, they created a federal system that balanced the competing demands of large and small
states, federal and state power, and individual liberty versus collective governance.

**Key Concepts:**
- **Separation of Powers** — Executive, Legislative, and Judicial branches are independent
- **Checks and Balances** — Each branch can limit the others (veto, override, judicial review)
- **Federalism** — Power divided between national and state governments
- **Bill of Rights** — First ten amendments protecting individual liberties
- **Judicial Review** — The Supreme Court's power to declare laws unconstitutional (Marbury v. Madison, 1803)

## Agent Configuration / Agent 配置

This regime contains 7 Agents:

| Agent | Role / 角色 | Responsibility / 职责 |
|---|---|---|
| President | Executive / 行政首长 | Strategic direction, executive orders, Commander-in-Chief |
| House | Representatives / 众议院 | Legislation, appropriations, popular representation |
| Senate | Upper Chamber / 参议院 | Deliberation, confirmation, treaty ratification |
| Supreme Court | Judicial Review / 最高法院 | Constitutional review, legal interpretation |
| Cabinet | Departments / 内阁 | Policy implementation, daily operations |
| Joint Chiefs | Military-Tech / 参谋长联席会议 | Security, architecture, infrastructure |
| Inspector General | Oversight / 监察长 | Independent audits, investigations |

## Usage / 使用方式

```bash
./scripts/switch-regime.sh global/us-federal
```

## Orchestration Pattern / 编排模式

**Checks and Balances**: Three co-equal branches prevent any single agent from dominating. The President
proposes and executes; Congress authorizes and funds; the Supreme Court reviews for constitutional compliance;
the Inspector General audits independently. This pattern excels for projects requiring rigorous review,
legal/compliance awareness, and transparent decision-making.

## Dialogue Example / 对话示例

```
👤 User: We need to implement a user data collection feature.

🏛️ President: I'm directing the Cabinet to draft an implementation plan for
  user data collection. @Joint_Chiefs, provide a technical assessment.
  This will require congressional authorization given the privacy implications.

📋 Cabinet: Mr./Madam President, the Department has drafted a plan:
  • Server-side analytics with consent management
  • Data retention policy: 90 days default
  • Opt-out mechanism for all users

🎖️ Joint Chiefs: Mr./Madam President, our technical assessment:
  ✅ Architecture supports GDPR and CCPA compliance
  ✅ Encryption at rest and in transit
  ✅ Data anonymization pipeline ready

🏛️ House: The House has reviewed the proposal. We authorize with amendments:
  Amendment 1: Users must opt-IN, not opt-out
  Amendment 2: Data retention reduced to 30 days
  The vote passes 4-2.

🏛️ Senate: The Senate concurs with the House amendments.
  We add: annual transparency reports required. Motion carries.

⚖️ Supreme Court: The Court has reviewed this action. We find:
  ✅ Consistent with Fourth Amendment privacy principles
  ✅ Opt-in requirement satisfies due process
  ⚠️ Ensure minors' data receives enhanced protection (COPPA)
  It is so ordered.

🔍 Inspector General: The IG will schedule a post-implementation audit
  at 90 days to verify compliance with all stated protections.

🏛️ President: The bill is signed. @Cabinet, execute with all amendments
  incorporated. We the People are well served.
```

## References / 参考资料

- United States Constitution (1787) and Bill of Rights (1791)
- The Federalist Papers (Hamilton, Madison, Jay)
- Wikipedia: [United States federal government](https://en.wikipedia.org/wiki/Federal_government_of_the_United_States)
- Montesquieu, *The Spirit of the Laws* (1748)
- Marbury v. Madison, 5 U.S. 137 (1803)
