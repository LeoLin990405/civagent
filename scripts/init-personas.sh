#!/bin/bash
# ============================================
# 人设初始化脚本
# 
# 用途：从 configs 目录提取人设，注入到 openclaw.json
# 用法：bash init-personas.sh [regime]
# 示例：
#   bash init-personas.sh              # 使用当前配置的制度
#   bash init-personas.sh ming-neige   # 指定明朝内阁制
#   bash init-personas.sh tang-sansheng # 指定唐朝三省制
# ============================================

set -e

CONFIG_DIR="$HOME/.openclaw"
CONFIG_FILE="$CONFIG_DIR/openclaw.json"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DANGHUANGSHANG_ROOT="$(dirname "$SCRIPT_DIR")"

CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo ""
echo -e "${CYAN}═══════════════════════════════════════${NC}"
echo -e "${CYAN}   AI 朝廷 · 人设初始化${NC}"
echo -e "${CYAN}═══════════════════════════════════════${NC}"
echo ""

# 检查配置文件
if [ ! -f "$CONFIG_FILE" ]; then
  echo -e "${RED}✗ 未找到配置文件：$CONFIG_FILE${NC}"
  echo "请先运行安装脚本或手动创建配置"
  exit 1
fi

# 确定制度
if [ -n "$1" ]; then
  TARGET_REGIME="$1"
else
  # 从配置中读取当前制度
  if command -v jq &>/dev/null; then
    TARGET_REGIME=$(jq -r '._regime // "ming-neige"' "$CONFIG_FILE" 2>/dev/null)
  else
    TARGET_REGIME="ming-neige"
  fi
fi

echo -e "使用制度：${GREEN}$TARGET_REGIME${NC}"

# 检查配置模板目录
TEMPLATE_DIR="$DANGHUANGSHANG_ROOT/configs/$TARGET_REGIME"
if [ ! -d "$TEMPLATE_DIR" ]; then
  echo -e "${RED}✗ 未找到配置目录：$TEMPLATE_DIR${NC}"
  exit 1
fi

# 检查是否有 agents 子目录（新结构）
AGENTS_DIR="$TEMPLATE_DIR/agents"
if [ -d "$AGENTS_DIR" ]; then
  echo -e "${BLUE}✓ 发现人设目录：$AGENTS_DIR${NC}"
  USE_NEW_STRUCTURE=true
else
  echo -e "${YELLOW}⚠ 未发现人设目录，使用旧结构（从 openclaw.json 复制）${NC}"
  USE_NEW_STRUCTURE=false
fi

# 备份当前配置
BACKUP_FILE="$CONFIG_FILE.$(date +%Y%m%d_%H%M%S).bak"
cp "$CONFIG_FILE" "$BACKUP_FILE"
echo -e "${YELLOW}✓ 已备份当前配置：$BACKUP_FILE${NC}"

# 检查 jq
if ! command -v jq &>/dev/null; then
  echo -e "${RED}✗ 未找到 jq 工具，请先安装：${NC}"
  echo "  Ubuntu/Debian: sudo apt install jq"
  echo "  macOS: brew install jq"
  exit 1
fi

# 注入人设
echo ""
echo -e "${CYAN}正在注入人设...${NC}"
echo ""

if [ "$USE_NEW_STRUCTURE" = true ]; then
  # 新结构：从 agents/*.md 文件读取
  for agent_file in "$AGENTS_DIR"/*.md; do
    if [ -f "$agent_file" ]; then
      agent_id=$(basename "$agent_file" .md)
      persona=$(cat "$agent_file")
      
      # 转义换行符
      persona_escaped=$(echo "$persona" | jq -Rs '.')
      
      # 检查 agent 是否存在
      agent_exists=$(jq --arg id "$agent_id" '.agents.list[] | select(.id == $id) | .id' "$CONFIG_FILE" 2>/dev/null)
      
      if [ -n "$agent_exists" ]; then
        # 更新现有人设
        jq --arg id "$agent_id" --argjson persona "$persona_escaped" \
          '(.agents.list[] | select(.id == $id) | .identity.theme) = $persona' \
          "$CONFIG_FILE" > "$CONFIG_FILE.tmp" && mv "$CONFIG_FILE.tmp" "$CONFIG_FILE"
        echo -e "  ${GREEN}✓${NC} $agent_id"
      else
        echo -e "  ${YELLOW}⚠${NC} $agent_id (配置中不存在，跳过)"
      fi
    fi
  done
else
  # 旧结构：从模板配置复制
  TEMPLATE_CONFIG="$TEMPLATE_DIR/openclaw.json"
  if [ -f "$TEMPLATE_CONFIG" ]; then
    echo -e "${BLUE}从模板配置提取人设...${NC}"
    
    # 获取 agent 列表
    agent_ids=$(jq -r '.agents.list[].id' "$TEMPLATE_CONFIG" 2>/dev/null)
    
    for agent_id in $agent_ids; do
      # 从模板提取人设
      persona=$(jq -r --arg id "$agent_id" '.agents.list[] | select(.id == $id) | .identity.theme' "$TEMPLATE_CONFIG" 2>/dev/null)
      
      if [ -n "$persona" ] && [ "$persona" != "null" ]; then
        # 转义并注入
        persona_escaped=$(echo "$persona" | jq -Rs '.')
        
        jq --arg id "$agent_id" --argjson persona "$persona_escaped" \
          '(.agents.list[] | select(.id == $id) | .identity.theme) = $persona' \
          "$CONFIG_FILE" > "$CONFIG_FILE.tmp" && mv "$CONFIG_FILE.tmp" "$CONFIG_FILE"
        echo -e "  ${GREEN}✓${NC} $agent_id"
      fi
    done
  else
    echo -e "${RED}✗ 未找到模板配置：$TEMPLATE_CONFIG${NC}"
    exit 1
  fi
fi

echo ""
echo -e "${GREEN}✓ 人设注入完成！${NC}"
echo ""

# 验证
echo -e "${CYAN}验证人设完整性...${NC}"
agent_count=$(jq '.agents.list | length' "$CONFIG_FILE")
persona_count=$(jq '[.agents.list[] | select(.identity.theme != null and .identity.theme != "")] | length' "$CONFIG_FILE")

echo "  Agent 总数：$agent_count"
echo "  已配置人设：$persona_count"

if [ "$agent_count" -eq "$persona_count" ]; then
  echo -e "  ${GREEN}✓ 所有 Agent 已配置人设${NC}"
else
  echo -e "  ${YELLOW}⚠ 有 $((agent_count - persona_count)) 个 Agent 缺少人设${NC}"
fi

echo ""
echo -e "${YELLOW}⚠️  下一步操作：${NC}"
echo ""
echo "  1. 检查配置是否正确："
echo -e "     ${CYAN}jq '.agents.list[].identity.theme' $CONFIG_FILE | head -20${NC}"
echo ""
echo "  2. 重启 Gateway 使配置生效："
echo -e "     ${CYAN}openclaw gateway restart${NC}"
echo ""
echo -e "${CYAN}═══════════════════════════════════════${NC}"
echo ""
