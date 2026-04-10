# Theocratic Authority Mode (神权模式)

> Historical model: Shang Dynasty, Ancient Egypt, Taiping Heavenly Kingdom

## Pattern

Supreme agent has absolute authority. No review, no voting.
Direct execution with zero overhead. Narrowest scope.

## Execution Flow

```
User → Supreme Agent (Opus, max effort)
         └── executes directly, no delegation
```

## CC Implementation

- Single CC session with `--effort max`
- No subagents, no review, no delegation
- The most powerful model available handles everything
- Fastest possible response for single-agent tasks

## When to Use

- Emergency fixes (production is down)
- Simple tasks that don't warrant multi-agent overhead
- When you trust one model's output completely
