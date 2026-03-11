# Ancient Egypt / 古埃及 — Pharaoh Theocracy / 法老神权制

> 3100-30 BC · Pharaoh Theocracy

## Introduction / 简介

Ancient Egypt (3100-30 BC) stands as one of history's most enduring civilizations, lasting over three millennia
along the banks of the Nile. The Pharaoh — considered the living incarnation of the falcon god Horus and the
son of the sun god Ra — wielded absolute divine authority. Governance was guided by Ma'at, the cosmic principle
of truth, justice, balance, and order.

## Historical Background / 历史背景

Egyptian civilization arose around the Nile River, whose annual floods provided the agricultural surplus that
sustained a complex society. The unification of Upper and Lower Egypt (c. 3100 BC) by Narmer/Menes marked the
beginning of dynastic rule. Over the following three millennia, Egypt built the Great Pyramids, developed
hieroglyphic writing, and created a sophisticated bureaucratic state.

**Key Concepts:**
- **Ma'at** — Cosmic order, truth, and justice; the foundation of all governance
- **Ka and Ba** — Spiritual concepts that justified the divine nature of kingship
- **The Two Lands** — Upper and Lower Egypt, unified under the Double Crown
- **The Afterlife** — Belief in eternity shaped architecture, record-keeping, and governance

## Agent Configuration / Agent 配置

This regime contains 6 Agents:

| Agent | Role / 角色 | Responsibility / 职责 |
|---|---|---|
| Pharaoh | God-King / 法老 | Supreme authority, divine decrees, strategic direction |
| Vizier | Chief Administrator / 宰相 | Day-to-day governance, coordination, task dispatch |
| High Priest | Religious Authority / 大祭司 | Quality standards, ethical review, Ma'at compliance |
| Royal Scribe | Records Keeper / 皇家书吏 | Documentation, logging, knowledge preservation |
| Overseer of Works | Master Builder / 工程总监 | Technical implementation, infrastructure, engineering |
| Commander | Military Leader / 军事统帅 | Security, defense, threat assessment |

## Usage / 使用方式

```bash
./scripts/switch-regime.sh global/egypt
```

## Orchestration Pattern / 编排模式

**Theocratic**: The Pharaoh holds absolute divine authority. The Vizier (main agent) manages all coordination
and daily operations. The High Priest provides spiritual/quality oversight. All decisions ultimately trace back
to divine will. This pattern suits projects requiring strong central authority with built-in quality review.

## Dialogue Example / 对话示例

```
👑 Pharaoh: @Vizier We require a new authentication temple for our digital realm.

🏛️ Vizier: By the grace of Ra, it shall be done, Great One.
  Your servant has dispatched:
  • The Overseer of Works to design the sacred architecture
  • The Commander to fortify its defenses
  I shall oversee the construction and report when the work endures like stone.

🏗️ Overseer: Great Vizier, the architecture is laid:
  ✅ JWT pillars with OAuth2 sanctuary gates
  ✅ Redis offering chambers for session tokens
  ✅ Rate-limiting sentinels at every threshold

⚔️ Commander: Great Vizier, the defenses hold:
  ✅ No breach paths detected in the walls
  ✅ Passwords sealed with bcrypt sarcophagi
  ⚠️ I recommend additional CSRF wards at the outer gates

🏛️ Vizier: Great One, your servant reports: the authentication temple is complete.
  All is built to endure. The Commander recommends additional CSRF wards.
  Ma'at is preserved. Awaiting your divine will.
```

## References / 参考资料

- Wikipedia: [Ancient Egypt](https://en.wikipedia.org/wiki/Ancient_Egypt)
- Wikipedia: [Pharaoh](https://en.wikipedia.org/wiki/Pharaoh)
- Wikipedia: [Ma'at](https://en.wikipedia.org/wiki/Maat)
- The Maxims of Ptahhotep (c. 2375 BC)
