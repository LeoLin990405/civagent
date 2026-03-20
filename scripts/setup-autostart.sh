#!/bin/bash
# danghuangshang 自启动 + 局域网访问配置脚本

set -e

echo "🔧 Danghuangshang GUI 配置脚本"
echo "=============================="

# 1. 获取配置
read -p "请输入 GUI 端口 (默认 3000): " PORT
PORT=${PORT:-3000}

read -p "是否启用 systemd 自启动？(y/n): " ENABLE_SYSTEMD

# 2. 修改监听地址
echo ""
echo "📝 修改监听地址为 0.0.0.0..."
if [ -f "gui-server.js" ]; then
  sed -i "s/localhost/0.0.0.0/g" gui-server.js
  sed -i "s/127.0.0.1/0.0.0.0/g" gui-server.js
  echo "✅ 已修改 gui-server.js"
else
  echo "⚠️  未找到 gui-server.js，请手动修改 HOST 为 0.0.0.0"
fi

# 3. 配置防火墙
echo ""
echo "🔥 配置防火墙..."
if command -v ufw &> /dev/null; then
  sudo ufw allow $PORT/tcp
  echo "✅ UFW 已开放端口 $PORT"
else
  echo "⚠️  未检测到 UFW，请手动开放端口 $PORT"
fi

# 4. 创建 systemd 服务
if [ "$ENABLE_SYSTEMD" = "y" ] || [ "$ENABLE_SYSTEMD" = "Y" ]; then
  echo ""
  echo "⚙️  创建 systemd 服务..."
  
  sudo tee /etc/systemd/system/danghuangshang-gui.service > /dev/null <<EOF
[Unit]
Description=Danghuangshang GUI
After=network.target

[Service]
Type=simple
User=$(whoami)
WorkingDirectory=$(pwd)
ExecStart=/usr/bin/node gui-server.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT=$PORT
Environment=HOST=0.0.0.0

[Install]
WantedBy=multi-user.target
EOF

  sudo systemctl daemon-reload
  sudo systemctl enable danghuangshang-gui
  sudo systemctl start danghuangshang-gui
  
  echo "✅ systemd 服务已创建并启动"
fi

# 5. 获取本机 IP
echo ""
echo "🌐 本机 IP 地址:"
ip addr show | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | cut -d/ -f1

echo ""
echo "✅ 配置完成！"
echo ""
echo "局域网访问地址："
echo "  http://<本机 IP>:$PORT"
echo ""
echo "服务管理命令："
echo "  sudo systemctl status danghuangshang-gui"
echo "  sudo systemctl stop danghuangshang-gui"
echo "  sudo systemctl restart danghuangshang-gui"
echo ""
