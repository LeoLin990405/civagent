#!/bin/bash
# ============================================
# AI 朝廷 · 简化安装脚本
# 用法：bash <(curl -fsSL https://raw.githubusercontent.com/wanikua/danghuangshang/main/scripts/simple-install.sh)
# ============================================

set -e
CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${CYAN}╔══════════════════════════╗${NC}"
echo -e "${CYAN}║   AI 朝廷 · 快速安装     ║${NC}"
echo -e "${CYAN}╚══════════════════════════╝${NC}"
echo ""

# 步骤 1: 检查 OpenClaw
echo -e "${BLUE}[1/4] 检查环境...${NC}"
if ! command -v openclaw &>/dev/null; then
  echo -e "${YELLOW}⚠ OpenClaw 未安装，正在安装...${NC}"
  npm install -g openclaw@latest
fi
echo -e "${GREEN}✓${NC} OpenClaw 已安装"

# 步骤 2: 配置 LLM API
echo -e "${BLUE}[2/4] 配置 AI 模型...${NC}"
echo ""
echo "常用 API 提供商："
echo "  - DeepSeek: https://platform.deepseek.com"
echo "  - OpenAI: https://platform.openai.com"
echo "  - Anthropic: https://console.anthropic.com"
echo ""
read -p "API Base URL (如 https://api.deepseek.com/v1): " API_URL
read -s -p "API Key: " API_KEY
echo ""
read -p "模型 ID (如 deepseek-chat, gpt-4o): " MODEL_ID
echo ""

if [ -z "$API_URL" ] || [ -z "$API_KEY" ] || [ -z "$MODEL_ID" ]; then
    echo -e "${RED}✗ API 配置不能为空${NC}"
    exit 1
fi

echo -e "${GREEN}✓${NC} API 配置完成"

# 步骤 3: 选择制度
echo -e "${BLUE}[3/4] 选择制度...${NC}"
echo "  1) 明朝内阁制 (推荐)"
echo "  2) 唐朝三省制"
echo "  3) 现代企业制"
read -p "  请选择 [1-3]: " choice
case "$choice" in
  1) REGIME="ming-neige" ;;
  2) REGIME="tang-sansheng" ;;
  3) REGIME="modern-ceo" ;;
  *) echo -e "${RED}✗ 无效选择${NC}"; exit 1 ;;
esac

# 步骤 4: 安装配置
echo -e "${BLUE}[4/4] 安装配置...${NC}"
CONFIG_DIR="$HOME/.openclaw"
mkdir -p "$CONFIG_DIR"

# 备份现有配置（如果有）
if [ -f "$CONFIG_DIR/openclaw.json" ]; then
  BACKUP_FILE="$CONFIG_DIR/openclaw.json.$(date +%Y%m%d_%H%M%S).bak"
  cp "$CONFIG_DIR/openclaw.json" "$BACKUP_FILE"
  echo -e "  ${YELLOW}✓${NC} 已备份现有配置：$BACKUP_FILE"
fi

# 下载 SOUL.md
echo -e "  ${CYAN}下载 Agent 人设...${NC}"
mkdir -p "$CONFIG_DIR/agents"
for agent in silijian neige duchayuan bingbu hubu libu gongbu xingbu; do
  curl -fsSL "https://raw.githubusercontent.com/wanikua/danghuangshang/main/configs/$REGIME/agents/$agent.md" -o "$CONFIG_DIR/agents/$agent.md" 2>/dev/null || true
done
echo -e "  ${GREEN}✓${NC} Agent 人设已下载"

# 下载配置
TEMPLATE_URL="https://raw.githubusercontent.com/wanikua/danghuangshang/main/configs/$REGIME/openclaw.json"
echo -e "  ${CYAN}下载配置模板...${NC}"
if curl -fsSL "$TEMPLATE_URL" -o "$CONFIG_DIR/openclaw.json" 2>/dev/null; then
  echo -e "${GREEN}✓${NC} 配置已安装：$CONFIG_DIR/openclaw.json"
else
  echo -e "${RED}✗ 下载失败${NC}"
  if [ -f "$BACKUP_FILE" ]; then
    cp "$BACKUP_FILE" "$CONFIG_DIR/openclaw.json"
    echo -e "${YELLOW}✓${NC} 已恢复原配置"
  fi
  exit 1
fi

# 使用 Python 更新 LLM 配置
python3 << PYEOF
import json

config_file = "$CONFIG_DIR/openclaw.json"

with open(config_file, 'r') as f:
    config = json.load(f)

# 更新 models 配置
config['models'] = {
    'providers': {
        'your-provider': {
            'baseUrl': '$API_URL',
            'apiKey': '$API_KEY',
            'api': 'openai',
            'models': [{'id': '$MODEL_ID', 'name': '主模型', 'input': ['text', 'image'], 'contextWindow': 200000, 'maxTokens': 8192}]
        }
    }
}

with open(config_file, 'w') as f:
    json.dump(config, f, indent=2)

print(f"✓ LLM 配置已更新")
PYEOF

echo ""
echo -e "${GREEN}╔══════════════════════════╗${NC}"
echo -e "${GREEN}║   安装完成！             ║${NC}"
echo -e "${GREEN}╚══════════════════════════╝${NC}"
echo ""
echo "下一步："
echo "  1. 编辑配置（如需要）：nano $CONFIG_DIR/openclaw.json"
echo "  2. 填入平台凭证 (飞书 AppID/Secret 或 Discord Token)"
echo "  3. 启动：openclaw gateway start"
echo ""
