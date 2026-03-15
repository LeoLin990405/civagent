---
name: quadrants
description: Manage Quadrants tasks and projects via natural language. Use when the user wants to create, view, complete, or organize tasks on the Eisenhower Matrix. Supports listing projects, adding tasks (single or bulk), viewing priority tasks, completing tasks, and getting project overviews. Triggers on mentions of "quadrants", "tasks", "to-do", "eisenhower", "priority matrix", or task management requests.
---

# Quadrants Skill

Manage tasks on the Quadrants Eisenhower Matrix (quadrants.ch) via Clawdbot.

## API Access

All operations go through `POST https://quadrants.ch/api/service` with header `X-API-Key`.

Credentials stored in TOOLS.md:
- `QUADRANTS_API_KEY` — Service API key
- Default project: `proj_1761970830791_fhgaxrmo9`

## Direct API Calls (preferred over CLI)

```bash
curl -sL -X POST "https://quadrants.ch/api/service" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $QUADRANTS_API_KEY" \
  -d '{"action":"<ACTION>", ...params}'
```

## Actions Reference

| Action | Required params | Description |
|--------|----------------|-------------|
| `projects` | — | List all projects with task counts |
| `tasks` | `projectId` | List active tasks (sorted by priority) |
| `priority` | — | Top priority tasks across all projects |
| `quadrant` | `projectId`, `quadrant` (Q1/Q2/Q3/Q4) | Filter tasks by quadrant |
| `search` | `query` | Search tasks by description |
| `create` | `projectId`, `description`, `urgency?`, `importance?` | Create one task |
| `bulk-create` | `projectId`, `tasks[]` | Create multiple tasks |
| `complete` | `taskId` | Archive/complete a task |
| `update` | `taskId`, `updates{}` | Update task fields |
| `delete` | `taskId` | Permanently delete a task |
| `overview` | `projectId` | Project stats + quadrant distribution |
| `stats` | — | Global stats across all projects |

## Quadrant Mapping

| Quadrant | Urgency | Importance | Meaning |
|----------|---------|------------|---------|
| Q1 | >50 | >50 | 🔴 Do First — urgent + important |
| Q2 | ≤50 | >50 | 🟡 Schedule — important, not urgent |
| Q3 | >50 | ≤50 | 🟠 Delegate — urgent, not important |
| Q4 | ≤50 | ≤50 | ⚪ Eliminate — neither |

## Natural Language → Action Mapping

| User says | Action | Params |
|-----------|--------|--------|
| "加个任务：修bug" | `create` | description="修bug", urgency=80, importance=70 |
| "今天做什么" / "priority" | `priority` | — |
| "完成了 #412" | `complete` | taskId=412 |
| "项目概览" | `overview` | projectId=default |
| "Q1任务" / "紧急重要" | `quadrant` | quadrant=Q1 |
| "搜索 登录" | `search` | query="登录" |
| "看看项目" | `projects` | — |
| "整体情况" | `stats` | — |

## Urgency/Importance Inference

When user doesn't specify values, infer from context:

- **Bug/故障/宕机/紧急** → urgency: 85-95
- **截止日期近** → urgency: 80-90
- **战略/核心/发布** → importance: 85-95
- **优化/美化/可选** → importance: 20-40, urgency: 20-30
- **日常/常规** → both: 40-60
- **Default** → urgency: 50, importance: 50

## Example: Bulk Create

```json
{"action":"bulk-create","projectId":"proj_xxx","tasks":[
  {"description":"修复登录bug","urgency":90,"importance":85},
  {"description":"更新文档","urgency":30,"importance":70},
  {"description":"优化首页加载速度","urgency":60,"importance":75}
]}
```
