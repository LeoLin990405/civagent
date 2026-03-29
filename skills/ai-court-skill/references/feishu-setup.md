# 飞书配置完整教程

## 快速开始（5 分钟）

### 步骤 1：创建飞书应用
1. 访问 https://open.feishu.cn/app
2. 创建企业应用

### 步骤 2：获取凭证
- App ID（格式：cli_xxx）
- App Secret

### 步骤 3：配置权限
批量导入：
```json
{"scopes":{"tenant":["im:message","im:message:send_as_bot"]}}
```

### 步骤 4：启用机器人
应用功能 → 机器人 → 启用

### 步骤 5：事件订阅
使用长连接，添加事件：im.message.receive_v1

### 步骤 6：发布应用

---

## 配置 OpenClaw

```json5
{
  channels: {
    feishu: {
      enabled: true,
      accounts: {
        main: {
          appId: "cli_xxx",
          appSecret: "xxx",
          botName: "AI 朝廷",
        },
      },
    },
  },
}
```

---

## 常用命令

```bash
openclaw gateway status
openclaw logs --follow
openclaw pairing list feishu
openclaw pairing approve feishu CODE
```

---

## 故障排除

| 问题 | 解决方案 |
|------|----------|
| 机器人不回复 | 检查事件订阅、权限 |
| 群聊无响应 | 确认已 @机器人 |
