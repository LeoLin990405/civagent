#!/bin/bash

# ========================================
# AI 朝廷 · 快速安装脚本
# ========================================
# 支持：
# - 三种制度：明朝/唐朝/现代
# - 多种规模：1/3/5/9/11 Bot
# - 两个平台：飞书/Discord
# ========================================

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
echo "========================================"
echo "   AI 朝廷 · 快速安装向导"
echo "========================================"
echo -e "${NC}"

# 配置目录
CONFIG_DIR="$HOME/.openclaw"
CONFIG_FILE="openclaw.json"

# 创建配置目录
mkdir -p "$CONFIG_DIR"

# ========================================
# 步骤 1: 选择平台
# ========================================
echo -e "${YELLOW}[1/4] 选择部署平台:${NC}"
echo "  1) 飞书 (中国大陆推荐)"
echo "  2) Discord (国际推荐)"
echo ""
read -p "请选择 (1-2): " PLATFORM

case $PLATFORM in
    1)
        PLATFORM_NAME="feishu"
        echo -e "${GREEN}✓ 选择：飞书${NC}"
        ;;
    2)
        PLATFORM_NAME="discord"
        echo -e "${GREEN}✓ 选择：Discord${NC}"
        ;;
    *)
        echo -e "${RED}✗ 无效选择，使用飞书${NC}"
        PLATFORM_NAME="feishu"
        ;;
esac

# ========================================
# 步骤 2: 选择制度
# ========================================
echo ""
echo -e "${YELLOW}[2/4] 选择制度:${NC}"
echo "  1) 明朝内阁制 (传统层级管理)"
echo "  2) 唐朝三省制 (分权制衡管理)"
echo "  3) 现代企业制 (现代企业管理)"
echo ""
read -p "请选择 (1-3): " REGIME

case $REGIME in
    1)
        REGIME_NAME="ming"
        REGIME_LABEL="明朝内阁制"
        echo -e "${GREEN}✓ 选择：$REGIME_LABEL${NC}"
        ;;
    2)
        REGIME_NAME="tang"
        REGIME_LABEL="唐朝三省制"
        echo -e "${GREEN}✓ 选择：$REGIME_LABEL${NC}"
        ;;
    3)
        REGIME_NAME="modern"
        REGIME_LABEL="现代企业制"
        echo -e "${GREEN}✓ 选择：$REGIME_LABEL${NC}"
        ;;
    *)
        echo -e "${RED}✗ 无效选择，使用明朝内阁制${NC}"
        REGIME_NAME="ming"
        REGIME_LABEL="明朝内阁制"
        ;;
esac

# ========================================
# 步骤 3: 选择 Bot 数量
# ========================================
echo ""
echo -e "${YELLOW}[3/4] 选择 Bot 数量:${NC}"

# 根据制度显示不同选项
if [ "$REGIME_NAME" = "ming" ]; then
    echo "  1) 1 Bot - 司礼监 (个人开发者)"
    echo "  2) 3 Bot - 司礼监 + 内阁 + 工部 (小团队⭐推荐)"
    echo "  3) 5 Bot - 司礼监 + 内阁 + 都察院 + 兵部 + 工部 (中型团队)"
    echo "  4) 9 Bot - 完整版 (大型团队)"
elif [ "$REGIME_NAME" = "tang" ]; then
    echo "  1) 1 Bot - 中书省 (个人开发者)"
    echo "  2) 3 Bot - 中书省 + 门下省 + 尚书省 (小团队⭐推荐)"
    echo "  3) 11 Bot - 完整版 (大型团队)"
else
    echo "  1) 1 Bot - CEO (个人开发者)"
    echo "  2) 3 Bot - CEO + CTO + QA (小团队⭐推荐)"
    echo "  3) 9 Bot - 完整版 (大型团队)"
fi
echo ""
read -p "请选择：" BOT_CHOICE

# 根据制度和选择确定配置文件
if [ "$REGIME_NAME" = "ming" ]; then
    case $BOT_CHOICE in
        1) CONFIG_TEMPLATE="openclaw-1bot.json" ;;
        2) CONFIG_TEMPLATE="openclaw-3bot.json" ;;
        3) CONFIG_TEMPLATE="openclaw-5bot.json" ;;
        *) CONFIG_TEMPLATE="openclaw.json" ;;
    esac
