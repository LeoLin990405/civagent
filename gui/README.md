# 🖥️ 菠萝王朝 GUI — Web 管理后台

> ← [返回项目 README](../README.md) | [📖 GUI 文档](../docs/gui.md)

基于 React + TypeScript + Vite 构建的 AI 朝廷 Web 管理后台。

## 功能

- **仪表盘** — 各部门状态、Token 消耗、系统负载
- **朝堂** — Web 端与各部门 Bot 对话
- **会话管理** — 历史会话、消息详情、Token 统计
- **定时任务** — 可视化管理 Cron（启用/禁用/手动触发）
- **系统健康** — CPU/内存/磁盘监控

## 快速启动

```bash
# 1. 构建前端
cd gui && npm install && npm run build

# 2. 启动后端（设置登录密码）
cd server && npm install
BOLUO_AUTH_TOKEN=你的密码 node index.js
```

访问 `http://你的服务器IP:18795`

> 📖 详细说明见 [GUI 文档](../docs/gui.md)

## 技术栈

- React 18 + TypeScript
- Vite 构建
- Express.js 后端代理
- OpenClaw Gateway API
