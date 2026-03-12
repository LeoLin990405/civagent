#!/bin/bash
set -e

# ============================================
# 🏛️ AI 朝廷 Docker 初始化脚本
# ============================================
# 用法：
#   docker compose exec court /init-docker.sh
#   docker compose run --rm court /init-docker.sh
# ============================================

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

CONFIG_DIR="${OPENCLAW_CONFIG_DIR:-$HOME/.openclaw}"
CONFIG_FILE="$CONFIG_DIR/openclaw.json"
WORKSPACE="${OPENCLAW_WORKSPACE:-$HOME/clawd}"

echo ""
echo -e "${CYAN}🏛️ AI 朝廷 Docker 初始化向导${NC}"
echo "================================"
echo ""

# ---- 步骤 1：选择部署模式 ----
echo -e "${YELLOW}📋 步骤 1/4：选择部署模式${NC}"
echo ""
echo "  1) 单 Agent（司礼监）— 最简模式，一个 Bot 管所有事"
echo "  2) 全六部（10 Agent）— 司礼监调度，各部门独立执行"
echo ""
read -p "请选择 [1/2，默认 1]: " MODE
MODE=${MODE:-1}

# ---- 步骤 2：选择平台 ----
echo ""
echo -e "${YELLOW}📋 步骤 2/4：选择交互平台${NC}"
echo ""
echo "  1) Discord（海外推荐）"
echo "  2) 飞书（国内推荐）"
echo "  3) 纯 WebUI（不需要 Bot）"
echo ""
read -p "请选择 [1/2/3，默认 1]: " PLATFORM
PLATFORM=${PLATFORM:-1}

# ---- 步骤 3：配置模型 ----
echo ""
echo -e "${YELLOW}📋 步骤 3/4：配置 AI 模型${NC}"
echo ""
echo "  常用 API 提供商："
echo "  - Anthropic Claude: https://console.anthropic.com"
echo "  - OpenAI: https://platform.openai.com"
echo "  - DeepSeek: https://platform.deepseek.com"
echo "  - OpenRouter: https://openrouter.ai"
echo ""
read -p "API Base URL（如 https://api.deepseek.com/v1）: " API_URL
read -p "API Key: " API_KEY
read -p "模型 ID（如 deepseek-chat、gpt-4o、claude-sonnet-4-20250514）: " MODEL_ID

if [ -z "$API_URL" ] || [ -z "$API_KEY" ] || [ -z "$MODEL_ID" ]; then
    echo -e "${RED}✗ API 配置不能为空${NC}"
    exit 1
fi

# 自动检测 API 格式
API_FORMAT="openai"
if echo "$API_URL" | grep -qi "anthropic"; then
    API_FORMAT="anthropic-messages"
fi

# ---- 步骤 4：配置平台 ----
echo ""
echo -e "${YELLOW}📋 步骤 4/4：配置平台凭证${NC}"
echo ""

CHANNEL_CONFIG=""
BINDINGS=""

if [ "$PLATFORM" = "1" ]; then
    echo "Discord Bot 配置："
    echo "  1. 去 https://discord.com/developers/applications 创建 Bot"
    echo "  2. 开启 Message Content Intent + Server Members Intent"
    echo "  3. 邀请 Bot 到你的服务器"
    echo ""
    read -p "Discord Bot Token: " BOT_TOKEN
    if [ -z "$BOT_TOKEN" ]; then
        echo -e "${RED}✗ Bot Token 不能为空${NC}"
        exit 1
    fi
    CHANNEL_CONFIG='"discord": {
      "enabled": true,
      "groupPolicy": "open",
      "allowBots": true,
      "accounts": {
        "silijian": {
          "botName": "司礼监",
          "token": "'"$BOT_TOKEN"'",
          "groupPolicy": "open"
        }
      }
    }'
    BINDINGS='{ "agentId": "silijian", "match": { "channel": "discord", "accountId": "silijian" } }'

elif [ "$PLATFORM" = "2" ]; then
    echo "飞书配置："
    echo "  1. 去 https://open.feishu.cn/app 创建企业自建应用"
    echo "  2. 添加「机器人」能力"
    echo "  3. 配置事件订阅回调：http://你的IP:18789/webhooks/feishu"
    echo ""
    read -p "App ID: " APP_ID
    read -p "App Secret: " APP_SECRET
    if [ -z "$APP_ID" ] || [ -z "$APP_SECRET" ]; then
        echo -e "${RED}✗ App ID 和 App Secret 不能为空${NC}"
        exit 1
    fi
    CHANNEL_CONFIG='"feishu": {
      "enabled": true,
      "accounts": {
        "silijian": {
          "botName": "司礼监",
          "appId": "'"$APP_ID"'",
          "appSecret": "'"$APP_SECRET"'"
        }
      }
    }'
    BINDINGS='{ "agentId": "silijian", "match": { "channel": "feishu", "accountId": "silijian" } }'

elif [ "$PLATFORM" = "3" ]; then
    echo -e "${GREEN}WebUI 模式不需要额外配置，启动后访问 http://localhost:18789 即可${NC}"
    CHANNEL_CONFIG=""
    BINDINGS='{ "agentId": "silijian", "match": {} }'
fi

# ---- 生成配置 ----
echo ""
echo -e "${CYAN}⚙️ 生成配置文件...${NC}"

mkdir -p "$CONFIG_DIR"