elif [ "$REGIME_NAME" = "tang" ]; then
    case $BOT_CHOICE in
        1) CONFIG_TEMPLATE="openclaw-1bot.json" ;;
        2) CONFIG_TEMPLATE="openclaw-3bot.json" ;;
        *) CONFIG_TEMPLATE="openclaw.json" ;;
    esac
else
    case $BOT_CHOICE in
        1) CONFIG_TEMPLATE="openclaw-1bot.json" ;;
        2) CONFIG_TEMPLATE="openclaw-3bot.json" ;;
        *) CONFIG_TEMPLATE="openclaw.json" ;;
    esac
fi

CONFIG_SOURCE="$HOME/clawd/danghuangshang/configs/feishu-$REGIME_NAME/$CONFIG_TEMPLATE"

echo -e "${GREEN}✓ 配置模板：$CONFIG_TEMPLATE${NC}"

# ========================================
# 步骤 4: 收集凭证
# ========================================
echo ""
echo -e "${YELLOW}[4/4] 收集凭证:${NC}"

if [ "$PLATFORM_NAME" = "feishu" ]; then
    echo ""
    echo "请前往飞书开放平台创建应用："
    echo "https://open.feishu.cn/app"
    echo ""
    read -p "App ID: " APP_ID
    read -s -p "App Secret: " APP_SECRET
    echo ""
    
    # 复制配置并替换占位符
    cp "$CONFIG_SOURCE" "$CONFIG_DIR/$CONFIG_FILE"
    sed -i "s/YOUR_FEISHU_APP_ID/$APP_ID/g" "$CONFIG_DIR/$CONFIG_FILE"
    sed -i "s/YOUR_FEISHU_APP_SECRET/$APP_SECRET/g" "$CONFIG_DIR/$CONFIG_FILE"
    
    # 处理各个 Bot 的占位符
    sed -i "s/YOUR_SILIJIAN_APP_ID/$APP_ID/g" "$CONFIG_DIR/$CONFIG_FILE"
    sed -i "s/YOUR_SILIJIAN_APP_SECRET/$APP_SECRET/g" "$CONFIG_DIR/$CONFIG_FILE"
    sed -i "s/YOUR_NEIGE_APP_ID/$APP_ID/g" "$CONFIG_DIR/$CONFIG_FILE"
    sed -i "s/YOUR_NEIGE_APP_SECRET/$APP_SECRET/g" "$CONFIG_DIR/$CONFIG_FILE"
    sed -i "s/YOUR_GONGBU_APP_ID/$APP_ID/g" "$CONFIG_DIR/$CONFIG_FILE"
    sed -i "s/YOUR_GONGBU_APP_SECRET/$APP_SECRET/g" "$CONFIG_DIR/$CONFIG_FILE"
    
elif [ "$PLATFORM_NAME" = "discord" ]; then
    echo ""
    echo "请前往 Discord Developer Portal 创建 Bot："
    echo "https://discord.com/developers/applications"
    echo ""
    read -p "Bot Token: " BOT_TOKEN
    
    # 复制配置并替换占位符
    # Discord 配置需要额外处理
    echo -e "${YELLOW}⚠ Discord 配置需要手动编辑，请参照文档${NC}"
fi

# ========================================
# 完成
# ========================================
echo ""
echo -e "${GREEN}========================================"
echo "   安装完成！"
echo "========================================${NC}"
echo ""
echo "📋 配置信息:"
echo "  平台：$PLATFORM_NAME"
echo "  制度：$REGIME_LABEL"
echo "  配置：$CONFIG_TEMPLATE"
echo ""
echo "🚀 下一步:"
echo "  1. 检查配置：cat $CONFIG_DIR/$CONFIG_FILE"
echo "  2. 启动服务：openclaw gateway start"
echo "  3. 查看状态：openclaw status"
echo ""
echo "📖 文档:"
echo "  https://github.com/wanikua/danghuangshang"
echo ""
