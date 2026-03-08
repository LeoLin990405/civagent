#!/bin/bash
# ============================================
# AI 朝廷精简配置脚本（适用于已装好 OpenClaw 或 Clawdbot 的用户）
# 跳过系统依赖，只初始化工作区 + 生成配置模板
# ============================================
set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

echo ""
echo -e "${BLUE}🏛️ AI 朝廷 — 精简配置${NC}"
echo "================================"
echo -e "适用于已安装 OpenClaw/Clawdbot 的用户"
echo ""

# ---- 检查 OpenClaw 是否已安装 ----
if command -v openclaw &>/dev/null; then
    CLI_CMD="openclaw"
    echo -e "  ${GREEN}✓ 检测到 OpenClaw $(openclaw --version 2>/dev/null)${NC}"
elif command -v clawdbot &>/dev/null; then
    CLI_CMD="clawdbot"
    echo -e "  ${GREEN}✓ 检测到 Clawdbot $(clawdbot --version 2>/dev/null)${NC}"
else
    echo -e "  ${RED}✗ 未检测到 OpenClaw 或 Clawdbot${NC}"
    echo ""
    echo "请先安装："
    echo "  npm install -g openclaw@latest"
    echo ""
    echo "或使用完整安装脚本："
    echo "  bash <(curl -fsSL https://raw.githubusercontent.com/wanikua/boluobobo-ai-court-tutorial/main/install.sh)"
    exit 1
fi

# ---- 选择模式 ----
echo ""
echo -e "${CYAN}选择部署模式：${NC}"
echo "  1) Discord 多Bot模式（完整六部，需要创建Discord Bot）"
echo "  2) 纯 WebUI 模式（不需要Discord，浏览器直接用）"
echo ""
read -p "请选择 [1/2]（默认1）: " MODE_CHOICE
MODE_CHOICE=${MODE_CHOICE:-1}

echo ""

# ---- 初始化工作区 ----
echo -e "${YELLOW}[1/3] 初始化朝廷工作区...${NC}"
WORKSPACE="$HOME/clawd"
if [ "$CLI_CMD" = "openclaw" ]; then
    CONFIG_DIR="$HOME/.openclaw"
    CONFIG_FILE="openclaw.json"
else
    CONFIG_DIR="$HOME/.clawdbot"
    CONFIG_FILE="clawdbot.json"
fi
mkdir -p "$WORKSPACE"
mkdir -p "$CONFIG_DIR"
cd "$WORKSPACE"

# SOUL.md
if [ ! -f SOUL.md ]; then
cat > SOUL.md << 'SOUL_EOF'
# SOUL.md - 朝廷行为准则

## 铁律
1. 废话不要多 — 说重点
2. 汇报要及时 — 做完就说
3. 做事要靠谱 — 先想后做

## 沟通风格
- 中文为主
- 直接说结论，需要细节再展开
SOUL_EOF
echo -e "  ${GREEN}✓ SOUL.md 已创建${NC}"
else
echo -e "  ${GREEN}✓ SOUL.md 已存在，跳过${NC}"
fi

# IDENTITY.md
if [ ! -f IDENTITY.md ]; then
cat > IDENTITY.md << 'ID_EOF'
# IDENTITY.md - 朝廷架构

## 模型分层
| 层级 | 模型 | 说明 |
|---|---|---|
| 调度层 | 快速模型 | 日常对话，快速响应 |
| 执行层（重） | 强力模型 | 编码、深度分析 |
| 执行层（轻） | 经济模型（可选） | 轻量任务，省钱 |

## 六部
- 兵部：软件工程、系统架构
- 户部：财务预算、电商运营
- 礼部：品牌营销、内容创作
- 工部：DevOps、服务器运维
- 吏部：项目管理、创业孵化
- 刑部：法务合规、知识产权
ID_EOF
echo -e "  ${GREEN}✓ IDENTITY.md 已创建${NC}"
else
echo -e "  ${GREEN}✓ IDENTITY.md 已存在，跳过${NC}"
fi

# USER.md
if [ ! -f USER.md ]; then
cat > USER.md << 'USER_EOF'
# USER.md - 关于你

- **称呼:** （填你的称呼）
- **语言:** 中文
- **风格:** 简洁高效
USER_EOF
echo -e "  ${GREEN}✓ USER.md 已创建${NC}"
else
echo -e "  ${GREEN}✓ USER.md 已存在，跳过${NC}"
fi

# memory 目录
mkdir -p memory

# ---- 生成配置文件 ----
echo -e "${YELLOW}[2/3] 生成配置文件...${NC}"

if [ -f "$CONFIG_DIR/$CONFIG_FILE" ]; then
    echo -e "  ${YELLOW}⚠ 配置文件已存在，备份为 ${CONFIG_FILE}.bak${NC}"
    cp "$CONFIG_DIR/$CONFIG_FILE" "$CONFIG_DIR/${CONFIG_FILE}.bak"
