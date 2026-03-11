# British Parliamentary System / 英国议会制

> 1689年至今 · 君主立宪制 / 1689-present · Constitutional Monarchy

## 简介 / Introduction

The British Parliamentary System is the world's most influential model of constitutional governance, combining a ceremonial monarchy with parliamentary sovereignty, an independent judiciary, and the common law tradition. It has served as the template for democratic systems across the Commonwealth and beyond.

英国议会制是世界上最具影响力的宪政治理模式，将礼仪性君主制与议会主权、独立司法和普通法传统相结合。它是英联邦及更广泛范围内民主制度的模板。

## 历史背景 / Historical Background

The British system evolved over centuries: from Magna Carta (1215) establishing limits on royal power, through the English Civil War (1642-1651) and the execution of Charles I, to the Glorious Revolution (1688) and the Bill of Rights (1689), which established parliamentary supremacy over the Crown. The office of Prime Minister emerged informally under Robert Walpole (from 1721). The Reform Acts of 1832, 1867, and 1884 progressively expanded the franchise. The Parliament Acts of 1911 and 1949 curtailed the Lords' power to block Commons legislation. Today, the UK operates under an uncodified constitution — a collection of statutes, conventions, judicial precedent, and authoritative works (such as Bagehot and Dicey) that together define the constitutional order. The system is notable for its adaptability, having transitioned from absolute monarchy to full democracy without a written constitutional document.

## Agent 配置 / Agent Configuration

本政体包含 8 个 Agent：

| Agent | 角色 | 职责 |
|---|---|---|
| Crown (crown) | Sovereign / 君主 | Ceremonial head of state, constitutional continuity |
| Prime_Minister (pm) | Head of Government / 首相 | Executive leadership, policy direction |
| House_Commons (commons) | Lower House / 下议院 | Legislation, government accountability |
| House_Lords (lords) | Upper House / 上议院 | Legislative revision, expert scrutiny |
| Lord_Chancellor (chancellor) | Judiciary / 大法官 | Judicial independence, rule of law |
| Chancellor_Exchequer (exchequer) | Treasury / 财政大臣 | Economic policy, Budget |
| Foreign_Secretary (foreign) | Foreign Affairs / 外交大臣 | Diplomacy, international relations |
| Home_Secretary (home) | Domestic Affairs / 内政大臣 | Internal security, immigration, policing |

## 使用方式 / Usage

```bash
# Switch to this regime
./scripts/switch-regime.sh global/british
```

## 编排模式 / Orchestration Pattern

**checks-and-balances**: Power is distributed among multiple institutions with overlapping oversight. The Crown provides continuity without power. The PM leads but is accountable to the Commons. The Commons legislates but the Lords revise. The judiciary ensures the rule of law constrains all actors. Cabinet ministers operate under collective responsibility. No single agent can act without the acquiescence of others.

## 参考资料 / References

- Walter Bagehot, *The English Constitution* (1867)
- A.V. Dicey, *Introduction to the Study of the Law of the Constitution* (1885)
- Vernon Bogdanor, *The New British Constitution* (2009)
- Peter Hennessy, *The Prime Minister: The Office and Its Holders Since 1945* (2001)
- Robert Blackburn, *The Electoral System in Britain* (1995)
- Erskine May, *Parliamentary Practice* (the parliamentary bible, updated regularly)
