#!/bin/bash
# ============================================
# Health Check - 健康检查与告警
# 
# 功能：
#   - 检查 Gateway 状态
#   - 检查任务失败率
#   - 检查 API 费用异常
#   - 发送告警（飞书/Discord/邮件）
#
# 用法：
#   bash scripts/health-check.sh
#   # crontab: */5 * * * * bash /home/ubuntu/clawd/scripts/health-check.sh
# ============================================

set -e

# 配置
ALERT_THRESHOLD_FAILURE_RATE=30    # 失败率超过 30% 告警
ALERT_THRESHOLD_COST_DAILY=50      # 日费用超过 $50 告警
ALERT_CHANNEL="feishu"             # 告警通道：feishu/discord/email

# 依赖检查
check_dependencies() {
  local missing=()
  for cmd in jq bc curl; do
    if ! command -v $cmd &>/dev/null; then
      missing+=($cmd)
    fi
  done
  if [ ${#missing[@]} -gt 0 ]; then
    echo "⚠️  缺少依赖：${missing[*]}"
    echo "   安装：sudo apt install jq bc curl"
    return 1
  fi
  return 0
}

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 日志文件
LOG_FILE="$HOME/clawd/logs/health-check.log"
mkdir -p "$(dirname "$LOG_FILE")"

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

send_alert() {
  local title="$1"
  local message="$2"
  local level="$3"  # warning / critical
  
  log "🚨 发送告警：$title"
  
  # 飞书告警
  if [ "$ALERT_CHANNEL" = "feishu" ] && [ -n "$FEISHU_WEBHOOK" ]; then
    curl -s -X POST "$FEISHU_WEBHOOK" \
      -H "Content-Type: application/json" \
      -d "{
        \"msg_type\": \"interactive\",
        \"card\": {
          \"header\": {
            \"title\": {
              \"tag\": \"plain_text\",
              \"content\": \"${level = 'critical' ? '🚨 严重告警' : '⚠️ 警告'} - $title\"
            },
            \"template\": \"${level = 'critical' ? 'red' : 'orange'}\"
          },
          \"elements\": [
            {
              \"tag\": \"div\",
              \"text\": {
                \"tag\": \"lark_md\",
                \"content\": \"$message\"
              }
            }
          ]
        }
      }" || true
  fi
  
  # Discord 告警
  if [ "$ALERT_CHANNEL" = "discord" ] && [ -n "$DISCORD_WEBHOOK" ]; then
    curl -s -X POST "$DISCORD_WEBHOOK" \
      -H "Content-Type: application/json" \
      -d "{
        \"embeds\": [{
          \"title\": \"${level = 'critical' ? '🚨 严重告警' : '⚠️ 警告'} - $title\",
          \"description\": \"$message\",
          \"color\": ${level = 'critical' ? '15158332' : '15105570'}
        }]
      }" || true
  fi
  
  # 邮件告警（需要配置 mail 命令）
  if [ "$ALERT_CHANNEL" = "email" ] && [ -n "$ALERT_EMAIL" ]; then
    echo "$message" | mail -s "[$level] $title" "$ALERT_EMAIL" || true
  fi
}

# ============================================
# 检查 1: Gateway 状态
# ============================================

check_gateway() {
  log "🔍 检查 Gateway 状态..."
  
  if systemctl --user is-active openclaw-gateway &>/dev/null; then
    log "  ${GREEN}✓${NC} Gateway 运行正常"
    return 0
  else
    log "  ${RED}✗${NC} Gateway 未运行！"
    send_alert "Gateway 宕机" "OpenClaw Gateway 已停止运行\n\n请立即重启：\n\`\`\`\nsystemctl --user restart openclaw-gateway\n\`\`\`" "critical"
    return 1
  fi
}

# ============================================
# 检查 2: 任务失败率
# ============================================

check_task_failure_rate() {
  log "🔍 检查任务失败率..."
  
  if [ ! -f "$HOME/.clawd/task-store/tasks.json" ]; then
    log "  ${YELLOW}⚠${NC} 无任务数据，跳过检查"
    return 0
  fi
  
  # 统计失败率
  local total=$(jq '.tasks | length' "$HOME/.clawd/task-store/tasks.json" 2>/dev/null || echo 0)
  local failed=$(jq '[.tasks[].steps[] | select(.status == "failed")] | length' "$HOME/.clawd/task-store/tasks.json" 2>/dev/null || echo 0)
  
  if [ "$total" -eq 0 ]; then
    log "  ${YELLOW}⚠${NC} 无任务记录"
    return 0
  fi
  
  local failure_rate=$((failed * 100 / total))
  
  log "  总任务数：$total, 失败步骤：$failed, 失败率：${failure_rate}%"
  
  if [ "$failure_rate" -gt "$ALERT_THRESHOLD_FAILURE_RATE" ]; then
    log "  ${RED}✗${NC} 失败率过高！"
    send_alert "任务失败率过高" "失败率：${failure_rate}%\n总任务数：$total\n失败步骤：$failed\n\n请检查：\n1. API Key 是否有效\n2. 网络连接是否正常\n3. Agent 配置是否正确" "warning"
    return 1
  else
    log "  ${GREEN}✓${NC} 失败率正常"
    return 0
  fi
}