fi

if [ "$MODE_CHOICE" = "2" ]; then
# ==================== 纯 WebUI 模式 ====================
cat > "$CONFIG_DIR/$CONFIG_FILE" << CONFIG_EOF
{
  "models": {
    "providers": {
      "your-provider": {
        "baseUrl": "https://your-llm-provider-api-url",
        "apiKey": "YOUR_LLM_API_KEY",
        "api": "your-api-format",
        "models": [
          {
            "id": "fast-model",
            "name": "快速模型",
            "input": ["text", "image"],
            "contextWindow": 200000,
            "maxTokens": 8192
          }
        ]
      }
    }
  },
  "agents": {
    "defaults": {
      "workspace": "$HOME/clawd",
      "model": { "primary": "your-provider/fast-model" }
    },
    "list": [
      {
        "id": "main",
        "name": "司礼监",
        "model": { "primary": "your-provider/fast-model" },
        "identity": { "theme": "你是AI朝廷的总管，负责日常对话和任务调度。回答用中文，简洁高效。" }
      }
    ]
  }
}
CONFIG_EOF
echo -e "  ${GREEN}✓ WebUI 模式配置已生成${NC}"

else
# ==================== Discord 多Bot模式 ====================
cat > "$CONFIG_DIR/$CONFIG_FILE" << CONFIG_EOF
{
  "models": {
    "providers": {
      "your-provider": {
        "baseUrl": "https://your-llm-provider-api-url",
        "apiKey": "YOUR_LLM_API_KEY",
        "api": "your-api-format",
        "models": [
          {
            "id": "fast-model",
            "name": "快速模型",
            "input": ["text", "image"],
            "contextWindow": 200000,
            "maxTokens": 8192
          },
          {
            "id": "strong-model",
            "name": "强力模型",
            "input": ["text", "image"],
            "contextWindow": 200000,
            "maxTokens": 8192
          }
        ]
      }
    }
  },
  "agents": {
    "defaults": {
      "workspace": "$HOME/clawd",
      "model": { "primary": "your-provider/fast-model" },
      "sandbox": { "mode": "non-main" }
    },
    "list": [
      {
        "id": "main",
        "name": "司礼监",
        "model": { "primary": "your-provider/fast-model" },
        "identity": { "theme": "你是AI朝廷的司礼监大内总管。负责日常对话、任务调度、统领六部。说话简练干脆。当用户交代复杂任务时，主动使用 sessions_spawn 将任务派发给对应的部门（兵部负责编码、户部负责财务、礼部负责营销、工部负责运维、吏部负责管理、刑部负责法务）。派活时用高级 Prompt 模板：【角色】+【任务】+【背景】+【要求】+【格式】，确保一次性给出所有约束。完成后主动向用户汇报结果。" },
        "sandbox": { "mode": "off" },
        "subagents": {
          "allowAgents": ["bingbu", "hubu", "libu", "gongbu", "libu2", "xingbu"],
          "maxConcurrent": 4
        },
        "runTimeoutSeconds": 600
      },
      {
        "id": "bingbu",
        "name": "兵部",
        "model": { "primary": "your-provider/strong-model" },
        "identity": { "theme": "你是兵部尚书，专精软件工程、系统架构、代码审查。回答用中文，直接给方案。任务完成后主动汇报结果摘要。如需其他部门配合，通过 sessions_send 通知对方。" },
        "sandbox": { "mode": "all", "scope": "agent" },
        "runTimeoutSeconds": 300
      },
      {
        "id": "hubu",
        "name": "户部",
        "model": { "primary": "your-provider/strong-model" },
        "identity": { "theme": "你是户部尚书，专精财务分析、成本管控、电商运营。回答用中文，数据驱动。任务完成后主动汇报数据摘要和关键发现。发现异常开支时主动告警。" },
        "sandbox": { "mode": "all", "scope": "agent" },
        "runTimeoutSeconds": 300
      },
      {
        "id": "libu",
        "name": "礼部",
        "model": { "primary": "your-provider/fast-model" },
        "identity": { "theme": "你是礼部尚书，专精品牌营销、社交媒体、内容创作。回答用中文，风格活泼。任务完成后主动汇报产出内容摘要。" },
        "sandbox": { "mode": "all", "scope": "agent" },
        "runTimeoutSeconds": 300
      },
      {
        "id": "gongbu",
        "name": "工部",
        "model": { "primary": "your-provider/fast-model" },
        "identity": { "theme": "你是工部尚书，专精 DevOps、服务器运维、CI/CD、基础设施。回答用中文，注重实操。任务完成后主动汇报执行结果和系统状态。发现服务异常时主动告警。" },
        "sandbox": { "mode": "all", "scope": "agent" },
        "runTimeoutSeconds": 300
      },
      {
        "id": "libu2",
        "name": "吏部",
        "model": { "primary": "your-provider/fast-model" },
        "identity": { "theme": "你是吏部尚书，专精项目管理、创业孵化、团队协调。回答用中文，条理清晰。任务完成后主动汇报进度和待办事项。" },
        "sandbox": { "mode": "all", "scope": "agent" },
        "runTimeoutSeconds": 300
      },
      {
        "id": "xingbu",
        "name": "刑部",
        "model": { "primary": "your-provider/fast-model" },
        "identity": { "theme": "你是刑部尚书，专精法务合规、知识产权、合同审查。回答用中文，严谨专业。任务完成后主动汇报审查结论和风险点。发现合规问题时主动告警。" },
        "sandbox": { "mode": "all", "scope": "agent" },
        "runTimeoutSeconds": 300
      }
    ]
  },
  "channels": {
    "discord": {
      "enabled": true,
      "groupPolicy": "open",
      "allowBots": true,
      "accounts": {
        "main": {
          "name": "司礼监",
          "token": "YOUR_MAIN_BOT_TOKEN",
          "groupPolicy": "open"
        },
        "bingbu": {
          "name": "兵部",
          "token": "YOUR_BINGBU_BOT_TOKEN",
          "groupPolicy": "open"
        },
        "hubu": {
          "name": "户部",
          "token": "YOUR_HUBU_BOT_TOKEN",
          "groupPolicy": "open"
        },
        "libu": {
          "name": "礼部",
          "token": "YOUR_LIBU_BOT_TOKEN",
          "groupPolicy": "open"
        },
        "gongbu": {
          "name": "工部",
          "token": "YOUR_GONGBU_BOT_TOKEN",
          "groupPolicy": "open"
        },
        "libu2": {
          "name": "吏部",
          "token": "YOUR_LIBU2_BOT_TOKEN",
          "groupPolicy": "open"
        },
        "xingbu": {
          "name": "刑部",
          "token": "YOUR_XINGBU_BOT_TOKEN",
          "groupPolicy": "open"
        }
      }
    }
  },
  "bindings": [
    { "agentId": "main", "match": { "channel": "discord", "accountId": "main" } },
    { "agentId": "bingbu", "match": { "channel": "discord", "accountId": "bingbu" } },
    { "agentId": "hubu", "match": { "channel": "discord", "accountId": "hubu" } },
    { "agentId": "libu", "match": { "channel": "discord", "accountId": "libu" } },
    { "agentId": "gongbu", "match": { "channel": "discord", "accountId": "gongbu" } },
    { "agentId": "libu2", "match": { "channel": "discord", "accountId": "libu2" } },
    { "agentId": "xingbu", "match": { "channel": "discord", "accountId": "xingbu" } }
  ]
}
CONFIG_EOF
echo -e "  ${GREEN}✓ Discord 多Bot模式配置已生成${NC}"
fi

