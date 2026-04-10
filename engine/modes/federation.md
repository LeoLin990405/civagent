# Federation Mode (联邦模式)

> Historical model: Zhou Enfeoffment, HRE, Persian Satrapies, EU

## Pattern

Autonomous sub-agents handle their own domains independently.
Coordinator only intervenes for cross-domain issues.
Eventual consistency via periodic sync.

## Execution Flow

```
User → Coordinator (lightweight)
         │
         ├─ Domain A: Agent A works autonomously (own worktree)
         ├─ Domain B: Agent B works autonomously (own worktree)
         ├─ Domain C: Agent C works autonomously (own worktree)
         │
         └─ Sync: Coordinator merges results when all complete
```

## CC Implementation

- Each domain agent = `Agent(isolation="worktree")` with full autonomy
- Coordinator = main CC session, only handles merge conflicts
- Parallel execution maximizes throughput
- Interface contracts: each agent knows only input/output format, not internals

## When to Use

- Large tasks that decompose into independent sub-problems
- Multi-file/multi-module changes with clear boundaries
- When latency matters and domains don't need to coordinate
