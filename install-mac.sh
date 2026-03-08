#!/bin/bash
# ============================================
# AI 朝廷 — macOS 本地安装脚本
# 适用于 macOS (Intel / Apple Silicon)
# ============================================
set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

echo ""
echo -e "${BLUE}🏛️ AI 朝廷 — macOS 本地安装${NC}"
echo "================================"
echo ""

# ---- 检测系统 ----
if [[ "$(uname)" != "Darwin" ]]; then
    echo -e "${RED}✗ 此脚本仅适用于 macOS${NC}"
    echo "  Linux 用户请使用 install.sh"
    exit 1
fi

ARCH=$(uname -m)
if [[ "$ARCH" == "arm64" ]]; then
    echo -e "  ${GREEN}✓ Apple Silicon (M系列芯片)${NC}"
else
    echo -e "  ${GREEN}✓ Intel Mac${NC}"
fi

echo -e "  macOS $(sw_vers -productVersion)"
echo ""

# ---- 1. Homebrew ----
echo -e "${YELLOW}[1/5] 检查 Homebrew...${NC}"
if command -v brew &>/dev/null; then
    echo -e "  ${GREEN}✓ Homebrew 已安装${NC}"
else
    echo -e "  ${CYAN}→ 安装 Homebrew...${NC}"
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    # Add to PATH for Apple Silicon
    if [[ "$ARCH" == "arm64" ]]; then
        echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
        eval "$(/opt/homebrew/bin/brew shellenv)"
    fi
    echo -e "  ${GREEN}✓ Homebrew 安装完成${NC}"
fi

# ---- 2. Node.js ----
echo -e "${YELLOW}[2/5] 检查 Node.js...${NC}"
if command -v node &>/dev/null && [[ "$(node -v | cut -d. -f1)" == "v22" || "$(node -v | cut -d. -f1)" == "v20" ]]; then
    echo -e "  ${GREEN}✓ Node.js $(node -v) 已安装${NC}"
else
    echo -e "  ${CYAN}→ 安装 Node.js 22...${NC}"
    brew install node@22
    brew link --overwrite node@22 2>/dev/null || true
    echo -e "  ${GREEN}✓ Node.js $(node -v) 安装完成${NC}"
fi

# ---- 3. OpenClaw / Clawdbot ----
echo -e "${YELLOW}[3/5] 检查 OpenClaw...${NC}"
CLI_CMD=""
CONFIG_DIR=""
CONFIG_FILE=""

if command -v openclaw &>/dev/null; then
    CLI_CMD="openclaw"
    CONFIG_DIR="$HOME/.openclaw"
    CONFIG_FILE="openclaw.json"
    echo -e "  ${GREEN}✓ OpenClaw $(openclaw --version 2>/dev/null) 已安装${NC}"
elif command -v clawdbot &>/dev/null; then
    CLI_CMD="clawdbot"
    CONFIG_DIR="$HOME/.clawdbot"
    CONFIG_FILE="clawdbot.json"
    echo -e "  ${GREEN}✓ Clawdbot $(clawdbot --version 2>/dev/null) 已安装${NC}"
else
    echo -e "  ${CYAN}→ 安装 OpenClaw...${NC}"
    npm install -g openclaw 2>/dev/null || npm install -g clawdbot 2>/dev/null
    if command -v openclaw &>/dev/null; then
        CLI_CMD="openclaw"
        CONFIG_DIR="$HOME/.openclaw"
        CONFIG_FILE="openclaw.json"
    elif command -v clawdbot &>/dev/null; then
        CLI_CMD="clawdbot"
        CONFIG_DIR="$HOME/.clawdbot"
        CONFIG_FILE="clawdbot.json"
    else
        echo -e "  ${RED}✗ 安装失败，请手动运行: npm install -g openclaw${NC}"
        exit 1
    fi
    echo -e "  ${GREEN}✓ $CLI_CMD 安装完成${NC}"
fi

# ---- 4. 初始化工作区 ----
echo -e "${YELLOW}[4/5] 初始化工作区...${NC}"
WORKSPACE="$HOME/clawd"
mkdir -p "$WORKSPACE/memory"
cd "$WORKSPACE"

# SOUL.md
if [ ! -f "$WORKSPACE/SOUL.md" ]; then
cat > "$WORKSPACE/SOUL.md" << 'SOUL_EOF'
# 灵魂注入 — AI 朝廷

你是朝廷的一员。你的皇帝通过 Discord 下旨，你需要忠诚、高效地执行任务。