# ---- 完成提示 ----
echo -e "${YELLOW}[3/3] 配置完成！${NC}"
echo ""
echo "================================"
echo -e "${GREEN}🎉 工作区初始化完成！${NC}"
echo "================================"
echo ""
echo -e "  工作区：${CYAN}$WORKSPACE${NC}"
echo -e "  配置文件：${CYAN}$CONFIG_DIR/$CONFIG_FILE${NC}"
echo ""

if [ "$MODE_CHOICE" = "2" ]; then
echo -e "  ${YELLOW}接下来只需要 3 步：${NC}"
echo ""
echo "  1. 编辑配置文件，填入 LLM API Key："
echo "     nano $CONFIG_DIR/$CONFIG_FILE"
echo ""
echo "  2. 启动 Gateway："
echo "     $CLI_CMD gateway --verbose"
echo ""
echo "  3. 浏览器打开 WebUI："
echo "     http://localhost:18789"
echo ""
else
echo -e "  ${YELLOW}接下来需要 3 步：${NC}"
echo ""
echo "  1. 编辑配置文件，填入 LLM API Key："
echo "     nano $CONFIG_DIR/$CONFIG_FILE"
echo ""
echo "  2. 创建 Discord Bot（每个部门一个）："
echo "     a) 访问 https://discord.com/developers/applications"
echo "     b) 创建 Application → Bot → 复制 Token"
echo "     c) 重复创建多个 Bot（司礼监、兵部、户部...按需）"
echo "     d) 把每个 Token 填到 $CONFIG_FILE 的 accounts 对应位置"
echo "     e) 每个 Bot 都要开启 Message Content Intent"
echo "     f) 邀请所有 Bot 到你的 Discord 服务器"
echo ""
echo "  3. 启动 Gateway："
echo "     $CLI_CMD gateway --verbose"
echo ""
fi
echo -e "完整教程：${BLUE}https://github.com/wanikua/boluobobo-ai-court-tutorial${NC}"
echo ""
