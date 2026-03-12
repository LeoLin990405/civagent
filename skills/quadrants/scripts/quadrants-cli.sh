#!/bin/bash
# Quadrants CLI — OpenClaw integration
# Usage: bash quadrants-cli.sh <action> [args...]

set -euo pipefail

API_URL="${QUADRANTS_API_URL:-https://quadrants.ch}"
API_KEY="${QUADRANTS_API_KEY:-}"
SERVICE_ENDPOINT="${API_URL}/api/service"

if [ -z "$API_KEY" ]; then
  echo "Error: QUADRANTS_API_KEY not set"
  echo "Set it in TOOLS.md or export QUADRANTS_API_KEY=<key>"
  exit 1
fi

call_api() {
  local payload="$1"
  curl -s -X POST "$SERVICE_ENDPOINT" \
    -H "Content-Type: application/json" \
    -H "X-API-Key: $API_KEY" \
    -d "$payload"
}

ACTION="${1:-help}"
shift || true

case "$ACTION" in
  projects)
    call_api '{"action":"projects"}'
    ;;

  tasks)
    PROJECT_ID="${1:?Error: projectId required}"
    # SEC-05: 用 jq 安全构建 JSON，防止注入
    call_api "$(jq -n --arg pid "$PROJECT_ID" '{"action":"tasks","projectId":$pid}')"
    ;;

  priority)
    call_api '{"action":"priority"}'
    ;;

  create)
    PROJECT_ID="${1:?Error: projectId required}"
    DESCRIPTION="${2:?Error: description required}"
    URGENCY="${3:-50}"
    IMPORTANCE="${4:-50}"
    # SEC-05: 用 jq 安全构建 JSON
    call_api "$(jq -n --arg pid "$PROJECT_ID" --arg desc "$DESCRIPTION" --argjson urg "$URGENCY" --argjson imp "$IMPORTANCE" \
      '{"action":"create","projectId":$pid,"description":$desc,"urgency":$urg,"importance":$imp}')"
    ;;

  bulk-create)
    PROJECT_ID="${1:?Error: projectId required}"
    TASKS_JSON="${2:?Error: tasks JSON required}"
    # SEC-05: 用 jq 安全构建 JSON
    call_api "$(jq -n --arg pid "$PROJECT_ID" --argjson tasks "$TASKS_JSON" \
      '{"action":"bulk-create","projectId":$pid,"tasks":$tasks}')"
    ;;

  complete)
    TASK_ID="${1:?Error: taskId required}"
    call_api "$(jq -n --argjson tid "$TASK_ID" '{"action":"complete","taskId":$tid}')"
    ;;

  update)
    TASK_ID="${1:?Error: taskId required}"
    UPDATES="${2:?Error: updates JSON required}"
    call_api "$(jq -n --argjson tid "$TASK_ID" --argjson upd "$UPDATES" \
      '{"action":"update","taskId":$tid,"updates":$upd}')"
    ;;

  delete)
    TASK_ID="${1:?Error: taskId required}"
    call_api "$(jq -n --argjson tid "$TASK_ID" '{"action":"delete","taskId":$tid}')"
    ;;

  overview)
    PROJECT_ID="${1:?Error: projectId required}"
    call_api "$(jq -n --arg pid "$PROJECT_ID" '{"action":"overview","projectId":$pid}')"
    ;;

  help|*)
    echo "Quadrants CLI — Manage tasks on the Eisenhower Matrix"
    echo ""
    echo "Usage: quadrants-cli.sh <action> [args...]"
    echo ""
    echo "Actions:"
    echo "  projects                              List all projects"
    echo "  tasks <projectId>                     List tasks for a project"
    echo "  priority                              Top priority tasks"
    echo "  create <projectId> <desc> [urg] [imp] Create a task"
    echo "  bulk-create <projectId> <json>        Bulk create tasks"
    echo "  complete <taskId>                     Complete a task"
    echo "  update <taskId> <json>                Update a task"
    echo "  delete <taskId>                       Delete a task"
    echo "  overview <projectId>                  Project overview"
    ;;
esac