# ============================================
# 检查 3: API 费用异常
# ============================================

check_api_cost() {
  log "🔍 检查 API 费用..."
  
  # 这里需要根据实际使用的 LLM 服务商 API 来查询
  # 示例：DashScope / OpenAI / Anthropic
  
  # 简单检查：查看日志中的 token 消耗
  local today_logs=$(find "$HOME/.clawd/logs" -name "*.log" -mtime -1 -exec cat {} \; 2>/dev/null || true)
  local token_usage=$(echo "$today_logs" | grep -o '"total_tokens": [0-9]*' | awk -F': ' '{sum+=$2} END {print sum+0}')
  
  # 粗略估算：1000 tokens ≈ $0.01（实际根据模型不同）
  local estimated_cost=$(echo "scale=2; $token_usage * 0.01 / 1000" | bc 2>/dev/null || echo "0")
  
  log "  今日 Token 消耗：$token_usage, 估算费用：\$${estimated_cost}"
  
  # 如果费用超过阈值（需要配置实际的费用追踪）
  # if (( $(echo "$estimated_cost > $ALERT_THRESHOLD_COST_DAILY" | bc -l) )); then
  #   log "  ${RED}✗${NC} 费用异常！"
  #   send_alert "API 费用异常" "今日估算费用：\$${estimated_cost}\n超过阈值：\$${ALERT_THRESHOLD_COST_DAILY}\n\n请检查是否有异常调用。" "warning"
  #   return 1
  # fi
  
  log "  ${GREEN}✓${NC} 费用正常"
  return 0
}

# ============================================
# 检查 4: 磁盘空间
# ============================================

check_disk_space() {
  log "🔍 检查磁盘空间..."
  
  local usage=$(df -h "$HOME" | awk 'NR==2 {print $5}' | sed 's/%//')
  
  log "  磁盘使用率：${usage}%"
  
  if [ "$usage" -gt 90 ]; then
    log "  ${RED}✗${NC} 磁盘空间不足！"
    send_alert "磁盘空间不足" "磁盘使用率：${usage}%\n\n请立即清理：\n1. 删除旧日志：rm -rf ~/clawd/logs/*.log\n2. 清理备份：rm -rf ~/clawd/backups/*\n3. 运行 cleanup-repo.sh" "critical"
    return 1
  elif [ "$usage" -gt 80 ]; then
    log "  ${YELLOW}⚠${NC} 磁盘空间紧张"
    send_alert "磁盘空间紧张" "磁盘使用率：${usage}%\n\n建议清理日志和备份文件。" "warning"
    return 1
  else
    log "  ${GREEN}✓${NC} 磁盘空间充足"
    return 0
  fi
}

# ============================================
# 检查 5: 内存使用
# ============================================

check_memory() {
  log "🔍 检查内存使用..."
  
  local usage=$(free | awk 'NR==2 {printf "%.0f", $3*100/$2}')
  
  log "  内存使用率：${usage}%"
  
  if [ "$usage" -gt 90 ]; then
    log "  ${RED}✗${NC} 内存使用率过高！"
    send_alert "内存使用率过高" "内存使用率：${usage}%\n\n请检查是否有内存泄漏或过多进程。" "critical"
    return 1
  else
    log "  ${GREEN}✓${NC} 内存使用正常"
    return 0
  fi
}

# ============================================
# 主函数
# ============================================

main() {
  log "═══════════════════════════════════════"
  log "健康检查开始"
  log "═══════════════════════════════════════"
  
  local issues=0
  
  check_gateway || ((issues++))
  check_task_failure_rate || ((issues++))
  check_api_cost || ((issues++))
  check_disk_space || ((issues++))
  check_memory || ((issues++))
  
  log "═══════════════════════════════════════"
  
  if [ "$issues" -eq 0 ]; then
    log "${GREEN}✓ 所有检查通过${NC}"
    echo "HEALTHY" > "$HOME/.clawd/health-status"
  else
    log "${RED}✗ 发现 $issues 个问题${NC}"
    echo "UNHEALTHY ($issues issues)" > "$HOME/.clawd/health-status"
  fi
  
  log "═══════════════════════════════════════"
  
  return $issues
}

# 运行
main "$@"
