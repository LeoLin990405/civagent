#!/bin/bash
# 飞书单 Bot 快速配置脚本

echo "========================================"
echo "📋 飞书单 Bot 快速配置"
echo "========================================"

CONFIG_DIR="$HOME/.openclaw"

echo ""
echo "【1】请输入飞书应用凭证"
read -p "App ID: " APP_ID
read -p "App Secret: " APP_SECRET

echo ""
echo "【2】生成配置..."

cat > "$CONFIG_DIR/openclaw.json" << EOF
{
  "channels": {
    "feishu": {
      "enabled": true,
      "defaultAccount": "main",
      "dmPolicy": "pairing",
      "groupPolicy": "open",
      "accounts": {
        "main": {
          "appId": "$APP_ID",
          "appSecret": "$APP_SECRET",
          "botName": "AI 朝廷"
        }
      }
    }
  },
  "bindings": [
    {
      "agentId": "silijian",
      "match": {
        "channel": "feishu",
        "account": "main"
      }
    }
  ]
}
EOF

echo "✅ 配置已生成：$CONFIG_DIR/openclaw.json"

echo ""
echo "【3】重启 Gateway..."
openclaw gateway restart

echo ""
echo "========================================"
echo "✅ 配置完成！"
echo "========================================"
echo ""
echo "下一步:"
echo "1. 在飞书里找到 AI 朝廷 Bot"
echo "2. 发送消息测试"
echo "3. 如需配对，使用：openclaw pairing approve feishu <CODE>"
echo ""
