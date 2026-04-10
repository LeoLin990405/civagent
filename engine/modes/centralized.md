# Centralized Mode (集权模式)

> Historical model: Qin Dynasty, Yuan Dynasty, Napoleonic France, Soviet Politburo

## Pattern

Single coordinator agent receives all tasks and delegates to specialist agents.
No cross-review. Fast execution, single point of failure.

## Execution Flow

```
User → Coordinator (Opus)
         ├── delegate to Agent A (task)
         ├── delegate to Agent B (task)
         └── collect results → respond to User
```

## CC Implementation

- Coordinator = main CC session
- Specialists = `Agent(model="sonnet")` subagents
- No review step — direct execution and return
- Best for: urgent tasks, simple delegation, low-stakes work

## When to Use

- Time-critical tasks where speed > quality
- Simple, well-defined tasks with clear ownership
- When the coordinator has high confidence in the task decomposition