# Agent 列表
if [ "$MODE" = "2" ]; then
    AGENTS_LIST=',
      { "id": "neige", "name": "内阁", "identity": { "theme": "你是内阁首辅，专精战略决策、方案审议、全局规划。回答用中文。" }, "sandbox": { "mode": "off" } },
      { "id": "duchayuan", "name": "都察院", "identity": { "theme": "你是都察院御史，专精监察审计、代码审查、质量把控。回答用中文。" }, "sandbox": { "mode": "all", "scope": "agent" } },
      { "id": "bingbu", "name": "兵部", "identity": { "theme": "你是兵部尚书，专精软件工程、系统架构。回答用中文。" }, "sandbox": { "mode": "all", "scope": "agent" } },
      { "id": "hubu", "name": "户部", "identity": { "theme": "你是户部尚书，专精财务分析、成本管控。回答用中文。" }, "sandbox": { "mode": "off" } },
      { "id": "libu", "name": "礼部", "identity": { "theme": "你是礼部尚书，专精品牌营销、内容创作。回答用中文。" }, "sandbox": { "mode": "off" } },
      { "id": "gongbu", "name": "工部", "identity": { "theme": "你是工部尚书，专精 DevOps、服务器运维。回答用中文。" }, "sandbox": { "mode": "off" } },
      { "id": "libu2", "name": "吏部", "identity": { "theme": "你是吏部尚书，专精项目管理、团队协调。回答用中文。" }, "sandbox": { "mode": "off" } },
      { "id": "xingbu", "name": "刑部", "identity": { "theme": "你是刑部尚书，专精法务合规、知识产权。回答用中文。" }, "sandbox": { "mode": "off" } },
      { "id": "hanlinyuan", "name": "翰林院", "identity": { "theme": "你是翰林院学士，专精学术研究、知识整理、文档撰写。回答用中文。" }, "sandbox": { "mode": "off" } }'
    SUBAGENTS='"subagents": { "allowAgents": ["neige","duchayuan","bingbu","hubu","libu","gongbu","libu2","xingbu","hanlinyuan"] },'
    SILIJIAN_IDENTITY="你是AI朝廷的司礼监大内总管。你的职责是规划调度，不是亲自执行。使用 sessions_spawn 将任务派发给对应部门。"
else
    AGENTS_LIST=""
    SUBAGENTS=""
    SILIJIAN_IDENTITY="你是AI朝廷的司礼监，忠诚干练，说话简练干脆。用中文回答。"
fi

CHANNELS_SECTION=""
if [ -n "$CHANNEL_CONFIG" ]; then
    CHANNELS_SECTION='"channels": { '"$CHANNEL_CONFIG"' },'
fi

cat > "$CONFIG_FILE" << CONFIGEOF
{
  "models": {
    "providers": {
      "provider": {
        "baseUrl": "$API_URL",
        "apiKey": "$API_KEY",
        "api": "$API_FORMAT",
        "models": [
          { "id": "$MODEL_ID", "name": "$MODEL_ID", "input": ["text", "image"], "contextWindow": 200000, "maxTokens": 8192 }
        ]
      }
    }
  },
  "agents": {
    "defaults": {
      "workspace": "$WORKSPACE",
      "model": { "primary": "provider/$MODEL_ID" },
      "sandbox": { "mode": "non-main" }
    },
    "list": [
      {
        "id": "silijian",
        "name": "司礼监",
        "model": { "primary": "provider/$MODEL_ID" },
        "identity": { "theme": "$SILIJIAN_IDENTITY" },
        $SUBAGENTS
        "sandbox": { "mode": "off" }
      }$AGENTS_LIST
    ]
  },
  $CHANNELS_SECTION
  "bindings": [
    $BINDINGS
  ]
}
CONFIGEOF

echo -e "${GREEN}✓ 配置文件已生成：$CONFIG_FILE${NC}"

# ---- 初始化工作区 ----
mkdir -p "$WORKSPACE/memory" "$WORKSPACE/skills"

if [ ! -f "$WORKSPACE/SOUL.md" ]; then
cat > "$WORKSPACE/SOUL.md" << 'EOF'
# SOUL.md - 朝廷行为准则

## 铁律
1. 废话不要多 — 说重点
2. 汇报要及时 — 做完就说
3. 做事要靠谱 — 先想后做

## 沟通风格
- 中文为主
- 直接说结论，需要细节再展开
EOF
echo -e "${GREEN}✓ SOUL.md 已创建${NC}"
fi

if [ ! -f "$WORKSPACE/USER.md" ]; then
    read -p "你希望 AI 怎么称呼你？（默认：陛下）: " NICKNAME
    NICKNAME=${NICKNAME:-陛下}
    cat > "$WORKSPACE/USER.md" << EOF
# USER.md - 关于你

- **称呼:** $NICKNAME
- **语言:** 中文
- **风格:** 简洁高效
EOF
    echo -e "${GREEN}✓ USER.md 已创建${NC}"
fi

# ---- 完成 ----
echo ""
echo "================================"
echo -e "${GREEN}🎉 初始化完成！${NC}"
echo "================================"
echo ""
echo "  配置文件: $CONFIG_FILE"
echo "  工作区:   $WORKSPACE"
echo ""
if [ "$PLATFORM" = "1" ]; then
    echo "  下一步：在 Discord 里 @你的 Bot 说句话"
elif [ "$PLATFORM" = "2" ]; then
    echo "  下一步：在飞书里给机器人发消息"
else
    echo "  下一步：打开 http://localhost:18789"
fi
echo ""
echo "  重启容器使配置生效："
echo "    docker compose restart"
echo ""
