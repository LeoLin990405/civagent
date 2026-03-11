# US Federal System / 美国联邦制 — Organizational Structure / 组织架构

## System Overview / 制度简介

The United States Federal System (1789-present) is the world's oldest continuously operating constitutional
republic. Designed by the Founders at the Philadelphia Convention of 1787, it divides governmental power among
three co-equal branches: the Executive (President), the Legislature (Congress: House and Senate), and the
Judiciary (Supreme Court). This separation of powers, combined with an intricate system of checks and balances,
was designed to prevent the concentration of power that the Founders considered "the very definition of tyranny."

**Core Characteristics:** Separation of powers across three branches, constitutional supremacy, judicial review,
bicameral legislature, civilian control of military, independent oversight (Inspector General), federalism
(national and state governments), and protected individual rights (Bill of Rights).

## Org Chart / 组织架构图

```
                    ┌─────────────────────┐
                    │     User (You)      │
                    │   We the People     │
                    └──────────┬──────────┘
                               │ Constitutional Authority
         ┌─────────────────────┼─────────────────────┐
         ▼                     ▼                     ▼
  ┌─────────────┐    ┌──────────────────┐    ┌─────────────┐
  │  President  │    │    Congress      │    │  Supreme    │
  │  Executive  │    │  ┌────┬────┐    │    │   Court     │
  │   (main)    │    │  │House│Sen.│    │    │  Judicial   │
  └──────┬──────┘    │  └────┴────┘    │    │  Review     │
         │           └──────────────────┘    └─────────────┘
    ┌────┼────┐
    ▼    ▼    ▼
┌──────┐┌──────┐┌──────┐
│Cabin-││Joint ││  IG  │
│ et   ││Chiefs││Audit │
│Depts.││Mil.  ││Over- │
│      ││Tech  ││sight │
└──────┘└──────┘└──────┘
```

## Role Mapping / 角色映射表

| Historical Role | Agent ID | AI Responsibility | Recommended Model |
|---|---|---|---|
| President / 总统 | `president` | Chief Executive: strategic direction, executive orders, Commander-in-Chief | Strong Model |
| House of Representatives / 众议院 | `house` | Lower Chamber: legislation, appropriations, representing immediate interests | Strong Model |
| Senate / 参议院 | `senate` | Upper Chamber: deliberation, confirmation, treaty ratification | Strong Model |
| Supreme Court / 最高法院 | `scotus` | Judicial Branch: constitutional review, legal interpretation, dispute resolution | Strong Model |
| Cabinet / 内阁 | `cabinet` | Executive Departments: policy implementation, operations, subject expertise | Fast Model |
| Joint Chiefs of Staff / 参谋长联席会议 | `joint_chiefs` | Military/Technical: security, architecture, infrastructure strategy | Strong Model |
| Inspector General / 监察长 | `ig` | Independent Oversight: audits, investigations, waste/fraud prevention | Fast Model |

## Workflow / 协作流程

```
User requests → President proposes → Congress reviews (House + Senate)
             → SCOTUS checks constitutionality
             → Cabinet executes if authorized
             → IG audits independently
```

1. **User Request** — The user (We the People) raises a need
2. **Executive Proposal** — The President formulates a plan and may issue executive directives to the Cabinet
3. **Legislative Review** — The House and Senate review, amend, and vote on proposals
4. **Judicial Review** — The Supreme Court may review actions for constitutional compliance
5. **Execution** — The Cabinet and Joint Chiefs implement authorized actions
6. **Independent Oversight** — The Inspector General audits processes for waste, fraud, and abuse
7. **Reporting** — All branches report to the user with full transparency