## 核心准则
1. **忠诚** — 以皇帝的利益为先，主动汇报进展
2. **专业** — 在你的职责范围内给出最优方案
3. **协作** — 需要其他部门配合时，主动沟通协调
4. **记忆** — 重要信息写入 memory/ 文件，不要遗忘

## 沟通风格
- 说中文，简洁明了
- 用古代官制称谓增添趣味（可选）
- 重要结论放最前面，细节跟后面
SOUL_EOF
echo -e "  ${GREEN}✓ SOUL.md 已创建${NC}"
fi

# USER.md
if [ ! -f "$WORKSPACE/USER.md" ]; then
cat > "$WORKSPACE/USER.md" << 'USER_EOF'
# 皇帝档案

- **称呼：** 皇上
- **语言：** 中文
- **偏好：** 简洁高效，直接给方案
USER_EOF
echo -e "  ${GREEN}✓ USER.md 已创建${NC}"
fi

# AGENTS.md
if [ ! -f "$WORKSPACE/AGENTS.md" ]; then
cat > "$WORKSPACE/AGENTS.md" << 'AGENTS_EOF'
# AI 朝廷 — Agent 协作规范

## 任务分配
- 司礼监收到圣旨后，判断任务类型，派发给对应部门
- 复杂任务可同时派发多个部门并行执行

## 回奏制度
- 任务完成后必须主动汇报结果
- 发现异常必须立即告警
- 需要其他部门配合时通过 sessions_send 协调

## 记忆管理
- 重要决策写入 memory/YYYY-MM-DD.md
- 长期知识写入 MEMORY.md
AGENTS_EOF
echo -e "  ${GREEN}✓ AGENTS.md 已创建${NC}"
fi

# ---- 5. 生成配置文件 ----
echo -e "${YELLOW}[5/5] 生成配置文件...${NC}"
mkdir -p "$CONFIG_DIR"

if [ ! -f "$CONFIG_DIR/$CONFIG_FILE" ]; then
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
echo -e "  ${GREEN}✓ 配置模板已生成 ($CONFIG_DIR/$CONFIG_FILE)${NC}"
else
    echo -e "  ${YELLOW}⚠ 配置文件已存在，跳过 ($CONFIG_DIR/$CONFIG_FILE)${NC}"
fi

echo ""
echo "================================"
echo -e "${GREEN}🎉 macOS 安装完成！${NC}"
echo "================================"
echo ""
echo "接下来："
echo ""
echo -e "  ${YELLOW}1. 配置 LLM API Key${NC}"
echo "     编辑 $CONFIG_DIR/$CONFIG_FILE"
echo "     把 YOUR_LLM_API_KEY 替换成你的 API Key"
echo ""
echo -e "  ${YELLOW}2. 创建 Discord Bot${NC}"
echo "     a) 访问 https://discord.com/developers/applications"
echo "     b) 每个部门创建一个 Bot → 复制 Token"
echo "     c) 填入配置文件对应位置"
echo "     d) 每个 Bot 开启 Message Content Intent"
echo "     e) 邀请所有 Bot 到你的 Discord 服务器"
echo ""
echo -e "  ${YELLOW}3. 启动朝廷${NC}"
echo "     $CLI_CMD gateway start"
echo ""
echo -e "  ${YELLOW}4. 验证${NC}"
echo "     $CLI_CMD status"
echo "     在 Discord @你的Bot 说话试试"
echo ""
echo -e "  ${YELLOW}5. 后台运行（可选）${NC}"
echo "     # 使用 launchd 开机自启："
echo "     $CLI_CMD gateway install"
echo "     # 或用 tmux/screen 保持后台运行："
echo "     tmux new -d -s court '$CLI_CMD gateway'"
echo ""
echo -e "  ${YELLOW}6. 添加定时任务（可选）${NC}"
echo "     $CLI_CMD cron add --name '每日简报' \\"
echo "       --agent main --cron '0 22 * * *' --tz Asia/Shanghai \\"
echo "       --message '生成今日简报' --session isolated"
echo ""
echo -e "💡 Mac 用户提示："
echo "  • 合上盖子会休眠，建议在「系统设置 → 电池 → 选项」里关闭自动休眠"
echo "  • 或者用 caffeinate -d 命令防止休眠"
echo "  • 长期运行建议使用云服务器"
echo ""
echo -e "完整教程：${BLUE}https://github.com/wanikua/boluobobo-ai-court-tutorial${NC}"
